import React, { useState, useEffect } from "react";
import { User, Destination } from "./types";
import AuthView from "./components/AuthView";
import DashboardView from "./components/DashboardView";
import DestinationsView from "./components/DestinationsView";
import TripsView from "./components/TripsView";
import AdminView from "./components/AdminView";
import ProfileView from "./components/ProfileView";
import FlightTrackerView from "./components/FlightTrackerView";
import HomeView from "./components/HomeView";
import CurrencyConverterModal from "./components/CurrencyConverterModal";
import PackingListModal from "./components/PackingListModal";
import { 
  Compass, LayoutDashboard, MapPin, ClipboardList, 
  User as UserIcon, Shield, LogOut, Bell, Menu, X, Plane, Radio, Luggage, ArrowRightLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // High-fidelity routing bridge: pre-populating trip creation from explore selection
  const [selectedDestinationForTrip, setSelectedDestinationForTrip] = useState<Destination | null>(null);
  
  // Special Tool Modals State
  const [showAppForex, setShowAppForex] = useState(false);
  const [showAppPacking, setShowAppPacking] = useState(false);

  // Load user session on mount
  useEffect(() => {
    const saved = localStorage.getItem("voyage_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (err) {
        localStorage.removeItem("voyage_user");
      }
    }
  }, []);

  // Guarantee admins do not land on trips tab
  useEffect(() => {
    if (user?.role === "admin" && activeTab === "trips") {
      setActiveTab("dashboard");
    }
  }, [user, activeTab]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("voyage_user", JSON.stringify(loggedInUser));
    setActiveTab(loggedInUser.role === "admin" ? "dashboard" : "dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("voyage_user");
    setActiveTab("dashboard");
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("voyage_user", JSON.stringify(updatedUser));
  };

  const handleSelectDestinationForTrip = (dest: Destination) => {
    setSelectedDestinationForTrip(dest);
    if (user?.role === "admin") {
      setActiveTab("destinations");
    } else {
      setActiveTab("trips");
    }
  };

  if (!user) {
    return <HomeView onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigation tab definitions (Trip Boards removed for admin role)
  const tabs = [
    { id: "dashboard", label: "Analytics", icon: LayoutDashboard },
    { id: "tracker", label: "Live Flight Radar", icon: Radio },
    { id: "destinations", label: "Explore", icon: MapPin },
    ...(user.role === "admin" ? [] : [{ id: "trips", label: "Trip Boards", icon: ClipboardList }]),
    ...(user.role === "admin" ? [{ id: "admin", label: "Admin Desk", icon: Shield }] : []),
    { id: "profile", label: "My Profile", icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col antialiased transition-colors duration-200">
      
      {/* GLOBAL BENTO NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Platform Brand */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("dashboard")}>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/10">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-base tracking-tight block leading-none">TravelHub</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 block">Indian Tour Ledger</span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      isActive 
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100/45" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 border border-transparent"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Right side controls: Quick Tools, Profile summary & Logout */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowAppForex(true)}
                className="px-3 py-1.5 bg-amber-50 border border-amber-200/80 hover:bg-amber-100 text-amber-800 font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
                title="Forex & Currency Converter"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Forex</span>
              </button>

              <button
                onClick={() => setShowAppPacking(true)}
                className="px-3 py-1.5 bg-indigo-50 border border-indigo-200/80 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
                title="Smart Travel Packing Checklist & Weather Advisory"
              >
                <Luggage className="w-3.5 h-3.5" />
                <span>Packing</span>
              </button>

              <div className="h-6 w-[1px] bg-slate-200 mx-1"></div>

              <div className="text-right">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Logged In As</span>
                <span className="text-xs font-bold text-slate-700 capitalize">
                  {user.name} ({user.role})
                </span>
              </div>

              <div className="h-6 w-[1px] bg-slate-200"></div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                title="Sign Out Session"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Menu Button Toggle */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-slate-500 hover:bg-slate-50 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-100 bg-white"
            >
              <div className="px-2 pt-2 pb-4 space-y-1 sm:px-3">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
                        isActive 
                          ? "bg-indigo-50 text-indigo-700" 
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* COMPREHENSIVE MAIN CONTAINER VIEW */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === "dashboard" && (
              <DashboardView 
                user={user} 
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenFlightModal={() => setActiveTab(user.role === "admin" ? "destinations" : "trips")} 
              />
            )}

            {activeTab === "tracker" && (
              <FlightTrackerView 
                user={user}
                onNavigateToTrips={() => setActiveTab(user.role === "admin" ? "destinations" : "trips")}
              />
            )}

            {activeTab === "destinations" && (
              <DestinationsView 
                user={user} 
                onSelectDestinationForTrip={handleSelectDestinationForTrip} 
              />
            )}

            {activeTab === "trips" && (
              <TripsView 
                user={user} 
                selectedDestinationFromExplore={selectedDestinationForTrip}
                onClearExploreSelection={() => setSelectedDestinationForTrip(null)}
              />
            )}

            {activeTab === "admin" && user.role === "admin" && (
              <AdminView 
                user={user} 
                onNavigateToDestinations={() => setActiveTab("destinations")} 
              />
            )}

            {activeTab === "profile" && (
              <ProfileView 
                user={user} 
                onProfileUpdate={handleUpdateUser} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200/60 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} TravelHub Inc. Multi-Module Travel, Bookings, & Expense Settlement Engine.</p>
          <p className="mt-1">All ledger values, splits, and currency calculations secured in Indian Rupees (INR, ₹).</p>
        </div>
      </footer>

      {/* GLOBAL SPECIAL TOOLS MODALS */}
      <CurrencyConverterModal
        isOpen={showAppForex}
        onClose={() => setShowAppForex(false)}
        initialAmount={15000}
      />

      <PackingListModal
        isOpen={showAppPacking}
        onClose={() => setShowAppPacking(false)}
      />
    </div>
  );
}
