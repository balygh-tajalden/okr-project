"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SystemLogo } from "./system-logo";
import { NAV_SECTIONS, type NavItem } from "@/lib/nav/navigation";
import { useCurrentUser } from "@/lib/auth/session";
import { can, hasAnyRole } from "@/lib/auth/permissions";
import { StatusBadge } from "@/components/common/status-badge";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AppSidebar
 * ===================================================================
 * الشريط الجانبي للتطبيق — يعمل من اليمين (RTL).
 *
 * الميزات:
 * - قابل للطي (collapsible=icon) مع إظهار tooltips عند الطي.
 * - يقفل التنقّل على الأدوار والصلاحيات (data-driven).
 * - يميّز العنصر النشط تلقائياً حسب المسار الحالي.
 * - يدعم الحالة "قريباً" للأقسام القادمة.
 *
 * يعمل تلقائياً كدرج (drawer) على الجوال عبر shadcn/ui Sidebar.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar side="right" collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="px-3 py-3">
        <SystemLogo collapsed={collapsed} />
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            isItemVisible(item, user)
          );
          if (visibleItems.length === 0) return null;
          return (
            <SidebarGroup key={section.key}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const isActive = isItemActive(item.href, pathname);
                    const Icon = item.icon;
                    const isUpcoming = item.status === "upcoming";

                    const button = (
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={collapsed ? item.label : undefined}
                        size="default"
                        className={cn(
                          isUpcoming && "text-muted-foreground"
                        )}
                      >
                        <Link href={item.href}>
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    );

                    return (
                      <SidebarMenuItem key={item.key}>
                        {button}
                        {isUpcoming && !collapsed && (
                          <SidebarMenuBadge>
                            <StatusBadge variant="outline" size="sm">
                              قريباً
                            </StatusBadge>
                          </SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        {/* مساحة سفلية مرنة */}
        <div className="flex-1" />
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={collapsed ? "العودة إلى الملف الشخصي" : undefined}
              size="sm"
              className="text-muted-foreground"
            >
              <Link href="/app/profile">
                <ChevronLeft className="size-4" />
                <span>العودة إلى ملفي</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

/** هل العنصر مرئي للمستخدم الحالي؟ */
function isItemVisible(item: NavItem, user: ReturnType<typeof useCurrentUser>): boolean {
  if (!user) return false;
  if (user.status !== "active") return false;
  if (item.requiredRoles && !hasAnyRole(user, item.requiredRoles)) {
    return false;
  }
  if (item.requiredPermissions) {
    const hasAny = item.requiredPermissions.some((p) => can(user, p));
    if (!hasAny) return false;
  }
  return true;
}

/** هل العنصر هو العنصر النشط للمسار الحالي؟ */
function isItemActive(href: string, pathname: string): boolean {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(href + "/");
}
