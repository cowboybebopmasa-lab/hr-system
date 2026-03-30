"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  Wallet,
  Briefcase,
  Star,
  FileText,
  Sparkles,
  ScanText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { title: "従業員管理", href: "/employees", icon: Users },
  { title: "勤怠管理", href: "/attendance", icon: Clock },
  { title: "給与管理", href: "/payroll", icon: Wallet },
  { title: "契約管理", href: "/contracts", icon: FileText },
  { title: "採用管理", href: "/recruitment", icon: Briefcase },
  { title: "AIマッチング", href: "/matching", icon: Sparkles },
  { title: "OCR読取", href: "/ocr", icon: ScanText },
  { title: "評価管理", href: "/evaluation", icon: Star },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            HR
          </div>
          <span className="text-lg font-bold">HR System</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>メニュー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={pathname.startsWith(item.href)}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
