/**
 * Bundled sample captures.
 *
 * Purpose: let a new user see the product working in one click, and provide
 * deterministic fixtures for the rule engine's integration tests. The "failing"
 * sample deliberately contains one instance of every rule category; the
 * "passing" sample is a correctly built page. Keeping them here (not in tests
 * only) means the tests exercise exactly what the UI shows.
 */

export interface SamplePage {
  id: string;
  name: string;
  description: string;
  /** What the sample demonstrates, shown as a hint in the capture dialog. */
  focus: string;
  markup: string;
}

const FAILING_SAMPLE = `<!doctype html>
<html>
  <head>
    <title>Home</title>
  </head>
  <body>
    <div onclick="openMenu()" style="padding:8px">Menu</div>
    <h2>Welcome to our store</h2>
    <h4>Featured products</h4>
    <img src="hero.jpg" width="600" height="240">
    <p style="color:#9aa0a6; background-color:#ffffff">Seasonal offers are available now.</p>
    <ul>
      <div class="item">Coffee table</div>
      <div class="item">Reading lamp</div>
    </ul>
    <form>
      <input type="text" placeholder="Full name">
      <select>
        <option>Standard delivery</option>
      </select>
      <button type="submit"><svg width="16" height="16"><path d="M2 8h12"/></svg></button>
    </form>
    <fieldset>
      <input type="radio" name="size"> Small
    </fieldset>
    <table>
      <tr><td>Item</td><td>Price</td></tr>
      <tr><td>Coffee table</td><td>₹12,000</td></tr>
    </table>
    <svg width="24" height="24"><circle cx="12" cy="12" r="10"/></svg>
    <div role="checkbox">I accept the terms</div>
    <button aria-labeledby="nope">Save</button>
    <a href="/catalogue">Click here</a>
    <div tabindex="3">Promoted area</div>
  </body>
</html>`;

const PASSING_SAMPLE = `<!doctype html>
<html lang="en">
  <head>
    <title>Checkout — Acme Store</title>
  </head>
  <body>
    <a href="#main">Skip to content</a>
    <header>
      <p>Acme Store</p>
    </header>
    <main id="main">
      <h1>Checkout</h1>
      <p style="color:#20242b; background-color:#ffffff">Review your order before paying.</p>

      <h2>Delivery details</h2>
      <form>
        <fieldset>
          <legend>Contact information</legend>
          <p>
            <label for="email">Email address</label>
            <input id="email" type="email" name="email" autocomplete="email" placeholder="you@example.com">
          </p>
        </fieldset>

        <p>
          <label for="notes">Delivery notes</label>
          <textarea id="notes" name="notes"></textarea>
        </p>

        <button type="submit">Pay now</button>
      </form>

      <h2>Order summary</h2>
      <ul>
        <li>Reading lamp — 1 × ₹2,400</li>
        <li>Coffee table — 1 × ₹12,000</li>
      </ul>

      <table>
        <caption>Order totals</caption>
        <thead>
          <tr><th scope="col">Line</th><th scope="col">Amount</th></tr>
        </thead>
        <tbody>
          <tr><th scope="row">Subtotal</th><td>₹14,400</td></tr>
          <tr><th scope="row">Shipping</th><td>₹120</td></tr>
        </tbody>
      </table>

      <h2>Need help?</h2>
      <a href="/support">Contact support about this order</a>
    </main>
    <footer>
      <p>Acme Store · Bengaluru</p>
    </footer>
  </body>
</html>`;

export const SAMPLES: readonly SamplePage[] = [
  {
    id: 'sample-failing',
    name: 'Marketing page (common failures)',
    description:
      'A realistic landing page with the mistakes an audit usually finds first: unlabeled inputs, icon-only buttons, colour-only contrast, broken heading order.',
    focus: 'Exercises every rule category, including ARIA misuse.',
    markup: FAILING_SAMPLE,
  },
  {
    id: 'sample-passing',
    name: 'Checkout page (accessible baseline)',
    description:
      'A well-built commerce page: skip link, single h1, labelled fields, scoped table headers and a descriptive link.',
    focus: 'Produces zero critical or serious findings — use it to verify fixes.',
    markup: PASSING_SAMPLE,
  },
];

export function findSample(id: string): SamplePage | undefined {
  return SAMPLES.find((sample) => sample.id === id);
}
