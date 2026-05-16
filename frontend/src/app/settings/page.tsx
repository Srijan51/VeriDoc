"use client";

import React, { useState, useEffect } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { deleteAllDocuments, healthCheck } from "@/lib/api";
import { useToast } from "@/lib/hooks/useToast";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");

  // Data States
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // Modals
  const [isDangerModalOpen, setIsDangerModalOpen] = useState(false);
  const [dangerActionType, setDangerActionType] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [avatarColor, setAvatarColor] = useState("#00C9A7");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    // Load profile from localStorage
    const saved = localStorage.getItem("veridoc_profile");
    if (saved) {
      try {
        setProfileData(JSON.parse(saved));
      } catch {
        // Ignore corrupt data
      }
    } else {
      setProfileData({ name: "Admin", email: "admin@company.com", role: "Admin" });
    }

    const savedColor = localStorage.getItem("veridoc_avatar_color");
    if (savedColor) setAvatarColor(savedColor);

    // Check backend connectivity
    healthCheck()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("veridoc_profile", JSON.stringify(profileData));
      localStorage.setItem("veridoc_avatar_color", avatarColor);
      addToast("Profile saved", "success");
    } catch (error) {
      addToast("Failed to save profile", "error");
    } finally {
      setTimeout(() => setIsSaving(false), 300);
    }
  };

  const handleDangerAction = async () => {
    setIsDangerModalOpen(false);
    if (dangerActionType === "delete_docs") {
      setIsDeleting(true);
      try {
        const result = await deleteAllDocuments();
        addToast(result.message, "success");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to delete documents";
        addToast(msg, "error");
      } finally {
        setIsDeleting(false);
      }
    } else {
      addToast("This feature is not available yet", "info");
    }
  };

  const navItems = ["Profile", "System", "Reset"];

  return (
    <div className="w-full py-8 px-8 animate-fade-in flex gap-16">
      {/* LEFT NAV */}
      <div className="w-[240px] flex-shrink-0">
        <h1
          className="text-[24px] font-bold mb-8"
          style={{
            fontFamily: "var(--font-heading), system-ui, sans-serif",
            color: "var(--text-primary)",
          }}
        >
          Settings
        </h1>
        <nav>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  onClick={() => setActiveTab(item)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-[14px] font-medium transition-all relative ${
                    activeTab === item
                      ? "glass shadow-sm text-text-primary"
                      : "text-text-secondary hover:bg-white/40 hover:text-text-primary"
                  }`}
                >
                  {activeTab === item && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-5 rounded-r-full bg-accent-mint" />
                  )}
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 min-h-[600px] max-w-4xl">
        {activeTab === "Profile" && (
          <div className="animate-fade-in">
            <h2
              className="text-[20px] font-bold mb-2"
              style={{
                fontFamily: "var(--font-heading), system-ui, sans-serif",
                color: "var(--text-primary)",
              }}
            >
              Profile
            </h2>
            <p className="text-[14px] text-text-muted mb-8">
              Manage your personal information
            </p>

            <div className="flex items-center gap-6 mb-10 p-6 glass-card rounded-2xl shadow-sm">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-[22px] transition-colors duration-300"
                style={{
                  fontFamily: "var(--font-heading), system-ui, sans-serif",
                  backgroundColor: avatarColor,
                }}
              >
                {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <p className="text-[16px] font-bold text-text-primary">
                  {profileData.name || "User Name"}
                </p>
                <p className="text-[13px] text-text-muted mb-3">
                  {profileData.email || "user@example.com"}
                </p>
                <div className="relative">
                  <button 
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="px-4 py-2 rounded-lg text-[12px] font-semibold border border-white/60 hover:bg-white/40 hover:border-accent-mint/40 transition-all glass-panel shadow-sm"
                  >
                    Change Avatar
                  </button>
                  {showColorPicker && (
                    <div className="absolute top-full left-0 mt-2 p-3 rounded-xl glass-card border border-white/60 shadow-lg z-10 animate-scale-in">
                      <p className="text-[10px] font-bold text-text-muted mb-2 uppercase tracking-wider">Choose Color</p>
                      <div className="flex gap-2 flex-wrap" style={{ width: '152px' }}>
                        {[
                          "#00C9A7", "#00897B", "#7C3AED", "#38BDF8",
                          "#FF6B35", "#F5A623", "#FF3B3B", "#1A1A1A",
                        ].map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setAvatarColor(color);
                              localStorage.setItem("veridoc_avatar_color", color);
                              setShowColorPicker(false);
                              addToast("Avatar color updated", "success");
                            }}
                            className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                            style={{
                              backgroundColor: color,
                              borderColor: avatarColor === color ? "white" : "transparent",
                              boxShadow: avatarColor === color ? `0 0 0 2px ${color}` : "none",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-2xl space-y-6">
              <div>
                <label className="block text-[13px] font-bold text-text-primary mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  className="w-full h-11 px-4 rounded-xl glass-panel text-[14px] outline-none focus:border-accent-mint focus:ring-2 focus:ring-accent-mint/20 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-text-primary mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  className="w-full h-11 px-4 rounded-xl glass-panel text-[14px] outline-none focus:border-accent-mint focus:ring-2 focus:ring-accent-mint/20 transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-text-primary mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={profileData.role}
                  readOnly
                  className="w-full h-11 px-4 rounded-xl border border-border bg-white/30 text-text-muted text-[14px] outline-none cursor-not-allowed"
                />
              </div>
              <div className="flex justify-end pt-6">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white bg-accent-mint hover:bg-accent-teal transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset settings */}
        {activeTab === "Reset" && (
          <div className="animate-fade-in">
            <h2
              className="text-[20px] font-bold mb-2"
              style={{
                fontFamily: "var(--font-heading), system-ui, sans-serif",
                color: "var(--severity-critical)",
              }}
            >
              Reset
            </h2>
            <p className="text-[14px] text-text-muted mb-8">
              Destructive actions for your organization
            </p>

            <div className="border border-[#FFCDB8]/60 rounded-2xl p-8 bg-[#FFF0F0]/40 backdrop-blur-md space-y-6 shadow-sm">
              {[
                {
                  title: "Delete All Documents",
                  desc: "Permanently removes all indexed files",
                  action: "delete_docs",
                },
                {
                  title: "Reset Organization",
                  desc: "Clears all settings and members",
                  action: "reset_org",
                },
                {
                  title: "Delete Account",
                  desc: "This cannot be undone",
                  action: "delete_account",
                },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between p-4 glass rounded-xl border border-[#FFCDB8]/50 shadow-sm">
                  <div>
                    <h3 className="text-[15px] font-bold text-text-primary">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-text-muted mt-1">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDangerActionType(item.action);
                      setIsDangerModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl text-[13px] font-semibold border border-[#FFB3B3] text-[#FF3B3B] hover:bg-[#FF3B3B] hover:text-white transition-colors"
                  >
                    {item.title}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System status tab */}
        {activeTab === "System" && (
          <div className="animate-fade-in">
            <h2
              className="text-[20px] font-bold mb-2"
              style={{
                fontFamily: "var(--font-heading), system-ui, sans-serif",
                color: "var(--text-primary)",
              }}
            >
              System Status
            </h2>
            <p className="text-[14px] text-text-muted mb-8">
              Check backend connectivity
            </p>
            
            <div className="glass-card rounded-2xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${backendStatus === "online" ? "bg-accent-mint animate-pulse" : backendStatus === "offline" ? "bg-severity-critical" : "bg-severity-medium animate-pulse"}`} />
                <span className="text-[14px] font-medium text-text-primary">
                  Backend: {backendStatus === "online" ? "Connected" : backendStatus === "offline" ? "Disconnected" : "Checking..."}
                </span>
              </div>
              <button
                onClick={() => {
                  setBackendStatus("checking");
                  healthCheck()
                    .then(() => { setBackendStatus("online"); addToast("Backend is online", "success"); })
                    .catch(() => { setBackendStatus("offline"); addToast("Cannot reach backend", "error"); });
                }}
                className="px-4 py-2 rounded-lg text-[13px] font-medium border border-border glass-panel hover:bg-white/40 transition-colors"
              >
                Test Connection
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDangerModalOpen}
        title="Are you sure?"
        description="This action cannot be undone and will permanently delete all your documents and their data."
        confirmLabel={isDeleting ? "Deleting..." : "Yes, Delete All"}
        confirmVariant="danger"
        onConfirm={handleDangerAction}
        onCancel={() => setIsDangerModalOpen(false)}
      />
    </div>
  );
}
