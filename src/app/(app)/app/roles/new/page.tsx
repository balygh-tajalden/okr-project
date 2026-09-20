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
import { RoleFormFields, type RoleFormValues } from "@/components/forms/role-form-fields";
import { useInstitutionalStore } from "@/lib/data/store";

export default function NewRolePage() {
  return (
    <ProtectedRoute requiredPermissions={["roles.manage"]}>
      <NewRoleForm />
    </ProtectedRoute>
  );
}

function NewRoleForm() {
  const router = useRouter();
  const createRole = useInstitutionalStore((s) => s.createRole);
  const roles = useInstitutionalStore((s) => s.roles);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormValues, string>>>({});

  const [values, setValues] = useState<RoleFormValues>({
    name: "",
    description: "",
    permissions: [],
  });

  const setField = (patch: Partial<RoleFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  function validate(): boolean {
    const e: Partial<Record<keyof RoleFormValues, string>> = {};
    if (!values.name.trim()) e.name = "اسم الدور مطلوب.";
    if (roles.some((r) => r.name === values.name.trim()))
      e.name = "يوجد دور بنفس الاسم. اختر اسماً آخر.";
    if (values.permissions.length === 0)
      e.permissions = "يجب اختيار صلاحية واحدة على الأقل.";
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
      const created = createRole({
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        permissions: values.permissions,
      });
      toast.success(`تم إنشاء الدور "${created.name}" بنجاح.`);
      router.push(`/app/roles/${created.id}`);
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأدوار والصلاحيات", href: "/app/roles" },
          { label: "إنشاء دور" },
        ]}
      />
      <PageHeader
        title="إنشاء دور"
        description="أنشئ دوراً جديداً واختر الصلاحيات المُسندة إليه."
      />
      <form onSubmit={handleSubmit} className="space-y-5">
        <RoleFormFields values={values} onChange={setField} errors={errors} />
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href="/app/roles">
              <ArrowRight className="size-4" />
              إلغاء
            </Link>
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? "جاري الحفظ..." : "حفظ الدور"}
          </Button>
        </div>
      </form>
    </div>
  );
}
