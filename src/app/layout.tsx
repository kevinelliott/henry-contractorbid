import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ContractorBid — Professional Estimates in Minutes",
  description: "Stop losing jobs to handwritten quotes. Create professional bids with built-in markup intelligence. $19/mo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
