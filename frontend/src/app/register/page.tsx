"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkEmailExists } from "@/lib/api";
import { useAuth } from "@/lib/hooks/useAuth";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const getPasswordStrength = (pw: string): { level: number; label: string; color: string } => {
    if (pw.length === 0) return { level: 0, label: "", color: "transparent" };
    if (pw.length < 6) return { level: 1, label: "Too short", color: "var(--severity-critical)" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { level: 2, label: "Weak", color: "var(--severity-high)" };
    if (score === 2) return { level: 3, label: "Fair", color: "var(--severity-medium)" };
    return { level: 4, label: "Strong", color: "var(--accent-mint)" };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { exists } = await checkEmailExists(email);
      if (exists) {
        router.replace(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent("Email already registered, please sign in.")}`);
        return;
      }
    } catch {
      // Fall back to Supabase sign-up error handling if the lookup is unavailable.
    }

    const { error: authError } = await signUp(email, password, fullName);
    setIsSubmitting(false);

    if (authError) {
      if (authError.toLowerCase().includes("already registered") || authError.toLowerCase().includes("user already exists")) {
        router.replace(`/login?email=${encodeURIComponent(email)}&message=${encodeURIComponent("Email already registered, please sign in.")}`);
        return;
      } else {
        setError(authError);
      }
    } else {
      setRegistrationComplete(true);
    }
  };

  // ── Success Screen ─────────────────────────────────────────────────────
  if (registrationComplete) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-scale-in" style={{ textAlign: "center" }}>
          {/* Logo */}
          <div className="flex flex-col items-center justify-center mb-6">
            <img src="/login-logo.png" alt="VeriDoc Logo" className="w-20 h-20 rounded-2xl shadow-xl border border-[var(--border)] mb-3" />
            <h1 className="text-2xl font-bold tracking-widest text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>VERIDOC</h1>
          </div>

          {/* Envelope Icon */}
          <div
            className="mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(0,201,167,0.15), rgba(0,229,255,0.1))",
              border: "1.5px solid rgba(0,201,167,0.25)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-mint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h2
            className="text-[22px] font-bold mb-2"
            style={{ fontFamily: "var(--font-heading), serif", color: "var(--text-primary)" }}
          >
            Check your email
          </h2>

          <p
            className="text-[14px] mb-2 leading-relaxed"
            style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body), system-ui, sans-serif" }}
          >
            We&apos;ve sent a confirmation link to
          </p>

          <p
            className="text-[15px] font-bold mb-6"
            style={{ color: "var(--accent-teal)", fontFamily: "var(--font-body), system-ui, sans-serif" }}
          >
            {email}
          </p>

          <p
            className="text-[13px] mb-8 leading-relaxed"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-body), system-ui, sans-serif" }}
          >
            Please click the link in the email to activate your account.
            <br />
            Check your spam folder if you don&apos;t see it.
          </p>

          <Link
            href="/login"
            className="auth-submit-btn inline-flex"
            style={{ textDecoration: "none" }}
          >
            <span>Back to Login</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-scale-in">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <img src="/login-logo.png" alt="VeriDoc Logo" className="w-20 h-20 rounded-2xl shadow-xl border border-[var(--border)] mb-3" />
          <h1 className="text-2xl font-bold tracking-widest text-text-primary" style={{ fontFamily: "var(--font-heading)" }}>VERIDOC</h1>
        </div>

        {/* Header Badge */}
        <div className="auth-header-badge">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-mint)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          <span>Create Account</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name Field */}
          <div className="auth-field-group">
            <label className="auth-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Full Name
              <span className="auth-optional">(optional)</span>
            </label>
            <div className="auth-input-wrapper">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="register-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="auth-input"
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="auth-field-group">
            <label className="auth-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Email
            </label>
            <div className="auth-input-wrapper">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="auth-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="auth-field-group">
            <label className="auth-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Password
            </label>
            <div className="auth-input-wrapper">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="auth-input"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="auth-password-strength animate-slide-up-fade">
                <div className="auth-strength-bar-track">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="auth-strength-bar-segment"
                      style={{
                        background: i <= passwordStrength.level ? passwordStrength.color : "var(--border)",
                      }}
                    />
                  ))}
                </div>
                <span className="auth-strength-label" style={{ color: passwordStrength.color }}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="auth-field-group">
            <label className="auth-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Confirm Password
            </label>
            <div className="auth-input-wrapper">
              <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="auth-input"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-eye-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="auth-field-error animate-slide-up-fade">Passwords do not match</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="auth-error animate-slide-up-fade">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {/* Create Account Button */}
          <button
            id="register-submit"
            type="submit"
            disabled={isSubmitting}
            className="auth-submit-btn"
          >
            <span>{isSubmitting ? "Creating account..." : "Create Account"}</span>
            {!isSubmitting && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
            {isSubmitting && (
              <div className="auth-spinner" />
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Login Link */}
        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link href="/login" className="auth-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
