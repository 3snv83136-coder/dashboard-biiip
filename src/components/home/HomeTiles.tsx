"use client";

import { ARTIST_NAV, STAFF_NAV } from "@/lib/constants";
import type { Role } from "@/lib/types";
import {
  CalendarDays,
  Contact,
  FileText,
  Home,
  ImageIcon,
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
} as const;

export function HomeTiles() {
  const { data } = useSession();
  const role = (data?.user?.role ?? "staff") as Role;
  const items =
    role === "artist"
      ? ARTIST_NAV
      : STAFF_NAV.filter((item) => item.href !== "/accueil");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold md:text-3xl">
          Bienvenue{data?.user?.name ? `, ${data.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Choisis un univers pour démarrer.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative aspect-square overflow-hidden rounded-2xl p-4 transition duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
              style={{ backgroundColor: item.color }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-black/30" />
              <div className="relative flex h-full flex-col justify-between text-night">
                <Icon
                  size={28}
                  className="opacity-90 transition group-hover:scale-110"
                />
                <p className="font-display text-lg font-bold leading-tight md:text-xl">
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
