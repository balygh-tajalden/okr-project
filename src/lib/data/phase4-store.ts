"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ProgressUpdateRequest,
  Evidence,
  Alert,
  AlertReadState,
  AlertFeedback,
  UpdateRequestId,
  AlertId,
  UpdateRequestStatus,
  ApprovedValue,
  EvidenceType,
  AlertType,
} from "./phase4-types";
import { SEED_PHASE4_DATA } from "./phase4-seed";
import type { ObjectiveId, KeyResultId } from "@/lib/data/phase3-types";
import type { UserId } from "@/lib/data/types";
import { nowIso } from "@/lib/services/phase4-config";

/**
 * مخزن الطور الرابع — مصدر الحقيقة الموحّد للتنفيذ والتقدّم والتنبيهات
 * ===================================================================
 * مسؤول عن:
 * - طلبات تحديث التقدّم
 * - الأدلة المرفقة
 * - التنبيهات وحالة قراءتها
 * - ملاحظات المتابعة على التنبيهات
 *
 * الحفاظ على:
 * - فصل حالة الطلب عن دورة حياة الهدف.
 * - القيمة الفعلية لا يدخلها المُرسِل — فقط المراجع.
 * - لا تعديل للقيمة الفعلية عند الطلب المعلّق/المُعاد.
 */

const STORAGE_KEY = "okr.phase4.v1";

interface Phase4Store {
  updateRequests: ProgressUpdateRequest[];
  evidence: Evidence[];
  alerts: Alert[];
  alertReadStates: AlertReadState[];
  alertFeedback: AlertFeedback[];

  /* ===== طلبات التحديث ===== */
  createUpdateRequest: (input: {
    objectiveId: ObjectiveId;
    keyResultId: KeyResultId;
    submitterUserId: UserId;
    submitterNotes: string;
  }) => ProgressUpdateRequest;

  approveUpdateRequest: (
    id: UpdateRequestId,
    reviewerUserId: UserId,
    approvedValue: ApprovedValue
  ) => void;

  returnUpdateRequest: (
    id: UpdateRequestId,
    reviewerUserId: UserId,
    returnReason: string
  ) => void;

  /* ===== الأدلة ===== */
  addEvidence: (
    updateRequestId: UpdateRequestId,
    type: EvidenceType,
    content: string,
    uploadedBy: UserId,
    fileMeta?: { fileName?: string; fileType?: string; fileSize?: number }
  ) => Evidence;

  /* ===== التنبيهات ===== */
  createAlert: (input: {
    type: AlertType;
    source: "system" | "manual";
    objectiveId?: ObjectiveId;
    keyResultId?: KeyResultId;
    title: string;
    message: string;
    reason?: string;
    senderUserId?: UserId;
    recipientUserIds: UserId[];
    isActive?: boolean;
  }) => Alert;

  markAlertRead: (alertId: AlertId, userId: UserId) => void;
  markAlertUnread: (alertId: AlertId, userId: UserId) => void;

  /** يضيف ملاحظة متابعة لتنبيه */
  addAlertFeedback: (alertId: AlertId, userId: UserId, note: string) => void;

  /** يُلغي تفعيل التنبيه (يوقف توليد التذكيرات والتنبيهات الإضافية) */
  deactivateAlert: (alertId: AlertId) => void;

  /* ===== أدوات ===== */
  resetToSeed: () => void;
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const usePhase4Store = create<Phase4Store>()(
  persist(
    (set, get) => ({
      ...SEED_PHASE4_DATA,

      /* ============= طلبات التحديث ============= */

      createUpdateRequest: (input) => {
        const req: ProgressUpdateRequest = {
          id: genId("ur"),
          objectiveId: input.objectiveId,
          keyResultId: input.keyResultId,
          submitterUserId: input.submitterUserId,
          submittedAt: nowIso(),
          submitterNotes: input.submitterNotes,
          status: "pending_review",
        };
        set((state) => ({ updateRequests: [...state.updateRequests, req] }));
        return req;
      },

      approveUpdateRequest: (id, reviewerUserId, approvedValue) => {
        const now = nowIso();
        set((state) => ({
          updateRequests: state.updateRequests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "approved" as UpdateRequestStatus,
                  reviewerUserId,
                  reviewedAt: now,
                  approvedValue,
                }
              : r
          ),
        }));
      },

      returnUpdateRequest: (id, reviewerUserId, returnReason) => {
        const now = nowIso();
        set((state) => ({
          updateRequests: state.updateRequests.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: "returned" as UpdateRequestStatus,
                  reviewerUserId,
                  reviewedAt: now,
                  returnReason,
                }
              : r
          ),
        }));
      },

      /* ============= الأدلة ============= */

      addEvidence: (updateRequestId, type, content, uploadedBy, fileMeta) => {
        const evidence: Evidence = {
          id: genId("ev"),
          updateRequestId,
          type,
          content,
          uploadedBy,
          uploadedAt: nowIso(),
          fileName: fileMeta?.fileName,
          fileType: fileMeta?.fileType,
          fileSize: fileMeta?.fileSize,
        };
        set((state) => ({ evidence: [...state.evidence, evidence] }));
        return evidence;
      },

      /* ============= التنبيهات ============= */

      createAlert: (input) => {
        const alert: Alert = {
          id: genId("al"),
          type: input.type,
          source: input.source,
          objectiveId: input.objectiveId,
          keyResultId: input.keyResultId,
          title: input.title,
          message: input.message,
          reason: input.reason,
          senderUserId: input.senderUserId,
          recipientUserIds: input.recipientUserIds,
          createdAt: nowIso(),
          isActive: input.isActive ?? true,
        };
        set((state) => ({
          alerts: [...state.alerts, alert],
          // أنشئ حالة قراءة لكل مستلم (غير مقروء افتراضياً)
          alertReadStates: [
            ...state.alertReadStates,
            ...input.recipientUserIds.map((uid) => ({
              id: genId("ars"),
              alertId: alert.id,
              userId: uid,
              isRead: false,
            })),
          ],
        }));
        return alert;
      },

      markAlertRead: (alertId, userId) => {
        const now = nowIso();
        set((state) => ({
          alertReadStates: state.alertReadStates.map((s) =>
            s.alertId === alertId && s.userId === userId
              ? { ...s, isRead: true, readAt: now }
              : s
          ),
        }));
      },

      markAlertUnread: (alertId, userId) => {
        set((state) => ({
          alertReadStates: state.alertReadStates.map((s) =>
            s.alertId === alertId && s.userId === userId
              ? { ...s, isRead: false, readAt: undefined }
              : s
          ),
        }));
      },

      addAlertFeedback: (alertId, userId, note) => {
        const feedback: AlertFeedback = {
          id: genId("af"),
          alertId,
          userId,
          note,
          createdAt: nowIso(),
        };
        set((state) => ({ alertFeedback: [...state.alertFeedback, feedback] }));
      },

      deactivateAlert: (alertId) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, isActive: false } : a
          ),
        }));
      },

      /* ============= أدوات ============= */

      resetToSeed: () => set({ ...SEED_PHASE4_DATA }),
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

export function getUpdateRequestById(
  id: UpdateRequestId | undefined
): ProgressUpdateRequest | undefined {
  if (!id) return undefined;
  return usePhase4Store.getState().updateRequests.find((r) => r.id === id);
}

export function getUpdateRequestsForKR(
  keyResultId: KeyResultId
): ProgressUpdateRequest[] {
  return usePhase4Store
    .getState()
    .updateRequests.filter((r) => r.keyResultId === keyResultId)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

export function getUpdateRequestsForObjective(
  objectiveId: ObjectiveId
): ProgressUpdateRequest[] {
  return usePhase4Store
    .getState()
    .updateRequests.filter((r) => r.objectiveId === objectiveId)
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
}

export function getEvidenceForUpdateRequest(
  updateRequestId: UpdateRequestId
): Evidence[] {
  return usePhase4Store
    .getState()
    .evidence.filter((e) => e.updateRequestId === updateRequestId);
}

export function getAlertsForUser(userId: UserId): Alert[] {
  return usePhase4Store
    .getState()
    .alerts.filter((a) => a.recipientUserIds.includes(userId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getUnreadAlertCountForUser(userId: UserId): number {
  const state = usePhase4Store.getState();
  const userAlertIds = state.alerts
    .filter((a) => a.recipientUserIds.includes(userId) && a.isActive)
    .map((a) => a.id);
  return state.alertReadStates.filter(
    (s) => userAlertIds.includes(s.alertId) && !s.isRead
  ).length;
}

export function getAlertReadStateForUser(
  alertId: AlertId,
  userId: UserId
): AlertReadState | undefined {
  return usePhase4Store
    .getState()
    .alertReadStates.find((s) => s.alertId === alertId && s.userId === userId);
}

export function getFeedbackForAlert(alertId: AlertId): AlertFeedback[] {
  return usePhase4Store
    .getState()
    .alertFeedback.filter((f) => f.alertId === alertId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
