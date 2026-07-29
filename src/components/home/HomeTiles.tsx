"use client";

import { ARTIST_NAV, STAFF_NAV } from "@/lib/constants";
import type { Role } from "@/lib/types";
import {
  CalendarDays,
  Contact,
  FileText,
  Home,
  ImageIcon,
  Radio,
  Settings,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

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

export function HomeTiles() {
  const { data } = useSession();
  const role = (data?.user?.role ?? "staff") as Role;
  const items =
    role === "artist"
      ? ARTIST_NAV
      : STAFF_NAV.filter((item) => item.href !== "/accueil");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold md:text-2xl">
          Bienvenue{data?.user?.name ? `, ${data.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">Choisis un univers.</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex aspect-square max-h-[104px] flex-col justify-between overflow-hidden rounded-xl p-2.5 transition duration-200 hover:scale-[1.04] active:scale-[0.98] sm:max-h-[112px] sm:p-3"
              style={{ backgroundColor: item.color }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/25" />
              <div className="relative flex h-full flex-col justify-between text-night">
                <Icon
                  size={18}
                  className="opacity-90 transition group-hover:scale-110"
                />
                <p className="font-display text-[11px] font-bold leading-tight sm:text-xs">
                  {item.label}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
