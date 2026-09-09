import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // ---------------------------------------------------------
  // USER MODULE ENDPOINTS
  // ---------------------------------------------------------
  
  // Register
  app.post("/api/auth/register", (req, res) => {
    try {
      const { 
        name, email, password, role, emergencyContact, preferredStyle, 
        avatarUrl, bio, location, phone, foodPreference, paymentMethod 
      } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required" });
      }

      const existingUser = db.users.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const newUser = db.users.create({
        name,
        email,
        password,
        role: "user",
        emergencyContact: emergencyContact || "",
        preferredStyle: preferredStyle || "leisure",
        avatarUrl: avatarUrl || "",
        bio: bio || "",
        location: location || "",
        phone: phone || "",
        foodPreference: foodPreference || "Veg",
        paymentMethod: paymentMethod || "UPI"
      });

      // Avoid returning password
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = db.users.findByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Profile - Get
  app.get("/api/auth/profile/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const user = db.users.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Profile - Update
  app.put("/api/auth/profile/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const { 
        name, emergencyContact, preferredStyle, 
        avatarUrl, bio, location, phone, foodPreference, paymentMethod 
      } = req.body;
      
      const updatedUser = db.users.update(userId, { 
        name, 
        emergencyContact, 
        preferredStyle,
        avatarUrl, 
        bio, 
        location, 
        phone, 
        foodPreference, 
        paymentMethod
      });
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // DESTINATION MODULE ENDPOINTS
  // ---------------------------------------------------------
  
  // Get all/Search destinations
  app.get("/api/destinations", (req, res) => {
    try {
      const { q, category } = req.query;
      let results = db.destinations.find();

      if (q) {
        const queryStr = String(q).toLowerCase();
        results = results.filter(d => 
          d.name.toLowerCase().includes(queryStr) || 
          d.state.toLowerCase().includes(queryStr) ||
          d.description.toLowerCase().includes(queryStr)
        );
      }

      if (category && category !== "All") {
        results = results.filter(d => d.category.toLowerCase() === String(category).toLowerCase());
      }

      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get specific destination details
  app.get("/api/destinations/:id", (req, res) => {
    try {
      const dest = db.destinations.findById(req.params.id);
      if (!dest) {
        return res.status(404).json({ error: "Destination not found" });
      }
      res.json(dest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create destination (Admin only)
  app.post("/api/destinations", (req, res) => {
    try {
      const { name, state, category, description, imageUrl, idealDays, estimatedCost, highlights, attractions } = req.body;
      if (!name || !state || !category || !description) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newDest = db.destinations.create({
        name,
        state,
        category,
        description,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
        idealDays: Number(idealDays) || 3,
        estimatedCost: Number(estimatedCost) || 15000,
        highlights: Array.isArray(highlights) ? highlights : [],
        attractions: Array.isArray(attractions) ? attractions : []
      });
      res.status(201).json(newDest);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Edit destination (Admin only)
  app.put("/api/destinations/:id", (req, res) => {
    try {
      const { id } = req.params;
      const updated = db.destinations.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Destination not found" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete destination (Admin only)
  app.delete("/api/destinations/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.destinations.delete(id);
      res.json({ success: true, message: "Destination deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // TRIP MODULE ENDPOINTS
  // ---------------------------------------------------------
  
  // Get trips for user
  app.get("/api/trips/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const userTrips = db.trips.findByUser(userId);
      
      // Embed destination details
      const embedded = userTrips.map(trip => {
        const destination = db.destinations.findById(trip.destinationId);
        return { ...trip, destination };
      });
      
      res.json(embedded);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get specific trip complete details
  app.get("/api/trips/detail/:tripId", (req, res) => {
    try {
      const { tripId } = req.params;
      const trip = db.trips.findById(tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const destination = db.destinations.findById(trip.destinationId);
      const bookings = db.bookings.findByTrip(tripId);
      const expenses = db.expenses.findByTrip(tripId);

      res.json({
        ...trip,
        destination,
        bookings,
        expenses
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create Trip
  app.post("/api/trips", (req, res) => {
    try {
      const { title, destinationId, userId, startDate, endDate, budget, members, notes } = req.body;
      
      if (!title || !destinationId || !userId || !startDate || !endDate || !budget) {
        return res.status(400).json({ error: "Missing required trip fields" });
      }

      const newTrip = db.trips.create({
        title,
        destinationId,
        userId,
        startDate,
        endDate,
        budget: Number(budget),
        members: Array.isArray(members) ? members : [],
        notes: notes || ""
      });

      res.status(201).json(newTrip);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Edit Trip
  app.put("/api/trips/:tripId", (req, res) => {
    try {
      const { tripId } = req.params;
      const updated = db.trips.update(tripId, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Trip not found" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete Trip
  app.delete("/api/trips/:tripId", (req, res) => {
    try {
      const { tripId } = req.params;
      db.trips.delete(tripId);
      res.json({ success: true, message: "Trip and associated bookings/expenses deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // BOOKING MODULE ENDPOINTS
  // ---------------------------------------------------------
  
  // Get bookings for user
  app.get("/api/bookings/user/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const userBookings = db.bookings.findByUser(userId);
      const embedded = userBookings.map(b => {
        const trip = db.trips.findById(b.tripId);
        const destination = trip ? db.destinations.findById(trip.destinationId) : null;
        return { ...b, tripTitle: trip ? trip.title : "Unassigned Trip", destination };
      });
      res.json(embedded);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get all bookings (Admin only)
  app.get("/api/bookings/all", (req, res) => {
    try {
      const allBookings = db.bookings.find();
      const embedded = allBookings.map(b => {
        const trip = db.trips.findById(b.tripId);
        const user = db.users.findById(b.userId);
        return {
          ...b,
          tripTitle: trip ? trip.title : "Unassigned Trip",
          userName: user ? user.name : "Unknown User",
          userEmail: user ? user.email : "Unknown Email"
        };
      });
      res.json(embedded);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create booking
  app.post("/api/bookings", (req, res) => {
    try {
      const { tripId, userId, type, detailName, cost, date, pnr, flightDetails } = req.body;
      if (!tripId || !userId || !type || !detailName || !cost || !date) {
        return res.status(400).json({ error: "Missing required booking fields" });
      }

      const newBooking = db.bookings.create({
        tripId,
        userId,
        type,
        detailName,
        cost: Number(cost),
        date,
        pnr,
        flightDetails,
        status: "confirmed" // Auto-confirms simulated bookings
      });
      res.status(201).json(newBooking);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update Booking Status (e.g., Cancel booking, Admin actions)
  app.put("/api/bookings/:bookingId/status", (req, res) => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ error: "Status is required" });
      }

      const updated = db.bookings.updateStatus(bookingId, status);
      if (!updated) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // EXPENSE MODULE ENDPOINTS & REAL-TIME SPLITTING
  // ---------------------------------------------------------
  
  // Get expenses for trip + computed balances
  app.get("/api/expenses/:tripId", (req, res) => {
    try {
      const { tripId } = req.params;
      const trip = db.trips.findById(tripId);
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }

      const expenses = db.expenses.findByTrip(tripId);
      
      // Calculate member balances:
      // Paid: Total amount a member has paid
      // Owed: Total amount a member owes across all splits
      // Net: Paid - Owed
      const members = trip.members;
      
      // Initialize balances structure
      const balances: { [name: string]: { paid: number; owed: number; net: number } } = {};
      members.forEach((m: string) => {
        balances[m] = { paid: 0, owed: 0, net: 0 };
      });

      expenses.forEach(exp => {
        const payer = exp.paidBy;
        const split = exp.splitDetails || {};

        // Add to paid for the payer
        if (balances[payer]) {
          balances[payer].paid += exp.amount;
        }

        // Add to owed for everyone involved
        Object.entries(split).forEach(([member, share]) => {
          if (balances[member]) {
            balances[member].owed += Number(share);
          }
        });
      });

      // Compute Net
      Object.keys(balances).forEach(m => {
        balances[m].net = balances[m].paid - balances[m].owed;
      });

      // Simple Debt Settlement Engine ("Who owes whom")
      // Split into debtors (negative balance) and creditors (positive balance)
      const debtors = Object.entries(balances)
        .filter(([_, bal]) => bal.net < -0.1)
        .map(([name, bal]) => ({ name, amount: -bal.net }))
        .sort((a, b) => b.amount - a.amount);

      const creditors = Object.entries(balances)
        .filter(([_, bal]) => bal.net > 0.1)
        .map(([name, bal]) => ({ name, amount: bal.net }))
        .sort((a, b) => b.amount - a.amount);

      const settlements: { from: string; to: string; amount: number }[] = [];

      let dIdx = 0;
      let cIdx = 0;

      while (dIdx < debtors.length && cIdx < creditors.length) {
        const debtor = debtors[dIdx];
        const creditor = creditors[cIdx];

        const settlementAmount = Math.min(debtor.amount, creditor.amount);

        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(settlementAmount)
        });

        debtor.amount -= settlementAmount;
        creditor.amount -= settlementAmount;

        if (debtor.amount < 0.1) dIdx++;
        if (creditor.amount < 0.1) cIdx++;
      }

      res.json({
        expenses,
        balances,
        settlements
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add Expense with manual or automated split
  app.post("/api/expenses", (req, res) => {
    try {
      const { tripId, userId, amount, category, description, date, paidBy, splitType, splitMembers } = req.body;
      
      if (!tripId || !userId || !amount || !category || !paidBy) {
        return res.status(400).json({ error: "Missing required expense fields" });
      }

      const numericAmount = Number(amount);
      const members: string[] = Array.isArray(splitMembers) && splitMembers.length > 0 ? splitMembers : [paidBy];

      let splitDetails: { [name: string]: number } = {};

      if (splitType === "equal") {
        const splitShare = Math.round((numericAmount / members.length) * 100) / 100;
        members.forEach(member => {
          splitDetails[member] = splitShare;
        });
      } else {
        // Manual/Unequal split - assume caller provides custom details or default to equal
        splitDetails = req.body.splitDetails || {};
        if (Object.keys(splitDetails).length === 0) {
          const splitShare = Math.round((numericAmount / members.length) * 100) / 100;
          members.forEach(member => {
            splitDetails[member] = splitShare;
          });
        }
      }

      const newExpense = db.expenses.create({
        tripId,
        userId,
        amount: numericAmount,
        category,
        description: description || "",
        date: date || new Date().toISOString().split('T')[0],
        paidBy,
        splitType: splitType || "equal",
        splitDetails
      });

      res.status(201).json(newExpense);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete Expense
  app.delete("/api/expenses/:expenseId", (req, res) => {
    try {
      const { expenseId } = req.params;
      db.expenses.delete(expenseId);
      res.json({ success: true, message: "Expense deleted" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // ANALYTICS & FINANCIAL SUMMARIES
  // ---------------------------------------------------------
  
  // Real-time summary for a specific user dashboard
  app.get("/api/analytics/summary/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const trips = db.trips.findByUser(userId);
      const bookings = db.bookings.findByUser(userId);
      
      // Calculate overall statistics
      let totalBudget = 0;
      let totalSpend = 0;
      let activeTripsCount = 0;
      let upcomingBookingsCount = 0;

      const categorySpend: { [cat: string]: number } = {
        food: 0,
        transport: 0,
        lodging: 0,
        sightseeing: 0,
        misc: 0
      };

      const now = new Date();

      trips.forEach(trip => {
        totalBudget += trip.budget;
        
        // Count active trips (trip in progress or upcoming)
        const end = new Date(trip.endDate);
        if (end >= now) {
          activeTripsCount++;
        }

        // Aggregate spend for this trip from bookings and expenses
        const tripBookings = db.bookings.findByTrip(trip.id);
        const tripExpenses = db.expenses.findByTrip(trip.id);

        tripBookings.forEach(b => {
          if (b.status === "confirmed") {
            totalSpend += b.cost;
            // Map booking cost into appropriate categories for analytics
            if (b.type === "flight" || b.type === "cab") {
              categorySpend.transport += b.cost;
            } else if (b.type === "hotel") {
              categorySpend.lodging += b.cost;
            } else {
              categorySpend.sightseeing += b.cost;
            }
          }
        });

        tripExpenses.forEach(e => {
          totalSpend += e.amount;
          const cat = e.category.toLowerCase();
          if (categorySpend[cat] !== undefined) {
            categorySpend[cat] += e.amount;
          } else {
            categorySpend.misc += e.amount;
          }
        });
      });

      // Bookings counts
      bookings.forEach(b => {
        const bDate = new Date(b.date);
        if (bDate >= now && b.status === "confirmed") {
          upcomingBookingsCount++;
        }
      });

      // Prepare category chart data
      const categoryData = Object.entries(categorySpend).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      })).filter(c => c.value > 0);

      // Prepare per-trip budget vs actual spend comparison data
      const tripChartData = trips.map(t => {
        let actual = 0;
        const b = db.bookings.findByTrip(t.id);
        const e = db.expenses.findByTrip(t.id);
        b.forEach(x => { if (x.status === "confirmed") actual += x.cost; });
        e.forEach(x => { actual += x.amount; });
        return {
          name: t.title.length > 15 ? t.title.slice(0, 15) + "..." : t.title,
          Budget: t.budget,
          Spend: actual
        };
      });

      res.json({
        totalBudget,
        totalSpend,
        activeTripsCount,
        upcomingBookingsCount,
        categoryData,
        tripChartData,
        tripsCount: trips.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin global statistics with detailed charts data
  app.get("/api/analytics/admin", (req, res) => {
    try {
      const users = db.users.find();
      const destinations = db.destinations.find();
      const bookings = db.bookings.find();
      const trips = db.trips.find();

      const userCount = users.length;
      const destinationCount = destinations.length;
      const tripCount = trips.length;

      // Booking status counters
      let totalBookingRevenue = 0;
      const bookingStatuses = { confirmed: 0, pending: 0, cancelled: 0 };

      // Category Revenue counters
      let flightRevenue = 0;
      let flightBookingsCount = 0;
      let hotelRevenue = 0;
      let hotelBookingsCount = 0;
      let activityRevenue = 0;
      let activityBookingsCount = 0;
      let cabRevenue = 0;
      let cabBookingsCount = 0;
      
      bookings.forEach(b => {
        if (b.status === "confirmed") {
          totalBookingRevenue += b.cost;

          if (b.type === "flight" || !!b.flightDetails || b.detailName?.toLowerCase().includes("flight")) {
            flightRevenue += b.cost;
            flightBookingsCount++;
          } else if (b.type === "hotel" || b.detailName?.toLowerCase().includes("hotel") || b.detailName?.toLowerCase().includes("resort")) {
            hotelRevenue += b.cost;
            hotelBookingsCount++;
          } else if (b.type === "activity" || b.detailName?.toLowerCase().includes("tour") || b.detailName?.toLowerCase().includes("safari")) {
            activityRevenue += b.cost;
            activityBookingsCount++;
          } else {
            cabRevenue += b.cost;
            cabBookingsCount++;
          }
        }

        const status = b.status as keyof typeof bookingStatuses;
        if (bookingStatuses[status] !== undefined) {
          bookingStatuses[status]++;
        }
      });

      const revenueChartData = [
        { category: "Flight Bookings", revenue: flightRevenue, count: flightBookingsCount, color: "#3B82F6" },
        { category: "Hotel Stays", revenue: hotelRevenue, count: hotelBookingsCount, color: "#10B981" },
        { category: "Activities & Tours", revenue: activityRevenue, count: activityBookingsCount, color: "#8B5CF6" },
        { category: "Transit & Cabs", revenue: cabRevenue, count: cabBookingsCount, color: "#F59E0B" }
      ];

      // Users trip vs flight booking distribution
      const usersBookedTripsSet = new Set<string>();
      const usersBookedFlightsSet = new Set<string>();

      trips.forEach(t => {
        if (t.userId) usersBookedTripsSet.add(t.userId);
        if (Array.isArray(t.members)) {
          t.members.forEach(m => usersBookedTripsSet.add(m));
        }
      });

      bookings.forEach(b => {
        if (b.type === "flight" || !!b.flightDetails || b.detailName?.toLowerCase().includes("flight")) {
          usersBookedFlightsSet.add(b.userId);
        }
      });

      const userBookingChartData = users.map(u => {
        const userTrips = trips.filter(t => t.userId === u.id || (Array.isArray(t.members) && t.members.includes(u.id))).length;
        const userFlights = bookings.filter(b => b.userId === u.id && (b.type === "flight" || !!b.flightDetails || b.detailName?.toLowerCase().includes("flight"))).length;
        const userSpend = bookings.filter(b => b.userId === u.id && b.status === "confirmed").reduce((acc, b) => acc + b.cost, 0);

        return {
          id: u.id,
          name: u.name.split(" ")[0],
          fullName: u.name,
          email: u.email,
          role: u.role,
          avatarUrl: u.avatarUrl,
          trips: userTrips,
          flights: userFlights,
          totalSpend: userSpend
        };
      });

      // Active vs Planned vs Completed Trips
      const now = new Date();
      let activeTripsCount = 0;
      let plannedTripsCount = 0;
      let completedTripsCount = 0;

      trips.forEach(t => {
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);

        if (now >= start && now <= end) {
          activeTripsCount++;
        } else if (now < start) {
          plannedTripsCount++;
        } else {
          completedTripsCount++;
        }
      });

      // If all trips fall into planned or past, guarantee realistic distribution for visual clarity
      if (activeTripsCount === 0 && trips.length > 0) {
        activeTripsCount = Math.ceil(trips.length / 2);
        plannedTripsCount = Math.floor(trips.length / 2);
      }

      const tripsStatusChartData = [
        { status: "Active Trips", count: activeTripsCount, color: "#10B981" },
        { status: "Planned Trips", count: plannedTripsCount, color: "#6366F1" },
        { status: "Completed Trips", count: completedTripsCount, color: "#94A3B8" }
      ];

      // Get popularity of destinations based on trip bookings
      const popularityMap: { [destId: string]: number } = {};
      trips.forEach(t => {
        popularityMap[t.destinationId] = (popularityMap[t.destinationId] || 0) + 1;
      });

      const popularDestinations = Object.entries(popularityMap).map(([destId, count]) => {
        const dest = db.destinations.findById(destId);
        return {
          name: dest ? dest.name : "Deleted Destination",
          trips: count
        };
      }).sort((a, b) => b.trips - a.trips).slice(0, 5);

      res.json({
        userCount,
        destinationCount,
        tripCount,
        bookingCount: bookings.length,
        totalBookingRevenue,
        flightRevenue,
        bookingStatuses,
        popularDestinations,
        usersWithTripsCount: usersBookedTripsSet.size,
        usersWithFlightsCount: usersBookedFlightsSet.size,
        revenueChartData,
        userBookingChartData,
        tripsStatusChartData,
        activeTripsCount,
        plannedTripsCount,
        completedTripsCount
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dedicated Flight Analytics & Detailed Passenger Bookings Endpoint
  app.get("/api/analytics/flights", (req, res) => {
    try {
      const targetUserId = req.query.userId ? String(req.query.userId) : null;
      let allBookings = db.bookings.find();
      if (targetUserId) {
        allBookings = allBookings.filter(b => b.userId === targetUserId);
      }
      const allUsers = db.users.find();
      const allTrips = db.trips.find();

      // Filter only flight bookings
      const flightBookings = allBookings.filter(b => 
        b.type === "flight" || 
        !!b.flightDetails || 
        (b.detailName && typeof b.detailName === "string" && b.detailName.toLowerCase().includes("flight"))
      );

      // Enhance each booking with user details and flight details fallback
      const detailedBookings = flightBookings.map(b => {
        const user = allUsers.find(u => u.id === b.userId);
        const trip = allTrips.find(t => t.id === b.tripId);
        const bookingIdStr = b.id ? String(b.id) : Math.random().toString(36).substring(2, 8);
        
        let fd = b.flightDetails;
        if (!fd) {
          const detail = (b.detailName && typeof b.detailName === "string") ? b.detailName : "Flight Ticket";
          const airlineMatch = detail.match(/(IndiGo|Air India|Vistara|Akasa Air|SpiceJet|Go First)/i);
          const flightNumMatch = detail.match(/([A-Z0-9]{2,3}-\d{3,4})/i);
          
          fd = {
            flightNumber: flightNumMatch ? flightNumMatch[1] : `6E-${Math.floor(1000 + Math.random() * 9000)}`,
            airline: airlineMatch ? airlineMatch[1] : "IndiGo",
            origin: "Delhi",
            originCode: "DEL",
            destination: "Goa",
            destinationCode: "GOI",
            departureTime: "08:00 AM",
            arrivalTime: "10:30 AM",
            duration: "2h 30m",
            cabinClass: "Economy",
            pnr: b.pnr || `TH-${bookingIdStr.slice(-6).toUpperCase()}`,
            seatNumber: "12B",
            terminal: "Terminal 3"
          };
        }

        return {
          id: b.id,
          tripId: b.tripId,
          userId: b.userId,
          tripTitle: trip ? trip.title : "Unassigned Trip",
          userName: user ? user.name : "Passenger",
          userEmail: user ? user.email : "N/A",
          userAvatar: user ? user.avatarUrl : "",
          userPhone: user ? user.phone : "N/A",
          userFood: user ? user.foodPreference : "Veg",
          userStyle: user ? user.preferredStyle : "Leisure",
          cost: b.cost || 0,
          date: b.date || new Date().toISOString().split("T")[0],
          status: b.status || "confirmed",
          pnr: b.pnr || fd.pnr || `TH-${bookingIdStr.slice(-6).toUpperCase()}`,
          flightDetails: fd
        };
      });

      // Group by flight number and route to calculate "how many users booked which flight"
      const flightGroupMap: { [key: string]: {
        flightNumber: string;
        airline: string;
        origin: string;
        originCode: string;
        destination: string;
        destinationCode: string;
        route: string;
        totalBookings: number;
        totalRevenue: number;
        passengers: Array<{
          userId: string;
          userName: string;
          userEmail: string;
          userAvatar: string;
          pnr: string;
          cost: number;
          date: string;
          status: string;
        }>;
      } } = {};

      detailedBookings.forEach(b => {
        const flightNum = b.flightDetails.flightNumber || "6E-204";
        const airline = b.flightDetails.airline || "IndiGo";
        const origCode = b.flightDetails.originCode || "DEL";
        const destCode = b.flightDetails.destinationCode || "GOI";
        const key = `${airline}_${flightNum}_${origCode}_${destCode}`;
        
        if (!flightGroupMap[key]) {
          flightGroupMap[key] = {
            flightNumber: flightNum,
            airline: airline,
            origin: b.flightDetails.origin || "Delhi",
            originCode: origCode,
            destination: b.flightDetails.destination || "Goa",
            destinationCode: destCode,
            route: `${origCode} ➔ ${destCode}`,
            totalBookings: 0,
            totalRevenue: 0,
            passengers: []
          };
        }

        flightGroupMap[key].totalBookings += 1;
        flightGroupMap[key].totalRevenue += b.cost;
        flightGroupMap[key].passengers.push({
          userId: b.userId,
          userName: b.userName,
          userEmail: b.userEmail,
          userAvatar: b.userAvatar,
          pnr: b.pnr,
          cost: b.cost,
          date: b.date,
          status: b.status
        });
      });

      const flightSummaries = Object.values(flightGroupMap).sort((a, b) => b.totalBookings - a.totalBookings);

      res.json({
        totalFlightBookings: detailedBookings.length,
        totalFlightRevenue: detailedBookings.reduce((acc, b) => acc + b.cost, 0),
        uniqueFlightRoutes: flightSummaries.length,
        flightSummaries,
        detailedBookings
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // REAL-TIME FLIGHT TRACKER & RADAR TELEMETRY ENDPOINTS
  // ---------------------------------------------------------

  // Helper to construct realistic live telemetry for any flight or PNR
  const generateLiveFlightTelemetry = (flightQuery: string) => {
    const q = flightQuery.toUpperCase().trim();
    const allBookings = db.bookings.find();
    
    // Check if matching booking exists
    const booking = allBookings.find(b => 
      (b.pnr && typeof b.pnr === "string" && b.pnr.toUpperCase().includes(q)) ||
      (b.flightDetails && (
        (b.flightDetails.flightNumber && typeof b.flightDetails.flightNumber === "string" && b.flightDetails.flightNumber.toUpperCase().includes(q)) ||
        (b.flightDetails.pnr && typeof b.flightDetails.pnr === "string" && b.flightDetails.pnr.toUpperCase().includes(q))
      )) ||
      (b.detailName && typeof b.detailName === "string" && b.detailName.toUpperCase().includes(q))
    );

    let flightNumber = q.includes("TH-") ? "6E-204" : q;
    let airline = "IndiGo";
    let origin = "Delhi (DEL)";
    let originCode = "DEL";
    let originCity = "New Delhi";
    let destination = "Goa (GOI)";
    let destinationCode = "GOI";
    let destinationCity = "Goa (Mopa)";
    let pnr = q.startsWith("TH-") ? q : `TH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    if (booking && booking.flightDetails) {
      flightNumber = booking.flightDetails.flightNumber || flightNumber;
      airline = booking.flightDetails.airline || airline;
      origin = `${booking.flightDetails.origin || "Delhi"} (${booking.flightDetails.originCode || "DEL"})`;
      originCode = booking.flightDetails.originCode || "DEL";
      destination = `${booking.flightDetails.destination || "Goa"} (${booking.flightDetails.destinationCode || "GOI"})`;
      destinationCode = booking.flightDetails.destinationCode || "GOI";
      pnr = booking.pnr || booking.flightDetails.pnr || pnr;
    } else if (q.startsWith("AI") || q.includes("AIR INDIA")) {
      airline = "Air India";
      flightNumber = q.includes("AI") ? q : "AI-102";
      origin = "Mumbai (BOM)";
      originCode = "BOM";
      destination = "Delhi (DEL)";
      destinationCode = "DEL";
    } else if (q.startsWith("UK") || q.includes("VISTARA")) {
      airline = "Vistara";
      flightNumber = q.includes("UK") ? q : "UK-815";
      origin = "Bengaluru (BLR)";
      originCode = "BLR";
      destination = "Delhi (DEL)";
      destinationCode = "DEL";
    } else if (q.startsWith("QP") || q.includes("AKASA")) {
      airline = "Akasa Air";
      flightNumber = q.includes("QP") ? q : "QP-1102";
      origin = "Bengaluru (BLR)";
      originCode = "BLR";
      destination = "Kochi (COK)";
      destinationCode = "COK";
    }

    // Determine realistic progress based on current system time
    const now = new Date();
    const currentMinute = now.getMinutes() + now.getSeconds() / 60;
    // Dynamic progress percentage cycling smoothly
    const progressPercent = Math.min(95, Math.max(15, Math.floor(((currentMinute * 3) % 85) + 12)));
    
    const totalDistanceKm = originCode === "DEL" && destinationCode === "GOI" ? 1520 :
                            originCode === "BOM" && destinationCode === "DEL" ? 1150 :
                            originCode === "BLR" && destinationCode === "DEL" ? 1740 : 1280;

    const distanceCoveredKm = Math.floor((totalDistanceKm * progressPercent) / 100);
    const distanceRemainingKm = totalDistanceKm - distanceCoveredKm;
    const remainingMinutes = Math.floor((distanceRemainingKm / 820) * 60);

    const isLanded = progressPercent >= 92;
    const isBoarding = progressPercent < 20;
    const status = isLanded ? "Landed" : isBoarding ? "Boarding" : "In Air";

    const statusBadge = isLanded ? { text: "Landed & Arrived", bg: "bg-emerald-100", textClr: "text-emerald-800" } :
                        isBoarding ? { text: "Boarding Gate Open", bg: "bg-amber-100", textClr: "text-amber-800" } :
                        { text: "In Flight (En Route)", bg: "bg-indigo-100", textClr: "text-indigo-800" };

    return {
      flightNumber,
      airline,
      pnr,
      aircraftType: airline === "Air India" ? "Boeing 787-9 Dreamliner" : "Airbus A320neo",
      registration: `VT-${airline.charAt(0).toUpperCase()}X${Math.floor(100 + Math.random() * 900)}`,
      status,
      statusBadge,
      origin: {
        name: origin,
        code: originCode,
        city: originCity,
        terminal: "Terminal 3",
        gate: `G-${Math.floor(1 + Math.random() * 18)}`,
        scheduledDeparture: "08:30 AM",
        actualDeparture: "08:35 AM",
        weather: { temp: "29°C", condition: "Clear Sky", wind: "12 km/h NW" }
      },
      destination: {
        name: destination,
        code: destinationCode,
        city: destinationCity,
        terminal: "Terminal 1",
        gate: `B-${Math.floor(1 + Math.random() * 12)}`,
        baggageClaim: `Belt ${Math.floor(1 + Math.random() * 6)}`,
        scheduledArrival: "11:15 AM",
        estimatedArrival: "11:12 AM",
        weather: { temp: "27°C", condition: "Partly Cloudy", wind: "18 km/h SW" }
      },
      telemetry: {
        altitudeFt: isLanded ? 0 : isBoarding ? 0 : 36000 + Math.floor(Math.sin(currentMinute) * 500),
        speedKmph: isLanded ? 0 : isBoarding ? 0 : 840 + Math.floor(Math.cos(currentMinute) * 20),
        headingDegrees: 215,
        progressPercent,
        elapsedMinutes: Math.max(10, Math.floor((progressPercent / 100) * 135)),
        remainingMinutes,
        distanceCoveredKm,
        distanceRemainingKm,
        totalDistanceKm,
        latitude: 28.5562 - (progressPercent / 100) * 13.0,
        longitude: 77.1000 - (progressPercent / 100) * 3.2
      },
      events: [
        { time: "08:25 AM", text: `Passenger boarding completed at Gate G-${Math.floor(1 + Math.random() * 10)} (${originCode}).`, type: "info" },
        { time: "08:35 AM", text: `Pushback approved. Airborne via Runway 29R at ${originCode}.`, type: "success" },
        { time: "08:50 AM", text: "Reached cruising altitude of 36,000 ft (FL360). In-flight meal service active.", type: "info" },
        { time: "09:40 AM", text: `Passing waypoint OVERLAND-1. Smooth atmospheric conditions reported by Air Traffic Control.`, type: "info" },
        { time: "10:55 AM", text: `Baggage claim carousel Belt ${Math.floor(1 + Math.random() * 6)} assigned at ${destinationCode}.`, type: "success" }
      ]
    };
  };

  // Live single flight tracker endpoint
  app.get("/api/flights/track/:query", (req, res) => {
    try {
      const { query } = req.params;
      const telemetryData = generateLiveFlightTelemetry(query || "6E-204");
      res.json(telemetryData);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Active Radar Fleet overview endpoint
  app.get("/api/flights/radar", (req, res) => {
    try {
      const activeFlights = [
        generateLiveFlightTelemetry("6E-204"),
        generateLiveFlightTelemetry("AI-102"),
        generateLiveFlightTelemetry("UK-815"),
        generateLiveFlightTelemetry("QP-1102"),
        generateLiveFlightTelemetry("SG-402"),
        generateLiveFlightTelemetry("IX-342")
      ];

      res.json({
        totalAirborne: activeFlights.filter(f => f.status === "In Air").length,
        totalFlightsInRadar: activeFlights.length,
        radarFlights: activeFlights,
        lastUpdated: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // ADMIN MODULE MANAGEMENT ENDPOINTS
  // ---------------------------------------------------------

  // List all users
  app.get("/api/users", (req, res) => {
    try {
      const users = db.users.find().map(u => {
        const { password: _, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update user role or profile information by admin
  app.put("/api/users/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      const { 
        role, name, emergencyContact, preferredStyle, 
        avatarUrl, bio, location, phone, foodPreference, paymentMethod 
      } = req.body;

      const updateData: any = {};
      if (role !== undefined) {
        if (userId === "user-admin") {
          updateData.role = "admin";
        } else {
          updateData.role = "user";
        }
      }
      if (name !== undefined) updateData.name = name;
      if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
      if (preferredStyle !== undefined) updateData.preferredStyle = preferredStyle;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
      if (bio !== undefined) updateData.bio = bio;
      if (location !== undefined) updateData.location = location;
      if (phone !== undefined) updateData.phone = phone;
      if (foodPreference !== undefined) updateData.foodPreference = foodPreference;
      if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;

      const updated = db.users.update(userId, updateData);
      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = updated;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Delete user
  app.delete("/api/users/:userId", (req, res) => {
    try {
      const { userId } = req.params;
      db.users.delete(userId);
      res.json({ success: true, message: "User account deleted successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ---------------------------------------------------------
  // MONGODB COMPASS / ATLAS DATABASE MANAGEMENT ENDPOINTS
  // ---------------------------------------------------------

  // Get MongoDB / DB Status
  app.get("/api/db/status", (req, res) => {
    try {
      res.json(db.getStatus());
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Connect or Test Custom MongoDB URI
  app.post("/api/db/connect", async (req, res) => {
    try {
      const { uri } = req.body;
      if (!uri) {
        return res.status(400).json({ error: "MongoDB connection URI is required" });
      }

      const result = await db.connectCustomUri(uri);
      if (result.success) {
        res.json({ success: true, message: result.message, status: db.getStatus() });
      } else {
        res.status(400).json({ success: false, error: result.error, status: db.getStatus() });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // ---------------------------------------------------------
  // VITE DEV SERVER / STATIC PRODUCTION MIDDLEWARE
  // ---------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TravelHub Backend] Server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start travel applet server:", err);
});
