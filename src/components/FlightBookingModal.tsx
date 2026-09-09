import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Trip, Booking, PaymentDetails, FlightDetails } from "../types";
import { FlightRoute, MOCK_FLIGHTS, INDIAN_AIRPORTS, getFlightsForRoute, getDestinationAirportCode } from "../data/flights";
import PaymentModal from "./PaymentModal";
import ReceiptModal from "./ReceiptModal";
import { 
  X, Plane, Calendar, User as UserIcon, Search, 
  ArrowRight, ShieldCheck, Check, Sparkles, AlertCircle, ArrowLeftRight, RotateCcw
} from "lucide-react";

interface FlightBookingModalProps {
  user: User;
  userTrips: Trip[];
  defaultTripId?: string;
  onClose: () => void;
  onBookingCreated: (booking: Booking) => void;
}

export default function FlightBookingModal({
  user,
  userTrips,
  defaultTripId,
  onClose,
  onBookingCreated
}: FlightBookingModalProps) {
  // Passenger Form State
  const [selectedTripId, setSelectedTripId] = useState<string>(
    defaultTripId || (userTrips.length > 0 ? userTrips[0].id : "")
  );

  // Flight Search State
  const [tripType, setTripType] = useState<"round-trip" | "one-way">("round-trip");
  
  // Detect default origin based on user location
  const userHomeAirport = getDestinationAirportCode(user.location || "Delhi");
  const [origin, setOrigin] = useState(userHomeAirport === "GOI" ? "DEL" : userHomeAirport);

  // Detect default destination based on selected trip location
  const initialTrip = userTrips.find(t => t.id === selectedTripId) || userTrips[0];
  const initialDestCode = initialTrip ? getDestinationAirportCode(initialTrip.title) : "GOI";
  const [destination, setDestination] = useState(initialDestCode === origin ? "GOI" : initialDestCode);

  const defaultDeptDate = initialTrip ? initialTrip.startDate : new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
  const defaultRetDate = initialTrip ? initialTrip.endDate : new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0];

  const [departureDate, setDepartureDate] = useState(defaultDeptDate);
  const [returnDate, setReturnDate] = useState(defaultRetDate);
  const [cabinClass, setCabinClass] = useState<"Economy" | "Premium Economy" | "Business">("Economy");
  const [passengerCount, setPassengerCount] = useState(1);

  // Selected Flight Route & Details
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState<FlightRoute | null>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<FlightRoute | null>(null);
  const [activeTab, setActiveTab] = useState<"outbound" | "return">("outbound");

  const [passengerName, setPassengerName] = useState(user.name);
  const [seatPreference, setSeatPreference] = useState("12A (Window)");
  const [returnSeatPreference, setReturnSeatPreference] = useState("14B (Aisle)");

  // Flow Modals
  const [showPayment, setShowPayment] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Whenever user switches selected trip, auto-update flight dates & destination airport
  useEffect(() => {
    if (!selectedTripId) return;
    const matchedTrip = userTrips.find(t => t.id === selectedTripId);
    if (matchedTrip) {
      const destCode = getDestinationAirportCode(matchedTrip.title);
      if (destCode && destCode !== origin) {
        setDestination(destCode);
      }
      if (matchedTrip.startDate) setDepartureDate(matchedTrip.startDate);
      if (matchedTrip.endDate) setReturnDate(matchedTrip.endDate);
      // Reset selected flight options so user picks relevant ones
      setSelectedOutboundFlight(null);
      setSelectedReturnFlight(null);
    }
  }, [selectedTripId]);

  // Real-world flight resolvers
  const outboundFlightsToDisplay: FlightRoute[] = getFlightsForRoute(origin, destination);
  const returnFlightsToDisplay: FlightRoute[] = getFlightsForRoute(destination, origin);


  const getPriceForClass = (f: FlightRoute) => {
    if (cabinClass === "Premium Economy") return f.pricePremium;
    if (cabinClass === "Business") return f.priceBusiness;
    return f.priceEconomy;
  };

  const calculateTotalFlightCost = () => {
    if (!selectedOutboundFlight) return 0;
    let singlePaxCost = getPriceForClass(selectedOutboundFlight);
    if (tripType === "round-trip" && selectedReturnFlight) {
      singlePaxCost += getPriceForClass(selectedReturnFlight);
    }
    return singlePaxCost * passengerCount;
  };

  const handleProceedToPayment = () => {
    setError("");
    if (!selectedOutboundFlight) {
      setError("Please select an Outbound flight option");
      return;
    }
    if (tripType === "round-trip" && !selectedReturnFlight) {
      setError("Please select a Return flight option for 2-Way round trip");
      return;
    }
    if (!selectedTripId && userTrips.length > 0) {
      setSelectedTripId(userTrips[0].id);
    }
    setShowPayment(true);
  };

  const handlePaymentCompleted = async (paymentDetails: PaymentDetails) => {
    if (!selectedOutboundFlight) return;
    setLoading(true);

    const origCity = INDIAN_AIRPORTS.find(a => a.code === origin)?.city || origin;
    const destCity = INDIAN_AIRPORTS.find(a => a.code === destination)?.city || destination;
    
    const outboundPnr = `PNR-${selectedOutboundFlight.airline.slice(0, 2).toUpperCase()}${Math.floor(10000 + Math.random() * 90000)}`;
    const returnPnr = selectedReturnFlight 
      ? `PNR-${selectedReturnFlight.airline.slice(0, 2).toUpperCase()}${Math.floor(10000 + Math.random() * 90000)}` 
      : "";

    const flightDetailsObj: FlightDetails = {
      tripType: tripType,
      flightNumber: selectedOutboundFlight.flightNumber,
      airline: selectedOutboundFlight.airline,
      airlineLogo: selectedOutboundFlight.airlineLogo,
      origin: origCity,
      originCode: origin,
      destination: destCity,
      destinationCode: destination,
      departureTime: selectedOutboundFlight.departureTime,
      arrivalTime: selectedOutboundFlight.arrivalTime,
      duration: selectedOutboundFlight.duration,
      cabinClass: cabinClass,
      seatNumber: seatPreference,
      passengerName: passengerName,
      pnr: outboundPnr,
      terminal: selectedOutboundFlight.terminal,
      ...(tripType === "round-trip" && selectedReturnFlight ? {
        returnFlight: {
          flightNumber: selectedReturnFlight.flightNumber,
          airline: selectedReturnFlight.airline,
          airlineLogo: selectedReturnFlight.airlineLogo,
          departureDate: returnDate,
          departureTime: selectedReturnFlight.departureTime,
          arrivalTime: selectedReturnFlight.arrivalTime,
          duration: selectedReturnFlight.duration,
          seatNumber: returnSeatPreference,
          pnr: returnPnr,
          terminal: selectedReturnFlight.terminal
        }
      } : {})
    };

    const detailNameText = tripType === "round-trip" && selectedReturnFlight
      ? `2-Way Flight (${selectedOutboundFlight.airline} / ${selectedReturnFlight.airline}): ${origCity} ⇄ ${destCity}`
      : `Flight (${selectedOutboundFlight.airline}): ${origCity} → ${destCity}`;

    const bookingPayload = {
      tripId: selectedTripId || (userTrips[0]?.id || "standalone"),
      userId: user.id,
      type: "flight" as const,
      detailName: detailNameText,
      cost: paymentDetails.totalPaid,
      date: departureDate,
      pnr: outboundPnr,
      paymentDetails,
      flightDetails: flightDetailsObj
    };

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingPayload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to register flight booking");
      }

      const created: Booking = await res.json();
      setShowPayment(false);
      setCreatedBooking(created);
      setShowReceipt(true);
      onBookingCreated(created);
    } catch (err: any) {
      alert(err.message || "Failed to confirm flight booking");
      setShowPayment(false);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  return (
    <>
      {/* SHOW RECEIPT WHEN BOOKING CONFIRMED */}
      {showReceipt && createdBooking && (
        <ReceiptModal
          booking={createdBooking}
          user={user}
          onClose={() => {
            setShowReceipt(false);
            onClose();
          }}
        />
      )}

      {/* SHOW PAYMENT MODAL WHEN PROCEEDING TO PAY */}
      {showPayment && selectedOutboundFlight && (
        <PaymentModal
          itemTitle={
            tripType === "round-trip" && selectedReturnFlight
              ? `2-Way Flight: ${origin} ⇄ ${destination}`
              : `Flight ${selectedOutboundFlight.flightNumber} (${selectedOutboundFlight.airline})`
          }
          itemSubtitle={
            tripType === "round-trip" && selectedReturnFlight
              ? `Outbound: ${selectedOutboundFlight.airline} (${departureDate}) • Return: ${selectedReturnFlight.airline} (${returnDate}) • ${passengerCount} Pax`
              : `${origin} → ${destination} • ${departureDate} • ${passengerCount} Pax (${cabinClass})`
          }
          baseAmount={calculateTotalFlightCost()}
          itemType="flight"
          onCancel={() => setShowPayment(false)}
          onPaymentSuccess={handlePaymentCompleted}
        />
      )}

      {/* MAIN FLIGHT SEARCH & SELECTION MODAL */}
      {!showReceipt && !showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-6 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Plane className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold tracking-tight">Book Indian Domestic Flights</h2>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px] rounded-md uppercase tracking-wider">
                      2-Way Round Trip Ready
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Search live airline schedules for going & return travel with instant seat allocation</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* TRIP TYPE TOGGLE & SEARCH FILTERS PANEL */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-4">
                
                {/* Trip Type Selector */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                  <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        setTripType("round-trip");
                        setActiveTab("outbound");
                      }}
                      className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 ${
                        tripType === "round-trip"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Round Trip (2-Way)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTripType("one-way");
                        setSelectedReturnFlight(null);
                        setActiveTab("outbound");
                      }}
                      className={`px-4 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1.5 ${
                        tripType === "one-way"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>One Way</span>
                    </button>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-slate-500">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Real-Time Seat & Fare Engine</span>
                  </div>
                </div>

                {/* Search Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  
                  {/* From Airport */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">From (Origin)</label>
                    <select
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      {INDIAN_AIRPORTS.map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.city} ({a.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Airport Swap Button & To Airport */}
                  <div className="space-y-1 relative">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">To (Destination)</label>
                      <button
                        type="button"
                        onClick={handleSwapAirports}
                        className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-0.5"
                        title="Swap Origin and Destination"
                      >
                        <ArrowLeftRight className="w-3 h-3" /> Swap
                      </button>
                    </div>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      {INDIAN_AIRPORTS.filter(a => a.code !== origin).map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.city} ({a.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Departure Date (Going) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Going Date</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Return Date (Coming Back - 2-Way) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      {tripType === "round-trip" ? "Return Date (Coming)" : "Return Date"}
                    </label>
                    <input
                      type="date"
                      disabled={tripType === "one-way"}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className={`w-full px-3 py-2 text-xs font-bold rounded-xl border outline-none ${
                        tripType === "one-way"
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      }`}
                    />
                  </div>

                  {/* Cabin Class */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Cabin Class</label>
                    <select
                      value={cabinClass}
                      onChange={(e) => setCabinClass(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    >
                      <option value="Economy">Economy</option>
                      <option value="Premium Economy">Premium Econ</option>
                      <option value="Business">Business Class</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* ROUND TRIP NAVIGATION TABS */}
              {tripType === "round-trip" && (
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveTab("outbound")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                      activeTab === "outbound"
                        ? "bg-white text-indigo-700 shadow-sm border border-indigo-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Plane className="w-4 h-4 text-indigo-600" />
                    <span>1. Select Outbound Flight ({origin} → {destination})</span>
                    {selectedOutboundFlight && (
                      <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("return")}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                      activeTab === "return"
                        ? "bg-white text-indigo-700 shadow-sm border border-indigo-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    <span>2. Select Return Flight ({destination} → {origin})</span>
                    {selectedReturnFlight && (
                      <span className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* OUTBOUND FLIGHTS SECTION */}
              {(tripType === "one-way" || activeTab === "outbound") && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <Plane className="w-4 h-4 text-indigo-600" />
                      <span>Outbound Going Flights ({origin} → {destination}) • {departureDate}</span>
                    </h3>
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {outboundFlightsToDisplay.length} Options
                    </span>
                  </div>

                  <div className="space-y-3">
                    {outboundFlightsToDisplay.map((flightOption) => {
                      const price = getPriceForClass(flightOption);
                      const isSelected = selectedOutboundFlight?.id === flightOption.id;

                      return (
                        <div
                          key={flightOption.id}
                          onClick={() => {
                            setSelectedOutboundFlight(flightOption);
                            if (tripType === "round-trip" && !selectedReturnFlight) {
                              setActiveTab("return");
                            }
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            isSelected
                              ? "bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                              : "bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-sm"
                          }`}
                        >
                          {/* Airline Info */}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${flightOption.airlineColor} flex items-center justify-center font-black text-xs shadow-sm`}>
                              {flightOption.airline.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-800 text-sm">{flightOption.airline}</span>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {flightOption.flightNumber}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{flightOption.terminal} • {flightOption.availableSeats} seats left</p>
                            </div>
                          </div>

                          {/* Timing Schedule */}
                          <div className="flex items-center gap-4 text-center">
                            <div>
                              <span className="font-bold text-slate-800 text-sm">{flightOption.departureTime}</span>
                              <span className="text-[10px] text-slate-400 block font-bold">{flightOption.originCode}</span>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-slate-400">{flightOption.duration}</span>
                              <div className="w-16 border-t-2 border-dashed border-indigo-400 relative my-1">
                                <Plane className="w-3.5 h-3.5 text-indigo-600 absolute -top-1.5 left-1/2 -translate-x-1/2 transform rotate-90" />
                              </div>
                              <span className="text-[9px] text-emerald-600 font-bold">{flightOption.stops}</span>
                            </div>

                            <div>
                              <span className="font-bold text-slate-800 text-sm">{flightOption.arrivalTime}</span>
                              <span className="text-[10px] text-slate-400 block font-bold">{flightOption.destinationCode}</span>
                            </div>
                          </div>

                          {/* Price & Selection Button */}
                          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block">Outbound Fare</span>
                              <span className="text-base font-black text-indigo-600">{formatINR(price)}</span>
                            </div>

                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                              isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                            }`}>
                              {isSelected && <Check className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* RETURN FLIGHTS SECTION (2-WAY ROUND TRIP) */}
              {tripType === "round-trip" && activeTab === "return" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-indigo-600" />
                      <span>Return Coming Flights ({destination} → {origin}) • {returnDate}</span>
                    </h3>
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg">
                      {returnFlightsToDisplay.length} Return Options
                    </span>
                  </div>

                  <div className="space-y-3">
                    {returnFlightsToDisplay.map((returnOption) => {
                      const price = getPriceForClass(returnOption);
                      const isSelected = selectedReturnFlight?.id === returnOption.id;

                      return (
                        <div
                          key={returnOption.id}
                          onClick={() => setSelectedReturnFlight(returnOption)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            isSelected
                              ? "bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20"
                              : "bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-sm"
                          }`}
                        >
                          {/* Airline Info */}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${returnOption.airlineColor} flex items-center justify-center font-black text-xs shadow-sm`}>
                              {returnOption.airline.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-800 text-sm">{returnOption.airline}</span>
                                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                  {returnOption.flightNumber}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">{returnOption.terminal} • {returnOption.availableSeats} seats left</p>
                            </div>
                          </div>

                          {/* Timing Schedule */}
                          <div className="flex items-center gap-4 text-center">
                            <div>
                              <span className="font-bold text-slate-800 text-sm">{returnOption.departureTime}</span>
                              <span className="text-[10px] text-slate-400 block font-bold">{returnOption.originCode}</span>
                            </div>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-semibold text-slate-400">{returnOption.duration}</span>
                              <div className="w-16 border-t-2 border-dashed border-indigo-400 relative my-1">
                                <Plane className="w-3.5 h-3.5 text-indigo-600 absolute -top-1.5 left-1/2 -translate-x-1/2 transform -rotate-90" />
                              </div>
                              <span className="text-[9px] text-emerald-600 font-bold">{returnOption.stops}</span>
                            </div>

                            <div>
                              <span className="font-bold text-slate-800 text-sm">{returnOption.arrivalTime}</span>
                              <span className="text-[10px] text-slate-400 block font-bold">{returnOption.destinationCode}</span>
                            </div>
                          </div>

                          {/* Price & Selection Button */}
                          <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block">Return Fare</span>
                              <span className="text-base font-black text-indigo-600">{formatINR(price)}</span>
                            </div>

                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                              isSelected ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-300 bg-white"
                            }`}>
                              {isSelected && <Check className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2-WAY ROUND TRIP SUMMARY CARDS */}
              {tripType === "round-trip" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                  <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 block">Outbound (Going)</span>
                    {selectedOutboundFlight ? (
                      <p className="font-bold text-slate-800">
                        {selectedOutboundFlight.airline} ({selectedOutboundFlight.flightNumber}) • {selectedOutboundFlight.departureTime}
                      </p>
                    ) : (
                      <p className="text-amber-600 font-medium italic">Not selected yet — click tab above</p>
                    )}
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs space-y-1">
                    <span className="text-[10px] font-extrabold uppercase text-indigo-600 block">Return (Coming Back)</span>
                    {selectedReturnFlight ? (
                      <p className="font-bold text-slate-800">
                        {selectedReturnFlight.airline} ({selectedReturnFlight.flightNumber}) • {selectedReturnFlight.departureTime}
                      </p>
                    ) : (
                      <p className="text-amber-600 font-medium italic">Not selected yet — click tab above</p>
                    )}
                  </div>
                </div>
              )}

              {/* PASSENGER & TRIP LINKING DETAILS */}
              {selectedOutboundFlight && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-5 space-y-4"
                >
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-indigo-600" />
                    Passenger Details & Seat Selection
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Passenger Full Name</label>
                      <input
                        type="text"
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Going Flight Seat</label>
                      <select
                        value={seatPreference}
                        onChange={(e) => setSeatPreference(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                      >
                        <option value="12A (Window)">12A (Window)</option>
                        <option value="14B (Aisle)">14B (Aisle)</option>
                        <option value="16C (Extra Legroom)">16C (Extra Legroom)</option>
                        <option value="18F (Window)">18F (Window)</option>
                      </select>
                    </div>

                    {tripType === "round-trip" && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Return Flight Seat</label>
                        <select
                          value={returnSeatPreference}
                          onChange={(e) => setReturnSeatPreference(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                        >
                          <option value="14B (Aisle)">14B (Aisle)</option>
                          <option value="15A (Window)">15A (Window)</option>
                          <option value="17C (Extra Legroom)">17C (Extra Legroom)</option>
                          <option value="19F (Window)">19F (Window)</option>
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Associate With Trip</label>
                      <select
                        value={selectedTripId}
                        onChange={(e) => setSelectedTripId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                      >
                        {userTrips.map((trip) => (
                          <option key={trip.id} value={trip.id}>
                            {trip.title} ({trip.startDate})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}

              {error && <p className="text-xs font-bold text-red-500">{error}</p>}

            </div>

            {/* Footer Bar */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {selectedOutboundFlight ? (
                  <span>
                    Selected: <strong className="text-slate-800">{selectedOutboundFlight.airline}</strong>
                    {tripType === "round-trip" && selectedReturnFlight && (
                      <span> + <strong className="text-slate-800">{selectedReturnFlight.airline} Return</strong></span>
                    )}
                    {" "}• Total Combined Fare: <strong className="text-indigo-600 text-sm font-black">{formatINR(calculateTotalFlightCost())}</strong>
                  </span>
                ) : (
                  <span>Please select flight option(s) to proceed to checkout.</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedOutboundFlight || (tripType === "round-trip" && !selectedReturnFlight) || loading}
                  onClick={handleProceedToPayment}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Proceed to Payment</span>
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </>
  );
}
