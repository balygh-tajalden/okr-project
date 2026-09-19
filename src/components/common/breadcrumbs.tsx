"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "lucide-react";

/**
 * Breadcrumbs — فتات الخبز (RTL-aware)
 * آخِر عنصر هو الصفحة الحالية (غير قابل للنقر).
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="مسار التنقل"
      className={cn("flex items-center flex-wrap gap-1 text-xs text-muted-foreground", className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "text-foreground font-medium")}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronLeft className="size-3.5 text-muted-foreground/60" />
            )}
          </span>
        );
      })}
    </nav>
  );
}
