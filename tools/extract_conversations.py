#!/usr/bin/env python3
"""
Stage 1 — Normalize every conversation found in the ChatGPT export into JSONL.

Sources parsed:
  * conversations-000.json / conversations-001.json  (ChatGPT web export; `mapping` DAG of nodes)
  * group_chats.json                                (group chat export)
  * codex.json                                      (Codex cloud-agent tasks)

Zero-omission rules:
  * Walks the parent/children DAG; the active branch (path root -> current_node) is
    emitted in chronological order. Any message node off the active branch is ALSO
    emitted, clearly labelled as an off-branch (alternate/edited) variant, sorted by
    create_time. No valid turn is skipped.
  * thoughts / reasoning_recap content is preserved, labelled as assistant reasoning.
  * image_asset_pointer parts are preserved as attachment reference lines.
"""
import hashlib
import json
import os
import sys
from datetime import datetime, timezone

SRC = sys.argv[1] if len(sys.argv) > 1 else "chatgpt-export-source"
OUT = sys.argv[2] if len(sys.argv) > 2 else ".work/normalized.jsonl"

def ts_iso(t):
    if t is None:
        return "unknown"
    try:
        return datetime.fromtimestamp(float(t), tz=timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    except Exception:
        return str(t)

def ts_date(t):
    if t is None:
        return "0000-00-00"
    try:
        return datetime.fromtimestamp(float(t), tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return "0000-00-00"

def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

# ---------- part rendering ----------
ATTACH_LOOKUP = {}  # file_id -> original name (filled from asset_file_names + attachments)

def render_image_pointer(p, msg_attachments):
    fid = (p.get("asset_pointer") or "").split("//")[-1]
    name = None
    mime = None
    size = p.get("size_bytes")
    w, h = p.get("width"), p.get("height")
    for att in msg_attachments:
        if att.get("id") == fid:
            name, mime, size = att.get("name"), att.get("mime_type"), att.get("size")
            w, h = att.get("width", w), att.get("height", h)
            break
    if not name:
        name = ATTACH_LOOKUP.get(fid + ".dat") or ATTACH_LOOKUP.get(fid)
    return fid, name, mime, size, w, h

def iter_text(msg):
    """Yield (text_chunk) for a message, preserving all content."""
    content = msg.get("content") or {}
    ctype = content.get("content_type")
    attachments = (msg.get("metadata") or {}).get("attachments") or []
    if ctype == "reasoning_recap":
        yield f"(reasoning recap) {content.get('content', '')}".strip()
        return
    if ctype == "thoughts":
        thoughts = content.get("thoughts") or []
        any_content = False
        for t in thoughts:
            body = (t.get("content") or "").strip()
            summary = (t.get("summary") or "").strip()
            chunks = [c for c in (t.get("chunks") or []) if isinstance(c, str) and c.strip()]
            if body:
                yield body
                any_content = True
            if summary:
                yield f"(thought summary) {summary}"
                any_content = True
            for ch in chunks:
                yield ch
                any_content = True
        if not any_content:
            yield "(reasoning trace present in export but empty/redacted)"
        return
    parts = content.get("parts")
    if not isinstance(parts, list):
        # Unknown content_type: dump raw JSON so nothing is lost
        yield json.dumps(content, ensure_ascii=False, indent=2)
        return
    for p in parts:
        if isinstance(p, str):
            yield p
        elif isinstance(p, dict):
            pctype = p.get("content_type")
            if pctype == "image_asset_pointer":
                fid, name, mime, size, w, h = render_image_pointer(p, attachments)
                det = [f"file_id={fid}"]
                if name: det.append(f"name={name}")
                if mime: det.append(f"mime={mime}")
                if w and h: det.append(f"{w}x{h}px")
                if size: det.append(f"size={size} bytes")
                yield "[IMAGE ATTACHMENT " + ", ".join(det) + "] — file referenced in export manifest (.dat); binary not included in provided export"
            else:
                yield json.dumps(p, ensure_ascii=False)
        else:
            yield str(p)

def attachment_records(msg):
    out = []
    content = msg.get("content") or {}
    attachments = (msg.get("metadata") or {}).get("attachments") or []
    for att in attachments:
        fid = att.get("id")
        out.append({
            "file_id": fid,
            "name": att.get("name") or ATTACH_LOOKUP.get((fid or "") + ".dat"),
            "mime_type": att.get("mime_type"),
            "size": att.get("size"),
            "source": att.get("source"),
        })
    # also catch image pointers without metadata.attachments
    seen = {a["file_id"] for a in out}
    for p in content.get("parts") or []:
        if isinstance(p, dict) and p.get("content_type") == "image_asset_pointer":
            fid = (p.get("asset_pointer") or "").split("//")[-1]
            if fid and fid not in seen:
                out.append({
                    "file_id": fid,
                    "name": ATTACH_LOOKUP.get(fid + ".dat") or ATTACH_LOOKUP.get(fid),
                    "mime_type": None,
                    "size": p.get("size_bytes"),
                    "source": "asset_pointer",
                    "width": p.get("width"),
                    "height": p.get("height"),
                })
                seen.add(fid)
    return out

def normalize_chatgpt_conversation(convo, source_file, uid):
    mapping = convo.get("mapping") or {}
    current = convo.get("current_node")
    # active path: walk from current_node up via parent
    active = []
    node = mapping.get(current) if current else None
    guard = 0
    while node is not None and guard < 10000:
        active.append(node)
        pid = node.get("parent")
        node = mapping.get(pid) if pid else None
        guard += 1
    active.reverse()
    active_ids = {n.get("id") for n in active}

    turns = []
    seq = 0
    referenced_assets = []
    def emit(node, off_path=False, fork_parent_seq=None):
        nonlocal seq
        msg = node.get("message")
        if not msg:
            return
        role = ((msg.get("author") or {}).get("role")) or "unknown"
        content = msg.get("content") or {}
        ctype = content.get("content_type") or "unknown"
        meta = msg.get("metadata") or {}
        body = "\n".join(
            t for t in (chunk.strip("\n") for chunk in iter_text(msg)) if t is not None
        ).strip()
        # normalize line endings, keep everything else verbatim
        body = body.replace("\r\n", "\n").replace("\r", "\n")
        atts = attachment_records(msg)
        referenced_assets.extend(atts)
        seq += 1
        turns.append({
            "seq": seq,
            "role": role,
            "create_time": msg.get("create_time"),
            "timestamp": ts_iso(msg.get("create_time")),
            "content_type": ctype,
            "model_slug": meta.get("model_slug") or meta.get("resolved_model_slug"),
            "text": body,
            "off_branch": bool(off_path),
            "fork_parent_seq": fork_parent_seq,
            "attachments": atts,
            "message_id": msg.get("id"),
            "node_id": node.get("id"),
        })

    node_id_to_seq = {}
    for node in active:
        emit(node, off_path=False)
        if node.get("id"):
            m = node.get("message")
            if m:
                node_id_to_seq[node["id"]] = turns[-1]["seq"]

    # off-branch nodes (alternate/edited variants): sorted by create_time
    off_nodes = [n for nid, n in mapping.items() if nid not in {x.get("id") for x in active} and n.get("message")]
    off_nodes.sort(key=lambda n: ((n.get("message") or {}).get("create_time") or 0))
    # map every node id (incl. off-branch) to its emitted seq for fork resolution
    for node in off_nodes:
        nid = node.get("id") or (node.get("message") or {}).get("id")
        # find nearest on-path ancestor for fork context
        fork_seq = None
        cur = node
        guard = 0
        while cur is not None and guard < 1000:
            pid = cur.get("parent")
            if pid is None:
                break
            if pid in node_id_to_seq:
                fork_seq = node_id_to_seq[pid]
                break
            cur = mapping.get(pid)
            guard += 1
        emit(node, off_path=True, fork_parent_seq=fork_seq)
        nid2 = node.get("id")
        if nid2:
            node_id_to_seq[nid2] = turns[-1]["seq"]

    # mark main-path turns that have off-branch children (fork points)
    off_parent_ids = {mapping[nid].get("parent") for nid in
                      [n.get("id") for n in off_nodes] if mapping.get(nid)}
    for t in turns:
        nid = t.get("node_id")
        if nid and not t["off_branch"]:
            forks = sum(1 for n in off_nodes if n.get("parent") == nid)
            if forks:
                t["fork_after"] = forks

    create_time = convo.get("create_time")
    return {
        "uid": uid,
        "source_file": source_file,
        "source_type": "chatgpt_export_json",
        "conversation_id": convo.get("conversation_id") or convo.get("id"),
        "title": convo.get("title") or "Untitled conversation",
        "create_time": create_time,
        "date": ts_date(create_time),
        "update_time": convo.get("update_time"),
        "is_archived": convo.get("is_archived"),
        "is_starred": convo.get("is_starred"),
        "default_model_slug": convo.get("default_model_slug"),
        "mapping_nodes": len(mapping),
        "off_branch_turns": sum(1 for t in turns if t["off_branch"]),
        "turns": turns,
        "referenced_assets": referenced_assets,
    }

def normalize_group_chat(chat, source_file, uid):
    msgs = sorted(chat.get("messages") or [], key=lambda m: m.get("created_at") or "")
    turns = []
    start = None
    for i, m in enumerate(msgs):
        created = m.get("created_at")
        if start is None:
            start = created
        turns.append({
            "seq": i + 1,
            "role": m.get("role") or "unknown",
            "create_time": None,
            "timestamp": created or "unknown",
            "content_type": "text",
            "model_slug": None,
            "text": (m.get("text") or "").replace("\r\n", "\n"),
            "off_branch": False,
            "attachments": [
                {
                    "file_id": a.get("id"),
                    "name": a.get("name"),
                    "mime_type": a.get("mime_type") or a.get("mimeType"),
                    "size": a.get("size"),
                    "source": "group_attachment",
                } for a in (m.get("attachments") or [])
            ],
            "message_id": m.get("id"),
            "node_id": None,
        })
    try:
        ct = datetime.strptime(start, "%Y-%m-%dT%H:%M:%S.%f+00:00").timestamp() if start else None
    except Exception:
        try:
            ct = datetime.strptime(start, "%Y-%m-%dT%H:%M:%S.%fZ").timestamp() if start else None
        except Exception:
            ct = None
    return {
        "uid": uid,
        "source_file": source_file,
        "source_type": "group_chat_json",
        "conversation_id": chat.get("id"),
        "title": f"Group chat — {(msgs[0].get('text') or '').strip()[:60] if msgs else 'untitled'}",
        "create_time": ct,
        "date": ts_date(ct),
        "update_time": chat.get("last_action_at"),
        "is_archived": None,
        "is_starred": None,
        "default_model_slug": None,
        "mapping_nodes": len(msgs),
        "off_branch_turns": 0,
        "turns": turns,
        "referenced_assets": [a for t in turns for a in t["attachments"]],
        "group_chat": {
            "assistant_name": chat.get("assistant_name"),
            "members": [m.get("id") for m in chat.get("members") or []],
            "created_at": chat.get("created_at"),
        },
    }

def normalize_codex_task(task, source_file, uid):
    # Recover timestamp from task id: task_e_<hex unix ts>...
    tid = task.get("id") or ""
    ct = None
    parts = tid.split("_")
    if len(parts) >= 3:
        try:
            ct = int(parts[2][:8], 16)
        except Exception:
            ct = None
    turns = []
    seq = 0
    assets = []
    for turn in task.get("turns") or []:
        role = turn.get("role")
        if role == "user" or turn.get("input_items"):
            for item in turn.get("input_items") or []:
                chunks = []
                for c in item.get("content") or []:
                    if c.get("content_type") == "text":
                        chunks.append(c.get("text") or "")
                    else:
                        chunks.append(json.dumps(c, ensure_ascii=False))
                seq += 1
                turns.append({
                    "seq": seq, "role": "user", "create_time": ct,
                    "timestamp": ts_iso(ct),
                    "content_type": "text",
                    "model_slug": None,
                    "text": "\n".join(chunks),
                    "off_branch": False,
                    "attachments": [],
                    "message_id": item.get("id") or turn.get("id"),
                    "node_id": None,
                })
        if turn.get("output_items") is not None:
            for item in turn.get("output_items") or []:
                chunks = []
                item_assets = []
                for c in item.get("content") or []:
                    ct_ = c.get("content_type")
                    if ct_ == "text":
                        chunks.append(c.get("text") or "")
                    elif ct_ == "repo_file_citation":
                        chunks.append(f"[repo file citation: {c.get('path')} lines {c.get('line_range_start')}-{c.get('line_range_end')}]")
                    elif ct_ == "image_asset_pointer_citation":
                        fid = (c.get("asset_pointer") or "").split("//")[-1]
                        chunks.append(f"[IMAGE ATTACHMENT file_id={fid}, {c.get('width')}x{c.get('height')}px, size={c.get('size_bytes')} bytes] — file referenced in export manifest (.dat); binary not included in provided export")
                        item_assets.append({"file_id": fid, "name": ATTACH_LOOKUP.get(fid + ".dat"), "mime_type": None, "size": c.get("size_bytes"), "source": "codex_output", "width": c.get("width"), "height": c.get("height")})
                    else:
                        chunks.append(json.dumps(c, ensure_ascii=False))
                for f in item.get("files") or []:
                    lines = (f.get("line_range_contents") or [{}])[0].get("content") or []
                    chunks.append(f"[FILE: {f.get('path') if f.get('path') else '(unknown path)'}]\n" + "\n".join(lines))
                seq += 1
                turns.append({
                    "seq": seq, "role": item.get("role") or "assistant", "create_time": ct,
                    "timestamp": ts_iso(ct),
                    "content_type": item.get("type") or "message",
                    "model_slug": None,
                    "text": "\n".join(chunks),
                    "off_branch": False,
                    "attachments": item_assets,
                    "message_id": None,
                    "node_id": None,
                    "branch": turn.get("branch"),
                    "turn_status": turn.get("turn_status"),
                })
                assets.extend(item_assets)
    return {
        "uid": uid,
        "source_file": source_file,
        "source_type": "codex_task_json",
        "conversation_id": task.get("id"),
        "title": task.get("title") or "Codex task",
        "create_time": ct,
        "date": ts_date(ct),
        "update_time": None,
        "is_archived": task.get("archived"),
        "is_starred": None,
        "default_model_slug": None,
        "mapping_nodes": len(task.get("turns") or []),
        "off_branch_turns": 0,
        "turns": turns,
        "referenced_assets": assets,
    }

def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    # populate ATTACH_LOOKUP from asset_file_names.json (dat -> original name)
    afn_path = os.path.join(SRC, "conversation_asset_file_names.json")
    if os.path.exists(afn_path):
        ATTACH_LOOKUP.update(load(afn_path))

    records = []
    source_hashes = {}
    # 1) ChatGPT export conversations (sorted chronologically)
    convs = []
    for fname in sorted(os.listdir(SRC)):
        if fname.startswith("conversations-") and fname.endswith(".json"):
            path = os.path.join(SRC, fname)
            data = load(path)
            source_hashes[fname] = sha256_file(path)
            for convo in data:
                convs.append((fname, convo))
    convs.sort(key=lambda pair: (pair[1].get("create_time") or 0))
    for idx, (fname, convo) in enumerate(convs):
        records.append(normalize_chatgpt_conversation(convo, fname, f"chatgpt-{idx:03d}"))

    # 2) Group chats
    gc_path = os.path.join(SRC, "group_chats.json")
    if os.path.exists(gc_path):
        source_hashes["group_chats.json"] = sha256_file(gc_path)
        for i, chat in enumerate(load(gc_path).get("chats", [])):
            records.append(normalize_group_chat(chat, "group_chats.json", f"group-{i+1}"))

    # 3) Codex tasks
    cx_path = os.path.join(SRC, "codex.json")
    if os.path.exists(cx_path):
        source_hashes["codex.json"] = sha256_file(cx_path)
        for i, task in enumerate(load(cx_path)):
            records.append(normalize_codex_task(task, "codex.json", f"codex-{i+1}"))

    with open(OUT, "w", encoding="utf-8") as f:
        for r in records:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    with open(OUT + ".hashes.json", "w", encoding="utf-8") as f:
        json.dump(source_hashes, f, indent=2)

    n_turns = sum(len(r["turns"]) for r in records)
    n_off = sum(r["off_branch_turns"] for r in records)
    n_assets = sum(len(r["referenced_assets"]) for r in records)
    print(f"conversations normalized : {len(records)}")
    print(f"total turns              : {n_turns} (off-branch: {n_off})")
    print(f"asset refs               : {n_assets}")
    by_src = {}
    for r in records:
        by_src[r["source_file"]] = by_src.get(r["source_file"], 0) + 1
    for k, v in sorted(by_src.items()):
        print(f"  from {k}: {v}")

if __name__ == "__main__":
    main()
