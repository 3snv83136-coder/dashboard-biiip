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
    <div className="page-stack">
      <div>
        <h2 className="font-display text-xl font-bold xs:text-2xl sm:text-2xl md:text-3xl">
          Bienvenue{data?.user?.name ? `, ${data.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">Choisis un univers.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative aspect-[16/10] min-h-[132px] overflow-hidden rounded-2xl transition duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.99] sm:aspect-[4/3] sm:min-h-[150px] md:min-h-[170px]"
            >
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized
              />
              <div
                className="absolute inset-0 opacity-70 mix-blend-multiply transition group-hover:opacity-60"
                style={{ backgroundColor: item.color }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative flex h-full flex-col justify-between p-3 text-white sm:p-4">
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-black/35 backdrop-blur-sm sm:h-9 sm:w-9"
                  style={{ boxShadow: `0 0 0 1px ${item.color}` }}
                >
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </span>
                <p className="font-display text-base font-bold leading-tight drop-shadow sm:text-lg md:text-xl">
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
