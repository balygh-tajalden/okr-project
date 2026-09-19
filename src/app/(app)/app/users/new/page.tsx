"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { UserFormFields, type UserFormValues } from "@/components/forms/user-form-fields";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import {
  validateUsername,
  validateEmail,
} from "@/lib/services/institutional";
import { getAccessibleOrgUnitIds } from "@/lib/services/institutional";
import type { AccountStatus } from "@/lib/data/types";

export default function NewUserPage() {
  return (
    <ProtectedRoute requiredPermissions={["users.create"]}>
      <NewUserForm />
    </ProtectedRoute>
  );
}

function NewUserForm() {
  const router = useRouter();
  const { user: currentUser } = useCurrentInstitutionalUser();
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const roles = useInstitutionalStore((s) => s.roles);
  const createUser = useInstitutionalStore((s) => s.createUser);
  const isUsernameTaken = useInstitutionalStore((s) => s.isUsernameTaken);
  const isEmailTaken = useInstitutionalStore((s) => s.isEmailTaken);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});

  const [values, setValues] = useState<UserFormValues>({
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
  });

  const setField = (patch: Partial<UserFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  // الجهات المتاحة ضمن نطاق المستخدم الحالي
  const availableOrgUnitIds = currentUser
    ? getAccessibleOrgUnitIds(currentUser, orgUnits)
    : new Set<string>();

  function validate(): boolean {
    const e: Partial<Record<keyof UserFormValues, string>> = {};
    if (!values.fullName.trim()) e.fullName = "الاسم الكامل مطلوب.";
    if (!values.employeeId.trim()) e.employeeId = "رقم الموظف مطلوب.";
    if (!values.primaryOrgUnitId) e.primaryOrgUnitId = "الجهة التنظيمية مطلوبة.";
    if (values.roleIds.length === 0) e.roleIds = "يجب إسناد دور واحد على الأقل.";

    const usernameResult = validateUsername(
      values.username,
      (u) => isUsernameTaken(u),
    );
    if (!usernameResult.valid) e.username = usernameResult.error;

    const emailResult = validateEmail(values.email, (em) => isEmailTaken(em));
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
      // احسب الأحرف الأولى من الاسم تلقائياً
      const initials = values.fullName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("");

      const created = createUser({
        username: values.username.trim(),
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        initials,
        jobTitle: values.jobTitle.trim(),
        employeeId: values.employeeId.trim(),
        status: values.status as AccountStatus,
        primaryOrgUnitId: values.primaryOrgUnitId,
        roleIds: values.roleIds,
        phone: values.phone.trim() || undefined,
        bio: values.bio.trim() || undefined,
        avatarUrl: undefined,
      });

      toast.success(`تم إنشاء المستخدم "${created.fullName}" بنجاح.`);
      router.push(`/app/users/${created.id}`);
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "المستخدمون", href: "/app/users" },
          { label: "إنشاء مستخدم" },
        ]}
      />

      <PageHeader
        title="إنشاء مستخدم"
        description="أنشئ حساباً جديداً وأسند إليه الجهة التنظيمية والأدوار."
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <UserFormFields
          values={values}
          onChange={setField}
          errors={errors}
          orgUnits={orgUnits}
          roles={roles}
          availableOrgUnitIds={availableOrgUnitIds}
          mode="create"
        />

        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href="/app/users">
              <ArrowRight className="size-4" />
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "جاري الحفظ..." : "حفظ المستخدم"}
          </Button>
        </div>
      </form>
    </div>
  );
}
