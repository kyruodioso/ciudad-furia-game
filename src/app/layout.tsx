import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ciudad Furia Game",
  description: "First Person Sci-Fi Browser Game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased w-screen h-screen overflow-hidden bg-black text-white">
        {children}
      </body>
    </html>
  );
}
