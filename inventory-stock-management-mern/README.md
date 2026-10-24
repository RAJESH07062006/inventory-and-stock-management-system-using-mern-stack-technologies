# Inventory & Stock Management System (MERN)

A ready-to-run MERN project for managing products and stock.

## Features
- Dashboard with product count, inventory value, low-stock count, and out-of-stock count
- Add, edit, search, and delete products
- Product category, SKU, supplier, price, quantity, and reorder level
- Low-stock and out-of-stock status indicators
- Stock-in and stock-out adjustments with validation
- Admin-only login with hashed passwords and expiring JWT sessions
- Backend-protected inventory API routes; no public registration page
- MongoDB persistence
- Responsive dashboard layout

## Requirements
- Node.js 18+ (Node.js 20 LTS recommended)
- MongoDB Community Server running locally, OR a MongoDB Atlas connection string

## 1. Configure the backend
Open a terminal in this project folder:

```bash
cd server
```

Copy `.env.example` to `.env` and edit it if needed.

Windows PowerShell:
```powershell
Copy-Item .env.example .env
```

Default local MongoDB URL:
`mongodb://127.0.0.1:27017/inventory_stock_db`

If you use MongoDB Atlas, put your Atlas connection string in `server/.env` as `MONGODB_URI`.

The `.env.example` includes a local development admin account. Change `ADMIN_PASSWORD` and `JWT_SECRET` in `server/.env` before using the app beyond local testing. The backend creates the initial admin account automatically when MongoDB starts and that email does not already exist. There is no public registration page.

**Default local login (if you keep the example settings):**
- Email: `admin@stockwise.local`
- Password: `Admin@12345`

## 2. Install dependencies
Open a terminal in the root project folder and run:

```bash
npm install
npm run install:all
```

## 3. Start the application
Make sure MongoDB is running, then from the root folder run:

```bash
npm run dev
```

Open the frontend at http://localhost:5173
Backend API runs at http://localhost:5000

## Alternative: run terminals separately
Terminal 1:
```bash
cd server
npm install
npm run dev
```

Terminal 2:
```bash
cd client
npm install
npm run dev
```

## Notes
- The app uses the database name in your MongoDB connection string.
- The first run starts with an empty inventory; sign in with the admin account, then click **Add product** to create records.
- This is an educational internship project. Use a strong unique admin password and JWT secret, HTTPS, rate limiting, audit logging, and backups before using it for real business inventory.
