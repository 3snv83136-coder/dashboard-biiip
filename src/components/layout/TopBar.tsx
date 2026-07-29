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
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/10 bg-night/80 px-4 py-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-xl bg-white/5 p-2 text-muted hover:bg-white/10 lg:hidden"
          onClick={onMenu}
          aria-label="Ouvrir le menu"
        >
          <Menu size={18} />
        </button>
        <div>
          <h1 className="font-display text-xl font-semibold md:text-2xl">
            {title}
          </h1>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted">{ROLE_LABEL[role]}</p>
      </div>
    </header>
  );
}
