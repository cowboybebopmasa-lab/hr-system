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
  Receipt,
  UserCog,
  Calculator,
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
  useSidebar,
} from "@/components/ui/sidebar";

const hrMenuItems = [
  { title: "従業員管理", href: "/employees", icon: Users },
  { title: "勤怠管理", href: "/attendance", icon: Clock },
  { title: "採用管理", href: "/recruitment", icon: Briefcase },
  { title: "評価管理", href: "/evaluation", icon: Star },
  { title: "AIマッチング", href: "/matching", icon: Sparkles },
  { title: "OCR読取", href: "/ocr", icon: ScanText },
];

const accountingMenuItems = [
  { title: "給与管理", href: "/payroll", icon: Wallet },
  { title: "契約管理", href: "/contracts", icon: FileText },
  { title: "経費管理", href: "/expenses", icon: Receipt },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderMenuItem = (item: { title: string; href: string; icon: React.ComponentType<{ className?: string }> }) => (
    <SidebarMenuItem key={item.href}>
      <SidebarMenuButton
        render={<Link href={item.href} onClick={handleNavClick} />}
        isActive={pathname.startsWith(item.href)}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={handleNavClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            HR
          </div>
          <span className="text-lg font-bold">HR System</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {/* ダッシュボード */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/dashboard" onClick={handleNavClick} />}
                  isActive={pathname === "/dashboard"}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>ダッシュボード</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 人事管理 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <UserCog className="h-3.5 w-3.5 mr-1.5" />
            人事管理
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {hrMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 会計管理 */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Calculator className="h-3.5 w-3.5 mr-1.5" />
            会計管理
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountingMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
