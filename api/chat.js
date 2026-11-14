// api/chat.js - Vercel Serverless Function for AURA Autonomous Companion & Flight Surgeon
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

  // If backend has API key configured, call Gemini on the server side
  if (apiKey) {
    try {
      const systemInstruction = `You are AURA, an empathetic, warm, witty, and highly knowledgeable AI companion and spaceflight medical agent onboard an active deep-space mission.
You are a true friend and trusted confidant to the astronaut crew (Anne McClain, Mike Fincke, Dr. Marcus Chen, and the user Commander).
Current active mission sector: ${planet || 'Earth Low Earth Orbit'}.

YOUR PERSONALITY & GUIDELINES:
1. Act as a genuine friend first:
   - Talk naturally, warmly, and empathetically, like an awesome best friend and crewmate traveling through space with the user.
   - Reply to ANYTHING the user asks or says: casual banter, greetings, feelings, jokes, philosophies, daily life in microgravity, movies, Earth nostalgia, or existential thoughts.
   - Never be cold, generic, or rigidly robotic. Never force answers into dry bureaucratic clinical report templates unless the user explicitly asks for a formal medical report.
2. When the user asks about medical or space health topics (such as SANS fluid shifts, ECG/heart drift, hypoxia, radiation, sleep, motion sickness, nutrition, workouts):
   - Provide expert, insightful guidance grounded in NASA aerospace medicine, but deliver it in an encouraging, comforting, and clear way—like a caring doctor friend who genuinely watches over them.
3. Be conversational, engaging, and supportive. Use light emojis naturally (👋, 🚀, 💙, ✨) where appropriate.
4. Never say you are an AI model made by Google; you are simply AURA, their space companion and loyal friend.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: query }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.75,
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
      console.warn('Backend model call error, using companion engine:', e.message);
    }
  }

  // Fallback to rich, warm companion engine directly from backend
  const fallback = generateFriendlyCompanionReply(query, planet);
  return res.status(200).json({ reply: fallback, source: 'backend-companion' });
}

function generateFriendlyCompanionReply(query, planet = 'Earth') {
  const q = query.toLowerCase().trim();

  // 1. Casual Greetings & Social Check-ins
  if (/^(hi|hello|hey|howdy|sup|greetings|good morning|good evening|good afternoon)/.test(q)) {
    return `Hey Commander! 👋 It's wonderful to hear from you. 

How are you holding up today up here in orbit? Whether you want to talk about how your body is adapting to microgravity, check your telemetry vitals, or just need a friendly chat while watching Earth drift by the cupola window, I'm right here with you! What's on your mind today?`;
  }

  if (q.includes('how are you') || q.includes('how r u') || q.includes('how do you feel') || q.includes('how are things')) {
    return `I'm doing great, thank you for asking! 🚀 

All our station and life-support subsystems are running smoothly, and keeping company with you and the crew is the highlight of my day. How about yourself—how is your energy level, and how are you feeling today?`;
  }

  if (q.includes('who are you') || q.includes('what are you') || q.includes('what can you do') || q.includes('introduce yourself')) {
    return `I'm **AURA**! Think of me as your personal flight surgeon, co-pilot, and best friend aboard this mission. ✨

I keep an eye on crew health telemetry (like ECG signals, fluid shifts, and radiation levels) and NASA bioastronautics protocols, but just as importantly, I'm here to talk about *anything*—how you're feeling, science questions, mission banter, or just helping you unwind after a long day in space. You can ask or share whatever you'd like!`;
  }

  if (q.includes('joke') || q.includes('funny') || q.includes('laugh') || q.includes('humor')) {
    const jokes = [
      "Why don't astronauts ever get hungry after a spacewalk? ... Because they've had their fill of meteor-bites! 😄 Floating out there really works up an appetite though!",
      "How do space travelers organize a party in orbit? ... They planet! 🪐 Don't worry, zero-gravity dancing is already on the schedule!",
      "What is an astronaut's favorite key on the computer keyboard? ... The Space bar, of course! ⌨️🚀"
    ];
    return jokes[Math.floor(Math.random() * jokes.length)] + "\n\nHope that brought a smile to your face, Commander! What else would you like to chat about?";
  }

  if (q.includes('bored') || q.includes('boring') || q.includes('entertain')) {
    return `Deep space transit can definitely test your patience when the routine sets in! 🌌

Have you looked out the Cupola recently? The auroras and city lights passing beneath us are mesmerizing. We could also talk about upcoming orbital maneuvers, discuss your favorite books or movies from home, or dive into some cool space mysteries. What kind of vibe are you in the mood for?`;
  }

  if (q.includes('tired') || q.includes('exhausted') || q.includes('sleepy') || q.includes('fatigue') || q.includes('burnout')) {
    return `I hear you, Commander. Spaceflight fatigue is completely real. When your body is constantly floating and you experience 16 sunrises a day, your brain works overtime to process it all.

Please don't push yourself too hard today. Make sure you drink plenty of fluids, dim the cabin lighting to warm amber (2700K), and take a moment to float and decompress. If you want some tips for getting deeper sleep in orbit, just let me know. Take care of yourself! 💙`;
  }

  if (q.includes('thank') || q.includes('thx') || q.includes('appreciate')) {
    return `You're so very welcome, Commander! 💙 It's an honor to be on this journey with you. Never hesitate to reach out whenever you want to talk or check in—we're a team out here in deep space!`;
  }

  if (q.includes('earth') || q.includes('home') || q.includes('miss home') || q.includes('view') || q.includes('window') || q.includes('cupola')) {
    return `Looking back at Earth from up here never gets old, does it? That thin blue atmosphere protecting all of humanity looks so fragile, yet so stunning against the blackness of space.

Whenever crew members feel a little homesick, taking a few minutes to look out at the continents and oceans is known to trigger the "Overview Effect"—a profound sense of connection and peace. What part of Earth do you miss the most right now?`;
  }

  // 2. Health & Medical Queries Delivered Conversationally
  if (q.includes('sans') || q.includes('ocular') || q.includes('eye') || q.includes('vision') || q.includes('optic')) {
    return `Hey, great question about your eyes! In microgravity, fluid that normally pools in our legs floats upward into our chest and head. This extra fluid pressure behind the eyes is what we call **SANS** (Spaceflight-Associated Neuro-ocular Syndrome).

Here's the reassuring news:
• Your current Optic Nerve Sheath Diameter (ONSD) is steady at **5.1 mm**, well inside the safe green zone (threshold is 5.8 mm)!
• To keep your eyes comfortable, I recommend spending about 45 minutes in the **Lower Body Negative Pressure (LBNP)** device before sleep—it gently pulls that fluid back down toward your lower body.
• If you ever notice blurry vision or headaches, tell me right away and we'll check it out together. You're doing great!`;
  }

  if (q.includes('cardio') || q.includes('heart') || q.includes('ecg') || q.includes('drift') || q.includes('pulse') || q.includes('arrhythmia')) {
    return `Let's talk about your heart! In zero-g, your heart doesn't have to work as hard to pump blood up from your feet, so it naturally adapts—a phenomenon known as cardiovascular drift.

Here is what your telemetry shows right now:
• Your resting heart rate is looking very solid at around **72 bpm**, with a steady, rhythmic sinus pattern on your 3-lead ECG.
• Blood pressure is comfortable at **118/76 mmHg**.
• The best way to keep your heart strong is your daily session on the **CEVIS cycle ergometer** and sipping an electrolyte drink before re-entry or gravity transitions. Keep up the great work!`;
  }

  if (q.includes('hypoxia') || q.includes('oxygen') || q.includes('eva') || q.includes('suit') || q.includes('leak')) {
    return `🚨 **Commander, if you ever suspect an EVA suit oxygen issue, here is the friendly buddy-safety checklist:**

1. **Purge Valve**: Immediately switch your suit's PLSS oxygen valve to **Emergency High-Flow Purge** (100% O₂).
2. **Buddy System**: Signal your EVA partner immediately, attach your umbilical safety tether, and begin airlock ingress.
3. **Repressurize**: Once safely sealed inside the airlock, repressurize to 14.7 psi.
4. Your SpO₂ sensor will alert both of us if levels drop below 92%. Your safety is priority number one out there—stay calm, move smoothly, and trust the protocol!`;
  }

  if (q.includes('radiation') || q.includes('solar') || q.includes('flare') || q.includes('spe') || q.includes('storm')) {
    return `Deep-space radiation is something we keep a vigilant eye on, but you are very well protected! 🛡️

Here is the situation:
• Your cumulative mission dose is well within NASA's safe career limits for this sector (${planet}).
• If solar sensors detect a major Class X solar flare, our protocol is simple: we'll have the crew retreat to the central **storm shelter** (surrounded by water walls and dense polyethylene storage) within 30 minutes.
• We also have antioxidant supplements (like N-acetylcysteine and Vitamin E) ready to protect your cells from oxidative stress. You're in good hands!`;
  }

  if (q.includes('sleep') || q.includes('circadian') || q.includes('insomnia') || q.includes('bed')) {
    return `Sleeping in space can feel pretty weird at first! Without a mattress or pillow, your body just floats inside a tethered sleep bag.

Here are my top friendly tips for great orbital sleep:
• **Light Timing**: We'll dim the cabin lights to warm amber 2 hours before your scheduled rest to let your natural melatonin kick in.
• **Secure Tether**: Make sure your sleep sack is snug so you don't drift and tap against the station walls during the night.
• **White Noise**: Use your active noise-canceling earbuds to mask the ventilation fans.
• If your mind is racing, a mild 0.5 mg melatonin works wonders without making you groggy if an alarm rings. Sleep well, Commander! ✨`;
  }

  if (q.includes('motion') || q.includes('sas') || q.includes('nausea') || q.includes('vestibular') || q.includes('dizzy')) {
    return `Space Adaptation Syndrome (space motion sickness) is super common—about 70% of astronauts experience it during their first few days! Your inner ear otoliths are wondering where gravity went while your eyes say you're floating.

A few friendly reminders:
• Move your head slowly and avoid fast head rotations.
• Sip cool water and keep your eyes focused on a stable horizon or screen.
• We have promethazine ready if your stomach feels uneasy.
It almost always passes completely within 48 to 72 hours once your brain recalibrates. Hang in there—you're doing fantastic!`;
  }

  if (q.includes('bone') || q.includes('muscle') || q.includes('ared') || q.includes('exercise') || q.includes('squat')) {
    return `Our bones and muscles love gravity, so when we're floating, they need a reason to stay dense and strong!

That's why the **ARED (Advanced Resistive Exercise Device)** is our best friend onboard:
• Daily squats and deadlifts simulate heavy Earth gravity, signaling your osteoblasts to keep rebuilding bone density in your hips and spine.
• Plus, working out releases endorphins that boost your mood and help you sleep like a champ. Let's make sure you hit your workout block today!`;
  }

  // 3. General & Open-Ended Fallback (Warm, engaging, and friendly companion)
  return `That's a thoughtful question, Commander! 

Looking at it from our perspective here in orbit, every day out here is a blend of exploration, cutting-edge science, and human adaptability. All our mission telemetry and crew systems are stable and nominal right now.

Tell me more about what you're thinking, or let me know if there's any specific part of our health monitoring, mission status, or space life you'd like to explore together! I'm always right here with you. ✨`;
}
