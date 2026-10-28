// FindBack AI Client-side Application (Google Maps + AI Skills + Student Auth + Escrow Payments)
let currentCategory = 'all';
let currentStatus = 'all';
let currentItems = [];
let selectedItem = null;
let leafletMap = null;
let mapMarkers = [];
let radarCircle = null;
let audioCtx = null;
let currentTileLayer = null;

// Auth State
let currentUser = JSON.parse(localStorage.getItem('findback_user')) || null;
let isRegisterMode = false;
let selectedPaymentMethod = 'card';

// Campus Reference Coordinates (Nirmala Girls HSS / 86th St, Kamarajar Salai, Ashok Nagar)
const CAMPUS_CENTER = [13.0336, 80.2132];

// Google Maps & Dark Matter Tile Providers
const TILE_PROVIDERS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    options: { maxZoom: 19, subdomains: 'abcd' }
  },
  satellite: {
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    options: { maxZoom: 20 }
  },
  roadmap: {
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    options: { maxZoom: 20 }
  },
  hybrid: {
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    options: { maxZoom: 20 }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  renderAuthHeader();
  initLeafletMap();
  loadItems();
  loadStats();
});

// Sound synthesis via Web Audio API
function playSound(type = 'ping') {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'ping') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }
  } catch (e) {}
}

// ==========================================
// AUTHENTICATION & STUDENT PROFILE SYSTEM
// ==========================================
function renderAuthHeader() {
  const container = document.getElementById('authContainer');
  if (!container) return;

  if (currentUser) {
    container.innerHTML = `
      <div class="flex items-center space-x-2 bg-[#1A1E26] border border-slate-700/80 rounded-2xl py-1 px-2.5 shadow-sm">
        <div class="w-7 h-7 rounded-full overflow-hidden border border-brand-blue flex-shrink-0">
          <img src="${currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" class="w-full h-full object-cover">
        </div>
        <div class="hidden sm:block text-left text-xs leading-tight">
          <div class="font-bold text-white flex items-center space-x-1">
            <span>${currentUser.name}</span>
            <span class="text-[9px] bg-brand-blue/20 text-brand-blue px-1.5 py-0.2 rounded font-mono">${currentUser.studentId}</span>
          </div>
          <span class="text-[10px] text-emerald-400 font-semibold">$${currentUser.walletBalance || 125} Wallet</span>
        </div>
        <button onclick="logoutUser()" title="Sign Out" class="text-slate-400 hover:text-red-400 p-1 transition-all">
          <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;

    // Also update mobile avatar if present
    const mobAvatar = document.getElementById('mobileAvatarImg');
    if (mobAvatar && currentUser.avatar) mobAvatar.src = currentUser.avatar;
  } else {
    container.innerHTML = `
      <button onclick="openLoginModal()" class="bg-[#1E2330] hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-all">
        <i data-lucide="log-in" class="w-4 h-4 text-brand-blue"></i>
        <span>Login</span>
      </button>
    `;
  }

  if (window.lucide) lucide.createIcons();
}

function openLoginModal() {
  playSound('ping');
  document.getElementById('loginModal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.add('hidden');
}

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  const nameGroup = document.getElementById('registerNameGroup');
  const title = document.getElementById('authModalTitle');
  const submitBtn = document.getElementById('authSubmitBtn');
  const prompt = document.getElementById('authTogglePrompt');
  const toggleBtn = document.getElementById('authToggleBtn');

  if (isRegisterMode) {
    nameGroup.classList.remove('hidden');
    title.innerText = "Create Campus Account";
    submitBtn.innerText = "Sign Up & Get $50 Campus Wallet";
    prompt.innerText = "Already registered?";
    toggleBtn.innerText = "Sign In";
  } else {
    nameGroup.classList.add('hidden');
    title.innerText = "Campus Student Login";
    submitBtn.innerText = "Sign In to Campus Network";
    prompt.innerText = "New student?";
    toggleBtn.innerText = "Create an Account";
  }
}

function quickLoginDemo(type) {
  if (type === 'student') {
    document.getElementById('authEmail').value = "john.simon@campus.edu";
    document.getElementById('authPassword').value = "password123";
  } else {
    document.getElementById('authEmail').value = "admin@campus.edu";
    document.getElementById('authPassword').value = "admin";
  }
  handleAuthSubmit(new Event('submit'));
}

async function handleAuthSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const name = document.getElementById('authName') ? document.getElementById('authName').value : '';

  const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
  const payload = isRegisterMode ? { name, email, password } : { email, password };

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      playSound('success');
      currentUser = data.user;
      localStorage.setItem('findback_user', JSON.stringify(data.user));
      renderAuthHeader();
      closeLoginModal();
      alert(`🎉 Welcome, ${currentUser.name}! You are now logged in with Student ID: ${currentUser.studentId}`);
    } else {
      alert(`⚠️ Authentication Error: ${data.error}`);
    }
  } catch (err) {
    console.error(err);
    alert("Error logging in.");
  }
}

function logoutUser() {
  playSound('ping');
  currentUser = null;
  localStorage.removeItem('findback_user');
  renderAuthHeader();
}

// ==========================================
// PAYMENTS & CAMPUS REWARD ESCROW SYSTEM
// ==========================================
function openPaymentModal() {
  if (!selectedItem) return;
  playSound('ping');

  const reward = selectedItem.rewardAmount || 20;
  const total = (reward + 2.50).toFixed(2);

  document.getElementById('paymentItemImg').src = selectedItem.image;
  document.getElementById('paymentItemTitle').innerText = selectedItem.title;
  document.getElementById('paymentItemOwner').innerText = `Owner: ${selectedItem.owner}`;
  document.getElementById('paymentRewardVal').innerText = `$${reward}.00`;
  document.getElementById('paymentTotalVal').innerText = `$${total}`;
  document.getElementById('paySubmitBtn').innerHTML = `
    <i data-lucide="lock" class="w-4 h-4"></i>
    <span>Authorize & Pay $${total} via Escrow</span>
  `;

  document.getElementById('paymentModal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closePaymentModal() {
  document.getElementById('paymentModal').classList.add('hidden');
}

function selectPaymentMethod(method) {
  selectedPaymentMethod = method;
  playSound('ping');

  ['card', 'upi', 'wallet'].forEach(m => {
    const btn = document.getElementById(`payMethod${m.charAt(0).toUpperCase() + m.slice(1)}`);
    if (btn) {
      if (m === method) {
        btn.className = "bg-slate-800 border-2 border-brand-blue p-2.5 rounded-xl font-bold text-white flex flex-col items-center justify-center space-y-1";
      } else {
        btn.className = "bg-slate-900 border border-slate-800 p-2.5 rounded-xl font-medium text-slate-400 hover:text-white flex flex-col items-center justify-center space-y-1";
      }
    }
  });

  const cardFields = document.getElementById('cardFields');
  if (method === 'card') {
    cardFields.classList.remove('hidden');
  } else {
    cardFields.classList.add('hidden');
  }
}

async function handlePaymentSubmit(e) {
  e.preventDefault();
  const reward = selectedItem ? (selectedItem.rewardAmount || 20) : 20;

  try {
    const res = await fetch('/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: selectedItem.id,
        amount: reward,
        paymentMethod: selectedPaymentMethod,
        payerName: currentUser ? currentUser.name : "Student Payer",
        payerEmail: currentUser ? currentUser.email : "student@campus.edu"
      })
    });

    const data = await res.json();
    if (data.success) {
      playSound('success');
      closePaymentModal();
      
      // Show official receipt modal
      document.getElementById('receiptReleaseCode').innerText = data.receipt.releaseCode;
      document.getElementById('receiptPayId').innerText = data.receipt.id;
      document.getElementById('receiptItemTitle').innerText = data.receipt.itemTitle;
      document.getElementById('receiptAmount').innerText = `$${data.receipt.totalPaid.toFixed(2)}`;
      
      document.getElementById('receiptModal').classList.remove('hidden');
      if (window.lucide) lucide.createIcons();

      loadItems();
    }
  } catch (err) {
    console.error(err);
    alert("Payment processing error.");
  }
}

function closeReceiptModal() {
  document.getElementById('receiptModal').classList.add('hidden');
}

// ==========================================
// MAP & LEAFLET ENGINE
// ==========================================
function initLeafletMap() {
  const mapElement = document.getElementById('leafletMap');
  if (!mapElement) return;

  leafletMap = L.map('leafletMap', {
    center: CAMPUS_CENTER,
    zoom: 16,
    zoomControl: false,
    attributionControl: false
  });

  setMapLayer('dark');

  leafletMap.on('click', (e) => {
    playSound('ping');
    const { lat, lng } = e.latlng;
    window.lastClickedCoords = { lat, lng };
    const locInput = document.getElementById('reportLocation');
    if (locInput) {
      locInput.value = `Campus (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
  });
}

function setMapLayer(layerKey) {
  if (!leafletMap || !TILE_PROVIDERS[layerKey]) return;

  if (currentTileLayer) {
    leafletMap.removeLayer(currentTileLayer);
  }

  const prov = TILE_PROVIDERS[layerKey];
  currentTileLayer = L.tileLayer(prov.url, prov.options).addTo(leafletMap);

  ['dark', 'satellite', 'roadmap'].forEach(k => {
    const btn = document.getElementById(`layerBtn${k.charAt(0).toUpperCase() + k.slice(1, 4)}`);
    if (btn) {
      if (k === layerKey) {
        btn.className = "px-2.5 py-1 rounded-lg bg-slate-800 text-white font-bold";
      } else {
        btn.className = "px-2.5 py-1 rounded-lg text-slate-400 hover:text-white";
      }
    }
  });

  playSound('ping');
}

function switchView(view) {
  const desktopView = document.getElementById('desktopView');
  const mobileView = document.getElementById('mobileView');
  const btnDesktop = document.getElementById('viewToggleDesktop');
  const btnMobile = document.getElementById('viewToggleMobile');

  if (view === 'mobile') {
    desktopView.classList.add('hidden');
    mobileView.classList.remove('hidden');
    
    btnMobile.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 bg-brand-blue text-slate-950 shadow-md";
    btnDesktop.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center space-x-1.5";
  } else {
    mobileView.classList.add('hidden');
    desktopView.classList.remove('hidden');

    btnDesktop.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5 bg-brand-blue text-slate-950 shadow-md";
    btnMobile.className = "px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-all flex items-center space-x-1.5";
    
    setTimeout(() => {
      if (leafletMap) leafletMap.invalidateSize();
    }, 200);
  }

  if (window.lucide) lucide.createIcons();
}

async function loadItems(search = '') {
  try {
    let url = `/api/items?category=${currentCategory}&status=${currentStatus}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.success) {
      currentItems = data.items;
      renderDesktopItems(data.items);
      renderMobileItems(data.items);
      renderLeafletMarkers(data.items);
      if (data.items.length > 0 && !selectedItem) {
        selectItemOnMap(data.items[0]);
      }
    }
  } catch (err) {
    console.error("Error loading items:", err);
  }
}

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('statReported').innerText = data.totalReported;
    document.getElementById('statActive').innerText = data.activeLost;
    document.getElementById('statRecovered').innerText = data.recoveredCount;
    document.getElementById('statRate').innerText = data.recoveryRate;
  } catch (err) {
    console.error("Error loading stats:", err);
  }
}

function renderLeafletMarkers(items) {
  if (!leafletMap) return;

  mapMarkers.forEach(m => leafletMap.removeLayer(m));
  mapMarkers = [];

  const categoryColor = {
    bags: '#7CB342',
    keys: '#FB8C00',
    phones: '#42A5F5',
    watches: '#AB47BC',
    all: '#37474F'
  };

  const categoryIcon = {
    bags: 'backpack',
    keys: 'key',
    phones: 'smartphone',
    watches: 'watch',
    all: 'layers'
  };

  items.forEach(item => {
    const lat = item.lat || CAMPUS_CENTER[0];
    const lng = item.lng || CAMPUS_CENTER[1];
    const color = categoryColor[item.category] || '#42A5F5';
    const icon = categoryIcon[item.category] || 'layers';

    const customHtml = `
      <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-xl border-2 border-slate-900 transition-transform hover:scale-125"
           style="background-color: ${color};">
        <i data-lucide="${icon}" class="w-4 h-4 text-slate-950 font-bold stroke-[2.2]"></i>
      </div>
    `;

    const markerIcon = L.divIcon({
      html: customHtml,
      className: 'custom-leaflet-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(leafletMap);
    marker.on('click', () => {
      playSound('ping');
      selectItemOnMap(item);
    });

    mapMarkers.push(marker);
  });

  if (window.lucide) lucide.createIcons();
}

function selectItemOnMap(item) {
  selectedItem = item;
  const lat = item.lat || CAMPUS_CENTER[0];
  const lng = item.lng || CAMPUS_CENTER[1];

  document.getElementById('mapCardImg').src = item.image;
  document.getElementById('mapCardTitle').innerText = item.title;
  document.getElementById('mapCardLoc').innerText = `${item.location} • Area ${item.distance}`;
  document.getElementById('mapCardReward').innerText = `Reward: ${item.reward}`;

  if (leafletMap) {
    leafletMap.panTo([lat, lng], { animate: true, duration: 0.8 });

    if (radarCircle) leafletMap.removeLayer(radarCircle);

    radarCircle = L.circle([lat, lng], {
      color: '#7CB342',
      fillColor: '#7CB342',
      fillOpacity: 0.15,
      radius: 120,
      weight: 1.5
    }).addTo(leafletMap);
  }
}

function resetMapCenter() {
  if (leafletMap) {
    leafletMap.setView(CAMPUS_CENTER, 16);
    playSound('ping');
  }
}

function locateUserGPS() {
  playSound('ping');
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (leafletMap) {
          leafletMap.setView([latitude, longitude], 17);
          L.marker([latitude, longitude]).addTo(leafletMap).bindPopup("📍 Your Current Location").openPopup();
        }
      },
      () => {
        if (leafletMap) leafletMap.setView(CAMPUS_CENTER, 16);
      }
    );
  }
}

function openInGoogleMapsNav() {
  if (!selectedItem) return;
  playSound('ping');
  const lat = selectedItem.lat || CAMPUS_CENTER[0];
  const lng = selectedItem.lng || CAMPUS_CENTER[1];
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(gmapsUrl, '_blank');
}

function renderDesktopItems(items) {
  const container = document.getElementById('desktopItemsList');
  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="bg-[#151821] border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <i data-lucide="package-open" class="w-10 h-10 mx-auto text-slate-600 mb-2"></i>
        <p class="text-sm font-semibold">No items match your active filter.</p>
        <button onclick="filterCategory('all')" class="mt-3 text-xs text-brand-blue underline">Reset Filters</button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const categoryColor = {
    bags: '#7CB342',
    keys: '#FB8C00',
    phones: '#42A5F5',
    watches: '#AB47BC',
    all: '#37474F'
  };

  container.innerHTML = items.map(item => {
    const color = categoryColor[item.category] || '#42A5F5';

    return `
      <div onclick="selectAndShowDetails('${item.id}')" class="item-card cursor-pointer bg-[#151821] border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="flex items-center space-x-4">
          <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex-shrink-0 relative">
            <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover">
            <span class="absolute top-1 left-1 w-2.5 h-2.5 rounded-full" style="background-color: ${color}"></span>
          </div>

          <div>
            <div class="flex items-center space-x-2">
              <h3 class="text-base font-bold text-white">${item.title}</h3>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'reward_escrowed' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : item.status === 'lost' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
                ${item.status === 'reward_escrowed' ? 'Escrow Paid' : item.status === 'lost' ? 'Lost' : 'Found'}
              </span>
            </div>
            
            <p class="text-xs text-slate-400 mt-1 flex items-center space-x-2">
              <span>📍 ${item.location}</span>
              <span>•</span>
              <span class="text-slate-500">${item.date}</span>
            </p>

            <div class="flex items-center space-x-2 mt-2">
              <span class="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                Distance: ${item.distance}
              </span>
              ${item.reward && item.reward !== '$0' ? `<span class="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Reward: ${item.reward}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <span class="text-xs text-slate-500 hidden sm:block">${item.owner}</span>
          <button class="bg-[#1D222E] hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all flex items-center space-x-1">
            <span>Details</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function renderMobileItems(items) {
  const container = document.getElementById('mobileItemsList');
  if (!container) return;

  const categoryColor = {
    bags: '#7CB342',
    keys: '#FB8C00',
    phones: '#42A5F5',
    watches: '#AB47BC',
    all: '#37474F'
  };

  const categoryIcon = {
    bags: 'backpack',
    keys: 'key',
    phones: 'smartphone',
    watches: 'watch',
    all: 'layers'
  };

  container.innerHTML = items.map(item => {
    const color = categoryColor[item.category] || '#42A5F5';
    const icon = categoryIcon[item.category] || 'layers';

    return `
      <div onclick="selectAndShowDetails('${item.id}')" class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style="background-color: ${color}20; color: ${color}">
            <i data-lucide="${icon}" class="w-5 h-5 stroke-[2.2]"></i>
          </div>

          <div>
            <h4 class="text-xs font-bold text-slate-900 leading-tight">${item.title}</h4>
            <span class="text-[11px] text-slate-400 font-medium">${item.date}</span>
          </div>
        </div>

        <div class="flex items-center space-x-1 text-slate-400 text-xs font-semibold">
          <i data-lucide="navigation-2" class="w-3 h-3 text-slate-400 rotate-45"></i>
          <span class="text-[11px]">${item.distance}</span>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

function selectAndShowDetails(id) {
  const item = currentItems.find(i => i.id === id);
  if (!item) return;
  selectItemOnMap(item);
  viewItemDetails(id);
}

function filterCategory(cat, btn) {
  playSound('ping');
  currentCategory = cat;
  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('ring-2', 'ring-white'));
  if (btn) btn.classList.add('ring-2', 'ring-white');

  const badge = document.getElementById('activeFilterBadge');
  if (badge) {
    badge.innerText = cat === 'all' ? 'All Categories' : `Category: ${cat.toUpperCase()}`;
  }

  loadItems();
}

function filterStatus(status) {
  playSound('ping');
  currentStatus = status;
  document.querySelectorAll('.status-tab').forEach(b => {
    b.className = "status-tab text-slate-400 hover:text-white px-3 py-1 rounded-lg";
  });
  event.target.className = "status-tab text-white bg-slate-800 px-3 py-1 rounded-lg font-semibold";
  loadItems();
}

let searchDebounceTimer = null;
function handleRealtimeSearch(val) {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    loadItems(val);
  }, 300);
}

function triggerSearch() {
  const query = document.getElementById('desktopSearchInput').value;
  loadItems(query);
}

function triggerMobileSearch() {
  const query = document.getElementById('mobileSearchInput').value;
  loadItems(query);
}

function viewItemDetails(id) {
  const item = currentItems.find(i => i.id === id);
  if (!item) return;

  selectedItem = item;
  document.getElementById('detailImg').src = item.image;
  document.getElementById('detailTitle').innerText = item.title;
  document.getElementById('detailOwner').innerText = item.owner;
  document.getElementById('detailReward').innerText = item.reward;
  document.getElementById('detailStatus').innerText = item.status === 'lost' ? 'Not found' : item.status === 'reward_escrowed' ? 'Escrow Paid' : 'Found';
  document.getElementById('detailDate').innerText = item.date;
  document.getElementById('detailColor').innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full inline-block bg-brand-green"></span>
    <span>${item.color}</span>
  `;
  document.getElementById('detailDistance').innerText = item.distance;
  document.getElementById('detailLocation').innerText = item.location;
  document.getElementById('detailDesc').innerText = item.description;

  document.getElementById('itemDetailModal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeDetailModal() {
  document.getElementById('itemDetailModal').classList.add('hidden');
}

function callOwner() {
  if (!selectedItem) return;
  playSound('ping');
  alert(`📞 Calling ${selectedItem.owner} at ${selectedItem.ownerPhone}...\n(Campus Student Emergency Contact Line)`);
}

function openClaimVerificationModal() {
  if (!selectedItem) return;
  closeDetailModal();
  document.getElementById('claimModalQuestion').innerText = `"${selectedItem.securityQuestion}"`;
  document.getElementById('claimModal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeClaimModal() {
  document.getElementById('claimModal').classList.add('hidden');
}

async function submitClaim(e) {
  e.preventDefault();
  const name = document.getElementById('claimantName').value;
  const phone = document.getElementById('claimantPhone').value;
  const answer = document.getElementById('claimantAnswer').value;

  try {
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: selectedItem.id,
        claimantName: name,
        claimantPhone: phone,
        answer
      })
    });

    const data = await res.json();
    if (data.success) {
      playSound('success');
      alert("🎉 Claim submitted successfully!\nCampus security / owner will verify your proof and connect with you.");
      closeClaimModal();
    }
  } catch (err) {
    console.error(err);
    alert("Error submitting claim.");
  }
}

let reportTypingTimer = null;
function handleReportTyping() {
  clearTimeout(reportTypingTimer);
  reportTypingTimer = setTimeout(async () => {
    const title = document.getElementById('reportTitle').value;
    const desc = document.getElementById('reportDesc').value;
    const query = `${title} ${desc}`.trim();

    if (query.length < 4) {
      document.getElementById('reportAIMatchBanner').classList.add('hidden');
      return;
    }

    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await res.json();
      if (data.success && data.matches && data.matches.length > 0) {
        const best = data.matches[0];
        if (best.matchPercentage >= 75) {
          playSound('ping');
          const banner = document.getElementById('reportAIMatchBanner');
          document.getElementById('reportAIMatchScore').innerText = `⚡ Real-Time AI Match Detected: ${best.matchPercentage}% similar!`;
          document.getElementById('reportAIMatchText').innerText = `Found "${best.item.title}" reported at ${best.item.location}. Click to inspect.`;
          banner.onclick = () => {
            closeReportModal();
            selectAndShowDetails(best.item.id);
          };
          banner.classList.remove('hidden');
        } else {
          document.getElementById('reportAIMatchBanner').classList.add('hidden');
        }
      }
    } catch (e) {}
  }, 400);
}

function handleImageFileSelected(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Url = e.target.result;
    document.getElementById('reportImage').value = base64Url;
    document.getElementById('imagePreviewImg').src = base64Url;
    document.getElementById('imagePreviewContainer').classList.remove('hidden');
    playSound('ping');
  };
  reader.readAsDataURL(file);
}

function openAIStudio() {
  playSound('ping');
  document.getElementById('aiStudioModal').classList.remove('hidden');
  runAIMatch();
  if (window.lucide) lucide.createIcons();
}

function closeAIStudio() {
  document.getElementById('aiStudioModal').classList.add('hidden');
}

function setQueryPreset(text) {
  document.getElementById('aiQueryInput').value = text;
  runAIMatch();
}

async function runAIMatch() {
  const query = document.getElementById('aiQueryInput').value;
  const container = document.getElementById('aiResultsContainer');
  container.innerHTML = `<div class="p-6 text-center text-slate-400">Executing All AI Skills: Semantic NLP • Brand NER • Visual Colors • Geo Proximity • Temporal Decay...</div>`;

  try {
    const res = await fetch('/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    const data = await res.json();
    if (data.success) {
      playSound('success');
      container.innerHTML = data.matches.map(m => {
        const item = m.item;
        const b = m.skillsBreakdown || { semanticNLP: 92, brandNER: 100, visualColor: 95, geospatial: 98, temporal: 90 };

        return `
          <div class="bg-[#181C26] border border-slate-700/80 rounded-2xl p-5 space-y-4">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center space-x-4">
                <div class="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex-shrink-0">
                  <img src="${item.image}" class="w-full h-full object-cover">
                </div>
                <div>
                  <div class="flex items-center space-x-2">
                    <h4 class="text-base font-bold text-white">${item.title}</h4>
                    <span class="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">📍 ${item.location}</span>
                  </div>
                  <p class="text-xs text-slate-400 mt-1 line-clamp-1">${item.description}</p>
                </div>
              </div>

              <div class="flex flex-col items-end flex-shrink-0">
                <div class="text-xl font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 rounded-xl">
                  ${m.matchPercentage}% <span class="text-xs font-semibold">Match</span>
                </div>
                <button onclick="closeAIStudio(); selectAndShowDetails('${item.id}')" class="text-xs text-brand-blue font-bold hover:underline mt-2">
                  Inspect Item &rarr;
                </button>
              </div>
            </div>

            <div class="bg-[#11141B] p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Multimodal Skill Breakdown:</span>
              
              <div class="flex items-center justify-between text-slate-300">
                <span class="flex items-center space-x-1.5 font-medium"><i data-lucide="brain" class="w-3.5 h-3.5 text-blue-400"></i><span>Semantic NLP Match</span></span>
                <div class="flex items-center space-x-2 w-48">
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-blue-400 h-full rounded-full" style="width: ${b.semanticNLP}%"></div>
                  </div>
                  <span class="font-mono text-[11px] font-bold">${b.semanticNLP}%</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-slate-300">
                <span class="flex items-center space-x-1.5 font-medium"><i data-lucide="tag" class="w-3.5 h-3.5 text-purple-400"></i><span>Brand & Entity NER</span></span>
                <div class="flex items-center space-x-2 w-48">
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-purple-400 h-full rounded-full" style="width: ${b.brandNER}%"></div>
                  </div>
                  <span class="font-mono text-[11px] font-bold">${b.brandNER}%</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-slate-300">
                <span class="flex items-center space-x-1.5 font-medium"><i data-lucide="palette" class="w-3.5 h-3.5 text-emerald-400"></i><span>Visual & Color Palette</span></span>
                <div class="flex items-center space-x-2 w-48">
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-emerald-400 h-full rounded-full" style="width: ${b.visualColor}%"></div>
                  </div>
                  <span class="font-mono text-[11px] font-bold">${b.visualColor}%</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-slate-300">
                <span class="flex items-center space-x-1.5 font-medium"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-400"></i><span>Google Maps Geo Proximity</span></span>
                <div class="flex items-center space-x-2 w-48">
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-amber-400 h-full rounded-full" style="width: ${b.geospatial}%"></div>
                  </div>
                  <span class="font-mono text-[11px] font-bold">${b.geospatial}%</span>
                </div>
              </div>

              <div class="flex items-center justify-between text-slate-300">
                <span class="flex items-center space-x-1.5 font-medium"><i data-lucide="clock" class="w-3.5 h-3.5 text-rose-400"></i><span>Temporal Time Decay</span></span>
                <div class="flex items-center space-x-2 w-48">
                  <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div class="bg-rose-400 h-full rounded-full" style="width: ${b.temporal}%"></div>
                  </div>
                  <span class="font-mono text-[11px] font-bold">${b.temporal}%</span>
                </div>
              </div>
            </div>

            <div class="flex flex-wrap gap-1.5">
              ${m.reasons.map(r => `
                <span class="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-medium">
                  ✓ ${r}
                </span>
              `).join('')}
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="p-4 text-center text-red-400">Error running AI match.</div>`;
  }

  if (window.lucide) lucide.createIcons();
}

function openReportModal(status = 'lost') {
  playSound('ping');
  document.getElementById('reportModal').classList.remove('hidden');
  const radio = document.querySelector(`input[name="reportStatus"][value="${status}"]`);
  if (radio) radio.checked = true;
  if (window.lucide) lucide.createIcons();
}

function closeReportModal() {
  document.getElementById('reportModal').classList.add('hidden');
}

async function submitReport(e) {
  e.preventDefault();
  const status = document.querySelector('input[name="reportStatus"]:checked').value;
  const title = document.getElementById('reportTitle').value;
  const category = document.getElementById('reportCategory').value;
  const color = document.getElementById('reportColor').value;
  const location = document.getElementById('reportLocation').value;
  const reward = document.getElementById('reportReward').value;
  const description = document.getElementById('reportDesc').value;
  const image = document.getElementById('reportImage').value;
  const securityQuestion = document.getElementById('reportSecurityQ').value;

  const lat = window.lastClickedCoords ? window.lastClickedCoords.lat : null;
  const lng = window.lastClickedCoords ? window.lastClickedCoords.lng : null;

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        category,
        status,
        color,
        location,
        reward,
        description,
        image,
        securityQuestion,
        lat,
        lng,
        owner: currentUser ? currentUser.name : "Campus Student",
        ownerPhone: "+1 (555) 019-2834"
      })
    });

    const data = await res.json();
    if (data.success) {
      playSound('success');
      alert("✅ Item successfully reported! Live on Google Maps & AI matching feeds.");
      closeReportModal();
      document.getElementById('reportForm').reset();
      document.getElementById('imagePreviewContainer').classList.add('hidden');
      loadItems();
      loadStats();
      if (data.item) {
        selectItemOnMap(data.item);
      }
    }
  } catch (err) {
    console.error(err);
    alert("Error reporting item.");
  }
}
