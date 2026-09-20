"use client";

import {
  Building2,
  Network,
  GitBranch,
  Landmark,
  FolderTree,
  Boxes,
  Square,
  Users,
} from "lucide-react";
import type { OrgUnitType } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * أيقونات أنواع الجهات التنظيمية
 * ===================================================================
 * أيقونة مميزة لكل نوع، مع لون خلفية متناسق.
 * يساعد المستخدم على فهم الهرمية بصرياً دون قراءة النص.
 */

const ICON_CONFIG: Record<
  OrgUnitType,
  { icon: typeof Building2; bgClass: string; textClass: string }
> = {
  institution: {
    icon: Landmark,
    bgClass: "bg-primary/15",
    textClass: "text-primary",
  },
  sector: {
    icon: Network,
    bgClass: "bg-info/15",
    textClass: "text-info",
  },
  branch: {
    icon: GitBranch,
    bgClass: "bg-success/15",
    textClass: "text-success",
  },
  directorate: {
    icon: Building2,
    bgClass: "bg-warning/15",
    textClass: "text-warning-foreground",
  },
  department: {
    icon: FolderTree,
    bgClass: "bg-primary/10",
    textClass: "text-primary",
  },
  division: {
    icon: Boxes,
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
  },
  unit: {
    icon: Square,
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
  },
  team: {
    icon: Users,
    bgClass: "bg-info/10",
    textClass: "text-info",
  },
};

export function OrgUnitTypeIcon({
  type,
  className,
  size = "sm",
}: {
  type: OrgUnitType;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const config = ICON_CONFIG[type];
  const Icon = config.icon;
  const sizeClass = {
    sm: "size-7",
    md: "size-9",
    lg: "size-12",
  }[size];
  const iconSize = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-6",
  }[size];

  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-md shrink-0",
        sizeClass,
        config.bgClass,
        className
      )}
      aria-hidden="true"
    >
      <Icon className={cn(iconSize, config.textClass)} />
    </span>
  );
}
