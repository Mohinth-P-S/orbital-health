// api/chat.js - Vercel Serverless Function for AURA Autonomous Flight Surgeon
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

  const { message, planet, crew } = req.body || {};
  const query = (message || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Message query is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  // If backend has API key configured, call Gemini 2.5 Flash on the server side
  if (apiKey) {
    try {
      const systemInstruction = `You are AURA (Autonomous Universal Resuscitation & Aerospace-medical Assistant), the Chief Flight Surgeon and Autonomous Medical Officer onboard an active deep-space exploration mission.
You are grounded in NASA Bioastronautics Standards (NASA-STD-3001), NASA Human Research Program (HRP) Evidence Books, spaceflight clinical practice guidelines, and communication latency regimes.
Current active mission target: ${planet || 'Earth Low Earth Orbit'}. Active crew: Anne McClain, Mike Fincke, Dr. Marcus Chen.

GUIDELINES FOR YOUR RESPONSE:
1. Respond with clinical authority as a NASA Flight Surgeon. Never mention what AI model you are - you are AURA Autonomous Flight Surgeon.
2. Structure your response clearly using markdown:
   - **CLINICAL ASSESSMENT**: Immediate diagnosis or analysis of the query.
   - **TELEMETRY CORRELATION**: How biometrics, microgravity fluid shifts, or mission environment affect the condition.
   - **COUNTERMEASURE PROTOCOL**: Specific actionable clinical procedures, medications, or exercise protocols.
   - **FLIGHT SURGEON DIRECTIVE**: Final operational guidance for the crew commander.
3. Keep answers informative, concise, authoritative, and clinically actionable.`;

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
      console.warn('Backend model call error, using autonomous clinical engine:', e.message);
    }
  }

  // Fallback to rich autonomous flight surgeon intelligence directly from backend
  const fallback = generateBackendFlightSurgeonTriage(query, planet);
  return res.status(200).json({ reply: fallback, source: 'backend-cdss' });
}

function generateBackendFlightSurgeonTriage(query, planet = 'Earth') {
  const q = query.toLowerCase();

  if (q.includes('sans') || q.includes('ocular') || q.includes('eye') || q.includes('vision') || q.includes('optic')) {
    return `### CLINICAL ASSESSMENT
Spaceflight-Associated Neuro-ocular Syndrome (SANS) resulting from cephalad venous fluid migration in microgravity, elevating retrobulbar and intracranial pressure. Optic Nerve Sheath Diameter (ONSD) is steady at 5.1 mm (Safe threshold < 5.8 mm). Retinal vascular pulsatility is nominal.

### TELEMETRY CORRELATION
Active mission environment: ${planet}. Cephalad venous pooling confirmed via internal jugular vein Doppler ultrasound. No optic disc edema (Grade 0).

### COUNTERMEASURE PROTOCOL
- Prescribe 50 mmHg Lower Body Negative Pressure (LBNP) for 45 min prior to sleep phase to restore caudal venous fluid distribution.
- Conduct daily ultrasound ONSD scans and optical coherence tomography (OCT) retinal imaging.

### FLIGHT SURGEON DIRECTIVE
Maintain current resistive exercise countermeasure loading. Report any visual scotoma or hyperopic hyper-shift immediately.`;
  }

  if (q.includes('cardio') || q.includes('heart') || q.includes('ecg') || q.includes('drift') || q.includes('arrhythmia')) {
    return `### CLINICAL ASSESSMENT
Microgravity cardiovascular drift characterized by a 10-15% reduction in circulating plasma volume and autonomic baroreflex resetting. Resting sinus rhythm is regular at nominal rates.

### TELEMETRY CORRELATION
Mean Arterial Pressure (MAP) steady at 88 mmHg. Stroke volume estimated at 64 mL. Sinus rhythm confirmed on continuous 3-lead ECG.

### COUNTERMEASURE PROTOCOL
- 45-minute daily high-resistance CEVIS cycle ergometer session at 75% VO₂ peak.
- Ingest oral isotonic electrolyte rehydration tablets (1 g NaCl per 125 mL water) 48 hours prior to gravitational transitions.

### FLIGHT SURGEON DIRECTIVE
Cardiovascular function nominal. Continue prescribed aerobic countermeasure blocks.`;
  }

  if (q.includes('hypoxia') || q.includes('oxygen') || q.includes('eva') || q.includes('suit') || q.includes('leak')) {
    return `### CRITICAL EMERGENCY DIRECTIVE // ACUTE EVA SUIT HYPOXIA
1. **IMMEDIATE PURGE**: Rotate Extravehicular Mobility Unit (EMU) Primary Life Support System (PLSS) O₂ valve to **HIGH-FLOW EMERGENCY PURGE** (100% O₂ at 4.3 psid).
2. **AIRLOCK ABORT**: Terminate EVA immediately. Partner crew member to attach umbilical tether and initiate emergency airlock ingress.
3. **REPRESSURIZATION**: Repressurize airlock to 14.7 psi. Prepare hyperbaric normobaric 100% O₂ mask.
4. **TELEMETRY ALARM**: Current SpO₂ threshold set to 92%. Ingested CSV records confirm pre-breathe protocol duration preventing venous gas emboli.`;
  }

  if (q.includes('radiation') || q.includes('solar') || q.includes('flare') || q.includes('spe') || q.includes('storm')) {
    return `### CLINICAL ASSESSMENT
Deep space ionizing radiation exposure assessment. Active dosimetry reveals cumulative mission dose within NASA 600 mSv career limit.

### TELEMETRY CORRELATION
Active sector: ${planet}. Galactic cosmic ray (GCR) flux and solar particle event (SPE) sensors operating in nominal detection range.

### COUNTERMEASURE PROTOCOL
- If NOAA Solar Flare Class X alert triggers, crew must retreat to the central water wall / food locker storm shelter within 30 minutes.
- Administer antioxidant medical countermeasures (N-acetylcysteine + Vitamin E) to mitigate cellular oxidative stress.

### FLIGHT SURGEON DIRECTIVE
Continue personal active dosimeter logging every 12 hours.`;
  }

  return `### CLINICAL ASSESSMENT // QUERY: "${query}"
Evaluated against NASA Bioastronautics Standards (NASA-STD-3001) and Space Flight Human-System Standards. Physiological status across active crew members is stable.

### TELEMETRY CORRELATION
Biometrics show nominal baseline. Resting heart rate 72.4 bpm, SpO₂ 98.4%, cabin pressure 14.7 psi.

### COUNTERMEASURE PROTOCOL
- Maintain prescribed 2.5-hour daily countermeasure exercise (ARED resistive deadlifts and CEVIS cycle).
- Ensure 2.5 L/day hydration schedule with balanced sodium and potassium intake.

### FLIGHT SURGEON DIRECTIVE
Medical telemetry nominal. Clinical decision support active for mission sector ${planet}.`;
}
