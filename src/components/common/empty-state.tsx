"use client";

import { cn } from "@/lib/utils";

/**
 * EmptyState
 * ===================================================================
 * مكوّن حالة فارغة قابل لإعادة الاستخدام.
 * يُستخدم في القوائم الفارغة، النتائج المفقودة، الفلاتر بدون بيانات، إلخ.
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const iconWrapSize =
    size === "lg" ? "size-16" : size === "sm" ? "size-10" : "size-12";
  const titleSize =
    size === "lg" ? "text-lg" : size === "sm" ? "text-sm" : "text-base";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
            iconWrapSize
          )}
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className={cn("font-semibold text-foreground", titleSize)}>{title}</h3>
        {description && (
          <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
