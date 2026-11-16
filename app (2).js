// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================
const SUPABASE_URL = 'https://vgbywfzrggecsbafwwej.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Pav2SleitVosooTmwu0vJw_PdYH78mZ';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado global da aplicação
let allProducts = [];
let cart = [];
let currentCategory = 'Todos';
let storeSettings = {
  pix_code: '00020126360014BR.GOV.BCB.PIX0114+55219775346745204000053039865802BR5925Flagna Alexandre da Silva6009SAO PAULO62140510e8mVSSDlBj6304B0EE',
  whatsapp: '5521977534674',
  address: 'Av. Engenheiro Assis Ribeiro, 15 - Marechal Hermes, Rio de Janeiro - RJ',
  hours: '09h às 19h'
};

const ORDER_STATUSES = [
  'Recebido',
  'Aguardando pagamento',
  'Pagamento confirmado',
  'Em preparação',
  'Pronto para retirada',
  'Entregue',
  'Cancelado'
];

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadProducts();
  checkSession();
});

// ==========================================
// 2. CARREGAMENTO DE DADOS DA LOJA
// ==========================================
async function loadSettings() {
  const { data } = await supabaseClient.from('store_settings').select('*').eq('id', 1).single();
  if (data) {
    storeSettings = data;
    if (data.logo_url) {
      document.getElementById('header-logo').src = data.logo_url;
    }
    document.getElementById('set-pix').value = data.pix_code || '';
    document.getElementById('set-whatsapp').value = data.whatsapp || '';
    document.getElementById('set-address').value = data.address || '';
    document.getElementById('set-hours').value = data.hours || '';
  }
}

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('is_featured', { ascending: false })
    .order('category', { ascending: true });

  if (error) {
    console.error('Erro ao carregar produtos:', error);
    return;
  }

  allProducts = data || [];
  renderProducts();
  renderAdminProducts();
}

// ==========================================
// 3. VITRINE, BUSCA E FILTROS (CLIENTE)
// ==========================================
function setCategory(cat, btnElement) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btnElement.classList.add('active');
  filterProducts();
}

function filterProducts() {
  const term = document.getElementById('search-input').value.toLowerCase();
  const filtered = allProducts.filter(p => {
    if (!p.is_active) return false;
    const matchesSearch = p.name.toLowerCase().includes(term) || 
                          p.category.toLowerCase().includes(term) || 
                          (p.description && p.description.toLowerCase().includes(term));
    
    if (currentCategory === 'Todos') return matchesSearch;
    if (currentCategory === 'Destaques') return matchesSearch && p.is_featured;
    return matchesSearch && p.category.toLowerCase() === currentCategory.toLowerCase();
  });

  renderProducts(filtered);
}

function renderProducts(list = allProducts.filter(p => p.is_active)) {
  const grid = document.getElementById('products-grid');
  if (list.length === 0) {
    grid.innerHTML = '<p>Nenhum doce encontrado com esse filtro.</p>';
    return;
  }

  grid.innerHTML = list.map(prod => {
    const finalPrice = prod.promo_price ? prod.promo_price : prod.price;
    const imgHtml = prod.image_url 
      ? `<img src="${prod.image_url}" alt="${prod.name}" class="product-img">`
      : `<div class="product-placeholder">🧁</div>`;

    return `
      <div class="product-card">
        <div>
          ${imgHtml}
          <div class="product-info">
            <span class="product-tag">${prod.category} ${prod.is_featured ? '• ⭐ Destaque' : ''}</span>
            <h3>${prod.name}</h3>
            <p class="product-desc">${prod.description || 'Feito artesanalmente com ingredientes selecionados.'}</p>
          </div>
        </div>
        <div class="product-bottom">
          <div class="price-box">
            ${prod.promo_price ? `<span class="old-price">R$ ${Number(prod.price).toFixed(2).replace('.', ',')}</span>` : ''}
            <span class="current-price">R$ ${Number(finalPrice).toFixed(2).replace('.', ',')}</span>
          </div>
          <button class="btn-primary" onclick="addToCart('${prod.id}')">+ Adicionar</button>
        </div>
      </div>
    `;
  }).join('');
}

// ==========================================
// 4. CARRINHO E FINALIZAÇÃO DE PEDIDO
// ==========================================
function addToCart(productId) {
  const prod = allProducts.find(p => p.id === productId);
  if (!prod) return;

  const price = prod.promo_price ? Number(prod.promo_price) : Number(prod.price);
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: prod.id, name: `${prod.category} - ${prod.name}`, price, qty: 1 });
  }

  updateCartUI();
  toggleCart(true);
}

function updateQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  updateCartUI();
}

function updateCartUI() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  document.getElementById('cart-count').innerText = count;
  document.getElementById('cart-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;

  const container = document.getElementById('cart-items');
  if (cart.length === 0) {
    container.innerHTML = '<p style="color:#6e627d; text-align:center; margin-top:20px;">Seu carrinho está vazio.</p>';
    return;
  }

  container.innerHTML = cart.map((item, idx) => `
    <div class="cart-item">
      <div>
        <strong>${item.name}</strong><br>
        <small>R$ ${(item.price * item.qty).toFixed(2).replace('.', ',')}</small>
      </div>
      <div class="qty-controls">
        <button onclick="updateQty(${idx}, -1)">-</button>
        <span>${item.qty}</span>
        <button onclick="updateQty(${idx}, 1)">+</button>
      </div>
    </div>
  `).join('');
}

function toggleCart(forceOpen = null) {
  const drawer = document.getElementById('cart-drawer');
  if (forceOpen === true) drawer.classList.remove('hidden');
  else if (forceOpen === false) drawer.classList.add('hidden');
  else drawer.classList.toggle('hidden');
}

async function submitOrder(e) {
  e.preventDefault();
  if (cart.length === 0) {
    alert('Adicione pelo menos um doce ao carrinho.');
    return;
  }

  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.replace(/\D/g, '');
  const paymentMethod = document.getElementById('pay-method').value;
  const notes = document.getElementById('order-notes').value.trim();
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const { data, error } = await supabaseClient
    .from('orders')
    .insert([{
      customer_name: name,
      customer_phone: phone,
      items: cart,
      total_amount: totalAmount,
      payment_method: paymentMethod,
      notes: notes,
      status: paymentMethod === 'PIX' ? 'Aguardando pagamento' : 'Recebido'
    }])
    .select()
    .single();

  if (error) {
    alert('Erro ao registrar pedido. Tente novamente.');
    console.error(error);
    return;
  }

  const itemsText = cart.map(i => `• ${i.qty}x ${i.name} (R$ ${(i.price * i.qty).toFixed(2)})`).join('\n');
  const waMessage = encodeURIComponent(
    `Olá, *Doces da Fla*! Acabei de fazer um pedido pelo site:\n\n` +
    `*Cliente:* ${name}\n` +
    `*Itens:*\n${itemsText}\n\n` +
    `*Total:* R$ ${totalAmount.toFixed(2).replace('.', ',')}\n` +
    `*Pagamento:* ${paymentMethod}\n` +
    (notes ? `*Obs:* ${notes}\n` : '') +
    `\nAguardo a confirmação para retirada!`
  );

  document.getElementById('whatsapp-confirm-btn').href = `https://wa.me/${storeSettings.whatsapp}?text=${waMessage}`;
  document.getElementById('order-confirm-msg').innerText = `Obrigado, ${name}! Seu pedido de R$ ${totalAmount.toFixed(2).replace('.', ',')} foi salvo.`;

  const pixBox = document.getElementById('pix-payment-box');
  if (paymentMethod === 'PIX') {
    pixBox.classList.remove('hidden');
    document.getElementById('pix-copy-text').value = storeSettings.pix_code;
    const qrDiv = document.getElementById('qrcode-container');
    qrDiv.innerHTML = '';
    new QRCode(qrDiv, {
      text: storeSettings.pix_code,
      width: 160,
      height: 160
    });
  } else {
    pixBox.classList.add('hidden');
  }

  cart = [];
  updateCartUI();
  toggleCart(false);
  document.getElementById('pix-modal').classList.remove('hidden');
}

function copyPixCode() {
  const copyText = document.getElementById('pix-copy-text');
  copyText.select();
  navigator.clipboard.writeText(copyText.value);
  alert('Código PIX copiado! Agora cole no aplicativo do seu banco.');
}

function closePixModal() {
  document.getElementById('pix-modal').classList.add('hidden');
}

// ==========================================
// 5. ACOMPANHAMENTO DE PEDIDOS (CLIENTE)
// ==========================================
function openTrackModal() {
  document.getElementById('track-modal').classList.remove('hidden');
}

function closeTrackModal() {
  document.getElementById('track-modal').classList.add('hidden');
}

async function trackOrders() {
  const phone = document.getElementById('track-phone-input').value.replace(/\D/g, '');
  if (!phone) return;

  const { data } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('customer_phone', phone)
    .order('created_at', { ascending: false });

  const container = document.getElementById('track-results');
  if (!data || data.length === 0) {
    container.innerHTML = '<p>Nenhum pedido encontrado para este número.</p>';
    return;
  }

  container.innerHTML = data.map(o => `
    <div class="order-card">
      <div class="order-top">
        <strong>${new Date(o.created_at).toLocaleDateString('pt-BR')}</strong>
        <span class="status-badge">${o.status}</span>
      </div>
      <p><small>${o.items.map(i => `${i.qty}x ${i.name}`).join(', ')}</small></p>
      <strong>Total: R$ ${Number(o.total_amount).toFixed(2).replace('.', ',')} (${o.payment_method})</strong>
    </div>
  `).join('');
}

// ==========================================
// 6. ÁREA ADMINISTRATIVA (DONO E NAMORADA)
// ==========================================
function showView(view) {
  document.getElementById('store-view').classList.toggle('hidden', view !== 'store');
  document.getElementById('admin-view').classList.toggle('hidden', view !== 'admin');
  if (view === 'admin') checkSession();
}

async function checkSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) {
    document.getElementById('admin-login-box').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    document.getElementById('logged-user-email').innerText = `Logado como: ${session.user.email}`;
    loadAdminData();
  } else {
    document.getElementById('admin-login-box').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    alert('E-mail ou senha inválidos.');
  } else {
    checkSession();
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
  checkSession();
}

function switchAdminTab(tabName, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
  document.getElementById(`tab-${tabName}`).classList.remove('hidden');
}

async function loadAdminData() {
  const { data: orders } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (!orders) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const monthStr = new Date().toISOString().slice(0, 7);
  let revToday = 0;
  let revMonth = 0;
  let pendingCount = 0;
  const itemCounter = {};
  const customersMap = {};

  orders.forEach(o => {
    const isCanceled = o.status === 'Cancelado';
    if (!isCanceled) {
      if (o.created_at.startsWith(todayStr)) revToday += Number(o.total_amount);
      if (o.created_at.startsWith(monthStr)) revMonth += Number(o.total_amount);
      o.items.forEach(i => {
        itemCounter[i.name] = (itemCounter[i.name] || 0) + i.qty;
      });
    }
    if (['Recebido', 'Aguardando pagamento', 'Em preparação'].includes(o.status)) {
      pendingCount++;
    }
    if (!customersMap[o.customer_phone]) {
      customersMap[o.customer_phone] = { name: o.customer_name, phone: o.customer_phone, count: 0, total: 0 };
    }
    customersMap[o.customer_phone].count += 1;
    if (!isCanceled) customersMap[o.customer_phone].total += Number(o.total_amount);
  });

  const sortedItems = Object.entries(itemCounter).sort((a, b) => b[1] - a[1]);
  const topItem = sortedItems.length > 0 ? sortedItems[0] : null;

  document.getElementById('metric-today').innerText = `R$ ${revToday.toFixed(2).replace('.', ',')}`;
  document.getElementById('metric-month').innerText = `R$ ${revMonth.toFixed(2).replace('.', ',')}`;
  document.getElementById('metric-pending').innerText = pendingCount;
  document.getElementById('metric-top').innerText = topItem ? `${topItem[0]} (${topItem[1]}x)` : '-';

  document.getElementById('admin-orders-list').innerHTML = orders.map(o => `
    <div class="order-card">
      <div class="order-top">
        <div>
          <strong>${o.customer_name}</strong> (${o.customer_phone})<br>
          <small>${new Date(o.created_at).toLocaleString('pt-BR')} • Pagamento: <b>${o.payment_method}</b></small>
        </div>
        <select onchange="updateOrderStatus('${o.id}', this.value)" style="width:auto;">
          ${ORDER_STATUSES.map(st => `<option value="${st}" ${o.status === st ? 'selected' : ''}>${st}</option>`).join('')}
        </select>
      </div>
      <p style="margin:8px 0;">${o.items.map(i => `• ${i.qty}x ${i.name}`).join('<br>')}</p>
      ${o.notes ? `<p><small><b>Obs:</b> ${o.notes}</small></p>` : ''}
      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
        <strong>Total: R$ ${Number(o.total_amount).toFixed(2).replace('.', ',')}</strong>
        <a href="https://wa.me/55${o.customer_phone}?text=${encodeURIComponent(`Olá ${o.customer_name}! Aqui é da Doces da Fla. O status do seu pedido agora é: *${o.status}*.`)}" target="_blank" class="btn-secondary">
          Avisar no WhatsApp
        </a>
      </div>
    </div>
  `).join('');

  document.getElementById('admin-customers-list').innerHTML = Object.values(customersMap).map(c => `
    <div class="admin-prod-item">
      <div>
        <strong>${c.name}</strong><br>
        <small>WhatsApp: ${c.phone} • ${c.count} pedido(s)</small>
      </div>
      <strong>R$ ${c.total.toFixed(2).replace('.', ',')}</strong>
    </div>
  `).join('');
}

async function updateOrderStatus(orderId, newStatus) {
  await supabaseClient.from('orders').update({ status: newStatus }).eq('id', orderId);
  loadAdminData();
}

// ==========================================
// 7. GESTÃO DE PRODUTOS E CONFIGURAÇÕES
// ==========================================
async function uploadImage(file) {
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
  const { error } = await supabaseClient.storage.from('doces-images').upload(fileName, file);
  if (error) {
    alert('Erro ao enviar imagem.');
    return null;
  }
  const { data } = supabaseClient.storage.from('doces-images').getPublicUrl(fileName);
  return data.publicUrl;
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prod-id').value;
  const fileInput = document.getElementById('prod-image');
  let imageUrl = null;

  if (fileInput.files.length > 0) {
    imageUrl = await uploadImage(fileInput.files[0]);
  }

  const payload = {
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    price: parseFloat(document.getElementById('prod-price').value),
    promo_price: document.getElementById('prod-promo').value ? parseFloat(document.getElementById('prod-promo').value) : null,
    description: document.getElementById('prod-desc').value,
    is_featured: document.getElementById('prod-featured').checked,
    is_active: document.getElementById('prod-active').checked
  };

  if (imageUrl) payload.image_url = imageUrl;

  if (id) {
    await supabaseClient.from('products').update(payload).eq('id', id);
  } else {
    await supabaseClient.from('products').insert([payload]);
  }

  resetProductForm();
  await loadProducts();
  alert('Produto salvo com sucesso!');
}

function editProduct(id) {
  const p = allProducts.find(item => item.id === id);
  if (!p) return;
  document.getElementById('product-form-title').innerText = 'Editar Doce';
  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-name').value = p.name;
  document.getElementById('prod-category').value = p.category;
  document.getElementById('prod-price').value = p.price;
  document.getElementById('prod-promo').value = p.promo_price || '';
  document.getElementById('prod-desc').value = p.description || '';
  document.getElementById('prod-featured').checked = p.is_featured;
  document.getElementById('prod-active').checked = p.is_active;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteProduct(id) {
  if (!confirm('Tem certeza que deseja excluir este doce?')) return;
  await supabaseClient.from('products').delete().eq('id', id);
  await loadProducts();
}

function resetProductForm() {
  document.getElementById('product-form-title').innerText = 'Adicionar Novo Doce';
  document.getElementById('prod-id').value = '';
  document.getElementById('prod-name').value = '';
  document.getElementById('prod-category').value = '';
  document.getElementById('prod-price').value = '';
  document.getElementById('prod-promo').value = '';
  document.getElementById('prod-desc').value = '';
  document.getElementById('prod-image').value = '';
  document.getElementById('prod-featured').checked = false;
  document.getElementById('prod-active').checked = true;
}

function renderAdminProducts() {
  const container = document.getElementById('admin-products-list');
  container.innerHTML = allProducts.map(p => `
    <div class="admin-prod-item">
      <div>
        <strong>${p.category} - ${p.name}</strong> ${!p.is_active ? '(Oculto)' : ''}<br>
        <small>R$ ${Number(p.price).toFixed(2)} ${p.promo_price ? `→ Promo: R$ ${Number(p.promo_price).toFixed(2)}` : ''}</small>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn-secondary" onclick="editProduct('${p.id}')">Editar</button>
        <button class="btn-danger" onclick="deleteProduct('${p.id}')">Excluir</button>
      </div>
    </div>
  `).join('');
}

async function saveSettings(e) {
  e.preventDefault();
  const logoInput = document.getElementById('set-logo');
  let logoUrl = storeSettings.logo_url;

  if (logoInput.files.length > 0) {
    logoUrl = await uploadImage(logoInput.files[0]);
  }

  const updates = {
    logo_url: logoUrl,
    pix_code: document.getElementById('set-pix').value,
    whatsapp: document.getElementById('set-whatsapp').value,
    address: document.getElementById('set-address').value,
    hours: document.getElementById('set-hours').value
  };

  await supabaseClient.from('store_settings').update(updates).eq('id', 1);
  await loadSettings();
  alert('Configurações atualizadas!');
}
