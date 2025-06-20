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
  // Add middleware to log all requests
  app.use('/api', (req, res, next) => {
    console.log(`API Request: ${req.method} ${req.path}`, req.body);
    next();
  });

  // Test route
  app.get("/api/test", (req, res) => {
    console.log('Test route hit');
    res.json({ message: "Test route working" });
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    console.log('=== LOGIN ROUTE HIT ===');
    try {
      console.log('Login request body:', req.body);
      console.log('Login request headers:', req.headers);
      
      const { username, password } = loginSchema.parse(req.body);
      console.log('Parsed credentials:', { username, passwordLength: password?.length });
      
      const user = await storage.getUserByUsername(username);
      console.log('Found user:', user ? { id: user.id, username: user.username, role: user.role } : 'Not found');
      
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
      console.error('Login error details:', error);
      res.status(400).json({ message: "Invalid request data" });
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
        clockInTime: new Date(),
      };

      const attendance = await storage.createAttendance(attendanceData);
      res.status(201).json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  app.patch("/api/attendance/:id/clock-out", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      const attendance = await storage.updateAttendance(id, {
        clockOutTime: new Date(),
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
      const id = req.params.id;
      const { approved, approvalNotes } = req.body;
      
      const attendance = await storage.updateAttendance(id, {
        approved,
        approvalNotes,
        approvedBy: req.session.userId,
        approvedAt: new Date()
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
      const id = req.params.id;
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
      const id = req.params.id;
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
      
      // Get current user info
      const currentUser = await storage.getUser(req.session.userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Mock activity data with proper user information
      const activities = [
        {
          id: 1,
          type: 'attendance',
          user: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role
          },
          action: 'clocked in',
          target: {
            type: 'hospital',
            name: 'St. Mary\'s Hospital',
            id: '1'
          },
          metadata: { location: 'Hospital A' },
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
          priority: 'medium'
        },
        {
          id: 2,
          type: 'quotation',
          user: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role
          },
          action: 'created new quotation',
          target: {
            type: 'quotation',
            name: 'Q-2024-001',
            id: '1'
          },
          metadata: { amount: 15000 },
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
          priority: 'high'
        },
        {
          id: 3,
          type: 'system',
          user: {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role
          },
          action: 'logged into system',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
          priority: 'low'
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

  // Advanced quotation management routes
  app.post("/api/quotations/bulk-export", requireAuth, async (req, res) => {
    try {
      const { quotationIds } = req.body;
      
      // Mock bulk PDF export
      const zipBuffer = Buffer.from(`Mock ZIP file containing ${quotationIds.length} quotation PDFs`);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="quotations-export.zip"');
      res.send(zipBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to export quotations" });
    }
  });

  app.post("/api/quotations/:id/approval", requireAuth, async (req, res) => {
    try {
      const quotationId = parseInt(req.params.id);
      const { action, comments } = req.body;
      
      // Mock approval workflow
      const approvalData = {
        action,
        comments,
        approvedBy: req.session.userId,
        approvedAt: new Date(),
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending_changes'
      };
      
      res.json({ message: "Approval status updated", data: approvalData });
    } catch (error) {
      res.status(500).json({ message: "Failed to update approval status" });
    }
  });

  app.post("/api/quotations/send-reminders", requireAuth, async (req, res) => {
    try {
      const { quotationIds } = req.body;
      
      // Mock reminder sending
      const results = quotationIds.map((id: number) => ({
        quotationId: id,
        status: 'sent',
        sentAt: new Date()
      }));
      
      res.json({ message: "Reminders sent successfully", results });
    } catch (error) {
      res.status(500).json({ message: "Failed to send reminders" });
    }
  });

  // Quotation templates
  app.get("/api/quotation-templates", requireAuth, async (req, res) => {
    try {
      const mockTemplates = [
        {
          id: 1,
          name: "Standard Medical Equipment Package",
          category: "Equipment",
          products: [
            { id: 1, quantity: 2, unitPrice: "5000", discount: 10 },
            { id: 2, quantity: 1, unitPrice: "3000", discount: 5 }
          ],
          standardDiscount: 10,
          validityDays: 30,
          terms: "Standard terms and conditions apply"
        },
        {
          id: 2,
          name: "Surgical Supplies Bundle",
          category: "Supplies",
          products: [
            { id: 3, quantity: 10, unitPrice: "200", discount: 15 },
            { id: 4, quantity: 5, unitPrice: "150", discount: 10 }
          ],
          standardDiscount: 15,
          validityDays: 21,
          terms: "Bulk order terms apply"
        }
      ];
      
      res.json(mockTemplates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.post("/api/quotation-templates", requireAuth, async (req, res) => {
    try {
      const templateData = req.body;
      const newTemplate = {
        id: Date.now(),
        ...templateData,
        createdAt: new Date(),
        createdBy: req.session.userId
      };
      
      res.json({ message: "Template created successfully", template: newTemplate });
    } catch (error) {
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Advanced analytics routes
  app.get("/api/analytics/attendance", requireAuth, async (req, res) => {
    try {
      const { timeRange, region, rep } = req.query;
      
      const mockAttendanceMetrics = {
        totalCheckIns: 145,
        onTimeCheckIns: 128,
        lateCheckIns: 17,
        missedCheckIns: 8,
        averageHoursWorked: 7.4,
        attendanceRate: 94.5,
        byDate: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          checkIns: Math.floor(Math.random() * 8) + 2,
          onTime: Math.floor(Math.random() * 6) + 2,
          late: Math.floor(Math.random() * 2),
          missed: Math.floor(Math.random() * 1)
        })),
        byUser: [
          { userId: 1, userName: "Admin User", checkIns: 25, attendanceRate: 95, avgHours: 7.8 },
          { userId: 3, userName: "Sarah Johnson", checkIns: 23, attendanceRate: 92, avgHours: 7.2 },
          { userId: 4, userName: "Mike Chen", checkIns: 22, attendanceRate: 88, avgHours: 7.5 }
        ],
        byRegion: [
          { region: "Downtown", totalReps: 8, activeReps: 7, attendanceRate: 87.5 },
          { region: "North District", totalReps: 6, activeReps: 6, attendanceRate: 100 },
          { region: "South Zone", totalReps: 5, activeReps: 4, attendanceRate: 80 }
        ]
      };
      
      res.json(mockAttendanceMetrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance analytics" });
    }
  });

  app.get("/api/analytics/revenue", requireAuth, async (req, res) => {
    try {
      const { timeRange, region, rep } = req.query;
      
      const mockRevenueMetrics = {
        totalRevenue: 145000,
        forecastedRevenue: 180000,
        growthRate: 24.1,
        avgDealSize: 15800,
        byRegion: [
          { region: "Downtown", revenue: 65000, growth: 18.5, dealCount: 12 },
          { region: "North District", revenue: 48000, growth: 31.2, dealCount: 8 },
          { region: "South Zone", revenue: 32000, growth: 15.8, dealCount: 6 }
        ],
        byRep: [
          { userId: 3, userName: "Sarah Johnson", revenue: 45000, dealCount: 8, conversionRate: 75 },
          { userId: 4, userName: "Mike Chen", revenue: 38000, dealCount: 6, conversionRate: 67 },
          { userId: 5, userName: "Anna Martinez", revenue: 32000, dealCount: 5, conversionRate: 62 }
        ],
        forecast: [
          { month: "Jan", projected: 45000, conservative: 38000, optimistic: 52000 },
          { month: "Feb", projected: 48000, conservative: 42000, optimistic: 55000 },
          { month: "Mar", projected: 52000, conservative: 45000, optimistic: 60000 },
          { month: "Apr", projected: 55000, conservative: 48000, optimistic: 63000 },
          { month: "May", projected: 58000, conservative: 51000, optimistic: 67000 },
          { month: "Jun", projected: 62000, conservative: 54000, optimistic: 71000 }
        ]
      };
      
      res.json(mockRevenueMetrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch revenue analytics" });
    }
  });

  app.get("/api/analytics/quotation-funnel", requireAuth, async (req, res) => {
    try {
      const { timeRange, region, rep } = req.query;
      
      const mockQuotationFunnel = {
        totalQuotations: 89,
        draftCount: 23,
        sentCount: 34,
        approvedCount: 21,
        rejectedCount: 11,
        conversionRate: 61.8,
        avgTimeToApproval: 8.5,
        byStage: [
          { stage: "Draft", count: 23, percentage: 25.8, avgDaysInStage: 2.3 },
          { stage: "Sent", count: 34, percentage: 38.2, avgDaysInStage: 5.7 },
          { stage: "Under Review", count: 11, percentage: 12.4, avgDaysInStage: 3.2 },
          { stage: "Approved", count: 21, percentage: 23.6, avgDaysInStage: 8.5 }
        ],
        topHospitals: [
          { hospitalId: 1, hospitalName: "St. Mary's Hospital", quotationCount: 15, totalValue: 95000, conversionRate: 73.3 },
          { hospitalId: 2, hospitalName: "General Medical Center", quotationCount: 12, totalValue: 78000, conversionRate: 66.7 },
          { hospitalId: 3, hospitalName: "City Health Complex", quotationCount: 9, totalValue: 52000, conversionRate: 55.6 }
        ]
      };
      
      res.json(mockQuotationFunnel);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quotation funnel analytics" });
    }
  });

  // Smart notifications routes
  app.get("/api/notifications/geo-fence-alerts", requireAuth, async (req, res) => {
    try {
      const mockGeoFenceAlerts = [
        {
          id: "gf1",
          userId: 3,
          userName: "Sarah Johnson",
          geoFenceId: 1,
          geoFenceName: "St. Mary's Hospital Zone",
          hospitalName: "St. Mary's Hospital",
          alertType: "approaching",
          distance: 150,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          location: { lat: 40.7128, lng: -74.0060 },
          acknowledged: false
        },
        {
          id: "gf2",
          userId: 4,
          userName: "Mike Chen",
          geoFenceId: 2,
          geoFenceName: "General Medical Center Zone",
          hospitalName: "General Medical Center",
          alertType: "entered",
          distance: 0,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          location: { lat: 40.7589, lng: -73.9851 },
          acknowledged: true
        }
      ];
      
      res.json(mockGeoFenceAlerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch geo-fence alerts" });
    }
  });

  app.get("/api/notifications/no-show-alerts", requireAuth, async (req, res) => {
    try {
      const mockNoShowAlerts = [
        {
          id: "ns1",
          userId: 3,
          userName: "Sarah Johnson",
          hospitalId: 1,
          hospitalName: "St. Mary's Hospital",
          scheduledTime: new Date(Date.now() - 45 * 60 * 1000),
          missedDuration: 45,
          lastKnownLocation: {
            lat: 40.7128,
            lng: -74.0060,
            timestamp: new Date(Date.now() - 50 * 60 * 1000)
          },
          severity: "medium",
          acknowledged: false
        },
        {
          id: "ns2",
          userId: 5,
          userName: "Anna Martinez",
          hospitalId: 3,
          hospitalName: "City Health Complex",
          scheduledTime: new Date(Date.now() - 120 * 60 * 1000),
          missedDuration: 120,
          severity: "high",
          acknowledged: false
        }
      ];
      
      res.json(mockNoShowAlerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch no-show alerts" });
    }
  });

  app.post("/api/notifications/acknowledge", requireAuth, async (req, res) => {
    try {
      const { alertId, type } = req.body;
      
      // Mock acknowledgment
      const acknowledgment = {
        alertId,
        type,
        acknowledgedBy: req.session.userId,
        acknowledgedAt: new Date()
      };
      
      res.json({ message: "Alert acknowledged successfully", data: acknowledgment });
    } catch (error) {
      res.status(500).json({ message: "Failed to acknowledge alert" });
    }
  });

  app.get("/api/notifications/settings", requireAuth, async (req, res) => {
    try {
      const mockSettings = {
        geoFenceAlerts: {
          enabled: true,
          approachingRadius: 200,
          soundEnabled: true,
          emailEnabled: true,
          smsEnabled: false
        },
        noShowAlerts: {
          enabled: true,
          gracePeriod: 15,
          escalationTime: 30,
          soundEnabled: true,
          emailEnabled: true,
          smsEnabled: true
        },
        generalSettings: {
          quietHours: {
            enabled: false,
            startTime: "22:00",
            endTime: "08:00"
          },
          priority: "all",
          batchNotifications: false
        }
      };
      
      res.json(mockSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification settings" });
    }
  });

  app.put("/api/notifications/settings", requireAuth, async (req, res) => {
    try {
      const settings = req.body;
      
      // Mock settings update
      const updatedSettings = {
        ...settings,
        updatedBy: req.session.userId,
        updatedAt: new Date()
      };
      
      res.json({ message: "Settings updated successfully", settings: updatedSettings });
    } catch (error) {
      res.status(500).json({ message: "Failed to update notification settings" });
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