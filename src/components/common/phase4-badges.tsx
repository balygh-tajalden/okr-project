"use client";

import { StatusBadge } from "@/components/common/status-badge";
import {
  UPDATE_REQUEST_STATUS_LABELS,
  EVIDENCE_TYPE_LABELS,
  type UpdateRequestStatus,
  type Evidence as EvidenceItem,
} from "@/lib/data/phase4-types";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  FileText,
  Link as LinkIcon,
  StickyNote,
  Eye,
  CheckCircle2,
  RotateCcw,
  Paperclip,
} from "lucide-react";
import { formatDateTimeAr } from "@/lib/services/phase4-config";

/**
 * قائمة الأدلة (Evidence List)
 * ===================================================================
 * تعرض الأدلة المرفقة بطلب تحديث معيّن.
 */
export function EvidenceList({
  evidence,
  users,
}: {
  evidence: EvidenceItem[];
  users: { id: string; fullName: string; initials: string }[];
}) {
  if (evidence.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">لا توجد أدلة مرفقة.</p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {evidence.map((e) => {
        const uploader = users.find((u) => u.id === e.uploadedBy);
        const Icon = iconFor(e.type);
        return (
          <li
            key={e.id}
            className="flex items-start gap-2 rounded-md border border-border bg-muted/30 p-2"
          >
            <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="text-xs text-foreground break-words">
                {e.type === "link" ? (
                  <a
                    href={e.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {e.content}
                  </a>
                ) : (
                  e.content
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {EVIDENCE_TYPE_LABELS[e.type]}
                {e.fileName && ` • ${e.fileName}`}
                {e.fileSize && ` • ${formatFileSize(e.fileSize)}`}
                {uploader && ` • ${uploader.fullName}`}
                {` • ${formatDateTimeAr(e.uploadedAt)}`}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function iconFor(type: EvidenceItem["type"]) {
  switch (type) {
    case "note":
      return StickyNote;
    case "file":
      return FileText;
    case "link":
      return LinkIcon;
    default:
      return Paperclip;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ===================================================================
   شارة حالة طلب التحديث
   =================================================================== */
export function UpdateRequestStatusBadge({
  status,
  size = "sm",
}: {
  status: UpdateRequestStatus;
  size?: "sm" | "md" | "lg";
}) {
  switch (status) {
    case "pending_review":
      return (
        <StatusBadge variant="warning" size={size} dot>
          {UPDATE_REQUEST_STATUS_LABELS.pending_review}
        </StatusBadge>
      );
    case "approved":
      return (
        <StatusBadge variant="success" size={size} dot>
          {UPDATE_REQUEST_STATUS_LABELS.approved}
        </StatusBadge>
      );
    case "returned":
      return (
        <StatusBadge variant="danger" size={size} dot>
          {UPDATE_REQUEST_STATUS_LABELS.returned}
        </StatusBadge>
      );
  }
}

/* ===================================================================
   بطاقة طلب التحديث
   =================================================================== */
export function UpdateRequestCard({
  request,
  objectiveTitle,
  krTitle,
  submitter,
  reviewer,
  evidence,
  href,
}: {
  request: {
    id: string;
    submittedAt: string;
    submitterNotes: string;
    status: UpdateRequestStatus;
    reviewedAt?: string;
    approvedValue?: { kind: "numeric" | "binary"; numericValue?: number; binaryValue?: boolean };
    returnReason?: string;
  };
  objectiveTitle?: string;
  krTitle?: string;
  submitter?: { id: string; fullName: string; initials: string };
  reviewer?: { id: string; fullName: string; initials: string };
  evidence: EvidenceItem[];
  href?: string;
}) {
  const content = (
    <CardContent className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          {objectiveTitle && (
            <div className="text-xs text-muted-foreground">الهدف: {objectiveTitle}</div>
          )}
          {krTitle && (
            <div className="text-sm font-medium text-foreground line-clamp-1">
              {krTitle}
            </div>
          )}
        </div>
        <UpdateRequestStatusBadge status={request.status} />
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {request.submitterNotes}
      </div>

      {evidence.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Paperclip className="size-3" />
          {evidence.length} دليل مرفق
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {submitter && (
            <>
              <Avatar className="size-5">
                <AvatarFallback className="bg-primary/10 text-primary text-[9px] font-semibold">
                  {submitter.initials}
                </AvatarFallback>
              </Avatar>
              {submitter.fullName}
            </>
          )}
          <span>• {formatDateTimeAr(request.submittedAt)}</span>
        </div>
        {request.status === "approved" && request.approvedValue && (
          <div className="text-[11px] text-success flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            {request.approvedValue.kind === "numeric"
              ? `القيمة المعتمدة: ${request.approvedValue.numericValue}`
              : request.approvedValue.binaryValue
                ? "تحقق"
                : "لم يتحقق"}
          </div>
        )}
        {request.status === "returned" && request.returnReason && (
          <div className="text-[11px] text-destructive flex items-center gap-1 max-w-xs">
            <RotateCcw className="size-3 shrink-0" />
            <span className="line-clamp-1">{request.returnReason}</span>
          </div>
        )}
      </div>
    </CardContent>
  );

  if (href) {
    return (
      <a href={href} className="block hover:shadow-sm transition-shadow">
        <Card className="hover:border-primary/30 transition-colors">{content}</Card>
      </a>
    );
  }
  return <Card>{content}</Card>;
}
