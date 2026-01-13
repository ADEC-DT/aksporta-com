import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Ticket, 
  Clock, 
  CheckCircle, 
  Loader2,
  ArrowLeft,
  Send,
  MessageSquare,
  Filter
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

export default function AdminTicketsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [newComment, setNewComment] = useState("");

  const { data: ticketsData, isLoading } = useQuery<{ tickets: TicketType[]; total: number }>({
    queryKey: ["/api/admin/tickets", statusFilter],
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<TicketComment[]>({
    queryKey: ["/api/tickets", selectedTicket?.id, "comments"],
    enabled: !!selectedTicket,
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status?: string } }) => {
      return apiRequest("PATCH", `/api/admin/tickets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tickets"] });
      if (selectedTicket) {
        queryClient.invalidateQueries({ queryKey: ["/api/tickets", selectedTicket.id] });
      }
      toast({ title: "Ticket updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update ticket", description: error.message, variant: "destructive" });
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

  function handleStatusChange(ticketId: string, newStatus: string) {
    updateTicketMutation.mutate({ id: ticketId, data: { status: newStatus } });
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(newComment);
  }

  const tickets = ticketsData?.tickets || [];

  if (selectedTicket) {
    const status = statusConfig[selectedTicket.status] || statusConfig.new;
    const severity = severityConfig[selectedTicket.severity] || severityConfig.low;

    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSelectedTicket(null)}
            data-testid="button-back-to-list"
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
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedTicket.description}</p>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="mt-1">{categoryLabels[selectedTicket.category] || selectedTicket.category}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted By</Label>
                  <p className="mt-1">{selectedTicket.userEmail}</p>
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
                      placeholder="Add a response..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      data-testid="input-admin-comment"
                    />
                    <Button 
                      type="submit" 
                      size="icon"
                      disabled={addCommentMutation.isPending || !newComment.trim()}
                      data-testid="button-send-admin-comment"
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
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Update Status</Label>
                <Select
                  value={selectedTicket.status}
                  onValueChange={(v) => handleStatusChange(selectedTicket.id, v)}
                  disabled={updateTicketMutation.isPending}
                >
                  <SelectTrigger data-testid="select-update-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-muted-foreground">Timeline</Label>
                <div className="space-y-3">
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
          <h1 className="text-2xl font-semibold">Ticket Management</h1>
          <p className="text-muted-foreground">
            Manage and respond to support tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Ticket className="mb-4 h-16 w-16 text-muted-foreground" />
              <h2 className="mb-2 text-xl font-semibold">No tickets found</h2>
              <p className="text-muted-foreground">
                {statusFilter !== "all" 
                  ? `No tickets with status "${statusFilter}"`
                  : "No support tickets have been submitted yet"
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tracking ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.new;
                  const severity = severityConfig[ticket.severity] || severityConfig.low;

                  return (
                    <TableRow key={ticket.id} data-testid={`row-ticket-${ticket.id}`}>
                      <TableCell className="font-mono">{ticket.trackingId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ticket.subject}</p>
                          <p className="text-sm text-muted-foreground">{ticket.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>{categoryLabels[ticket.category] || ticket.category}</TableCell>
                      <TableCell>
                        <Badge variant={severity.variant}>{severity.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.createdAt 
                          ? format(new Date(ticket.createdAt), "PP")
                          : "Unknown"
                        }
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedTicket(ticket)}
                          data-testid={`button-view-ticket-${ticket.id}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
