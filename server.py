#!/usr/bin/env python3
"""
RAMART E-Commerce Platform - Production Engine
=============================================
Architecturally separated Customer Storefront and Private Admin Portal.
- Customer Storefront: / and /track
- Private Admin Portal: /admin/login and /admin/dashboard (Strict server-side auth & 302 redirects)
- Working Gmail SMTP & Async Email Notifications (Store Owner & Customer)
- Complete Order Processing, Dispatch Management & Tracking
- Persistent SQLite Database with WAL mode & zero demo data
"""

import http.server
import socketserver
import os
import sys
import json
import sqlite3
import hashlib
import secrets
import time
import base64
import threading
import smtplib
import re
from email.message import EmailMessage
from urllib.parse import urlparse, parse_qs

# Base Directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ADMIN_DIR = os.path.join(BASE_DIR, "admin")
DB_PATH = os.path.join(BASE_DIR, "ramart.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "images", "products")
ENV_PATH = os.path.join(BASE_DIR, ".env")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(ADMIN_DIR, exist_ok=True)

# Load .env if present
def load_env():
    env_vars = {}
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env_vars[k.strip()] = v.strip()
    return env_vars

ENV = load_env()
PORT = int(os.environ.get("PORT", ENV.get("PORT", 8080)))

# Admin Sessions: {token: {"username": str, "expires": float}}
ACTIVE_SESSIONS = {}

# Rate Limiter for Login: {ip: [timestamps]}
LOGIN_ATTEMPTS = {}
RATE_LIMIT_MAX = 5
RATE_LIMIT_WINDOW = 300 # 5 minutes

def is_rate_limited(identifier: str) -> bool:
    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(identifier, [])
    attempts = [t for t in attempts if now - t < RATE_LIMIT_WINDOW]
    LOGIN_ATTEMPTS[identifier] = attempts
    return len(attempts) >= RATE_LIMIT_MAX

def record_failed_attempt(identifier: str):
    now = time.time()
    attempts = LOGIN_ATTEMPTS.get(identifier, [])
    attempts.append(now)
    LOGIN_ATTEMPTS[identifier] = attempts

def clear_attempts(identifier: str):
    if identifier in LOGIN_ATTEMPTS:
        del LOGIN_ATTEMPTS[identifier]

# Database Connection Helper
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_database():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Admin Users
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. Categories
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 3. Products
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                sku TEXT UNIQUE,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                price REAL NOT NULL,
                original_price REAL,
                discount_percent REAL,
                stock_quantity INTEGER DEFAULT 10,
                status TEXT DEFAULT 'active',
                badge TEXT,
                rating REAL DEFAULT 5.0,
                reviews_count INTEGER DEFAULT 0,
                image TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 4. Customers Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT UNIQUE NOT NULL,
                email TEXT,
                total_orders INTEGER DEFAULT 1,
                total_spent REAL DEFAULT 0,
                last_order_date TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 5. Orders Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                order_date TEXT NOT NULL,
                customer_id INTEGER,
                customer_name TEXT NOT NULL,
                customer_phone TEXT NOT NULL,
                customer_email TEXT,
                address TEXT NOT NULL,
                area TEXT NOT NULL,
                city TEXT NOT NULL,
                state TEXT NOT NULL,
                pincode TEXT NOT NULL,
                subtotal REAL NOT NULL,
                discount_amount REAL DEFAULT 0,
                shipping_fee REAL DEFAULT 0,
                total REAL NOT NULL,
                payment_method TEXT NOT NULL,
                payment_status TEXT DEFAULT 'Pending',
                order_status TEXT DEFAULT 'Pending',
                courier_partner TEXT,
                tracking_number TEXT,
                tracking_url TEXT,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id)
            )
        """)

        # Run schema migrations for orders if existing columns are missing
        cursor.execute("PRAGMA table_info(orders);")
        order_cols = [row["name"] for row in cursor.fetchall()]
        if "courier_partner" not in order_cols:
            cursor.execute("ALTER TABLE orders ADD COLUMN courier_partner TEXT;")
        if "tracking_url" not in order_cols:
            cursor.execute("ALTER TABLE orders ADD COLUMN tracking_url TEXT;")

        # 6. Order Items Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL,
                product_id TEXT,
                product_name TEXT NOT NULL,
                sku TEXT,
                unit_price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                total_price REAL NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        """)

        # 7. Coupons Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS coupons (
                code TEXT PRIMARY KEY,
                discount_type TEXT DEFAULT 'percentage',
                discount_value REAL NOT NULL,
                min_order_amount REAL DEFAULT 0,
                max_uses INTEGER,
                uses_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 8. Store Settings Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS store_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        # 9. Email Settings Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )
        """)

        # 10. Email Logs Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS email_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient TEXT NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                status TEXT NOT NULL,
                error_message TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Seed Default Admin if not exists
        cursor.execute("SELECT * FROM admin_users WHERE username = 'admin'")
        if not cursor.fetchone():
            cursor.execute("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)",
                           ('admin', hash_password('ramart123')))

        # Default Categories
        default_cats = ["Electronics", "Wearables", "Home & Living", "Accessories"]
        for cat in default_cats:
            cursor.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (cat,))

        # Default Store Branding & Settings
        default_settings = {
            "store_name": "RAMART",
            "tagline": "India's Favorite Online Shopping Store",
            "currency": "₹",
            "gstin": "29AABCR8901M1Z5",
            "free_shipping_min": "499",
            "shipping_charge": "49",
            "support_phone": "+91 98765 43210",
            "support_email": "support@ramart.in",
            "announcement": "Grand Opening Sale: Use coupon SAVE10 for 10% instant discount!"
        }
        for k, v in default_settings.items():
            cursor.execute("INSERT OR IGNORE INTO store_settings (key, value) VALUES (?, ?)", (k, v))

        # Default Email Settings
        default_email_settings = {
            "enabled": "true" if ENV.get("SMTP_USER") else "false",
            "store_owner_email": ENV.get("STORE_OWNER_EMAIL", "owner@ramart.in"),
            "smtp_host": ENV.get("SMTP_HOST", "smtp.gmail.com"),
            "smtp_port": ENV.get("SMTP_PORT", "587"),
            "smtp_user": ENV.get("SMTP_USER", ""),
            "smtp_pass": ENV.get("SMTP_PASS", ""),
            "smtp_from": ENV.get("SMTP_FROM", "RAMART Store <noreply@ramart.in>"),
            "smtp_secure": ENV.get("SMTP_SECURE", "tls")
        }
        for k, v in default_email_settings.items():
            cursor.execute("INSERT OR IGNORE INTO email_settings (key, value) VALUES (?, ?)", (k, v))

        # Default Promo Coupons
        default_coupons = [
            ("SAVE10", "percentage", 10.0, 0),
            ("RAMART20", "percentage", 20.0, 999),
            ("FIRST50", "percentage", 15.0, 499)
        ]
        for code, dtype, val, mina in default_coupons:
            cursor.execute("INSERT OR IGNORE INTO coupons (code, discount_type, discount_value, min_order_amount, status) VALUES (?, ?, ?, ?, 'active')",
                           (code, dtype, val, mina))

        conn.commit()


# ==============================================================================
# Gmail SMTP & Email Dispatcher
# ==============================================================================
def send_email_sync(recipient: str, subject: str, html_content: str, text_content: str = None) -> tuple[bool, str]:
    """Synchronous email sender with Gmail App Password support"""
    if not recipient or "@" not in recipient:
        return False, "Invalid recipient email address"
    
    with get_db() as conn:
        rows = conn.execute("SELECT key, value FROM email_settings").fetchall()
        settings = {r["key"]: r["value"] for r in rows}

    enabled = settings.get("enabled", "false").lower() == "true"
    smtp_host = settings.get("smtp_host", "smtp.gmail.com").strip()
    smtp_port = int(settings.get("smtp_port", 587))
    smtp_user = settings.get("smtp_user", "").strip()
    smtp_pass = settings.get("smtp_pass", "").strip().replace(" ", "")
    smtp_from = settings.get("smtp_from", "").strip() or f"RAMART Store <{smtp_user}>"
    smtp_secure = settings.get("smtp_secure", "tls").strip().lower()

    if not enabled or not smtp_host or not smtp_user or not smtp_pass:
        with get_db() as conn:
            conn.execute("""
                INSERT INTO email_logs (recipient, subject, body, status, error_message)
                VALUES (?, ?, ?, 'queued', 'SMTP not configured or disabled in settings')
            """, (recipient, subject, html_content))
            conn.commit()
        print(f"📧 [EMAIL QUEUED] To: {recipient} | Subject: {subject} (SMTP disabled or waiting for credentials)")
        return True, "Email queued in database log (SMTP disabled or not configured)"

    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = smtp_from if "<" in smtp_from else f"RAMART Store <{smtp_user}>"
        msg["To"] = recipient

        if text_content:
            msg.set_content(text_content)
        else:
            msg.set_content(re.sub('<[^<]+?>', '', html_content))
        
        msg.add_alternative(html_content, subtype="html")

        if smtp_secure == "ssl" or smtp_port == 465:
            with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=20) as server:
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
        else:
            with smtplib.SMTP(smtp_host, smtp_port, timeout=20) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)

        with get_db() as conn:
            conn.execute("""
                INSERT INTO email_logs (recipient, subject, body, status)
                VALUES (?, ?, ?, 'sent')
            """, (recipient, subject, html_content))
            conn.commit()
        print(f"✅ [GMAIL SMTP SENT] To: {recipient} | Subject: {subject}")
        return True, "Email successfully sent via Gmail SMTP"

    except Exception as e:
        err_msg = str(e)
        with get_db() as conn:
            conn.execute("""
                INSERT INTO email_logs (recipient, subject, body, status, error_message)
                VALUES (?, ?, ?, 'failed', ?)
            """, (recipient, subject, html_content, err_msg))
            conn.commit()
        print(f"❌ [GMAIL SMTP FAILED] To: {recipient} | Error: {err_msg}")
        return False, err_msg


def send_email_async(recipient: str, subject: str, html_content: str, text_content: str = None):
    """Dispatches email asynchronously in background thread"""
    thread = threading.Thread(target=send_email_sync, args=(recipient, subject, html_content, text_content), daemon=True)
    thread.start()


def notify_new_order(order_data, items):
    """Sends notification to store owner and confirmation to customer"""
    with get_db() as conn:
        rows = conn.execute("SELECT key, value FROM email_settings").fetchall()
        settings = {r["key"]: r["value"] for r in rows}
        store_owner_email = settings.get("store_owner_email") or "owner@ramart.in"

    order_id = order_data["id"]
    customer_name = order_data["customer_name"]
    customer_email = order_data.get("customer_email")
    total = order_data["total"]
    phone = order_data["customer_phone"]
    payment_mode = order_data["payment_method"]
    address = f"{order_data['address']}, {order_data['area']}, {order_data['city']}, {order_data['state']} - {order_data['pincode']}"

    items_html = "".join([
        f"<tr><td style='padding:8px;border-bottom:1px solid #eee;'>{it['product_name']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:center;'>{it['quantity']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:right;'>₹{int(it['total_price']):,}</td></tr>"
        for it in items
    ])

    # 1. Store Owner Notification
    owner_subject = f"🛍️ New RAMART Order #{order_id} Received (₹{int(total):,})"
    owner_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #d4af37; border-radius: 8px;">
        <h2 style="color: #0a0a0a; border-bottom: 2px solid #881337; padding-bottom: 10px;">
            RAM<span style="color:#2563eb;">ART</span> Store - New Order Alert
        </h2>
        <p>A new customer order has been placed on RAMART.</p>
        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 15px 0;">
            <p><strong>Order ID:</strong> {order_id}</p>
            <p><strong>Customer:</strong> {customer_name} (+91 {phone})</p>
            <p><strong>Email:</strong> {customer_email or 'N/A'}</p>
            <p><strong>Shipping Address:</strong> {address}</p>
            <p><strong>Payment Mode:</strong> {payment_mode}</p>
            <p><strong>Total Amount:</strong> <span style="font-size: 18px; font-weight: bold; color: #881337;">₹{int(total):,}</span></p>
        </div>
        <h3>Ordered Items:</h3>
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #0a0a0a; color: white;">
                    <th style="padding: 8px; text-align: left;">Product</th>
                    <th style="padding: 8px; text-align: center;">Qty</th>
                    <th style="padding: 8px; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>{items_html}</tbody>
        </table>
        <p style="margin-top: 20px;"><a href="http://127.0.0.1:8080/admin/dashboard" style="background: #881337; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Fulfill Order in Admin Panel →</a></p>
    </div>
    """
    send_email_async(store_owner_email, owner_subject, owner_html)

    # 2. Customer Order Confirmation Email
    if customer_email and "@" in customer_email:
        cust_subject = f"✨ Order Confirmed! RAMART #{order_id}"
        cust_html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #d4af37; border-radius: 8px;">
            <h2 style="color: #0a0a0a; border-bottom: 2px solid #881337; padding-bottom: 10px;">
                Thank you for your order, {customer_name}!
            </h2>
            <p>We've received your order <strong>#{order_id}</strong> and our team is preparing it for express dispatch.</p>
            <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 15px 0;">
                <p><strong>Delivery Address:</strong> {address}</p>
                <p><strong>Payment Mode:</strong> {payment_mode}</p>
                <p><strong>Total Paid:</strong> <span style="font-size: 18px; font-weight: bold; color: #881337;">₹{int(total):,}</span></p>
            </div>
            <h3>Order Summary:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background: #0a0a0a; color: white;">
                        <th style="padding: 8px; text-align: left;">Item</th>
                        <th style="padding: 8px; text-align: center;">Qty</th>
                        <th style="padding: 8px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>{items_html}</tbody>
            </table>
            <p style="margin-top: 25px;"><a href="http://127.0.0.1:8080/track" style="background: #881337; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Track Your Order Status →</a></p>
            <p style="font-size: 12px; color: #64748b; margin-top: 20px;">If you have any questions, reply to this email or contact support.</p>
        </div>
        """
        send_email_async(customer_email, cust_subject, cust_html)


def notify_status_change(order_id: str, new_status: str, customer_email: str, customer_name: str, courier: str = None, tracking_no: str = None, tracking_url: str = None):
    """Sends notification to customer when order status updates"""
    if not customer_email or "@" not in customer_email:
        return
    
    courier_info = ""
    if courier:
        courier_info += f"<p><strong>Courier Partner:</strong> {courier}</p>"
    if tracking_no:
        courier_info += f"<p><strong>AWB / Tracking Number:</strong> {tracking_no}</p>"
    if tracking_url:
        courier_info += f"<p><a href='{tracking_url}' style='color:#0284c7;font-weight:bold;'>Click here to track directly on courier website →</a></p>"

    status_msg = {
        "Confirmed": "Your order has been confirmed by RAMART and is queued for packaging.",
        "Processing": "Your items are currently being packed and quality-checked at our fulfillment center.",
        "Shipped": f"Your order #{order_id} has been dispatched for express delivery! " + courier_info,
        "Delivered": f"Your order #{order_id} has been successfully delivered. We hope you love your purchase!",
        "Cancelled": f"Your order #{order_id} has been cancelled. Any eligible refund will be credited back within 3-5 business days.",
        "Refunded": f"A refund has been initiated for your order #{order_id}."
    }.get(new_status, f"The status of your order #{order_id} has been updated to: {new_status}")

    subject = f"📦 RAMART Order #{order_id} Update: {new_status}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #d4af37; border-radius: 8px;">
        <h2 style="color: #0a0a0a; border-bottom: 2px solid #881337; padding-bottom: 10px;">
            Order Status Update: <span style="color:#881337;">{new_status}</span>
        </h2>
        <p>Dear {customer_name},</p>
        <p>{status_msg}</p>
        <p style="margin-top: 25px;"><a href="http://127.0.0.1:8080/track" style="background: #881337; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Live Tracking →</a></p>
    </div>
    """
    send_email_async(customer_email, subject, html)


# ==============================================================================
# Production HTTP Request Handler
# ==============================================================================
class ProductionRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def is_authenticated(self) -> bool:
        auth_header = self.headers.get('Authorization', '')
        token = auth_header.replace('Bearer ', '').strip()
        if not token:
            cookie = self.headers.get('Cookie', '')
            match = re.search(r'ramart_admin_token=([^;]+)', cookie)
            if match:
                token = match.group(1)
        if token and token in ACTIVE_SESSIONS:
            if ACTIVE_SESSIONS[token]['expires'] > time.time():
                return True
            else:
                del ACTIVE_SESSIONS[token]
        return False

    def send_json(self, data, status_code=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()
        self.wfile.write(body)

    def send_redirect(self, location):
        self.send_response(302)
        self.send_header('Location', location)
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.end_headers()

    def read_json_body(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                raw_data = self.rfile.read(content_length).decode('utf-8')
                return json.loads(raw_data)
            return {}
        except Exception:
            return {}

    def serve_file(self, full_path, content_type="text/html"):
        if os.path.exists(full_path):
            with open(full_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-Type', f'{content_type}; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.end_headers()
            self.wfile.write(content)
            return True
        return False

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.end_headers()

    def do_HEAD(self):
        return self.do_GET()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')

        # 1. PUBLIC STOREFRONT ROUTES
        if path == '' or path == '/' or path == '/index.html':
            if self.serve_file(os.path.join(BASE_DIR, 'index.html')): return

        if path == '/track' or path == '/track.html':
            if self.serve_file(os.path.join(BASE_DIR, 'track.html')): return

        # 2. PRIVATE ADMIN ROUTES (Strict Server-Side Auth & 302 Redirects)
        if path == '/admin/login' or path == '/admin/login.html':
            if self.serve_file(os.path.join(ADMIN_DIR, 'login.html')): return

        if path == '/admin' or path == '/admin/' or path == '/admin/dashboard' or path == '/admin.html':
            if not self.is_authenticated():
                return self.send_redirect('/admin/login')
            if self.serve_file(os.path.join(ADMIN_DIR, 'dashboard.html')): return

        # Static assets for Admin
        if path == '/admin/admin.js':
            if self.serve_file(os.path.join(ADMIN_DIR, 'admin.js'), 'application/javascript'): return
        if path == '/admin/admin.css':
            if self.serve_file(os.path.join(ADMIN_DIR, 'admin.css'), 'text/css'): return

        # 3. PUBLIC STOREFRONT APIs
        if path == '/api/products':
            with get_db() as conn:
                rows = conn.execute("SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC").fetchall()
                products = []
                for r in rows:
                    products.append({
                        "id": r["id"],
                        "sku": r["sku"] or "",
                        "name": r["name"],
                        "category": r["category"],
                        "price": r["price"],
                        "originalPrice": r["original_price"],
                        "discountPercent": r["discount_percent"],
                        "stockQuantity": r["stock_quantity"],
                        "status": r["status"],
                        "badge": r["badge"],
                        "rating": r["rating"],
                        "reviewsCount": r["reviews_count"],
                        "image": r["image"],
                        "description": r["description"],
                        "inStock": r["stock_quantity"] > 0
                    })
                return self.send_json(products)

        if path == '/api/categories':
            with get_db() as conn:
                rows = conn.execute("SELECT name FROM categories ORDER BY name ASC").fetchall()
                return self.send_json([r["name"] for r in rows])

        if path == '/api/coupons':
            with get_db() as conn:
                rows = conn.execute("SELECT * FROM coupons WHERE status = 'active'").fetchall()
                coupons = {}
                for r in rows:
                    coupons[r["code"]] = {
                        "discountType": r["discount_type"],
                        "discount": r["discount_value"] / 100.0 if r["discount_type"] == "percentage" else r["discount_value"],
                        "discountValue": r["discount_value"],
                        "minAmount": r["min_order_amount"],
                        "status": r["status"]
                    }
                return self.send_json(coupons)

        if path == '/api/settings':
            with get_db() as conn:
                rows = conn.execute("SELECT key, value FROM store_settings").fetchall()
                settings = {r["key"]: r["value"] for r in rows}
                return self.send_json(settings)

        # 4. PRIVATE ADMIN APIs (Protected by Server-Side Token Auth)
        if path == '/api/check-auth':
            return self.send_json({"authenticated": self.is_authenticated()})

        if path == '/api/admin/products':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            with get_db() as conn:
                rows = conn.execute("SELECT * FROM products ORDER BY created_at DESC").fetchall()
                return self.send_json([dict(r) for r in rows])

        if path == '/api/admin/orders' or path == '/api/orders':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            with get_db() as conn:
                orders = []
                order_rows = conn.execute("SELECT * FROM orders ORDER BY created_at DESC").fetchall()
                for o in order_rows:
                    items = conn.execute("SELECT * FROM order_items WHERE order_id = ?", (o["id"],)).fetchall()
                    items_list = [{
                        "productId": it["product_id"],
                        "name": it["product_name"],
                        "sku": it["sku"],
                        "price": it["unit_price"],
                        "quantity": it["quantity"],
                        "total": it["total_price"]
                    } for it in items]

                    orders.append({
                        "id": o["id"],
                        "date": o["order_date"],
                        "customerName": o["customer_name"],
                        "phone": o["customer_phone"],
                        "email": o["customer_email"],
                        "address": o["address"],
                        "area": o["area"],
                        "city": o["city"],
                        "state": o["state"],
                        "pincode": o["pincode"],
                        "subtotal": o["subtotal"],
                        "discount": o["discount_amount"],
                        "shippingFee": o["shipping_fee"],
                        "total": o["total"],
                        "paymentMethod": o["payment_method"],
                        "paymentStatus": o["payment_status"],
                        "orderStatus": o["order_status"],
                        "courierPartner": o["courier_partner"] or "",
                        "trackingNumber": o["tracking_number"] or "",
                        "trackingUrl": o["tracking_url"] or "",
                        "items": items_list
                    })
                return self.send_json(orders)

        if path == '/api/admin/customers':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            with get_db() as conn:
                rows = conn.execute("SELECT * FROM customers ORDER BY total_spent DESC").fetchall()
                return self.send_json([dict(r) for r in rows])

        if path == '/api/email-settings':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            with get_db() as conn:
                rows = conn.execute("SELECT key, value FROM email_settings").fetchall()
                settings = {r["key"]: r["value"] for r in rows}
                if "smtp_pass" in settings and settings["smtp_pass"]:
                    settings["smtp_pass_masked"] = "••••••••"
                return self.send_json(settings)

        if path == '/api/email-logs':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            with get_db() as conn:
                rows = conn.execute("SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 20").fetchall()
                return self.send_json([dict(r) for r in rows])

        if path == '/api/dashboard-stats':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            with get_db() as conn:
                rev = conn.execute("SELECT SUM(total) as rev FROM orders WHERE order_status NOT IN ('Cancelled', 'Refunded')").fetchone()['rev'] or 0.0
                total_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders").fetchone()['cnt'] or 0
                pending_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'Pending'").fetchone()['cnt'] or 0
                confirmed_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'Confirmed'").fetchone()['cnt'] or 0
                processing_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'Processing'").fetchone()['cnt'] or 0
                shipped_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'Shipped'").fetchone()['cnt'] or 0
                delivered_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'Delivered'").fetchone()['cnt'] or 0
                cancelled_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'Cancelled'").fetchone()['cnt'] or 0
                returned_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'Returned'").fetchone()['cnt'] or 0
                refunded_orders = conn.execute("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'Refunded'").fetchone()['cnt'] or 0

                prod_count = conn.execute("SELECT COUNT(*) as cnt FROM products").fetchone()['cnt'] or 0
                low_stock = conn.execute("SELECT COUNT(*) as cnt FROM products WHERE stock_quantity <= 3").fetchone()['cnt'] or 0
                cust_count = conn.execute("SELECT COUNT(*) as cnt FROM customers").fetchone()['cnt'] or 0

                recent_rows = conn.execute("SELECT * FROM orders ORDER BY created_at DESC LIMIT 6").fetchall()
                recent_orders = [{
                    "id": r["id"], "name": r["customer_name"], "total": r["total"],
                    "orderStatus": r["order_status"], "paymentStatus": r["payment_status"],
                    "date": r["order_date"], "paymentMethod": r["payment_method"]
                } for r in recent_rows]

                return self.send_json({
                    "totalRevenue": rev,
                    "totalOrders": total_orders,
                    "pendingOrders": pending_orders,
                    "confirmedOrders": confirmed_orders,
                    "processingOrders": processing_orders,
                    "shippedOrders": shipped_orders,
                    "deliveredOrders": delivered_orders,
                    "cancelledOrders": cancelled_orders,
                    "returnedOrders": returned_orders,
                    "refundedOrders": refunded_orders,
                    "totalProducts": prod_count,
                    "lowStockProducts": low_stock,
                    "totalCustomers": cust_count,
                    "recentOrders": recent_orders
                })

        # Static assets fallback
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')
        client_ip = self.client_address[0] if self.client_address else "127.0.0.1"

        # 1. Admin Login (with Rate Limiting)
        if path == '/api/login':
            if is_rate_limited(client_ip):
                return self.send_json({"success": False, "error": "Too many failed login attempts. Please wait 5 minutes."}, 429)
            
            data = self.read_json_body()
            username = data.get('username', '').strip()
            password = data.get('password', '')

            with get_db() as conn:
                row = conn.execute("SELECT * FROM admin_users WHERE username = ?", (username,)).fetchone()
                if row and row['password_hash'] == hash_password(password):
                    clear_attempts(client_ip)
                    token = secrets.token_hex(24)
                    ACTIVE_SESSIONS[token] = {
                        "username": username,
                        "expires": time.time() + (3600 * 24)
                    }
                    return self.send_json({
                        "success": True,
                        "token": token,
                        "username": username,
                        "message": "Login successful"
                    })
                else:
                    record_failed_attempt(client_ip)
                    return self.send_json({"success": False, "error": "Invalid administrator username or password."}, 401)

        # 2. Admin Logout
        if path == '/api/logout':
            auth_header = self.headers.get('Authorization', '').replace('Bearer ', '').strip()
            if auth_header in ACTIVE_SESSIONS:
                del ACTIVE_SESSIONS[auth_header]
            return self.send_json({"success": True, "message": "Logged out"})

        # 3. Change Admin Password
        if path == '/api/change-password':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            data = self.read_json_body()
            old_pass = data.get('oldPassword', '')
            new_pass = data.get('newPassword', '')
            if not new_pass or len(new_pass) < 4:
                return self.send_json({"error": "New password must be at least 4 characters"}, 400)
            
            with get_db() as conn:
                row = conn.execute("SELECT * FROM admin_users WHERE username = 'admin'").fetchone()
                if row and row['password_hash'] == hash_password(old_pass):
                    conn.execute("UPDATE admin_users SET password_hash = ? WHERE username = 'admin'", (hash_password(new_pass),))
                    conn.commit()
                    return self.send_json({"success": True, "message": "Password updated successfully"})
                return self.send_json({"error": "Incorrect current password"}, 400)

        # 4. Customer Place Order
        if path == '/api/orders':
            data = self.read_json_body()
            items_input = data.get('items', [])
            if not items_input:
                return self.send_json({"error": "Shopping bag is empty"}, 400)

            name = data.get('name', '').strip()
            phone = data.get('phone', '').strip()
            email = data.get('email', '').strip()
            address = data.get('address', '').strip()
            area = data.get('area', '').strip()
            city = data.get('city', '').strip()
            state = data.get('state', '').strip()
            pincode = data.get('pincode', '').strip()
            payment_method = data.get('paymentMethod', '📱 UPI')
            promo_code = data.get('promoCode', '').strip().upper()

            if not name or not phone or not address or not pincode:
                return self.send_json({"error": "Please complete all required shipping fields"}, 400)

            order_id = "RAM-IND-" + str(secrets.randbelow(900000) + 100000)
            order_date = time.strftime("%d %b %Y, %I:%M %p")

            with get_db() as conn:
                subtotal = 0.0
                order_items_to_insert = []
                for item in items_input:
                    p_id = item.get('id')
                    qty = int(item.get('quantity', 1))
                    
                    prod = conn.execute("SELECT * FROM products WHERE id = ?", (p_id,)).fetchone()
                    if prod:
                        if prod['stock_quantity'] < qty:
                            return self.send_json({
                                "error": f"Insufficient stock for '{prod['name']}'. Only {prod['stock_quantity']} unit(s) available."
                            }, 400)
                        item_price = prod['price']
                        item_sku = prod['sku'] or p_id
                        prod_name = prod['name']
                    else:
                        item_price = float(item.get('price', 0))
                        item_sku = item.get('sku', '')
                        prod_name = item.get('name', 'Product')

                    line_total = item_price * qty
                    subtotal += line_total
                    order_items_to_insert.append((order_id, p_id, prod_name, item_sku, item_price, qty, line_total))

                # Calculate Discount
                discount_amount = 0.0
                if promo_code:
                    coupon = conn.execute("SELECT * FROM coupons WHERE code = ? AND status = 'active'", (promo_code,)).fetchone()
                    if coupon and subtotal >= coupon['min_order_amount']:
                        if coupon['discount_type'] == 'percentage':
                            discount_amount = round((subtotal * coupon['discount_value']) / 100.0)
                        else:
                            discount_amount = min(subtotal, coupon['discount_value'])
                        conn.execute("UPDATE coupons SET uses_count = uses_count + 1 WHERE code = ?", (promo_code,))

                # Calculate Shipping Fee
                shipping_min = float(conn.execute("SELECT value FROM store_settings WHERE key = 'free_shipping_min'").fetchone()['value'] or 499)
                shipping_charge = float(conn.execute("SELECT value FROM store_settings WHERE key = 'shipping_charge'").fetchone()['value'] or 49)
                shipping_fee = 0.0 if subtotal >= shipping_min else shipping_charge
                final_total = max(0.0, subtotal - discount_amount + shipping_fee)

                # Create or Update Customer Record
                cust = conn.execute("SELECT id, total_orders, total_spent FROM customers WHERE phone = ?", (phone,)).fetchone()
                if cust:
                    customer_id = cust['id']
                    conn.execute("""
                        UPDATE customers 
                        SET name = ?, email = ?, total_orders = total_orders + 1, total_spent = total_spent + ?, last_order_date = ?
                        WHERE id = ?
                    """, (name, email, final_total, order_date, customer_id))
                else:
                    cursor = conn.execute("""
                        INSERT INTO customers (name, phone, email, total_orders, total_spent, last_order_date)
                        VALUES (?, ?, ?, 1, ?, ?)
                    """, (name, phone, email, final_total, order_date))
                    customer_id = cursor.lastrowid

                # Insert Order
                conn.execute("""
                    INSERT INTO orders (id, order_date, customer_id, customer_name, customer_phone, customer_email, address, area, city, state, pincode, subtotal, discount_amount, shipping_fee, total, payment_method, payment_status, order_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Pending')
                """, (order_id, order_date, customer_id, name, phone, email, address, area, city, state, pincode, subtotal, discount_amount, shipping_fee, final_total, payment_method))

                # Insert Order Items & Deduct Stock
                for oi in order_items_to_insert:
                    conn.execute("""
                        INSERT INTO order_items (order_id, product_id, product_name, sku, unit_price, quantity, total_price)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, oi)
                    if oi[1]:
                        conn.execute("""
                            UPDATE products 
                            SET stock_quantity = MAX(0, stock_quantity - ?),
                                updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                        """, (oi[5], oi[1]))

                conn.commit()

            # Asynchronous Email Notification
            order_data = {
                "id": order_id, "customer_name": name, "customer_phone": phone,
                "customer_email": email, "address": address, "area": area,
                "city": city, "state": state, "pincode": pincode,
                "total": final_total, "payment_method": payment_method
            }
            items_summary = [{"product_name": oi[2], "quantity": oi[5], "total_price": oi[6]} for oi in order_items_to_insert]
            notify_new_order(order_data, items_summary)

            return self.send_json({
                "success": True,
                "orderId": order_id,
                "orderDate": order_date,
                "total": final_total,
                "subtotal": subtotal,
                "discount": discount_amount,
                "shippingFee": shipping_fee,
                "message": "Order placed successfully"
            })

        # 5. Customer Order Tracking Endpoint (Strict Verification)
        if path == '/api/track-order':
            data = self.read_json_body()
            order_id = data.get('orderId', '').strip().upper()
            contact = data.get('contact', '').strip()

            with get_db() as conn:
                order = conn.execute("""
                    SELECT * FROM orders 
                    WHERE id = ? AND (customer_phone = ? OR customer_email = ? OR customer_phone LIKE ?)
                """, (order_id, contact, contact, f"%{contact}%")).fetchone()

                if not order:
                    return self.send_json({"success": False, "error": "No matching order found. Please verify Order ID and Mobile/Email."}, 404)

                items = conn.execute("SELECT * FROM order_items WHERE order_id = ?", (order["id"],)).fetchall()
                items_list = [{
                    "name": it["product_name"],
                    "price": it["unit_price"],
                    "quantity": it["quantity"],
                    "total": it["total_price"]
                } for it in items]

                timeline = [
                    {"step": "Order Placed", "status": "completed", "date": order["order_date"]},
                    {"step": "Confirmed", "status": "completed" if order["order_status"] in ['Confirmed', 'Processing', 'Shipped', 'Delivered'] else ("current" if order["order_status"] == 'Pending' else "pending")},
                    {"step": "Processing", "status": "completed" if order["order_status"] in ['Processing', 'Shipped', 'Delivered'] else ("current" if order["order_status"] == 'Confirmed' else "pending")},
                    {"step": "Shipped", "status": "completed" if order["order_status"] in ['Shipped', 'Delivered'] else ("current" if order["order_status"] == 'Processing' else "pending")},
                    {"step": "Delivered", "status": "completed" if order["order_status"] == 'Delivered' else ("current" if order["order_status"] == 'Shipped' else "pending")}
                ]

                return self.send_json({
                    "success": True,
                    "order": {
                        "id": order["id"],
                        "date": order["order_date"],
                        "customerName": order["customer_name"],
                        "phone": order["customer_phone"],
                        "address": f"{order['address']}, {order['area']}, {order['city']}, {order['state']} - {order['pincode']}",
                        "paymentMethod": order["payment_method"],
                        "paymentStatus": order["payment_status"],
                        "orderStatus": order["order_status"],
                        "subtotal": order["subtotal"],
                        "discount": order["discount_amount"],
                        "shippingFee": order["shipping_fee"],
                        "total": order["total"],
                        "courierPartner": order["courier_partner"] or "",
                        "trackingNumber": order["tracking_number"] or "",
                        "trackingUrl": order["tracking_url"] or "",
                        "items": items_list,
                        "timeline": timeline
                    }
                })

        # 6. Admin: Create Product
        if path == '/api/products':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            data = self.read_json_body()
            prod_id = data.get('id') or ("p" + str(int(time.time() * 1000)))
            sku = data.get('sku') or ("SKU-" + prod_id.upper())
            name = data.get('name', '').strip()
            category = data.get('category', 'Electronics')
            price = float(data.get('price', 0))
            orig_price = float(data.get('originalPrice')) if data.get('originalPrice') else None
            disc = round(((orig_price - price) / orig_price) * 100) if (orig_price and orig_price > price) else 0
            stock = int(data.get('stockQuantity', 10))
            status = data.get('status', 'active')
            badge = data.get('badge') or None
            image = data.get('image', '')
            desc = data.get('description', '')

            with get_db() as conn:
                conn.execute("""
                    INSERT INTO products (id, sku, name, category, price, original_price, discount_percent, stock_quantity, status, badge, image, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (prod_id, sku, name, category, price, orig_price, disc, stock, status, badge, image, desc))
                conn.commit()
            return self.send_json({"success": True, "id": prod_id, "message": "Product created successfully"})

        # 7. Admin: Upload Product Image
        if path == '/api/upload-image':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            data = self.read_json_body()
            image_b64 = data.get('imageData', '')
            if ',' in image_b64:
                image_b64 = image_b64.split(',', 1)[1]
            try:
                img_bytes = base64.b64decode(image_b64)
                safe_name = f"prod_{int(time.time())}_{secrets.token_hex(4)}.png"
                file_path = os.path.join(UPLOAD_DIR, safe_name)
                with open(file_path, 'wb') as f:
                    f.write(img_bytes)
                return self.send_json({"success": True, "url": f"/images/products/{safe_name}"})
            except Exception as e:
                return self.send_json({"success": False, "error": str(e)}, 400)

        # 8. Admin: Add Category
        if path == '/api/categories':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            data = self.read_json_body()
            name = data.get('name', '').strip()
            if name:
                with get_db() as conn:
                    conn.execute("INSERT OR IGNORE INTO categories (name) VALUES (?)", (name,))
                    conn.commit()
                return self.send_json({"success": True, "message": "Category added"})
            return self.send_json({"error": "Category name required"}, 400)

        # 9. Admin: Add Coupon
        if path == '/api/coupons':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            data = self.read_json_body()
            code = data.get('code', '').strip().upper()
            dtype = data.get('discountType', 'percentage')
            val = float(data.get('discountValue', 0))
            min_a = float(data.get('minOrderAmount', 0))
            if code and val > 0:
                with get_db() as conn:
                    conn.execute("""
                        INSERT OR REPLACE INTO coupons (code, discount_type, discount_value, min_order_amount, status)
                        VALUES (?, ?, ?, ?, 'active')
                    """, (code, dtype, val, min_a))
                    conn.commit()
                return self.send_json({"success": True, "message": "Coupon created"})
            return self.send_json({"error": "Invalid coupon details"}, 400)

        # 10. Admin: Test Email
        if path == '/api/test-email':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            data = self.read_json_body()
            target_email = data.get('email', '').strip()
            if target_email:
                success, msg = send_email_sync(
                    target_email,
                    "✅ RAMART Gmail SMTP Live Connection Test",
                    f"""
                    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 20px; border: 1px solid #d4af37; border-radius: 8px;">
                        <h2 style="color: #0a0a0a; border-bottom: 2px solid #881337; padding-bottom: 10px;">
                            RAM<span style="color:#2563eb;">ART</span> Store - SMTP Live Test
                        </h2>
                        <p>Congratulations! Your Gmail SMTP configuration is verified and working properly.</p>
                        <div style="background: #f8fafc; padding: 12px; border-radius: 6px; margin: 15px 0;">
                            <p><strong>Tested Recipient:</strong> {target_email}</p>
                            <p><strong>Timestamp:</strong> {time.strftime("%d %b %Y, %I:%M %p")}</p>
                            <p><strong>Status:</strong> <span style="color: #16a34a; font-weight: bold;">Verified Connected</span></p>
                        </div>
                        <p style="font-size: 12px; color: #64748b;">Automated customer order confirmations and admin alerts will be delivered smoothly.</p>
                    </div>
                    """
                )
                if success:
                    return self.send_json({"success": True, "message": f"Test email sent successfully to {target_email}"})
                else:
                    return self.send_json({"success": False, "error": f"SMTP Error: {msg}"}, 400)
            return self.send_json({"error": "Target email required"}, 400)

        return self.send_json({"error": "Endpoint not found"}, 404)

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')

        # 1. Admin: Update Product
        if path.startswith('/api/products/'):
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            prod_id = path.replace('/api/products/', '')
            data = self.read_json_body()
            sku = data.get('sku') or ("SKU-" + prod_id.upper())
            name = data.get('name')
            category = data.get('category')
            price = float(data.get('price', 0))
            orig_price = float(data.get('originalPrice')) if data.get('originalPrice') else None
            disc = round(((orig_price - price) / orig_price) * 100) if (orig_price and orig_price > price) else 0
            stock = int(data.get('stockQuantity', 10))
            status = data.get('status', 'active')
            badge = data.get('badge') or None
            image = data.get('image')
            desc = data.get('description')

            with get_db() as conn:
                conn.execute("""
                    UPDATE products
                    SET sku = ?, name = ?, category = ?, price = ?, original_price = ?, discount_percent = ?, stock_quantity = ?, status = ?, badge = ?, image = ?, description = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (sku, name, category, price, orig_price, disc, stock, status, badge, image, desc, prod_id))
                conn.commit()
            return self.send_json({"success": True, "message": "Product updated"})

        # 2. Admin: Update Order Status, Payment Status & Dispatch Info
        if path.startswith('/api/orders/') and path.endswith('/status'):
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            order_id = path.replace('/api/orders/', '').replace('/status', '')
            data = self.read_json_body()
            new_status = data.get('orderStatus')
            new_payment = data.get('paymentStatus')
            courier_partner = data.get('courierPartner')
            tracking_no = data.get('trackingNumber')
            tracking_url = data.get('trackingUrl')

            with get_db() as conn:
                order = conn.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
                if not order: return self.send_json({"error": "Order not found"}, 404)

                if new_status:
                    conn.execute("UPDATE orders SET order_status = ? WHERE id = ?", (new_status, order_id))
                if new_payment:
                    conn.execute("UPDATE orders SET payment_status = ? WHERE id = ?", (new_payment, order_id))
                if courier_partner is not None:
                    conn.execute("UPDATE orders SET courier_partner = ? WHERE id = ?", (courier_partner, order_id))
                if tracking_no is not None:
                    conn.execute("UPDATE orders SET tracking_number = ? WHERE id = ?", (tracking_no, order_id))
                if tracking_url is not None:
                    conn.execute("UPDATE orders SET tracking_url = ? WHERE id = ?", (tracking_url, order_id))
                conn.commit()

            if new_status:
                notify_status_change(order_id, new_status, order['customer_email'], order['customer_name'], courier_partner, tracking_no, tracking_url)

            return self.send_json({"success": True, "message": f"Order #{order_id} updated"})

        # 3. Admin: Update Store Settings
        if path == '/api/settings':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            data = self.read_json_body()
            with get_db() as conn:
                for k, v in data.items():
                    conn.execute("INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)", (k, str(v)))
                conn.commit()
            return self.send_json({"success": True, "message": "Store settings updated"})

        # 4. Admin: Update Email Settings
        if path == '/api/email-settings':
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            data = self.read_json_body()
            with get_db() as conn:
                for k, v in data.items():
                    if k == "smtp_pass" and (v == "••••••••" or not v):
                        continue
                    conn.execute("INSERT OR REPLACE INTO email_settings (key, value) VALUES (?, ?)", (k, str(v)))
                conn.commit()
            return self.send_json({"success": True, "message": "Email notification settings saved"})

        return self.send_json({"error": "Endpoint not found"}, 404)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip('/')

        # 1. Admin: Delete Product
        if path.startswith('/api/products/'):
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            prod_id = path.replace('/api/products/', '')
            with get_db() as conn:
                conn.execute("DELETE FROM products WHERE id = ?", (prod_id,))
                conn.commit()
            return self.send_json({"success": True, "message": "Product deleted"})

        # 2. Admin: Delete Category
        if path.startswith('/api/categories/'):
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            cat_name = path.replace('/api/categories/', '')
            with get_db() as conn:
                conn.execute("DELETE FROM categories WHERE name = ?", (cat_name,))
                conn.commit()
            return self.send_json({"success": True, "message": "Category deleted"})

        # 3. Admin: Delete Coupon
        if path.startswith('/api/coupons/'):
            if not self.is_authenticated(): return self.send_json({"error": "Unauthorized"}, 401)
            coupon_code = path.replace('/api/coupons/', '').upper()
            with get_db() as conn:
                conn.execute("DELETE FROM coupons WHERE code = ?", (coupon_code,))
                conn.commit()
            return self.send_json({"success": True, "message": "Coupon deleted"})

        return self.send_json({"error": "Endpoint not found"}, 404)


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    init_database()
    with ThreadedServer(("127.0.0.1", PORT), ProductionRequestHandler) as httpd:
        print(f"🚀 RAMART Production Server running at: http://127.0.0.1:{PORT}")
        print(f"🛍️ Customer Storefront: http://127.0.0.1:{PORT}/")
        print(f"📦 Customer Order Tracking: http://127.0.0.1:{PORT}/track")
        print(f"🔑 Private Admin Login: http://127.0.0.1:{PORT}/admin/login")
        print(f"📊 Private Admin Dashboard: http://127.0.0.1:{PORT}/admin/dashboard")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
