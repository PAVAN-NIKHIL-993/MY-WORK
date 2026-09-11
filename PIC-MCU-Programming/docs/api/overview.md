# API Overview

> There is **no HTTP/REST API** in this topic — and this file does not invent
> one. The three real machine interfaces are documented as the API surface:

| # | Interface | Kind | Spec |
|---|---|---|---|
| 1 | UART text protocol (PIC ↔ PC) | Serial 9600 8-N-1, line-oriented ASCII | [uart-protocol](uart-protocol.md) |
| 2 | CLI contracts (human/scripts ↔ tools) | argv/stdout/stderr/exit codes | [cli-contracts](cli-contracts.md) |
| 3 | CSV interchange (logger ↔ analyzer) | File format, two accepted layouts | [schema](../database/schema.md) |

Common properties: human-readable, no auth (bench-physical-trust), no
versioning headers (formats are versioned by this documentation + tests —
a breaking change must bump code + fixture + tests + docs atomically, see
[DEVELOPMENT](../DEVELOPMENT.md)).

What HTTP-API template fields mean here: "endpoint" = a message shape or CLI
invocation; "status codes" = tool exit codes 0/1/2/3; "rate limits" = UART
baud + sample cadence; "retry/timeout" = documented per interface (mostly:
none — fire-and-forget with visible degradation).
