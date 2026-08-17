import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { t } from "../lib/i18n";
import { AppHeader } from "../components/AppHeader";
import { BookOpenCheck, Trophy, GraduationCap, ClipboardList, ArrowUpRight } from "lucide-react";

function Tile({ id, title, desc, icon: Icon, onClick, accent }) {
  return (
    <button
      data-testid={id}
      onClick={onClick}
      className={`tile-hover group relative text-left rounded-2xl border border-neutral-200 bg-white p-7 md:p-9 min-h-[220px] flex flex-col justify-between overflow-hidden`}
    >
      <div className={`absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10 ${accent}`} />
      <div className="relative flex items-start justify-between">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accent} bg-opacity-10`}>
          <Icon className="h-6 w-6" style={{ color: "#C8102E" }} />
        </div>
        <ArrowUpRight className="h-5 w-5 text-neutral-400 group-hover:text-[#C8102E] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
      </div>
      <div className="relative">
        <h3 className="font-heading text-2xl md:text-3xl font-bold text-neutral-900">{title}</h3>
        <p className="mt-2 text-sm md:text-base text-neutral-600 leading-relaxed">{desc}</p>
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
          <p className="text-xs uppercase tracking-[0.22em] text-[#C8102E] font-semibold">
            {t(lang, "welcome")}, {user.name}
          </p>
          <h1 className="mt-3 font-heading text-4xl md:text-5xl font-extrabold text-neutral-900 leading-tight">
            {user.role === "admin"
              ? t(lang, "admin_panel")
              : user.homeroom}
          </h1>
          {user.form && (
            <p className="mt-2 text-neutral-600 text-lg">
              {user.form} · {user.role.toUpperCase()}
            </p>
          )}
        </div>

        <div className="mt-10 md:mt-14 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 stagger">
          <Tile
            id="tile-module-master"
            title={t(lang, "module_master")}
            desc={t(lang, "module_master_desc")}
            icon={BookOpenCheck}
            accent="bg-[#C8102E]"
            onClick={() => nav("/module-master")}
          />
          <Tile
            id="tile-cotw"
            title={t(lang, "cotw")}
            desc={t(lang, "cotw_desc")}
            icon={Trophy}
            accent="bg-[#FFC72C]"
            onClick={() => nav("/cotw")}
          />
          <Tile
            id="tile-edustation"
            title={t(lang, "edustation")}
            desc={t(lang, "edustation_desc")}
            icon={GraduationCap}
            accent="bg-neutral-900"
            onClick={() => nav("/edustation")}
          />
          <Tile
            id="tile-homeroom-arena"
            title={t(lang, "homeroom_arena")}
            desc={t(lang, "homeroom_arena_desc")}
            icon={ClipboardList}
            accent="bg-[#C8102E]"
            onClick={() => nav("/homeroom-arena")}
          />
        </div>

        {user.role === "admin" && (
          <div className="mt-10">
            <button
              data-testid="admin-panel-btn"
              onClick={() => nav("/admin")}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-neutral-900 text-white font-semibold text-sm hover:bg-neutral-800"
            >
              {t(lang, "admin_panel")}
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <p className="mt-16 text-center text-[10px] uppercase tracking-[0.35em] text-neutral-400">
          {t(lang, "motto")}
        </p>
      </main>
    </div>
  );
}
