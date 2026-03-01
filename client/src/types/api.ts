export type Role = "ADMIN" | "TEACHER" | "MANAGER";
export type SubscriptionTier = "BASIC" | "PRO";
export type ClassStatus = "UPCOMING" | "COMPLETED" | "CANCELLED";

export interface Account {
  id: string;
  subscriptionTier: SubscriptionTier;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  accountId: string | null;
  account?: Account;
}

export interface Student {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface Class {
  id: string;
  studentId: string;
  student: Student;
  subject: string;
  dateTime: string;
  status: ClassStatus;
  meetingLink: string | null;
  transcript: string | null;
}

export interface ExtractedIntent {
  intent: "schedule_class" | "cancel_class" | "reschedule_class" | "add_student" | "send_reminder" | "unsupported";
  studentName?: string;
  subject?: string;
  date?: string;
  time?: string;
  newDate?: string;
  newTime?: string;
  message?: string;
  email?: string;
  phone?: string;
}

export interface Notification {
  id: string;
  type: string;
  recipient: string;
  message: string;
  status: string;
  createdAt: string;
}
