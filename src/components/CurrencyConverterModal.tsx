import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  DollarSign, ArrowRightLeft, Globe, Calculator, 
  X, RefreshCw, TrendingUp, Info, Check, Shield
} from "lucide-react";

interface CurrencyConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAmount?: number;
}

const EXCHANGE_RATES: { [key: string]: { name: string; symbol: string; rateToINR: number; flag: string } } = {
  INR: { name: "Indian Rupee", symbol: "₹", rateToINR: 1.0, flag: "🇮🇳" },
  USD: { name: "US Dollar", symbol: "$", rateToINR: 83.5, flag: "🇺🇸" },
  EUR: { name: "Euro", symbol: "€", rateToINR: 90.8, flag: "🇪🇺" },
  GBP: { name: "British Pound", symbol: "£", rateToINR: 108.2, flag: "🇬🇧" },
  AED: { name: "UAE Dirham", symbol: "AED ", rateToINR: 22.7, flag: "🇦🇪" },
  SGD: { name: "Singapore Dollar", symbol: "S$", rateToINR: 62.1, flag: "🇸🇬" },
  THB: { name: "Thai Baht", symbol: "฿", rateToINR: 2.3, flag: "🇹🇭" },
  JPY: { name: "Japanese Yen", symbol: "¥", rateToINR: 0.54, flag: "🇯🇵" },
};

export default function CurrencyConverterModal({ isOpen, onClose, initialAmount = 10000 }: CurrencyConverterModalProps) {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [fromCurrency, setFromCurrency] = useState<string>("INR");
  const [toCurrency, setToCurrency] = useState<string>("USD");
  const [activeTab, setActiveTab] = useState<"converter" | "rates">("converter");

  if (!isOpen) return null;

  // Convert amount from `fromCurrency` to INR, then from INR to `toCurrency`
  const amountInINR = amount * EXCHANGE_RATES[fromCurrency].rateToINR;
  const convertedAmount = amountInINR / EXCHANGE_RATES[toCurrency].rateToINR;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const formatValue = (val: number) => {
    return val.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Travel Forex & Currency Calculator</h2>
                <p className="text-[11px] text-slate-300 font-medium">Instant conversion & international travel rate index</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-100 bg-slate-50/80 px-5 pt-3">
            <button
              onClick={() => setActiveTab("converter")}
              className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 ${
                activeTab === "converter"
                  ? "border-indigo-600 text-indigo-600 bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Converter & Calculator
            </button>
            <button
              onClick={() => setActiveTab("rates")}
              className={`px-4 py-2 font-bold text-xs rounded-t-xl transition-all border-b-2 ${
                activeTab === "rates"
                  ? "border-indigo-600 text-indigo-600 bg-white shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Live Rate Cards (INR Base)
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5">
            {activeTab === "converter" ? (
              <>
                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                    Enter Amount to Convert
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-400 text-base">
                      {EXCHANGE_RATES[fromCurrency].symbol}
                    </span>
                    <input
                      type="number"
                      value={amount || ""}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-extrabold text-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* From / Swap / To Row */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      From Currency
                    </label>
                    <select
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.keys(EXCHANGE_RATES).map((code) => (
                        <option key={code} value={code}>
                          {EXCHANGE_RATES[code].flag} {code} - {EXCHANGE_RATES[code].name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 flex justify-center pt-5">
                    <button
                      onClick={handleSwap}
                      className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-all shadow-xs active:scale-95 border border-indigo-100"
                      title="Swap currencies"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="col-span-5">
                    <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">
                      To Currency
                    </label>
                    <select
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {Object.keys(EXCHANGE_RATES).map((code) => (
                        <option key={code} value={code}>
                          {EXCHANGE_RATES[code].flag} {code} - {EXCHANGE_RATES[code].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Converted Output Display Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-purple-50/40 to-slate-50 border border-indigo-100/80 shadow-xs relative overflow-hidden">
                  <div className="text-xs font-bold text-indigo-900/60 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <span>Equivalent Value</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-extrabold">
                      Live Estimate
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      {EXCHANGE_RATES[toCurrency].symbol} {formatValue(convertedAmount)}
                    </span>
                    <span className="text-xs font-extrabold text-indigo-600">
                      {toCurrency}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-indigo-100/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>
                      1 {fromCurrency} = {formatValue(EXCHANGE_RATES[fromCurrency].rateToINR / EXCHANGE_RATES[toCurrency].rateToINR)} {toCurrency}
                    </span>
                    <span className="text-slate-400">0% markup preview</span>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">
                    Quick Budget Calculations
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[5000, 10000, 25000, 50000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset)}
                        className={`py-2 px-1 rounded-xl text-xs font-extrabold transition-all border ${
                          amount === preset
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        ₹{preset.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Rate Cards View */
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500 mb-2">
                  Standard exchange benchmark against 1 Indian Rupee (₹1 INR):
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {Object.keys(EXCHANGE_RATES).map((code) => {
                    const item = EXCHANGE_RATES[code];
                    if (code === "INR") return null;
                    const valInForeign = 1 / item.rateToINR;
                    return (
                      <div
                        key={code}
                        className="p-3 bg-slate-50 hover:bg-white border border-slate-200 rounded-2xl flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.flag}</span>
                          <div>
                            <div className="text-xs font-black text-slate-800">{item.name} ({code})</div>
                            <div className="text-[10px] text-slate-500 font-semibold">1 {code} = ₹{item.rateToINR} INR</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-indigo-600">
                            ₹1,000 = {item.symbol}{formatValue(1000 / item.rateToINR)}
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">Base Benchmark</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Traveler Forex Reference</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all active:scale-95"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
