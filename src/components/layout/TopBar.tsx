"use client";

import { Menu } from "lucide-react";
import type { Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Gérant",
  staff: "Équipe",
  artist: "Artiste",
};

export function TopBar({
  title,
  name,
  role,
  onMenu,
}: {
  title: string;
  name: string;
  role: Role;
  onMenu: () => void;
}) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-white/10 bg-night/85 px-3 py-3 backdrop-blur sm:gap-4 sm:px-4 sm:py-4 md:px-6"
      style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          className="shrink-0 rounded-xl bg-white/5 p-2.5 text-muted hover:bg-white/10 lg:hidden"
          onClick={onMenu}
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>
        <h1 className="truncate font-display text-lg font-semibold sm:text-xl md:text-2xl">
          {title}
        </h1>
      </div>
      <div className="max-w-[40%] shrink-0 text-right sm:max-w-none">
        <p className="truncate text-xs font-medium sm:text-sm">{name}</p>
        <p className="text-[10px] text-muted sm:text-xs">{ROLE_LABEL[role]}</p>
      </div>
    </header>
  );
}
