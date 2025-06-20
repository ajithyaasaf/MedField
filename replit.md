# Medical Field Rep Management System

## Overview

This is a full-stack web application designed for managing medical field representatives' activities, including GPS-based attendance tracking, hospital visit management, and quotation generation. The system provides role-based access for field representatives and administrators with comprehensive tracking and reporting capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom medical-themed color palette
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: Express sessions with PostgreSQL session store
- **Authentication**: Session-based authentication with role-based access control
- **Database Provider**: Neon Database (serverless PostgreSQL)

### Data Storage Architecture
- **Primary Database**: PostgreSQL with the following key tables:
  - `users` - Field representatives and admin users
  - `hospitals` - Hospital/client information
  - `geo_fences` - GPS boundary definitions for attendance tracking
  - `attendance_records` - Clock in/out records with GPS coordinates
  - `products` - Medical products/services catalog
  - `quotations` - Generated quotations with line items
  - `schedules` - Visit scheduling and planning

## Key Components

### Authentication & Authorization
- **Session-based Authentication**: Uses Express sessions with PostgreSQL storage
- **Role-based Access Control**: Supports 'field_rep' and 'admin' roles
- **Protected Routes**: Middleware for authentication and admin-only access

### GPS & Geofencing
- **HTML5 Geolocation API**: Real-time location tracking
- **Haversine Formula**: Distance calculations for geo-fence validation
- **Automatic Attendance**: Clock in/out when entering/leaving defined geo-zones
- **Manual Override**: Admin approval for attendance outside geo-fences

### Quotation Management
- **Dynamic PDF Generation**: Client-side PDF creation using jsPDF
- **Product Catalog**: Configurable medical products and services
- **Pricing Engine**: Automated calculations with discount support
- **Email Integration**: Direct quotation delivery to clients

### Real-time Dashboard
- **Field Rep Dashboard**: Schedule management, attendance tracking, quotation tools
- **Admin Dashboard**: User management, geo-fence configuration, analytics
- **Interactive Maps**: Visual representation of geo-fences and field rep locations

## Data Flow

1. **User Authentication**: Login validates credentials and establishes session
2. **Location Tracking**: Frontend requests GPS permission and continuously monitors location
3. **Attendance Processing**: GPS coordinates are validated against geo-fences for automatic clock in/out
4. **Quotation Workflow**: Field reps select products, generate PDFs, and send to clients
5. **Admin Operations**: Administrators manage users, configure geo-fences, and view analytics

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React ecosystem (React Query, React Hook Form, React Router)
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Utilities**: date-fns for date handling, clsx for conditional styling
- **PDF Generation**: jsPDF for client-side PDF creation
- **Maps**: Simulated map component (ready for Google Maps/Mapbox integration)

### Backend Dependencies
- **Database**: Drizzle ORM with PostgreSQL driver
- **Session Management**: connect-pg-simple for PostgreSQL session storage
- **Validation**: Zod for schema validation and type safety
- **Development**: tsx for TypeScript execution, esbuild for production builds

### External Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Email Service**: Ready for integration with SendGrid/Mailgun
- **Maps Service**: Prepared for Google Maps or Mapbox integration

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **Database**: PostgreSQL development instance
- **Environment Variables**: `.env` file for configuration

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles Node.js server
- **Database Migrations**: Drizzle Kit for schema management
- **Deployment Target**: Replit Autoscale with PostgreSQL addon

### Configuration
- **Build Commands**: `npm run build` creates production-ready assets
- **Start Command**: `npm run start` launches production server
- **Database Setup**: `npm run db:push` applies schema changes

## Changelog

```
Changelog:
- June 20, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```