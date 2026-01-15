import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Search, 
  Calendar,
  LayoutGrid,
  List,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Filter,
  MoreHorizontal,
  Users,
  Target,
  Construction,
  RefreshCw,
  Lightbulb,
  Edit,
  Trash2,
  Stamp
} from "lucide-react";
import { format, addDays, subDays, differenceInDays } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CollaborationStamp, CollaborationStampMini } from "@/components/collaboration-stamp";
import type { CollaborationBlueprint, InsertBlueprint } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type ProjectStatus = "working_on_it" | "stuck" | "done" | "not_started" | "pending_review";

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  not_started: { label: "Not Started", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800", icon: Pause },
  working_on_it: { label: "Working on it", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", icon: Clock },
  stuck: { label: "Stuck", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", icon: AlertCircle },
  pending_review: { label: "Pending Review", color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30", icon: Target },
  done: { label: "Done", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle2 },
};

const teamMembers = [
  { id: "TM01", name: "Alice Chen", role: "Project Manager", initials: "AC", color: "bg-blue-500" },
  { id: "TM02", name: "Bob Martinez", role: "Developer", initials: "BM", color: "bg-green-500" },
  { id: "TM03", name: "Carol White", role: "Designer", initials: "CW", color: "bg-purple-500" },
  { id: "TM04", name: "David Kim", role: "Analyst", initials: "DK", color: "bg-orange-500" },
  { id: "TM05", name: "Emma Brown", role: "QA Engineer", initials: "EB", color: "bg-pink-500" },
];

const projects = [
  {
    id: "PRJ001",
    name: "Website Redesign",
    description: "Complete overhaul of the club's public website",
    status: "working_on_it" as ProjectStatus,
    priority: "high",
    startDate: subDays(new Date(), 30),
    endDate: addDays(new Date(), 45),
    progress: 35,
    owner: "TM01",
    members: ["TM01", "TM03", "TM02"],
    tasks: { total: 24, completed: 8 },
    group: "Digital Initiatives",
  },
  {
    id: "PRJ002",
    name: "Stable Management System",
    description: "Digital system for managing stable operations",
    status: "stuck" as ProjectStatus,
    priority: "high",
    startDate: subDays(new Date(), 60),
    endDate: addDays(new Date(), 15),
    progress: 60,
    owner: "TM02",
    members: ["TM02", "TM04"],
    tasks: { total: 18, completed: 11 },
    group: "Operations",
  },
  {
    id: "PRJ003",
    name: "Member Portal Enhancement",
    description: "Adding new features to member self-service portal",
    status: "done" as ProjectStatus,
    priority: "medium",
    startDate: subDays(new Date(), 90),
    endDate: subDays(new Date(), 10),
    progress: 100,
    owner: "TM01",
    members: ["TM01", "TM02", "TM05"],
    tasks: { total: 32, completed: 32 },
    group: "Digital Initiatives",
  },
  {
    id: "PRJ004",
    name: "Annual Event Planning",
    description: "Planning and coordination for yearly gala event",
    status: "working_on_it" as ProjectStatus,
    priority: "medium",
    startDate: subDays(new Date(), 14),
    endDate: addDays(new Date(), 90),
    progress: 15,
    owner: "TM04",
    members: ["TM04", "TM01"],
    tasks: { total: 28, completed: 4 },
    group: "Events",
  },
  {
    id: "PRJ005",
    name: "Financial System Integration",
    description: "Connecting NetSuite with internal reporting tools",
    status: "pending_review" as ProjectStatus,
    priority: "high",
    startDate: subDays(new Date(), 45),
    endDate: addDays(new Date(), 5),
    progress: 90,
    owner: "TM02",
    members: ["TM02", "TM04", "TM05"],
    tasks: { total: 15, completed: 14 },
    group: "Operations",
  },
  {
    id: "PRJ006",
    name: "Mobile App Development",
    description: "Native mobile app for members",
    status: "not_started" as ProjectStatus,
    priority: "low",
    startDate: addDays(new Date(), 30),
    endDate: addDays(new Date(), 180),
    progress: 0,
    owner: "TM03",
    members: ["TM03", "TM02"],
    tasks: { total: 0, completed: 0 },
    group: "Digital Initiatives",
  },
  {
    id: "PRJ007",
    name: "Safety Compliance Audit",
    description: "Annual safety compliance review and documentation",
    status: "working_on_it" as ProjectStatus,
    priority: "high",
    startDate: subDays(new Date(), 7),
    endDate: addDays(new Date(), 21),
    progress: 25,
    owner: "TM05",
    members: ["TM05", "TM04"],
    tasks: { total: 12, completed: 3 },
    group: "Operations",
  },
];

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const blueprintStatusOptions = [
  { value: "in_development", label: "In Development" },
  { value: "review", label: "In Review" },
  { value: "live", label: "Live" },
  { value: "enhancement_needed", label: "Enhancement Needed" },
];

const portalSections = [
  { name: "dashboard", title: "Dashboard" },
  { name: "erp", title: "ERP System" },
  { name: "hr", title: "HRMS" },
  { name: "customer-db", title: "Customer Database" },
  { name: "equestrian", title: "Equestrian Center" },
  { name: "asset-lease", title: "Asset & Lease" },
  { name: "events", title: "Events & Entertainment" },
  { name: "media-marketing", title: "Media & Marketing" },
  { name: "intranet", title: "Intranet & Support" },
  { name: "admin", title: "Admin Panel" },
];

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"board" | "list">("board");
  const [activeTab, setActiveTab] = useState("projects");
  const [blueprintDialogOpen, setBlueprintDialogOpen] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<CollaborationBlueprint | null>(null);
  const { toast } = useToast();

  const { data: blueprints = [], isLoading: blueprintsLoading } = useQuery<CollaborationBlueprint[]>({
    queryKey: ["/api/blueprints"],
  });

  const createBlueprintMutation = useMutation({
    mutationFn: (data: InsertBlueprint) => apiRequest("POST", "/api/blueprints", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blueprints"] });
      setBlueprintDialogOpen(false);
      setEditingBlueprint(null);
      toast({ title: "Blueprint created successfully" });
    },
    onError: () => toast({ title: "Failed to create blueprint", variant: "destructive" }),
  });

  const updateBlueprintMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertBlueprint> }) => 
      apiRequest("PATCH", `/api/blueprints/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blueprints"] });
      setBlueprintDialogOpen(false);
      setEditingBlueprint(null);
      toast({ title: "Blueprint updated successfully" });
    },
    onError: () => toast({ title: "Failed to update blueprint", variant: "destructive" }),
  });

  const deleteBlueprintMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/blueprints/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blueprints"] });
      toast({ title: "Blueprint deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete blueprint", variant: "destructive" }),
  });

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const projectsByGroup = filteredProjects.reduce((acc, project) => {
    if (!acc[project.group]) acc[project.group] = [];
    acc[project.group].push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  const projectsByStatus = filteredProjects.reduce((acc, project) => {
    if (!acc[project.status]) acc[project.status] = [];
    acc[project.status].push(project);
    return acc;
  }, {} as Record<string, typeof projects>);

  const getMember = (id: string) => teamMembers.find((m) => m.id === id);

  const getTimelineStatus = (project: typeof projects[0]) => {
    const today = new Date();
    const daysLeft = differenceInDays(new Date(project.endDate), today);
    if (project.status === "done") return { text: "Completed", color: "text-green-600" };
    if (daysLeft < 0) return { text: `${Math.abs(daysLeft)} days overdue`, color: "text-red-600" };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: "text-orange-600" };
    return { text: `${daysLeft} days left`, color: "text-muted-foreground" };
  };

  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "working_on_it").length,
    stuck: projects.filter((p) => p.status === "stuck").length,
    done: projects.filter((p) => p.status === "done").length,
  };

  const handleBlueprintSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const missingItemsRaw = formData.get("missingItems") as string;
    const ideasRaw = formData.get("ideas") as string;
    
    const etaDateVal = formData.get("etaDate") as string;
    const data: InsertBlueprint = {
      sectionName: formData.get("sectionName") as string,
      sectionTitle: formData.get("sectionTitle") as string,
      status: formData.get("status") as "in_development" | "review" | "live" | "enhancement_needed",
      etaDate: etaDateVal ? etaDateVal : null,
      notes: formData.get("notes") as string || null,
      missingItems: missingItemsRaw ? missingItemsRaw.split("\n").filter(Boolean) : [],
      ideas: ideasRaw ? ideasRaw.split("\n").filter(Boolean) : [],
    };

    if (editingBlueprint) {
      updateBlueprintMutation.mutate({ id: editingBlueprint.id, data });
    } else {
      createBlueprintMutation.mutate(data);
    }
  };

  const openEditDialog = (blueprint: CollaborationBlueprint) => {
    setEditingBlueprint(blueprint);
    setBlueprintDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/other-systems">
          <Button variant="ghost" size="icon" data-testid="button-back-other-systems">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground">Monday.com-style project management & Collaboration Stamps</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="projects" data-testid="tab-projects">
            <Target className="w-4 h-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="blueprints" data-testid="tab-blueprints">
            <Stamp className="w-4 h-4 mr-2" />
            Collaboration Stamps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <div className="flex items-end justify-end">
            <Button data-testid="button-new-project">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
        <Card data-testid="stat-total-projects">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-in-progress">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-stuck">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.stuck}</p>
              <p className="text-sm text-muted-foreground">Stuck</p>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-completed">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.done}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-projects"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border">
          <Button
            variant={viewMode === "board" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode("board")}
            data-testid="button-view-board"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode("list")}
            data-testid="button-view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewMode === "board" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Object.entries(statusConfig).map(([statusKey, statusData]) => {
            const projectsInStatus = projectsByStatus[statusKey] || [];
            return (
              <div key={statusKey} className="flex flex-col gap-3">
                <div className={`flex items-center gap-2 rounded-lg ${statusData.bgColor} px-3 py-2`}>
                  <statusData.icon className={`h-4 w-4 ${statusData.color}`} />
                  <span className={`text-sm font-medium ${statusData.color}`}>{statusData.label}</span>
                  <Badge variant="secondary" className="ml-auto">{projectsInStatus.length}</Badge>
                </div>
                <div className="space-y-3">
                  {projectsInStatus.map((project) => {
                    const owner = getMember(project.owner);
                    const timeline = getTimelineStatus(project);
                    return (
                      <Card key={project.id} className="hover-elevate cursor-pointer" data-testid={`card-project-${project.id}`}>
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium leading-tight">{project.name}</h3>
                            <Badge className={`${priorityColors[project.priority]} border-0 text-xs shrink-0`}>
                              {project.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-1.5" />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                              {project.members.slice(0, 3).map((memberId) => {
                                const member = getMember(memberId);
                                return member ? (
                                  <Avatar key={memberId} className="h-6 w-6 border-2 border-background">
                                    <AvatarFallback className={`text-[10px] text-white ${member.color}`}>
                                      {member.initials}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : null;
                              })}
                              {project.members.length > 3 && (
                                <Avatar className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="text-[10px] bg-muted">
                                    +{project.members.length - 3}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                            <span className={`text-xs ${timeline.color}`}>{timeline.text}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Project</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Owner</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Timeline</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Progress</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => {
                    const status = statusConfig[project.status];
                    const owner = getMember(project.owner);
                    const timeline = getTimelineStatus(project);
                    return (
                      <tr key={project.id} className="border-b hover:bg-muted/30 cursor-pointer" data-testid={`row-project-${project.id}`}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-xs text-muted-foreground">{project.group}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${status.bgColor} ${status.color} border-0`}>
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {owner && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className={`text-[10px] text-white ${owner.color}`}>
                                  {owner.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{owner.name}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <p>{format(new Date(project.startDate), "MMM d")} - {format(new Date(project.endDate), "MMM d, yyyy")}</p>
                            <p className={`text-xs ${timeline.color}`}>{timeline.text}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 min-w-[120px]">
                          <div className="space-y-1">
                            <Progress value={project.progress} className="h-1.5" />
                            <p className="text-xs text-muted-foreground">
                              {project.tasks.completed}/{project.tasks.total} tasks
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${priorityColors[project.priority]} border-0 capitalize`}>
                            {project.priority}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="blueprints" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Collaboration Stamps</h2>
              <p className="text-sm text-muted-foreground">
                Track development status, ETAs, and enhancement ideas across portal sections
              </p>
            </div>
            <Dialog open={blueprintDialogOpen} onOpenChange={(open) => {
              setBlueprintDialogOpen(open);
              if (!open) setEditingBlueprint(null);
            }}>
              <DialogTrigger asChild>
                <Button data-testid="button-new-blueprint">
                  <Plus className="mr-2 h-4 w-4" />
                  New Stamp
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingBlueprint ? "Edit" : "Create"} Collaboration Stamp</DialogTitle>
                  <DialogDescription>
                    Configure status, ETA, and notes for a portal section
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleBlueprintSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sectionName">Section ID</Label>
                      <Select name="sectionName" defaultValue={editingBlueprint?.sectionName || ""}>
                        <SelectTrigger data-testid="select-section-name">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {portalSections.map((section) => (
                            <SelectItem key={section.name} value={section.name}>
                              {section.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sectionTitle">Section Title</Label>
                      <Input
                        id="sectionTitle"
                        name="sectionTitle"
                        defaultValue={editingBlueprint?.sectionTitle || ""}
                        placeholder="e.g. Dashboard"
                        data-testid="input-section-title"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={editingBlueprint?.status || "in_development"}>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {blueprintStatusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="etaDate">ETA Date</Label>
                      <Input
                        id="etaDate"
                        name="etaDate"
                        type="date"
                        defaultValue={editingBlueprint?.etaDate ? format(new Date(editingBlueprint.etaDate), "yyyy-MM-dd") : ""}
                        data-testid="input-eta-date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      defaultValue={editingBlueprint?.notes || ""}
                      placeholder="Additional context or description"
                      rows={2}
                      data-testid="input-notes"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="missingItems">Missing Items (one per line)</Label>
                    <Textarea
                      id="missingItems"
                      name="missingItems"
                      defaultValue={editingBlueprint?.missingItems?.join("\n") || ""}
                      placeholder="API integration&#10;User authentication&#10;..."
                      rows={3}
                      data-testid="input-missing-items"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ideas">Enhancement Ideas (one per line)</Label>
                    <Textarea
                      id="ideas"
                      name="ideas"
                      defaultValue={editingBlueprint?.ideas?.join("\n") || ""}
                      placeholder="Add charts&#10;Mobile responsive&#10;..."
                      rows={3}
                      data-testid="input-ideas"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createBlueprintMutation.isPending || updateBlueprintMutation.isPending} data-testid="button-submit-blueprint">
                      {(createBlueprintMutation.isPending || updateBlueprintMutation.isPending) ? "Saving..." : (editingBlueprint ? "Update" : "Create")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {blueprintsLoading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : blueprints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Stamp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Collaboration Stamps Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create stamps to track development status across portal sections
                </p>
                <Button onClick={() => setBlueprintDialogOpen(true)} data-testid="button-create-first-stamp">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Stamp
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {blueprints.map((blueprint) => (
                <div key={blueprint.id} className="relative group">
                  <CollaborationStamp blueprint={blueprint} />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(blueprint)}
                      data-testid={`button-edit-${blueprint.sectionName}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this stamp?")) {
                          deleteBlueprintMutation.mutate(blueprint.id);
                        }
                      }}
                      data-testid={`button-delete-${blueprint.sectionName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
