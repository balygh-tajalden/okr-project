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
import { RoleFormFields, type RoleFormValues } from "@/components/forms/role-form-fields";
import { EmptyState } from "@/components/common/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { useInstitutionalStore } from "@/lib/data/store";

export default function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["roles.manage"]}>
      <EditRoleForm roleId={id} />
    </ProtectedRoute>
  );
}

function EditRoleForm({ roleId }: { roleId: string }) {
  const router = useRouter();
  const roles = useInstitutionalStore((s) => s.roles);
  const updateRole = useInstitutionalStore((s) => s.updateRole);
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<keyof RoleFormValues, string>>>({});

  const role = roles.find((r) => r.id === roleId);

  const [values, setValues] = useState<RoleFormValues>(() => {
    if (role) {
      return {
        name: role.name,
        description: role.description ?? "",
        permissions: [...role.permissions],
      };
    }
    return { name: "", description: "", permissions: [] };
  });

  if (!role) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="الدور غير موجود"
            description="ربما تم حذف الدور أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/roles">العودة إلى قائمة الأدوار</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  const setField = (patch: Partial<RoleFormValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  function validate(): boolean {
    const e: Partial<Record<keyof RoleFormValues, string>> = {};
    if (!values.name.trim()) e.name = "اسم الدور مطلوب.";
    if (roles.some((r) => r.id !== role.id && r.name === values.name.trim()))
      e.name = "يوجد دور آخر بنفس الاسم. اختر اسماً آخر.";
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
      updateRole(role.id, {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        permissions: values.permissions,
      });
      toast.success("تم حفظ التعديلات بنجاح.");
      router.push(`/app/roles/${role.id}`);
    });
  }

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأدوار والصلاحيات", href: "/app/roles" },
          { label: role.name, href: `/app/roles/${role.id}` },
          { label: "تعديل" },
        ]}
      />
      <PageHeader
        title={`تعديل: ${role.name}`}
        description="عدّل اسم الدور ووصفه وصلاحياته."
      />
      <form onSubmit={handleSubmit} className="space-y-5">
        <RoleFormFields
          values={values}
          onChange={setField}
          errors={errors}
          isSystem={role.isSystem}
        />
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" type="button">
            <Link href={`/app/roles/${role.id}`}>
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
