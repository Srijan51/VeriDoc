"use client";

import React, { useState, useEffect } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { deleteAccount, deleteAllDocuments, fetchModels, healthCheck } from "@/lib/api";
import { useToast } from "@/lib/hooks/useToast";
import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

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
  const [generationModel, setGenerationModel] = useState("llama-3.3-70b-versatile");
  const [environmentName, setEnvironmentName] = useState("development");
  const [avatarColor, setAvatarColor] = useState("#00C9A7");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  const { addToast } = useToast();
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("veridoc_profile");
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        if (parsedProfile && typeof parsedProfile === "object") {
          setProfileData((current) => ({
            ...current,
            ...parsedProfile,
          }));
        }
      }
    } catch {
      // Ignore malformed saved profile data.
    }

    if (user) {
      setProfileData({
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        role: "User",
      });
    }

    const savedColor = localStorage.getItem("veridoc_avatar_color");
    if (savedColor) setAvatarColor(savedColor);

    // Check backend connectivity
    healthCheck()
      .then(() => setBackendStatus("online"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  useEffect(() => {
    if (activeTab !== "System") {
      return;
    }

    fetchModels()
      .then((response) => {
        const configuredModel = response.available_models?.[0];
        if (configuredModel) {
          setGenerationModel(configuredModel);
        }
      })
      .catch(() => {
        setGenerationModel("llama-3.3-70b-versatile");
      });

    healthCheck()
      .then((response) => {
        setBackendStatus("online");
        const healthData = response as unknown as Record<string, unknown>;
        const envValue =
          (typeof healthData.environment === "string" && healthData.environment) ||
          (typeof healthData.env === "string" && healthData.env) ||
          (typeof healthData.node_env === "string" && healthData.node_env) ||
          "development";
        setEnvironmentName(envValue);
      })
      .catch(() => {
        setBackendStatus("offline");
        setEnvironmentName("development");
      });
  }, [activeTab]);

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
        localStorage.removeItem("veridoc_resolved_contradictions");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to delete documents";
        addToast(msg, "error");
      } finally {
        setIsDeleting(false);
      }
    } else if (dangerActionType === "delete_account") {
      setIsDeleting(true);
      try {
        const result = await deleteAccount();
        localStorage.removeItem("veridoc_profile");
        localStorage.removeItem("veridoc_avatar_color");
        addToast(result.message, "success");
        await signOut();
        router.replace("/login?message=Account%20deleted%20successfully.%20Please%20sign%20in%20to%20continue.");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to delete account";
        addToast(msg, "error");
      } finally {
        setIsDeleting(false);
      }
    } else if (dangerActionType === "reset_org") {
      setIsDeleting(true);
      try {
        await deleteAllDocuments();
        localStorage.removeItem("veridoc_profile");
        localStorage.removeItem("veridoc_avatar_color");
        localStorage.removeItem("veridoc_resolved_contradictions");
        sessionStorage.removeItem("veridoc_scanned_contradictions");
        sessionStorage.removeItem("veridoc_detected_contradictions");
        setProfileData({
          name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User",
          email: user?.email || "",
          role: "User",
        });
        setAvatarColor("#00C9A7");
        addToast("Organization reset successfully", "success");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to reset organization";
        addToast(msg, "error");
      } finally {
        setIsDeleting(false);
      }
    } else {
      addToast("This feature is not available yet", "info");
    }
  };

  const getDangerModalContent = () => {
    switch (dangerActionType) {
      case "delete_docs":
        return {
          title: "Delete All Documents?",
          desc: "This action cannot be undone and will permanently delete all your documents and their data.",
          confirmText: isDeleting ? "Deleting..." : "Yes, Delete All"
        };
      case "reset_org":
        return {
          title: "Reset Organization?",
          desc: "This will clear all settings and remove all members. This cannot be undone.",
          confirmText: "Yes, Reset Organization"
        };
      case "delete_account":
        return {
          title: "Delete Account?",
          desc: "Your account and all associated data will be permanently deleted.",
          confirmText: isDeleting ? "Deleting..." : "Yes, Delete Account"
        };
      default:
        return { title: "Are you sure?", desc: "", confirmText: "Confirm" };
    }
  };

  const modalContent = getDangerModalContent();

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
              <p className="text-[12px] text-text-muted mb-4" style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
                {backendUrl}
              </p>
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

            <div className="glass-card rounded-2xl shadow-sm p-6 mt-6">
              <h3 className="text-[16px] font-bold text-text-primary mb-4">AI Models</h3>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <p className="text-[13px] text-text-secondary">Generation Model: {generationModel}</p>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-accent-teal">Active</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <p className="text-[13px] text-text-secondary">Embedding Model: gemini-embedding-001</p>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-accent-teal">Active</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <p className="text-[13px] text-text-secondary">Embedding Dimensions: 768</p>
                  <span className="text-[12px] font-medium text-text-primary">Configured</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl shadow-sm p-6 mt-6">
              <h3 className="text-[16px] font-bold text-text-primary mb-4">Storage</h3>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <p className="text-[13px] text-text-secondary">Vector Store: Supabase pgvector</p>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-accent-teal">Active</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <p className="text-[13px] text-text-secondary">Document Storage: Supabase Storage Bucket</p>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-accent-teal">Active</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <p className="text-[13px] text-text-secondary">Metadata Store: PostgreSQL (via Supabase)</p>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-accent-teal">Active</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl shadow-sm p-6 mt-6">
              <h3 className="text-[16px] font-bold text-text-primary mb-4">Environment</h3>
              <div className="space-y-0">
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <p className="text-[13px] text-text-secondary">Runtime Environment</p>
                  <span className="text-[12px] font-medium text-text-primary" style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}>
                    {environmentName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <p className="text-[13px] text-text-secondary">Frontend Version: Next.js 16</p>
                  <span className="text-[12px] font-medium text-text-primary">Active</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <p className="text-[13px] text-text-secondary">API Version: 1.0.0</p>
                  <span className="text-[12px] font-medium text-text-primary">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDangerModalOpen}
        title={modalContent.title}
        description={modalContent.desc}
        confirmLabel={modalContent.confirmText}
        confirmVariant="danger"
        onConfirm={handleDangerAction}
        onCancel={() => setIsDangerModalOpen(false)}
      />
    </div>
  );
}
