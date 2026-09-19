"use client";

import { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useSettingsStore, DEFAULT_SETTINGS } from "@/lib/data/settings-store";
import {
  Save,
  RotateCcw,
  Building2,
  Clock,
  Gauge,
  Bell,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <ProtectedRoute requiredPermissions={["settings.manage"]}>
      <Settings />
    </ProtectedRoute>
  );
}

function Settings() {
  const store = useSettingsStore();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // قيم محلية للتحرير
  const [institutionName, setInstitutionName] = useState(store.institutionName);
  const [updateInterval, setUpdateInterval] = useState(String(store.directKrUpdateIntervalDays));
  const [threshold, setThreshold] = useState(String(store.delayedStalledThresholdPoints));
  const [reminder, setReminder] = useState(String(store.unreadReminderDays));

  const hasChanges =
    institutionName !== store.institutionName ||
    Number(updateInterval) !== store.directKrUpdateIntervalDays ||
    Number(threshold) !== store.delayedStalledThresholdPoints ||
    Number(reminder) !== store.unreadReminderDays;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!institutionName.trim()) e.institutionName = "اسم المؤسسة مطلوب.";
    const ui = Number(updateInterval);
    if (!updateInterval || isNaN(ui) || ui < 1 || ui > 365)
      e.updateInterval = "أدخل قيمة بين 1 و 365 يوماً.";
    const th = Number(threshold);
    if (!threshold || isNaN(th) || th < 1 || th > 100)
      e.threshold = "أدخل قيمة بين 1 و 100 نقطة مئوية.";
    const rm = Number(reminder);
    if (!reminder || isNaN(rm) || rm < 1 || rm > 90)
      e.reminder = "أدخل قيمة بين 1 و 90 يوماً.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  const handleSave = () => {
    if (!validate()) {
      toast.error("يرجى تصحيح الأخطاء قبل الحفظ.");
      return;
    }
    startTransition(() => {
      store.updateSettings({
        institutionName: institutionName.trim(),
        directKrUpdateIntervalDays: Number(updateInterval),
        delayedStalledThresholdPoints: Number(threshold),
        unreadReminderDays: Number(reminder),
      });
      toast.success("تم حفظ الإعدادات بنجاح. ستُطبّق على العمليات اللاحقة.");
    });
  };

  const handleReset = () => {
    setInstitutionName(DEFAULT_SETTINGS.institutionName);
    setUpdateInterval(String(DEFAULT_SETTINGS.directKrUpdateIntervalDays));
    setThreshold(String(DEFAULT_SETTINGS.delayedStalledThresholdPoints));
    setReminder(String(DEFAULT_SETTINGS.unreadReminderDays));
    setErrors({});
    toast.info("تمت إعادة التعيين للقيم الافتراضية (لم تُحفظ بعد).");
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الإعدادات" },
        ]}
      />

      <PageHeader
        title="الإعدادات العامة"
        description="إعدادات النظام المؤسسية — تُطبّق على المراقبة والأداء والتنبيهات."
        actions={
          <>
            {hasChanges && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="size-4" />
                إعادة الافتراضي
              </Button>
            )}
            <Button onClick={handleSave} disabled={isPending || !hasChanges}>
              <Save className="size-4" />
              {isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </>
        }
      />

      {/* بيانات المؤسسة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="size-4" />
            بيانات المؤسسة
          </CardTitle>
          <CardDescription>
            معلومات المؤسسة الأساسية المعروضة في التقارير.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-md">
            <Label className="text-sm font-medium">
              اسم المؤسسة <span className="text-destructive">*</span>
            </Label>
            <Input
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="مثال: هيئة التطوير المؤسسي"
            />
            {errors.institutionName && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.institutionName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* إعدادات التنفيذ والمراقبة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Gauge className="size-4" />
            إعدادات التنفيذ والمراقبة
          </CardTitle>
          <CardDescription>
            هذه القيم تُستهلك من قِبل منطق Phase 4 (المراقبة، الأداء، التذكيرات).
            تغييرها يؤثر على العمليات اللاحقة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* فترة تحديث KR */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" />
                فترة تحديث النتائج ذات القياس المباشر (أيام)
              </Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={updateInterval}
                onChange={(e) => setUpdateInterval(e.target.value)}
                className="tabular-nums"
              />
              {errors.updateInterval && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {errors.updateInterval}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                القيمة الافتراضية: {DEFAULT_SETTINGS.directKrUpdateIntervalDays} أيام. تُستخدم لتقييم تأخّر التحديث.
              </p>
            </div>

            {/* حد التأخر/التعثر */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Gauge className="size-3.5 text-muted-foreground" />
                حد الفصل بين حالتي التأخر والتعثر (نقطة مئوية)
              </Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="tabular-nums"
              />
              {errors.threshold && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {errors.threshold}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                القيمة الافتراضية: {DEFAULT_SETTINGS.delayedStalledThresholdPoints} نقطة. الفرق بين التقدّم الفعلي والمتوقّع.
              </p>
            </div>
          </div>

          <Separator />

          {/* فترة التذكير */}
          <div className="space-y-1.5 max-w-md">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Bell className="size-3.5 text-muted-foreground" />
              فترة تذكير التنبيه غير المقروء (أيام)
            </Label>
            <Input
              type="number"
              min={1}
              max={90}
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              className="tabular-nums"
            />
            {errors.reminder && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" />
                {errors.reminder}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground">
              القيمة الافتراضية: {DEFAULT_SETTINGS.unreadReminderDays} أيام. بعد هذه الفترة يُولّد تذكير للتنبيه غير المقروء.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ملاحظة */}
      <div className="rounded-md border border-info/30 bg-info/5 p-3 text-xs text-info">
        <strong>ملاحظة:</strong> القيم الحالية:
        فترة التحديث = {store.directKrUpdateIntervalDays} أيام،
        حد الأداء = {store.delayedStalledThresholdPoints} نقطة،
        فترة التذكير = {store.unreadReminderDays} أيام.
        القيم المحفوظة تُطبّق على العمليات اللاحقة (تقييم الأداء، توليد التنبيهات، التذكيرات).
      </div>
    </div>
  );
}
