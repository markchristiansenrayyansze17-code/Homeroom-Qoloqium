import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";
import { AppHeader } from "../components/AppHeader";
import { BookOpenCheck, Trophy, GraduationCap, ClipboardList, ArrowUpRight, Image as ImageIcon, Library } from "lucide-react";

/**
 * Each tile has its own vibrant palette to lift the mood without breaking brand.
 * Colors are used both as icon fill and as a soft aura circle behind the icon.
 */
const TILES = [
  {
    id: "tile-module-master",
    key: "module_master",
    desc_key: "module_master_desc",
    icon: BookOpenCheck,
    route: "/module-master",
    // Sarawak Red
    gradient: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
    aura: "#DC2626",
    text: "#B91C1C",
  },
  {
    id: "tile-cotw",
    key: "cotw",
    desc_key: "cotw_desc",
    icon: Trophy,
    route: "/cotw",
    // Sarawak Gold → Amber
    gradient: "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
    aura: "#F59E0B",
    text: "#B45309",
  },
  {
    id: "tile-edustation",
    key: "edustation",
    desc_key: "edustation_desc",
    icon: GraduationCap,
    route: "/edustation",
    // Rainforest Teal
    gradient: "linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)",
    aura: "#14B8A6",
    text: "#0F766E",
  },
  {
    id: "tile-homeroom-arena",
    key: "homeroom_arena",
    desc_key: "homeroom_arena_desc",
    icon: ClipboardList,
    route: "/homeroom-arena",
    // Hornbill Orange
    gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    aura: "#F97316",
    text: "#C2410C",
  },
];

function Tile({ tile, title, desc, onClick }) {
  const Icon = tile.icon;
  return (
    <button
      data-testid={tile.id}
      onClick={onClick}
      className="tile-hover group relative text-left rounded-2xl border border-neutral-200 bg-white p-7 md:p-9 min-h-[220px] flex flex-col justify-between overflow-hidden"
    >
      <div
        className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-20 blur-md"
        style={{ background: tile.aura }}
      />
      <div className="relative flex items-start justify-between">
        <div
          className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: tile.gradient, boxShadow: `0 8px 20px -8px ${tile.aura}80` }}
        >
          <Icon className="h-7 w-7 text-white" strokeWidth={2.25} />
        </div>
        <ArrowUpRight className="h-5 w-5 text-neutral-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
          style={{ color: tile.text, opacity: 0.6 }} />
      </div>
      <div className="relative">
        <h3 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">{title}</h3>
        <p className="mt-2 text-sm md:text-base text-neutral-600 leading-relaxed">{desc}</p>
        <div className="mt-4 h-1 w-14 rounded-full" style={{ background: tile.gradient }} />
      </div>
    </button>
  );
}

export default function Dashboard() {
  const { user, lang } = useAuth();
  const nav = useNavigate();
  if (!user) { nav("/"); return null; }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="animate-fade-up">
          <p className="text-xs uppercase tracking-[0.22em] font-semibold" style={{color: "#B91C1C"}}>
            {t(lang, "welcome")}, {user.name}
          </p>
          <h1 className="mt-3 font-heading text-4xl md:text-5xl font-extrabold text-neutral-900 leading-tight">
            {user.role === "admin" ? t(lang, "admin_panel") : user.homeroom}
          </h1>
          {user.form && (
            <p className="mt-2 text-neutral-600 text-lg">
              {user.form} · {user.role.toUpperCase()}
            </p>
          )}
        </div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 stagger">
          {TILES.map(tile => (
            <Tile
              key={tile.id}
              tile={tile}
              title={t(lang, tile.key)}
              desc={t(lang, tile.desc_key)}
              onClick={() => nav(tile.route)}
            />
          ))}
        </div>

        {user.role === "admin" && (
          <div className="mt-10">
            <button
              data-testid="admin-panel-btn"
              onClick={() => nav("/admin")}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-white font-semibold text-sm shadow-lg hover:opacity-95 transition"
              style={{background: "linear-gradient(135deg, #B91C1C 0%, #EA580C 100%)"}}
            >
              {t(lang, "admin_panel")}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Quick nav pills for Gallery + Library */}
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            data-testid="quicknav-library"
            onClick={() => nav("/module-library")}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white border-2 border-neutral-200 hover:border-red-500 text-sm font-semibold text-neutral-800 transition shadow-sm"
          >
            <Library className="h-4 w-4 text-[#B91C1C]" /> {t(lang, "module_library")}
          </button>
          <button
            data-testid="quicknav-gallery"
            onClick={() => nav("/gallery")}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-white border-2 border-neutral-200 hover:border-teal-500 text-sm font-semibold text-neutral-800 transition shadow-sm"
          >
            <ImageIcon className="h-4 w-4 text-[#0D9488]" /> {t(lang, "gallery")}
          </button>
        </div>

        <p className="mt-16 text-center text-[10px] uppercase tracking-[0.35em] text-neutral-400">
          <span className="font-heading font-bold text-[#B91C1C]">{t(lang, "school_motto")}</span>
          <span className="mx-3 text-neutral-300">·</span>
          {t(lang, "motto")}
        </p>
      </main>
    </div>
  );
}
