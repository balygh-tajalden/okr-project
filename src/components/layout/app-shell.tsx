"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { ProtectedRoute } from "@/components/auth/protected-route";

/**
 * AppShell
 * ===================================================================
 * القشرة الرئيسية للتطبيق:
 * - تلفّ الصفحات المحمية بـ ProtectedRoute
 * - توفّر SidebarProvider مع الشريط الجانبي + Header + منطقة المحتوى
 * - متجاوبة تلقائياً (drawer على الجوال عبر shadcn Sidebar)
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <SidebarProvider
        defaultOpen
        style={{
          // تخصيص عرض الشريط الجانبي ليتناسب مع الواجهة المؤسسية
          ["--sidebar-width" as string]: "17rem",
          ["--sidebar-width-icon" as string]: "3.25rem",
        }}
      >
        <AppSidebar />
        <SidebarInset className="flex min-h-svh flex-col">
          <AppHeader />
          <div className="flex-1">
            <main
              id="main-content"
              className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
            >
              {children}
            </main>
          </div>
          <footer className="border-t border-border bg-background/60 px-4 py-3 text-center sm:px-6">
            <p className="text-[11px] text-muted-foreground">
              نظام إدارة الأهداف المؤسسية OKR
            </p>
          </footer>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
