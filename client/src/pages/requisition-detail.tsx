import { OtherModulesSection } from "@/components/other-modules-section";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Download, FileText, Image, Calendar, User, Building2, DollarSign, Pencil, X, Send, MessageSquare } from "lucide-react";
import type { Requisition, RequisitionAttachment, RequisitionComment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const statusOptions = ["Submitted", "Awaiting Approval", "PO Created", "Rejected"];

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Submitted": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0";
    case "Awaiting Approval": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0";
    case "PO Created": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0";
    case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0";
    default: return "";
  }
}

function formatCost(cost: number) {
  return new Intl.NumberFormat("en-AE", { style: "decimal", minimumFractionDigits: 2 }).format(cost / 100);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function RequisitionDetailPage() {
  const [location, navigate] = useLocation();
  const [, erpParams] = useRoute("/erp/procurement/requisitions/:id");
  const [, intranetParams] = useRoute("/intranet/requisitions/:id");
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const params = erpParams || intranetParams;
  const id = params?.id;
  const isIntranet = location.startsWith("/intranet");
  const listPath = isIntranet ? "/intranet/requisitions" : "/erp/procurement/requisitions";

  const [isEditing, setIsEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    vendorName: "",
    estimatedCostAed: 0,
    budgetLineAccountCode: "",
    isBudgeted: false,
    requiredByDate: "",
    projectStartDate: "",
  });
  const [commentBody, setCommentBody] = useState("");

  const { data: requisition, isLoading } = useQuery<Requisition>({
    queryKey: ["/api/requisitions", id],
    queryFn: () => fetch(`/api/requisitions/${id}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: attachments = [] } = useQuery<RequisitionAttachment[]>({
    queryKey: ["/api/requisitions", id, "attachments"],
    queryFn: () => fetch(`/api/requisitions/${id}/attachments`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery<RequisitionComment[]>({
    queryKey: ["/api/requisitions", id, "comments"],
    queryFn: () => fetch(`/api/requisitions/${id}/comments`, { credentials: "include" }).then(r => r.json()),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/requisitions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requisitions", id] });
      toast({ title: "Status updated" });
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async (data: typeof editFields) => {
      await apiRequest("PATCH", `/api/requisitions/${id}`, {
        vendorName: data.vendorName || null,
        estimatedCostAed: data.estimatedCostAed,
        budgetLineAccountCode: data.budgetLineAccountCode || null,
        isBudgeted: data.isBudgeted,
        requiredByDate: data.requiredByDate,
        projectStartDate: data.projectStartDate || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requisitions", id] });
      setIsEditing(false);
      toast({ title: "Details updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update details", variant: "destructive" });
    },
  });

  const postCommentMutation = useMutation({
    mutationFn: async (body: string) => {
      await apiRequest("POST", `/api/requisitions/${id}/comments`, { body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requisitions", id, "comments"] });
      setCommentBody("");
      toast({ title: "Comment posted" });
    },
    onError: () => {
      toast({ title: "Failed to post comment", variant: "destructive" });
    },
  });

  function startEditing() {
    if (!requisition) return;
    setEditFields({
      vendorName: requisition.vendorName || "",
      estimatedCostAed: requisition.estimatedCostAed,
      budgetLineAccountCode: requisition.budgetLineAccountCode || "",
      isBudgeted: requisition.isBudgeted,
      requiredByDate: requisition.requiredByDate,
      projectStartDate: requisition.projectStartDate || "",
    });
    setIsEditing(true);
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Requisition not found</p>
        <Button variant="outline" onClick={() => navigate(listPath)} className="mt-4">Back to List</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(listPath)} data-testid="button-back-list">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-outfit" data-testid="text-detail-title">{requisition.requestTitle}</h1>
            <p className="text-sm text-muted-foreground font-mono">ID: {requisition.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Select value={requisition.status} onValueChange={(val) => updateStatusMutation.mutate(val)}>
              <SelectTrigger className="w-[180px]" data-testid="select-detail-status">
                <Badge className={getStatusBadgeClass(requisition.status)}>{requisition.status}</Badge>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Badge className={getStatusBadgeClass(requisition.status)} data-testid="badge-detail-status">{requisition.status}</Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium">{requisition.date}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Department</p>
              <p className="text-sm font-medium">{requisition.department}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Requested By</p>
              <p className="text-sm font-medium">{requisition.requestedBy}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Est. Cost (AED)</p>
              <p className="text-sm font-medium">{formatCost(requisition.estimatedCostAed)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Request Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Position</p>
              <p className="text-sm">{requisition.position || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date of Request</p>
              <p className="text-sm">{requisition.dateOfRequest}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Description of Request</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{requisition.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Justification / Business Need</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{requisition.justification}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Budget Details</CardTitle>
            {isAdmin && !isEditing && (
              <Button variant="outline" size="sm" onClick={startEditing} data-testid="button-edit-details">
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit Details
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-estimated-cost">Estimated Cost (AED) — in fils</Label>
                  <Input
                    id="edit-estimated-cost"
                    type="number"
                    value={editFields.estimatedCostAed}
                    onChange={(e) => setEditFields({ ...editFields, estimatedCostAed: parseInt(e.target.value) || 0 })}
                    data-testid="input-edit-estimated-cost"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-budget-line">Budget Line / Account Code</Label>
                  <Input
                    id="edit-budget-line"
                    value={editFields.budgetLineAccountCode}
                    onChange={(e) => setEditFields({ ...editFields, budgetLineAccountCode: e.target.value })}
                    data-testid="input-edit-budget-line"
                  />
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Switch
                    id="edit-is-budgeted"
                    checked={editFields.isBudgeted}
                    onCheckedChange={(checked) => setEditFields({ ...editFields, isBudgeted: checked })}
                    data-testid="switch-edit-is-budgeted"
                  />
                  <Label htmlFor="edit-is-budgeted">Is this budgeted?</Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vendor-name">Vendor Name</Label>
                  <Input
                    id="edit-vendor-name"
                    value={editFields.vendorName}
                    onChange={(e) => setEditFields({ ...editFields, vendorName: e.target.value })}
                    data-testid="input-edit-vendor-name"
                  />
                </div>
              </div>
              <div className="border-t pt-4 mt-2">
                <p className="text-sm font-medium mb-3">Timeline</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-required-by">Required By Date</Label>
                    <Input
                      id="edit-required-by"
                      type="date"
                      value={editFields.requiredByDate}
                      onChange={(e) => setEditFields({ ...editFields, requiredByDate: e.target.value })}
                      data-testid="input-edit-required-by"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-project-start">Project / Activity Start Date</Label>
                    <Input
                      id="edit-project-start"
                      type="date"
                      value={editFields.projectStartDate}
                      onChange={(e) => setEditFields({ ...editFields, projectStartDate: e.target.value })}
                      data-testid="input-edit-project-start"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => updateDetailsMutation.mutate(editFields)}
                  disabled={updateDetailsMutation.isPending}
                  data-testid="button-save-details"
                >
                  {updateDetailsMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel-edit"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Estimated Cost (AED)</p>
                <p className="text-sm font-medium">{formatCost(requisition.estimatedCostAed)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget Line / Account Code</p>
                <p className="text-sm">{requisition.budgetLineAccountCode || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Is this budgeted?</p>
                <Badge className={requisition.isBudgeted ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0"}>
                  {requisition.isBudgeted ? "Yes" : "No"}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendor Name</p>
                <p className="text-sm">{requisition.vendorName || "—"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isEditing && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Required By Date</p>
                <p className="text-sm font-medium">{requisition.requiredByDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Project / Activity Start Date</p>
                <p className="text-sm">{requisition.projectStartDate || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {attachments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Supporting Documents ({attachments.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30" data-testid={`attachment-${att.id}`}>
                {att.fileType === "application/pdf" ? (
                  <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                ) : (
                  <Image className="h-5 w-5 text-blue-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.filename}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(att.fileSize)}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/requisition-attachments/${att.id}/download`, "_blank")}
                  data-testid={`button-download-${att.id}`}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comments {comments.length > 0 && `(${comments.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {commentsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-comments">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg border bg-muted/20" data-testid={`comment-${comment.id}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium" data-testid={`comment-author-${comment.id}`}>{comment.authorName}</p>
                    <p className="text-xs text-muted-foreground" data-testid={`comment-time-${comment.id}`}>
                      {comment.createdAt ? formatRelativeTime(String(comment.createdAt)) : ""}
                    </p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap" data-testid={`comment-body-${comment.id}`}>{comment.body}</p>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <div className="border-t pt-4 space-y-2">
              <Textarea
                placeholder="Write a comment..."
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={3}
                data-testid="textarea-comment"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    if (commentBody.trim()) {
                      postCommentMutation.mutate(commentBody.trim());
                    }
                  }}
                  disabled={!commentBody.trim() || postCommentMutation.isPending}
                  data-testid="button-post-comment"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {postCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OtherModulesSection />
    </div>
  );
}
