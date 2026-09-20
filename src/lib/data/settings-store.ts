"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * مخزن الإعدادات (Settings Store) — قابل للتعديل من واجهة الإعدادات
 * ===================================================================
 * يستهلكه منطق Phase 4 (المراقبة، الأداء، التذكيرات).
 *
 * القيم الافتراضية:
 * - فترة تحديث KR مباشر: 7 أيام
 * - حد الفصل بين التأخر والتعثر: 25 نقطة مئوية
 * - فترة تذكير التنبيه غير المقروء: 2 أيام
 * - اسم المؤسسة: "هيئة التطوير المؤسسي"
 */

const STORAGE_KEY = "okr.settings.v1";

export interface SettingsState {
  /** فترة تحديث النتائج ذات القياس المباشر (بالأيام) */
  directKrUpdateIntervalDays: number;
  /** حد الفصل بين حالتي التأخر والتعثر (نقطة مئوية) */
  delayedStalledThresholdPoints: number;
  /** فترة تذكير التنبيه غير المقروء (بالأيام) */
  unreadReminderDays: number;
  /** اسم المؤسسة */
  institutionName: string;

  updateSettings: (patch: Partial<Omit<SettingsState, "updateSettings" | "resetDefaults">>) => void;
  resetDefaults: () => void;
}

export const DEFAULT_SETTINGS = {
  directKrUpdateIntervalDays: 7,
  delayedStalledThresholdPoints: 25,
  unreadReminderDays: 2,
  institutionName: "هيئة التطوير المؤسسي",
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      updateSettings: (patch) => set(patch),
      resetDefaults: () => set({ ...DEFAULT_SETTINGS }),
    }),
    {
      name: STORAGE_KEY,
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

/**
 * يحصل على الإعدادات الحالية كقيم بسيطة (لاستخدامها في الخدمات غير المرتبطة بـ React).
 * يقرأ من الحالة الحالية للمخزن.
 */
export function getSettings() {
  const state = useSettingsStore.getState();
  return {
    directKrUpdateIntervalDays: state.directKrUpdateIntervalDays,
    delayedStalledThresholdPoints: state.delayedStalledThresholdPoints,
    unreadReminderDays: state.unreadReminderDays,
    institutionName: state.institutionName,
  };
}
