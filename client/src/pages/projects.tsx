import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Tag,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Layers,
  FolderOpen,
  Building2,
  MoreHorizontal,
  Pencil
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { format, formatDistanceToNow } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CollaborationStamp, CollaborationStampMini } from "@/components/collaboration-stamp";
import type { CollaborationBlueprint, InsertBlueprint, Project, ProjectWithAssignments, ProjectComment, ManagedUser, Sprint, SpaceWithHierarchy } from "@shared/schema";
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
  projectGroupId: z.string().optional().nullable(),
  status: z.enum(["not_started", "in_progress", "on_hold", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  tags: z.array(z.string()).optional(),
  sprintId: z.string().optional().nullable(),
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
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [sprintFilter, setSprintFilter] = useState<string>("all");
  const [viewFilter, setViewFilter] = useState<"all" | "mine">("all");
  const [sprintsDialogOpen, setSprintsDialogOpen] = useState(false);
  const [location] = useLocation();
  const activeView = location.includes("/tuesday") ? "tuesday" : "monday";
  const [tuesdayDisplayMode, setTuesdayDisplayMode] = useState<"table" | "kanban">("table");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
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
  const [manageTagsDialogOpen, setManageTagsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<ProjectTag | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [spaceDialogOpen, setSpaceDialogOpen] = useState(false);
  const [projectGroupDialogOpen, setProjectGroupDialogOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState<any>(null);
  const [editingProjectGroup, setEditingProjectGroup] = useState<any>(null);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDescription, setSpaceDescription] = useState("");
  const [spaceColor, setSpaceColor] = useState("#6366f1");
  const [pgName, setPgName] = useState("");
  const [pgDescription, setPgDescription] = useState("");
  const [pgSpaceId, setPgSpaceId] = useState("");
  const [pgColor, setPgColor] = useState("#6366f1");
  const [pgStatus, setPgStatus] = useState("active");
  const [pgStartDate, setPgStartDate] = useState("");
  const [pgEndDate, setPgEndDate] = useState("");
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

  // Sprints query
  const { data: sprintsData = [] } = useQuery<Sprint[]>({
    queryKey: ["/api/sprints"],
  });

  const { data: spacesHierarchy = [], isLoading: hierarchyLoading } = useQuery<SpaceWithHierarchy[]>({
    queryKey: ["/api/spaces/hierarchy"],
  });

  // Get active sprint from sprints data
  const activeSprint = sprintsData.find((s) => s.isActive && !s.isClosed);

  // Project mutations
  const createProjectMutation = useMutation({
    mutationFn: (data: ProjectFormValues) => apiRequest("POST", "/api/projects", data),
    onSuccess: async (response: any) => {
      // If an initial assignee was selected, assign them to the project FIRST
      if (initialAssignee && response?.id) {
        try {
          await apiRequest("POST", `/api/projects/${response.id}/assignments`, { userId: initialAssignee });
        } catch (error) {
          console.error("Failed to assign user:", error);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/hierarchy"] });
      
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
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/hierarchy"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/hierarchy"] });
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

  // Tag mutations
  const createTagMutation = useMutation({
    mutationFn: (data: { name: string }) => apiRequest("POST", "/api/project-tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-tags"] });
      setNewTagName("");
      setEditingTag(null);
      toast({ title: "Tag created successfully" });
    },
    onError: (error: any) => {
      toast({ title: error?.message || "Failed to create tag", variant: "destructive" });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      apiRequest("PATCH", `/api/project-tags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-tags"] });
      setNewTagName("");
      setEditingTag(null);
      toast({ title: "Tag updated successfully" });
    },
    onError: () => toast({ title: "Failed to update tag", variant: "destructive" }),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/project-tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-tags"] });
      toast({ title: "Tag deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete tag", variant: "destructive" }),
  });

  const createSpaceMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/spaces", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/hierarchy"] });
      setSpaceDialogOpen(false);
      setSpaceName("");
      setSpaceDescription("");
      setSpaceColor("#6366f1");
      toast({ title: "Space created successfully" });
    },
    onError: () => toast({ title: "Failed to create space", variant: "destructive" }),
  });

  const updateSpaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/spaces/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/hierarchy"] });
      setSpaceDialogOpen(false);
      setEditingSpace(null);
      toast({ title: "Space updated successfully" });
    },
    onError: () => toast({ title: "Failed to update space", variant: "destructive" }),
  });

  const deleteSpaceMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/spaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/hierarchy"] });
      toast({ title: "Space deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete space", variant: "destructive" }),
  });

  const createProjectGroupMutation2 = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/project-groups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/spaces/hierarchy"] });
      setProjectGroupDialogOpen(false);
      setPgName("");
      setPgDescription("");
      setPgSpaceId("");
      setPgColor("#6366f1");
      setPgStatus("active");
      setPgStartDate("");
      setPgEndDate("");
      toast({ title: "Project created successfully" });
    },
    onError: () => toast({ title: "Failed to create project", variant: "destructive" }),
  });

  const handleSpaceSubmit = () => {
    if (!spaceName.trim()) return;
    if (editingSpace) {
      updateSpaceMutation.mutate({
        id: editingSpace.id,
        data: {
          name: spaceName.trim(),
          description: spaceDescription.trim() || undefined,
          color: spaceColor,
        },
      });
    } else {
      createSpaceMutation.mutate({
        name: spaceName.trim(),
        description: spaceDescription.trim() || undefined,
        color: spaceColor,
      });
    }
  };

  const handleProjectGroupSubmit = () => {
    if (!pgName.trim() || !pgSpaceId) return;
    createProjectGroupMutation2.mutate({
      name: pgName.trim(),
      description: pgDescription.trim() || undefined,
      spaceId: pgSpaceId,
      color: pgColor,
      status: pgStatus,
      startDate: pgStartDate || undefined,
      endDate: pgEndDate || undefined,
    });
  };

  const handleTagSubmit = () => {
    if (!newTagName.trim()) return;
    if (editingTag) {
      updateTagMutation.mutate({ id: editingTag.id, data: { name: newTagName } });
    } else {
      createTagMutation.mutate({ name: newTagName });
    }
  };

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

  // Filter projects - apply search and tag filters (status is shown in kanban columns)
  const filteredProjects = projectsData.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = tagFilter === "all" || (project.tags && project.tags.includes(tagFilter));
    const matchesSprint = sprintFilter === "all" || 
      (sprintFilter === "backlog" && !project.sprintId) ||
      project.sprintId === sprintFilter;
    return matchesSearch && matchesTag && matchesSprint;
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
      projectGroupId: null,
      status: "not_started",
      priority: "medium",
      tags: [],
      sprintId: null,
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
        projectGroupId: (editingProject as any).projectGroupId || null,
        status: editingProject.status as ProjectStatus,
        priority: editingProject.priority as ProjectPriority,
        tags: (editingProject as any).tags || [],
        sprintId: (editingProject as any).sprintId || null,
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
        projectGroupId: null,
        status: "not_started",
        priority: "medium",
        tags: [],
        sprintId: null,
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
        queryClient.invalidateQueries({ queryKey: ["/api/spaces/hierarchy"] });
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

      {(activeView === "monday" || activeView === "tuesday") && (
        <div className="space-y-4" data-testid={`${activeView}-view`}>
            <div className="flex items-center gap-3">
              {activeView === "tuesday" && (
                <div className="flex items-center border rounded-md overflow-visible">
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`rounded-none rounded-l-md ${tuesdayDisplayMode === "table" ? "bg-muted" : ""} toggle-elevate ${tuesdayDisplayMode === "table" ? "toggle-elevated" : ""}`}
                    onClick={() => setTuesdayDisplayMode("table")}
                    data-testid="button-tuesday-table-view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`rounded-none rounded-r-md ${tuesdayDisplayMode === "kanban" ? "bg-muted" : ""} toggle-elevate ${tuesdayDisplayMode === "kanban" ? "toggle-elevated" : ""}`}
                    onClick={() => setTuesdayDisplayMode("kanban")}
                    data-testid="button-tuesday-kanban-view"
                  >
                    <Layers className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {activeView !== "tuesday" && (
                <Button onClick={() => { setEditingSpace(null); setSpaceName(""); setSpaceDescription(""); setSpaceColor("#6366f1"); setSpaceDialogOpen(true); }} data-testid="button-new-space">
                  <Plus className="h-4 w-4 mr-2" />
                  New Space
                </Button>
              )}
              <Button onClick={() => { setEditingProjectGroup(null); setPgName(""); setPgDescription(""); setPgSpaceId(""); setPgColor("#6366f1"); setPgStatus("active"); setPgStartDate(""); setPgEndDate(""); setProjectGroupDialogOpen(true); }} data-testid="button-new-project-group">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
            {(activeView === "monday" || tuesdayDisplayMode === "table") ? (hierarchyLoading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Loading projects...</p>
              </div>
            ) : (() => {
              const filterTask = (task: ProjectWithAssignments) => {
                const matchesSearch =
                  task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesStatus = statusFilter === "all" || task.status === statusFilter;
                const matchesTag = tagFilter === "all" || (task.tags && task.tags.includes(tagFilter));
                const matchesSprint = sprintFilter === "all" ||
                  (sprintFilter === "backlog" && !task.sprintId) ||
                  task.sprintId === sprintFilter;
                const matchesMine = viewFilter === "all" || 
                  (currentUser && task.assignments?.some(a => a.userId === currentUser.id));
                return matchesSearch && matchesStatus && matchesTag && matchesSprint && matchesMine;
              };

              const hasActiveFilters = searchQuery || statusFilter !== "all" || tagFilter !== "all" || sprintFilter !== "all" || viewFilter !== "all";
              const filteredHierarchy = spacesHierarchy.map(space => ({
                ...space,
                projectGroups: space.projectGroups.map(pg => ({
                  ...pg,
                  tasks: pg.tasks.filter(filterTask),
                })).filter(pg => hasActiveFilters ? pg.tasks.length > 0 : true),
              })).filter(space => hasActiveFilters ? (space.projectGroups.length > 0) : true);

              const allHierarchyTaskIds = new Set<string>();
              spacesHierarchy.forEach(space => {
                space.projectGroups.forEach(pg => {
                  pg.tasks.forEach(t => allHierarchyTaskIds.add(t.id));
                });
              });
              const unassignedTasks = projectsData
                .filter(p => !allHierarchyTaskIds.has(p.id))
                .filter(filterTask);

              const hasContent = filteredHierarchy.length > 0 || unassignedTasks.length > 0;

              if (!hasContent && projectsData.length === 0) {
                return (
                  <div className="p-12 text-center border rounded-md">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                    <p className="text-muted-foreground mb-4">
                      {viewFilter === "mine"
                        ? "You don't have any assigned projects yet."
                        : "Create your first project to get started."}
                    </p>
                    <Button onClick={() => setProjectDialogOpen(true)} data-testid="button-create-first-project-monday">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Project
                    </Button>
                  </div>
                );
              }

              if (!hasContent) {
                return (
                  <div className="p-12 text-center border rounded-md">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No matching tasks</h3>
                    <p className="text-muted-foreground">Try adjusting your filters.</p>
                  </div>
                );
              }

              const renderTaskRow = (project: ProjectWithAssignments) => {
                const timeline = getTimelineStatus(project.deadline);
                const assignedUsers = getAssignedUsers(project);
                const sprint = sprintsData.find(s => s.id === (project as any).sprintId);

                return (
                  <div
                    key={project.id}
                    className="grid grid-cols-[1fr_120px_120px_100px_120px_150px_120px] gap-2 px-3 py-2 items-center border-b last:border-b-0 hover-elevate rounded-md"
                    data-testid={`monday-row-${project.id}`}
                  >
                    <span
                      className="font-medium text-sm truncate cursor-pointer"
                      onClick={() => openProjectDetail(project)}
                    >
                      {project.name}
                    </span>

                    <div className="flex -space-x-2">
                      {assignedUsers.slice(0, 3).map((assignment: any) => (
                        <Avatar key={assignment.id} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-[9px] bg-primary text-primary-foreground">
                            {getUserInitials(assignment.user)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {assignedUsers.length > 3 && (
                        <Avatar className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-[9px] bg-muted">
                            +{assignedUsers.length - 3}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {assignedUsers.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <div data-testid={`monday-status-${project.id}`} className="cursor-pointer">
                          <Badge className={`${statusConfig[project.status as ProjectStatus]?.bgColor} border-0 text-xs`}>
                            {statusConfig[project.status as ProjectStatus]?.label}
                          </Badge>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-44 p-2" align="start">
                        <div className="space-y-1">
                          {(Object.entries(statusConfig) as [ProjectStatus, typeof statusConfig[ProjectStatus]][]).map(([key, cfg]) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm hover-elevate"
                              onClick={() => {
                                updateProjectMutation.mutate({ id: project.id, data: { status: key } });
                              }}
                            >
                              <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
                              <span className={cfg.color}>{cfg.label}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <div data-testid={`monday-priority-${project.id}`} className="cursor-pointer">
                          <Badge className={`${priorityColors[project.priority as ProjectPriority]} border-0 text-xs`}>
                            {project.priority}
                          </Badge>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-36 p-2" align="start">
                        <div className="space-y-1">
                          {(Object.entries(priorityColors) as [ProjectPriority, string][]).map(([key, colorClass]) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm hover-elevate"
                              onClick={() => {
                                updateProjectMutation.mutate({ id: project.id, data: { priority: key } });
                              }}
                            >
                              <div className={`w-2 h-2 rounded-full ${colorClass.split(" ")[0]}`} />
                              <span className="capitalize">{key}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <span className={`text-xs ${timeline.color}`}>
                      {project.deadline
                        ? format(new Date(project.deadline), "MMM d, yyyy")
                        : "—"}
                    </span>

                    <div className="flex flex-wrap gap-1 overflow-hidden">
                      {(project as any).tags?.length > 0 ? (
                        (project as any).tags.slice(0, 2).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      {(project as any).tags?.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">+{(project as any).tags.length - 2}</span>
                      )}
                    </div>

                    <span className="text-xs text-muted-foreground truncate">
                      {sprint ? sprint.name : "Backlog"}
                    </span>
                  </div>
                );
              };

              return (
                <div className="space-y-3">
                  {filteredHierarchy.map((space) => {
                    const spaceKey = `space-${space.id}`;
                    const isSpaceCollapsed = collapsedGroups[spaceKey] || false;
                    const totalTasks = space.projectGroups.reduce((sum, pg) => sum + pg.tasks.length, 0);

                    return (
                      <div key={space.id} data-testid={`monday-space-${space.id}`}>
                        <div
                          className="flex items-center gap-3 p-3 rounded-md cursor-pointer select-none group"
                          onClick={() => setCollapsedGroups(prev => ({ ...prev, [spaceKey]: !isSpaceCollapsed }))}
                        >
                          <div
                            className="w-1 self-stretch rounded-full shrink-0"
                            style={{ backgroundColor: space.color || '#6366f1' }}
                          />
                          {isSpaceCollapsed ? (
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <Building2 className="h-4 w-4 shrink-0" style={{ color: space.color || '#6366f1' }} />
                          <span className="font-medium text-sm font-outfit">{space.name}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {space.projectGroups.length} {space.projectGroups.length === 1 ? 'project' : 'projects'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                          </Badge>
                          <div className="ml-auto invisible group-hover:visible flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button size="icon" variant="ghost" className="h-7 w-7" data-testid={`button-space-menu-${space.id}`}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-40 p-1" align="end">
                                <div
                                  className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm hover-elevate"
                                  data-testid={`button-edit-space-${space.id}`}
                                  onClick={() => {
                                    setEditingSpace(space);
                                    setSpaceName(space.name);
                                    setSpaceDescription(space.description || "");
                                    setSpaceColor(space.color || "#6366f1");
                                    setSpaceDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Rename
                                </div>
                                {currentUser?.role === "admin" && (
                                  <div
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm text-destructive hover-elevate"
                                    data-testid={`button-delete-space-${space.id}`}
                                    onClick={() => {
                                      if (window.confirm(`Delete space "${space.name}"? All projects and tasks inside will become unassigned.`)) {
                                        deleteSpaceMutation.mutate(space.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>

                        {!isSpaceCollapsed && (
                          <div className="mt-1 space-y-2">
                            {space.projectGroups.map((pg) => {
                              const pgKey = `project-${pg.id}`;
                              const isPgCollapsed = collapsedGroups[pgKey] || false;

                              return (
                                <div key={pg.id} data-testid={`monday-project-${pg.id}`}>
                                  <div
                                    className="flex items-center gap-2 pl-6 pr-3 py-2 rounded-md cursor-pointer select-none"
                                    onClick={() => setCollapsedGroups(prev => ({ ...prev, [pgKey]: !isPgCollapsed }))}
                                  >
                                    {isPgCollapsed ? (
                                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    )}
                                    <FolderOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <Link href={`/projects/group/${pg.id}`} onClick={(e: any) => e.stopPropagation()}>
                                      <span className="font-medium text-sm hover:underline" data-testid={`link-project-group-${pg.id}`}>{pg.name}</span>
                                    </Link>
                                    {pg.color && (
                                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pg.color }} />
                                    )}
                                    <Badge variant="secondary" className="text-xs">
                                      {pg.tasks.length}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground capitalize">{pg.status}</span>
                                    {pg.startDate && pg.endDate && (
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(pg.startDate), "MMM d")} - {format(new Date(pg.endDate), "MMM d, yyyy")}
                                      </span>
                                    )}
                                  </div>

                                  {!isPgCollapsed && (
                                    <div className="pl-12 mt-1">
                                      <div className="grid grid-cols-[1fr_120px_120px_100px_120px_150px_120px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                                        <span>Task Name</span>
                                        <span>Assignee</span>
                                        <span>Status</span>
                                        <span>Priority</span>
                                        <span>Deadline</span>
                                        <span>Tags</span>
                                        <span>Sprint</span>
                                      </div>
                                      {pg.tasks.map(renderTaskRow)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {unassignedTasks.length > 0 && (
                    <div data-testid="monday-space-unassigned">
                      <div
                        className="flex items-center gap-3 p-3 rounded-md cursor-pointer select-none"
                        onClick={() => setCollapsedGroups(prev => ({ ...prev, "space-unassigned": !prev["space-unassigned"] }))}
                      >
                        <div className="w-1 self-stretch rounded-full shrink-0 bg-muted" />
                        {collapsedGroups["space-unassigned"] ? (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium text-sm font-outfit text-muted-foreground">Unassigned</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {unassignedTasks.length} {unassignedTasks.length === 1 ? 'task' : 'tasks'}
                        </Badge>
                      </div>

                      {!collapsedGroups["space-unassigned"] && (
                        <div className="pl-6 mt-1">
                          <div className="grid grid-cols-[1fr_120px_120px_100px_120px_150px_120px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
                            <span>Task Name</span>
                            <span>Assignee</span>
                            <span>Status</span>
                            <span>Priority</span>
                            <span>Deadline</span>
                            <span>Tags</span>
                            <span>Sprint</span>
                          </div>
                          {unassignedTasks.map(renderTaskRow)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()) : null}

            {activeView === "tuesday" && tuesdayDisplayMode === "kanban" && (
              <div className="space-y-6" data-testid="tuesday-kanban-view">
                {!projectsLoading && projectsData.length > 0 && (() => {
                  const kanbanStats = {
                    notStarted: filteredProjects.filter(p => p.status === "not_started").length,
                    inProgress: filteredProjects.filter(p => p.status === "in_progress").length,
                    onHold: filteredProjects.filter(p => p.status === "on_hold").length,
                    completed: filteredProjects.filter(p => p.status === "completed").length,
                    cancelled: filteredProjects.filter(p => p.status === "cancelled").length,
                    total: filteredProjects.length,
                  };
                  return (
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                      <Card data-testid="kanban-stat-not-started">
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-800">
                            <Pause className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{kanbanStats.notStarted}</p>
                            <p className="text-xs text-muted-foreground">Not Started</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card data-testid="kanban-stat-in-progress">
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/30">
                            <Clock className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{kanbanStats.inProgress}</p>
                            <p className="text-xs text-muted-foreground">In Progress</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card data-testid="kanban-stat-on-hold">
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-orange-100 dark:bg-orange-900/30">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{kanbanStats.onHold}</p>
                            <p className="text-xs text-muted-foreground">On Hold</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card data-testid="kanban-stat-completed">
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-green-100 dark:bg-green-900/30">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{kanbanStats.completed}</p>
                            <p className="text-xs text-muted-foreground">Completed</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card data-testid="kanban-stat-cancelled">
                        <CardContent className="flex items-center gap-3 p-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-red-100 dark:bg-red-900/30">
                            <X className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="text-xl font-bold">{kanbanStats.cancelled}</p>
                            <p className="text-xs text-muted-foreground">Cancelled</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}
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
                      {(() => {
                        const pgLookup: Record<string, { name: string; color: string; spaceName: string }> = {};
                        spacesHierarchy.forEach(space => {
                          space.projectGroups.forEach(pg => {
                            pgLookup[pg.id] = { name: pg.name, color: pg.color || "#6366f1", spaceName: space.name };
                          });
                        });
                        return (Object.entries(statusConfig) as [ProjectStatus, typeof statusConfig[ProjectStatus]][]).map(([statusKey, config]) => {
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
                                    const pgInfo = (project as any).projectGroupId ? pgLookup[(project as any).projectGroupId] : null;
                                    
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
                                              {pgInfo && (
                                                <div className="flex items-center gap-1.5 mb-1">
                                                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: pgInfo.color }} />
                                                  <span className="text-[10px] text-muted-foreground truncate">
                                                    {pgInfo.spaceName} / {pgInfo.name}
                                                  </span>
                                                </div>
                                              )}
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
                      });
                      })()}
                    </div>
                  </DragDropContext>
                )}
              </div>
            )}
        </div>
      )}

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
              <FormField
                control={projectForm.control}
                name="projectGroupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Group</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-project-group">
                          <SelectValue placeholder="Select project group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Unassigned</SelectItem>
                        {spacesHierarchy.map((space) => (
                          space.projectGroups.map((pg) => (
                            <SelectItem key={pg.id} value={pg.id}>
                              {space.name} / {pg.name}
                            </SelectItem>
                          ))
                        ))}
                      </SelectContent>
                    </Select>
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
              <FormField
                control={projectForm.control}
                name="sprintId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sprint</FormLabel>
                    <Select 
                      value={field.value || "none"} 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-project-sprint">
                          <SelectValue placeholder="Select sprint" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Backlog (No Sprint)</SelectItem>
                        {sprintsData.map((sprint) => (
                          <SelectItem key={sprint.id} value={sprint.id}>
                            {sprint.name} ({format(new Date(sprint.startDate), "MMM d")} - {format(new Date(sprint.endDate), "MMM d")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

      {/* Manage Tags Dialog */}
      <Dialog open={manageTagsDialogOpen} onOpenChange={setManageTagsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-outfit">Manage Tags</DialogTitle>
            <DialogDescription>Create and manage task tags</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Create/Edit Tag Form */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                data-testid="input-new-tag-name"
              />
              <Button
                onClick={handleTagSubmit}
                disabled={!newTagName.trim() || createTagMutation.isPending || updateTagMutation.isPending}
                data-testid="button-submit-tag"
              >
                {editingTag ? "Update" : "Add"}
              </Button>
              {editingTag && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingTag(null);
                    setNewTagName("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>

            {/* Tags List */}
            <div className="border rounded-md max-h-[300px] overflow-y-auto">
              {projectTags.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No tags created yet. Add your first tag above.
                </p>
              ) : (
                <div className="divide-y">
                  {projectTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between p-3" data-testid={`row-tag-${tag.id}`}>
                      <span className="font-medium">{tag.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTag(tag);
                            setNewTagName(tag.name);
                          }}
                          data-testid={`button-edit-tag-${tag.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTagMutation.mutate(tag.id)}
                          data-testid={`button-delete-tag-${tag.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageTagsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={spaceDialogOpen} onOpenChange={(open) => { setSpaceDialogOpen(open); if (!open) setEditingSpace(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-outfit">{editingSpace ? "Edit Space" : "Create Space"}</DialogTitle>
            <DialogDescription>Spaces are department-level groupings for organizing projects.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Space Name</Label>
              <Input
                placeholder="Enter space name"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                className="mt-1"
                data-testid="input-space-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the space..."
                value={spaceDescription}
                onChange={(e) => setSpaceDescription(e.target.value)}
                className="mt-1 min-h-[80px]"
                data-testid="input-space-description"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#64748b"].map((color) => (
                  <div
                    key={color}
                    className={`w-8 h-8 rounded-md cursor-pointer ring-offset-background transition-all ${spaceColor === color ? "ring-2 ring-ring ring-offset-2" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSpaceColor(color)}
                    data-testid={`swatch-space-${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpaceDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSpaceSubmit}
              disabled={!spaceName.trim() || createSpaceMutation.isPending || updateSpaceMutation.isPending}
              data-testid="button-save-space"
            >
              {editingSpace ? "Update" : "Create"} Space
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={projectGroupDialogOpen} onOpenChange={setProjectGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-outfit">{editingProjectGroup ? "Edit Project" : "Create Project"}</DialogTitle>
            <DialogDescription>Projects belong to a space and contain tasks.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project Name</Label>
              <Input
                placeholder="Enter project name"
                value={pgName}
                onChange={(e) => setPgName(e.target.value)}
                className="mt-1"
                data-testid="input-pg-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Describe the project..."
                value={pgDescription}
                onChange={(e) => setPgDescription(e.target.value)}
                className="mt-1 min-h-[80px]"
                data-testid="input-pg-description"
              />
            </div>
            <div>
              <Label>Space</Label>
              <Select value={pgSpaceId} onValueChange={setPgSpaceId}>
                <SelectTrigger className="mt-1" data-testid="select-pg-space">
                  <SelectValue placeholder="Select a space" />
                </SelectTrigger>
                <SelectContent>
                  {spacesHierarchy.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={pgStatus} onValueChange={setPgStatus}>
                <SelectTrigger className="mt-1" data-testid="select-pg-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={pgStartDate}
                  onChange={(e) => setPgStartDate(e.target.value)}
                  className="mt-1"
                  data-testid="input-pg-start-date"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={pgEndDate}
                  onChange={(e) => setPgEndDate(e.target.value)}
                  className="mt-1"
                  data-testid="input-pg-end-date"
                />
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6", "#3b82f6", "#64748b"].map((color) => (
                  <div
                    key={color}
                    className={`w-8 h-8 rounded-md cursor-pointer ring-offset-background transition-all ${pgColor === color ? "ring-2 ring-ring ring-offset-2" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setPgColor(color)}
                    data-testid={`swatch-pg-${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProjectGroupSubmit}
              disabled={!pgName.trim() || !pgSpaceId || createProjectGroupMutation2.isPending}
              data-testid="button-save-project-group"
            >
              {editingProjectGroup ? "Update" : "Create"} Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
