# RAMART E-Commerce Platform - Production Deployment & Configuration Guide

Welcome to the **RAMART Production E-Commerce Platform**. This documentation outlines the system architecture, security guidelines, email engine, database lifecycle, and deployment instructions.

---

## 1. Zero Demo Data Policy
The database (`ramart.db`) starts **completely clean** with zero demo/test products, zero fake orders, and zero simulated revenue.
- The Admin Dashboard shows **real database values only** (`0` when empty).
- The customer catalog starts empty until you add your real products via **Admin Panel → Products → Add Real Product**.
- Customers and order logs are generated purely from live customer transactions.

---

## 2. Default Admin Credentials & Setup
- **Admin URL:** `http://127.0.0.1:8080/admin`
- **Default Username:** `admin`
- **Default Password:** `ramart123`

> **IMPORTANT:** Immediately after logging in, go to **Admin → Store Settings → Change Admin Password** and update your administrator password.

---

## 3. Architecture & Key Features

### A. Persistent Multi-Threaded Engine (`server.py`)
- High-concurrency `ThreadingMixIn` HTTP server.
- **SQLite Database (`ramart.db`)** configured in **WAL (Write-Ahead Logging)** mode with atomic ACID transactions and foreign key integrity.
- **Automated Stock Inventory Reduction:** When an order is placed, product inventory is decremented atomically. If stock reaches 0, the product is marked Out of Stock on the storefront.

### B. Asynchronous Email Notification System
- Background daemon threads send emails without adding latency to customer checkout.
- **Store Owner Alert:** Receives full order details, customer contact info, delivery address, and ordered items breakdown whenever an order is submitted.
- **Customer Notifications:**
  - **Order Confirmation:** Triggered upon checkout completion.
  - **Status Change:** Dispatches updates when status changes to `Shipped` (includes tracking number), `Delivered`, `Cancelled`, or `Refunded`.
- **Configuration:** Go to **Admin → Email & Alerts** or define `SMTP_USER` and `SMTP_PASS` in `.env`.

### C. Customer Order Tracking (`/track`)
- Customers can track package status anytime by visiting `/track`.
- Input **Order Reference ID** (e.g. `RAM-IND-123456`) + Mobile Number or Email.
- Visual timeline progression: `Order Placed` ➔ `Confirmed` ➔ `Processing` ➔ `Shipped` ➔ `Delivered`.
- Includes full item breakdown, delivery address, and printable GST Tax Invoice.

---

## 4. Production Security Controls
- **SHA-256 Hashed Passwords:** Admin passwords are encrypted with SHA-256.
- **Session Authentication:** Token-based bearer authentication with 24-hour expiration.
- **Protected Admin Routes:** All `/api/admin/*` and mutation APIs reject unauthorized access with HTTP 401.
- **Login Rate Limiting:** Brute-force protection limits failed login attempts to 5 attempts per 5-minute window.
- **Environment Isolation:** Zero credentials, SMTP secrets, or payment keys are exposed in frontend JavaScript.

---

## 5. Starting the Production Server
```bash
# Navigate to the project directory
cd ~/ecommerce-store

# Start the server on port 8080
python3 server.py 8080
```

### URLs
- **Storefront:** [http://127.0.0.1:8080/](http://127.0.0.1:8080/)
- **Admin Dashboard:** [http://127.0.0.1:8080/admin](http://127.0.0.1:8080/admin)
- **Order Tracking:** [http://127.0.0.1:8080/track](http://127.0.0.1:8080/track)
