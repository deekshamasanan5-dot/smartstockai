# SmartStock AI - Backend & Supabase Integration

This folder contains the complete, dedicated backend service and Supabase database integration for SmartStock Precision Inventory.

---

## Folder Structure

```
backend/
├── config/
│   └── supabase.ts             # Supabase client setup, credential parsing, ping & health checks
├── controllers/
│   ├── inventoryController.ts   # CRUD operations, stock adjustment, filter handling
│   ├── alertController.ts       # Reorder alerts & resolution
│   ├── supplierController.ts    # Supplier registration & listing
│   └── dashboardController.ts   # Valuation metrics (in ₹) & demand forecasting
├── routes/
│   ├── index.ts                # Master router mounting all sub-routes
│   ├── inventoryRoutes.ts      # /api/inventory endpoints
│   ├── supplierRoutes.ts       # /api/suppliers endpoints
│   ├── alertRoutes.ts          # /api/alerts endpoints
│   ├── movementRoutes.ts       # /api/movements endpoints
│   ├── dashboardRoutes.ts      # /api/dashboard endpoints
│   └── healthRoutes.ts         # /api/health endpoint
├── services/
│   └── inventoryService.ts     # Supabase queries & mutations with high-fidelity mock fallback
├── types/
│   └── index.ts                # TypeScript data models and interfaces
├── data/
│   └── seedData.ts             # Realistic SMB catalog data with Indian Rupee (₹) pricing
├── app.ts                      # Express app setup (CORS, JSON parser, route registration)
├── server.ts                   # Express server startup listening on PORT 3001
└── README.md
```

---

## Available API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Verifies backend status and live Supabase PostgreSQL connectivity |
| `GET` | `/api/inventory` | Lists products with optional `?search=`, `?category=`, `?status=` |
| `GET` | `/api/inventory/:id` | Fetches a single product by ID |
| `POST` | `/api/inventory` | Creates a new inventory product |
| `PUT` | `/api/inventory/:id` | Updates an existing product |
| `DELETE` | `/api/inventory/:id` | Deletes a product from the database |
| `POST` | `/api/inventory/:id/adjust` | Logs a stock movement (`in`, `out`, `adjustment`) and updates stock |
| `GET` | `/api/movements` | Fetches stock audit ledger entries |
| `GET` | `/api/alerts` | Fetches active reorder and buffer alerts |
| `POST` | `/api/alerts/:id/resolve` | Resolves or dismisses an alert |
| `GET` | `/api/suppliers` | Lists suppliers |
| `POST` | `/api/suppliers` | Registers a new supplier |
| `GET` | `/api/dashboard/stats` | High-level metrics: total valuation (₹), SKU count, turnover rate |
| `GET` | `/api/dashboard/forecasts` | AI demand forecasts and stockout predictions |

---

## How to Run the Backend

```bash
# From the project root:
npm run server
```

The server listens on `http://localhost:3001` and is automatically proxied by Vite during frontend development.
