// RAMART Production Admin Engine (Zero Fake Data)

const API_BASE = "";
let adminToken = localStorage.getItem("ramart_admin_token") || "";

// State
let currentProducts = [];
let currentCategories = [];
let currentOrders = [];
let currentCustomers = [];
let currentCoupons = {};
let currentSettings = {};

// Helper: Authenticated fetch wrapper
async function apiFetch(endpoint, options = {}) {
  const headers = options.headers || {};
  if (adminToken) {
    headers["Authorization"] = `Bearer ${adminToken}`;
  }
  if (!(options.body instanceof FormData) && options.body && typeof options.body === "object") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }
  options.headers = headers;

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, options);
    if (res.status === 401) {
      adminToken = "";
      localStorage.removeItem("ramart_admin_token");
      showLoginView();
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("API error:", err);
    showWpToast("API connection error: " + err.message, "danger");
    return null;
  }
}

// Currency Formatter
function formatINR(amount) {
  const num = Math.round(Number(amount || 0));
  return "₹" + num.toLocaleString('en-IN');
}

// Init App
document.addEventListener("DOMContentLoaded", async () => {
  setupAdminNavigation();
  checkAuthAndInit();
});

// Check Authentication
async function checkAuthAndInit() {
  if (!adminToken) {
    showLoginView();
    return;
  }

  const check = await apiFetch("/api/check-auth");
  if (check && check.authenticated) {
    showAppView();
    await loadAllAdminData();
  } else {
    showLoginView();
  }
}

function showLoginView() {
  document.getElementById("wpLoginView").style.display = "flex";
  document.getElementById("wpAppView").style.display = "none";
}

function showAppView() {
  document.getElementById("wpLoginView").style.display = "none";
  document.getElementById("wpAppView").style.display = "block";
  document.getElementById("displayAdminUser").textContent = localStorage.getItem("ramart_admin_user") || "admin";
}

// Admin Login Handler
async function handleAdminLogin(e) {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const errorMsg = document.getElementById("loginErrorMsg");
  const submitBtn = document.getElementById("loginSubmitBtn");

  errorMsg.style.display = "none";
  submitBtn.disabled = true;
  submitBtn.textContent = "Authenticating...";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      adminToken = data.token;
      localStorage.setItem("ramart_admin_token", data.token);
      localStorage.setItem("ramart_admin_user", data.username);
      showAppView();
      await loadAllAdminData();
      showWpToast("Welcome back, Administrator!", "success");
    } else {
      errorMsg.textContent = data.error || "Invalid username or password.";
      errorMsg.style.display = "block";
    }
  } catch (err) {
    errorMsg.textContent = "Server error during login: " + err.message;
    errorMsg.style.display = "block";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Log In to Admin Panel";
  }
}

// Admin Logout Handler
async function handleAdminLogout() {
  if (confirm("Are you sure you want to log out from RAMART Admin?")) {
    await apiFetch("/api/logout", { method: "POST" });
    adminToken = "";
    localStorage.removeItem("ramart_admin_token");
    localStorage.removeItem("ramart_admin_user");
    showLoginView();
    showWpToast("Logged out successfully.", "info");
  }
}

// Load All Backend Data
async function loadAllAdminData() {
  await Promise.all([
    loadDashboardStats(),
    loadCategories(),
    loadProducts(),
    loadOrders(),
    loadCustomers(),
    loadCoupons(),
    loadSettings(),
    loadEmailSettings()
  ]);
}

// Tab Navigation
function setupAdminNavigation() {
  const navItems = document.querySelectorAll(".wp-nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetTab = item.dataset.tab;
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".wp-nav-item").forEach(i => i.classList.remove("active"));
  document.querySelectorAll(".wp-tab-content").forEach(c => c.classList.remove("active"));

  const targetBtn = document.querySelector(`.wp-nav-item[data-tab="${tabId}"]`);
  const targetContent = document.getElementById(`tab-${tabId}`);

  if (targetBtn && targetContent) {
    targetBtn.classList.add("active");
    targetContent.classList.add("active");
  }
}

// 1. Dashboard Stats (Real Database Figures Only)
async function loadDashboardStats() {
  const stats = await apiFetch("/api/dashboard-stats");
  if (!stats) return;

  document.getElementById("statRevenue").textContent = formatINR(stats.totalRevenue);
  document.getElementById("statOrders").textContent = stats.totalOrders;
  document.getElementById("statPendingOrders").textContent = `${stats.pendingOrders} Pending Fulfillment`;
  document.getElementById("statProducts").textContent = stats.totalProducts;
  document.getElementById("statLowStock").textContent = `${stats.lowStockProducts} Low-stock alerts`;
  document.getElementById("statCustomers").textContent = stats.totalCustomers;

  // Breakdown Numbers
  document.getElementById("breakdownPending").textContent = stats.pendingOrders;
  document.getElementById("breakdownConfirmed").textContent = stats.confirmedOrders;
  document.getElementById("breakdownShipped").textContent = stats.shippedOrders;
  document.getElementById("breakdownDelivered").textContent = stats.deliveredOrders;
  document.getElementById("breakdownCancelled").textContent = stats.cancelledOrders;
  document.getElementById("breakdownRefunded").textContent = (stats.returnedOrders || 0) + (stats.refundedOrders || 0);

  const recentEl = document.getElementById("dashboardRecentOrders");
  if (!stats.recentOrders || stats.recentOrders.length === 0) {
    recentEl.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--wp-text-muted);">
        <p style="font-size: 28px; margin-bottom: 0.5rem;">📦</p>
        <strong style="font-size: 14px; color: #1e293b; display: block; margin-bottom: 0.25rem;">No customer orders yet</strong>
        <p style="font-size: 12px;">Orders placed on the storefront will appear here live with instant alerts.</p>
      </div>
    `;
    return;
  }

  recentEl.innerHTML = `
    <table class="wp-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${stats.recentOrders.map(o => `
          <tr>
            <td><strong>${o.id}</strong></td>
            <td>${escapeHtml(o.name)}</td>
            <td><strong>${formatINR(o.total)}</strong></td>
            <td><span class="status-badge status-${(o.orderStatus || 'pending').toLowerCase()}">${o.orderStatus || 'Pending'}</span></td>
            <td><button class="wp-btn wp-btn-secondary wp-btn-sm" onclick="viewOrderInvoice('${o.id}')">View</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// 2. Categories
async function loadCategories() {
  const cats = await apiFetch("/api/categories");
  if (!cats) return;
  currentCategories = cats;

  const tbody = document.getElementById("categoriesTableBody");
  tbody.innerHTML = currentCategories.map(cat => {
    const count = currentProducts.filter(p => p.category === cat).length;
    return `
      <tr>
        <td><strong>${escapeHtml(cat)}</strong></td>
        <td><span class="wp-pill wp-pill-new">${count} product(s)</span></td>
        <td>
          <button class="wp-btn wp-btn-danger wp-btn-sm" onclick="deleteCategory('${escapeHtml(cat)}')">Delete</button>
        </td>
      </tr>
    `;
  }).join("");

  const filterSelect = document.getElementById("productCategoryFilter");
  const modalSelect = document.getElementById("prodCategory");

  filterSelect.innerHTML = `<option value="all">All Categories</option>` + currentCategories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  modalSelect.innerHTML = currentCategories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

  document.getElementById("sidebarCategoryCount").textContent = currentCategories.length;
}

function openAddCategoryModal() {
  document.getElementById("categoryForm").reset();
  document.getElementById("categoryModal").classList.add("open");
}

function closeCategoryModal() {
  document.getElementById("categoryModal").classList.remove("open");
}

async function handleCategoryFormSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("newCategoryName").value.trim();
  if (!name) return;

  const res = await apiFetch("/api/categories", {
    method: "POST",
    body: { name }
  });
  if (res && res.success) {
    closeCategoryModal();
    await loadCategories();
    showWpToast(`Category "${name}" added.`, "success");
  }
}

async function deleteCategory(name) {
  if (confirm(`Delete category "${name}"?`)) {
    const res = await apiFetch(`/api/categories/${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res && res.success) {
      await loadCategories();
      showWpToast(`Category "${name}" deleted.`, "info");
    }
  }
}

// 3. Products
async function loadProducts() {
  const prods = await apiFetch("/api/admin/products");
  if (!prods) return;
  currentProducts = prods;
  renderProductsTable();
  document.getElementById("sidebarProductCount").textContent = currentProducts.length;
}

function renderProductsTable() {
  const tbody = document.getElementById("productsTableBody");
  const query = (document.getElementById("productSearchInput")?.value || "").toLowerCase().trim();
  const catFilter = document.getElementById("productCategoryFilter")?.value || "all";

  let filtered = currentProducts.filter(p => {
    const matchesCat = (catFilter === "all" || p.category === catFilter);
    const matchesSearch = !query || p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query)) || p.category.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--wp-text-muted);">
          No products in catalog. Click "+ Add New Product" to create your first real product.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const discount = (p.original_price && p.original_price > p.price) ? Math.round(((p.original_price - p.price) / p.original_price) * 100) : 0;
    return `
      <tr>
        <td>
          <img src="${p.image}" class="table-thumbnail" alt="${escapeHtml(p.name)}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'48\\' height=\\'48\\' fill=\\'%23e2e8f0\\'><rect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23cbd5e1\\'/></svg>'">
        </td>
        <td>
          <div class="product-cell-title">${escapeHtml(p.name)}</div>
          <div class="product-cell-id">SKU: ${escapeHtml(p.sku || p.id)}</div>
        </td>
        <td>${escapeHtml(p.category)}</td>
        <td><strong>${formatINR(p.price)}</strong></td>
        <td>${p.original_price ? `<span style="text-decoration: line-through; color: #94a3b8;">${formatINR(p.original_price)}</span>` : '-'}</td>
        <td>${discount > 0 ? `<span style="color: #16a34a; font-weight:700;">${discount}% OFF</span>` : '-'}</td>
        <td>
          <strong style="${p.stock_quantity <= 3 ? 'color:#dc2626;' : 'color:#15803d;'}">
            ${p.stock_quantity} units
          </strong>
        </td>
        <td>
          <span class="wp-pill ${p.status === 'active' ? 'wp-pill-new' : 'wp-pill-sale'}">
            ${p.status === 'active' ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button class="wp-btn wp-btn-secondary wp-btn-sm" onclick="openEditProductModal('${p.id}')">Edit</button>
            <button class="wp-btn wp-btn-danger wp-btn-sm" onclick="deleteProduct('${p.id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function filterProductsTable() {
  renderProductsTable();
}

function openAddProductModal() {
  document.getElementById("productModalTitle").textContent = "Add Real Product";
  document.getElementById("editProductId").value = "";
  document.getElementById("productForm").reset();
  document.getElementById("imagePreviewContainer").style.display = "none";
  document.getElementById("prodDiscountHelper").value = "0% OFF";
  document.getElementById("productModal").classList.add("open");
}

function openEditProductModal(productId) {
  const p = currentProducts.find(prod => prod.id === productId);
  if (!p) return;

  document.getElementById("productModalTitle").textContent = "Edit Product: " + p.name;
  document.getElementById("editProductId").value = p.id;
  document.getElementById("prodTitle").value = p.name;
  document.getElementById("prodSku").value = p.sku || "";
  document.getElementById("prodCategory").value = p.category;
  document.getElementById("prodBadge").value = p.badge || "";
  document.getElementById("prodPrice").value = p.price;
  document.getElementById("prodOrigPrice").value = p.original_price || "";
  document.getElementById("prodStock").value = p.stock_quantity;
  document.getElementById("prodStatus").value = p.status || "active";
  document.getElementById("prodImage").value = p.image;
  document.getElementById("prodDesc").value = p.description;

  calculateDiscountHelper();
  previewProductImage(p.image);
  document.getElementById("productModal").classList.add("open");
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
}

function calculateDiscountHelper() {
  const price = parseFloat(document.getElementById("prodPrice").value) || 0;
  const mrp = parseFloat(document.getElementById("prodOrigPrice").value) || 0;
  const helper = document.getElementById("prodDiscountHelper");

  if (mrp > price && price > 0) {
    const disc = Math.round(((mrp - price) / mrp) * 100);
    helper.value = `${disc}% OFF`;
  } else {
    helper.value = "0% OFF";
  }
}

function previewProductImage(url) {
  const container = document.getElementById("imagePreviewContainer");
  const img = document.getElementById("imagePreviewEl");
  if (url && url.trim().length > 0) {
    img.src = url;
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
}

function removeProductImage() {
  document.getElementById("prodImage").value = "";
  document.getElementById("imagePreviewContainer").style.display = "none";
}

function handleImageFileUpload(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const progress = document.getElementById("imageUploadProgress");
  progress.style.display = "block";

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64Data = e.target.result;
    const res = await apiFetch("/api/upload-image", {
      method: "POST",
      body: {
        imageData: base64Data,
        filename: file.name
      }
    });
    progress.style.display = "none";
    if (res && res.success) {
      document.getElementById("prodImage").value = res.url;
      previewProductImage(res.url);
      showWpToast("Product image uploaded successfully!", "success");
    } else {
      showWpToast("Image upload failed.", "danger");
    }
  };
  reader.readAsDataURL(file);
}

async function handleProductFormSubmit(e) {
  e.preventDefault();

  const editId = document.getElementById("editProductId").value;
  const name = document.getElementById("prodTitle").value.trim();
  const sku = document.getElementById("prodSku").value.trim();
  const category = document.getElementById("prodCategory").value;
  const badge = document.getElementById("prodBadge").value || null;
  const price = parseFloat(document.getElementById("prodPrice").value);
  const origPriceVal = document.getElementById("prodOrigPrice").value;
  const originalPrice = origPriceVal ? parseFloat(origPriceVal) : null;
  const stockQuantity = parseInt(document.getElementById("prodStock").value) || 0;
  const status = document.getElementById("prodStatus").value;
  const image = document.getElementById("prodImage").value.trim();
  const description = document.getElementById("prodDesc").value.trim();

  if (!image) {
    showWpToast("Please provide a product image URL or upload an image file.", "danger");
    return;
  }

  const payload = {
    name, sku, category, badge, price, originalPrice, stockQuantity, status, image, description
  };

  let res;
  if (editId) {
    res = await apiFetch(`/api/products/${editId}`, { method: "PUT", body: payload });
  } else {
    res = await apiFetch("/api/products", { method: "POST", body: payload });
  }

  if (res && res.success) {
    closeProductModal();
    await loadProducts();
    await loadDashboardStats();
    showWpToast(editId ? "Product updated successfully!" : "New product published to storefront!", "success");
  }
}

async function deleteProduct(productId) {
  if (confirm("Are you sure you want to delete this product from the database?")) {
    const res = await apiFetch(`/api/products/${productId}`, { method: "DELETE" });
    if (res && res.success) {
      await loadProducts();
      await loadDashboardStats();
      showWpToast("Product removed from catalog.", "info");
    }
  }
}

// 4. Orders
async function loadOrders() {
  const ords = await apiFetch("/api/admin/orders");
  if (!ords) return;
  currentOrders = ords;
  renderOrdersTable();
  document.getElementById("sidebarOrderCount").textContent = currentOrders.length;
}

function renderOrdersTable() {
  const tbody = document.getElementById("ordersTableBody");
  const filter = document.getElementById("orderStatusFilter")?.value || "all";

  let filtered = currentOrders;
  if (filter !== "all") {
    filtered = currentOrders.filter(o => o.orderStatus === filter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--wp-text-muted);">
          No customer orders found in the database.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td><strong>${o.id}</strong></td>
      <td>${o.date}</td>
      <td>
        <strong>${escapeHtml(o.customerName)}</strong>
        <div style="font-size: 11px; color: #64748b;">+91 ${escapeHtml(o.phone)}</div>
      </td>
      <td>
        <div>${escapeHtml(o.address)}, ${escapeHtml(o.area || '')}</div>
        <div style="font-size: 11px; color: #64748b;">${escapeHtml(o.city)}, ${escapeHtml(o.state)} - ${escapeHtml(o.pincode)}</div>
      </td>
      <td><span class="wp-pill wp-pill-new">${(o.items || []).length} item(s)</span></td>
      <td><strong>${formatINR(o.total)}</strong></td>
      <td>
        <select class="wp-select" style="padding: 0.2rem 0.4rem; font-size: 11px;" onchange="updatePaymentStatus('${o.id}', this.value)">
          <option value="Pending" ${o.paymentStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Paid" ${o.paymentStatus === 'Paid' ? 'selected' : ''}>Paid</option>
          <option value="Failed" ${o.paymentStatus === 'Failed' ? 'selected' : ''}>Failed</option>
          <option value="Refunded" ${o.paymentStatus === 'Refunded' ? 'selected' : ''}>Refunded</option>
        </select>
      </td>
      <td>
        <select class="wp-select" style="padding: 0.2rem 0.4rem; font-size: 11px; font-weight: 700;" onchange="updateOrderStatus('${o.id}', this.value)">
          <option value="Pending" ${o.orderStatus === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Confirmed" ${o.orderStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
          <option value="Processing" ${o.orderStatus === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${o.orderStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${o.orderStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${o.orderStatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
          <option value="Returned" ${o.orderStatus === 'Returned' ? 'selected' : ''}>Returned</option>
          <option value="Refunded" ${o.orderStatus === 'Refunded' ? 'selected' : ''}>Refunded</option>
        </select>
      </td>
      <td>
        <button class="wp-btn wp-btn-secondary wp-btn-sm" onclick="viewOrderInvoice('${o.id}')">Invoice</button>
      </td>
    </tr>
  `).join("");
}

function filterOrdersTable() {
  renderOrdersTable();
}

async function updateOrderStatus(orderId, newStatus) {
  let trackingNumber = null;
  if (newStatus === "Shipped") {
    trackingNumber = prompt("Enter Courier Tracking / AWB Number (Optional):", "");
  }

  const res = await apiFetch(`/api/orders/${orderId}/status`, {
    method: "PUT",
    body: { orderStatus: newStatus, trackingNumber }
  });

  if (res && res.success) {
    await loadOrders();
    await loadDashboardStats();
    showWpToast(`Order #${orderId} marked as ${newStatus}. Customer notification sent.`, "success");
  }
}

async function updatePaymentStatus(orderId, newPaymentStatus) {
  const res = await apiFetch(`/api/orders/${orderId}/status`, {
    method: "PUT",
    body: { paymentStatus: newPaymentStatus }
  });

  if (res && res.success) {
    await loadOrders();
    showWpToast(`Payment status updated to ${newPaymentStatus}.`, "success");
  }
}

function viewOrderInvoice(orderId) {
  const order = currentOrders.find(o => o.id === orderId);
  if (!order) return;

  const modalBody = document.getElementById("invoiceModalBody");
  const gstin = currentSettings.gstin || "29AABCR8901M1Z5";
  const items = order.items || [];
  const taxableAmount = Math.round(order.total / 1.18);
  const gstAmount = Math.round(order.total - taxableAmount);
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;

  modalBody.innerHTML = `
    <div class="wp-invoice-box">
      <div class="wp-invoice-row" style="border-bottom: 2px solid #cbd5e1; padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
        <div>
          <strong style="font-size: 16px; color: #1e293b;">RAMART TAX INVOICE & RECEIPT</strong>
          <div style="font-size: 11px; color: #64748b;">RAMART Online Retail India Pvt Ltd</div>
        </div>
        <span class="gstin-badge">GSTIN: ${gstin}</span>
      </div>
      <div class="wp-invoice-row"><strong>Order ID:</strong> <span>${order.id}</span></div>
      <div class="wp-invoice-row"><strong>Invoice Date:</strong> <span>${order.date}</span></div>
      <div class="wp-invoice-row"><strong>Customer Name:</strong> <span>${escapeHtml(order.customerName)}</span></div>
      <div class="wp-invoice-row"><strong>Mobile / Email:</strong> <span>+91 ${escapeHtml(order.phone)} (${escapeHtml(order.email || 'N/A')})</span></div>
      <div class="wp-invoice-row"><strong>Shipping Address:</strong> <span>${escapeHtml(order.address)}, ${escapeHtml(order.area || '')}, ${escapeHtml(order.city)}, ${escapeHtml(order.state)} - ${escapeHtml(order.pincode)}</span></div>
      <div class="wp-invoice-row"><strong>Payment Method:</strong> <span>${order.paymentMethod} (${order.paymentStatus})</span></div>
      <div class="wp-invoice-row"><strong>Order Status:</strong> <span><strong style="color: #0369a1;">${order.orderStatus}</strong></span></div>
      ${order.trackingNumber ? `<div class="wp-invoice-row" style="color:#0284c7;"><strong>Tracking Number:</strong> <span>${order.trackingNumber}</span></div>` : ''}

      <div style="margin: 0.75rem 0; border-top: 1px solid #e2e8f0; padding-top: 0.75rem;">
        <strong style="display: block; margin-bottom: 0.35rem; font-size: 12px;">Ordered Products:</strong>
        <table class="wp-table" style="font-size: 12px;">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => `
              <tr>
                <td>${escapeHtml(it.name)}</td>
                <td>${it.quantity}</td>
                <td>${formatINR(it.price)}</td>
                <td><strong>${formatINR(it.total)}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="wp-invoice-row" style="font-size: 12px; color: #64748b;">
        <span>Taxable Net Amount:</span> <span>${formatINR(taxableAmount)}</span>
      </div>
      <div class="wp-invoice-row" style="font-size: 12px; color: #64748b;">
        <span>CGST (9%) + SGST (9%):</span> <span>${formatINR(cgst)} + ${formatINR(sgst)} = ${formatINR(gstAmount)}</span>
      </div>

      <div class="wp-invoice-row" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 2px solid #cbd5e1; font-size: 16px; font-weight: 800; color: var(--wp-blue);">
        <span>Final Total Paid:</span> <span>${formatINR(order.total)}</span>
      </div>
    </div>
  `;

  document.getElementById("invoiceModal").classList.add("open");
}

function closeInvoiceModal() {
  document.getElementById("invoiceModal").classList.remove("open");
}

// 5. Customers Directory
async function loadCustomers() {
  const custs = await apiFetch("/api/admin/customers");
  if (!custs) return;
  currentCustomers = custs;

  const tbody = document.getElementById("customersTableBody");
  if (currentCustomers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color: #64748b;">No registered customers yet. Customer profiles will be built automatically when real orders are placed.</td></tr>`;
    return;
  }

  tbody.innerHTML = currentCustomers.map(c => `
    <tr>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>+91 ${escapeHtml(c.phone)}</td>
      <td>${escapeHtml(c.email || 'N/A')}</td>
      <td><span class="wp-pill wp-pill-new">${c.total_orders} order(s)</span></td>
      <td><strong>${formatINR(c.total_spent)}</strong></td>
      <td>${c.last_order_date || '-'}</td>
    </tr>
  `).join("");

  document.getElementById("sidebarCustomerCount").textContent = currentCustomers.length;
}

// 6. Coupons
async function loadCoupons() {
  const coups = await apiFetch("/api/coupons");
  if (!coups) return;
  currentCoupons = coups;

  const tbody = document.getElementById("couponsTableBody");
  const codes = Object.keys(currentCoupons);

  if (codes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem;">No coupons configured.</td></tr>`;
    return;
  }

  tbody.innerHTML = codes.map(code => {
    const c = currentCoupons[code];
    const discLabel = c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT OFF`;
    return `
      <tr>
        <td><strong>${code}</strong></td>
        <td>${discLabel}</td>
        <td>${c.minAmount ? formatINR(c.minAmount) : 'No Minimum'}</td>
        <td>${c.usesCount || 0}</td>
        <td><span class="status-badge status-delivered">Active</span></td>
        <td>
          <button class="wp-btn wp-btn-danger wp-btn-sm" onclick="deleteCoupon('${code}')">Delete</button>
        </td>
      </tr>
    `;
  }).join("");
}

function openAddCouponModal() {
  document.getElementById("couponForm").reset();
  document.getElementById("couponModal").classList.add("open");
}

function closeCouponModal() {
  document.getElementById("couponModal").classList.remove("open");
}

async function handleCouponFormSubmit(e) {
  e.preventDefault();
  const code = document.getElementById("couponCode").value.trim().toUpperCase();
  const discountValue = parseFloat(document.getElementById("couponDiscount").value);
  const minOrderAmount = parseFloat(document.getElementById("couponMinAmount").value) || 0;

  const res = await apiFetch("/api/coupons", {
    method: "POST",
    body: { code, discountType: 'percentage', discountValue, minOrderAmount }
  });

  if (res && res.success) {
    closeCouponModal();
    await loadCoupons();
    showWpToast(`Coupon "${code}" published.`, "success");
  }
}

async function deleteCoupon(code) {
  if (confirm(`Delete coupon "${code}"?`)) {
    const res = await apiFetch(`/api/coupons/${code}`, { method: "DELETE" });
    if (res && res.success) {
      await loadCoupons();
      showWpToast(`Coupon "${code}" deleted.`, "info");
    }
  }
}

// 7. Store Settings
async function loadSettings() {
  const sets = await apiFetch("/api/settings");
  if (!sets) return;
  currentSettings = sets;

  document.getElementById("settingStoreName").value = sets.store_name || "RAMART";
  document.getElementById("settingStoreTagline").value = sets.tagline || "India's Favorite Online Shopping Store";
  document.getElementById("settingAnnouncement").value = sets.announcement || "";
  document.getElementById("settingGSTIN").value = sets.gstin || "29AABCR8901M1Z5";
  document.getElementById("settingFreeShipping").value = sets.free_shipping_min || "499";
  document.getElementById("settingShippingCharge").value = sets.shipping_charge || "49";
  document.getElementById("settingSupportPhone").value = sets.support_phone || "+91 98765 43210";
  document.getElementById("settingSupportEmail").value = sets.support_email || "support@ramart.in";
}

async function saveStoreSettings(e) {
  e.preventDefault();
  const payload = {
    store_name: document.getElementById("settingStoreName").value,
    tagline: document.getElementById("settingStoreTagline").value,
    announcement: document.getElementById("settingAnnouncement").value,
    gstin: document.getElementById("settingGSTIN").value,
    free_shipping_min: document.getElementById("settingFreeShipping").value,
    shipping_charge: document.getElementById("settingShippingCharge").value,
    support_phone: document.getElementById("settingSupportPhone").value,
    support_email: document.getElementById("settingSupportEmail").value
  };

  const res = await apiFetch("/api/settings", { method: "PUT", body: payload });
  if (res && res.success) {
    currentSettings = payload;
    showWpToast("Store branding and policies saved to SQLite database!", "success");
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();
  const oldPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const btn = document.getElementById("updatePasswordBtn");

  btn.disabled = true;
  btn.textContent = "Updating...";

  const res = await apiFetch("/api/change-password", {
    method: "POST",
    body: { oldPassword, newPassword }
  });

  btn.disabled = false;
  btn.textContent = "Update Password";

  if (res && res.success) {
    document.getElementById("adminPasswordForm").reset();
    showWpToast("Admin password updated successfully!", "success");
  } else {
    showWpToast(res?.error || "Password update failed.", "danger");
  }
}

// 8. Email & Notification Settings
async function loadEmailSettings() {
  const sets = await apiFetch("/api/email-settings");
  if (!sets) return;

  document.getElementById("emailEnabled").checked = sets.enabled === "true";
  document.getElementById("storeOwnerEmail").value = sets.store_owner_email || "";
  document.getElementById("smtpHost").value = sets.smtp_host || "smtp.gmail.com";
  document.getElementById("smtpPort").value = sets.smtp_port || "587";
  document.getElementById("smtpUser").value = sets.smtp_user || "";
  document.getElementById("smtpPass").value = sets.smtp_pass_masked || "";
  document.getElementById("smtpFrom").value = sets.smtp_from || "RAMART Store <noreply@ramart.in>";
  document.getElementById("smtpSecure").value = sets.smtp_secure || "tls";
}

async function saveEmailSettings(e) {
  e.preventDefault();
  const payload = {
    enabled: document.getElementById("emailEnabled").checked ? "true" : "false",
    store_owner_email: document.getElementById("storeOwnerEmail").value.trim(),
    smtp_host: document.getElementById("smtpHost").value.trim(),
    smtp_port: document.getElementById("smtpPort").value.trim(),
    smtp_user: document.getElementById("smtpUser").value.trim(),
    smtp_pass: document.getElementById("smtpPass").value.trim(),
    smtp_from: document.getElementById("smtpFrom").value.trim(),
    smtp_secure: document.getElementById("smtpSecure").value
  };

  const res = await apiFetch("/api/email-settings", { method: "PUT", body: payload });
  if (res && res.success) {
    showWpToast("Email and notification preferences saved!", "success");
  }
}

async function triggerTestEmail() {
  const targetEmail = prompt("Enter email address to send test message to:", document.getElementById("storeOwnerEmail").value);
  if (!targetEmail) return;

  const res = await apiFetch("/api/test-email", {
    method: "POST",
    body: { email: targetEmail }
  });

  if (res && res.success) {
    showWpToast(`Test email queued for ${targetEmail}.`, "success");
  } else {
    showWpToast(res?.error || "Test email failed.", "danger");
  }
}

// Toast Notifications
function showWpToast(msg, type = "info") {
  const container = document.getElementById("wpToastContainer");
  const toast = document.createElement("div");
  toast.className = `wp-toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <span>${escapeHtml(msg)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Security Escape Helper
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
