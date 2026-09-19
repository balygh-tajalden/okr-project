"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PerformanceStatusBadge } from "@/components/common/performance-badge";
import { StatusBadge } from "@/components/common/status-badge";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import { formatProgress } from "@/lib/services/phase4-calculations";
import type { PerformanceStatus } from "@/lib/data/phase4-types";

/**
 * لوحة حالة التنفيذ (Execution Status Panel)
 * ===================================================================
 * تعرض على صفحة تفاصيل الهدف:
 * - التقدّم الفعلي (محسوب)
 * - التقدّم المتوقّع (محسوب من الزمن)
 * - حالة الأداء (متقدّم/على المسار/متأخر/متعثر)
 * - أهلية التنفيذ (Cycle نشطة + معتمد)
 *
 * ملاحظة: القيم محسوبة، لا يدخلها المستخدم.
 */
export function ExecutionPanel({
  actualProgress,
  expectedProgress,
  performanceStatus,
  isExecutable,
  eligibilityReason,
  lastApprovedUpdateAt,
  effectiveStart,
  effectiveEnd,
}: {
  actualProgress: number;
  expectedProgress: number;
  performanceStatus?: PerformanceStatus;
  isExecutable: boolean;
  eligibilityReason?: string;
  lastApprovedUpdateAt?: string;
  effectiveStart?: string;
  effectiveEnd?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gauge className="size-4" />
          حالة التنفيذ
        </CardTitle>
        <CardDescription>
          القيم محسوبة تلقائياً من التحديثات المعتمدة والزمن المنقضي.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* أهلية التنفيذ */}
        {!isExecutable && eligibilityReason && (
          <div className="rounded-md border border-info/30 bg-info/5 p-3 text-xs text-info flex items-start gap-2">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
            <span>{eligibilityReason}</span>
          </div>
        )}

        {/* التقدّم الفعلي */}
        <ProgressRow
          icon={<Target className="size-3.5" />}
          label="التقدّم الفعلي"
          value={actualProgress}
          color="bg-primary"
          hint="محسوب من التحديثات المعتمدة"
        />

        {/* التقدّم المتوقّع */}
        <ProgressRow
          icon={<Clock className="size-3.5" />}
          label="التقدّم المتوقّع"
          value={expectedProgress}
          color="bg-info"
          hint="محسوب من الزمن المنقضي خلال فترة التنفيذ"
        />

        {/* الفرق */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-muted-foreground">الفارق</span>
          <span
            className={`font-medium tabular-nums ${
              actualProgress > expectedProgress
                ? "text-success"
                : actualProgress < expectedProgress
                  ? "text-warning"
                  : "text-info"
            }`}
          >
            {actualProgress > expectedProgress ? "+" : ""}
            {(actualProgress - expectedProgress).toFixed(1)} نقطة مئوية
          </span>
        </div>

        {/* حالة الأداء */}
        {performanceStatus && isExecutable && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">حالة الأداء</span>
            <PerformanceStatusBadge status={performanceStatus} size="sm" />
          </div>
        )}

        {/* آخر تحديث معتمد */}
        {lastApprovedUpdateAt && (
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-muted-foreground">آخر تحديث معتمد</span>
            <span className="text-foreground">
              {new Date(lastApprovedUpdateAt).toLocaleDateString("ar-SA-u-ca-gregory", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        )}

        {/* فترة التنفيذ الفعلية */}
        {effectiveStart && effectiveEnd && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground">بداية التنفيذ الفعلية</div>
              <div className="text-xs text-foreground">
                {new Date(effectiveStart).toLocaleDateString("ar-SA-u-ca-gregory", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] text-muted-foreground">نهاية التنفيذ الفعلية</div>
              <div className="text-xs text-foreground">
                {new Date(effectiveEnd).toLocaleDateString("ar-SA-u-ca-gregory", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ProgressRow({
  icon,
  label,
  value,
  color,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  hint?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="font-semibold text-foreground tabular-nums">
          {formatProgress(value)}
        </span>
      </div>
      <Progress value={safeValue} className={`h-2 ${color}`} />
      {hint && (
        <p className="text-[10px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
