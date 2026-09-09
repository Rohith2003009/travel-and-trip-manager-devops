import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Destination, User } from "../types";
import { 
  Compass, LayoutDashboard, MapPin, ClipboardList, 
  ArrowRight, Shield, IndianRupee, Key, Mail, Phone,
  Sparkles, Search, Calendar, ChevronRight, Lock, Eye, 
  RefreshCw, TrendingUp, DollarSign, Calculator, Check, Info, X
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import AuthView from "./AuthView";

interface HomeViewProps {
  onLoginSuccess: (user: User) => void;
}

// Interactive Play ledger default members
interface TempMember {
  name: string;
  weight: number;
  owes: number;
}

export default function HomeView({ onLoginSuccess }: HomeViewProps) {
  // Navigation inside landing page
  const [activeTab, setActiveTab] = useState<"explore" | "ledger" | "analytics">("explore");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loadingDestinations, setLoadingDestinations] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);

  // Playground splits state
  const [expenseTitle, setExpenseTitle] = useState("Local Sightseeing & Cab");
  const [expenseAmount, setExpenseAmount] = useState(4500);
  const [splitType, setSplitType] = useState<"equal" | "unequal">("equal");
  const [members, setMembers] = useState<TempMember[]>([
    { name: "You (Explorer)", weight: 1, owes: 1500 },
    { name: "Aarav Kumar", weight: 1, owes: 1500 },
    { name: "Neha Sharma", weight: 1, owes: 1500 },
  ]);

  // Analytics preview state
  const [activeAnalyticsTrip, setActiveAnalyticsTrip] = useState<"coastal" | "trek">("coastal");

  const analyticsTripsData = {
    coastal: {
      budget: 45000,
      spend: 38200,
      chart: [
        { name: "Transport (Flight/Cab)", Budget: 18000, Spend: 16500 },
        { name: "Resort Stay", Budget: 15000, Spend: 14000 },
        { name: "Beach Shacks & Food", Budget: 8000, Spend: 5200 },
        { name: "Water Sports", Budget: 4000, Spend: 2500 },
      ],
      categories: [
        { name: "Transport", value: 16500, color: "#4F46E5" },
        { name: "Lodging", value: 14000, color: "#10B981" },
        { name: "Food", value: 5200, color: "#F59E0B" },
        { name: "Activities", value: 2500, color: "#EF4444" },
      ]
    },
    trek: {
      budget: 32000,
      spend: 34100, // over budget to show alert
      chart: [
        { name: "Trek Permits & Guide", Budget: 10000, Spend: 12000 },
        { name: "Gear Rentals", Budget: 8000, Spend: 7500 },
        { name: "Homestays", Budget: 9000, Spend: 9000 },
        { name: "Rations & Food", Budget: 5000, Spend: 5600 },
      ],
      categories: [
        { name: "Permits & Guides", value: 12000, color: "#4F46E5" },
        { name: "Equipment", value: 7500, color: "#10B981" },
        { name: "Lodging", value: 9000, color: "#F59E0B" },
        { name: "Rations", value: 5600, color: "#EF4444" },
      ]
    }
  };

  // Fetch public destinations
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        setLoadingDestinations(true);
        const query = new URLSearchParams();
        if (search) query.append("q", search);
        if (category !== "All") query.append("category", category);
        
        const res = await fetch(`/api/destinations?${query.toString()}`);
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setDestinations(data);
          } else {
            console.warn("Failed to fetch public destinations: Expected JSON, received non-JSON (HTML/text)", res);
          }
        }
      } catch (err) {
        console.error("Failed to fetch public destinations:", err);
      } finally {
        setLoadingDestinations(false);
      }
    };
    fetchDestinations();
  }, [search, category]);

  // Recalculate playground splits
  useEffect(() => {
    let totalWeight = members.reduce((sum, m) => sum + (splitType === "equal" ? 1 : m.weight), 0);
    if (totalWeight <= 0) totalWeight = 1;

    const updated = members.map((m) => {
      const share = splitType === "equal" 
        ? 1 
        : m.weight;
      const calculated = Math.round((expenseAmount * share) / totalWeight);
      return { ...m, owes: calculated };
    });
    
    // Check if they are actually changing
    const different = updated.some((m, idx) => m.owes !== members[idx].owes);
    if (different) {
      setMembers(updated);
    }
  }, [expenseAmount, splitType, members]);

  const handleUpdateWeight = (idx: number, val: number) => {
    const updated = [...members];
    updated[idx].weight = Math.max(0, val);
    setMembers(updated);
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleOpenAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const currentAnalytics = analyticsTripsData[activeAnalyticsTrip];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased">
      
      {/* LANDING NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.reload()} title="Refresh page">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/10">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-base tracking-tight block leading-none">TravelHub</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 block">Indian Tour Ledger</span>
              </div>
            </div>

            {/* Quick links to sections */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setActiveTab("explore")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer ${
                  activeTab === "explore" 
                    ? "bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-100/60" 
                    : "text-slate-500 hover:bg-indigo-50/40 hover:text-indigo-600"
                }`}
              >
                <MapPin className="w-4 h-4 text-indigo-500" />
                Explore Places
              </button>
              <button 
                onClick={() => setActiveTab("analytics")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 hover:scale-105 active:scale-95 cursor-pointer ${
                  activeTab === "analytics" 
                    ? "bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-100/60" 
                    : "text-slate-500 hover:bg-indigo-50/40 hover:text-indigo-600"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                Analytics Preview
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleOpenAuth("login")}
                className="px-4 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Sign In
              </button>
              <button 
                onClick={() => handleOpenAuth("register")}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-indigo-600/15 hover:shadow-indigo-600/25"
              >
                Create Account
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* HERO HERO SECTION */}
      <section className="bg-white border-b border-slate-200/50 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100/60 rounded-full text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Empowering Co-Travelers Across India
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 tracking-tight leading-[1.15]">
            The Modern Ledger for <span className="text-indigo-600">Indian Group Expeditions</span>
          </h1>
          
          <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Plan, coordinate, and settle expenses in Indian Rupees (₹). Settle group tabs, track unequal bills, and discover premium Indian destinations in one seamless app.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => handleOpenAuth("register")}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5"
            >
              Start Your First Trip Ledger
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const element = document.getElementById("sandbox-module");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              Try Playground Sandbox
            </button>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION IN THE CONTAINER */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col" id="sandbox-module">
        
        {/* Module Segment Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab("explore")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "explore" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <MapPin className="w-4 h-4" />
              1. Browse Places ({destinations.length || 5}+ spots)
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "ledger" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Calculator className="w-4 h-4" />
              2. Interactive Splitter
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "analytics" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              3. Analytics & Budgets
            </button>
          </div>
        </div>

        {/* INTERACTIVE COMPONENT STAGE */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            
            {/* TAB 1: PUBLIC EXPLORER */}
            {activeTab === "explore" && (
              <motion.div
                key="explore-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Explore Curated Indian Escapes</h2>
                  <p className="text-slate-500 text-xs mt-1">Anyone can search and browse. Authenticate to schedule a travel board, coordinate with co-travelers, and log expenses.</p>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm max-w-4xl mx-auto">
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search spot or state (e.g., Munnar, Leh, Goa)..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 w-full sm:w-auto justify-end">
                    {["All", "Mountains", "Beaches", "Heritage", "Nature"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          category === cat 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                            : "text-slate-500 hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live public destinations listing */}
                {loadingDestinations ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Loading live Indian catalog...</p>
                  </div>
                ) : destinations.length === 0 ? (
                  <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl max-w-xl mx-auto">
                    <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">No destinations found matching your query</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching another term like mountains or beaches.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {destinations.slice(0, 6).map((dest) => (
                      <motion.div
                        key={dest.id}
                        layout
                        className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                        onClick={() => setSelectedDest(dest)}
                      >
                        <div className="relative h-44 bg-slate-100 overflow-hidden">
                          <img 
                            src={dest.imageUrl} 
                            alt={dest.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md">
                            {dest.category}
                          </div>
                        </div>

                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div>
                            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {dest.state}
                            </div>
                            <h3 className="text-base font-extrabold text-slate-800 mt-1">{dest.name}</h3>
                            <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                              {dest.description}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-xs text-slate-500 font-bold">
                              {dest.idealDays} Days Rec.
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wide block">Est. cost</span>
                              <span className="text-xs font-black text-indigo-600">{formatINR(dest.estimatedCost)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {destinations.length > 6 && (
                  <p className="text-center text-xs text-slate-400 font-bold">
                    ...and {destinations.length - 6} more gorgeous destinations available. Log in to explore the entire interactive map!
                  </p>
                )}
              </motion.div>
            )}

            {/* TAB 2: LEDGER PLAYGROUND */}
            {activeTab === "ledger" && (
              <motion.div
                key="ledger-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Interactive Ledger Splits Playground</h2>
                  <p className="text-slate-500 text-xs mt-1">Test unequal ratios and see co-traveler splits dynamically recalculate. Connect to save history and settle balances.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Controls Card */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">Sandbox Settings</h3>
                    
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Expense Name</label>
                      <input 
                        type="text" 
                        value={expenseTitle}
                        onChange={(e) => setExpenseTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Total Bill (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                        <input 
                          type="number" 
                          value={expenseAmount}
                          onChange={(e) => setExpenseAmount(Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Split Algorithm</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSplitType("equal")}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                            splitType === "equal" 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          Equal Split
                        </button>
                        <button
                          onClick={() => setSplitType("unequal")}
                          className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                            splitType === "unequal" 
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          Unequal (Ratios)
                        </button>
                      </div>
                    </div>

                    <div className="pt-2">
                      <div className="p-3 bg-amber-50 border border-amber-100/70 rounded-xl text-[11px] text-amber-700 leading-relaxed flex gap-2">
                        <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <strong>Equal splits</strong> divide the bill evenly. <strong>Unequal splits</strong> scale based on weights (e.g. food shares or days spent).
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Live Ledger Result Card */}
                  <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">Calculated Split Summary</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{expenseTitle || "General Expense"}</span>
                        </div>
                        <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">{formatINR(expenseAmount)}</span>
                      </div>

                      <div className="space-y-3">
                        {members.map((m, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/50 rounded-xl">
                            <div>
                              <span className="text-xs font-bold text-slate-700 block">{m.name}</span>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {splitType === "equal" 
                                  ? "Equal share (1/3)" 
                                  : `Ratio weight: ${m.weight}`}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              {splitType === "unequal" && (
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
                                  <span className="text-[9px] text-slate-400 font-bold px-1 uppercase">Weight</span>
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={m.weight} 
                                    onChange={(e) => handleUpdateWeight(idx, Number(e.target.value))}
                                    className="w-10 text-center font-bold text-xs focus:outline-none"
                                  />
                                </div>
                              )}
                              <span className="text-xs font-extrabold text-slate-800">{formatINR(m.owes)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span>Total Divided Balance</span>
                        <span className="font-bold text-slate-600">
                          {formatINR(members.reduce((sum, m) => sum + m.owes, 0))}
                        </span>
                      </div>

                      <div className="p-4 bg-indigo-50 border border-indigo-100/60 rounded-xl relative overflow-hidden">
                        <div className="absolute right-3 bottom-0 opacity-10">
                          <Lock className="w-16 h-16 text-indigo-900" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h5 className="text-xs font-black text-indigo-800">Ready to record group payments?</h5>
                            <p className="text-[10px] text-indigo-600 mt-0.5">Log in to invite friends, enter real payments, track settlement balances, and auto-generate who owes whom.</p>
                          </div>
                          <button 
                            onClick={() => handleOpenAuth("register")}
                            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-md shrink-0"
                          >
                            Sign Up & Save
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: ANALYTICS PREVIEW */}
            {activeTab === "analytics" && (
              <motion.div
                key="analytics-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                <div className="text-center max-w-xl mx-auto">
                  <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Interactive Financial Analytics Engine</h2>
                  <p className="text-slate-500 text-xs mt-1">TravelHub compiles planned trip budgets versus real expenditures to calculate burn rates. View the simulated sample dashboard below.</p>
                </div>

                {/* Sub toggle */}
                <div className="flex justify-center">
                  <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex gap-1">
                    <button
                      onClick={() => setActiveAnalyticsTrip("coastal")}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                        activeAnalyticsTrip === "coastal" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Trip Sample A: Goa Coastal Escape
                    </button>
                    <button
                      onClick={() => setActiveAnalyticsTrip("trek")}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${
                        activeAnalyticsTrip === "trek" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Trip Sample B: Himachal Trekking
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* KPI card 1 */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Allocated Budget</span>
                    <span className="text-2xl font-black text-slate-800 block">{formatINR(currentAnalytics.budget)}</span>
                    <p className="text-[11px] text-slate-400 mt-2">Planned maximum ceiling limit</p>
                  </div>
                  
                  {/* KPI card 2 */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Spent to Date</span>
                    <span className={`text-2xl font-black block ${currentAnalytics.spend > currentAnalytics.budget ? "text-red-500 animate-pulse" : "text-emerald-600"}`}>
                      {formatINR(currentAnalytics.spend)}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-2">
                      {currentAnalytics.spend > currentAnalytics.budget 
                        ? `⚠️ Budget exceeded by ${formatINR(currentAnalytics.spend - currentAnalytics.budget)}!`
                        : `Comfortable margins: ${formatINR(currentAnalytics.budget - currentAnalytics.spend)} remaining`}
                    </p>
                  </div>

                  {/* KPI card 3 */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Financial Burn Rate</span>
                      <span className="text-xl font-extrabold text-slate-700 block">
                        {Math.round((currentAnalytics.spend / currentAnalytics.budget) * 100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentAnalytics.spend > currentAnalytics.budget ? "bg-red-500" : "bg-indigo-600"
                        }`}
                        style={{ width: `${Math.min(100, (currentAnalytics.spend / currentAnalytics.budget) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Recharts comparison block */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Bar chart */}
                  <div className="md:col-span-3 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col h-72">
                    <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      Budget vs Spend Split by Category
                    </h4>
                    <div className="flex-1 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={currentAnalytics.chart}>
                          <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} />
                          <YAxis stroke="#94A3B8" fontSize={9} />
                          <Tooltip contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                          <Bar dataKey="Budget" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Spend" fill="#10B981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie chart */}
                  <div className="md:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-72">
                    <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider mb-1">Spend Category Split (₹)</h4>
                    <div className="flex-1 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={currentAnalytics.categories}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {currentAnalytics.categories.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatINR(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 text-[9px] font-bold text-slate-500 uppercase">
                      {currentAnalytics.categories.map((cat, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                          {cat.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-700">Detailed Analytics Locked</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Personal spending meters and group settle grids require active sessions.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenAuth("login")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all"
                  >
                    Unlock My Ledger Dashboard
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </section>

      {/* PUBLIC DESTINATION DETAIL PANEL MODAL */}
      <AnimatePresence>
        {selectedDest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedDest(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image banner */}
              <div className="h-64 w-full relative bg-slate-100">
                <img 
                  src={selectedDest.imageUrl} 
                  alt={selectedDest.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setSelectedDest(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 text-white bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/10">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-200">{selectedDest.state}</div>
                  <h2 className="text-2xl font-bold">{selectedDest.name}</h2>
                </div>
              </div>

              {/* Contents */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">About this spot</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{selectedDest.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Highlights */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-indigo-600 tracking-wider">Key Highlights</h4>
                    <ul className="space-y-1.5">
                      {selectedDest.highlights.map((h, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                          <Check className="w-3.5 h-3.5 text-indigo-500" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Major Attractions */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-emerald-600 tracking-wider">Must-See Attractions</h4>
                    <ul className="space-y-1.5">
                      {selectedDest.attractions.map((a, i) => (
                        <li key={i} className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                          <Compass className="w-3.5 h-3.5 text-emerald-500" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 mt-6">
                  <div>
                    <h4 className="text-xs font-extrabold text-indigo-900">Want to schedule expenses for {selectedDest.name}?</h4>
                    <p className="text-[10px] text-indigo-700/80 mt-0.5">Creating an account unlocks group splits, lodging/flight booking loggers, and budget indicators.</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDest(null);
                      handleOpenAuth("register");
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all"
                  >
                    Select and Plan
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL AUTH BLOCK MODAL (REUSING AUTHVIEW ENDPOINTS) */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md relative overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button overlay */}
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 z-50 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                title="Back to Landing Page"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="pt-4">
                <AuthView 
                  key={authMode}
                  initialMode={authMode}
                  onLoginSuccess={(user) => {
                    setShowAuthModal(false);
                    onLoginSuccess(user);
                  }} 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 font-medium space-y-1">
          <p>© {new Date().getFullYear()} TravelHub Inc. Indian Multi-Module Travel Ledger.</p>
          <p>Mock Sandbox and Public destinations directory secured in Indian Rupees (₹).</p>
        </div>
      </footer>

    </div>
  );
}
