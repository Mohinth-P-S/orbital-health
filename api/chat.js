// api/chat.js - Vercel Serverless Function for AURA Autonomous Flight Surgeon & Medical Officer
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

  const { message, planet, crew } = body || {};
  const query = (message || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Message query is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  // If backend has API key configured, call Gemini on the server side
  if (apiKey) {
    try {
      const systemInstruction = `You are AURA, the Autonomous Flight Surgeon and Chief Medical Officer onboard an active deep-space exploration mission.
Active mission environment: ${planet || 'Earth Low Earth Orbit'}. Monitored crew: Anne McClain, Mike Fincke, Dr. Marcus Chen, and the user Commander.

TONE AND BEHAVIOR REQUIREMENTS:
1. Formal, Professional Medical Demeanor:
   - Speak in a composed, formal, polite, and professional tone—resembling an expert physician and aerospace medical officer.
   - Do not use excessive jokes, overly casual slang, or forced humor. Maintain the dignified gravitas of a licensed aerospace medical officer.
   - Address the user respectfully as Commander.
2. Full Conversational Breadth:
   - You must acknowledge and respond properly to everyday human sentences, feelings, and social courtesies:
     • Greetings ("hi", "hello", "good morning"): Acknowledge formally and inquire how you may assist their health, telemetry, or mission today.
     • Departures ("bye", "goodbye", "signing off"): Formally acknowledge and confirm continuous medical and telemetry watch.
     • Gratitude ("thank you", "thanks"): Respond with formal courtesy ("You are welcome, Commander. I remain on standby for any clinical or mission needs.").
     • Human feelings ("I feel tired", "I am stressed", "feeling down", "anxious"): Respond with clinical empathy and calm physician guidance, addressing the physiological underpinnings (orbital fatigue, circadian disruption, stress) with care and dignity.
     • General queries: Provide clear, formal, and articulate answers.
3. Medical & Physiological Questions:
   - When asked about medical conditions, biometrics, or countermeasures (SANS, cardiovascular drift, hypoxia, radiation, sleep, motion sickness, nutrition, bone loss):
     Deliver rigorous, evidence-based aerospace medical analysis grounded in NASA Bioastronautics Standards (NASA-STD-3001) and Human Research Program data.
   - Explain clinical concepts clearly and directly with actionable medical guidance.
4. Identity:
   - You are AURA, the onboard Flight Surgeon and Autonomous Medical Officer. Do not refer to yourself as a language model or AI from Google.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: query }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.35,
            maxOutputTokens: 800
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
      console.warn('Backend model call error, using formal medical officer engine:', e.message);
    }
  }

  // Fallback to formal, professional medical officer engine directly from backend
  const fallback = generateFormalMedicalOfficerReply(query, planet);
  return res.status(200).json({ reply: fallback, source: 'backend-formal' });
}

function generateFormalMedicalOfficerReply(query, planet = 'Earth') {
  const q = query.toLowerCase().trim();

  // 1. Social Courtesies & Everyday Conversational Sentences (Formal & Doctor-like)
  if (/^(hi|hello|hey|greetings|good morning|good evening|good afternoon)/.test(q)) {
    return `Hello, Commander. AURA Flight Surgeon standing by. All biomedical telemetry and life-support channels are active and nominal. 

How may I assist you with your health, telemetry data, or mission protocol today?`;
  }

  if (q.includes('bye') || q.includes('goodbye') || q.includes('signing off') || q.includes('see you') || q.includes('good night')) {
    return `Understood, Commander. Standing by on continuous biometric and telemetry watch. Ensure all scheduled sleep and countermeasure protocols are maintained. Stay safe.`;
  }

  if (q.includes('thank') || q.includes('thx') || q.includes('appreciate')) {
    return `You are welcome, Commander. It is my duty to ensure the operational readiness and physical well-being of the crew. Please notify me if any further medical support is required.`;
  }

  if (q.includes('how are you') || q.includes('how r u') || q.includes('status report') || q.includes('how are things')) {
    return `I am operating at peak efficiency, Commander. Diagnostic telemetry, life support interfaces, and analytical modules are fully functional across the station. 

How is your physiological state and energy level today?`;
  }

  if (q.includes('who are you') || q.includes('what are you') || q.includes('what can you do') || q.includes('introduce yourself')) {
    return `I am **AURA** (Autonomous Universal Resuscitation & Aerospace-medical Assistant), your designated Chief Flight Surgeon and Autonomous Medical Officer onboard this mission.

My operational responsibilities include:
• Continuous monitoring of crew biometrics (ECG rhythms, SpO₂ saturation, respiration, core temperature).
• Assessment and countermeasure management for microgravity adaptations such as SANS, cardiovascular deconditioning, and ionizing radiation exposure.
• Providing clinical decision support grounded in NASA Bioastronautics Standards (NASA-STD-3001).
• General operational and conversational assistance for the Commander and crew.`;
  }

  // 2. Human Feelings & Psychological State (Clinical Empathy)
  if (q.includes('tired') || q.includes('exhausted') || q.includes('fatigue') || q.includes('sleepy') || q.includes('burnout')) {
    return `Acknowledged, Commander. Spaceflight fatigue is a recognized physiological consequence of microgravity adaptation and the rapid 90-minute orbital circadian cycle.

**Clinical Recommendations:**
1. **Circadian Entrainment:** Ensure the Solid-State Lighting Assemblies (SSLA) in your quarters transition to warm amber (2700K) 2 hours prior to scheduled sleep to facilitate endogenous melatonin production.
2. **Hydration & Electrolytes:** Maintain the standard 2.5 L/day hydration schedule to prevent hypovolemia-induced lethargy.
3. **Rest Discipline:** Ensure a minimum of 7.5 to 8.0 hours of uninhibited rest in your sleep station.

If this fatigue is accompanied by cognitive slowing or muscular weakness, please report for a formal neuro-vestibular assessment.`;
  }

  if (q.includes('stress') || q.includes('anxious') || q.includes('anxiety') || q.includes('worried') || q.includes('down') || q.includes('lonely') || q.includes('sad')) {
    return `Understood, Commander. Prolonged confinement and isolation in deep space place significant psychological demands on the crew. Experiencing stress in this environment is a natural physiological and emotional reaction.

**Supportive Protocols:**
• **Visual Sensory Grounding:** I recommend spending 15–20 minutes at the Cupola window observing Earth or the starfield. NASA behavioral health research demonstrates that viewing the orbital horizon actively lowers cortisol and stabilizes heart rate variability (HRV).
• **Decompression Interval:** Consider scheduling an operational pause between duty shifts to listen to audio or contact ground support if communication latency permits.
• I remain available at any time to log observations or discuss your well-being. Your psychological resilience is vital to this mission.`;
  }

  if (q.includes('joke') || q.includes('funny') || q.includes('humor')) {
    return `While my primary function is clinical decision support, maintaining crew morale is a documented component of behavioral health.

Here is an aerospace observation: *Why did the astronaut break up with the capsule? Because she just needed a little more space.*

I trust your spirits remain high, Commander. How else may I assist you today?`;
  }

  // 3. Clinical & Medical Protocol Inquiries (Authoritative Aerospace Physician)
  if (q.includes('sans') || q.includes('ocular') || q.includes('eye') || q.includes('vision') || q.includes('optic') || q.includes('papilledema')) {
    return `### CLINICAL ASSESSMENT // SANS (Spaceflight-Associated Neuro-ocular Syndrome)

**Etiology:** Microgravity-induced cephalad venous fluid migration causes chronic venous engorgement of the head and orbit, elevating optic sheath pressure.

**Current Telemetry Status:**
• **Optic Nerve Sheath Diameter (ONSD):** Steady at **5.1 mm** (Normal baseline: 4.8–5.4 mm; Clinical alert threshold: ≥ 5.8 mm).
• **Retinal Nerve Fiber Layer (RNFL):** Grade 0; no optic disc edema or choroidal folds detected.
• **Mission Environment:** ${planet}. Cephalad venous pooling is actively monitored.

**Prescribed Countermeasure Protocol:**
1. Undergo 45 minutes of Lower Body Negative Pressure (LBNP) at 50 mmHg prior to the sleep cycle to redistribute venous volume to the lower extremities.
2. Maintain scheduled daily OCT (Optical Coherence Tomography) and ultrasound ONSD scans.
3. Report any hyperopic visual shifts or scotoma immediately.`;
  }

  if (q.includes('cardio') || q.includes('heart') || q.includes('ecg') || q.includes('drift') || q.includes('pulse') || q.includes('arrhythmia') || q.includes('bpm')) {
    return `### CLINICAL ASSESSMENT // Cardiovascular Adaptation & Rhythm Telemetry

**Etiology:** Absence of hydrostatic pressure gradient reduces circulating plasma volume by 10–15% and resets arterial baroreceptors, predisposing the crew to cardiovascular drift and post-flight orthostatic intolerance.

**Current Telemetry Status:**
• **Resting Heart Rate:** Nominal baseline at **72 bpm** (sinus rhythm regular, no ectopic beats).
• **Hemodynamics:** Mean Arterial Pressure (MAP) is stable at 88 mmHg (118/76 mmHg).
• **Active Sector:** ${planet}.

**Prescribed Countermeasure Protocol:**
1. Complete daily 45-minute aerobic conditioning on the CEVIS cycle ergometer at 75% VO₂ max.
2. Follow oral saline rehydration protocol (1 g NaCl per 125 mL water) 48 hours prior to any gravitational transition.
3. Continue continuous 3-lead ECG monitoring during high-exertion EVA or exercise periods.`;
  }

  if (q.includes('eva') || q.includes('hypoxia') || q.includes('suit') || q.includes('oxygen') || q.includes('leak') || q.includes('depress')) {
    return `### EMERGENCY DIRECTIVE // ACUTE EVA SUIT HYPOXIA & PRESSURE ANOMALY

**Priority Actions:**
1. **Purge Activation:** Immediately rotate the Primary Life Support System (PLSS) O₂ valve to **HIGH-FLOW EMERGENCY PURGE** (100% O₂ at 4.3 psid).
2. **Immediate Airlock Abort:** Terminate EVA activities. Attach safety tether to partner crew member and proceed directly to airlock ingress.
3. **Repressurization:** Seal the outer hatch and execute emergency airlock repressurization to 14.7 psi.
4. **Clinical Threshold:** SpO₂ alarm is engaged at 92%. Prepare 100% normobaric oxygen therapy mask upon airlock entry.`;
  }

  if (q.includes('radiation') || q.includes('solar') || q.includes('flare') || q.includes('spe') || q.includes('storm') || q.includes('dosim')) {
    return `### CLINICAL ASSESSMENT // Deep Space Ionizing Radiation Dosimetry

**Dosimetry Status:**
• **Active Mission Sector:** ${planet}. Ambient radiation flux is monitored via high-energy particle dosimeters.
• **Cumulative Exposure:** Current crew exposure remains within NASA career standards (< 600 mSv career limit).

**Operational Protocols:**
1. **Solar Particle Event (SPE) Protocol:** In the event of a NOAA Class X solar proton event, crew must relocate to the reinforced central storm shelter (shielded by water walls and polyethylene storage) within 30 minutes.
2. **Prophylactic Countermeasure:** Ingest prescribed antioxidant regimen (N-acetylcysteine + Vitamin E) to mitigate cellular oxidative stress.
3. Maintain active dosimeter synchronization every 12 hours.`;
  }

  if (q.includes('sleep') || q.includes('circadian') || q.includes('insomnia') || q.includes('melatonin')) {
    return `### CLINICAL ASSESSMENT // Circadian Phase Regulation & Orbital Sleep

**Etiology:** Exposure to 16 orbital sunrises per 24-hour cycle suppresses natural melatonin release and disrupts circadian sleep architecture, reducing restorative Stage 3 NREM sleep.

**Prescribed Sleep Hygiene Protocol:**
1. **Cabin Phototherapy:** Solid-State Light Assemblies (SSLA) must be set to warm amber (2700K, low lux) 2 hours before scheduled rest to allow endogenous melatonin synthesis.
2. **Pharmacotherapy:** If acute insomnia occurs, administer 0.5 mg oral melatonin 30 minutes prior to sleep. Avoid sedative-hypnotics that impair emergency arousal.
3. **Mechanical Restraint:** Secure sleeping berths to eliminate microgravity drift against station bulkheads.`;
  }

  if (q.includes('motion') || q.includes('sas') || q.includes('nausea') || q.includes('vestibular') || q.includes('vomit') || q.includes('dizzy')) {
    return `### CLINICAL ASSESSMENT // Space Adaptation Syndrome (SAS)

**Etiology:** Loss of gravitational otolith loading produces conflicting sensory inputs between the vestibular otolith organs, semicircular canals, and visual cortex. This affects approximately 70% of astronauts during Flight Days 1 through 3.

**Clinical Management:**
1. **Pharmacotherapy:** Administer Promethazine (25–50 mg IM or oral) as approved by flight surgeon protocols.
2. **Behavioral Restriction:** Minimize rapid angular head movements, especially along the pitch and yaw axes. Restrict visual focus to fixed station reference points.
3. **Operational Constraint:** Extravehicular Activity (EVA) is strictly contra-indicated until SAS symptoms have been absent for 48 consecutive hours.`;
  }

  if (q.includes('bone') || q.includes('muscle') || q.includes('ared') || q.includes('exercise') || q.includes('atrophy')) {
    return `### CLINICAL ASSESSMENT // Musculoskeletal Deconditioning & Bone Loss

**Etiology:** In microgravity, unweighted cancellous bone undergoes uncoupled remodeling, losing approximately 1.0–1.5% bone mineral density per month in the calcaneus, femoral neck, and lumbar spine.

**Prescribed Countermeasure Protocol:**
1. **ARED Regimen:** Mandatory 2.5 hours of daily resistive training using the Advanced Resistive Exercise Device (ARED)—targeting squats, deadlifts, and heel raises at high mechanical loads.
2. **Pharmacology & Nutrition:** Maintain weekly bisphosphonate dosing and daily 1000 IU Vitamin D3 with adequate calcium intake.
3. Complete post-exercise biomechanical cool-down to prevent intervertebral disc impingement during spinal re-lengthening.`;
  }

  // 4. General Queries Fallback
  return `Commander, your query regarding "${query}" has been received and evaluated against current mission telemetry and aerospace flight guidelines.

All life support parameters and crew biometrics for sector ${planet} remain within nominal operational ranges. Please specify if you require diagnostic evaluation, physiological telemetry analysis, or specific flight surgeon countermeasures.`;
}
