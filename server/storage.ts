import {
  type User, type InsertUser, type Hospital, type InsertHospital,
  type GeoFence, type InsertGeoFence, type AttendanceRecord, type InsertAttendance,
  type Product, type InsertProduct, type Quotation, type InsertQuotation,
  type Schedule, type InsertSchedule
} from "@shared/schema";
import { FirestoreStorage } from "./firestore-storage";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;

  // Hospitals
  getHospital(id: string): Promise<Hospital | undefined>;
  getAllHospitals(): Promise<Hospital[]>;
  createHospital(hospital: InsertHospital): Promise<Hospital>;
  updateHospital(id: string, updates: Partial<InsertHospital>): Promise<Hospital | undefined>;

  // Geo Fences
  getGeoFence(id: string): Promise<GeoFence | undefined>;
  getAllGeoFences(): Promise<GeoFence[]>;
  getGeoFencesByHospital(hospitalId: string): Promise<GeoFence[]>;
  createGeoFence(geoFence: InsertGeoFence): Promise<GeoFence>;
  updateGeoFence(id: string, updates: Partial<InsertGeoFence>): Promise<GeoFence | undefined>;
  deleteGeoFence(id: string): Promise<boolean>;

  // Attendance
  getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined>;
  getAttendanceByUser(userId: string, date?: string): Promise<AttendanceRecord[]>;
  getAttendanceByDate(date: string): Promise<AttendanceRecord[]>;
  getAllAttendance(): Promise<AttendanceRecord[]>;
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;

  // Quotations
  getQuotation(id: string): Promise<Quotation | undefined>;
  getQuotationsByUser(userId: string): Promise<Quotation[]>;
  getQuotationsByStatus(status: string): Promise<Quotation[]>;
  getAllQuotations(): Promise<Quotation[]>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation | undefined>;

  // Schedules
  getSchedule(id: string): Promise<Schedule | undefined>;
  getSchedulesByUser(userId: string, date?: string): Promise<Schedule[]>;
  getAllSchedules(): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: string, updates: Partial<InsertSchedule>): Promise<Schedule | undefined>;
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
    // Create admin users
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

    const admin2: User = {
      id: this.currentId.users++,
      username: "manager",
      password: "manager123",
      role: "admin",
      name: "Regional Manager",
      employeeId: "ADMIN002",
      territory: "Central Region",
      assignedHospitals: [],
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(admin2.id, admin2);

    // Create field rep users
    const fieldRep: User = {
      id: this.currentId.users++,
      username: "sarah.johnson",
      password: "password123",
      role: "field_rep",
      name: "Sarah Johnson",
      employeeId: "REP001",
      territory: "Downtown",
      assignedHospitals: [1, 2, 3],
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(fieldRep.id, fieldRep);

    const fieldRep2: User = {
      id: this.currentId.users++,
      username: "mike.chen",
      password: "password123",
      role: "field_rep",
      name: "Mike Chen",
      employeeId: "REP002",
      territory: "North District",
      assignedHospitals: [4, 5, 6],
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(fieldRep2.id, fieldRep2);

    const fieldRep3: User = {
      id: this.currentId.users++,
      username: "anna.martinez",
      password: "password123",
      role: "field_rep",
      name: "Anna Martinez",
      employeeId: "REP003",
      territory: "South Zone",
      assignedHospitals: [7, 8, 9],
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(fieldRep3.id, fieldRep3);

    // Create 10 hospitals as per requirements
    const hospitals = [
      {
        name: "St. Mary's Hospital",
        address: "123 Healthcare Blvd, Medical District",
        contactPerson: "Dr. Michael Thompson",
        contactEmail: "contact@stmarys.com",
        contactPhone: "+1-555-0123",
        latitude: "40.7589",
        longitude: "-73.9851",
      },
      {
        name: "General Medical Center",
        address: "456 Health Ave, Downtown",
        contactPerson: "Dr. Lisa Chen",
        contactEmail: "info@generalmed.com",
        contactPhone: "+1-555-0456",
        latitude: "40.7505",
        longitude: "-73.9934",
      },
      {
        name: "City General Hospital",
        address: "789 Medical Plaza, City Center",
        contactPerson: "Dr. Robert Davis",
        contactEmail: "admin@citygeneral.com",
        contactPhone: "+1-555-0789",
        latitude: "40.7614",
        longitude: "-73.9776",
      },
      {
        name: "Regional Medical Center",
        address: "321 Hospital Dr, North District",
        contactPerson: "Dr. Emily Wilson",
        contactEmail: "contact@regionalmed.com",
        contactPhone: "+1-555-0321",
        latitude: "40.7831",
        longitude: "-73.9712",
      },
      {
        name: "Metropolitan Hospital",
        address: "654 Care Blvd, Metro Area",
        contactPerson: "Dr. James Miller",
        contactEmail: "info@metrohosp.com",
        contactPhone: "+1-555-0654",
        latitude: "40.7484",
        longitude: "-73.9857",
      },
      {
        name: "University Medical Center",
        address: "987 Academic Ave, University District",
        contactPerson: "Dr. Sarah Williams",
        contactEmail: "contact@umc.edu",
        contactPhone: "+1-555-0987",
        latitude: "40.7549",
        longitude: "-73.9840",
      },
      {
        name: "Children's Hospital",
        address: "147 Pediatric Way, Family Zone",
        contactPerson: "Dr. Amanda Brown",
        contactEmail: "info@childrenshosp.com",
        contactPhone: "+1-555-0147",
        latitude: "40.7677",
        longitude: "-73.9803",
      },
      {
        name: "Cardiac Care Center",
        address: "258 Heart Lane, Specialty District",
        contactPerson: "Dr. David Garcia",
        contactEmail: "contact@cardiaccare.com",
        contactPhone: "+1-555-0258",
        latitude: "40.7720",
        longitude: "-73.9759",
      },
      {
        name: "Surgical Institute",
        address: "369 Surgery Blvd, Medical Campus",
        contactPerson: "Dr. Jennifer Lee",
        contactEmail: "admin@surginst.com",
        contactPhone: "+1-555-0369",
        latitude: "40.7563",
        longitude: "-73.9888",
      },
      {
        name: "Emergency Medical Center",
        address: "741 Emergency Ave, Trauma Zone",
        contactPerson: "Dr. Mark Johnson",
        contactEmail: "contact@emergencymed.com",
        contactPhone: "+1-555-0741",
        latitude: "40.7598",
        longitude: "-73.9795",
      }
    ];

    hospitals.forEach(hospitalData => {
      const hospital: Hospital = {
        id: this.currentId.hospitals++,
        ...hospitalData,
        isActive: true,
      };
      this.hospitals.set(hospital.id, hospital);
    });

    // Create 10 products/services as per requirements
    const products = [
      {
        name: "Digital X-Ray System",
        model: "DXR-3000 Pro",
        category: "Imaging Equipment",
        basePrice: "45000.00",
        description: "Advanced digital radiography system with high-resolution imaging",
      },
      {
        name: "Patient Monitoring System",
        model: "PMS-200 Advanced",
        category: "Monitoring Equipment",
        basePrice: "15500.00",
        description: "Multi-parameter patient monitoring with wireless connectivity",
      },
      {
        name: "Ultrasound Machine",
        model: "US-4000 Elite",
        category: "Imaging Equipment",
        basePrice: "35000.00",
        description: "High-definition ultrasound system with 3D/4D capabilities",
      },
      {
        name: "Defibrillator",
        model: "DEF-500 Life",
        category: "Emergency Equipment",
        basePrice: "8500.00",
        description: "Automated external defibrillator with voice prompts",
      },
      {
        name: "Surgical Lighting System",
        model: "SLS-1000 Bright",
        category: "Surgical Equipment",
        basePrice: "12000.00",
        description: "LED surgical lighting system with shadow management",
      },
      {
        name: "Ventilator",
        model: "VENT-300 Pro",
        category: "Respiratory Equipment",
        basePrice: "28000.00",
        description: "Advanced mechanical ventilator for critical care",
      },
      {
        name: "Anesthesia Machine",
        model: "ANESTH-250 Safe",
        category: "Anesthesia Equipment",
        basePrice: "42000.00",
        description: "Multi-gas anesthesia delivery system with monitoring",
      },
      {
        name: "Hospital Bed",
        model: "BED-100 Comfort",
        category: "Patient Care",
        basePrice: "3500.00",
        description: "Electric hospital bed with integrated controls",
      },
      {
        name: "Infusion Pump",
        model: "INF-150 Smart",
        category: "Drug Delivery",
        basePrice: "2800.00",
        description: "Smart infusion pump with dose error reduction",
      },
      {
        name: "Sterilization System",
        model: "STER-400 Clean",
        category: "Sterilization",
        basePrice: "18000.00",
        description: "Steam sterilization system for surgical instruments",
      }
    ];

    products.forEach(productData => {
      const product: Product = {
        id: this.currentId.products++,
        ...productData,
        isActive: true,
      };
      this.products.set(product.id, product);
    });

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

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values());
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

  async getAllSchedules(): Promise<Schedule[]> {
    return Array.from(this.schedules.values());
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

// Try to use Firestore, fall back to MemStorage if Firestore is not available
let storage: IStorage;

try {
  storage = new FirestoreStorage();
  console.log('✅ Using Firestore storage');
} catch (error) {
  console.log('⚠️  Firestore not available, using in-memory storage as fallback');
  console.log('Please enable Firestore API: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=medfield-ee2af');
  storage = new MemStorage();
}

export { storage };
