"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * SkeletonPage
 * ===================================================================
 * هيكل تحميل لصفحة كاملة — يُستخدم أثناء تحميل البيانات.
 * يقلّد البنية العامة لصفحة (عنوان، أدوات، بطاقات) لتقديم تجربة سلسة.
 */
interface SkeletonPageProps {
  /** عدد بطاقات المحتوى المراد عرضها */
  cards?: number;
  showHeader?: boolean;
}

export function SkeletonPage({
  cards = 3,
  showHeader = true,
}: SkeletonPageProps) {
  return (
    <div className="space-y-6 p-6">
      {showHeader && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-border p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <div className="pt-2">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** هيكل تحميل مدمج — لصف صف أو عنصر قائمة */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="size-9 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2.5 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  );
}
