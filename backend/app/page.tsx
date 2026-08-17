export default function ApiRoot() {
  return (
    <main>
      <h1>Sarika Beauty Hub — API server</h1>
      <p>
        This Next.js app serves the JSON API only — <code>/api/products</code>,{" "}
        <code>/api/orders</code>, <code>/api/customer/*</code>, <code>/api/admin/*</code>,{" "}
        <code>/api/agent/*</code>, <code>/api/payments/*</code>, and so on.
      </p>
      <p>
        The storefront, admin console, and delivery-agent app are a separate Vite + React
        project that calls this API. See the root <code>README.md</code> for how the two
        are wired together in development and production.
      </p>
    </main>
  );
}
