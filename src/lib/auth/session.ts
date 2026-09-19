"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session, User } from "./types";
import { SESSION_STORAGE_KEY } from "./types";

/**
 * مخزن الجلسة (Session Store) — Zustand + localStorage persist
 * ===================================================================
 * مصدر الحقيقة الموحّد لحالة المصادقة في النظام.
 *
 * المسؤوليات:
 * - حفظ المستخدم الحالي (current user)
 * - حفظ / استرجاع / إنهاء الجلسة
 * - تعريض حالة isAuthenticated للواجهات
 *
 * ملاحظة معمارية:
 * - لا تُكتب أي معلومات حساسة (كلمات مرور) في المخزن — فقط كائن المستخدم.
 * - التخزين في localStorage تحت مفتاح موحّد (SESSION_STORAGE_KEY).
 * - سيتم استبدال هذا لاحقاً بـ JWT / cookies عند الربط بخادم حقيقي
 *   دون إعادة تصميم واجهات الاستخدام (useAuthSession).
 */

interface SessionState {
  session: Session | null;
  hydrated: boolean;

  /** ابدأ جلسة لمستخدم معيّن */
  startSession: (user: User) => void;

  /** أنهِ الجلسة الحالية (تسجيل خروج) */
  clearSession: () => void;

  /** حدّث بيانات المستخدم في الجلسة الحالية (مثلاً بعد تعديل الملف الشخصي) */
  updateCurrentUser: (patch: Partial<User>) => void;

  /** عيّن أن الترطيب من localStorage قد اكتمل */
  setHydrated: () => void;
}

export const useAuthSession = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      hydrated: false,

      startSession: (user) => {
        const session: Session = {
          user,
          startedAt: Date.now(),
        };
        set({ session });
      },

      clearSession: () => {
        set({ session: null });
      },

      updateCurrentUser: (patch) => {
        const current = get().session;
        if (!current) return;
        set({
          session: {
            ...current,
            user: { ...current.user, ...patch },
          },
        });
      },

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: {
        getItem: (name) => {
          try {
            const raw = localStorage.getItem(name);
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch {
            // تجاهل أخطاء التخزين (مثل الوضع الخاص)
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // ignore
          }
        },
      },
      onRehydrateStorage: () => (state) => {
        // بعد اكتمال الترطيب: تأكد من صحته، ثم ارفع علم hydrated
        if (state) {
          state.setHydrated();
        }
      },
    }
  )
);

/**
 * Hook مختصر للوصول إلى المستخدم الحالي
 * (يبسّط الاستخدام في المكوّنات).
 */
export function useCurrentUser(): User | null {
  return useAuthSession((s) => s.session?.user ?? null);
}

/**
 * Hook للتحقق من حالة المصادقة (مع احترام الترطيب لتفادي وميض الواجهة).
 */
export function useIsAuthenticated(): boolean {
  return useAuthSession((s) => s.session !== null && s.hydrated);
}
