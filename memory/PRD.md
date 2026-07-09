# Soterion — DeFi Lending & Borrowing on Stellar

## Problem Statement (original)
Build a DeFi lending and borrowing platform named Soterion on the Stellar blockchain using the FARM stack. The core feature is an AI-powered automation engine that monitors user health factors via Soroban smart contracts. Implement a background worker that triggers a partial liquidation function automatically when the health factor reaches a specific threshold (trigger point). The UI should display real-time data from the Stellar network, including supply/borrow rates, and clearly show the automation status and trigger points for each user's position.

## User choices (Jan 2026 kickoff)
- **Stellar integration**: Simulated lending pool + real Stellar Horizon testnet/mainnet price feed for XLM/USDC.
- **AI engine**: LLM-powered risk insights (Emergent LLM key → Claude Sonnet 4.6) + deterministic rule-based liquidation triggers.
- **Auth**: Wallet-connect only (mock Stellar-style address `G...`).
- **Design**: Dark cyber finance aesthetic — obsidian bg, steel-blue / terminal-green / amber accents, JetBrains Mono for data, Instrument Sans for UI.
- **Supported assets**: XLM, USDC, AQUA, yXLM.

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`) exposing `/api/*`. Motor for MongoDB. `emergentintegrations` for LLM. In-memory market state; user positions & activity/liquidation history in MongoDB. Background asyncio task `automation_worker()` runs every 6s.
- **Frontend**: React 19 + Tailwind, Framer Motion, Recharts, Sonner toasts. Components under `/app/frontend/src/components/`.
- **Env**: `EMERGENT_LLM_KEY` in `/app/backend/.env`. Frontend reads `REACT_APP_BACKEND_URL`.

## Implemented (2026-01)
- Real-time markets endpoint with price history (30 pt sparklines) & drifting prices; fetches real XLM/USDC close from Stellar Horizon every 30s.
- Wallet connect (cryptographic mock Stellar-style G-address via `secrets`), position endpoint with per-asset supplied/borrowed/balances.
- Full lifecycle: `/api/supply`, `/api/withdraw`, `/api/borrow`, `/api/repay` with LTV / liquidation-threshold / HF checks.
- Health-factor formula: HF = Σ(collateral × liq_threshold) / Σ(debt).
- Automation config endpoint (`/api/automation/config`) with `enabled`, `trigger_hf`, `max_liquidation_pct`.
- Background worker: monitors every user with automation enabled, executes partial liquidation on largest debt vs. largest collateral with liquidation bonus, writes to `db.liquidations` and `db.activity`.
- **Continuous compound interest accrual** — supplied balances grow at `supply_apy`, borrowed at `borrow_apy` using A = P·eʳᵗ, applied every 6s worker tick and on every read/tx. Cumulative `interest_earned` / `interest_paid` tracked per asset and exposed on the position endpoint + UI.
- AI Risk Insights endpoint using Emergent LLM key + Claude Sonnet 4.6 with structured 4-section output.
- Frontend landing page (hero + terminal preview + features + live markets).
- Dashboard: dramatic radial HF gauge with color zones + trigger marker, MarketsTable with fixed-size sparklines (no Recharts console warnings), PositionSummary with per-asset accrual indicators, AutomationPanel, AIInsight terminal panel, ActivityLog, LiquidationHistory, TxModal.
- 100% backend test pass (15/15), frontend flows verified.

## Tech decisions
- No Rust/Soroban contract deployment — pool logic simulated in Python for demo velocity while UI stays production-shaped.
- LLM streaming used inside endpoint but response is aggregated (client renders as terminal narrative).

## Backlog / next tasks
- **P1** Multi-user matching engine + interest accrual over time (currently APYs displayed, not compounded per position).
- **P1** Reduce Recharts console warnings by setting `minWidth/minHeight` on ResponsiveContainer.
- **P2** Real Freighter wallet integration + signature verification (currently mock address).
- **P2** Deploy actual Soroban contract stub + call via Stellar SDK for supply/borrow/liquidate.
- **P2** Price alerts + email/telegram notifications on liquidation events.
- **P3** Public leaderboard of at-risk positions (protocol health dashboard).
- **P3** LLM-generated liquidation post-mortems with market context.

## Files of note
- Backend routes & worker: `/app/backend/server.py`
- Frontend entry: `/app/frontend/src/App.js`
- Health gauge: `/app/frontend/src/components/HealthGauge.jsx`
- Backend tests: `/app/backend/tests/backend_test.py` (added by testing agent)
- Design spec: `/app/design_guidelines.json`
