// ==========================================
// HR System - Core Type Definitions
// ==========================================

// --- Employee (従業員/派遣スタッフ) ---
export interface Employee {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  skills: string[];
  skillVector?: number[];
  certifications: string[];
  experience: ExperienceEntry[];
  employmentType: "dispatch" | "contract" | "fulltime" | "parttime";
  status: "active" | "inactive" | "available" | "on_assignment";
  desiredSalary?: number;
  availableFrom?: string;
  preferredLocations: string[];
  notes: string;
  photoUrl?: string;
  resumeUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExperienceEntry {
  company: string;
  role: string;
  startDate: string;
  endDate?: string;
  description: string;
}

// --- Contract (契約) ---
export interface Contract {
  id: string;
  employeeId: string;
  employeeName: string;
  clientCompany: string;
  startDate: string;
  endDate: string;
  role: string;
  hourlySalary: number;
  billingRate: number;
  status: "active" | "expiring_soon" | "expired" | "terminated";
  alertSentDays: number[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// --- Attendance (勤怠) ---
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  workMinutes: number;
  overtimeMinutes: number;
  status: "present" | "absent" | "late" | "early_leave" | "holiday" | "paid_leave";
  notes: string;
  createdAt: string;
}

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  month: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  paidLeaveDays: number;
  totalWorkHours: number;
  totalOvertimeHours: number;
}

// --- Payroll (給与) ---
export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  overtimePay: number;
  transportationAllowance: number;
  otherAllowances: number;
  grossPay: number;
  healthInsurance: number;
  pensionInsurance: number;
  employmentInsurance: number;
  incomeTax: number;
  residentTax: number;
  otherDeductions: number;
  totalDeductions: number;
  netPay: number;
  status: "draft" | "confirmed" | "paid";
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

// --- Recruitment (採用/案件) ---
export interface JobPosting {
  id: string;
  clientCompany: string;
  title: string;
  description: string;
  requiredSkills: string[];
  skillVector?: number[];
  preferredSkills: string[];
  location: string;
  salaryMin: number;
  salaryMax: number;
  startDate: string;
  duration: string;
  status: "open" | "filled" | "closed" | "on_hold";
  matchedCandidates: MatchResult[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchResult {
  employeeId: string;
  employeeName: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

// --- Evaluation (評価) ---
export interface Evaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  evaluatorName: string;
  period: string;
  performanceScore: number;
  skillScore: number;
  attitudeScore: number;
  overallScore: number;
  strengths: string;
  areasForImprovement: string;
  goals: string;
  comments: string;
  status: "draft" | "submitted" | "approved";
  createdAt: string;
  updatedAt: string;
}

// --- Dashboard ---
export interface DashboardStats {
  totalEmployees: number;
  activeAssignments: number;
  expiringContracts: number;
  openPositions: number;
  attendanceRate: number;
  pendingPayrolls: number;
}

// --- Common ---
export type SortDirection = "asc" | "desc";

export interface PaginationParams {
  page: number;
  limit: number;
}
