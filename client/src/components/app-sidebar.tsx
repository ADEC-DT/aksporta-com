import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import * as LucideIcons from "lucide-react";
import { 
  LayoutDashboard, 
  Settings, 
  HelpCircle, 
  Shield, 
  LogOut, 
  Ticket,
  Monitor,
  Pin,
  PinOff,
  Calendar,
  type LucideIcon
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExternalService } from "@shared/schema";

function getIconComponent(name: string): LucideIcon {
  if (!name) return HelpCircle;
  const icon = (LucideIcons as Record<string, unknown>)[name];
  if (icon && typeof icon === "function") return icon as LucideIcon;
  return HelpCircle;
}

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    adminOnly: false,
  },
  {
    title: "Business Units",
    url: "/business-units",
    icon: getIconComponent("Building2"),
    adminOnly: true,
  },
  {
    title: "Customer DB",
    url: "/applications/customer-db",
    icon: getIconComponent("Contact"),
    adminOnly: false,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: getIconComponent("FolderKanban"),
    adminOnly: false,
  },
  {
    title: "HRMS",
    url: "/hr",
    icon: getIconComponent("Users"),
    adminOnly: true,
  },
  {
    title: "ERP",
    url: "/erp",
    icon: getIconComponent("DollarSign"),
    adminOnly: false,
  },
  {
    title: "Asset and Lease Management",
    url: "/asset-lease",
    icon: getIconComponent("Store"),
    adminOnly: true,
  },
  {
    title: "Equestrian",
    url: "/equestrian",
    icon: getIconComponent("CircleDot"),
    adminOnly: true,
  },
  {
    title: "Events & Entertainment",
    url: "/events",
    icon: getIconComponent("PartyPopper"),
    adminOnly: false,
  },
  {
    title: "Media & Marketing",
    url: "/media-marketing",
    icon: getIconComponent("Megaphone"),
    adminOnly: true,
  },
  {
    title: "DT Support",
    url: "/intranet",
    icon: getIconComponent("Headphones"),
    adminOnly: false,
  },
  {
    title: "Legal",
    url: "/legal",
    icon: getIconComponent("Scale"),
    adminOnly: true,
  },
  {
    title: "Performance & KPIs",
    url: "/performance-kpi",
    icon: getIconComponent("Target"),
    adminOnly: true,
  },
  {
    title: "OPS & FM",
    url: "/ops-fm",
    icon: getIconComponent("Wrench"),
    adminOnly: true,
  },
  {
    title: "IT & DT",
    url: "/it-dt",
    icon: getIconComponent("Cpu"),
    adminOnly: true,
  },
];

const secondaryNavItems = [
  {
    title: "Users Profile",
    url: "/settings",
    icon: getIconComponent("UserCircle"),
  },
  {
    title: "Settings",
    url: "/system-settings",
    icon: Settings,
    adminOnly: true,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isLoading: authLoading, logout, isLoggingOut } = useAuth();
  const { isPinned, togglePinned, state } = useSidebar();

  const { data: enabledServices } = useQuery<ExternalService[]>({
    queryKey: ["/api/services/enabled"],
    enabled: !!user,
  });

  const isAdmin = user?.role === "admin";

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || "User";
  };

  const getJobTitle = () => {
    if (user?.jobTitle) {
      return user.jobTitle;
    }
    return user?.role === "admin" ? "Administrator" : user?.role || "User";
  };

  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary flex-shrink-0">
              <span className="text-sm font-bold text-primary-foreground">U</span>
            </div>
            {state === "expanded" && (
              <span className="text-sm font-semibold text-sidebar-foreground font-outfit whitespace-nowrap">Unified Portal</span>
            )}
          </Link>
          {state === "expanded" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePinned}
              className="h-7 w-7 flex-shrink-0"
              data-testid="button-pin-sidebar"
              title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
            >
              {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/dashboard" || location === "/"}
                  className="h-9 px-3 rounded-md"
                  data-testid="nav-item-dashboard"
                  tooltip="Dashboard"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="text-sm">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {enabledServices?.map((service) => {
                const IconComponent = getIconComponent(service.icon || "");
                const isActive = location === service.url || 
                  (!!service.url && location.startsWith(service.url));
                return (
                  <SidebarMenuItem key={service.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-9 px-3 rounded-md"
                      data-testid={`nav-item-${service.name.toLowerCase().replace(/[()&]/g, '').replace(/\s+/g, '-')}`}
                      tooltip={service.name}
                    >
                      <Link href={service.url || "#"}>
                        <IconComponent className="h-4 w-4" />
                        <span className="text-sm">{service.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/admin"}
                    className="h-9 px-3 rounded-md"
                    data-testid="nav-item-admin"
                    tooltip="User Management"
                  >
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/admin/tickets"}
                    className="h-9 px-3 rounded-md"
                    data-testid="nav-item-admin-tickets"
                    tooltip="Ticket Management"
                  >
                    <Link href="/admin/tickets">
                      <Ticket className="h-4 w-4" />
                      <span className="text-sm">Ticket Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/it-dt" || location.startsWith("/it-dt")}
                    className="h-9 px-3 rounded-md"
                    data-testid="nav-item-it-dt"
                    tooltip="IT & DT"
                  >
                    <Link href="/it-dt">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">IT & DT</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/sprint-management"}
                    className="h-9 px-3 rounded-md"
                    data-testid="nav-item-sprint-management"
                    tooltip="Sprint Management"
                  >
                    <Link href="/sprint-management">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Sprint Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto pt-4">
          <SidebarGroupLabel className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems
                .filter((item) => !item.adminOnly || isAdmin)
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="h-9 px-3 rounded-md"
                    data-testid={`nav-item-${item.title.toLowerCase()}`}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-3 py-2.5">
        {authLoading ? (
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            {state === "expanded" && (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className="flex items-center justify-between gap-2">
            <Link 
              href="/settings" 
              className="flex items-center gap-2.5 flex-1 rounded-md p-1 -m-1 hover-elevate cursor-pointer"
              data-testid="link-user-profile"
            >
              <Avatar className="h-8 w-8 bg-primary/10 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">{getInitials()}</AvatarFallback>
              </Avatar>
              {state === "expanded" && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-tight">{getDisplayName()}</span>
                  <span className="text-[11px] text-muted-foreground">{getJobTitle()}</span>
                </div>
              )}
            </Link>
            {state === "expanded" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                disabled={isLoggingOut}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
