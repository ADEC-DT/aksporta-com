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
  MessageSquare
} from "lucide-react";
import type { Ticket as TicketType, TicketComment } from "@shared/schema";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: "New", color: "bg-blue-500", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-yellow-500", icon: Loader2 },
  resolved: { label: "Resolved", color: "bg-green-500", icon: CheckCircle },
  closed: { label: "Closed", color: "bg-gray-500", icon: CheckCircle },
};

const severityConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "default" },
  high: { label: "High", variant: "destructive" },
  critical: { label: "Critical", variant: "destructive" },
};

const categoryLabels: Record<string, string> = {
  netsuite_sync: "NetSuite Sync Error",
  ui_bug: "UI/UX Bug",
  access_issue: "Access Issue",
  data_error: "Data Error",
  performance: "Performance",
  other: "Other",
};

export default function MyTicketsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [newComment, setNewComment] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{selectedTicket.trackingId}</h1>
              <Badge className={status.color}>{status.label}</Badge>
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
                  <p className="mt-1">{categoryLabels[selectedTicket.category] || selectedTicket.category}</p>
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
                          <div className="mb-1 flex items-center justify-between">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Tickets</h1>
          <p className="text-muted-foreground">
            View and manage your support tickets
          </p>
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
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">No tickets yet</h2>
            <p className="mb-4 text-muted-foreground">
              Submit a ticket when you need help with the portal
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-first-ticket">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const status = statusConfig[ticket.status] || statusConfig.new;
            const severity = severityConfig[ticket.severity] || severityConfig.low;
            const StatusIcon = status.icon;

            return (
              <Card 
                key={ticket.id} 
                className="cursor-pointer hover-elevate"
                onClick={() => setSelectedTicket(ticket)}
                data-testid={`card-ticket-${ticket.id}`}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${status.color}`}>
                    <StatusIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {ticket.trackingId}
                      </span>
                      <Badge className={status.color}>{status.label}</Badge>
                      <Badge variant={severity.variant}>{severity.label}</Badge>
                    </div>
                    <h3 className="font-medium">{ticket.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      {categoryLabels[ticket.category] || ticket.category} - Created{" "}
                      {ticket.createdAt 
                        ? format(new Date(ticket.createdAt), "PP")
                        : "Unknown"
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
                placeholder="Brief summary of the issue"
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
                    <SelectItem value="netsuite_sync">NetSuite Sync Error</SelectItem>
                    <SelectItem value="ui_bug">UI/UX Bug</SelectItem>
                    <SelectItem value="access_issue">Access Issue</SelectItem>
                    <SelectItem value="data_error">Data Error</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
                placeholder="Provide detailed information about the issue..."
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
