import { Michroma } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const michroma = Michroma({
  subsets: ["latin"],
  weight: "400", // Michroma is only available in a single weight
  display: "swap",
  variable: "--font-michroma", // This is the CSS variable name
});

export const metadata = {
  title: "Akira AI",
  description: "AI-powered DevOps tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={michroma.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
