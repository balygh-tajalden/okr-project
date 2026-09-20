"use client";

import { useEffect } from "react";
import { useAuthSession } from "@/lib/auth/session";

/**
 * AuthSessionProvider
 * ===================================================================
 * مكوّن تزويد خفيف يلفّ التطبيق لـ:
 * - ضمان ترطيب مخزن الجلسة من localStorage قبل عرض أي واجهة محمية.
 * - منع وميض "غير مسجّل → مسجّل" عند فتح التطبيق لأول مرة.
 *
 * ملاحظة: لا يوفّر context خاصاً — يستخدم Zustand مباشرة.
 * وجوده هنا ضروري فقط لتنفيذ onRehydrateStorage / setHydrated.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useAuthSession((s) => s.hydrated);
  const setHydrated = useAuthSession((s) => s.setHydrated);

  useEffect(() => {
    // Zustand persist قد لا يُشغّل onRehydrateStorage في كل الحالات،
    // لذا نتأكد يدوياً من رفع العلم بعد أول render على العميل.
    if (!hydrated) {
      // اقرأ القيمة مباشرة من localStorage لتفادي ظروف السباق
      try {
        const raw = localStorage.getItem("okr.session.v1");
        if (raw !== undefined) setHydrated();
      } catch {
        setHydrated();
      }
    }
  }, [hydrated, setHydrated]);

  return <>{children}</>;
}
