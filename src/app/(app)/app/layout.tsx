import { AppShell } from "@/components/layout/app-shell";

/**
 * App Layout
 * ===================================================================
 * يلفّ جميع المسارات المحمية تحت /app بـ AppShell الذي يوفّر:
 * - التحقق من الجلسة (ProtectedRoute)
 * - الشريط الجانبي + الترويسة + منطقة المحتوى
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
