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
import PortfolioHistoryChart from "../../components/portfolio-history-chart";
import StockSearch from "../../components/stock-search";
import { useTheme } from "../_utils/theme-context";

export default function Home() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
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

  // Tabs: "stock" | "portfolio"
  const [activeTab, setActiveTab] = useState(null);
  const [portfolioHistoryData, setPortfolioHistoryData] = useState([]);
  const [portfolioHistoryLoading, setPortfolioHistoryLoading] = useState(false);

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

  // ── Fetch portfolio history ────────────────────────────────────
  const fetchPortfolioHistory = useCallback(async (userId) => {
    setPortfolioHistoryLoading(true);
    try {
      const txSnap = await getDocs(query(collection(db, "transactions"), where("user_id", "==", userId)));
      const transactions = txSnap.docs.map(d => ({ ...d.data(), id: d.id }));

      // Sort transactions by created_at
      transactions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      const snapshots = [];
      let holdings = {}; // symbol -> { shares, totalCost, avgPrice }
      let balance = 100000; // Starting balance

      // Add initial snapshot
      snapshots.push({
        date: new Date().toISOString(),
        value: 100000,
        timestamp: new Date().getTime()
      });

      // Process each transaction
      for (const tx of transactions) {
        const txDate = new Date(tx.created_at);
        const price = tx.price_at_exec;
        const amount = price * tx.shares;

        if (tx.type === "buy") {
          balance -= amount;
          if (!holdings[tx.stock_symbol]) {
            holdings[tx.stock_symbol] = { shares: 0, totalCost: 0 };
          }
          holdings[tx.stock_symbol].shares += tx.shares;
          holdings[tx.stock_symbol].totalCost += amount;
          holdings[tx.stock_symbol].avgPrice = holdings[tx.stock_symbol].totalCost / holdings[tx.stock_symbol].shares;
        } else {
          balance += amount;
          if (holdings[tx.stock_symbol]) {
            holdings[tx.stock_symbol].shares -= tx.shares;
            if (holdings[tx.stock_symbol].shares === 0) {
              delete holdings[tx.stock_symbol];
            }
          }
        }

        // Portfolio value = cash + cost basis of holdings (conservative estimate)
        let portfolioValue = balance;
        for (let symbol in holdings) {
          if (holdings[symbol].shares > 0) {
            portfolioValue += holdings[symbol].totalCost;
          }
        }

        snapshots.push({
          date: txDate.toISOString(),
          value: Math.round(portfolioValue * 100) / 100,
          timestamp: txDate.getTime()
        });
      }

      // Format for chart (x = time as YYYY-MM-DD, y = value)
      const chartData = snapshots.map((s) => {
        const dateObj = new Date(s.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return {
          time: `${year}-${month}-${day}`,
          value: s.value,
          timestamp: s.timestamp
        };
      });

      // Remove duplicates for same date (keep latest)
      const uniqueData = [];
      let lastTime = null;
      for (const point of chartData) {
        if (point.time !== lastTime) {
          uniqueData.push(point);
          lastTime = point.time;
        } else {
          uniqueData[uniqueData.length - 1] = point;
        }
      }

      setPortfolioHistoryData(uniqueData);
      setActiveTab("portfolio");
    } catch (err) {
      console.error("Portfolio history fetch error:", err);
      alert("Failed to load portfolio history: " + err.message);
    } finally {
      setPortfolioHistoryLoading(false);
    }
  }, []);

  // ── Select a stock ─────────────────────────────────────────────
  const selectStock = useCallback(async (symbol) => {
    setSelectedSymbol(symbol);
    setActiveTab("stock");
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
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
        <span className="text-[var(--text-dim)] text-sm">Loading your portfolio…</span>
      </div>
    </div>
  );

  const totalPortfolioValue = totalValue + accountBalance;
  const portfolioGain = portfolio.reduce((s, h) => s + ((h.currentPrice - h.avgPrice) * h.shares), 0);

  return (
    <div className="h-screen bg-[var(--bg-base)] text-[var(--text-hi)] flex flex-col overflow-hidden">

      {/* ── Navbar ── */}
      <nav className="h-16 shrink-0 bg-[var(--bg-surface)]/80 backdrop-blur-xl border-b border-[var(--clr-border)]/40 flex items-center px-5 gap-4 z-50 relative">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--clr-border)]/40 transition-all shrink-0"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5 text-[var(--text-md)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <Image src="/assets/3384357_57661.svg" alt="Logo" width={30} height={30} priority className="drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          <span className="font-bold text-base bg-gradient-to-r from-[var(--clr-blue-lt)] to-[var(--clr-gold)] bg-clip-text text-transparent hidden sm:block">
            FREY TRADE
          </span>
        </div>

        <div className="flex-1 max-w-lg mx-4">
          <StockSearch onSelect={selectStock} />
        </div>

        <div className="flex items-center gap-3 ml-auto shrink-0">
          {userProfile.first_name && (
            <span className="hidden sm:block text-sm text-[var(--text-md)]">
              Welcome, <span className="text-[var(--text-hi)] font-medium">{userProfile.first_name}</span>
            </span>
          )}
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[11px] text-[var(--text-dim)] uppercase tracking-wider">Portfolio</span>
            <span className="font-semibold text-sm text-[var(--text-hi)]">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[11px] text-[var(--text-dim)] uppercase tracking-wider">Cash</span>
            <span className="font-semibold text-sm text-[var(--clr-green)]">
              ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Profile button */}
          <button
            onClick={openProfile}
            className="w-8 h-8 bg-[var(--clr-border)]/50 hover:bg-[var(--clr-border)] border border-[var(--clr-border)] rounded-full flex items-center justify-center transition-all"
            aria-label="Profile"
          >
            <svg className="w-4 h-4 text-[var(--text-md)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <button
            onClick={handleSignOut}
            className="bg-[var(--clr-red)]/10 hover:bg-[var(--clr-red)]/20 border border-[var(--clr-red)]/25 text-[var(--clr-red)] px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
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
          "w-64 shrink-0 bg-[var(--bg-sidebar)] border-r border-[var(--clr-border)]/30",
          "flex flex-col overflow-hidden",
          "z-40 md:z-auto",
          "transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}>
          {/* Summary cards */}
          <div className="p-4 space-y-3 border-b border-[var(--clr-border)]/30">
            <button
              onClick={() => user && fetchPortfolioHistory(user.uid)}
              className="w-full text-left bg-gradient-to-br from-[var(--clr-blue)]/10 to-[var(--clr-gold)]/10 border border-[var(--clr-blue)]/15 rounded-xl p-4 hover:border-[var(--clr-blue)]/35 hover:shadow-[0_0_12px_rgba(59,130,246,0.1)] transition-all group"
            >
              <p className="text-[var(--text-lo)] text-[11px] uppercase tracking-wider mb-1 group-hover:text-[var(--text-md)] transition-colors">Total Value</p>
              <p className="text-2xl font-bold text-[var(--text-hi)]">
                ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className={`text-xs font-medium mt-1 ${portfolioGain >= 0 ? "text-[var(--clr-green)]" : "text-[var(--clr-red)]"}`}>
                {portfolioGain >= 0 ? "+" : ""}${portfolioGain.toFixed(2)} all-time
              </p>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--bg-input)] rounded-xl p-3">
                <p className="text-[var(--text-lo)] text-[10px] uppercase tracking-wider mb-1">Invested</p>
                <p className="font-semibold text-sm text-[var(--clr-blue-lt)]">
                  ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-[var(--bg-input)] rounded-xl p-3">
                <p className="text-[var(--text-lo)] text-[10px] uppercase tracking-wider mb-1">Cash</p>
                <p className="font-semibold text-sm text-[var(--clr-green)]">
                  ${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Holdings list */}
          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-[var(--text-dim)] text-[10px] font-semibold uppercase tracking-widest mb-3">Holdings</p>

            {portfolio.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-10 h-10 bg-[var(--bg-input)] rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-[var(--text-dim)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-[var(--text-dim)] text-xs">No holdings yet.</p>
                <p className="text-[var(--text-ghost)] text-xs mt-1">Search a stock to begin.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {portfolio.map((h) => (
                  <button
                    key={h.ticker}
                    onClick={() => selectStock(h.ticker)}
                    className={`w-full text-left p-3 rounded-xl border transition-all group ${
                      selectedSymbol === h.ticker
                        ? "bg-[var(--clr-blue)]/10 border-[var(--clr-blue)]/35 shadow-[0_0_12px_rgba(59,130,246,0.1)]"
                        : "bg-[var(--bg-input)]/50 border-transparent hover:bg-[var(--bg-input)] hover:border-[var(--clr-border)]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-[var(--text-hi)]">{h.ticker}</span>
                        <p className="text-[var(--text-lo)] text-[11px] truncate max-w-[100px] mt-0.5">{h.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-[var(--text-hi)]">
                          ${h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className={`text-[11px] font-semibold mt-0.5 ${h.change >= 0 ? "text-[var(--clr-green)]" : "text-[var(--clr-red)]"}`}>
                          {h.change >= 0 ? "▲" : "▼"} {Math.abs(h.change).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] text-[var(--text-dim)]">
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
        <main className="flex-1 overflow-y-auto flex flex-col">

          {/* Tab Navigation */}
          {activeTab && (
            <div className="shrink-0 border-b border-[var(--clr-border)]/30 bg-[var(--bg-surface)]/50 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-4">
                {activeTab === "stock" && selectedSymbol && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--text-dim)] uppercase">Stock</span>
                    <h2 className="text-xl font-bold text-[var(--text-hi)]">
                      {stockLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
                          Loading {selectedSymbol}…
                        </span>
                      ) : (
                        selectedSymbol
                      )}
                    </h2>
                  </div>
                )}
                {activeTab === "portfolio" && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-[var(--text-dim)] uppercase">Portfolio</span>
                    <h2 className="text-xl font-bold text-[var(--text-hi)]">
                      {portfolioHistoryLoading ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
                          Loading History…
                        </span>
                      ) : (
                        "History"
                      )}
                    </h2>
                  </div>
                )}
                <button
                  onClick={() => {
                    setActiveTab(null);
                    setSelectedSymbol(null);
                  }}
                  className="ml-auto px-3 py-2 text-sm text-[var(--text-dim)] hover:text-[var(--text-hi)] hover:bg-[var(--clr-border)]/20 rounded-lg transition-all"
                >
                  ← Close
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">

            {/* Empty state */}
            {!activeTab && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-[var(--clr-blue)]/15 to-[var(--clr-gold)]/15 rounded-full flex items-center justify-center border border-[var(--clr-blue)]/15">
                  <svg className="w-12 h-12 text-[var(--clr-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[var(--clr-green)] rounded-full flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-hi)] mb-2">Pick a stock to get started</h2>
              <p className="text-[var(--text-dim)] max-w-xs text-sm leading-relaxed">
                Search for any stock using the bar above, or click a holding on the left to view its chart and trade.
              </p>
            </div>
          )}

            {/* Loading stock */}
            {activeTab === "stock" && stockLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--clr-blue)]/20 border-t-[var(--clr-blue)] rounded-full animate-spin" />
                <span className="text-[var(--text-dim)] text-sm">Fetching stock data…</span>
              </div>
            )}

            {/* Error */}
            {activeTab === "stock" && stockError && (
            <div className="h-full flex items-center justify-center">
              <div className="bg-[var(--clr-red)]/10 border border-[var(--clr-red)]/25 rounded-2xl p-6 text-center max-w-sm">
                <p className="text-[var(--clr-salmon)] font-medium mb-1">Failed to load {selectedSymbol}</p>
                <p className="text-[var(--text-lo)] text-sm">{stockError}</p>
                <button
                  onClick={() => selectStock(selectedSymbol)}
                  className="mt-4 px-4 py-2 bg-[var(--clr-red)]/15 hover:bg-[var(--clr-red)]/25 text-[var(--clr-salmon)] rounded-xl text-sm transition-all"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

            {/* Portfolio history view */}
            {activeTab === "portfolio" && !portfolioHistoryLoading && (
              <div className="p-6 space-y-5">
                {/* Chart */}
                <div className="bg-[var(--bg-surface)] border border-[var(--clr-border)]/30 rounded-2xl p-5">
                  {portfolioHistoryData.length > 0 ? (
                    <PortfolioHistoryChart data={portfolioHistoryData} />
                  ) : (
                    <div className="h-[380px] flex items-center justify-center text-[var(--text-dim)]">
                      No transactions yet. Make your first trade to see history.
                    </div>
                  )}
                </div>

                {/* Stats */}
                {portfolioHistoryData.length > 0 && (
                  <div className="bg-[var(--bg-surface)] border border-[var(--clr-border)]/30 rounded-2xl p-5">
                    <h3 className="font-semibold text-[var(--text-hi)] mb-4">Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[var(--text-lo)] text-[11px] uppercase tracking-wider mb-1">Current Value</p>
                        <p className="text-xl font-bold text-[var(--text-hi)]">
                          ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--text-lo)] text-[11px] uppercase tracking-wider mb-1">All-Time Gain</p>
                        <p className={`text-xl font-bold ${portfolioGain >= 0 ? "text-[var(--clr-green)]" : "text-[var(--clr-red)]"}`}>
                          ${portfolioGain.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--text-lo)] text-[11px] uppercase tracking-wider mb-1">Starting Balance</p>
                        <p className="text-xl font-bold text-[var(--text-hi)]">$100,000.00</p>
                      </div>
                      <div>
                        <p className="text-[var(--text-lo)] text-[11px] uppercase tracking-wider mb-1">Total Return</p>
                        <p className={`text-xl font-bold ${((totalPortfolioValue - 100000) / 100000) >= 0 ? "text-[var(--clr-green)]" : "text-[var(--clr-red)]"}`}>
                          {(((totalPortfolioValue - 100000) / 100000) * 100).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock detail */}
            {activeTab === "stock" && !stockLoading && !stockError && stockData && (
            <div className="p-6 space-y-5">

              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-extrabold text-[var(--text-hi)]">{stockData.symbol}</h1>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                      stockData.changes >= 0
                        ? "bg-[var(--clr-green)]/12 text-[var(--clr-green)] border border-[var(--clr-green)]/20"
                        : "bg-[var(--clr-red)]/12 text-[var(--clr-red)] border border-[var(--clr-red)]/20"
                    }`}>
                      {stockData.changes >= 0 ? "▲" : "▼"} {Math.abs(stockData.changes).toFixed(2)}%
                    </span>
                    <span className="text-[var(--text-dim)] text-sm px-2 py-1 bg-[var(--bg-input)] rounded-lg border border-[var(--clr-border)]">
                      {stockData.exchange}
                    </span>
                  </div>
                  <p className="text-[var(--text-md)] mt-1.5">{stockData.companyName}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-extrabold text-[var(--text-hi)]">${stockData.price.toFixed(2)}</p>
                  {currentShares > 0 && (
                    <p className="text-[var(--clr-blue-lt)] text-sm mt-1">
                      You own <strong>{currentShares}</strong> share{currentShares !== 1 ? "s" : ""}
                      {" "}· <strong>${(currentShares * stockData.price).toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              </div>

              {/* Chart */}
              <div className="bg-[var(--bg-surface)] border border-[var(--clr-border)]/30 rounded-2xl p-5">
                {historicalData.length > 0
                  ? <TradingChart data={historicalData} />
                  : <div className="h-[380px] flex items-center justify-center text-[var(--text-dim)]">No chart data available</div>
                }
              </div>

              {/* Trade + Stats */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                {/* Trade panel */}
                <div className="bg-[var(--bg-surface)] border border-[var(--clr-border)]/30 rounded-2xl p-5">
                  <h3 className="font-semibold text-[var(--text-hi)] mb-4">Trade {stockData.symbol}</h3>

                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        className="px-3 py-2.5 text-[var(--text-md)] hover:text-[var(--text-hi)] hover:bg-[var(--clr-border)]/40 transition-all text-lg font-bold"
                      >−</button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 bg-transparent text-center text-[var(--text-hi)] font-semibold focus:outline-none py-2.5 text-sm"
                      />
                      <button
                        onClick={() => setQuantity(q => q + 1)}
                        className="px-3 py-2.5 text-[var(--text-md)] hover:text-[var(--text-hi)] hover:bg-[var(--clr-border)]/40 transition-all text-lg font-bold"
                      >+</button>
                    </div>
                    <div className="text-sm text-[var(--text-lo)]">
                      Total: <span className="text-[var(--text-hi)] font-semibold">${(quantity * stockData.price).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleTransaction("buy")}
                      disabled={transacting}
                      className="bg-[var(--clr-green)] hover:opacity-85 active:scale-[0.97] disabled:opacity-40 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] text-sm"
                    >
                      {transacting ? "…" : `Buy ${quantity} Share${quantity > 1 ? "s" : ""}`}
                    </button>
                    <button
                      onClick={() => handleTransaction("sell")}
                      disabled={transacting || currentShares < quantity}
                      className="bg-[var(--clr-red)] hover:opacity-85 active:scale-[0.97] disabled:opacity-30 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] text-sm"
                    >
                      {transacting ? "…" : `Sell ${quantity} Share${quantity > 1 ? "s" : ""}`}
                    </button>
                  </div>

                  {currentShares > 0 && currentShares < quantity && (
                    <p className="text-[var(--clr-amber)] text-xs mt-3 text-center">
                      You only own {currentShares} share{currentShares !== 1 ? "s" : ""}
                    </p>
                  )}

                  <div className="mt-5 pt-4 border-t border-[var(--clr-border)]/30 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between text-[var(--text-lo)]">
                      <span>Avg cost</span>
                      <span className="text-[var(--text-hi)]">
                        {currentShares > 0
                          ? `$${portfolio.find(h => h.ticker === selectedSymbol)?.avgPrice?.toFixed(2) ?? "—"}`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-[var(--text-lo)]">
                      <span>Cash left</span>
                      <span className="text-[var(--clr-green)]">${accountBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Stats panel */}
                <div className="bg-[var(--bg-surface)] border border-[var(--clr-border)]/30 rounded-2xl p-5">
                  <h3 className="font-semibold text-[var(--text-hi)] mb-4">Key Statistics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Market Cap",  value: `$${(stockData.mktCap / 1e9).toFixed(2)}B` },
                      { label: "Avg Volume",  value: `${(stockData.volAvg / 1e6).toFixed(1)}M` },
                      { label: "Beta",        value: stockData.beta != null ? Number(stockData.beta).toFixed(2) : "N/A" },
                      { label: "Open",        value: stockData.open != null ? `$${Number(stockData.open).toFixed(2)}` : "N/A" },
                      { label: "Prev Close",  value: stockData.previousClose != null ? `$${Number(stockData.previousClose).toFixed(2)}` : "N/A" },
                      { label: "Exchange",    value: stockData.exchange ?? "N/A" },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-[var(--bg-input)] rounded-xl p-3 border border-[var(--clr-border)]/20">
                        <p className="text-[var(--text-lo)] text-[11px] uppercase tracking-wider mb-1">{label}</p>
                        <p className="font-semibold text-[var(--text-hi)] text-sm">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* ── Profile Modal ── */}
      {profileOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setProfileOpen(false); }}
        >
          <div className="bg-[var(--bg-surface)] border border-[var(--clr-border)]/40 rounded-2xl p-6 w-full max-w-sm shadow-[0_0_60px_rgba(59,130,246,0.1)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--text-hi)]">Profile</h2>
              <button
                onClick={() => setProfileOpen(false)}
                className="text-[var(--text-dim)] hover:text-[var(--text-hi)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Theme toggle */}
            <div className="flex items-center justify-between bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-4 py-3 mb-6">
              <span className="text-[var(--text-hi)] text-sm font-medium">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </span>
              <button
                onClick={toggleTheme}
                className="w-8 h-8 bg-[var(--bg-surface)] hover:bg-[var(--clr-border)]/40 border border-[var(--clr-border)] rounded-full flex items-center justify-center transition-all"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg className="w-4 h-4 text-[var(--clr-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-[var(--clr-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-[var(--text-lo)] text-xs uppercase tracking-wider block mb-1.5">First name</label>
                <input
                  type="text"
                  maxLength={50}
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-3 py-2.5 text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--clr-blue)] focus:ring-1 focus:ring-[var(--clr-blue)]/30 transition-all"
                />
              </div>
              <div>
                <label className="text-[var(--text-lo)] text-xs uppercase tracking-wider block mb-1.5">Last name</label>
                <input
                  type="text"
                  maxLength={50}
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-[var(--bg-input)] border border-[var(--clr-border)] rounded-xl px-3 py-2.5 text-[var(--text-hi)] text-sm focus:outline-none focus:border-[var(--clr-blue)] focus:ring-1 focus:ring-[var(--clr-blue)]/30 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full bg-gradient-to-r from-[var(--clr-blue)] to-[var(--clr-gold)] text-white font-semibold py-2.5 rounded-xl hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 text-sm mb-4"
            >
              {savingProfile ? "Saving…" : "Save Changes"}
            </button>

            <div className="border-t border-[var(--clr-border)]/40 pt-4">
              <p className="text-[var(--text-lo)] text-xs mb-3">Danger zone</p>
              <button
                onClick={handleResetSimulation}
                disabled={resetting}
                className="w-full bg-[var(--clr-red)]/10 hover:bg-[var(--clr-red)]/20 border border-[var(--clr-red)]/25 text-[var(--clr-red)] font-medium py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
              >
                {resetting ? "Resetting…" : "Reset Simulation"}
              </button>
              <p className="text-[var(--text-ghost)] text-xs mt-2 text-center">
                Deletes all holdings &amp; transactions, restores $100,000
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
