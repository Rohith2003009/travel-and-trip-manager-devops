export interface FlightRoute {
  id: string;
  airline: string;
  flightNumber: string;
  airlineLogo: string;
  airlineColor: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: string;
  priceEconomy: number;
  pricePremium: number;
  priceBusiness: number;
  availableSeats: number;
  terminal: string;
}

export const INDIAN_AIRPORTS = [
  { code: "DEL", city: "Delhi / NCR", name: "Indira Gandhi International Airport (DEL)" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj Intl Airport (BOM)" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International Airport (BLR)" },
  { code: "GOI", city: "Goa (Dabolim)", name: "Dabolim Airport (GOI)" },
  { code: "GOX", city: "Goa (Mopa)", name: "Manohar International Airport (GOX)" },
  { code: "JAI", city: "Jaipur", name: "Jaipur International Airport (JAI)" },
  { code: "MAA", city: "Chennai", name: "Chennai International Airport (MAA)" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhash Chandra Bose Intl Airport (CCU)" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International Airport (HYD)" },
  { code: "COK", city: "Cochin / Munnar / Alleppey", name: "Cochin International Airport (COK)" },
  { code: "UDR", city: "Udaipur", name: "Maharana Pratap Airport (UDR)" },
  { code: "SXR", city: "Srinagar (Kashmir)", name: "Sheikh ul-Alam International Airport (SXR)" },
  { code: "IXL", city: "Leh Ladakh", name: "Kushok Bakula Rimpochee Airport (IXL)" },
  { code: "IXB", city: "Bagdogra / Darjeeling", name: "Bagdogra International Airport (IXB)" },
  { code: "CJB", city: "Coimbatore / Ooty", name: "Coimbatore International Airport (CJB)" },
  { code: "IXC", city: "Chandigarh / Manali", name: "Chandigarh International Airport (IXC)" },
  { code: "VNS", city: "Varanasi", name: "Lal Bahadur Shastri Intl Airport (VNS)" },
  { code: "HBX", city: "Hubli / Hampi", name: "Hubballi Airport (HBX)" },
  { code: "PNQ", city: "Pune", name: "Pune International Airport (PNQ)" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel Intl Airport (AMD)" },
  { code: "TRV", city: "Trivandrum", name: "Trivandrum International Airport (TRV)" }
];

export const MOCK_FLIGHTS: FlightRoute[] = [
  // --- DELHI -> GOA (GOI / GOX) ---
  {
    id: "fl-6e-2041",
    airline: "IndiGo",
    flightNumber: "6E-2041",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Goa",
    destinationCode: "GOI",
    departureTime: "06:15 AM",
    arrivalTime: "08:45 AM",
    duration: "2h 30m",
    stops: "Non-stop",
    priceEconomy: 4850,
    pricePremium: 7200,
    priceBusiness: 14500,
    availableSeats: 14,
    terminal: "Terminal 3"
  },
  {
    id: "fl-uk-815",
    airline: "Vistara",
    flightNumber: "UK-815",
    airlineLogo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-purple-700 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Goa",
    destinationCode: "GOI",
    departureTime: "10:30 AM",
    arrivalTime: "01:05 PM",
    duration: "2h 35m",
    stops: "Non-stop",
    priceEconomy: 5600,
    pricePremium: 8900,
    priceBusiness: 18200,
    availableSeats: 8,
    terminal: "Terminal 3"
  },
  {
    id: "fl-qp-1304",
    airline: "Akasa Air",
    flightNumber: "QP-1304",
    airlineLogo: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-orange-500 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Goa",
    destinationCode: "GOX",
    departureTime: "03:45 PM",
    arrivalTime: "06:15 PM",
    duration: "2h 30m",
    stops: "Non-stop",
    priceEconomy: 4390,
    pricePremium: 6800,
    priceBusiness: 13900,
    availableSeats: 18,
    terminal: "Terminal 2"
  },

  // --- GOA -> DELHI (RETURN) ---
  {
    id: "fl-ret-6e-2042",
    airline: "IndiGo",
    flightNumber: "6E-2042",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Goa",
    originCode: "GOI",
    destination: "Delhi",
    destinationCode: "DEL",
    departureTime: "11:20 AM",
    arrivalTime: "01:50 PM",
    duration: "2h 30m",
    stops: "Non-stop",
    priceEconomy: 4950,
    pricePremium: 7400,
    priceBusiness: 14900,
    availableSeats: 12,
    terminal: "Terminal 1"
  },
  {
    id: "fl-ret-uk-816",
    airline: "Vistara",
    flightNumber: "UK-816",
    airlineLogo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-purple-700 text-white",
    origin: "Goa",
    originCode: "GOI",
    destination: "Delhi",
    destinationCode: "DEL",
    departureTime: "05:10 PM",
    arrivalTime: "07:45 PM",
    duration: "2h 35m",
    stops: "Non-stop",
    priceEconomy: 5800,
    pricePremium: 9100,
    priceBusiness: 18500,
    availableSeats: 6,
    terminal: "Terminal 1"
  },

  // --- DELHI -> LEH LADAKH (IXL) ---
  {
    id: "fl-6e-122",
    airline: "IndiGo",
    flightNumber: "6E-122",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Leh Ladakh",
    destinationCode: "IXL",
    departureTime: "05:30 AM",
    arrivalTime: "06:55 AM",
    duration: "1h 25m",
    stops: "Non-stop",
    priceEconomy: 7450,
    pricePremium: 10800,
    priceBusiness: 21500,
    availableSeats: 10,
    terminal: "Terminal 3"
  },
  {
    id: "fl-ai-445",
    airline: "Air India",
    flightNumber: "AI-445",
    airlineLogo: "https://images.unsplash.com/photo-1519074069444-1ba4ed168383?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-red-600 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Leh Ladakh",
    destinationCode: "IXL",
    departureTime: "06:45 AM",
    arrivalTime: "08:15 AM",
    duration: "1h 30m",
    stops: "Non-stop",
    priceEconomy: 8100,
    pricePremium: 11900,
    priceBusiness: 23900,
    availableSeats: 7,
    terminal: "Terminal 3"
  },

  // --- LEH LADAKH -> DELHI (RETURN) ---
  {
    id: "fl-ret-6e-123",
    airline: "IndiGo",
    flightNumber: "6E-123",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Leh Ladakh",
    originCode: "IXL",
    destination: "Delhi",
    destinationCode: "DEL",
    departureTime: "08:10 AM",
    arrivalTime: "09:35 AM",
    duration: "1h 25m",
    stops: "Non-stop",
    priceEconomy: 7600,
    pricePremium: 11100,
    priceBusiness: 22000,
    availableSeats: 9,
    terminal: "Main Gate"
  },

  // --- MUMBAI -> BENGALURU ---
  {
    id: "fl-ai-512",
    airline: "Air India",
    flightNumber: "AI-512",
    airlineLogo: "https://images.unsplash.com/photo-1519074069444-1ba4ed168383?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-red-600 text-white",
    origin: "Mumbai",
    originCode: "BOM",
    destination: "Bengaluru",
    destinationCode: "BLR",
    departureTime: "07:00 AM",
    arrivalTime: "08:40 AM",
    duration: "1h 40m",
    stops: "Non-stop",
    priceEconomy: 3400,
    pricePremium: 5800,
    priceBusiness: 11200,
    availableSeats: 22,
    terminal: "Terminal 2"
  },

  // --- BENGALURU -> COCHIN (MUNNAR / ALLEPPEY) ---
  {
    id: "fl-qp-1102",
    airline: "Akasa Air",
    flightNumber: "QP-1102",
    airlineLogo: "https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-orange-500 text-white",
    origin: "Bengaluru",
    originCode: "BLR",
    destination: "Cochin",
    destinationCode: "COK",
    departureTime: "02:15 PM",
    arrivalTime: "03:20 PM",
    duration: "1h 05m",
    stops: "Non-stop",
    priceEconomy: 2950,
    pricePremium: 4500,
    priceBusiness: 9800,
    availableSeats: 19,
    terminal: "Terminal 1"
  },

  // --- DELHI -> SRINAGAR (SXR) ---
  {
    id: "fl-sg-301",
    airline: "SpiceJet",
    flightNumber: "SG-301",
    airlineLogo: "https://images.unsplash.com/photo-1521967906867-14ec9d64bee8?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-amber-600 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Srinagar",
    destinationCode: "SXR",
    departureTime: "08:20 AM",
    arrivalTime: "09:50 AM",
    duration: "1h 30m",
    stops: "Non-stop",
    priceEconomy: 6100,
    pricePremium: 9400,
    priceBusiness: 19500,
    availableSeats: 6,
    terminal: "Terminal 1D"
  },

  // --- MUMBAI -> GOA ---
  {
    id: "fl-6e-553",
    airline: "IndiGo",
    flightNumber: "6E-553",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Mumbai",
    originCode: "BOM",
    destination: "Goa",
    destinationCode: "GOI",
    departureTime: "05:45 PM",
    arrivalTime: "06:55 PM",
    duration: "1h 10m",
    stops: "Non-stop",
    priceEconomy: 3800,
    pricePremium: 5900,
    priceBusiness: 12500,
    availableSeats: 11,
    terminal: "Terminal 2"
  },

  // --- DELHI -> UDAIPUR (UDR) ---
  {
    id: "fl-uk-992",
    airline: "Vistara",
    flightNumber: "UK-992",
    airlineLogo: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-purple-700 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Udaipur",
    destinationCode: "UDR",
    departureTime: "01:10 PM",
    arrivalTime: "02:25 PM",
    duration: "1h 15m",
    stops: "Non-stop",
    priceEconomy: 4900,
    pricePremium: 7800,
    priceBusiness: 15900,
    availableSeats: 9,
    terminal: "Terminal 3"
  },

  // --- DELHI -> JAIPUR (JAI) ---
  {
    id: "fl-6e-711",
    airline: "IndiGo",
    flightNumber: "6E-711",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Jaipur",
    destinationCode: "JAI",
    departureTime: "07:30 AM",
    arrivalTime: "08:25 AM",
    duration: "0h 55m",
    stops: "Non-stop",
    priceEconomy: 3200,
    pricePremium: 4800,
    priceBusiness: 9800,
    availableSeats: 15,
    terminal: "Terminal 2"
  },

  // --- KOLKATA -> BAGDOGRA (DARJEELING / IXB) ---
  {
    id: "fl-6e-6101",
    airline: "IndiGo",
    flightNumber: "6E-6101",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Kolkata",
    originCode: "CCU",
    destination: "Bagdogra",
    destinationCode: "IXB",
    departureTime: "09:15 AM",
    arrivalTime: "10:20 AM",
    duration: "1h 05m",
    stops: "Non-stop",
    priceEconomy: 3900,
    pricePremium: 5800,
    priceBusiness: 11900,
    availableSeats: 14,
    terminal: "Terminal 1"
  },

  // --- BENGALURU -> COIMBATORE (OOTY / CJB) ---
  {
    id: "fl-6e-772",
    airline: "IndiGo",
    flightNumber: "6E-772",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Bengaluru",
    originCode: "BLR",
    destination: "Coimbatore",
    destinationCode: "CJB",
    departureTime: "11:40 AM",
    arrivalTime: "12:30 PM",
    duration: "0h 50m",
    stops: "Non-stop",
    priceEconomy: 2800,
    pricePremium: 4200,
    priceBusiness: 8900,
    availableSeats: 16,
    terminal: "Terminal 1"
  },

  // --- DELHI -> CHANDIGARH (MANALI / IXC) ---
  {
    id: "fl-ai-812",
    airline: "Air India",
    flightNumber: "AI-812",
    airlineLogo: "https://images.unsplash.com/photo-1519074069444-1ba4ed168383?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-red-600 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Chandigarh",
    destinationCode: "IXC",
    departureTime: "08:15 AM",
    arrivalTime: "09:10 AM",
    duration: "0h 55m",
    stops: "Non-stop",
    priceEconomy: 3100,
    pricePremium: 4600,
    priceBusiness: 9200,
    availableSeats: 18,
    terminal: "Terminal 3"
  },

  // --- DELHI -> VARANASI (VNS) ---
  {
    id: "fl-6e-2114",
    airline: "IndiGo",
    flightNumber: "6E-2114",
    airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
    airlineColor: "bg-blue-600 text-white",
    origin: "Delhi",
    originCode: "DEL",
    destination: "Varanasi",
    destinationCode: "VNS",
    departureTime: "10:05 AM",
    arrivalTime: "11:30 AM",
    duration: "1h 25m",
    stops: "Non-stop",
    priceEconomy: 4200,
    pricePremium: 6400,
    priceBusiness: 13500,
    availableSeats: 12,
    terminal: "Terminal 2"
  }
];

/**
 * Intelligent Real-World Flight Resolver.
 * Given an origin code and destination code, if exact matching flights exist in MOCK_FLIGHTS, returns them.
 * If there are missing or insufficient options, dynamically generates realistic, high-fidelity flight routes.
 */
export function getFlightsForRoute(origCode: string, destCode: string): FlightRoute[] {
  const origAirport = INDIAN_AIRPORTS.find(a => a.code === origCode) || { city: origCode, code: origCode, name: origCode };
  const destAirport = INDIAN_AIRPORTS.find(a => a.code === destCode) || { city: destCode, code: destCode, name: destCode };

  // Find direct seeded flights
  const existingMatches = MOCK_FLIGHTS.filter(
    f => (f.originCode === origCode || f.origin.toLowerCase().includes(origAirport.city.toLowerCase())) &&
         (f.destinationCode === destCode || f.destination.toLowerCase().includes(destAirport.city.toLowerCase()))
  );

  if (existingMatches.length >= 3) {
    return existingMatches;
  }

  // Generate realistic flight schedule
  const airlines = [
    { name: "IndiGo", prefix: "6E", color: "bg-blue-600 text-white", terminal: "Terminal 2", priceMultiplier: 1.0 },
    { name: "Air India", prefix: "AI", color: "bg-red-600 text-white", terminal: "Terminal 3", priceMultiplier: 1.15 },
    { name: "Vistara", prefix: "UK", color: "bg-purple-700 text-white", terminal: "Terminal 3", priceMultiplier: 1.22 },
    { name: "Akasa Air", prefix: "QP", color: "bg-orange-500 text-white", terminal: "Terminal 1", priceMultiplier: 0.92 },
    { name: "SpiceJet", prefix: "SG", color: "bg-amber-600 text-white", terminal: "Terminal 1D", priceMultiplier: 0.95 }
  ];

  const timeSlots = [
    { dep: "06:20 AM", arr: "08:35 AM", duration: "2h 15m" },
    { dep: "09:45 AM", arr: "12:00 PM", duration: "2h 15m" },
    { dep: "02:10 PM", arr: "04:30 PM", duration: "2h 20m" },
    { dep: "06:30 PM", arr: "08:50 PM", duration: "2h 20m" },
    { dep: "09:15 PM", arr: "11:30 PM", duration: "2h 15m" }
  ];

  // Estimate base fare based on airport types
  const isHighAltitude = ["IXL", "SXR"].includes(destCode) || ["IXL", "SXR"].includes(origCode);
  const baseFare = isHighAltitude ? 6800 : 3800;

  const generatedList: FlightRoute[] = timeSlots.map((slot, idx) => {
    const airline = airlines[idx % airlines.length];
    const num = Math.floor(100 + Math.random() * 899);
    const flightNum = `${airline.prefix}-${num}`;
    const econPrice = Math.round((baseFare * airline.priceMultiplier) + (idx * 350));

    return {
      id: `gen-flight-${origCode}-${destCode}-${idx}`,
      airline: airline.name,
      flightNumber: flightNum,
      airlineLogo: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=100&q=80",
      airlineColor: airline.color,
      origin: origAirport.city,
      originCode: origCode,
      destination: destAirport.city,
      destinationCode: destCode,
      departureTime: slot.dep,
      arrivalTime: slot.arr,
      duration: slot.duration,
      stops: idx === 3 ? "1 Stop (DEL)" : "Non-stop",
      priceEconomy: econPrice,
      pricePremium: Math.round(econPrice * 1.55),
      priceBusiness: Math.round(econPrice * 3.1),
      availableSeats: Math.floor(4 + Math.random() * 18),
      terminal: airline.terminal
    };
  });

  // Combine seeded + generated
  const combined = [...existingMatches];
  generatedList.forEach(gen => {
    if (!combined.some(c => c.departureTime === gen.departureTime)) {
      combined.push(gen);
    }
  });

  return combined;
}

/**
 * Maps a destination name or location string to its closest Indian Airport Code
 */
export function getDestinationAirportCode(locationName: string): string {
  if (!locationName) return "GOI";
  const str = locationName.toLowerCase();

  if (str.includes("leh") || str.includes("ladakh")) return "IXL";
  if (str.includes("goa")) return "GOI";
  if (str.includes("jaipur") || str.includes("ranthambore")) return "JAI";
  if (str.includes("munnar") || str.includes("alleppey") || str.includes("kerala") || str.includes("cochin") || str.includes("kochi")) return "COK";
  if (str.includes("varanasi") || str.includes("kashi")) return "VNS";
  if (str.includes("darjeeling") || str.includes("bagdogra") || str.includes("sikkim")) return "IXB";
  if (str.includes("ooty") || str.includes("coimbatore") || str.includes("nilgiri")) return "CJB";
  if (str.includes("manali") || str.includes("shimla") || str.includes("kullu") || str.includes("chandigarh") || str.includes("himachal")) return "IXC";
  if (str.includes("udaipur")) return "UDR";
  if (str.includes("hampi") || str.includes("hubli")) return "HBX";
  if (str.includes("srinagar") || str.includes("kashmir")) return "SXR";
  if (str.includes("delhi") || str.includes("ncr") || str.includes("gurgaon") || str.includes("noida")) return "DEL";
  if (str.includes("mumbai") || str.includes("pune") || str.includes("maharashtra")) return "BOM";
  if (str.includes("bengaluru") || str.includes("bangalore") || str.includes("karnataka")) return "BLR";
  if (str.includes("chennai") || str.includes("tamil")) return "MAA";
  if (str.includes("kolkata") || str.includes("calcutta") || str.includes("bengal")) return "CCU";
  if (str.includes("hyderabad") || str.includes("telangana")) return "HYD";

  // Try matching in INDIAN_AIRPORTS list
  const found = INDIAN_AIRPORTS.find(a => 
    a.city.toLowerCase().includes(str) || 
    a.name.toLowerCase().includes(str) || 
    a.code.toLowerCase() === str
  );

  return found ? found.code : "GOI";
}
