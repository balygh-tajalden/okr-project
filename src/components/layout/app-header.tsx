"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "./user-menu";
import { findNavItemByHref } from "@/lib/nav/navigation";
import { useCurrentUser } from "@/lib/auth/session";
import { usePhase4Store } from "@/lib/data/phase4-store";

/**
 * AppHeader
 * ===================================================================
 * ترويسة التطبيق — تعرض:
 * - زر طي/فتح الشريط الجانبي
 * - عنوان الصفحة الحالية (مشتق من المسار تلقائياً)
 * - إجراءات سريعة: بحث، تنبيهات (placeholder للطور الأول)
 * - قائمة المستخدم
 *
 * ملاحظة: أيقونة بحث/تنبيهات placeholders للطور الأول؛
 * تُفعّل في الأطوار اللاحقة.
 */
export function AppHeader() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const alerts = usePhase4Store((s) => s.alerts);
  const readStates = usePhase4Store((s) => s.alertReadStates);

  // حساب التنبيهات غير المقروءة للمستخدم الحالي
  const unreadCount = user
    ? alerts.filter(
        (a) =>
          a.recipientUserIds.includes(user.id) &&
          a.isActive &&
          !readStates.find(
            (s) => s.alertId === a.id && s.userId === user.id
          )?.isRead
      ).length
    : 0;

  const currentItem = findNavItemByHref(pathname);
  const pageTitle = currentItem?.label ?? deriveTitleFromPath(pathname);

  return (
    <header
      className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-4"
      role="banner"
    >
      <SidebarTrigger className="shrink-0" />

      <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />

      <div className="flex min-w-0 flex-1 items-center">
        <h2 className="truncate text-sm font-semibold text-foreground sm:text-base">
          {pageTitle}
        </h2>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="بحث"
              className="text-muted-foreground"
            >
              <Search className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">البحث (قريباً)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="التنبيهات"
              className="relative text-muted-foreground"
              asChild
            >
              <Link href="/app/alerts">
                <Bell className="size-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold tabular-nums">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {unreadCount > 0 ? `${unreadCount} تنبيه غير مقروء` : "التنبيهات"}
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <UserMenu />
      </div>
    </header>
  );
}

function deriveTitleFromPath(pathname: string): string {
  if (pathname === "/app") return "الرئيسية";
  if (pathname === "/app/profile") return "ملفي الشخصي";
  if (pathname === "/app/admin") return "إدارة النظام";
  if (pathname.startsWith("/app/")) {
    const seg = pathname.split("/")[2] ?? "";
    return seg ? decodeURIComponent(seg) : "الرئيسية";
  }
  return "";
}
