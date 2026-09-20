"use client";

import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";
import { ChevronLeft } from "lucide-react";

/**
 * TreeView — عرض شجري محسّن مع خطوط ربط وهرمية بصرية واضحة
 * ===================================================================
 * مخصّص للهيكل التنظيمي. يدعم:
 * - توسيع/طي العقد مع أيقونة chevron واضحة
 * - خطوط ربط عمودية بين العقد (connector lines)
 * - تحديد عقدة (selected state) واضح
 * - أيقونات حسب نوع العقدة (عبر renderNode)
 * - تجاوب مع الجوال
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

  const renderTree = (ids: string[], depth: number, isLast: boolean[]): React.ReactNode => {
    return ids.map((id, index) => {
      const node = nodes.get(id);
      if (!node) return null;
      const hasChildren = node.childrenIds.length > 0;
      const isExpanded = expanded.has(id);
      const isSelected = selectedId === id;
      const isLastChild = index === ids.length - 1;

      return (
        <li
          key={id}
          role="treeitem"
          aria-expanded={hasChildren ? isExpanded : undefined}
          aria-selected={isSelected}
          className="relative"
        >
          {/* خطوط الربط العمودية — لكل مستوى عمق */}
          {depth > 0 && (
            <div className="absolute top-0 bottom-0 right-0 pointer-events-none" aria-hidden="true">
              {isLast.map((last, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute border-r border-border/60",
                    last ? "bottom-1/2" : "bottom-0"
                  )}
                  style={{ right: `${i * 24 + 16}px`, top: 0 }}
                />
              ))}
              {/* الخط الأفقي للعقدة الحالية */}
              <div
                className="absolute border-t border-border/60"
                style={{
                  right: `${(isLast.length - 1) * 24 + 16}px`,
                  top: "18px",
                  width: "16px",
                }}
              />
            </div>
          )}

          {/* العقدة نفسها */}
          <div
            className={cn(
              "flex items-center gap-1 rounded-md transition-colors cursor-pointer",
              isSelected
                ? "bg-primary/10 ring-1 ring-primary/20"
                : "hover:bg-muted/40"
            )}
            style={{ paddingInlineStart: `${depth * 24 + 4}px` }}
            onClick={() => onSelect?.(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.(id);
              }
            }}
            tabIndex={0}
          >
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(id);
                }}
                aria-label={isExpanded ? "طي" : "توسيع"}
                className="flex size-6 shrink-0 items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground rounded transition-colors"
              >
                <ChevronLeft
                  className={cn(
                    "size-4 transition-transform",
                    isExpanded && "-rotate-90"
                  )}
                />
              </button>
            ) : (
              <span className="size-6 shrink-0 flex items-center justify-center" aria-hidden="true">
                <span className="size-1.5 rounded-full bg-border" />
              </span>
            )}
            <div className="flex-1 min-w-0">
              {renderNode(node, { depth, isExpanded, toggle: () => toggle(id) })}
            </div>
          </div>

          {hasChildren && isExpanded && (
            <ul role="group" className="py-0.5">
              {renderTree(node.childrenIds, depth + 1, [...isLast, isLastChild])}
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
      {renderTree(rootIds, 0, [])}
    </ul>
  );
}

/** مساعد: يحوّل قائمة مسطّحة من العقد (بـ parentId) إلى بنية TreeView */
export function buildTree<T extends { id: string; parentId: string | null }>(
  items: T[]
): { nodes: Map<string, TreeNode<T>>; rootIds: string[] } {
  const nodes = new Map<string, TreeNode<T>>();
  const rootIds: string[] = [];
  for (const item of items) {
    nodes.set(item.id, { id: item.id, data: item, childrenIds: [] });
  }
  for (const item of items) {
    if (item.parentId && nodes.has(item.parentId)) {
      nodes.get(item.parentId)!.childrenIds.push(item.id);
    } else if (!item.parentId) {
      rootIds.push(item.id);
    }
  }
  return { nodes, rootIds };
}
