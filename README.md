# The Nexus (Next-Gen Alumni Operating System)

Building an elite, global, AI-driven private network for universities. 

Most alumni platforms fail because they are glorified directories with zero daily utility. **The Nexus** flips this model. We are building a platform that provides massive, immediate ROI to alumni wherever they are in the world, combining the exclusivity of Raya with the venture potential of AngelList, all powered by an intelligent AI Copilot.

## CORE PHILOSOPHY

Alumni are global, busy, and seek ROI. The engine is: 
**Proactive AI Networking** → **High-Value Exclusivity** → **Real Wealth & Value Creation** (ventures, masterclasses, precise mentorship).

## TECH STACK

- React + Vite + TypeScript
- Tailwind CSS (Clean, premium, Stripe-like aesthetic. Minimalist dark mode by default.)
- Supabase (Auth, Postgres, Storage)
- React Router

## THE "WOW FACTOR" CORE FEATURES

### 1. The Neural Matchmaker (Proactive AI Networking)
The platform's AI agent constantly scans the global network and proactively introduces people. 
* *Example:* "You just moved to Dubai. There are 14 alumni here in Fintech. I've drafted an intro to 3 of them who are also hiring. Tap to send."

### 2. Global "Embassies" & Geofenced Drops
When an alum lands in a new city (e.g., London), they get a push notification: "Welcome to London. 432 alumni live here. Tap to unlock the London Alumni City Guide and see who is grabbing coffee in Soho right now."

### 3. The Alumni Venture Syndicate
Allow successful alumni to invest directly into student or recent-grad startups. Equity Pledges allow founders to 1-click pledge 1% of their startup's future exit back to the university, redefining "giving back".

### 4. Flash Masterclasses (High-Status Mentorship)
Protect high-value alumni by having them host exclusive "Flash Masterclasses" or AMAs (e.g., "How I scaled Stripe to $1B"). Access is tokenized based on a user's "Giveback Score".

### 5. Lifelong AI Career Copilot
An embedded AI trained on the university's network. "Hey Copilot, I have an interview at Google. Who can I talk to?" Copilot analyzes past interview questions and sets up mock interviews with alumni.

## USER ROLES

1. **Alumni** — The core users experiencing the value of the network.
2. **Students** — Limited access: attend masterclasses, apply for syndicate funding, get AI copilot advice.
3. **Admin (university staff)** — Command center to view macro analytics, wealth generation, and engagement, but largely hands-off as the AI manages the community.

## DESIGN & UI/UX

- Extreme minimalism, dark mode by default, glassmorphism.
- Fluid page transitions, glowing borders on elite profiles.
- Mobile-First Native Feel.
- Zero friction onboarding (LinkedIn OAuth).

## DATABASE (Supabase tables)

- `profiles` (user info, role, verification status, location, giveback_score)
- `neural_matches` (AI generated match suggestions)
- `masterclasses` (exclusive events hosted by elite alumni)
- `syndicate_ventures` (startups raising funds)
- `embassies` (geofenced city hubs)

---

## Build with Lovable

This project is connected to [Lovable](https://lovable.dev/projects/9268b0b5-202e-460d-aeaf-8f3c48f1e338).
- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.

> **DO NOT USE LOVABLE CLOUD.** Use the Supabase provided for full access.

## Development

```sh
npm i
npm run dev
```
