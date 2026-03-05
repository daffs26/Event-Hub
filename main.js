// ================================================================
// PAGE NAVIGATION — show/hide sections
// ================================================================
function showPage(page) {
  const pages = ['home', 'list', 'detail', 'form'];
  pages.forEach(p => {
    const el = document.getElementById('page-' + p);
    if (el) el.style.display = p === page ? '' : 'none';
  });

  // Update active nav link
  document.querySelectorAll('.nav-page').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  // Re-run fade-up animations for new page
  setTimeout(() => {
    document.querySelectorAll('#page-' + page + ' .fade-up').forEach((el, i) => {
      el.classList.add('animate');
      el.classList.remove('visible');
      setTimeout(() => el.classList.add('visible'), i * 80);
    });
  }, 10);

  // Re-init interactive elements for new page
  if (page === 'detail') initQtyControl();
  if (page === 'form') { initTicketSelection(); updateOrderSummary(); }
  if (page === 'list') initFilter();

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ================================================================
// SCROLL ANIMATIONS
// ================================================================
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.1 });

function observeFadeEls() {
  document.querySelectorAll('.fade-up').forEach(el => {
    el.classList.add('animate'); // hide first, then animate in
    fadeObserver.observe(el);
  });
}

// ================================================================
// NAVBAR SCROLL EFFECT
// ================================================================
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    navbar.style.boxShadow = window.scrollY > 50
      ? '0 4px 20px rgba(0,0,0,0.3)'
      : 'none';
  }
});

// ================================================================
// QUANTITY CONTROL (Detail Page)
// ================================================================
function initQtyControl() {
  const minusBtn = document.getElementById('qty-minus');
  const plusBtn  = document.getElementById('qty-plus');
  const qtyDisp  = document.getElementById('qty-display');
  const totalEl  = document.getElementById('total-price');
  if (!minusBtn || !plusBtn) return;

  let qty = 1;

  function getBasePrice() {
    const sel = document.querySelector('#page-detail .ticket-type.selected');
    return sel ? parseInt(sel.dataset.price || 150000) : 150000;
  }

  function updateTotal() {
    const total = qty * getBasePrice();
    if (totalEl) totalEl.textContent = 'Rp ' + total.toLocaleString('id-ID');
  }

  // Remove old listeners by cloning
  const newMinus = minusBtn.cloneNode(true);
  const newPlus  = plusBtn.cloneNode(true);
  minusBtn.parentNode.replaceChild(newMinus, minusBtn);
  plusBtn.parentNode.replaceChild(newPlus, plusBtn);

  newMinus.addEventListener('click', () => {
    if (qty > 1) { qty--; qtyDisp.textContent = qty; updateTotal(); }
  });
  newPlus.addEventListener('click', () => {
    if (qty < 10) { qty++; qtyDisp.textContent = qty; updateTotal(); }
  });

  // Ticket type selection on detail page
  document.querySelectorAll('#page-detail .ticket-type').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('#page-detail .ticket-type').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      updateTotal();
    };
  });

  updateTotal();
}

// ================================================================
// TICKET SELECTION (Form Page)
// ================================================================
function initTicketSelection() {
  document.querySelectorAll('#page-form .ticket-select-card').forEach(card => {
    card.onclick = () => {
      document.querySelectorAll('#page-form .ticket-select-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      updateOrderSummary();
    };
  });
}

// ================================================================
// ORDER SUMMARY UPDATE
// ================================================================
function updateOrderSummary() {
  const selected   = document.querySelector('#page-form .ticket-select-card.selected');
  const subtotalEl = document.getElementById('summary-subtotal');
  const adminEl    = document.getElementById('summary-admin');
  const totalEl    = document.getElementById('summary-total');
  if (!selected || !subtotalEl) return;

  const price = parseInt(selected.dataset.price || 0);
  const admin = Math.round(price * 0.05);
  subtotalEl.textContent = 'Rp ' + price.toLocaleString('id-ID');
  if (adminEl)  adminEl.textContent  = 'Rp ' + admin.toLocaleString('id-ID');
  if (totalEl)  totalEl.textContent  = 'Rp ' + (price + admin).toLocaleString('id-ID');
}

// ================================================================
// FORM VALIDATION & SUBMIT
// ================================================================
function initFormSubmit() {
  const form = document.getElementById('registration-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name  = document.getElementById('full-name');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');

    if (!name.value.trim())                          { showError(name,  'Nama lengkap wajib diisi'); return; }
    if (!email.value.trim() || !isValidEmail(email.value)) { showError(email, 'Email tidak valid');  return; }
    if (!phone.value.trim())                         { showError(phone, 'Nomor HP wajib diisi');     return; }

    const selected = document.querySelector('#page-form .ticket-select-card.selected');
    if (!selected) { alert('Pilih tipe tiket terlebih dahulu'); return; }

    new bootstrap.Modal(document.getElementById('successModal')).show();
  });
}

function showError(input, msg) {
  input.style.borderColor = '#e94560';
  input.focus();
  let err = input.parentNode.querySelector('.err-msg');
  if (!err) {
    err = document.createElement('small');
    err.className = 'err-msg';
    err.style.cssText = 'color:#e94560;font-size:0.78rem;';
    input.parentNode.appendChild(err);
  }
  err.textContent = msg;
  setTimeout(() => { input.style.borderColor = ''; err && err.remove(); }, 3000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ================================================================
// SEARCH & FILTER (List Event Page)
// ================================================================
function initFilter() {
  const searchInput    = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const resultsCount   = document.getElementById('results-count');

  function filterCards() {
    const query    = searchInput    ? searchInput.value.toLowerCase()    : '';
    const category = categoryFilter ? categoryFilter.value               : '';
    let visible = 0;

    document.querySelectorAll('#page-list .event-card-wrapper').forEach(wrapper => {
      const title = (wrapper.dataset.title    || '').toLowerCase();
      const cat   = (wrapper.dataset.category || '');
      const show  = title.includes(query) && (!category || cat === category);
      wrapper.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (resultsCount) resultsCount.textContent = visible;
  }

  if (searchInput)    searchInput.addEventListener('input',  filterCards);
  if (categoryFilter) categoryFilter.addEventListener('change', filterCards);
}

// ================================================================
// INIT ON DOM READY
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Trigger initial fade-up on home page
  observeFadeEls();
  setTimeout(() => {
    document.querySelectorAll('#page-home .fade-up').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 80);
    });
  }, 100);

  initQtyControl();
  initTicketSelection();
  updateOrderSummary();
  initFormSubmit();
  initFilter();
});
