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
  Scale
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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Business Units",
    url: "/business-units",
    icon: Building2,
  },
  {
    title: "Customer DB",
    url: "/applications/customer-db",
    icon: Contact,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FolderKanban,
  },
  {
    title: "HRMS",
    url: "/hr",
    icon: Users,
  },
  {
    title: "ERP",
    url: "/erp",
    icon: DollarSign,
  },
  {
    title: "Asset and Lease Management",
    url: "/asset-lease",
    icon: Store,
  },
  {
    title: "Equestrian",
    url: "/equestrian",
    icon: CircleDot,
  },
  {
    title: "Events & Entertainment",
    url: "/events",
    icon: PartyPopper,
  },
  {
    title: "Media & Marketing",
    url: "/media-marketing",
    icon: Megaphone,
  },
  {
    title: "Intranet & Support",
    url: "/intranet",
    icon: Headphones,
  },
  {
    title: "Legal",
    url: "/legal",
    icon: Scale,
  },
];

const secondaryNavItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
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

  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || "User";
  };

  const getRole = () => {
    return user?.role === "admin" ? "Head of Operations" : user?.role || "User";
  };

  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">U</span>
          </div>
          <span className="text-base font-semibold text-sidebar-foreground font-outfit">Unified Portal</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
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
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="h-10 px-3 rounded-lg"
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
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 bg-primary/10">
                <AvatarFallback className="text-xs bg-primary/20 text-primary">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{getDisplayName()}</span>
                <span className="text-xs text-muted-foreground">{getRole()}</span>
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
