import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Search,
  Layers,
  BarChart3,
  AlertCircle,
  Building2,
} from "lucide-react";
import useStore from "../../store/useStore";
import { authAPI } from "../../lib/api";

function MicrosoftLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 21 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export default function LoginScreen() {
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [customSso, setCustomSso] = useState<{
    providerId: string;
    providerType: string;
  } | null>(null);

  useEffect(() => {
    async function fetchSso() {
      try {
        const res = await authAPI.getPublicSSOConfig();
        if (res.data?.sso) {
          setCustomSso(res.data.sso);
        }
      } catch {
        // Ignore — SSO config is optional
      }
    }
    fetchSso();
  }, []);

  useEffect(() => {
    const ssoError = searchParams.get("error");
    if (ssoError === "sso_failed") {
      setError(
        "SSO sign-in failed. Please try again or contact your administrator.",
      );
    } else if (ssoError === "sso_not_configured") {
      setError(
        "SSO is not configured on this server. Please contact your administrator.",
      );
    } else if (ssoError === "sso_unauthorized") {
      setError(
        "You are not authorized to use Microsoft SSO. Super Admin accounts must use direct login.",
      );
    } else if (ssoError === "sso_superadmin_blocked") {
      setError(
        "Super Admin accounts cannot authenticate via SSO. Please use the email and password form.",
      );
    }
  }, [searchParams]);

  async function doSuperAdminLogin() {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await authAPI.login(email, password);
      const userData = res.data?.user || { email, name: email.split("@")[0] };
      login(userData);
      if (!userData.mfaEnabled || userData.mfaVerified) {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.[0]?.message ||
        "Login failed.";

      if (
        msg.includes("Direct login is restricted") ||
        msg === "DIRECT_LOGIN_NOT_ALLOWED"
      ) {
        setError(
          "Direct login is only available for Super Admin. If you are not a Super Admin, please use your organization's SSO.",
        );
      } else if (msg === "SSO_ACCOUNT_NO_PASSWORD") {
        setError(
          "This account uses SSO authentication. Please use the SSO button above.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function doMicrosoftLogin() {
    window.location.href = "/api/auth/microsoft";
  }

  function doCustomSsoLogin() {
    window.location.href = "/api/auth/sso/login";
  }

  const getSsoButtonStyle = () => {
    if (!customSso) return { bg: "", text: "Continue with SSO" };
    switch (customSso.providerId) {
      case "okta":
        return {
          bg: "bg-[#007DC1] hover:bg-[#005a8c]",
          text: "Continue with Okta",
        };
      case "auth0":
        return {
          bg: "bg-[#EB5424] hover:bg-[#c4451c]",
          text: "Continue with Auth0",
        };
      case "google":
        return {
          bg: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
          text: "Continue with Google Workspace",
        };
      case "ping":
        return {
          bg: "bg-[#293238] hover:bg-[#1a2024]",
          text: "Continue with PingFederate",
        };
      case "keycloak":
        return {
          bg: "bg-[#0089C9] hover:bg-[#006e9f]",
          text: "Continue with Keycloak",
        };
      case "onelogin":
        return {
          bg: "bg-[#18315B] hover:bg-[#102240]",
          text: "Continue with OneLogin",
        };
      default:
        return {
          bg: "bg-slate-800 hover:bg-slate-900",
          text: "Continue with SSO",
        };
    }
  };

  return (
    <div className="min-h-screen lg:h-screen w-full flex flex-col lg:flex-row bg-white text-slate-800 font-body selection:bg-[#0062FF] selection:text-white lg:overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          LEFT SECTION (Scrollable if viewport is short, Pure White)
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[46%] xl:w-[42%] min-h-screen lg:h-screen lg:overflow-y-auto custom-scrollbar bg-white flex flex-col items-center px-6 sm:px-10 lg:px-14 py-8 sm:py-12">
        <div className="w-full max-w-[410px] my-auto">
          {/* Brand Header: Logo + Title + Subtitle */}
          <div className="flex items-center gap-3">
            <img
              src="/apnto-blue-icon.png"
              alt="Drisvia"
              className="w-8 h-8 object-contain drop-shadow-[0_2px_8px_rgba(0,100,255,0.35)]"
            />
            <div>
              <div className="text-[25px] font-bold text-slate-900 tracking-tight font-display leading-none">
                Drisvia
              </div>
              <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-[0.24em] mt-1">
                AI Agent Discovery
              </div>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div className="mt-8 mb-6">
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight font-display leading-tight">
              Sign in to your account
            </h1>
            <p className="text-[13.5px] text-slate-500 font-normal mt-2 leading-relaxed">
              Access your workspace to discover, classify and assess AI agents.
            </p>
          </div>

          {/* Microsoft Single Sign-On Button */}
          <button
            id="microsoft-sso-btn"
            type="button"
            onClick={doMicrosoftLogin}
            className="w-full bg-white hover:bg-slate-50/90 active:bg-slate-100 border border-slate-200/90 rounded-xl py-3 px-4 flex items-center justify-center gap-3 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)] font-semibold text-[13.5px] text-slate-800 cursor-pointer"
          >
            <MicrosoftLogo />
            <span>Continue with Microsoft</span>
          </button>

          {/* Custom Configured SSO (if present on server) */}
          {customSso &&
            (() => {
              const style = getSsoButtonStyle();
              return (
                <button
                  id="custom-sso-btn"
                  type="button"
                  onClick={doCustomSsoLogin}
                  className={`w-full mt-3 flex items-center justify-center gap-3 ${style.bg} ${
                    style.bg.includes("text-slate-700") ? "" : "text-white"
                  } font-semibold py-3 px-4 rounded-xl transition-all shadow-sm text-[13.5px] cursor-pointer`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>{style.text}</span>
                </button>
              );
            })()}

          {/* OR Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-slate-200/80" />
            <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
              OR
            </span>
          </div>

          {/* Email & Password Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doSuperAdminLogin();
            }}
            className="space-y-4"
            autoComplete="off"
          >
            {/* Email Field */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <div className="flex items-center bg-[#EEF4FD] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-[#0062FF]/50 focus-within:bg-white focus-within:ring-3 focus-within:ring-[#0062FF]/15 transition-all">
                <Mail
                  className="w-4 h-4 text-slate-500 stroke-[1.8] mr-3 shrink-0"
                  aria-hidden="true"
                />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@agentradar.local"
                  required
                  autoComplete="off"
                  className="w-full bg-transparent text-[13.5px] text-slate-800 placeholder:text-slate-500/80 outline-none font-normal"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[13px] font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="flex items-center bg-[#EEF4FD] rounded-xl px-3.5 py-3 border border-transparent focus-within:border-[#0062FF]/50 focus-within:bg-white focus-within:ring-3 focus-within:ring-[#0062FF]/15 transition-all">
                <Lock
                  className="w-4 h-4 text-slate-500 stroke-[1.8] mr-3 shrink-0"
                  aria-hidden="true"
                />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="w-full bg-transparent text-[13.5px] text-slate-800 placeholder:text-slate-500/80 outline-none font-normal tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 ml-2 focus:outline-none shrink-0 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            {/* <div className="flex items-center justify-between pt-1 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="remember-me-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0062FF] border-slate-300 focus:ring-[#0062FF] accent-[#0062FF] cursor-pointer"
                />
                <span className="text-[13px] text-slate-700 font-normal">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setError(
                    "Please contact your organization administrator or super admin to reset credentials.",
                  );
                }}
                className="text-[13px] font-medium text-[#0062FF] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div> */}

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="super-admin-login-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-[#0062FF] hover:bg-[#0052D9] active:bg-[#0047BA] text-white font-semibold py-3.5 px-4 mt-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_8px_20px_rgba(0,98,255,0.32)] hover:shadow-[0_10px_24px_rgba(0,98,255,0.42)] disabled:opacity-70 text-[14px] cursor-pointer"
            >
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </>
              )}
            </button>
          </form>

          {/* Footer: Don't have an account? Contact your admin. */}
          {/* <div className="text-[13px] text-slate-500 text-center mt-7">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setError(
                  "Please contact your organization administrator to request an account.",
                );
              }}
              className="text-[#0062FF] font-semibold hover:underline cursor-pointer"
            >
              Contact your admin.
            </button>
          </div> */}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT HERO SECTION (Fixed & Sticky - Does Not Scroll)
      ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-[54%] xl:w-[58%] min-h-[560px] lg:h-screen lg:sticky lg:top-0 bg-[#011438] overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-16 select-none shrink-0">
        {/* Dynamic Deep Space Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_48%,_#0948c2_0%,_#02236a_38%,_#011238_70%,_#010c26_100%)] pointer-events-none" />

        {/* Ambient Radial Electric Blue & Cyan Core Glow */}
        <div className="absolute top-1/2 left-[65%] -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-[#0062FF]/25 blur-[120px] pointer-events-none" />
        <div className="absolute top-[35%] left-[75%] -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full bg-[#38BDF8]/20 blur-[90px] pointer-events-none" />

        {/* Subtle Cyber Isometric Grid Lines */}
        <div
          className="absolute inset-0 opacity-[0.14] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(56, 189, 248, 0.25) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(56, 189, 248, 0.25) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse at 60% 50%, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 60% 50%, black 20%, transparent 75%)",
          }}
        />

        {/* 3D Isometric Constellation Illustration (Clean, Right Aligned) */}
        <div className="absolute right-0 top-0 bottom-0  w-[54%] pointer-events-none hidden md:flex items-center justify-end overflow-hidden">
          <img
            src="/login-3d-network@2x.png"
            alt="Drisvia AI Agent Discovery Ecosystem"
            className="w-auto h-full max-h-[820px] object-contain object-right"
          />
        </div>

        {/* TOP BRAND HEADER (Hero Side) */}
        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/apnto-white-favicon.png"
            alt="Drisvia"
            className="w-8 h-8 object-contain drop-shadow-[0_2px_12px_rgba(0,100,255,0.45)]"
          />
          <div>
            <div className="text-white text-[26px] font-bold tracking-tight leading-none font-display">
              Drisvia
            </div>
            <div className="text-[10.5px] uppercase font-semibold text-[#8EB8F8] tracking-[0.28em] mt-1.5">
              AI Agent Discovery
            </div>
          </div>
        </div>

        {/* MIDDLE CONTENT: Headline & Description (Constrained width so it doesn't overlap 3D tiles) */}
        <div className="relative z-10 max-w-[390px] lg:max-w-[420px] my-auto py-8 lg:py-12">
          <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-black text-white leading-[1.1] tracking-tight font-display">
            Discover <span className="text-[#2589FE]">Shadow</span> <br />
            AI agents. <br />
            Stay <span className="text-[#2589FE]">ahead.</span>
          </h2>
          <p className="mt-4 text-[14.5px] sm:text-[15px] text-[#A6C4EE] leading-relaxed font-normal">
            Discover, classify and assess AI agents across your cloud, endpoints
            and enterprise tools - with the visibility you need.
          </p>
        </div>

        {/* BOTTOM FEATURE CARDS (Discover, Classify, Assess) */}
        <div className="relative z-10 max-w-[390px] lg:max-w-[420px] space-y-3.5 pt-2">
          {/* Feature 1: Discover */}
          <div className="flex items-start gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-[#092257]/80 backdrop-blur-md border border-[#1C489C]/80 flex items-center justify-center shrink-0 shadow-md group-hover:border-[#38BDF8]/60 transition-colors">
              <Search className="w-5 h-5 text-[#38BDF8]" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-white font-bold text-[14px] leading-snug">
                Discover
              </div>
              <div className="text-[#8AA7CE] text-[12px] leading-relaxed mt-0.5">
                Find AI agents across cloud, endpoints and enterprise apps.
              </div>
            </div>
          </div>

          {/* Feature 2: Classify */}
          <div className="flex items-start gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-[#092257]/80 backdrop-blur-md border border-[#1C489C]/80 flex items-center justify-center shrink-0 shadow-md group-hover:border-[#818CF8]/60 transition-colors">
              <Layers className="w-5 h-5 text-[#818CF8]" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-white font-bold text-[14px] leading-snug">
                Classify
              </div>
              <div className="text-[#8AA7CE] text-[12px] leading-relaxed mt-0.5">
                Identify approved and shadow agents to understand exposure.
              </div>
            </div>
          </div>

          {/* Feature 3: Assess */}
          <div className="flex items-start gap-3.5 group">
            <div className="w-11 h-11 rounded-xl bg-[#092257]/80 backdrop-blur-md border border-[#1C489C]/80 flex items-center justify-center shrink-0 shadow-md group-hover:border-[#2DD4BF]/60 transition-colors">
              <BarChart3 className="w-5 h-5 text-[#2DD4BF]" strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-white font-bold text-[14px] leading-snug">
                Assess
              </div>
              <div className="text-[#8AA7CE] text-[12px] leading-relaxed mt-0.5">
                Get insights into models, data access, usage and risk.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
