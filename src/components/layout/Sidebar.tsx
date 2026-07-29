"use client";

import { cn } from "@/lib/cn";
import { ARTIST_NAV, STAFF_NAV } from "@/lib/constants";
import type { Role } from "@/lib/types";
import {
  CalendarDays,
  Contact,
  FileText,
  Home,
  ImageIcon,
  LogOut,
  Radio,
  Settings,
  Star,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const ICONS = {
  calendar: CalendarDays,
  users: Users,
  file: FileText,
  contact: Contact,
  star: Star,
  image: ImageIcon,
  settings: Settings,
  home: Home,
  radio: Radio,
} as const;

export function Sidebar({
  role,
  open,
  onClose,
}: {
  role: Role;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const items = role === "artist" ? ARTIST_NAV : STAFF_NAV;

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col border-r border-white/10 bg-night/95 p-4 backdrop-blur transition lg:static lg:w-72 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6 flex items-center justify-between px-2 sm:mb-8">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight">
              Biiip<span className="text-neon">.</span>
            </p>
            <p className="text-xs text-muted">Dashboard Comedy Club</p>
          </div>
          <button
            className="rounded-lg p-2 text-muted hover:bg-white/10 lg:hidden"
            onClick={onClose}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain">
          {items.map((item) => {
            const Icon = ICONS[item.icon];
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-neon/20 text-white shadow-neon"
                    : "text-muted hover:bg-white/5 hover:text-white"
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </aside>
    </>
  );
}
