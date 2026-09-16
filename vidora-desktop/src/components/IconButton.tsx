import type { ReactNode } from "react";
import clsx from "clsx";

export function IconButton({
  label,
  onClick,
  disabled,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("tooltip tooltip-top shrink-0", className)} data-tip={label}>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-circle"
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </button>
    </div>
  );
}
