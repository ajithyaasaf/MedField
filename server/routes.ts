import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertHospitalSchema,
  insertGeoFenceSchema,
  insertAttendanceSchema,
  insertProductSchema,
  insertQuotationSchema,
  insertScheduleSchema,
  loginSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.userId || req.session?.userRole !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.userRole = user.role;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Hospital routes
  app.get("/api/hospitals", requireAuth, async (req, res) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  });

  app.post("/api/hospitals", requireAdmin, async (req, res) => {
    try {
      const hospitalData = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(hospitalData);
      res.status(201).json(hospital);
    } catch (error) {
      res.status(400).json({ message: "Invalid hospital data" });
    }
  });

  // Product routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  // Geo-fence routes
  app.get("/api/geo-fences", requireAdmin, async (req, res) => {
    try {
      const geoFences = await storage.getAllGeoFences();
      res.json(geoFences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch geo-fences" });
    }
  });

  app.post("/api/geo-fences", requireAdmin, async (req, res) => {
    try {
      const geoFenceData = insertGeoFenceSchema.parse(req.body);
      const geoFence = await storage.createGeoFence(geoFenceData);
      res.status(201).json(geoFence);
    } catch (error) {
      res.status(400).json({ message: "Invalid geo-fence data" });
    }
  });

  app.delete("/api/geo-fences/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteGeoFence(id);
      if (!deleted) {
        return res.status(404).json({ message: "Geo-fence not found" });
      }
      res.json({ message: "Geo-fence deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete geo-fence" });
    }
  });

  // Attendance routes
  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const { date } = req.query;
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      
      let attendance;
      if (userRole === "admin") {
        if (date) {
          attendance = await storage.getAttendanceByDate(date as string);
        } else {
          // Get today's attendance for admin
          const today = new Date().toISOString().split('T')[0];
          attendance = await storage.getAttendanceByDate(today);
        }
      } else {
        attendance = await storage.getAttendanceByUser(userId, date as string);
      }
      
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance/clock-in", requireAuth, async (req, res) => {
    try {
      const { hospitalId, latitude, longitude } = req.body;
      const userId = req.session.userId;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if user already clocked in today
      const existingRecord = await storage.getAttendanceByUser(userId, today);
      const todayRecord = existingRecord.find(record => !record.clockOutTime);
      
      if (todayRecord) {
        return res.status(400).json({ message: "Already clocked in today" });
      }

      // Check geo-fence if hospital is provided
      let withinGeoFence = false;
      if (hospitalId) {
        const geoFences = await storage.getGeoFencesByHospital(hospitalId);
        withinGeoFence = geoFences.some(fence => {
          const distance = calculateDistance(
            parseFloat(fence.centerLat!),
            parseFloat(fence.centerLng!),
            latitude,
            longitude
          );
          return distance <= fence.radiusMeters;
        });
      }

      const attendanceData = {
        userId,
        hospitalId: hospitalId || null,
        clockInTime: new Date(),
        clockOutTime: null,
        clockInLat: latitude.toString(),
        clockInLng: longitude.toString(),
        clockOutLat: null,
        clockOutLng: null,
        withinGeoFence,
        manualOverride: false,
        date: today,
      };

      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Failed to clock in" });
    }
  });

  app.post("/api/attendance/clock-out", requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const userId = req.session.userId;
      const today = new Date().toISOString().split('T')[0];
      
      // Find today's clock-in record
      const records = await storage.getAttendanceByUser(userId, today);
      const todayRecord = records.find(record => !record.clockOutTime);
      
      if (!todayRecord) {
        return res.status(400).json({ message: "No active clock-in found" });
      }

      const updatedRecord = await storage.updateAttendance(todayRecord.id, {
        clockOutTime: new Date(),
        clockOutLat: latitude.toString(),
        clockOutLng: longitude.toString(),
      });

      res.json(updatedRecord);
    } catch (error) {
      res.status(400).json({ message: "Failed to clock out" });
    }
  });

  // Quotation routes
  app.get("/api/quotations", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId;
      const userRole = req.session.userRole;
      
      let quotations;
      if (userRole === "admin") {
        const { status } = req.query;
        if (status) {
          quotations = await storage.getQuotationsByStatus(status as string);
        } else {
          quotations = await storage.getAllQuotations();
        }
      } else {
        quotations = await storage.getQuotationsByUser(userId);
      }
      
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.post("/api/quotations", requireAuth, async (req, res) => {
    try {
      const quotationData = insertQuotationSchema.parse(req.body);
      quotationData.userId = req.session.userId;
      
      const quotation = await storage.createQuotation(quotationData);
      res.status(201).json(quotation);
    } catch (error) {
      res.status(400).json({ message: "Invalid quotation data" });
    }
  });

  app.patch("/api/quotations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Add approval info if admin is approving
      if (req.session.userRole === "admin" && updates.status === "approved") {
        updates.approvedBy = req.session.userId;
        updates.approvedAt = new Date();
      }
      
      const quotation = await storage.updateQuotation(id, updates);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: "Failed to update quotation" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", requireAuth, async (req, res) => {
    try {
      const { date } = req.query;
      const userId = req.session.userId;
      const schedules = await storage.getSchedulesByUser(userId, date as string);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", requireAuth, async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      scheduleData.userId = req.session.userId;
      
      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}
