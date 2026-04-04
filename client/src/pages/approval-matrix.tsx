import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { ApprovalMatrixRule } from "@shared/schema";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, CheckCircle, Search, GitBranch } from "lucide-react";

interface EmployeeLookupResult {
  id: string;
  employeeCode: string | number | null;
  fullName: string;
  email: string;
  position: string;
  department: string;
}

interface RuleFormData {
  fromAmount: string;
  toAmount: string;
  approverEmployeeCode: string | null;
  approverName: string;
  isAutoApprove: boolean;
}

const defaultFormData: RuleFormData = {
  fromAmount: "",
  toAmount: "",
  approverEmployeeCode: null,
  approverName: "",
  isAutoApprove: false,
};

export default function ApprovalMatrixPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ApprovalMatrixRule | null>(null);
  const [formData, setFormData] = useState<RuleFormData>(defaultFormData);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<ApprovalMatrixRule | null>(null);
  const [empSearchTerm, setEmpSearchTerm] = useState("");
  const [empSearchOpen, setEmpSearchOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const { data: rules = [], isLoading } = useQuery<ApprovalMatrixRule[]>({
    queryKey: ["/api/admin/approval-matrix"],
    enabled: isAdmin,
  });

  const { data: employeeLookupResults = [], isFetching: empSearching } = useQuery<EmployeeLookupResult[]>({
    queryKey: ["/api/admin/employee-directory/lookup", empSearchTerm],
    queryFn: async () => {
      if (!empSearchTerm.trim()) return [];
      const res = await fetch(`/api/admin/employee-directory/lookup?search=${encodeURIComponent(empSearchTerm)}`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAdmin && empSearchOpen && empSearchTerm.trim().length >= 2,
  });

  const [employeeNames, setEmployeeNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const codes = rules
      .filter(r => r.approverEmployeeCode && !employeeNames[r.approverEmployeeCode])
      .map(r => r.approverEmployeeCode!);
    const uniqueCodes = [...new Set(codes)];

    uniqueCodes.forEach(async (code) => {
      try {
        const res = await fetch(`/api/admin/employee-directory/lookup?search=${encodeURIComponent(code)}`, { credentials: "include" });
        if (res.ok) {
          const results: EmployeeLookupResult[] = await res.json();
          const match = results.find(e => String(e.employeeCode) === code);
          if (match) {
            setEmployeeNames(prev => ({ ...prev, [code]: match.fullName }));
          }
        }
      } catch (err) {
        console.error(`Failed to resolve employee name for code ${code}:`, err);
      }
    });
  }, [rules]);

  const createMutation = useMutation({
    mutationFn: async (data: { fromAmount: string; toAmount: string; approverEmployeeCode: string | null; isAutoApprove: boolean }) => {
      return apiRequest("POST", "/api/admin/approval-matrix", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/approval-matrix"] });
      await queryClient.refetchQueries({ queryKey: ["/api/admin/approval-matrix"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Rule created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create rule", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { fromAmount: string; toAmount: string; approverEmployeeCode: string | null; isAutoApprove: boolean } }) => {
      return apiRequest("PATCH", `/api/admin/approval-matrix/${id}`, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/approval-matrix"] });
      await queryClient.refetchQueries({ queryKey: ["/api/admin/approval-matrix"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: "Rule updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update rule", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/approval-matrix/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/admin/approval-matrix"] });
      await queryClient.refetchQueries({ queryKey: ["/api/admin/approval-matrix"] });
      setDeleteDialogOpen(false);
      setRuleToDelete(null);
      toast({ title: "Rule deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete rule", description: error.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setFormData(defaultFormData);
    setEditingRule(null);
    setEmpSearchTerm("");
    setEmpSearchOpen(false);
  }

  function handleOpenCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function handleOpenEdit(rule: ApprovalMatrixRule) {
    setEditingRule(rule);
    setFormData({
      fromAmount: String(rule.fromAmount),
      toAmount: String(rule.toAmount),
      approverEmployeeCode: rule.approverEmployeeCode,
      approverName: rule.approverEmployeeCode ? (employeeNames[rule.approverEmployeeCode] || rule.approverEmployeeCode) : "",
      isAutoApprove: rule.isAutoApprove,
    });
    setDialogOpen(true);
  }

  function checkClientOverlap(from: number, to: number, excludeId?: string): boolean {
    for (const rule of rules) {
      if (excludeId && rule.id === excludeId) continue;
      const ruleFrom = Number(rule.fromAmount);
      const ruleTo = Number(rule.toAmount);
      if (from <= ruleTo && to >= ruleFrom) {
        return true;
      }
    }
    return false;
  }

  function checkZeroRuleExists(excludeId?: string, newFrom?: number): boolean {
    for (const rule of rules) {
      if (excludeId && rule.id === excludeId) continue;
      if (Number(rule.fromAmount) === 0) return true;
    }
    if (newFrom === 0) return true;
    return false;
  }

  function handleSubmit() {
    const from = Number(formData.fromAmount);
    const to = Number(formData.toAmount);

    if (isNaN(from) || isNaN(to) || from < 0 || to < 0) {
      toast({ title: "Amounts must be valid non-negative numbers", variant: "destructive" });
      return;
    }
    if (from > to) {
      toast({ title: "From Amount must be less than or equal to To Amount", variant: "destructive" });
      return;
    }
    if (!formData.isAutoApprove && !formData.approverEmployeeCode) {
      toast({ title: "Either enable Auto Approve or select an Approver", variant: "destructive" });
      return;
    }

    const excludeId = editingRule?.id;
    if (checkClientOverlap(from, to, excludeId)) {
      toast({ title: "This range overlaps with an existing rule", variant: "destructive" });
      return;
    }

    if (!checkZeroRuleExists(excludeId, from)) {
      toast({ title: "At least one rule must start from 0", variant: "destructive" });
      return;
    }

    const payload = {
      fromAmount: formData.fromAmount,
      toAmount: formData.toAmount,
      approverEmployeeCode: formData.isAutoApprove ? null : formData.approverEmployeeCode,
      isAutoApprove: formData.isAutoApprove,
    };

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function formatAmount(amount: string | null) {
    if (!amount) return "—";
    const num = Number(amount);
    return isNaN(num) ? amount : num.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getApproverName(code: string | null) {
    if (!code) return "—";
    return employeeNames[code] || code;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="page-approval-matrix">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Approval Matrix</h1>
          <p className="text-muted-foreground">Configure approval rules based on AED amount ranges</p>
        </div>
        <Button onClick={handleOpenCreate} data-testid="button-add-rule">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Approval Rules</CardTitle>
          <CardDescription>Rules are evaluated based on amount ranges. Each range maps to an approver or auto-approval.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No approval rules configured</p>
              <p className="text-sm text-muted-foreground mt-1">Add your first rule to get started</p>
            </div>
          ) : (
            <Table data-testid="table-approval-matrix">
              <TableHeader>
                <TableRow>
                  <TableHead>From Amount (AED)</TableHead>
                  <TableHead>To Amount (AED)</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Auto Approve</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} data-testid={`row-rule-${rule.id}`}>
                    <TableCell className="font-mono" data-testid={`text-from-amount-${rule.id}`}>
                      {formatAmount(rule.fromAmount)}
                    </TableCell>
                    <TableCell className="font-mono" data-testid={`text-to-amount-${rule.id}`}>
                      {formatAmount(rule.toAmount)}
                    </TableCell>
                    <TableCell data-testid={`text-approver-${rule.id}`}>
                      {rule.isAutoApprove ? (
                        <span className="text-muted-foreground italic">N/A</span>
                      ) : (
                        getApproverName(rule.approverEmployeeCode)
                      )}
                    </TableCell>
                    <TableCell data-testid={`badge-auto-approve-${rule.id}`}>
                      {rule.isAutoApprove ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Auto
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(rule)}
                          data-testid={`button-edit-rule-${rule.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setRuleToDelete(rule); setDeleteDialogOpen(true); }}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-rule-${rule.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-rule-form">
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Add Rule"}</DialogTitle>
            <DialogDescription>
              {editingRule ? "Update the approval rule configuration." : "Define a new approval rule for an amount range."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromAmount">From Amount (AED)</Label>
                <Input
                  id="fromAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.fromAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, fromAmount: e.target.value }))}
                  data-testid="input-from-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toAmount">To Amount (AED)</Label>
                <Input
                  id="toAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.toAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, toAmount: e.target.value }))}
                  data-testid="input-to-amount"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAutoApprove"
                checked={formData.isAutoApprove}
                onCheckedChange={(checked) => {
                  setFormData(prev => ({
                    ...prev,
                    isAutoApprove: checked as boolean,
                    approverEmployeeCode: checked ? null : prev.approverEmployeeCode,
                    approverName: checked ? "" : prev.approverName,
                  }));
                }}
                data-testid="checkbox-auto-approve"
              />
              <Label htmlFor="isAutoApprove" className="cursor-pointer">Auto Approve</Label>
            </div>

            {!formData.isAutoApprove && (
              <div className="space-y-2">
                <Label>Approver</Label>
                {formData.approverEmployeeCode ? (
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <span className="flex-1 text-sm font-medium" data-testid="text-selected-approver">
                      {formData.approverName}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, approverEmployeeCode: null, approverName: "" }));
                        setEmpSearchTerm("");
                        setEmpSearchOpen(true);
                      }}
                      data-testid="button-change-approver"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search employee by name or code..."
                        className="pl-10"
                        value={empSearchTerm}
                        onChange={(e) => { setEmpSearchTerm(e.target.value); setEmpSearchOpen(true); }}
                        onFocus={() => setEmpSearchOpen(true)}
                        data-testid="input-approver-search"
                      />
                    </div>
                    {empSearchOpen && empSearchTerm.length >= 2 && (
                      <div className="border rounded-md max-h-48 overflow-y-auto">
                        {empSearching ? (
                          <div className="flex justify-center py-3">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : employeeLookupResults.length === 0 ? (
                          <p className="text-sm text-muted-foreground p-3">No employees found</p>
                        ) : (
                          employeeLookupResults.map((emp) => (
                            <button
                              key={emp.id}
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-muted/50 border-b last:border-b-0 transition-colors"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  approverEmployeeCode: String(emp.employeeCode),
                                  approverName: emp.fullName,
                                }));
                                setEmpSearchOpen(false);
                                setEmpSearchTerm("");
                                setEmployeeNames(prev => ({ ...prev, [String(emp.employeeCode)]: emp.fullName }));
                              }}
                              data-testid={`option-employee-${emp.employeeCode}`}
                            >
                              <div className="text-sm font-medium">{emp.fullName}</div>
                              <div className="text-xs text-muted-foreground">
                                {emp.employeeCode} · {emp.position || emp.department || "—"}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }} data-testid="button-cancel-rule">
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending} data-testid="button-save-rule">
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingRule ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-rule">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this approval rule for the range{" "}
              {ruleToDelete && `AED ${formatAmount(ruleToDelete.fromAmount)} – ${formatAmount(ruleToDelete.toAmount)}`}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => ruleToDelete && deleteMutation.mutate(ruleToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
