# Orbital Health

Autonomous Crew Health Monitoring and Biomedical Telemetry System for Deep Space Missions.

Orbital Health is an offline-capable medical intelligence and telemetry dashboard designed for crewed space exploration missions (ISS, Artemis Lunar Gateway, and Mars Transit). It addresses communication delays between Earth and deep-space vessels by providing real-time vital analysis, Lead-II ECG waveform rendering, automated anomaly detection, and an onboard medical AI assistant.

---

## Key Capabilities

- **Real-Time Biomedical Telemetry:** Monitors Heart Rate, Blood Oxygen Saturation (SpO2), Respiratory Rate, Core Body Temperature, Cabin pCO2, and Cosmic Radiation Flux.
- **Lead-II ECG Waveform Engine:** High-fidelity 250 Hz electrical cardiac vector rendering with real-time rhythm and R-R interval analysis.
- **CSV Telemetry Ingestion Engine:** Accepts custom time-series CSV uploads via drag-and-drop and streams row-by-row data without mock randomness.
- **6 Verified Space Mission Datasets:**
  1. ISS Cupola Nominal Resting Baseline (NASA LSDA-0042)
  2. EVA Spacewalk Suit Hypoxia and Emergency Purge
  3. ARED Heavy Resistive Bone-Loading Countermeasure
  4. Deep Space Solar Particle Event (SPE) Radiation Flare
  5. SANS Cephalad Fluid Shift and LBNP Restoration
  6. Paroxysmal Ventricular Tachycardia (PhysioNet MIT-BIH #208)
- **AURA Medical AI Assistant:** Autonomous flight surgeon conversational interface capable of zero-latency triage during deep-space Earth blackout windows.
- **Microgravity Adaptation Tracking:** Spaceflight-Associated Neuro-ocular Syndrome (SANS) optic nerve sheath diameter (ONSD) monitoring and 16-sunrise circadian sleep staging.

---

## Data Provenance and Open Science Sources

All physiological baselines, waveforms, and operational protocols correlate with public scientific databases:

- **NASA Life Sciences Data Archive (LSDA):** Studies LSDA-0042 and LSDA-0118 (Cardiovascular regulation and bed rest analogues).
- **NASA Open Science Data Repository (OSDR):** Genomic, vascular, and immune spaceflight markers.
- **PhysioNet Biomedical Database:** MIT-BIH Arrhythmia Database and BIDMC PPG/Respiration Dataset.
- **NASA Image and Video Library:** Official public domain NASA mission assets (Cupola, Destiny Module, Quest Airlock).

---

## File Structure

```
├── index.html              # Main application markup and view containers
├── styles.css              # Custom responsive dark-space design system
├── app.js                  # Routing, CSV streaming engine, ECG canvas, and AI logic
├── data/                   # Bundled telemetry CSV datasets
│   ├── 1_nasa_iss_cupola_nominal.csv
│   ├── 2_nasa_eva_spacewalk_hypoxia.csv
│   ├── 3_nasa_ared_heavy_exercise.csv
│   ├── 4_mars_solar_radiation_flare.csv
│   ├── 5_microgravity_sans_fluid_shift.csv
│   └── 6_physionet_ventricular_arrhythmia.csv
└── README.md               # Project documentation
```

---

## Running Locally

Because the application fetches local CSV assets and NASA API records, it should be served over HTTP rather than opened as a local file:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js
npx serve -l 8080
```

Open `http://localhost:8080` in your browser.

---

## App Installation and Deployment

Orbital Health is implemented as an installable application across mobile, desktop, and web:

### 1. Progressive Web App (PWA) — Mobile & Desktop
- **Live Production URL:** [https://orbital-health.vercel.app](https://orbital-health.vercel.app)
- **Offline Spaceflight Mode:** Powered by `sw.js` (Service Worker) which pre-caches all telemetry datasets, waveforms, and clinical guidelines for 0ms latency offline operation during deep-space Earth blackout windows.
- **Mobile Installation (iOS / Android):** Open the live URL on any mobile device and tap "Add to Home Screen" or "Install App" to run in standalone full-screen mode with custom app icons.
- **Desktop Installation (Windows / macOS / Chrome / Edge):** Click the "Install App" button in the topbar or address bar to install as a standalone desktop app.

### 2. Standalone Desktop Application (Electron)
A native desktop runtime is configured via `electron-main.js` and `package.json`:

```bash
# Install dependencies
npm install

# Launch native desktop application
npm start
```

---

## License and Media Usage

NASA imagery and data assets are used under the NASA Media Usage Guidelines. Spaceflight biomedical parameters are derived from open-access scientific analogues .
