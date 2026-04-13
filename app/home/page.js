"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../_utils/firebase-client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection, query, where, getDocs,
  doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
} from "firebase/firestore";
import Image from "next/image";
import TradingChart from "../../components/trading-chart";
import StockSearch from "../../components/stock-search";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Portfolio
  const [portfolio, setPortfolio] = useState([]);
  const [accountBalance, setAccountBalance] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // Selected stock
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [stockData, setStockData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState(null);
  const [currentShares, setCurrentShares] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [transacting, setTransacting] = useState(false);

  // Profile
  const [userProfile, setUserProfile] = useState({ first_name: "", last_name: "" });
  const [profileOpen, setProfileOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Portfolio fetch ────────────────────────────────────────────
  const fetchPortfolio = useCallback(async (userId) => {
    try {
      const [snap, accountSnap, userSnap] = await Promise.all([
        getDocs(query(collection(db, "holdings"), where("user_id", "==", userId))),
        getDoc(doc(db, "accounts", userId)),
        getDoc(doc(db, "users", userId)),
      ]);

      if (accountSnap.exists()) setAccountBalance(accountSnap.data().balance);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserProfile({ first_name: data.first_name || "", last_name: data.last_name || "" });
      }

      const holdingsData = snap.docs.map((d) => d.data());

      const resolved = await Promise.all(
        holdingsData.map(async (h) => {
          try {
            const res = await fetch(`/api/stock-profile?symbol=${h.stock_symbol}`);
            if (!res.ok) return null;
            const { price } = await res.json();
            return {
              ticker: h.stock_symbol,
              name: h.stock_name,
              shares: h.shares_owned,
              avgPrice: h.avg_buy_price,
              currentPrice: price,
              value: h.shares_owned * price,
              change: ((price - h.avg_buy_price) / h.avg_buy_price) * 100,
            };
          } catch { return null; }
        })
      );

      const valid = resolved.filter(Boolean);
      setPortfolio(valid);
      setTotalValue(valid.reduce((s, h) => s + h.value, 0));
    } catch (err) {
      console.error("Portfolio fetch error:", err);
    }
  }, []);

  // ── Select a stock ─────────────────────────────────────────────
  const selectStock = useCallback(async (symbol) => {
    setSelectedSymbol(symbol);
    setStockData(null);
    setHistoricalData([]);
    setStockLoading(true);
    setStockError(null);
    setQuantity(1);
    setSidebarOpen(false);

    try {
      const [profileRes, histRes] = await Promise.all([
        fetch(`/api/stock-profile?symbol=${symbol}`),
        fetch(`/api/market-data?symbol=${symbol}`),
      ]);
      if (!profileRes.ok) throw new Error("Failed to fetch profile");
      if (!histRes.ok) throw new Error("Failed to fetch chart data");

      const profile = await profileRes.json();
      const hist = await histRes.json();

      setStockData({
        symbol: profile.symbol,
        companyName: profile.companyName,
        price: profile.price,
        changes: Number(profile.changesPercentage ?? profile.changes) || 0,
        mktCap: Number(profile.mktCap) || 0,
        exchange: profile.exchangeShortName ?? null,
        beta: profile.beta ?? null,
        open: profile.open ?? null,
        previousClose: profile.previousClose ?? null,
        volAvg: Number(profile.volAvg) || 0,
      });
      setHistoricalData(hist);
    } catch (err) {
      setStockError(err.message);
    } finally {
      setStockLoading(false);
    }
  }, []);

  // ── Auth listener ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/sign-in");
      } else {
        setUser(firebaseUser);
        setLoading(false);
        fetchPortfolio(firebaseUser.uid);
      }
    });
    return () => unsub();
  }, [router, fetchPortfolio]);

  // ── Fetch shares when selected stock changes ───────────────────
  useEffect(() => {
    if (!user || !selectedSymbol) return;
    getDoc(doc(db, "holdings", `${user.uid}_${selectedSymbol}`)).then((snap) =>
      setCurrentShares(snap.exists() ? snap.data().shares_owned : 0)
    );
  }, [user, selectedSymbol]);

  // ── Trade ──────────────────────────────────────────────────────
  const handleTransaction = async (type) => {
    if (!user || !stockData || quantity < 1) return;
    setTransacting(true);
    try {
      const profileRes = await fetch(`/api/stock-profile?symbol=${selectedSymbol}`);
      const { price: currentPrice, companyName } = await profileRes.json();

      const accountSnap = await getDoc(doc(db, "accounts", user.uid));
      const { balance } = accountSnap.data();
      const totalAmount = currentPrice * quantity;
      const newBalance = type === "buy" ? balance - totalAmount : balance + totalAmount;

      if (type === "buy" && newBalance < 0) {
        alert(`Insufficient funds. Need $${totalAmount.toFixed(2)}`);
        return;
      }

      const holdingRef = doc(db, "holdings", `${user.uid}_${selectedSymbol}`);
      const holdingSnap = await getDoc(holdingRef);
      const existingShares = holdingSnap.exists() ? holdingSnap.data().shares_owned : 0;
      const existingAvg = holdingSnap.exists() ? holdingSnap.data().avg_buy_price : 0;

      if (type === "sell" && existingShares < quantity) {
        alert(`You only own ${existingShares} shares`);
        return;
      }

      const newShares = type === "buy" ? existingShares + quantity : existingShares - quantity;
      const newAvg = type === "buy"
        ? ((existingShares * existingAvg) + totalAmount) / newShares
        : existingAvg;

      await Promise.all([
        addDoc(collection(db, "transactions"), {
          user_id: user.uid,
          stock_symbol: selectedSymbol,
          stock_name: companyName,
          type,
          shares: quantity,
          price_at_exec: currentPrice,
          created_at: new Date().toISOString(),
        }),
        setDoc(holdingRef, {
          user_id: user.uid,
          stock_symbol: selectedSymbol,
          stock_name: companyName,
          shares_owned: newShares,
          avg_buy_price: newAvg,
        }, { merge: true }),
        updateDoc(doc(db, "accounts", user.uid), { balance: newBalance }),
      ]);

      setCurrentShares(newShares);
      setAccountBalance(newBalance);
      await fetchPortfolio(user.uid);
      alert(`${type.toUpperCase()} SUCCESS — ${quantity} share${quantity > 1 ? "s" : ""} @ $${currentPrice.toFixed(2)}`);
    } catch (err) {
      alert(`Transaction failed: ${err.message}`);
    } finally {
      setTransacting(false);
    }
  };

  // ── Save profile ───────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
      });
      setUserProfile({ first_name: editFirstName.trim(), last_name: editLastName.trim() });
      setProfileOpen(false);
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Reset simulation ───────────────────────────────────────────
  const handleResetSimulation = async () => {
    if (!user) return;
    if (!confirm("Reset your entire simulation? This will delete all holdings and transactions and restore your balance to $100,000. This cannot be undone.")) return;
    setResetting(true);
    try {
      const [holdingsSnap, txSnap] = await Promise.all([
        getDocs(query(collection(db, "holdings"), where("user_id", "==", user.uid))),
        getDocs(query(collection(db, "transactions"), where("user_id", "==", user.uid))),
      ]);
      await Promise.all([
        ...holdingsSnap.docs.map((d) => deleteDoc(d.ref)),
        ...txSnap.docs.map((d) => deleteDoc(d.ref)),
        updateDoc(doc(db, "accounts", user.uid), { balance: 100000 }),
      ]);
      setPortfolio([]);
      setTotalValue(0);
      setAccountBalance(100000);
      setCurrentShares(0);
      setProfileOpen(false);
    } catch (err) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push("/sign-in");
  };

  const openProfile = () => {
    setEditFirstName(userProfile.first_name);
    setEditLastName(userProfile.last_name);
    setProfileOpen(true);
  };

  // ── Loading screen ─────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#060B18] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
        <span className="text-[#475569] text-sm">Loading your portfolio…</span>
      </div>
    </div>
  );

  const totalPortfolioValue = totalValue + accountBalance;
  const portfolioGain = portfolio.reduce((s, h) => s + ((h.currentPrice - h.avgPrice) * h.shares), 0);

  return (
    <div className="h-screen bg-[#060B18] text-[#E2E8F0] flex flex-col overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="h-16 shrink-0 bg-[#0D1626]/80 backdrop-blur-xl border-b border-[#1E3A5F]/40 flex items-center px-5 gap-4 z-50 relative">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg hover:bg-[#1E3A5F]/40 transition-all shrink-0"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <Image src="/assets/3384357_57661.svg" alt="Logo" width={30} height={30} priority className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="font-bold text-base bg-gradient-to-r from-[#60A5FA] to-[#D4AF37] bg-clip-text text-transparent hidden sm:block">
            FREY TRADE
          </span>
        </div>

        <div className="flex-1 max-w-lg mx-4">
          <StockSearch onSelect={selectStock} />
        </div>

        <div className="flex items-center gap-4 ml-auto shrink-0">
          {userProfile.first_name && (
            <span className="hidden sm:block text-sm text-[#94A3B8]">
              Welcome, <span className="text-[#E2E8F0] font-medium">{userProfile.first_name}</span>
            </span>
          )}
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[11px] text-[#475569] uppercase tracking-wider">Portfolio</span>
            <span className="font-semibold text-sm text-[#E2E8F0]">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] text-[#475569] uppercase tracking-wider">Cash</span>
            <span className="font-semibold text-sm text-[#10B981]">
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          {/* Profile button */}
          <button
            onClick={openProfile}
            className="w-8 h-8 bg-[#1E3A5F]/50 hover:bg-[#1E3A5F] border border-[#1E3A5F] rounded-full flex items-center justify-center transition-all"
            aria-label="Profile"
          >
            <svg className="w-4 h-4 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <button
            onClick={handleSignOut}
            className="bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/25 text-[#EF4444] px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-30 md:hidden"
            style={{ top: "4rem" }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={[
          "fixed md:static top-16 md:top-auto left-0 bottom-0 md:bottom-auto",
          "w-64 shrink-0 bg-[#0A1020] border-r border-[#1E3A5F]/30",
          "flex flex-col overflow-hidden",
          "z-40 md:z-auto",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}>
          {/* Summary cards */}
          <div className="p-4 space-y-3 border-b border-[#1E3A5F]/30">
            <div className="bg-gradient-to-br from-[#3B82F6]/10 to-[#D4AF37]/10 border border-[#3B82F6]/15 rounded-xl p-4">
              <p className="text-[#64748B] text-[11px] uppercase tracking-wider mb-1">Total Value</p>
              <p className="text-2xl font-bold text-[#E2E8F0]">
                ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-xs font-medium mt-1 ${portfolioGain >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                {portfolioGain >= 0 ? "+" : ""}${portfolioGain.toFixed(2)} all-time
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#111D35] rounded-xl p-3">
                <p className="text-[#64748B] text-[10px] uppercase tracking-wider mb-1">Invested</p>
                <p className="font-semibold text-sm text-[#60A5FA]">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-[#111D35] rounded-xl p-3">
                <p className="text-[#64748B] text-[10px] uppercase tracking-wider mb-1">Cash</p>
                <p className="font-semibold text-sm text-[#10B981]">
                  ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Holdings list */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[#475569] text-[10px] font-semibold uppercase tracking-widest mb-3">Holdings</p>

            {portfolio.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 bg-[#111D35] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-[#475569]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-[#475569] text-xs">No holdings yet.</p>
                <p className="text-[#3B4A60] text-xs mt-1">Search a stock to begin.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {portfolio.map((h) => (
                  <button
                    key={h.ticker}
                    onClick={() => selectStock(h.ticker)}
                    className={`w-full text-left p-3 rounded-xl border transition-all group ${
                      selectedSymbol === h.ticker
                        ? "bg-[#3B82F6]/10 border-[#3B82F6]/35 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                        : "bg-[#111D35]/50 border-transparent hover:bg-[#111D35] hover:border-[#1E3A5F]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-[#E2E8F0]">{h.ticker}</span>
                        <p className="text-[#64748B] text-[11px] truncate max-w-[100px] mt-0.5">{h.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-[#E2E8F0]">
                          ${h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-[11px] font-semibold mt-0.5 ${h.change >= 0 ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                          {h.change >= 0 ? "▲" : "▼"} {Math.abs(h.change).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-[#475569]">
                      <span>{h.shares} shares</span>
                      <span>${h.currentPrice.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto">

          {/* Empty state */}
          {!selectedSymbol && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-[#3B82F6]/15 to-[#D4AF37]/15 rounded-full flex items-center justify-center border border-[#3B82F6]/15">
                  <svg className="w-12 h-12 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#10B981] rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[#E2E8F0] mb-2">Pick a stock to get started</h2>
              <p className="text-[#475569] max-w-xs text-sm leading-relaxed">
                Search for any stock using the bar above, or click a holding on the left to view its chart and trade.
              </p>
            </div>
          )}

          {/* Loading stock */}
          {selectedSymbol && stockLoading && (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
              <span className="text-[#475569] text-sm">Loading {selectedSymbol}…</span>
            </div>
          )}

          {/* Error */}
          {selectedSymbol && stockError && (
            <div className="h-full flex items-center justify-center">
              <div className="bg-[#EF4444]/10 border border-[#EF4444]/25 rounded-2xl p-6 text-center max-w-sm">
                <p className="text-[#FCA5A5] font-medium mb-1">Failed to load {selectedSymbol}</p>
                <p className="text-[#64748B] text-sm">{stockError}</p>
                <button
                  onClick={() => selectStock(selectedSymbol)}
                  className="mt-4 px-4 py-2 bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#FCA5A5] rounded-xl text-sm transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Stock detail */}
          {selectedSymbol && !stockLoading && !stockError && stockData && (
            <div className="p-6 space-y-5">

              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-extrabold text-[#E2E8F0]">{stockData.symbol}</h1>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                      stockData.changes >= 0
                        ? "bg-[#10B981]/12 text-[#10B981] border border-[#10B981]/20"
                        : "bg-[#EF4444]/12 text-[#EF4444] border border-[#EF4444]/20"
                    }`}>
                      {stockData.changes >= 0 ? "▲" : "▼"} {Math.abs(stockData.changes).toFixed(2)}%
                    </span>
                    <span className="text-[#475569] text-sm px-2 py-1 bg-[#111D35] rounded-lg border border-[#1E3A5F]">
                      {stockData.exchange}
                    </span>
                  </div>
                  <p className="text-[#94A3B8] mt-1.5">{stockData.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold text-[#E2E8F0]">${stockData.price.toFixed(2)}</p>
                  {currentShares > 0 && (
                    <p className="text-[#60A5FA] text-sm mt-1">
                      You own <strong>{currentShares}</strong> share{currentShares !== 1 ? "s" : ""}
                      {" "}· <strong>${(currentShares * stockData.price).toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-[#0D1626] border border-[#1E3A5F]/30 rounded-2xl p-5">
                {historicalData.length > 0
                  ? <TradingChart data={historicalData} />
                  : <div className="h-[380px] flex items-center justify-center text-[#475569]">No chart data available</div>
                }
              </div>

              {/* Trade + Stats */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                {/* Trade panel */}
                <div className="bg-[#0D1626] border border-[#1E3A5F]/30 rounded-2xl p-5">
                  <h3 className="font-semibold text-[#E2E8F0] mb-4">Trade {stockData.symbol}</h3>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center bg-[#111D35] border border-[#1E3A5F] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="px-3 py-2.5 text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E3A5F]/40 transition-all text-lg font-bold"
                      >−</button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 bg-transparent text-center text-[#E2E8F0] font-semibold focus:outline-none py-2.5 text-sm"
                      />
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="px-3 py-2.5 text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#1E3A5F]/40 transition-all text-lg font-bold"
                      >+</button>
                    </div>
                    <div className="text-sm text-[#64748B]">
                      Total: <span className="text-[#E2E8F0] font-semibold">${(quantity * stockData.price).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleTransaction("buy")}
                      disabled={transacting}
                      className="bg-[#10B981] hover:bg-[#059669] active:scale-[0.97] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] text-sm"
                    >
                      {transacting ? "…" : `Buy ${quantity} Share${quantity > 1 ? "s" : ""}`}
                    </button>
                    <button
                      onClick={() => handleTransaction("sell")}
                      disabled={transacting || currentShares < quantity}
                      className="bg-[#EF4444] hover:bg-[#DC2626] active:scale-[0.97] disabled:opacity-30 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] text-sm"
                    >
                      {transacting ? "…" : `Sell ${quantity} Share${quantity > 1 ? "s" : ""}`}
                    </button>
                  </div>

                  {currentShares > 0 && currentShares < quantity && (
                    <p className="text-[#F59E0B] text-xs mt-3 text-center">
                      You only own {currentShares} share{currentShares !== 1 ? "s" : ""}
                    </p>
                  )}

                  <div className="mt-5 pt-4 border-t border-[#1E3A5F]/30 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between text-[#64748B]">
                      <span>Avg cost</span>
                      <span className="text-[#E2E8F0]">
                        {currentShares > 0
                          ? `$${portfolio.find(h => h.ticker === selectedSymbol)?.avgPrice?.toFixed(2) ?? "—"}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[#64748B]">
                      <span>Cash left</span>
                      <span className="text-[#10B981]">${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Stats panel */}
                <div className="bg-[#0D1626] border border-[#1E3A5F]/30 rounded-2xl p-5">
                  <h3 className="font-semibold text-[#E2E8F0] mb-4">Key Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Market Cap",  value: `$${(stockData.mktCap / 1e9).toFixed(2)}B` },
                      { label: "Avg Volume",  value: `${(stockData.volAvg / 1e6).toFixed(1)}M` },
                      { label: "Beta",        value: stockData.beta != null ? Number(stockData.beta).toFixed(2) : "N/A" },
                      { label: "Open",        value: stockData.open != null ? `$${Number(stockData.open).toFixed(2)}` : "N/A" },
                      { label: "Prev Close",  value: stockData.previousClose != null ? `$${Number(stockData.previousClose).toFixed(2)}` : "N/A" },
                      { label: "Exchange",    value: stockData.exchange ?? "N/A" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[#111D35] rounded-xl p-3 border border-[#1E3A5F]/20">
                        <p className="text-[#64748B] text-[11px] uppercase tracking-wider mb-1">{label}</p>
                        <p className="font-semibold text-[#E2E8F0] text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Profile Modal ── */}
      {profileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setProfileOpen(false); }}
        >
          <div className="bg-[#0D1626] border border-[#1E3A5F]/40 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_60px_rgba(59,130,246,0.1)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#E2E8F0]">Profile</h2>
              <button
                onClick={() => setProfileOpen(false)}
                className="text-[#475569] hover:text-[#E2E8F0] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-[#64748B] text-xs uppercase tracking-wider block mb-1.5">First name</label>
                <input
                  type="text"
                  maxLength={50}
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 text-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all"
                />
              </div>
              <div>
                <label className="text-[#64748B] text-xs uppercase tracking-wider block mb-1.5">Last name</label>
                <input
                  type="text"
                  maxLength={50}
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-[#111D35] border border-[#1E3A5F] rounded-xl px-3 py-2.5 text-[#E2E8F0] text-sm focus:outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]/30 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full bg-gradient-to-r from-[#3B82F6] to-[#D4AF37] text-white font-semibold py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-sm mb-4"
            >
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>

            <div className="border-t border-[#1E3A5F]/40 pt-4">
              <p className="text-[#64748B] text-xs mb-3">Danger zone</p>
              <button
                onClick={handleResetSimulation}
                disabled={resetting}
                className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/25 text-[#EF4444] font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
              >
                {resetting ? "Resetting…" : "Reset Simulation"}
              </button>
              <p className="text-[#3B4A60] text-xs mt-2 text-center">
                Deletes all holdings &amp; transactions, restores $100,000
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
