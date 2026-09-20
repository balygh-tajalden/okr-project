"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useCurrentUser, useAuthSession } from "@/lib/auth/session";
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ACCOUNT_STATUS_LABELS,
  type User,
} from "@/lib/auth/types";
import { useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  Building2,
  Hash,
  User as UserIcon,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * ProfilePage
 * ===================================================================
 * صفحة الملف الشخصي للطور الأول — تعرض:
 * - الاسم الكامل، اسم المستخدم، البريد الإلكتروني
 * - الجهة التنظيمية، الدور/الأدوار، حالة الحساب
 * - إجراءات آمنة على مستوى النموذج الأولي (تحديث رقم الهاتف/الاهتمامات)
 *
 * ملاحظة: لا يُسمح للمستخدم بتغيير دوره أو صلاحياته — هذا مسؤول مدير النظام.
 */
export default function ProfilePage() {
  const user = useCurrentUser();
  const updateCurrentUser = useAuthSession((s) => s.updateCurrentUser);
  const [phone, setPhone] = useState(user?.["phone" as keyof User] as string ?? "");
  const [bio, setBio] = useState(user?.["bio" as keyof User] as string ?? "");
  const [saving, setSaving] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  if (!user) return null;

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateCurrentUser({
        // نُخزّن هذه الحقول الاختيارية كامتدادات لكائن المستخدم.
        // لا تُغيّر هذه الأدوار أو الصلاحيات — بيانات شخصية فقط.
        ...(({ phone, bio }) => ({ phone, bio }))({ phone, bio }),
      } as Partial<User>);
      setSaving(false);
      toast.success("تم حفظ التعديلات بنجاح");
    }, 600);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="ملفي الشخصي"
        description="عرض وتحديث معلوماتك الشخصية. لا يمكن تغيير الدور أو الصلاحيات من هذه الصفحة."
      />

      {/* بطاقة تعريف المستخدم */}
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
                  {user.organizationalUnit}
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* العمود الأيسر: المعلومات المؤسسية للقراءة فقط */}
        <Card className="lg:col-span-1 order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="text-base">المعلومات المؤسسية</CardTitle>
            <CardDescription>
              بياناتك الوظيفية — تُدار من قبل إدارة الموارد البشرية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow
              icon={<ShieldCheck className="size-4" />}
              label="الدور الأساسي"
              value={
                <StatusBadge variant="info" size="sm">
                  {ROLE_LABELS[user.role]}
                </StatusBadge>
              }
            />
            <Separator />
            <InfoRow
              label="وصف الدور"
              value={
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {ROLE_DESCRIPTIONS[user.role]}
                </p>
              }
            />
            <Separator />
            <InfoRow
              label="رقم الموظف"
              value={<span className="font-mono text-sm">{user.employeeId}</span>}
            />
            <Separator />
            <InfoRow
              label="حالة الحساب"
              value={
                <StatusBadge
                  variant={user.status === "active" ? "success" : "danger"}
                  size="sm"
                  dot
                >
                  {ACCOUNT_STATUS_LABELS[user.status]}
                </StatusBadge>
              }
            />

            <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                <p className="leading-relaxed">
                  الأدوار والصلاحيات يديرها مدير النظام فقط. للطلب تعديلها، يرجى
                  التواصل مع{" "}
                  <span className="font-medium text-foreground">
                    إدارة الموارد البشرية
                  </span>{" "}
                  أو مدير النظام.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* العمود الأيمن: تحرير بيانات اتصال آمنة */}
        <Card className="lg:col-span-2 order-1 lg:order-2">
          <CardHeader>
            <CardTitle className="text-base">بيانات التواصل</CardTitle>
            <CardDescription>
              يمكنك تحديث بيانات التواصل الشخصية. لا تؤثر هذه التغييرات على
              صلاحياتك أو دورك.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم الكامل" htmlFor="full-name">
                <Input
                  id="full-name"
                  value={user.fullName}
                  readOnly
                  disabled
                  className="bg-muted/40 font-medium"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  للتعديل، يرجى التواصل مع الموارد البشرية.
                </p>
              </Field>

              <Field label="البريد الإلكتروني" htmlFor="email">
                <Input
                  id="email"
                  value={user.email}
                  readOnly
                  disabled
                  className="bg-muted/40"
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  يُدار من قبل مدير النظام.
                </p>
              </Field>

              <Field label="رقم الجوال" htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="مثال: 05XXXXXXXX"
                  inputMode="tel"
                />
              </Field>

              <Field label="الجهة التنظيمية" htmlFor="org-unit">
                <Input
                  id="org-unit"
                  value={user.organizationalUnit}
                  readOnly
                  disabled
                  className="bg-muted/40"
                />
              </Field>
            </div>

            <Field label="نبذة مختصرة" htmlFor="bio">
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="مثال: محلل أعمال أول مهتم بتحسين تجربة المستخدم..."
                maxLength={140}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                تظهر النبذة لزملائك عند العمل المشترك على الأهداف.
              </p>
            </Field>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => {
                setPhone("");
                setBio("");
              }}>
                إعادة تعيين
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    حفظ التعديلات
                  </>
                )}
              </Button>
            </div>

            <Separator />

            {/* منطقة الحساب — إجراءات حساسة */}
            <div className="rounded-md border border-warning/30 bg-warning/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning" />
                <div className="flex-1 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    منطقة الحساب الحساسة
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    إجراءات مثل إعادة تعيين كلمة المرور أو إيقاف الحساب تتطلب
                    تأكيداً إضافياً وتتم من خلال صفحات مخصصة.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSignOutConfirm(true)}
                    >
                      <Lock className="size-4" />
                      تغيير كلمة المرور
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="تغيير كلمة المرور"
        description="ستحتاج إلى إعادة تسجيل الدخول بعد تغيير كلمة المرور. هل تريد المتابعة؟"
        confirmLabel="متابعة"
        cancelLabel="إلغاء"
        onConfirm={async () => {
          // في الطور الأول: نُحوّل المستخدم إلى صفحة إعادة التعيين
          setShowSignOutConfirm(false);
          window.location.href = "/reset-password";
        }}
      />
    </div>
  );
}

/** صف معلومات للقراءة فقط */
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
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

/** حقل نموذج بتصنيف */
function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
