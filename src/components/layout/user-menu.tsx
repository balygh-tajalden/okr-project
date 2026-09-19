"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/auth/session";
import { useAuthSession } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/types";
import {
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { hasRole } from "@/lib/auth/permissions";
import { toast } from "sonner";

/**
 * UserMenu
 * ===================================================================
 * قائمة المستخدم في الترويسة — تعرض:
 * - الأفاتار / الأحرف الأولى من الاسم
 * - اسم المستخدم الكامل
 * - الدور
 * - روابط: الملف الشخصي، الإعدادات، إدارة النظام (لمن يملك الصلاحية)
 * - إجراء: تسجيل الخروج
 */
export function UserMenu() {
  const user = useCurrentUser();
  const clearSession = useAuthSession((s) => s.clearSession);
  const router = useRouter();

  if (!user) return null;

  const handleLogout = () => {
    clearSession();
    toast.success("تم تسجيل الخروج بنجاح");
    router.replace("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-auto gap-2 px-2 py-1.5 hover:bg-accent"
          aria-label="قائمة المستخدم"
        >
          <Avatar className="size-8 border border-border">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {user.initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-sm font-medium text-foreground">
              {user.fullName}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <ChevronDown className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64" sideOffset={8}>
        <DropdownMenuLabel className="flex flex-col gap-1.5 py-3">
          <span className="text-sm font-medium text-foreground">
            {user.fullName}
          </span>
          <span className="text-xs text-muted-foreground font-normal">
            {user.email}
          </span>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {ROLE_LABELS[user.role]}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {user.organizationalUnit}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/profile">
            <UserIcon className="size-4" />
            <span>ملفي الشخصي</span>
          </Link>
        </DropdownMenuItem>
        {hasRole(user, "system_admin") && (
          <DropdownMenuItem asChild>
            <Link href="/app/admin">
              <ShieldCheck className="size-4" />
              <span>إدارة النظام</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <Settings className="size-4" />
            <span>الإعدادات</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          <span>تسجيل الخروج</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
