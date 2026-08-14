# Requirements Document — AI Inventory Agent

---

## 1. Functional Requirements

### 1.1 Authentication & Authorization

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | The system shall allow users to register with username, email, password, and full name |
| FR-AUTH-02 | The system shall authenticate users via username and password, returning a JWT token |
| FR-AUTH-03 | The system shall hash passwords using BCrypt before storage |
| FR-AUTH-04 | JWT tokens shall expire after 24 hours |
| FR-AUTH-05 | The system shall reject requests with invalid or expired tokens (HTTP 401) |
| FR-AUTH-06 | The frontend shall store auth tokens in sessionStorage (browser close = logout) |
| FR-AUTH-07 | The system shall prevent duplicate usernames and emails during registration |

### 1.2 Product Management

| ID | Requirement |
|----|-------------|
| FR-PROD-01 | The system shall support full CRUD operations for products |
| FR-PROD-02 | Each product shall have: name (required, max 100 chars), SKU (unique, required), description (max 500 chars), category (max 50 chars), unit price (required, positive), cost price (positive), reorder level (required), image URL, active status |
| FR-PROD-03 | The system shall auto-generate timestamps (createdAt, updatedAt) on product creation/update |
| FR-PROD-04 | The system shall support product search by name or SKU via query parameter |
| FR-PROD-05 | The system shall provide a low-stock endpoint returning products where stock is at or below reorder level |
| FR-PROD-06 | The system shall allow toggling a product's active/inactive status via PATCH endpoint |
| FR-PROD-07 | The frontend shall display products in a table with category/status/sort filters in a collapsible panel |
| FR-PROD-08 | The system shall validate all inputs using Jakarta Bean Validation annotations |

### 1.3 Inventory Management

| ID | Requirement |
|----|-------------|
| FR-INV-01 | The system shall record inventory movements with type (IN, OUT, ADJUST), quantity, product reference, and notes |
| FR-INV-02 | The system shall calculate current stock per product from all movements (IN adds, OUT subtracts, ADJUST adds) |
| FR-INV-03 | The frontend shall display stock levels with movement type, date, and product filters |
| FR-INV-04 | The system shall filter movements by type, product, and date range |

### 1.4 Supplier Management

| ID | Requirement |
|----|-------------|
| FR-SUP-01 | The system shall support full CRUD operations for suppliers |
| FR-SUP-02 | Each supplier shall have: name (required, max 100 chars), contact person, email (validated format), phone, address |
| FR-SUP-03 | The frontend shall support filtering suppliers by has-email, has-phone, and sort order |

### 1.5 Sales Management

| ID | Requirement |
|----|-------------|
| FR-SALE-01 | The system shall record sales with product, quantity, unit price, customer name, sale date, and status |
| FR-SALE-02 | The system shall auto-calculate totalPrice (unitPrice x quantity) |
| FR-SALE-03 | Sale status shall default to PENDING and support COMPLETED and CANCELLED states |
| FR-SALE-04 | The frontend shall filter sales by customer, product, status, and date range |

### 1.6 Purchase Management

| ID | Requirement |
|----|-------------|
| FR-PUR-01 | The system shall create purchase orders linked to a product and supplier |
| FR-PUR-02 | Purchase status shall default to ORDERED and support RECEIVED and CANCELLED states |
| FR-PUR-03 | The system shall auto-calculate totalCost (unitCost x quantity) |
| FR-PUR-04 | The frontend shall allow receiving (ORDERED -> RECEIVED) and cancelling (ORDERED -> CANCELLED) purchase orders |
| FR-PUR-05 | The frontend shall filter purchases by supplier, status, and date range |

### 1.7 Dashboard

| ID | Requirement |
|----|-------------|
| FR-DASH-01 | The dashboard shall display KPI cards: total products, total sales, total revenue, total suppliers |
| FR-DASH-02 | The dashboard shall show a sales trend line chart (Chart.js) |
| FR-DASH-03 | The dashboard shall show a category distribution pie chart |
| FR-DASH-04 | The dashboard shall show a top products bar chart |
| FR-DASH-05 | The dashboard shall display a recent activity feed |

### 1.8 AI Features

| ID | Requirement |
|----|-------------|
| FR-AI-01 | The system shall forecast 7-day demand per product using moving average or trained ML model |
| FR-AI-02 | The system shall compute a stock health score (0-100) per product based on stock ratio and sales velocity |
| FR-AI-03 | The system shall detect anomalies in sales quantity, price, and velocity using Z-score analysis |
| FR-AI-04 | The system shall generate reorder suggestions with suggested quantity, urgency, and estimated cost |
| FR-AI-05 | The system shall accept natural language queries and route to the appropriate AI module |

### 1.9 Reports

| ID | Requirement |
|----|-------------|
| FR-RPT-01 | The reports page shall display aggregated sales, purchase, and inventory analytics |
| FR-RPT-02 | The reports page shall render Chart.js visualizations for sales by period, category breakdown, and inventory status |

---

## 2. Non-Functional Requirements

### 2.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | API responses shall return within 2 seconds under normal load |
| NFR-PERF-02 | The MySQL connection pool shall support up to 20 concurrent connections |
| NFR-PERF-03 | AI service responses shall return within 5 seconds |

### 2.2 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All API endpoints except auth shall require a valid JWT token |
| NFR-SEC-02 | Passwords shall be stored as BCrypt hashes (never plaintext) |
| NFR-SEC-03 | CORS shall allow all origins for development; restrictable via CorsConfig |
| NFR-SEC-04 | The JWT secret key shall be configurable via application.properties |
| NFR-SEC-05 | Sensitive configuration (DB credentials, JWT secret) shall not be committed to version control |

### 2.3 Reliability

| ID | Requirement |
|----|-------------|
| NFR-REL-01 | The system shall handle entity-not-found errors gracefully with HTTP 404 |
| NFR-REL-02 | The system shall validate all request inputs and return HTTP 400 with descriptive messages |
| NFR-REL-03 | The global exception handler shall return structured JSON error responses |

### 2.4 Usability

| ID | Requirement |
|----|-------------|
| NFR-USE-01 | The frontend shall be responsive and work on desktop and tablet screens |
| NFR-USE-02 | All data pages shall include collapsible filter panels |
| NFR-USE-03 | The system shall display toast notifications for success/error feedback |
| NFR-USE-04 | The sidebar shall highlight the current active page |

### 2.5 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-MAINT-01 | The codebase shall follow a layered architecture: Controller -> Service -> Repository -> Entity |
| NFR-MAINT-02 | DTOs shall separate API contracts from entity internals |
| NFR-MAINT-03 | Each AI module shall be an independent Python service file |
| NFR-MAINT-04 | Frontend JavaScript shall be organized per-page with a shared common.js |

### 2.6 Compatibility

| ID | Requirement |
|----|-------------|
| NFR-COMPAT-01 | The backend shall run on Java 21 |
| NFR-COMPAT-02 | The AI service shall run on Python 3.14+ |
| NFR-COMPAT-03 | The frontend shall work in Chrome, Firefox, and Edge (latest versions) |
| NFR-COMPAT-04 | The database shall be MySQL 8.0 via XAMPP |

---

## 3. System Constraints

- **Single-user scope**: The system is designed for a single organization; no multi-tenancy
- **No payment integration**: Sales and purchases are recorded manually
- **AI service is optional**: The frontend and backend work independently of the Flask AI service
- **Local development only**: No containerization, CI/CD, or cloud deployment configured
