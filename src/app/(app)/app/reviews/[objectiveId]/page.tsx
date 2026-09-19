"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
} from "@/components/common/phase3-badges";
import { KeyResultCard } from "@/components/common/key-result-card";
import { AlignmentPath } from "@/components/common/alignment-path";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { canApproveObjective } from "@/lib/services/phase3-services";
import {
  CheckCircle2,
  RotateCcw,
  Calendar,
  UserCircle,
  Building2,
  Repeat,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export default function ReviewDetailsPage({
  params,
}: {
  params: Promise<{ objectiveId: string }>;
}) {
  const { objectiveId } = use(params);
  return (
    <ProtectedRoute requiredAnyPermission={["goals.review", "goals.approve"]}>
      <ReviewDetails objectiveId={objectiveId} />
    </ProtectedRoute>
  );
}

function ReviewDetails({ objectiveId }: { objectiveId: string }) {
  const { user: currentUser, roles } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const cycles = useInstitutionalStore((s) => s.cycles);

  const objective = usePhase3Store((s) => s.objectives.find((o) => o.id === objectiveId));
  const allKeyResults = usePhase3Store((s) => s.keyResults);
  const setObjectiveStatus = usePhase3Store((s) => s.setObjectiveStatus);
  const addReviewEvent = usePhase3Store((s) => s.addReviewEvent);

  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  if (!objective || !currentUser) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الهدف غير موجود"
            description="ربما تم حذف الهدف أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/reviews">العودة إلى قائمة المراجعات</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  if (objective.status !== "under_review") {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الهدف ليس قيد المراجعة"
            description={`حالة الهدف الحالية: ${objective.status === "draft" ? "مسودة" : objective.status === "approved" ? "معتمد" : "مغلق"}.`}
            action={
              <Button asChild variant="outline">
                <Link href={`/app/objectives/${objective.id}`}>عرض الهدف</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const owner = users.find((u) => u.id === objective.ownerId);
  const orgUnit = orgUnits.find((u) => u.id === objective.orgUnitId);
  const cycle = cycles.find((c) => c.id === objective.cycleId);
  const krs = allKeyResults.filter((k) => k.objectiveId === objective.id);

  // KR أعلى (للأهداف الداعمة)
  const upstreamKR = objective.upstreamKeyResultId
    ? allKeyResults.find((k) => k.id === objective.upstreamKeyResultId)
    : undefined;
  const upstreamObjective = upstreamKR
    ? usePhase3Store.getState().objectives.find((o) => o.id === upstreamKR.objectiveId)
    : undefined;
  const upstreamOrgUnit = upstreamObjective
    ? orgUnits.find((u) => u.id === upstreamObjective.orgUnitId)
    : undefined;

  const approveCheck = canApproveObjective(currentUser, roles, objective, orgUnits);
  const canApprove = approveCheck.canApprove;
  const isOwner = objective.ownerId === currentUser.id;

  const handleApprove = () => {
    setObjectiveStatus(objective.id, "approved");
    addReviewEvent({
      objectiveId: objective.id,
      eventType: "approved",
      actorUserId: currentUser.id,
    });
    toast.success("تم اعتماد الهدف بنجاح.");
  };

  const handleReturn = () => {
    if (!returnReason.trim()) {
      toast.error("سبب الإعادة للتعديل مطلوب.");
      return;
    }
    setObjectiveStatus(objective.id, "draft");
    addReviewEvent({
      objectiveId: objective.id,
      eventType: "returned",
      actorUserId: currentUser.id,
      reason: returnReason.trim(),
    });
    toast.success("تمت إعادة الهدف للمالك للتعديل.");
    setShowReturnForm(false);
    setReturnReason("");
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "المراجعات", href: "/app/reviews" },
          { label: objective.title },
        ]}
      />

      <PageHeader
        title={objective.title}
        description={objective.description || "—"}
        badge={
          <div className="flex items-center gap-2">
            <ObjectiveTypeBadge type={objective.type} />
            <ObjectiveStatusBadge status={objective.status} />
          </div>
        }
        actions={
          canApprove ? (
            <>
              <Button onClick={handleApprove}>
                <CheckCircle2 className="size-4" />
                اعتماد الهدف
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReturnForm(true)}
              >
                <RotateCcw className="size-4" />
                إعادة للتعديل
              </Button>
            </>
          ) : undefined
        }
      />

      {/* منع الاعتماد الذاتي */}
      {isOwner && (
        <div className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning-foreground flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <span>
            لا يمكنك مراجعة أو اعتماد هدفك الخاص. هذا الهدف معروض هنا لأغراض الاطلاع فقط.
          </span>
        </div>
      )}
      {!isOwner && !canApprove && approveCheck.reason && (
        <div className="rounded-md border border-info/30 bg-info/5 p-3 text-xs text-info flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5 shrink-0" />
          <span>{approveCheck.reason}</span>
        </div>
      )}

      {/* ملخص الهدف */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ملخص الهدف</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            icon={<UserCircle className="size-3.5" />}
            label="المالك"
            value={
              owner ? (
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {owner.initials}
                    </AvatarFallback>
                  </Avatar>
                  {owner.fullName}
                </div>
              ) : (
                "—"
              )
            }
          />
          <InfoRow icon={<Building2 className="size-3.5" />} label="الجهة" value={orgUnit?.name ?? "—"} />
          <InfoRow icon={<Repeat className="size-3.5" />} label="الدورة" value={cycle?.name ?? "—"} />
          <InfoRow icon={<Calendar className="size-3.5" />} label="البداية" value={formatDate(objective.startDate)} />
          <InfoRow icon={<Calendar className="size-3.5" />} label="النهاية" value={formatDate(objective.endDate)} />
        </CardContent>
      </Card>

      {/* المحاذاة */}
      {objective.upstreamKeyResultId && upstreamKR && upstreamObjective && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">المحاذاة</CardTitle>
            <CardDescription>علاقة الهدف الداعم بالهدف الأعلى.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlignmentPath
              upstreamObjective={upstreamObjective}
              upstreamKeyResult={upstreamKR}
              supportingObjective={objective}
              upstreamOrgUnit={upstreamOrgUnit}
              supportingOrgUnit={orgUnit}
              cycleName={cycle?.name}
            />
          </CardContent>
        </Card>
      )}

      {/* النتائج الرئيسية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            النتائج الرئيسية ({krs.length})
          </CardTitle>
          <CardDescription>
            اعتماد الهدف يشمل اعتماد كل هذه النتائج تلقائياً.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {krs.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد نتائج رئيسية.</p>
          ) : (
            <div className="grid gap-3">
              {krs.map((kr) => (
                <KeyResultCard key={kr.id} kr={kr} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة الإعادة مع حقل السبب */}
      {showReturnForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">إعادة الهدف للتعديل</CardTitle>
              <CardDescription>
                سيُعاد "{objective.title}" لمالكه كمسودة. السبب إلزامي.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">
                  سبب الإعادة <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="مثال: النتائج الرئيسية تحتاج لمؤشرات قياس أدق..."
                  rows={3}
                  className="resize-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => { setShowReturnForm(false); setReturnReason(""); }}>
                  إلغاء
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReturn}
                  disabled={!returnReason.trim()}
                >
                  <RotateCcw className="size-4" />
                  إعادة للتعديل
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
