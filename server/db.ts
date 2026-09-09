import fs from "fs";
import path from "path";
import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

// ---------------------------------------------------------
// REAL MONGODB (COMPASS / ATLAS) & JSON FALLBACK PERSISTENCE
// Connects to real MongoDB Compass or MongoDB Atlas when MONGODB_URI
// is configured. Seamlessly seeds collections and handles CRUD operations.
// ---------------------------------------------------------

const DB_FILE = path.join(process.cwd(), "data-store.json");

// Default Preloaded Destinations in India
const defaultDestinations = [
  {
    id: "dest-1",
    name: "Leh Ladakh",
    state: "Jammu & Kashmir",
    category: "Mountains",
    description: "An adventure lover's paradise with breathtaking high-altitude passes, crystal clear lakes, and mesmerizing monasteries.",
    imageUrl: "https://images.unsplash.com/photo-1544085311-11a028465b03?auto=format&fit=crop&w=800&q=80",
    idealDays: 7,
    estimatedCost: 35000,
    highlights: ["Pangong Tso", "Khardung La Pass", "Magnetic Hill", "Thiksey Monastery"],
    attractions: ["Nubra Valley", "Shanti Stupa", "Hemis National Park"]
  },
  {
    id: "dest-2",
    name: "Goa",
    state: "Goa",
    category: "Beaches",
    description: "A coastal retreat famous for its sun-kissed beaches, active nightlife, historic Portuguese architecture, and spicy seafood.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    idealDays: 4,
    estimatedCost: 18000,
    highlights: ["Calangute Beach", "Fort Aguada", "Basilica of Bom Jesus", "Dudhsagar Falls"],
    attractions: ["Baga Beach", "Anjuna Flea Market", "Spice Plantation"]
  },
  {
    id: "dest-3",
    name: "Jaipur",
    state: "Rajasthan",
    category: "Heritage",
    description: "The magnificent Pink City, home to majestic hill forts, ornate royal palaces, and vibrant artisan markets filled with handicrafts.",
    imageUrl: "https://images.unsplash.com/photo-1477584308800-b442fda52431?auto=format&fit=crop&w=800&q=80",
    idealDays: 3,
    estimatedCost: 12000,
    highlights: ["Amer Fort", "Hawa Mahal", "City Palace", "Jantar Mantar"],
    attractions: ["Chokhi Dhani", "Nahargarh Fort", "Bapu Bazaar"]
  },
  {
    id: "dest-4",
    name: "Munnar",
    state: "Kerala",
    category: "Nature",
    description: "A tranquil hill station adorned with sprawling lush green tea plantations, winding lanes, mist-covered hills, and scenic waterfalls.",
    imageUrl: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=800&q=80",
    idealDays: 3,
    estimatedCost: 15000,
    highlights: ["Eravikulam National Park", "Mattupetty Dam", "Anamudi Peak", "Tea Museum"],
    attractions: ["Attukad Waterfalls", "Echo Point", "Top Station"]
  },
  {
    id: "dest-5",
    name: "Varanasi",
    state: "Uttar Pradesh",
    category: "Heritage",
    description: "One of the oldest continually inhabited cities in the world, renowned for its sacred bathing ghats, spectacular Ganga Aarti, and temples.",
    imageUrl: "https://wallpapercave.com/wp/wp6612900.jpg",
    idealDays: 3,
    estimatedCost: 10000,
    highlights: ["Kashi Vishwanath Temple", "Dashashwamedh Ghat Aarti", "Sarnath", "Banaras Ghats"],
    attractions: ["Assi Ghat", "Ramnagar Fort", "Ganga Boat Ride"]
  },
  {
    id: "dest-6",
    name: "Ranthambore",
    state: "Rajasthan",
    category: "Wildlife",
    description: "A prime wildlife reserve hosting majestic Royal Bengal Tigers, historic ruins of the 10th-century fort, and rich forest ecosystems.",
    imageUrl: "https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?auto=format&fit=crop&w=800&q=80",
    idealDays: 3,
    estimatedCost: 20000,
    highlights: ["Tiger Safari", "Ranthambore Fort", "Padam Talao Lake", "Trinetra Ganesha Temple"],
    attractions: ["Jogi Mahal", "Raj Bagh Ruins", "Kachida Valley"]
  },
  {
    id: "dest-7",
    name: "Alleppey",
    state: "Kerala",
    category: "Nature",
    description: "Famous for its beautiful backwater houseboats, tranquil canals, coconut groves, and coir industries.",
    imageUrl: "https://images.unsplash.com/photo-1593693411515-c202e974eb89?auto=format&fit=crop&w=800&q=80",
    idealDays: 3,
    estimatedCost: 16000,
    highlights: ["Houseboat Stay", "Alappuzha Beach", "Pathiramanal Island", "Vembanad Lake"],
    attractions: ["Kuttanad Backwaters", "Ambalappuzha Temple", "Marari Beach"]
  },
  {
    id: "dest-8",
    name: "Darjeeling",
    state: "West Bengal",
    category: "Mountains",
    description: "The jewel of the Himalayas, known for its pristine tea gardens, majestic views of Mt. Kanchenjunga, and the UNESCO heritage Toy Train.",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
    idealDays: 4,
    estimatedCost: 22000,
    highlights: ["Tiger Hill Sunrise", "Toy Train Ride", "Batasia Loop", "Ghoom Monastery"],
    attractions: ["Himalayan Mountaineering Institute", "Happy Valley Tea Estate", "Rock Garden"]
  },
  {
    id: "dest-9",
    name: "Hampi",
    state: "Karnataka",
    category: "Heritage",
    description: "An ancient open-air museum filled with majestic ruins, colossal boulders, monolithic structures, and intricate temple architecture from the Vijayanagara Empire.",
    imageUrl: "https://images.unsplash.com/photo-1600100397990-a47254b3ded9?auto=format&fit=crop&w=800&q=80",
    idealDays: 3,
    estimatedCost: 11000,
    highlights: ["Virupaksha Temple", "Stone Chariot at Vittala Temple", "Hemakuta Hill Sunset", "Lotus Mahal"],
    attractions: ["Hampi Bazaar", "Matanga Hill", "Tungabhadra River Ferry"]
  },
  {
    id: "dest-10",
    name: "Ooty",
    state: "Tamil Nadu",
    category: "Nature",
    description: "The Queen of Hill Stations, featuring beautiful botanical gardens, serene lakes, sprawling tea plantations, and cool mountain breezes.",
    imageUrl: "https://images.unsplash.com/photo-1583258292688-d0213df4a3a8?auto=format&fit=crop&w=800&q=80",
    idealDays: 3,
    estimatedCost: 14000,
    highlights: ["Botanical Gardens", "Ooty Lake Boating", "Doddabetta Peak", "Nilgiri Mountain Railway"],
    attractions: ["Pykara Waterfalls", "Rose Garden", "Tea Museum"]
  },
  {
    id: "dest-11",
    name: "Manali",
    state: "Himachal Pradesh",
    category: "Mountains",
    description: "A high-altitude Himalayan resort town known for its backpacking, snow sports, gorgeous Solang Valley, and scenic mountain villages.",
    imageUrl: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=800&q=80",
    idealDays: 5,
    estimatedCost: 25000,
    highlights: ["Solang Valley", "Rohtang Pass", "Hadimba Temple", "Jogini Waterfalls"],
    attractions: ["Old Manali Café hopping", "Vashisht Hot Springs", "Mall Road"]
  },
  {
    id: "dest-12",
    name: "Udaipur",
    state: "Rajasthan",
    category: "Heritage",
    description: "The City of Lakes, celebrated for its shimmering water reservoirs, majestic white palaces, romantic lake cruises, and heritage hotels.",
    imageUrl: "https://images.unsplash.com/photo-1590050752117-238cb061295a?auto=format&fit=crop&w=800&q=80",
    idealDays: 3,
    estimatedCost: 18000,
    highlights: ["Lake Palace (Jag Niwas)", "City Palace Complex", "Jagdish Temple", "Sajjangarh Monsoon Palace"],
    attractions: ["Saheliyon-ki-Bari", "Fateh Sagar Lake Boat Cruise", "Dharohar Folk Dance Show"]
  }
];

// Default Preloaded Users
const defaultUsers = [
  {
    id: "user-demo",
    name: "Rohith",
    email: "user@gmail.com",
    password: "user",
    role: "user",
    emergencyContact: "+91 99887 76655",
    preferredStyle: "adventure",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80",
    bio: "Keen trekker, mountain climber and travel photographer.",
    location: "Bengaluru, Karnataka",
    phone: "+91 98765 43210",
    foodPreference: "Veg",
    paymentMethod: "UPI"
  },
  {
    id: "user-admin",
    name: "System Admin",
    email: "admin@gmail.com",
    password: "admin123",
    role: "admin",
    emergencyContact: "+91 98765 43210",
    preferredStyle: "heritage",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80",
    bio: "Travel ledger database administrator.",
    location: "Delhi, National Capital Territory",
    phone: "+91 91234 56789",
    foodPreference: "Veg",
    paymentMethod: "UPI"
  }
];

// Default Preloaded Trips for the demo user
const defaultTrips = [
  {
    id: "trip-1",
    title: "Royal Rajasthan Getaway",
    destinationId: "dest-3", // Jaipur
    userId: "user-demo",
    startDate: "2026-10-12",
    endDate: "2026-10-15",
    budget: 25000,
    members: ["Rohith Kumar", "Rahul Sharma"],
    notes: "Explore Amber Fort early morning to avoid crowd, enjoy traditional Rajasthani cuisine at Chokhi Dhani, shop at Johri Bazaar."
  },
  {
    id: "trip-2",
    title: "Backwater Serenity",
    destinationId: "dest-7", // Alleppey
    userId: "user-demo",
    startDate: "2026-11-20",
    endDate: "2026-11-24",
    budget: 32000,
    members: ["Rohith Kumar", "Priya Nair", "Aditya Sen"],
    notes: "Overnight stay on a luxury Kerala houseboat. Wake up to views of tranquil lagoons, palms, and delicious traditional food."
  },
  {
    id: "trip-3",
    title: "Ladakh Heights Adventure",
    destinationId: "dest-1", // Leh Ladakh
    userId: "user-demo",
    startDate: "2026-12-05",
    endDate: "2026-12-12",
    budget: 65000,
    members: ["Rohith Kumar", "Aditya Sen", "Vikram Rathore"],
    notes: "Complete rest on day 1 for high altitude acclimatization. Rent local Enfield bikes to cross Khardung La Pass, camp beside deep blue Pangong Tso."
  },
  {
    id: "trip-4",
    title: "Munnar Tea Fields Escape",
    destinationId: "dest-4", // Munnar
    userId: "user-demo",
    startDate: "2026-09-02",
    endDate: "2026-09-05",
    budget: 15000,
    members: ["Rohith Kumar", "Sneha Rao"],
    notes: "Lush green tea plantations, quiet mist-covered trails, and fresh spice shopping."
  },
  {
    id: "trip-5",
    title: "Hampi Ruins Tour",
    destinationId: "dest-9", // Hampi
    userId: "user-demo",
    startDate: "2026-08-15",
    endDate: "2026-08-18",
    budget: 18000,
    members: ["Rohith Kumar", "Priya Nair"],
    notes: "Marvelous open-air boulder landscapes, historical stone carvings of Vijayanagara Empire, and ferry rides across Tungabhadra."
  },
  {
    id: "trip-6",
    title: "Goa Sunny Beach Expedition",
    destinationId: "dest-2", // Goa
    userId: "user-demo",
    startDate: "2026-06-10",
    endDate: "2026-06-14",
    budget: 28000,
    members: ["Rohith Kumar", "Neha Sharma", "Aarav Kumar"],
    notes: "Relaxing stay near Baga beach. Enjoy beach shacks, dynamic night markets, and delicious Goan fish curry."
  },
  {
    id: "trip-7",
    title: "Manali Snow Valley Trek",
    destinationId: "dest-11", // Manali
    userId: "user-demo",
    startDate: "2026-12-20",
    endDate: "2026-12-25",
    budget: 35000,
    members: ["Rohith Kumar", "Vikram Rathore", "Siddharth Goel"],
    notes: "Backpacking and adventure sports at Solang valley, hot spring baths at Vashisht, cozy old cafes in Old Manali."
  },
  {
    id: "trip-8",
    title: "Romantic Udaipur Lakes & Palaces",
    destinationId: "dest-12", // Udaipur
    userId: "user-demo",
    startDate: "2026-05-01",
    endDate: "2026-05-04",
    budget: 22000,
    members: ["Rohith Kumar", "Sneha Rao"],
    notes: "Scenic boat cruises on Lake Pichola, visiting the iconic City Palace complex, and folk puppet dance at Bagore Ki Haveli."
  }
];

// Default Preloaded Bookings
const defaultBookings = [
  {
    id: "book-1",
    tripId: "trip-1",
    userId: "user-demo",
    type: "flight" as const,
    detailName: "IndiGo Flight 6E-243: BLR -> JAI",
    cost: 8500,
    date: "2026-10-12",
    status: "confirmed" as const,
    pnr: "TH-6E2431",
    flightDetails: {
      flightNumber: "6E-243",
      airline: "IndiGo",
      origin: "Bengaluru",
      originCode: "BLR",
      destination: "Jaipur",
      destinationCode: "JAI",
      departureTime: "06:15 AM",
      arrivalTime: "08:45 AM",
      duration: "2h 30m",
      cabinClass: "Economy",
      pnr: "TH-6E2431",
      seatNumber: "12A",
      terminal: "Terminal 2"
    }
  },
  {
    id: "book-f2",
    tripId: "trip-6",
    userId: "user-demo",
    type: "flight" as const,
    detailName: "Air India Flight AI-512: DEL -> GOI",
    cost: 7200,
    date: "2026-06-10",
    status: "confirmed" as const,
    pnr: "TH-AI5129",
    flightDetails: {
      flightNumber: "AI-512",
      airline: "Air India",
      origin: "Delhi",
      originCode: "DEL",
      destination: "Goa",
      destinationCode: "GOI",
      departureTime: "10:30 AM",
      arrivalTime: "01:00 PM",
      duration: "2h 30m",
      cabinClass: "Economy",
      pnr: "TH-AI5129",
      seatNumber: "18C",
      terminal: "Terminal 3"
    }
  },
  {
    id: "book-f3",
    tripId: "trip-3",
    userId: "user-admin",
    type: "flight" as const,
    detailName: "IndiGo Flight 6E-243: BLR -> JAI",
    cost: 8500,
    date: "2026-12-05",
    status: "confirmed" as const,
    pnr: "TH-6E2438",
    flightDetails: {
      flightNumber: "6E-243",
      airline: "IndiGo",
      origin: "Bengaluru",
      originCode: "BLR",
      destination: "Jaipur",
      destinationCode: "JAI",
      departureTime: "06:15 AM",
      arrivalTime: "08:45 AM",
      duration: "2h 30m",
      cabinClass: "Economy",
      pnr: "TH-6E2438",
      seatNumber: "14B",
      terminal: "Terminal 2"
    }
  },
  {
    id: "book-f4",
    tripId: "trip-8",
    userId: "user-demo",
    type: "flight" as const,
    detailName: "Vistara Flight UK-815: BOM -> UDR",
    cost: 9400,
    date: "2026-05-01",
    status: "confirmed" as const,
    pnr: "TH-UK8152",
    flightDetails: {
      flightNumber: "UK-815",
      airline: "Vistara",
      origin: "Mumbai",
      originCode: "BOM",
      destination: "Udaipur",
      destinationCode: "UDR",
      departureTime: "09:10 AM",
      arrivalTime: "10:40 AM",
      duration: "1h 30m",
      cabinClass: "Premium Economy",
      pnr: "TH-UK8152",
      seatNumber: "4D",
      terminal: "Terminal 2"
    }
  },
  {
    id: "book-f5",
    tripId: "trip-1",
    userId: "user-admin",
    type: "flight" as const,
    detailName: "Air India Flight AI-512: DEL -> GOI",
    cost: 7200,
    date: "2026-10-12",
    status: "confirmed" as const,
    pnr: "TH-AI5124",
    flightDetails: {
      flightNumber: "AI-512",
      airline: "Air India",
      origin: "Delhi",
      originCode: "DEL",
      destination: "Goa",
      destinationCode: "GOI",
      departureTime: "10:30 AM",
      arrivalTime: "01:00 PM",
      duration: "2h 30m",
      cabinClass: "Economy",
      pnr: "TH-AI5124",
      seatNumber: "21F",
      terminal: "Terminal 3"
    }
  },
  {
    id: "book-2",
    tripId: "trip-1",
    userId: "user-demo",
    type: "hotel" as const,
    detailName: "Heritage Haveli Resort (Jaipur)",
    cost: 11000,
    date: "2026-10-12",
    status: "confirmed" as const
  },
  {
    id: "book-3",
    tripId: "trip-1",
    userId: "user-demo",
    type: "activity" as const,
    detailName: "Amer Fort & City Palace Guided Tour",
    cost: 2000,
    date: "2026-10-13",
    status: "confirmed" as const
  },
  {
    id: "book-4",
    tripId: "trip-2",
    userId: "user-demo",
    type: "hotel" as const,
    detailName: "Golden Palms Backwater Houseboat (Alleppey)",
    cost: 16000,
    date: "2026-11-20",
    status: "confirmed" as const
  },
  {
    id: "book-5",
    tripId: "trip-2",
    userId: "user-demo",
    type: "cab" as const,
    detailName: "Kochi Airport to Alleppey Dock Private Cab",
    cost: 3200,
    date: "2026-11-20",
    status: "confirmed" as const
  },
  {
    id: "book-6",
    tripId: "trip-3",
    userId: "user-demo",
    type: "hotel" as const,
    detailName: "The Grand Dragon Ladakh (Leh Palace View)",
    cost: 28000,
    date: "2026-12-05",
    status: "confirmed" as const
  },
  {
    id: "book-7",
    tripId: "trip-3",
    userId: "user-demo",
    type: "activity" as const,
    detailName: "Royal Enfield 500cc Bike Rentals (7 Days)",
    cost: 14000,
    date: "2026-12-06",
    status: "confirmed" as const
  },
  {
    id: "book-8",
    tripId: "trip-4",
    userId: "user-demo",
    type: "hotel" as const,
    detailName: "Misty Valley Tea Estate Bungalow",
    cost: 9500,
    date: "2026-09-02",
    status: "confirmed" as const
  }
];

// Default Preloaded Expenses
const defaultExpenses = [
  {
    id: "exp-1",
    tripId: "trip-1",
    userId: "user-demo",
    amount: 4000,
    category: "transport" as const,
    description: "Savaari Cab for Day 2 Sightseeing",
    date: "2026-10-13",
    paidBy: "Rohith Kumar",
    splitType: "equal" as const,
    splitDetails: { "Rohith Kumar": 2000, "Rahul Sharma": 2000 }
  },
  {
    id: "exp-2",
    tripId: "trip-1",
    userId: "user-demo",
    amount: 2500,
    category: "food" as const,
    description: "Royal Dinner Feast at Chokhi Dhani",
    date: "2026-10-13",
    paidBy: "Rahul Sharma",
    splitType: "equal" as const,
    splitDetails: { "Rohith Kumar": 1250, "Rahul Sharma": 1250 }
  },
  {
    id: "exp-3",
    tripId: "trip-1",
    userId: "user-demo",
    amount: 1500,
    category: "sightseeing" as const,
    description: "Entry Tickets & Photography Charges",
    date: "2026-10-14",
    paidBy: "Rohith Kumar",
    splitType: "unequal" as const,
    splitDetails: { "Rohith Kumar": 1000, "Rahul Sharma": 500 }
  },
  {
    id: "exp-4",
    tripId: "trip-2",
    userId: "user-demo",
    amount: 3600,
    category: "food" as const,
    description: "Traditional Kerala Seafood feast at harbor",
    date: "2026-11-21",
    paidBy: "Priya Nair",
    splitType: "equal" as const,
    splitDetails: { "Rohith Kumar": 1200, "Priya Nair": 1200, "Aditya Sen": 1200 }
  },
  {
    id: "exp-5",
    tripId: "trip-2",
    userId: "user-demo",
    amount: 1800,
    category: "transport" as const,
    description: "Evening Shikara boat ride through canals",
    date: "2026-11-22",
    paidBy: "Rohith Kumar",
    splitType: "equal" as const,
    splitDetails: { "Rohith Kumar": 600, "Priya Nair": 600, "Aditya Sen": 600 }
  }
];

// Initial pre-loaded state
const initialData = {
  users: defaultUsers,
  destinations: defaultDestinations,
  trips: defaultTrips,
  bookings: defaultBookings,
  expenses: defaultExpenses
};

// Database class with MongoDB Compass/Atlas integration and JSON fallback
class Database {
  private data: typeof initialData;
  private client: MongoClient | null = null;
  private dbInstance: Db | null = null;
  public mongoConnected: boolean = false;
  public mongoConnectionError: string | null = null;
  public mongoUriUsed: string = "";

  constructor() {
    this.data = initialData;
    this.load();
    this.initMongo();
  }

  public async connectCustomUri(uri: string) {
    try {
      if (this.client) {
        try { await this.client.close(); } catch (e) {}
      }
      this.mongoUriUsed = uri;
      this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await this.client.connect();
      const dbName = process.env.MONGODB_DB_NAME || "tripcraft";
      this.dbInstance = this.client.db(dbName);
      this.mongoConnected = true;
      this.mongoConnectionError = null;
      console.log(`[MongoDB] Connected successfully to db '${dbName}'!`);
      await this.syncWithMongo();
      return { success: true, message: `Connected to MongoDB database '${dbName}'` };
    } catch (err: any) {
      // Automatic fallback for localhost (Node 18+ IPv6 ::1 issue)
      if (uri.includes("localhost") && !uri.includes("127.0.0.1")) {
        const fallbackUri = uri.replace("localhost", "127.0.0.1");
        console.warn(`[MongoDB] localhost connection failed, attempting fallback to 127.0.0.1...`);
        try {
          if (this.client) { try { await this.client.close(); } catch (e) {} }
          this.mongoUriUsed = fallbackUri;
          this.client = new MongoClient(fallbackUri, { serverSelectionTimeoutMS: 5000 });
          await this.client.connect();
          const dbName = process.env.MONGODB_DB_NAME || "tripcraft";
          this.dbInstance = this.client.db(dbName);
          this.mongoConnected = true;
          this.mongoConnectionError = null;
          console.log(`[MongoDB] Connected successfully via 127.0.0.1 to db '${dbName}'!`);
          await this.syncWithMongo();
          return { success: true, message: `Connected to MongoDB database '${dbName}' via 127.0.0.1` };
        } catch (fallbackErr: any) {
          // Fallback also failed
        }
      }

      this.mongoConnected = false;
      this.mongoConnectionError = err.message || "Failed to connect to MongoDB";
      console.error("[MongoDB] Connection error:", err.message);
      return { success: false, error: this.mongoConnectionError };
    }
  }

  private async initMongo() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log("ℹ️ MONGODB_URI not provided in env. Ready for connection via UI or MONGODB_URI.");
      return;
    }

    await this.connectCustomUri(mongoUri);
  }

  private async syncWithMongo() {
    if (!this.dbInstance) return;

    try {
      const collections = ["users", "destinations", "trips", "bookings", "expenses"];
      for (const colName of collections) {
        const col = this.dbInstance.collection(colName);
        const count = await col.countDocuments();
        
        if (count === 0) {
          // Seed MongoDB from local data
          const itemsToSeed = (this.data as any)[colName] || [];
          if (itemsToSeed.length > 0) {
            console.log(`[MongoDB] Seeding ${itemsToSeed.length} ${colName} into MongoDB...`);
            await col.insertMany(itemsToSeed.map((item: any) => ({ ...item, _id: item.id || item._id })));
          }
        } else {
          // Sync MongoDB data to local cache
          const docs = await col.find({}).toArray();
          if (docs && docs.length > 0) {
            (this.data as any)[colName] = docs.map((doc: any) => {
              const { _id, ...rest } = doc;
              return { id: doc.id || _id?.toString(), ...rest };
            });
            this.save();
          }
        }
      }
      console.log("⚡ MongoDB Compass / Atlas and application state synchronized!");
      if (fs.existsSync(DB_FILE)) {
        try {
          fs.unlinkSync(DB_FILE);
          console.log("🗑️ Removed data-store.json after MongoDB Compass connection!");
        } catch (e) {
          console.error("Could not remove data-store.json", e);
        }
      }
    } catch (err) {
      console.error("[MongoDB] Sync error:", err);
    }
  }

  public async pushToMongo(colName: string, doc: any) {
    if (!this.mongoConnected || !this.dbInstance) return;
    try {
      const col = this.dbInstance.collection(colName);
      const id = doc.id;
      if (id) {
        await col.replaceOne({ id }, { ...doc, _id: id }, { upsert: true });
      } else {
        await col.insertOne(doc);
      }
    } catch (err) {
      console.error(`[MongoDB] Error pushing to ${colName}:`, err);
    }
  }

  public async removeFromMongo(colName: string, query: any) {
    if (!this.mongoConnected || !this.dbInstance) return;
    try {
      const col = this.dbInstance.collection(colName);
      await col.deleteMany(query);
    } catch (err) {
      console.error(`[MongoDB] Error removing from ${colName}:`, err);
    }
  }

  public getStatus() {
    return {
      mode: this.mongoConnected ? "MongoDB Compass / Atlas" : "Local JSON Store",
      mongoConnected: this.mongoConnected,
      mongoError: this.mongoConnectionError,
      uriConfigured: Boolean(process.env.MONGODB_URI || this.mongoUriUsed),
      dbName: process.env.MONGODB_DB_NAME || "tripcraft",
      counts: {
        users: Array.isArray(this.data.users) ? this.data.users.length : 0,
        destinations: Array.isArray(this.data.destinations) ? this.data.destinations.length : 0,
        trips: Array.isArray(this.data.trips) ? this.data.trips.length : 0,
        bookings: Array.isArray(this.data.bookings) ? this.data.bookings.length : 0,
        expenses: Array.isArray(this.data.expenses) ? this.data.expenses.length : 0
      }
    };
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
        
        // Ensure all collections are initialized
        if (!this.data.users || this.data.users.length === 0) {
          this.data.users = initialData.users;
          this.save();
        } else {
          // Sync admin credentials
          const adminIdx = this.data.users.findIndex(u => u.id === "user-admin");
          if (adminIdx !== -1) {
            this.data.users[adminIdx].email = "admin@gmail.com";
            this.data.users[adminIdx].password = "admin123";
            this.save();
          } else {
            // Re-inject admin if missing
            const adminDefault = initialData.users.find(u => u.id === "user-admin");
            if (adminDefault) {
              this.data.users.push(adminDefault);
              this.save();
            }
          }
        }
        if (!this.data.destinations || this.data.destinations.length === 0) {
          this.data.destinations = initialData.destinations;
          this.save();
        }
        if (!this.data.trips || this.data.trips.length === 0) {
          this.data.trips = initialData.trips;
          this.save();
        } else {
          // Add any default trips that are missing from the JSON file
          let updatedTrips = false;
          initialData.trips.forEach(defaultTrip => {
            if (!this.data.trips.some(t => t.id === defaultTrip.id)) {
              this.data.trips.push(defaultTrip);
              updatedTrips = true;
            }
          });
          if (updatedTrips) {
            this.save();
          }
        }
        if (!this.data.bookings || this.data.bookings.length === 0) {
          this.data.bookings = initialData.bookings;
          this.save();
        }
        if (!this.data.expenses || this.data.expenses.length === 0) {
          this.data.expenses = initialData.expenses;
          this.save();
        }
      } else {
        this.save();
      }
    } catch (err) {
      console.error("Failed to load local database, resetting to default data", err);
      this.data = initialData;
      this.save();
    }
  }

  private save() {
    try {
      if (this.mongoConnected) {
        if (fs.existsSync(DB_FILE)) {
          fs.unlinkSync(DB_FILE);
          console.log("🗑️ Deleted local data-store.json since MongoDB Compass is active!");
        }
        return;
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save local database", err);
    }
  }

  // --- Collection Queries ---
  
  get users() {
    return {
      find: () => this.data.users,
      findById: (id: string) => this.data.users.find(u => u.id === id),
      findByEmail: (email: string) => this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()),
      create: (user: any) => {
        const newUser = { id: "user-" + Date.now(), ...user };
        this.data.users.push(newUser);
        this.save();
        this.pushToMongo("users", newUser);
        return newUser;
      },
      update: (id: string, updates: any) => {
        const index = this.data.users.findIndex(u => u.id === id);
        if (index !== -1) {
          this.data.users[index] = { ...this.data.users[index], ...updates };
          this.save();
          this.pushToMongo("users", this.data.users[index]);
          return this.data.users[index];
        }
        return null;
      },
      delete: (id: string) => {
        // Safely access collections and ensure they are arrays
        const bookings = Array.isArray(this.data.bookings) ? this.data.bookings : [];
        const expenses = Array.isArray(this.data.expenses) ? this.data.expenses : [];
        const trips = Array.isArray(this.data.trips) ? this.data.trips : [];
        const users = Array.isArray(this.data.users) ? this.data.users : [];

        // Cascade delete bookings, expenses, and trips linked to this user
        this.data.bookings = bookings.filter(b => b && b.userId !== id);
        this.data.expenses = expenses.filter(e => e && e.userId !== id);
        
        // Find user's trip IDs to cascade delete their bookings and expenses too
        const userTripIds = trips.filter(t => t && t.userId === id).map(t => t && t.id).filter(Boolean);
        this.data.bookings = this.data.bookings.filter(b => b && b.tripId && !userTripIds.includes(b.tripId));
        this.data.expenses = this.data.expenses.filter(e => e && e.tripId && !userTripIds.includes(e.tripId));
        
        this.data.trips = trips.filter(t => t && t.userId !== id);
        this.data.users = users.filter(u => u && u.id !== id);
        this.save();

        this.removeFromMongo("users", { id });
        this.removeFromMongo("trips", { userId: id });
        return true;
      }
    };
  }

  get destinations() {
    return {
      find: () => this.data.destinations,
      findById: (id: string) => this.data.destinations.find(d => d.id === id),
      create: (dest: any) => {
        const newDest = { id: "dest-" + Date.now(), ...dest };
        this.data.destinations.push(newDest);
        this.save();
        this.pushToMongo("destinations", newDest);
        return newDest;
      },
      update: (id: string, updates: any) => {
        const index = this.data.destinations.findIndex(d => d.id === id);
        if (index !== -1) {
          this.data.destinations[index] = { ...this.data.destinations[index], ...updates };
          this.save();
          this.pushToMongo("destinations", this.data.destinations[index]);
          return this.data.destinations[index];
        }
        return null;
      },
      delete: (id: string) => {
        this.data.destinations = this.data.destinations.filter(d => d.id !== id);
        this.save();
        this.removeFromMongo("destinations", { id });
        return true;
      }
    };
  }

  get trips() {
    return {
      find: () => this.data.trips,
      findByUser: (userId: string) => this.data.trips.filter(t => t.userId === userId),
      findById: (id: string) => this.data.trips.find(t => t.id === id),
      create: (trip: any) => {
        const newTrip = { id: "trip-" + Date.now(), ...trip };
        this.data.trips.push(newTrip);
        this.save();
        this.pushToMongo("trips", newTrip);
        return newTrip;
      },
      update: (id: string, updates: any) => {
        const index = this.data.trips.findIndex(t => t.id === id);
        if (index !== -1) {
          this.data.trips[index] = { ...this.data.trips[index], ...updates };
          this.save();
          this.pushToMongo("trips", this.data.trips[index]);
          return this.data.trips[index];
        }
        return null;
      },
      delete: (id: string) => {
        // Clean up linked bookings and expenses
        this.data.bookings = this.data.bookings.filter(b => b.tripId !== id);
        this.data.expenses = this.data.expenses.filter(e => e.tripId !== id);
        this.data.trips = this.data.trips.filter(t => t.id !== id);
        this.save();

        this.removeFromMongo("trips", { id });
        this.removeFromMongo("bookings", { tripId: id });
        this.removeFromMongo("expenses", { tripId: id });
        return true;
      }
    };
  }

  get bookings() {
    return {
      find: () => this.data.bookings,
      findByUser: (userId: string) => this.data.bookings.filter(b => b.userId === userId),
      findByTrip: (tripId: string) => this.data.bookings.filter(b => b.tripId === tripId),
      findById: (id: string) => this.data.bookings.find(b => b.id === id),
      create: (booking: any) => {
        const newBooking = { id: "booking-" + Date.now(), ...booking };
        this.data.bookings.push(newBooking);
        this.save();
        this.pushToMongo("bookings", newBooking);
        return newBooking;
      },
      updateStatus: (id: string, status: string) => {
        const index = this.data.bookings.findIndex(b => b.id === id);
        if (index !== -1) {
          this.data.bookings[index].status = status as any;
          this.save();
          this.pushToMongo("bookings", this.data.bookings[index]);
          return this.data.bookings[index];
        }
        return null;
      },
      delete: (id: string) => {
        this.data.bookings = this.data.bookings.filter(b => b.id !== id);
        this.save();
        this.removeFromMongo("bookings", { id });
        return true;
      }
    };
  }

  get expenses() {
    return {
      find: () => this.data.expenses,
      findByTrip: (tripId: string) => this.data.expenses.filter(e => e.tripId === tripId),
      findById: (id: string) => this.data.expenses.find(e => e.id === id),
      create: (expense: any) => {
        const newExpense = { id: "exp-" + Date.now(), ...expense };
        this.data.expenses.push(newExpense);
        this.save();
        this.pushToMongo("expenses", newExpense);
        return newExpense;
      },
      delete: (id: string) => {
        this.data.expenses = this.data.expenses.filter(e => e.id !== id);
        this.save();
        this.removeFromMongo("expenses", { id });
        return true;
      }
    };
  }
}


export const db = new Database();
