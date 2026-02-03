import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Search, 
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause,
  Filter,
  Users,
  Target,
  Edit,
  Trash2,
  Stamp,
  MessageSquare,
  Send,
  CalendarClock,
  User,
  X,
  GripVertical,
  Tag
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CollaborationStamp, CollaborationStampMini } from "@/components/collaboration-stamp";
import type { CollaborationBlueprint, InsertBlueprint, Project, ProjectWithAssignments, ProjectComment, ManagedUser } from "@shared/schema";
import { insertBlueprintSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

type ProjectStatus = "not_started" | "in_progress" | "on_hold" | "completed" | "cancelled";
type ProjectPriority = "low" | "medium" | "high" | "critical";

const statusConfig: Record<ProjectStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  not_started: { label: "Not Started", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-800", icon: Pause },
  in_progress: { label: "In Progress", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: Clock },
  on_hold: { label: "On Hold", color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/30", icon: AlertCircle },
  completed: { label: "Completed", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30", icon: X },
};

const priorityColors: Record<ProjectPriority, string> = {
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const blueprintStatusOptions = [
  { value: "in_development", label: "In Development" },
  { value: "review", label: "In Review" },
  { value: "live", label: "Live" },
  { value: "enhancement_needed", label: "Enhancement Needed" },
];

const blueprintFormSchema = insertBlueprintSchema.extend({
  sectionName: z.string().min(1, "Section is required"),
  sectionTitle: z.string().min(1, "Title is required"),
  missingItems: z.string().optional(),
  ideas: z.string().optional(),
});

type BlueprintFormValues = z.infer<typeof blueprintFormSchema>;

const portalSections = [
  { name: "dashboard", title: "Dashboard" },
  { name: "business_units", title: "Business Units" },
  { name: "erp", title: "ERP System" },
  { name: "hrms", title: "HRMS" },
  { name: "customer_db", title: "Customer Database" },
  { name: "equestrian", title: "Equestrian Center" },
  { name: "asset_lease", title: "Asset & Lease" },
  { name: "events", title: "Events & Entertainment" },
  { name: "media_marketing", title: "Media & Marketing" },
  { name: "intranet", title: "DT Support" },
  { name: "projects", title: "Projects" },
  { name: "legal", title: "Legal & Compliance" },
  { name: "performance_kpi", title: "Performance & KPIs" },
  { name: "ops_fm", title: "OPS & FM" },
  { name: "it_dt", title: "IT & DT" },
];

type ProjectTag = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
};

const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "on_hold", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  tags: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  deadline: z.string().optional(),
  blocked: z.boolean().optional(),
  blockedBy: z.string().optional(),
  blockedReason: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

type SimpleUser = {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
};

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<"all" | "mine">("all");
  const [activeTab, setActiveTab] = useState("projects");
  const [blueprintDialogOpen, setBlueprintDialogOpen] = useState(false);
  const [editingBlueprint, setEditingBlueprint] = useState<CollaborationBlueprint | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithAssignments | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectWithAssignments | null>(null);
  const [projectDetailOpen, setProjectDetailOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [deadlineChangeMode, setDeadlineChangeMode] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [deadlineJustification, setDeadlineJustification] = useState("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUsersToAssign, setSelectedUsersToAssign] = useState<string[]>([]);
  const [initialAssignee, setInitialAssignee] = useState<string>("");
  const { toast } = useToast();

  // Current user
  const { data: currentUser } = useQuery<ManagedUser>({
    queryKey: ["/api/auth/user"],
  });

  // All users for assignment
  const { data: allUsers = [] } = useQuery<SimpleUser[]>({
    queryKey: ["/api/users/list"],
  });

  // Projects query
  const { data: projectsData = [], isLoading: projectsLoading } = useQuery<ProjectWithAssignments[]>({
    queryKey: ["/api/projects", viewFilter],
    queryFn: async () => {
      const url = viewFilter === "mine" ? "/api/projects?mine=true" : "/api/projects";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  // Blueprints query
  const { data: blueprints = [], isLoading: blueprintsLoading } = useQuery<CollaborationBlueprint[]>({
    queryKey: ["/api/blueprints"],
  });

  // Project tags query
  const { data: projectTags = [] } = useQuery<ProjectTag[]>({
    queryKey: ["/api/project-tags"],
  });

  // Project mutations
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectFormValues) => apiRequest("POST", "/api/projects", data),
    onSuccess: async (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      
      // If an initial assignee was selected, assign them to the project
      if (initialAssignee && response?.id) {
        try {
          await apiRequest("POST", `/api/projects/${response.id}/assignments`, { userId: initialAssignee });
        } catch (error) {
          console.error("Failed to assign user:", error);
        }
      }
      
      setProjectDialogOpen(false);
      setInitialAssignee("");
      toast({ title: "Task created successfully" });
    },
    onError: () => toast({ title: "Failed to create task", variant: "destructive" }),
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectFormValues> }) =>
      apiRequest("PATCH", `/api/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setProjectDialogOpen(false);
      setEditingProject(null);
      toast({ title: "Project updated successfully" });
    },
    onError: () => toast({ title: "Failed to update project", variant: "destructive" }),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setProjectDetailOpen(false);
      setSelectedProject(null);
      toast({ title: "Project deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete project", variant: "destructive" }),
  });

  // Assignment mutations
  const addAssignmentMutation = useMutation({
    mutationFn: ({ projectId, userId }: { projectId: string; userId: string }) =>
      apiRequest("POST", `/api/projects/${projectId}/assignments`, { userId, role: "member" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      if (selectedProject) {
        refetchProjectDetail(selectedProject.id);
      }
    },
    onError: () => toast({ title: "Failed to add assignment", variant: "destructive" }),
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: ({ projectId, assignmentId }: { projectId: string; assignmentId: string }) =>
      apiRequest("DELETE", `/api/projects/${projectId}/assignments/${assignmentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      if (selectedProject) {
        refetchProjectDetail(selectedProject.id);
      }
    },
    onError: () => toast({ title: "Failed to remove assignment", variant: "destructive" }),
  });

  // Comment mutation
  const addCommentMutation = useMutation({
    mutationFn: ({ projectId, content, type, oldDeadline, newDeadline }: { 
      projectId: string; 
      content: string; 
      type?: string;
      oldDeadline?: string;
      newDeadline?: string;
    }) =>
      apiRequest("POST", `/api/projects/${projectId}/comments`, { content, type, oldDeadline, newDeadline }),
    onSuccess: () => {
      if (selectedProject) {
        refetchProjectDetail(selectedProject.id);
      }
      setNewComment("");
      setDeadlineChangeMode(false);
      setNewDeadline("");
      setDeadlineJustification("");
      toast({ title: "Comment added successfully" });
    },
    onError: () => toast({ title: "Failed to add comment", variant: "destructive" }),
  });

  // Blueprint mutations
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

  const refetchProjectDetail = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data);
      }
    } catch (error) {
      console.error("Failed to refetch project detail:", error);
    }
  };

  // Filter projects - only apply search filter (status is shown in kanban columns)
  const filteredProjects = projectsData.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const stats = {
    total: projectsData.length,
    inProgress: projectsData.filter((p) => p.status === "in_progress").length,
    onHold: projectsData.filter((p) => p.status === "on_hold").length,
    completed: projectsData.filter((p) => p.status === "completed").length,
  };

  // Project form
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "not_started",
      priority: "medium",
      tags: [],
      startDate: "",
      deadline: "",
      blocked: false,
      blockedBy: "",
      blockedReason: "",
    },
  });

  // Blueprint form
  const blueprintForm = useForm<BlueprintFormValues>({
    resolver: zodResolver(blueprintFormSchema),
    defaultValues: {
      sectionName: "",
      sectionTitle: "",
      status: "in_development",
      etaDate: "",
      notes: "",
      missingItems: "",
      ideas: "",
    },
  });

  useEffect(() => {
    if (editingProject) {
      projectForm.reset({
        name: editingProject.name,
        description: editingProject.description || "",
        status: editingProject.status as ProjectStatus,
        priority: editingProject.priority as ProjectPriority,
        tags: (editingProject as any).tags || [],
        startDate: editingProject.startDate || "",
        deadline: editingProject.deadline || "",
        blocked: (editingProject as any).blocked || false,
        blockedBy: (editingProject as any).blockedBy || "",
        blockedReason: (editingProject as any).blockedReason || "",
      });
    } else {
      projectForm.reset({
        name: "",
        description: "",
        status: "not_started",
        priority: "medium",
        tags: [],
        startDate: "",
        deadline: "",
        blocked: false,
        blockedBy: "",
        blockedReason: "",
      });
    }
  }, [editingProject, projectDialogOpen]);

  useEffect(() => {
    if (editingBlueprint) {
      blueprintForm.reset({
        sectionName: editingBlueprint.sectionName,
        sectionTitle: editingBlueprint.sectionTitle,
        status: editingBlueprint.status as "in_development" | "review" | "live" | "enhancement_needed",
        etaDate: editingBlueprint.etaDate ? format(new Date(editingBlueprint.etaDate), "yyyy-MM-dd") : "",
        notes: editingBlueprint.notes || "",
        missingItems: editingBlueprint.missingItems?.join("\n") || "",
        ideas: editingBlueprint.ideas?.join("\n") || "",
      });
    } else {
      blueprintForm.reset({
        sectionName: "",
        sectionTitle: "",
        status: "in_development",
        etaDate: "",
        notes: "",
        missingItems: "",
        ideas: "",
      });
    }
  }, [editingBlueprint, blueprintDialogOpen]);

  const handleProjectSubmit = (values: ProjectFormValues) => {
    if (editingProject) {
      updateProjectMutation.mutate({ id: editingProject.id, data: values });
    } else {
      createProjectMutation.mutate(values);
    }
  };

  const handleBlueprintSubmit = (values: BlueprintFormValues) => {
    const data: InsertBlueprint = {
      sectionName: values.sectionName,
      sectionTitle: values.sectionTitle,
      status: values.status,
      etaDate: values.etaDate || null,
      notes: values.notes || null,
      missingItems: values.missingItems ? values.missingItems.split("\n").filter(Boolean) : [],
      ideas: values.ideas ? values.ideas.split("\n").filter(Boolean) : [],
    };

    if (editingBlueprint) {
      updateBlueprintMutation.mutate({ id: editingBlueprint.id, data });
    } else {
      createBlueprintMutation.mutate(data);
    }
  };

  const handleAddComment = () => {
    if (!selectedProject || !newComment.trim()) return;
    addCommentMutation.mutate({ projectId: selectedProject.id, content: newComment.trim(), type: "comment" });
  };

  const handleDeadlineChange = () => {
    if (!selectedProject || !newDeadline || !deadlineJustification.trim()) {
      toast({ title: "Please provide a new deadline and justification", variant: "destructive" });
      return;
    }

    // Add comment for deadline change
    addCommentMutation.mutate({
      projectId: selectedProject.id,
      content: deadlineJustification.trim(),
      type: "deadline_change",
      oldDeadline: selectedProject.deadline || undefined,
      newDeadline: newDeadline,
    });

    // Update project deadline
    updateProjectMutation.mutate({
      id: selectedProject.id,
      data: { deadline: newDeadline },
    });
  };

  const handleAssignUsers = () => {
    if (!selectedProject || selectedUsersToAssign.length === 0) return;
    
    selectedUsersToAssign.forEach((userId) => {
      addAssignmentMutation.mutate({ projectId: selectedProject.id, userId });
    });
    
    setAssignDialogOpen(false);
    setSelectedUsersToAssign([]);
    toast({ title: "Users assigned successfully" });
  };

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    
    const newStatus = destination.droppableId as ProjectStatus;
    
    apiRequest("PATCH", `/api/projects/${draggableId}`, { status: newStatus })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", "all"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", "mine"] });
        toast({ title: "Project status updated" });
      })
      .catch(() => {
        toast({ title: "Failed to update status", variant: "destructive" });
      });
  };

  const openAssignDialog = () => {
    setSelectedUsersToAssign([]);
    setAssignDialogOpen(true);
  };

  const openProjectDetail = async (project: ProjectWithAssignments) => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data);
        setProjectDetailOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch project detail:", error);
    }
  };

  const getTimelineStatus = (deadline: string | null | undefined) => {
    if (!deadline) return { text: "No deadline", color: "text-muted-foreground" };
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: `${Math.abs(daysLeft)} days overdue`, color: "text-red-600" };
    if (daysLeft <= 7) return { text: `${daysLeft} days left`, color: "text-orange-600" };
    return { text: `${daysLeft} days left`, color: "text-muted-foreground" };
  };

  const getUserInitials = (user: SimpleUser | ManagedUser | undefined) => {
    if (!user) return "??";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const getUserName = (user: SimpleUser | ManagedUser | undefined) => {
    if (!user) return "Unknown";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  const getAssignedUsers = (project: ProjectWithAssignments) => {
    return project.assignments || [];
  };

  const getUnassignedUsers = () => {
    if (!selectedProject) return allUsers;
    const assignedIds = selectedProject.assignments.map(a => a.userId);
    return allUsers.filter(u => !assignedIds.includes(u.id));
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
          <h1 className="text-2xl font-semibold font-outfit">Task Management</h1>
          <p className="text-muted-foreground">Manage tasks, assignments, and deadlines</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="projects" data-testid="tab-projects">
            <Target className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Actions Row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewFilter === "all" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setViewFilter("all")}
                data-testid="button-view-all"
              >
                All Tasks
              </Button>
              <Button
                variant={viewFilter === "mine" ? "secondary" : "outline"}
                size="sm"
                onClick={() => setViewFilter("mine")}
                data-testid="button-view-mine"
              >
                <User className="h-4 w-4 mr-1" />
                My Tasks
              </Button>
              <Link href="/manage-tags">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-manage-tags"
                >
                  <Tag className="h-4 w-4 mr-1" />
                  Manage Tags
                </Button>
              </Link>
            </div>
            <Button 
              onClick={() => {
                setEditingProject(null);
                setProjectDialogOpen(true);
              }}
              data-testid="button-new-project"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card data-testid="stat-total-projects">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-in-progress">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-on-hold">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.onHold}</p>
                  <p className="text-sm text-muted-foreground">On Hold</p>
                </div>
              </CardContent>
            </Card>
            <Card data-testid="stat-completed">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
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
          </div>

          {/* Projects View */}
          {projectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : projectsData.length === 0 ? (
            <Card className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {viewFilter === "mine" 
                  ? "You don't have any assigned projects yet." 
                  : "Create your first project to get started."}
              </p>
              <Button onClick={() => setProjectDialogOpen(true)} data-testid="button-create-first-project">
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </Card>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {(Object.entries(statusConfig) as [ProjectStatus, typeof statusConfig[ProjectStatus]][]).map(([statusKey, config]) => {
                  const columnProjects = filteredProjects.filter(p => p.status === statusKey);
                  return (
                    <div key={statusKey} className="flex-shrink-0 w-[300px]">
                      <div className={`${config.bgColor} rounded-t-lg p-3 flex items-center gap-2`}>
                        <config.icon className={`h-4 w-4 ${config.color}`} />
                        <span className={`font-medium text-sm ${config.color}`}>{config.label}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {columnProjects.length}
                        </Badge>
                      </div>
                      <Droppable droppableId={statusKey}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[400px] p-2 space-y-2 border border-t-0 rounded-b-lg ${
                              snapshot.isDraggingOver ? "bg-muted/50" : "bg-background"
                            }`}
                          >
                            {columnProjects.map((project, index) => {
                              const timeline = getTimelineStatus(project.deadline);
                              const assignedUsers = getAssignedUsers(project);
                              
                              return (
                                <Draggable key={project.id} draggableId={project.id} index={index}>
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={`cursor-pointer ${snapshot.isDragging ? "shadow-lg" : "hover-elevate"}`}
                                      onClick={() => openProjectDetail(project)}
                                      data-testid={`kanban-card-${project.id}`}
                                    >
                                      <CardContent className="p-3 space-y-2">
                                        <div className="flex items-start gap-2">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="mt-1 text-muted-foreground hover:text-foreground"
                                          >
                                            <GripVertical className="h-4 w-4" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                              <h3 className="font-medium text-sm leading-tight truncate">{project.name}</h3>
                                              <Badge className={`${priorityColors[project.priority as ProjectPriority]} border-0 text-[10px] shrink-0`}>
                                                {project.priority}
                                              </Badge>
                                            </div>
                                            {project.description && (
                                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                                            )}
                                            {(project as any).tags?.length > 0 && (
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                {(project as any).tags.map((tag: string) => (
                                                  <Badge key={tag} variant="outline" className="text-[9px] px-1 py-0">
                                                    {tag}
                                                  </Badge>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pl-6">
                                          <div className="flex -space-x-2">
                                            {assignedUsers.slice(0, 2).map((assignment: any) => (
                                              <Avatar key={assignment.id} className="h-5 w-5 border-2 border-background">
                                                <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                                                  {getUserInitials(assignment.user)}
                                                </AvatarFallback>
                                              </Avatar>
                                            ))}
                                            {assignedUsers.length > 2 && (
                                              <Avatar className="h-5 w-5 border-2 border-background">
                                                <AvatarFallback className="text-[8px] bg-muted">
                                                  +{assignedUsers.length - 2}
                                                </AvatarFallback>
                                              </Avatar>
                                            )}
                                          </div>
                                          {project.deadline && (
                                            <span className={`text-[10px] ${timeline.color}`}>{timeline.text}</span>
                                          )}
                                        </div>
                                      </CardContent>
                                    </Card>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                            {columnProjects.length === 0 && (
                              <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                                Drop projects here
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </TabsContent>

      </Tabs>

      {/* Create/Edit Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit">
              {editingProject ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription>
              {editingProject ? "Update task details below." : "Fill in the details to create a new task."}
            </DialogDescription>
          </DialogHeader>
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(handleProjectSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={projectForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Task Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task name" {...field} data-testid="input-project-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>Assign to</FormLabel>
                  <Select 
                    value={initialAssignee} 
                    onValueChange={setInitialAssignee}
                    disabled={!!editingProject}
                  >
                    <SelectTrigger data-testid="select-assignee">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent>
                      {allUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}` 
                            : user.username}
                          {user.id === currentUser?.id && " (me)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editingProject && (
                    <p className="text-xs text-muted-foreground mt-1">Use the Assign button to modify assignments</p>
                  )}
                </FormItem>
              </div>
              <FormField
                control={projectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the project..." 
                        className="min-h-[80px]"
                        {...field} 
                        data-testid="input-project-description" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center gap-4">
                <FormField
                  control={projectForm.control}
                  name="blocked"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-3">
                      <FormLabel className="mt-0">Blocked?</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-blocked"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {projectForm.watch("blocked") && (
                  <FormField
                    control={projectForm.control}
                    name="blockedBy"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-blocked-by">
                              <SelectValue placeholder="Dependency owner" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName && user.lastName 
                                  ? `${user.firstName} ${user.lastName}` 
                                  : user.username}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                )}
              </div>
              {projectForm.watch("blocked") && (
                <FormField
                  control={projectForm.control}
                  name="blockedReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dependency</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Describe what's blocking this task..."
                          {...field}
                          data-testid="input-blocked-reason"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={projectForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-project-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={projectForm.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    {projectTags.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No tags available. <Link href="/manage-tags" className="text-primary hover:underline">Create tags</Link> first.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {projectTags.map((tag) => (
                          <label
                            key={tag.id}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-colors ${
                              field.value?.includes(tag.name)
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-muted/50 border-border hover:bg-muted"
                            }`}
                          >
                            <Checkbox
                              checked={field.value?.includes(tag.name)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, tag.name]);
                                } else {
                                  field.onChange(current.filter((t) => t !== tag.name));
                                }
                              }}
                              data-testid={`checkbox-tag-${tag.name.toLowerCase()}`}
                            />
                            <span className="text-sm">{tag.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={projectForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-project-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={projectForm.control}
                  name="deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deadline</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-project-deadline" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setProjectDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProjectMutation.isPending || updateProjectMutation.isPending}
                  data-testid="button-save-project"
                >
                  {editingProject ? "Update" : "Create"} Project
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog open={projectDetailOpen} onOpenChange={setProjectDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {selectedProject && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="font-outfit text-xl">{selectedProject.name}</DialogTitle>
                    <DialogDescription>{selectedProject.description}</DialogDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingProject(selectedProject);
                        setProjectDetailOpen(false);
                        setProjectDialogOpen(true);
                      }}
                      data-testid="button-edit-selected-project"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {currentUser?.role === "admin" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteProjectMutation.mutate(selectedProject.id)}
                        data-testid="button-delete-selected-project"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-6">
                {/* Status and Info Row */}
                <div className="flex flex-wrap items-center gap-4">
                  <Badge className={statusConfig[selectedProject.status as ProjectStatus]?.bgColor}>
                    {statusConfig[selectedProject.status as ProjectStatus]?.label}
                  </Badge>
                  <Badge className={priorityColors[selectedProject.priority as ProjectPriority]}>
                    {selectedProject.priority} priority
                  </Badge>
                  {selectedProject.deadline && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Deadline: {format(new Date(selectedProject.deadline), "MMM d, yyyy")}
                    </div>
                  )}
                </div>

                {/* Assigned Users */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Assigned Team ({selectedProject.assignments.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openAssignDialog}
                      data-testid="button-assign-users"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.assignments.map((assignment: any) => (
                      <Badge 
                        key={assignment.id} 
                        variant="secondary" 
                        className="flex items-center gap-2 py-1.5"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-[10px]">
                            {getUserInitials(assignment.user)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getUserName(assignment.user)}</span>
                        {assignment.role === "owner" && (
                          <span className="text-xs text-muted-foreground">(Owner)</span>
                        )}
                        {assignment.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1"
                            onClick={() => removeAssignmentMutation.mutate({
                              projectId: selectedProject.id,
                              assignmentId: assignment.id
                            })}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    ))}
                    {selectedProject.assignments.length === 0 && (
                      <p className="text-sm text-muted-foreground">No team members assigned</p>
                    )}
                  </div>
                </div>

                {/* Deadline Change Section */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      Deadline Management
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeadlineChangeMode(!deadlineChangeMode)}
                      data-testid="button-toggle-deadline-change"
                    >
                      {deadlineChangeMode ? "Cancel" : "Request Change"}
                    </Button>
                  </div>
                  
                  {deadlineChangeMode && (
                    <div className="space-y-3">
                      <div>
                        <Label>New Deadline</Label>
                        <Input 
                          type="date" 
                          value={newDeadline}
                          onChange={(e) => setNewDeadline(e.target.value)}
                          className="mt-1"
                          data-testid="input-new-deadline"
                        />
                      </div>
                      <div>
                        <Label>Justification</Label>
                        <Textarea
                          placeholder="Explain why the deadline needs to change..."
                          value={deadlineJustification}
                          onChange={(e) => setDeadlineJustification(e.target.value)}
                          className="mt-1 min-h-[80px]"
                          data-testid="input-deadline-justification"
                        />
                      </div>
                      <Button 
                        onClick={handleDeadlineChange}
                        disabled={addCommentMutation.isPending}
                        data-testid="button-submit-deadline-change"
                      >
                        Submit Deadline Change
                      </Button>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <MessageSquare className="h-4 w-4" />
                    Comments & Activity
                  </h4>
                  
                  <ScrollArea className="h-[200px] mb-4">
                    <div className="space-y-3">
                      {selectedProject.comments?.map((comment: ProjectComment) => (
                        <div key={comment.id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{comment.userName || "Unknown"}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.createdAt!), { addSuffix: true })}
                            </span>
                          </div>
                          {comment.type === "deadline_change" && (
                            <Badge variant="outline" className="mb-2 text-xs">
                              Deadline Change: {comment.oldDeadline || "None"} → {comment.newDeadline}
                            </Badge>
                          )}
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))}
                      {(!selectedProject.comments || selectedProject.comments.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      data-testid="input-new-comment"
                    />
                    <Button 
                      onClick={handleAddComment}
                      disabled={addCommentMutation.isPending || !newComment.trim()}
                      data-testid="button-send-comment"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Users Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-outfit">Assign Team Members</DialogTitle>
            <DialogDescription>Select users to assign to this project.</DialogDescription>
          </DialogHeader>
          {/* Quick self-assign button */}
          {currentUser && selectedProject && !selectedProject.assignments.some(a => a.userId === currentUser.id) && (
            <Button
              variant="outline"
              className="w-full mb-2"
              onClick={() => {
                addAssignmentMutation.mutate({ projectId: selectedProject.id, userId: currentUser.id });
                setAssignDialogOpen(false);
                toast({ title: "You have been assigned to this project" });
              }}
              data-testid="button-assign-myself"
            >
              <User className="h-4 w-4 mr-2" />
              Assign Myself
            </Button>
          )}
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {getUnassignedUsers().map((user) => (
                <div 
                  key={user.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUsersToAssign.includes(user.id) 
                      ? "border-primary bg-primary/5" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    setSelectedUsersToAssign(prev =>
                      prev.includes(user.id)
                        ? prev.filter(id => id !== user.id)
                        : [...prev, user.id]
                    );
                  }}
                >
                  <Checkbox checked={selectedUsersToAssign.includes(user.id)} />
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{getUserName(user)}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))}
              {getUnassignedUsers().length === 0 && (
                <p className="text-center text-muted-foreground py-4">All users are already assigned</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignUsers}
              disabled={selectedUsersToAssign.length === 0}
              data-testid="button-confirm-assign"
            >
              Assign ({selectedUsersToAssign.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blueprint Dialog */}
      <Dialog open={blueprintDialogOpen} onOpenChange={setBlueprintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-outfit">
              {editingBlueprint ? "Edit Collaboration Stamp" : "Create Collaboration Stamp"}
            </DialogTitle>
          </DialogHeader>
          <Form {...blueprintForm}>
            <form onSubmit={blueprintForm.handleSubmit(handleBlueprintSubmit)} className="space-y-4">
              <FormField
                control={blueprintForm.control}
                name="sectionName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      const section = portalSections.find(s => s.name === value);
                      if (section) {
                        blueprintForm.setValue("sectionTitle", section.title);
                      }
                    }} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {portalSections.map((section) => (
                          <SelectItem key={section.name} value={section.name}>
                            {section.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={blueprintForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {blueprintStatusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={blueprintForm.control}
                name="etaDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ETA Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={blueprintForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Additional notes..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={blueprintForm.control}
                name="missingItems"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Missing Items (one per line)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter missing items..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={blueprintForm.control}
                name="ideas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ideas (one per line)</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Enter ideas..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setBlueprintDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBlueprintMutation.isPending || updateBlueprintMutation.isPending}>
                  {editingBlueprint ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
