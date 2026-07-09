<div align="center">

<!-- LOGO — swap the src for the exported SVG once you have a public URL -->
<img src="./frontend/src/components/SoterionLogo.jsx" alt="Soterion logo" width="120" onerror="this.style.display='none'" />

# Soterion
### AI-Powered DeFi Lending & Borrowing on Stellar

<p>
  <img alt="stack" src="https://img.shields.io/badge/stack-FARM-3B82F6?style=flat-square" />
  <img alt="network" src="https://img.shields.io/badge/network-Stellar%20%C2%B7%20Soroban-22D3EE?style=flat-square" />
  <img alt="ai" src="https://img.shields.io/badge/AI-Claude%20Sonnet%204.6-A855F7?style=flat-square" />
  <img alt="status" src="https://img.shields.io/badge/status-preview-10B981?style=flat-square" />
</p>

*A next-generation DeFi protocol where an on-chain AI safety guard watches your position 24/7 and executes a partial liquidation the moment your health factor crosses your custom trigger — so the pool never has to touch you.*

</div>

---

## 🛡️ Why Soterion

Traditional DeFi lending platforms are reactive: your loan is either safe or already liquidated. Once your health factor drops below `1.0`, the entire protocol raids your collateral at a punitive discount — often 8–15% — with no chance to intervene.

**Soterion flips that model.** Users define their own *safety trigger* above the liquidation floor (e.g. `HF ≤ 1.20`). A background automation worker polls every position every six seconds, and the moment your HF touches your trigger, it performs a **partial liquidation on your own terms** — repaying just enough debt to restore a healthy HF, while an LLM-powered risk analyst produces a plain-English narrative of what happened and what to do next.

The result: **less pool exposure, smaller drawdowns, no midnight surprises.**

---

## ✨ Key Features

### 🤖 AI Safety Guard
- **Rule-based, deterministic partial-liquidation engine** running as an asyncio background worker (`automation_worker()` in `backend/server.py`).
- **Per-user safety trigger** (`trigger_hf`) + configurable maximum cut (`max_liquidation_pct`, default 35%).
- **LLM-powered risk analyst** (Claude Sonnet 4.6 via the Emergent LLM key) that produces a four-section narrative on demand: `RISK LEVEL / KEY SIGNAL / RECOMMENDATION / MARKET NOTE`.
- Every trigger is logged to `db.liquidations` and the user's activity feed with the exact reason, assets moved, and liquidation bonus applied.

### 🎨 Futuristic Framer Motion UI
- **Cursor-following parallax backdrop** — a fixed layer of Soterion shields and asset marks that drift with the pointer using `useMotionValue` + `useSpring` for genuine 3D depth.
- **Glassmorphism dashboard cards** with mask-composite gradient borders and layered backdrop-blur.
- **Prominent glowing status indicators** for Health Factor zones (`HEALTHY / WARNING / DANGER / LIQUIDATABLE / NO DEBT`) and automation state (`ACTIVE / PAUSED`).
- **Custom SVG logo system** — a hexagonal shield fused with a digital "S" and a Stellar comet trail, drawn in a cyan → blue → violet neon gradient. On-brand SVG marks for each supported asset (XLM, USDC, AQUA, yXLM).
- **Live radial Health-Factor gauge** with color zones, animated needle, and a distinctive trigger tick.

### 🌌 Stellar / Soroban Integration
- **Live price feed from Stellar Horizon** — the XLM/USDC close is pulled every 30 seconds and cascades to the yXLM price.
- **Simulated Soroban lending pool** with production-shaped math: LTV, liquidation threshold, liquidation bonus, utilisation → APY curve.
- **Continuous compound interest accrual** (A = P · eʳᵗ) applied on every read and every worker tick — supplied balances earn `supply_apy`, borrowed grow at `borrow_apy`.
- **Wallet-connect abstraction** — cryptographically-random Stellar-style G-addresses via Python's `secrets` module (Freighter integration is one adapter away).

### 🔒 Security-Focused Defaults
- Every mutation is HF-checked *before* commit — withdraw/borrow that would push HF below 1.05 is rejected server-side.
- Transaction receipts include real-time APY, LTV, and liquidation-threshold breakdowns.
- Activity feed & Partial Liquidation History give a full auditable log of every automated action.

---

## 🧰 Tech Stack

| Layer      | Choice                                                      |
|-----------|--------------------------------------------------------------|
| Frontend  | **React 19**, Tailwind CSS, **Framer Motion**, Recharts, Sonner |
| Backend   | **FastAPI**, Motor (async MongoDB), `emergentintegrations`   |
| Database  | **MongoDB** (positions, activity, liquidation history)       |
| Blockchain| **Stellar Horizon** (real price feed) + simulated Soroban pool |
| AI        | Claude Sonnet 4.6 via Emergent Universal LLM Key             |
| Deployment| Emergent preview container (Kubernetes + supervisor)         |

The stack is a canonical **FARM** deployment (FastAPI + React + MongoDB) with `stellar-sdk`-style Horizon calls wired directly into the market-data worker.

---

## 📁 Repository Layout

```
/app
├── backend/
│   ├── server.py              # FastAPI app, routes, automation worker,
│   │                          # interest accrual, LLM risk analyst
│   ├── requirements.txt
│   └── .env                   # MONGO_URL, DB_NAME, EMERGENT_LLM_KEY
└── frontend/
    ├── src/
    │   ├── App.js             # Root orchestrator (dashboard vs landing)
    │   ├── hooks/
    │   │   └── useSoterionData.js   # Central data + action hook
    │   ├── components/
    │   │   ├── SoterionLogo.jsx     # Custom brand mark (SVG)
    │   │   ├── AssetLogos.jsx       # XLM / USDC / AQUA / yXLM SVGs
    │   │   ├── ParallaxBackdrop.jsx # Cursor-tracking parallax layer
    │   │   ├── HealthGauge.jsx      # Radial HF gauge
    │   │   ├── HFCard.jsx           # HF card with glowing status pill
    │   │   ├── AutomationPanel.jsx  # Toggle + trigger + max-cut sliders
    │   │   ├── AIInsight.jsx        # LLM risk narrative panel
    │   │   ├── PositionSummary.jsx  # Supplied / borrowed / interest
    │   │   ├── MarketsTable.jsx     # Live rates with sparklines
    │   │   ├── ActivityLog.jsx      # Terminal-styled feed
    │   │   ├── LiquidationHistory.jsx
    │   │   ├── TxModal.jsx          # Supply/withdraw/borrow/repay
    │   │   └── landing/             # Marketing page sections
    │   ├── App.css                  # .card-glass, .status-pill, neon
    │   └── index.css                # Grid backdrop, grain, base tokens
    └── .env                         # REACT_APP_BACKEND_URL
```

---

## 🚀 Getting Started

Soterion is designed to run inside the **Emergent preview container** — every service (FastAPI, MongoDB, React dev server) is already wired through supervisor.

### View the running app

The frontend is served at the URL in `frontend/.env` under `REACT_APP_BACKEND_URL`.

```bash
grep REACT_APP_BACKEND_URL /app/frontend/.env
# → https://<your-app-slug>.preview.emergentagent.com
```

Open that URL in your browser to see the dark-mode landing page. Click **Connect Freighter** to receive a fresh Stellar-style wallet, then start supplying and borrowing.

### Interact with the API

All routes are prefixed with `/api` and routed through the ingress to the FastAPI backend on port 8001.

```bash
API=$(grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d '=' -f2)

# List live markets
curl "$API/api/markets" | jq

# Create a wallet, supply collateral, borrow against it
WALLET=$(curl -s -X POST "$API/api/wallet/connect" -H 'content-type: application/json' -d '{}' \
  | jq -r .address)

curl -s -X POST "$API/api/supply"  -H 'content-type: application/json' \
  -d "{\"wallet\":\"$WALLET\",\"asset\":\"XLM\",\"amount\":2000}"

curl -s -X POST "$API/api/borrow"  -H 'content-type: application/json' \
  -d "{\"wallet\":\"$WALLET\",\"asset\":\"USDC\",\"amount\":100}"

# Enable the AI safety guard with a HF≤1.20 trigger and 35% max cut
curl -s -X POST "$API/api/automation/config" -H 'content-type: application/json' \
  -d "{\"wallet\":\"$WALLET\",\"enabled\":true,\"trigger_hf\":1.20,\"max_liquidation_pct\":0.35}"

# Ask the LLM analyst for a risk narrative on this position
curl -s -X POST "$API/api/ai/insight" -H 'content-type: application/json' \
  -d "{\"wallet\":\"$WALLET\"}" | jq -r .insight
```

### Restart services (only if you edit `.env` or add dependencies)

```bash
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

Hot reload handles regular code edits automatically.

---

## 🖼️ Visuals

> Replace these placeholders with your own screenshots or exports once ready.

### Custom Soterion Logo
<div align="center">

<!-- Rendered from /app/frontend/src/components/SoterionLogo.jsx -->
![Soterion logo placeholder](./docs/assets/soterion-logo.svg)

*Hexagonal shield fused with a stylised digital "S" and a Stellar comet trail. Neon cyan → blue → violet gradient with SVG glow filter.*

</div>

### Landing Page
![Soterion landing page placeholder](./docs/assets/screenshot-landing.png)
*Cursor-tracking parallax backdrop, glass cards, and gradient hero — a dark cyber-finance vibe without the AI-slop purple wash.*

### Dashboard
![Soterion dashboard placeholder](./docs/assets/screenshot-dashboard.png)
*Health-Factor radial gauge with color zones (centre-left), glowing HF status pill, automation engine card with trigger slider, glass markets table with SVG asset marks, and terminal-styled activity feed.*

### AI Safety Guard in Action
![Automation trigger placeholder](./docs/assets/screenshot-automation.png)
*Enable the guard, set your safety trigger, and watch the terminal-styled activity feed record every automated partial liquidation with the exact reason (`HF=1.147 ≤ trigger=1.150`) and assets moved.*

---

## 🧪 API Reference (Selected)

| Method | Route                          | Purpose                                                   |
|-------:|--------------------------------|-----------------------------------------------------------|
| `GET`  | `/api/markets`                 | Live rates, prices, sparkline history for all 4 assets    |
| `POST` | `/api/wallet/connect`          | Generate (or restore) a Stellar-style wallet              |
| `GET`  | `/api/position/{wallet}`       | Full position: HF, collateral, debt, interest accrued     |
| `POST` | `/api/supply`                  | Deposit collateral                                        |
| `POST` | `/api/withdraw`                | Remove collateral (HF-guarded)                            |
| `POST` | `/api/borrow`                  | Borrow against collateral (HF-guarded)                    |
| `POST` | `/api/repay`                   | Repay outstanding debt                                    |
| `POST` | `/api/automation/config`       | Toggle the AI Safety Guard + set trigger + max cut        |
| `GET`  | `/api/activity/{wallet}`       | Terminal-style feed of every action                       |
| `GET`  | `/api/liquidations/{wallet}`   | Full auditable history of auto-triggered partial liqs     |
| `POST` | `/api/ai/insight`              | Claude Sonnet 4.6 risk narrative for the current position |

---

## 🗺️ Roadmap

- [ ] **Real Freighter wallet integration** with signature verification (currently a cryptographic mock).
- [ ] **Deploy Soroban Rust contract** stub and swap the simulated pool for on-chain execution via `stellar-sdk`.
- [ ] **Interest-rate curve visualisation** (utilisation → APY chart).
- [ ] **Public "at-risk positions" leaderboard** — protocol-wide health view.
- [ ] **Telegram / email liquidation alerts.**
- [ ] **Interest-earned leaderboard** — passive growth loop.
- [ ] **LLM-generated post-mortems** for each liquidation with market context.

---

## 🔒 Security Notes

- Every mutating endpoint re-computes the health factor **inside a trial snapshot** before committing state.
- Withdraw and borrow are rejected server-side when the resulting HF would fall below `1.05` — the automation engine is a defence-in-depth layer, not the only guardrail.
- The automation worker runs *outside* the request path, so latency spikes on the API cannot delay a safety trigger.
- Wallet addresses are minted with `secrets.choice` — never `random`.
- No user secrets or LLM keys are ever sent to the browser: the frontend only sees API endpoints under `/api`.

---

## 📜 License

MIT — build on it, extend it, adapt it. If you ship something interesting on Stellar, we'd love to hear about it.

---

<div align="center">

**Soterion** — because your position deserves a guardian, not a graveyard.

<sub>Built on the FARM stack for Stellar · Soterion </sub>

</div>
