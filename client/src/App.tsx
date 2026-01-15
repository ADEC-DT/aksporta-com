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
import ERPDashboard from "@/pages/erp-dashboard";
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
import AssetLeasePage from "@/pages/asset-lease";
import CustomerDBPage from "@/pages/customer-db";
import CustomerProfilePage from "@/pages/customer-profile";
import LoginPage from "@/pages/login";
import { Loader2, Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  const sidebarStyle = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center justify-between gap-4 border-b border-border px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search systems, reports, or employees..." 
                  className="w-80 pl-10 bg-muted/50"
                  data-testid="input-global-search"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">2</span>
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Switch>
              <Route path="/">
                <Redirect to="/dashboard" />
              </Route>
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/erp" component={ERPDashboard} />
              <Route path="/netsuite" component={ERPDashboard} />
              <Route path="/hr" component={HRDashboard} />
              <Route path="/livery" component={LiveryDashboard} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/admin/tickets" component={AdminTicketsPage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/system-settings" component={SystemSettingsPage} />
              <Route path="/help" component={HelpCenterPage} />
              <Route path="/tickets" component={MyTicketsPage} />
              <Route path="/tickets/new" component={MyTicketsPage} />
              <Route path="/other-systems" component={OtherSystemsPage} />
              <Route path="/business-units" component={OtherSystemsPage} />
              <Route path="/asset-lease" component={AssetLeasePage} />
              <Route path="/equestrian" component={OtherSystemsPage} />
              <Route path="/intranet" component={HelpCenterPage} />
              <Route path="/veterinary" component={VeterinaryPage} />
              <Route path="/projects" component={ProjectsPage} />
              <Route path="/applications/customer-db" component={CustomerDBPage} />
              <Route path="/applications/customer-db/:id" component={CustomerProfilePage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
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
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
