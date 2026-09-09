import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { DashboardSummary, User, AdminSummary } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { 
  IndianRupee, Compass, Calendar, Plane, CreditCard, ArrowRight, 
  TrendingUp, Users, Search, Filter, Ticket, CheckCircle2, Shield, MapPin,
  CalendarCheck, BarChart3, Radio, Download
} from "lucide-react";
import { downloadBookingPDF } from "../utils/receipt";

interface DashboardViewProps {
  user: User;
  onNavigate: (tab: string) => void;
  onOpenFlightModal?: () => void;
}

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

export default function DashboardView({ user, onNavigate, onOpenFlightModal }: DashboardViewProps) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userDistributionViewMode, setUserDistributionViewMode] = useState<"cards" | "chart">("cards");

  // Dedicated Flight Analytics state
  const [flightData, setFlightData] = useState<any>(null);
  const [flightSearchQuery, setFlightSearchQuery] = useState("");
  const [selectedAirlineFilter, setSelectedAirlineFilter] = useState("All");

  const fetchSummary = async () => {
    try {
      const res = await fetch(`/api/analytics/summary/${user.id}`);
      if (!res.ok) throw new Error("Failed to load dashboard statistics");
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setSummary(data);
      } else {
        throw new Error("Received non-JSON response from server");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminSummary = async () => {
    if (user.role !== "admin") return;
    try {
      const res = await fetch("/api/analytics/admin");
      if (res.ok) {
        const data = await res.json();
        setAdminSummary(data);
      }
    } catch (err) {
      console.error("Failed to fetch admin summary", err);
    }
  };

  const fetchFlightAnalytics = async () => {
    try {
      const url = user.role === "admin" 
        ? "/api/analytics/flights" 
        : `/api/analytics/flights?userId=${user.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFlightData(data);
      }
    } catch (err) {
      console.error("Failed to fetch flight analytics", err);
    }
  };

  useEffect(() => {
    fetchSummary();
    if (user.role === "admin") {
      fetchAdminSummary();
    }
    fetchFlightAnalytics();
  }, [user.id, user.role]);

  // Format currency helper
  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500 font-medium animate-pulse text-sm">Calculating real-time analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-600 rounded-xl max-w-xl mx-auto my-12 text-sm">
        {error}
      </div>
    );
  }

  const budgetUsagePercent = summary && summary.totalBudget > 0 
    ? Math.min(Math.round((summary.totalSpend / summary.totalBudget) * 100), 100) 
    : 0;

  // Filter detailed passenger flight bookings
  const filteredBookings = (flightData?.detailedBookings || []).filter((b: any) => {
    if (!b) return false;
    const q = (flightSearchQuery || "").toLowerCase();
    const uName = (b.userName || "").toLowerCase();
    const uEmail = (b.userEmail || "").toLowerCase();
    const pnr = (b.pnr || "").toLowerCase();
    const flNum = (b.flightDetails?.flightNumber || "").toLowerCase();
    const airline = (b.flightDetails?.airline || "").toLowerCase();
    const orig = (b.flightDetails?.origin || "").toLowerCase();
    const dest = (b.flightDetails?.destination || "").toLowerCase();

    const matchesSearch = 
      uName.includes(q) ||
      uEmail.includes(q) ||
      pnr.includes(q) ||
      flNum.includes(q) ||
      airline.includes(q) ||
      orig.includes(q) ||
      dest.includes(q);

    const matchesAirline = 
      selectedAirlineFilter === "All" || 
      airline.includes((selectedAirlineFilter || "").toLowerCase());

    return matchesSearch && matchesAirline;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Upper header summary */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Namaste, {user.name}</h1>
          <p className="text-slate-500 text-sm mt-1">Here is the real-time financial and logistics overview of your journeys.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenFlightModal && user.role !== "admin" && (
            <button
              onClick={onOpenFlightModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
            >
              <Plane className="w-4 h-4" />
              <span>Book Flight</span>
            </button>
          )}
          {user.role === "admin" ? (
            <button 
              onClick={() => onNavigate("admin")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Desk Console</span>
            </button>
          ) : (
            <button 
              onClick={() => onNavigate("trips")}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Plan New Trip</span>
            </button>
          )}
        </div>
      </div>

      {/* Main KPI Stats Block */}
      {user.role === "admin" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered System Users</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {adminSummary?.userCount || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {adminSummary?.usersWithTripsCount || 0} trip bookers • {adminSummary?.usersWithFlightsCount || 0} flight bookers
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Booking Revenue</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <IndianRupee className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatINR(adminSummary?.totalBookingRevenue || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Flight Revenue: {formatINR(adminSummary?.flightRevenue || 0)}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active & Planned Expeditions</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <CalendarCheck className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {adminSummary?.tripCount || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {adminSummary?.activeTripsCount || 0} Active • {adminSummary?.plannedTripsCount || 0} Planned
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Flight Tickets Revenue</span>
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Plane className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600 tracking-tight">
              {formatINR(adminSummary?.flightRevenue || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Across all confirmed flight reservations</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Travel Budget</span>
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <IndianRupee className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatINR(summary?.totalBudget || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Cumulated across {summary?.tripsCount || 0} planned trips</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recorded Spend</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {formatINR(summary?.totalSpend || 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {budgetUsagePercent}% of total planned budget utilized
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active & Planned Trips</span>
              <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                <Calendar className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {summary?.activeTripsCount || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Current or upcoming expeditions</div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmed Bookings</span>
              <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                <Plane className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-800 tracking-tight">
              {summary?.upcomingBookingsCount || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Active transit, lodging & ticket tokens</div>
          </div>
        </div>
      )}

      {/* Budget Progress Bar for Regular Users */}
      {user.role !== "admin" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Financial Burn Rate Meter</span>
            <span className="text-sm font-semibold text-slate-600">
              {formatINR(summary?.totalSpend || 0)} / {formatINR(summary?.totalBudget || 0)}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsagePercent > 90 ? "bg-red-500" : budgetUsagePercent > 70 ? "bg-amber-500" : "bg-indigo-600"
              }`}
              style={{ width: `${budgetUsagePercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Keep tracking split balances inside individual trip boards to optimize stays and avoid budget overruns.
          </p>
        </div>
      )}

      {/* Real-Time Analytics Charts */}
      {user.role === "admin" ? (
        <div className="space-y-6">
          {/* Chart 1: How Many Users Booked Trips vs Flights */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>User Booking Distribution: How Many Users Booked Trips & Flights</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed breakdown comparing trips created/joined vs flight tickets booked by registered users.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Mode Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setUserDistributionViewMode("cards")}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      userDistributionViewMode === "cards"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    User Cards
                  </button>
                  <button
                    onClick={() => setUserDistributionViewMode("chart")}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      userDistributionViewMode === "chart"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Horizontal Chart
                  </button>
                </div>

                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  {adminSummary?.usersWithTripsCount || 0} Trip Bookers
                </span>
                <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
                  <Plane className="w-3.5 h-3.5" />
                  {adminSummary?.usersWithFlightsCount || 0} Flight Bookers
                </span>
              </div>
            </div>

            {userDistributionViewMode === "cards" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                {adminSummary?.userBookingChartData && adminSummary.userBookingChartData.length > 0 ? (
                  adminSummary.userBookingChartData.map((u, idx) => (
                    <div key={idx} className="bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-indigo-200 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.fullName} className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                                {u.fullName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <span className="font-extrabold text-slate-800 text-xs block leading-snug">{u.fullName}</span>
                              <span className="text-[11px] text-slate-400 font-medium block truncate max-w-[150px]">{u.email}</span>
                            </div>
                          </div>

                          {u.role && (
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                              u.role === "admin" ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-slate-200/80 text-slate-600"
                            }`}>
                              {u.role}
                            </span>
                          )}
                        </div>

                        {/* Visual metric progress representation */}
                        <div className="space-y-1.5 my-3">
                          <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                            <span>Activity Split</span>
                            <span className="text-slate-700 font-bold">{u.trips} Trips / {u.flights} Flights</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden flex">
                            <div 
                              className="h-full bg-indigo-600 transition-all duration-300"
                              style={{ width: `${u.trips + u.flights > 0 ? (u.trips / (u.trips + u.flights)) * 100 : 50}%` }}
                              title={`${u.trips} Trips`}
                            />
                            <div 
                              className="h-full bg-sky-500 transition-all duration-300"
                              style={{ width: `${u.trips + u.flights > 0 ? (u.flights / (u.trips + u.flights)) * 100 : 50}%` }}
                              title={`${u.flights} Flights`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-[10px] rounded-md flex items-center gap-1">
                            <Compass className="w-3 h-3 text-indigo-600" />
                            {u.trips} {u.trips === 1 ? "Trip" : "Trips"}
                          </span>
                          <span className="px-2 py-0.5 bg-sky-50 border border-sky-100 text-sky-700 font-extrabold text-[10px] rounded-md flex items-center gap-1">
                            <Plane className="w-3 h-3 text-sky-600" />
                            {u.flights} {u.flights === 1 ? "Flight" : "Flights"}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-semibold block">Total Spend</span>
                          <span className="text-xs font-black text-slate-800">
                            {formatINR(u.totalSpend)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-xs text-slate-400">
                    No user booking records found.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-72 w-full pt-2">
                {adminSummary?.userBookingChartData && adminSummary.userBookingChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      layout="vertical" 
                      data={adminSummary.userBookingChartData} 
                      margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                    >
                      <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="fullName" stroke="#64748B" fontSize={11} tickLine={false} width={110} />
                      <Tooltip 
                        formatter={(val: any, name: string) => [val, name === "trips" ? "Trips Created/Joined" : "Flight Tickets Booked"]}
                        labelFormatter={(label: any) => `User: ${label}`}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                      />
                      <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      <Bar dataKey="trips" name="Trips Booked" fill="#6366F1" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="flights" name="Flights Booked" fill="#0284C7" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                    No user booking metrics recorded yet.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chart 2 & Chart 3: Revenue Stream Breakdown & Active vs Planned Trips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Stream Breakdown Bar Chart */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-emerald-600" />
                <span>Revenue Breakdown by Stream (₹)</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">Flight Revenue vs Stays, Tours, and Transit Bookings.</p>

              <div className="h-60 w-full">
                {adminSummary?.revenueChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={adminSummary.revenueChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                      <XAxis dataKey="category" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip 
                        formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                        contentStyle={{ borderRadius: "10px", fontSize: "11px" }}
                      />
                      <Bar dataKey="revenue" fill="#10B981" radius={[6, 6, 0, 0]}>
                        {adminSummary.revenueChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No revenue metrics.</div>
                )}
              </div>
            </div>

            {/* Active vs Planned Trips Ratio Pie Chart */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-indigo-600" />
                  <span>Active vs Planned Expeditions Ratio</span>
                </h3>
                <p className="text-xs text-slate-400 mb-2">Live expeditions currently in progress vs upcoming planned trips.</p>
              </div>

              <div className="h-56 w-full my-auto flex items-center justify-center">
                {adminSummary?.tripsStatusChartData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={adminSummary.tripsStatusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="count"
                        nameKey="status"
                      >
                        {adminSummary.tripsStatusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [`${val} Expeditions`, "Count"]} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">No trip status data.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recharts: Trip comparison chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">Trip Budget vs. Spend Comparison</h3>
            </div>
            
            <div className="h-72 w-full mt-2">
              {summary && summary.tripChartData && summary.tripChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.tripChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [formatINR(Number(value)), ""]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }}
                    />
                    <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                    <Bar dataKey="Budget" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Spend" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                  No active trips. Create a trip to generate comparative metrics.
                </div>
              )}
            </div>
          </div>

          {/* Recharts: Category Breakdown pie chart */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 className="font-semibold text-slate-800 mb-4">Expense Category Split (₹)</h3>
            
            <div className="h-64 w-full flex-1 relative">
              {summary && summary.categoryData && summary.categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.categoryData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {summary.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatINR(Number(value))} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px", bottom: 0 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium text-center">
                  No recorded spend items yet. Add bookings or logging items to populate category splits.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HELPFUL QUICK NAVIGATION SHORTCUTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/60 hover:border-indigo-100 rounded-3xl p-5 transition-colors cursor-pointer flex flex-col justify-between shadow-sm" onClick={() => onNavigate("destinations")}>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Explore Destinations</h4>
            <p className="text-xs text-slate-500">Discover handpicked, premium locations across India like Munnar, Leh, and Jaipur.</p>
          </div>
          <div className="flex items-center text-xs font-semibold text-indigo-600 mt-4 group">
            Browse Catalog <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>

        {user.role === "admin" ? (
          <div className="bg-white border border-slate-200/60 hover:border-indigo-100 rounded-3xl p-5 transition-colors cursor-pointer flex flex-col justify-between shadow-sm" onClick={() => onNavigate("admin")}>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">Admin Desk Console</h4>
              <p className="text-xs text-slate-500">Manage global user accounts, review all guest bookings, and edit destination catalogs.</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-indigo-600 mt-4 group">
              Open Admin Console <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/60 hover:border-indigo-100 rounded-3xl p-5 transition-colors cursor-pointer flex flex-col justify-between shadow-sm" onClick={() => onNavigate("trips")}>
            <div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">Trip Planner & Expenses</h4>
              <p className="text-xs text-slate-500">Set budget thresholds, calculate co-traveler equal/unequal splits, and view settlements.</p>
            </div>
            <div className="flex items-center text-xs font-semibold text-indigo-600 mt-4 group">
              Open Trip Boards <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200/60 hover:border-indigo-100 rounded-3xl p-5 transition-colors cursor-pointer flex flex-col justify-between shadow-sm" onClick={() => onNavigate("profile")}>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm mb-1">Personal Settings</h4>
            <p className="text-xs text-slate-500">Configure emergency notifications, edit contact information, and specify travel styles.</p>
          </div>
          <div className="flex items-center text-xs font-semibold text-indigo-600 mt-4 group">
            Manage Profile <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>

      {/* FLIGHT BOOKINGS & PASSENGER ANALYTICS MODULE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Plane className="w-4.5 h-4.5" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">
                {user.role === "admin" ? "Flight Analytics & Passenger Bookings Ledger" : "My Flight Bookings & E-Tickets"}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {user.role === "admin" 
                ? "System-wide tracking showing which users booked which flights, total revenue per flight route, and full passenger ticket manifests." 
                : "Your personal flight booking summary, route breakdown, and verifiable e-tickets with PDF export."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate("tracker")}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live Flight Radar
            </button>
            <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" />
              {flightData?.totalFlightBookings || 0} {user.role === "admin" ? "Flight Tickets" : "My Ticket(s)"}
            </span>
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              {formatINR(flightData?.totalFlightRevenue || 0)} {user.role === "admin" ? "Flight Revenue" : "My Spend"}
            </span>
          </div>
        </div>

        {/* 1. FLIGHT SUMMARY CARDS */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>{user.role === "admin" ? "Flight Popularity & Booking Volume Breakdown" : "My Booked Flight Routes"}</span>
          </h3>

          {!flightData?.flightSummaries || flightData.flightSummaries.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              {user.role === "admin" ? "No flight bookings recorded in the system yet." : "You have no flight bookings recorded yet. Book a flight to view e-tickets!"}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flightData.flightSummaries.map((f: any, idx: number) => (
                <div key={idx} className="bg-slate-50/80 hover:bg-white border border-slate-200/80 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 bg-indigo-600 text-white font-mono font-bold text-xs rounded-lg shadow-2xs">
                      {f.airline} {f.flightNumber}
                    </span>
                    <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold text-xs rounded-full flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {user.role === "admin" 
                        ? `${f.totalBookings} ${f.totalBookings === 1 ? "User" : "Users"} Booked`
                        : `${f.totalBookings} ${f.totalBookings === 1 ? "Booking" : "Bookings"}`}
                    </span>
                  </div>

                  <div className="text-sm font-extrabold text-slate-800 mt-2">
                    {f.origin} ➔ {f.destination}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-400 font-semibold">{user.role === "admin" ? "Total Revenue:" : "Total Spend:"}</span>
                    <span className="font-extrabold text-emerald-600">{formatINR(f.totalRevenue)}</span>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/40">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {user.role === "admin" ? "Booked Passengers:" : "Traveler & PNR:"}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {f.passengers.map((p: any, pIdx: number) => (
                        <span key={pIdx} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] rounded-md shadow-2xs">
                          {p.userName} ({p.pnr})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. DETAILED PASSENGER FLIGHT DIRECTORY TABLE */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-blue-600" />
                <span>{user.role === "admin" ? "Detailed Passenger Flight Manifest" : "My Personal Flight Bookings Ledger"}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {user.role === "admin"
                  ? "Search or filter all system bookings by passenger name, email, airline, flight number, PNR, or city."
                  : "Search or filter your tickets by airline, flight number, PNR, or route."}
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={flightSearchQuery} 
                  onChange={(e) => setFlightSearchQuery(e.target.value)} 
                  placeholder="Search passenger, flight, PNR..." 
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-medium w-48 sm:w-60 outline-none transition-all"
                />
              </div>

              <select 
                value={selectedAirlineFilter} 
                onChange={(e) => setSelectedAirlineFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Airlines</option>
                <option value="IndiGo">IndiGo</option>
                <option value="Air India">Air India</option>
                <option value="Vistara">Vistara</option>
                <option value="Akasa Air">Akasa Air</option>
              </select>
            </div>
          </div>

          {/* Manifest Table */}
          <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5">Passenger Details</th>
                  <th className="py-3 px-3.5">Flight & Airline</th>
                  <th className="py-3 px-3.5">Route & Timing</th>
                  <th className="py-3 px-3.5">Ticket PNR</th>
                  <th className="py-3 px-3.5">User Preference</th>
                  <th className="py-3 px-3.5 text-right">Fare Paid</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-xs text-slate-400 font-medium">
                      No matching flight passenger tickets found for search query.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b: any) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {b.userAvatar ? (
                            <img src={b.userAvatar} alt={b.userName} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                              {b.userName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-slate-800 block leading-snug">{b.userName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{b.userEmail}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Plane className="w-3.5 h-3.5 text-blue-600" />
                          <span>{b.flightDetails.airline} ({b.flightDetails.flightNumber})</span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                          {b.flightDetails.cabinClass || "Economy"} Class • Seat {b.flightDetails.seatNumber || "Assigned"}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-slate-800">
                          {b.flightDetails.originCode || "DEL"} ➔ {b.flightDetails.destinationCode || "GOI"}
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                          {b.flightDetails.departureTime} • {b.date}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-700 text-[11px]">
                          {b.pnr}
                        </span>
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-bold">
                            {b.userFood || "Veg"}
                          </span>
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded text-[9px] font-bold capitalize">
                            {b.userStyle || "leisure"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5 text-right font-black text-slate-800">
                        {formatINR(b.cost)}
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmed
                          </span>
                          <button
                            onClick={() => {
                              const passengerUser = {
                                id: b.userId || "usr",
                                name: b.userName || "Passenger",
                                email: b.userEmail || "user@gmail.com",
                                phone: b.userPhone || "+91 98765 43210",
                                role: "user"
                              };
                              downloadBookingPDF(b, passengerUser as any);
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-extrabold transition-colors inline-flex items-center gap-1 active:scale-95 shadow-2xs"
                            title="Download PDF E-Ticket"
                          >
                            <Download className="w-3 h-3 text-indigo-600" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
