"use client";

import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  RotateCcw,
  Send,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import type { ObjectiveReviewEvent } from "@/lib/data/phase3-types";
import type { User } from "@/lib/data/types";

/**
 * سجل المراجعات الزمني (Review History Timeline)
 * ===================================================================
 * يعرض كل أحداث المراجعة والإسناد بشكل زمني معكوس (الأحدث أولاً).
 */
export function ReviewHistoryTimeline({
  events,
  users,
}: {
  events: ObjectiveReviewEvent[];
  users: User[];
}) {
  if (events.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center">
        لا يوجد سجل مراجعات بعد.
      </div>
    );
  }

  const sorted = [...events].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <ol className="relative space-y-4 pr-6">
      {/* الخط العمودي */}
      <div
        className="absolute top-1 bottom-1 right-2 w-px bg-border"
        aria-hidden="true"
      />
      {sorted.map((event, i) => {
        const actor = users.find((u) => u.id === event.actorUserId);
        const target = event.targetUserId
          ? users.find((u) => u.id === event.targetUserId)
          : undefined;
        const Icon = iconFor(event.eventType);
        const color = colorFor(event.eventType);
        return (
          <li key={event.id} className="relative pr-4">
            <span
              className={cn(
                "absolute right-0 top-1 flex size-4 items-center justify-center rounded-full border-2 border-background",
                color
              )}
              aria-hidden="true"
            >
              <Icon className="size-2.5" />
            </span>
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-foreground">
                {labelFor(event.eventType)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {actor ? actor.fullName : "—"}
                {target && (
                  <span className="text-muted-foreground">
                    {" "}
                    ← {target.fullName}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {formatDateTime(event.at)}
              </div>
              {event.reason && (
                <div className="mt-1 rounded-md border border-border bg-muted/30 p-2 text-xs text-foreground">
                  <span className="text-muted-foreground">السبب: </span>
                  {event.reason}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function iconFor(type: ObjectiveReviewEvent["eventType"]) {
  switch (type) {
    case "submitted":
      return Send;
    case "approved":
      return CheckCircle2;
    case "returned":
      return RotateCcw;
    case "assigned":
      return UserPlus;
    case "accepted":
      return UserCheck;
    case "rejected":
      return UserX;
    default:
      return Clock;
  }
}

function colorFor(type: ObjectiveReviewEvent["eventType"]): string {
  switch (type) {
    case "submitted":
      return "bg-info text-info";
    case "approved":
      return "bg-success text-success";
    case "returned":
      return "bg-warning text-warning";
    case "assigned":
      return "bg-info text-info";
    case "accepted":
      return "bg-success text-success";
    case "rejected":
      return "bg-destructive text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function labelFor(type: ObjectiveReviewEvent["eventType"]): string {
  switch (type) {
    case "submitted":
      return "أُرسل للمراجعة";
    case "approved":
      return "تم الاعتماد";
    case "returned":
      return "أُعيد للتعديل";
    case "assigned":
      return "تم الإسناد";
    case "accepted":
      return "قُبل الهدف";
    case "rejected":
      return "رُفض الهدف";
    default:
      return type;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ar-SA-u-ca-gregory", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
