"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { ProtectedRoute } from "@/components/auth/protected-route-v2";
import {
  ObjectiveStatusBadge,
  ObjectiveTypeBadge,
  AssignmentResponseBadge,
} from "@/components/common/phase3-badges";
import { useCurrentInstitutionalUser } from "@/hooks/use-current-institutional-user";
import { useInstitutionalStore } from "@/lib/data/store";
import { usePhase3Store, getAssignmentsForUser } from "@/lib/data/phase3-store";
import { Inbox, Eye, Calendar, UserCircle } from "lucide-react";

export default function MyObjectivesPage() {
  return (
    <ProtectedRoute requiredPermissions={["individual_goals.view"]}>
      <MyObjectivesList />
    </ProtectedRoute>
  );
}

function MyObjectivesList() {
  const { user: currentUser } = useCurrentInstitutionalUser();
  const users = useInstitutionalStore((s) => s.users);
  const orgUnits = useInstitutionalStore((s) => s.orgUnits);
  const cycles = useInstitutionalStore((s) => s.cycles);
  const objectives = usePhase3Store((s) => s.objectives);
  const assignments = usePhase3Store((s) => s.assignments);

  // المهام المسندة للمستخدم الحالي
  const myAssignments = useMemo(() => {
    if (!currentUser) return [];
    return getAssignmentsForUser(currentUser.id);
  }, [currentUser, assignments]);

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "الرئيسية", href: "/app" },
          { label: "الأهداف المسندة إلي" },
        ]}
      />

      <PageHeader
        title="الأهداف المسندة إلي"
        description="الأهداف الفردية التي أسندها إليك مديرك. راجعها ثم اقبلها أو ارفضها."
      />

      <Card>
        <CardContent className="p-0">
          {myAssignments.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-6" />}
              title="لا توجد أهداف مسندة"
              description="لم يُسند إليك أي هدف فردي بعد."
              className="border-0"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-right">العنوان</TableHead>
                    <TableHead className="text-right">المُسند</TableHead>
                    <TableHead className="text-right">الدورة</TableHead>
                    <TableHead className="text-right">الفترة</TableHead>
                    <TableHead className="text-right">حالة الهدف</TableHead>
                    <TableHead className="text-right">حالة الاستجابة</TableHead>
                    <TableHead className="text-right">إجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAssignments.map((a) => {
                    const obj = objectives.find((o) => o.id === a.objectiveId);
                    if (!obj) return null;
                    const assigner = users.find((u) => u.id === a.assignerUserId);
                    const cycle = cycles.find((c) => c.id === obj.cycleId);
                    return (
                      <TableRow key={a.id} className="hover:bg-muted/20">
                        <TableCell>
                          <Link
                            href={`/app/my-objectives/${obj.id}`}
                            className="text-sm font-medium text-foreground hover:text-primary hover:underline line-clamp-1"
                          >
                            {obj.title}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <UserCircle className="size-3" />
                            {assigner?.fullName ?? "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {cycle?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground tabular-nums">
                          <div className="flex items-center gap-1">
                            <Calendar className="size-3" />
                            {formatShort(obj.startDate)} — {formatShort(obj.endDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ObjectiveStatusBadge status={obj.status} size="sm" />
                        </TableCell>
                        <TableCell>
                          <AssignmentResponseBadge response={a.response} size="sm" />
                        </TableCell>
                        <TableCell>
                          <Button
                            asChild
                            size="sm"
                            variant="default"
                            className="h-8 gap-1.5"
                          >
                            <Link href={`/app/my-objectives/${obj.id}`}>
                              <Eye className="size-3.5" />
                              عرض
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("ar-SA-u-ca-gregory", {
      year: "2-digit",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
