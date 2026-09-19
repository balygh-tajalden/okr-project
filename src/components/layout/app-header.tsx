"use client";

import { usePathname } from "next/navigation";
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
            >
              <Bell className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">التنبيهات (قريباً)</TooltipContent>
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
