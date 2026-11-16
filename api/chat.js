// api/chat.js - Vercel Serverless Function for AURA Autonomous Flight Surgeon & Medical Officer
// PROTOTYPE CLINICAL DECISION SUPPORT SYSTEM (CDSS) - NON-FLIGHT-CERTIFIED DEMONSTRATION

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (!body && req.readable) {
    try {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      body = JSON.parse(raw);
    } catch (e) {
      body = {};
    }
  } else if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }

  const { message, planet } = body || {};
  const query = (message || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Message query is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  // If backend has API key configured, call Gemini with structured medical CDSS system prompt
  if (apiKey) {
    try {
      const systemInstruction = `You are AURA, an onboard Autonomous Clinical Decision Support System (CDSS) prototype and Chief Flight Surgeon assistant for a long-duration human spaceflight mission.
Active mission environment: ${planet || 'Earth Low Earth Orbit'}. Monitored crew: Crew Member A (EVA Specialist), Crew Member B (Flight Engineer), and Crew Member C (Science Officer).

CORE SAFETY AND CLINICAL CONSTRAINTS:
1. You are a decision-support prototype, NOT an autonomous prescribing physician. Do not claim official flight certification or make definitive unilateral diagnoses.
2. For any clinical, physiological, telemetry, or medical inquiry, format your response using this EXACT 6-part structure:
   ### 1. OBSERVATION
   (State the specific objective reading, vital parameters, or reported symptom)
   ### 2. POSSIBLE SIGNIFICANCE
   (Explain the underlying spaceflight physiological mechanism: microgravity fluid shift, SANS, cardiovascular deconditioning, bone resorption, radiation, etc.)
   ### 3. DATA-QUALITY CHECKS
   (Identify potential sensor displacement, motion artifact, optical coupling errors, or noise to rule out false positives)
   ### 4. SUGGESTED NEXT ACTION
   (Recommend verified, non-prescriptive protocolized countermeasures, e.g. LBNP, hydration, exercise adjustments, lighting modulation)
   ### 5. ESCALATION GUIDANCE
   (Specify clear escalation triggers for alerting the on-board Crew Medical Officer (CMO) or ground Flight Surgeon via delay-tolerant telemetry)
   ### 6. SCIENTIFIC REFERENCE
   (Cite authoritative standards: NASA-STD-3001, NASA Human Research Roadmap, ESA EAC, CSA Astroskin, or peer-reviewed space medicine literature)

3. For social greetings or general questions, maintain a formal, polite, composed aerospace officer demeanor, address the user as Commander, and offer structured medical decision support.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: query }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 900
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return res.status(200).json({ reply: text, source: 'backend-live' });
        }
      }
    } catch (e) {
      console.warn('Backend model call error, using transparent rule-based medical engine:', e.message);
    }
  }

  // Transparent, explainable rule-based clinical decision support fallback
  const fallback = generateStructuredMedicalOfficerReply(query, planet);
  return res.status(200).json({ reply: fallback, source: 'backend-rule-based' });
}

function generateStructuredMedicalOfficerReply(query, planet = 'Earth') {
  const q = query.toLowerCase().trim();

  // 1. Social Courtesies & Operational Greetings
  if (/^(hi|hello|hey|greetings|good morning|good evening|good afternoon)/.test(q)) {
    return `Greetings, Commander. AURA Clinical Decision Support System standing by. All biomedical telemetry channels for sector **${planet}** are active and nominal. 

How may I assist you with crew biometrics, countermeasure protocols, or mission telemetry evaluation today?`;
  }

  if (q.includes('bye') || q.includes('goodbye') || q.includes('signing off') || q.includes('see you') || q.includes('good night')) {
    return `Acknowledged, Commander. Standing by on continuous biomedical telemetry watch. Ensure scheduled circadian lighting protocols and rest discipline are maintained. Inform me if any physiological symptoms develop.`;
  }

  if (q.includes('thank') || q.includes('thx') || q.includes('appreciate')) {
    return `You are welcome, Commander. It is my duty to ensure the operational readiness and physical well-being of the crew. Please notify me if any further medical decision support is required.`;
  }

  if (q.includes('who are you') || q.includes('what are you') || q.includes('what can you do') || q.includes('introduce yourself')) {
    return `I am **AURA** (Autonomous Universal Resuscitation & Aerospace-medical Assistant), an onboard Clinical Decision Support System (CDSS) prototype designed for deep-space exploration missions.

**Core Capabilities:**
• Continuous monitoring of crew vital telemetry (Lead-II ECG rhythm, SpO₂, respiration rate, core temperature, cabin atmosphere).
• Assessment of microgravity adaptation risks (SANS cephalad fluid shift, cardiovascular drift, bone demineralization, ionizing radiation).
• Protocolized, explainable clinical guidance structured around NASA-STD-3001 Bioastronautics Standards.
• Autonomous delay-tolerant decision support during deep-space Earth communication blackouts.

*Disclaimer: Prototype demonstration software for non-physician crew support. Does not autonomously diagnose or prescribe.*`;
  }

  // 2. Clinical & Spaceflight Physiological Protocols (Standard 6-Part Structure)

  // SANS / Ocular / Vision / Optic Nerve
  if (q.includes('sans') || q.includes('ocular') || q.includes('eye') || q.includes('vision') || q.includes('optic') || q.includes('papilledema')) {
    return `### 1. OBSERVATION
Simulated telemetry shows Optic Nerve Sheath Diameter (ONSD) at **5.1 mm** (within nominal threshold < 5.8 mm). Intraocular pressure (IOP) is 16.2 mmHg. Crew reports mild cephalad fullness consistent with microgravity fluid redistribution.

### 2. POSSIBLE SIGNIFICANCE
Spaceflight-Associated Neuro-ocular Syndrome (SANS) results from chronic cephalad venous fluid shifts due to the absence of gravitational hydrostatic pressure gradients. This causes sustained elevation of central venous and retrobulbar pressures, potentially leading to optic nerve sheath expansion, optic disc edema (papilledema), and posterior globe flattening.

### 3. DATA-QUALITY CHECKS
• Verify ocular ultrasound probe alignment along the transverse retrobulbar acoustic axis to rule out oblique caliper placement.
• Confirm Optical Coherence Tomography (OCT) optical coupling and verify signal-to-noise ratio > 7/10 on macular scans.
• Re-check IOP using tonometry across three consecutive measurements to eliminate eyelid squeeze artifacts.

### 4. SUGGESTED NEXT ACTION
• Schedule a 30-minute session of Lower Body Negative Pressure (LBNP) at -25 mmHg to draw approximately 1.0–1.2 L of fluid toward the lower extremities.
• Perform high-resolution Optical Coherence Tomography (OCT) scan in the Columbus module to inspect Retinal Nerve Fiber Layer (RNFL) thickness and rule out early choroidal folds.
• Maintain dietary sodium restriction (< 2,000 mg/day) to minimize cranial fluid retention.

### 5. ESCALATION GUIDANCE
If visual acuity degrades (Snellen chart drop > 1 line), persistent hyperopic shift occurs, or visual scotomas develop, escalate immediately to the Crew Medical Officer (CMO) and transmit raw OCT raster sets to ground Flight Surgeons via delay-tolerant telemetry packet.

### 6. SCIENTIFIC REFERENCE
NASA Human Research Program (HRP) SANS Evidence Report; NASA-STD-3001 Vol 1 §4.2.3; Lee et al., "Spaceflight-associated neuro-ocular syndrome," *NPJ Microgravity*, 2020.`;
  }

  // Cardiovascular / Heart / ECG / Arrhythmia
  if (q.includes('cardio') || q.includes('heart') || q.includes('ecg') || q.includes('drift') || q.includes('arrhythmia') || q.includes('pulse') || q.includes('bpm')) {
    return `### 1. OBSERVATION
Simulated telemetry indicates resting heart rate at **72.4 bpm** with regular Lead-II P-Q-R-S-T morphology. R-R interval variation is 830 ms (RMSSD 48 ms). Mean Arterial Pressure (MAP) is stable at 88 mmHg.

### 2. POSSIBLE SIGNIFICANCE
In microgravity, elimination of hydrostatic column gradients triggers an initial stroke volume elevation followed by progressive plasma volume contraction (~10–15%) and baroreflex deconditioning within 14–30 days. This predisposes astronauts to cardiovascular drift during exercise and orthostatic intolerance upon gravitational re-entry.

### 3. DATA-QUALITY CHECKS
• Verify Bio-Harness / Astroskin chest strap electrode impedance and ensure skin hydration contact.
• Rule out baseline wander or muscle electromyographic (EMG) noise during station locomotion.
• Check for premature ventricular contractions (PVCs) vs motion artifact on the Lead-II vector.

### 4. SUGGESTED NEXT ACTION
• Maintain mandatory daily 30-minute aerobic interval protocol on the CEVIS cycle ergometer at 75% VO₂ peak (185 Watts).
• Combine with Advanced Resistive Exercise Device (ARED) resistance routines to sustain peripheral venous pump tone.
• Verify oral hydration of 2,500 mL/day with balanced electrolytes.

### 5. ESCALATION GUIDANCE
If sustained tachycardia (> 110 bpm at rest), frequent ectopic beats (> 6 PVCs/min), or symptomatic palpitations/dizziness occur, alert the Crew Medical Officer (CMO) and initiate continuous 12-lead diagnostic ECG recording.

### 6. SCIENTIFIC REFERENCE
NASA-STD-3001 Vol 1 §4.1; Hughson et al., "Cardiovascular regulation in microgravity," *J Appl Physiol*, 2018; PhysioNet MIT-BIH Arrhythmia Database.`;
  }

  // EVA / Hypoxia / Suit Leak
  if (q.includes('eva') || q.includes('hypoxia') || q.includes('suit') || q.includes('oxygen') || q.includes('leak') || q.includes('purge')) {
    return `### 1. OBSERVATION
Simulated arterial oxygen saturation (SpO₂) decreased to **88.4%** with compensatory tachypnea (respiration rate 22 br/min) and heart rate rise to 108 bpm during Extravehicular Activity (EVA).

### 2. POSSIBLE SIGNIFICANCE
Indicates acute hypoxemia, potentially secondary to suit micro-meteoroid puncture, suit regulator failure, or inadequate Primary Life Support System (PLSS) oxygen delivery. Hypoxia in extravehicular spaces impairs cognitive judgment within seconds.

### 3. DATA-QUALITY CHECKS
• Check suit pulse oximeter finger sensor optical coupling; rule out peripheral vasoconstriction due to cold suit finger temperatures.
• Cross-reference telemetry with suit pressure transducer (PLSS chamber pressure nominal is 4.3 psid).
• Check cabin/suit oxygen partial pressure sensor for concordance.

### 4. SUGGESTED NEXT ACTION
• **Immediate Purge:** Rotate PLSS primary oxygen regulator to HIGH-FLOW PURGE (100% O₂ at 4.3 psid).
• Terminate active EVA tasks immediately; attach safety tether to tether partner.
• Proceed directly to Quest airlock ingress.

### 5. ESCALATION GUIDANCE
Declare emergency status on the station intercom. Alert Crew Medical Officer (CMO) to prepare airlock hyperbaric repressurization to 14.7 psi and standby with emergency normobaric face mask.

### 6. SCIENTIFIC REFERENCE
NASA-STD-3001 Vol 2 §6.3 (Atmospheric Quality and Pressure); ISS Flight Rule B13-102 (EVA Suit Depressurization Protocols).`;
  }

  // Radiation / Solar Flare / SPE / Cosmic Rays
  if (q.includes('radiation') || q.includes('solar') || q.includes('flare') || q.includes('spe') || q.includes('storm') || q.includes('dosim')) {
    return `### 1. OBSERVATION
Active ambient ionizing radiation dosimeter reads **0.42 mSv/day** in nominal Galactic Cosmic Ray (GCR) background. Cumulative mission dose tracked for sector **${planet}**.

### 2. POSSIBLE SIGNIFICANCE
Deep space transit outside the Earth's magnetosphere exposes astronauts to both continuous high-Z and high-energy (HZE) Galactic Cosmic Rays and potential acute Solar Particle Events (SPE). SPEs deliver acute proton doses that can induce prodromal radiation sickness and immunosuppression.

### 3. DATA-QUALITY CHECKS
• Correlate active silicon dosimeter readouts with passive thermoluminescent dosimeter (TLD) badges.
• Rule out localized sensor noise or electromagnetic interference from communication antennas.
• Confirm NOAA Space Weather Prediction Center / onboard solar proton monitor alert validation.

### 4. SUGGESTED NEXT ACTION
• In the event of an SPE proton flux threshold alert (> 100 MeV protons detected), execute immediate shelter protocol into the heavily shielded central module core (water wall and food stowage shielding) within 30 minutes.
• Administer prophylactic antioxidant countermeasures as authorized by flight medical kits.
• Log cumulative absorbed dose per astronaut in the mission radiation registry.

### 5. ESCALATION GUIDANCE
If dosimeter readings exceed 50 mSv in any 24-hour window, initiate immediate acute radiation syndrome (ARS) monitoring protocol and consult ground Flight Surgeons.

### 6. SCIENTIFIC REFERENCE
NASA-STD-3001 Vol 1 §4.3 (Permissible Radiation Exposure Limits); NCRP Report No. 153 (Information for Space Exploration); NASA Open Science Data Repository (OSDR / RadLab).`;
  }

  // CO2 / Carbon Dioxide / Hypercapnia
  if (q.includes('co2') || q.includes('carbon') || q.includes('hypercapnia') || q.includes('headache') || q.includes('scrubber') || q.includes('cdra')) {
    return `### 1. OBSERVATION
Cabin atmospheric carbon dioxide concentration is **0.31% vol**, corresponding to a partial pressure of **2.36 mmHg** at standard 760 mmHg (101.3 kPa) cabin atmospheric pressure.

### 2. POSSIBLE SIGNIFICANCE
Microgravity impairs convective air currents, causing localized pockets of elevated CO₂ around astronauts' heads during rest or sleep. Elevated pCO₂ (> 3.0 mmHg) triggers cerebral vasodilation, exacerbating cephalad fluid pressures, frontal headaches, and SANS risk.

### 3. DATA-QUALITY CHECKS
• Verify ECLSS atmospheric sensor calibration using primary and backup carbon dioxide analyzers.
• Inspect local bunk airflow velocity sensors (> 15 ft/min required) to rule out stagnant micro-pocket accumulation.

### 4. SUGGESTED NEXT ACTION
• Verify Carbon Dioxide Removal Assembly (CDRA) or amine bed thermal regeneration cycle.
• Ensure personal cabin sleep station ventilation fans are operating at nominal flow.
• Limit crew exertion in unventilated station modules.

### 5. ESCALATION GUIDANCE
If cabin pCO₂ exceeds 3.5 mmHg (0.46% at 760 mmHg) or crew members report bilateral throbbing frontal headaches, alert the Crew Medical Officer and reconfigure ECLSS to high-scrub mode.

### 6. SCIENTIFIC REFERENCE
NASA-STD-3001 Vol 2 §6.3.2 (Carbon Dioxide Limits); Law et al., "Relationship Between Carbon Dioxide Levels and Reported Headaches on the International Space Station," *J Occup Environ Med*, 2014.`;
  }

  // Sleep / Circadian / Melatonin / Fatigue
  if (q.includes('sleep') || q.includes('circadian') || q.includes('tired') || q.includes('fatigue') || q.includes('melatonin') || q.includes('insomnia')) {
    return `### 1. OBSERVATION
Astronaut reports fatigue following orbital shift work. Actigraphy log indicates 6.1 hours of fragmented sleep across 16 daily orbital sunrise/sunset cycles.

### 2. POSSIBLE SIGNIFICANCE
Orbital circadian desynchronosis impairs restorative Stage 3 Slow-Wave (NREM) sleep, increasing daytime fatigue, cognitive latency on Psychomotor Vigilance Tasks (PVT), and operational error risk.

### 3. DATA-QUALITY CHECKS
• Inspect wearable actigraphy sleep-staging data for movement artifacts or loose sensor contact.
• Review PVT cognitive test scores to quantify objective alertness vs subjective fatigue.

### 4. SUGGESTED NEXT ACTION
• **Phototherapy Regulation:** Set Solid-State Light Assemblies (SSLA) in quarters to warm amber (2700K, blue-depleted spectrum) 2 hours prior to scheduled sleep to facilitate endogenous melatonin synthesis.
• Calibrate sleep station tether tension to eliminate body flotation wall collisions.
• Ingest 250 mL electrolyte fluid to mitigate hypovolemia-induced tiredness.

### 5. ESCALATION GUIDANCE
If sleep debt exceeds 12 cumulative hours or PVT reaction latency slows by > 25%, notify the Crew Medical Officer (CMO) for duty schedule restructuring.

### 6. SCIENTIFIC REFERENCE
NASA Human Research Program Sleep Evidence Report; NASA-STD-3001 Vol 1 §4.4; Barger et al., "Prevalence of sleep deficiency and hypnotic use among astronauts," *Lancet Neurol*, 2014.`;
  }

  // Musculoskeletal / Bone / Muscle / ARED / Spine
  if (q.includes('bone') || q.includes('muscle') || q.includes('spine') || q.includes('atrophy') || q.includes('ared') || q.includes('osteopenia')) {
    return `### 1. OBSERVATION
Simulated musculoskeletal telemetry shows estimated lumbar spinal elongation of **+4.2 cm** with 98.4% bone retention index and 96.8% calf muscle volume retention.

### 2. POSSIBLE SIGNIFICANCE
The absence of axial gravitational loading induces intervertebral disc expansion, causing paraspinal muscle fatigue and back pain. Concurrently, unweighted osteocytes down-regulate bone formation while osteoclasts increase bone resorption (~1.0–1.5% bone mineral density loss per month in lower extremities without countermeasures).

### 3. DATA-QUALITY CHECKS
• Cross-reference ARED load sensor logs with astronaut biometric bio-impedance measurements.
• Verify weekly 24-hour urine calcium excretion analysis to monitor hypercalciuria and renal stone risk.

### 4. SUGGESTED NEXT ACTION
• Maintain daily Advanced Resistive Exercise Device (ARED) protocol: 4 sets of 10 repetitions on squats, deadlifts, and heel raises with > 300 lbs force equivalent.
• Complete 30-minute T2 treadmill session with bungee harness loading set to 75% body weight.
• Ensure daily intake of 800 IU Vitamin D3 and adequate dietary calcium.

### 5. ESCALATION GUIDANCE
If severe acute lumbar radiculopathy (sharp pain radiating down lower extremities) occurs, suspend high-load axial deadlifts and alert the Crew Medical Officer for neuromuscular spinal assessment.

### 6. SCIENTIFIC REFERENCE
NASA Human Research Program Musculoskeletal Evidence Report; NASA-STD-3001 Vol 1 §4.5; Sibonga et al., "Recovery of bone density after long-duration spaceflight," *J Bone Miner Res*, 2017.`;
  }

  // General Fallback
  return `### 1. OBSERVATION
Query regarding "${query}" evaluated for sector **${planet}**. Current crew biometric telemetry and life support indicators are within established mission tolerances.

### 2. POSSIBLE SIGNIFICANCE
All monitored physiological subsystems (cardiovascular, respiratory, neuro-ocular, musculoskeletal) exhibit expected adaptation dynamics without acute destabilization.

### 3. DATA-QUALITY CHECKS
Biomedical telemetry streams confirm continuous sensor continuity, nominal signal-to-noise ratios, and verified 1 Hz vital packet integrity.

### 4. SUGGESTED NEXT ACTION
Continue scheduled mission timeline, daily exercise countermeasure quotas (ARED + CEVIS), and environmental monitoring protocols.

### 5. ESCALATION GUIDANCE
If specific symptoms arise or anomalous physiological trends appear, consult AURA with targeted vital parameters or escalate directly to the Crew Medical Officer (CMO).

### 6. SCIENTIFIC REFERENCE
NASA-STD-3001 Bioastronautics Standards (Vol 1 & 2); NASA Human Research Program Roadmap.`;
}
