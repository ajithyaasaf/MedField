import { initializeFirebase } from "./firebase-config";
import {
  type User, type InsertUser, type Hospital, type InsertHospital,
  type GeoFence, type InsertGeoFence, type AttendanceRecord, type InsertAttendance,
  type Product, type InsertProduct, type Quotation, type InsertQuotation,
  type Schedule, type InsertSchedule
} from "@shared/schema";
import type { IStorage } from "./storage";

export class FirestoreStorage implements IStorage {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    try {
      this.db = initializeFirebase();
      this.initializeSampleData().catch(error => {
        console.error('Failed to initialize sample data:', error);
      });
    } catch (error) {
      console.error('Failed to initialize Firestore:', error);
      throw error;
    }
  }

  private async initializeSampleData() {
    try {
      // Try to access the database first to ensure it exists
      await this.db.listCollections();
      
      // Check if we already have data
      const usersSnapshot = await this.db.collection('users').limit(1).get();
      if (!usersSnapshot.empty) {
        console.log('Sample data already exists in Firestore');
        return; // Data already exists
      }

      console.log('Initializing sample data in Firestore...');

    // Create admin users
    const adminRef1 = this.db.collection('users').doc();
    await adminRef1.set({
      username: "admin",
      password: "admin123",
      role: "admin",
      name: "System Administrator",
      employeeId: "ADM001",
      territory: "All",
      assignedHospitals: [],
      isActive: true,
      createdAt: new Date(),
    });

    const adminRef2 = this.db.collection('users').doc();
    await adminRef2.set({
      username: "admin2",
      password: "admin123",
      role: "admin",
      name: "Dr. Sarah Johnson",
      employeeId: "ADM002",
      territory: "North",
      assignedHospitals: [],
      isActive: true,
      createdAt: new Date(),
    });

    // Create field representatives
    const fieldRepRef1 = this.db.collection('users').doc();
    await fieldRepRef1.set({
      username: "john_doe",
      password: "password123",
      role: "field_rep",
      name: "John Doe",
      employeeId: "FR001",
      territory: "North District",
      assignedHospitals: [],
      isActive: true,
      createdAt: new Date(),
    });

    const fieldRepRef2 = this.db.collection('users').doc();
    await fieldRepRef2.set({
      username: "jane_smith",
      password: "password123",
      role: "field_rep",
      name: "Jane Smith",
      employeeId: "FR002",
      territory: "South District",
      assignedHospitals: [],
      isActive: true,
      createdAt: new Date(),
    });

    const fieldRepRef3 = this.db.collection('users').doc();
    await fieldRepRef3.set({
      username: "mike_wilson",
      password: "password123",
      role: "field_rep",
      name: "Mike Wilson",
      employeeId: "FR003",
      territory: "East District",
      assignedHospitals: [],
      isActive: true,
      createdAt: new Date(),
    });

    // Create sample hospitals
    const hospitals = [
      { name: "City General Hospital", address: "123 Main St, City Center", contactPerson: "Dr. Smith", contactEmail: "admin@citygeneral.com", contactPhone: "+1234567890", latitude: 40.7128, longitude: -74.0060, isActive: true },
      { name: "St. Mary's Medical Center", address: "456 Oak Ave, Downtown", contactPerson: "Nurse Johnson", contactEmail: "contact@stmarys.com", contactPhone: "+1234567891", latitude: 40.7589, longitude: -73.9851, isActive: true },
      { name: "Regional Health Institute", address: "789 Pine Rd, Suburbs", contactPerson: "Dr. Brown", contactEmail: "info@regionalhealth.com", contactPhone: "+1234567892", latitude: 40.6782, longitude: -73.9442, isActive: true },
      { name: "Memorial Hospital", address: "321 Elm St, Uptown", contactPerson: "Administrator Davis", contactEmail: "admin@memorial.com", contactPhone: "+1234567893", latitude: 40.7831, longitude: -73.9712, isActive: true },
      { name: "Children's Hospital", address: "654 Maple Dr, Westside", contactPerson: "Dr. Wilson", contactEmail: "contact@childrens.com", contactPhone: "+1234567894", latitude: 40.7505, longitude: -73.9934, isActive: true }
    ];

    const hospitalRefs: string[] = [];
    for (const hospital of hospitals) {
      const hospitalRef = this.db.collection('hospitals').doc();
      await hospitalRef.set(hospital);
      hospitalRefs.push(hospitalRef.id);
    }

    // Create sample products
    const products = [
      { name: "Digital Thermometer", model: "DT-100", category: "Diagnostic Equipment", basePrice: 299.99, description: "High-precision digital thermometer", isActive: true },
      { name: "Blood Pressure Monitor", model: "BP-200", category: "Monitoring Devices", basePrice: 449.99, description: "Automatic blood pressure monitor with memory", isActive: true },
      { name: "Stethoscope", model: "ST-Pro", category: "Diagnostic Equipment", basePrice: 199.99, description: "Professional acoustic stethoscope", isActive: true },
      { name: "Pulse Oximeter", model: "PO-150", category: "Monitoring Devices", basePrice: 159.99, description: "Fingertip pulse oximeter", isActive: true },
      { name: "ECG Machine", model: "ECG-500", category: "Diagnostic Equipment", basePrice: 2999.99, description: "12-lead ECG machine with interpretation", isActive: true }
    ];

    for (const product of products) {
      const productRef = this.db.collection('products').doc();
      await productRef.set(product);
    }

    // Create a sample geo-fence
    if (hospitalRefs.length > 0) {
      const geoFenceRef = this.db.collection('geo_fences').doc();
      await geoFenceRef.set({
        name: "City General Hospital Geo-fence",
        hospitalId: hospitalRefs[0],
        centerLat: 40.7128,
        centerLng: -74.0060,
        radiusMeters: 100,
        isActive: true,
      });
    }

    console.log('Sample data initialized successfully');
    } catch (error) {
      console.error('Error initializing sample data:', error);
      throw error;
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.db.collection('users').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await this.db.collection('users').where('username', '==', username).limit(1).get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const userRef = this.db.collection('users').doc();
    const userData = {
      ...user,
      createdAt: new Date(),
    };
    await userRef.set(userData);
    return { id: userRef.id, ...userData } as User;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const userRef = this.db.collection('users').doc(id);
    await userRef.update(updates);
    const doc = await userRef.get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async getAllUsers(): Promise<User[]> {
    const snapshot = await this.db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  }

  // Hospitals
  async getHospital(id: string): Promise<Hospital | undefined> {
    const doc = await this.db.collection('hospitals').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Hospital;
  }

  async getAllHospitals(): Promise<Hospital[]> {
    const snapshot = await this.db.collection('hospitals').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hospital));
  }

  async createHospital(hospital: InsertHospital): Promise<Hospital> {
    const hospitalRef = this.db.collection('hospitals').doc();
    await hospitalRef.set(hospital);
    return { id: hospitalRef.id, ...hospital } as Hospital;
  }

  async updateHospital(id: string, updates: Partial<InsertHospital>): Promise<Hospital | undefined> {
    const hospitalRef = this.db.collection('hospitals').doc(id);
    await hospitalRef.update(updates);
    const doc = await hospitalRef.get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Hospital;
  }

  // Geo Fences
  async getGeoFence(id: string): Promise<GeoFence | undefined> {
    const doc = await this.db.collection('geo_fences').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as GeoFence;
  }

  async getAllGeoFences(): Promise<GeoFence[]> {
    const snapshot = await this.db.collection('geo_fences').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeoFence));
  }

  async getGeoFencesByHospital(hospitalId: string): Promise<GeoFence[]> {
    const snapshot = await this.db.collection('geo_fences').where('hospitalId', '==', hospitalId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeoFence));
  }

  async createGeoFence(geoFence: InsertGeoFence): Promise<GeoFence> {
    const geoFenceRef = this.db.collection('geo_fences').doc();
    await geoFenceRef.set(geoFence);
    return { id: geoFenceRef.id, ...geoFence } as GeoFence;
  }

  async updateGeoFence(id: string, updates: Partial<InsertGeoFence>): Promise<GeoFence | undefined> {
    const geoFenceRef = this.db.collection('geo_fences').doc(id);
    await geoFenceRef.update(updates);
    const doc = await geoFenceRef.get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as GeoFence;
  }

  async deleteGeoFence(id: string): Promise<boolean> {
    await this.db.collection('geo_fences').doc(id).delete();
    return true;
  }

  // Attendance
  async getAttendanceRecord(id: string): Promise<AttendanceRecord | undefined> {
    const doc = await this.db.collection('attendance_records').doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return { 
      id: doc.id, 
      ...data,
      clockInTime: data?.clockInTime?.toDate(),
      clockOutTime: data?.clockOutTime?.toDate(),
    } as AttendanceRecord;
  }

  async getAttendanceByUser(userId: string, date?: string): Promise<AttendanceRecord[]> {
    let query = this.db.collection('attendance_records').where('userId', '==', userId);
    if (date) {
      query = query.where('date', '==', date);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        clockInTime: data?.clockInTime?.toDate(),
        clockOutTime: data?.clockOutTime?.toDate(),
      } as AttendanceRecord;
    });
  }

  async getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    const snapshot = await this.db.collection('attendance_records').where('date', '==', date).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        clockInTime: data?.clockInTime?.toDate(),
        clockOutTime: data?.clockOutTime?.toDate(),
      } as AttendanceRecord;
    });
  }

  async getAllAttendance(): Promise<AttendanceRecord[]> {
    const snapshot = await this.db.collection('attendance_records').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        clockInTime: data?.clockInTime?.toDate(),
        clockOutTime: data?.clockOutTime?.toDate(),
      } as AttendanceRecord;
    });
  }

  async createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord> {
    const attendanceRef = this.db.collection('attendance_records').doc();
    await attendanceRef.set(attendance);
    return { id: attendanceRef.id, ...attendance } as AttendanceRecord;
  }

  async updateAttendance(id: string, updates: Partial<InsertAttendance>): Promise<AttendanceRecord | undefined> {
    const attendanceRef = this.db.collection('attendance_records').doc(id);
    await attendanceRef.update(updates);
    const doc = await attendanceRef.get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      clockInTime: data?.clockInTime?.toDate(),
      clockOutTime: data?.clockOutTime?.toDate(),
    } as AttendanceRecord;
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const doc = await this.db.collection('products').doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Product;
  }

  async getAllProducts(): Promise<Product[]> {
    const snapshot = await this.db.collection('products').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const productRef = this.db.collection('products').doc();
    await productRef.set(product);
    return { id: productRef.id, ...product } as Product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const productRef = this.db.collection('products').doc(id);
    await productRef.update(updates);
    const doc = await productRef.get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Product;
  }

  // Quotations
  async getQuotation(id: string): Promise<Quotation | undefined> {
    const doc = await this.db.collection('quotations').doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate(),
      sentAt: data?.sentAt?.toDate(),
      expiresAt: data?.expiresAt?.toDate(),
      approvedAt: data?.approvedAt?.toDate(),
    } as Quotation;
  }

  async getQuotationsByUser(userId: string): Promise<Quotation[]> {
    const snapshot = await this.db.collection('quotations').where('userId', '==', userId).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        sentAt: data?.sentAt?.toDate(),
        expiresAt: data?.expiresAt?.toDate(),
        approvedAt: data?.approvedAt?.toDate(),
      } as Quotation;
    });
  }

  async getQuotationsByStatus(status: string): Promise<Quotation[]> {
    const snapshot = await this.db.collection('quotations').where('status', '==', status).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        sentAt: data?.sentAt?.toDate(),
        expiresAt: data?.expiresAt?.toDate(),
        approvedAt: data?.approvedAt?.toDate(),
      } as Quotation;
    });
  }

  async getAllQuotations(): Promise<Quotation[]> {
    const snapshot = await this.db.collection('quotations').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate(),
        sentAt: data?.sentAt?.toDate(),
        expiresAt: data?.expiresAt?.toDate(),
        approvedAt: data?.approvedAt?.toDate(),
      } as Quotation;
    });
  }

  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const quotationRef = this.db.collection('quotations').doc();
    const quotationData = {
      ...quotation,
      quotationNumber: `Q-${Date.now()}`,
      createdAt: new Date(),
    };
    await quotationRef.set(quotationData);
    return { id: quotationRef.id, ...quotationData } as Quotation;
  }

  async updateQuotation(id: string, updates: Partial<Quotation>): Promise<Quotation | undefined> {
    const quotationRef = this.db.collection('quotations').doc(id);
    
    // Handle date fields properly
    const updateData = { ...updates };
    if (updateData.sentAt && !(updateData.sentAt instanceof Date)) {
      delete updateData.sentAt;
    }
    if (updateData.approvedAt && !(updateData.approvedAt instanceof Date)) {
      delete updateData.approvedAt;
    }
    
    await quotationRef.update(updateData);
    const doc = await quotationRef.get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate(),
      sentAt: data?.sentAt?.toDate(),
      expiresAt: data?.expiresAt?.toDate(),
      approvedAt: data?.approvedAt?.toDate(),
    } as Quotation;
  }

  // Schedules
  async getSchedule(id: string): Promise<Schedule | undefined> {
    const doc = await this.db.collection('schedules').doc(id).get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      scheduledDate: data?.scheduledDate?.toDate(),
    } as Schedule;
  }

  async getSchedulesByUser(userId: string, date?: string): Promise<Schedule[]> {
    let query = this.db.collection('schedules').where('userId', '==', userId);
    const snapshot = await query.get();
    let schedules = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledDate: data?.scheduledDate?.toDate(),
      } as Schedule;
    });

    if (date) {
      schedules = schedules.filter(schedule => {
        const scheduleDate = schedule.scheduledDate.toISOString().split('T')[0];
        return scheduleDate === date;
      });
    }

    return schedules;
  }

  async getAllSchedules(): Promise<Schedule[]> {
    const snapshot = await this.db.collection('schedules').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        scheduledDate: data?.scheduledDate?.toDate(),
      } as Schedule;
    });
  }

  async createSchedule(schedule: InsertSchedule): Promise<Schedule> {
    const scheduleRef = this.db.collection('schedules').doc();
    await scheduleRef.set(schedule);
    return { id: scheduleRef.id, ...schedule } as Schedule;
  }

  async updateSchedule(id: string, updates: Partial<InsertSchedule>): Promise<Schedule | undefined> {
    const scheduleRef = this.db.collection('schedules').doc(id);
    await scheduleRef.update(updates);
    const doc = await scheduleRef.get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      scheduledDate: data?.scheduledDate?.toDate(),
    } as Schedule;
  }
}