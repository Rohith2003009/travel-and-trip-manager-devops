import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User } from "../types";
import { User as UserIcon, Shield, Sparkles, MapPin, Check, Save } from "lucide-react";

interface ProfileViewProps {
  user: User;
  onProfileUpdate: (updatedUser: User) => void;
}

export default function ProfileView({ user, onProfileUpdate }: ProfileViewProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [preferredStyle, setPreferredStyle] = useState(user.preferredStyle || "leisure");
  const [emergencyContact, setEmergencyContact] = useState(user.emergencyContact || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [bio, setBio] = useState(user.bio || "");
  const [location, setLocation] = useState(user.location || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [foodPreference, setFoodPreference] = useState(user.foodPreference || "Veg");
  const [paymentMethod, setPaymentMethod] = useState(user.paymentMethod || "UPI");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState({ tripsCount: 0, totalSpend: 0 });

  const presetAvatars = [
    { name: "Hiker", url: "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=150&q=80" },
    { name: "Beachy", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=150&q=80" },
    { name: "Backpacker", url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=150&q=80" },
    { name: "Explorer", url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=150&q=80" },
    { name: "Photographer", url: "https://images.unsplash.com/photo-1452784444945-3f422708fe5e?auto=format&fit=crop&w=150&q=80" },
  ];

  useEffect(() => {
    // Load some simple quick stats for the user
    const loadStats = async () => {
      try {
        const res = await fetch(`/api/analytics/summary/${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setStats({
            tripsCount: data.tripsCount || 0,
            totalSpend: data.totalSpend || 0
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadStats();
  }, [user.id]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          preferredStyle,
          emergencyContact,
          avatarUrl,
          bio,
          location,
          phone,
          foodPreference,
          paymentMethod
        })
      });

      if (!res.ok) throw new Error("Failed to update profile settings");
      const updated = await res.json();
      onProfileUpdate(updated);
      setMessage("Profile saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
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
      className="space-y-6 max-w-4xl mx-auto text-slate-800 dark:text-slate-100"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Profile & Travel Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure emergency contacts, select preferred tour styles, customize your avatar, and review travel metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Profile Card & Stats (1 col) */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4 text-center">
            {avatarUrl ? (
              <div className="relative w-24 h-24 mx-auto">
                <img 
                  src={avatarUrl} 
                  alt={user.name} 
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-slate-700 shadow-md"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-700 border border-indigo-100 dark:border-slate-600 rounded-full flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 font-bold text-3xl shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h3 className="font-extrabold text-lg">{user.name}</h3>
              <p className="text-xs text-slate-400 font-medium">{user.email}</p>
              {location && (
                <div className="flex items-center justify-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  {location}
                </div>
              )}
            </div>

            {bio && (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic max-w-xs mx-auto leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "{bio}"
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/40 dark:border-indigo-900/30 rounded-full text-[10px] font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                {user.preferredStyle || "Leisure"} style
              </div>
              {foodPreference && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100/40 dark:border-emerald-900/30 rounded-full text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  🍜 {foodPreference}
                </div>
              )}
              {paymentMethod && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-100/40 dark:border-amber-900/30 rounded-full text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  💸 {paymentMethod}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Planned Trips</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{stats.tripsCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Total Recorded Spend</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatINR(stats.totalSpend)}</span>
            </div>
          </div>
        </div>

        {/* Update Form (2 cols) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm tracking-tight pb-2 border-b border-slate-100 dark:border-slate-700">Personal & Lifestyle Configurations</h3>
          </div>
          
          {message && (
            <div className={`p-3 text-xs font-bold rounded-lg ${
              message.startsWith("Error") ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-900" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900"
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-5">
            
            {/* Avatar Preset Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Choose an Avatar Presets or enter URL below</label>
              <div className="flex flex-wrap gap-3 items-center">
                {presetAvatars.map((av) => (
                  <button
                    key={av.name}
                    type="button"
                    onClick={() => setAvatarUrl(av.url)}
                    className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${
                      avatarUrl === av.url ? "border-indigo-600 ring-2 ring-indigo-500/20 scale-105" : "border-transparent"
                    }`}
                  >
                    <img src={av.url} alt={av.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className={`w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-300 border-2 transition-all hover:bg-slate-200 ${
                    avatarUrl === "" ? "border-indigo-600" : "border-transparent"
                  }`}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Avatar Input Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Custom Avatar URL</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-900/60 text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none"
                  title="Contact support to update your registered email."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Short Bio</label>
              <textarea
                placeholder="Tell us about your travel dreams..."
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Current Hometown Location</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Personal Contact Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Preferred Exploration Style</label>
                <select
                  value={preferredStyle}
                  onChange={(e) => setPreferredStyle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="adventure">Adventure & Trekking</option>
                  <option value="heritage">Heritage & Temples</option>
                  <option value="nature">Nature & Hill Stations</option>
                  <option value="beach">Beaches & Coastal</option>
                  <option value="leisure">Leisure & Relaxing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  Emergency Contact Mobile
                </label>
                <input
                  type="text"
                  placeholder="+91 XXXXX XXXXX"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Food Preference</label>
                <select
                  value={foodPreference}
                  onChange={(e) => setFoodPreference(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="Veg">Vegetarian</option>
                  <option value="Non-Veg">Non-Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Jain">Jain Food</option>
                  <option value="Eggitarian">Eggitarian</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Preferred Settlement Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                  <option value="Cash">Direct Cash Settle</option>
                  <option value="Bank Transfer">IMPS / Net Banking</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
              >
                <Save className="w-4 h-4" />
                {loading ? "Saving Configuration..." : "Save Configuration"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </motion.div>
  );
}
