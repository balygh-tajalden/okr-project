"use client";

import { StatusBadge } from "@/components/common/status-badge";
import {
  PERFORMANCE_STATUS_LABELS,
  type PerformanceStatus,
} from "@/lib/data/phase4-types";

/**
 * شارة حالة الأداء (Performance Status Badge)
 * ===================================================================
 * - متقدّم (advanced) → success
 * - على المسار (on_track) → info
 * - متأخر (delayed) → warning
 * - متعثر (stalled) → danger
 *
 * مفهوم مستقل عن دورة حياة الهدف.
 */
export function PerformanceStatusBadge({
  status,
  size = "md",
}: {
  status: PerformanceStatus;
  size?: "sm" | "md" | "lg";
}) {
  switch (status) {
    case "advanced":
      return (
        <StatusBadge variant="success" size={size} dot>
          {PERFORMANCE_STATUS_LABELS.advanced}
        </StatusBadge>
      );
    case "on_track":
      return (
        <StatusBadge variant="info" size={size} dot>
          {PERFORMANCE_STATUS_LABELS.on_track}
        </StatusBadge>
      );
    case "delayed":
      return (
        <StatusBadge variant="warning" size={size} dot>
          {PERFORMANCE_STATUS_LABELS.delayed}
        </StatusBadge>
      );
    case "stalled":
      return (
        <StatusBadge variant="danger" size={size} dot>
          {PERFORMANCE_STATUS_LABELS.stalled}
        </StatusBadge>
      );
  }
}
