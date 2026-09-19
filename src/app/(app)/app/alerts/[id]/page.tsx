"use client";

import { use, useState, useTransition } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { EmptyState } from "@/components/common/empty-state";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import {
  usePhase4Store,
  getFeedbackForAlert,
} from "@/lib/data/phase4-store";
import {
  ALERT_TYPE_LABELS,
  type AlertType,
} from "@/lib/data/phase4-types";
import {
  Clock,
  UserCircle,
  Link as LinkIcon,
  Target,
  AlertTriangle,
  Send,
} from "lucide-react";
import { formatDateTimeAr, formatDateTime } from "@/lib/services/phase4-config";
import { toast } from "sonner";

export default function AlertDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <ProtectedRoute requiredPermissions={["alerts.view"]}>
      <AlertDetails alertId={id} />
    </ProtectedRoute>
  );
}

function AlertDetails({ alertId }: { alertId: string }) {
  const { user: currentUser } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const objectives = usePhase3Store((s) => s.objectives);
  const keyResults = usePhase3Store((s) => s.keyResults);
  const alert = usePhase4Store((s) => s.alerts.find((a) => a.id === alertId));
  const readStates = usePhase4Store((s) => s.alertReadStates);
  const feedback = usePhase4Store((s) => s.alertFeedback);
  const markAlertRead = usePhase4Store((s) => s.markAlertRead);
  const addAlertFeedback = usePhase4Store((s) => s.addAlertFeedback);

  const [feedbackNote, setFeedbackNote] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!alert || !currentUser) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="التنبيه غير موجود"
            description="ربما تم حذف التنبيه أو أن الرابط غير صحيح."
            action={
              <Button asChild variant="outline">
                <Link href="/app/alerts">العودة إلى التنبيهات</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  // التحقق من أن المستخدم مستلم
  if (!alert.recipientUserIds.includes(currentUser.id)) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            title="غير مصرّح"
            description="هذا التنبيه غير موجّه إليك."
            action={
              <Button asChild variant="outline">
                <Link href="/app/alerts">العودة إلى التنبيهات</Link>
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  // علّمه كمقروء تلقائياً عند العرض (إن لم يكن مقروءاً)
  const readState = readStates.find(
    (s) => s.alertId === alert.id && s.userId === currentUser.id
  );
  if (!readState?.isRead) {
    markAlertRead(alert.id, currentUser.id);
  }

  const sender = alert.senderUserId
    ? users.find((u) => u.id === alert.senderUserId)
    : undefined;
  const objective = alert.objectiveId
    ? objectives.find((o) => o.id === alert.objectiveId)
    : undefined;
  const kr = alert.keyResultId
    ? keyResults.find((k) => k.id === alert.keyResultId)
    : undefined;
  const feedbackItems = getFeedbackForAlert(alert.id);

  const handleAddFeedback = () => {
    if (!feedbackNote.trim()) {
      toast.error("اكتب ملاحظة المتابعة.");
      return;
    }
    startTransition(() => {
      addAlertFeedback(alert.id, currentUser.id, feedbackNote.trim());
      toast.success("تمت إضافة ملاحظة المتابعة.");
      setFeedbackNote("");
    });
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "التنبيهات", href: "/app/alerts" },
          { label: alert.title },
        ]}
      />

      <PageHeader
        title={alert.title}
        description={alert.message}
        badge={
          <StatusBadge variant="outline" size="sm">
            {ALERT_TYPE_LABELS[alert.type]}
          </StatusBadge>
        }
      />

      {/* تفاصيل التنبيه */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تفاصيل التنبيه</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoRow
            icon={<Clock className="size-3.5" />}
            label="تاريخ الإنشاء"
            value={formatDateTime(alert.createdAt)}
          />
          {sender && (
            <InfoRow
              icon={<UserCircle className="size-3.5" />}
              label="المرسِل"
              value={
                <div className="flex items-center gap-2">
                  <Avatar className="size-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {sender.initials}
                    </AvatarFallback>
                  </Avatar>
                  {sender.fullName}
                </div>
              }
            />
          )}
          {alert.reason && (
            <InfoRow
              icon={<AlertTriangle className="size-3.5" />}
              label="السبب"
              value={alert.reason}
            />
          )}
        </CardContent>
      </Card>

      {/* العنصر المرتبط */}
      {(objective || kr) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <LinkIcon className="size-4" />
              العنصر المرتبط
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {objective && (
              <div className="rounded-md border border-border p-3">
                <div className="text-[10px] text-muted-foreground mb-1">الهدف</div>
                <div className="flex items-center gap-2">
                  <Target className="size-4 text-primary shrink-0" />
                  <Link
                    href={`/app/objectives/${objective.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {objective.title}
                  </Link>
                </div>
              </div>
            )}
            {kr && (
              <div className="rounded-md border border-border p-3">
                <div className="text-[10px] text-muted-foreground mb-1">النتيجة الرئيسية</div>
                <div className="text-sm font-medium text-foreground">{kr.title}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ملاحظات المتابعة */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ملاحظات المتابعة</CardTitle>
          <CardDescription>
            وثّق الإجراءات المتخذة أو المتابعة. لا تُحوّل التنبيهات إلى نظام دردشة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedbackItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">لا توجد ملاحظات متابعة بعد.</p>
          ) : (
            <div className="space-y-2">
              {feedbackItems.map((f) => {
                const author = users.find((u) => u.id === f.userId);
                return (
                  <div
                    key={f.id}
                    className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2"
                  >
                    <Avatar className="size-6 mt-0.5">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                        {author?.initials ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="text-xs text-foreground">{f.note}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {author?.fullName ?? "—"} • {formatDateTimeAr(f.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium">إضافة ملاحظة متابعة</Label>
            <Textarea
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder="اكتب ملاحظتك هنا..."
              rows={2}
              className="resize-none text-sm"
            />
            <div className="flex items-center justify-end">
              <Button
                size="sm"
                onClick={handleAddFeedback}
                disabled={isPending || !feedbackNote.trim()}
              >
                <Send className="size-3.5" />
                {isPending ? "جاري الإرسال..." : "إضافة"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
    <div className="space-y-1">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}
