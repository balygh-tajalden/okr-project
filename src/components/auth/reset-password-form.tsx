"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  UserCircle,
} from "lucide-react";
import { resetPassword } from "@/lib/auth/service";
import { useAuthSession } from "@/lib/auth/session";
import { toast } from "sonner";

/**
 * ResetPasswordForm
 * ===================================================================
 * نموذج إعادة تعيين / تغيير كلمة المرور — يحفظ كلمة المرور فعلياً.
 * يكتشف الحالة تلقائياً:
 *  - جلسة نشطة: تغيير كلمة مرور المستخدم الحالي (من الملف الشخصي)
 *    ثم تسجيل الخروج لإعادة الدخول بكلمة المرور الجديدة.
 *  - بلا جلسة: مسار "نسيت كلمة المرور" — يحدد الحساب باسم المستخدم
 *    أو البريد الإلكتروني ثم يعيّن كلمة مرور جديدة.
 *
 * يقدم توجيه قوة كلمة المرور بصرياً واختبار تطابق كلمتي المرور.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const session = useAuthSession((s) => s.session);
  const clearSession = useAuthSession((s) => s.clearSession);
  const hasSession = !!session;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({
    identifier: false,
    password: false,
    confirm: false,
  });

  const strength = useMemo(() => computeStrength(password), [password]);

  const identifierError =
    !hasSession && touched.identifier && !identifier.trim()
      ? "اسم المستخدم أو البريد الإلكتروني مطلوب"
      : null;

  const passwordError =
    touched.password && password.length > 0 && password.length < 8
      ? "كلمة المرور يجب أن تكون 8 أحرف على الأقل"
      : null;

  const confirmError =
    touched.confirm && confirm.length > 0 && password !== confirm
      ? "كلمتا المرور غير متطابقتين"
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ identifier: true, password: true, confirm: true });

    if ((!hasSession && !identifier.trim()) || passwordError || confirmError) return;
    if (!password || !confirm) {
      setError("يرجى إدخال كلمة المرور وتأكيدها.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await resetPassword(
        hasSession ? null : identifier.trim(),
        password,
        confirm
      );
      if (result.success) {
        setSuccess(true);
        toast.success("تم تعيين كلمة المرور بنجاح");
        if (hasSession) {
          // تغيير كلمة المرور من جلسة نشطة → تسجيل خروج لإعادة الدخول
          clearSession();
        }
        setTimeout(() => router.replace("/login"), 1800);
      } else {
        setError(result.error ?? "تعذّر تعيين كلمة المرور. حاول مرة أخرى.");
      }
    });
  };

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-success/15 text-success">
            <CheckCircle2 className="size-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">
              تم تعيين كلمة المرور بنجاح
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة. سيتم تحويلك
              تلقائياً إلى صفحة الدخول...
            </p>
          </div>
        </div>
        <Button asChild variant="default" className="h-10 w-full">
          <Link href="/login">الانتقال إلى تسجيل الدخول</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {hasSession ? (
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-muted/30 px-3.5 py-3 text-sm text-muted-foreground">
          <UserCircle className="size-4 shrink-0" />
          <span>
            تغيير كلمة المرور للحساب:{" "}
            <span className="font-medium text-foreground">
              {session.user.fullName}
            </span>
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="identifier" className="text-sm font-medium">
            اسم المستخدم أو البريد الإلكتروني
          </Label>
          <Input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="username"
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
      )}

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          كلمة المرور الجديدة
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            aria-invalid={!!passwordError}
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
          <p className="text-xs text-destructive">{passwordError}</p>
        )}
        {/* مؤشر قوة كلمة المرور */}
        <PasswordStrengthMeter strength={strength} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm" className="text-sm font-medium">
          تأكيد كلمة المرور
        </Label>
        <div className="relative">
          <Input
            id="confirm"
            name="confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            aria-invalid={!!confirmError}
            placeholder="••••••••"
            className="h-10 pl-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowConfirm((s) => !s)}
            className="absolute left-1 top-1/2 size-8 -translate-y-1/2 text-muted-foreground hover:bg-transparent hover:text-foreground"
            aria-label={showConfirm ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        {confirmError && (
          <p className="text-xs text-destructive">{confirmError}</p>
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
            جاري الحفظ...
          </>
        ) : hasSession ? (
          "تغيير كلمة المرور"
        ) : (
          "تعيين كلمة المرور"
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

/** مؤشر قوة كلمة المرور — توجيه بصري بسيط */
function PasswordStrengthMeter({
  strength,
}: {
  strength: { score: 0 | 1 | 2 | 3 | 4; label: string; color: string };
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < strength.score ? strength.color : "bg-border"
            }`}
          />
        ))}
      </div>
      {strength.score > 0 && (
        <p className="text-[11px] text-muted-foreground">
          قوة كلمة المرور: <span className="font-medium">{strength.label}</span>
        </p>
      )}
    </div>
  );
}

/** حساب قوة كلمة المرور */
function computeStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;

  const labels = ["ضعيفة", "مقبولة", "جيدة", "قوية", "قوية جداً"];
  const colors = [
    "bg-destructive",
    "bg-warning",
    "bg-info",
    "bg-success",
    "bg-success",
  ];

  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    label: labels[score],
    color: colors[score],
  };
}
