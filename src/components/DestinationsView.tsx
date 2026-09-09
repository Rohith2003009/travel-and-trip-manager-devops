import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Destination, User } from "../types";
import { Search, Compass, Trash2, Edit, Plus, X, Calendar, DollarSign, MapPin, Check } from "lucide-react";

interface DestinationsViewProps {
  user: User;
  onSelectDestinationForTrip?: (dest: Destination) => void;
}

const CATEGORIES = ["All", "Mountains", "Beaches", "Heritage", "Nature", "Wildlife"];

export default function DestinationsView({ user, onSelectDestinationForTrip }: DestinationsViewProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  
  // Modals / Form states
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [confirmDeleteDestId, setConfirmDeleteDestId] = useState<string | null>(null);
  
  // Add/Edit Form inputs
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [formCategory, setFormCategory] = useState("Mountains");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [idealDays, setIdealDays] = useState(3);
  const [estimatedCost, setEstimatedCost] = useState(15000);
  const [highlightsInput, setHighlightsInput] = useState("");
  const [attractionsInput, setAttractionsInput] = useState("");
  const [error, setError] = useState("");

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append("q", search);
      if (category !== "All") query.append("category", category);
      
      const res = await fetch(`/api/destinations?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load destinations catalog");
      
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        setDestinations(data);
      } else {
        throw new Error("Received non-JSON response from server");
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, [search, category]);

  const handleOpenAddForm = () => {
    setEditingDest(null);
    setName("");
    setState("");
    setFormCategory("Mountains");
    setDescription("");
    setImageUrl("");
    setIdealDays(3);
    setEstimatedCost(15000);
    setHighlightsInput("");
    setAttractionsInput("");
    setError("");
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (dest: Destination, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering detail card click
    setEditingDest(dest);
    setName(dest.name);
    setState(dest.state);
    setFormCategory(dest.category);
    setDescription(dest.description);
    setImageUrl(dest.imageUrl);
    setIdealDays(dest.idealDays);
    setEstimatedCost(dest.estimatedCost);
    setHighlightsInput(dest.highlights.join(", "));
    setAttractionsInput(dest.attractions.join(", "));
    setError("");
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");
      setDestinations(destinations.filter(d => d.id !== id));
      if (selectedDest?.id === id) setSelectedDest(null);
      setConfirmDeleteDestId(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const highlights = highlightsInput.split(",").map(s => s.trim()).filter(Boolean);
    const attractions = attractionsInput.split(",").map(s => s.trim()).filter(Boolean);

    const payload = {
      name,
      state,
      category: formCategory,
      description,
      imageUrl,
      idealDays: Number(idealDays),
      estimatedCost: Number(estimatedCost),
      highlights,
      attractions
    };

    const url = editingDest ? `/api/destinations/${editingDest.id}` : "/api/destinations";
    const method = editingDest ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit destination form");
      }

      setIsFormOpen(false);
      fetchDestinations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatINR = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Handpicked Indian Destinations</h1>
          <p className="text-slate-500 text-sm mt-1">Explore iconic cities, coastal beaches, and rugged mountain valleys across India.</p>
        </div>
        
        {user.role === "admin" && (
          <button
            onClick={handleOpenAddForm}
            className="self-start sm:self-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4.5 h-4.5" />
            Add Destination
          </button>
        )}
      </div>

      {/* Filter Bar & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by city, state, spots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                category === cat 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Destination Cards */}
      {loading ? (
        <div className="text-center py-24 text-slate-500 animate-pulse text-sm">Searching Indian holiday hotspots...</div>
      ) : destinations.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-12 text-center text-slate-500 text-sm">
          No destinations match your search term or category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <motion.div
              layout
              key={dest.id}
              onClick={() => setSelectedDest(dest)}
              className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col group"
            >
              <div className="h-48 w-full overflow-hidden relative bg-slate-100">
                <img 
                  src={dest.imageUrl} 
                  alt={dest.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm border border-slate-200">
                  {dest.category}
                </span>

                {/* Admin Quick Action Floating Buttons */}
                {user.role === "admin" && (
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    <button
                      onClick={(e) => handleOpenEditForm(dest, e)}
                      className="p-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 rounded-lg shadow-sm transition-colors border border-slate-200"
                      title="Edit Destination"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {confirmDeleteDestId === dest.id ? (
                      <button
                        onClick={(e) => handleDelete(dest.id, e)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition-all text-[10px] font-extrabold"
                      >
                        Confirm
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteDestId(dest.id);
                        }}
                        className="p-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-red-600 rounded-lg shadow-sm transition-colors border border-slate-200"
                        title="Delete Destination"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {dest.state}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mt-1">{dest.name}</h3>
                  <p className="text-slate-500 text-xs mt-2 line-clamp-3 leading-relaxed">
                    {dest.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {dest.idealDays} Days Recommended
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimated Budget</div>
                    <div className="text-sm font-extrabold text-indigo-600">{formatINR(dest.estimatedCost)}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* --- DESTINATION DETAIL PANEL MODAL --- */}
      <AnimatePresence>
        {selectedDest && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedDest(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Image banner */}
              <div className="h-64 w-full relative bg-slate-100">
                <img 
                  src={selectedDest.imageUrl} 
                  alt={selectedDest.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => setSelectedDest(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4 text-white bg-slate-900/50 px-3 py-1.5 rounded-lg border border-white/10">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-200">{selectedDest.state}</div>
                  <h2 className="text-2xl font-bold">{selectedDest.name}</h2>
                </div>
              </div>

              {/* Contents */}
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">About this spot</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{selectedDest.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Highlights */}
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Key Highlights</h4>
                    <ul className="space-y-2">
                      {selectedDest.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Top Attractions */}
                  <div className="bg-slate-50 border border-slate-200/50 p-4 rounded-xl">
                    <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Top Local Attractions</h4>
                    <ul className="space-y-2">
                      {selectedDest.attractions.map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-600">
                          <Compass className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer price, info, & CTA */}
                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated Standard Cost</span>
                    <div className="text-xl font-extrabold text-indigo-600">{formatINR(selectedDest.estimatedCost)}</div>
                    <span className="text-xs text-slate-400">Includes budget lodging, travel & local entry fees</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDest(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm rounded-lg transition-colors"
                    >
                      Close Details
                    </button>
                    {onSelectDestinationForTrip && (
                      <button
                        onClick={() => {
                          onSelectDestinationForTrip(selectedDest);
                          setSelectedDest(null);
                        }}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
                      >
                        Start Trip Plan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ADMIN ADD/EDIT FORM MODAL --- */}
      <AnimatePresence>
        {isFormOpen && (
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
                <h3 className="font-semibold text-slate-800 text-lg">
                  {editingDest ? "Edit Indian Destination" : "Catalog New Destination"}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="p-1 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-b border-red-200 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Destination Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manali"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">State / Territory</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Himachal Pradesh"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    >
                      {CATEGORIES.filter(c => c !== "All").map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Estimated Cost (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="15000"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ideal Days to Visit</label>
                    <input
                      type="number"
                      required
                      value={idealDays}
                      onChange={(e) => setIdealDays(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a stunning, high-level summary of the destination..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Highlights (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Rohtang Pass, Solang Valley, Mall Road"
                    value={highlightsInput}
                    onChange={(e) => setHighlightsInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Local Attractions (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Jogini Waterfall, Hadimba Temple"
                    value={attractionsInput}
                    onChange={(e) => setAttractionsInput(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium text-sm rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors"
                  >
                    {editingDest ? "Save Changes" : "Create Destination"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
