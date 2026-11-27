import "./globals.css";
import type { ReactNode } from "react";

export const metadata = { title: "CODFlow", description: "Cash-on-delivery order management" };

export default function Root({ children }: { children: ReactNode }) {
  return children;
}
