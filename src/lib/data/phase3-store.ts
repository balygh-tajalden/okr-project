"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Objective,
  KeyResult,
  ObjectiveReviewEvent,
  ObjectiveAssignment,
  ObjectiveId,
  KeyResultId,
  ObjectiveType,
  ObjectiveStatus,
  KrProgressSource,
  KrDirectType,
  KrDirection,
  AssignmentResponse,
} from "./phase3-types";
import { SEED_PHASE3_DATA } from "./phase3-seed";
import type { UserId, OrgUnitId, CycleId } from "./types";

/**
 * مخزن الطور الثالث — مصدر الحقيقة الموحّد للأهداف والنتائج الرئيسية
 * ===================================================================
 * مسؤول عن:
 * - الأهداف، النتائج الرئيسية، سجل المراجعات، الإسنادات الفردية
 * - عمليات إنشاء/تعديل/إرسال للمراجعة/اعتماد/إعادة
 * - عمليات إسناد وقبول/رفض الأهداف الفردية
 * - الحفاظ على السجل التاريخي الكامل
 */

const STORAGE_KEY = "okr.phase3.v1";

interface Phase3Store {
  objectives: Objective[];
  keyResults: KeyResult[];
  reviewEvents: ObjectiveReviewEvent[];
  assignments: ObjectiveAssignment[];

  /* ===== الأهداف ===== */
  createObjective: (input: Omit<Objective, "id" | "createdAt" | "updatedAt" | "status" | "contributorUserIds"> & { contributorUserIds?: UserId[] }) => Objective;
  updateObjective: (id: ObjectiveId, patch: Partial<Objective>) => void;
  deleteObjective: (id: ObjectiveId) => void;
  setObjectiveStatus: (id: ObjectiveId, status: ObjectiveStatus) => void;
  setContributors: (id: ObjectiveId, userIds: UserId[]) => void;

  /* ===== النتائج الرئيسية ===== */
  createKeyResult: (input: Omit<KeyResult, "id" | "createdAt" | "updatedAt">) => KeyResult;
  updateKeyResult: (id: KeyResultId, patch: Partial<KeyResult>) => void;
  deleteKeyResult: (id: KeyResultId) => void;

  /* ===== سجل المراجعات ===== */
  addReviewEvent: (input: Omit<ObjectiveReviewEvent, "id" | "at">) => void;

  /* ===== الإسناد الفردي ===== */
  createAssignment: (objectiveId: ObjectiveId, assignerUserId: UserId, assigneeUserId: UserId) => ObjectiveAssignment;
  respondToAssignment: (assignmentId: string, response: "accepted" | "rejected", reason?: string, actorUserId?: UserId) => void;

  /* ===== أدوات ===== */
  resetToSeed: () => void;
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

const NOW = () => new Date().toISOString();

export const usePhase3Store = create<Phase3Store>()(
  persist(
    (set, get) => ({
      ...SEED_PHASE3_DATA,

      /* ============= الأهداف ============= */

      createObjective: (input) => {
        const objective: Objective = {
          id: genId("obj"),
          title: input.title,
          description: input.description,
          type: input.type,
          ownerId: input.ownerId,
          orgUnitId: input.orgUnitId,
          cycleId: input.cycleId,
          startDate: input.startDate,
          endDate: input.endDate,
          status: "draft", // دائماً يبدأ كمسودة (وفق المواصفات)
          createdAt: NOW(),
          updatedAt: NOW(),
          contributorUserIds: input.contributorUserIds ?? [],
          upstreamKeyResultId: input.upstreamKeyResultId,
        };
        set((state) => ({ objectives: [...state.objectives, objective] }));
        return objective;
      },

      updateObjective: (id, patch) => {
        set((state) => ({
          objectives: state.objectives.map((o) =>
            o.id === id ? { ...o, ...patch, updatedAt: NOW() } : o
          ),
        }));
      },

      deleteObjective: (id) => {
        set((state) => ({
          objectives: state.objectives.filter((o) => o.id !== id),
          keyResults: state.keyResults.filter((k) => k.objectiveId !== id),
          reviewEvents: state.reviewEvents.filter((r) => r.objectiveId !== id),
          assignments: state.assignments.filter((a) => a.objectiveId !== id),
        }));
      },

      setObjectiveStatus: (id, status) => {
        set((state) => ({
          objectives: state.objectives.map((o) =>
            o.id === id ? { ...o, status, updatedAt: NOW() } : o
          ),
        }));
      },

      setContributors: (id, userIds) => {
        set((state) => ({
          objectives: state.objectives.map((o) =>
            o.id === id ? { ...o, contributorUserIds: userIds, updatedAt: NOW() } : o
          ),
        }));
      },

      /* ============= النتائج الرئيسية ============= */

      createKeyResult: (input) => {
        const kr: KeyResult = {
          ...input,
          id: genId("kr"),
          createdAt: NOW(),
          updatedAt: NOW(),
        };
        set((state) => ({ keyResults: [...state.keyResults, kr] }));
        return kr;
      },

      updateKeyResult: (id, patch) => {
        set((state) => ({
          keyResults: state.keyResults.map((k) =>
            k.id === id ? { ...k, ...patch, updatedAt: NOW() } : k
          ),
        }));
      },

      deleteKeyResult: (id) => {
        set((state) => ({
          keyResults: state.keyResults.filter((k) => k.id !== id),
        }));
      },

      /* ============= سجل المراجعات ============= */

      addReviewEvent: (input) => {
        const event: ObjectiveReviewEvent = {
          ...input,
          id: genId("rev"),
          at: NOW(),
        };
        set((state) => ({ reviewEvents: [...state.reviewEvents, event] }));
      },

      /* ============= الإسناد الفردي ============= */

      createAssignment: (objectiveId, assignerUserId, assigneeUserId) => {
        const assignment: ObjectiveAssignment = {
          id: genId("asg"),
          objectiveId,
          assignerUserId,
          assigneeUserId,
          response: "pending",
          assignedAt: NOW(),
        };
        set((state) => ({ assignments: [...state.assignments, assignment] }));
        // أضف حدث إسناد للسجل
        const event: ObjectiveReviewEvent = {
          id: genId("rev"),
          objectiveId,
          eventType: "assigned",
          actorUserId: assignerUserId,
          targetUserId: assigneeUserId,
          at: NOW(),
        };
        set((state) => ({ reviewEvents: [...state.reviewEvents, event] }));
        return assignment;
      },

      respondToAssignment: (assignmentId, response, reason, actorUserId) => {
        const now = NOW();
        set((state) => {
          const assignment = state.assignments.find((a) => a.id === assignmentId);
          if (!assignment) return state;
          const updatedAssignments = state.assignments.map((a) =>
            a.id === assignmentId
              ? {
                  ...a,
                  response,
                  respondedAt: now,
                  rejectReason: response === "rejected" ? reason : undefined,
                }
              : a
          );
          const event: ObjectiveReviewEvent = {
            id: genId("rev"),
            objectiveId: assignment.objectiveId,
            eventType: response === "accepted" ? "accepted" : "rejected",
            actorUserId: actorUserId ?? assignment.assigneeUserId,
            at: now,
            reason: response === "rejected" ? reason : undefined,
          };
          return {
            assignments: updatedAssignments,
            reviewEvents: [...state.reviewEvents, event],
          };
        });
      },

      /* ============= أدوات ============= */

      resetToSeed: () => set({ ...SEED_PHASE3_DATA }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
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

/* ============= أدوات مساعدة للوصول المباشر ============= */

export function getObjectiveById(id: ObjectiveId | undefined): Objective | undefined {
  if (!id) return undefined;
  return usePhase3Store.getState().objectives.find((o) => o.id === id);
}

export function getKeyResultById(id: KeyResultId | undefined): KeyResult | undefined {
  if (!id) return undefined;
  return usePhase3Store.getState().keyResults.find((k) => k.id === id);
}

export function getKeyResultsForObjective(objectiveId: ObjectiveId): KeyResult[] {
  return usePhase3Store.getState().keyResults.filter((k) => k.objectiveId === objectiveId);
}

export function getReviewEventsForObjective(objectiveId: ObjectiveId): ObjectiveReviewEvent[] {
  return usePhase3Store
    .getState()
    .reviewEvents.filter((r) => r.objectiveId === objectiveId)
    .sort((a, b) => (a.at < b.at ? 1 : -1));
}

export function getAssignmentsForUser(userId: UserId): ObjectiveAssignment[] {
  return usePhase3Store.getState().assignments.filter((a) => a.assigneeUserId === userId);
}

export function getAssignmentForObjective(objectiveId: ObjectiveId): ObjectiveAssignment | undefined {
  return usePhase3Store.getState().assignments.find((a) => a.objectiveId === objectiveId);
}

/** يحسب الأهداف الداعمة المرتبطة بـ KR أعلى */
export function getSupportingObjectivesForKR(upstreamKrId: KeyResultId): Objective[] {
  return usePhase3Store
    .getState()
    .objectives.filter((o) => o.upstreamKeyResultId === upstreamKrId);
}
