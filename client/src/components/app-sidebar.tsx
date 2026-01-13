import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LayoutDashboard, Users, Truck, Database, Settings, HelpCircle, Shield, LogOut, Ticket, Layers } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const mainNavItems = [
  {
    title: "NetSuite",
    url: "/netsuite",
    icon: Database,
    description: "Financial data & transactions",
  },
  {
    title: "HR",
    url: "/hr",
    icon: Users,
    description: "Employee management",
  },
  {
    title: "Livery",
    url: "/livery",
    icon: Truck,
    description: "Delivery tracking",
  },
  {
    title: "Other Systems",
    url: "/other-systems",
    icon: Layers,
    description: "Veterinary & Projects",
  },
];

const secondaryNavItems = [
  {
    title: "My Tickets",
    url: "/tickets",
    icon: Ticket,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Help",
    url: "/help",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, isLoading: authLoading, logout, isLoggingOut } = useAuth();

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

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <LayoutDashboard className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">Data Portal</span>
            <span className="text-xs text-muted-foreground">Integration Hub</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Applications
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = location === item.url || 
                  (location === "/" && item.url === "/netsuite") ||
                  (item.url === "/other-systems" && (location.startsWith("/veterinary") || location.startsWith("/projects")));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className="h-12 px-4"
                      data-testid={`nav-item-${item.title.toLowerCase()}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        </div>
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
            <SidebarGroupLabel className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/admin"}
                    className="px-4"
                    data-testid="nav-item-admin"
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
                    isActive={location === "/system-settings"}
                    className="px-4"
                    data-testid="nav-item-system-settings"
                  >
                    <Link href="/system-settings">
                      <Database className="h-4 w-4" />
                      <span>System Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/admin/tickets"}
                    className="px-4"
                    data-testid="nav-item-admin-tickets"
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
          <SidebarGroupLabel className="px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="px-4"
                    data-testid={`nav-item-${item.title.toLowerCase()}`}
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
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.username}</span>
                <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              disabled={isLoggingOut}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
