"use client";

import { Sparkles } from "lucide-react";
import { EmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";

/**
 * UpcomingFeature
 * ===================================================================
 * صفحة/قسم مكان مؤقت للأقسام القادمة في الأطوار اللاحقة.
 *
 * - لا يحتوي على منطق أعمال فعلي (حسب قيود الطور الأول).
 * - يوضّح للمستخدم: ما هذا القسم، ومتى سيكون متاحاً.
 * - يحافظ على الانطباع المهيّأ للعرض.
 */
interface UpcomingFeatureProps {
  title: string;
  description: string;
  /** أي ميزات مختصرة متوقعة — تُعرض كقائمة */
  expectedFeatures?: string[];
  className?: string;
}

export function UpcomingFeature({
  title,
  description,
  expectedFeatures,
  className,
}: UpcomingFeatureProps) {
  return (
    <div className={className}>
      <EmptyState
        icon={<Sparkles className="size-6" />}
        title={title}
        description={description}
        action={
          <div className="flex flex-col items-center gap-3">
            <StatusBadge variant="outline">قريباً — الطور القادم</StatusBadge>
            {expectedFeatures && expectedFeatures.length > 0 && (
              <ul className="text-right text-sm text-muted-foreground space-y-1.5 mt-2">
                {expectedFeatures.map((f, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 justify-end"
                  >
                    <span>{f}</span>
                    <span
                      className="size-1.5 rounded-full bg-primary/50"
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        }
      />
    </div>
  );
}
