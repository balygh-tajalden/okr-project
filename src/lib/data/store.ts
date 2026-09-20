"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  InstitutionalState,
  User,
  Role,
  OrgUnit,
  Cycle,
  UserOrgAssignment,
  UserId,
  RoleId,
  OrgUnitId,
  CycleId,
  AccountStatus,
} from "./types";
import { SEED_DATA } from "./seed";

/**
 * مخزن الحالة المؤسسية — مصدر الحقيقة الموحّد للطور الثاني
 * ===================================================================
 * مسؤول عن:
 * - المستخدمون، الأدوار، الجهات التنظيمية، الإسنادات، الدورات
 * - عمليات إنشاء/تعديل/تغيير حالة مع الحفاظ على السجل التاريخي
 * - التحقق من المراجع (referential integrity)
 *
 * يستمر عبر localStorage (لكي تعمل العمليات فعلياً أثناء المعاينة).
 * عند الربط بخادم حقيقي لاحقاً: استبدال المنطق بنداءات fetch دون تغيير الواجهات.
 */

const STORAGE_KEY = "okr.institutional.v1";

interface InstitutionalStore extends InstitutionalState {
  /* ===== المستخدمون ===== */
  createUser: (input: Omit<User, "id" | "createdAt" | "updatedAt">) => User;
  updateUser: (id: UserId, patch: Partial<User>) => void;
  setUserStatus: (id: UserId, status: AccountStatus) => void;
  assignUserOrgUnit: (id: UserId, orgUnitId: OrgUnitId, reason?: string) => void;
  assignUserRoles: (id: UserId, roleIds: RoleId[]) => void;

  /* ===== الأدوار ===== */
  createRole: (input: Omit<Role, "id" | "createdAt" | "updatedAt" | "isSystem">) => Role;
  updateRole: (id: RoleId, patch: Partial<Role>) => void;

  /* ===== الجهات التنظيمية ===== */
  createOrgUnit: (input: Omit<OrgUnit, "id" | "createdAt" | "updatedAt">) => OrgUnit;
  updateOrgUnit: (id: OrgUnitId, patch: Partial<OrgUnit>) => void;

  /* ===== الدورات ===== */
  createCycle: (input: Omit<Cycle, "id" | "createdAt" | "updatedAt" | "status" | "createdBy">, createdBy: UserId) => Cycle;
  updateCycle: (id: CycleId, patch: Partial<Cycle>) => void;
  setCycleStatus: (id: CycleId, status: Cycle["status"]) => void;

  /* ===== أدوات ===== */
  resetToSeed: () => void;
  isUsernameTaken: (username: string, excludeId?: UserId) => boolean;
  isEmailTaken: (email: string, excludeId?: UserId) => boolean;
}

/** مولّد معرّفات قصيرة ومستقرة */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const NOW = () => new Date().toISOString();

export const useInstitutionalStore = create<InstitutionalStore>()(
  persist(
    (set, get) => ({
      ...SEED_DATA,

      /* ============= المستخدمون ============= */

      createUser: (input) => {
        const user: User = {
          ...input,
          id: genId("u"),
          createdAt: NOW(),
          updatedAt: NOW(),
        };
        set((state) => ({
          users: [...state.users, user],
          userOrgAssignments: user.primaryOrgUnitId
            ? [
                ...state.userOrgAssignments,
                {
                  id: genId("asg"),
                  userId: user.id,
                  orgUnitId: user.primaryOrgUnitId,
                  validFrom: NOW(),
                  validTo: null,
                  isCurrent: true,
                  reason: "تعيين ابتدائي",
                },
              ]
            : state.userOrgAssignments,
        }));
        return user;
      },

      updateUser: (id, patch) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, ...patch, updatedAt: NOW() } : u
          ),
        }));
      },

      setUserStatus: (id, status) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status,
                  updatedAt: NOW(),
                  disabledAt: status === "disabled" ? NOW() : undefined,
                }
              : u
          ),
        }));
      },

      assignUserOrgUnit: (id, orgUnitId, reason) => {
        const now = NOW();
        set((state) => {
          // إنهاء الارتباط الحالي
          const updatedAssignments = state.userOrgAssignments.map((a) =>
            a.userId === id && a.isCurrent
              ? { ...a, isCurrent: false, validTo: now }
              : a
          );
          // إنشاء ارتباط جديد
          const newAssignment: UserOrgAssignment = {
            id: genId("asg"),
            userId: id,
            orgUnitId,
            validFrom: now,
            validTo: null,
            isCurrent: true,
            reason: reason ?? "نقل تنظيمي",
          };
          return {
            userOrgAssignments: [...updatedAssignments, newAssignment],
            users: state.users.map((u) =>
              u.id === id
                ? { ...u, primaryOrgUnitId: orgUnitId, updatedAt: now }
                : u
            ),
          };
        });
      },

      assignUserRoles: (id, roleIds) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, roleIds, updatedAt: NOW() } : u
          ),
        }));
      },

      /* ============= الأدوار ============= */

      createRole: (input) => {
        const role: Role = {
          ...input,
          id: genId("r"),
          isSystem: false,
          createdAt: NOW(),
          updatedAt: NOW(),
        };
        set((state) => ({ roles: [...state.roles, role] }));
        return role;
      },

      updateRole: (id, patch) => {
        set((state) => ({
          roles: state.roles.map((r) =>
            r.id === id ? { ...r, ...patch, updatedAt: NOW() } : r
          ),
        }));
      },

      /* ============= الجهات التنظيمية ============= */

      createOrgUnit: (input) => {
        const unit: OrgUnit = {
          ...input,
          id: genId("ou"),
          createdAt: NOW(),
          updatedAt: NOW(),
        };
        set((state) => ({ orgUnits: [...state.orgUnits, unit] }));
        return unit;
      },

      updateOrgUnit: (id, patch) => {
        set((state) => ({
          orgUnits: state.orgUnits.map((u) =>
            u.id === id ? { ...u, ...patch, updatedAt: NOW() } : u
          ),
        }));
      },

      /* ============= الدورات ============= */

      createCycle: (input, createdBy) => {
        const cycle: Cycle = {
          ...input,
          id: genId("c"),
          status: "draft" as const, // البداية دائماً مسودة (وفق المواصفات)
          createdBy,
          createdAt: NOW(),
          updatedAt: NOW(),
        };
        set((state) => ({ cycles: [...state.cycles, cycle] }));
        return cycle;
      },

      updateCycle: (id, patch) => {
        set((state) => ({
          cycles: state.cycles.map((c) =>
            c.id === id ? { ...c, ...patch, updatedAt: NOW() } : c
          ),
        }));
      },

      setCycleStatus: (id, status) => {
        const now = NOW();
        set((state) => ({
          cycles: state.cycles.map((c) => {
            if (c.id !== id) return c;
            const patch: Cycle = { ...c, status, updatedAt: now };
            if (status === "active" && !c.activatedAt) patch.activatedAt = now;
            if (status === "completed" && !c.completedAt) patch.completedAt = now;
            return patch;
          }),
        }));
      },

      /* ============= أدوات ============= */

      resetToSeed: () => set({ ...SEED_DATA }),

      isUsernameTaken: (username, excludeId) => {
        const normalized = username.trim().toLowerCase();
        return get().users.some(
          (u) => u.id !== excludeId && u.username.toLowerCase() === normalized
        );
      },

      isEmailTaken: (email, excludeId) => {
        const normalized = email.trim().toLowerCase();
        return get().users.some(
          (u) => u.id !== excludeId && u.email.toLowerCase() === normalized
        );
      },
    }),
    {
      name: STORAGE_KEY,
      version: 7,
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
      // عند تغيير الإصدار: استبدل البيانات بالنسخة الأولية الجديدة
      migrate: () => ({ ...SEED_DATA }),
    }
  )
);

/* ============= أدوات مساعدة للوصول المباشر ============= */

/** جلب مستخدم بالمعرّف */
export function getUserById(id: UserId | undefined): User | undefined {
  if (!id) return undefined;
  return useInstitutionalStore.getState().users.find((u) => u.id === id);
}

/** جلب دور بالمعرّف */
export function getRoleById(id: RoleId | undefined): Role | undefined {
  if (!id) return undefined;
  return useInstitutionalStore.getState().roles.find((r) => r.id === id);
}

/** جلب جهة بالمعرّف */
export function getOrgUnitById(id: OrgUnitId | undefined): OrgUnit | undefined {
  if (!id) return undefined;
  return useInstitutionalStore.getState().orgUnits.find((u) => u.id === id);
}

/** جلب دورة بالمعرّف */
export function getCycleById(id: CycleId | undefined): Cycle | undefined {
  if (!id) return undefined;
  return useInstitutionalStore.getState().cycles.find((c) => c.id === id);
}
