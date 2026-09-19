"use client";

import { StatusBadge } from "@/components/common/status-badge";
import {
  OBJECTIVE_STATUS_LABELS,
  OBJECTIVE_TYPE_LABELS,
  type ObjectiveStatus,
  type ObjectiveType,
  KR_PROGRESS_SOURCE_LABELS,
  KR_DIRECT_TYPE_LABELS,
  KR_DIRECTION_LABELS,
  type KrProgressSource,
  type KrDirectType,
  type KrDirection,
  ASSIGNMENT_RESPONSE_LABELS,
  type AssignmentResponse,
} from "@/lib/data/phase3-types";

/** شارة حالة الهدف (4 حالات) */
export function ObjectiveStatusBadge({
  status,
  size = "md",
}: {
  status: ObjectiveStatus;
  size?: "sm" | "md" | "lg";
}) {
  switch (status) {
    case "draft":
      return (
        <StatusBadge variant="warning" size={size} dot>
          {OBJECTIVE_STATUS_LABELS.draft}
        </StatusBadge>
      );
    case "under_review":
      return (
        <StatusBadge variant="info" size={size} dot>
          {OBJECTIVE_STATUS_LABELS.under_review}
        </StatusBadge>
      );
    case "approved":
      return (
        <StatusBadge variant="success" size={size} dot>
          {OBJECTIVE_STATUS_LABELS.approved}
        </StatusBadge>
      );
    case "closed":
      return (
        <StatusBadge variant="neutral" size={size} dot>
          {OBJECTIVE_STATUS_LABELS.closed}
        </StatusBadge>
      );
  }
}

/** شارة نوع الهدف */
export function ObjectiveTypeBadge({
  type,
  size = "sm",
}: {
  type: ObjectiveType;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <StatusBadge variant="outline" size={size}>
      {OBJECTIVE_TYPE_LABELS[type]}
    </StatusBadge>
  );
}

/** شارة مصدر تقدّم KR */
export function KrProgressSourceBadge({
  source,
  size = "sm",
}: {
  source: KrProgressSource;
  size?: "sm" | "md" | "lg";
}) {
  if (source === "direct") {
    return (
      <StatusBadge variant="info" size={size}>
        {KR_PROGRESS_SOURCE_LABELS.direct}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge variant="neutral" size={size}>
      {KR_PROGRESS_SOURCE_LABELS.supporting}
    </StatusBadge>
  );
}

/** شارة نوع القياس المباشر */
export function KrDirectTypeBadge({
  type,
  size = "sm",
}: {
  type: KrDirectType;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <StatusBadge variant="outline" size={size}>
      {KR_DIRECT_TYPE_LABELS[type]}
    </StatusBadge>
  );
}

/** شارة اتجاه القياس */
export function KrDirectionBadge({ direction }: { direction: KrDirection }) {
  return (
    <span className="text-xs text-muted-foreground">
      {KR_DIRECTION_LABELS[direction]}
    </span>
  );
}

/** شارة استجابة الإسناد */
export function AssignmentResponseBadge({
  response,
  size = "md",
}: {
  response: AssignmentResponse;
  size?: "sm" | "md" | "lg";
}) {
  switch (response) {
    case "pending":
      return (
        <StatusBadge variant="warning" size={size} dot>
          {ASSIGNMENT_RESPONSE_LABELS.pending}
        </StatusBadge>
      );
    case "accepted":
      return (
        <StatusBadge variant="success" size={size} dot>
          {ASSIGNMENT_RESPONSE_LABELS.accepted}
        </StatusBadge>
      );
    case "rejected":
      return (
        <StatusBadge variant="danger" size={size} dot>
          {ASSIGNMENT_RESPONSE_LABELS.rejected}
        </StatusBadge>
      );
  }
}
