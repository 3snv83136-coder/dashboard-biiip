import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary:
    "bg-neon text-white hover:bg-[#ff5570] shadow-neon disabled:opacity-50",
  secondary:
    "bg-cyan/15 text-cyan border border-cyan/30 hover:bg-cyan/25 disabled:opacity-50",
  ghost: "bg-white/5 text-white hover:bg-white/10 disabled:opacity-50",
  danger: "bg-red-500/20 text-red-300 hover:bg-red-500/30 disabled:opacity-50",
};

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }
>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98]",
        styles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
