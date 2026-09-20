"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * SystemLogo
 * ===================================================================
 * شعار النظام — يعرض أيقونة الهدف (OKR) + الاسم.
 * يدعم الوضع المطوي (icon-only) للشريط الجانبي المختصر.
 */
interface SystemLogoProps {
  collapsed?: boolean;
  className?: string;
}

export function SystemLogo({ collapsed = false, className }: SystemLogoProps) {
  return (
    <Link
      href="/app"
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-sidebar",
        collapsed && "justify-center px-0",
        className
      )}
      aria-label="الصفحة الرئيسية"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 64"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
        >
          <circle cx="32" cy="32" r="18" />
          <circle cx="32" cy="32" r="9" />
          <circle cx="32" cy="32" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {!collapsed && (
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-sidebar-foreground">
            نظام الأهداف المؤسسية
          </span>
          <span className="text-[11px] text-muted-foreground">
            منهجية OKR
          </span>
        </span>
      )}
    </Link>
  );
}
