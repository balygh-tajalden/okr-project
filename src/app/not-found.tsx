"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, ArrowRight } from "lucide-react";

/**
 * NotFound — صفحة 404
 * ===================================================================
 * تظهر عند محاولة الوصول إلى مسار غير موجود.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Compass className="size-10" />
      </div>

      <div className="space-y-3 max-w-md">
        <h1 className="text-6xl font-bold text-foreground tracking-tight">
          ٤٠٤
        </h1>
        <h2 className="text-xl font-semibold text-foreground">
          الصفحة غير موجودة
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ربما تم نقل الصفحة أو حذفها، أو أن الرابط الذي اتبعته غير صحيح. يرجى
          التحقق من الرابط أو العودة إلى الصفحة الرئيسية.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/app">
            <ArrowRight className="size-4" />
            العودة إلى الرئيسية
          </Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/login">تسجيل الدخول</Link>
        </Button>
      </div>
    </div>
  );
}
