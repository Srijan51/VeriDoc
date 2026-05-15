"use client";

import React, { useState, useEffect } from "react";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import ConfirmModal from "@/components/ui/ConfirmModal";

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

  useEffect(() => {
    // Backend-ready fetch for profile
    const fetchProfile = async () => {
      try {
        // FIXME: Replace with real API
        // const res = await fetch('/api/settings/profile');
        // const data = await res.json();
        // setProfileData(data);

        // Simulating backend response
        setProfileData({
          name: "Jane Doe",
          email: "jane@example.com",
          role: "Admin",
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // await fetch('/api/settings/profile', { method: 'PATCH', body: JSON.stringify(profileData) });
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error(error);
      setIsSaving(false);
    }
  };

  const navItems = ["Profile", "Security", "History", "Reset"];

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
                className="w-16 h-16 rounded-full bg-accent-mint flex items-center justify-center text-white font-bold text-[22px]"
                style={{
                  fontFamily: "var(--font-heading), system-ui, sans-serif",
                }}
              >
                {profileData.name ? profileData.name.charAt(0) : "U"}
              </div>
              <div>
                <p className="text-[16px] font-bold text-text-primary">
                  {profileData.name || "User Name"}
                </p>
                <p className="text-[13px] text-text-muted mb-3">
                  {profileData.email || "user@example.com"}
                </p>
                <button className="px-4 py-2 rounded-lg text-[12px] font-semibold border border-white/60 hover:bg-white/40 transition-colors glass-panel shadow-sm">
                  Change Avatar
                </button>
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

        {/* Catch-all for not fully implemented tabs */}
        {["Security", "History"].includes(
          activeTab
        ) && (
          <div className="animate-fade-in py-12">
            <h2
              className="text-[20px] font-bold mb-2"
              style={{
                fontFamily: "var(--font-heading), system-ui, sans-serif",
                color: "var(--text-primary)",
              }}
            >
              {activeTab}
            </h2>
            <p className="text-[14px] text-text-muted mb-8">
              Manage your {activeTab.toLowerCase()} settings
            </p>
            
            <div className="p-8 glass-card rounded-2xl shadow-sm flex flex-col items-center justify-center text-center py-20 opacity-80">
              <h3 className="text-[16px] font-bold text-text-primary mb-2">
                Backend Configuration Required
              </h3>
              <p className="text-[13px] text-text-muted">
                The {activeTab} settings require active backend hooks to configure.
              </p>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDangerModalOpen}
        title="Are you sure?"
        description="This action cannot be undone and will permanently alter your organization's data."
        confirmLabel="Yes, Proceed"
        confirmVariant="danger"
        onConfirm={() => {
          setIsDangerModalOpen(false);
          /* Call specific endpoint based on dangerActionType */
        }}
        onCancel={() => setIsDangerModalOpen(false)}
      />
    </div>
  );
}
