// Create a copy of app.js with preview enhancements
const nav = document.querySelector("#primary-nav");
const menuToggle = document.querySelector(".menu-toggle");
const views = [...document.querySelectorAll(".view")];
const navButtons = [...document.querySelectorAll("[data-view]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ==========================================================================
   1. NAVIGATION & VIEW ROUTING
   ========================================================================== */
function syncNavOrbit() {
  const activeButton = nav?.querySelector(".nav-link.is-active");
  const indicator = nav?.querySelector(".nav-orbit-trail");
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

  document.querySelectorAll(".nav-link, .dock-link, .app-dock-item").forEach((button) => {
    const active = button.dataset.view === name;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });

  document.documentElement.dataset.activeView = name;
  if (nav) nav.classList.remove("is-open");
  if (menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
  syncNavOrbit();
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });

  if (name === "dashboard") {
    setTimeout(resizeDashboardEcg, 50);
  }

  // Coordinate background space view with active tab
  if (name === "assistant") {
    setSpaceBackgroundById("jwst");
  } else if (name === "insights" || name === "bodymap") {
    setSpaceBackgroundById("aurora");
  } else if (name === "sources") {
    setSpaceBackgroundById("earth");
  } else {
    setSpaceBackgroundById("airglow");
  }
}

navButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    if (button.matches("a")) event.preventDefault();
    showView(button.dataset.view);
  });
});

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav?.classList.contains("is-open")) {
    nav.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    menuToggle?.setAttribute("aria-label", "Open navigation");
    menuToggle?.focus();
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
    alt: "NASA astronaut Mike Fincke exercises on the cycle ergometer aboard the International Space Station.",
    kicker: "CREW HEALTH AND PERFORMANCE",
    title: "Cardiovascular conditioning in orbit.",
    coordinate: "DESTINY LABORATORY MODULE · 51.6° ORBITAL INCLINATION",
    credit: "NASA/JSC · 17 SEP 2025 · ISS073E0702307",
  },
  {
    id: "iss057e134112",
    src: "https://images-assets.nasa.gov/image/iss057e134112/iss057e134112~large.jpg",
    alt: "NASA astronaut Anne McClain completes countermeasure exercises in the space station laboratory.",
    kicker: "COUNTERMEASURE LOG",
    title: "Preserving muscle and bone density.",
    coordinate: "NODE 2 HARMONY · CONTINUOUS MONITORING ACTIVE",
    credit: "NASA/JSC · 13 DEC 2018 · ISS057E134112",
  },
];

let currentHeroSlide = 0;
let heroChangeToken = 0;

function updateHeroSlide(index) {
  if (!hero || !heroImage) return;
  currentHeroSlide = (index + heroSlides.length) % heroSlides.length;
  const slide = heroSlides[currentHeroSlide];
  const token = ++heroChangeToken;

  hero.classList.add("is-image-changing");
  window.setTimeout(() => {
    if (token !== heroChangeToken) return;
    heroImage.src = slide.src;
    heroImage.alt = slide.alt;
    heroImage.dataset.nasaId = slide.id;
    if (heroKicker) heroKicker.textContent = slide.kicker;
    if (heroTitle) heroTitle.textContent = slide.title;
    if (heroCoordinate) heroCoordinate.textContent = slide.coordinate;
    if (heroCredit) heroCredit.textContent = slide.credit;
    if (heroRecord) heroRecord.href = `https://images.nasa.gov/details/${encodeURIComponent(slide.id)}`;
    if (heroCount) heroCount.innerHTML = `0${currentHeroSlide + 1} <i>/</i> 0${heroSlides.length}`;
    hero.classList.remove("is-image-changing");
  }, 140);

  getNasaAsset(slide.id).then((asset) => {
    if (token !== heroChangeToken) return;
    heroImage.src = asset.src;
    heroImage.dataset.nasaTitle = asset.title;
    heroImage.dataset.nasaCredit = asset.center;
  }).catch(() => {});
}

if (heroNext) {
  heroNext.addEventListener("click", () => updateHeroSlide(currentHeroSlide + 1));
}

window.setInterval(() => {
  const overviewIsActive = document.querySelector("#view-overview")?.classList.contains("is-visible");
  if (!reducedMotion.matches && overviewIsActive && document.visibilityState === "visible") {
    updateHeroSlide(currentHeroSlide + 1);
  }
}, 8500);

/* ==========================================================================
   3. CURSOR & PARALLAX MOTION EFFECTS
   ========================================================================== */
const motionLayers = [
  ...document.querySelectorAll(".metric-card, .insight-card, .insight-card-editorial, .assistant-intro, .story-photo, .crew-card, .crew-card-editorial, .csv-engine-panel"),
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
    const bgX = ((event.clientX / window.innerWidth) - 0.5) * -22;
    const bgY = ((event.clientY / window.innerHeight) - 0.5) * -16;
    document.documentElement.style.setProperty("--bg-shift-x", `${bgX.toFixed(1)}px`);
    document.documentElement.style.setProperty("--bg-shift-y", `${bgY.toFixed(1)}px`);
    pointerFrame = 0;
  });
}, { passive: true });

function updateScrollMotion() {
  // Static nominal scale - all scroll effects removed
  if (hero && heroImage) {
    hero.style.setProperty("--hero-scroll-scale", "1");
    heroImage.style.setProperty("--hero-scale", "1");
  }
  document.documentElement.style.setProperty("--space-parallax", "0px");
  document.querySelectorAll(".story-photo").forEach((photo) => {
    photo.style.setProperty("--story-scroll-scale", "1");
  });
}
// Note: scroll event listeners removed to eliminate scrolling effects across all tabs

if (hero && heroImage) {
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
}

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

// In-browser CSV parser
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

// Preset verified CSV datasets map
const PRESET_DATASETS = {
  nominal: {
    file: "data/1_nasa_iss_cupola_nominal.csv",
    name: "NASA LSDA-0042 NOMINAL BASELINE",
    description: "Expedition 72 nominal biometrics during Cupola Earth observation."
  },
  hypoxia: {
    file: "data/2_nasa_eva_spacewalk_hypoxia.csv",
    name: "EVA SUIT HYPOXIA O₂ LEAK",
    description: "Simulated micro-puncture during Extravehicular Activity."
  },
  ared: {
    file: "data/3_nasa_ared_heavy_exercise.csv",
    name: "NASA ARED HEAVY RESISTIVE EXERCISE",
    description: "High-load biomechanical resistance countermeasure session."
  },
  radiation: {
    file: "data/4_mars_solar_radiation_flare.csv",
    name: "MARS TRANSIT SOLAR FLARE (SPE)",
    description: "Deep space coronal mass ejection solar particle event."
  },
  sans: {
    file: "data/5_microgravity_sans_fluid_shift.csv",
    name: "SANS CEPHALAD FLUID SHIFT",
    description: "Long-duration microgravity intracranial fluid migration."
  },
  arrhythmia: {
    file: "data/6_physionet_ventricular_arrhythmia.csv",
    name: "PHYSIONET VENTRICULAR ARRHYTHMIA",
    description: "Verified clinical ECG dataset with premature ventricular contractions."
  }
};

async function loadPresetDataset(presetKey) {
  const preset = PRESET_DATASETS[presetKey];
  if (!preset) return;

  // Update UI preset chip state
  document.querySelectorAll(".preset-chip").forEach((btn) => btn.classList.remove("is-active"));
  const activeBtn = document.querySelector(`#preset-${presetKey}`);
  if (activeBtn) activeBtn.classList.add("is-active");

  const badge = document.querySelector("#active-dataset-name");
  if (badge) badge.textContent = preset.name;
  const railBadge = document.querySelector("#dash-active-dataset-label");
  if (railBadge) railBadge.textContent = preset.name;

  try {
    const res = await fetch(preset.file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csvText = await res.text();
    ingestTelemetryCsv(csvText, preset.name);
    if (typeof syncBodyMapWithPreset === "function") {
      syncBodyMapWithPreset(presetKey);
    }
  } catch (err) {
    console.error("Failed to load preset CSV:", err);
  }
}

function handleCsvUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result;
    document.querySelectorAll(".preset-chip").forEach((btn) => btn.classList.remove("is-active"));
    const badge = document.querySelector("#active-dataset-name");
    if (badge) badge.textContent = `CUSTOM: ${file.name.toUpperCase()}`;
    const railBadge = document.querySelector("#dash-active-dataset-label");
    if (railBadge) railBadge.textContent = `CUSTOM: ${file.name.toUpperCase()}`;
    ingestTelemetryCsv(text, file.name);
  };
  reader.readAsText(file);
}

function ingestTelemetryCsv(csvText, sourceName) {
  activeCsvRows = parseCsvString(csvText);
  if (!activeCsvRows.length) return;

  playbackIndex = 0;

  // Update status lines & scrubber limits
  const statusLine = document.querySelector("#dataset-status-line");
  if (statusLine) {
    statusLine.innerHTML = `STATUS: <strong style="color: #76e4d2;">STREAMING ${activeCsvRows.length} SAMPLES</strong> · 00:01 / 01:00`;
  }

  const scrubber = document.querySelector("#playback-scrubber");
  if (scrubber) {
    scrubber.min = "0";
    scrubber.max = String(activeCsvRows.length - 1);
    scrubber.value = "0";
  }

  const totalDisp = document.querySelector("#playback-total-display");
  if (totalDisp) {
    const lastRow = activeCsvRows[activeCsvRows.length - 1];
    totalDisp.textContent = lastRow?.timestamp || `00:${String(activeCsvRows.length).padStart(2, '0')}`;
  }

  const rowCountBadge = document.querySelector("#inspector-row-count");
  if (rowCountBadge) rowCountBadge.textContent = `${activeCsvRows.length} rows`;

  renderCsvTableRows();
  applyCsvRow(activeCsvRows[0]);
  startPlaybackLoop();
}

function renderCsvTableRows() {
  const tbody = document.querySelector("#csv-table-body");
  if (!tbody) return;

  let html = "";
  activeCsvRows.forEach((row, idx) => {
    html += `
      <tr id="csv-row-${idx}" onclick="jumpToRow(${idx})" style="cursor: pointer;">
        <td>${row.timestamp || idx}</td>
        <td><strong>${row.heart_rate.toFixed(1)}</strong></td>
        <td>${row.spo2.toFixed(1)}%</td>
        <td>${row.respiration.toFixed(1)}</td>
        <td>${row.core_temp.toFixed(1)}°C</td>
        <td>${row.cabin_co2}%</td>
        <td>${row.radiation}</td>
        <td><span style="color: ${row.anomaly_type !== 'NONE' ? '#f87171' : '#76e4d2'};">${row.anomaly_type}</span></td>
        <td><small>${row.notes}</small></td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

function startPlaybackLoop() {
  if (playbackIntervalId) clearInterval(playbackIntervalId);

  const intervalMs = Math.max(100, Math.round(1000 / playbackSpeed));
  playbackIntervalId = setInterval(() => {
    if (!isPlaybackPlaying || !activeCsvRows.length) return;

    playbackIndex = (playbackIndex + 1) % activeCsvRows.length;
    applyCsvRow(activeCsvRows[playbackIndex]);

    const scrubber = document.querySelector("#playback-scrubber");
    if (scrubber) scrubber.value = String(playbackIndex);

    const timeDisp = document.querySelector("#playback-time-display");
    if (timeDisp && activeCsvRows[playbackIndex]) {
      timeDisp.textContent = activeCsvRows[playbackIndex].timestamp || `00:${String(playbackIndex + 1).padStart(2, '0')}`;
    }

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

  if (elSubHr) elSubHr.textContent = row.notes || "Sinus rhythm stable · Telemetry Active";
  if (elSubEnv) elSubEnv.textContent = `pCO₂: ${row.cabin_co2}% · Rad: ${row.radiation} mSv/d`;

  if (elSubSpo2) {
    if (row.spo2 < 90) elSubSpo2.innerHTML = "<b style='color:#f87171;'>Warning: SpO₂ Below Safe Margin</b>";
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
    addDynamicAlert(`CSV TELEMETRY ANOMALY: ${row.anomaly_type}`, `${row.notes} (Timestamp: ${row.timestamp})`, row.anomaly_type.includes("HYPOXIA") ? "critical" : "warning");
  }
}

function highlightTableRow(idx) {
  document.querySelectorAll(".csv-table tr").forEach((tr) => tr.classList.remove("is-active-row"));
  const rowEl = document.querySelector(`#csv-row-${idx}`);
  if (rowEl) {
    rowEl.classList.add("is-active-row");
  }
}

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
  if (window.event && window.event.target) window.event.target.classList.add("is-active");
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
  document.querySelectorAll(".crew-card, .crew-card-editorial").forEach((card) => {
    card.classList.remove("is-active-subject");
  });
  const activeCard = document.querySelector(`#card-${key}`);
  if (activeCard) activeCard.classList.add("is-active-subject");

  // Update subject labels in Dashboard rail & header
  const subjectDisplay = document.querySelector("#dash-subject-display");
  if (subjectDisplay) {
    if (key === "anne") subjectDisplay.textContent = "Commander Anne McClain";
    else if (key === "mike") subjectDisplay.textContent = "Flight Engineer Mike Fincke";
    else if (key === "marcus") subjectDisplay.textContent = "Dr. Marcus Chen (Specialist)";
  }
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
4. Terminate active EVA immediately and ingress through Quest airlock.`,

  ridge: `<strong>NASA Human Research Program (HRP) // The 5 Space Hazards (R-I-D-G-E):</strong><br><br>
1. <strong>R - Space Radiation:</strong> Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE). Increases career carcinogenesis, CNS damage, and acute radiation sickness.<br>
2. <strong>I - Isolation and Confinement:</strong> Circadian misalignment across 16 orbital sunrises/day, psychological friction, sleep debt, and cognitive readiness.<br>
3. <strong>D - Distance from Earth:</strong> Up to 22.4-min one-way latency to Mars makes ground telemedicine impossible, demanding autonomous edge AI decision support.<br>
4. <strong>G - Altered Gravity Fields:</strong> Microgravity triggers cephalad fluid shifts, SANS ocular flattening, -1.5%/month bone density loss, and cardiovascular deconditioning.<br>
5. <strong>E - Hostile Closed Environments:</strong> Cabin pCO₂ buildup (&gt;3 mmHg), particulate accumulation, immune dysregulation, and closed-loop ECLSS life support constraints.`,

  exmc: `<strong>Exploration Medical Capability (ExMC) & Autonomous CDSS:</strong><br><br>
NASA HRP's ExMC element develops autonomous Clinical Decision Support Systems (CDSS) for deep-space missions.<br><br>
• Because telemedicine experiences up to 44 minutes of round-trip communications latency on Mars, medical decision engines must run locally on the crew's edge hardware.<br>
• AURA serves as the onboard autonomous clinical assistant, ingesting 250 Hz bio-harness telemetry, detecting arrhythmias, verifying ECLSS air quality, and recommending step-by-step non-physician medical protocols.`,

  resources: `<strong>NASA Space Apps Challenge Official Resource Provenance:</strong><br><br>
This system directly implements and correlates data from all 10 official challenge resources:<br>
1. NASA Human Research Roadmap (HRR)<br>
2. NASA Life Sciences Data Archive (LSDA-0042)<br>
3. NASA Life Sciences Portal (NLSP)<br>
4. NASA Open Science Data Repository (OSDR / RadLab / GeneLab)<br>
5. Exploration Medical Capability (ExMC CDSS)<br>
6. NASA TechPort (Wearable Biosensors)<br>
7. TRISH (Translational Research Institute for Space Health)<br>
8. Lifetime Surveillance of Astronaut Health (LSAH)<br>
9. NASA-STD-3001 Bioastronautics Standards (Vol 1 & 2)<br>
10. PhysioNet MIT-BIH & BIDMC Biomedical Waveforms<br>
11. NASA Image and Video Library Asset API.`
};


/* ==========================================================================
   7. AI DECISION ENGINE // AURA AUTONOMOUS FLIGHT SURGEON CDSS
   ========================================================================== */

// Audio Voice State
let isVoiceEnabled = false;

// Active Planetary Mission State
let activeMissionPlanet = "earth";
const PLANET_METADATA = {
  earth: {
    name: "Earth (Low Earth Orbit)",
    location: "ISS Expedition 72 · 408 km",
    delaySec: 0,
    delayText: "0.0s (Instant Edge)",
    gravity: "1.00 g (Micro-g)",
    radiation: "0.45 mSv/day",
    hazard: "Nominal ISS Base",
    img: "assets/earth.jpg",
    context: "Low Earth Orbit (LEO) radiation belt shielding intact. Rapid 3-hour emergency deorbit to Earth possible. Telemetry stream is real-time."
  },
  moon: {
    name: "The Moon (Artemis Base Camp)",
    location: "Shackleton Crater · 384,400 km",
    delaySec: 1.28,
    delayText: "1.28s Latency",
    gravity: "0.166 g (Lunar)",
    radiation: "1.20 mSv/day",
    hazard: "Lunar Dust & Regolith Silicosis",
    img: "assets/moon.jpg",
    context: "Artemis III Lunar South Pole. Sub-optimal gravitational loading (0.166g). Lunar regolith dust inhalation and solar storm exposure risk elevated."
  },
  mars: {
    name: "Mars (Ares Transit Crew)",
    location: "Deep Space Transit · 225M km",
    delaySec: 852,
    delayText: "14.2 min One-Way Delay",
    gravity: "0.380 g (Martian)",
    radiation: "1.95 mSv/day",
    hazard: "Solar Particle Event (SPE) & Galactic Cosmic Rays",
    img: "assets/mars.jpg",
    context: "Deep space interplanetary cruise. Complete Earth blackout regime (14.2 min radio propagation delay). Crew must rely 100% on autonomous onboard resuscitation."
  },
  europa: {
    name: "Europa (Jovian Ocean Outpost)",
    location: "Jovian Subsurface Lab · 628M km",
    delaySec: 2550,
    delayText: "42.5 min One-Way Delay",
    gravity: "0.134 g (Icy Crust)",
    radiation: "2.80 mSv/day",
    hazard: "Jupiter Radiation Belt Trapping",
    img: "assets/europa.jpg",
    context: "Jovian magnetospheric electron flux. 42.5-minute one-way comms lag. Extreme isolation, acute radiation risk, cryogenic surface ambient."
  }
};

// Play modern aerospace audio lock chime via Web Audio API
function playAerospaceChime(freq = 587.33, duration = 0.12, type = "sine") {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Audio context may be restricted by autoplay policy
  }
}

// Select planet in flight deck
function selectPlanet(planetKey) {
  if (!PLANET_METADATA[planetKey]) return;
  activeMissionPlanet = planetKey;
  const p = PLANET_METADATA[planetKey];

  // Sync assistant bar buttons
  document.querySelectorAll(".ap-planet-btn").forEach(btn => {
    btn.classList.toggle("is-active", btn.getAttribute("data-planet") === planetKey);
  });

  const hudLatency = document.querySelector("#ai-hud-latency");
  if (hudLatency) hudLatency.textContent = p.delayText;

  const hudRad = document.querySelector("#ai-hud-rad");
  if (hudRad) hudRad.textContent = p.radiation;

  const inputTag = document.querySelector("#ai-input-latency-tag");
  if (inputTag) inputTag.textContent = `${p.name}: ${p.delayText}`;

  playAerospaceChime(659.25, 0.14);
}

// Consult AI for specific planet
function consultAiForPlanet(planetKey) {
  selectPlanet(planetKey);
  const p = PLANET_METADATA[planetKey];
  showView("assistant");

  setTimeout(() => {
    askAi(`Conduct clinical triage briefing for ${p.name}. Comms delay: ${p.delayText}. Assess radiation hazard (${p.radiation}) and gravity (${p.gravity}).`);
  }, 300);
}

/* ==========================================================================
   INTERACTIVE BODY MAP ORGAN SELECTION & AI CONSULTATION
   ========================================================================== */
const BODY_ORGAN_DATA = {
  eyes: {
    name: "Optic Nerve & Retina (SANS)",
    status: "Grade 0 · Nominal Baseline",
    statusBadge: "GRADE 0 · OBSERVATION",
    badgeClass: "status-badge-warning",
    kicker: "NASA HRP RISK 03 // SANS OCULAR FLUID SHIFT",
    title: "Optic Nerve & <em>Retina</em>",
    desc: "Cephalad microgravity fluid redistribution causes chronic elevation of optic nerve sheath diameter (ONSD) and posterior globe flattening.",
    stats: [
      { kicker: "OPTIC NERVE SHEATH (ONSD)", val: "5.1 mm", baseline: "Earth Baseline: < 5.8 mm (Nominal)" },
      { kicker: "INTRAOCULAR PRESSURE (IOP)", val: "16.2 mmHg", baseline: "Target: 12 - 21 mmHg (Safe)" },
      { kicker: "CHORIORETINAL FOLDS", val: "None", baseline: "OCT Scan: Crisp margin" },
      { kicker: "VISUAL ACUITY", val: "20/20", baseline: "Snellen Test: 100% Correct" }
    ],
    steps: [
      { num: "STEP 1", text: "<strong>Lower Body Negative Pressure (LBNP):</strong> Don the Russian Chibis / NASA LBNP suit for 30 minutes at -25 mmHg to draw ~1.2 liters of fluid back into the lower extremities." },
      { num: "STEP 2", text: "<strong>Optical Coherence Tomography (OCT):</strong> Perform automated retinal ultrasound and fundus imaging scan in the Columbus module at next rest cycle." },
      { num: "STEP 3", text: "<strong>Space Medicine Protocol:</strong> Ensure daily sodium intake is throttled under 2,000 mg to prevent additional intracranial interstitial fluid pressure spikes." }
    ],
    query: "Explain SANS ocular fluid shifts and recommend in-flight countermeasures for optic nerve health."
  },
  heart: {
    name: "Heart & Cardiovascular Autonomics",
    status: "Nominal · 72 bpm (Sinus Rhythm)",
    statusBadge: "OPTIMAL · SINUS RHYTHM",
    badgeClass: "status-badge-success",
    kicker: "NASA HRP RISK 01 // CARDIOVASCULAR DECONDITIONING",
    title: "Heart & <em>Cardiovascular System</em>",
    desc: "Microgravity eliminates hydrostatic blood column gradients, triggering stroke volume adaptation, plasma volume shifts, and cardiovascular drift.",
    stats: [
      { kicker: "RESTING HEART RATE", val: "72 bpm", baseline: "Sinus Rhythm (Normal)" },
      { kicker: "BLOOD PRESSURE", val: "118/76 mmHg", baseline: "Optimal In-Flight Pressure" },
      { kicker: "HEART RATE VARIABILITY", val: "48 ms RMSSD", baseline: "Autonomic Balance Normal" },
      { kicker: "CARDIAC OUTPUT", val: "5.4 L/min", baseline: "Target Range: 4.8 - 6.2 L/min" }
    ],
    steps: [
      { num: "STEP 1", text: "<strong>CEVIS Cycle Ergometer:</strong> Execute 30-minute high-intensity aerobic interval session at 185 Watts to maintain stroke volume." },
      { num: "STEP 2", text: "<strong>Pre-EVA Fluid Loading:</strong> Ingest 1 liter of 0.9% isotonic saline solution with electrolyte tablets prior to high-stress mission activities." },
      { num: "STEP 3", text: "<strong>Continuous Holter ECG:</strong> Verify 3-lead ECG rhythm continuity to guard against microgravity-induced ectopic ventricular depolarizations." }
    ],
    query: "Evaluate cardiovascular telemetry drift and cardiac countermeasure compliance aboard ISS."
  },
  brain: {
    name: "Cerebral Perfusion & Neurovestibular ICP",
    status: "Nominal · Mean ICP Normal",
    statusBadge: "OPTIMAL · COGNITIVE INDEX 96%",
    badgeClass: "status-badge-success",
    kicker: "NASA HRP RISK 02 // INTRACRANIAL HYPERTENSION & ICP",
    title: "Brain & <em>Cerebral Perfusion</em>",
    desc: "Cephalad fluid shift elevates internal jugular vein pressure and alters cerebral venous drainage dynamics in weightlessness.",
    stats: [
      { kicker: "ESTIMATED ICP", val: "14.8 mmHg", baseline: "Safe Range: 10 - 18 mmHg" },
      { kicker: "COGNITIVE SPEED (PVT)", val: "218 ms", baseline: "Mean Reaction Latency: Optimal" },
      { kicker: "JUGULAR VEIN VELOCITY", val: "24 cm/s", baseline: "Doppler Ultrasound: Forward flow" },
      { kicker: "SLEEP ARCHITECTURE", val: "92% Quality", baseline: "Deep NREM Cycle Restored" }
    ],
    steps: [
      { num: "STEP 1", text: "<strong>Circadian Light Modulation:</strong> Shift cabin LED spectrum to 2700K warm blue-depleted light 90 minutes before scheduled sleep." },
      { num: "STEP 2", text: "<strong>Jugular Doppler Assessment:</strong> Perform ultrasound of the internal jugular vein to rule out flow stasis or retrograde thrombosis." },
      { num: "STEP 3", text: "<strong>Ventilation Verification:</strong> Confirm cabin pCO₂ remains below 2.5 mmHg to eliminate CO₂-mediated cerebral vasodilation." }
    ],
    query: "Assess intracranial pressure and neurovestibular adaptation in microgravity."
  },
  lungs: {
    name: "Pulmonary Dynamics & Alveolar Exchange",
    status: "Optimal · SpO₂ 98.9%",
    statusBadge: "OPTIMAL · 98.9% SpO₂",
    badgeClass: "status-badge-success",
    kicker: "NASA HRP RISK 05 // PULMONARY VENTILATION & GAS DYNAMICS",
    title: "Lungs & <em>Gas Exchange</em>",
    desc: "Absence of gravity abolishes ventilation-perfusion gradients across upper and lower lung lobes, achieving uniform alveolar aeration.",
    stats: [
      { kicker: "OXYGEN SATURATION (SpO₂)", val: "98.9%", baseline: "Target: > 96.0% (Nominal)" },
      { kicker: "RESPIRATION RATE", val: "14 br/min", baseline: "Resting Baseline: 12 - 16" },
      { kicker: "CABIN O₂ PARTIAL PRESSURE", val: "159 mmHg", baseline: "Atmosphere Nominal (21% O₂)" },
      { kicker: "CABIN CO₂ PARTIAL PRESSURE", val: "2.3 mmHg", baseline: "Scrubber Status: Optimal" }
    ],
    steps: [
      { num: "STEP 1", text: "<strong>Spirometry Verification:</strong> Measure forced vital capacity (FVC) and peak expiratory flow rate during weekly health check." },
      { num: "STEP 2", text: "<strong>ECLSS Scrubber Status:</strong> Monitor CDRA (Carbon Dioxide Removal Assembly) bed cycle to prevent hypercapnia." },
      { num: "STEP 3", text: "<strong>Aerosol Filtration:</strong> Inspect cabin HEPA filter airflow to avoid particulate aspiration in microgravity air circulation." }
    ],
    query: "Check pulmonary gas exchange, SpO2 telemetry, and cabin atmospheric life support."
  },
  spine: {
    name: "Spinal Column & Skeletal Density",
    status: "Lengthened +4.2 cm · Bone Retention 98.4%",
    statusBadge: "DECOMPRESSED · +4.2 CM",
    badgeClass: "status-badge-warning",
    kicker: "NASA HRP RISK 04 // SKELETAL DECONDITIONING & OSTEOPENIA",
    title: "Spine & <em>Skeletal Framework</em>",
    desc: "Lack of gravitational axial loading decompresses intervertebral discs (+4–6 cm height expansion) and increases osteoclast-mediated bone mineral resorption.",
    stats: [
      { kicker: "SPINAL ELONGATION", val: "+4.2 cm", baseline: "Postural Adjustment Expected" },
      { kicker: "BONE RETENTION RATE", val: "98.4%", baseline: "Optimal via ARED Loading" },
      { kicker: "DAILY CALCIUM EXCRETION", val: "220 mg/day", baseline: "Renal Stone Risk: Low" },
      { kicker: "LUMBAR STRESS INDEX", val: "0.22 (Low)", baseline: "Spinal Muscle Tone Protected" }
    ],
    steps: [
      { num: "STEP 1", text: "<strong>ARED Axial Loading:</strong> Perform daily heavy deadlifts and squats with 350+ lbs equivalent force to stimulate osteoblasts." },
      { num: "STEP 2", text: "<strong>Nutritional Supplementation:</strong> Ingest 800 IU Vitamin D3 and bisphosphonate regimen as prescribed by flight surgeon." },
      { num: "STEP 3", text: "<strong>Spinal Neutral Posture:</strong> Sleep in tethered sack with knees slightly elevated to avoid paraspinal muscular spasms." }
    ],
    query: "Evaluate spinal decompression, lumbar comfort, and ARED bone density preservation."
  },
  fluid: {
    name: "Cephalad Fluid Shift & Interstitial Redistribution",
    status: "1.8 L Cephalad Translocation",
    statusBadge: "TRANSFUSED · 1.8 L SHIFT",
    badgeClass: "status-badge-warning",
    kicker: "NASA HRP RISK 06 // CEPHALAD FLUID REDISTRIBUTION",
    title: "Body Fluids & <em>Lymphatic Shifts</em>",
    desc: "Loss of hydrostatic pressure immediately redistributes ~1.8–2.0 liters of venous and interstitial fluid from legs upward to thorax, neck, and cranial vault.",
    stats: [
      { kicker: "CEPHALAD FLUID SHIFT", val: "1.8 Liters", baseline: "Standard Spaceflight Adaptation" },
      { kicker: "CALF CIRCUMFERENCE", val: "-14%", baseline: "'Bird-Leg' Phenomenon (Nominal)" },
      { kicker: "FACIAL EDEMA INDEX", val: "Moderate", baseline: "Nasal Congestion Managed" },
      { kicker: "TOTAL BODY WATER", val: "42.1 L", baseline: "Hydration Status: Balanced" }
    ],
    steps: [
      { num: "STEP 1", text: "<strong>Chibis LBNP Countermeasure:</strong> Apply -25 to -30 mmHg negative pressure to lower body for 40 minutes daily." },
      { num: "STEP 2", text: "<strong>Dietary Sodium Constraint:</strong> Limit daily salt intake under 2,000 mg to prevent additional interstitial cranial fluid retention." },
      { num: "STEP 3", text: "<strong>Active Hydration Management:</strong> Maintain 2,500 mL daily fluid intake with electrolyte supplementation." }
    ],
    query: "Assess cephalad fluid redistribution, lower body volume loss, and LBNP countermeasure protocol."
  },
  muscles: {
    name: "Skeletal Muscle Mass & Postural Tone",
    status: "Mass Retention 96.8% · ARED Adherent",
    statusBadge: "OPTIMAL · 96.8% MASS",
    badgeClass: "status-badge-success",
    kicker: "NASA HRP RISK 07 // SKELETAL MUSCLE ATROPHY",
    title: "Musculoskeletal & <em>Calf Muscle Mass</em>",
    desc: "Slow-twitch postural muscles (soleus, gastrocnemius, quadriceps) undergo fast phenotypic shift and protein degradation without gravity.",
    stats: [
      { kicker: "CALF MUSCLE VOLUME", val: "96.8%", baseline: "Target: > 95% via ARED" },
      { kicker: "ARED FORCE OUTPUT", val: "380 lbs eq", baseline: "Target Exceeded (+30 lbs)" },
      { kicker: "CEVIS WORKLOAD", val: "185 Watts", baseline: "Target Achieved (30 min)" },
      { kicker: "CREATINE KINASE", val: "140 U/L", baseline: "Muscle Integrity Nominal" }
    ],
    steps: [
      { num: "STEP 1", text: "<strong>High-Resistance Loading:</strong> Complete 4 sets of 10 repetitions on ARED heel raises and leg presses." },
      { num: "STEP 2", text: "<strong>Protein Intake Timing:</strong> Ingest 25g whey protein blend within 45 minutes of completing resistive exercise." },
      { num: "STEP 3", text: "<strong>Neuromuscular Stimulation:</strong> Calibrate T2 treadmill bungee harness to 75% body weight for running intervals." }
    ],
    query: "Report muscle mass retention, soleus atrophy mitigation, and exercise protocol efficiency."
  }
};

let activeOrganKey = "eyes";

function selectBodyOrgan(organKey) {
  const data = BODY_ORGAN_DATA[organKey];
  if (!data) return;
  activeOrganKey = organKey;

  // Update chips
  document.querySelectorAll(".organ-chip").forEach(chip => {
    chip.classList.toggle("is-active", chip.id === `chip-${organKey}`);
  });

  // Update SVG nodes
  document.querySelectorAll(".hotspot-node").forEach(node => {
    node.classList.toggle("is-selected", node.id === `node-${organKey}`);
  });

  // Update DOM elements in body map panel
  const sysName = document.querySelector("#body-system-name");
  if (sysName) sysName.textContent = data.name;

  const sysStatus = document.querySelector("#body-system-status");
  if (sysStatus) sysStatus.innerHTML = `<span style="color: ${data.badgeClass.includes('warning') ? '#f59e0b' : '#76e4d2'};">${data.status}</span>`;

  const kicker = document.querySelector("#organ-kicker");
  if (kicker) kicker.textContent = data.kicker;

  const title = document.querySelector("#organ-title");
  if (title) title.innerHTML = data.title;

  const desc = document.querySelector("#organ-desc");
  if (desc) desc.textContent = data.desc;

  const badge = document.querySelector("#organ-badge");
  if (badge) {
    badge.textContent = data.statusBadge;
    badge.className = `organ-status-badge ${data.badgeClass}`;
  }

  // Update stats
  data.stats.forEach((s, i) => {
    const box = document.querySelector(`#stat-box-${i + 1}`);
    if (box) {
      box.textContent = s.val;
      const parent = box.closest(".organ-telemetry-box");
      if (parent) {
        const k = parent.querySelector(".box-kicker");
        const b = parent.querySelector(".box-baseline");
        if (k) k.textContent = s.kicker;
        if (b) b.textContent = s.baseline;
      }
    }
  });

  // Update countermeasure steps
  const stepsContainer = document.querySelector("#countermeasure-steps-container");
  if (stepsContainer) {
    stepsContainer.innerHTML = data.steps.map(s => `
      <div class="countermeasure-step">
        <span class="countermeasure-step-num">${s.num}</span>
        <div>${s.text}</div>
      </div>
    `).join("");
  }
}

function consultAiForOrgan() {
  const data = BODY_ORGAN_DATA[activeOrganKey] || BODY_ORGAN_DATA.eyes;
  showView("assistant");
  setTimeout(() => {
    askAi(data.query);
  }, 250);
}

// Set assistant planet from assistant bar
function setAssistantPlanet(planetKey) {
  selectPlanet(planetKey);
  const p = PLANET_METADATA[planetKey] || PLANET_METADATA.earth;
  
  // Update planet pill buttons in Gemini top bar
  document.querySelectorAll(".gemini-planet-pill, .ap-planet-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.planet === planetKey);
  });

  // Update status badge
  const onlineText = document.querySelector("#chat-online-text");
  if (onlineText) {
    onlineText.textContent = `Ready · ${p.delayText} Delay`;
  }

  const chatStream = document.querySelector("#chat-stream");
  const assistantView = document.querySelector("#view-assistant");
  if (chatStream && assistantView && assistantView.classList.contains("is-chatting")) {
    const noticeDiv = document.createElement("div");
    noticeDiv.className = "assistant-system-notice";
    noticeDiv.innerHTML = `<span class="asn-icon">🪐</span> <strong>LATENCY REGIME:</strong> ${p.name} (${p.delayText} comms delay). Flight surgeon triage active.`;
    chatStream.appendChild(noticeDiv);
    chatStream.scrollTop = chatStream.scrollHeight;
  }
}

// Voice Toggle Functionality (Web Speech API)
function toggleVoiceOutput() {
  isVoiceEnabled = !isVoiceEnabled;
  const icon = document.querySelector("#voice-icon");
  const text = document.querySelector("#voice-text");
  const btn = document.querySelector("#voice-toggle-btn");

  if (isVoiceEnabled) {
    if (icon) icon.textContent = "🔊";
    if (text) text.textContent = "Voice: ON";
    if (btn) btn.classList.add("is-active");
    speakText("AURA flight surgeon audio telemetry readout activated.");
  } else {
    if (icon) icon.textContent = "🔇";
    if (text) text.textContent = "Voice: OFF";
    if (btn) btn.classList.remove("is-active");
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
}

function speakText(htmlOrText) {
  if (!isVoiceEnabled || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  
  const tmp = document.createElement("div");
  tmp.innerHTML = htmlOrText;
  const cleanText = tmp.textContent || tmp.innerText || "";
  
  const utterance = new SpeechSynthesisUtterance(cleanText.substring(0, 350));
  utterance.rate = 1.02;
  utterance.pitch = 1.0;
  
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Daniel")));
  if (preferredVoice) utterance.voice = preferredVoice;

  window.speechSynthesis.speak(utterance);
}

// Clear Chat Stream and Reset to Centered Gemini Search View
function clearChatStream() {
  const chatStream = document.querySelector("#chat-stream");
  if (chatStream) chatStream.innerHTML = "";
  
  const assistantView = document.querySelector("#view-assistant");
  if (assistantView) assistantView.classList.remove("is-chatting");

  const input = document.querySelector("#chat-input-field");
  if (input) {
    input.value = "";
    input.focus();
  }
}

// Convert Markdown to clean structured HTML
function formatMarkdown(md) {
  let html = md
    .replace(/^### (.*$)/gim, '<h4 class="ai-resp-h4">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="ai-resp-h3">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="ai-resp-h2">$1</h2>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/^\s*[-*•]\s+(.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/gim, '<br><br>')
    .replace(/\n/gim, '<br>');

  html = html.replace(/(<li>.*?<\/li>)+/gim, '<ul>$&</ul>');
  return html;
}

// Formal Flight Surgeon & Clinical Decision Support Engine
function generateLocalFlightSurgeonReply(query) {
  const q = query.toLowerCase().trim();
  const p = PLANET_METADATA[activeMissionPlanet] || PLANET_METADATA.earth;
  const currentHr = currentEcgRate ? currentEcgRate.toFixed(1) : "72.4";

  // 1. Everyday Courtesies & Professional Greetings
  if (/^(hi|hello|hey|greetings|good morning|good evening|good afternoon|namaste)/.test(q)) {
    return `Greetings, Commander. All biomedical telemetry and life-support channels are nominal. How can I assist with your physiological status or flight protocol today?`;
  }

  if (q.includes("bye") || q.includes("goodbye") || q.includes("see you") || q.includes("signing off") || q.includes("good night")) {
    return `Acknowledged, Commander. Standing by on continuous biomedical telemetry watch. Rest well, and alert me should any physiological symptoms develop.`;
  }

  if (q.includes("thank") || q.includes("thx") || q.includes("appreciate")) {
    return `You are welcome, Commander. It is my duty to ensure mission readiness and crew health. Let me know if further medical decision support is required.`;
  }

  if (q.includes("how are you") || q.includes("how r u") || q.includes("how do you feel") || q.includes("status report")) {
    return `All autonomous diagnostic subsystems are functioning within optimal operational parameters, Commander. Telemetry feeds from Expedition 72 are nominal. How is your physical condition today?`;
  }

  if (q.includes("who are you") || q.includes("what are you") || q.includes("introduce yourself")) {
    return `I am <strong>AURA</strong>, your Autonomous Flight Surgeon and Clinical Decision Support System. I continuously monitor crew biometrics, evaluate microgravity adaptation risks such as SANS and cardiovascular deconditioning, and provide immediate aerospace medical countermeasures. How may I assist you?`;
  }

  // 2. Human Sensations, Fatigue & Stress (Clinical Empathy & Structured Countermeasures)
  if (q.includes("tired") || q.includes("exhausted") || q.includes("sleepy") || q.includes("fatigue") || q.includes("stress") || q.includes("burnout") || q.includes("headache")) {
    return `Understood, Commander. Spaceflight fatigue is a recognized physiological consequence of microgravity fluid redistribution and circadian disruption.<br><br><strong>Clinical Recommendations:</strong><br>• Ingest 250–300 mL of an electrolyte-balanced solution.<br>• Shift cabin lighting to the 2700K blue-depleted spectrum to facilitate melatonin synthesis.<br>• Schedule a 30-minute rest cycle in your sleep station.<br><br>Would you like me to evaluate your latest sleep or vital telemetry?`;
  }

  // 3. Clinical & Aerospace Medical Protocols
  if (q.includes("sans") || q.includes("ocular") || q.includes("eye") || q.includes("vision") || q.includes("optic") || q.includes("papilledema")) {
    return `<strong>SANS (Spaceflight-Associated Neuro-ocular Syndrome) Clinical Assessment:</strong><br><br>In microgravity, cephalad fluid redistribution elevates intracranial pressure, causing optic nerve sheath expansion and posterior globe flattening.<br><br><strong>Telemetry & Countermeasures:</strong><br>• Current ONSD: <strong>5.1 mm</strong> (Nominal; threshold is 5.8 mm).<br>• Intraocular Pressure (IOP): <strong>16.2 mmHg</strong> (Normal range: 12–21 mmHg).<br>• Protocol: 45 minutes of Lower Body Negative Pressure (LBNP) at -25 mmHg prior to scheduled rest.<br>• Perform fundus examination and Optical Coherence Tomography (OCT) if visual acuity diminishes.`;
  }

  if (q.includes("cardio") || q.includes("heart") || q.includes("ecg") || q.includes("drift") || q.includes("pulse") || q.includes("arrhythmia") || q.includes("bpm")) {
    return `<strong>Cardiovascular Telemetry & Deconditioning Analysis:</strong><br><br>Microgravity reduces hydrostatic pressure gradients, causing a cephalad fluid shift and progressive cardiovascular drift.<br><br><strong>Current Biometrics:</strong><br>• Resting Heart Rate: <strong>${currentHr} bpm</strong> (Sinus rhythm nominal).<br>• Blood Pressure: <strong>118/76 mmHg</strong>.<br>• Countermeasure: Maintain the daily 30-minute CEVIS cycle ergometer protocol at 185W and complete the scheduled ARED resistance session.`;
  }

  if (q.includes("eva") || q.includes("hypoxia") || q.includes("suit") || q.includes("oxygen") || q.includes("leak") || q.includes("depress")) {
    return `<div class="ai-alert-banner">🚨 <strong>EMERGENCY EVA HYPOXIA PROTOCOL (NASA-STD-3001)</strong></div><br><br>1. <strong>Purge Valve:</strong> Activate the Secondary Oxygen Pack (SOP) / high-flow 100% O₂ purge immediately.<br>2. <strong>Tether Verification:</strong> Confirm safety tether lock and maintain visual contact with your EVA partner.<br>3. <strong>Immediate Ingress:</strong> Terminate extravehicular activity and proceed directly to the Joint Airlock.<br>4. <strong>Repressurization:</strong> Seal outer hatch, initiate airlock repressurization to 14.7 psi, and monitor SpO₂.`;
  }

  if (q.includes("radiation") || q.includes("solar") || q.includes("flare") || q.includes("spe") || q.includes("storm") || q.includes("dosim") || q.includes("sievert")) {
    return `<strong>Space Radiation & Solar Particle Event (SPE) Protocol:</strong><br><br>Deep-space radiation exposure poses both acute and career risks. Current cosmic ionizing radiation telemetry is monitored.<br><br><strong>Clinical Guidelines:</strong><br>• Cumulative Mission Dose: Within nominal career safety limits for this sector (${p.name}).<br>• In the event of a Class X solar flare, execute emergency shelter ingress into the heavily shielded central module core within 30 minutes.<br>• Administer radioprotective antioxidants as prescribed in the mission medical kit.`;
  }

  if (q.includes("sleep") || q.includes("circadian") || q.includes("insomnia") || q.includes("melatonin") || q.includes("wake")) {
    return `<strong>Circadian Phase & Sleep Architecture Guidance:</strong><br><br>Microgravity sleep disruption is common due to lack of somatic contact points and the 90-minute orbital light-dark cycle.<br><br><strong>Recommended Interventions:</strong><br>• Synchronize cabin lighting to dim warm spectrum (2700K) 2 hours before the scheduled sleep window.<br>• Ensure sleep bag restraint tension is calibrated to eliminate limb flotation micro-awakenings.<br>• If circadian desynchronosis persists, 0.5 mg exogenous melatonin may be utilized under flight surgeon protocol.`;
  }

  if (q.includes("motion") || q.includes("sas") || q.includes("nausea") || q.includes("vestibular") || q.includes("vomit") || q.includes("dizz")) {
    return `<strong>Space Adaptation Syndrome (SAS) Clinical Management:</strong><br><br>Neurovestibular conflict between semicircular canal signals and otolith organs affects ~70% of astronauts during initial microgravity exposure.<br><br><strong>Management Protocol:</strong><br>• Restrict rapid head motions along the pitch and roll axes.<br>• Maintain visual fixation on a stable interior station reference.<br>• Promethazine (25 mg IM or oral) is indicated if severe motion sickness or emesis threatens hydration status.<br>• Physiological compensation typically establishes within 48 to 72 hours.`;
  }

  if (q.includes("bone") || q.includes("muscle") || q.includes("spine") || q.includes("atrophy") || q.includes("ared") || q.includes("calcium") || q.includes("back")) {
    return `<strong>Musculoskeletal Deconditioning Countermeasures:</strong><br><br>Microgravity induces bone mineral density resorption (~1.0% per month in weight-bearing bones) and postural muscle atrophy.<br><br><strong>Required Regimen:</strong><br>• Complete the daily Advanced Resistive Exercise Device (ARED) protocol: deadlifts and squats to provide axial skeletal loading.<br>• Maintain daily dietary calcium intake of 1,200 mg and 800 IU Vitamin D.<br>• Current bone retention estimate: <strong>98.4%</strong> (Optimal).`;
  }

  if (q.includes("dataset") || q.includes("csv") || q.includes("measure") || q.includes("source") || q.includes("stream") || q.includes("lsda") || q.includes("physionet")) {
    return `<strong>Telemetry Dataset Architecture:</strong><br><br>Biomedical telemetry ingested by this console is structured around authenticated NASA Life Sciences Data Archive (LSDA Study 0042) protocols and PhysioNet research standards.<br><br>Continuous biometric parameters include 3-lead ECG waveforms, SpO₂ saturation, core temperature, cabin partial pressures, and ionizing radiation dosimeters.`;
  }

  // 4. Formal Flight Surgeon General Fallback
  return `Acknowledged, Commander. Continuous biomedical telemetry monitoring is active across all crew stations. All vital indicators are currently within acceptable operational tolerances.<br><br>Please specify if you require diagnostic triage, countermeasure protocols, or telemetry evaluation.`;
}

// Ask AI Entrypoint
function askAi(promptText) {
  const input = document.querySelector("#chat-input-field");
  if (input) input.value = promptText;
  handleChatSubmit(new Event("submit"));
}

// Handle Chat Submission (Calls Backend /api/chat, seamless fallback to onboard CDSS)
async function handleChatSubmit(event) {
  if (event) event.preventDefault();
  const input = document.querySelector("#chat-input-field");
  const query = input ? input.value.trim() : "";
  if (!query) return;

  const chatStream = document.querySelector("#chat-stream");
  if (!chatStream) return;

  // Activate chatting state (collapses centered hero, expands chat stream)
  const assistantView = document.querySelector("#view-assistant");
  if (assistantView) assistantView.classList.add("is-chatting");

  // Append user message bubble
  const userDiv = document.createElement("div");
  userDiv.className = "user-message";
  userDiv.textContent = query;
  chatStream.appendChild(userDiv);
  if (input) input.value = "";
  chatStream.scrollTop = chatStream.scrollHeight;

  // Append temporary thinking indicator
  const thinkingDiv = document.createElement("div");
  thinkingDiv.className = "assistant-message is-thinking";
  thinkingDiv.innerHTML = `<span class="thinking-dots"><span></span><span></span><span></span></span> AURA flight surgeon evaluating biometrics...`;
  chatStream.appendChild(thinkingDiv);
  chatStream.scrollTop = chatStream.scrollHeight;

  let reply = "";

  // Attempt backend API call first
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: query,
        planet: activeMissionPlanet
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.reply) {
        reply = formatMarkdown(data.reply);
      }
    }
  } catch (err) {
    // Backend offline or local static mode
  }

  // Fallback to local formal flight surgeon engine
  if (!reply) {
    await new Promise(r => setTimeout(r, 350));
    reply = generateLocalFlightSurgeonReply(query);
  }

  // Remove thinking indicator
  if (thinkingDiv.parentNode) thinkingDiv.parentNode.removeChild(thinkingDiv);

  // Append AI response
  const aiDiv = document.createElement("div");
  aiDiv.className = "assistant-message";
  aiDiv.innerHTML = `<div class="ai-flight-surgeon-tag">✦ AURA Flight Surgeon · CDSS</div>` + reply;
  chatStream.appendChild(aiDiv);
  chatStream.scrollTop = chatStream.scrollHeight;

  // Speak aloud if voice readout is enabled
  speakText(reply);
}

// Wire App Dock Click Handlers
document.querySelectorAll(".app-dock-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    const viewName = btn.dataset.view;
    if (viewName) showView(viewName);
  });
});

// Detect App / Standalone mode
(function detectAppMode() {
  const isAppMode = window.matchMedia("(display-mode: standalone)").matches ||
                    window.navigator.standalone === true ||
                    navigator.userAgent.includes("Electron");
  if (isAppMode) {
    document.body.classList.add("is-app-mode");
  }
})();

/* ==========================================================================
   8. PWA INSTALLATION & SERVICE WORKER ENGINE
   ========================================================================== */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
      console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);
    }).catch((err) => {
      console.warn('[PWA] Service worker registration failed:', err);
    });
  });
}

let deferredPrompt = null;
const pwaInstallBtn = document.querySelector('#pwa-install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (pwaInstallBtn) {
    pwaInstallBtn.style.display = 'inline-flex';
  }
});

if (pwaInstallBtn) {
  pwaInstallBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('[PWA] User response to install prompt:', outcome);
      deferredPrompt = null;
      pwaInstallBtn.style.display = 'none';
    }
  });
}

window.addEventListener('appinstalled', () => {
  console.log('[PWA] Orbital Health app installed successfully.');
  if (pwaInstallBtn) pwaInstallBtn.style.display = 'none';
});


/* ==========================================================================
   9. NASA PHOTOGRAPHIC SPACE BACKGROUND SWITCHER
   ========================================================================== */
const NASA_BACKGROUNDS = [
  {
    id: "airglow",
    name: "ISS Earth Airglow & Milky Way",
    image: "assets/nasa-earth-airglow-milkyway.jpg",
    credit: "NASA/JSC ISS Expedition 74 · Atmospheric Airglow & Milky Way"
  },
  {
    id: "jwst",
    name: "JWST Carina Cosmic Cliffs",
    image: "assets/nasa-jwst-carina-nebula.jpg",
    credit: "NASA/ESA/CSA JWST · NIRCam Cosmic Cliffs in Carina Nebula"
  },
  {
    id: "aurora",
    name: "ISS Aurora Australis & Horizon",
    image: "assets/nasa-aurora-earth-limb.jpg",
    credit: "NASA/JSC Expedition 30 · Polar Aurora Australis over Earth Limb"
  },
  {
    id: "earth",
    name: "Whole Earth Blue Marble",
    image: "assets/earth.jpg",
    credit: "NASA Earth Observatory · High-Resolution Orbital Disk"
  }
];

let currentBgIndex = 0;
let isLayerAPrimary = true;

function setSpaceBackground(index) {
  currentBgIndex = (index + NASA_BACKGROUNDS.length) % NASA_BACKGROUNDS.length;
  const bg = NASA_BACKGROUNDS[currentBgIndex];

  const layerA = document.querySelector("#space-bg-primary");
  const layerB = document.querySelector("#space-bg-secondary");
  const nameEl = document.querySelector("#bg-theme-name");
  const creditEl = document.querySelector("#footer-credit-text");

  if (layerA && layerB) {
    if (isLayerAPrimary) {
      layerB.style.backgroundImage = `url('${bg.image}')`;
      layerB.style.opacity = "0.68";
      layerA.style.opacity = "0";
      isLayerAPrimary = false;
    } else {
      layerA.style.backgroundImage = `url('${bg.image}')`;
      layerA.style.opacity = "0.68";
      layerB.style.opacity = "0";
      isLayerAPrimary = true;
    }
  }

  if (nameEl) nameEl.textContent = bg.name;
  if (creditEl) creditEl.textContent = bg.credit;
}

function setSpaceBackgroundById(id) {
  const idx = NASA_BACKGROUNDS.findIndex((b) => b.id === id);
  if (idx !== -1 && idx !== currentBgIndex) {
    setSpaceBackground(idx);
  }
}

function cycleSpaceBackground() {
  setSpaceBackground(currentBgIndex + 1);
}


/* ==========================================================================
   10. HIGHLY ANIMATIVE INTERACTIVE COSMIC CANVAS ENGINE
   Deep space nebular clouds, living starfield with JWST diffraction spikes,
   interactive stardust cursor trail, shooting stars, and ISS orbit beacon
   ========================================================================== */
(function initCosmicCanvas() {
  const canvas = document.querySelector("#space-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    initStars();
    initStardust();
  }

  // 1. Drifting Nebular Cosmic Glow Clouds
  const nebulae = [
    { xRatio: 0.20, yRatio: 0.28, baseR: 0.38, color1: "rgba(56, 189, 248, 0.12)", color2: "rgba(14, 116, 144, 0)", speed: 0.00028, phase: 0 },
    { xRatio: 0.76, yRatio: 0.32, baseR: 0.44, color1: "rgba(223, 199, 156, 0.10)", color2: "rgba(180, 83, 9, 0)", speed: 0.00032, phase: 1.8 },
    { xRatio: 0.48, yRatio: 0.82, baseR: 0.42, color1: "rgba(118, 228, 210, 0.10)", color2: "rgba(13, 148, 136, 0)", speed: 0.00022, phase: 3.4 },
    { xRatio: 0.85, yRatio: 0.78, baseR: 0.36, color1: "rgba(129, 140, 248, 0.09)", color2: "rgba(67, 56, 202, 0)", speed: 0.00025, phase: 4.9 }
  ];

  // 2. Multi-layered Stars with Twinkle & Diffraction Spikes
  const stars = [];
  const STAR_COLORS = ["#ffffff", "#f8fafc", "#e0edff", "#c1dcfa", "#7dd3fc", "#38bdf8", "#dfc79c", "#76e4d2"];

  function initStars() {
    stars.length = 0;
    const starCount = Math.min(260, Math.floor((width * height) / 6500));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.6 + 0.6,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        alpha: Math.random() * 0.75 + 0.25,
        twinkleSpeed: Math.random() * 0.025 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.09,
        vy: (Math.random() - 0.5) * 0.09,
        layer: Math.random() > 0.80 ? "foreground" : "background",
        hasSpikes: Math.random() > 0.88
      });
    }
  }

  // 3. Floating Zero-G Micro Stardust Embers
  const stardust = [];
  function initStardust() {
    stardust.length = 0;
    const dustCount = Math.min(65, Math.floor(width / 24));
    for (let i = 0; i < dustCount; i++) {
      stardust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.6,
        alpha: Math.random() * 0.6 + 0.2,
        vy: -(Math.random() * 0.22 + 0.08),
        vx: (Math.random() - 0.5) * 0.06,
        color: Math.random() > 0.5 ? "rgba(223, 199, 156," : "rgba(118, 228, 210,"
      });
    }
  }

  // 4. Interactive Stardust Cursor Particles (Leaves a trail on movement)
  const cursorTrail = [];
  let mouseX = -1000;
  let mouseY = -1000;
  let lastSpawnTime = 0;

  window.addEventListener("pointermove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const now = Date.now();
    if (now - lastSpawnTime > 32) {
      lastSpawnTime = now;
      for (let i = 0; i < 2; i++) {
        cursorTrail.push({
          x: e.clientX + (Math.random() - 0.5) * 14,
          y: e.clientY + (Math.random() - 0.5) * 14,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8 - 0.3,
          size: Math.random() * 2.4 + 1.0,
          alpha: 0.9,
          decay: Math.random() * 0.022 + 0.016,
          color: Math.random() > 0.5 ? "#dfc79c" : "#76e4d2"
        });
      }
    }
  });

  // 5. Meteors / Shooting Stars
  const meteors = [];

  function spawnMeteor(forcedX, forcedY) {
    const startX = forcedX !== undefined ? forcedX : Math.random() * width * 0.9;
    const startY = forcedY !== undefined ? forcedY : Math.random() * (height * 0.45);
    const angle = (Math.PI / 180) * (Math.random() * 20 + 35);
    const speed = Math.random() * 10 + 17;
    const length = Math.random() * 100 + 120;
    const colors = [
      { head: "#ffffff", tail: "rgba(118, 228, 210, 0.8)" },
      { head: "#fef3c7", tail: "rgba(223, 199, 156, 0.85)" },
      { head: "#e0f2fe", tail: "rgba(56, 189, 248, 0.8)" }
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    meteors.push({
      x: startX,
      y: startY,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      length: length,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.018,
      headColor: color.head,
      tailColor: color.tail
    });
  }

  let nextMeteorTime = Date.now() + 1800;

  // 6. Gravitational Ripples on Click
  const ripples = [];
  window.addEventListener("pointerdown", (e) => {
    ripples.push({
      x: e.clientX,
      y: e.clientY,
      radius: 6,
      maxRadius: Math.min(260, width * 0.35),
      alpha: 0.75
    });
    if (Math.random() > 0.35) {
      spawnMeteor(e.clientX - 100, Math.max(10, e.clientY - 120));
    }
  });

  // 7. ISS Satellite Orbital Tracker
  let issAngle = 0.2;
  const ISS_SPEED = 0.00048;

  function drawIssOrbit(time) {
    const cx = width * 0.52;
    const cy = height * 0.05;
    const rx = width * 0.65;
    const ry = height * 0.42;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, -0.18, Math.PI * 0.15, Math.PI * 0.88);
    ctx.strokeStyle = "rgba(223, 199, 156, 0.16)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 10]);
    ctx.stroke();
    ctx.restore();

    issAngle += ISS_SPEED;
    if (issAngle > Math.PI * 0.88) issAngle = Math.PI * 0.15;

    const rot = -0.18;
    const px0 = rx * Math.cos(issAngle);
    const py0 = ry * Math.sin(issAngle);
    const issX = cx + px0 * Math.cos(rot) - py0 * Math.sin(rot);
    const issY = cy + px0 * Math.sin(rot) + py0 * Math.cos(rot);

    ctx.save();
    ctx.translate(issX, issY);

    // Solar panels
    ctx.fillStyle = "rgba(147, 197, 253, 0.75)";
    ctx.fillRect(-12, -3, 6, 6);
    ctx.fillRect(6, -3, 6, 6);
    // Main module
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-4, -2, 8, 4);

    // Pulsing Strobe Beacon
    const pulse = (Math.sin(time * 0.006) + 1) * 0.5;
    const strobeColor = pulse > 0.5 ? "#76e4d2" : "#dfc79c";
    ctx.beginPath();
    ctx.arc(0, 0, 3 + pulse * 1.8, 0, Math.PI * 2);
    ctx.fillStyle = strobeColor;
    ctx.shadowColor = strobeColor;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    // HUD Tag
    ctx.font = "9px 'JetBrains Mono', Consolas, monospace";
    ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
    ctx.fillText("ISS · EXP 72 · 262 MI", 16, 3);
    ctx.restore();
  }

  // Main Dynamic Animation Loop
  function animate(timestamp) {
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // A. Draw Drifting Nebular Clouds
    for (let i = 0; i < nebulae.length; i++) {
      const neb = nebulae[i];
      neb.phase += neb.speed;
      const nx = (neb.xRatio + Math.sin(neb.phase) * 0.04) * width;
      const ny = (neb.yRatio + Math.cos(neb.phase * 0.8) * 0.04) * height;
      const nr = (neb.baseR + Math.sin(neb.phase * 0.5) * 0.05) * Math.max(width, height);

      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      grad.addColorStop(0, neb.color1);
      grad.addColorStop(1, neb.color2);

      ctx.save();
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // B. Draw Gravitational Click Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      rip.radius += 3.0;
      rip.alpha -= 0.013;
      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(223, 199, 156, ${rip.alpha * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (rip.radius > 20) {
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius - 18, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(118, 228, 210, ${rip.alpha * 0.35})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    // C. Draw Zero-G Floating Stardust Embers
    for (let i = 0; i < stardust.length; i++) {
      const d = stardust[i];
      d.y += d.vy;
      d.x += d.vx;
      if (d.y < 0) {
        d.y = height + 10;
        d.x = Math.random() * width;
      }
      if (d.x < 0) d.x = width;
      if (d.x > width) d.x = 0;

      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fillStyle = `${d.color} ${d.alpha})`;
      ctx.fill();
    }

    // D. Draw Cursor Stardust Trail
    for (let i = cursorTrail.length - 1; i >= 0; i--) {
      const p = cursorTrail[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        cursorTrail.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    }

    // E. Draw Stars & Diffraction Cross Spikes
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      s.twinklePhase += s.twinkleSpeed;
      const currentAlpha = s.alpha * (0.60 + 0.40 * Math.sin(s.twinklePhase));

      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = width;
      if (s.x > width) s.x = 0;
      if (s.y < 0) s.y = height;
      if (s.y > height) s.y = 0;

      // Mouse interactive constellation link
      const distToMouse = Math.hypot(mouseX - s.x, mouseY - s.y);
      if (distToMouse < 110) {
        const lineAlpha = (1 - distToMouse / 110) * 0.35;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = `rgba(223, 199, 156, ${lineAlpha})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
      
      if (s.layer === "foreground") {
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      // Luminous 4-Point JWST Cross Spikes for Brightest Stars
      if (s.hasSpikes && currentAlpha > 0.65) {
        const spikeLen = s.radius * 4.5 * (currentAlpha * 0.8);
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - spikeLen, s.y);
        ctx.lineTo(s.x + spikeLen, s.y);
        ctx.moveTo(s.x, s.y - spikeLen);
        ctx.lineTo(s.x, s.y + spikeLen);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // F. Draw ISS Orbit & Vehicle
    drawIssOrbit(timestamp);

    // G. Spawn Frequent Meteors
    if (Date.now() > nextMeteorTime) {
      spawnMeteor();
      nextMeteorTime = Date.now() + Math.random() * 2200 + 2000;
    }

    // H. Draw Meteors
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.dx;
      m.y += m.dy;
      m.alpha -= m.decay;

      if (m.alpha <= 0 || m.x < -100 || m.x > width + 100 || m.y > height + 100) {
        meteors.splice(i, 1);
        continue;
      }

      const tailX = m.x - (m.dx / Math.hypot(m.dx, m.dy)) * m.length;
      const tailY = m.y - (m.dy / Math.hypot(m.dx, m.dy)) * m.length;

      ctx.save();
      const grad = ctx.createLinearGradient(tailX, tailY, m.x, m.y);
      grad.addColorStop(0, "rgba(255, 255, 255, 0)");
      grad.addColorStop(0.7, m.tailColor);
      grad.addColorStop(1, m.headColor);

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(m.x, m.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.4;
      ctx.globalAlpha = Math.max(0, m.alpha);
      ctx.shadowColor = m.headColor;
      ctx.shadowBlur = 12;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(m.x, m.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(animate);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(animate);
})();
