import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PaymentDetails } from "../types";
import { 
  X, ShieldCheck, CreditCard, QrCode, Building, Lock, 
  CheckCircle2, Sparkles, AlertCircle, ArrowRight, Wallet
} from "lucide-react";

interface PaymentModalProps {
  itemTitle: string;
  itemSubtitle?: string;
  baseAmount: number;
  itemType: "flight" | "hotel" | "activity" | "cab" | "trip";
  onCancel: () => void;
  onPaymentSuccess: (details: PaymentDetails) => void;
}

const BANKS = [
  { id: "hdfc", name: "HDFC Bank", logo: "🏦" },
  { id: "icici", name: "ICICI Bank", logo: "🏦" },
  { id: "sbi", name: "State Bank of India", logo: "🏛️" },
  { id: "axis", name: "Axis Bank", logo: "🏦" },
  { id: "kotak", name: "Kotak Mahindra Bank", logo: "🏦" },
];

export default function PaymentModal({
  itemTitle,
  itemSubtitle,
  baseAmount,
  itemType,
  onCancel,
  onPaymentSuccess
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "netbanking">("upi");
  
  // UPI Form state
  const [upiId, setUpiId] = useState("");
  const [upiApp, setUpiApp] = useState("gpay");
  
  // Card Form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  
  // Netbanking state
  const [selectedBank, setSelectedBank] = useState("hdfc");
  
  // Coupon Code
  const [coupon, setCoupon] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Processing & State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Financial Calculations
  const taxes = Math.round(baseAmount * 0.18); // 18% GST
  const subtotal = baseAmount + taxes;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = coupon.trim().toUpperCase();
    if (code === "WELCOME500" || code === "FIRSTTRIP") {
      setDiscountAmount(500);
      setCouponApplied(true);
    } else if (code === "TRAVEL20" || code === "EXPLORE20") {
      const disc = Math.round(baseAmount * 0.20);
      setDiscountAmount(disc);
      setCouponApplied(true);
    } else {
      setCouponError("Invalid promo code. Try WELCOME500 or TRAVEL20");
    }
  };

  const handleCardNumberChange = (val: string) => {
    // Format card number with spaces every 4 digits
    const cleaned = val.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(" ") || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handleProcessPayment = () => {
    setIsProcessing(true);

    // Simulate 1.5 seconds bank verification API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      // Determine human readable payment method label
      let methodLabel = "UPI / GPay";
      if (paymentMethod === "upi") {
        methodLabel = `UPI (${upiApp.toUpperCase()}${upiId ? `: ${upiId}` : ""})`;
      } else if (paymentMethod === "card") {
        methodLabel = `Credit Card (**** ${cardNumber.slice(-4) || "4242"})`;
      } else if (paymentMethod === "netbanking") {
        const bankObj = BANKS.find(b => b.id === selectedBank);
        methodLabel = `NetBanking (${bankObj?.name || "HDFC Bank"})`;
      }

      const paymentDetails: PaymentDetails = {
        transactionId: `TXN-IND-${Math.floor(10000000 + Math.random() * 90000000)}`,
        paymentMethod: methodLabel,
        paymentDate: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short"
        }),
        baseFare: baseAmount,
        taxesAndFees: taxes,
        discount: discountAmount,
        totalPaid: finalTotal,
        status: "SUCCESS"
      };

      // Transition to completion callback after short success checkmark delay
      setTimeout(() => {
        onPaymentSuccess(paymentDetails);
      }, 1000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 my-6"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">TravelHub Payment Checkout</h2>
              <p className="text-[11px] text-slate-400">256-Bit SSL Encrypted Indian Gateway</p>
            </div>
          </div>

          {!isProcessing && !isSuccess && (
            <button
              onClick={onCancel}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          
          {/* SUCCESS OVERLAY STATE */}
          {isSuccess ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Payment Successful!</h3>
                <p className="text-xs text-slate-500 mt-1">Transaction verified with bank. Generating official receipt...</p>
              </div>
              <div className="inline-block px-4 py-2 bg-slate-100 rounded-xl text-xs font-mono font-bold text-slate-700">
                Amount Paid: <span className="text-emerald-600 font-extrabold">{formatINR(finalTotal)}</span>
              </div>
            </div>
          ) : isProcessing ? (
            /* PROCESSING STATE */
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Verifying Payment with Bank...</h3>
                <p className="text-xs text-slate-400 mt-1">Please do not close or refresh this window.</p>
              </div>
            </div>
          ) : (
            /* ACTIVE CHECKOUT FORM */
            <>
              {/* Item Summary Card */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest block">
                    Booking Payment
                  </span>
                  <h3 className="text-sm font-bold text-slate-800">{itemTitle}</h3>
                  {itemSubtitle && <p className="text-xs text-slate-500 mt-0.5">{itemSubtitle}</p>}
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Payable Amount</span>
                  <span className="text-lg font-black text-slate-900">{formatINR(finalTotal)}</span>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === "upi"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-indigo-600" />
                    <span>Instant UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === "card"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <span>Credit/Debit Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("netbanking")}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      paymentMethod === "netbanking"
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Building className="w-5 h-5 text-indigo-600" />
                    <span>Net Banking</span>
                  </button>
                </div>
              </div>

              {/* METHOD SPECIFIC INPUT FIELDS */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-4">
                
                {/* 1. UPI TAB */}
                {paymentMethod === "upi" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-xs font-semibold text-slate-500">Popular Apps:</span>
                      {["GPay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                        <button
                          key={app}
                          type="button"
                          onClick={() => setUpiApp(app.toLowerCase())}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                            upiApp === app.toLowerCase()
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-700 border-slate-200"
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 block">
                        Enter UPI ID / VPA
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. mobileNumber@upi or user@okicici"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center gap-2.5 text-xs text-indigo-800">
                      <QrCode className="w-6 h-6 text-indigo-600 shrink-0" />
                      <span>You will receive a push notification request on your {upiApp.toUpperCase()} app to authorize payment.</span>
                    </div>
                  </div>
                )}

                {/* 2. CARD TAB */}
                {paymentMethod === "card" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Card Number</label>
                      <input
                        type="text"
                        placeholder="4532 8920 1289 4242"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          placeholder="12/28"
                          value={expiry}
                          onChange={(e) => handleExpiryChange(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600 block">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                          className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 block">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="As written on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. NET BANKING TAB */}
                {paymentMethod === "netbanking" && (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-slate-600 block">Choose Bank Account</label>
                    <div className="grid grid-cols-1 gap-2">
                      {BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                            selectedBank === bank.id
                              ? "bg-indigo-600 text-white border-indigo-600"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{bank.logo}</span>
                            <span>{bank.name}</span>
                          </span>
                          {selectedBank === bank.id && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Coupon / Discount Code Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Promo Coupon
                  </span>
                  <span className="text-[11px] text-indigo-600 font-semibold cursor-pointer hover:underline" onClick={() => setCoupon("WELCOME500")}>
                    Try code WELCOME500
                  </span>
                </div>

                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME500 or TRAVEL20"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    disabled={couponApplied}
                    className="flex-1 px-3.5 py-1.5 text-xs uppercase font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={couponApplied || !coupon.trim()}
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    {couponApplied ? "Applied!" : "Apply"}
                  </button>
                </form>

                {couponError && <p className="text-[11px] text-red-500 font-medium">{couponError}</p>}
                {couponApplied && (
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Coupon discount of {formatINR(discountAmount)} applied successfully!
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Base Rate</span>
                  <span className="font-mono text-slate-800">{formatINR(baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST & Govt Taxes (18%)</span>
                  <span className="font-mono text-slate-800">{formatINR(taxes)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount Coupon</span>
                    <span className="font-mono">-{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>Total Due</span>
                  <span className="font-mono text-indigo-600 text-base">{formatINR(finalTotal)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handleProcessPayment}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 group"
              >
                <ShieldCheck className="w-5 h-5 text-indigo-200" />
                <span>Pay {formatINR(finalTotal)} & Generate Receipt</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}

        </div>
      </motion.div>
    </div>
  );
}
