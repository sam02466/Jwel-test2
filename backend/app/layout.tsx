import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sarika Beauty Hub — API",
  description: "Backend API for the Sarika Beauty Hub jewellery storefront, admin console, and delivery-agent app.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", color: "#3A3328" }}>
        {children}
      </body>
    </html>
  );
}
