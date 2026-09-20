"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
} from "@/components/common/phase3-badges";
import { PerformanceStatusBadge } from "@/components/common/performance-badge";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { usePhase4Store } from "@/lib/data/phase4-store";
import { useSettingsStore } from "@/lib/data/settings-store";
import { filterObjectivesByScopeAndPermissions } from "@/lib/services/phase3-services";
import {
  calculateObjectiveProgress,
  calculateExpectedProgress,
  calculatePerformanceStatus,
  formatProgress,
} from "@/lib/services/phase4-calculations";
import {
  OBJECTIVE_STATUS_LABELS,
  OBJECTIVE_TYPE_LABELS,
} from "@/lib/data/phase3-types";
import {
  FileText,
  Printer,
  Download,
  Filter,
  Target as TargetIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  return (
    <ProtectedRoute requiredPermissions={["reports.view"]}>
      <Reports />
    </ProtectedRoute>
  );
}

function Reports() {
  const { user: currentUser, roles } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const users = useInstitutionalStore((s) => s.users);
  const cycles = useInstitutionalStore((s) => s.cycles);
  const allObjectives = usePhase3Store((s) => s.objectives);
  const allKeyResults = usePhase3Store((s) => s.keyResults);
  const allReviewEvents = usePhase3Store((s) => s.reviewEvents);
  const assignments = usePhase3Store((s) => s.assignments);
  const updateRequests = usePhase4Store((s) => s.updateRequests);
  const institutionName = useSettingsStore((s) => s.institutionName);

  const [cycleFilter, setCycleFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [showReport, setShowReport] = useState(false);

  // الأهداف ضمن النطاق
  const scopedObjectives = useMemo(() => {
    if (!currentUser) return [];
    return filterObjectivesByScopeAndPermissions(
      currentUser,
      roles,
      allObjectives,
      orgUnits,
      assignments,
      users
    );
  }, [currentUser, roles, allObjectives, orgUnits, assignments, users]);

  // الفلترة
  const filteredObjectives = useMemo(() => {
    let list = [...scopedObjectives];
    if (cycleFilter) list = list.filter((o) => o.cycleId === cycleFilter);
    if (orgFilter) list = list.filter((o) => o.orgUnitId === orgFilter);
    if (statusFilter) list = list.filter((o) => o.status === statusFilter);
    if (ownerFilter) list = list.filter((o) => o.ownerId === ownerFilter);
    return list.sort((a, b) => a.title.localeCompare(b.title, "ar"));
  }, [scopedObjectives, cycleFilter, orgFilter, statusFilter, ownerFilter]);

  // بناء صفوف التقرير
  const reportRows = useMemo(() => {
    return filteredObjectives.map((o) => {
      const actual = calculateObjectiveProgress(o, allKeyResults, updateRequests, allObjectives);
      const cycle = cycles.find((c) => c.id === o.cycleId);
      let expected = 0;
      let perfStatus: "advanced" | "on_track" | "delayed" | "stalled" | undefined;
      if (cycle && o.status === "approved") {
        const approval = allReviewEvents.find(
          (e) => e.objectiveId === o.id && e.eventType === "approved"
        )?.at;
        const result = calculateExpectedProgress(o, cycle, approval);
        expected = result.expected;
        perfStatus = calculatePerformanceStatus(actual, expected);
      }
      const krs = allKeyResults.filter((k) => k.objectiveId === o.id);
      return {
        objective: o,
        owner: users.find((u) => u.id === o.ownerId),
        orgUnit: orgUnits.find((u) => u.id === o.orgUnitId),
        cycle,
        krs,
        actualProgress: actual,
        expectedProgress: expected,
        performanceStatus: perfStatus,
      };
    });
  }, [filteredObjectives, allKeyResults, updateRequests, allObjectives, cycles, allReviewEvents, users, orgUnits]);

  const hasFilters = !!cycleFilter || !!orgFilter || !!statusFilter || !!ownerFilter;

  const generateReport = () => {
    setShowReport(true);
    toast.success("تم إنشاء التقرير.");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      "عنوان الهدف",
      "النوع",
      "المالك",
      "الجهة",
      "الدورة",
      "الحالة",
      "التقدّم الفعلي",
      "التقدّم المتوقّع",
      "حالة الأداء",
      "عدد النتائج",
    ];
    const rows = reportRows.map((r) => [
      r.objective.title,
      OBJECTIVE_TYPE_LABELS[r.objective.type],
      r.owner?.fullName ?? "—",
      r.orgUnit?.name ?? "—",
      r.cycle?.name ?? "—",
      OBJECTIVE_STATUS_LABELS[r.objective.status],
      r.actualProgress.toFixed(1) + "%",
      r.expectedProgress.toFixed(1) + "%",
      r.performanceStatus ? (r.performanceStatus === "advanced" ? "متقدّم" : r.performanceStatus === "on_track" ? "على المسار" : r.performanceStatus === "delayed" ? "متأخر" : "متعثر") : "—",
      r.krs.length.toString(),
    ]);

    const csvContent = [
      `\uFEFF${headers.join(",")}`, // BOM for Arabic
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `تقرير-الأهداف-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("تم تصدير التقرير كملف CSV.");
  };

  const orgUnitName = (id: string) => orgUnits.find((u) => u.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "التقارير" },
        ]}
      />

      <PageHeader
        title="التقارير"
        description="إنشاء تقارير الأداء المؤسسي مع إمكانية الطباعة والتصدير."
      />

      {/* فلاتر التقرير */}
      <Card className={!showReport ? "" : "print:hidden"}>
        <CardHeader>
          <CardTitle className="text-base">نطاق التقرير</CardTitle>
          <CardDescription>
            اختر معايير التقرير ثم اضغط "إنشاء التقرير".
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">الدورة</label>
              <select
                value={cycleFilter}
                onChange={(e) => setCycleFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">كل الدورات</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">الجهة</label>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">كل الجهات</option>
                {orgUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">الحالة</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">كل الحالات</option>
                {(Object.keys(OBJECTIVE_STATUS_LABELS) as Array<keyof typeof OBJECTIVE_STATUS_LABELS>).map((s) => (
                  <option key={s} value={s}>
                    {OBJECTIVE_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">المسؤول</label>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">الكل</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={generateReport}>
              <Filter className="size-4" />
              إنشاء التقرير
            </Button>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCycleFilter("");
                  setOrgFilter("");
                  setStatusFilter("");
                  setOwnerFilter("");
                }}
              >
                إعادة تعيين
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* التقرير */}
      {showReport && (
        <Card className="print:border-0 print:shadow-none">
          {/* ترويسة التقرير */}
          <CardHeader className="print:border-b-2 print:border-border print:pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="text-lg font-bold text-foreground">
                  {institutionName}
                </div>
                <CardTitle className="text-base">تقرير الأهداف والنتائج الرئيسية</CardTitle>
                <CardDescription className="print:text-xs">
                  تاريخ الإنشاء: {new Date().toLocaleString("ar-SA-u-ca-gregory", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </CardDescription>
              </div>
              <div className="text-left text-xs space-y-1 print:block">
                <div>الدورة: {cycleFilter ? cycles.find((c) => c.id === cycleFilter)?.name : "الكل"}</div>
                <div>الجهة: {orgFilter ? orgUnitName(orgFilter) : "الكل"}</div>
                <div>الحالة: {statusFilter ? OBJECTIVE_STATUS_LABELS[statusFilter as keyof typeof OBJECTIVE_STATUS_LABELS] : "الكل"}</div>
              </div>
            </div>
          </CardHeader>

          {/* أزرار التصدير */}
          <CardContent className="print:hidden">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="size-4" />
                طباعة
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="size-4" />
                تصدير CSV
              </Button>
            </div>
          </CardContent>

          {/* جدول التقرير */}
          <CardContent className="print:p-0">
            {reportRows.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-6" />}
                title="لا توجد بيانات مطابقة لنطاق التقرير"
                description="جرّب تعديل معايير التقرير."
                className="border-0"
              />
            ) : (
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-right">
                      <th className="p-2 font-semibold">الهدف</th>
                      <th className="p-2 font-semibold">النوع</th>
                      <th className="p-2 font-semibold">المالك</th>
                      <th className="p-2 font-semibold">الجهة</th>
                      <th className="p-2 font-semibold">الحالة</th>
                      <th className="p-2 font-semibold">التقدّم</th>
                      <th className="p-2 font-semibold">الأداء</th>
                      <th className="p-2 font-semibold">النتائج</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((r, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/20 print:hover:bg-transparent">
                        <td className="p-2">
                          <Link href={`/app/objectives/${r.objective.id}`} className="text-sm font-medium text-foreground hover:text-primary print:text-black print:no-underline">
                            {r.objective.title}
                          </Link>
                        </td>
                        <td className="p-2 text-xs">{OBJECTIVE_TYPE_LABELS[r.objective.type]}</td>
                        <td className="p-2 text-xs">{r.owner?.fullName ?? "—"}</td>
                        <td className="p-2 text-xs">{r.orgUnit?.name ?? "—"}</td>
                        <td className="p-2">
                          <ObjectiveStatusBadge status={r.objective.status} size="sm" />
                        </td>
                        <td className="p-2 text-xs tabular-nums">{formatProgress(r.actualProgress)}</td>
                        <td className="p-2">
                          {r.performanceStatus ? (
                            <PerformanceStatusBadge status={r.performanceStatus} size="sm" />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="p-2 text-xs tabular-nums">{r.krs.length}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border font-semibold">
                      <td className="p-2" colSpan={7}>الإجمالي</td>
                      <td className="p-2 text-xs tabular-nums">{reportRows.length} هدف</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
