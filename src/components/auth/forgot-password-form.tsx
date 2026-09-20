"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth/service";

/**
 * ForgotPasswordForm
 * ===================================================================
 * نموذج طلب استعادة كلمة المرور.
 *
 * - لا يكشف عن وجود البريد الإلكتروني (أفضل ممارسة أمنية).
 * - بعد الإرسال: عرض حالة نجاح تشرح أن تعليمات الاستعادة أُرسلت.
 */
export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  const emailError =
    touched && !email.trim()
      ? "البريد الإلكتروني مطلوب"
      : touched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? "صيغة بريد إلكتروني غير صحيحة"
        : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (emailError || !email.trim()) return;

    startTransition(async () => {
      await requestPasswordReset(email.trim());
      setSuccess(true);
    });
  };

  if (success) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">
              تم التحقق من الطلب
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              أكمل الآن عملية الاستعادة بتعيين كلمة مرور جديدة لحسابك.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild variant="default" className="h-10 w-full">
            <Link href="/reset-password">
              تعيين كلمة مرور جديدة
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" className="h-10 w-full">
            <Link href="/login">العودة إلى تسجيل الدخول</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          البريد الإلكتروني
        </Label>
        <div className="relative">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
            placeholder="name@example.org"
            className="h-10 pl-10"
          />
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        {emailError && (
          <p id="email-error" className="text-xs text-destructive">
            {emailError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-10 w-full"
        aria-busy={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            جاري التحقق...
          </>
        ) : (
          "متابعة"
        )}
      </Button>

      <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          العودة إلى تسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
