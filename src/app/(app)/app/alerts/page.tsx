"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { FilterBar, FilterSelect } from "@/components/data-table/filter-bar";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store } from "@/lib/data/phase3-store";
import { usePhase4Store } from "@/lib/data/phase4-store";
import {
  ALERT_TYPE_LABELS,
  type AlertType,
} from "@/lib/data/phase4-types";
import {
  Bell,
  Eye,
  Mail,
  MailOpen,
  AlertTriangle,
  Clock,
  TrendingDown,
  UserCircle,
} from "lucide-react";
import { formatDateTimeAr } from "@/lib/services/phase4-config";
import { toast } from "sonner";

export default function AlertsPage() {
  return (
    <ProtectedRoute requiredPermissions={["alerts.view"]}>
      <AlertsList />
    </ProtectedRoute>
  );
}

function AlertsList() {
  const { user: currentUser, can } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const objectives = usePhase3Store((s) => s.objectives);
  const keyResults = usePhase3Store((s) => s.keyResults);
  const alerts = usePhase4Store((s) => s.alerts);
  const readStates = usePhase4Store((s) => s.alertReadStates);
  const markAlertRead = usePhase4Store((s) => s.markAlertRead);
  const markAlertUnread = usePhase4Store((s) => s.markAlertUnread);

  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState("");

  const myAlerts = useMemo(() => {
    if (!currentUser) return [];
    return alerts
      .filter((a) => a.recipientUserIds.includes(currentUser.id))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [alerts, currentUser]);

  const filtered = useMemo(() => {
    let list = [...myAlerts];
    if (filter === "unread" && currentUser) {
      list = list.filter((a) => {
        const state = readStates.find(
          (s) => s.alertId === a.id && s.userId === currentUser.id
        );
        return !state?.isRead;
      });
    }
    if (typeFilter) {
      list = list.filter((a) => a.type === (typeFilter as AlertType));
    }
    return list;
  }, [myAlerts, filter, typeFilter, readStates, currentUser]);

  const unreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return myAlerts.filter((a) => {
      const state = readStates.find(
        (s) => s.alertId === a.id && s.userId === currentUser.id
      );
      return !state?.isRead;
    }).length;
  }, [myAlerts, readStates, currentUser]);

  const objectiveTitle = (id?: string) =>
    id ? objectives.find((o) => o.id === id)?.title : undefined;
  const krTitle = (id?: string) =>
    id ? keyResults.find((k) => k.id === id)?.title : undefined;
  const senderName = (id?: string) =>
    id ? users.find((u) => u.id === id)?.fullName : undefined;

  const handleMarkAllRead = () => {
    if (!currentUser) return;
    for (const a of myAlerts) {
      const state = readStates.find(
        (s) => s.alertId === a.id && s.userId === currentUser.id
      );
      if (!state?.isRead) {
        markAlertRead(a.id, currentUser.id);
      }
    }
    toast.success("تم تعليم كل التنبيهات كمقروءة.");
  };

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "التنبيهات والإشعارات" },
        ]}
      />

      <PageHeader
        title="التنبيهات والإشعارات"
        description={
          unreadCount > 0
            ? `لديك ${unreadCount} تنبيه غير مقروء.`
            : "لا توجد تنبيهات غير مقروءة."
        }
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllRead}>
              <MailOpen className="size-4" />
              تعليم الكل كمقروء
            </Button>
          ) : undefined
        }
      />

      <FilterBar
        searchValue=""
        onSearchChange={() => {}}
        searchPlaceholder=""
        hasActiveFilters={filter === "unread" || !!typeFilter}
        onReset={() => {
          setFilter("all");
          setTypeFilter("");
        }}
        filters={
          <>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={filter === "unread"}
                onChange={(e) => setFilter(e.target.checked ? "unread" : "all")}
                className="size-3.5"
              />
              غير المقروءة فقط
            </label>
            <FilterSelect
              label="النوع"
              value={typeFilter}
              onChange={setTypeFilter}
              options={(Object.keys(ALERT_TYPE_LABELS) as AlertType[]).map((t) => ({
                value: t,
                label: ALERT_TYPE_LABELS[t],
              }))}
            />
          </>
        }
      />

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Bell className="size-6" />}
              title="لا توجد تنبيهات"
              description={filter === "unread" ? "لا توجد تنبيهات غير مقروءة." : "لا توجد تنبيهات لك."}
              className="border-0"
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((alert) => {
                const state = currentUser
                  ? readStates.find(
                      (s) => s.alertId === alert.id && s.userId === currentUser.id
                    )
                  : undefined;
                const isRead = state?.isRead ?? false;
                const Icon = iconForType(alert.type);
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-4 transition-colors ${
                      !isRead ? "bg-primary/5" : "hover:bg-muted/20"
                    }`}
                  >
                    <div
                      className={`flex size-9 shrink-0 items-center justify-center rounded-md ${colorForType(
                        alert.type
                      )}`}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {alert.title}
                        </span>
                        <StatusBadge variant="outline" size="sm">
                          {ALERT_TYPE_LABELS[alert.type]}
                        </StatusBadge>
                        {!isRead && (
                          <span className="size-2 rounded-full bg-primary" aria-label="غير مقروء" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {alert.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDateTimeAr(alert.createdAt)}
                        </span>
                        {alert.senderUserId && (
                          <span className="flex items-center gap-1">
                            <UserCircle className="size-3" />
                            من: {senderName(alert.senderUserId)}
                          </span>
                        )}
                        {objectiveTitle(alert.objectiveId) && (
                          <span className="flex items-center gap-1">
                            الهدف: {objectiveTitle(alert.objectiveId)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="h-8 gap-1.5"
                      >
                        <Link href={`/app/alerts/${alert.id}`}>
                          <Eye className="size-3.5" />
                          عرض
                        </Link>
                      </Button>
                      {isRead ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() =>
                            currentUser && markAlertUnread(alert.id, currentUser.id)
                          }
                          aria-label="تعليم كغير مقروء"
                        >
                          <Mail className="size-3.5" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7"
                          onClick={() => {
                            if (currentUser) {
                              markAlertRead(alert.id, currentUser.id);
                              toast.success("تم التعليم كمقروء.");
                            }
                          }}
                          aria-label="تعليم كمقروء"
                        >
                          <MailOpen className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function iconForType(type: AlertType) {
  switch (type) {
    case "overdue_update":
      return Clock;
    case "performance_delayed":
      return TrendingDown;
    case "performance_stalled":
      return AlertTriangle;
    case "manual":
      return Bell;
  }
}

function colorForType(type: AlertType): string {
  switch (type) {
    case "overdue_update":
      return "bg-warning/15 text-warning";
    case "performance_delayed":
      return "bg-warning/15 text-warning";
    case "performance_stalled":
      return "bg-destructive/15 text-destructive";
    case "manual":
      return "bg-info/15 text-info";
  }
}
