/* script.js
  - Produits dans un tableau (modifiable)
  - Filtres, recherche, product modal, cart avec localStorage persist
*/

/* ---------------------------
   Données produits (exemples)
   --------------------------- */
const PRODUCTS = [
  // VR
  { id: 'vr-1', title: 'Casque VR Pro X', price: 299, category: 'vr', img: 'https://tse4.mm.bing.net/th/id/OIP.w79O6VTSP9afkbkCM31eFwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'vr-2', title: 'Casque VR Lite', price: 149, category: 'vr', img: 'https://www.tomshardware.fr/content/uploads/sites/3/2024/01/Longlu-VR.jpg', desc: 'Léger et confortable, idéal découverte.' },

  // Cars
  { id: 'car-1', title: 'jetour dashing 2025', price: 450000, category: 'cars', img: 'https://jetour.grupolostres.com/hubfs/Dashing-lightgray-2024.png', desc: 'V12 • 770 ch • 0-100 km/h en 2.8s' },
  { id: 'car-2', title: 'Lamborghini Huracán', price: 230000, category: 'cars', img: 'https://tse4.mm.bing.net/th/id/OIP.yE6FxpU_3YfC8EOeHoixqgHaE5?rs=1&pid=ImgDetMain&o=7&rm=3' },

  // Watches
  { id: 'watch-1', title: 'Montre Élégance 38', price: 1299, category: 'watches', img: 'https://www.omegawatches.com/media/catalog/product/o/m/omega-speedmaster-38-co-axial-chronometer-chronograph-38-mm-32415385063001-0fa8a0.png', desc: 'Mouvement automatique • Cadran saphir' },
  { id: 'watch-2', title: 'Montre Sport 45', price: 799, category: 'watches', img: 'https://www.mgaffaires.com/8948-thickbox_default/montre-forerunner-4545s-garmin.jpg' },

  // Jewelry
  { id: 'jew-1', title: 'Chainette or 18K (homme)', price: 399, category: 'jewelry', img: 'https://tse2.mm.bing.net/th/id/OIP.8tmJffwE2CwKg8YCI780aAAAAA?rs=1&pid=ImgDetMain&o=7&rm=3', desc: 'Chaîne solide en or 18K.' },
  { id: 'jew-2', title: 'Chainette or 18K (femme)', price: 459, category: 'jewelry', img: 'https://www.lujparis.com/wp-content/uploads/2022/06/chaine-de-taille-brigitte-luj-paris-bijou-2.jpg', desc: 'Design fin et élégant.' },
  { id: 'jew-3', title: 'Chainette diamant', price: 899, category: 'jewelry', img: 'https://ocarat.twic.pics/224538-thickbox_default/bague-diamant-enchaine-009ct-or-jaune-18k-ocarat.jpg', desc: 'Diamants étincelants, finition premium.' },
  { id: 'jew-4', title: 'Chainette argent', price: 199, category: 'jewelry', img: 'https://tse4.mm.bing.net/th/id/OIP.3gNOXZXfA61it-KzJkBxIgHaHa?w=1024&h=1024&rs=1&pid=ImgDetMain&o=7&rm=3', desc: 'Argent massif, design minimaliste.' },
];

/* ---------------------------
   State & cart persistence
   --------------------------- */
let cart = []; // {id, qty}
const STORAGE_CART_KEY = 'cleophas_cart_v1';
const STORAGE_THEME_KEY = 'cleophas_theme_v1';

/* ---------------------------
   Utils
   --------------------------- */
function formatPrice(n){
  if (Number.isInteger(n)) return '€' + n.toLocaleString();
  return '€' + n.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
}

/* ---------------------------
   Render products grid
   --------------------------- */
const gridEl = document.getElementById('products-grid');
const searchInput = document.getElementById('search');
const categorySelect = document.getElementById('category-select');

function renderProducts(products){
  gridEl.innerHTML = '';
  if (!products.length){
    gridEl.innerHTML = '<p class="muted" style="padding:20px">Aucun produit trouvé.</p>';
    return;
  }
  products.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-media">
        <img src="${p.img}" alt="${escapeHtml(p.title)}">
      </div>
      <div class="product-body">
        <div class="product-title">${escapeHtml(p.title)}</div>
        <div class="meta muted">${escapeHtml(p.desc)}</div>
        <div class="price">${formatPrice(p.price)}</div>
        <div class="card-actions">
          <div class="left">
            <button class="outline" onclick="openProduct(event,'${p.id}')">Voir</button>
            <button class="outline" onclick="addToCartFromCard(event,'${p.id}')">Ajouter</button>
          </div>
          <div class="right muted">${capitalize(p.category)}</div>
        </div>
      </div>
    `;
    gridEl.appendChild(card);
  });
}

/* helpers */
function escapeHtml(s){ return (s+'').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m] }); }
function capitalize(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : '' }

/* ---------------------------
   Filters & search
   --------------------------- */
function applyFilters(){
  const q = (searchInput.value || '').trim().toLowerCase();
  const cat = categorySelect.value;
  let list = PRODUCTS.slice();
  if (cat && cat !== 'all') list = list.filter(p => p.category === cat);
  if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
  renderProducts(list);
}
searchInput.addEventListener('input', debounce(applyFilters, 220));
categorySelect.addEventListener('change', applyFilters);
function filterBy(cat){ categorySelect.value = cat; applyFilters(); }
function resetFilters(){ categorySelect.value = 'all'; searchInput.value = ''; applyFilters(); }

/* ---------------------------
   Product modal (page produit)
   --------------------------- */
const modal = document.getElementById('product-modal');
const modalImg = document.getElementById('modal-img');
const modalName = document.getElementById('modal-name');
const modalDesc = document.getElementById('modal-desc');
const modalPrice = document.getElementById('modal-price');
const modalCategory = document.getElementById('modal-category');
const modalQty = document.getElementById('modal-qty');
const modalAdd = document.getElementById('modal-add');

function openProduct(e, productId){
  if (e) e.stopPropagation();
  const p = PRODUCTS.find(x=>x.id===productId);
  if (!p) return;
  modalImg.src = p.img;
  modalName.textContent = p.title;
  modalDesc.textContent = p.desc;
  modalPrice.textContent = formatPrice(p.price);
  modalCategory.textContent = capitalize(p.category);
  modalQty.value = 1;
  modalAdd.onclick = () => {
    const qty = Math.max(1, Number(modalQty.value) || 1);
    addToCart(productId, qty);
    closeProductModal();
    openCart();
  };
  modal.classList.add('open');
  modal.setAttribute('aria-hidden','false');
}
function closeProductModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden','true');
}

/* close modal when clicking outside panel */
modal.addEventListener('click', (ev) => {
  if (ev.target === modal) closeProductModal();
});

/* ---------------------------
   Cart management
   --------------------------- */
const cartBtnCount = document.getElementById('cart-count');
const cartSidebar = document.getElementById('cart');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');

function loadCart(){
  try{
    const raw = localStorage.getItem(STORAGE_CART_KEY);
    cart = raw ? JSON.parse(raw) : [];
  }catch(e){ cart = []; }
  refreshCartUI();
}
function saveCart(){
  localStorage.setItem(STORAGE_CART_KEY, JSON.stringify(cart));
}

/* Add to cart helpers */
function addToCartFromCard(e, id){
  e.stopPropagation();
  addToCart(id, 1);
  // small visual feedback
  const btn = e.currentTarget;
  btn.classList.add('added');
  setTimeout(()=>btn.classList.remove('added'), 500);
}

function addToCart(id, qty=1){
  const idx = cart.findIndex(c => c.id === id);
  if (idx >= 0) cart[idx].qty += qty;
  else cart.push({ id, qty });
  saveCart();
  refreshCartUI();
}

/* change qty */
function changeQty(id, delta){
  const idx = cart.findIndex(c => c.id === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx,1);
  saveCart();
  refreshCartUI();
}

/* remove */
function removeFromCart(id){
  cart = cart.filter(c => c.id !== id);
  saveCart();
  refreshCartUI();
}

/* clear & checkout */
function clearCart(){
  if (!confirm('Vider le panier ?')) return;
  cart = [];
  saveCart();
  refreshCartUI();
}
function checkout(){
  if (!cart.length) { alert('Votre panier est vide.'); return; }
  // Simulation
  alert('Simulation de commande — Merci ! (Commande non envoyée, projet démo)');
  cart = [];
  saveCart();
  refreshCartUI();
}

/* UI refresh */
function refreshCartUI(){
  // build items
  cartItemsEl.innerHTML = '';
  let total = 0, count = 0;
  cart.forEach(item => {
    const p = PRODUCTS.find(x => x.id === item.id);
    if (!p) return;
    const line = document.createElement('div');
    line.className = 'cart-row';
    line.innerHTML = `
      <img src="${p.img}" alt="${escapeHtml(p.title)}">
      <div style="flex:1">
        <div style="font-weight:700">${escapeHtml(p.title)}</div>
        <div class="muted" style="font-size:13px">Prix: ${formatPrice(p.price)} × ${item.qty}</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:800;color:var(--gold)">${formatPrice(p.price * item.qty)}</div>
        <div style="margin-top:8px;display:flex;gap:6px;justify-content:flex-end">
          <button class="outline" onclick="changeQty('${item.id}',-1)">-</button>
          <button class="outline" onclick="changeQty('${item.id}',1)">+</button>
          <button class="outline" onclick="removeFromCart('${item.id}')">Suppr</button>
        </div>
      </div>
    `;
    cartItemsEl.appendChild(line);
    total += p.price * item.qty;
    count += item.qty;
  });
  cartTotalEl.textContent = formatPrice(total);
  cartBtnCount.textContent = count;
  // persist count also in localStorage optional
}

/* open / close cart */
function openCart(){
  cartSidebar.classList.add('open');
  cartSidebar.setAttribute('aria-hidden','false');
}
function closeCart(){
  cartSidebar.classList.remove('open');
  cartSidebar.setAttribute('aria-hidden','true');
}

/* ---------------------------
   Theme toggle (dark / light)
   --------------------------- */
const themeToggle = document.getElementById('theme-toggle');
function initTheme(){
  const saved = localStorage.getItem(STORAGE_THEME_KEY);
  if (saved === 'light'){ document.documentElement.classList.add('light-theme'); document.body.classList.add('light-theme'); themeToggle.textContent = '☾'; }
  else { document.documentElement.classList.remove('light-theme'); document.body.classList.remove('light-theme'); themeToggle.textContent = '☼'; }
}
themeToggle.addEventListener('click', ()=>{
  const isLight = document.body.classList.toggle('light-theme');
  if (isLight) { localStorage.setItem(STORAGE_THEME_KEY,'light'); themeToggle.textContent = '☾'; }
  else { localStorage.removeItem(STORAGE_THEME_KEY); themeToggle.textContent = '☼'; }
});

/* ---------------------------
   Initialization
   --------------------------- */
function init(){
  renderProducts(PRODUCTS);
  loadCart();
  initTheme();
  applyFilters(); // ensure filters applied
}
init();

/* ---------------------------
   Small helpers: debounce
   --------------------------- */
function debounce(fn, wait=200){
  let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
}

/* ---------------------------
   Accessibility helpers
   --------------------------- */
/* Keyboard: close modal on ESC */
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape'){
    closeProductModal();
    closeCart();
  }
});

/* ---------------------------
   Extra: open product by id directly (used by "Voir")
   --------------------------- */
function openProductById(id){
  openProduct(null, id);
}

/* Expose to global for inline onclicks */
window.openProduct = openProduct;
window.addToCartFromCard = addToCartFromCard;
window.openCart = openCart;
window.closeCart = closeCart;
window.clearCart = clearCart;
window.checkout = checkout;
window.filterBy = filterBy;
window.resetFilters = resetFilters;
