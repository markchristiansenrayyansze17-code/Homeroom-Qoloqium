import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../lib/auth";
import { http, fileToBase64 } from "../lib/api";
import { t } from "../lib/i18n";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Trophy, ArrowLeft, Plus, Trash2, Save, Medal } from "lucide-react";

const RANK_STYLE = {
  1: { bg: "bg-[#FFC72C]", text: "text-neutral-900", label: "1st" },
  2: { bg: "bg-neutral-300", text: "text-neutral-900", label: "2nd" },
  3: { bg: "bg-[#1E3A5F]", text: "text-white", label: "3rd" },
};

export default function ChampionOfTheWeek() {
  const { user, lang } = useAuth();
  const nav = useNavigate();
  const isAdmin = user?.role === "admin";
  const [cfg, setCfg] = useState({ leaderboard: [], images: [] });

  const load = async () => {
    const { data } = await http.get("/cotw");
    setCfg({ leaderboard: data.leaderboard || [], images: data.images || [] });
  };
  useEffect(() => { if (user) load(); }, []);
  if (!user) { nav("/"); return null; }

  const save = async () => {
    try {
      await http.put("/cotw", cfg);
      toast.success(t(lang, "saved"));
      load();
    } catch (e) { toast.error(e?.response?.data?.detail || t(lang, "error")); }
  };

  const addRank = () => {
    const next = [...cfg.leaderboard];
    const nextRank = next.length + 1;
    if (nextRank > 3) return;
    next.push({ rank: nextRank, homeroom: "", activity: "" });
    setCfg({ ...cfg, leaderboard: next });
  };
  const updateRank = (i, k, v) => {
    const next = [...cfg.leaderboard]; next[i] = { ...next[i], [k]: v };
    setCfg({ ...cfg, leaderboard: next });
  };
  const removeRank = (i) => {
    const next = cfg.leaderboard.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, rank: idx + 1 }));
    setCfg({ ...cfg, leaderboard: next });
  };
  const addImage = async (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const b64 = await fileToBase64(f);
    const next = [...(cfg.images || []), { image: b64, label: "" }].slice(0, 3);
    setCfg({ ...cfg, images: next });
  };
  const updateImg = (i, k, v) => {
    const next = [...cfg.images]; next[i] = { ...next[i], [k]: v };
    setCfg({ ...cfg, images: next });
  };
  const removeImg = (i) => setCfg({ ...cfg, images: cfg.images.filter((_, idx) => idx !== i) });

  const sorted = [...cfg.leaderboard].sort((a, b) => a.rank - b.rank);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <button data-testid="back-dashboard-btn" onClick={() => nav("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#1E3A5F]">
          <ArrowLeft className="h-4 w-4" /> {t(lang, "back")}
        </button>

        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[#1E3A5F] font-semibold">02 · Weekly Highlights</p>
          <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold flex items-center gap-3">
            <Trophy className="h-10 w-10 text-[#FFC72C]" /> {t(lang, "cotw")}
          </h1>
        </div>

        {/* Leaderboard */}
        <section className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl font-bold">{t(lang, "leaderboard")}</h2>
            {isAdmin && sorted.length < 3 && (
              <Button data-testid="add-rank-btn" onClick={addRank} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" /> {t(lang, "add")}
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {sorted.map((r, i) => {
              const s = RANK_STYLE[r.rank] || RANK_STYLE[3];
              return (
                <Card key={i} data-testid={`rank-card-${r.rank}`}
                      className={`p-6 relative overflow-hidden border-neutral-200 ${r.rank === 1 ? "md:col-span-1 md:order-2" : r.rank === 2 ? "md:order-1" : "md:order-3"}`}>
                  <div className={`absolute top-0 left-0 right-0 h-1 ${s.bg}`} />
                  <div className={`w-14 h-14 rounded-full ${s.bg} ${s.text} flex items-center justify-center font-heading font-extrabold text-2xl`}>
                    {r.rank}
                  </div>
                  {isAdmin ? (
                    <div className="mt-4 space-y-2">
                      <Input data-testid={`rank-hr-${i}`} placeholder={t(lang, "homeroom")}
                             value={r.homeroom} onChange={e => updateRank(i, "homeroom", e.target.value)} />
                      <Input data-testid={`rank-act-${i}`} placeholder={t(lang, "activity")}
                             value={r.activity} onChange={e => updateRank(i, "activity", e.target.value)} />
                      <Button variant="ghost" size="sm" onClick={() => removeRank(i)}
                              className="text-red-600"><Trash2 className="h-4 w-4 mr-1" />{t(lang, "delete")}</Button>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="font-heading text-xl font-bold">{r.homeroom || "-"}</p>
                      <p className="text-sm text-neutral-600 mt-1">{r.activity}</p>
                    </div>
                  )}
                </Card>
              );
            })}
            {sorted.length === 0 && (
              <Card className="p-10 md:col-span-3 text-center text-neutral-500">{t(lang, "no_data")}</Card>
            )}
          </div>
        </section>

        {/* Images */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-2xl font-bold flex items-center gap-2"><Medal className="h-6 w-6" /> Gallery</h2>
            {isAdmin && (cfg.images || []).length < 3 && (
              <label className="inline-flex items-center gap-2 h-10 px-4 rounded-md border cursor-pointer hover:bg-neutral-50 text-sm font-medium">
                <Plus className="h-4 w-4" /> {t(lang, "upload_image")}
                <input data-testid="cotw-image-input" type="file" accept="image/*" className="hidden" onChange={addImage} />
              </label>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(cfg.images || []).map((im, i) => (
              <Card key={i} className="overflow-hidden border-neutral-200">
                <img src={im.image} alt="" className="w-full h-56 object-cover" />
                {isAdmin ? (
                  <div className="p-3 space-y-2">
                    <Input data-testid={`img-label-${i}`} placeholder={t(lang, "label")}
                           value={im.label} onChange={e => updateImg(i, "label", e.target.value)} />
                    <Button variant="ghost" size="sm" onClick={() => removeImg(i)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-1" />{t(lang, "delete")}
                    </Button>
                  </div>
                ) : (
                  im.label && <p className="p-3 text-sm font-medium text-neutral-700">{im.label}</p>
                )}
              </Card>
            ))}
            {(cfg.images || []).length === 0 && (
              <Card className="p-10 md:col-span-3 text-center text-neutral-500">{t(lang, "no_data")}</Card>
            )}
          </div>
        </section>

        {isAdmin && (
          <div className="mt-10 flex justify-end">
            <Button data-testid="cotw-save-btn" onClick={save} className="bg-[#1E3A5F] hover:bg-[#152A45] gap-2">
              <Save className="h-4 w-4" /> {t(lang, "save")}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
