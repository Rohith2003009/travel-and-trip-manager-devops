import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Booking, User } from "../types";
import { downloadBookingVoucher, downloadBookingPDF } from "../utils/receipt";
import { 
  Printer, Download, CheckCircle2, Plane, Building2, 
  Car, Compass, ShieldCheck, QrCode, FileText, Calendar, User as UserIcon, Tag,
  ArrowLeft
} from "lucide-react";

interface ReceiptModalProps {
  booking: Booking;
  user: User;
  onClose: () => void;
}

export default function ReceiptModal({ booking, user, onClose }: ReceiptModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleDownloadPDF = () => {
    downloadBookingPDF(booking, user);
  };

  const handlePrint = () => {
    downloadBookingPDF(booking, user);
    try {
      window.print();
    } catch (e) {
      console.warn("Print bypassed in iframe:", e);
    }
  };

  const handleDownloadText = () => {
    downloadBookingVoucher(booking, user);
  };

  const isFlight = booking.type === "flight" || !!booking.flightDetails;
  const flight = booking.flightDetails;
  const payment = booking.paymentDetails;

  const baseFare = payment?.baseFare ?? Math.round(booking.cost * 0.85);
  const taxes = payment?.taxesAndFees ?? Math.round(booking.cost * 0.15);
  const total = payment?.totalPaid ?? booking.cost;
  const pnr = booking.pnr || flight?.pnr || `TH-${booking.id.slice(-6).toUpperCase()}`;
  const txnId = payment?.transactionId || `TXN-IND-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Printable CSS style snippet to isolate receipt when printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200"
      >
        {/* Modal Action Header Bar (Hidden when printing) */}
        <div className="no-print bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95 shadow-sm"
              title="Return to trips view (Esc)"
            >
              <ArrowLeft className="w-4 h-4 text-amber-400" />
              <span>Back</span>
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-xs sm:text-sm tracking-tight">Verified Booking Receipt</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              title="Download official PDF E-Ticket"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF Ticket</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownloadText}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              title="Download text voucher"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Voucher (.txt)</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT CONTAINER */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-white space-y-6">
          
          {/* Header & Logo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Compass className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">TravelHub India</h1>
                <p className="text-xs text-slate-500 font-medium">Official E-Ticket & Payment Confirmation</p>
              </div>
            </div>

            <div className="sm:text-right bg-emerald-50 border border-emerald-200/80 rounded-xl px-4 py-2">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-extrabold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Paid & Confirmed</span>
              </div>
              <p className="text-[11px] font-mono font-bold text-slate-600 mt-0.5">
                PNR: <span className="text-indigo-600 font-black">{pnr}</span>
              </p>
            </div>
          </div>

          {/* FLIGHT SPECIFIC TICKET BANNER */}
          {isFlight && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden space-y-4">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4 pointer-events-none">
                <Plane className="w-48 h-48" />
              </div>

              {/* OUTBOUND FLIGHT (GOING) */}
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between text-xs text-indigo-200 border-b border-indigo-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded text-[10px] uppercase">
                      🛫 Outbound Going: {flight?.airline || "Indian Airline"}
                    </span>
                    <span className="font-mono font-bold text-white">{flight?.flightNumber || "6E-2041"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-300 font-medium">{flight?.cabinClass || "Economy"} Class</span>
                    {flight?.returnFlight && (
                      <span className="px-2 py-0.5 bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 rounded text-[9px] font-black uppercase">
                        2-Way Round Trip
                      </span>
                    )}
                  </div>
                </div>

                {/* Flight Route Display */}
                <div className="flex items-center justify-between text-center py-1">
                  <div className="text-left">
                    <span className="text-2xl font-black tracking-tight text-white">{flight?.originCode || "DEL"}</span>
                    <p className="text-xs font-medium text-slate-300">{flight?.origin || "Delhi"}</p>
                    <p className="text-[11px] font-bold text-indigo-300 mt-0.5">{flight?.departureTime || "06:15 AM"}</p>
                  </div>

                  <div className="flex-1 px-4 flex flex-col items-center">
                    <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-widest">
                      {flight?.duration || "2h 30m"} • Non-stop
                    </span>
                    <div className="w-full flex items-center my-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                      <div className="flex-1 border-t-2 border-dashed border-indigo-400/60 mx-1"></div>
                      <Plane className="w-4 h-4 text-indigo-300 transform rotate-90" />
                      <div className="flex-1 border-t-2 border-dashed border-indigo-400/60 mx-1"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                    </div>
                    <span className="text-[10px] text-slate-400">{flight?.terminal || "Terminal 3"}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black tracking-tight text-white">{flight?.destinationCode || "GOI"}</span>
                    <p className="text-xs font-medium text-slate-300">{flight?.destination || "Goa"}</p>
                    <p className="text-[11px] font-bold text-indigo-300 mt-0.5">{flight?.arrivalTime || "08:45 AM"}</p>
                  </div>
                </div>

                {/* Seat & Baggage Bar */}
                <div className="grid grid-cols-3 gap-2 bg-white/10 rounded-xl p-2.5 text-xs text-center border border-white/10">
                  <div>
                    <span className="text-[9px] text-indigo-200 block uppercase font-bold">Passenger</span>
                    <span className="font-semibold text-white truncate block">{flight?.passengerName || user.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-indigo-200 block uppercase font-bold">Going Seat / PNR</span>
                    <span className="font-semibold text-white block">{flight?.seatNumber || "12A"} • <span className="font-mono text-amber-300">{flight?.pnr}</span></span>
                  </div>
                  <div>
                    <span className="text-[9px] text-indigo-200 block uppercase font-bold">Baggage Limit</span>
                    <span className="font-semibold text-white block">15kg Check-in + 7kg Cabin</span>
                  </div>
                </div>
              </div>

              {/* RETURN FLIGHT (COMING BACK) IF 2-WAY ROUND TRIP */}
              {flight?.returnFlight && (
                <div className="relative z-10 pt-3 border-t border-indigo-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-indigo-200 border-b border-indigo-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-600 text-white font-bold rounded text-[10px] uppercase">
                        🛬 Return Coming: {flight.returnFlight.airline}
                      </span>
                      <span className="font-mono font-bold text-white">{flight.returnFlight.flightNumber}</span>
                    </div>
                    <span className="text-amber-300 font-bold text-xs">
                      Return Date: {flight.returnFlight.departureDate}
                    </span>
                  </div>

                  {/* Return Flight Route Display */}
                  <div className="flex items-center justify-between text-center py-1">
                    <div className="text-left">
                      <span className="text-2xl font-black tracking-tight text-white">{flight.destinationCode}</span>
                      <p className="text-xs font-medium text-slate-300">{flight.destination}</p>
                      <p className="text-[11px] font-bold text-amber-300 mt-0.5">{flight.returnFlight.departureTime}</p>
                    </div>

                    <div className="flex-1 px-4 flex flex-col items-center">
                      <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-widest">
                        {flight.returnFlight.duration} • Non-stop
                      </span>
                      <div className="w-full flex items-center my-1">
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                        <div className="flex-1 border-t-2 border-dashed border-amber-400/60 mx-1"></div>
                        <Plane className="w-4 h-4 text-amber-300 transform -rotate-90" />
                        <div className="flex-1 border-t-2 border-dashed border-amber-400/60 mx-1"></div>
                        <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                      </div>
                      <span className="text-[10px] text-slate-400">{flight.returnFlight.terminal || "Terminal 1"}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-2xl font-black tracking-tight text-white">{flight.originCode}</span>
                      <p className="text-xs font-medium text-slate-300">{flight.origin}</p>
                      <p className="text-[11px] font-bold text-amber-300 mt-0.5">{flight.returnFlight.arrivalTime}</p>
                    </div>
                  </div>

                  {/* Return Seat Bar */}
                  <div className="grid grid-cols-2 gap-2 bg-amber-500/10 rounded-xl p-2.5 text-xs text-center border border-amber-400/20">
                    <div>
                      <span className="text-[9px] text-amber-200 block uppercase font-bold">Return Seat</span>
                      <span className="font-semibold text-white block">{flight.returnFlight.seatNumber || "14B (Aisle)"}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-amber-200 block uppercase font-bold">Return Flight PNR</span>
                      <span className="font-mono font-bold text-amber-300 block">{flight.returnFlight.pnr}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NON-FLIGHT COMPONENT DISPLAY */}
          {!isFlight && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    {booking.type === "hotel" ? <Building2 className="w-5 h-5" /> : booking.type === "cab" ? <Car className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                  </div>
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 block">{booking.type} Booking</span>
                    <h3 className="font-bold text-slate-800 text-base">{booking.detailName}</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 block">Scheduled Date</span>
                  <span className="font-bold text-slate-800 text-sm">{booking.date}</span>
                </div>
              </div>
            </div>
          )}

          {/* TRAVELER DETAILS & TRANSACTION REF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-slate-200/80 rounded-xl p-4 text-xs">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Traveler / Customer Info</span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                {user.name}
              </p>
              <p className="text-slate-600 font-mono text-[11px]">{user.email}</p>
              <p className="text-slate-600">{user.phone || "+91 98765 43210"}</p>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-100 sm:pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Payment Reference</span>
              <p className="font-mono font-bold text-slate-800 text-[11px]">Txn ID: {txnId}</p>
              <p className="text-slate-600">Method: {payment?.paymentMethod || "UPI / Online Payment"}</p>
              <p className="text-slate-600">Timestamp: {payment?.paymentDate || new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>

          {/* FINANCIAL BREAKDOWN LEDGER */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5">
              Itemized Payment Breakdown
            </h4>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Base Item Fare ({booking.detailName})</span>
                <span className="font-mono font-semibold text-slate-800">{formatINR(baseFare)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>GST & Govt Taxes (18%)</span>
                <span className="font-mono font-semibold text-slate-800">{formatINR(taxes)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span>Convenience & Payment Gateway Fee</span>
                <span className="font-mono font-semibold text-emerald-600">FREE / Waived</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-extrabold text-slate-900 border-t-2 border-slate-800">
                <span>Total Amount Paid</span>
                <span className="font-mono text-indigo-600 text-base">{formatINR(total)}</span>
              </div>
            </div>
          </div>

          {/* VERIFICATION BARCODE & QR FOOTER */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-700">Digital Check-In QR</p>
                <p className="text-[10px] text-slate-400">Scan at airport gate or hotel counter</p>
              </div>
            </div>

            <div className="text-center sm:text-right space-y-1">
              <div className="font-mono text-[10px] tracking-widest text-slate-400 select-all">
                ||||| | ||||| |||| ||| ||||||| |||||
              </div>
              <p className="text-[9px] text-slate-400">Issued by TravelHub India • Safe & Certified Transaction</p>
            </div>
          </div>

        </div>

        {/* Bottom Action Footer Bar (Hidden when printing) */}
        <div className="no-print bg-slate-100 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Back to My Trips</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadText}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Voucher (.txt)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF Ticket</span>
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
