// RAMART - Customer Storefront Engine (Production SQLite Integration)

const API_BASE = "";

// State (Real database items only, starts empty if database has 0 products)
let PRODUCTS = [];
let CATEGORIES = [];
let PROMO_CODES = {};
let STORE_SETTINGS = {
  store_name: "RAMART",
  tagline: "India's Favorite Online Shopping Store",
  currency: "₹",
  free_shipping_min: "499",
  shipping_charge: "49",
  announcement: "Grand Opening Sale: Use coupon SAVE10 for 10% instant discount!"
};

let cart = JSON.parse(localStorage.getItem("ramart_cart")) || [];
let activeCategory = "all";
let searchQuery = "";
let sortBy = "featured";
let activePromo = null;

// DOM Hooks
const productsGrid = document.getElementById("productsGrid");
const resultsCount = document.getElementById("resultsCount");
const categoryTabs = document.getElementById("categoryTabs");
const sortSelect = document.getElementById("sortSelect");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");

// Cart Elements
const cartToggleBtn = document.getElementById("cartToggleBtn");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");
const closeCartBtn = document.getElementById("closeCartBtn");
const cartItemsList = document.getElementById("cartItemsList");
const cartCountEl = document.getElementById("cartCount");
const drawerCartCountEl = document.getElementById("drawerCartCount");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartDiscountEl = document.getElementById("cartDiscount");
const discountRowEl = document.getElementById("discountRow");
const discountPercentageEl = document.getElementById("discountPercentage");
const cartTotalEl = document.getElementById("cartTotal");
const promoCodeInput = document.getElementById("promoCodeInput");
const applyPromoBtn = document.getElementById("applyPromoBtn");
const promoMessage = document.getElementById("promoMessage");
const checkoutBtn = document.getElementById("checkoutBtn");

// Modals
const quickViewModal = document.getElementById("quickViewModal");
const closeQuickView = document.getElementById("closeQuickView");
const quickViewContent = document.getElementById("quickViewContent");

const checkoutModal = document.getElementById("checkoutModal");
const closeCheckout = document.getElementById("closeCheckout");
const checkoutForm = document.getElementById("checkoutForm");
const checkoutTotalAmount = document.getElementById("checkoutTotalAmount");

const orderSuccessModal = document.getElementById("orderSuccessModal");
const receiptBox = document.getElementById("receiptBox");
const continueShoppingBtn = document.getElementById("continueShoppingBtn");

// Currency Formatter
function formatINR(amount) {
  const num = Math.round(Number(amount || 0));
  return "₹" + num.toLocaleString('en-IN');
}

// Init Storefront
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  updateCartUI();
  await loadStoreDataFromBackend();
});

// Load Live Data from SQLite Backend
async function loadStoreDataFromBackend() {
  try {
    const [prodsRes, catsRes, coupsRes, setsRes] = await Promise.all([
      fetch("/api/products").then(r => r.json()).catch(() => []),
      fetch("/api/categories").then(r => r.json()).catch(() => []),
      fetch("/api/coupons").then(r => r.json()).catch(() => ({})),
      fetch("/api/settings").then(r => r.json()).catch(() => ({}))
    ]);

    if (Array.isArray(prodsRes)) {
      PRODUCTS = prodsRes;
    }
    if (Array.isArray(catsRes)) {
      CATEGORIES = catsRes;
      renderCategoryTabs();
    }
    if (coupsRes && Object.keys(coupsRes).length > 0) {
      PROMO_CODES = coupsRes;
    }
    if (setsRes && setsRes.store_name) {
      STORE_SETTINGS = { ...STORE_SETTINGS, ...setsRes };
      applyStoreSettings();
    }
  } catch (err) {
    console.warn("Backend connection notice:", err);
  } finally {
    renderProducts();
  }
}

function applyStoreSettings() {
  const annEl = document.getElementById("topBarAnnouncement");
  if (annEl && STORE_SETTINGS.announcement) {
    annEl.innerHTML = `🚀 ${escapeHtml(STORE_SETTINGS.announcement)}`;
  }
  const shippingEl = document.getElementById("topBarShipping");
  if (shippingEl && STORE_SETTINGS.free_shipping_min) {
    shippingEl.textContent = `📦 Free Express Delivery across India on orders above ₹${STORE_SETTINGS.free_shipping_min}`;
  }
}

function renderCategoryTabs() {
  categoryTabs.innerHTML = `
    <button class="cat-tab ${activeCategory === 'all' ? 'active' : ''}" data-category="all">All Products</button>
    <button class="cat-tab ${activeCategory === 'trending' ? 'active' : ''}" data-category="trending">🔥 Trending Deals</button>
    <button class="cat-tab ${activeCategory === 'bestsellers' ? 'active' : ''}" data-category="bestsellers">⚡ Best Sellers</button>
    <button class="cat-tab ${activeCategory === 'new' ? 'active' : ''}" data-category="new">✨ New Arrivals</button>
    ${CATEGORIES.map(cat => `
      <button class="cat-tab ${activeCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
    `).join("")}
  `;
}

// Event Listeners Setup
function setupEventListeners() {
  categoryTabs.addEventListener("click", (e) => {
    if (e.target.classList.contains("cat-tab")) {
      document.querySelectorAll(".cat-tab").forEach(tab => tab.classList.remove("active"));
      e.target.classList.add("active");
      activeCategory = e.target.dataset.category;
      renderProducts();
    }
  });

  sortSelect.addEventListener("change", (e) => {
    sortBy = e.target.value;
    renderProducts();
  });

  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderProducts();
  });

  searchBtn.addEventListener("click", () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderProducts();
  });

  cartToggleBtn.addEventListener("click", openCart);
  closeCartBtn.addEventListener("click", closeCart);
  cartOverlay.addEventListener("click", closeCart);

  applyPromoBtn.addEventListener("click", applyPromoCode);
  promoCodeInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") applyPromoCode();
  });

  checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
      showToast("Your shopping bag is empty!", "info");
      return;
    }
    closeCart();
    openCheckout();
  });

  closeCheckout.addEventListener("click", () => {
    checkoutModal.classList.remove("open");
  });

  closeQuickView.addEventListener("click", () => {
    quickViewModal.classList.remove("open");
  });

  const closeAccountModalBtn = document.getElementById("closeAccountModal");
  if (closeAccountModalBtn) {
    closeAccountModalBtn.addEventListener("click", () => {
      const modal = document.getElementById("accountModal");
      if (modal) modal.classList.remove("open");
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === quickViewModal) quickViewModal.classList.remove("open");
    if (e.target === checkoutModal) checkoutModal.classList.remove("open");
    if (e.target === orderSuccessModal) orderSuccessModal.classList.remove("open");
    const accModal = document.getElementById("accountModal");
    if (e.target === accModal) accModal.classList.remove("open");
  });

  checkoutForm.addEventListener("submit", handleCheckoutSubmit);

  continueShoppingBtn.addEventListener("click", () => {
    orderSuccessModal.classList.remove("open");
  });
}

// VIP / Account Modal Trigger
window.openAccountModal = function() {
  const modal = document.getElementById("accountModal");
  if (modal) modal.classList.add("open");
};

// Payment method switcher
window.togglePaymentFields = function(method) {
  document.getElementById("upiFields").style.display = (method === 'upi') ? 'block' : 'none';
  document.getElementById("razorpayFields").style.display = (method === 'razorpay') ? 'block' : 'none';
  document.getElementById("codFields").style.display = (method === 'cod') ? 'block' : 'none';
};

// Render Products Grid
function renderProducts() {
  let filtered = PRODUCTS.filter(product => {
    let matchesCategory = true;
    if (activeCategory === "all") {
      matchesCategory = true;
    } else if (activeCategory === "trending") {
      matchesCategory = (product.badge && (product.badge.toLowerCase() === 'popular' || product.badge.toLowerCase() === 'sale' || product.badge.toLowerCase() === 'trending')) || (product.discountPercent && product.discountPercent >= 20);
    } else if (activeCategory === "bestsellers") {
      matchesCategory = (product.rating && product.rating >= 4.7) || (product.reviewsCount && product.reviewsCount >= 40);
    } else if (activeCategory === "new") {
      matchesCategory = (product.badge && product.badge.toLowerCase() === 'new') || !product.badge;
    } else {
      matchesCategory = product.category === activeCategory;
    }

    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery) || 
      product.description.toLowerCase().includes(searchQuery) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery)) ||
      product.category.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Sort
  if (sortBy === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === "rating") {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  resultsCount.textContent = `Showing ${filtered.length} of ${PRODUCTS.length} products`;

  if (filtered.length === 0) {
    if (PRODUCTS.length === 0) {
      productsGrid.innerHTML = `
        <div class="no-results" style="padding: 4rem 1rem;">
          <div class="no-results-icon">🛍️</div>
          <h3 style="font-size: 1.4rem; margin-bottom: 0.5rem; color: #ffffff;">Store Catalog Ready</h3>
          <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.5rem;">The store database is active and ready. New flagship collections will appear shortly.</p>
          <a href="/#productsSection" class="btn btn-primary btn-sm">Refresh Catalog</a>
        </div>
      `;
    } else {
      productsGrid.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3 style="color: #ffffff; margin-bottom: 0.5rem;">No matching products found</h3>
          <p style="color: var(--text-secondary);">Try searching for different keywords or select a different category.</p>
        </div>
      `;
    }
    return;
  }

  productsGrid.innerHTML = filtered.map(product => {
    const discountPercent = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : (product.discountPercent || 0);
    const inStock = product.inStock !== false && (product.stockQuantity > 0 || product.stockQuantity === undefined);

    return `
      <article class="product-card">
        <div class="card-img-wrapper" onclick="openQuickView('${product.id}')">
          ${product.badge ? `<span class="badge-tag badge-${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
          <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'250\\' fill=\'%2309090b\\'><rect width=\\'100%25\\' height=\'100%25\\' fill=\\'%2313131a\\'/><text x=\'50%25\\' y=\'50%25\\' fill=\\'%23dc2626\\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\\'sans-serif\\' font-size=\'16\\'>RAMART</text></svg>'">
          <button class="quick-view-btn" onclick="event.stopPropagation(); openQuickView('${product.id}')">Quick View</button>
        </div>
        <div class="card-body">
          <span class="product-category">${product.category}</span>
          <h3 class="product-title">${escapeHtml(product.name)}</h3>
          <div class="product-rating">
            <span class="stars">★</span>
            <strong>${(product.rating || 5.0).toFixed(1)}</strong>
            <span>(${product.reviewsCount || 0} reviews)</span>
          </div>
          <div class="product-footer">
            <div class="price-box">
              <div class="price-row-inr">
                <span class="price-current">${formatINR(product.price)}</span>
                ${product.originalPrice ? `<span class="price-original">${formatINR(product.originalPrice)}</span>` : ''}
              </div>
              ${discountPercent > 0 ? `<span class="discount-badge-mini">${discountPercent}% OFF</span>` : ''}
            </div>
            ${inStock ? `
              <button class="add-cart-btn" onclick="addToCartById('${product.id}')">Add to Bag</button>
            ` : `
              <button class="add-cart-btn" disabled style="background: #334155; border-color: #334155; color: #94a3b8; cursor: not-allowed;">Out of Stock</button>
            `}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Cart Operations
window.addToCartById = function(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  if (product.stockQuantity !== undefined && product.stockQuantity <= 0) {
    showToast("Sorry, this product is currently out of stock.", "info");
    return;
  }

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (product.stockQuantity !== undefined && existing.quantity >= product.stockQuantity) {
      showToast(`Only ${product.stockQuantity} unit(s) available in stock.`, "info");
      return;
    }
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      sku: product.sku || product.id,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  showToast(`Added "${product.name}" to bag`, "success");
};

function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  const product = PRODUCTS.find(p => p.id === productId);
  if (delta > 0 && product && product.stockQuantity !== undefined && item.quantity >= product.stockQuantity) {
    showToast(`Only ${product.stockQuantity} unit(s) available in stock.`, "info");
    return;
  }

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== productId);
  }
  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
  showToast("Item removed from bag", "info");
}

function saveCart() {
  localStorage.setItem("ramart_cart", JSON.stringify(cart));
}

function calculateCart() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discountAmount = 0;
  if (activePromo && PROMO_CODES[activePromo]) {
    const c = PROMO_CODES[activePromo];
    if (subtotal >= (c.minAmount || 0)) {
      if (c.discountType === 'percentage' || typeof c.discount === 'number') {
        const rate = c.discount || (c.discountValue / 100.0);
        discountAmount = Math.round(subtotal * rate);
      } else {
        discountAmount = Math.min(subtotal, c.discountValue);
      }
    }
  }
  const total = Math.max(0, subtotal - discountAmount);
  return { subtotal, discountAmount, total };
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountEl) cartCountEl.textContent = totalItems;
  if (drawerCartCountEl) drawerCartCountEl.textContent = totalItems;
  const bNavCartCountEl = document.getElementById("bNavCartCount");
  if (bNavCartCountEl) bNavCartCountEl.textContent = totalItems;

  const { subtotal, discountAmount, total } = calculateCart();

  if (cartSubtotalEl) cartSubtotalEl.textContent = formatINR(subtotal);
  if (cartTotalEl) cartTotalEl.textContent = formatINR(total);

  if (activePromo && discountAmount > 0) {
    if (discountRowEl) discountRowEl.style.display = "flex";
    if (discountPercentageEl) discountPercentageEl.textContent = activePromo;
    if (cartDiscountEl) cartDiscountEl.textContent = `-${formatINR(discountAmount)}`;
  } else {
    if (discountRowEl) discountRowEl.style.display = "none";
  }

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="empty-cart-state">
        <div class="empty-cart-icon">🛍️</div>
        <h4>Your Shopping Bag is empty</h4>
        <p>Discover our top luxury collections and add products to your bag.</p>
      </div>
    `;
    return;
  }

  cartItemsList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'70\\' height=\\'70\\' fill=\'%23090c16\\'><rect width=\'100%25\\' height=\'100%25\\' fill=\'%23111625\\'/></svg>'">
      <div class="cart-item-details">
        <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
        <div class="cart-item-price">${formatINR(item.price * item.quantity)}</div>
        <div class="cart-item-actions">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
            <span class="qty-val">${item.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
          </div>
          <button class="remove-item-btn" onclick="removeFromCart('${item.id}')">Remove</button>
        </div>
      </div>
    </div>
  `).join("");
}

// Drawer Controls
function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("open");
  document.body.style.overflow = "auto";
}

// Promo Code
function applyPromoCode() {
  const code = promoCodeInput.value.trim().toUpperCase();
  if (!code) return;

  if (PROMO_CODES[code]) {
    activePromo = code;
    promoMessage.className = "promo-message success";
    promoMessage.textContent = `✓ Coupon applied successfully!`;
    updateCartUI();
    showToast(`Coupon "${code}" applied.`, "success");
  } else {
    promoMessage.className = "promo-message error";
    promoMessage.textContent = "✗ Invalid promo code.";
  }
}

// Quick View Modal
window.openQuickView = function(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const discountPercent = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const inStock = product.inStock !== false && (product.stockQuantity > 0 || product.stockQuantity === undefined);

  quickViewContent.innerHTML = `
    <div class="quick-view-grid">
      <img src="${product.image}" alt="${escapeHtml(product.name)}" class="quick-view-img" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'250\\' fill=\'%23090c16\\'><rect width=\'100%25\\' height=\'100%25\\' fill=\'%23111625\\'/></svg>'">
      <div class="quick-view-info">
        <span class="product-category">${product.category}</span>
        <h2>${escapeHtml(product.name)}</h2>
        <div class="product-rating">
          <span class="stars">★★★★★</span>
          <strong>${(product.rating || 5.0).toFixed(1)}</strong> (${product.reviewsCount || 0} reviews)
        </div>
        <div class="price">
          ${formatINR(product.price)}
          ${product.originalPrice ? `<span class="price-original" style="font-size: 1rem; margin-left: 0.5rem; text-decoration: line-through; color: var(--slate-400);">${formatINR(product.originalPrice)}</span>` : ''}
          ${discountPercent > 0 ? `<span class="discount-pill" style="margin-left: 0.5rem;">${discountPercent}% OFF</span>` : ''}
        </div>
        <p>${escapeHtml(product.description)}</p>
        <div class="quick-view-benefits">
          <span>✓ 100% Genuine <span class="brand-ram">RAM</span><span class="brand-art">ART</span> Certified Product</span>
          <span>✓ Free Pan-India Fast Delivery</span>
          <span>✓ 7-Day Doorstep Replacement Guarantee</span>
        </div>
        ${inStock ? `
          <button class="btn btn-primary btn-block" style="margin-top: 1rem;" onclick="addToCartById('${product.id}'); quickViewModal.classList.remove('open');">Add to Bag</button>
        ` : `
          <button class="btn btn-primary btn-block" disabled style="margin-top: 1rem; background: #94a3b8; border-color: #94a3b8;">Out of Stock</button>
        `}
      </div>
    </div>
  `;

  quickViewModal.classList.add("open");
};

// Checkout
function openCheckout() {
  const { total } = calculateCart();
  checkoutTotalAmount.textContent = formatINR(total);
  checkoutModal.classList.add("open");
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const submitBtn = document.getElementById("placeOrderBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Securing Order...";

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const email = document.getElementById("custEmail").value.trim();
  const address = document.getElementById("custAddress").value.trim();
  const area = document.getElementById("custArea").value.trim();
  const city = document.getElementById("custCity").value.trim();
  const state = document.getElementById("custState").value;
  const pincode = document.getElementById("custPincode").value.trim();

  // Validate Indian Phone & Pincode
  if (!/^\d{10}$/.test(phone)) {
    showToast("Please enter a valid 10-digit mobile number.", "info");
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm & Place Order";
    return;
  }
  if (!/^\d{6}$/.test(pincode)) {
    showToast("Please enter a valid 6-digit PIN code.", "info");
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm & Place Order";
    return;
  }

  const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
  let paymentLabel = "📱 UPI";
  if (selectedPaymentMethod === "razorpay") paymentLabel = "💳 Razorpay / Cards / Net Banking";
  else if (selectedPaymentMethod === "cod") paymentLabel = "💵 Cash On Delivery (COD)";

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, phone, email, address, area, city, state, pincode,
        paymentMethod: paymentLabel,
        items: cart,
        promoCode: activePromo
      })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      const gstin = STORE_SETTINGS.gstin || "29AABCR8901M1Z5";
      
      receiptBox.innerHTML = `
        <div class="receipt-header-brand">
          <strong><span class="brand-ram">RAM</span><span class="brand-art">ART</span> OFFICIAL GST TAX INVOICE</strong>
          <span class="gstin-badge">GSTIN: ${gstin}</span>
        </div>
        <div class="receipt-row"><strong>Order Reference:</strong> <span>${data.orderId}</span></div>
        <div class="receipt-row"><strong>Booking Date:</strong> <span>${data.orderDate}</span></div>
        <div class="receipt-row"><strong>Customer:</strong> <span>${escapeHtml(name)}</span></div>
        <div class="receipt-row"><strong>Contact:</strong> <span>+91 ${escapeHtml(phone)} (${escapeHtml(email || 'N/A')})</span></div>
        <div class="receipt-row"><strong>Delivery Address:</strong> <span>${escapeHtml(address)}, ${escapeHtml(area)}, ${escapeHtml(city)}, ${escapeHtml(state)} - ${escapeHtml(pincode)}</span></div>
        <div class="receipt-row"><strong>Payment Method:</strong> <span>${paymentLabel}</span></div>
        <div class="receipt-row"><strong>Items Count:</strong> <span>${cart.reduce((s, i) => s + i.quantity, 0)} item(s)</span></div>
        <div class="receipt-row total-paid-highlight">
          <span>Total Paid:</span> <span>${formatINR(data.total)}</span>
        </div>
        <div class="delivery-estimate-note">
          🚚 <strong>Estimated Delivery:</strong> 2-4 business days across India via Express Courier
        </div>
        <div style="margin-top: 1rem; text-align: center;">
          <a href="/track?id=${data.orderId}" class="btn btn-secondary btn-sm" style="display: inline-block;">🔍 Track Shipment Status Online →</a>
        </div>
      `;

      // Clear Cart
      cart = [];
      activePromo = null;
      promoCodeInput.value = "";
      promoMessage.textContent = "";
      saveCart();
      updateCartUI();

      // Refresh product stock live
      await loadStoreDataFromBackend();

      checkoutModal.classList.remove("open");
      orderSuccessModal.classList.add("open");
      checkoutForm.reset();
    } else {
      showToast(data.error || "Order placement failed.", "info");
    }
  } catch (err) {
    showToast("Server communication error while placing order.", "info");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirm & Place Order";
  }
}

// Toast Notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Newsletter Subscription
window.subscribeNewsletter = function() {
  const input = document.getElementById("newsletterEmail");
  if (input.value && input.value.includes("@")) {
    showToast("Welcome to RAMART Privilege Club! You will receive exclusive discounts.", "success");
    input.value = "";
  } else {
    showToast("Please enter a valid email address.", "info");
  }
};

// Security Helper
function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Category scroll helper for mobile navigation
window.scrollToCategories = function(e) {
  if (e) e.preventDefault();
  const el = document.getElementById("categoryTabs") || document.getElementById("productsSection");
  if (el) {
    const yOffset = -70;
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }
};

