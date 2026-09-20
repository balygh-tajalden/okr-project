"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, GitBranch, Target as TargetIcon } from "lucide-react";
import type { Objective } from "@/lib/data/phase3-types";
import type { KeyResult } from "@/lib/data/phase3-types";
import type { OrgUnit, User } from "@/lib/data/types";

/**
 * مسار المحاذاة (Alignment Path)
 * ===================================================================
 * يعرض العلاقة بين الهدف الداعم والهدف الأعلى بصرياً:
 *
 *   الهدف الأعلى (في الجهة الأم)
 *   ← النتيجة الرئيسية العليا
 *   ← الهدف الداعم الحالي
 */
export function AlignmentPath({
  upstreamObjective,
  upstreamKeyResult,
  supportingObjective,
  upstreamOrgUnit,
  supportingOrgUnit,
  cycleName,
}: {
  upstreamObjective?: Objective;
  upstreamKeyResult?: KeyResult;
  supportingObjective: Objective;
  upstreamOrgUnit?: OrgUnit;
  supportingOrgUnit?: OrgUnit;
  cycleName?: string;
}) {
  return (
    <div className="rounded-lg border border-info/30 bg-info/5 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
        <GitBranch className="size-4 text-info" />
        محاذاة الهدف الداعم
      </div>

      <div className="space-y-2">
        {/* الهدف الأعلى */}
        <div className="rounded-md border border-border bg-background p-3">
          <div className="text-[10px] text-muted-foreground mb-1">الهدف الأعلى</div>
          <div className="flex items-start gap-2">
            <TargetIcon className="size-4 mt-0.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground line-clamp-2">
                {upstreamObjective?.title ?? "—"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {upstreamOrgUnit?.name ?? "—"}
                {upstreamObjective?.ownerId && ` • المالك: ${upstreamObjective.ownerId}`}
              </div>
            </div>
          </div>
        </div>

        {/* النتيجة الرئيسية العليا */}
        <div className="flex items-center justify-center text-info">
          <ChevronLeft className="size-5" />
        </div>
        <div className="rounded-md border border-info/30 bg-info/5 p-3 mr-4">
          <div className="text-[10px] text-muted-foreground mb-1">
            النتيجة الرئيسية المُدعَمة
          </div>
          <div className="text-sm font-medium text-foreground">
            {upstreamKeyResult?.title ?? "—"}
          </div>
          {upstreamKeyResult?.progressSource === "direct" &&
            upstreamKeyResult.directType === "numeric" && (
              <div className="text-[11px] text-muted-foreground mt-1">
                من {upstreamKeyResult.baseline} إلى {upstreamKeyResult.target}{" "}
                {upstreamKeyResult.unit}
              </div>
            )}
        </div>

        {/* الهدف الداعم الحالي */}
        <div className="flex items-center justify-center text-info">
          <ChevronLeft className="size-5" />
        </div>
        <div className="rounded-md border-2 border-primary/30 bg-primary/5 p-3 mr-8">
          <div className="text-[10px] text-muted-foreground mb-1">الهدف الداعم الحالي</div>
          <div className="text-sm font-semibold text-foreground line-clamp-2">
            {supportingObjective.title}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {supportingOrgUnit?.name ?? "—"}
          </div>
        </div>

        {cycleName && (
          <div className="pt-2 text-[11px] text-muted-foreground text-center">
            الدورة المشتركة: <span className="font-medium text-foreground">{cycleName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
