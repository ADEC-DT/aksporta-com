import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import FinanceDashboard from "@/pages/finance-dashboard";
import HRDashboard from "@/pages/hr-dashboard";
import LiveryDashboard from "@/pages/livery-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import SettingsPage from "@/pages/settings";
import SystemSettingsPage from "@/pages/system-settings";
import HelpCenterPage from "@/pages/help-center";
import MyTicketsPage from "@/pages/my-tickets";
import AdminTicketsPage from "@/pages/admin-tickets";
import OtherSystemsPage from "@/pages/other-systems";
import VeterinaryPage from "@/pages/veterinary";
import ProjectsPage from "@/pages/projects";
import ManageTagsPage from "@/pages/manage-tags";
import AssetLeasePage from "@/pages/asset-lease";
import BusinessUnitsPage from "@/pages/business-units";
import HRMSPage from "@/pages/hrms";
import EquestrianPage from "@/pages/equestrian";
import EventsPage from "@/pages/events";
import MediaMarketingPage from "@/pages/media-marketing";
import IntranetPage from "@/pages/intranet";
import LegalPage from "@/pages/legal";
import PerformanceKPIPage from "@/pages/performance-kpi";
import OpsFMPage from "@/pages/ops-fm";
import ITDTPage from "@/pages/it-dt";
import SprintManagementPage from "@/pages/sprint-management";
import ProjectGroupPage from "@/pages/project-group";
import CustomerDBPage from "@/pages/customer-db";
import CustomerProfilePage from "@/pages/customer-profile";
import DynamicServicePage from "@/pages/dynamic-service";
import StableMasterPage from "@/pages/stable-master";
import RequisitionsListPage from "@/pages/requisitions-list";
import RequisitionNewPage from "@/pages/requisition-new";
import RequisitionDetailPage from "@/pages/requisition-detail";
import LoginPage from "@/pages/login";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { NotificationReminder } from "@/components/notification-reminder";
import { MinimizedSectionsProvider, MinimizedTaskbar } from "@/components/expandable-section";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const ALLOWED_ROUTES_FOR_NON_ADMIN = [
  "/dashboard",
  "/applications/customer-db",
  "/finance",
  "/netsuite",
  "/events",
  "/intranet",
  "/projects",
  "/settings",
  "/my-tickets",
];

function ProtectedRoutes() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const isAdmin = user.role === "admin";
  const isAllowedRoute = location === "/" || ALLOWED_ROUTES_FOR_NON_ADMIN.some(
    (route) => location === route || location.startsWith(route + "/")
  );
  
  if (!isAdmin && !isAllowedRoute) {
    return <Redirect to="/dashboard" />;
  }

  const sidebarStyle = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "4.5rem",
  };

  return (
    <MinimizedSectionsProvider>
      <SidebarProvider style={sidebarStyle as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <SidebarInset className="flex flex-col flex-1 overflow-hidden">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search systems, reports, or employees..." 
                    className="w-80 pl-10 bg-muted/40 border-border/60"
                    data-testid="input-global-search"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationDropdown />
                <ThemeToggle />
              </div>
            </header>
            <main className="flex-1 overflow-auto bg-background">
              <Switch>
                <Route path="/">
                  <Redirect to="/dashboard" />
                </Route>
                <Route path="/dashboard" component={Dashboard} />
                <Route path="/finance/procurement/requisitions/new" component={RequisitionNewPage} />
                <Route path="/finance/procurement/requisitions/:id" component={RequisitionDetailPage} />
                <Route path="/finance/procurement/requisitions" component={RequisitionsListPage} />
                <Route path="/finance" component={FinanceDashboard} />
                <Route path="/erp" component={FinanceDashboard} />
                <Route path="/netsuite" component={FinanceDashboard} />
                <Route path="/hr" component={HRMSPage} />
                <Route path="/livery" component={LiveryDashboard} />
                <Route path="/admin" component={AdminDashboard} />
                <Route path="/admin/tickets" component={AdminTicketsPage} />
                <Route path="/settings" component={SettingsPage} />
                <Route path="/system-settings" component={SystemSettingsPage} />
                <Route path="/help" component={HelpCenterPage} />
                <Route path="/tickets" component={MyTicketsPage} />
                <Route path="/tickets/new" component={MyTicketsPage} />
                <Route path="/my-tickets" component={MyTicketsPage} />
                <Route path="/other-systems" component={OtherSystemsPage} />
                <Route path="/business-units" component={BusinessUnitsPage} />
                <Route path="/asset-lease" component={AssetLeasePage} />
                <Route path="/equestrian/overview" component={EquestrianPage} />
                <Route path="/equestrian/equinem" component={EquestrianPage} />
                <Route path="/equestrian/stable-assets/:rest*" component={StableMasterPage} />
                <Route path="/equestrian/stable-assets" component={StableMasterPage} />
                <Route path="/equestrian">
                  <Redirect to="/equestrian/overview" />
                </Route>
                <Route path="/events" component={EventsPage} />
                <Route path="/media-marketing" component={MediaMarketingPage} />
                <Route path="/intranet" component={IntranetPage} />
                <Route path="/legal" component={LegalPage} />
                <Route path="/performance-kpi" component={PerformanceKPIPage} />
                <Route path="/ops-fm" component={OpsFMPage} />
                <Route path="/it-dt" component={ITDTPage} />
                <Route path="/sprint-management" component={SprintManagementPage} />
                <Route path="/projects/group/:groupId" component={ProjectGroupPage} />
                <Route path="/projects/monday" component={ProjectsPage} />
                <Route path="/projects/tuesday" component={ProjectsPage} />
                <Route path="/projects">
                  <Redirect to="/projects/monday" />
                </Route>
                <Route path="/manage-tags" component={ManageTagsPage} />
                <Route path="/applications/customer-db" component={CustomerDBPage} />
                <Route path="/applications/customer-db/:id" component={CustomerProfilePage} />
                <Route path="/services/:id" component={DynamicServicePage} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </SidebarInset>
        </div>
        <MinimizedTaskbar />
      </SidebarProvider>
    </MinimizedSectionsProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="unified-portal-theme">
        <TooltipProvider>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route>
              <ProtectedRoutes />
            </Route>
          </Switch>
          <NotificationReminder />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
