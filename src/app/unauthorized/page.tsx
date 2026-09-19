"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";
import { useCurrentUser } from "@/lib/auth/session";

/**
 * Unauthorized — صفحة 403 (Access Denied)
 * ===================================================================
 * تظهر عند محاولة مستخدم الوصول إلى مسار لا يملك صلاحياته.
 * تختلف عن 404 — هنا المستخدم معروف لكن الصلاحية مفقودة.
 */
export default function UnauthorizedPage() {
  const user = useCurrentUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldX className="size-10" />
      </div>

      <div className="space-y-3 max-w-md">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          غير مصرّح بالوصول
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة. إن كنت تعتقد أن هذا
          خطأ، يرجى التواصل مع مدير النظام لمراجعة صلاحيات حسابك.
        </p>

        {user && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
            <span>المستخدم الحالي:</span>
            <span className="font-medium text-foreground">{user.fullName}</span>
            <span>•</span>
            <span>{user.role}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/app">العودة إلى الرئيسية</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/app/profile">عرض ملفي الشخصي</Link>
        </Button>
      </div>
    </div>
  );
}
