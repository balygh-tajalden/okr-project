"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";

/**
 * FormDialog — نموذج منبثق قابل لإعادة الاستخدام
 * ===================================================================
 * نمط موحّد للنماذج القصيرة (Create/Edit) التي تستخدم modal بدلاً من صفحة كاملة.
 *
 * الميزات:
 * - دعم RTL صحيح (زر الإغلاق يسار، العنوان يمين)
 * - عنوان ووصف واضحان
 * - زر إلغاء + زر حفف رئيسي
 * - حالة تحميل أثناء الإرسال
 * - تعطيل الزر أثناء الإرسال
 * - سلوك إغلاق/إلغاء صحيح
 * - تجاوب مع الجوال (max-h + scroll)
 *
 * الاستخدام:
 *   <FormDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title="إنشاء دور"
 *     description="أدخل بيانات الدور الجديد"
 *     submitLabel="حفظ"
 *     onSubmit={handleSubmit}
 *     isSubmitting={isPending}
 *   >
 *     <RoleFormFields ... />
 *   </FormDialog>
 */
interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  /** عرض زر الإغلاق (X) — افتراضياً true */
  showCloseButton?: boolean;
  /** عرض النموذج — أوسع للنماذج متعددة الأقسام */
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "حفظ",
  cancelLabel = "إلغاء",
  onSubmit,
  isSubmitting = false,
  submitDisabled = false,
  showCloseButton = true,
  size = "md",
  children,
}: FormDialogProps) {
  const sizeClass = {
    sm: "sm:max-w-md",
    md: "sm:max-w-lg",
    lg: "sm:max-w-2xl",
  }[size];

  const handleOpenChange = (value: boolean) => {
    // منع الإغلاق أثناء الإرسال
    if (isSubmitting && !value) return;
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={sizeClass} showCloseButton={showCloseButton}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSubmitting && !submitDisabled) onSubmit();
          }}
          className="space-y-4"
        >
          {children}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              <X className="size-4" />
              {cancelLabel}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || submitDisabled}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSubmitting ? "جاري الحفظ..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
