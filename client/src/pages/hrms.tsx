import { ComingSoon } from "@/components/coming-soon";
import { Users } from "lucide-react";

export default function HRMSPage() {
  return (
    <ComingSoon
      moduleName="HRMS"
      description="Human Resource Management System for employee directory, payroll, attendance, and performance tracking."
      icon={Users}
      plannedFeatures={[
        "Employee directory with department hierarchy",
        "Payroll processing and salary management",
        "Attendance tracking and leave management",
        "Performance review cycles and goal setting",
        "Training and development records",
      ]}
    />
  );
}
