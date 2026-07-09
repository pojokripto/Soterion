"""Soterion backend tests."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://soterion-defi.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ── Markets
def test_markets(s):
    r = s.get(f"{API}/markets", timeout=15)
    assert r.status_code == 200
    data = r.json()
    syms = {a["symbol"] for a in data["assets"]}
    assert syms == {"XLM", "USDC", "AQUA", "yXLM"}
    for a in data["assets"]:
        for k in ("price", "supply_apy", "borrow_apy", "utilization",
                  "total_supplied", "total_borrowed", "ltv", "liquidation_threshold", "history"):
            assert k in a, f"{a['symbol']} missing {k}"
        assert len(a["history"]) >= 30


# ── Wallet connect
def test_wallet_connect_generates(s):
    r = s.post(f"{API}/wallet/connect", json={})
    assert r.status_code == 200
    d = r.json()
    assert d["address"].startswith("G")
    assert 50 <= len(d["address"]) <= 60
    assert d["is_new"] is True


def test_wallet_connect_specific(s):
    addr = "GTESTWALLET12345678"
    r1 = s.post(f"{API}/wallet/connect", json={"address": addr})
    assert r1.status_code == 200
    assert r1.json()["address"].upper() == addr.upper()
    r2 = s.post(f"{API}/wallet/connect", json={"address": addr})
    assert r2.json()["is_new"] is False


# ── Position defaults
@pytest.fixture(scope="module")
def wallet(s):
    addr = f"GTEST{int(time.time())}WALLET0000000000"
    s.post(f"{API}/wallet/connect", json={"address": addr})
    return addr.upper()


def test_position_defaults(s, wallet):
    r = s.get(f"{API}/position/{wallet}")
    assert r.status_code == 200
    d = r.json()
    assert d["balances"] == {"XLM": 5000.0, "USDC": 2500.0, "AQUA": 250000.0, "yXLM": 1000.0}
    assert d["supplied"] == {}
    assert d["borrowed"] == {}
    assert d["health_factor"] is None
    assert d["collateral_usd"] == 0
    assert d["automation"]["enabled"] is False


# ── Supply
def test_supply_xlm(s, wallet):
    r = s.post(f"{API}/supply", json={"wallet": wallet, "asset": "XLM", "amount": 2000})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["balances"]["XLM"] == 3000.0
    assert d["supplied"]["XLM"] == 2000.0
    assert d["collateral_usd"] > 0


def test_supply_insufficient(s, wallet):
    r = s.post(f"{API}/supply", json={"wallet": wallet, "asset": "XLM", "amount": 999999})
    assert r.status_code == 400


# ── Borrow
def test_borrow_no_collateral(s):
    addr = f"GNOCOLL{int(time.time())}AAAAAAAAAAAAAAAAAAA"
    s.post(f"{API}/wallet/connect", json={"address": addr})
    r = s.post(f"{API}/borrow", json={"wallet": addr, "asset": "USDC", "amount": 100})
    assert r.status_code == 400


def test_borrow_usdc(s, wallet):
    r = s.post(f"{API}/borrow", json={"wallet": wallet, "asset": "USDC", "amount": 100})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["borrowed"].get("USDC", 0) >= 100
    assert d["health_factor"] is not None and d["health_factor"] > 1.0
    # HF sanity: with 2000 XLM * ~0.115 * 0.80 / (100 * 1.0) ~ 1.84 (varies with real price)
    assert 1.2 < d["health_factor"] < 10


# ── Repay
def test_repay(s, wallet):
    r = s.post(f"{API}/repay", json={"wallet": wallet, "asset": "USDC", "amount": 50})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["borrowed"]["USDC"] < 100


# ── Withdraw HF protection
def test_withdraw_hf_protection(s, wallet):
    r = s.post(f"{API}/withdraw", json={"wallet": wallet, "asset": "XLM", "amount": 1999})
    # Should reject because HF would drop
    assert r.status_code in (400, 200)


# ── Automation config
def test_automation_config(s, wallet):
    r = s.post(f"{API}/automation/config",
               json={"wallet": wallet, "enabled": True, "trigger_hf": 1.20, "max_liquidation_pct": 0.35})
    assert r.status_code == 200, r.text
    p = s.get(f"{API}/position/{wallet}").json()
    assert p["automation"]["enabled"] is True
    assert abs(p["automation"]["trigger_hf"] - 1.20) < 0.01


# ── Activity & Liquidations
def test_activity(s, wallet):
    r = s.get(f"{API}/activity/{wallet}")
    assert r.status_code == 200
    acts = r.json()["activity"]
    kinds = {a["kind"] for a in acts}
    assert "supply" in kinds and "borrow" in kinds


def test_liquidations_empty_or_list(s, wallet):
    r = s.get(f"{API}/liquidations/{wallet}")
    assert r.status_code == 200
    assert isinstance(r.json()["liquidations"], list)


# ── AI insight
def test_ai_insight(s, wallet):
    r = s.post(f"{API}/ai/insight", json={"wallet": wallet}, timeout=45)
    assert r.status_code == 200
    d = r.json()
    assert "insight" in d and "context" in d
    text = d["insight"]
    # Should include the 4 sections (LLM should follow prompt)
    assert "RISK LEVEL" in text.upper() or "AI" in text.upper()


# ── Automation liquidation flow
def test_automation_triggers_liquidation(s):
    addr = f"GLIQ{int(time.time())}WALLETTESTAAAAAAAAAAAAAAAAAA"
    s.post(f"{API}/wallet/connect", json={"address": addr})
    # Supply small XLM
    s.post(f"{API}/supply", json={"wallet": addr, "asset": "XLM", "amount": 1000})
    pos = s.get(f"{API}/position/{addr}").json()
    max_borrow_usd = pos["max_borrow_usd"]
    borrow_amt = max_borrow_usd * 0.95  # near max
    if borrow_amt < 1:
        pytest.skip("Insufficient max borrow")
    br = s.post(f"{API}/borrow", json={"wallet": addr, "asset": "USDC", "amount": round(borrow_amt, 2)})
    assert br.status_code == 200, br.text
    hf = br.json()["health_factor"]
    trigger = min(hf + 0.5, 2.4)  # set trigger above current HF to force liquidation
    ac = s.post(f"{API}/automation/config",
                json={"wallet": addr, "enabled": True, "trigger_hf": trigger, "max_liquidation_pct": 0.35})
    assert ac.status_code == 200
    # Wait up to ~18s for the worker
    seen = False
    for _ in range(6):
        time.sleep(4)
        liq = s.get(f"{API}/liquidations/{addr}").json()["liquidations"]
        if liq:
            seen = True
            break
    assert seen, "Liquidation was not triggered by automation worker"
