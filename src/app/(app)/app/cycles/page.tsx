"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge, OkrStatusBadges } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Pagination } from "@/components/data-table/pagination";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { FormDialog } from "@/components/common/form-dialog";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { CycleFormFields, type CycleFormValues } from "@/components/forms/cycle-form-fields";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { validateCycleDates, getCycleEditableFields, canEditCycle } from "@/lib/services/institutional";
import {
  CYCLE_TYPE_LABELS,
  CYCLE_STATUS_LABELS,
  type CycleStatus,
  type CycleType,
  type Cycle,
} from "@/lib/data/types";
import {
  Repeat,
  Plus,
  Eye,
  Pencil,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 10;

export default function CyclesPage() {
  return (
    <ProtectedRoute requiredAnyPermission={["cycles.view", "cycles.create"]}>
      <CyclesList />
    </ProtectedRoute>
  );
}

function CyclesList() {
  const { can, user } = useCurrentInstitutionalUser();
  const cycles = useInstitutionalStore((s) => s.cycles);
  const createCycle = useInstitutionalStore((s) => s.createCycle);
  const updateCycle = useInstitutionalStore((s) => s.updateCycle);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [createValues, setCreateValues] = useState<CycleFormValues>({
    name: "",
    description: "",
    type: "quarterly",
    startDate: "",
    endDate: "",
  });
  const [createErrors, setCreateErrors] = useState<Partial<Record<keyof CycleFormValues, string>>>({});
  const [editValues, setEditValues] = useState<CycleFormValues>({
    name: "",
    description: "",
    type: "quarterly",
    startDate: "",
    endDate: "",
  });
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof CycleFormValues, string>>>({});

  const filtered = useMemo(() => {
    let list = [...cycles];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)
      );
    }
    if (typeFilter) list = list.filter((c) => c.type === (typeFilter as CycleType));
    if (statusFilter)
      list = list.filter((c) => c.status === (statusFilter as CycleStatus));
    return list.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [cycles, search, typeFilter, statusFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const hasFilters = !!search || !!typeFilter || !!statusFilter;
  const resetFilters = () => {
    setSearch("");
    setTypeFilter("");
    setStatusFilter("");
    setPage(1);
  };

  // Create handlers
  const openCreateModal = () => {
    setCreateValues({ name: "", description: "", type: "quarterly", startDate: "", endDate: "" });
    setCreateErrors({});
    setCreateModalOpen(true);
  };

  const handleCreate = () => {
    const e: Partial<Record<keyof CycleFormValues, string>> = {};
    if (!createValues.name.trim()) e.name = "اسم الدورة مطلوب.";
    if (!createValues.type) e.type = "نوع الدورة مطلوب.";
    if (!createValues.startDate) e.startDate = "تاريخ البداية مطلوب.";
    if (!createValues.endDate) e.endDate = "تاريخ النهاية مطلوب.";
    if (createValues.startDate && createValues.endDate) {
      const dateResult = validateCycleDates(createValues.startDate, createValues.endDate);
      if (!dateResult.valid) e.endDate = dateResult.error;
    }
    setCreateErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      const created = createCycle(
        {
          name: createValues.name.trim(),
          description: createValues.description.trim() || undefined,
          type: createValues.type as CycleType,
          startDate: createValues.startDate,
          endDate: createValues.endDate,
        },
        user!.id
      );
      toast.success(`تم إنشاء الدورة "${created.name}" بحالة مسودة.`);
      setCreateModalOpen(false);
    });
  };

  // Edit handlers
  const openEditModal = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setEditValues({
      name: cycle.name,
      description: cycle.description ?? "",
      type: cycle.type,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
    });
    setEditErrors({});
    setEditModalOpen(true);
  };

  const handleEdit = () => {
    if (!editingCycle) return;
    const editableFields = getCycleEditableFields(editingCycle.status);
    const e: Partial<Record<keyof CycleFormValues, string>> = {};
    if (!editValues.name.trim()) e.name = "اسم الدورة مطلوب.";
    if (editValues.startDate && editValues.endDate) {
      const dateResult = validateCycleDates(editValues.startDate, editValues.endDate);
      if (!dateResult.valid) e.endDate = dateResult.error;
    }
    setEditErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      const patch: Partial<CycleFormValues> = {};
      for (const field of editableFields) {
        (patch as any)[field] = (editValues as any)[field];
      }
      updateCycle(editingCycle.id, patch as any);
      toast.success("تم حفظ التعديلات بنجاح.");
      setEditModalOpen(false);
    });
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "دورات OKR" },
        ]}
      />

      <PageHeader
        title="دورات OKR"
        description="إدارة دورات التخطيط الفصلية والسنوية التي تحكم الأهداف."
        actions={
          can("cycles.create") && (
            <Button onClick={openCreateModal}>
              <Plus className="size-4" />
              إنشاء دورة
            </Button>
          )
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="ابحث باسم الدورة أو الوصف..."
        hasActiveFilters={hasFilters}
        onReset={resetFilters}
        filters={
          <>
            <FilterSelect
              label="النوع"
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
              options={(Object.keys(CYCLE_TYPE_LABELS) as CycleType[]).map((t) => ({
                value: t,
                label: CYCLE_TYPE_LABELS[t],
              }))}
            />
            <FilterSelect
              label="الحالة"
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
              options={(Object.keys(CYCLE_STATUS_LABELS) as CycleStatus[]).map((s) => ({
                value: s,
                label: CYCLE_STATUS_LABELS[s],
              }))}
            />
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Repeat className="size-6" />}
              title={hasFilters ? "لا توجد نتائج مطابقة" : "لم يتم إنشاء دورات بعد"}
              description={
                hasFilters
                  ? "جرّب تعديل عوامل التصفية."
                  : "أنشئ أول دورة OKR لبدء التخطيط."
              }
              className="border-0"
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-right">اسم الدورة</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الفترة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paged.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-foreground">
                              {c.name}
                            </span>
                            {c.description && (
                              <span className="text-[11px] text-muted-foreground line-clamp-1">
                                {c.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CYCLE_TYPE_LABELS[c.type]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="size-3" />
                            {formatDate(c.startDate)} — {formatDate(c.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <CycleStatusBadge status={c.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              asChild
                              size="sm"
                              variant="ghost"
                              className="h-8 gap-1.5"
                            >
                              <Link href={`/app/cycles/${c.id}`}>
                                <Eye className="size-3.5" />
                                عرض
                              </Link>
                            </Button>
                            {can("cycles.update") && c.status === "draft" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 gap-1.5"
                                onClick={() => openEditModal(c)}
                              >
                                <Pencil className="size-3.5" />
                                تعديل
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={filtered.length}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal: إنشاء دورة */}
      <FormDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="إنشاء دورة OKR"
        description="تبدأ الدورة دائماً في حالة مسودة."
        submitLabel="حفظ الدورة"
        onSubmit={handleCreate}
        isSubmitting={isPending}
      >
        <CycleFormFields
          values={createValues}
          onChange={(patch) => setCreateValues((v) => ({ ...v, ...patch }))}
          errors={createErrors}
        />
      </FormDialog>

      {/* Modal: تعديل دورة */}
      {editingCycle && (
        <FormDialog
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          title={`تعديل: ${editingCycle.name}`}
          description="عدّل بيانات الدورة. الحقول المقيدة تُعرض مع شرح."
          submitLabel="حفظ التعديلات"
          onSubmit={handleEdit}
          isSubmitting={isPending}
        >
          <CycleFormFields
            values={editValues}
            onChange={(patch) => setEditValues((v) => ({ ...v, ...patch }))}
            errors={editErrors}
            editableFields={getCycleEditableFields(editingCycle.status)}
          />
        </FormDialog>
      )}
    </div>
  );
}

export function CycleStatusBadge({ status }: { status: CycleStatus }) {
  if (status === "draft") return <OkrStatusBadges.Pending size="sm" />;
  if (status === "active") return <OkrStatusBadges.InProgress size="sm" />;
  return <OkrStatusBadges.Completed size="sm" />;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
