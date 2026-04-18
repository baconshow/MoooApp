# MoooApp — Personal Wellness & AI Companion

[![Next.js](https://img.shields.io/badge/Next.js-15.2-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-11.9-FFCA28.svg?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Genkit](https://img.shields.io/badge/Genkit-1.14-4285F4.svg?logo=google&logoColor=white)](https://firebase.google.com/docs/genkit)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A full-stack wellness application featuring an AI-powered companion, health tracking (with endometriosis symptom support), financial management, and emotional well-being tools — all wrapped in a premium Claymorphism UI.

---

## Features

**AI Companion (Kook)** — A context-aware conversational agent built on Google Genkit + Gemini, with function-calling capabilities to read user data from Firestore and provide personalized wellness advice.

**Health & Wellness (Vibe)** — Mood tracking with an emotion picker based on Plutchik's Wheel of Emotions, menstrual cycle mandala visualization, pain diary with body map, sleep tracker with guided meditation, and relaxing soundscapes.

**Nutrition (Rango)** — AI-powered food photo analysis via Gemini Vision, macro/calorie tracking with radar charts, meal history, and personalized meal suggestions.

**Financial Management (Grana)** — Income/expense tracking, savings goals, loan calculator, and transaction history with filtering.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, SSR) |
| **Language** | TypeScript |
| **UI** | Tailwind CSS + shadcn/ui + Framer Motion |
| **AI** | Google Genkit + Gemini 2.0 Flash |
| **Backend** | Firebase (Firestore, Auth, App Hosting) |
| **Charts** | Recharts |
| **3D** | Three.js (Emotional Galaxy visualizer) |
| **Audio** | Tone.js (relaxing sounds & meditation) |
| **PWA** | Service Worker + Web App Manifest |

---

## Architecture

```
src/
├── ai/                     # AI layer
│   ├── flows/              # Genkit flows (food analysis, meal suggestions, Kook agent)
│   ├── tools/              # Function-calling tools (Firestore data access)
│   └── genkit.ts           # Genkit instance config
├── app/(screens)/          # Route groups
│   ├── dashboard/          # Main dashboard
│   ├── vibe/               # Health & wellness (mood, sleep, pain, cycle)
│   ├── rango/              # Nutrition (analyze, history, suggestions)
│   ├── grana/              # Finance (add, history, goals, loans)
│   └── home/               # Home hub with onboarding
├── components/
│   ├── feature/            # Domain components (charts, mandala, chat, canvas)
│   └── ui/                 # shadcn/ui primitives
├── context/                # Auth & theme providers
├── hooks/                  # Custom hooks (daily-log, transactions, dory-state)
└── lib/                    # Firebase config, utilities, static data
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore + Auth enabled
- Google AI API key (Gemini)

### Setup

```bash
git clone https://github.com/baconshow/MoooApp.git
cd MoooApp
npm install
```

Create a `.env.local` file:

```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Development

```bash
# Start the Next.js dev server
npm run dev

# Start the Genkit AI server (separate terminal)
npm run genkit:dev
```

Open http://localhost:9002 in your browser.

### Build & Deploy

```bash
npm run build
```

The app is configured for Firebase App Hosting via `apphosting.yaml`. Push to `main` to trigger automatic deployment.

---

## Design Philosophy

The UI follows a **Claymorphism** design language — soft, puffy elements with large border radius (16-20px), layered shadows, and animated gradient borders. The dark theme uses deep purples and frosted-glass effects, while the light theme shifts to warm rose and gold tones.

Micro-interactions include confetti bursts on task completion, smooth page transitions via Framer Motion, and ambient background particles.

---

## License

MIT
