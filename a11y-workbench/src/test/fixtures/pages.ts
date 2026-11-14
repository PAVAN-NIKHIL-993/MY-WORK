/**
 * Engine fixtures.
 *
 * One minimal document per rule: `VIOLATIONS` triggers that rule and must not
 * trigger unrelated *critical* rules; `CLEAN` passes it. Tests assert on the
 * specific rule id so a page can legitimately produce several findings.
 */

export const CLEAN_PAGE = `<!doctype html>
<html lang="en">
  <head><title>Checkout — Acme Store</title></head>
  <body>
    <a href="#main">Skip to content</a>
    <header><p>Acme</p></header>
    <main id="main">
      <h1>Checkout</h1>
      <h2>Contact</h2>
      <form>
        <fieldset>
          <legend>Contact details</legend>
          <label for="email">Email</label>
          <input id="email" type="email" name="email">
        </fieldset>
        <button type="submit">Pay now</button>
      </form>
      <h2>Summary</h2>
      <ul><li>Lamp</li><li>Table</li></ul>
      <table>
        <caption>Totals</caption>
        <thead><tr><th scope="col">Line</th><th scope="col">Amount</th></tr></thead>
        <tbody><tr><th scope="row">Subtotal</th><td>100</td></tr></tbody>
      </table>
      <p><a href="/support">Contact support</a></p>
    </main>
    <footer><p>Acme</p></footer>
  </body>
</html>`;

export const IMAGE_WITHOUT_ALT = `<!doctype html>
<html lang="en"><head><title>Gallery</title></head>
<body><main><h1>Gallery</h1><img src="a.jpg"><img src="b.jpg" alt=""><img src="c.jpg" alt="Kitten"></main></body></html>`;

export const BUTTON_WITHOUT_NAME = `<!doctype html>
<html lang="en"><head><title>Actions</title></head>
<body><main><h1>Actions</h1><button><svg width="16" height="16"><path d="M0 0h16v16H0z"/></svg></button>
<button>Delete item</button><button aria-label="Open menu"><svg width="16" height="16"><circle cx="8" cy="8" r="8"/></svg></button></main></body></html>`;

export const LINK_ISSUES = `<!doctype html>
<html lang="en"><head><title>Catalogue</title></head>
<body><main><h1>Catalogue</h1>
<a href="/a">Click here</a>
<a href="/b"></a>
<a href="/c" aria-label="View the 2024 price list">Read more</a>
<a href="/d">View the 2024 price list</a>
</main></body></html>`;

export const LABEL_ISSUES = `<!doctype html>
<html lang="en"><head><title>Form</title></head>
<body><main><h1>Register</h1>
<form>
  <input type="text" placeholder="Full name">
  <select><option>One</option></select>
  <textarea></textarea>
  <label for="ok">Email</label><input id="ok" type="email">
  <label>Phone <input type="tel"></label>
  <input type="submit" value="Send">
</form>
</main></body></html>`;

export const HEADING_ISSUES = `<!doctype html>
<html lang="en"><head><title>Docs</title></head>
<body><main><h2>Start</h2><h4>Deep</h4><h1>One</h1><h3>Three</h3></main></body></html>`;

export const NO_H1 = `<!doctype html>
<html lang="en"><head><title>Docs</title></head>
<body><main><h2>Start</h2><h2>Continue</h2></main></body></html>`;

export const NO_LANG = `<!doctype html>
<html><head><title>Untitled page</title></head><body><main><h1>Hi</h1></main></body></html>`;

export const BAD_LANG = `<!doctype html>
<html lang="english!"><head><title>Docs</title></head><body><main><h1>Hi</h1></main></body></html>`;

export const NO_TITLE = `<!doctype html>
<html lang="en"><head></head><body><main><h1>Hi</h1></main></body></html>`;

export const LIST_ISSUES = `<!doctype html>
<html lang="en"><head><title>List</title></head>
<body><main><h1>List</h1><ul><div>Item one</div><div>Item two</div></ul><ul></ul>
<dl><p>Term</p></dl></main></body></html>`;

export const CONTRAST_ISSUE = `<!doctype html>
<html lang="en"><head><title>Contrast</title></head>
<body><main><h1>Contrast</h1>
<p style="color:#9aa0a6; background-color:#ffffff">Low contrast paragraph.</p>
<p style="color:#16191f; background-color:#ffffff">High contrast paragraph.</p>
<p style="color:#8a8a8a">No background declared, cannot evaluate.</p>
</main></body></html>`;

export const NO_BYPASS = `<!doctype html>
<html lang="en"><head><title>Bypass</title></head>
<body><div><h1>No landmarks</h1><p>Content</p></div></body></html>`;

export const DUPLICATE_LANDMARKS = `<!doctype html>
<html lang="en"><head><title>Landmarks</title></head>
<body><main><h1>One</h1></main><main><h1>Two</h1></main></body></html>`;

export const CLICK_ONLY = `<!doctype html>
<html lang="en"><head><title>Click</title></head>
<body><main><h1>Click</h1>
<div onclick="open()">Open menu</div>
<button onclick="save()">Save</button>
<div role="button" tabindex="0" onclick="go()" onkeydown="go()">Go</div>
</main></body></html>`;

export const TABINDEX_ISSUE = `<!doctype html>
<html lang="en"><head><title>Tab</title></head>
<body><main><h1>Tab</h1><div tabindex="3">Promoted</div><div tabindex="-1">Programmatic</div></main></body></html>`;

export const SVG_ISSUE = `<!doctype html>
<html lang="en"><head><title>Icons</title></head>
<body><main><h1>Icons</h1>
<svg width="16" height="16"><circle cx="8" cy="8" r="8"/></svg>
<svg width="16" height="16"><title>Trend up</title><path d="M0 16 16 0"/></svg>
<svg width="16" height="16" aria-hidden="true"><rect width="16" height="16"/></svg>
</main></body></html>`;

export const TABLE_ISSUE = `<!doctype html>
<html lang="en"><head><title>Table</title></head>
<body><main><h1>Table</h1>
<table><tr><td>Item</td><td>Price</td></tr><tr><td>Lamp</td><td>100</td></tr></table>
<table role="presentation"><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></table>
</main></body></html>`;

export const FIELDSET_ISSUE = `<!doctype html>
<html lang="en"><head><title>Fieldset</title></head>
<body><main><h1>Fieldset</h1>
<form><fieldset><input type="radio" name="a" aria-label="Small"><label>Small</label></fieldset>
<fieldset><legend>Size</legend><input type="radio" name="b" aria-label="Large"></fieldset></form>
</main></body></html>`;

export const ARIA_ISSUES = `<!doctype html>
<html lang="en"><head><title>ARIA</title></head>
<body><main><h1>ARIA</h1>
<div role="bogus">Not a role</div>
<div role="checkbox">Missing aria-checked</div>
<button aria-labeledby="nope">Typo attribute</button>
<div role="checkbox" aria-checked="false">Correct</div>
</main></body></html>`;

export const HIDDEN_CONTENT = `<!doctype html>
<html lang="en"><head><title>Hidden</title></head>
<body><main><h1>Hidden</h1>
<div aria-hidden="true"><img src="decorative.jpg"></div>
<div hidden><input type="text"></div>
<button aria-hidden="true"></button>
</main></body></html>`;

export const MALFORMED_MARKUP = `<div><p>Unclosed paragraph<div><img src="x.jpg">`;
