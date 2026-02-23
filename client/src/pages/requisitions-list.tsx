import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Plus, Search, Filter } from "lucide-react";
import type { Requisition } from "@shared/schema";

const statusOptions = ["Submitted", "Awaiting Approval", "Approved", "Rejected"];

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "Submitted": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0";
    case "Awaiting Approval": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0";
    case "Approved": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0";
    case "Rejected": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0";
    default: return "";
  }
}

export default function RequisitionsListPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: requisitions = [], isLoading } = useQuery<Requisition[]>({
    queryKey: ["/api/requisitions", search, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      return fetch(`/api/requisitions?${params.toString()}`, { credentials: "include" }).then(r => r.json());
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/requisitions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requisitions"] });
      toast({ title: "Status updated", description: "Requisition status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });
    },
  });

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat("en-AE", { style: "decimal", minimumFractionDigits: 2 }).format(cost / 100);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/finance")} data-testid="button-back-finance">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold font-outfit" data-testid="text-page-title">Requisitions</h1>
            <p className="text-muted-foreground">Manage approval request forms</p>
          </div>
        </div>
        <Button onClick={() => navigate("/finance/procurement/requisitions/new")} data-testid="button-new-requisition">
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, department, or requester..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            data-testid="input-search-requisitions"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-3 text-left font-medium text-muted-foreground">Request ID</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Request Title</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Department</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Requested By</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Est. Cost (AED)</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Date of Request</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Required By</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">Loading...</td>
                  </tr>
                ) : requisitions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">No requisitions found</td>
                  </tr>
                ) : (
                  requisitions.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("select, button")) return;
                        navigate(`/finance/procurement/requisitions/${req.id}`);
                      }}
                      data-testid={`row-requisition-${req.id}`}
                    >
                      <td className="p-3 font-mono text-xs" data-testid={`text-req-id-${req.id}`}>
                        {req.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="p-3 font-medium" data-testid={`text-req-title-${req.id}`}>{req.requestTitle}</td>
                      <td className="p-3 text-muted-foreground">{req.department}</td>
                      <td className="p-3 text-muted-foreground">{req.requestedBy}</td>
                      <td className="p-3 text-right font-medium">{formatCost(req.estimatedCostAed)}</td>
                      <td className="p-3 text-muted-foreground">{req.dateOfRequest}</td>
                      <td className="p-3 text-muted-foreground">{req.requiredByDate}</td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={req.status}
                          onValueChange={(val) => updateStatusMutation.mutate({ id: req.id, status: val })}
                        >
                          <SelectTrigger className="h-7 text-xs w-[150px]" data-testid={`select-status-${req.id}`}>
                            <Badge className={`${getStatusBadgeClass(req.status)} text-[10px]`}>{req.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
