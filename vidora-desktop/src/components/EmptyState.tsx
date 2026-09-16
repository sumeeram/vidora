import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import clsx from "clsx";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  tone = "neutral",
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
  tone?: "neutral" | "error" | "warning";
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "glass rounded-box px-6 py-12 text-center",
        tone === "error" && "border-error/30",
        tone === "warning" && "border-warning/30",
        className,
      )}
    >
      {Icon ? (
        <Icon
          className={clsx(
            "mx-auto mb-3",
            tone === "error" ? "text-error" : tone === "warning" ? "text-warning" : "opacity-40",
          )}
          size={28}
        />
      ) : null}
      <p className="font-display text-lg">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm opacity-60">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
