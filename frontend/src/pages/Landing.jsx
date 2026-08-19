import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BookOpenCheck, Trophy, GraduationCap, ClipboardList, ChevronLeft, ChevronRight, LogIn, Languages, Image as ImageIcon, Newspaper, Sparkles, TrendingUp } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const LOGO = "/mrsm-logo.png";

const dict = {
  en: { home: "Home", info: "About MRSM", academic: "Academic", students: "Students", cocurriculum: "Co-Curriculum",
        login: "Log In", latest_news: "Latest News", facts: "Interesting Facts · MRSM Kuching",
        keistimewaan: "Uniqueness of MRSM", gallery: "Gallery", view_all: "View All", homeroom_c: "Homeroom",
        activity: "Activity", motto: "BERDISIPLIN · BERILMU · BERAMAL", school_motto: "MRSM KUCHING NO1",
        no_news: "No news yet", students_count: "Students", teachers_count: "Teachers", homerooms_count: "Homerooms", modules_count: "Modules" },
  bm: { home: "Utama", info: "Info MRSM", academic: "Akademik", students: "Pelajar", cocurriculum: "Kokurikulum",
        login: "Log Masuk", latest_news: "Berita Terkini", facts: "Fakta Menarik · MRSM Kuching",
        keistimewaan: "Keistimewaan MRSM", gallery: "Galeri", view_all: "Lihat Semua", homeroom_c: "Homeroom",
        activity: "Aktiviti", motto: "BERDISIPLIN · BERILMU · BERAMAL", school_motto: "MRSM KUCHING NO1",
        no_news: "Tiada berita lagi", students_count: "Pelajar", teachers_count: "Guru", homerooms_count: "Homeroom", modules_count: "Modul" },
};
const t = (l, k) => (dict[l] && dict[l][k]) || dict.en[k] || k;

const QUICK_ICONS = [
  { key: "module_master", label_en: "Module Master", label_bm: "Module Master", icon: BookOpenCheck, color: "#B91C1C" },
  { key: "cotw",          label_en: "Champion of the Week", label_bm: "Juara Minggu",  icon: Trophy,        color: "#F59E0B" },
  { key: "edustation",    label_en: "Edustation", label_bm: "Edustation",           icon: GraduationCap, color: "#0D9488" },
  { key: "homeroom_arena",label_en: "Homeroom Arena", label_bm: "Homeroom Arena",   icon: ClipboardList, color: "#EA580C" },
];

export default function Landing() {
  const nav = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("da_lang") || "en");
  const toggleLang = () => { const n = lang === "en" ? "bm" : "en"; localStorage.setItem("da_lang", n); setLang(n); };
  const [data, setData] = useState({ banners: [], news: [], stats: [], uniqueness: [], settings: { news_columns: 3, show_keistimewaan: true }, live: {} });
  const [gallery, setGallery] = useState([]);
  const [galTab, setGalTab] = useState("all");
  const [bIdx, setBIdx] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [{ data: d }, { data: g }] = await Promise.all([
          axios.get(`${API}/public/landing`),
          axios.get(`${API}/public/gallery?category=all`),
        ]);
        setData(d); setGallery(g);
      } catch (e) { console.error(e); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: g } = await axios.get(`${API}/public/gallery?category=${galTab}`);
        setGallery(g);
      } catch (e) {}
    })();
  }, [galTab]);

  // Auto-rotate banner
  useEffect(() => {
    if (!data.banners || data.banners.length <= 1) return;
    const t = setInterval(() => setBIdx(i => (i + 1) % data.banners.length), 5000);
    return () => clearInterval(t);
  }, [data.banners]);

  const goLogin = () => nav("/login");

  const allStats = useMemo(() => {
    const live = data.live || {};
    const defaults = [
      { id: "d1", label: t(lang, "students_count"), value: String(live.students ?? 0), description: "" },
      { id: "d2", label: t(lang, "teachers_count"), value: String(live.teachers ?? 0), description: "" },
      { id: "d3", label: t(lang, "homerooms_count"), value: String(live.homerooms ?? 0), description: "" },
      { id: "d4", label: t(lang, "modules_count"),  value: String(live.modules ?? 0),  description: "" },
    ];
    return [...defaults, ...(data.stats || [])];
  }, [data, lang]);

  return (
    <div className="min-h-screen">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="MRSM" className="h-11 w-11" />
            <div>
              <div className="font-heading font-extrabold text-lg leading-none">DocAtt</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">MRSM Kuching · {t(lang, "school_motto")}</div>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            {QUICK_ICONS.map(qi => (
              <button
                key={qi.key}
                data-testid={`nav-${qi.key}`}
                onClick={goLogin}
                title={lang === "bm" ? qi.label_bm : qi.label_en}
                className="group h-11 w-11 rounded-full flex items-center justify-center hover:scale-110 transition-transform border-2"
                style={{ borderColor: qi.color + "40", background: qi.color + "12" }}
              >
                <qi.icon className="h-5 w-5" style={{ color: qi.color }} />
              </button>
            ))}
            <button data-testid="lang-toggle" onClick={toggleLang}
                    className="ml-1 md:ml-2 inline-flex items-center gap-1 h-9 px-3 rounded-full bg-neutral-900 text-white text-xs font-semibold">
              <Languages className="h-3.5 w-3.5" /> {lang === "en" ? "EN/BM" : "BM/EN"}
            </button>
            <button data-testid="landing-login-btn" onClick={goLogin}
                    className="ml-1 md:ml-2 inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-white text-sm font-semibold"
                    style={{ background: "linear-gradient(135deg,#B91C1C 0%,#EA580C 100%)" }}>
              <LogIn className="h-4 w-4" /> {t(lang, "login")}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner Carousel */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8">
          <div className="relative rounded-3xl overflow-hidden border-2 border-neutral-200 bg-neutral-100 aspect-[21/9] shadow-xl">
            {(data.banners || []).length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white"
                   style={{ background: "linear-gradient(135deg,#B91C1C 0%,#DC2626 40%,#EA580C 100%)" }}>
                <Sparkles className="h-16 w-16 text-yellow-300" />
                <h1 className="mt-4 font-heading text-4xl md:text-6xl font-extrabold">DocAtt · MRSM Kuching</h1>
                <p className="mt-2 text-white/90 tracking-widest text-xs md:text-sm">{t(lang, "school_motto")}</p>
              </div>
            )}
            {(data.banners || []).map((b, i) => (
              <div key={b.id} className="absolute inset-0 transition-opacity duration-1000"
                   style={{ opacity: i === bIdx ? 1 : 0, pointerEvents: i === bIdx ? "auto" : "none" }}>
                {b.image && <img src={b.image} alt={b.title} className="w-full h-full object-cover" />}
                {(b.title || b.description) && (
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 text-white bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                    <h2 className="font-heading text-2xl md:text-4xl font-extrabold">{b.title}</h2>
                    {b.description && <p className="mt-1 text-sm md:text-base text-white/85 max-w-2xl">{b.description}</p>}
                  </div>
                )}
              </div>
            ))}
            {data.banners.length > 1 && (
              <>
                <button data-testid="banner-prev" onClick={() => setBIdx(i => (i - 1 + data.banners.length) % data.banners.length)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow-lg">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button data-testid="banner-next" onClick={() => setBIdx(i => (i + 1) % data.banners.length)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/85 hover:bg-white flex items-center justify-center shadow-lg">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {data.banners.map((_, i) => (
                    <button key={i} onClick={() => setBIdx(i)}
                            className={`h-2 rounded-full transition-all ${i === bIdx ? "w-8 bg-white" : "w-2 bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Berita Terkini */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <SectionHeading icon={Newspaper} title={t(lang, "latest_news")} accent="#B91C1C" />
        <div className={`mt-8 grid gap-5 ${data.settings.news_columns === 6 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-6" : "grid-cols-1 md:grid-cols-3"}`}>
          {(data.news || []).length === 0 && (
            <div className="col-span-full text-center text-neutral-500 py-12">{t(lang, "no_news")}</div>
          )}
          {(data.news || []).map(n => (
            <a key={n.id} data-testid={`news-${n.id}`} href={n.link || "#"} target={n.link ? "_blank" : "_self"} rel="noreferrer"
               className="group rounded-2xl overflow-hidden border border-neutral-200 bg-white hover:shadow-xl hover:border-red-300 transition">
              {n.image && <img src={n.image} alt={n.title} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" />}
              {(n.title || n.description) && (
                <div className="p-3">
                  <h3 className="font-heading font-bold text-sm line-clamp-2">{n.title}</h3>
                  {n.description && <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{n.description}</p>}
                </div>
              )}
            </a>
          ))}
        </div>
      </section>

      {/* Statistics */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <SectionHeading icon={TrendingUp} title={t(lang, "facts")} accent="#0D9488" />
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-5">
          {allStats.map((s, i) => {
            const colors = ["#F59E0B", "#0D9488", "#B91C1C", "#7C3AED", "#EA580C", "#059669"];
            const c = colors[i % colors.length];
            return (
              <div key={s.id} data-testid={`stat-${s.id}`} className="text-center rounded-2xl border border-neutral-200 bg-white p-6">
                <div className="mx-auto h-24 w-24 rounded-full flex items-center justify-center font-heading font-extrabold text-3xl"
                     style={{ border: `4px solid ${c}`, color: c }}>{s.value}</div>
                <p className="mt-4 inline-block px-3 py-1 rounded-full text-white text-xs font-bold" style={{ background: c }}>{s.label}</p>
                {s.description && <p className="mt-2 text-xs text-neutral-500">{s.description}</p>}
              </div>
            );
          })}
        </div>
      </section>

      {/* Keistimewaan */}
      {data.settings.show_keistimewaan && (data.uniqueness || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
          <SectionHeading icon={Sparkles} title={t(lang, "keistimewaan")} accent="#EA580C" />
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(data.uniqueness || []).map((u, i) => {
              const colors = ["#F59E0B", "#84CC16", "#B91C1C", "#0D9488", "#7C3AED", "#EA580C"];
              const c = colors[i % colors.length];
              return (
                <div key={u.id} data-testid={`uniq-${u.id}`} className="rounded-2xl overflow-hidden bg-white border border-neutral-200 hover:shadow-lg transition relative">
                  {u.image && <img src={u.image} alt="" className="w-full aspect-video object-cover" />}
                  <div className="absolute top-3 left-3 h-8 w-8 rounded-full flex items-center justify-center font-heading font-extrabold text-white text-xs" style={{ background: c }}>#{i + 1}</div>
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-lg" style={{ color: c }}>{u.title}</h3>
                    <p className="mt-1 text-sm text-neutral-600 line-clamp-4">{u.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gallery */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
        <SectionHeading icon={ImageIcon} title={t(lang, "gallery")} accent="#7C3AED" />
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          {[
            { k: "all", label: t(lang, "view_all") },
            { k: "homeroom", label: t(lang, "homeroom_c") },
            { k: "activity", label: t(lang, "activity") },
          ].map(tab => (
            <button key={tab.k} data-testid={`gal-tab-${tab.k}`} onClick={() => setGalTab(tab.k)}
                    className={`h-10 px-5 rounded-full text-sm font-semibold transition ${galTab === tab.k ? "text-white shadow-lg" : "bg-white border-2 border-neutral-200 text-neutral-700 hover:border-red-300"}`}
                    style={galTab === tab.k ? { background: "linear-gradient(135deg,#B91C1C 0%,#EA580C 100%)" } : {}}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {gallery.length === 0 && <p className="col-span-full text-center text-neutral-500 py-10">—</p>}
          {gallery.slice(0, 16).map((g, i) => (
            <div key={`${g.id}-${i}`} className="rounded-xl overflow-hidden bg-white border border-neutral-200 hover:shadow-lg transition group">
              <img src={g.image} alt="" className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="p-2 text-[10px] text-neutral-500 flex items-center justify-between">
                <span>{g.homeroom}</span>
                <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: g.category === "activity" ? "#7C3AED" : "#B91C1C" }}>{g.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white/60 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
          <img src={LOGO} alt="MRSM" className="h-12 w-12 mx-auto" />
          <p className="mt-3 font-heading font-extrabold text-lg">DocAtt · MRSM Kuching</p>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-neutral-500">{t(lang, "motto")}</p>
          <p className="mt-3 text-[10px] uppercase tracking-widest font-bold text-[#B91C1C]">{t(lang, "school_motto")}</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, accent }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="h-px w-16 bg-neutral-300" />
      <div className="h-2 w-2 rounded-full" style={{ background: accent }} />
      <div className="flex items-center gap-2">
        <Icon className="h-6 w-6" style={{ color: accent }} />
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold" style={{ color: accent }}>{title}</h2>
      </div>
      <div className="h-2 w-2 rounded-full" style={{ background: accent }} />
      <div className="h-px w-16 bg-neutral-300" />
    </div>
  );
}
