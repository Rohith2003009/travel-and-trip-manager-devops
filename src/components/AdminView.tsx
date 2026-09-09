import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { User, Destination, Booking, AdminSummary } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { 
  Users, MapPin, ClipboardList, Shield, UserX, 
  UserCheck, Trash2, ArrowUpRight, TrendingUp, Compass, CheckCircle, XCircle, Pencil, X,
  Plane, Ticket, IndianRupee, PieChart as PieIcon, BarChart3, CalendarCheck,
  Database, Server, RefreshCw, AlertTriangle
} from "lucide-react";

const CHART_COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899"];

interface AdminViewProps {
  user: User;
  onNavigateToDestinations: () => void;
}

export default function AdminView({ user, onNavigateToDestinations }: AdminViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Tab states: "analytics" | "users" | "bookings" | "database"
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "users" | "bookings" | "database">("analytics");
  const [userDistributionViewMode, setUserDistributionViewMode] = useState<"cards" | "chart">("cards");

  // MongoDB Connection State
  const [dbStatus, setDbStatus] = useState<{
    mode: string;
    mongoConnected: boolean;
    mongoError: string | null;
    uriConfigured: boolean;
    dbName: string;
    counts: { users: number; destinations: number; trips: number; bookings: number; expenses: number };
  } | null>(null);
  const [customMongoUri, setCustomMongoUri] = useState("");
  const [connectingDb, setConnectingDb] = useState(false);
  const [mongoMessage, setMongoMessage] = useState({ type: "", text: "" });

  const fetchDbStatus = async () => {
    try {
      const res = await fetch("/api/db/status");
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch DB status", err);
    }
  };

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMongoUri.trim()) return;
    try {
      setConnectingDb(true);
      setMongoMessage({ type: "", text: "" });
      const res = await fetch("/api/db/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uri: customMongoUri.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setMongoMessage({ type: "success", text: data.message || "Successfully connected to MongoDB database!" });
        setDbStatus(data.status);
      } else {
        setMongoMessage({ type: "error", text: data.error || "Failed to connect to MongoDB" });
        if (data.status) setDbStatus(data.status);
      }
    } catch (err: any) {
      setMongoMessage({ type: "error", text: err.message });
    } finally {
      setConnectingDb(false);
    }
  };

  // State for sandbox-safe user deletion confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit User details state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormName, setEditFormName] = useState("");
  const [editFormAvatarUrl, setEditFormAvatarUrl] = useState("");
  const [editFormPhone, setEditFormPhone] = useState("");
  const [editFormEmergencyContact, setEditFormEmergencyContact] = useState("");
  const [editFormPreferredStyle, setEditFormPreferredStyle] = useState("");
  const [editFormLocation, setEditFormLocation] = useState("");
  const [editFormBio, setEditFormBio] = useState("");
  const [editFormFoodPreference, setEditFormFoodPreference] = useState("");
  const [editFormPaymentMethod, setEditFormPaymentMethod] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const handleStartEdit = (item: User) => {
    setEditingUser(item);
    setEditFormName(item.name || "");
    setEditFormAvatarUrl(item.avatarUrl || "");
    setEditFormPhone(item.phone || "");
    setEditFormEmergencyContact(item.emergencyContact || "");
    setEditFormPreferredStyle(item.preferredStyle || "leisure");
    setEditFormLocation(item.location || "");
    setEditFormBio(item.bio || "");
    setEditFormFoodPreference(item.foodPreference || "Veg");
    setEditFormPaymentMethod(item.paymentMethod || "UPI");
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditSubmitting(true);
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editFormName,
          avatarUrl: editFormAvatarUrl,
          phone: editFormPhone,
          emergencyContact: editFormEmergencyContact,
          preferredStyle: editFormPreferredStyle,
          location: editFormLocation,
          bio: editFormBio,
          foodPreference: editFormFoodPreference,
          paymentMethod: editFormPaymentMethod
        })
      });
      if (!res.ok) throw new Error("Failed to update user profile");
      const updatedUser = await res.json();
      
      // Update local state
      setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
      setEditingUser(null);
      fetchAdminData(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const fetchAdminData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      // Fetch DB status
      fetchDbStatus();

      // Fetch users
      const usersRes = await fetch("/api/users");
      const usersData = await usersRes.json();
      setUsers(usersData);

      // Fetch bookings
      const bookingsRes = await fetch("/api/bookings/all");
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);

      // Fetch admin stats summary
      const summaryRes = await fetch("/api/analytics/admin");
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

    } catch (err: any) {
      setError("Failed to load admin stats");
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateRole = async (targetUserId: string, newRole: "user" | "admin") => {
    try {
      const res = await fetch(`/api/users/${targetUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error("Failed to change user access authority");
      
      // Update local state
      setUsers(users.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      fetchAdminData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (targetUserId === user.id) {
      alert("You cannot delete your own administrative session!");
      return;
    }
    
    try {
      const res = await fetch(`/api/users/${targetUserId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Profile deletion failed");
      
      setUsers(users.filter(u => u.id !== targetUserId));
      setConfirmDeleteId(null);
      fetchAdminData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: "confirmed" | "cancelled" | "pending") => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update booking status");
      
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status } : b));
      fetchAdminData(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 font-medium animate-pulse text-sm">Opening administrative control panel...</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Administrative Control Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Global audit panels for verifying accounts, reviewing bookings, and optimizing destination catalogs.</p>
      </div>

      {/* Admin KPI Bento Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Users</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{summary?.userCount || 0}</div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">System Accounts</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Bookings</span>
            <ClipboardList className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{summary?.bookingCount || 0}</div>
          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase mt-1">
            <span className="text-emerald-600">{summary?.bookingStatuses?.confirmed || 0} Confirmed</span>
            <span>•</span>
            <span className="text-amber-500">{summary?.bookingStatuses?.pending || 0} Pending</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Destinations Catalog</span>
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{summary?.destinationCount || 0}</div>
          <button 
            onClick={onNavigateToDestinations}
            className="text-[10px] text-indigo-600 hover:underline font-bold uppercase mt-1 inline-flex items-center gap-0.5"
          >
            Manage Catalog →
          </button>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Booking Revenue</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatINR(summary?.totalBookingRevenue || 0)}
          </div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase">Excludes local food splits</span>
        </div>
      </div>

      {/* Main Grid: Management Tab Lists & Popular Locations side column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left and Middle column: User/Booking/Analytics Managers (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          {/* Internal Tab Headers */}
          <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-6 py-4 flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveSubTab("analytics")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeSubTab === "analytics" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Analytics & Charts
              </button>

              <button
                onClick={() => setActiveSubTab("users")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeSubTab === "users" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Guest Directory
              </button>

              <button
                onClick={() => setActiveSubTab("bookings")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeSubTab === "bookings" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                Global Booking Desk
              </button>

              <button
                onClick={() => setActiveSubTab("database")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                  activeSubTab === "database" 
                    ? "bg-emerald-600 text-white shadow-xs" 
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                MongoDB Database
                {dbStatus?.mongoConnected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </button>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">
              Secure Operations Console
            </span>
          </div>

          {/* Dynamic Content */}
          <div className="p-6 flex-1 overflow-x-auto">
            {activeSubTab === "analytics" ? (
              <div className="space-y-6">
                {/* 1. HOW MANY USERS BOOKED TRIPS VS FLIGHTS CHART */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>User Booking Distribution: Trips vs Flights</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Breakdown showing how many trips and flight tickets each registered user has booked.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* View Switcher */}
                      <div className="flex bg-slate-200/70 p-0.5 rounded-lg border border-slate-300/60">
                        <button
                          onClick={() => setUserDistributionViewMode("cards")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all ${
                            userDistributionViewMode === "cards"
                              ? "bg-white text-indigo-700 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          User Cards
                        </button>
                        <button
                          onClick={() => setUserDistributionViewMode("chart")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all ${
                            userDistributionViewMode === "chart"
                              ? "bg-white text-indigo-700 shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Horizontal Chart
                        </button>
                      </div>

                      <span className="px-2.5 py-1 bg-indigo-100/80 text-indigo-800 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                        <Compass className="w-3 h-3 text-indigo-600" />
                        {summary?.usersWithTripsCount || 0} Trip Bookers
                      </span>
                      <span className="px-2.5 py-1 bg-blue-100/80 text-blue-800 rounded-lg text-[10px] font-extrabold flex items-center gap-1">
                        <Plane className="w-3 h-3 text-blue-600" />
                        {summary?.usersWithFlightsCount || 0} Flight Bookers
                      </span>
                    </div>
                  </div>

                  {userDistributionViewMode === "cards" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {summary?.userBookingChartData && summary.userBookingChartData.length > 0 ? (
                        summary.userBookingChartData.map((u, idx) => (
                          <div key={idx} className="bg-white border border-slate-200/90 hover:border-indigo-200 rounded-xl p-3.5 shadow-2xs transition-all flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {u.avatarUrl ? (
                                    <img src={u.avatarUrl} alt={u.fullName} className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shadow-2xs">
                                      {u.fullName.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-extrabold text-slate-800 text-xs block leading-tight">{u.fullName}</span>
                                    <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[140px]">{u.email}</span>
                                  </div>
                                </div>

                                {u.role && (
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                    u.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {u.role}
                                  </span>
                                )}
                              </div>

                              {/* Progress bar split */}
                              <div className="space-y-1 my-2.5">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                  <span>Activity Split</span>
                                  <span className="text-slate-700">{u.trips} Trips / {u.flights} Flights</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                                  <div 
                                    className="h-full bg-indigo-600"
                                    style={{ width: `${u.trips + u.flights > 0 ? (u.trips / (u.trips + u.flights)) * 100 : 50}%` }}
                                  />
                                  <div 
                                    className="h-full bg-sky-500"
                                    style={{ width: `${u.trips + u.flights > 0 ? (u.flights / (u.trips + u.flights)) * 100 : 50}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[9px] rounded flex items-center gap-0.5">
                                  <Compass className="w-2.5 h-2.5" />
                                  {u.trips}
                                </span>
                                <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 font-extrabold text-[9px] rounded flex items-center gap-0.5">
                                  <Plane className="w-2.5 h-2.5" />
                                  {u.flights}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] font-black text-slate-800">
                                  ₹{u.totalSpend.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-6 text-xs text-slate-400">
                          No user records found.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 w-full pt-2">
                      {summary?.userBookingChartData && summary.userBookingChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            layout="vertical"
                            data={summary.userBookingChartData} 
                            margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                          >
                            <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} allowDecimals={false} />
                            <YAxis type="category" dataKey="fullName" stroke="#64748B" fontSize={10} tickLine={false} width={100} />
                            <Tooltip 
                              formatter={(val: any, name: string) => [val, name === "trips" ? "Trips Created/Joined" : "Flight Tickets Booked"]}
                              labelFormatter={(label: any) => `User: ${label}`}
                              contentStyle={{ borderRadius: "10px", border: "1px solid #E2E8F0", fontSize: "11px" }}
                            />
                            <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                            <Bar dataKey="trips" name="Trips Booked" fill="#6366F1" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="flights" name="Flights Booked" fill="#0284C7" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                          No user booking data recorded yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. REVENUE BREAKDOWN & FLIGHT REVENUE CHART */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Revenue by Category Bar Chart */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                    <h4 className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Revenue Breakdown by Stream</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-3">Comparing flight revenue vs stay and activity bookings.</p>

                    <div className="h-52 w-full">
                      {summary?.revenueChartData ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={summary.revenueChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                            <XAxis dataKey="category" stroke="#64748B" fontSize={10} tickLine={false} />
                            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                            <Tooltip 
                              formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]}
                              contentStyle={{ borderRadius: "8px", fontSize: "11px" }}
                            />
                            <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]}>
                              {summary.revenueChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs">No revenue data.</div>
                      )}
                    </div>
                  </div>

                  {/* Active vs Planned Trips Pie Chart */}
                  <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4">
                    <h4 className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Active vs Planned Trips Ratio</span>
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-3">Distribution of active expeditions vs upcoming planned trips.</p>

                    <div className="h-52 w-full flex items-center justify-center">
                      {summary?.tripsStatusChartData ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={summary.tripsStatusChartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="count"
                              nameKey="status"
                            >
                              {summary.tripsStatusChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(val: any) => [`${val} Trips`, "Count"]} />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs">No trip data.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeSubTab === "users" ? (
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Name</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3 text-center">Style Style</th>
                    <th className="pb-3 text-center">Authority Role</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-2.5">
                          {item.avatarUrl ? (
                            <img 
                              src={item.avatarUrl} 
                              alt={item.name} 
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase border border-indigo-100">
                              {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{item.phone || "No phone added"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 font-medium">{item.email}</td>
                      <td className="py-3.5 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/50 rounded text-[10px] font-bold uppercase">
                          {item.preferredStyle || "leisure"}
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.role === "admin" ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {item.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1 whitespace-nowrap">
                        {confirmDeleteId === item.id ? (
                          <div className="inline-flex items-center gap-1.5 bg-red-50/50 p-1 rounded-md border border-red-100 animate-in fade-in zoom-in-95 duration-150">
                            <span className="text-[10px] text-red-600 font-medium">Delete profile?</span>
                            <button
                              onClick={() => handleDeleteUser(item.id)}
                              className="px-2 py-0.5 text-[9px] font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-0.5 text-[9px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="px-2 py-1 text-[10px] font-bold text-emerald-600 border border-emerald-100 rounded hover:bg-emerald-50 transition-all inline-flex items-center gap-0.5"
                              title="Edit Profile Details"
                            >
                              <Pencil className="w-3 h-3" />
                              Edit Profile
                            </button>
                            {item.role !== "admin" && (
                              <button
                                onClick={() => setConfirmDeleteId(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors inline-flex items-center justify-center align-middle"
                                title="Remove Profile"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeSubTab === "bookings" ? (
              /* Global Bookings Control desk */
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="pb-3 pl-2">Lead Guest</th>
                    <th className="pb-3">Trip Context</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3 text-right">Cost (₹)</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Verify Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-3.5 pl-2">
                        <p className="font-bold text-slate-800">{booking.userName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{booking.userEmail}</p>
                      </td>
                      <td className="py-3.5 font-semibold text-slate-700">{booking.tripTitle}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1">
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase rounded">
                            {booking.type}
                          </span>
                          <span className="font-semibold">{booking.detailName}</span>
                        </div>
                        {booking.flightDetails && (
                          <div className="text-[10px] text-blue-700 font-bold mt-1 flex items-center gap-1.5">
                            <span>✈️ {booking.flightDetails.airline} ({booking.flightDetails.flightNumber})</span>
                            <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded font-mono text-[9px]">
                              PNR: {booking.pnr || booking.flightDetails.pnr}
                            </span>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">Date: {booking.date}</p>
                      </td>
                      <td className="py-3.5 text-right font-extrabold text-indigo-600">{formatINR(booking.cost)}</td>
                      <td className="py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          booking.status === "confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          booking.status === "cancelled" ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1">
                        {booking.status === "pending" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, "confirmed")}
                            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded transition-colors"
                            title="Confirm Booking"
                          >
                            <CheckCircle className="w-4 h-4 inline" />
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(booking.id, "cancelled")}
                            className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                            title="Cancel Booking"
                          >
                            <XCircle className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* MongoDB Compass Database Management Panel */
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base">Real World MongoDB Compass / Atlas Database</h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            dbStatus?.mongoConnected 
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}>
                            {dbStatus?.mongoConnected ? "Connected to MongoDB" : "Local JSON Store Mode"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Connect MongoDB Compass locally (<code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300 font-mono">mongodb://localhost:27017/tripcraft</code>) or MongoDB Atlas cluster.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={fetchDbStatus}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh Connection Status
                    </button>
                  </div>
                </div>

                {/* MongoDB Collections Count Grid */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">Synchronized MongoDB Collections</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { name: "Users", count: dbStatus?.counts?.users || 0, icon: "👥", col: "users" },
                      { name: "Destinations", count: dbStatus?.counts?.destinations || 0, icon: "📍", col: "destinations" },
                      { name: "Trips", count: dbStatus?.counts?.trips || 0, icon: "🗺️", col: "trips" },
                      { name: "Bookings", count: dbStatus?.counts?.bookings || 0, icon: "🎟️", col: "bookings" },
                      { name: "Expenses", count: dbStatus?.counts?.expenses || 0, icon: "💰", col: "expenses" }
                    ].map((c) => (
                      <div key={c.name} className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-center">
                        <span className="text-lg">{c.icon}</span>
                        <div className="text-xl font-black text-slate-800 mt-1">{c.count}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{c.name} Docs</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MongoDB URI Input Form */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800">Connect Your MongoDB Compass / Atlas URI</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter your connection string from MongoDB Compass or Atlas. The database engine will automatically create & seed the <code className="text-indigo-600 font-bold font-mono">tripcraft</code> database.
                    </p>
                  </div>

                  <form onSubmit={handleConnectMongo} className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Server className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={customMongoUri}
                          onChange={(e) => setCustomMongoUri(e.target.value)}
                          placeholder="e.g. mongodb://localhost:27017/tripcraft or mongodb+srv://username:password@cluster.mongodb.net/tripcraft"
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={connectingDb || !customMongoUri.trim()}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-shrink-0"
                      >
                        {connectingDb ? "Testing Connection..." : "Connect & Sync Database"}
                      </button>
                    </div>

                    {/* Quick Presets for MongoDB Compass */}
                    <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400">
                      <span className="font-bold">Compass Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setCustomMongoUri("mongodb://localhost:27017/tripcraft")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 font-mono text-slate-700 font-semibold cursor-pointer"
                      >
                        Local Compass (mongodb://localhost:27017/tripcraft)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomMongoUri("mongodb://127.0.0.1:27017/tripcraft")}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 font-mono text-slate-700 font-semibold cursor-pointer"
                      >
                        Local IP (127.0.0.1)
                      </button>
                    </div>

                    {/* Alert Message */}
                    {mongoMessage.text && (
                      <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        mongoMessage.type === "success" 
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                        {mongoMessage.type === "success" ? "✅" : "⚠️"} {mongoMessage.text}
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Popular destinations bento card (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-950 rounded-3xl p-6 text-white shadow-lg space-y-4 relative overflow-hidden">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Popular Catalog Destinations</h3>
            
            <div className="space-y-3 pt-2">
              {summary?.popularDestinations && summary.popularDestinations.length > 0 ? (
                summary.popularDestinations.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-lg text-indigo-400">#0{i+1}</span>
                      <span className="text-xs font-bold text-slate-100">{p.name}</span>
                    </div>
                    <span className="text-[10px] font-extrabold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                      {p.trips} trips
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 font-medium">No active trip statistics recorded yet.</p>
              )}
            </div>

            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={onNavigateToDestinations}
                className="w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1"
              >
                Edit Destinations List
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Ambient visual glow */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mb-10 -mr-10 blur-2xl"></div>
          </div>
        </div>

      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto text-slate-800">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-lg w-full shadow-xl border border-slate-100 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-50 border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-sm">Edit User Profile: {editingUser.name}</h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Form */}
            <form onSubmit={handleSaveUserEdit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* User Avatar */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Profile Photo (Avatar URL)</label>
                <div className="flex items-center gap-4 mb-3">
                  {editFormAvatarUrl ? (
                    <img 
                      src={editFormAvatarUrl} 
                      alt="Avatar Preview" 
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-400">
                      N/A
                    </div>
                  )}
                  <input
                    type="text"
                    value={editFormAvatarUrl}
                    onChange={(e) => setEditFormAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                {/* Preset Avatar Selection */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] text-slate-400 mr-1 font-medium">Presets:</span>
                  {[
                    { name: "Hiker", url: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=150&q=80" },
                    { name: "Beachy", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=150&q=80" },
                    { name: "Backpacker", url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=150&q=80" },
                    { name: "Explorer", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=150&q=80" },
                    { name: "Photographer", url: "https://images.unsplash.com/photo-1452784444945-3f422708fe5e?auto=format&fit=crop&w=150&q=80" }
                  ].map((av) => (
                    <button
                      key={av.name}
                      type="button"
                      onClick={() => setEditFormAvatarUrl(av.url)}
                      className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        editFormAvatarUrl === av.url ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {av.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFormName}
                    onChange={(e) => setEditFormName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                {/* Email (Readonly) */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Email (Read-only)</label>
                  <input
                    type="email"
                    disabled
                    value={editingUser.email}
                    className="w-full px-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editFormPhone}
                    onChange={(e) => setEditFormPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                {/* Emergency Contact */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editFormEmergencyContact}
                    onChange={(e) => setEditFormEmergencyContact(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Preferred Style */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Preferred Style</label>
                  <select
                    value={editFormPreferredStyle}
                    onChange={(e) => setEditFormPreferredStyle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="leisure">Leisure</option>
                    <option value="adventure">Adventure</option>
                    <option value="heritage">Heritage</option>
                    <option value="pilgrimage">Pilgrimage</option>
                    <option value="nature">Nature</option>
                  </select>
                </div>
                {/* Location */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Location</label>
                  <input
                    type="text"
                    value={editFormLocation}
                    onChange={(e) => setEditFormLocation(e.target.value)}
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Food Preference */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Food Preference</label>
                  <select
                    value={editFormFoodPreference}
                    onChange={(e) => setEditFormFoodPreference(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Jain">Jain</option>
                  </select>
                </div>
                {/* Payment Method */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={editFormPaymentMethod}
                    onChange={(e) => setEditFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="UPI">UPI Payment</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Cash">Cash Ledger</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Bio / Travel Philosophy</label>
                <textarea
                  value={editFormBio}
                  onChange={(e) => setEditFormBio(e.target.value)}
                  placeholder="Tell us about their travel interests..."
                  rows={2}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {editSubmitting ? "Saving..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
