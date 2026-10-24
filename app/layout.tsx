import type { Metadata } from "next";
import "./globals.css";
import { LangProvider } from "@/components/LangContext";
import { ModeProvider } from "@/components/ModeContext";

export const metadata: Metadata = {
  title: "AppealFlow — Parking ticket appeal assistant (demo)",
  description:
    "AppealFlow is an independent, trilingual demo that helps a resident explain a parking ticket dispute. Not a City of Boston service.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LangProvider>
          <ModeProvider>{children}</ModeProvider>
        </LangProvider>
      </body>
    </html>
  );
}
