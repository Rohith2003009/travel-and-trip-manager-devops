export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  emergencyContact: string;
  preferredStyle: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  phone?: string;
  foodPreference?: string;
  paymentMethod?: string;
}

export interface Destination {
  id: string;
  name: string;
  state: string;
  category: "Mountains" | "Beaches" | "Heritage" | "Nature" | "Wildlife" | string;
  description: string;
  imageUrl: string;
  idealDays: number;
  estimatedCost: number;
  highlights: string[];
  attractions: string[];
}

export interface Trip {
  id: string;
  title: string;
  destinationId: string;
  userId: string;
  startDate: string;
  endDate: string;
  budget: number;
  members: string[];
  notes: string;
  destination?: Destination;
}

export interface PaymentDetails {
  transactionId: string;
  paymentMethod: string;
  paymentDate: string;
  baseFare: number;
  taxesAndFees: number;
  discount: number;
  totalPaid: number;
  status: "SUCCESS" | "PENDING" | "FAILED";
}

export interface FlightDetails {
  tripType?: "one-way" | "round-trip";
  flightNumber: string;
  airline: string;
  airlineLogo?: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cabinClass: "Economy" | "Premium Economy" | "Business";
  seatNumber?: string;
  passengerName?: string;
  pnr: string;
  terminal?: string;
  returnFlight?: {
    flightNumber: string;
    airline: string;
    airlineLogo?: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    seatNumber?: string;
    pnr: string;
    terminal?: string;
  };
}

export interface Booking {
  id: string;
  tripId: string;
  userId: string;
  type: "flight" | "hotel" | "activity" | "cab";
  detailName: string;
  cost: number;
  date: string;
  status: "confirmed" | "pending" | "cancelled";
  tripTitle?: string;
  destination?: Destination;
  userName?: string;
  userEmail?: string;
  pnr?: string;
  paymentDetails?: PaymentDetails;
  flightDetails?: FlightDetails;
}

export interface Expense {
  id: string;
  tripId: string;
  userId: string;
  amount: number;
  category: "food" | "transport" | "lodging" | "sightseeing" | "misc";
  description: string;
  date: string;
  paidBy: string;
  splitType: "equal" | "unequal";
  splitDetails: { [name: string]: number };
}

export interface MemberBalance {
  paid: number;
  owed: number;
  net: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface DashboardSummary {
  totalBudget: number;
  totalSpend: number;
  activeTripsCount: number;
  upcomingBookingsCount: number;
  categoryData: { name: string; value: number }[];
  tripChartData: { name: string; Budget: number; Spend: number }[];
  tripsCount: number;
}

export interface AdminSummary {
  userCount: number;
  destinationCount: number;
  tripCount: number;
  bookingCount: number;
  totalBookingRevenue: number;
  flightRevenue?: number;
  bookingStatuses: { confirmed: number; pending: number; cancelled: number };
  popularDestinations: { name: string; trips: number }[];
  usersWithTripsCount?: number;
  usersWithFlightsCount?: number;
  revenueChartData?: { category: string; revenue: number; count: number; color: string }[];
  userBookingChartData?: { id?: string; name: string; fullName: string; email: string; role?: string; avatarUrl?: string; trips: number; flights: number; totalSpend: number }[];
  tripsStatusChartData?: { status: string; count: number; color: string }[];
  activeTripsCount?: number;
  plannedTripsCount?: number;
  completedTripsCount?: number;
}

export interface LiveFlightTracker {
  flightNumber: string;
  airline: string;
  pnr?: string;
  aircraftType: string;
  registration: string;
  status: "In Air" | "Boarding" | "On Time" | "Taxiing" | "Landed" | "Delayed" | "Scheduled";
  statusBadge: { text: string; bg: string; textClr: string };
  origin: {
    name: string;
    code: string;
    city: string;
    terminal: string;
    gate: string;
    scheduledDeparture: string;
    actualDeparture: string;
    weather: { temp: string; condition: string; wind: string };
  };
  destination: {
    name: string;
    code: string;
    city: string;
    terminal: string;
    gate: string;
    baggageClaim: string;
    scheduledArrival: string;
    estimatedArrival: string;
    weather: { temp: string; condition: string; wind: string };
  };
  telemetry: {
    altitudeFt: number;
    speedKmph: number;
    headingDegrees: number;
    progressPercent: number;
    elapsedMinutes: number;
    remainingMinutes: number;
    distanceCoveredKm: number;
    distanceRemainingKm: number;
    totalDistanceKm: number;
    latitude: number;
    longitude: number;
  };
  events: { time: string; text: string; type: "info" | "success" | "warning" }[];
}
