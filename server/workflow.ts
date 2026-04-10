import { storage } from "./storage";
import type { Requisition, ApprovalStep, WorkflowStage } from "@shared/schema";

export interface ApproverAssignment {
  userId: string | null;
  userName: string;
  groupCostCenter?: string;
}

export interface WorkflowRouter {
  getLineManager(requisition: Requisition): Promise<ApproverAssignment>;
  getPurchasingReviewer(requisition: Requisition): Promise<ApproverAssignment>;
  getBudgetOwner(requisition: Requisition): Promise<ApproverAssignment>;
}

async function resolveDirectManager(requisition: Requisition): Promise<ApproverAssignment | null> {
  try {
    if (!requisition.userId) return null;

    const creator = await storage.getManagedUser(requisition.userId);
    if (!creator) return null;

    const empDs = await storage.getDataSourceBySlug("employee-directory");
    if (!empDs) {
      console.warn("[workflow] Employee Directory data source not found — falling back to admin assignment");
      return null;
    }

    const creatorEmployeeCode = creator.employeeCode?.trim();
    const creatorEmail = creator.email?.trim().toLowerCase();

    let creatorRecord = null;
    if (creatorEmployeeCode) {
      creatorRecord = await storage.getDsRecordByField(empDs.id, "employee_code", creatorEmployeeCode);
    }
    if (!creatorRecord && creatorEmail) {
      creatorRecord = await storage.getDsRecordByField(empDs.id, "email", creatorEmail, true);
    }

    if (!creatorRecord) {
      console.warn(`[workflow] No Employee Directory record found for user ${creator.username} (code=${creatorEmployeeCode}, email=${creatorEmail}) — falling back to admin assignment`);
      return null;
    }

    const managerCode = creatorRecord.data.direct_manager_code;
    if (!managerCode) {
      console.warn(`[workflow] Employee record for ${creator.username} has no direct_manager_code — falling back to admin assignment`);
      return null;
    }

    const managerCodeStr = String(managerCode).trim();
    let managerUser = await storage.getManagedUserByEmployeeCode(managerCodeStr);

    if (!managerUser) {
      const managerEmpRecord = await storage.getDsRecordByField(empDs.id, "employee_code", managerCodeStr);
      if (managerEmpRecord && managerEmpRecord.data.email) {
        const managerEmail = String(managerEmpRecord.data.email).trim().toLowerCase();
        managerUser = await storage.getManagedUserByEmail(managerEmail);
      }
    }

    if (!managerUser) {
      const managerName = creatorRecord.data.direct_manager_full_name
        ? String(creatorRecord.data.direct_manager_full_name)
        : `Manager (code: ${managerCode})`;
      console.warn(`[workflow] Direct manager "${managerName}" (code=${managerCode}) has no matching user account — falling back to admin assignment`);
      return null;
    }

    const managerDisplayName = managerUser.displayName
      || [managerUser.firstName, managerUser.lastName].filter(Boolean).join(" ")
      || managerUser.username;

    return { userId: String(managerUser.id), userName: managerDisplayName };
  } catch (err) {
    console.warn("[workflow] Error resolving direct manager:", err);
    return null;
  }
}

const defaultRouter: WorkflowRouter = {
  async getLineManager(req: Requisition): Promise<ApproverAssignment> {
    const manager = await resolveDirectManager(req);
    if (manager) return manager;
    const admins = await getAdminUsers();
    if (admins.length > 0) return { userId: admins[0].id, userName: admins[0].name };
    return { userId: null, userName: "Line Manager (Unassigned)" };
  },
  async getPurchasingReviewer(_req: Requisition): Promise<ApproverAssignment> {
    return { userId: null, userName: "Procurement Department", groupCostCenter: "118001003" };
  },
  async getBudgetOwner(req: Requisition): Promise<ApproverAssignment> {
    if (req.budgetOwnerId) {
      const byCode = await storage.getManagedUserByEmployeeCode(req.budgetOwnerId);
      if (byCode) {
        const displayName = byCode.displayName
          || [byCode.firstName, byCode.lastName].filter(Boolean).join(" ")
          || byCode.username;
        return { userId: String(byCode.id), userName: displayName };
      }

      if (req.budgetOwnerName) {
        const allUsers = await storage.getAllManagedUsers();
        const byName = allUsers.find((u) => {
          const fullName = u.displayName
            || [u.firstName, u.lastName].filter(Boolean).join(" ")
            || u.username;
          return fullName.toLowerCase() === req.budgetOwnerName!.toLowerCase();
        });
        if (byName) {
          const displayName = byName.displayName
            || [byName.firstName, byName.lastName].filter(Boolean).join(" ")
            || byName.username;
          return { userId: String(byName.id), userName: displayName };
        }
      }
    }
    const admins = await getAdminUsers();
    if (admins.length > 0) return { userId: admins[0].id, userName: admins[0].name };
    return { userId: null, userName: "Budget Owner (Unassigned)" };
  },
};

async function getAdminUsers() {
  const allUsers = await storage.getAllManagedUsers();
  return allUsers
    .filter(u => u.role === "admin" || u.role === "superadmin")
    .map(u => ({
      id: String(u.id),
      name: u.displayName || [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username,
    }));
}

let router: WorkflowRouter = defaultRouter;

export function setWorkflowRouter(r: WorkflowRouter) {
  router = r;
}

function updateStatus(requisitionId: string, status: string) {
  return storage.updateRequisition(requisitionId, { status });
}

export async function initializeWorkflow(requisition: Requisition): Promise<ApprovalStep> {
  const assignment = await router.getLineManager(requisition);
  await updateStatus(requisition.id, "Pending Line Manager");
  return await storage.createApprovalStep({
    requisitionId: requisition.id,
    stage: "Pending Line Manager",
    assignedTo: assignment.userId,
    assignedToName: assignment.userName,
    decision: "pending",
    comments: null,
  });
}

export async function approveStep(
  stepId: string,
  comments: string | null,
): Promise<{ nextSteps: ApprovalStep[]; newStatus: WorkflowStage }> {
  const step = await storage.getApprovalStep(stepId);
  if (!step || step.decision !== "pending") {
    throw new Error("Approval step not found or already decided");
  }

  const requisition = await storage.getRequisition(step.requisitionId);
  if (!requisition) throw new Error("Requisition not found");

  const stage = step.stage as WorkflowStage;

  if (stage === "Pending Budget Owner") {
    if (!requisition.selectedQuotationId) {
      throw new Error("Cannot approve: no quotation has been selected for this requisition. Please select a vendor quotation before approving.");
    }
    const quotation = await storage.getQuotation(requisition.selectedQuotationId);
    if (!quotation) {
      throw new Error(`Cannot approve: the selected quotation (${requisition.selectedQuotationId}) was not found. Please select a valid vendor quotation.`);
    }
    const amount = Number(quotation.amountAed);
    if (isNaN(amount) || amount < 0) {
      throw new Error("Cannot approve: the selected quotation has an invalid amount.");
    }

    await storage.updateApprovalStep(stepId, {
      decision: "approved",
      comments,
      decidedAt: new Date(),
    });

    const newStatus: WorkflowStage = "Pending Finance Review";
    await updateStatus(requisition.id, newStatus);
    const ns = await storage.createApprovalStep({
      requisitionId: requisition.id,
      stage: newStatus,
      assignedTo: null,
      assignedToName: "Finance Department",
      assignedToGroup: "finance",
      decision: "pending",
      comments: null,
    });
    return { nextSteps: [ns], newStatus };
  }

  await storage.updateApprovalStep(stepId, {
    decision: "approved",
    comments,
    decidedAt: new Date(),
  });

  switch (stage) {
    case "Pending Line Manager": {
      const assignment = await router.getPurchasingReviewer(requisition);
      const newStatus: WorkflowStage = "Pending Purchasing Review";
      await updateStatus(requisition.id, newStatus);
      const nextStep = await storage.createApprovalStep({
        requisitionId: requisition.id,
        stage: newStatus,
        assignedTo: assignment.userId,
        assignedToName: assignment.userName,
        assignedToGroup: assignment.groupCostCenter || null,
        decision: "pending",
        comments: null,
      });
      return { nextSteps: [nextStep], newStatus };
    }

    case "Pending Purchasing Review": {
      const assignment = await router.getBudgetOwner(requisition);
      const newStatus: WorkflowStage = "Pending Budget Owner";
      await updateStatus(requisition.id, newStatus);
      const nextStep = await storage.createApprovalStep({
        requisitionId: requisition.id,
        stage: newStatus,
        assignedTo: assignment.userId,
        assignedToName: assignment.userName,
        decision: "pending",
        comments: null,
      });
      return { nextSteps: [nextStep], newStatus };
    }

    default:
      throw new Error(`Cannot approve at stage: ${stage}`);
  }
}

export async function rejectStep(
  stepId: string,
  comments: string | null,
): Promise<{ newStatus: WorkflowStage }> {
  const step = await storage.getApprovalStep(stepId);
  if (!step || step.decision !== "pending") {
    throw new Error("Approval step not found or already decided");
  }

  await storage.updateApprovalStep(stepId, {
    decision: "rejected",
    comments,
    decidedAt: new Date(),
  });

  const requisition = await storage.getRequisition(step.requisitionId);
  if (!requisition) throw new Error("Requisition not found");

  const newStatus: WorkflowStage = "Rejected";
  await updateStatus(requisition.id, newStatus);

  const allSteps = await storage.getApprovalSteps(step.requisitionId);
  const otherPending = allSteps.filter(
    s => s.id !== stepId && s.decision === "pending"
  );
  for (const ps of otherPending) {
    await storage.updateApprovalStep(ps.id, {
      decision: "rejected",
      comments: "Auto-rejected due to rejection at this stage",
      decidedAt: new Date(),
    });
  }

  const rejectionReason = comments ? `: ${comments}` : "";
  await storage.createRequisitionComment({
    requisitionId: step.requisitionId,
    authorId: "system",
    authorName: "Workflow System",
    body: `Requisition rejected by ${step.assignedToName} at stage "${step.stage}"${rejectionReason}. The requisition status has been set to Rejected.`,
  });

  return { newStatus };
}

export async function completeFinanceReview(
  stepId: string,
  budgetFlag: "available" | "not_available",
  comments: string | null,
): Promise<{ newStatus: WorkflowStage }> {
  const step = await storage.getApprovalStep(stepId);
  if (!step || step.decision !== "pending") {
    throw new Error("Approval step not found or already decided");
  }
  if (step.stage !== "Pending Finance Review") {
    throw new Error("This step is not a Finance Review step");
  }

  const requisition = await storage.getRequisition(step.requisitionId);
  if (!requisition) throw new Error("Requisition not found");

  await storage.updateApprovalStep(stepId, {
    decision: "completed",
    comments,
    budgetFlag,
    decidedAt: new Date(),
  });

  const newStatus: WorkflowStage = "Ready for Purchase";
  await updateStatus(requisition.id, newStatus);

  return { newStatus };
}

export async function markPOCreated(requisitionId: string): Promise<void> {
  const requisition = await storage.getRequisition(requisitionId);
  if (!requisition) throw new Error("Requisition not found");
  if (requisition.status !== "Ready for Purchase") {
    throw new Error("Requisition must be in 'Ready for Purchase' status to create PO");
  }
  await updateStatus(requisitionId, "PO Created");
}
