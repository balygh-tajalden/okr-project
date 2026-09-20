"use client";

import { use, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { UserFormFields, type UserFormValues } from "@/components/forms/user-form-fields";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  validateUsername,
  validateEmail,
  getAccessibleOrgUnitIds,
  canAccessOrgUnit,
} from "@/lib/services/institutional";
import type { AccountStatus } from "@/lib/data/types";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["users.update"]}>
      <EditUserForm userId={id} />
    </ProtectedRoute>
  );
}

function EditUserForm({ userId }: { userId: string }) {
  const router = useRouter();
  const { user: currentUser } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const roles = useInstitutionalStore((s) => s.roles);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const updateUser = useInstitutionalStore((s) => s.updateUser);
  const assignUserOrgUnit = useInstitutionalStore((s) => s.assignUserOrgUnit);
  const assignUserRoles = useInstitutionalStore((s) => s.assignUserRoles);
  const setUserStatus = useInstitutionalStore((s) => s.setUserStatus);
  const isUsernameTaken = useInstitutionalStore((s) => s.isUsernameTaken);
  const isEmailTaken = useInstitutionalStore((s) => s.isEmailTaken);

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});

  const user = users.find((u) => u.id === userId);

  // املأ النموذج ببيانات المستخدم الحالية مباشرةً (initializer)
  const [values, setValues] = useState<UserFormValues>(() => {
    if (user) {
      return {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        jobTitle: user.jobTitle,
        employeeId: user.employeeId,
        primaryOrgUnitId: user.primaryOrgUnitId ?? "",
        roleIds: [...user.roleIds],
        status: user.status,
        phone: user.phone ?? "",
        bio: user.bio ?? "",
      };
    }
    return {
      fullName: "",
      username: "",
      email: "",
      jobTitle: "",
      employeeId: "",
      primaryOrgUnitId: "",
      roleIds: [],
      status: "active",
      phone: "",
      bio: "",
    };
  });

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

  // التحقق من النطاق
  if (
    !currentUser ||
    !canAccessOrgUnit(currentUser, orgUnits, user.primaryOrgUnitId ?? "")
  ) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="خارج نطاق وصولك"
            description="لا تملك صلاحية لتعديل هذا المستخدم لأنه خارج نطاقك التنظيمي."
          />
        </CardContent>
      </Card>
    );
  }

  const availableOrgUnitIds = getAccessibleOrgUnitIds(currentUser, orgUnits);

  const setField = (patch: Partial<UserFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  function validate(): boolean {
    const e: Partial<Record<keyof UserFormValues, string>> = {};
    if (!values.fullName.trim()) e.fullName = "الاسم الكامل مطلوب.";
    if (!values.employeeId.trim()) e.employeeId = "رقم الموظف مطلوب.";
    if (!values.primaryOrgUnitId) e.primaryOrgUnitId = "الجهة التنظيمية مطلوبة.";
    if (values.roleIds.length === 0) e.roleIds = "يجب إسناد دور واحد على الأقل.";

    const usernameResult = validateUsername(
      values.username,
      (u) => isUsernameTaken(u, user.id),
    );
    if (!usernameResult.valid) e.username = usernameResult.error;

    const emailResult = validateEmail(values.email, (em) =>
      isEmailTaken(em, user.id)
    );
    if (!emailResult.valid) e.email = emailResult.error;

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      // الأحرف الأولى
      const initials =
        values.fullName
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("") || user.initials;

      // حدّث بيانات المستخدم
      updateUser(user.id, {
        fullName: values.fullName.trim(),
        username: values.username.trim(),
        email: values.email.trim().toLowerCase(),
        jobTitle: values.jobTitle.trim(),
        employeeId: values.employeeId.trim(),
        initials,
        phone: values.phone.trim() || undefined,
        bio: values.bio.trim() || undefined,
      });

      // حدّث حالة الحساب إن تغيّرت
      if (values.status !== user.status) {
        setUserStatus(user.id, values.status as AccountStatus);
      }

      // حدّث الأدوار إن تغيّرت
      const rolesChanged =
        values.roleIds.length !== user.roleIds.length ||
        values.roleIds.some((r) => !user.roleIds.includes(r));
      if (rolesChanged) {
        assignUserRoles(user.id, values.roleIds);
      }

      // حدّث الجهة التنظيمية إن تغيّرت (يُنشئ ارتباطاً تاريخياً تلقائياً)
      if (values.primaryOrgUnitId !== user.primaryOrgUnitId) {
        assignUserOrgUnit(
          user.id,
          values.primaryOrgUnitId,
          "نقل تنظيمي من صفحة التعديل"
        );
      }

      toast.success("تم حفظ التعديلات بنجاح.");
      router.push(`/app/users/${user.id}`);
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "المستخدمون", href: "/app/users" },
          { label: user.fullName, href: `/app/users/${user.id}` },
          { label: "تعديل" },
        ]}
      />

      <PageHeader
        title={`تعديل: ${user.fullName}`}
        description="عدّل بيانات المستخدم وأدواره والارتباط التنظيمي."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <UserFormFields
          values={values}
          onChange={setField}
          errors={errors}
          orgUnits={orgUnits}
          roles={roles}
          availableOrgUnitIds={availableOrgUnitIds}
          mode="edit"
        />

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href={`/app/users/${user.id}`}>
              <ArrowRight className="size-4" />
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </Button>
        </div>
      </form>
    </div>
  );
}
