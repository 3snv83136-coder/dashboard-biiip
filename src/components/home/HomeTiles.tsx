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
import Image from "next/image";
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
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold md:text-3xl">
          Bienvenue{data?.user?.name ? `, ${data.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">Choisis un univers.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative aspect-[4/3] min-h-[140px] overflow-hidden rounded-2xl transition duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] sm:min-h-[160px] md:min-h-[180px]"
            >
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
              <div
                className="absolute inset-0 opacity-70 mix-blend-multiply transition group-hover:opacity-60"
                style={{ backgroundColor: item.color }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-4 text-white">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/35 backdrop-blur-sm"
                  style={{ boxShadow: `0 0 0 1px ${item.color}` }}
                >
                  <Icon size={18} />
                </span>
                <p className="font-display text-lg font-bold leading-tight drop-shadow md:text-xl">
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
