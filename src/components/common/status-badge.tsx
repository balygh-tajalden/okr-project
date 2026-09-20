"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * StatusBadge
 * ===================================================================
 * شارة حالة موحّدة لاستخدامها في الجداول، البطاقات، الصفوف، إلخ.
 *
 * variants:
 * - success / warning / danger / info / neutral / outline
 */
const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium leading-5 transition-colors",
  {
    variants: {
      variant: {
        success: "bg-success/15 text-success border border-success/25",
        warning: "bg-warning/15 text-warning-foreground border border-warning/30",
        danger: "bg-destructive/10 text-destructive border border-destructive/25",
        info: "bg-info/15 text-info border border-info/25",
        neutral: "bg-muted text-muted-foreground border border-border",
        outline: "bg-transparent text-foreground border border-border",
      },
      size: {
        sm: "text-[10px] px-2 py-0.5 leading-4",
        md: "text-xs px-2.5 py-0.5 leading-5",
        lg: "text-sm px-3 py-1 leading-6",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

interface StatusBadgeProps
  extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  /** نقطة حالة صغيرة قبل النص */
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  children,
  variant,
  size,
  dot = false,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ variant, size }), className)}>
      {dot && (
        <span
          className="size-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

/** أدوات مساعدة لحالات OKR الشائعة */
export const OkrStatusBadges = {
  /** نشط */
  Active: ({ size }: { size?: "sm" | "md" | "lg" }) => (
    <StatusBadge variant="success" size={size} dot>
      نشط
    </StatusBadge>
  ),
  /** قيد التنفيذ */
  InProgress: ({ size }: { size?: "sm" | "md" | "lg" }) => (
    <StatusBadge variant="info" size={size} dot>
      قيد التنفيذ
    </StatusBadge>
  ),
  /** معلّق */
  Pending: ({ size }: { size?: "sm" | "md" | "lg" }) => (
    <StatusBadge variant="warning" size={size} dot>
      معلّق
    </StatusBadge>
  ),
  /** موقوف / مرفوض */
  Rejected: ({ size }: { size?: "sm" | "md" | "lg" }) => (
    <StatusBadge variant="danger" size={size} dot>
      مرفوض
    </StatusBadge>
  ),
  /** مكتمل */
  Completed: ({ size }: { size?: "sm" | "md" | "lg" }) => (
    <StatusBadge variant="neutral" size={size} dot>
      مكتمل
    </StatusBadge>
  ),
  /** قريباً (للأقسام القادمة) */
  Upcoming: ({ size }: { size?: "sm" | "md" | "lg" }) => (
    <StatusBadge variant="outline" size={size}>
      قريباً
    </StatusBadge>
  ),
};
