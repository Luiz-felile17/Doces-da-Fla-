
// ==========================================
// DOCES DA FLA - SISTEMA COMPLETO
// SUPABASE + LOJA + WHATSAPP + PIX + ADMIN
// ==========================================


// ==========================================
// 1. CONFIGURAÇÃO DO SUPABASE
// ==========================================

const SUPABASE_URL = 'https://vgbywfzrggecsbafwwej.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_Pav2SleitVosooTmwu0vJw_PdYH78mZ';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================
// 2. ESTADO GLOBAL
// ==========================================

let allProducts = [];
let cart = [];
let currentCategory = 'Todos';

let storeSettings = {
  pix_code: '00020126360014BR.GOV.BCB.PIX0114+55219775346745204000053039865802BR5925Flagna Alexandre da Silva6009SAO PAULO62140510e8mVSSDlBj6304B0EE',
  whatsapp: '5521977534674',
  address: 'Av. Engenheiro Assis Ribeiro, 15 - Marechal Hermes, Rio de Janeiro - RJ',
  hours: '09h às 19h',
  logo_url: null
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


// ==========================================
// 3. FUNÇÕES AUXILIARES
// ==========================================

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function normalizeWhatsApp(number) {
  let phone = String(number || '').replace(/\D/g, '');

  if (phone && !phone.startsWith('55')) {
    phone = '55' + phone;
  }

  return phone;
}


// ==========================================
// 4. INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {

  applyStoreLogo();

  updateCartUI();

  await loadSettings();

  await loadProducts();

  await checkSession();

});


// ==========================================
// 5. SISTEMA DE LOGOTIPO
// ==========================================

function applyStoreLogo(logoUrl = null) {

  const logo = document.getElementById('header-logo');

  if (!logo) return;

  const defaultLogo = './logo.png';

  logo.onerror = function () {

    if (this.src !== new URL(defaultLogo, window.location.href).href) {
      this.src = defaultLogo;
    } else {
      this.style.display = 'none';
    }

  };

  logo.onload = function () {
    this.style.display = 'block';
  };

  logo.src = logoUrl || defaultLogo;

}


// ==========================================
// 6. CARREGAR CONFIGURAÇÕES
// ==========================================

async function loadSettings() {

  const { data, error } = await supabaseClient
    .from('store_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error) {

    console.error('Erro ao carregar configurações:', error);

    applyStoreLogo();

    return;
  }

  if (data) {

    storeSettings = {
      ...storeSettings,
      ...data
    };

    applyStoreLogo(data.logo_url);

    const pix = document.getElementById('set-pix');
    const whatsapp = document.getElementById('set-whatsapp');
    const address = document.getElementById('set-address');
    const hours = document.getElementById('set-hours');

    if (pix) pix.value = data.pix_code || '';

    if (whatsapp) whatsapp.value = data.whatsapp || '';

    if (address) address.value = data.address || '';

    if (hours) hours.value = data.hours || '';

  }

}


// ==========================================
// 7. CARREGAR PRODUTOS
// ==========================================

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
// 8. CATEGORIAS E PESQUISA
// ==========================================

function setCategory(cat, btnElement) {

  currentCategory = cat;

  document.querySelectorAll('.cat-btn').forEach(button => {
    button.classList.remove('active');
  });

  if (btnElement) {
    btnElement.classList.add('active');
  }

  filterProducts();

}


function filterProducts() {

  const searchInput = document.getElementById('search-input');

  const term = searchInput
    ? searchInput.value.toLowerCase().trim()
    : '';

  const filtered = allProducts.filter(product => {

    if (!product.is_active) return false;

    const matchesSearch =
      (product.name || '').toLowerCase().includes(term) ||
      (product.category || '').toLowerCase().includes(term) ||
      (product.description || '').toLowerCase().includes(term);

    if (currentCategory === 'Todos') {
      return matchesSearch;
    }

    if (currentCategory === 'Destaques') {
      return matchesSearch && product.is_featured;
    }

    return matchesSearch &&
      (product.category || '').toLowerCase() ===
      currentCategory.toLowerCase();

  });

  renderProducts(filtered);

}


// ==========================================
// 9. RENDERIZAR PRODUTOS
// ==========================================

function renderProducts(list = allProducts.filter(p => p.is_active)) {

  const grid = document.getElementById('products-grid');

  if (!grid) return;

  if (list.length === 0) {

    grid.innerHTML = '<p>Nenhum doce encontrado com esse filtro.</p>';

    return;
  }

  grid.innerHTML = list.map(prod => {

    const finalPrice = prod.promo_price
      ? prod.promo_price
      : prod.price;

    const imgHtml = prod.image_url
      ? `<img src="${escapeHTML(prod.image_url)}" alt="${escapeHTML(prod.name)}" class="product-img">`
      : '<div class="product-placeholder">🧁</div>';

    return `

      <div class="product-card">

        <div>

          ${imgHtml}

          <div class="product-info">

            <span class="product-tag">
              ${escapeHTML(prod.category)}
              ${prod.is_featured ? ' • ⭐ Destaque' : ''}
            </span>

            <h3>${escapeHTML(prod.name)}</h3>

            <p class="product-desc">
              ${escapeHTML(prod.description || 'Feito artesanalmente com ingredientes selecionados.')}
            </p>

          </div>

        </div>

        <div class="product-bottom">

          <div class="price-box">

            ${prod.promo_price
              ? `<span class="old-price">${formatMoney(prod.price)}</span>`
              : ''}

            <span class="current-price">
              ${formatMoney(finalPrice)}
            </span>

          </div>

          <button
            class="btn-primary"
            onclick="addToCart('${escapeHTML(prod.id)}')">

            + Adicionar

          </button>

        </div>

      </div>

    `;

  }).join('');

}


// ==========================================
// 10. CARRINHO
// ==========================================

function addToCart(productId) {

  const prod = allProducts.find(p => String(p.id) === String(productId));

  if (!prod) return;

  const price = prod.promo_price
    ? Number(prod.promo_price)
    : Number(prod.price);

  const existing = cart.find(item => item.id === productId);

  if (existing) {

    existing.qty += 1;

  } else {

    cart.push({

      id: prod.id,

      name: `${prod.category} - ${prod.name}`,

      price: price,

      qty: 1

    });

  }

  updateCartUI();

  toggleCart(true);

}


function updateQty(index, delta) {

  if (!cart[index]) return;

  cart[index].qty += delta;

  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }

  updateCartUI();

}


function updateCartUI() {

  const count = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const countElement = document.getElementById('cart-count');

  const totalElement = document.getElementById('cart-total');

  const container = document.getElementById('cart-items');

  if (countElement) {
    countElement.innerText = count;
  }

  if (totalElement) {
    totalElement.innerText = formatMoney(total);
  }

  if (!container) return;

  if (cart.length === 0) {

    container.innerHTML = `
      <p style="color:#6e627d;text-align:center;margin-top:20px;">
        Seu carrinho está vazio.
      </p>
    `;

    return;
  }

  container.innerHTML = cart.map((item, idx) => `

    <div class="cart-item">

      <div>

        <strong>${escapeHTML(item.name)}</strong>

        <br>

        <small>
          ${formatMoney(item.price * item.qty)}
        </small>

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

  if (!drawer) return;

  if (forceOpen === true) {

    drawer.classList.remove('hidden');

  } else if (forceOpen === false) {

    drawer.classList.add('hidden');

  } else {

    drawer.classList.toggle('hidden');

  }

}


// ==========================================
// 11. WHATSAPP - MONTAR MENSAGEM
// ==========================================

function createOrderWhatsAppMessage(order, items) {

  const itemsText = items.map(item => {

    return `• ${item.qty}x ${item.name} — ${formatMoney(item.price * item.qty)}`;

  }).join('\n');

  return (

    `🍰 *NOVO PEDIDO - DOCES DA FLA*\n\n` +

    `*Pedido:* ${order.id}\n` +

    `*Cliente:* ${order.customer_name}\n` +

    `*WhatsApp do cliente:* ${order.customer_phone}\n\n` +

    `*PRODUTOS:*\n${itemsText}\n\n` +

    `*TOTAL: ${formatMoney(order.total_amount)}*\n\n` +

    `*Pagamento:* ${order.payment_method}\n` +

    (order.payment_method === 'PIX'
      ? '*Situação: aguardando confirmação do pagamento.*\n'
      : '') +

    (order.notes
      ? `*Observações:* ${order.notes}\n`
      : '') +

    `\nPedido realizado pelo site Doces da Fla.`

  );

}


// ==========================================
// 12. FINALIZAR PEDIDO
// ==========================================

async function submitOrder(e) {

  e.preventDefault();

  const form = e.currentTarget;

  if (form.dataset.submitting === 'true') return;

  if (cart.length === 0) {

    alert('Adicione pelo menos um doce ao carrinho.');

    return;
  }

  const name = document
    .getElementById('cust-name')
    .value.trim();

  const phone = document
    .getElementById('cust-phone')
    .value.replace(/\D/g, '');

  const paymentMethod = document
    .getElementById('pay-method')
    .value;

  const notes = document
    .getElementById('order-notes')
    .value.trim();

  if (!name || !phone) {

    alert('Preencha seu nome e WhatsApp.');

    return;
  }

  const orderItems = cart.map(item => ({
    ...item
  }));

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  const originalText = submitButton
    ? submitButton.innerText
    : '';

  form.dataset.submitting = 'true';

  if (submitButton) {

    submitButton.disabled = true;

    submitButton.innerText = 'Registrando pedido...';

  }

  // Abre uma janela durante o clique original do cliente.
  // Assim reduzimos o risco de bloqueio de pop-ups após
  // a resposta assíncrona do Supabase.

  let whatsappWindow = null;

  try {

    whatsappWindow = window.open('about:blank', '_blank');

    // REGISTRAR NO SUPABASE

    const { data, error } = await supabaseClient
      .from('orders')
      .insert([{

        customer_name: name,

        customer_phone: phone,

        items: orderItems,

        total_amount: totalAmount,

        payment_method: paymentMethod,

        notes: notes,

        status: paymentMethod === 'PIX'
          ? 'Aguardando pagamento'
          : 'Recebido'

      }])
      .select()
      .single();

    if (error) {

      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close();
      }

      console.error('Erro ao registrar pedido:', error);

      alert('Erro ao registrar pedido: ' + error.message);

      return;
    }

    // PREPARAR WHATSAPP DA RESPONSÁVEL

    const whatsappNumber = normalizeWhatsApp(
      storeSettings.whatsapp
    );

    const waMessage = createOrderWhatsAppMessage(
      data,
      orderItems
    );

    const whatsappUrl = whatsappNumber
      ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waMessage)}`
      : null;

    // CONFIGURAR BOTÃO ALTERNATIVO

    const whatsappButton = document.getElementById(
      'whatsapp-confirm-btn'
    );

    if (whatsappButton) {

      whatsappButton.href = whatsappUrl || '#';

      whatsappButton.innerText = whatsappUrl
        ? '💬 Abrir WhatsApp novamente'
        : 'WhatsApp não configurado';

      whatsappButton.style.display = whatsappUrl
        ? 'block'
        : 'none';

    }

    // ABRIR WHATSAPP AUTOMATICAMENTE

    if (whatsappUrl && whatsappWindow && !whatsappWindow.closed) {

      whatsappWindow.location.href = whatsappUrl;

    } else if (whatsappWindow && !whatsappWindow.closed) {

      whatsappWindow.close();

    }

    // CONFIRMAÇÃO DO PEDIDO

    const confirmMessage = document.getElementById(
      'order-confirm-msg'
    );

    if (confirmMessage) {

      confirmMessage.innerText =
        `Obrigado, ${name}! Seu pedido foi registrado com sucesso. Total: ${formatMoney(totalAmount)}.`;

    }

    // CONFIGURAÇÃO DO PIX

    const pixBox = document.getElementById('pix-payment-box');

    if (paymentMethod === 'PIX') {

      pixBox.classList.remove('hidden');

      document.getElementById('pix-copy-text').value =
        storeSettings.pix_code || '';

      const qrDiv = document.getElementById(
        'qrcode-container'
      );

      qrDiv.innerHTML = '';

      if (window.QRCode && storeSettings.pix_code) {

        new QRCode(qrDiv, {

          text: storeSettings.pix_code,

          width: 160,

          height: 160

        });

      }

    } else {

      pixBox.classList.add('hidden');

    }

    // LIMPAR CARRINHO

    cart = [];

    updateCartUI();

    toggleCart(false);

    // ABRIR MODAL DE CONFIRMAÇÃO

    document.getElementById('pix-modal')
      .classList.remove('hidden');

    if (!whatsappUrl) {

      alert(
        'Pedido registrado, mas o WhatsApp da loja não está configurado.'
      );

    }

  } catch (error) {

    console.error('Erro ao finalizar pedido:', error);

    if (whatsappWindow && !whatsappWindow.closed) {
      whatsappWindow.close();
    }

    alert('Ocorreu um erro ao finalizar o pedido.');

  } finally {

    form.dataset.submitting = 'false';

    if (submitButton) {

      submitButton.disabled = false;

      submitButton.innerText = originalText;

    }

  }

}


// ==========================================
// 13. COPIAR PIX
// ==========================================

function copyPixCode() {

  const copyText = document.getElementById('pix-copy-text');

  if (!copyText || !copyText.value) {

    alert('Código PIX não disponível.');

    return;
  }

  copyText.select();

  if (navigator.clipboard && window.isSecureContext) {

    navigator.clipboard.writeText(copyText.value)
      .then(() => {

        alert('Código PIX copiado! Cole no aplicativo do seu banco.');

      })
      .catch(() => {

        alert('Não foi possível copiar automaticamente. Selecione e copie o código.');

      });

  } else {

    try {

      document.execCommand('copy');

      alert('Código PIX copiado!');

    } catch (error) {

      alert('Selecione e copie o código PIX manualmente.');

    }

  }

}


function closePixModal() {

  document.getElementById('pix-modal')
    .classList.add('hidden');

}


// ==========================================
// 14. ACOMPANHAMENTO DE PEDIDOS
// ==========================================

function openTrackModal() {

  document.getElementById('track-modal')
    .classList.remove('hidden');

}


function closeTrackModal() {

  document.getElementById('track-modal')
    .classList.add('hidden');

}


async function trackOrders() {

  const phone = document
    .getElementById('track-phone-input')
    .value.replace(/\D/g, '');

  const container = document.getElementById('track-results');

  if (!phone) {

    alert('Digite seu WhatsApp.');

    return;
  }

  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('customer_phone', phone)
    .order('created_at', { ascending: false });

  if (error) {

    console.error(error);

    container.innerHTML = '<p>Erro ao consultar pedidos.</p>';

    return;
  }

  if (!data || data.length === 0) {

    container.innerHTML =
      '<p>Nenhum pedido encontrado para este número.</p>';

    return;
  }

  container.innerHTML = data.map(order => `

    <div class="order-card">

      <div class="order-top">

        <strong>
          ${new Date(order.created_at).toLocaleDateString('pt-BR')}
        </strong>

        <span class="status-badge">
          ${escapeHTML(order.status)}
        </span>

      </div>

      <p>
        <small>
          ${(order.items || []).map(item =>
            `${item.qty}x ${escapeHTML(item.name)}`
          ).join(', ')}
        </small>
      </p>

      <strong>
        Total: ${formatMoney(order.total_amount)}
        (${escapeHTML(order.payment_method)})
      </strong>

    </div>

  `).join('');

}


// ==========================================
// 15. NAVEGAÇÃO
// ==========================================

function showView(view) {

  document.getElementById('store-view')
    .classList.toggle('hidden', view !== 'store');

  document.getElementById('admin-view')
    .classList.toggle('hidden', view !== 'admin');

  if (view === 'admin') {

    checkSession();

  }

}


// ==========================================
// 16. SESSÃO ADMINISTRATIVA
// ==========================================

async function checkSession() {

  const { data: { session }, error } =
    await supabaseClient.auth.getSession();

  if (error) {

    console.error(error);

    return;
  }

  if (session) {

    document.getElementById('admin-login-box')
      .classList.add('hidden');

    document.getElementById('admin-dashboard')
      .classList.remove('hidden');

    document.getElementById('logged-user-email').innerText =
      `Logado como: ${session.user.email}`;

    loadAdminData();

  } else {

    document.getElementById('admin-login-box')
      .classList.remove('hidden');

    document.getElementById('admin-dashboard')
      .classList.add('hidden');

  }

}


// ==========================================
// 17. LOGIN
// ==========================================

async function handleLogin(e) {

  e.preventDefault();

  const email = document
    .getElementById('admin-email')
    .value;

  const password = document
    .getElementById('admin-password')
    .value;

  const { error } = await supabaseClient.auth
    .signInWithPassword({

      email,

      password

    });

  if (error) {

    alert('E-mail ou senha inválidos.');

  } else {

    await checkSession();

  }

}


// ==========================================
// 18. SAIR DO PAINEL
// ==========================================

async function handleLogout() {

  const { error } = await supabaseClient.auth.signOut();

  if (error) {

    alert('Erro ao sair da conta.');

    console.error(error);

    return;
  }

  await checkSession();

}


// ==========================================
// 19. ABAS ADMINISTRATIVAS
// ==========================================

function switchAdminTab(tabName, btn) {

  document.querySelectorAll('.tab-btn').forEach(button => {

    button.classList.remove('active');

  });

  btn.classList.add('active');

  document.querySelectorAll('.admin-tab-content').forEach(content => {

    content.classList.add('hidden');

  });

  document.getElementById(`tab-${tabName}`)
    .classList.remove('hidden');

}


// ==========================================
// 20. PAINEL DE GESTÃO
// ==========================================

async function loadAdminData() {

  const { data: orders, error } = await supabaseClient
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {

    console.error('Erro ao carregar pedidos:', error);

    return;
  }

  if (!orders) return;

  const todayStr = new Date().toLocaleDateString('en-CA');

  const monthStr = todayStr.slice(0, 7);

  let revToday = 0;

  let revMonth = 0;

  let pendingCount = 0;

  const itemCounter = {};

  const customersMap = {};

  orders.forEach(order => {

    const isCanceled = order.status === 'Cancelado';

    const orderDate = new Date(order.created_at)
      .toLocaleDateString('en-CA');

    if (!isCanceled) {

      if (orderDate === todayStr) {

        revToday += Number(order.total_amount);

      }

      if (orderDate.slice(0, 7) === monthStr) {

        revMonth += Number(order.total_amount);

      }

      (order.items || []).forEach(item => {

        itemCounter[item.name] =
          (itemCounter[item.name] || 0) + item.qty;

      });

    }

    if ([

      'Recebido',

      'Aguardando pagamento',

      'Pagamento confirmado',

      'Em preparação'

    ].includes(order.status)) {

      pendingCount++;

    }

    if (!customersMap[order.customer_phone]) {

      customersMap[order.customer_phone] = {

        name: order.customer_name,

        phone: order.customer_phone,

        count: 0,

        total: 0

      };

    }

    customersMap[order.customer_phone].count++;

    if (!isCanceled) {

      customersMap[order.customer_phone].total +=
        Number(order.total_amount);

    }

  });


  // PRODUTO MAIS VENDIDO

  const sortedItems = Object.entries(itemCounter)
    .sort((a, b) => b[1] - a[1]);

  const topItem = sortedItems.length > 0
    ? sortedItems[0]
    : null;


  // INDICADORES

  document.getElementById('metric-today').innerText =
    formatMoney(revToday);

  document.getElementById('metric-month').innerText =
    formatMoney(revMonth);

  document.getElementById('metric-pending').innerText =
    pendingCount;

  document.getElementById('metric-top').innerText =
    topItem ? `${topItem[0]} (${topItem[1]}x)` : '-';


  // LISTA DE PEDIDOS

  document.getElementById('admin-orders-list').innerHTML =
    orders.map(order => {

      const customerPhone = String(order.customer_phone || '');

      const customerWhatsApp = normalizeWhatsApp(customerPhone);

      const customerMessage = encodeURIComponent(
        `Olá ${order.customer_name}! Aqui é da Doces da Fla. O status do seu pedido agora é: ${order.status}.`
      );

      return `

        <div class="order-card">

          <div class="order-top">

            <div>

              <strong>${escapeHTML(order.customer_name)}</strong>

              (${escapeHTML(order.customer_phone)})

              <br>

              <small>

                ${new Date(order.created_at).toLocaleString('pt-BR')}

                • Pagamento: <b>${escapeHTML(order.payment_method)}</b>

              </small>

            </div>

            <select
              onchange="updateOrderStatus('${escapeHTML(order.id)}', this.value)"
              style="width:auto;"
            >

              ${ORDER_STATUSES.map(status => `

                <option
                  value="${escapeHTML(status)}"
                  ${order.status === status ? 'selected' : ''}
                >

                  ${escapeHTML(status)}

                </option>

              `).join('')}

            </select>

          </div>

          <p style="margin:8px 0;">

            ${(order.items || []).map(item =>
              `• ${item.qty}x ${escapeHTML(item.name)}`
            ).join('<br>')}

          </p>

          ${order.notes
            ? `<p><small><b>Obs:</b> ${escapeHTML(order.notes)}</small></p>`
            : ''}

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            margin-top:10px;
            gap:10px;
            flex-wrap:wrap;
          ">

            <strong>
              Total: ${formatMoney(order.total_amount)}
            </strong>

            ${customerWhatsApp ? `

              <a
                href="https://wa.me/${customerWhatsApp}?text=${customerMessage}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-secondary"
              >

                Avisar no WhatsApp

              </a>

            ` : ''}

          </div>

        </div>

      `;

    }).join('');


  // HISTÓRICO DE CLIENTES

  document.getElementById('admin-customers-list').innerHTML =
    Object.values(customersMap).map(customer => `

      <div class="admin-prod-item">

        <div>

          <strong>${escapeHTML(customer.name)}</strong>

          <br>

          <small>

            WhatsApp: ${escapeHTML(customer.phone)}

            • ${customer.count} pedido(s)

          </small>

        </div>

        <strong>

          ${formatMoney(customer.total)}

        </strong>

      </div>

    `).join('');

}


// ==========================================
// 21. ATUALIZAR STATUS
// ==========================================

async function updateOrderStatus(orderId, newStatus) {

  if (!ORDER_STATUSES.includes(newStatus)) {

    alert('Status inválido.');

    return;
  }

  const { error } = await supabaseClient
    .from('orders')
    .update({

      status: newStatus

    })
    .eq('id', orderId);

  if (error) {

    console.error(error);

    alert('Erro ao atualizar status do pedido.');

    return;
  }

  await loadAdminData();

}


// ==========================================
// 22. REGISTRAR VENDA POR FORA
// ==========================================

async function registrarVendaPorFora() {

  const valorTexto = prompt(
    'Qual o valor da venda? (Ex: 25,50)'
  );

  if (!valorTexto) return;

  const valor = Number(valorTexto.replace(',', '.'));

  if (!Number.isFinite(valor) || valor <= 0) {

    alert('Digite um valor válido.');

    return;
  }

  const descricao = prompt(
    'Qual doce ou nome do cliente?'
  ) || 'Venda por fora';

  const { error } = await supabaseClient
    .from('orders')
    .insert([{

      customer_name: `${descricao} (Por fora)`,

      customer_phone: '00000000000',

      items: [{

        name: descricao,

        qty: 1,

        price: valor

      }],

      total_amount: valor,

      payment_method: 'Externo',

      notes: 'Venda registrada manualmente',

      status: 'Entregue'

    }]);

  if (error) {

    console.error('Erro ao registrar venda:', error);

    alert('Erro ao salvar venda: ' + error.message);

    return;
  }

  alert(
    `Venda de ${formatMoney(valor)} registrada!`
  );

  await loadAdminData();

}


// ==========================================
// 23. UPLOAD DE IMAGENS
// ==========================================

async function uploadImage(file) {

  if (!file) return null;

  const fileName =
    `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;

  const { error } = await supabaseClient
    .storage
    .from('doces-images')
    .upload(fileName, file);

  if (error) {

    console.error('Erro no upload:', error);

    alert('Erro ao enviar imagem: ' + error.message);

    return null;
  }

  const { data } = supabaseClient
    .storage
    .from('doces-images')
    .getPublicUrl(fileName);

  return data.publicUrl;

}


// ==========================================
// 24. SALVAR PRODUTOS
// ==========================================

async function saveProduct(e) {

  e.preventDefault();

  const id = document.getElementById('prod-id').value;

  const fileInput = document.getElementById('prod-image');

  let imageUrl = null;

  if (fileInput.files.length > 0) {

    imageUrl = await uploadImage(fileInput.files[0]);

    if (!imageUrl) return;

  }

  const payload = {

    name: document.getElementById('prod-name').value.trim(),

    category: document.getElementById('prod-category').value.trim(),

    price: parseFloat(
      document.getElementById('prod-price').value
    ),

    promo_price: document.getElementById('prod-promo').value
      ? parseFloat(document.getElementById('prod-promo').value)
      : null,

    description: document.getElementById('prod-desc').value,

    is_featured: document.getElementById('prod-featured').checked,

    is_active: document.getElementById('prod-active').checked

  };

  if (imageUrl) {

    payload.image_url = imageUrl;

  }

  let result;

  if (id) {

    result = await supabaseClient
      .from('products')
      .update(payload)
      .eq('id', id);

  } else {

    result = await supabaseClient
      .from('products')
      .insert([payload]);

  }

  if (result.error) {

    console.error(result.error);

    alert('Erro ao salvar produto: ' + result.error.message);

    return;
  }

  resetProductForm();

  await loadProducts();

  alert('Produto salvo com sucesso!');

}


// ==========================================
// 25. EDITAR PRODUTOS
// ==========================================

function editProduct(id) {

  const product = allProducts.find(
    item => String(item.id) === String(id)
  );

  if (!product) return;

  document.getElementById('product-form-title').innerText =
    'Editar Doce';

  document.getElementById('prod-id').value = product.id;

  document.getElementById('prod-name').value = product.name;

  document.getElementById('prod-category').value =
    product.category;

  document.getElementById('prod-price').value =
    product.price;

  document.getElementById('prod-promo').value =
    product.promo_price || '';

  document.getElementById('prod-desc').value =
    product.description || '';

  document.getElementById('prod-featured').checked =
    product.is_featured;

  document.getElementById('prod-active').checked =
    product.is_active;

  window.scrollTo({

    top: 0,

    behavior: 'smooth'

  });

}


// ==========================================
// 26. EXCLUIR PRODUTOS
// ==========================================

async function deleteProduct(id) {

  if (!confirm('Tem certeza que deseja excluir este doce?')) {

    return;
  }

  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {

    console.error(error);

    alert('Erro ao excluir produto.');

    return;
  }

  await loadProducts();

  alert('Produto excluído com sucesso!');

}


// ==========================================
// 27. LIMPAR FORMULÁRIO DE PRODUTOS
// ==========================================

function resetProductForm() {

  document.getElementById('product-form-title').innerText =
    'Adicionar Novo Doce';

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


// ==========================================
// 28. LISTA ADMINISTRATIVA DE PRODUTOS
// ==========================================

function renderAdminProducts() {

  const container = document.getElementById(
    'admin-products-list'
  );

  if (!container) return;

  container.innerHTML = allProducts.map(product => `

    <div class="admin-prod-item">

      <div>

        <strong>

          ${escapeHTML(product.category)} -
          ${escapeHTML(product.name)}

        </strong>

        ${!product.is_active ? '(Oculto)' : ''}

        <br>

        <small>

          ${formatMoney(product.price)}

          ${product.promo_price
            ? `→ Promo: ${formatMoney(product.promo_price)}`
            : ''}

        </small>

      </div>

      <div style="display:flex; gap:6px;">

        <button
          class="btn-secondary"
          onclick="editProduct('${escapeHTML(product.id)}')"
        >

          Editar

        </button>

        <button
          class="btn-danger"
          onclick="deleteProduct('${escapeHTML(product.id)}')"
        >

          Excluir

        </button>

      </div>

    </div>

  `).join('');

}


// ==========================================
// 29. SALVAR CONFIGURAÇÕES DA LOJA
// ==========================================

async function saveSettings(e) {

  e.preventDefault();

  const logoInput = document.getElementById('set-logo');

  let logoUrl = storeSettings.logo_url || null;

  if (logoInput.files.length > 0) {

    const uploadedUrl = await uploadImage(
      logoInput.files[0]
    );

    if (!uploadedUrl) {

      alert('Não foi possível enviar o novo logotipo.');

      return;
    }

    logoUrl = uploadedUrl;

  }

  const updates = {

    logo_url: logoUrl,

    pix_code: document.getElementById('set-pix').value.trim(),

    whatsapp: document.getElementById('set-whatsapp').value.trim(),

    address: document.getElementById('set-address').value.trim(),

    hours: document.getElementById('set-hours').value.trim()

  };

  const { error } = await supabaseClient
    .from('store_settings')
    .update(updates)
    .eq('id', 1);

  if (error) {

    console.error('Erro ao salvar configurações:', error);

    alert('Erro ao salvar configurações: ' + error.message);

    return;
  }

  await loadSettings();

  logoInput.value = '';

  alert('Configurações atualizadas com sucesso!');

}


// ==========================================
// FIM DO SISTEMA - DOCES DA FLA
// ==========================================


