"use client";

import { Toaster } from "@/components/ui/overlays";
import { useInitialLanguage } from "@/lib/hooks";

export function Providers({ children }: { children: React.ReactNode }) {
  useInitialLanguage();
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
