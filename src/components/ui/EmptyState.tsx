import { cn } from "@/lib/cn";
import type { PropsWithChildren } from "react";

export function EmptyState({
  title,
  description,
  children,
  className,
}: PropsWithChildren<{
  title: string;
  description?: string;
  className?: string;
}>) {
  return (
    <div
      className={cn(
        "panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className
      )}
    >
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-muted">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
