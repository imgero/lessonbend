import type { Metadata } from "next";
import "./globals.css";
import "./redesign.css";

export const metadata: Metadata = { title: "LessonBend", description: "Bend the lesson, not the kid." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
