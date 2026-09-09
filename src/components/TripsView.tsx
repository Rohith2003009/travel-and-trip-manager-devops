import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trip, Destination, Booking, Expense, User, Settlement, PaymentDetails } from "../types";
import { downloadBookingVoucher, downloadBookingPDF } from "../utils/receipt";
import ReceiptModal from "./ReceiptModal";
import PaymentModal from "./PaymentModal";
import FlightBookingModal from "./FlightBookingModal";
import CurrencyConverterModal from "./CurrencyConverterModal";
import PackingListModal from "./PackingListModal";
import { 
  Calendar, IndianRupee, Trash2, Edit, Plus, X, MapPin, 
  Users, CreditCard, ChevronRight, MessageSquare, Info, 
  ArrowRight, ShieldCheck, CheckCircle, HelpCircle, UserPlus, Sparkles, PieChart as PieChartIcon,
  Plane, FileText, QrCode, Receipt, Download, Eye, Luggage, ArrowRightLeft
} from "lucide-react";

interface TripsViewProps {
  user: User;
  selectedDestinationFromExplore?: Destination | null;
  onClearExploreSelection?: () => void;
}

export default function TripsView({ user, selectedDestinationFromExplore, onClearExploreSelection }: TripsViewProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  
  // Trip Detail state
  const [tripDetail, setTripDetail] = useState<(Trip & { bookings: Booking[]; expenses: Expense[] }) | null>(null);
  const [splitSummary, setSplitSummary] = useState<{ balances: any; settlements: Settlement[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Forms open/close states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Flight & Payment & Receipt Modals & Special Tools
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showPaymentForBooking, setShowPaymentForBooking] = useState(false);
  const [activeReceiptBooking, setActiveReceiptBooking] = useState<Booking | null>(null);
  const [showForexModal, setShowForexModal] = useState(false);
  const [showPackingModal, setShowPackingModal] = useState(false);

  // Create/Edit Trip Form Input States
  const [title, setTitle] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState(30000);
  const [membersInput, setMembersInput] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  // Add Booking Form Input States
  const [bookingType, setBookingType] = useState<"flight" | "hotel" | "activity" | "cab">("flight");
  const [bookingDetailName, setBookingDetailName] = useState("");
  const [bookingCost, setBookingCost] = useState(5000);
  const [bookingDate, setBookingDate] = useState("");

  // Add Expense Form Input States
  const [expenseAmount, setExpenseAmount] = useState(2000);
  const [expenseCategory, setExpenseCategory] = useState<"food" | "transport" | "lodging" | "sightseeing" | "misc">("food");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [expensePaidBy, setExpensePaidBy] = useState("");
  const [expenseSplitType, setExpenseSplitType] = useState<"equal" | "unequal">("equal");
  const [unequalShares, setUnequalShares] = useState<{ [name: string]: number }>({});

  // Inline Confirmation States (prevents iframe window.confirm blocking)
  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState<string | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);
  const [showConfirmDeleteTrip, setShowConfirmDeleteTrip] = useState(false);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/trips/${user.id}`);
      if (!res.ok) throw new Error("Failed to load your trips list");
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setTrips(data);
      } else {
        throw new Error("Received non-JSON response from server");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDestinations = async () => {
    try {
      const res = await fetch("/api/destinations");
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setDestinations(data);
          if (data.length > 0 && !destinationId) {
            setDestinationId(data[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrips();
    fetchDestinations();
  }, [user.id]);

  // Handle triggered destination from Explore
  useEffect(() => {
    if (selectedDestinationFromExplore) {
      setTitle(`Vacation in ${selectedDestinationFromExplore.name}`);
      setDestinationId(selectedDestinationFromExplore.id);
      setBudget(selectedDestinationFromExplore.estimatedCost);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date(Date.now() + selectedDestinationFromExplore.idealDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setMembersInput(user.name);
      setIsCreateOpen(true);
      if (onClearExploreSelection) {
        onClearExploreSelection();
      }
    }
  }, [selectedDestinationFromExplore]);

  const loadTripDetails = async (tripId: string) => {
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/trips/detail/${tripId}`);
      if (!res.ok) throw new Error("Could not load trip assets");
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setTripDetail(data);

        // Set booking and expense dates defaults
        setBookingDate(data.startDate);
        setExpenseDate(data.startDate);
        if (data.members.length > 0) {
          setExpensePaidBy(data.members[0]);
          // Initialize equal unequal shares
          const initialShares: { [n: string]: number } = {};
          data.members.forEach((m: string) => {
            initialShares[m] = Math.round(2000 / data.members.length);
          });
          setUnequalShares(initialShares);
        }

        // Fetch expenses & settlements computed dynamically
        const splitRes = await fetch(`/api/expenses/${tripId}`);
        if (splitRes.ok) {
          const splitContentType = splitRes.headers.get("content-type");
          if (splitContentType && splitContentType.includes("application/json")) {
            const splitData = await splitRes.json();
            setSplitSummary(splitData);
          }
        }
      } else {
        throw new Error("Received non-JSON response from server");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (activeTripId) {
      loadTripDetails(activeTripId);
    } else {
      setTripDetail(null);
      setSplitSummary(null);
    }
  }, [activeTripId]);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const members = membersInput.split(",")
      .map(m => m.trim())
      .filter(m => m.length > 0);

    if (members.length === 0) {
      setError("Please add at least one member (e.g. yourself)");
      return;
    }

    const payload = {
      title,
      destinationId,
      userId: user.id,
      startDate,
      endDate,
      budget: Number(budget),
      members,
      notes
    };

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to create new trip ledger");
      const newTrip = await res.json();
      
      setIsCreateOpen(false);
      setTitle("");
      setMembersInput("");
      setNotes("");
      fetchTrips();
      // Auto open newly created trip
      setActiveTripId(newTrip.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDetail) return;
    setError("");

    const members = membersInput.split(",")
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const payload = {
      title,
      startDate,
      endDate,
      budget: Number(budget),
      members,
      notes
    };

    try {
      const res = await fetch(`/api/trips/${tripDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Could not update trip options");
      setIsEditOpen(false);
      loadTripDetails(tripDetail.id);
      fetchTrips();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete trip");
      setShowConfirmDeleteTrip(false);
      setActiveTripId(null);
      fetchTrips();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDetail) return;
    if (bookingType === "flight") {
      setIsAddBookingOpen(false);
      setShowFlightModal(true);
      return;
    }
    // Launch payment modal before saving non-flight booking
    setShowPaymentForBooking(true);
  };

  const handleBookingPaymentCompleted = async (paymentDetails: PaymentDetails) => {
    if (!tripDetail) return;

    const payload = {
      tripId: tripDetail.id,
      userId: user.id,
      type: bookingType,
      detailName: bookingDetailName,
      cost: paymentDetails.totalPaid,
      date: bookingDate,
      paymentDetails
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to register booking payment");
      const created: Booking = await res.json();
      setIsAddBookingOpen(false);
      setShowPaymentForBooking(false);
      setBookingDetailName("");
      loadTripDetails(tripDetail.id);
      setActiveReceiptBooking(created);
    } catch (err: any) {
      alert(err.message);
      setShowPaymentForBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
      });

      if (!res.ok) throw new Error("Could not cancel booking");
      setConfirmCancelBookingId(null);
      if (tripDetail) loadTripDetails(tripDetail.id);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripDetail) return;

    // Build splits details
    let splitsToSubmit = {};
    if (expenseSplitType === "unequal") {
      splitsToSubmit = unequalShares;
      const sum = (Object.values(unequalShares) as number[]).reduce((a, b) => a + b, 0);
      if (Math.abs(sum - expenseAmount) > 2) {
        alert(`Sum of split shares (${sum} ₹) must match total amount (${expenseAmount} ₹) exactly.`);
        return;
      }
    }

    const payload = {
      tripId: tripDetail.id,
      userId: user.id,
      amount: Number(expenseAmount),
      category: expenseCategory,
      description: expenseDescription,
      date: expenseDate,
      paidBy: expensePaidBy,
      splitType: expenseSplitType,
      splitMembers: tripDetail.members,
      splitDetails: splitsToSubmit
    };

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to log expense split entry");
      setIsAddExpenseOpen(false);
      setExpenseDescription("");
      loadTripDetails(tripDetail.id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    setDeletingExpenseId(expenseId);
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setConfirmDeleteExpenseId(null);
      if (tripDetail) await loadTripDetails(tripDetail.id);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleOpenEditTripModal = () => {
    if (!tripDetail) return;
    setTitle(tripDetail.title);
    setStartDate(tripDetail.startDate);
    setEndDate(tripDetail.endDate);
    setBudget(tripDetail.budget);
    setMembersInput(tripDetail.members.join(", "));
    setNotes(tripDetail.notes);
    setError("");
    setIsEditOpen(true);
  };

  return (
    <div id="trips-section" className="space-y-6">
      {/* List / Dashboard Header */}
      {!activeTripId ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Active Trips & Expense Ledgers</h1>
              <p className="text-slate-500 text-sm mt-1">Simulate itineraries, secure hotel reservations, split food & transport bills equally or unequally in ₹.</p>
            </div>
            
            <button
              onClick={() => {
                setError("");
                setTitle("");
                setStartDate(new Date().toISOString().split('T')[0]);
                setEndDate(new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                setBudget(20000);
                setMembersInput(user.name + ", Rahul Sharma");
                setNotes("");
                setIsCreateOpen(true);
              }}
              className="self-start sm:self-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4.5 h-4.5" />
              Plan New Trip
            </button>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-500 animate-pulse text-sm">Opening itinerary safes...</div>
          ) : trips.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 max-w-xl mx-auto space-y-4">
              <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-800">No planned trips found</h3>
              <p className="text-sm text-slate-400">
                You haven't planned any trips yet. Get started by exploring handpicked locations or planning an empty itinerary with custom travel friends.
              </p>
            </div>
          ) : (
            /* Bento-Inspired Grid of Trip Ledgers */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => {
                const days = Math.max(1, Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 3600 * 24)));
                return (
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    key={trip.id}
                    onClick={() => setActiveTripId(trip.id)}
                    className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="p-6 space-y-4">
                      {/* Destination Preview tag */}
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-slate-200/50">
                          {trip.destination ? trip.destination.name : "Custom Route"}
                        </span>
                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {days} Days
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-snug">{trip.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {trip.startDate} to {trip.endDate}
                        </p>
                      </div>

                      {/* Members list */}
                      <div className="flex items-center gap-1.5 pt-2">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-xs font-semibold text-slate-600 line-clamp-1">
                          {trip.members.join(", ")}
                        </span>
                      </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Trip Budget</span>
                        <span className="text-base font-extrabold text-indigo-600">{formatINR(trip.budget)}</span>
                      </div>
                      <span className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-0.5">
                        Manage Ledger <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      ) : (
        /* --- TRIP DETAIL VIEW (THE COMPREHENSIVE TRIP BOARD) --- */
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <button 
                onClick={() => setActiveTripId(null)}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 mb-2"
              >
                ← Back to Trips Dashboard
              </button>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {tripDetail?.title}
              </h2>
              <div className="flex flex-wrap gap-x-3 gap-y-1 items-center mt-1 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {tripDetail?.destination ? `${tripDetail.destination.name}, ${tripDetail.destination.state}` : "Custom Route"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {tripDetail?.startDate} to {tripDetail?.endDate}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowPackingModal(true)}
                className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Luggage className="w-3.5 h-3.5" />
                <span>Packing Checklist</span>
              </button>
              <button
                onClick={() => setShowForexModal(true)}
                className="px-3.5 py-1.5 bg-amber-50 border border-amber-200/80 hover:bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Forex Calculator</span>
              </button>
              <button
                onClick={handleOpenEditTripModal}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit Options
              </button>
              {showConfirmDeleteTrip ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => tripDetail && handleDeleteTrip(tripDetail.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1 active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete?
                  </button>
                  <button
                    onClick={() => setShowConfirmDeleteTrip(false)}
                    className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmDeleteTrip(true)}
                  className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Trip
                </button>
              )}
            </div>
          </div>

          {detailLoading ? (
            <div className="text-center py-20 text-slate-500 animate-pulse text-sm">Decoding real-time balances & ledgers...</div>
          ) : !tripDetail ? (
            <div className="text-center py-20 text-red-600 text-sm">Failed to retrieve ledger details.</div>
          ) : (
            /* BENTO GRID TRIP BOARD */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Box 1: Left column - Budget Health, co-travelers & Settlements (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Real-time Financial Health card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight">Trip Burn Rate Health</h3>
                  
                  {(() => {
                    const totalBookingsConfirmed = tripDetail.bookings
                      .filter(b => b.status === "confirmed")
                      .reduce((sum, b) => sum + b.cost, 0);
                    const totalExpensesLogged = tripDetail.expenses
                      .reduce((sum, e) => sum + e.amount, 0);
                    const currentTotalSpend = totalBookingsConfirmed + totalExpensesLogged;
                    const remainingBudget = tripDetail.budget - currentTotalSpend;
                    const pctUsed = Math.min(Math.round((currentTotalSpend / tripDetail.budget) * 100), 100);

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Remaining</span>
                            <span className={`text-base font-extrabold ${remainingBudget < 0 ? "text-red-600" : "text-indigo-600"}`}>
                              {formatINR(remainingBudget)}
                            </span>
                          </div>
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Spend</span>
                            <span className="text-base font-extrabold text-slate-700">
                              {formatINR(currentTotalSpend)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                            <span>Budget Consumed</span>
                            <span>{pctUsed}% ({formatINR(currentTotalSpend)} / {formatINR(tripDetail.budget)})</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-300 ${
                                pctUsed > 90 ? "bg-red-500" : pctUsed > 70 ? "bg-amber-500" : "bg-indigo-600"
                              }`}
                              style={{ width: `${pctUsed}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Co-Travelers & Settlements card */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
                      <Users className="w-4.5 h-4.5 text-indigo-500" />
                      Travel Friends Splits
                    </h3>
                  </div>

                  {/* Individual split balances */}
                  <div className="space-y-2.5">
                    {tripDetail.members.map((member) => {
                      const bal = splitSummary?.balances?.[member] || { paid: 0, owed: 0, net: 0 };
                      const isOwed = bal.net > 0;
                      return (
                        <div key={member} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <div>
                            <span className="font-bold text-slate-700">{member}</span>
                            <div className="text-[10px] text-slate-400 font-medium">
                              Paid: {formatINR(bal.paid)} | Share: {formatINR(bal.owed)}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`font-bold ${bal.net > 0.1 ? "text-emerald-600" : bal.net < -0.1 ? "text-orange-600" : "text-slate-500"}`}>
                              {bal.net > 0.1 ? `Gets back ${formatINR(bal.net)}` : bal.net < -0.1 ? `Owes ${formatINR(Math.abs(bal.net))}` : "Settled"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Debt Settlements Engine outputs */}
                  {splitSummary && splitSummary.settlements.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        Smart Debt Settlement Route
                      </h4>
                      <div className="space-y-1.5">
                        {splitSummary.settlements.map((settle, i) => (
                          <div key={i} className="text-xs bg-emerald-50/50 border border-emerald-100/40 p-2 rounded-lg flex items-center justify-between text-slate-600 font-medium">
                            <span className="font-bold">{settle.from}</span>
                            <span className="text-[10px] text-slate-400">pays</span>
                            <span className="font-bold text-slate-700">{settle.to}</span>
                            <span className="text-emerald-700 font-extrabold">{formatINR(settle.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Box 2: Right column - Bookings ledger and Expense Tracker (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Bookings Ledger */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm tracking-tight">Accommodation & Travel Log</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Flights, resorts, guides, taxis</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowFlightModal(true)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Plane className="w-3.5 h-3.5" /> Book Flight
                      </button>
                    </div>
                  </div>

                  {tripDetail.bookings.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">
                      No travel components booked. Use "Book Flight" to search & book flights.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tripDetail.bookings.map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold uppercase rounded">
                                {booking.type}
                              </span>
                              <span className="text-xs font-bold text-slate-700">{booking.detailName}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Date: {booking.date} {booking.pnr ? `• PNR: ${booking.pnr}` : ""}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-extrabold text-indigo-600">{formatINR(booking.cost)}</span>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setActiveReceiptBooking(booking)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 border border-indigo-200/80 shadow-xs"
                                title="View Receipt & E-Ticket (with Back button)"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() => downloadBookingPDF(booking, user)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1 border border-indigo-200/80 shadow-xs active:scale-95"
                                title="Download Official PDF E-Ticket"
                              >
                                <Download className="w-3.5 h-3.5 text-indigo-600" />
                                <span>PDF</span>
                              </button>
                            </div>

                            {booking.status !== "cancelled" ? (
                              confirmCancelBookingId === booking.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleCancelBooking(booking.id)}
                                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-extrabold transition-all active:scale-95"
                                  >
                                    Confirm Cancel
                                  </button>
                                  <button
                                    onClick={() => setConfirmCancelBookingId(null)}
                                    className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmCancelBookingId(booking.id)}
                                  className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                  title="Cancel Booking"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )
                            ) : (
                              <span className="text-[10px] font-bold text-red-500 uppercase">Cancelled</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expenses Log & Bill Splitter */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm tracking-tight">Active Shared Expenses</h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Restaurants, entry tickets, local souvenirs</p>
                    </div>
                    <button
                      onClick={() => setIsAddExpenseOpen(true)}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log Shared Spend
                    </button>
                  </div>

                  {tripDetail.expenses.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400 font-medium">
                      No shared expenses logged yet. Record splits to run the calculation engine.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {tripDetail.expenses.map((expense) => (
                        <div key={expense.id} className="p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[8px] font-bold uppercase rounded border border-slate-200/50">
                                  {expense.category}
                                </span>
                                <span className="text-xs font-bold text-slate-700">{expense.description || "Uncategorized purchase"}</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-medium">
                                Paid by <span className="font-bold text-slate-500">{expense.paidBy}</span> on {expense.date}
                              </p>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-extrabold text-indigo-600">{formatINR(expense.amount)}</span>
                              
                              {confirmDeleteExpenseId === expense.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    disabled={deletingExpenseId === expense.id}
                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-extrabold shadow-xs transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                    title="Confirm expense deletion"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>{deletingExpenseId === expense.id ? "Deleting..." : "Confirm Delete?"}</span>
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteExpenseId(null)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setConfirmDeleteExpenseId(expense.id)}
                                  className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                  title="Delete Expense"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Split shares mapping preview */}
                          <div className="flex flex-wrap gap-1 pt-1.5 border-t border-dashed border-slate-100">
                            {Object.entries(expense.splitDetails || {}).map(([member, share]) => (
                              <span key={member} className="text-[9px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full border border-slate-200/40">
                                {member}: {formatINR(share as number)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </motion.div>
      )}

      {/* --- MODAL: CREATE TRIP LEDGER --- */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-lg">Plan Your Journey Ledger</h3>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-b border-red-200 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trip Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Getaway to Kashmir"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Destination Catalog</label>
                    <select
                      value={destinationId}
                      onChange={(e) => setDestinationId(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    >
                      {destinations.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Max Spend Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trip Members (Comma-Separated Names)</label>
                  <input
                    type="text"
                    required
                    placeholder="Rohith Kumar, Rahul Sharma, Surbhi Patel"
                    value={membersInput}
                    onChange={(e) => setMembersInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Names must match exactly when logging splitting expenses later.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Special Notes / Goals</label>
                  <textarea
                    rows={2}
                    placeholder="Any general requirements, links, or lists..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg"
                  >
                    Add Journey Ledger
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL: EDIT TRIP OPTIONS --- */}
      <AnimatePresence>
        {isEditOpen && tripDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-lg">Modify Trip Parameters</h3>
                <button onClick={() => setIsEditOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-b border-red-200 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleEditTrip} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trip Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Budget (₹)</label>
                    <input
                      type="number"
                      required
                      value={budget}
                      onChange={(e) => setBudget(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">End Date</label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Trip Members (Comma-Separated Names)</label>
                  <input
                    type="text"
                    required
                    value={membersInput}
                    onChange={(e) => setMembersInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL: ADD SIMULATED BOOKING --- */}
      <AnimatePresence>
        {isAddBookingOpen && tripDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Book Itinerary Element</h3>
                <button onClick={() => setIsAddBookingOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddBooking} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Booking Type</label>
                    <select
                      value={bookingType}
                      onChange={(e) => setBookingType(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="flight">Flight Transit</option>
                      <option value="hotel">Hotel / Villa / Resort</option>
                      <option value="activity">Guided Activities / Entrance</option>
                      <option value="cab">Taxi / Car Hire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Booking Date</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Details & Operator Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Air India: BLR to JAI, Premium Stay Resort"
                    value={bookingDetailName}
                    onChange={(e) => setBookingDetailName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Transaction Value (₹)</label>
                  <input
                    type="number"
                    required
                    value={bookingCost}
                    onChange={(e) => setBookingCost(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddBookingOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg"
                  >
                    Process Booking
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL: ADD SHARED EXPENSE SPLIT --- */}
      <AnimatePresence>
        {isAddExpenseOpen && tripDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm uppercase tracking-wider">Log & Split Shared Spend</h3>
                <button onClick={() => setIsAddExpenseOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExpense} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Expense Amount (₹)</label>
                    <input
                      type="number"
                      required
                      value={expenseAmount}
                      onChange={(e) => {
                        const amt = Number(e.target.value);
                        setExpenseAmount(amt);
                        // Re-distribute shares dynamically if split is unequal
                        const share = Math.round(amt / tripDetail.members.length);
                        const shares: { [n: string]: number } = {};
                        tripDetail.members.forEach(m => shares[m] = share);
                        setUnequalShares(shares);
                      }}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category Category</label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <option value="food">Food & Fine Dining</option>
                      <option value="transport">Local Transit / Cabs</option>
                      <option value="lodging">Hotel / Extra Stays</option>
                      <option value="sightseeing">Activity Entries / Passes</option>
                      <option value="misc">Miscellaneous</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description / Bill details</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Seafood Dinner, Toll gates, Museum tickets"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Who Paid the Bill?</label>
                    <select
                      value={expensePaidBy}
                      onChange={(e) => setExpensePaidBy(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      {tripDetail.members.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date Logged</label>
                    <input
                      type="date"
                      required
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                {/* Splitting Logic Choice */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">How to Split the Bill?</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExpenseSplitType("equal")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                        expenseSplitType === "equal" 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Equal Share Split
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpenseSplitType("unequal")}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                        expenseSplitType === "unequal" 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Unequal Share Split
                    </button>
                  </div>
                </div>

                {/* Split details layout */}
                {expenseSplitType === "equal" ? (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 font-medium">
                    Each of the {tripDetail.members.length} participants owes{" "}
                    <span className="font-bold text-slate-700">
                      {formatINR(Math.round(expenseAmount / tripDetail.members.length))}
                    </span>
                    .
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Configure Manual Shares (₹)</span>
                    <div className="space-y-2">
                      {tripDetail.members.map((member) => (
                        <div key={member} className="flex items-center justify-between gap-4 text-xs font-medium">
                          <span className="text-slate-600 shrink-0 font-semibold">{member}</span>
                          <div className="flex items-center gap-1.5 max-w-40">
                            <span className="text-slate-400">₹</span>
                            <input
                              type="number"
                              value={unequalShares[member] || 0}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setUnequalShares(prev => ({
                                  ...prev,
                                  [member]: val
                                }));
                              }}
                              className="w-full text-right px-2 py-1 bg-white border border-slate-200 rounded"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-dashed border-slate-200 text-[10px] text-right text-slate-500 font-medium">
                      Sum of shares: <span className="font-bold">{(Object.values(unequalShares) as number[]).reduce((a,b)=>a+b,0)} ₹</span> / {expenseAmount} ₹
                    </div>
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddExpenseOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-xs rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg"
                  >
                    Post Split Bill
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLIGHT BOOKING SYSTEM MODAL */}
      <AnimatePresence>
        {showFlightModal && (
          <FlightBookingModal
            user={user}
            userTrips={trips}
            defaultTripId={tripDetail?.id}
            onClose={() => setShowFlightModal(false)}
            onBookingCreated={(newBooking) => {
              setShowFlightModal(false);
              if (tripDetail) loadTripDetails(tripDetail.id);
            }}
          />
        )}
      </AnimatePresence>

      {/* PAYMENT MODAL FOR STANDARD BOOKINGS */}
      <AnimatePresence>
        {showPaymentForBooking && (
          <PaymentModal
            itemTitle={bookingDetailName || "Travel Component Booking"}
            itemSubtitle={bookingDate ? `Scheduled for ${bookingDate}` : undefined}
            baseAmount={bookingCost}
            itemType={bookingType}
            onCancel={() => setShowPaymentForBooking(false)}
            onPaymentSuccess={handleBookingPaymentCompleted}
          />
        )}
      </AnimatePresence>

      {/* RECEIPT & E-TICKET MODAL */}
      <AnimatePresence>
        {activeReceiptBooking && (
          <ReceiptModal
            booking={activeReceiptBooking}
            user={user}
            onClose={() => setActiveReceiptBooking(null)}
          />
        )}
      </AnimatePresence>

      {/* FOREX & CURRENCY CONVERTER MODAL */}
      <CurrencyConverterModal
        isOpen={showForexModal}
        onClose={() => setShowForexModal(false)}
        initialAmount={tripDetail?.budget || 15000}
      />

      {/* SMART PACKING CHECKLIST & WEATHER MODAL */}
      <PackingListModal
        isOpen={showPackingModal}
        onClose={() => setShowPackingModal(false)}
        trip={tripDetail}
        destination={tripDetail?.destination}
      />
    </div>
  );
}
