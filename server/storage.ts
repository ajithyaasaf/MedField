import {
  users, hospitals, geoFences, attendanceRecords, products, quotations, schedules,
  type User, type InsertUser, type Hospital, type InsertHospital,
  type GeoFence, type InsertGeoFence, type AttendanceRecord, type InsertAttendance,
  type Product, type InsertProduct, type Quotation, type InsertQuotation,
  type Schedule, type InsertSchedule
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Hospitals
  getHospital(id: number): Promise<Hospital | undefined>;
  getAllHospitals(): Promise<Hospital[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospital(id: number, updates: Partial<InsertHospital>): Promise<Hospital | undefined>;

  // Geo Fences
  getGeoFence(id: number): Promise<GeoFence | undefined>;
  getAllGeoFences(): Promise<GeoFence[]>;
  getGeoFencesByHospital(hospitalId: number): Promise<GeoFence[]>;
  createGeoFence(geoFence: InsertGeoFence): Promise<GeoFence>;
  updateGeoFence(id: number, updates: Partial<InsertGeoFence>): Promise<GeoFence | undefined>;
  deleteGeoFence(id: number): Promise<boolean>;

  // Attendance
  getAttendanceRecord(id: number): Promise<AttendanceRecord | undefined>;
  getAttendanceByUser(userId: number, date?: string): Promise<AttendanceRecord[]>;
  getAttendanceByDate(date: string): Promise<AttendanceRecord[]>;
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: number, updates: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined>;

  // Products
  getProduct(id: number): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined>;

  // Quotations
  getQuotation(id: number): Promise<Quotation | undefined>;
  getQuotationsByUser(userId: number): Promise<Quotation[]>;
  getQuotationsByStatus(status: string): Promise<Quotation[]>;
  getAllQuotations(): Promise<Quotation[]>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, updates: Partial<Quotation>): Promise<Quotation | undefined>;

  // Schedules
  getSchedule(id: number): Promise<Schedule | undefined>;
  getSchedulesByUser(userId: number, date?: string): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, updates: Partial<InsertSchedule>): Promise<Schedule | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private hospitals: Map<number, Hospital>;
  private geoFences: Map<number, GeoFence>;
  private attendanceRecords: Map<number, AttendanceRecord>;
  private products: Map<number, Product>;
  private quotations: Map<number, Quotation>;
  private schedules: Map<number, Schedule>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.hospitals = new Map();
    this.geoFences = new Map();
    this.attendanceRecords = new Map();
    this.products = new Map();
    this.quotations = new Map();
    this.schedules = new Map();
    this.currentId = {
      users: 1,
      hospitals: 1,
      geoFences: 1,
      attendanceRecords: 1,
      products: 1,
      quotations: 1,
      schedules: 1
    };

    // Initialize with some sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create admin user
    const admin: User = {
      id: this.currentId.users++,
      username: "admin",
      password: "admin123", // In production, this should be hashed
      role: "admin",
      name: "System Administrator",
      employeeId: "ADMIN001",
      territory: null,
      assignedHospitals: [],
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create field rep user
    const fieldRep: User = {
      id: this.currentId.users++,
      username: "sarah.johnson",
      password: "password123",
      role: "field_rep",
      name: "Sarah Johnson",
      employeeId: "REP001",
      territory: "Downtown",
      assignedHospitals: [1, 2],
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(fieldRep.id, fieldRep);

    // Create hospitals
    const hospital1: Hospital = {
      id: this.currentId.hospitals++,
      name: "St. Mary's Hospital",
      address: "123 Healthcare Blvd, Medical District",
      contactPerson: "Dr. Michael Thompson",
      contactEmail: "contact@stmarys.com",
      contactPhone: "+1-555-0123",
      latitude: "40.7589",
      longitude: "-73.9851",
      isActive: true,
    };
    this.hospitals.set(hospital1.id, hospital1);

    const hospital2: Hospital = {
      id: this.currentId.hospitals++,
      name: "General Medical Center",
      address: "456 Health Ave, Downtown",
      contactPerson: "Dr. Lisa Chen",
      contactEmail: "info@generalmed.com",
      contactPhone: "+1-555-0456",
      latitude: "40.7505",
      longitude: "-73.9934",
      isActive: true,
    };
    this.hospitals.set(hospital2.id, hospital2);

    // Create products
    const product1: Product = {
      id: this.currentId.products++,
      name: "Digital X-Ray System",
      model: "DXR-3000 Pro",
      category: "Imaging Equipment",
      basePrice: "45000.00",
      description: "Advanced digital radiography system with high-resolution imaging",
      isActive: true,
    };
    this.products.set(product1.id, product1);

    const product2: Product = {
      id: this.currentId.products++,
      name: "Patient Monitoring System",
      model: "PMS-200 Advanced",
      category: "Monitoring Equipment",
      basePrice: "15500.00",
      description: "Multi-parameter patient monitoring with wireless connectivity",
      isActive: true,
    };
    this.products.set(product2.id, product2);

    // Create geo-fences
    const geoFence1: GeoFence = {
      id: this.currentId.geoFences++,
      name: "St. Mary's Hospital Zone",
      hospitalId: 1,
      centerLat: "40.7589",
      centerLng: "-73.9851",
      radiusMeters: 100,
      isActive: true,
    };
    this.geoFences.set(geoFence1.id, geoFence1);
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Hospitals
  async getHospital(id: number): Promise<Hospital | undefined> {
    return this.hospitals.get(id);
  }

  async getAllHospitals(): Promise<Hospital[]> {
    return Array.from(this.hospitals.values());
  }

  async createHospital(insertHospital: InsertHospital): Promise<Hospital> {
    const id = this.currentId.hospitals++;
    const hospital: Hospital = { ...insertHospital, id };
    this.hospitals.set(id, hospital);
    return hospital;
  }

  async updateHospital(id: number, updates: Partial<InsertHospital>): Promise<Hospital | undefined> {
    const hospital = this.hospitals.get(id);
    if (!hospital) return undefined;
    
    const updatedHospital = { ...hospital, ...updates };
    this.hospitals.set(id, updatedHospital);
    return updatedHospital;
  }

  // Geo Fences
  async getGeoFence(id: number): Promise<GeoFence | undefined> {
    return this.geoFences.get(id);
  }

  async getAllGeoFences(): Promise<GeoFence[]> {
    return Array.from(this.geoFences.values());
  }

  async getGeoFencesByHospital(hospitalId: number): Promise<GeoFence[]> {
    return Array.from(this.geoFences.values()).filter(gf => gf.hospitalId === hospitalId);
  }

  async createGeoFence(insertGeoFence: InsertGeoFence): Promise<GeoFence> {
    const id = this.currentId.geoFences++;
    const geoFence: GeoFence = { ...insertGeoFence, id };
    this.geoFences.set(id, geoFence);
    return geoFence;
  }

  async updateGeoFence(id: number, updates: Partial<InsertGeoFence>): Promise<GeoFence | undefined> {
    const geoFence = this.geoFences.get(id);
    if (!geoFence) return undefined;
    
    const updatedGeoFence = { ...geoFence, ...updates };
    this.geoFences.set(id, updatedGeoFence);
    return updatedGeoFence;
  }

  async deleteGeoFence(id: number): Promise<boolean> {
    return this.geoFences.delete(id);
  }

  // Attendance
  async getAttendanceRecord(id: number): Promise<AttendanceRecord | undefined> {
    return this.attendanceRecords.get(id);
  }

  async getAttendanceByUser(userId: number, date?: string): Promise<AttendanceRecord[]> {
    const records = Array.from(this.attendanceRecords.values()).filter(record => record.userId === userId);
    if (date) {
      return records.filter(record => record.date === date);
    }
    return records;
  }

  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => record.date === date);
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<AttendanceRecord> {
    const id = this.currentId.attendanceRecords++;
    const attendance: AttendanceRecord = { ...insertAttendance, id };
    this.attendanceRecords.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, updates: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    const attendance = this.attendanceRecords.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...updates };
    this.attendanceRecords.set(id, updatedAttendance);
    return updatedAttendance;
  }

  // Products
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId.products++;
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  // Quotations
  async getQuotation(id: number): Promise<Quotation | undefined> {
    return this.quotations.get(id);
  }

  async getQuotationsByUser(userId: number): Promise<Quotation[]> {
    return Array.from(this.quotations.values()).filter(q => q.userId === userId);
  }

  async getQuotationsByStatus(status: string): Promise<Quotation[]> {
    return Array.from(this.quotations.values()).filter(q => q.status === status);
  }

  async getAllQuotations(): Promise<Quotation[]> {
    return Array.from(this.quotations.values());
  }

  async createQuotation(insertQuotation: InsertQuotation): Promise<Quotation> {
    const id = this.currentId.quotations++;
    const quotationNumber = `QT-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;
    const quotation: Quotation = {
      ...insertQuotation,
      id,
      quotationNumber,
      createdAt: new Date(),
      sentAt: null,
      expiresAt: null,
      approvedBy: null,
      approvedAt: null,
    };
    this.quotations.set(id, quotation);
    return quotation;
  }

  async updateQuotation(id: number, updates: Partial<Quotation>): Promise<Quotation | undefined> {
    const quotation = this.quotations.get(id);
    if (!quotation) return undefined;
    
    const updatedQuotation = { ...quotation, ...updates };
    this.quotations.set(id, updatedQuotation);
    return updatedQuotation;
  }

  // Schedules
  async getSchedule(id: number): Promise<Schedule | undefined> {
    return this.schedules.get(id);
  }

  async getSchedulesByUser(userId: number, date?: string): Promise<Schedule[]> {
    const schedules = Array.from(this.schedules.values()).filter(s => s.userId === userId);
    if (date) {
      return schedules.filter(s => s.scheduledDate.toISOString().split('T')[0] === date);
    }
    return schedules;
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const id = this.currentId.schedules++;
    const schedule: Schedule = { ...insertSchedule, id };
    this.schedules.set(id, schedule);
    return schedule;
  }

  async updateSchedule(id: number, updates: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { ...schedule, ...updates };
    this.schedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
}

export const storage = new MemStorage();
