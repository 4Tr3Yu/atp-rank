"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export function NavActions({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Hide on dashboard since those actions are already shown there
  if (pathname === "/dashboard") {
    return null;
  }

  return <>{children}</>;
}
