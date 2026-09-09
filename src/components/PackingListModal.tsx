import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckSquare, Square, Plus, Trash2, CloudSun, Thermometer, 
  Umbrella, Compass, ShieldAlert, Sparkles, X, CheckCircle2,
  Luggage, FileText, Smartphone, Shirt, Sparkle
} from "lucide-react";
import { Destination, Trip } from "../types";

interface PackingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip?: Trip | null;
  destination?: Destination | null;
}

interface PackingItem {
  id: string;
  category: "documents" | "electronics" | "apparel" | "toiletries" | "gear";
  label: string;
  packed: boolean;
}

const DEFAULT_PACKING_ITEMS: PackingItem[] = [
  { id: "1", category: "documents", label: "Government Photo ID / Passport", packed: true },
  { id: "2", category: "documents", label: "Flight E-Tickets & Hotel Vouchers", packed: true },
  { id: "3", category: "documents", label: "Credit/Debit Cards & Cash Forex", packed: false },
  { id: "4", category: "electronics", label: "Phone Charger & High-Capacity Powerbank", packed: false },
  { id: "5", category: "electronics", label: "Noise-Cancelling Headphones / Earbuds", packed: false },
  { id: "6", category: "apparel", label: "Weather-appropriate clothing sets", packed: false },
  { id: "7", category: "apparel", label: "Comfortable Walking Shoes & Socks", packed: false },
  { id: "8", category: "toiletries", label: "Sunscreen Lotion & UV Lip Balm", packed: false },
  { id: "9", category: "toiletries", label: "Personal Toiletries & Hand Sanitizer", packed: false },
  { id: "10", category: "toiletries", label: "Basic Travel Medical & First Aid Kit", packed: false },
  { id: "11", category: "gear", label: "Refillable Water Bottle", packed: false },
  { id: "12", category: "gear", label: "Compact Travel Backpack / Daypack", packed: false },
];

export default function PackingListModal({ isOpen, onClose, trip, destination }: PackingListModalProps) {
  const tripKey = trip ? `packing_list_${trip.id}` : `packing_list_default`;
  
  const [items, setItems] = useState<PackingItem[]>(() => {
    const saved = localStorage.getItem(tripKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        return DEFAULT_PACKING_ITEMS;
      }
    }
    return DEFAULT_PACKING_ITEMS;
  });

  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<PackingItem["category"]>("apparel");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    localStorage.setItem(tripKey, JSON.stringify(items));
  }, [items, tripKey]);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, packed: !item.packed } : item))
    );
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;
    const newItem: PackingItem = {
      id: Date.now().toString(),
      category: newItemCategory,
      label: newItemLabel.trim(),
      packed: false,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemLabel("");
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totalCount = items.length;
  const packedCount = items.filter((i) => i.packed).length;
  const progressPercent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const filteredItems = items.filter((i) =>
    activeCategory === "all" ? true : i.category === activeCategory
  );

  // Weather Advisory Mock Generator
  const destName = destination?.name || trip?.title || "Tour Destination";
  const weatherTemp = destination?.category === "beach" ? "29°C" : destination?.category === "mountain" ? "14°C" : "26°C";
  const weatherCondition = destination?.category === "beach" ? "Sunny & Humid" : destination?.category === "mountain" ? "Cool Breeze & Mild Rain" : "Pleasant & Clear";
  const packingTip = destination?.category === "beach" 
    ? "Pack lightweight linen, swimwear, UV sunglasses & SPF 50+ sunscreen." 
    : destination?.category === "mountain" 
    ? "Pack warm layer fleece, windproof jacket & sturdy hiking boots." 
    : "Pack breathable cottons, comfortable walking sneakers & hat.";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                <Luggage className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold tracking-tight">Smart Packing Checklist & Weather Advisory</h2>
                <p className="text-[11px] text-slate-300 font-medium">Trip checklist manager for {destName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5">
            {/* Weather Advisory Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-blue-500/10 border border-sky-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <CloudSun className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <span>{destName} Forecast</span>
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-700 text-[10px] font-extrabold rounded-full">
                      {weatherTemp}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-sky-900 mt-0.5">{weatherCondition}</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium leading-tight">
                    💡 <strong>Tip:</strong> {packingTip}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Meter */}
            <div>
              <div className="flex items-center justify-between text-xs font-black text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Packing Readiness</span>
                </span>
                <span className="text-indigo-600 font-extrabold">
                  {packedCount} / {totalCount} Items ({progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-indigo-600 to-sky-500 rounded-full"
                />
              </div>
            </div>

            {/* Add Custom Item Input */}
            <form onSubmit={addItem} className="flex gap-2">
              <input
                type="text"
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                placeholder="Add new item (e.g. Power adapter, Umbrella)..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={newItemCategory}
                onChange={(e: any) => setNewItemCategory(e.target.value)}
                className="px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="apparel">Apparel</option>
                <option value="documents">Docs</option>
                <option value="electronics">Electronics</option>
                <option value="toiletries">Toiletries</option>
                <option value="gear">Gear</option>
              </select>
              <button
                type="submit"
                className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center gap-1 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: "all", label: "All Items" },
                { id: "documents", label: "Documents" },
                { id: "electronics", label: "Electronics" },
                { id: "apparel", label: "Apparel" },
                { id: "toiletries", label: "Toiletries" },
                { id: "gear", label: "Gear" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Item Checklist List */}
            <div className="space-y-2">
              {filteredItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No packing items found in this category.
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                      item.packed
                        ? "bg-emerald-50/60 border-emerald-200 text-slate-400"
                        : "bg-slate-50/80 hover:bg-white border-slate-200/80 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {item.packed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 shrink-0" />
                      )}
                      <span
                        className={`text-xs font-extrabold ${
                          item.packed ? "line-through text-slate-400" : "text-slate-800"
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                        {item.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="p-1 text-slate-300 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              Saved automatically to trip storage
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition-all active:scale-95"
            >
              Done Checklist
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
