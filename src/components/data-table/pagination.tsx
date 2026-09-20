"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Pagination — ترقيم صفحات قابل لإعادة الاستخدام
 */
interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      dir="rtl"
    >
      <div className="text-xs text-muted-foreground">
        {total === 0
          ? "لا توجد نتائج"
          : `عرض ${start}–${end} من إجمالي ${total}`}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(1)}
          disabled={safePage === 1}
          aria-label="الصفحة الأولى"
        >
          <ChevronsRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 1}
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="size-4" />
        </Button>
        <span className="px-3 text-xs tabular-nums text-muted-foreground">
          صفحة {safePage} من {totalPages}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === totalPages}
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage === totalPages}
          aria-label="الصفحة الأخيرة"
        >
          <ChevronsLeft className="size-4" />
        </Button>
      </div>
    </div>
  );
}
