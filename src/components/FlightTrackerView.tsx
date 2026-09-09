import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LiveFlightTracker, User } from "../types";
import { 
  Plane, Search, Radio, Compass, Wind, Thermometer, 
  Clock, MapPin, AlertCircle, RefreshCw, CheckCircle2, 
  Layers, ShieldAlert, Navigation, ArrowRight, Zap, Luggage, Shield
} from "lucide-react";

interface FlightTrackerViewProps {
  user: User;
  initialQuery?: string;
  onNavigateToTrips?: () => void;
}

export default function FlightTrackerView({ user, initialQuery = "6E-204", onNavigateToTrips }: FlightTrackerViewProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [flightData, setFlightData] = useState<LiveFlightTracker | null>(null);
  const [radarFleet, setRadarFleet] = useState<LiveFlightTracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");
  const [simulatedBoost, setSimulatedBoost] = useState(0);

  // Fetch telemetry for single flight
  const fetchFlightTelemetry = async (queryToFetch: string, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/flights/track/${encodeURIComponent(queryToFetch)}`);
      if (!res.ok) throw new Error("Flight telemetry signal lost");
      const data: LiveFlightTracker = await res.json();
      setFlightData(data);
      setLastUpdatedTime(new Date().toLocaleTimeString());
    } catch (err: any) {
      if (!isSilent) setError(err.message || "Failed to load live flight telemetry.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  // Fetch active fleet list for radar overview
  const fetchRadarFleet = async () => {
    try {
      const res = await fetch("/api/flights/radar");
      if (res.ok) {
        const data = await res.json();
        setRadarFleet(data.radarFlights || []);
      }
    } catch (err) {
      console.error("Failed to fetch radar fleet", err);
    }
  };

  useEffect(() => {
    fetchFlightTelemetry(searchQuery);
    fetchRadarFleet();
  }, []);

  // Live stream interval auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchFlightTelemetry(searchQuery, true);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchFlightTelemetry(searchQuery.trim());
    }
  };

  const handleSelectPreset = (code: string) => {
    setSearchQuery(code);
    fetchFlightTelemetry(code);
  };

  const currentPercent = Math.min(98, (flightData?.telemetry.progressPercent || 50) + simulatedBoost);

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR & LIVE TRACKER SEARCH */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Plane className="w-80 h-80 text-white transform -rotate-12" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-extrabold uppercase tracking-widest mb-3 backdrop-blur-sm">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Real-Time Flight Radar Telemetry</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Live Flight Tracker & ATC Radar
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
            Track altitude, airspeed, heading, ETA, gate info, and baggage carousel updates for any flight or PNR in real time.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="mt-5 flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Flight No. (e.g. 6E-204, AI-102) or PNR Code (e.g. TH-A1B2C3)"
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Track Flight
            </button>
          </form>

          {/* Preset Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Popular Routes:</span>
            {[
              { label: "✈️ 6E-204 (DEL➔GOI)", code: "6E-204" },
              { label: "✈️ AI-102 (BOM➔DEL)", code: "AI-102" },
              { label: "✈️ UK-815 (BLR➔DEL)", code: "UK-815" },
              { label: "✈️ QP-1102 (BLR➔COK)", code: "QP-1102" }
            ].map((p) => (
              <button
                key={p.code}
                onClick={() => handleSelectPreset(p.code)}
                className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg text-[11px] text-slate-200 font-semibold transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIVE TELEMETRY CONTENT DISPLAY */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Connecting to Radar Telemetry Stream...</p>
          <p className="text-xs text-slate-400 mt-1">Interfacing with Air Traffic Control feeds</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-800 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Telemetry Connection Warning</h4>
            <p className="text-xs mt-0.5 text-red-700">{error}</p>
          </div>
        </div>
      ) : flightData ? (
        <div className="space-y-6">

          {/* HERO FLIGHT STATUS CARD */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Top row: Flight identity & live pulse badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shadow-2xs">
                  ✈️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">{flightData.airline} ({flightData.flightNumber})</h2>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                      PNR: {flightData.pnr}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Aircraft: <strong className="text-slate-700">{flightData.aircraftType}</strong> • Reg: <span className="font-mono text-slate-600">{flightData.registration}</span>
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-2xl ${flightData.statusBadge.bg} ${flightData.statusBadge.textClr} text-xs font-black flex items-center gap-2 border border-slate-200/50 shadow-2xs`}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                  </span>
                  <span>{flightData.statusBadge.text}</span>
                </div>

                {/* Auto Refresh Toggle */}
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    autoRefresh 
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                  title={autoRefresh ? "Live Telemetry Active (5s refresh)" : "Telemetry Auto-Refresh Paused"}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? "animate-spin text-indigo-600" : ""}`} />
                  <span className="hidden sm:inline">{autoRefresh ? "Live Stream ON" : "Paused"}</span>
                </button>
              </div>
            </div>

            {/* Origin -> Destination Flight Path View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5 sm:p-6">
              
              {/* Origin Airport */}
              <div>
                <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block mb-1">DEPARTURE</span>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{flightData.origin.code}</h3>
                <p className="text-xs font-bold text-slate-700">{flightData.origin.name}</p>
                
                <div className="mt-3 space-y-1 text-xs text-slate-500 font-medium">
                  <p>Terminal: <strong className="text-slate-800">{flightData.origin.terminal}</strong> • Gate: <strong className="text-slate-800">{flightData.origin.gate}</strong></p>
                  <p>Sched Dep: <span className="text-slate-700 font-semibold">{flightData.origin.scheduledDeparture}</span></p>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                    <Thermometer className="w-3 h-3 text-amber-500" /> {flightData.origin.weather.temp}, {flightData.origin.weather.condition} ({flightData.origin.weather.wind})
                  </p>
                </div>
              </div>

              {/* Animated Center Progress Track */}
              <div className="flex flex-col items-center justify-center px-2">
                <div className="text-center mb-2">
                  <span className="text-xs font-black text-indigo-600">{currentPercent}% Flight Completed</span>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {flightData.telemetry.distanceCoveredKm} km covered of {flightData.telemetry.totalDistanceKm} km
                  </span>
                </div>

                {/* Progress bar with airplane */}
                <div className="w-full relative py-3">
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-700 rounded-full" 
                      style={{ width: `${currentPercent}%` }}
                    />
                  </div>
                  <div 
                    className="absolute top-0.5 transition-all duration-700 transform -translate-x-1/2"
                    style={{ left: `${currentPercent}%` }}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
                      <Plane className="w-4 h-4 transform rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full text-[10px] font-extrabold text-slate-400 mt-1">
                  <span>{flightData.origin.code}</span>
                  <span className="text-indigo-600 font-bold">{flightData.telemetry.remainingMinutes} mins remaining</span>
                  <span>{flightData.destination.code}</span>
                </div>
              </div>

              {/* Destination Airport */}
              <div className="text-left md:text-right">
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest block mb-1">ARRIVAL</span>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{flightData.destination.code}</h3>
                <p className="text-xs font-bold text-slate-700">{flightData.destination.name}</p>
                
                <div className="mt-3 space-y-1 text-xs text-slate-500 font-medium">
                  <p>Terminal: <strong className="text-slate-800">{flightData.destination.terminal}</strong> • Gate: <strong className="text-slate-800">{flightData.destination.gate}</strong></p>
                  <p>Baggage Carousel: <strong className="text-emerald-700 font-bold">{flightData.destination.baggageClaim}</strong></p>
                  <p>Est. Arrival: <span className="text-slate-700 font-semibold">{flightData.destination.estimatedArrival}</span></p>
                  <p className="flex items-center gap-1 text-[11px] text-slate-500 pt-1 justify-start md:justify-end">
                    <Thermometer className="w-3 h-3 text-sky-500" /> {flightData.destination.weather.temp}, {flightData.destination.weather.condition}
                  </p>
                </div>
              </div>

            </div>

            {/* REAL-TIME TELEMETRY GAUGES GRID */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Real-Time Flight Telemetry Gauges</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Last signal: {lastUpdatedTime || "Just now"}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cruising Altitude</span>
                  <div className="text-xl font-black text-slate-800 tracking-tight mt-1 flex items-baseline gap-1">
                    {flightData.telemetry?.altitudeFt ? flightData.telemetry.altitudeFt.toLocaleString() : "36,000"} <span className="text-xs font-semibold text-slate-500">ft</span>
                  </div>
                  <span className="text-[10px] text-indigo-600 font-bold mt-1 block">Flight Level (FL360)</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ground Speed</span>
                  <div className="text-xl font-black text-slate-800 tracking-tight mt-1 flex items-baseline gap-1">
                    {flightData.telemetry?.speedKmph || 850} <span className="text-xs font-semibold text-slate-500">km/h</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold mt-1 block">Mach 0.78 Cruising</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compass Heading</span>
                  <div className="text-xl font-black text-slate-800 tracking-tight mt-1 flex items-baseline gap-1">
                    {flightData.telemetry?.headingDegrees || 220}° <span className="text-xs font-semibold text-slate-500">SW</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold mt-1 block">On Direct Route</span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining Distance</span>
                  <div className="text-xl font-black text-slate-800 tracking-tight mt-1 flex items-baseline gap-1">
                    {flightData.telemetry?.distanceRemainingKm || 450} <span className="text-xs font-semibold text-slate-500">km</span>
                  </div>
                  <span className="text-[10px] text-amber-600 font-bold mt-1 block">ETA in {flightData.telemetry?.remainingMinutes || 35} mins</span>
                </div>

              </div>
            </div>

            {/* SIMULATION & RADAR CONTROL TOOLS */}
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
                <div>
                  <h5 className="font-extrabold text-slate-800 text-xs">Simulate Real-Time Telemetry Progress</h5>
                  <p className="text-[11px] text-slate-500">Advance flight distance or refresh satellite position lock.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSimulatedBoost((prev) => (prev + 5) % 45)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Advance Flight (+5%)
                </button>

                <button
                  onClick={() => fetchFlightTelemetry(searchQuery)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-extrabold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Ping
                </button>
              </div>
            </div>

            {/* ATC & FLIGHT EVENTS LOG */}
            <div>
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Live ATC Flight Log & Advisory Feed</span>
              </h4>

              <div className="space-y-2">
                {flightData.events.map((evt, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 flex items-start gap-3">
                    <span className="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded text-[10px] font-mono font-bold mt-0.5">
                      {evt.time}
                    </span>
                    <p className="text-xs text-slate-700 font-medium leading-normal flex-1">
                      {evt.text}
                    </p>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ACTIVE AIRBORNE RADAR FLEET OVERVIEW GRID */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span>Active Airborne Flight Radar Fleet</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any active commercial flight in transit across Indian airspace to monitor live telemetry.
                </p>
              </div>

              <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                {radarFleet.length} Active Radar Signals
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
              {radarFleet.map((f, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSearchQuery(f.flightNumber);
                    setFlightData(f);
                  }}
                  className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                    flightData?.flightNumber === f.flightNumber 
                      ? "bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm" 
                      : "bg-slate-50/80 hover:bg-white border-slate-200 hover:border-indigo-200 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-slate-800 text-sm">{f.airline} ({f.flightNumber})</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${f.statusBadge.bg} ${f.statusBadge.textClr}`}>
                      {f.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 my-2">
                    <span>{f.origin.code}</span>
                    <Plane className="w-3.5 h-3.5 text-indigo-600 transform rotate-90" />
                    <span>{f.destination.code}</span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden my-2">
                    <div className="h-full bg-indigo-600" style={{ width: `${f.telemetry.progressPercent}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Alt: {f.telemetry.altitudeFt.toLocaleString()} ft</span>
                    <span>Speed: {f.telemetry.speedKmph} km/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
}
