"use client";

import { cn } from "@/lib/utils";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * FilterBar — شريط أدوات للبحث والفلترة
 * يدعم: بحث نصي، فلترة (عنصر children)، زر إعادة تعيين
 */
interface FilterBarProps {
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  onReset?: () => void;
  hasActiveFilters?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "بحث...",
  filters,
  onReset,
  hasActiveFilters = false,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border bg-card p-3",
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pr-9"
          />
        </div>
        {filters && (
          <div className="flex flex-wrap items-center gap-2">{filters}</div>
        )}
        {onReset && hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground"
          >
            <X className="size-4" />
            إعادة تعيين
          </Button>
        )}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/** مكون فلتر مساعد (select بسيط) */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Filter className="size-3.5" />
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{`الكل`}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
