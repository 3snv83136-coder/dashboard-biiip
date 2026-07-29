"use client";

import { cn } from "@/lib/cn";
import type { Role } from "@/lib/types";
import {
  CalendarDays,
  Home,
  MoreHorizontal,
  Radio,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/accueil", label: "Accueil", icon: Home },
  { href: "/calendrier", label: "Planning", icon: CalendarDays },
  { href: "/radio", label: "Radio", icon: Radio },
  { href: "/artistes", label: "Artistes", icon: Users },
] as const;

export function MobileBottomNav({
  role,
  onMore,
}: {
  role: Role;
  onMore: () => void;
}) {
  const pathname = usePathname();
  if (role === "artist") return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-night/95 px-2 pt-2 backdrop-blur lg:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <ul className="grid grid-cols-5 gap-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium transition",
                  active ? "bg-neon/20 text-white" : "text-muted"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="flex min-h-[48px] w-full flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium text-muted"
          >
            <MoreHorizontal size={18} />
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}
