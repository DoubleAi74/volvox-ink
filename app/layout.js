import { Inter } from "next/font/google";
import "./globals.css";
import { AuthContextProvider } from "@/context/AuthContext";
import Header from "@/components/Header"; // 1. Import the Header

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "The Lotus Seed",
  description: "Built with Volvox ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthContextProvider>
          <main className="flex-1">{children}</main>
        </AuthContextProvider>
      </body>
    </html>
  );
}
