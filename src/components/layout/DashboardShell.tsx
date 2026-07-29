"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import type { Role } from "@/lib/types";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

const TITLES: Record<string, string> = {
  "/calendrier": "Calendrier / Planning",
  "/artistes": "Artistes",
  "/documents": "Documents",
  "/contacts": "Contacts",
  "/avis": "Avis Google",
  "/medias": "Médias",
  "/reglages": "Réglages",
  "/mon-espace": "Mon espace",
};

export function DashboardShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode;
  name: string;
  role: Role;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = useMemo(() => {
    const key = Object.keys(TITLES).find(
      (k) => pathname === k || pathname.startsWith(`${k}/`)
    );
    return key ? TITLES[key] : "Dashboard Biiip";
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          name={name}
          role={role}
          onMenu={() => setOpen(true)}
        />
        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
