// RAMART - Customer Storefront Engine (Universal SQLite + Static Fallback Support)

// Default Flagship Catalog (Active on both SQLite Backend and GitHub Pages)
const DEFAULT_PRODUCTS = [
  {
    id: 'p1',
    sku: 'RAM-AUD-01',
    name: 'RAMART Pro Studio ANC Wireless Headphones',
    category: 'Electronics',
    price: 2499,
    originalPrice: 4999,
    discountPercent: 50,
    stockQuantity: 25,
    status: 'active',
    badge: 'Popular',
    rating: 4.9,
    reviewsCount: 128,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
    description: 'Active Noise Cancelling flagship over-ear wireless headphones with 40mm titanium drivers and 40-hour ultra-long battery life.'
  },
  {
    id: 'p2',
    sku: 'RAM-WAT-02',
    name: 'RAMART ChronoMax Ultra Smartwatch',
    category: 'Wearables',
    price: 2999,
    originalPrice: 5999,
    discountPercent: 50,
    stockQuantity: 30,
    status: 'active',
    badge: 'New',
    rating: 4.8,
    reviewsCount: 94,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    description: '1.96-inch AMOLED always-on display, aerospace-grade titanium bezel, continuous SpO2/HR sensors, and Bluetooth HD calling.'
  },
  {
    id: 'p3',
    sku: 'RAM-POD-03',
    name: 'RAMART AirPulse Pro TWS Earbuds',
    category: 'Electronics',
    price: 1499,
    originalPrice: 2999,
    discountPercent: 50,
    stockQuantity: 40,
    status: 'active',
    badge: 'Sale',
    rating: 4.9,
    reviewsCount: 210,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    description: 'True wireless spatial audio earbuds with 35dB hybrid ANC, low-latency gaming mode, and wireless charging case.'
  },
  {
    id: 'spk-01',
    sku: 'RAM-SPK-01',
    name: 'RAMART Pulse 360 Bluetooth Speaker',
    category: 'Electronics',
    price: 1899,
    originalPrice: 2799,
    discountPercent: 32,
    stockQuantity: 20,
    status: 'active',
    badge: 'Featured',
    rating: 4.7,
    reviewsCount: 62,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    description: '360-degree omnidirectional stereo acoustic sound with punchy bass radiators, IPX6 water resistance, and 12h playtime.'
  },
  {
    id: 'spk-02',
    sku: 'RAM-SGV-02',
    name: 'RAMART SoundGroove Mini Speaker',
    category: 'Electronics',
    price: 999,
    originalPrice: 1499,
    discountPercent: 33,
    stockQuantity: 20,
    status: 'active',
    badge: 'Popular',
    rating: 4.8,
    reviewsCount: 45,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&auto=format&fit=crop&q=80',
    description: 'High-definition portable speaker featuring dynamic bass radiators, IPX5 splash resistance, and hands-free calling.'
  },
  {
    id: 'spk-03',
    sku: 'RAM-BMX-03',
    name: 'RAMART BoomX Rugged Outdoor Speaker',
    category: 'Electronics',
    price: 2299,
    originalPrice: 3499,
    discountPercent: 34,
    stockQuantity: 20,
    status: 'active',
    badge: 'New',
    rating: 4.8,
    reviewsCount: 38,
    image: 'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&auto=format&fit=crop&q=80',
    description: 'Rugged outdoor wireless speaker with deep bass boost, dual passive radiators, and 14-hour continuous playback.'
  },
  {
    id: 'spk-04',
    sku: 'RAM-SMX-04',
    name: 'RAMART SoundMax RGB Party Speaker',
    category: 'Electronics',
    price: 1499,
    originalPrice: 2199,
    discountPercent: 32,
    stockQuantity: 20,
    status: 'active',
    badge: 'Popular',
    rating: 4.9,
    reviewsCount: 81,
    image: 'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80',
    description: 'Multicolor dynamic RGB beat-synced ambient lighting with 360-degree immersive sound and Bluetooth 5.3 connectivity.'
  },
  {
    id: 'spk-05',
    sku: 'RAM-PKB-05',
    name: 'RAMART PocketBeat Clip-On Speaker',
    category: 'Accessories',
    price: 799,
    originalPrice: 1199,
    discountPercent: 33,
    stockQuantity: 20,
    status: 'active',
    badge: 'Sale',
    rating: 4.7,
    reviewsCount: 56,
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&auto=format&fit=crop&q=80',
    description: 'Ultra-lightweight travel clip-on speaker with punchy bass, built-in lanyard strap, and USB-C fast charging.'
  },
  {
    id: 'spk-06',
    sku: 'RAM-PBX-06',
    name: 'RAMART PartyBox 20W Bluetooth Speaker',
    category: 'Electronics',
    price: 2999,
    originalPrice: 4499,
    discountPercent: 33,
    stockQuantity: 20,
    status: 'active',
    badge: 'Featured',
    rating: 4.9,
    reviewsCount: 73,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    description: '20W RMS power output with dedicated party EQ modes, karaoke microphone input, and synchronized LED strobe lights.'
  },
  {
    id: 'spk-07',
    sku: 'RAM-BTW-07',
    name: 'RAMART BassTower 40W Floor Speaker',
    category: 'Home & Living',
    price: 3499,
    originalPrice: 4999,
    discountPercent: 30,
    stockQuantity: 20,
    status: 'active',
    badge: 'New',
    rating: 4.8,
    reviewsCount: 42,
    image: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=600&auto=format&fit=crop&q=80',
    description: '40W acoustic floor tower speaker with dual subwoofers, wooden acoustic enclosure, and remote control support.'
  },
  {
    id: 'spk-08',
    sku: 'RAM-MNB-08',
    name: 'RAMART MiniBoom TWS Stereo Speaker',
    category: 'Electronics',
    price: 1199,
    originalPrice: 1799,
    discountPercent: 33,
    stockQuantity: 20,
    status: 'active',
    badge: 'Popular',
    rating: 4.7,
    reviewsCount: 67,
    image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    description: 'True Wireless Stereo (TWS) pairing support for linking two speakers, rich stereo separation, and 10m range.'
  },
  {
    id: 'spk-09',
    sku: 'RAM-SBM-09',
    name: 'RAMART CinemaSound Mini SoundBar',
    category: 'Home & Living',
    price: 1999,
    originalPrice: 2999,
    discountPercent: 33,
    stockQuantity: 20,
    status: 'active',
    badge: 'Sale',
    rating: 4.8,
    reviewsCount: 89,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    description: 'Compact TV and desktop soundbar with dual neodymium drivers, AUX/Optical/Bluetooth inputs, and theater sound mode.'
  },
  {
    id: 'spk-10',
    sku: 'RAM-BCW-10',
    name: 'RAMART BeatCube Waterproof Speaker',
    category: 'Accessories',
    price: 1299,
    originalPrice: 1999,
    discountPercent: 35,
    stockQuantity: 20,
    status: 'active',
    badge: 'New',
    rating: 4.9,
    reviewsCount: 34,
    image: 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a?w=600&auto=format&fit=crop&q=80',
    description: 'IPX7 fully waterproof and dustproof submersible cube speaker, floating design, shock-absorbing silicone armor.'
  },
  {
    id: 'spk-11',
    sku: 'RAM-PWB-11',
    name: 'RAMART PowerBass 60W Party Speaker',
    category: 'Electronics',
    price: 4499,
    originalPrice: 6499,
    discountPercent: 31,
    stockQuantity: 20,
    status: 'active',
    badge: 'Featured',
    rating: 4.9,
    reviewsCount: 51,
    image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80',
    description: 'High-output 60W party sound system with dedicated bass reflex ports, guitar input jack, and built-in powerbank function.'
  },
  {
    id: 'spk-15',
    sku: 'RAM-UBX-15',
    name: 'RAMART UltraBoom 100W Flagship Speaker',
    category: 'Electronics',
    price: 5999,
    originalPrice: 7999,
    discountPercent: 25,
    stockQuantity: 20,
    status: 'active',
    badge: 'Featured',
    rating: 5.0,
    reviewsCount: 114,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    description: 'Flagship 100W peak party audio beast with full-panel LED flame lighting, wireless mic included, and trolley wheels.'
  }
];

const DEFAULT_CATEGORIES = ['Accessories', 'Electronics', 'Home & Living', 'Wearables'];

const DEFAULT_COUPONS = {
  SAVE10: { type: 'percentage', value: 10, minOrder: 0 },
  RAMART20: { type: 'percentage', value: 20, minOrder: 999 },
  FIRST50: { type: 'percentage', value: 15, minOrder: 499 }
};

// State
let PRODUCTS = [...DEFAULT_PRODUCTS];
let CATEGORIES = [...DEFAULT_CATEGORIES];
let PROMO_CODES = { ...DEFAULT_COUPONS };
let STORE_SETTINGS = {
  store_name: 'RAMART',
  tagline: 'Premium Tech. Smart Lifestyle.',
  currency: '₹',
  free_shipping_min: '499',
  shipping_charge: '49',
  announcement: 'RAMART EXCLUSIVE: Use coupon SAVE10 for instant 10% privilege discount!'
};

let cart = JSON.parse(localStorage.getItem('ramart_cart')) || [];
let activeCategory = 'all';
let searchQuery = '';
let sortBy = 'featured';
let activePromo = null;

// DOM Hooks
const productsGrid = document.getElementById('productsGrid');
const resultsCount = document.getElementById('resultsCount');
const categoryTabs = document.getElementById('categoryTabs');
const sortSelect = document.getElementById('sortSelect');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// Cart Elements
const cartToggleBtn = document.getElementById('cartToggleBtn');
const cartDrawer = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartItemsList = document.getElementById('cartItemsList');
const cartCountEl = document.getElementById('cartCount');
const drawerCartCountEl = document.getElementById('drawerCartCount');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartDiscountEl = document.getElementById('cartDiscount');
const discountRowEl = document.getElementById('discountRow');
const discountPercentageEl = document.getElementById('discountPercentage');
const cartTotalEl = document.getElementById('cartTotal');
const promoCodeInput = document.getElementById('promoCodeInput');
const applyPromoBtn = document.getElementById('applyPromoBtn');
const promoMessage = document.getElementById('promoMessage');
const checkoutBtn = document.getElementById('checkoutBtn');

// Modals
const quickViewModal = document.getElementById('quickViewModal');
const closeQuickView = document.getElementById('closeQuickView');
const quickViewContent = document.getElementById('quickViewContent');

const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.getElementById('closeCheckout');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutTotalAmount = document.getElementById('checkoutTotalAmount');

const orderSuccessModal = document.getElementById('orderSuccessModal');
const receiptBox = document.getElementById('receiptBox');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');

// Currency Formatter
function formatINR(amount) {
  const num = Math.round(Number(amount || 0));
  return '₹' + num.toLocaleString('en-IN');
}

// Init Storefront
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  renderCategoryTabs();
  renderProducts();
  updateCartUI();
  await loadStoreDataFromBackend();
});

// Load Live Data from SQLite Backend
async function loadStoreDataFromBackend() {
  try {
    const [prodsRes, catsRes, coupsRes, setsRes] = await Promise.all([
      fetch('/api/products').then(r => r.json()).catch(() => null),
      fetch('/api/categories').then(r => r.json()).catch(() => null),
      fetch('/api/coupons').then(r => r.json()).catch(() => null),
      fetch('/api/settings').then(r => r.json()).catch(() => null)
    ]);

    if (Array.isArray(prodsRes) && prodsRes.length > 0) {
      PRODUCTS = prodsRes;
    }
    if (Array.isArray(catsRes) && catsRes.length > 0) {
      CATEGORIES = catsRes;
      renderCategoryTabs();
    }
    if (coupsRes && Object.keys(coupsRes).length > 0) {
      PROMO_CODES = { ...PROMO_CODES, ...coupsRes };
    }
    if (setsRes && setsRes.store_name) {
      STORE_SETTINGS = { ...STORE_SETTINGS, ...setsRes };
      applyStoreSettings();
    }
  } catch (err) {
    console.warn('Backend connection notice:', err);
  } finally {
    renderProducts();
  }
}

function applyStoreSettings() {
  const annEl = document.getElementById('topBarAnnouncement');
  if (annEl && STORE_SETTINGS.announcement) {
    annEl.innerHTML = `⚡ <strong>RAMART EXCLUSIVE:</strong> ${escapeHtml(STORE_SETTINGS.announcement)}`;
  }
  const shippingEl = document.getElementById('topBarShipping');
  if (shippingEl && STORE_SETTINGS.free_shipping_min) {
    shippingEl.textContent = `📦 Free Express Delivery across India on orders above ₹${STORE_SETTINGS.free_shipping_min}`;
  }
}

function renderCategoryTabs() {
  if (!categoryTabs) return;
  categoryTabs.innerHTML = `
    <button class="cat-tab ${activeCategory === 'all' ? 'active' : ''}" data-category="all">All Products</button>
    <button class="cat-tab ${activeCategory === 'trending' ? 'active' : ''}" data-category="trending">🔥 Trending Deals</button>
    <button class="cat-tab ${activeCategory === 'bestsellers' ? 'active' : ''}" data-category="bestsellers">⚡ Best Sellers</button>
    <button class="cat-tab ${activeCategory === 'new' ? 'active' : ''}" data-category="new">✨ New Arrivals</button>
    ${CATEGORIES.map(cat => `
      <button class="cat-tab ${activeCategory === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
    `).join('')}
  `;
}

// Smooth scroll helper
window.scrollToCategories = function(event) {
  if (event) event.preventDefault();
  const tabs = document.getElementById('categoryTabs');
  if (tabs) {
    const yOffset = -80;
    const y = tabs.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
};

// Event Listeners Setup
function setupEventListeners() {
  if (categoryTabs) {
    categoryTabs.addEventListener('click', (e) => {
      if (e.target.classList.contains('cat-tab')) {
        document.querySelectorAll('.cat-tab').forEach(tab => tab.classList.remove('active'));
        e.target.classList.add('active');
        activeCategory = e.target.dataset.category;
        renderProducts();
      }
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProducts();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderProducts();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      renderProducts();
    });
  }

  if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCart);
  if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  if (applyPromoBtn) applyPromoBtn.addEventListener('click', applyPromoCode);
  if (promoCodeInput) {
    promoCodeInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') applyPromoCode();
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) {
        showToast('Your shopping bag is empty!', 'info');
        return;
      }
      closeCart();
      openCheckout();
    });
  }

  if (closeCheckout) {
    closeCheckout.addEventListener('click', () => {
      checkoutModal.classList.remove('open');
    });
  }

  if (closeQuickView) {
    closeQuickView.addEventListener('click', () => {
      quickViewModal.classList.remove('open');
    });
  }

  const closeAccountModalBtn = document.getElementById('closeAccountModal');
  if (closeAccountModalBtn) {
    closeAccountModalBtn.addEventListener('click', () => {
      const modal = document.getElementById('accountModal');
      if (modal) modal.classList.remove('open');
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === quickViewModal) quickViewModal.classList.remove('open');
    if (e.target === checkoutModal) checkoutModal.classList.remove('open');
    if (e.target === orderSuccessModal) orderSuccessModal.classList.remove('open');
    const accModal = document.getElementById('accountModal');
    if (e.target === accModal) accModal.classList.remove('open');
  });

  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', () => {
      orderSuccessModal.classList.remove('open');
    });
  }
}

// VIP / Account Modal Trigger
window.openAccountModal = function() {
  const modal = document.getElementById('accountModal');
  if (modal) modal.classList.add('open');
};

// Payment method switcher
window.togglePaymentFields = function(method) {
  document.getElementById('upiFields').style.display = (method === 'upi') ? 'block' : 'none';
  document.getElementById('razorpayFields').style.display = (method === 'razorpay') ? 'block' : 'none';
  document.getElementById('codFields').style.display = (method === 'cod') ? 'block' : 'none';
};

// Render Products Grid
function renderProducts() {
  if (!productsGrid) return;

  let filtered = PRODUCTS.filter(product => {
    let matchesCategory = true;
    if (activeCategory === 'all') {
      matchesCategory = true;
    } else if (activeCategory === 'trending') {
      matchesCategory = (product.badge && (product.badge.toLowerCase() === 'popular' || product.badge.toLowerCase() === 'sale' || product.badge.toLowerCase() === 'featured')) || (product.discountPercent && product.discountPercent >= 20);
    } else if (activeCategory === 'bestsellers') {
      matchesCategory = (product.rating && product.rating >= 4.8) || (product.reviewsCount && product.reviewsCount >= 40);
    } else if (activeCategory === 'new') {
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
  if (sortBy === 'price-low') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  if (resultsCount) {
    resultsCount.textContent = `Showing ${filtered.length} of ${PRODUCTS.length} products`;
  }

  if (filtered.length === 0) {
    productsGrid.innerHTML = `
      <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem;">
        <div class="no-results-icon" style="font-size: 3rem; margin-bottom: 0.5rem;">🔍</div>
        <h3 style="color: #ffffff; margin-bottom: 0.5rem;">No matching products found</h3>
        <p style="color: var(--text-secondary);">Try searching for different keywords or select a different category.</p>
      </div>
    `;
    return;
  }

  productsGrid.innerHTML = filtered.map(product => {
    const discountPercent = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : (product.discountPercent || 0);
    const inStock = product.inStock !== false && (product.stockQuantity > 0 || product.stockQuantity === undefined);

    return `
      <article class="product-card">
        <div class="card-img-wrapper" onclick="openQuickView('${product.id}')">
          ${product.badge ? `<span class="badge-tag badge-${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
          <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'">
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
  }).join('');
}

// Cart Operations
window.addToCartById = function(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  if (product.stockQuantity !== undefined && product.stockQuantity <= 0) {
    showToast('Sorry, this product is currently out of stock.', 'info');
    return;
  }

  const existing = cart.find(item => item.id === productId);
  if (existing) {
    if (product.stockQuantity !== undefined && existing.quantity >= product.stockQuantity) {
      showToast(`Only ${product.stockQuantity} unit(s) available in stock.`, 'info');
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
  showToast(`Added "${product.name}" to bag`, 'success');
};

function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  const product = PRODUCTS.find(p => p.id === productId);
  const newQty = item.quantity + delta;

  if (newQty <= 0) {
    cart = cart.filter(i => i.id !== productId);
  } else {
    if (product && product.stockQuantity !== undefined && newQty > product.stockQuantity) {
      showToast(`Maximum ${product.stockQuantity} unit(s) available in stock.`, 'info');
      return;
    }
    item.quantity = newQty;
  }

  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  cart = cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
  showToast('Item removed from bag', 'info');
}

function saveCart() {
  localStorage.setItem('ramart_cart', JSON.stringify(cart));
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCountEl) cartCountEl.textContent = totalCount;
  if (drawerCartCountEl) drawerCartCountEl.textContent = totalCount;

  const bNavCartCount = document.getElementById('bNavCartCount');
  if (bNavCartCount) {
    bNavCartCount.textContent = totalCount;
  }

  if (cart.length === 0) {
    cartItemsList.innerHTML = `
      <div class="empty-cart-state">
        <div class="empty-cart-icon">🛍️</div>
        <h4>Your Bag is Empty</h4>
        <p>Explore our flagship collections and exclusive deals</p>
      </div>
    `;
    cartSubtotalEl.textContent = '₹0';
    cartTotalEl.textContent = '₹0';
    discountRowEl.style.display = 'none';
    return;
  }

  cartItemsList.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${escapeHtml(item.name)}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'">
      <div class="cart-item-details">
        <h4 class="cart-item-title">${escapeHtml(item.name)}</h4>
        <div class="cart-item-price">${formatINR(item.price)}</div>
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
  `).join('');

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  cartSubtotalEl.textContent = formatINR(subtotal);

  let discount = 0;
  if (activePromo) {
    if (activePromo.type === 'percentage') {
      discount = (subtotal * activePromo.value) / 100;
    } else {
      discount = activePromo.value;
    }
    discountRowEl.style.display = 'flex';
    cartDiscountEl.textContent = `-${formatINR(discount)}`;
    discountPercentageEl.textContent = `${activePromo.code} (${activePromo.value}% OFF)`;
  } else {
    discountRowEl.style.display = 'none';
  }

  const total = Math.max(0, subtotal - discount);
  cartTotalEl.textContent = formatINR(total);
}

function openCart() {
  cartDrawer.classList.add('open');
  cartOverlay.classList.add('open');
}

function closeCart() {
  cartDrawer.classList.remove('open');
  cartOverlay.classList.remove('open');
}

// Promo Code Logic
function applyPromoCode() {
  const code = promoCodeInput.value.trim().toUpperCase();
  if (!code) {
    showPromoMessage('Please enter a coupon code', 'error');
    return;
  }

  const promo = PROMO_CODES[code];
  if (!promo) {
    showPromoMessage('Invalid promo coupon code', 'error');
    return;
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (promo.minOrder && subtotal < promo.minOrder) {
    showPromoMessage(`Minimum order value of ${formatINR(promo.minOrder)} required for this coupon`, 'error');
    return;
  }

  activePromo = { code, ...promo };
  showPromoMessage(`🎉 Privilege coupon ${code} applied successfully!`, 'success');
  updateCartUI();
}

function showPromoMessage(msg, type) {
  promoMessage.textContent = msg;
  promoMessage.className = `promo-message ${type}`;
}

// Quick View Modal
window.openQuickView = function(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const inStock = product.inStock !== false && (product.stockQuantity > 0 || product.stockQuantity === undefined);

  quickViewContent.innerHTML = `
    <div class="quick-view-grid">
      <img src="${product.image}" alt="${escapeHtml(product.name)}" class="quick-view-img" onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'">
      <div class="quick-view-info">
        <span class="product-category">${product.category}</span>
        <h2>${escapeHtml(product.name)}</h2>
        <div class="product-rating" style="margin-bottom: 0.75rem;">
          <span class="stars">★</span>
          <strong>${(product.rating || 5.0).toFixed(1)}</strong>
          <span>(${product.reviewsCount || 0} reviews)</span>
        </div>
        <div class="price">${formatINR(product.price)}</div>
        <p>${escapeHtml(product.description)}</p>
        <div class="quick-view-benefits" style="margin-bottom: 1.25rem;">
          <div>✓ 100% Genuine Certified Product</div>
          <div>✓ Free Pan-India Express Delivery</div>
          <div>✓ 7-Day Doorstep Replacement Guarantee</div>
        </div>
        ${inStock ? `
          <button class="btn btn-primary btn-block" onclick="addToCartById('${product.id}'); quickViewModal.classList.remove('open');">
            Add to Bag - ${formatINR(product.price)}
          </button>
        ` : `
          <button class="btn btn-secondary btn-block" disabled>Out of Stock</button>
        `}
      </div>
    </div>
  `;

  quickViewModal.classList.add('open');
};

// Checkout Modal
function openCheckout() {
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discount = 0;
  if (activePromo) {
    discount = (activePromo.type === 'percentage') ? (subtotal * activePromo.value) / 100 : activePromo.value;
  }
  const total = Math.max(0, subtotal - discount);
  checkoutTotalAmount.textContent = formatINR(total);
  checkoutModal.classList.add('open');
}

// Order Submission Handler
async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const area = document.getElementById('custArea').value.trim() || 'Main';
  const city = document.getElementById('custCity').value.trim();
  const state = document.getElementById('custState').value;
  const pincode = document.getElementById('custPincode').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'UPI';

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let discount = 0;
  if (activePromo) {
    discount = (activePromo.type === 'percentage') ? (subtotal * activePromo.value) / 100 : activePromo.value;
  }
  const total = Math.max(0, subtotal - discount);

  const orderPayload = {
    name,
    phone,
    email,
    address,
    area,
    city,
    state,
    pincode,
    items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
    paymentMethod,
    promoCode: activePromo ? activePromo.code : ''
  };

  const placeBtn = document.getElementById('placeOrderBtn');
  placeBtn.disabled = true;
  placeBtn.textContent = 'Processing Order...';

  let orderId = 'RAM-IND-' + Math.floor(100000 + Math.random() * 900000);
  let orderDate = new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      orderId = data.orderId;
      orderDate = data.orderDate;
    }
  } catch (err) {
    console.log('Order processed in static client mode');
  }

  // Save order in local history (so /track works everywhere)
  const savedOrders = JSON.parse(localStorage.getItem('ramart_placed_orders') || '[]');
  const localOrder = {
    id: orderId,
    date: orderDate,
    customerName: name,
    phone: phone,
    email: email,
    address: `${address}, ${area}, ${city}, ${state} - ${pincode}`,
    paymentMethod: paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'Pending (Pay on Delivery)' : 'Paid (Verified)',
    orderStatus: 'Confirmed',
    subtotal: subtotal,
    discount: discount,
    shippingFee: 0,
    total: total,
    courierPartner: 'BlueDart Express',
    trackingNumber: 'BD' + Math.floor(100000000 + Math.random() * 900000000) + 'IN',
    items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity, total: i.price * i.quantity })),
    timeline: [
      { step: 'Order Placed', status: 'completed', date: orderDate },
      { step: 'Confirmed', status: 'completed' },
      { step: 'Processing', status: 'current' },
      { step: 'Dispatched', status: 'pending' },
      { step: 'Delivered', status: 'pending' }
    ]
  };
  savedOrders.unshift(localOrder);
  localStorage.setItem('ramart_placed_orders', JSON.stringify(savedOrders));

  // Render Confirmation Receipt
  receiptBox.innerHTML = `
    <div class="receipt-header-brand">
      <strong><span class="brand-ram">RAM</span><span class="brand-art">ART</span> OFFICIAL TAX INVOICE</strong>
      <span class="gstin-badge">GSTIN: 29AABCR8901M1Z5</span>
    </div>
    <div class="receipt-row"><strong>Order Reference:</strong> <span style="color: var(--gold-accent); font-weight: 800;">${orderId}</span></div>
    <div class="receipt-row"><strong>Date:</strong> <span>${orderDate}</span></div>
    <div class="receipt-row"><strong>Customer:</strong> <span>${escapeHtml(name)}</span></div>
    <div class="receipt-row"><strong>Contact:</strong> <span>+91 ${escapeHtml(phone)}</span></div>
    <div class="receipt-row"><strong>Delivery Address:</strong> <span>${escapeHtml(address)}, ${escapeHtml(city)}, ${escapeHtml(state)} - ${pincode}</span></div>
    <div class="receipt-row"><strong>Payment Mode:</strong> <span>${paymentMethod}</span></div>
    
    <div style="margin: 0.75rem 0; border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
      <strong style="font-size: 13px; margin-bottom: 0.35rem; display: block;">Purchased Items:</strong>
      <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
        ${cart.map(i => `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 4px 0;">${escapeHtml(i.name)}</td>
            <td style="text-align: center;">x${i.quantity}</td>
            <td style="text-align: right; font-weight: 700;">${formatINR(i.price * i.quantity)}</td>
          </tr>
        `).join('')}
      </table>
    </div>

    <div class="receipt-row" style="color: var(--text-secondary); font-size: 12px;"><span>Subtotal:</span> <span>${formatINR(subtotal)}</span></div>
    ${discount > 0 ? `<div class="receipt-row" style="color: var(--gold-accent); font-size: 12px;"><span>Privilege Discount:</span> <span>-${formatINR(discount)}</span></div>` : ''}
    <div class="receipt-row" style="color: var(--text-secondary); font-size: 12px;"><span>Shipping:</span> <span style="color: #4ade80; font-weight: 700;">FREE</span></div>
    <div class="receipt-row total-paid-highlight">
      <span>Total Paid:</span> <span>${formatINR(total)}</span>
    </div>
    <div style="margin-top: 1rem; text-align: center;">
      <a href="track.html?id=${orderId}" class="btn btn-primary btn-sm" style="width: 100%;">📦 Track Live Shipment →</a>
    </div>
  `;

  // Clear Cart
  cart = [];
  activePromo = null;
  saveCart();
  updateCartUI();

  checkoutModal.classList.remove('open');
  orderSuccessModal.classList.add('open');
  placeBtn.disabled = false;
  placeBtn.textContent = 'Confirm & Place Order';
}

function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : 'ℹ'}</span> ${escapeHtml(msg)}`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

function subscribeNewsletter() {
  const emailInput = document.getElementById('newsletterEmail');
  if (!emailInput || !emailInput.value.trim()) {
    showToast('Please enter your email to join the privilege club', 'info');
    return;
  }
  showToast('Welcome to the RAMART Privilege Club! Exclusive preview deals will arrive in your inbox.', 'success');
  emailInput.value = '';
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
