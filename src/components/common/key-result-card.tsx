"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  KrProgressSourceBadge,
  KrDirectTypeBadge,
  KrDirectionBadge,
} from "@/components/common/phase3-badges";
import {
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Target as TargetIcon,
  GitBranch,
} from "lucide-react";
import type { KeyResult } from "@/lib/data/phase3-types";

/**
 * بطاقة عرض نتيجة رئيسية
 * ===================================================================
 * تعرض: العنوان، مصدر التقدّم، نوع القياس، الوحدة، المرجعية، الهدف، الاتجاه
 */
export function KeyResultCard({
  kr,
  upstreamLabel,
  canEdit,
  onEdit,
  onDelete,
}: {
  kr: KeyResult;
  upstreamLabel?: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <TargetIcon className="size-4" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="text-sm font-semibold text-foreground leading-snug">
                {kr.title}
              </h4>
              {kr.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {kr.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <KrProgressSourceBadge source={kr.progressSource} size="sm" />
                {kr.progressSource === "direct" && kr.directType && (
                  <KrDirectTypeBadge type={kr.directType} size="sm" />
                )}
                {kr.progressSource === "supporting" && (
                  <StatusBadge variant="info" size="sm">
                    يُحتسب من الأهداف الداعمة
                  </StatusBadge>
                )}
              </div>
            </div>
          </div>
          {canEdit && (
            <div className="flex items-center gap-0.5">
              {onEdit && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={onEdit}
                  aria-label="تعديل النتيجة"
                >
                  <Pencil className="size-3.5" />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive"
                  onClick={onDelete}
                  aria-label="حذف النتيجة"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* تفاصيل القياس */}
        {kr.progressSource === "direct" && kr.directType === "numeric" && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border">
            <Metric label="الوحدة" value={kr.unit ?? "—"} />
            <Metric label="المرجعية" value={String(kr.baseline ?? "—")} />
            <Metric label="الهدف" value={String(kr.target ?? "—")} />
            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground">الاتجاه</div>
              <div className="text-sm text-foreground flex items-center gap-1">
                {kr.direction === "descending" ? (
                  <TrendingDown className="size-3.5 text-info" />
                ) : (
                  <TrendingUp className="size-3.5 text-success" />
                )}
                <KrDirectionBadge direction={kr.direction ?? "ascending"} />
              </div>
            </div>
          </div>
        )}

        {kr.progressSource === "direct" && kr.directType === "binary" && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              نوع القياس: إنجاز / عدم إنجاز (لا يتطلب قيماً عددية)
            </p>
          </div>
        )}

        {/* ربط الأعلى (للأهداف الداعمة) */}
        {kr.progressSource === "supporting" && upstreamLabel && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <GitBranch className="size-3.5 mt-0.5 shrink-0 text-info" />
              <span>يُحتسب تقدّمه من: <span className="text-foreground font-medium">{upstreamLabel}</span></span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground font-medium tabular-nums">{value}</div>
    </div>
  );
}

// استيراد محلي لتفادي دورة الاستيراد
import { StatusBadge } from "@/components/common/status-badge";
