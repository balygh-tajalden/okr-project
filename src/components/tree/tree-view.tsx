"use client";

import { cn } from "@/lib/utils";
import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronDown } from "lucide-react";

/**
 * TreeView — عرض شجري قابل للطي/التوسع
 * ===================================================================
 * مخصّص للهيكل التنظيمي. يدعم:
 * - توسيع/طي العقد
 * - تحديد عقدة
 * - عرض أزرار إجراءات لكل عقدة
 * - تمرير معرّفات الأبناء ديناميكياً
 */
export interface TreeNode<T> {
  id: string;
  data: T;
  childrenIds: string[];
}

interface TreeViewProps<T> {
  nodes: Map<string, TreeNode<T>>;
  rootIds: string[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  renderNode: (
    node: TreeNode<T>,
    ctx: { depth: number; isExpanded: boolean; toggle: () => void }
  ) => React.ReactNode;
  defaultExpandedIds?: string[];
  className?: string;
  /** عند true: وسّع كل العقد افتراضياً */
  defaultExpandAll?: boolean;
}

export function TreeView<T>({
  nodes,
  rootIds,
  selectedId,
  onSelect,
  renderNode,
  defaultExpandedIds = [],
  defaultExpandAll = false,
  className,
}: TreeViewProps<T>) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (defaultExpandAll) return new Set(nodes.keys());
    return new Set(defaultExpandedIds);
  });

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderTree = (ids: string[], depth: number): React.ReactNode => {
    return ids.map((id) => {
      const node = nodes.get(id);
      if (!node) return null;
      const hasChildren = node.childrenIds.length > 0;
      const isExpanded = expanded.has(id);
      const isSelected = selectedId === id;
      return (
        <li
          key={id}
          role="treeitem"
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={isSelected}
        >
          <div
            className={cn(
              "flex items-center gap-1 rounded-md transition-colors",
              selectedId === id && "bg-accent/40"
            )}
            style={{ paddingInlineStart: `${depth * 16 + 4}px` }}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-label={isExpanded ? "طي" : "توسيع"}
                className="flex size-6 shrink-0 items-center justify-center text-muted-foreground hover:bg-accent rounded"
              >
                <ChevronLeft
                  className={cn(
                    "size-4 transition-transform",
                    isExpanded && "-rotate-90"
                  )}
                />
              </button>
            ) : (
              <span className="size-6 shrink-0" aria-hidden />
            )}
            <button
              type="button"
              onClick={() => onSelect?.(id)}
              className="flex-1 text-right"
            >
              {renderNode(node, { depth, isExpanded, toggle: () => toggle(id) })}
            </button>
          </div>
          {hasChildren && isExpanded && (
            <ul role="group" className="py-0.5">
              {renderTree(node.childrenIds, depth + 1)}
            </ul>
          )}
        </li>
      );
    });
  };

  if (rootIds.length === 0) {
    return (
      <div className={cn("text-sm text-muted-foreground p-4 text-center", className)}>
        لا توجد عناصر للعرض.
      </div>
    );
  }

  return (
    <ul role="tree" className={cn("space-y-0.5", className)}>
      {renderTree(rootIds, 0)}
    </ul>
  );
}

/** مساعد: يحوّل قائمة مسطّحة من العقد (بـ parentId) إلى بنية TreeView */
export function buildTree<T extends { id: string; parentId: string | null }>(
  items: T[]
): { nodes: Map<string, TreeNode<T>>; rootIds: string[] } {
  const nodes = new Map<string, TreeNode<T>>();
  const rootIds: string[] = [];
  // إنشاء العقد
  for (const item of items) {
    nodes.set(item.id, { id: item.id, data: item, childrenIds: [] });
  }
  // بناء الروابط
  for (const item of items) {
    if (item.parentId && nodes.has(item.parentId)) {
      nodes.get(item.parentId)!.childrenIds.push(item.id);
    } else if (!item.parentId) {
      rootIds.push(item.id);
    }
  }
  return { nodes, rootIds };
}
