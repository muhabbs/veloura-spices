const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

const sharedImage = 'assets/veloura-products.jpg';
const fallbackImage = 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=900&q=80';
const instaPayUrl = 'https://www.instapay.eg/';
const whatsappUrl = 'https://wa.me/201000000000?text=Hello%20Veloura%2C%20I%20want%20help%20with%20my%20order.';
const currencyLabel = '\u062C.\u0645';

const products = [
  {
    id: 'seven',
    name: 'Seven Blend',
    price: 185,
    weight: '250g',
    badge: 'Best Seller',
    heat: 'Mild',
    note: 'Warm and nutty for eggs, feteer, and roasted vegetables.',
    story: 'A balanced all-rounder with toasted depth, built for everyday Alexandria kitchens that want one reliable jar within reach.',
    ingredients: ['Coriander', 'Cumin', 'Sesame', 'Black pepper', 'Paprika', 'Sea salt'],
    bestWith: ['Eggs and shakshuka', 'Roasted potatoes', 'Feteer and dips'],
    image: sharedImage
  },
  {
    id: 'chicken',
    name: 'Chicken Mix',
    price: 210,
    weight: '250g',
    badge: 'Fresh Batch',
    heat: 'Medium',
    note: 'Savory garlic-spice blend for oven trays and grilled chicken.',
    story: 'Built for tray bakes, grilled chicken, and fast weeknight cooking with a clean savory finish and a little warmth.',
    ingredients: ['Garlic', 'Paprika', 'Coriander', 'Turmeric', 'Black pepper', 'Sea salt'],
    bestWith: ['Chicken trays', 'Rice bowls', 'Charcoal chicken'],
    image: sharedImage
  },
  {
    id: 'bbq',
    name: 'BBQ Rub',
    price: 195,
    weight: '250g',
    badge: 'Weekend Pick',
    heat: 'Bold',
    note: 'Smoky pepper finish for kofta, grills, and family barbecues.',
    story: 'A deeper, smokier blend designed for grill nights, kofta, wings, and any table that leans bold and peppery.',
    ingredients: ['Smoked paprika', 'Black pepper', 'Garlic', 'Onion', 'Cumin', 'Sea salt'],
    bestWith: ['Kofta', 'Wings and skewers', 'Weekend grills'],
    image: sharedImage
  }
];

const state = {
  cart: read('velouraCart', []),
  guest: read('velouraGuest', {}),
  lastOrder: read('velouraLastOrder', null)
};

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save() {
  localStorage.setItem('velouraCart', JSON.stringify(state.cart));
  localStorage.setItem('velouraGuest', JSON.stringify(state.guest));
  localStorage.setItem('velouraLastOrder', JSON.stringify(state.lastOrder));
}

function money(value) {
  return `${new Intl.NumberFormat('en-EG').format(value)} ${currencyLabel}`;
}

function getProduct(id) {
  return products.find(product => product.id === id);
}

function getCartItems() {
  return state.cart
    .map(item => {
      const product = getProduct(item.id);
      return product ? { ...product, qty: item.qty, lineTotal: product.price * item.qty } : null;
    })
    .filter(Boolean);
}

function getSubtotal() {
  return getCartItems().reduce((sum, item) => sum + item.lineTotal, 0);
}

function cartCount() {
  return state.cart.reduce((sum, item) => sum + item.qty, 0);
}

function addToCart(id, qty = 1) {
  const row = state.cart.find(item => item.id === id);
  if (row) row.qty += qty;
  else state.cart.push({ id, qty });
  save();
  syncUI();
}

function setQty(id, qty) {
  if (qty <= 0) {
    state.cart = state.cart.filter(item => item.id !== id);
  } else {
    const row = state.cart.find(item => item.id === id);
    if (row) row.qty = qty;
  }
  save();
  syncUI();
}

function changeQty(id, step) {
  const row = state.cart.find(item => item.id === id);
  if (!row) return;
  setQty(id, row.qty + step);
}

function imgMarkup(product, className = '') {
  return `<img class="${className}" src="${product.image}" alt="${product.name}" onerror="this.onerror=null;this.src='${fallbackImage}'">`;
}

function qtyMarkup(id, qty) {
  return `
    <div class="qty-box">
      <button type="button" data-qty="${id}" data-step="-1">-</button>
      <span>${qty}</span>
      <button type="button" data-qty="${id}" data-step="1">+</button>
    </div>
  `;
}

function productCard(product) {
  return `
    <article class="product-card">
      ${product.badge ? `<div class="badge">${product.badge}</div>` : ''}
      ${imgMarkup(product)}
      <h3>${product.name}</h3>
      <p class="price">${money(product.price)}</p>
      <p class="weight">${product.weight}</p>
      <p class="product-note">${product.note}</p>
      <div class="card-actions card-actions-split">
        <a class="product-link" href="product.html?id=${product.id}">View Details</a>
        <button class="btn primary" type="button" data-add="${product.id}">Add to cart</button>
      </div>
    </article>
  `;
}

function renderProductGrids() {
  $$('[data-product-grid]').forEach(grid => {
    grid.innerHTML = products.map(productCard).join('');
  });
}

function renderMiniCart() {
  const list = $('#cart-items');
  const total = $('#cart-total');
  const note = $('#login-note');
  const button = $('#checkout-btn');
  if (!list) return;

  const items = getCartItems();
  if (!items.length) {
    list.innerHTML = '<div class="empty">Your cart is empty. Add a blend to get started.</div>';
  } else {
    list.innerHTML = items.map(item => `
      <div class="cart-item">
        ${imgMarkup(item)}
        <div>
          <strong>${item.name}</strong>
          <p>${money(item.price)}</p>
          ${qtyMarkup(item.id, item.qty)}
        </div>
        <div class="cart-line-actions">
          <p>${money(item.lineTotal)}</p>
          <button class="btn text" type="button" data-remove="${item.id}">Remove</button>
        </div>
      </div>
    `).join('');
  }

  if (total) total.textContent = money(getSubtotal());
  if (note) note.textContent = 'Guest checkout is available. We collect your Alexandria address on the next step.';
  if (button) button.disabled = !items.length;
}

function renderCartPage() {
  const list = $('#cart-page-items');
  const total = $('#cart-page-total');
  const button = $('#cart-checkout-btn');
  if (!list) return;

  const items = getCartItems();
  if (!items.length) {
    list.innerHTML = '<div class="empty">Your cart is empty. Add a blend to start your order.</div>';
  } else {
    list.innerHTML = items.map(item => `
      <div class="cart-page-row">
        ${imgMarkup(item)}
        <div>
          <strong>${item.name}</strong>
          <p>${item.note}</p>
          ${qtyMarkup(item.id, item.qty)}
        </div>
        <div class="cart-line-actions">
          <p>${money(item.lineTotal)}</p>
          <button class="btn text" type="button" data-remove="${item.id}">Remove</button>
        </div>
      </div>
    `).join('');
  }

  if (total) total.textContent = money(getSubtotal());
  if (button) button.disabled = !items.length;
}

function renderProductDetail() {
  const shell = $('#product-detail');
  if (!shell) return;

  const product = getProduct(new URLSearchParams(window.location.search).get('id')) || products[0];
  document.title = `Veloura Spice | ${product.name}`;

  shell.innerHTML = `
    <div class="product-detail-card">
      <div class="product-detail-media">
        ${imgMarkup(product, 'product-detail-image')}
      </div>
      <div class="product-detail-copy">
        <p class="eyebrow">${product.badge}</p>
        <h1>${product.name}</h1>
        <p class="detail-price">${money(product.price)}</p>
        <p class="detail-story">${product.story}</p>
        <div class="detail-points">
          <span>${product.weight}</span>
          <span>Heat: ${product.heat}</span>
          <span>Alexandria dispatch</span>
        </div>
        <div class="detail-qty">
          <button type="button" data-detail-step="-1">-</button>
          <input id="detail-qty" type="number" min="1" value="1">
          <button type="button" data-detail-step="1">+</button>
        </div>
        <div class="detail-actions">
          <button class="btn primary" type="button" data-add-detail="${product.id}">Add to cart</button>
          <button class="btn gold-outline" type="button" data-buy-detail="${product.id}">Buy now</button>
        </div>
      </div>
    </div>
    <div class="detail-columns">
      <article class="detail-panel">
        <h3>Ingredients</h3>
        <ul>${product.ingredients.map(item => `<li>${item}</li>`).join('')}</ul>
      </article>
      <article class="detail-panel">
        <h3>Best with</h3>
        <ul>${product.bestWith.map(item => `<li>${item}</li>`).join('')}</ul>
      </article>
      <article class="detail-panel">
        <h3>Why people buy it</h3>
        <p>${product.note}</p>
        <p>Gift-ready packaging, a clean blend, and a flavor profile that feels easy to use at home.</p>
      </article>
    </div>
  `;
}

function renderCheckout() {
  const form = $('#checkout-form');
  const itemsBox = $('#checkout-items');
  const total = $('#checkout-total');
  if (!form || !itemsBox || !total) return;

  const items = getCartItems();
  form.firstName.value = state.guest.firstName || '';
  form.lastName.value = state.guest.lastName || '';
  form.phone.value = state.guest.phone || '';
  form.email.value = state.guest.email || '';
  form.city.value = state.guest.city || '';
  form.address.value = state.guest.address || '';
  form.notes.value = state.guest.notes || '';

  if (!items.length) {
    itemsBox.innerHTML = '<div class="empty">Your cart is empty. Add products before checkout.</div>';
    total.textContent = money(0);
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  itemsBox.innerHTML = items.map(item => `
    <div class="checkout-item">
      ${imgMarkup(item)}
      <div>
        <strong>${item.name}</strong>
        <p>${item.qty} x ${money(item.price)}</p>
      </div>
      <strong>${money(item.lineTotal)}</strong>
    </div>
  `).join('');
  total.textContent = money(getSubtotal());
  form.querySelector('button[type="submit"]').disabled = false;

  form.onsubmit = event => {
    event.preventDefault();
    const formData = new FormData(form);
    state.guest = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      city: formData.get('city'),
      address: formData.get('address'),
      notes: formData.get('notes')
    };

    state.lastOrder = {
      number: `VLX-${Date.now().toString().slice(-6)}`,
      name: `${state.guest.firstName} ${state.guest.lastName}`.trim(),
      phone: state.guest.phone,
      email: state.guest.email || 'Not provided',
      city: state.guest.city,
      address: state.guest.address,
      payment: formData.get('payment'),
      total: getSubtotal(),
      items
    };

    save();
    if (state.lastOrder.payment === 'InstaPay') {
      window.open(instaPayUrl, '_blank', 'noopener');
    }
    state.cart = [];
    save();
    window.location.href = 'success.html';
  };
}

function renderSuccess() {
  const card = $('#success-card');
  if (!card) return;

  if (!state.lastOrder) {
    card.innerHTML = `
      <div class="auth-card">
        <h2>No recent order found</h2>
        <p>Your order confirmation will appear here after checkout.</p>
        <a class="btn primary" href="products.html">Back to products</a>
      </div>
    `;
    return;
  }

  card.innerHTML = `
    <p class="eyebrow">Order confirmed</p>
    <h1>Thanks, ${state.lastOrder.name.split(' ')[0]}.</h1>
    <p class="detail-story">Your order has been recorded and our Alexandria team will follow up on delivery details shortly.</p>
    <div class="success-grid">
      <div><strong>Order Number</strong><span>${state.lastOrder.number}</span></div>
      <div><strong>Payment</strong><span>${state.lastOrder.payment}</span></div>
      <div><strong>Zone</strong><span>${state.lastOrder.city}</span></div>
      <div><strong>Total</strong><span>${money(state.lastOrder.total)}</span></div>
    </div>
    <div class="success-actions">
      <a class="btn primary" href="products.html">Shop More</a>
      <a class="btn gold-outline" href="index.html">Back Home</a>
    </div>
  `;
}

function updateNav() {
  $$('[data-cart-count]').forEach(node => {
    node.textContent = cartCount();
  });
}

function openCart() {
  if ($('#cart-drawer') && $('#backdrop')) {
    $('#cart-drawer').classList.add('open');
    $('#backdrop').classList.add('show');
  }
}

function closeCart() {
  if ($('#cart-drawer') && $('#backdrop')) {
    $('#cart-drawer').classList.remove('open');
    $('#backdrop').classList.remove('show');
  }
}

function goToCheckout() {
  if (!cartCount()) return;
  window.location.href = 'checkout.html';
}

function mountWhatsApp() {
  if ($('.whatsapp-float')) return;
  const link = document.createElement('a');
  link.className = 'whatsapp-float';
  link.href = whatsappUrl;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.setAttribute('aria-label', 'WhatsApp Veloura');
  link.innerHTML = '<i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span>';
  document.body.appendChild(link);
}

function syncUI() {
  updateNav();
  renderProductGrids();
  renderMiniCart();
  renderCartPage();
  renderProductDetail();
  renderCheckout();
  renderSuccess();
}

document.addEventListener('click', event => {
  const add = event.target.closest('[data-add]');
  if (add) {
    addToCart(add.dataset.add);
    if ($('#cart-drawer')) openCart();
    return;
  }

  const qty = event.target.closest('[data-qty]');
  if (qty) {
    changeQty(qty.dataset.qty, Number(qty.dataset.step));
    return;
  }

  const remove = event.target.closest('[data-remove]');
  if (remove) {
    setQty(remove.dataset.remove, 0);
    return;
  }

  const detailStep = event.target.closest('[data-detail-step]');
  if (detailStep) {
    const input = $('#detail-qty');
    const next = Math.max(1, Number(input.value || 1) + Number(detailStep.dataset.detailStep));
    input.value = next;
    return;
  }

  const addDetail = event.target.closest('[data-add-detail]');
  if (addDetail) {
    const qtyInput = $('#detail-qty');
    addToCart(addDetail.dataset.addDetail, Math.max(1, Number(qtyInput?.value || 1)));
    window.location.href = 'cart.html';
    return;
  }

  const buyDetail = event.target.closest('[data-buy-detail]');
  if (buyDetail) {
    const qtyInput = $('#detail-qty');
    addToCart(buyDetail.dataset.buyDetail, Math.max(1, Number(qtyInput?.value || 1)));
    window.location.href = 'checkout.html';
    return;
  }

  if (event.target.closest('#cart-btn')) {
    openCart();
    return;
  }

  if (event.target.closest('#close-cart') || event.target.closest('#backdrop')) {
    closeCart();
    return;
  }

  if (event.target.closest('#checkout-btn') || event.target.closest('#cart-checkout-btn')) {
    goToCheckout();
  }
});

const newsletterForm = $('#newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', event => {
    event.preventDefault();
    const message = $('#form-message');
    if (!newsletterForm.email.value.trim()) return;
    if (message) {
      message.textContent = 'Thanks for subscribing.';
      message.style.color = '#fff7ef';
    }
    newsletterForm.reset();
  });
}

const hamburger = $('#hamburger');
const navMenu = $('#nav-menu');
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => navMenu.classList.toggle('open'));
  $$('#nav-menu a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('open'));
  });
}

mountWhatsApp();
syncUI();


