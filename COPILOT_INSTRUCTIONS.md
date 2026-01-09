# AI Debate Arena - Instrukcje dla Copilota

## 📋 Stan projektu

### ✅ Co zostało zrobione

1. **Scaffold projektu Vite + React + TypeScript** - `npm create vite@latest`
2. **Zainstalowane zależności**:
   - `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `three`
   - `@react-spring/three`, `framer-motion`
   - `zustand`
   - `express`, `cors`, `dotenv`
   - `ai`, `@ai-sdk/openai`
   - DevDeps: `@types/three`, `@types/express`, `@types/cors`, `tsx`, `concurrently`
3. **Tailwind CSS** - zainstalowany i skonfigurowany

### ❌ Co pozostało do zrobienia

Wszystkie pliki kodu muszą zostać utworzone:

#### Struktura do utworzenia:

```
src/
├── components/
│   ├── canvas/
│   │   ├── Scene.tsx           # R3F Canvas + Bloom postprocessing
│   │   ├── RoundTable.tsx      # 3D stół (cylinder) + grid floor
│   │   ├── AgentAvatar.tsx     # Sfera agenta z glow, label, pulsowanie
│   │   ├── Particles.tsx       # Stars/particles w tle
│   │   └── Environment.tsx     # Lights + ambient
│   ├── chat/
│   │   ├── ChatPanel.tsx       # Glassmorphism panel z wiadomościami
│   │   ├── MessageBubble.tsx   # Pojedyncza wiadomość z typing effect
│   │   └── TypingIndicator.tsx # Animowane kropki podczas pisania
│   └── ui/
│       ├── TopicInput.tsx      # Input na temat debaty
│       ├── ControlButtons.tsx  # Start/Pause/Reset buttons
│       └── Header.tsx          # Logo + title
├── hooks/
│   ├── useDebate.ts            # Główna logika debaty + losowanie mówcy
│   └── useStreamingResponse.ts # SSE streaming z backendu
├── stores/
│   └── debateStore.ts          # Zustand store (messages, activeAgent, status)
├── lib/
│   ├── agents.ts               # Config 4 agentów (id, name, color, model, persona)
│   └── api.ts                  # Fetch helper do /api/chat
├── styles/
│   └── globals.css             # Tailwind + custom neon/glow styles
├── App.tsx                     # Główny layout (Scene + ChatPanel)
└── main.tsx                    # Entry point

server/
└── index.ts                    # Express server z /api/chat (proxy do GitHub Models)
```

---

## 🎨 Wymagania wizualne

### Theme: Dark + Neon + Glassmorphism

1. **Tło**: Bardzo ciemne (#0a0a0f) z subtletnym gridem
2. **Particles**: Wolno unoszące się cząstki (Stars z drei)
3. **Stół**: Metaliczny cylinder z emissive edge
4. **Agenci**: 4 kolorowe sfery rozmieszczone w okręgu:
   - 🔵 Niebieski (#3b82f6) - pozycja: góra
   - 🟣 Fioletowy (#a855f7) - pozycja: lewo
   - 🟢 Zielony (#22c55e) - pozycja: prawo  
   - 🔴 Czerwony (#ef4444) - pozycja: dół
5. **Aktywny mówca**: 
   - Bloom glow (SelectiveBloom)
   - Pulsująca animacja scale (react-spring)
   - Unosi się wyżej (position.y animated)
6. **Chat panel**: Glassmorphism (backdrop-blur-xl, border gradient, bg-white/5)
7. **Message bubbles**: Border w kolorze agenta, typing effect na streamingu
8. **Buttons**: Neon glow on hover

---

## 🔧 Konfiguracja agentów

```typescript
// src/lib/agents.ts
export const agents = [
  {
    id: 'optimist',
    name: 'OPTYMISTA',
    color: '#3b82f6',
    model: 'gpt-4o', // do zmiany później
    persona: 'Widzisz pozytywne strony każdego argumentu. Szukasz szans i możliwości. Jesteś entuzjastyczny ale merytoryczny.'
  },
  {
    id: 'skeptic', 
    name: 'SCEPTYK',
    color: '#a855f7',
    model: 'claude-3-5-sonnet',
    persona: 'Kwestionujesz założenia. Szukasz słabości w argumentach. Grasz adwokata diabła.'
  },
  {
    id: 'pragmatist',
    name: 'PRAGMATYK', 
    color: '#22c55e',
    model: 'meta-llama-3.1-70b-instruct',
    persona: 'Skupiasz się na praktycznych aspektach. Pytasz "jak to zrealizować?". Cenisz wykonalność.'
  },
  {
    id: 'visionary',
    name: 'WIZJONER',
    color: '#ef4444', 
    model: 'deepseek-r1',
    persona: 'Myślisz długoterminowo. Widzisz szerszy kontekst. Łączysz różne perspektywy.'
  }
]
```

---

## 🎮 Logika debaty

```typescript
// src/hooks/useDebate.ts - pseudokod

1. User wpisuje temat i klika "Start Debate"
2. Losuj pierwszego agenta (Math.random)
3. Wyślij request do /api/chat z:
   - model: agent.model
   - systemPrompt: agent.persona + "Debata na temat: {topic}"
   - messages: historia debaty
4. Streamuj odpowiedź i wyświetlaj w ChatPanel
5. Po zakończeniu odpowiedzi:
   - Dodaj do historii
   - Losuj następnego agenta (wykluczając poprzedniego)
   - Powtórz od kroku 3
6. Zatrzymaj po N rundach lub gdy user kliknie Pause
```

### Losowanie następnego mówcy:
```typescript
const selectNextSpeaker = (agents: Agent[], lastSpeakerId: string) => {
  const available = agents.filter(a => a.id !== lastSpeakerId)
  return available[Math.floor(Math.random() * available.length)]
}
```

---

## 🖥️ Backend (Express)

```typescript
// server/index.ts

- Port: 3001
- CORS: allow localhost:5173 (Vite dev)
- Endpoint: POST /api/chat
- Body: { model, messages, systemPrompt }
- Response: SSE stream (text/event-stream)
- Używa: @ai-sdk/openai z baseURL GitHub Models
```

### GitHub Models endpoint:
```typescript
const github = createOpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN
})
```

---

## 📝 package.json scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "vite",
    "dev:backend": "tsx watch server/index.ts",
    "build": "tsc && vite build"
  }
}
```

---

## 🔑 Zmienne środowiskowe

```env
# .env.local
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

Token GitHub musi mieć uprawnienie `models:read`.

---

## 🚀 Uruchomienie

```bash
cd ~/repos/_poc/ai-debate
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

---

## 📌 Notatki

- Na początek można użyć MOCK responses zamiast prawdziwych API calls (dla testowania UI)
- Modele do zmiany później przez usera
- Debata: ~10 wypowiedzi domyślnie, można dodać slider
- OrbitControls pozwala obracać scenę 3D myszką
