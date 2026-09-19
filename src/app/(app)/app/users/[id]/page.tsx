"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useState } from "react";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  getEffectivePermissions,
  getUserRoles,
  getUserPrimaryUnitName,
  getAncestorPath,
  canAccessOrgUnit,
} from "@/lib/services/institutional";
import {
  ACCOUNT_STATUS_LABELS,
  ORG_UNIT_TYPE_LABELS,
} from "@/lib/data/types";
import { PERMISSION_DEFS, PERMISSION_GROUP_LABELS, permissionsByGroup } from "@/lib/auth/permissions-v2";
import {
  Mail,
  Building2,
  Hash,
  User as UserIcon,
  Pencil,
  UserCheck,
  UserX,
  ShieldCheck,
  History,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

export default function UserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["users.view"]}>
      <UserDetails userId={id} />
    </ProtectedRoute>
  );
}

function UserDetails({ userId }: { userId: string }) {
  const router = useRouter();
  const { user: currentUser, can, roles, effectivePermissions: _ } =
    useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const assignments = useInstitutionalStore((s) => s.userOrgAssignments);
  const setUserStatus = useInstitutionalStore((s) => s.setUserStatus);

  const [confirmOpen, setConfirmOpen] = useState<
    null | "activate" | "disable"
  >(null);

  const user = users.find((u) => u.id === userId);

  // التحقق من النطاق: لا يمكن لمستخدم غير مصرّح رؤية مستخدم خارج نطاقه
  if (!user) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="المستخدم غير موجود"
            description="ربما تم حذف الحساب أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/users">العودة إلى قائمة المستخدمين</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  if (
    !currentUser ||
    !canAccessOrgUnit(currentUser, orgUnits, user.primaryOrgUnitId ?? "")
  ) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="خارج نطاق وصولك"
            description="لا تملك صلاحية لعرض هذا المستخدم لأنه خارج نطاقك التنظيمي."
          />
        </CardContent>
      </Card>
    );
  }

  const userRoles = getUserRoles(user, roles);
  const effectivePermissions = getEffectivePermissions(user, roles);
  const primaryUnitName = getUserPrimaryUnitName(user, orgUnits);
  const ancestorPath = user.primaryOrgUnitId
    ? getAncestorPath(orgUnits, user.primaryOrgUnitId)
    : [];
  const userAssignments = assignments
    .filter((a) => a.userId === user.id)
    .sort((a, b) => (a.validFrom < b.validFrom ? 1 : -1));

  const canManageStatus = can("users.status.manage");
  const canEdit = can("users.update");

  const handleStatusChange = () => {
    const newStatus = user.status === "active" ? "disabled" : "active";
    setUserStatus(user.id, newStatus);
    toast.success(
      newStatus === "active"
        ? "تم تفعيل الحساب."
        : "تم إيقاف الحساب."
    );
    setConfirmOpen(null);
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "المستخدمون", href: "/app/users" },
          { label: user.fullName },
        ]}
      />

      <PageHeader
        title={user.fullName}
        description={user.jobTitle || "—"}
        actions={
          <>
            {canEdit && (
              <Button asChild variant="outline">
                <Link href={`/app/users/${user.id}/edit`}>
                  <Pencil className="size-4" />
                  تعديل
                </Link>
              </Button>
            )}
            {canManageStatus && user.status === "active" && (
              <Button
                variant="outline"
                onClick={() => setConfirmOpen("disable")}
              >
                <UserX className="size-4" />
                إيقاف الحساب
              </Button>
            )}
            {canManageStatus && user.status === "disabled" && (
              <Button
                variant="default"
                onClick={() => setConfirmOpen("activate")}
              >
                <UserCheck className="size-4" />
                تفعيل الحساب
              </Button>
            )}
          </>
        }
      />

      {/* بطاقة التعريف */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-6">
            <Avatar className="size-20 border-2 border-primary/15 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {user.fullName}
                </h2>
                <StatusBadge
                  variant={user.status === "active" ? "success" : "danger"}
                  dot
                >
                  {ACCOUNT_STATUS_LABELS[user.status]}
                </StatusBadge>
              </div>
              <p className="text-sm text-muted-foreground">{user.jobTitle}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="size-3.5" />
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                    {user.username}
                  </code>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="size-3.5" />
                  {user.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-3.5" />
                  {primaryUnitName}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Hash className="size-3.5" />
                  {user.employeeId}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* العمود الأيسر: معلومات الحساب والارتباط */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="text-base">معلومات الحساب</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow label="الاسم الكامل" value={user.fullName} />
            <Separator />
            <InfoRow
              label="اسم المستخدم"
              value={<code className="font-mono text-sm">{user.username}</code>}
            />
            <Separator />
            <InfoRow label="البريد الإلكتروني" value={user.email} />
            <Separator />
            <InfoRow label="المسمى الوظيفي" value={user.jobTitle || "—"} />
            <Separator />
            <InfoRow label="رقم الموظف" value={user.employeeId} />
            <Separator />
            <InfoRow
              label="حالة الحساب"
              value={
                <StatusBadge
                  variant={user.status === "active" ? "success" : "danger"}
                  dot
                  size="sm"
                >
                  {ACCOUNT_STATUS_LABELS[user.status]}
                </StatusBadge>
              }
            />
            {user.phone && (
              <>
                <Separator />
                <InfoRow label="رقم الجوال" value={user.phone} />
              </>
            )}
          </CardContent>
        </Card>

        {/* العمود الأيمن: الارتباط التنظيمي + السجل التنظيمي */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">الارتباط التنظيمي</CardTitle>
              <CardDescription>
                الجهة التنظيمية الحالية ومسارها الهرمي.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.primaryOrgUnitId ? (
                <>
                  <div className="rounded-md border border-border bg-muted/30 p-3">
                    <div className="text-xs text-muted-foreground mb-1">
                      الجهة الحالية
                    </div>
                    <div className="font-medium text-foreground">
                      {primaryUnitName}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {user.primaryOrgUnitId &&
                        ORG_UNIT_TYPE_LABELS[
                          orgUnits.find((u) => u.id === user.primaryOrgUnitId)
                            ?.type ?? "unit"
                        ]}
                    </div>
                  </div>
                  {ancestorPath.length > 0 && (
                    <div>
                      <div className="text-xs text-muted-foreground mb-1.5">
                        المسار الهرمي
                      </div>
                      <Breadcrumbs
                        items={ancestorPath.map((u) => ({
                          label: u.name,
                          href: `/app/organization/${u.id}`,
                        }))}
                      />
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  لا يوجد ارتباط تنظيمي محدّد.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="size-4" />
                السجل التنظيمي
              </CardTitle>
              <CardDescription>
                تاريخ تنقلات المستخدم بين الجهات التنظيمية.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {userAssignments.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">
                  لا يوجد سجل تنظيمي.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {userAssignments.map((a, i) => {
                    const unit = orgUnits.find((u) => u.id === a.orgUnitId);
                    return (
                      <div
                        key={a.id}
                        className="flex items-start justify-between gap-3 p-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">
                            {unit?.name ?? "—"}
                          </div>
                          {a.reason && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {a.reason}
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <div className="text-[11px] text-muted-foreground">
                            {a.isCurrent ? (
                              <StatusBadge variant="success" size="sm" dot>
                                حالي
                              </StatusBadge>
                            ) : (
                              <span>
                                {formatDate(a.validFrom)} —{" "}
                                {a.validTo ? formatDate(a.validTo) : "الآن"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* الأدوار والصلاحيات الفعلية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4" />
            الأدوار المسندة
          </CardTitle>
          <CardDescription>
            الأدوار الحالية للمستخدم — تُحسب الصلاحيات الفعلية كاتحاد لصلاحياتها.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {userRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا توجد أدوار مسندة.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userRoles.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-md border border-border bg-card p-2"
                >
                  <KeyRound className="size-4 text-primary" />
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {r.name}
                    </div>
                    {r.isSystem && (
                      <div className="text-[10px] text-muted-foreground">
                        دور نظامي
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* الصلاحيات الفعلية (effective permissions) — مجمّعة حسب المجموعة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الصلاحيات الفعلية</CardTitle>
          <CardDescription>
            مجموع الصلاحيات الممنوحة عبر الأدوار المسندة ({effectivePermissions.length} صلاحية).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {effectivePermissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا توجد صلاحيات.</p>
          ) : (
            <EffectivePermissionsView permissions={effectivePermissions} />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen !== null}
        onOpenChange={(o) => !o && setConfirmOpen(null)}
        title={
          confirmOpen === "activate"
            ? "تفعيل الحساب"
            : "إيقاف الحساب"
        }
        description={
          confirmOpen === "activate"
            ? `سيتم تفعيل حساب "${user.fullName}". سيتمكن المستخدم من تسجيل الدخول مجدداً. هل تريد المتابعة؟`
            : `سيتم إيقاف حساب "${user.fullName}". لن يتمكن المستخدم من تسجيل الدخول، مع الحفاظ على بياناته وسجلاته. هل تريد المتابعة؟`
        }
        confirmLabel={confirmOpen === "activate" ? "تفعيل" : "إيقاف"}
        variant={confirmOpen === "activate" ? "default" : "destructive"}
        onConfirm={handleStatusChange}
      />
    </div>
  );
}

/** عرض الصلاحيات الفعلية مجمّعة حسب المجموعة */
function EffectivePermissionsView({
  permissions,
}: {
  permissions: string[];
}) {
  const grouped = permissionsByGroup();
  const permSet = new Set(permissions);
  const groupKeys = Object.keys(grouped) as Array<keyof typeof grouped>;
  const activeGroups = groupKeys.filter((g) =>
    grouped[g].some((p) => permSet.has(p.key))
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeGroups.map((g) => (
        <div key={g} className="space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {PERMISSION_GROUP_LABELS[g]}
          </div>
          <div className="flex flex-wrap gap-1">
            {grouped[g]
              .filter((p) => permSet.has(p.key))
              .map((p) => (
                <span
                  key={p.key}
                  className="inline-flex items-center rounded-md bg-primary/5 border border-primary/15 px-2 py-0.5 text-[11px] text-primary"
                  title={p.description}
                >
                  {p.label}
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-left">{value}</span>
    </div>
  );
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
