"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
} from "lucide-react";
import { loginWithCredentials, getLoginFailureMessage } from "@/lib/auth/service";
import { useAuthSession } from "@/lib/auth/session";
import { toast } from "sonner";
import { DEMO_CREDENTIALS_SUMMARY, DEMO_PASSWORD } from "@/lib/demo/users";

/**
 * LoginForm
 * ===================================================================
 * نموذج تسجيل الدخول — يدعم:
 * - اسم المستخدم أو البريد الإلكتروني
 * - كلمة المرور مع إظهار/إخفاء
 * - التحقق من المدخلات
 * - تعطيل الزر أثناء الإرسال
 * - رسائل واضحة للأخطاء (بيانات خاطئة / حساب موقوف)
 * - إرسال عبر Enter
 * - رابط استعادة كلمة المرور
 * - إشارة مرجعية لحسابات العرض (مخفية افتراضياً)
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const startSession = useAuthSession((s) => s.startSession);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ identifier: boolean; password: boolean }>({
    identifier: false,
    password: false,
  });

  const redirectTarget = searchParams.get("redirect") || "/app";
  const disabledReason = searchParams.get("reason");

  // إن قُدّم سبب إيقاف من الـ ProtectedRoute، اعرضه أول مرة
  const initialError =
    disabledReason === "account_disabled"
      ? "تم إيقاف هذا الحساب. يرجى التواصل مع مدير النظام."
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true });

    if (!identifier.trim() || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await loginWithCredentials(identifier, password);
      if (result.success && result.user) {
        startSession(result.user);
        toast.success(`مرحباً، ${result.user.fullName.split(" ")[0]}`);
        router.replace(redirectTarget);
      } else {
        setError(
          result.failureReason
            ? getLoginFailureMessage(result.failureReason)
            : "تعذّر تسجيل الدخول. يرجى المحاولة لاحقاً."
        );
      }
    });
  };

  const identifierError =
    touched.identifier && !identifier.trim() ? "اسم المستخدم مطلوب" : null;
  const passwordError =
    touched.password && !password ? "كلمة المرور مطلوبة" : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {(error || initialError) && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="leading-relaxed">{error || initialError}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="identifier" className="text-sm font-medium">
          اسم المستخدم أو البريد الإلكتروني
        </Label>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          autoFocus
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, identifier: true }))}
          aria-invalid={!!identifierError}
          aria-describedby={identifierError ? "identifier-error" : undefined}
          placeholder="مثال: a.almansour"
          className="h-10"
        />
        {identifierError && (
          <p id="identifier-error" className="text-xs text-destructive">
            {identifierError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            كلمة المرور
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:underline"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
            placeholder="••••••••"
            className="h-10 pl-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute left-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        {passwordError && (
          <p id="password-error" className="text-xs text-destructive">
            {passwordError}
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
            جاري تسجيل الدخول...
          </>
        ) : (
          <>
            <LogIn className="size-4" />
            تسجيل الدخول
          </>
        )}
      </Button>

      {/* مساعدة المطور: حسابات العرض (مخفية) */}
      <details className="hidden group rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs">
        <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">
          حسابات تجريبية للعرض (للمطورين)
        </summary>
        <div className="mt-2 space-y-1.5">
          <p className="text-muted-foreground">
            كلمة المرور لجميع الحسابات:{" "}
            <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px]">
              {DEMO_PASSWORD}
            </code>
          </p>
          <ul className="space-y-1">
            {DEMO_CREDENTIALS_SUMMARY.map((c) => (
              <li
                key={c.username}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-foreground">{c.fullName}</span>
                <code className="rounded bg-background px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {c.username}
                </code>
              </li>
            ))}
          </ul>
        </div>
      </details>
    </form>
  );
}
