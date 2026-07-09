"""
Soterion — DeFi lending & borrowing platform on Stellar (simulated Soroban).
FastAPI backend with:
  • Simulated lending pool state for XLM, USDC, AQUA, yXLM
  • Real-time XLM price feed from Stellar Horizon testnet
  • Health-factor computation + AI automation engine (background worker)
  • Partial-liquidation logic triggered automatically at user-configured HF threshold
  • LLM-powered risk insights via Emergent LLM key (Claude Sonnet 4.6)
"""
from __future__ import annotations

import asyncio
import logging
import math
import os
import random
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, ConfigDict, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("soterion")

app = FastAPI(title="Soterion API")
api_router = APIRouter(prefix="/api")


# ─────────────────────────────────────────────────────────────────────
# In-memory market state (simulated Soroban lending pool)
# Real XLM price fed from Stellar Horizon testnet where possible.
# ─────────────────────────────────────────────────────────────────────
ASSETS: Dict[str, Dict[str, Any]] = {
    "XLM": {
        "symbol": "XLM",
        "name": "Stellar Lumens",
        "price": 0.1150,
        "ltv": 0.75,
        "liquidation_threshold": 0.80,
        "supply_apy": 3.42,
        "borrow_apy": 5.81,
        "total_supplied": 12_500_000.0,
        "total_borrowed": 6_820_000.0,
        "liquidation_bonus": 0.08,
    },
    "USDC": {
        "symbol": "USDC",
        "name": "USD Coin",
        "price": 1.0000,
        "ltv": 0.85,
        "liquidation_threshold": 0.88,
        "supply_apy": 4.15,
        "borrow_apy": 6.24,
        "total_supplied": 8_400_000.0,
        "total_borrowed": 5_100_000.0,
        "liquidation_bonus": 0.05,
    },
    "AQUA": {
        "symbol": "AQUA",
        "name": "Aquarius",
        "price": 0.00280,
        "ltv": 0.55,
        "liquidation_threshold": 0.65,
        "supply_apy": 6.75,
        "borrow_apy": 11.20,
        "total_supplied": 42_000_000.0,
        "total_borrowed": 18_500_000.0,
        "liquidation_bonus": 0.12,
    },
    "yXLM": {
        "symbol": "yXLM",
        "name": "Yielded XLM",
        "price": 0.1180,
        "ltv": 0.70,
        "liquidation_threshold": 0.78,
        "supply_apy": 5.85,
        "borrow_apy": 8.45,
        "total_supplied": 3_200_000.0,
        "total_borrowed": 1_400_000.0,
        "liquidation_bonus": 0.10,
    },
}

# Price history for sparklines: dict[symbol -> list of last 30 prices]
PRICE_HISTORY: Dict[str, List[float]] = {s: [ASSETS[s]["price"]] * 30 for s in ASSETS}


async def fetch_xlm_price_from_stellar() -> Optional[float]:
    """Pull the latest XLM/USD trade price from Stellar Horizon (public testnet fallback → mainnet)."""
    urls = [
        "https://horizon.stellar.org/trade_aggregations"
        "?base_asset_type=native"
        "&counter_asset_type=credit_alphanum4"
        "&counter_asset_code=USDC"
        "&counter_asset_issuer=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
        "&resolution=3600000&order=desc&limit=1",
    ]
    async with httpx.AsyncClient(timeout=6.0) as hc:
        for u in urls:
            try:
                r = await hc.get(u)
                if r.status_code == 200:
                    data = r.json()
                    records = data.get("_embedded", {}).get("records", [])
                    if records:
                        return float(records[0]["close"])
            except Exception as exc:  # noqa: BLE001
                logger.warning("Horizon fetch failed: %s", exc)
    return None


def utilization(a: Dict[str, Any]) -> float:
    if a["total_supplied"] <= 0:
        return 0.0
    return a["total_borrowed"] / a["total_supplied"]


def _wallet_id(addr: str) -> str:
    return addr.strip().upper()


# ─────────────────────────────────────────────────────────────────────
# Models
# ─────────────────────────────────────────────────────────────────────
class ConnectWalletRequest(BaseModel):
    address: Optional[str] = None  # None → generate a mock address


class ConnectWalletResponse(BaseModel):
    address: str
    is_new: bool


class TxRequest(BaseModel):
    wallet: str
    asset: str
    amount: float


class AutomationConfigRequest(BaseModel):
    wallet: str
    enabled: bool
    trigger_hf: float = Field(ge=1.0, le=2.5)
    max_liquidation_pct: float = Field(default=0.35, ge=0.05, le=0.75)


class AIInsightRequest(BaseModel):
    wallet: str


# ─────────────────────────────────────────────────────────────────────
# DB helpers
# ─────────────────────────────────────────────────────────────────────
async def get_or_create_user(wallet: str) -> Dict[str, Any]:
    wallet = _wallet_id(wallet)
    user = await db.users.find_one({"wallet": wallet}, {"_id": 0})
    if user:
        return user
    user = {
        "wallet": wallet,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "balances": {
            "XLM": 5000.0,
            "USDC": 2500.0,
            "AQUA": 250000.0,
            "yXLM": 1000.0,
        },
        "supplied": {},   # asset -> amount
        "borrowed": {},   # asset -> amount
        "automation": {
            "enabled": False,
            "trigger_hf": 1.15,
            "max_liquidation_pct": 0.35,
            "last_check": None,
        },
    }
    await db.users.insert_one({**user})
    return {k: v for k, v in user.items() if k != "_id"}


async def save_user(user: Dict[str, Any]) -> None:
    user = {k: v for k, v in user.items() if k != "_id"}
    await db.users.replace_one({"wallet": user["wallet"]}, user, upsert=True)


async def log_activity(wallet: str, kind: str, message: str, meta: Optional[Dict] = None) -> None:
    entry = {
        "id": str(uuid.uuid4()),
        "wallet": _wallet_id(wallet),
        "kind": kind,
        "message": message,
        "meta": meta or {},
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    await db.activity.insert_one(entry)


def compute_health_factor(user: Dict[str, Any]) -> Dict[str, Any]:
    """
    HF = Σ(collateral_i × liq_threshold_i) / Σ(debt_i)
    HF > 1 → healthy. HF ≤ 1 → liquidatable on-chain.
    """
    collateral_usd = 0.0
    weighted_collateral = 0.0
    debt_usd = 0.0
    for a, amt in (user.get("supplied") or {}).items():
        info = ASSETS.get(a)
        if not info or amt <= 0:
            continue
        val = amt * info["price"]
        collateral_usd += val
        weighted_collateral += val * info["liquidation_threshold"]
    for a, amt in (user.get("borrowed") or {}).items():
        info = ASSETS.get(a)
        if not info or amt <= 0:
            continue
        debt_usd += amt * info["price"]

    if debt_usd == 0:
        hf = math.inf
    else:
        hf = weighted_collateral / debt_usd

    max_borrow_usd = sum(
        (user.get("supplied") or {}).get(a, 0) * ASSETS[a]["price"] * ASSETS[a]["ltv"]
        for a in ASSETS
    )
    return {
        "collateral_usd": round(collateral_usd, 2),
        "debt_usd": round(debt_usd, 2),
        "weighted_collateral_usd": round(weighted_collateral, 2),
        "health_factor": None if math.isinf(hf) else round(hf, 4),
        "max_borrow_usd": round(max_borrow_usd, 2),
        "available_borrow_usd": round(max(0.0, max_borrow_usd - debt_usd), 2),
    }


def serialize_user(user: Dict[str, Any]) -> Dict[str, Any]:
    hf = compute_health_factor(user)
    return {
        "wallet": user["wallet"],
        "balances": user.get("balances", {}),
        "supplied": user.get("supplied", {}),
        "borrowed": user.get("borrowed", {}),
        "automation": user.get("automation", {}),
        **hf,
    }


# ─────────────────────────────────────────────────────────────────────
# API — markets & wallet
# ─────────────────────────────────────────────────────────────────────
@api_router.get("/")
async def root():
    return {"service": "soterion", "network": "stellar-testnet-simulated"}


@api_router.get("/markets")
async def list_markets():
    out = []
    for sym, a in ASSETS.items():
        util = utilization(a)
        out.append(
            {
                **a,
                "utilization": round(util, 4),
                "history": PRICE_HISTORY[sym][-30:],
            }
        )
    return {"assets": out, "updated_at": datetime.now(timezone.utc).isoformat()}


@api_router.post("/wallet/connect", response_model=ConnectWalletResponse)
async def connect_wallet(req: ConnectWalletRequest):
    if req.address and len(req.address) >= 8:
        addr = _wallet_id(req.address)
    else:
        addr = "G" + "".join(random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ234567") for _ in range(55))
    existing = await db.users.find_one({"wallet": addr}, {"_id": 0})
    await get_or_create_user(addr)
    await log_activity(addr, "wallet", f"Wallet {addr[:6]}…{addr[-4:]} connected")
    return ConnectWalletResponse(address=addr, is_new=(existing is None))


@api_router.get("/position/{wallet}")
async def get_position(wallet: str):
    user = await get_or_create_user(wallet)
    return serialize_user(user)


# ─────────────────────────────────────────────────────────────────────
# API — supply / withdraw / borrow / repay
# ─────────────────────────────────────────────────────────────────────
def _validate_asset(sym: str) -> Dict[str, Any]:
    info = ASSETS.get(sym.upper())
    if not info:
        raise HTTPException(400, f"Unsupported asset: {sym}")
    return info


@api_router.post("/supply")
async def supply(req: TxRequest):
    info = _validate_asset(req.asset)
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    user = await get_or_create_user(req.wallet)
    bal = user["balances"].get(req.asset, 0.0)
    if bal < req.amount:
        raise HTTPException(400, f"Insufficient {req.asset} balance")
    user["balances"][req.asset] = bal - req.amount
    user["supplied"][req.asset] = user["supplied"].get(req.asset, 0.0) + req.amount
    info["total_supplied"] += req.amount
    await save_user(user)
    await log_activity(
        req.wallet, "supply",
        f"Supplied {req.amount:.4f} {req.asset} (${req.amount * info['price']:.2f})",
        {"asset": req.asset, "amount": req.amount},
    )
    return serialize_user(user)


@api_router.post("/withdraw")
async def withdraw(req: TxRequest):
    info = _validate_asset(req.asset)
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    user = await get_or_create_user(req.wallet)
    supplied = user["supplied"].get(req.asset, 0.0)
    if supplied < req.amount:
        raise HTTPException(400, f"Not enough supplied {req.asset}")
    # Trial: apply withdraw and check HF
    new_user = {**user, "supplied": {**user["supplied"]}}
    new_user["supplied"][req.asset] = supplied - req.amount
    hf = compute_health_factor(new_user)
    if hf["health_factor"] is not None and hf["health_factor"] < 1.05:
        raise HTTPException(400, f"Withdraw would drop HF to {hf['health_factor']:.3f} (< 1.05)")
    user["supplied"][req.asset] = supplied - req.amount
    user["balances"][req.asset] = user["balances"].get(req.asset, 0.0) + req.amount
    info["total_supplied"] = max(0.0, info["total_supplied"] - req.amount)
    await save_user(user)
    await log_activity(
        req.wallet, "withdraw",
        f"Withdrew {req.amount:.4f} {req.asset}",
        {"asset": req.asset, "amount": req.amount},
    )
    return serialize_user(user)


@api_router.post("/borrow")
async def borrow(req: TxRequest):
    info = _validate_asset(req.asset)
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    user = await get_or_create_user(req.wallet)
    # Simulate borrow and re-check HF
    new_user = {**user, "borrowed": {**user["borrowed"]}}
    new_user["borrowed"][req.asset] = new_user["borrowed"].get(req.asset, 0.0) + req.amount
    hf = compute_health_factor(new_user)
    if hf["health_factor"] is None:
        raise HTTPException(400, "No collateral supplied")
    if hf["health_factor"] < 1.05:
        raise HTTPException(400, f"Borrow rejected: post-tx HF would be {hf['health_factor']:.3f}")
    user["borrowed"][req.asset] = user["borrowed"].get(req.asset, 0.0) + req.amount
    user["balances"][req.asset] = user["balances"].get(req.asset, 0.0) + req.amount
    info["total_borrowed"] += req.amount
    await save_user(user)
    await log_activity(
        req.wallet, "borrow",
        f"Borrowed {req.amount:.4f} {req.asset} (${req.amount * info['price']:.2f})",
        {"asset": req.asset, "amount": req.amount},
    )
    return serialize_user(user)


@api_router.post("/repay")
async def repay(req: TxRequest):
    info = _validate_asset(req.asset)
    if req.amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    user = await get_or_create_user(req.wallet)
    owed = user["borrowed"].get(req.asset, 0.0)
    if owed <= 0:
        raise HTTPException(400, f"No {req.asset} debt to repay")
    bal = user["balances"].get(req.asset, 0.0)
    pay = min(req.amount, owed, bal)
    if pay <= 0:
        raise HTTPException(400, "Insufficient balance to repay")
    user["borrowed"][req.asset] = owed - pay
    user["balances"][req.asset] = bal - pay
    info["total_borrowed"] = max(0.0, info["total_borrowed"] - pay)
    await save_user(user)
    await log_activity(
        req.wallet, "repay",
        f"Repaid {pay:.4f} {req.asset}",
        {"asset": req.asset, "amount": pay},
    )
    return serialize_user(user)


# ─────────────────────────────────────────────────────────────────────
# Automation engine
# ─────────────────────────────────────────────────────────────────────
@api_router.post("/automation/config")
async def set_automation(cfg: AutomationConfigRequest):
    user = await get_or_create_user(cfg.wallet)
    user["automation"] = {
        "enabled": cfg.enabled,
        "trigger_hf": cfg.trigger_hf,
        "max_liquidation_pct": cfg.max_liquidation_pct,
        "last_check": user["automation"].get("last_check"),
    }
    await save_user(user)
    await log_activity(
        cfg.wallet, "automation",
        f"Automation {'ENABLED' if cfg.enabled else 'DISABLED'} · trigger HF={cfg.trigger_hf:.2f} · max cut={int(cfg.max_liquidation_pct*100)}%",
        {"cfg": user["automation"]},
    )
    return serialize_user(user)


@api_router.get("/activity/{wallet}")
async def get_activity(wallet: str, limit: int = 50):
    wallet = _wallet_id(wallet)
    docs = (
        await db.activity.find({"wallet": wallet}, {"_id": 0})
        .sort("ts", -1)
        .to_list(length=limit)
    )
    return {"activity": docs}


@api_router.get("/liquidations/{wallet}")
async def get_liquidations(wallet: str, limit: int = 50):
    wallet = _wallet_id(wallet)
    docs = (
        await db.liquidations.find({"wallet": wallet}, {"_id": 0})
        .sort("ts", -1)
        .to_list(length=limit)
    )
    return {"liquidations": docs}


async def execute_partial_liquidation(user: Dict[str, Any], reason: str) -> Optional[Dict[str, Any]]:
    """Automatically execute a partial liquidation on the largest debt position."""
    borrowed = user.get("borrowed", {}) or {}
    supplied = user.get("supplied", {}) or {}
    if not borrowed or not supplied:
        return None
    # largest debt in USD
    debt_pairs = sorted(
        ((a, amt * ASSETS[a]["price"]) for a, amt in borrowed.items() if amt > 0),
        key=lambda x: -x[1],
    )
    coll_pairs = sorted(
        ((a, amt * ASSETS[a]["price"]) for a, amt in supplied.items() if amt > 0),
        key=lambda x: -x[1],
    )
    if not debt_pairs or not coll_pairs:
        return None

    debt_asset, debt_usd = debt_pairs[0]
    coll_asset, _ = coll_pairs[0]
    max_pct = user["automation"].get("max_liquidation_pct", 0.35)

    repay_usd = debt_usd * max_pct
    repay_amt = repay_usd / ASSETS[debt_asset]["price"]
    # seize collateral (with liquidation bonus)
    bonus = ASSETS[coll_asset]["liquidation_bonus"]
    seize_usd = repay_usd * (1 + bonus)
    seize_amt = seize_usd / ASSETS[coll_asset]["price"]
    seize_amt = min(seize_amt, user["supplied"][coll_asset])

    user["borrowed"][debt_asset] = max(0.0, user["borrowed"][debt_asset] - repay_amt)
    user["supplied"][coll_asset] = max(0.0, user["supplied"][coll_asset] - seize_amt)
    ASSETS[debt_asset]["total_borrowed"] = max(0.0, ASSETS[debt_asset]["total_borrowed"] - repay_amt)
    ASSETS[coll_asset]["total_supplied"] = max(0.0, ASSETS[coll_asset]["total_supplied"] - seize_amt)

    event = {
        "id": str(uuid.uuid4()),
        "wallet": user["wallet"],
        "ts": datetime.now(timezone.utc).isoformat(),
        "reason": reason,
        "debt_asset": debt_asset,
        "debt_repaid": round(repay_amt, 6),
        "debt_repaid_usd": round(repay_usd, 2),
        "collateral_asset": coll_asset,
        "collateral_seized": round(seize_amt, 6),
        "collateral_seized_usd": round(seize_usd, 2),
        "liquidation_bonus_pct": bonus,
    }
    await db.liquidations.insert_one({**event})
    await log_activity(
        user["wallet"], "liquidation",
        f"AUTO-LIQ · repaid {repay_amt:.4f} {debt_asset} · seized {seize_amt:.4f} {coll_asset}",
        event,
    )
    return event


async def automation_worker():
    """Runs every 6 seconds. Also drifts prices to simulate live Stellar feeds."""
    logger.info("[automation] worker started")
    tick = 0
    while True:
        try:
            tick += 1
            # Drift prices ±0.6%
            for sym, a in ASSETS.items():
                drift = 1 + random.uniform(-0.006, 0.006)
                a["price"] = round(max(0.000001, a["price"] * drift), 6)
                PRICE_HISTORY[sym].append(a["price"])
                if len(PRICE_HISTORY[sym]) > 60:
                    PRICE_HISTORY[sym] = PRICE_HISTORY[sym][-60:]
                # Utilization impacts APYs slightly
                u = utilization(a)
                a["borrow_apy"] = round(max(1.0, a["borrow_apy"] * (1 + (u - 0.5) * 0.001)), 3)
                a["supply_apy"] = round(a["borrow_apy"] * u * 0.85, 3)

            # Every 5 ticks (~30s) try real XLM price
            if tick % 5 == 0:
                real = await fetch_xlm_price_from_stellar()
                if real and real > 0:
                    ASSETS["XLM"]["price"] = round(real, 6)
                    ASSETS["yXLM"]["price"] = round(real * 1.026, 6)

            # Check all users with automation enabled
            users = await db.users.find({"automation.enabled": True}, {"_id": 0}).to_list(1000)
            now_iso = datetime.now(timezone.utc).isoformat()
            for u in users:
                u["automation"]["last_check"] = now_iso
                hf = compute_health_factor(u)["health_factor"]
                trigger = u["automation"]["trigger_hf"]
                if hf is not None and hf <= trigger:
                    reason = f"HF={hf:.3f} ≤ trigger={trigger:.3f}"
                    logger.info("[automation] liquidating %s :: %s", u["wallet"][:10], reason)
                    await execute_partial_liquidation(u, reason)
                await save_user(u)
        except Exception as exc:  # noqa: BLE001
            logger.exception("[automation] tick error: %s", exc)
        await asyncio.sleep(6)


# ─────────────────────────────────────────────────────────────────────
# LLM risk insights
# ─────────────────────────────────────────────────────────────────────
@api_router.post("/ai/insight")
async def ai_insight(req: AIInsightRequest):
    user = await get_or_create_user(req.wallet)
    pos = serialize_user(user)
    context = {
        "health_factor": pos["health_factor"],
        "collateral_usd": pos["collateral_usd"],
        "debt_usd": pos["debt_usd"],
        "supplied": pos["supplied"],
        "borrowed": pos["borrowed"],
        "automation": pos["automation"],
        "market_snapshot": {
            s: {"price": a["price"], "borrow_apy": a["borrow_apy"], "supply_apy": a["supply_apy"]}
            for s, a in ASSETS.items()
        },
    }

    if not EMERGENT_LLM_KEY:
        return {"insight": "AI key unavailable.", "context": context}

    system_prompt = (
        "You are Soterion's on-chain risk analyst — a terse, technical DeFi assistant on the Stellar network. "
        "Given a user's lending position and market snapshot, output EXACTLY the following sections in plain text "
        "(no markdown headers, no bullets with asterisks, keep total under 180 words):\n"
        "RISK LEVEL: one of [LOW / MODERATE / HIGH / CRITICAL] with one-line justification.\n"
        "KEY SIGNAL: single most important observation about their health factor & positions.\n"
        "RECOMMENDATION: 1-2 concrete actions (repay X, add collateral Y, adjust trigger to Z).\n"
        "MARKET NOTE: one sentence on current XLM/USDC/AQUA/yXLM rates or volatility."
    )
    user_prompt = f"POSITION_JSON:\n{context}"

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"soterion-{req.wallet[:8]}",
            system_message=system_prompt,
        ).with_model("anthropic", "claude-sonnet-4-6")

        parts: List[str] = []
        async for ev in chat.stream_message(UserMessage(text=user_prompt)):
            if isinstance(ev, TextDelta):
                parts.append(ev.content)
            elif isinstance(ev, StreamDone):
                break
        text = "".join(parts).strip()
        return {"insight": text or "No signal.", "context": context}
    except Exception as exc:  # noqa: BLE001
        logger.exception("LLM insight failed: %s", exc)
        return {"insight": f"AI unavailable ({exc.__class__.__name__}).", "context": context}


# ─────────────────────────────────────────────────────────────────────
# Wire it up
# ─────────────────────────────────────────────────────────────────────
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    # Try to grab a real XLM price up-front, then launch worker
    real = await fetch_xlm_price_from_stellar()
    if real and real > 0:
        ASSETS["XLM"]["price"] = round(real, 6)
        ASSETS["yXLM"]["price"] = round(real * 1.026, 6)
        for sym in ("XLM", "yXLM"):
            PRICE_HISTORY[sym] = [ASSETS[sym]["price"]] * 30
    asyncio.create_task(automation_worker())


@app.on_event("shutdown")
async def _shutdown():
    client.close()
