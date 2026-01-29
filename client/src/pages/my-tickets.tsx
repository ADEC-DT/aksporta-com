import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Ticket, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ArrowLeft,
  Send,
  MessageSquare,
  Search,
  RefreshCw,
  Bug,
  ShieldAlert,
  Database,
  Zap,
  HelpCircle,
  ChevronRight,
  FileText,
  Bell,
  Download
} from "lucide-react";
import type { Ticket as TicketType, TicketComment } from "@shared/schema";
import { format, formatDistanceToNow } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: any }> = {
  new: { label: "New", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: Clock },
  in_progress: { label: "In Progress", color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/30", icon: RefreshCw },
  resolved: { label: "Resolved", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle },
  closed: { label: "Closed", color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30", icon: CheckCircle },
};

const severityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "High", variant: "destructive" },
  critical: { label: "Critical", variant: "destructive" },
};

const categoryConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  it_support: { label: "IT Support", icon: ShieldAlert, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  other: { label: "Other", icon: HelpCircle, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
};

const supportDocuments = [
  { 
    id: "doc-1", 
    title: "Portal User Guide", 
    type: "PDF", 
    size: "2.4 MB", 
    date: "Jan 10, 2026",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30"
  },
  { 
    id: "doc-2", 
    title: "Ticket Submission Guidelines", 
    type: "PDF", 
    size: "1.1 MB", 
    date: "Jan 8, 2026",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30"
  },
  { 
    id: "doc-3", 
    title: "NetSuite Integration FAQ", 
    type: "DOC", 
    size: "856 KB", 
    date: "Jan 5, 2026",
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30"
  },
  { 
    id: "doc-4", 
    title: "Troubleshooting Common Issues", 
    type: "PDF", 
    size: "1.8 MB", 
    date: "Dec 20, 2025",
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900/30"
  },
];

export default function MyTicketsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [newComment, setNewComment] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "",
    severity: "",
  });

  const { data: tickets = [], isLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets/my"],
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<TicketComment[]>({
    queryKey: ["/api/tickets", selectedTicket?.id, "comments"],
    enabled: !!selectedTicket,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof newTicket) => {
      const res = await apiRequest("POST", "/api/tickets", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets/my"] });
      setCreateDialogOpen(false);
      setNewTicket({ subject: "", description: "", category: "", severity: "" });
      toast({ 
        title: "Ticket created", 
        description: `Your ticket ${data.trackingId} has been submitted successfully.` 
      });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create ticket", description: error.message, variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await apiRequest("POST", `/api/tickets/${selectedTicket?.id}/comments`, { message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket?.id, "comments"] });
      setNewComment("");
      toast({ title: "Comment added" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add comment", description: error.message, variant: "destructive" });
    },
  });

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.description || !newTicket.category || !newTicket.severity) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createTicketMutation.mutate(newTicket);
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = searchQuery === "" || 
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === null || ticket.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const ticketsByCategory = Object.keys(categoryConfig).reduce((acc, key) => {
    acc[key] = tickets.filter(t => t.category === key).length;
    return acc;
  }, {} as Record<string, number>);

  const recentUpdates = [...tickets]
    .sort((a, b) => {
      const dateA = a.updatedAt || a.createdAt || new Date();
      const dateB = b.updatedAt || b.createdAt || new Date();
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 3);

  if (selectedTicket) {
    const status = statusConfig[selectedTicket.status] || statusConfig.new;
    const severity = severityConfig[selectedTicket.severity] || severityConfig.low;
    const StatusIcon = status.icon;

    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedTicket(null)}
            data-testid="button-back-to-tickets"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold">{selectedTicket.trackingId}</h1>
              <Badge className={`${status.bgColor} ${status.color} border-0`}>{status.label}</Badge>
              <Badge variant={severity.variant}>{severity.label}</Badge>
            </div>
            <p className="text-muted-foreground">{selectedTicket.subject}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedTicket.description}</p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="mt-1">{categoryConfig[selectedTicket.category]?.label || selectedTicket.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="mt-1">
                    {selectedTicket.createdAt 
                      ? format(new Date(selectedTicket.createdAt), "PPpp")
                      : "Unknown"
                    }
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <h3 className="font-semibold">Comments</h3>
                </div>

                {commentsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : comments.length === 0 ? (
                  <p className="py-4 text-center text-muted-foreground">No comments yet</p>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div 
                          key={comment.id} 
                          className={`rounded-lg p-3 ${comment.isAdmin ? "bg-primary/10" : "bg-muted"}`}
                        >
                          <div className="mb-1 flex items-center justify-between flex-wrap gap-2">
                            <span className="text-sm font-medium">
                              {comment.userName || comment.userEmail}
                              {comment.isAdmin && (
                                <Badge variant="outline" className="ml-2">Admin</Badge>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {comment.createdAt ? format(new Date(comment.createdAt), "PPp") : ""}
                            </span>
                          </div>
                          <p className="text-sm">{comment.message}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}

                {selectedTicket.status !== "closed" && (
                  <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      data-testid="input-new-comment"
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={addCommentMutation.isPending || !newComment.trim()}
                      data-testid="button-send-comment"
                    >
                      {addCommentMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedTicket.createdAt 
                        ? format(new Date(selectedTicket.createdAt), "PPp")
                        : "Unknown"
                      }
                    </p>
                  </div>
                </div>
                {selectedTicket.resolvedAt && (
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                    <div>
                      <p className="text-sm font-medium">Resolved</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedTicket.resolvedAt), "PPp")}
                      </p>
                    </div>
                  </div>
                )}
                {selectedTicket.closedAt && (
                  <div className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Closed</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedTicket.closedAt), "PPp")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
        <h1 className="mb-2 text-3xl font-bold">Support Tickets</h1>
        <p className="mb-6 text-blue-100">
          Track your support requests, submit new tickets, and get help from our team.
        </p>
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tickets by ID, subject, or description..."
            className="h-12 w-full rounded-lg border-0 bg-white pl-12 text-gray-900 placeholder:text-gray-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-tickets"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Browse Categories</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const IconComponent = config.icon;
                const count = ticketsByCategory[key] || 0;
                const isActive = categoryFilter === key;
                
                return (
                  <Card 
                    key={key}
                    className={`cursor-pointer hover-elevate ${isActive ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setCategoryFilter(isActive ? null : key)}
                    data-testid={`card-category-${key}`}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${config.bgColor}`}>
                          <IconComponent className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-muted-foreground">{count} ticket{count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                <h2 className="text-lg font-semibold">
                  {categoryFilter ? `${categoryConfig[categoryFilter]?.label} Tickets` : 'All Tickets'}
                </h2>
                {categoryFilter && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCategoryFilter(null)}
                    className="text-muted-foreground"
                  >
                    Clear filter
                  </Button>
                )}
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-new-ticket">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Ticket className="mb-4 h-16 w-16 text-muted-foreground" />
                  <h2 className="mb-2 text-xl font-semibold">
                    {searchQuery || categoryFilter ? "No tickets found" : "No tickets yet"}
                  </h2>
                  <p className="mb-4 text-center text-muted-foreground">
                    {searchQuery || categoryFilter 
                      ? "Try adjusting your search or filter criteria"
                      : "Submit a ticket when you need help with the portal"
                    }
                  </p>
                  {!searchQuery && !categoryFilter && (
                    <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-ticket">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Ticket
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.new;
                  const severity = severityConfig[ticket.severity] || severityConfig.low;
                  const category = categoryConfig[ticket.category] || categoryConfig.other;

                  return (
                    <Card 
                      key={ticket.id} 
                      className="cursor-pointer hover-elevate"
                      onClick={() => setSelectedTicket(ticket)}
                      data-testid={`card-ticket-${ticket.id}`}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${status.bgColor}`}>
                            <status.icon className={`h-6 w-6 ${status.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-medium">{ticket.subject}</h3>
                              <Badge className={`${status.bgColor} ${status.color} border-0`}>{status.label}</Badge>
                              <Badge variant={severity.variant}>{severity.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {ticket.trackingId} - {category.label} - {ticket.createdAt 
                                ? format(new Date(ticket.createdAt), "MMM d, yyyy")
                                : "Unknown"
                              }
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Documents</h2>
            </div>
            <div className="space-y-3">
              {supportDocuments.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="hover-elevate"
                  data-testid={`card-document-${doc.id}`}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${doc.bgColor}`}>
                        <span className={`text-xs font-bold ${doc.color}`}>{doc.type}</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {doc.size} - {doc.date}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({ title: "Download started", description: `Downloading ${doc.title}...` });
                      }}
                      data-testid={`button-download-${doc.id}`}
                    >
                      <Download className="h-5 w-5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Recent Updates</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentUpdates.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No recent updates
                </p>
              ) : (
                recentUpdates.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.new;
                  return (
                    <div 
                      key={ticket.id} 
                      className="cursor-pointer"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-1.5 h-2 w-2 rounded-full ${status.color.replace('text-', 'bg-')}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {ticket.updatedAt 
                              ? formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })
                              : ticket.createdAt 
                                ? formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })
                                : "Unknown"
                            }
                          </p>
                          <p className="text-sm font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            Status: {status.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {tickets.length > 3 && (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setCategoryFilter(null);
                    setSearchQuery("");
                  }}
                >
                  View All Tickets
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Need Help?</h3>
                  <p className="text-xs text-muted-foreground">Create a new support ticket</p>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => setCreateDialogOpen(true)}
                data-testid="button-quick-new-ticket"
              >
                <Plus className="mr-2 h-4 w-4" />
                Submit Ticket
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit a Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and we'll get back to you as soon as possible
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of the issue (min 5 characters)"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                required
                data-testid="input-ticket-subject"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newTicket.category}
                  onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                >
                  <SelectTrigger data-testid="select-ticket-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={newTicket.severity}
                  onValueChange={(v) => setNewTicket({ ...newTicket, severity: v })}
                >
                  <SelectTrigger data-testid="select-ticket-severity">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the issue (min 10 characters)..."
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                rows={5}
                required
                data-testid="textarea-ticket-description"
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createTicketMutation.isPending}
                data-testid="button-submit-new-ticket"
              >
                {createTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Ticket
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
