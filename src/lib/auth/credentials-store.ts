"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEMO_USERS, DEMO_PASSWORD } from "@/lib/demo/users";

/**
 * مخزن بيانات الاعتماد (Credentials Store)
 * ===================================================================
 * يربط معرّف المستخدم بكلمة مروره داخل النموذج الأولي.
 *
 * - يُهيّأ بكلمة المرور الافتراضية (DEMO_PASSWORD) لكل حسابات البذرة،
 *   وأي مستخدم جديد يُنشأ لاحقاً يدخل بنفس الافتراضية حتى يُعيّن كلمة مروره.
 * - يستمر عبر localStorage (مثل بقية مخازن النموذج الأولي).
 * - عند الربط بخادم حقيقي تُستبدل هذه الطبقة بمصادقة خادمية
 *   (hash + salt + tokens) دون تغيير واجهات الاستخدام.
 */

interface CredentialsState {
  /** userId → كلمة المرور الحالية */
  passwords: Record<string, string>;

  /** يُنشئ/يحدّث كلمة مرور مستخدم */
  setPassword: (userId: string, password: string) => void;

  /** كلمة مرور مستخدم (الافتراضية إن لم تُعيّن من قبل) */
  getPassword: (userId: string) => string;

  /** التحقق من كلمة مرور مستخدم */
  verify: (userId: string, password: string) => boolean;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set, get) => ({
      passwords: Object.fromEntries(DEMO_USERS.map((u) => [u.id, DEMO_PASSWORD])),

      setPassword: (userId, password) =>
        set((state) => ({
          passwords: { ...state.passwords, [userId]: password },
        })),

      getPassword: (userId) => get().passwords[userId] ?? DEMO_PASSWORD,

      verify: (userId, password) => get().getPassword(userId) === password,
    }),
    {
      name: "okr.credentials.v1",
      storage: createJSONStorage(() => {
        try {
          return {
            getItem: (name) => localStorage.getItem(name),
            setItem: (name, value) => localStorage.setItem(name, value),
            removeItem: (name) => localStorage.removeItem(name),
          };
        } catch {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
      }),
    }
  )
);
