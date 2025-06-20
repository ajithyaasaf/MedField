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
import { emailSMSService } from "./email-service";

// Authentication middleware
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Admin middleware
function requireAdmin(req: any, res: any, next: any) {
  if (!req.session?.userId || req.session?.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.role = user.role;
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          name: user.name 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          name: user.name,
          email: user.email,
          territory: user.territory
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...safeUser } = user;
      res.status(201).json(safeUser);
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

  // Attendance routes
  app.get("/api/attendance", requireAuth, async (req, res) => {
    try {
      const userId = req.session.role === 'admin' ? undefined : req.session.userId;
      const attendance = userId 
        ? await storage.getAttendanceByUser(userId)
        : await storage.getAllAttendance();
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post("/api/attendance/clock-in", requireAuth, async (req, res) => {
    try {
      const attendanceData = {
        ...insertAttendanceSchema.parse(req.body),
        userId: req.session.userId,
        date: new Date().toISOString().split('T')[0],
        clockInTime: new Date().toISOString(),
      };

      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  app.patch("/api/attendance/:id/clock-out", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const attendance = await storage.updateAttendance(id, {
        clockOutTime: new Date().toISOString(),
        ...req.body
      });
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Manual attendance approval
  app.get("/api/attendance/pending-approval", requireAdmin, async (req, res) => {
    try {
      // Mock pending approvals for now
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  app.post("/api/attendance/:id/approve", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { approved, approvalNotes } = req.body;
      
      const attendance = await storage.updateAttendance(id, {
        approved,
        approvalNotes,
        approvedBy: req.session.userId,
        approvedAt: new Date().toISOString()
      });
      
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Failed to process approval" });
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

  // Quotation routes
  app.get("/api/quotations", requireAuth, async (req, res) => {
    try {
      const quotations = req.session.role === 'admin' 
        ? await storage.getAllQuotations()
        : await storage.getQuotationsByUser(req.session.userId);
      res.json(quotations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotations" });
    }
  });

  app.post("/api/quotations", requireAuth, async (req, res) => {
    try {
      const quotationData = {
        ...insertQuotationSchema.parse(req.body),
        userId: req.session.userId,
        quotationNumber: `QUO-${Date.now()}`,
        createdAt: new Date(),
      };

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
      const quotation = await storage.updateQuotation(id, updates);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      res.json(quotation);
    } catch (error) {
      res.status(400).json({ message: "Invalid quotation data" });
    }
  });

  // Quotation email/SMS routes
  app.post("/api/quotations/:id/send", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { method = 'email' } = req.body;
      
      const quotation = await storage.getQuotation(id);
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }

      const hospital = await storage.getHospital(quotation.hospitalId);
      const user = await storage.getUser(quotation.userId);

      if (!hospital || !user) {
        return res.status(404).json({ message: "Hospital or user not found" });
      }

      if (method === 'email' && hospital.contactEmail) {
        const emailHtml = emailSMSService.generateQuotationEmailHTML({
          quotationNumber: quotation.quotationNumber,
          hospitalName: hospital.name,
          contactPerson: hospital.contactPerson || 'Sir/Madam',
          totalAmount: quotation.totalAmount,
          repName: user.name,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        });

        const result = await emailSMSService.sendEmail({
          to: hospital.contactEmail,
          subject: `Quotation ${quotation.quotationNumber} - MedField Pro`,
          html: emailHtml,
        });

        if (result.success) {
          await storage.updateQuotation(id, { status: 'sent' });
          res.json({ 
            success: true, 
            method: 'email',
            messageId: result.messageId,
            previewUrl: result.previewUrl 
          });
        } else {
          res.status(500).json({ message: "Failed to send email" });
        }
      } else {
        res.status(400).json({ 
          message: `No ${method} contact information available for this hospital` 
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send quotation" });
    }
  });

  // Schedule routes
  app.get("/api/schedules", requireAuth, async (req, res) => {
    try {
      const schedules = req.session.role === 'admin'
        ? await storage.getAllSchedules()
        : await storage.getSchedulesByUser(req.session.userId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schedules" });
    }
  });

  app.post("/api/schedules", requireAuth, async (req, res) => {
    try {
      const scheduleData = {
        ...insertScheduleSchema.parse(req.body),
        userId: req.session.userId,
        createdAt: new Date(),
      };

      const schedule = await storage.createSchedule(scheduleData);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(400).json({ message: "Invalid schedule data" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", requireAdmin, async (req, res) => {
    try {
      const { timeRange = 'week' } = req.query;
      
      // Mock analytics data
      const analytics = {
        timeRange,
        attendance: {
          totalCheckins: 45,
          onTimeRate: 92,
          lateCheckins: 3,
          missedCheckins: 2
        },
        quotations: {
          totalSent: 12,
          approved: 8,
          rejected: 2,
          pending: 2,
          conversionRate: 67
        },
        revenue: {
          total: 125000,
          growth: 18,
          target: 150000
        }
      };
      
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Reports routes
  app.post("/api/reports/generate", requireAdmin, async (req, res) => {
    try {
      const { type, dateRange, fields, filters } = req.body;
      
      // Mock report generation
      const reportData = {
        type,
        generated: new Date().toISOString(),
        fields,
        filters,
        data: []
      };
      
      // In a real implementation, generate actual PDF/CSV report
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_report.pdf"`);
      res.send(Buffer.from(`Mock ${type} report data`));
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  // Activity feed routes
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const { filter = 'all' } = req.query;
      
      // Mock activity data
      const activities = [
        {
          id: 1,
          type: 'attendance',
          userId: req.session.userId,
          action: 'clocked in',
          timestamp: new Date().toISOString(),
          metadata: { location: 'Hospital A' }
        }
      ];
      
      const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Document management routes
  app.get("/api/documents", requireAuth, async (req, res) => {
    try {
      const { quotationId, hospitalId } = req.query;
      
      // Mock document data
      const documents = [];
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents/upload", requireAuth, async (req, res) => {
    try {
      // Mock file upload
      const document = {
        id: Date.now(),
        name: 'uploaded_file.pdf',
        type: 'application/pdf',
        size: 1024,
        uploadedBy: req.session.userId,
        uploadedAt: new Date(),
        url: '/mock/path/to/file.pdf'
      };
      
      res.status(201).json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      // Mock document deletion
      res.json({ message: "Document deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
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