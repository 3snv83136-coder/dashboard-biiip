import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from "@/lib/constants";
import type { BookingStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

export function StatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-night",
        className
      )}
      style={{ backgroundColor: BOOKING_STATUS_COLORS[status] }}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
