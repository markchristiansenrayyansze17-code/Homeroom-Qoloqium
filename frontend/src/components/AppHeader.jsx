import { Home, LogOut, Languages } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { PuaKumbuStrip } from "./SarawakMotifs";

const LOGO = "/mrsm-logo.png";

export function AppHeader() {
  const nav = useNavigate();
  const loc = useLocation();
  const { user, lang, logout, toggleLang } = useAuth();
  const onHome = () => nav("/dashboard");
  const onLogout = () => { logout(); nav("/"); };
  const showControls = !!user && loc.pathname !== "/";

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {showControls && (
            <>
              <Button
                data-testid="nav-home-btn"
                variant="ghost"
                size="icon"
                onClick={onHome}
                aria-label="Home"
                className="rounded-full h-10 w-10"
              >
                <Home className="h-5 w-5 text-[#B91C1C]" />
              </Button>
              <Button
                data-testid="nav-logout-btn"
                variant="ghost"
                size="icon"
                onClick={onLogout}
                aria-label="Logout"
                className="rounded-full h-10 w-10"
              >
                <LogOut className="h-5 w-5 text-neutral-700" />
              </Button>
            </>
          )}
          <div className="hidden sm:flex flex-col">
            <span className="font-heading font-extrabold text-lg leading-none tracking-tight text-neutral-900">
              DocAtt
            </span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              MRSM Kuching
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <Badge
              data-testid="user-badge"
              variant="outline"
              className="hidden md:inline-flex border-[#B91C1C]/30 text-[#B91C1C] font-medium"
            >
              {user.role.toUpperCase()} · {user.name}
            </Badge>
          )}
          <button
            data-testid="lang-toggle-btn"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "en" ? "EN / BM" : "BM / EN"}
          </button>
          <img
            src={LOGO}
            alt="MRSM Kuching Logo"
            data-testid="mrsm-logo"
            className="h-11 w-11 object-contain"
          />
        </div>
      </div>
      <PuaKumbuStrip height={8} />
    </header>
  );
}
