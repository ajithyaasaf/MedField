import { z } from "zod";

// Firestore document interfaces
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'field_rep' | 'admin';
  name: string;
  employeeId?: string;
  territory?: string;
  assignedHospitals: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface Hospital {
  id: string;
  name: string;
  address: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface GeoFence {
  id: string;
  name: string;
  hospitalId?: string;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  hospitalId?: string;
  clockInTime?: Date;
  clockOutTime?: Date;
  clockInLat?: number;
  clockInLng?: number;
  clockOutLat?: number;
  clockOutLng?: number;
  withinGeoFence: boolean;
  manualOverride: boolean;
  date: string; // YYYY-MM-DD format
}

export interface Product {
  id: string;
  name: string;
  model?: string;
  category: string;
  basePrice: number;
  description?: string;
  isActive: boolean;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  userId: string;
  hospitalId: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  totalAmount: number;
  discountPercent: number;
  notes?: string;
  products: {id: string, quantity: number, unitPrice: number}[];
  createdAt: Date;
  sentAt?: Date;
  expiresAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface Schedule {
  id: string;
  userId: string;
  hospitalId: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(['field_rep', 'admin']),
  name: z.string().min(1),
  employeeId: z.string().optional(),
  territory: z.string().optional(),
  assignedHospitals: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const insertHospitalSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isActive: z.boolean().default(true),
});

export const insertGeoFenceSchema = z.object({
  name: z.string().min(1),
  hospitalId: z.string().optional(),
  centerLat: z.number(),
  centerLng: z.number(),
  radiusMeters: z.number().min(1),
  isActive: z.boolean().default(true),
});

export const insertAttendanceSchema = z.object({
  userId: z.string(),
  hospitalId: z.string().optional(),
  clockInTime: z.date().optional(),
  clockOutTime: z.date().optional(),
  clockInLat: z.number().optional(),
  clockInLng: z.number().optional(),
  clockOutLat: z.number().optional(),
  clockOutLng: z.number().optional(),
  withinGeoFence: z.boolean().default(false),
  manualOverride: z.boolean().default(false),
  date: z.string(),
});

export const insertProductSchema = z.object({
  name: z.string().min(1),
  model: z.string().optional(),
  category: z.string().min(1),
  basePrice: z.number().min(0),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const insertQuotationSchema = z.object({
  userId: z.string(),
  hospitalId: z.string(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  totalAmount: z.number().min(0),
  discountPercent: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
  products: z.array(z.object({
    id: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })),
  expiresAt: z.date().optional(),
  approvedBy: z.string().optional(),
});

export const insertScheduleSchema = z.object({
  userId: z.string(),
  hospitalId: z.string(),
  scheduledDate: z.date(),
  startTime: z.string(),
  endTime: z.string(),
  status: z.enum(['confirmed', 'pending', 'cancelled']),
  notes: z.string().optional(),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type InsertGeoFence = z.infer<typeof insertGeoFenceSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type LoginData = z.infer<typeof loginSchema>;
