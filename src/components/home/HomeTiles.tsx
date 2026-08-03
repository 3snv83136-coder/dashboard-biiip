"use client";

import { ARTIST_NAV, STAFF_NAV } from "@/lib/constants";
import type { Role } from "@/lib/types";
import {
  CalendarDays,
  Contact,
  FileText,
  Home,
  ImageIcon,
  KeyRound,
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
  key: KeyRound,
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
      <div className="px-0.5">
        <h2 className="font-display text-[clamp(1.25rem,4.5vw,1.875rem)] font-bold leading-tight">
          Bienvenue{data?.user?.name ? `, ${data.user.name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-1.5 text-sm text-muted">Choisis un univers.</p>
      </div>

      <div
        className="grid w-full grid-cols-1 gap-4 xs:grid-cols-2 xs:gap-4 sm:gap-5 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6"
        style={{
          gridAutoRows: "minmax(clamp(140px, 28vw, 200px), auto)",
        }}
      >
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative isolate flex h-full min-h-[140px] flex-col overflow-hidden rounded-2xl outline-none transition duration-300 hover:scale-[1.015] hover:shadow-lg focus-visible:ring-2 focus-visible:ring-cyan active:scale-[0.985] xs:min-h-[150px] sm:min-h-[160px] md:min-h-[175px] lg:min-h-[190px]"
            >
              <Image
                src={item.image}
                alt={item.label}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="(max-width: 399px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                unoptimized
                priority={item.href === "/calendrier" || item.href === "/radio"}
              />
              <div
                className="absolute inset-0 opacity-65 mix-blend-multiply transition group-hover:opacity-55"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10"
                aria-hidden
              />
              <div className="relative z-10 flex h-full flex-1 flex-col justify-between p-3.5 sm:p-4 md:p-5">
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm sm:h-10 sm:w-10"
                  style={{ boxShadow: `0 0 0 1px ${item.color}` }}
                >
                  <Icon className="h-[18px] w-[18px] text-white sm:h-5 sm:w-5" />
                </span>
                <p className="max-w-[95%] break-words font-display text-[clamp(0.95rem,2.8vw,1.25rem)] font-bold leading-snug text-white drop-shadow-md">
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
