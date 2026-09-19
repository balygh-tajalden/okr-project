"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ErrorState
 * ===================================================================
 * مكوّن حالة خطأ عامة — يُستخدم عند فشل تحميل بيانات أو خطأ في الطلب.
 */
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** إن true: عرض كملء الشاشة بدل كتلة مدمجة */
  fullscreen?: boolean;
}

export function ErrorState({
  title = "تعذّر تحميل المحتوى",
  description = "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى، أو التواصل مع الدعم الفني إذا استمرت المشكلة.",
  onRetry,
  retryLabel = "إعادة المحاولة",
  fullscreen = false,
}: ErrorStateProps) {
  if (fullscreen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="max-w-md text-muted-foreground">{description}</p>
        </div>
        {onRetry && (
          <Button onClick={onRetry} variant="default" className="mt-2">
            <RefreshCw className="size-4" />
            {retryLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
          <RefreshCw className="size-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
