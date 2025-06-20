import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'field_rep' | 'admin'
  name: text("name").notNull(),
  employeeId: text("employee_id").unique(),
  territory: text("territory"),
  assignedHospitals: json("assigned_hospitals").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hospitals = pgTable("hospitals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  contactPerson: text("contact_person"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isActive: boolean("is_active").default(true),
});

export const geoFences = pgTable("geo_fences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  centerLat: decimal("center_lat", { precision: 10, scale: 8 }).notNull(),
  centerLng: decimal("center_lng", { precision: 11, scale: 8 }).notNull(),
  radiusMeters: integer("radius_meters").notNull(),
  isActive: boolean("is_active").default(true),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id),
  clockInTime: timestamp("clock_in_time"),
  clockOutTime: timestamp("clock_out_time"),
  clockInLat: decimal("clock_in_lat", { precision: 10, scale: 8 }),
  clockInLng: decimal("clock_in_lng", { precision: 11, scale: 8 }),
  clockOutLat: decimal("clock_out_lat", { precision: 10, scale: 8 }),
  clockOutLng: decimal("clock_out_lng", { precision: 11, scale: 8 }),
  withinGeoFence: boolean("within_geo_fence").default(false),
  manualOverride: boolean("manual_override").default(false),
  date: text("date").notNull(), // YYYY-MM-DD format
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model"),
  category: text("category").notNull(),
  basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: text("quotation_number").notNull().unique(),
  userId: integer("user_id").references(() => users.id).notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id).notNull(),
  status: text("status").notNull(), // 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  notes: text("notes"),
  products: json("products").$type<{id: number, quantity: number, unitPrice: string}[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  expiresAt: timestamp("expires_at"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  hospitalId: integer("hospital_id").references(() => hospitals.id).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  status: text("status").notNull(), // 'confirmed' | 'pending' | 'cancelled'
  notes: text("notes"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertHospitalSchema = createInsertSchema(hospitals).omit({
  id: true,
});

export const insertGeoFenceSchema = createInsertSchema(geoFences).omit({
  id: true,
});

export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  quotationNumber: true,
  createdAt: true,
  sentAt: true,
  approvedAt: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Hospital = typeof hospitals.$inferSelect;
export type InsertHospital = z.infer<typeof insertHospitalSchema>;
export type GeoFence = typeof geoFences.$inferSelect;
export type InsertGeoFence = z.infer<typeof insertGeoFenceSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type LoginData = z.infer<typeof loginSchema>;
