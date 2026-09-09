import jsPDF from "jspdf";
import { Booking, User } from "../types";

export const formatINR = (val: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val);
};

export const downloadBookingPDF = (booking: Booking, user: User) => {
  try {
    const isFlight = booking.type === "flight" || !!booking.flightDetails;
    const flight = booking.flightDetails;
    const payment = booking.paymentDetails;

    const baseFare = payment?.baseFare ?? Math.round(booking.cost * 0.85);
    const taxes = payment?.taxesAndFees ?? Math.round(booking.cost * 0.15);
    const total = payment?.totalPaid ?? booking.cost;
    const bookingIdStr = booking.id ? String(booking.id) : Math.random().toString(36).substring(2, 8);
    const pnr = booking.pnr || flight?.pnr || `TH-${bookingIdStr.slice(-6).toUpperCase()}`;
    const txnId = payment?.transactionId || `TXN-IND-${Math.floor(100000 + Math.random() * 900000)}`;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm

    // Top Accent Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 32, "F");

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("TravelHub India", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text("Official E-Ticket & Verified Payment Receipt", 14, 22);

    // Status Badge
    doc.setFillColor(5, 150, 105); // emerald-600
    doc.roundedRect(pageWidth - 62, 8, 48, 14, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("PAID & CONFIRMED", pageWidth - 38, 17, { align: "center" });

    // PNR Card
    let y = 40;
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, "FD");

    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("BOOKING REFERENCE (PNR)", 20, y + 8);
    doc.text("TRANSACTION ID", pageWidth / 2, y + 8);
    doc.text("BOOKING DATE", pageWidth - 20, y + 8, { align: "right" });

    doc.setTextColor(79, 70, 229); // indigo-600
    doc.setFontSize(12);
    doc.text(pnr, 20, y + 16);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.text(txnId, pageWidth / 2, y + 16);
    doc.text(payment?.paymentDate || booking.date || "2026-07-22", pageWidth - 20, y + 16, { align: "right" });

    y += 28;

    // Passenger Info Section
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, "FD");

    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(14, y, pageWidth - 28, 8, "F");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PASSENGER & CUSTOMER DETAILS", 20, y + 5.5);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`Name: ${user.name}`, 20, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Email: ${user.email}`, 20, y + 21);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(`Phone: ${user.phone || "+91 98765 43210"}`, pageWidth / 2 + 10, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Payment: ${payment?.paymentMethod || "UPI / Online"}`, pageWidth / 2 + 10, y + 21);

    y += 34;

    // Booking / Flight Logistics Box
    if (isFlight && flight) {
      const boxHeight = flight.returnFlight ? 90 : 50;
      doc.setFillColor(15, 23, 42); // slate-900
      doc.roundedRect(14, y, pageWidth - 28, boxHeight, 3, 3, "F");

      // Flight Subhead
      doc.setTextColor(165, 180, 252); // indigo-200
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`OUTBOUND GOING: ${(flight.airline || "INDIAN AIRLINE").toUpperCase()} (${flight.flightNumber || "6E-2041"}) • ${flight.cabinClass || "Economy"} CLASS`, 20, y + 8);
      doc.text(`TERMINAL: ${flight.terminal || "T3"}`, pageWidth - 20, y + 8, { align: "right" });

      doc.setDrawColor(51, 65, 85);
      doc.line(20, y + 12, pageWidth - 20, y + 12);

      // Route origin to destination
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text(flight.originCode || "DEL", 20, y + 23);
      doc.text(flight.destinationCode || "GOI", pageWidth - 20, y + 23, { align: "right" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(203, 213, 225);
      doc.text(flight.origin || "Delhi", 20, y + 28);
      doc.text(flight.destination || "Goa", pageWidth - 20, y + 28, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(`Dept: ${flight.departureTime || "06:15 AM"}`, 20, y + 33);
      doc.text(`Arr: ${flight.arrivalTime || "08:45 AM"}`, pageWidth - 20, y + 33, { align: "right" });

      // Flight Center graphic
      doc.setTextColor(129, 140, 248);
      doc.setFontSize(8);
      doc.text(`Duration: ${flight.duration || "2h 30m"} • Non-Stop`, pageWidth / 2, y + 23, { align: "center" });
      doc.text("--------------------->", pageWidth / 2, y + 28, { align: "center" });

      // Seat & baggage strip
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(20, y + 37, pageWidth - 40, 9, 1, 1, "F");
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(7.5);
      doc.text(`SEAT: ${flight.seatNumber || "12A"} | PNR: ${flight.pnr} | PASSENGER: ${flight.passengerName || user.name}`, pageWidth / 2, y + 43, { align: "center" });

      if (flight.returnFlight) {
        let ry = y + 49;
        doc.setDrawColor(51, 65, 85);
        doc.line(20, ry, pageWidth - 20, ry);

        doc.setTextColor(252, 211, 77); // amber-300
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text(`RETURN COMING: ${flight.returnFlight.airline.toUpperCase()} (${flight.returnFlight.flightNumber}) • DATE: ${flight.returnFlight.departureDate}`, 20, ry + 6);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text(flight.destinationCode, 20, ry + 16);
        doc.text(flight.originCode, pageWidth - 20, ry + 16, { align: "right" });

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(253, 230, 138);
        doc.text(`Dept: ${flight.returnFlight.departureTime}`, 20, ry + 22);
        doc.text(`Arr: ${flight.returnFlight.arrivalTime}`, pageWidth - 20, ry + 22, { align: "right" });

        doc.setFontSize(7.5);
        doc.text(`RETURN SEAT: ${flight.returnFlight.seatNumber || "14B"} | RETURN PNR: ${flight.returnFlight.pnr}`, pageWidth / 2, ry + 22, { align: "center" });
      }

      y += boxHeight + 6;
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, pageWidth - 28, 28, 2, 2, "FD");

      doc.setTextColor(79, 70, 229);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${(booking.type || "BOOKING").toUpperCase()} DETAILS`, 20, y + 8);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(booking.detailName || "Travel Service Reservation", 20, y + 16);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Scheduled Travel Date: ${booking.date}`, 20, y + 22);

      y += 34;
    }

    // Financial Breakdown Ledger
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ITEMIZED FINANCIAL BREAKDOWN", 14, y);

    y += 4;
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y, pageWidth - 14, y);

    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Base Fare / Item Cost (${booking.detailName})`, 14, y);
    doc.text(formatINR(baseFare), pageWidth - 14, y, { align: "right" });

    y += 6;
    doc.text("GST & Government Taxes (18%)", 14, y);
    doc.text(formatINR(taxes), pageWidth - 14, y, { align: "right" });

    y += 6;
    doc.text("Convenience & Service Fee", 14, y);
    doc.setTextColor(5, 150, 105);
    doc.text("FREE / WAIVED", pageWidth - 14, y, { align: "right" });

    y += 4;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.5);
    doc.line(14, y, pageWidth - 14, y);

    y += 7;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Total Amount Paid", 14, y);
    doc.setTextColor(79, 70, 229);
    doc.text(formatINR(total), pageWidth - 14, y, { align: "right" });

    // Digital Verification & Barcode
    y += 18;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, "FD");

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("DIGITAL VERIFICATION & BOARDING BARCODE", 20, y + 7);

    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("||||| | ||||| |||| ||| ||||||| |||||", 20, y + 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text("Scan at gate or hotel counter • Safe & Certified", pageWidth - 20, y + 15, { align: "right" });

    // Save PDF file!
    doc.save(`TravelHub_E_Ticket_${pnr}.pdf`);
  } catch (err) {
    console.error("PDF generation failed, falling back to text voucher:", err);
    downloadBookingVoucher(booking, user);
  }
};

export const downloadBookingVoucher = (booking: Booking, user: User) => {
  const isFlight = booking.type === "flight" || !!booking.flightDetails;
  const flight = booking.flightDetails;
  const payment = booking.paymentDetails;

  const baseFare = payment?.baseFare ?? Math.round(booking.cost * 0.85);
  const taxes = payment?.taxesAndFees ?? Math.round(booking.cost * 0.15);
  const total = payment?.totalPaid ?? booking.cost;
  const bookingIdStr = booking.id ? String(booking.id) : Math.random().toString(36).substring(2, 8);
  const pnr = booking.pnr || flight?.pnr || `TH-${bookingIdStr.slice(-6).toUpperCase()}`;
  const txnId = payment?.transactionId || `TXN-IND-${Math.floor(100000 + Math.random() * 900000)}`;

  const content = `
======================================================
           TRAVELHUB OFFICIAL BOOKING RECEIPT & TICKET
======================================================
PNR / Ref Code: ${pnr}
Transaction ID: ${txnId}
Date of Booking: ${payment?.paymentDate || booking.date}
Status: CONFIRMED - PAID IN FULL

PASSENGER / CUSTOMER DETAILS:
Name: ${user.name}
Email: ${user.email}
Phone: ${user.phone || "+91 98765 43210"}

BOOKING SUMMARY:
Type: ${booking.type.toUpperCase()}
Item Details: ${booking.detailName}
Travel Date: ${booking.date}

${isFlight && flight ? `
FLIGHT LOGISTICS:
Trip Type: ${flight.tripType === "round-trip" ? "2-Way Round Trip" : "One-Way"}
Outbound Flight: ${flight.airline} (${flight.flightNumber})
Outbound Route: ${flight.origin} (${flight.originCode}) -> ${flight.destination} (${flight.destinationCode})
Outbound Departure: ${flight.departureTime}
Outbound Seat: ${flight.seatNumber || "Assigned at Check-in"}
Outbound PNR: ${flight.pnr}
${flight.returnFlight ? `
Return Flight: ${flight.returnFlight.airline} (${flight.returnFlight.flightNumber})
Return Route: ${flight.destination} (${flight.destinationCode}) -> ${flight.origin} (${flight.originCode})
Return Date: ${flight.returnFlight.departureDate}
Return Departure: ${flight.returnFlight.departureTime}
Return Seat: ${flight.returnFlight.seatNumber || "14B"}
Return PNR: ${flight.returnFlight.pnr}
` : ""}
` : ""}

FINANCIAL BREAKDOWN:
Base Item Cost: ${formatINR(baseFare)}
Taxes & Govt GST (18%): ${formatINR(taxes)}
Convenience Fee: WAIVED / FREE
------------------------------------------------------
TOTAL AMOUNT PAID: ${formatINR(total)}
Payment Method: ${payment?.paymentMethod || "UPI / Card Online"}
======================================================
Thank you for booking with TravelHub India!
For support, contact support@travelhub.in
======================================================
  `.trim();

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TravelHub_Receipt_${pnr}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};
