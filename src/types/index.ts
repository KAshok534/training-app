// ─── Auth / User ────────────────────────────────────────────────────────────

export type UserRole = 'trainee' | 'corporate' | 'government' | 'trainer' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  organization?: string;
  designation?: string;
  avatarUrl?: string;
}

// ─── Course ──────────────────────────────────────────────────────────────────

export type CourseMode = 'Online' | 'Offline' | 'Hybrid';
export type CourseCategory = 'Environment' | 'Industrial' | 'Policy' | 'Safety';

export interface Course {
  id: number;
  title: string;
  subtitle: string;
  duration: string;
  fee: number;
  seats: number;
  filled: number;
  mode: CourseMode;
  startDate: string;
  badge: string;
  modules: number;
  trainer: string;
  category: CourseCategory;
  color: string;
  icon: string;
  topics: string[];
}

export type ModuleType = 'video' | 'pdf' | 'quiz' | 'assignment';
export type ModuleStatus = 'completed' | 'in-progress' | 'locked';

export interface CourseModule {
  id: number;
  title: string;
  type: ModuleType;
  duration: string;
  status: ModuleStatus;
  locked: boolean;
  description?: string;
  videoUrl?: string;
  pdfUrl?: string;
}

export interface RegistrationForm {
  name: string;
  email: string;
  phone: string;
  org: string;
  designation: string;
}

export interface Batch {
  id: number;
  label: string;
  date: string;
  time: string;
  seats: number;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Registration {
  id: string;
  userId: string;
  courseId: number;
  batchId: number;
  paymentStatus: PaymentStatus;
  registrationId: string;
  createdAt: string;
}

export type AttendanceDayStatus = 'present' | 'absent' | 'today' | 'future';

export interface Certificate {
  id: string;
  courseTitle: string;
  studentName: string;
  issuedDate: string;
  certId: string;
  pdfUrl?: string;
  verifyUrl: string;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
  createdAt: string;
}
