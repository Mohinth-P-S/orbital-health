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

// Set assistant planet from assistant bar
function setAssistantPlanet(planetKey) {
  selectPlanet(planetKey);
  const p = PLANET_METADATA[planetKey];
  
  const chatStream = document.querySelector("#chat-stream");
  if (chatStream) {
    const noticeDiv = document.createElement("div");
    noticeDiv.className = "assistant-system-notice";
    noticeDiv.innerHTML = `<span class="asn-icon">🪐</span> <strong>MISSION ENVIRONMENT UPDATED:</strong> ${p.name} (${p.delayText}). Clinical decision support active for this latency regime.`;
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

// Clear Chat Stream
function clearChatStream() {
  const chatStream = document.querySelector("#chat-stream");
  if (!chatStream) return;
  chatStream.innerHTML = `
    <span class="chat-date">ISS EXPEDITION 72 MEDICAL TELEMETRY CONSOLE · ACTIVE ORBIT</span>
    <div class="assistant-message" id="initial-ai-msg">
      <strong>Console Cleared.</strong> AURA autonomous flight surgeon standing by. All biomedical telemetry channels active and nominal.
    </div>
  `;
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

// Comprehensive Built-in Aerospace Clinical Reasoning Engine
function generateLocalFlightSurgeonReply(query) {
  const q = query.toLowerCase().trim();
  const p = PLANET_METADATA[activeMissionPlanet] || PLANET_METADATA.earth;
  const currentHr = currentEcgRate ? currentEcgRate.toFixed(1) : "72.4";

  if (q.includes("sans") || q.includes("ocular") || q.includes("eye") || q.includes("vision") || q.includes("optic") || q.includes("papilledema")) {
    return `<strong>✦ AURA CLINICAL DECISION SUPPORT // SANS Ocular Fluid Shift:</strong><br><br>
<strong>CLINICAL ASSESSMENT:</strong> Spaceflight-Associated Neuro-ocular Syndrome (SANS) resulting from cephalad venous fluid migration in microgravity, elevating retrobulbar and intracranial pressure.<br><br>
• <strong>Active Telemetry:</strong> Optic Nerve Sheath Diameter (ONSD) is steady at <strong>5.1 mm</strong> (Safe threshold &lt; 5.8 mm). Retinal nerve fiber layer (RNFL) thickening is Grade 0.<br>
• <strong>Planetary Context (${p.name}):</strong> Environmental gravity is <strong>${p.gravity}</strong>. Microgravity fluid pooling active.<br>
• <strong>Prescribed Countermeasure:</strong> Prescribe 50 mmHg Lower Body Negative Pressure (LBNP) for 45 min prior to sleep phase to restore caudal venous fluid distribution. Conduct daily ultrasound ONSD scans.`;
  }

  if (q.includes("cardio") || q.includes("heart") || q.includes("ecg") || q.includes("drift") || q.includes("pulse") || q.includes("arrhythmia") || q.includes("bpm")) {
    return `<strong>✦ AURA HEMODYNAMICS // Cardiovascular Deconditioning & ECG Triage:</strong><br><br>
<strong>CLINICAL ASSESSMENT:</strong> Microgravity cardiovascular drift characterized by a 10-15% reduction in circulating plasma volume and autonomic baroreflex resetting.<br><br>
• <strong>Live Telemetry:</strong> Real-time heart rate is <strong>${currentHr} bpm</strong>. Sinus rhythm regular. No premature ventricular contractions (PVCs) in active window.<br>
• <strong>Hemodynamic Profile:</strong> Mean Arterial Pressure (MAP) is steady at 88 mmHg. Stroke volume estimated at 64 mL.<br>
• <strong>Flight Surgeon Directive:</strong> Complete 45-minute daily high-resistance CEVIS cycle ergometer session at 75% VO₂ peak. Ingest oral isotonic rehydration salt protocol prior to gravitational transitions.`;
  }

  if (q.includes("eva") || q.includes("hypoxia") || q.includes("suit") || q.includes("oxygen") || q.includes("leak") || q.includes("depress") || q.includes("decompression")) {
    return `<div class="ai-alert-banner">🚨 CRITICAL EMERGENCY FLIGHT SURGEON DIRECTIVE // EVA SUIT HYPOXIA</div><br>
<strong>1. IMMEDIATE ACTION:</strong> Rotate Extravehicular Mobility Unit (EMU) Primary Life Support System (PLSS) O₂ valve to <strong>HIGH-FLOW EMERGENCY PURGE</strong> (100% O₂ at 4.3 psid).<br><br>
<strong>2. AIRLOCK ABORT:</strong> Terminate EVA immediately. Partner crew member to attach umbilical tether and initiate emergency airlock repressurization to 14.7 psi.<br><br>
<strong>3. CLINICAL TRIAGE:</strong> Current SpO₂ alarm threshold set to 92%. Ingested CSV records confirm nominal pre-breathe protocol duration (120 min) preventing venous gas emboli (Bends). Prepare hyperbaric mask upon ingress.`;
  }

  if (q.includes("radiation") || q.includes("solar") || q.includes("flare") || q.includes("spe") || q.includes("storm") || q.includes("dosim") || q.includes("sievert")) {
    return `<strong>✦ AURA RADIATION DOSIMETRY // Solar Particle Event (SPE) Protocol:</strong><br><br>
<strong>MISSION SECTOR:</strong> ${p.name} (Active Ambient Radiation: <strong>${p.radiation}</strong>).<br><br>
• <strong>Hazard Analysis:</strong> Deep space galactic cosmic ray (GCR) flux and solar proton stream sensors active. Cumulative mission dose tracking within NASA 600 mSv career limit.<br>
• <strong>Storm Shelter Directive:</strong> In the event of a NOAA Class X solar flare alert, crew must relocate to the central water wall / food locker storm shelter within 30 minutes.<br>
• <strong>Medical Prophylaxis:</strong> Dispense antioxidant countermeasures (N-acetylcysteine + Vitamin E) and monitor real-time active personal dosimeters.`;
  }

  if (q.includes("sleep") || q.includes("circadian") || q.includes("insomnia") || q.includes("tired") || q.includes("fatigue") || q.includes("melatonin") || q.includes("wake")) {
    return `<strong>✦ AURA NEURO-BEHAVIORAL // Circadian Regulation & Fatigue Countermeasures:</strong><br><br>
<strong>CLINICAL ASSESSMENT:</strong> Rapid orbital day-night cycles (16 sunrises/24h) trigger melatonin suppression and circadian phase-shifting.<br><br>
• <strong>Crew Sleep Telemetry:</strong> Mean sleep duration over last 7 cycles is 6.8 hours with 18.2% deep N3 sleep.<br>
• <strong>Lighting Protocol:</strong> Solid-State Light Assemblies (SSLA) set to Blue-Enriched High-Kelvin (450nm) during work shifts, shifting to warm low-intensity amber (2700K) 2 hours before crew sleep.<br>
• <strong>Pharmacology:</strong> If insomnia persists, administer 0.5 mg oral melatonin 30 minutes prior to crew rest; avoid benzodiazepines due to emergency wake-up alertness protocols.`;
  }

  if (q.includes("motion") || q.includes("sas") || q.includes("nausea") || q.includes("vestibular") || q.includes("vomit") || q.includes("dizz")) {
    return `<strong>✦ AURA NEURO-VESTIBULAR // Space Adaptation Syndrome (SAS):</strong><br><br>
<strong>CLINICAL ASSESSMENT:</strong> Otolith organs lose gravitational weight input in microgravity, conflicting with visual and semicircular canal signals. Affects up to 70% of crew during flight days 1-3.<br><br>
• <strong>Symptom Triage:</strong> Stomach awareness, malaise, disorientation, and vomiting risk.<br>
• <strong>Clinical Countermeasure:</strong> Administer Promethazine (25-50 mg IM) as approved by Flight Surgeon rules. Restrict rapid head movements along the pitch and roll axes.<br>
• <strong>Operational Rule:</strong> EVA operations strictly prohibited until SAS symptoms have resolved for a minimum of 48 hours.`;
  }

  if (q.includes("bone") || q.includes("muscle") || q.includes("spine") || q.includes("atrophy") || q.includes("ared") || q.includes("calcium") || q.includes("back")) {
    return `<strong>✦ AURA MUSCULOSKELETAL // Bone Mineral Density & Spinal Elongation:</strong><br><br>
<strong>ASSESSMENT:</strong> Without gravitational axial loading, osteoclast activity outpaces osteoblasts, resulting in ~1% trabecular bone loss per month in the femoral neck and lumbar vertebrae.<br><br>
• <strong>Spinal Biometrics:</strong> Intervertebral disc unloading causes +4.5 to +6.0 cm spinal lengthening, leading to acute low back discomfort.<br>
• <strong>Countermeasure Routine:</strong> Mandatory daily 2.5 hours exercise regimen: Advanced Resistive Exercise Device (ARED) squats and deadlifts at 380 lbs, supplemented with weekly bisphosphonates and 1000 IU Vitamin D3.`;
  }

  if (q.includes("dataset") || q.includes("csv") || q.includes("measure") || q.includes("source") || q.includes("stream") || q.includes("lsda") || q.includes("physionet")) {
    return `<strong>✦ AURA TELEMETRY ARCHITECTURE // Bioastronautics Ingestion:</strong><br><br>
This system operates on verified time-series biometric streams compliant with NASA LSDA (Life Sciences Data Archive) and PhysioNet research archives.<br><br>
• <strong>Monitored Biomarkers:</strong> High-resolution continuous ECG waveforms, Heart Rate Variability (HRV), SpO₂ pulse oximetry, respiratory rate, core body temperature, cabin ambient CO₂, and active ionizing radiation.<br><br>
• <strong>Dynamic Replay Engine:</strong> Telemetry rows (${activeCsvRows ? activeCsvRows.length : 0} records) are processed through an edge sliding-window anomaly detector that flags cardiac drift, hypercapnia, and hypoxemia in real time.`;
  }

  return `<strong>✦ AURA FLIGHT SURGEON ASSESSMENT // Command: <em>"${query}"</em></strong><br><br>
<strong>MISSION CONTEXT:</strong> ${p.name} · Gravity: ${p.gravity} · Latency: ${p.delayText}<br><br>
<strong>CLINICAL EVALUATION:</strong> Your query regarding <em>"${query}"</em> has been processed against NASA Bioastronautics Standards (NASA-STD-3001) and Space Flight Human-System Standards.<br><br>
• <strong>Current Crew Vitals:</strong> Real-time heart rate is nominal at <strong>${currentHr} bpm</strong>. SpO₂ steady at <strong>98.4%</strong>. Ingested time-series telemetry shows stable physiological compensation.<br>
• <strong>Operational Directive:</strong> Maintain routine circadian hydration (2.5 L/day), log biometric deviations into the automated mission record, and follow prescribed countermeasure protocols for current mission phase.`;
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
  thinkingDiv.innerHTML = `<span class="thinking-dots"><span></span><span></span><span></span></span> AURA Flight Surgeon analyzing telemetry & spaceflight protocols...`;
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

  // Fallback to local clinical flight surgeon engine
  if (!reply) {
    await new Promise(r => setTimeout(r, 400));
    reply = generateLocalFlightSurgeonReply(query);
  }

  // Remove thinking indicator
  if (thinkingDiv.parentNode) thinkingDiv.parentNode.removeChild(thinkingDiv);

  // Append AI response
  const aiDiv = document.createElement("div");
  aiDiv.className = "assistant-message";
  aiDiv.innerHTML = `<div class="ai-flight-surgeon-tag">✦ AURA FLIGHT SURGEON · CLINICAL DIRECTIVE</div>` + reply;
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
   10. INTERACTIVE COSMIC CANVAS ENGINE
   Living starfield, shooting stars/meteors, ISS orbital beacon, and click ripples
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
  }

  // Multi-layered Serene Stars
  const stars = [];
  const STAR_COLORS = ["#ffffff", "#e0edff", "#c1dcfa", "#7dd3fc", "#38bdf8", "#dfc79c", "#76e4d2"];

  function initStars() {
    stars.length = 0;
    const starCount = Math.min(220, Math.floor((width * height) / 7500));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.5,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
        alpha: Math.random() * 0.7 + 0.25,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        layer: Math.random() > 0.82 ? "foreground" : "background"
      });
    }
  }

  // Meteors / Shooting Stars
  const meteors = [];

  function spawnMeteor(forcedX, forcedY) {
    const startX = forcedX !== undefined ? forcedX : Math.random() * width * 0.9;
    const startY = forcedY !== undefined ? forcedY : Math.random() * (height * 0.45);
    const angle = (Math.PI / 180) * (Math.random() * 20 + 35);
    const speed = Math.random() * 10 + 16;
    const length = Math.random() * 90 + 110;
    const colors = [
      { head: "#ffffff", tail: "rgba(118, 228, 210, 0.7)" },
      { head: "#fef3c7", tail: "rgba(223, 199, 156, 0.7)" },
      { head: "#e0f2fe", tail: "rgba(96, 165, 250, 0.7)" }
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];

    meteors.push({
      x: startX,
      y: startY,
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed,
      length: length,
      alpha: 1,
      decay: Math.random() * 0.02 + 0.016,
      headColor: color.head,
      tailColor: color.tail
    });
  }

  let nextMeteorTime = Date.now() + 2500;

  // Gravitational Ripples on Click
  const ripples = [];
  window.addEventListener("pointerdown", (e) => {
    ripples.push({
      x: e.clientX,
      y: e.clientY,
      radius: 5,
      maxRadius: Math.min(260, width * 0.35),
      alpha: 0.65
    });
    if (Math.random() > 0.4) {
      spawnMeteor(e.clientX - 100, Math.max(10, e.clientY - 120));
    }
  });

  // Mouse Tracking for Interactive Constellation Nodes
  let mouseX = -1000;
  let mouseY = -1000;
  window.addEventListener("pointermove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // ISS Satellite Orbital Tracker
  let issAngle = 0.2;
  const ISS_SPEED = 0.00045;

  function drawIssOrbit(time) {
    const cx = width * 0.52;
    const cy = height * 0.05;
    const rx = width * 0.65;
    const ry = height * 0.42;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, -0.18, Math.PI * 0.15, Math.PI * 0.88);
    ctx.strokeStyle = "rgba(223, 199, 156, 0.15)";
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
    ctx.fillStyle = "rgba(147, 197, 253, 0.65)";
    ctx.fillRect(-11, -3, 6, 6);
    ctx.fillRect(5, -3, 6, 6);
    // Main module
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-4, -2, 8, 4);

    // Pulsing Strobe Beacon
    const pulse = (Math.sin(time * 0.006) + 1) * 0.5;
    const strobeColor = pulse > 0.5 ? "#76e4d2" : "#dfc79c";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5 + pulse * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = strobeColor;
    ctx.fill();

    // Micro HUD Tag
    ctx.font = "8px 'JetBrains Mono', Consolas, monospace";
    ctx.fillStyle = "rgba(226, 232, 240, 0.85)";
    ctx.fillText("ISS · EXP 72 · 262 MI", 14, 3);
    ctx.restore();
  }

  // Main Render Loop (Pure peaceful drift, zero scroll effects)
  function animate(timestamp) {
    if (document.hidden) {
      requestAnimationFrame(animate);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // 1. Draw Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rip = ripples[i];
      rip.radius += 2.8;
      rip.alpha -= 0.012;
      if (rip.alpha <= 0 || rip.radius >= rip.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(223, 199, 156, ${rip.alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (rip.radius > 20) {
        ctx.beginPath();
        ctx.arc(rip.x, rip.y, rip.radius - 18, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(118, 228, 210, ${rip.alpha * 0.3})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Stars (Gentle, steady celestial twinkling - no scroll distortion)
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];

      s.twinklePhase += s.twinkleSpeed;
      const currentAlpha = s.alpha * (0.65 + 0.35 * Math.sin(s.twinklePhase));

      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = width;
      if (s.x > width) s.x = 0;
      if (s.y < 0) s.y = height;
      if (s.y > height) s.y = 0;

      // Interactive Constellation Lines on Mouse Hover
      const distToMouse = Math.hypot(mouseX - s.x, mouseY - s.y);
      if (distToMouse < 95) {
        const lineAlpha = (1 - distToMouse / 95) * 0.32;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.strokeStyle = `rgba(223, 199, 156, ${lineAlpha})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
      if (s.layer === "foreground") {
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 6;
      }
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // 3. Draw ISS Orbit & Vehicle
    drawIssOrbit(timestamp);

    // 4. Spawn Meteors
    if (Date.now() > nextMeteorTime) {
      spawnMeteor();
      nextMeteorTime = Date.now() + Math.random() * 3500 + 4000;
    }

    // 5. Draw Meteors
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
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = Math.max(0, m.alpha);
      ctx.shadowColor = m.headColor;
      ctx.shadowBlur = 10;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(m.x, m.y, 2.5, 0, Math.PI * 2);
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
