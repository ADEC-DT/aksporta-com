import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  Users, 
  Building2,
  Contact, 
  Settings, 
  HelpCircle, 
  Shield, 
  LogOut, 
  Ticket,
  FolderKanban,
  DollarSign,
  Store,
  CircleDot,
  Headphones,
  PartyPopper,
  Megaphone,
  Scale,
  UserCircle,
  Target,
  Wrench,
  Cpu,
  Pin,
  PinOff
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
    icon: Building2,
    adminOnly: true,
  },
  {
    title: "Customer DB",
    url: "/applications/customer-db",
    icon: Contact,
    adminOnly: false,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
    adminOnly: false,
  },
  {
    title: "HRMS",
    url: "/hr",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "ERP",
    url: "/erp",
    icon: DollarSign,
    adminOnly: false,
  },
  {
    title: "Asset and Lease Management",
    url: "/asset-lease",
    icon: Store,
    adminOnly: true,
  },
  {
    title: "Equestrian",
    url: "/equestrian",
    icon: CircleDot,
    adminOnly: true,
  },
  {
    title: "Events & Entertainment",
    url: "/events",
    icon: PartyPopper,
    adminOnly: false,
  },
  {
    title: "Media & Marketing",
    url: "/media-marketing",
    icon: Megaphone,
    adminOnly: true,
  },
  {
    title: "Intranet & Support",
    url: "/intranet",
    icon: Headphones,
    adminOnly: false,
  },
  {
    title: "Legal",
    url: "/legal",
    icon: Scale,
    adminOnly: true,
  },
  {
    title: "Performance & KPIs",
    url: "/performance-kpi",
    icon: Target,
    adminOnly: true,
  },
  {
    title: "OPS & FM",
    url: "/ops-fm",
    icon: Wrench,
    adminOnly: true,
  },
  {
    title: "IT & DT",
    url: "/it-dt",
    icon: Cpu,
    adminOnly: true,
  },
];

const secondaryNavItems = [
  {
    title: "Users Profile",
    url: "/settings",
    icon: UserCircle,
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
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <span className="text-lg font-bold text-primary-foreground">U</span>
            </div>
            {state === "expanded" && (
              <span className="text-base font-semibold text-sidebar-foreground font-outfit whitespace-nowrap">Unified Portal</span>
            )}
          </Link>
          {state === "expanded" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePinned}
              className="h-7 w-7 flex-shrink-0"
              data-testid="button-pin-sidebar"
              title={isPinned ? "Открепить меню" : "Закрепить меню"}
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems
                .filter((item) => isAdmin || !item.adminOnly)
                .map((item) => {
                const isActive = location === item.url || 
                  (location === "/" && item.url === "/dashboard") ||
                  (item.url === "/applications/customer-db" && location.startsWith("/applications/customer-db")) ||
                  (item.url === "/erp" && location.startsWith("/erp")) ||
                  (item.url === "/veterinary" && location.startsWith("/veterinary")) ||
                  (item.url === "/projects" && location.startsWith("/projects"));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-10 px-3 rounded-lg"
                      data-testid={`nav-item-${item.title.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, '-')}`}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/admin"}
                    className="h-10 px-3 rounded-lg"
                    data-testid="nav-item-admin"
                    tooltip="User Management"
                  >
                    <Link href="/admin">
                      <Shield className="h-4 w-4" />
                      <span>User Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/admin/tickets"}
                    className="h-10 px-3 rounded-lg"
                    data-testid="nav-item-admin-tickets"
                    tooltip="Ticket Management"
                  >
                    <Link href="/admin/tickets">
                      <Ticket className="h-4 w-4" />
                      <span>Ticket Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                    className="h-10 px-3 rounded-lg"
                    data-testid={`nav-item-${item.title.toLowerCase()}`}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        {authLoading ? (
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            {state === "expanded" && (
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className="flex items-center justify-between gap-2">
            <Link 
              href="/settings" 
              className="flex items-center gap-3 flex-1 rounded-lg p-1 -m-1 hover-elevate cursor-pointer"
              data-testid="link-user-profile"
            >
              <Avatar className="h-9 w-9 bg-primary/10 flex-shrink-0">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">{getInitials()}</AvatarFallback>
              </Avatar>
              {state === "expanded" && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{getDisplayName()}</span>
                  <span className="text-xs text-muted-foreground">{getJobTitle()}</span>
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
