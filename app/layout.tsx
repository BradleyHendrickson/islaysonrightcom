import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Is Layson Right?",
  description: "Spin the wheel and find out.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#fef7ed]">
        {children}
      </body>
    </html>
  );
}
