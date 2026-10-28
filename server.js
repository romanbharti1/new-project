const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pre-seeded campus items matching user's presentation & mobile UI
let items = [
  {
    id: "item-1",
    title: "Adidas Backpack",
    category: "bags",
    status: "lost",
    color: "Olive",
    brand: "Adidas",
    owner: "John Simon",
    ownerEmail: "john.simon@campus.edu",
    ownerPhone: "+1 (555) 019-2834",
    reward: "$20",
    rewardAmount: 20,
    date: "28.12.2024, 11:57",
    timestamp: Date.now() - (3 * 3600 * 1000),
    location: "Nirmala Girls HSS / 86th Street",
    distance: "500m",
    lat: 13.0345,
    lng: 80.2138,
    description: "Olive green Adidas backpack with trefoil logo, front zip pocket, side water bottle mesh. Left near Nirmala Girls HSS campus lawn.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    tags: ["adidas", "backpack", "olive", "green", "bag", "school"],
    securityQuestion: "What brand was the water bottle in the side pocket?"
  },
  {
    id: "item-2",
    title: "Apple Watch SE 44mm",
    category: "watches",
    status: "lost",
    color: "Midnight Blue",
    brand: "Apple",
    owner: "Sarah Chen",
    ownerEmail: "sarah.chen@campus.edu",
    ownerPhone: "+1 (555) 014-9921",
    reward: "$50",
    rewardAmount: 50,
    date: "Today, 3 mins ago",
    timestamp: Date.now() - (3 * 60 * 1000),
    location: "Campus Sports Complex, Locker 4",
    distance: "0.6 km",
    lat: 13.0315,
    lng: 80.2110,
    description: "Apple Watch SE 44mm GPS with midnight sport band, small scratch on top-right edge.",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80",
    tags: ["apple", "watch", "smartwatch", "se", "midnight", "tech"],
    securityQuestion: "What photo is set as the watch face background?"
  },
  {
    id: "item-3",
    title: "House Keys with Keychain",
    category: "keys",
    status: "lost",
    color: "Brass / Metallic",
    brand: "Generic",
    owner: "Marcus Brody",
    ownerEmail: "marcus.brody@campus.edu",
    ownerPhone: "+1 (555) 012-4412",
    reward: "$15",
    rewardAmount: 15,
    date: "Today, 32 mins ago",
    timestamp: Date.now() - (32 * 60 * 1000),
    location: "Main Library 2nd Floor Reading Room",
    distance: "2.5 km",
    lat: 13.0360,
    lng: 80.2155,
    description: "Bundle of 4 brass keys with a miniature Eiffel Tower metallic keychain and blue tag.",
    image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80",
    tags: ["keys", "keychain", "brass", "eiffel tower", "house keys"],
    securityQuestion: "What is written on the small blue plastic tag?"
  },
  {
    id: "item-4",
    title: "iPhone 14 Pro Max",
    category: "phones",
    status: "lost",
    color: "Deep Purple",
    brand: "Apple",
    owner: "Aria Patel",
    ownerEmail: "aria.patel@campus.edu",
    ownerPhone: "+1 (555) 018-7733",
    reward: "$100",
    rewardAmount: 100,
    date: "Yesterday, 16:06",
    timestamp: Date.now() - (20 * 3600 * 1000),
    location: "Auditorium Hall B, Seat 42",
    distance: "1.3 km",
    lat: 13.0350,
    lng: 80.2105,
    description: "iPhone 14 Pro Max in Deep Purple with a transparent MagSafe case and cracked screen protector.",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
    tags: ["iphone", "apple", "phone", "purple", "pro max", "smartphone"],
    securityQuestion: "What sticker is inside the transparent case?"
  },
  {
    id: "item-5",
    title: "Car Keys, Alfa Romeo",
    category: "keys",
    status: "lost",
    color: "Black / Chrome",
    brand: "Alfa Romeo",
    owner: "David Miller",
    ownerEmail: "david.miller@campus.edu",
    ownerPhone: "+1 (555) 011-8931",
    reward: "$40",
    rewardAmount: 40,
    date: "Yesterday, 14:15",
    timestamp: Date.now() - (22 * 3600 * 1000),
    location: "West Student Parking Lot B",
    distance: "2.5 km",
    lat: 13.0305,
    lng: 80.2170,
    description: "Modern Alfa Romeo fob key with black leather strap and chrome badge.",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80",
    tags: ["car key", "fob", "alfa romeo", "keys", "remote"],
    securityQuestion: "What color is the stitching on the leather strap?"
  },
  {
    id: "item-6",
    title: "Brown Leather Bifold Wallet",
    category: "all",
    status: "found",
    color: "Brown",
    brand: "Wildhorn",
    owner: "Found by Campus Security",
    ownerEmail: "security@campus.edu",
    ownerPhone: "+1 (555) 010-0000",
    reward: "$0",
    rewardAmount: 0,
    date: "4 days ago",
    timestamp: Date.now() - (4 * 24 * 3600 * 1000),
    location: "Cafeteria Table 14",
    distance: "0.2 km",
    lat: 13.0330,
    lng: 80.2140,
    description: "Genuine brown leather bifold wallet with student ID card and bus pass inside.",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80",
    tags: ["wallet", "leather", "brown", "money", "id card"],
    securityQuestion: "What is the initial or name on the student ID card?"
  }
];

let claims = [];
let users = [
  {
    id: "usr-1",
    name: "John Simon",
    email: "john.simon@campus.edu",
    password: "password123",
    studentId: "ST-8821",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    walletBalance: 125.00
  },
  {
    id: "usr-admin",
    name: "Dr. Alistair Vance",
    email: "admin@campus.edu",
    password: "admin",
    studentId: "FAC-001",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    walletBalance: 500.00
  }
];
let payments = [];

// ==========================================
// ALL AI MATCHING SKILLS ENGINE
// ==========================================
const KNOWN_BRANDS = [
  "adidas", "nike", "apple", "samsung", "dell", "hp", "lenovo", "sony", "wildhorn",
  "alfa romeo", "puma", "reebok", "casio", "fossil", "titan", "rolex", "fitbit", "bose"
];

function extractBrandSkill(text) {
  const lower = text.toLowerCase();
  for (const b of KNOWN_BRANDS) {
    if (lower.includes(b)) return b;
  }
  return null;
}

const COLOR_SPECTRUM = [
  "olive", "green", "black", "blue", "purple", "midnight", "brown", "red", "white",
  "silver", "brass", "gold", "yellow", "orange", "grey", "gray", "dark"
];

function extractVisualColorSkill(text) {
  const lower = text.toLowerCase();
  return COLOR_SPECTRUM.filter(c => lower.includes(c));
}

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function computeGeoSkill(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 80;
  const dist = haversineDistanceMeters(lat1, lng1, lat2, lng2);
  if (dist <= 300) return 98;
  if (dist <= 800) return 92;
  if (dist <= 1500) return 82;
  if (dist <= 3000) return 65;
  return 45;
}

function computeTemporalSkill(time1, time2) {
  const diffHours = Math.abs((time1 - time2) / (1000 * 3600));
  if (diffHours <= 6) return 95;
  if (diffHours <= 24) return 90;
  if (diffHours <= 72) return 78;
  return 60;
}

const categoryKeywords = {
  bags: ["backpack", "bag", "rucksack", "purse", "adidas", "nike", "handbag", "duffel", "satchel"],
  keys: ["key", "keychain", "keys", "car key", "fob", "brass", "house key", "ring"],
  phones: ["iphone", "samsung", "android", "phone", "smartphone", "mobile", "pro max", "pixel"],
  watches: ["watch", "apple watch", "smartwatch", "seiko", "rolex", "casio", "fitbit", "band"]
};

function computeSemanticNLPSkill(queryText, item) {
  const queryTokens = queryText.toLowerCase().split(/[\s,.-]+/).filter(Boolean);
  const itemText = `${item.title} ${item.category} ${item.description} ${item.tags.join(' ')}`.toLowerCase();

  let tokenHits = 0;
  let categoryMatch = false;

  queryTokens.forEach(t => {
    if (t.length > 2 && itemText.includes(t)) tokenHits++;
  });

  for (const [cat, kws] of Object.entries(categoryKeywords)) {
    const qHas = queryTokens.some(t => kws.includes(t) || t === cat);
    if (qHas && item.category === cat) {
      categoryMatch = true;
      break;
    }
  }

  let score = 40;
  if (tokenHits > 0) score += Math.min(tokenHits * 18, 45);
  if (categoryMatch) score += 20;

  return Math.min(score, 98);
}

function executeAllAIMatchingSkills(queryText, userLat, userLng, item) {
  const queryBrand = extractBrandSkill(queryText);
  const queryColors = extractVisualColorSkill(queryText);
  
  const semanticScore = computeSemanticNLPSkill(queryText, item);

  let brandScore = 50;
  let brandReason = null;
  if (queryBrand) {
    if (item.brand && item.brand.toLowerCase() === queryBrand) {
      brandScore = 100;
      brandReason = `Brand Matched: '${item.brand}' (100% confidence)`;
    } else if (item.title.toLowerCase().includes(queryBrand)) {
      brandScore = 95;
      brandReason = `Brand identified in title: '${queryBrand}'`;
    } else {
      brandScore = 30;
    }
  }

  let visualScore = 50;
  let colorReason = null;
  if (queryColors.length > 0) {
    const matchedColors = queryColors.filter(c => item.color.toLowerCase().includes(c) || item.description.toLowerCase().includes(c));
    if (matchedColors.length > 0) {
      visualScore = 95;
      colorReason = `Visual color palette matched: ${matchedColors.join(', ')}`;
    } else {
      visualScore = 35;
    }
  }

  const geoScore = computeGeoSkill(userLat, userLng, item.lat, item.lng);
  const tempScore = computeTemporalSkill(Date.now(), item.timestamp || (Date.now() - 3600000));

  let compositeScore = (semanticScore * 0.35) + (brandScore * 0.25) + (visualScore * 0.20) + (geoScore * 0.12) + (tempScore * 0.08);
  compositeScore = Math.min(Math.max(Math.round(compositeScore), 35), 98);

  const reasons = [];
  if (brandReason) reasons.push(brandReason);
  if (colorReason) reasons.push(colorReason);
  if (semanticScore >= 75) reasons.push(`Semantic & textual context alignment (${semanticScore}%)`);
  if (geoScore >= 90) reasons.push(`Geospatial: Within immediate campus perimeter (${geoScore}%)`);
  if (tempScore >= 85) reasons.push(`Temporal: Reported in high-correlation time window`);
  if (reasons.length === 0) reasons.push("General visual and category similarity");

  return {
    overallScore: compositeScore,
    skillsBreakdown: {
      semanticNLP: semanticScore,
      brandNER: brandScore,
      visualColor: visualScore,
      geospatial: geoScore,
      temporal: tempScore
    },
    reasons
  };
}

// ==========================================
// REST APIS
// ==========================================

// 1. Auth APIs (Login & Register)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required" });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, error: "Invalid campus credentials. Please check your email or password." });
  }

  const { password: _, ...userSafe } = user;
  res.json({
    success: true,
    message: "Login successful",
    token: `fb_token_${Date.now()}`,
    user: userSafe
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, studentId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, email, and password are required" });
  }

  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, error: "Student email is already registered." });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    password,
    studentId: studentId || `ST-${Math.floor(1000 + Math.random() * 9000)}`,
    role: "student",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    walletBalance: 50.00 // Welcome student wallet bonus
  };

  users.push(newUser);
  const { password: _, ...userSafe } = newUser;
  res.status(201).json({
    success: true,
    message: "Registration successful! Welcome bonus of $50 added to your campus wallet.",
    token: `fb_token_${Date.now()}`,
    user: userSafe
  });
});

// 2. Payments & Reward Escrow APIs
app.post('/api/payments/checkout', (req, res) => {
  const { itemId, amount, paymentMethod, payerName, payerEmail, cardNumber, upiId } = req.body;
  const item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ success: false, error: "Item not found" });

  const paymentRecord = {
    id: `PAY-${Date.now().toString().slice(-6)}`,
    itemId: item.id,
    itemTitle: item.title,
    rewardAmount: amount || item.rewardAmount || 20,
    escrowFee: 2.50,
    totalPaid: (amount || item.rewardAmount || 20) + 2.50,
    paymentMethod: paymentMethod || "card",
    payerName: payerName || "Anonymous Student",
    payerEmail: payerEmail || "student@campus.edu",
    status: "paid_in_escrow",
    releaseCode: `REL-${Math.floor(100000 + Math.random() * 900000)}`,
    timestamp: new Date().toISOString()
  };

  payments.push(paymentRecord);

  // Update item status
  item.status = "reward_escrowed";

  res.status(201).json({
    success: true,
    message: "Payment authorized and securely locked in FindBack Campus Escrow!",
    receipt: paymentRecord
  });
});

app.get('/api/payments/history', (req, res) => {
  res.json({ success: true, count: payments.length, payments });
});

// 3. Items APIs
app.get('/api/items', (req, res) => {
  const { category, status, search } = req.query;
  let filtered = [...items];

  if (category && category !== 'all') {
    filtered = filtered.filter(i => i.category.toLowerCase() === category.toLowerCase());
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(i => i.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(i => 
      i.title.toLowerCase().includes(q) || 
      i.description.toLowerCase().includes(q) ||
      i.location.toLowerCase().includes(q) ||
      i.color.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: filtered.length, items: filtered });
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, error: "Item not found" });
  res.json({ success: true, item });
});

app.post('/api/items', (req, res) => {
  const { title, category, status, color, brand, owner, ownerPhone, reward, location, description, image, securityQuestion, lat, lng } = req.body;
  
  if (!title || !category || !description) {
    return res.status(400).json({ success: false, error: "Title, category, and description are required" });
  }

  const baseLat = 13.0336;
  const baseLng = 80.2132;
  const itemLat = lat ? parseFloat(lat) : (baseLat + (Math.random() - 0.5) * 0.008);
  const itemLng = lng ? parseFloat(lng) : (baseLng + (Math.random() - 0.5) * 0.008);

  const parsedReward = reward ? parseInt(reward.replace(/[^0-9]/g, '')) || 0 : 0;

  const newItem = {
    id: `item-${Date.now()}`,
    title,
    category: category.toLowerCase(),
    status: status || 'lost',
    color: color || 'Various',
    brand: brand || extractBrandSkill(title) || 'Generic',
    owner: owner || 'Campus Student',
    ownerPhone: ownerPhone || '+1 (555) 000-0000',
    reward: reward || '$0',
    rewardAmount: parsedReward,
    date: 'Just now',
    timestamp: Date.now(),
    location: location || 'Campus Center',
    distance: '0.1 km',
    lat: itemLat,
    lng: itemLng,
    coords: { x: Math.floor(Math.random() * 60) + 20, y: Math.floor(Math.random() * 60) + 20 },
    description,
    image: image || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
    tags: title.toLowerCase().split(' ').concat(category.toLowerCase()),
    securityQuestion: securityQuestion || "Describe one unique distinguishing feature."
  };

  items.unshift(newItem);
  res.status(201).json({ success: true, item: newItem });
});

// 4. All AI Matching Skills Endpoint
app.post('/api/match', (req, res) => {
  const { query, lat, lng } = req.body;
  const searchText = query || "backpack bag";
  const userLat = lat ? parseFloat(lat) : 13.0336;
  const userLng = lng ? parseFloat(lng) : 80.2132;

  const ranked = items.map(item => {
    const aiResult = executeAllAIMatchingSkills(searchText, userLat, userLng, item);
    return {
      item,
      matchPercentage: aiResult.overallScore,
      skillsBreakdown: aiResult.skillsBreakdown,
      reasons: aiResult.reasons
    };
  });

  ranked.sort((a, b) => b.matchPercentage - a.matchPercentage);
  const topMatches = ranked.slice(0, 4);

  res.json({
    success: true,
    query: searchText,
    engine: "Multimodal AI Matching Suite",
    matches: topMatches
  });
});

// 5. Submit Claim Verification
app.post('/api/claims', (req, res) => {
  const { itemId, claimantName, claimantPhone, answer, proofNotes } = req.body;
  const item = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ success: false, error: "Item not found" });

  const claim = {
    id: `claim-${Date.now()}`,
    itemId,
    itemTitle: item.title,
    claimantName,
    claimantPhone,
    answer,
    proofNotes,
    status: "pending_review",
    submittedAt: new Date().toISOString()
  };

  claims.push(claim);
  res.status(201).json({
    success: true,
    message: "Claim submitted successfully. Campus Lost & Found admins will verify your answer.",
    claim
  });
});

// 6. Campus Analytics / Stats
app.get('/api/stats', (req, res) => {
  const total = items.length;
  const lost = items.filter(i => i.status === 'lost').length;
  const found = items.filter(i => i.status === 'found').length;
  const recovered = 42;
  const recoveryRate = Math.round((recovered / (recovered + lost)) * 100);

  res.json({
    totalReported: total + recovered,
    activeLost: lost,
    activeFound: found,
    recoveredCount: recovered,
    recoveryRate: `${recoveryRate}%`,
    topCategories: [
      { name: "Bags", count: 18, color: "#7CB342" },
      { name: "Keys", count: 14, color: "#FB8C00" },
      { name: "Phones", count: 12, color: "#42A5F5" },
      { name: "Watches", count: 8, color: "#AB47BC" }
    ]
  });
});

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 FindBack AI Server running at http://localhost:${PORT}`);
  console.log(`📌 Lost Today. Found Tomorrow. (Campus Lost & Found)`);
  console.log(`🔐 Student Auth & Escrow Reward Payments Active`);
  console.log(`=================================================`);
});
