"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, AlertCircle, Moon, Sun, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/Logo";

const getDemoButtonClass = (user: "admin" | "technician") => {
  return user === "admin"
    ? "qc-login-demo-option qc-login-demo-option-admin"
    : "qc-login-demo-option qc-login-demo-option-tech";
};

const getDemoCredClass = (user: "admin" | "technician") => {
  return user === "admin" ? "qc-login-demo-cred-admin" : "qc-login-demo-cred-tech";
};

export default function LoginClient() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const { login, currentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    const success = login(username, password);
    if (!success) {
      setError("Invalid credentials. Please try again.");
    }
  };

  if (currentUser) {
    return null;
  }

  const fillDemo = (user: "admin" | "technician") => {
    if (user === "admin") {
      setUsername("admin");
      setPassword("admin123");
    } else {
      setUsername("Dr. smith");
      setPassword("password123");
    }
    setError("");
  };

  return (
    <div className="qc-login-page myc-pattern">
      <div className="qc-login-bg-layer">
        <div className="qc-login-bg-orb qc-login-bg-orb-red" style={{ animationDuration: "4s" }} />
        <div className="qc-login-bg-orb qc-login-bg-orb-gold" style={{ animationDuration: "5s" }} />
        <div className="qc-login-bg-orb qc-login-bg-orb-blue" style={{ animationDuration: "6s" }} />
      </div>

      <div className="qc-login-hearts-layer">
        <Heart className="qc-login-heart qc-login-heart-one" size={40} fill="currentColor" />
        <Heart className="qc-login-heart qc-login-heart-two" size={60} fill="currentColor" />
        <Heart className="qc-login-heart qc-login-heart-three" size={30} fill="currentColor" />
      </div>

      <button onClick={toggleTheme} className="qc-login-theme-toggle">
        {theme === "light" ? (
          <Moon className="qc-login-theme-icon" size={20} />
        ) : (
          <Sun className="qc-login-theme-icon" size={20} />
        )}
      </button>

      <div className="qc-login-shell">
        <div className="qc-login-branding">
          <div className="qc-login-logo-wrap">
            <div className="qc-login-logo-glow" />
            <Logo className="qc-login-logo" />
          </div>
          <h1 className="qc-login-title">Laboratory Quality Control</h1>
          <p className="qc-login-subtitle">Aswan Branch - QC Management System</p>

          <div className="qc-login-header-accent" />
        </div>

        <div className="group qc-main-card qc-login-card">
          <div className="qc-login-card-corner" />

          <h2 className="qc-login-card-title">Welcome Back</h2>

          {error && (
            <div className="qc-login-error-box">
              <AlertCircle size={20} className="qc-login-error-icon" />
              <p className="qc-login-error-text">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="qc-login-form">
            <div className="qc-login-field-group">
              <label htmlFor="username" className="qc-login-field-label">
                Username
              </label>
              <div className="qc-login-input-wrap">
                <div className="qc-login-input-icon-wrap">
                  <User size={20} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="qc-login-input"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="qc-login-field-group">
              <label htmlFor="password" className="qc-login-field-label">
                Password
              </label>
              <div className="qc-login-input-wrap">
                <div className="qc-login-input-icon-wrap">
                  <Lock size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="qc-login-input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="qc-login-submit">
              <Lock className="qc-login-submit-icon" size={18} />
              Sign In to MYGHC Lab
            </button>
          </form>

          <div className="qc-login-demo-section">
            <button onClick={() => setShowDemoAccounts(!showDemoAccounts)} className="qc-login-demo-toggle">
              {showDemoAccounts ? "Hide" : "Show"} Demo Accounts
            </button>

            {showDemoAccounts && (
              <div className="qc-login-demo-panel">
                <div className="qc-login-demo-hint">Click to auto-fill credentials</div>
                <button onClick={() => fillDemo("admin")} className={getDemoButtonClass("admin")}>
                  <div className="qc-login-demo-title">Administrator</div>
                  <div className="qc-login-demo-details">
                    Username: <span className={getDemoCredClass("admin")}>admin</span> • Password: <span className={getDemoCredClass("admin")}>admin123</span>
                  </div>
                </button>
                <button onClick={() => fillDemo("technician")} className={getDemoButtonClass("technician")}>
                  <div className="qc-login-demo-title">Technician Demo</div>
                  <div className="qc-login-demo-details">
                    Username: <span className={getDemoCredClass("technician")}>Dr. smith</span> • Password: <span className={getDemoCredClass("technician")}>password123</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="qc-login-footer">
          <p>© 2025 Magdi Yacoub Heart Center • Aswan Branch</p>
          <p className="qc-login-footer-highlight">Laboratory Quality Control System</p>
        </div>
      </div>
    </div>
  );
}