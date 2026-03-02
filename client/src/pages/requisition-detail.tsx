import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Download, FileText, Image, Calendar, User, Building2, DollarSign } from "lucide-react";
import type { Requisition, RequisitionAttachment } from "@shared/schema";

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

export default function RequisitionDetailPage() {
  const [, navigate] = useLocation();
  const [matched, params] = useRoute("/erp/procurement/requisitions/:id");
  const { toast } = useToast();
  const id = params?.id;

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

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PATCH", `/api/requisitions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requisitions", id] });
      toast({ title: "Status updated" });
    },
  });

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
        <Button variant="outline" onClick={() => navigate("/erp/procurement/requisitions")} className="mt-4">Back to List</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/erp/procurement/requisitions")} data-testid="button-back-list">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-outfit" data-testid="text-detail-title">{requisition.requestTitle}</h1>
            <p className="text-sm text-muted-foreground font-mono">ID: {requisition.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
        <CardHeader><CardTitle className="text-lg">Budget Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
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
        </CardContent>
      </Card>

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
    </div>
  );
}
