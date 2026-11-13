const nav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");
const views = [...document.querySelectorAll(".view")];
const navButtons = [...document.querySelectorAll("[data-view]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ==========================================================================
   1. NAVIGATION & VIEW ROUTING
   ========================================================================== */
function syncNavOrbit() {
  const activeButton = nav.querySelector(".nav-link.is-active");
  const indicator = nav.querySelector(".nav-orbit-trail");
  if (!activeButton || !indicator || window.innerWidth <= 820) return;

  const navRect = nav.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();
  nav.style.setProperty("--nav-indicator-x", `${buttonRect.left - navRect.left}px`);
  nav.style.setProperty("--nav-indicator-width", `${buttonRect.width}px`);
}

function showView(name) {
  const view = document.querySelector(`#view-${name}`);
  if (!view) return;

  views.forEach((item) => {
    const active = item === view;
    item.classList.toggle("is-visible", active);
    item.hidden = !active;
  });

  document.querySelectorAll(".nav-link, .dock-link").forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  document.documentElement.dataset.activeView = name;
  nav.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  syncNavOrbit();
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });

  if (name === "dashboard") {
    setTimeout(resizeDashboardEcg, 50);
  }
}

navButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.matches("a")) event.preventDefault();
    showView(button.dataset.view);
  });
});

menuToggle.addEventListener("click", () => {
  const open = !nav.classList.contains("is-open");
  nav.classList.toggle("is-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("is-open")) {
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuToggle.focus();
  }
});

/* ==========================================================================
   2. NASA ASSET RESOLUTION & HERO CAROUSEL
   ========================================================================== */
const nasaAssetCache = new Map();

function getNasaAsset(nasaId) {
  if (nasaAssetCache.has(nasaId)) return nasaAssetCache.get(nasaId);

  const request = (async () => {
    const searchUrl = new URL("https://images-api.nasa.gov/search");
    searchUrl.searchParams.set("nasa_id", nasaId);
    searchUrl.searchParams.set("media_type", "image");

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) throw new Error(`NASA image search returned ${searchResponse.status}`);
    const searchData = await searchResponse.json();
    const record = searchData.collection?.items?.find((item) => item.data?.[0]?.nasa_id === nasaId);
    if (!record) throw new Error(`NASA image ${nasaId} was not found`);

    const assetResponse = await fetch(`https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`);
    if (!assetResponse.ok) throw new Error(`NASA asset request returned ${assetResponse.status}`);
    const assetData = await assetResponse.json();
    const files = assetData.collection?.items?.map((item) => item.href) ?? [];
    const src = files.find((href) => /~large\.(jpe?g|png)$/i.test(href))
      ?? files.find((href) => /~medium\.(jpe?g|png)$/i.test(href))
      ?? record.links?.find((link) => link.rel === "preview")?.href;

    if (!src) throw new Error(`NASA image ${nasaId} has no display asset`);
    return {
      src: src.replace(/^http:/i, "https:"),
      title: record.data[0].title,
      center: record.data[0].center ?? "NASA",
    };
  })();

  nasaAssetCache.set(nasaId, request);
  return request;
}

async function resolveNasaImage(image) {
  const nasaId = image.dataset.nasaId;
  if (!nasaId) return;

  try {
    const asset = await getNasaAsset(nasaId);
    if (image.dataset.nasaId !== nasaId) return;
    image.src = asset.src;
    image.dataset.nasaTitle = asset.title;
    image.dataset.nasaCredit = asset.center;
    image.classList.add("api-resolved");
  } catch (error) {
    image.classList.add("api-fallback");
  }
}

document.querySelectorAll("img[data-nasa-id]").forEach((image) => {
  resolveNasaImage(image);
});

const hero = document.querySelector(".nasa-hero");
const heroImage = document.querySelector("#nasa-hero-image");
const heroTitle = document.querySelector(".hero-image-label strong");
const heroKicker = document.querySelector(".hero-image-label .label-kicker");
const heroCoordinate = document.querySelector(".hero-image-label .label-coordinate");
const heroCredit = document.querySelector(".image-credit span");
const heroRecord = document.querySelector(".image-credit a");
const heroCount = document.querySelector("#hero-image-count");
const heroNext = document.querySelector("#hero-image-next");
const heroSlides = [
  {
    id: "iss071e581260_alt",
    src: "https://images-assets.nasa.gov/image/iss071e581260_alt/iss071e581260_alt~large.jpg",
    alt: "An astronaut looks out the International Space Station cupola as the setting sun lights Earth's horizon.",
    kicker: "FROM THE CUPOLA",
    title: "Earth, at the edge of day.",
    coordinate: "INTERNATIONAL SPACE STATION · 262 MILES ABOVE EARTH",
    credit: "NASA/JSC · 01 SEP 2024 · ISS071E581260_ALT",
  },
  {
    id: "iss073e0702307",
    src: "https://images-assets.nasa.gov/image/iss073e0702307/iss073e0702307~large.jpg",
    alt: "NASA astronaut Mike Fincke pedals an exercise cycle aboard the International Space Station.",
    kicker: "CREW IN MOTION",
    title: "Movement, measured in orbit.",
    coordinate: "INTERNATIONAL SPACE STATION · 17 SEP 2025",
    credit: "NASA/JSC · 17 SEP 2025 · ISS073E0702307",
  },
  {
    id: "iss057e134112",
    src: "https://images-assets.nasa.gov/image/iss057e134112/iss057e134112~large.jpg",
    alt: "NASA astronaut Anne McClain exercises in the Destiny laboratory module with exercise equipment and sensors nearby.",
    kicker: "TRAINING & SENSORS",
    title: "Care, built into the mission.",
    coordinate: "DESTINY LABORATORY · 13 DEC 2018",
    credit: "NASA/JSC · 13 DEC 2018 · ISS057E134112",
  },
];
let currentHeroSlide = 0;
let heroChangeToken = 0;

function updateHeroSlide(index) {
  currentHeroSlide = (index + heroSlides.length) % heroSlides.length;
  const slide = heroSlides[currentHeroSlide];
  const token = ++heroChangeToken;

  hero.classList.add("is-image-changing");
  heroCount.innerHTML = `${String(currentHeroSlide + 1).padStart(2, "0")} <i>/</i> ${String(heroSlides.length).padStart(2, "0")}`;
  heroNext.setAttribute("aria-label", `Show next NASA image, ${currentHeroSlide + 1} of ${heroSlides.length}`);

  window.setTimeout(() => {
    if (token !== heroChangeToken) return;
    const revealImage = () => {
      if (token === heroChangeToken) hero.classList.remove("is-image-changing");
    };
    heroImage.addEventListener("load", revealImage, { once: true });
    heroImage.addEventListener("error", revealImage, { once: true });
    heroImage.src = slide.src;
    heroImage.alt = slide.alt;
    heroImage.dataset.nasaId = slide.id;
    heroKicker.textContent = slide.kicker;
    heroTitle.textContent = slide.title;
    heroCoordinate.textContent = slide.coordinate;
    heroCredit.textContent = slide.credit;
    heroRecord.href = `https://images.nasa.gov/details/${slide.id}`;
    if (heroImage.complete) revealImage();
  }, reducedMotion.matches ? 0 : 190);

  getNasaAsset(slide.id).then((asset) => {
    if (token !== heroChangeToken) return;
    heroImage.src = asset.src;
    heroImage.dataset.nasaTitle = asset.title;
    heroImage.dataset.nasaCredit = asset.center;
  }).catch(() => {});
}

heroNext.addEventListener("click", () => updateHeroSlide(currentHeroSlide + 1));

window.setInterval(() => {
  const overviewIsActive = document.querySelector("#view-overview").classList.contains("is-visible");
  if (!reducedMotion.matches && overviewIsActive && document.visibilityState === "visible") {
    updateHeroSlide(currentHeroSlide + 1);
  }
}, 8500);

/* ==========================================================================
   3. CURSOR & PARALLAX MOTION EFFECTS
   ========================================================================== */
const motionLayers = [
  ...document.querySelectorAll(".metric-card, .insight-card, .assistant-intro, .story-photo, .crew-card, .csv-engine-panel"),
];

motionLayers.forEach((layer) => {
  layer.addEventListener("pointermove", (event) => {
    if (reducedMotion.matches || event.pointerType === "touch") return;
    const rect = layer.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const tiltX = (0.5 - y) * 1.5;
    const tiltY = (x - 0.5) * 1.5;
    layer.style.setProperty("--surface-x", `${Math.round(x * 100)}%`);
    layer.style.setProperty("--surface-y", `${Math.round(y * 100)}%`);
    layer.style.transform = `perspective(900px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
  }, { passive: true });

  layer.addEventListener("pointerleave", () => {
    layer.style.transform = "";
  });
});

let pointerFrame = 0;
document.addEventListener("pointermove", (event) => {
  if (reducedMotion.matches || event.pointerType === "touch") return;
  if (pointerFrame) return;

  pointerFrame = window.requestAnimationFrame(() => {
    document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    pointerFrame = 0;
  });
}, { passive: true });

let scrollFrame = 0;
function updateScrollMotion() {
  scrollFrame = 0;
  if (reducedMotion.matches) return;

  const heroRect = hero.getBoundingClientRect();
  const heroProgress = Math.max(0, Math.min(1, (window.innerHeight - heroRect.top) / (window.innerHeight + heroRect.height)));
  const scrollScale = (1.025 + heroProgress * 0.13).toFixed(3);
  hero.style.setProperty("--hero-scroll-scale", scrollScale);
  heroImage.style.setProperty("--hero-scale", scrollScale);
  document.documentElement.style.setProperty("--space-parallax", `${Math.round(window.scrollY * -0.045)}px`);

  document.querySelectorAll(".story-photo").forEach((photo) => {
    const rect = photo.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    photo.style.setProperty("--story-scroll-scale", (1 + progress * 0.045).toFixed(3));
  });
}

window.addEventListener("scroll", () => {
  if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollMotion);
}, { passive: true });

hero.addEventListener("pointermove", (event) => {
  if (reducedMotion.matches || event.pointerType === "touch") return;
  const rect = hero.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  hero.style.setProperty("--hero-pointer-x", `${Math.round(x * 100)}%`);
  hero.style.setProperty("--hero-pointer-y", `${Math.round(y * 100)}%`);
  heroImage.style.setProperty("--hero-shift-x", `${((0.5 - x) * 20).toFixed(1)}px`);
  heroImage.style.setProperty("--hero-shift-y", `${((0.5 - y) * 14).toFixed(1)}px`);
  const scrollScale = Number(hero.style.getPropertyValue("--hero-scroll-scale")) || 1.025;
  const pointerScale = Math.min(0.025, (Math.abs(x - 0.5) + Math.abs(y - 0.5)) * 0.018);
  heroImage.style.setProperty("--hero-scale", (scrollScale + pointerScale).toFixed(3));
}, { passive: true });

hero.addEventListener("pointerleave", () => {
  heroImage.style.setProperty("--hero-shift-x", "0px");
  heroImage.style.setProperty("--hero-shift-y", "0px");
  heroImage.style.setProperty("--hero-scale", hero.style.getPropertyValue("--hero-scroll-scale") || "1.025");
  hero.style.setProperty("--hero-pointer-x", "50%");
  hero.style.setProperty("--hero-pointer-y", "50%");
}, { passive: true });

window.addEventListener("resize", () => {
  syncNavOrbit();
  updateScrollMotion();
  resizeDashboardEcg();
});

reducedMotion.addEventListener?.("change", updateScrollMotion);
syncNavOrbit();
updateScrollMotion();


/* ==========================================================================
   4. CSV DATASET TELEMETRY & PLAYBACK ENGINE (NO RANDOM DATA)
   ========================================================================== */

let activeCsvRows = [];
let playbackIndex = 0;
let isPlaybackPlaying = true;
let playbackSpeed = 1;
let playbackIntervalId = null;
let currentEcgRate = 72;

// Robust in-browser CSV parser
function parseCsvString(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    if (values.length < headers.length) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx];
    });

    // Clean numeric conversions
    rowObj.heart_rate = parseFloat(rowObj.heart_rate) || 72;
    rowObj.spo2 = parseFloat(rowObj.spo2) || 98.9;
    rowObj.respiration = parseFloat(rowObj.respiration) || 14;
    rowObj.core_temp = parseFloat(rowObj.core_temp) || 36.9;
    rowObj.cabin_co2 = parseFloat(rowObj.cabin_co2) || 0.31;
    rowObj.radiation = parseFloat(rowObj.radiation) || 0.42;
    rowObj.anomaly_type = rowObj.anomaly_type || "NONE";
    rowObj.notes = rowObj.notes || "";

    rows.push(rowObj);
  }
  return rows;
}

// 1. Handle Drag & Drop / Custom CSV File Upload
function handleCsvUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    const parsed = parseCsvString(text);
    if (parsed.length === 0) {
      alert("Invalid CSV format. Please ensure your file has headers like timestamp, heart_rate, spo2, respiration...");
      return;
    }

    document.querySelectorAll(".preset-chip").forEach((c) => c.classList.remove("is-active"));
    document.querySelector("#active-dataset-name").textContent = `CUSTOM: ${file.name.toUpperCase()}`;
    loadIngestedData(parsed, file.name);
  };
  reader.readAsText(file);
}

// 2. Load Preset Datasets (from d:/AntiGravity/data/*.csv)
const PRESET_URLS = {
  nominal: "data/1_nasa_iss_cupola_nominal.csv",
  hypoxia: "data/2_nasa_eva_spacewalk_hypoxia.csv",
  ared: "data/3_nasa_ared_heavy_exercise.csv",
  radiation: "data/4_mars_solar_radiation_flare.csv",
  sans: "data/5_microgravity_sans_fluid_shift.csv",
  arrhythmia: "data/6_physionet_ventricular_arrhythmia.csv"
};

const PRESET_NAMES = {
  nominal: "NASA LSDA-0042 // ISS CUPOLA NOMINAL BASELINE",
  hypoxia: "NASA EVA SUIT // HYPOXIA DROP & EMERGENCY PURGE",
  ared: "NASA HRP-EX04 // ARED RESISTIVE BONE-LOADING WORKOUT",
  radiation: "DEEP SPACE MARS // SOLAR PARTICLE EVENT (SPE) FLARE",
  sans: "NASA SANS PROTOCOL // CEPHALAD FLUID SHIFT & LBNP",
  arrhythmia: "PHYSIONET MIT-BIH #208 // VENTRICULAR TACHYCARDIA"
};

async function loadPresetDataset(presetKey) {
  const url = PRESET_URLS[presetKey];
  if (!url) return;

  document.querySelectorAll(".preset-chip").forEach((c) => c.classList.remove("is-active"));
  const btn = document.querySelector(`#preset-${presetKey}`);
  if (btn) btn.classList.add("is-active");

  document.querySelector("#active-dataset-name").textContent = PRESET_NAMES[presetKey];

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const rows = parseCsvString(text);
    loadIngestedData(rows, PRESET_NAMES[presetKey]);
  } catch (err) {
    console.error("Failed to load preset CSV:", err);
  }
}

// 3. Initialize Ingested Data Stream
function loadIngestedData(rows, datasetLabel) {
  activeCsvRows = rows;
  playbackIndex = 0;

  // Update Scrubber
  const scrubber = document.querySelector("#playback-scrubber");
  if (scrubber) {
    scrubber.max = String(rows.length - 1);
    scrubber.value = "0";
  }

  const totalDisplay = document.querySelector("#playback-total-display");
  if (totalDisplay && rows.length > 0) {
    totalDisplay.textContent = rows[rows.length - 1].timestamp || `Row ${rows.length}`;
  }

  const inspectorCount = document.querySelector("#inspector-row-count");
  if (inspectorCount) inspectorCount.textContent = `${rows.length} rows loaded`;

  // Populate Table Inspector
  renderCsvTableRows(rows);

  // Apply row 0
  applyCsvRow(rows[0]);

  // Restart playback timer
  startPlaybackLoop();
}

function renderCsvTableRows(rows) {
  const tbody = document.querySelector("#csv-table-body");
  if (!tbody) return;

  let html = "";
  rows.forEach((r, idx) => {
    const isAnomaly = r.anomaly_type && r.anomaly_type !== "NONE";
    const badgeColor = isAnomaly ? "color:#f87171; font-weight:700;" : "color:#76e4d2;";

    html += `
      <tr id="csv-row-${idx}" onclick="jumpToRow(${idx})" style="cursor: pointer;">
        <td>${r.timestamp}</td>
        <td>${r.heart_rate}</td>
        <td>${r.spo2}%</td>
        <td>${r.respiration}</td>
        <td>${r.core_temp}°C</td>
        <td>${r.cabin_co2}%</td>
        <td>${r.radiation}</td>
        <td style="${badgeColor}">${r.anomaly_type}</td>
        <td>${r.notes}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// 4. Live Playback Loop
function startPlaybackLoop() {
  if (playbackIntervalId) clearInterval(playbackIntervalId);
  if (!isPlaybackPlaying) return;

  const intervalMs = Math.max(100, Math.floor(1000 / playbackSpeed));

  playbackIntervalId = setInterval(() => {
    if (activeCsvRows.length === 0) return;

    playbackIndex = (playbackIndex + 1) % activeCsvRows.length;
    applyCsvRow(activeCsvRows[playbackIndex]);

    const scrubber = document.querySelector("#playback-scrubber");
    if (scrubber) scrubber.value = String(playbackIndex);

    const timeDisp = document.querySelector("#playback-time-display");
    if (timeDisp) timeDisp.textContent = activeCsvRows[playbackIndex].timestamp || `Row ${playbackIndex + 1}`;

    const statusLine = document.querySelector("#dataset-status-line");
    if (statusLine) {
      statusLine.innerHTML = `STATUS: <strong style="color: #76e4d2;">PLAYING ROW ${playbackIndex + 1} / ${activeCsvRows.length}</strong> · ${activeCsvRows[playbackIndex].timestamp}`;
    }

    // Highlight row in table
    highlightTableRow(playbackIndex);
  }, intervalMs);
}

function applyCsvRow(row) {
  if (!row) return;

  currentEcgRate = row.heart_rate;

  const elHr = document.querySelector("#val-hr");
  const elSpo2 = document.querySelector("#val-spo2");
  const elResp = document.querySelector("#val-resp");
  const elTemp = document.querySelector("#val-temp");
  const elSubHr = document.querySelector("#sub-hr");
  const elSubSpo2 = document.querySelector("#sub-spo2");
  const elSubEnv = document.querySelector("#sub-env");
  const elRr = document.querySelector("#stat-rr");

  if (elHr) elHr.textContent = row.heart_rate.toFixed(1);
  if (elSpo2) elSpo2.textContent = row.spo2.toFixed(1);
  if (elResp) elResp.textContent = row.respiration.toFixed(1);
  if (elTemp) elTemp.textContent = row.core_temp.toFixed(1);

  if (elSubHr) elSubHr.textContent = row.notes || "CSV Telemetry Stream Active";
  if (elSubEnv) elSubEnv.textContent = `pCO₂: ${row.cabin_co2}% · Rad: ${row.radiation} mSv/d`;

  if (elSubSpo2) {
    if (row.spo2 < 90) elSubSpo2.innerHTML = "<b style='color:#f87171;'>Warning: SpO₂ Below Safe Threshold</b>";
    else elSubSpo2.textContent = "Arterial O₂ optimal (98-100%)";
  }

  if (elRr) {
    const rr = Math.round(60000 / row.heart_rate);
    elRr.textContent = `${rr} ms`;
  }

  // Update active crew card metrics
  const cHr = document.querySelector("#crew-card-hr");
  const cSpo2 = document.querySelector("#crew-card-spo2");
  if (cHr) cHr.textContent = `${Math.round(row.heart_rate)} bpm`;
  if (cSpo2) cSpo2.textContent = `${row.spo2.toFixed(1)}%`;

  // Trigger alert if CSV row has an anomaly
  if (row.anomaly_type && row.anomaly_type !== "NONE" && !row._alertFired) {
    row._alertFired = true;
    addDynamicAlert(`CSV ANOMALY: ${row.anomaly_type}`, `${row.notes} (Recorded at ${row.timestamp})`, row.anomaly_type.includes("HYPOXIA") ? "critical" : "warning");
  }
}

function highlightTableRow(idx) {
  document.querySelectorAll(".csv-table tr").forEach((tr) => tr.classList.remove("is-active-row"));
  const rowEl = document.querySelector(`#csv-row-${idx}`);
  if (rowEl) {
    rowEl.classList.add("is-active-row");
    rowEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

// 5. Playback Controls
function togglePlayback() {
  isPlaybackPlaying = !isPlaybackPlaying;
  const btn = document.querySelector("#playback-toggle-btn");
  if (btn) btn.textContent = isPlaybackPlaying ? "⏸ Pause" : "▶ Play";
  if (isPlaybackPlaying) startPlaybackLoop();
  else if (playbackIntervalId) clearInterval(playbackIntervalId);
}

function restartPlayback() {
  playbackIndex = 0;
  applyCsvRow(activeCsvRows[0]);
  const scrubber = document.querySelector("#playback-scrubber");
  if (scrubber) scrubber.value = "0";
  if (!isPlaybackPlaying) togglePlayback();
  else startPlaybackLoop();
}

function scrubPlayback(val) {
  playbackIndex = parseInt(val, 10);
  applyCsvRow(activeCsvRows[playbackIndex]);
  const timeDisp = document.querySelector("#playback-time-display");
  if (timeDisp && activeCsvRows[playbackIndex]) {
    timeDisp.textContent = activeCsvRows[playbackIndex].timestamp || `Row ${playbackIndex + 1}`;
  }
  highlightTableRow(playbackIndex);
}

function jumpToRow(idx) {
  scrubPlayback(idx);
}

function setPlaybackSpeed(spd, btn) {
  playbackSpeed = spd;
  document.querySelectorAll(".speed-btn").forEach((b) => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  if (isPlaybackPlaying) startPlaybackLoop();
}

function toggleCsvInspector() {
  const container = document.querySelector("#csv-table-container");
  const icon = document.querySelector("#inspector-toggle-icon");
  if (!container) return;

  const isHidden = container.style.display === "none";
  container.style.display = isHidden ? "block" : "none";
  if (icon) icon.textContent = isHidden ? "▾" : "▸";
}

// Initial default dataset load on startup
loadPresetDataset("nominal");


/* ==========================================================================
   5. REAL-TIME ECG WAVEFORM CANVAS ENGINE
   ========================================================================== */
const ecgCanvas = document.querySelector("#dashboardEcgCanvas");
let ecgCtx = ecgCanvas ? ecgCanvas.getContext("2d") : null;
let ecgX = 0;
let ecgPoints = [];
let ecgStep = 0;
let activeTimeframe = "live";

function resizeDashboardEcg() {
  if (!ecgCanvas) return;
  const rect = ecgCanvas.getBoundingClientRect();
  ecgCanvas.width = rect.width * window.devicePixelRatio;
  ecgCanvas.height = rect.height * window.devicePixelRatio;
  ecgPoints = [];
  ecgX = 0;
}

function setTimeframe(tf) {
  activeTimeframe = tf;
  document.querySelectorAll(".timeframe-btn").forEach((b) => b.classList.remove("is-active"));
  event.target.classList.add("is-active");
}

function renderEcgLoop() {
  if (ecgCanvas && ecgCtx) {
    const w = ecgCanvas.width;
    const h = ecgCanvas.height;

    if (w && h) {
      ecgStep++;
      const base = h * 0.55;
      let y = base;

      const rate = currentEcgRate || 72;
      const interval = Math.floor(180 / (rate / 60));
      const pos = ecgStep % interval;

      // Realistic ECG P-Q-R-S-T wave calculation
      if (pos === 10) y -= h * 0.08;       // P wave
      else if (pos === 12) y += h * 0.03;
      else if (pos === 18) y += h * 0.05;  // Q
      else if (pos === 20) y -= h * 0.44;  // R peak
      else if (pos === 22) y += h * 0.18;  // S drop
      else if (pos === 32) y -= h * 0.11;  // T wave
      else y += (Math.random() - 0.5) * (h * 0.025); // Baseline noise

      ecgPoints.push({ x: ecgX, y });
      ecgX += 2.4 * window.devicePixelRatio;

      if (ecgX > w) {
        ecgX = 0;
        ecgPoints = [];
      }

      // Fade canvas for smooth phosphor persistence sweep
      ecgCtx.fillStyle = "rgba(4, 7, 14, 0.09)";
      ecgCtx.fillRect(0, 0, w, h);

      // Grid background
      ecgCtx.lineWidth = 1;
      ecgCtx.strokeStyle = "rgba(221, 229, 239, 0.03)";
      for (let gy = 0; gy < h; gy += 25 * window.devicePixelRatio) {
        ecgCtx.beginPath();
        ecgCtx.moveTo(0, gy);
        ecgCtx.lineTo(w, gy);
        ecgCtx.stroke();
      }

      // Draw ECG wave (color shifts on tachycardia or hypoxia)
      ecgCtx.beginPath();
      ecgCtx.strokeStyle = currentEcgRate > 120 ? "#f59e0b" : "#76e4d2";
      ecgCtx.lineWidth = 1.8 * window.devicePixelRatio;
      ecgCtx.shadowColor = currentEcgRate > 120 ? "rgba(245, 158, 11, 0.6)" : "rgba(118, 228, 210, 0.6)";
      ecgCtx.shadowBlur = 8;

      for (let i = 0; i < ecgPoints.length; i++) {
        if (i === 0) ecgCtx.moveTo(ecgPoints[i].x, ecgPoints[i].y);
        else ecgCtx.lineTo(ecgPoints[i].x, ecgPoints[i].y);
      }
      ecgCtx.stroke();
      ecgCtx.shadowBlur = 0;
    }
  }
  requestAnimationFrame(renderEcgLoop);
}
renderEcgLoop();


/* ==========================================================================
   6. ALERTS FEED ENGINE
   ========================================================================== */
let alertCount = 2;
function addDynamicAlert(title, message, severity) {
  alertCount++;
  const topCount = document.querySelector("#topbar-alert-count");
  const activeCount = document.querySelector("#active-alert-count");
  if (topCount) topCount.textContent = alertCount;
  if (activeCount) activeCount.textContent = alertCount;

  const dotClass = severity === "critical" ? "dot-red" : "dot-amber";
  const itemClass = severity === "critical" ? "alert-item-critical" : "alert-item-warning";

  const newHtml = `
    <div class="alert-item ${itemClass}">
      <span class="alert-dot ${dotClass}"></span>
      <div class="alert-content">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      <span class="alert-time">STREAM INGESTION</span>
    </div>
  `;

  const dashFeed = document.querySelector("#dashboard-alert-feed");
  if (dashFeed) dashFeed.insertAdjacentHTML("afterbegin", newHtml);

  const fullFeed = document.querySelector("#full-alerts-list");
  if (fullFeed) fullFeed.insertAdjacentHTML("afterbegin", newHtml);
}

function setSubject(key) {
  document.querySelectorAll(".crew-card").forEach((card) => {
    card.classList.remove("is-active-subject");
  });
  const activeCard = document.querySelector(`#card-${key}`);
  if (activeCard) activeCard.classList.add("is-active-subject");
}


/* ==========================================================================
   7. CONVERSATIONAL AURA MEDICAL AI ASSISTANT
   ========================================================================== */
const AURA_KNOWLEDGE = {
  sans: `<strong>AURA Medical Diagnosis // SANS Assessment:</strong><br><br>
Spaceflight-Associated Neuro-ocular Syndrome (SANS) occurs when the cephalad fluid shift in microgravity elevates intracranial and retrobulbar pressures.
<br><br>
• Ingested CSV records show optic nerve sheath diameter (ONSD) steady at <strong>5.1 mm</strong> (Safe margin &lt; 5.8 mm).<br>
• Retinal vascular pulsatility is nominal.<br>
• <strong>Clinical Protocol:</strong> Continue 30 min daily in Lower Body Negative Pressure (LBNP) chamber before sleep phase to pull venous fluids back to the lower extremities.`,

  cardiovascular: `<strong>AURA Hemodynamics // Microgravity Cardiovascular Drift:</strong><br><br>
In microgravity, stroke volume initially increases due to fluid migration, followed by plasma volume contraction (~10-15%) and baroreflex deconditioning within 14-30 days.
<br><br>
• Resting cardiac output from ingested time-series: <strong>5.4 L/min</strong>.<br>
• Mean arterial pressure (MAP): <strong>88 mmHg</strong> (Nominal).<br>
• <strong>Countermeasure:</strong> 45-min high-intensity interval training on the CEVIS cycle ergometer combined with oral rehydration salt protocols prior to Earth re-entry.`,

  dataset: `<strong>AURA Telemetry Ingestion Architecture:</strong><br><br>
This system operates on real time-series CSV datasets. You can upload any CSV containing <code>timestamp, heart_rate, spo2, respiration, core_temp, cabin_co2, radiation</code>.
<br><br>
• Pre-loaded datasets include verified NASA Life Sciences Data Archive (LSDA Study 0042) records and PhysioNet MIT-BIH biomedical waveforms.<br>
• Playback can be scrubbed, paused, or accelerated up to 10x speed to analyze event transitions in real time.`,

  hypoxia: `<strong>CRITICAL EMERGENCY PROTOCOL // Acute Suit Hypoxia:</strong><br><br>
1. <strong>IMMEDIATE ACTION:</strong> Rotate suit PLSS primary oxygen regulator to <em>HIGH-FLOW PURGE</em> (100% O₂ at 4.3 psi).<br>
2. Check helmet seal and glove disconnect rings for pressure decay rate (&gt; 0.1 psi/min indicates puncture).<br>
3. Ingest hyperbaric emergency rebreather mask if suit cabin pO₂ drops below 16 kPa.<br>
4. Terminate active EVA immediately and ingress through Quest airlock.`
};

function askAi(promptText) {
  const input = document.querySelector("#chat-input-field");
  if (input) input.value = promptText;
  handleChatSubmit(new Event("submit"));
}

function handleChatSubmit(event) {
  if (event) event.preventDefault();
  const input = document.querySelector("#chat-input-field");
  const query = input.value.trim();
  if (!query) return;

  const chatStream = document.querySelector("#chat-stream");

  // Append user message
  const userDiv = document.createElement("div");
  userDiv.className = "user-message";
  userDiv.textContent = query;
  chatStream.appendChild(userDiv);
  input.value = "";
  chatStream.scrollTop = chatStream.scrollHeight;

  // Generate intelligent medical response
  setTimeout(() => {
    let reply = "";
    const lower = query.toLowerCase();

    if (lower.includes("sans") || lower.includes("ocular") || lower.includes("eye") || lower.includes("fluid")) {
      reply = AURA_KNOWLEDGE.sans;
    } else if (lower.includes("cardio") || lower.includes("heart") || lower.includes("drift") || lower.includes("decondition")) {
      reply = AURA_KNOWLEDGE.cardiovascular;
    } else if (lower.includes("dataset") || lower.includes("csv") || lower.includes("measure") || lower.includes("source") || lower.includes("provenance")) {
      reply = AURA_KNOWLEDGE.dataset;
    } else if (lower.includes("hypoxia") || lower.includes("oxygen") || lower.includes("eva") || lower.includes("emergency") || lower.includes("leak")) {
      reply = AURA_KNOWLEDGE.hypoxia;
    } else {
      reply = `<strong>AURA Clinical Analysis:</strong><br><br>
Query evaluated: <em>"${query}"</em>.<br><br>
Correlated with active CSV telemetry stream (${activeCsvRows.length} rows loaded). Current heart rate is ${currentEcgRate.toFixed(1)} bpm. All biomarkers align with NASA Bioastronautics Standard v4.2 parameters.`;
    }

    const aiDiv = document.createElement("div");
    aiDiv.className = "assistant-message";
    aiDiv.innerHTML = reply;
    chatStream.appendChild(aiDiv);
    chatStream.scrollTop = chatStream.scrollHeight;
  }, 650);
}
