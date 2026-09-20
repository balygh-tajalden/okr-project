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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "./user-menu";
import { findNavItemByHref } from "@/lib/nav/navigation";
import { useCurrentUser } from "@/lib/auth/session";
import { usePhase4Store } from "@/lib/data/phase4-store";
import { StatusBadge } from "@/components/common/status-badge";
import {
  ALERT_TYPE_LABELS,
  type AlertType,
} from "@/lib/data/phase4-types";
import {
  Clock,
  TrendingDown,
  AlertTriangle,
  MailOpen,
  ChevronLeft,
} from "lucide-react";
import { formatDateTimeAr } from "@/lib/services/phase4-config";

/**
 * AppHeader
 * ===================================================================
 * ترويسة التطبيق — تعرض:
 * - زر طي/فتح الشريط الجانبي
 * - عنوان الصفحة الحالية
 * - أيقونة بحث
 * - **جرس التنبيهات** — popover منبثق يعرض آخر 5 تنبيهات
 *   مع عداد غير مقروء، روابط لعرض الكل وتعليم الكل كمقروء
 * - قائمة المستخدم
 */
export function AppHeader() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const alerts = usePhase4Store((s) => s.alerts);
  const readStates = usePhase4Store((s) => s.alertReadStates);
  const markAlertRead = usePhase4Store((s) => s.markAlertRead);

  // تنبيهات المستخدم الحالي (الأحدث أولاً)
  const myAlerts = user
    ? alerts
        .filter((a) => a.recipientUserIds.includes(user.id) && a.isActive)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    : [];

  const unreadCount = myAlerts.filter(
    (a) =>
      !readStates.find((s) => s.alertId === a.id && s.userId === user?.id)
        ?.isRead
  ).length;

  const currentItem = findNavItemByHref(pathname);
  const pageTitle = currentItem?.label ?? deriveTitleFromPath(pathname);

  const handleMarkAllRead = () => {
    if (!user) return;
    for (const a of myAlerts) {
      const isRead = readStates.find(
        (s) => s.alertId === a.id && s.userId === user.id
      )?.isRead;
      if (!isRead) {
        markAlertRead(a.id, user.id);
      }
    }
  };

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
        {/* البحث — placeholder */}
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

        {/* جرس التنبيهات — popover منبثق */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="التنبيهات"
              className="relative text-muted-foreground"
            >
              <Bell className="size-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold tabular-nums">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-80 sm:w-96 p-0"
          >
            {/* ترويسة الـ popover */}
            <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  التنبيهات
                </span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-medium text-destructive-foreground tabular-nums">
                    {unreadCount} جديد
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-primary hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
              )}
            </div>

            {/* قائمة التنبيهات */}
            {myAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Bell className="size-5" />
                </div>
                <p className="text-sm text-muted-foreground">
                  لا توجد تنبيهات حالياً
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-80">
                <div className="divide-y divide-border">
                  {myAlerts.slice(0, 5).map((alert) => {
                    const isRead = readStates.find(
                      (s) =>
                        s.alertId === alert.id && s.userId === user?.id
                    )?.isRead;
                    const Icon = iconForType(alert.type);
                    return (
                      <Link
                        key={alert.id}
                        href={`/app/alerts/${alert.id}`}
                        className={`flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/30 ${
                          !isRead ? "bg-primary/5" : ""
                        }`}
                      >
                        <div
                          className={`flex size-8 shrink-0 items-center justify-center rounded-md ${colorForType(
                            alert.type
                          )}`}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-foreground line-clamp-1">
                              {alert.title}
                            </span>
                            {!isRead && (
                              <span className="size-2 shrink-0 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <StatusBadge variant="outline" size="sm">
                              {ALERT_TYPE_LABELS[alert.type]}
                            </StatusBadge>
                            <span>•</span>
                            <span>{formatDateTimeAr(alert.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {/* تذييل الـ popover */}
            <div className="border-t border-border px-3 py-2">
              <Link
                href="/app/alerts"
                className="flex items-center justify-center gap-1 text-xs text-primary hover:underline"
              >
                عرض كل التنبيهات
                <ChevronLeft className="size-3" />
              </Link>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <UserMenu />
      </div>
    </header>
  );
}

function iconForType(type: AlertType) {
  switch (type) {
    case "overdue_update":
      return Clock;
    case "performance_delayed":
      return TrendingDown;
    case "performance_stalled":
      return AlertTriangle;
    case "manual":
      return Bell;
  }
}

function colorForType(type: AlertType): string {
  switch (type) {
    case "overdue_update":
      return "bg-warning/15 text-warning";
    case "performance_delayed":
      return "bg-warning/15 text-warning";
    case "performance_stalled":
      return "bg-destructive/15 text-destructive";
    case "manual":
      return "bg-info/15 text-info";
  }
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
