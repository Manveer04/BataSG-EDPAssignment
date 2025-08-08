# Bata E-Commerce Platform

A full-stack e-commerce solution built for Bata Singapore, featuring comprehensive order fulfillment, delivery management, and staff recruitment systems.

## 📋 Project Overview

This is an integrated e-commerce platform that provides a complete online shopping experience for customers while offering robust backend management systems for staff operations. The system encompasses everything from product browsing and purchasing to order fulfillment and delivery tracking.

### 🎯 Key Features
- **Customer Portal**: Product browsing, shopping cart, secure checkout, order tracking
- **Admin Dashboard**: User management, product management, order oversight, analytics
- **Staff Management**: Role-based access for fulfillment staff and delivery agents
- **Order Processing**: Automated assignment, fulfillment tracking, delivery management
- **Recruitment System**: Job applications, approval workflows, automated account creation

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.2.0 with Vite
- **UI Library**: Material-UI (MUI) v6.0.2
- **State Management**: React Context API
- **Routing**: React Router v6.26.1
- **Charts & Analytics**: Chart.js, React Google Charts
- **Authentication**: JWT with role-based access
- **Additional Tools**: 
  - Axios for HTTP requests
  - Formik & Yup for form handling
  - React Toastify for notifications
  - jsPDF & html2canvas for PDF generation
  - React Three Fiber for 3D product models

### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: Entity Framework Core with SQL Server
- **Authentication**: JWT Bearer tokens with BCrypt password hashing
- **PDF Generation**: iTextSharp for AWB and document generation
- **File Management**: EPPlus for Excel operations
- **External APIs**: Google APIs for account management and mapping services
- **Architecture**: RESTful API with Repository pattern

## 🚀 My Contributions: Order Fulfilment and Delivery System

### 📦 Order Processing Workflow

#### 1. Order Reception & Initial Processing
- **Order Status**: Starts as "Processing" when customer completes purchase
- **Data Capture**: Customer details, shipping address, contact information, order items
- **Validation**: Comprehensive order validation including customer verification, payment confirmation, and inventory checks

#### 2. Intelligent Order Assignment
- **Automated Algorithm**: Orders are automatically assigned to Fulfillment Staff across different warehouses
- **Load Balancing**: Algorithm considers staff workload and warehouse capacity
- **Manual Override**: Admin can manually reassign orders when needed
- **Location Optimization**: Assignment considers proximity to customer delivery address

#### 3. Fulfillment Staff Dashboard
- **Order Visibility**: Staff can view all assigned orders in their dashboard
- **Order Details**: Complete order information including customer details, products, quantities, and shipping requirements
- **Status Tracking**: Real-time updates on order processing status
- **Analytics**: Performance metrics and order statistics

#### 4. Order Packing & AWB Generation
- **Packing Interface**: Intuitive interface for staff to mark orders as packed
- **AWB Creation**: Automated Air Waybill generation with unique tracking numbers
- **Barcode Integration**: Each AWB includes a scannable barcode (Format: BTAOL000XXXXXX)
- **PDF Generation**: Professional AWB documents with sender/receiver details, order summary, and shipping information
- **Print Ready**: Optimized A5 format for easy printing and parcel attachment

#### 5. Delivery Agent Handoff
- **Barcode Scanning**: Delivery agents scan multiple parcels before vehicle loading
- **Status Update**: Order status automatically changes to "Shipped" upon scanning
- **Route Optimization**: System calculates optimal delivery routes using OneMap API
- **Real-time Tracking**: Customers can track their orders in real-time

#### 6. Final Delivery & Proof of Delivery
- **Final Scan**: Delivery confirmation through barcode scanning
- **Status Completion**: Order status updated to "Delivered"
- **Photo Evidence**: Delivery agents can capture proof of delivery photos
- **Customer Notification**: Automated notifications sent to customers

### 🏢 Job Recruitment System

#### 1. Customer Registration & Application
- **Seamless Transition**: Existing customers can apply for staff positions
- **Role Selection**: Apply as Fulfillment Staff or Delivery Agent
- **Comprehensive Forms**: Detailed application forms capturing all necessary information
- **Data Persistence**: All application data saved under JobApplicant entity

#### 2. Application Management
- **Edit Capability**: Applicants can modify their applications after submission
- **Status Tracking**: Real-time application status updates
- **Document Upload**: Support for resume and document attachments

#### 3. Admin Review & Approval
- **Review Dashboard**: Admin interface for reviewing all applications
- **Approval Workflow**: Structured approval/rejection process
- **Automated Notifications**: Email notifications sent to applicants about decisions
- **Bulk Processing**: Efficient tools for handling multiple applications

#### 4. Automated Account Creation
- **Google Workspace Integration**: Automatic creation of @batasg.cam domain accounts
- **Credential Management**: Secure generation and distribution of login credentials
- **Role Assignment**: Automatic assignment of appropriate system roles
- **Welcome Process**: Comprehensive onboarding email with login instructions

### 🔧 Advanced Technical Features

#### 1. Geographic Intelligence
- **OneMap Integration**: Real-time distance calculation between warehouses and applicant locations
- **Location-Based Assignment**: Optimal staff assignment based on geographic proximity
- **Route Optimization**: Dynamic delivery route calculation for maximum efficiency

#### 2. Vehicle Validation System
- **Careg API Integration**: Real-time vehicle registration validation
- **Delivery Agent Verification**: Ensures only licensed vehicles are used for deliveries
- **Compliance Tracking**: Maintains records for regulatory compliance

#### 3. Advanced Order Assignment Algorithm
- **Multi-Factor Analysis**: Considers workload, location, warehouse capacity, and staff performance
- **Real-Time Optimization**: Dynamic reassignment based on changing conditions
- **Performance Metrics**: Tracks assignment effectiveness and adjusts algorithms accordingly

#### 4. Document Generation & Scanning
- **Professional AWBs**: Industry-standard Air Waybill generation with all required information
- **Barcode Technology**: 128-bit barcodes for reliable scanning
- **Mobile Scanning**: Camera-based barcode scanning for delivery agents
- **PDF Optimization**: Lightweight, print-ready documents

#### 5. Real-Time Routing & Navigation
- **OneMap Integration**: Live traffic and route data for optimal delivery paths
- **Turn-by-Turn Navigation**: Integrated navigation for delivery agents
- **Multi-Stop Optimization**: Efficient route planning for multiple deliveries
- **Real-Time Updates**: Dynamic route adjustments based on traffic conditions

## 💻 Getting Started

### Prerequisites
- Node.js 18+ for frontend
- .NET 8.0 SDK for backend
- SQL Server for database
- Visual Studio Code or Visual Studio

### Frontend Setup
```bash
cd "Frontend (Bata)"
npm install
npm run dev
```
Frontend runs on: `http://localhost:3000`

### Backend Setup
```bash
cd "Backend (Bata)/BataWebsite"
dotnet restore
dotnet run
```
Backend runs on: `http://localhost:7004`

### Database Setup
1. Update connection string in `appsettings.json`
2. Run Entity Framework migrations:
```bash
dotnet ef database update
```

## 🔐 User Roles & Access

### Customer
- Product browsing and purchasing
- Order tracking and history
- Profile management
- Job applications

### Fulfillment Staff
- View assigned orders
- Update order status
- Generate AWBs
- Performance analytics

### Delivery Agent
- Scan parcels for pickup
- Access delivery routes
- Update delivery status
- Proof of delivery capture

### Admin
- Complete system oversight
- User and staff management
- Order management and assignment
- Recruitment management
- System analytics

## 📱 Key API Endpoints

### Order Management
- `POST /api/order` - Create new order
- `GET /api/order/GetOrdersByFulfilmentStaff/{staffId}` - Get staff orders
- `GET /api/order/GenerateAWB/{orderId}` - Generate AWB document
- `PUT /api/order/ScanAWBBarcode/{barcode}` - Process barcode scan

### Staff Management
- `POST /api/staff/login` - Staff authentication
- `GET /api/staff/profile` - Staff profile information
- `PUT /api/order/addOrderToDeliveryAgent/{orderId}` - Assign delivery

### Recruitment
- `POST /api/JobApplicant` - Submit job application
- `PUT /api/JobApplicant/{id}` - Update application
- `POST /api/Admin/approve-fulfilment-staff` - Approve applications

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Material-UI components
- **Real-Time Updates**: Live order status and notification system
- **Intuitive Navigation**: Role-based navigation with clear user flows
- **Professional Documentation**: Auto-generated PDFs for AWBs and invoices
- **Interactive Charts**: Comprehensive analytics dashboards
- **3D Product Views**: Enhanced product visualization

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permission system
- **Password Encryption**: BCrypt hashing for secure password storage
- **CORS Configuration**: Secure cross-origin request handling
- **Input Validation**: Comprehensive validation on all user inputs

## 📊 Performance Optimizations

- **Efficient Database Queries**: Optimized Entity Framework queries with eager loading
- **Caching Strategies**: Strategic caching for frequently accessed data
- **Lazy Loading**: Component-based lazy loading for improved performance
- **Compressed Assets**: Optimized images and static assets
- **API Rate Limiting**: Protected endpoints with rate limiting

## 🚀 Deployment

The system is designed for production deployment with:
- Docker containerization support
- Environment-specific configuration
- Database migration scripts
- Automated testing pipeline
- Monitoring and logging integration

## 📈 Future Enhancements

- AI-powered demand forecasting
- Advanced analytics and machine learning insights
- Mobile app development
- Integration with additional payment gateways
- Enhanced real-time notifications
- Automated inventory management

---

**Developed as part of Enterprise Development Project (EDP) - A comprehensive solution for modern e-commerce operations with focus on operational efficiency and user experience.**
