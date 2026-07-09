import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND}/api`;

const logErr = (label, err) => {
  if (process.env.NODE_ENV !== "production") console.error(label, err);
};

/**
 * Custom hook centralising Soterion API state:
 *  - markets, position, activity, liquidations (all polled every 6s)
 *  - wallet connect / disconnect
 *  - supply / withdraw / borrow / repay / automation / AI insight
 */
export default function useSoterionData() {
  const [wallet, setWallet] = useState(() => localStorage.getItem("soterion_wallet") || null);
  const [markets, setMarkets] = useState([]);
  const [position, setPosition] = useState(null);
  const [activity, setActivity] = useState([]);
  const [liquidations, setLiquidations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hfFlash, setHfFlash] = useState(null);
  const prevHFRef = useRef(null);

  const fetchMarkets = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/markets`);
      setMarkets(data.assets);
    } catch (e) { logErr("markets", e); }
  }, []);

  const fetchPosition = useCallback(async (w) => {
    if (!w) return;
    try {
      const { data } = await axios.get(`${API}/position/${w}`);
      setPosition(data);
      const prev = prevHFRef.current;
      if (data.health_factor != null && prev != null) {
        if (data.health_factor > prev) {
          setHfFlash("up"); setTimeout(() => setHfFlash(null), 800);
        } else if (data.health_factor < prev) {
          setHfFlash("down"); setTimeout(() => setHfFlash(null), 800);
        }
      }
      prevHFRef.current = data.health_factor;
    } catch (e) { logErr("position", e); }
  }, []);

  const fetchActivity = useCallback(async (w) => {
    if (!w) return;
    try {
      const [a, l] = await Promise.all([
        axios.get(`${API}/activity/${w}?limit=40`),
        axios.get(`${API}/liquidations/${w}?limit=20`),
      ]);
      setActivity(a.data.activity);
      setLiquidations(l.data.liquidations);
    } catch (e) { logErr("activity", e); }
  }, []);

  // Poll markets always
  useEffect(() => {
    fetchMarkets();
    const id = setInterval(fetchMarkets, 6000);
    return () => clearInterval(id);
  }, [fetchMarkets]);

  // Poll position + activity when connected
  useEffect(() => {
    if (!wallet) return undefined;
    fetchPosition(wallet);
    fetchActivity(wallet);
    const id = setInterval(() => {
      fetchPosition(wallet);
      fetchActivity(wallet);
    }, 6000);
    return () => clearInterval(id);
  }, [wallet, fetchPosition, fetchActivity]);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/wallet/connect`, {});
      setWallet(data.address);
      localStorage.setItem("soterion_wallet", data.address);
      toast.success("Freighter wallet connected", {
        description: `${data.address.slice(0, 6)}…${data.address.slice(-4)}`,
      });
    } catch (e) {
      logErr("connect", e);
      toast.error("Failed to connect wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setPosition(null);
    setActivity([]);
    setLiquidations([]);
    localStorage.removeItem("soterion_wallet");
    toast.info("Disconnected");
  }, []);

  const runTx = useCallback(async (mode, asset, amount) => {
    const { data } = await axios.post(`${API}/${mode}`, {
      wallet, asset, amount: Number(amount),
    });
    setPosition(data);
    toast.success(`${mode.toUpperCase()} ${amount} ${asset} confirmed`);
    fetchActivity(wallet);
    fetchMarkets();
    return data;
  }, [wallet, fetchActivity, fetchMarkets]);

  const updateAutomation = useCallback(async (cfg) => {
    try {
      const { data } = await axios.post(`${API}/automation/config`, { wallet, ...cfg });
      setPosition(data);
      toast.success(`Automation ${cfg.enabled ? "enabled" : "paused"}`);
      fetchActivity(wallet);
    } catch (e) {
      logErr("automation", e);
      toast.error("Automation update failed");
    }
  }, [wallet, fetchActivity]);

  const requestAI = useCallback(async () => {
    try {
      const { data } = await axios.post(`${API}/ai/insight`, { wallet });
      return data.insight;
    } catch (e) {
      logErr("ai", e);
      return "AI unavailable.";
    }
  }, [wallet]);

  return {
    wallet, markets, position, activity, liquidations, loading, hfFlash,
    refreshMarkets: fetchMarkets,
    connect, disconnect, runTx, updateAutomation, requestAI,
  };
}
