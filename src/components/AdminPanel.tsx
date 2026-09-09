import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, Booking, AdminSummary } from "../types";
import { 
  Users, Plane, Check, X, Shield, Trash2, Calendar, 
  TrendingUp, Award, Compass, Sparkles, RefreshCw
} from "lucide-react";

interface AdminPanelProps {
  user: User;
  onNavigateToDestinations: () => void;
}

export default function AdminPanel({ user, onNavigateToDestinations }: AdminPanelProps) {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [bookingsList, setBookingsList] = useState<any[]>([]);
  const [adminSummary, setAdminSummary] = useState<AdminSummary | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"users" | "bookings" | "system">("users");

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const [uRes, bRes, sRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/bookings/all"),
        fetch("/api/analytics/admin")
      ]);

      if (uRes.ok) setUsersList(await uRes.json());
      if (bRes.ok) setBookingsList(await bRes.json());
      if (sRes.ok) setAdminSummary(await sRes.json());
      
    } catch (err) {
      console.error("Error loading admin information", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === "admin") {
      fetchAdminData();
    }
  }, [user.id]);

  const handleUpdateRole = async (targetUserId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/users/${targetUserId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to update user role");
    }
  };

  const handleDeleteUser = async (targetUserId: string) => {
    if (targetUserId === user.id) {
      alert("You cannot delete your own administrative account!");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this user profile? All linked trips will be wiped.")) return;
    try {
      const res = await fetch(`/api/users/${targetUserId}`, { method: "DELETE" });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to delete user profile");
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to approve booking status");
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to cancel/reject booking status");
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  if (user.role !== "admin") {
    return (
      <div className="p-12 text-center bg-red-50 border border-red-200 text-red-600 rounded-xl font-semibold max-w-lg mx-auto text-sm">
        Access Denied. Administrative clearance is required to view this module.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-24 text-slate-500 animate-pulse text-sm">
        Retrieving administrator oversight logs...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Oversight Command Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Platform-wide control over registered users, active holiday bookings, and travel catalogs.</p>
        </div>
        <button 
          onClick={fetchAdminData}
          className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors self-start"
          title="Refresh Platform Logs"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Admin KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Users</span>
          <span className="text-xl font-bold text-slate-800">{adminSummary?.userCount || 0}</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Catalog Destinations</span>
          <span className="text-xl font-bold text-slate-800">{adminSummary?.destinationCount || 0}</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Bookings Audited</span>
          <span className="text-xl font-bold text-slate-800">{adminSummary?.bookingCount || 0}</span>
        </div>
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-sm">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Booking Revenue</span>
          <span className="text-xl font-bold text-emerald-600">{formatINR(adminSummary?.totalBookingRevenue || 0)}</span>
        </div>
      </div>

      {/* Inner Subtabs */}
      <div className="border-b border-slate-200 flex gap-4">
        <button
          onClick={() => setActiveSubTab("users")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === "users" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Manage Users ({usersList.length})
        </button>
        <button
          onClick={() => setActiveSubTab("bookings")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === "bookings" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Manage Bookings ({bookingsList.length})
        </button>
        <button
          onClick={() => setActiveSubTab("system")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeSubTab === "system" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          System Analytics
        </button>
      </div>

      {/* ------------------------------------------- */}
      {/* SUBTAB: MANAGE USERS */}
      {/* ------------------------------------------- */}
      {activeSubTab === "users" && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Registered Travelers</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">System Role</th>
                  <th className="p-4">Emergency Contact</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 font-medium text-slate-600">
                    <td className="p-4 font-bold text-slate-800">{u.name}</td>
                    <td className="p-4">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === "admin" ? "bg-purple-50 text-purple-600" : "bg-slate-100 text-slate-600"
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">{u.emergencyContact || "—"}</td>
                    <td className="p-4 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => handleUpdateRole(u.id, u.role)}
                        className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded"
                        title="Promote or Demote user role"
                      >
                        Toggle Admin
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Wipe User account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------- */}
      {/* SUBTAB: MANAGE BOOKINGS */}
      {/* ------------------------------------------- */}
      {activeSubTab === "bookings" && (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Transit & Stay Reservation Ledgers</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4">Traveler</th>
                  <th className="p-4">Trip Assigned</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Particular Details</th>
                  <th className="p-4">Price (INR)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Oversight Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookingsList.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 font-medium text-slate-600">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{b.userName}</div>
                      <div className="text-[10px] text-slate-400">{b.userEmail}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{b.tripTitle}</td>
                    <td className="p-4 uppercase text-[10px] font-bold text-slate-500">{b.type}</td>
                    <td className="p-4">{b.detailName}</td>
                    <td className="p-4 font-bold text-slate-800">{formatINR(b.cost)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        b.status === "confirmed" ? "bg-emerald-50 text-emerald-600" :
                        b.status === "pending" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-1">
                      {b.status === "pending" && (
                        <button
                          onClick={() => handleApproveBooking(b.id)}
                          className="p-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded"
                          title="Confirm Token"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {b.status !== "cancelled" && (
                        <button
                          onClick={() => handleRejectBooking(b.id)}
                          className="p-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded"
                          title="Cancel/Reject Token"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------- */}
      {/* SUBTAB: SYSTEM ANALYTICS */}
      {/* ------------------------------------------- */}
      {activeSubTab === "system" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Popular Destinations List */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4 flex items-center gap-1">
              <Compass className="w-4.5 h-4.5 text-blue-600" />
              Most Visited Catalog Spots
            </h3>
            
            <div className="space-y-4">
              {adminSummary?.popularDestinations && adminSummary.popularDestinations.length > 0 ? (
                adminSummary.popularDestinations.map((pd, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-semibold text-slate-700 text-xs">#{index + 1} {pd.name}</span>
                    <span className="text-xs font-bold text-blue-600">{pd.trips} active trips</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  No vacation bookings logged across India yet.
                </div>
              )}
            </div>
          </div>

          {/* Quick Admin Actions Box */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3 flex items-center gap-1">
                <Award className="w-4.5 h-4.5 text-purple-600" />
                Administrative Shortcuts
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                As an administrator, you have full catalog controls. Add, modify, or remove handpicked holiday spots (like Ladakh or Varanasi) directly on the Destinations page.
              </p>
            </div>
            <button
              onClick={onNavigateToDestinations}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              Open Destination Manager
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
