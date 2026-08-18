import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../lib/auth";
import { http } from "../lib/api";
import { t } from "../lib/i18n";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { ArrowLeft, Image as ImageIcon, X } from "lucide-react";

const FORMS = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];

export default function Gallery() {
  const { user, lang } = useAuth();
  const nav = useNavigate();
  const isAdmin = user?.role === "admin";
  const [items, setItems] = useState([]);
  const [homerooms, setHomerooms] = useState([]);
  const [filterForm, setFilterForm] = useState("all");
  const [filterHR, setFilterHR] = useState("all");
  const [preview, setPreview] = useState(null);

  const load = async () => {
    const p = {};
    if (isAdmin && filterForm !== "all") p.form = filterForm;
    if (isAdmin && filterHR !== "all") p.homeroom = filterHR;
    const [{ data: g }, { data: h }] = await Promise.all([
      http.get("/gallery", { params: p }),
      http.get("/homerooms"),
    ]);
    setItems(g); setHomerooms(h);
  };
  useEffect(() => { if (user) load(); }, [filterForm, filterHR]);
  if (!user) { nav("/"); return null; }

  const hrOptions = filterForm === "all" ? homerooms : homerooms.filter(h => h.form === filterForm);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => nav("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#1E3A5F]">
          <ArrowLeft className="h-4 w-4" /> {t(lang, "back")}
        </button>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold" style={{color: "#4F46E5"}}>05 · Media</p>
            <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold flex items-center gap-3">
              <ImageIcon className="h-10 w-10" /> {t(lang, "gallery")}
            </h1>
            <p className="mt-2 text-neutral-600">
              {isAdmin ? t(lang, "all_photos") : `${t(lang, "my_homeroom")} · ${user.homeroom}`}
            </p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Select value={filterForm} onValueChange={(v) => { setFilterForm(v); setFilterHR("all"); }}>
                <SelectTrigger data-testid="gal-form-filter" className="w-36 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t(lang, "all_forms")}</SelectItem>
                  {FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterHR} onValueChange={setFilterHR}>
                <SelectTrigger data-testid="gal-hr-filter" className="w-56 h-10"><SelectValue placeholder="Homeroom" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Homerooms</SelectItem>
                  {hrOptions.map(h => <SelectItem key={h.homeroom} value={h.homeroom}>{h.homeroom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.length === 0 && (
            <Card className="p-10 col-span-full text-center text-neutral-500">{t(lang, "no_data")}</Card>
          )}
          {items.map(g => (
            <button key={g.report_id} data-testid={`gal-item-${g.report_id}`}
                    onClick={() => setPreview(g)}
                    className="group relative rounded-xl overflow-hidden bg-white border border-neutral-200 hover:border-[#4F46E5]/50 transition text-left">
              <img src={g.image} alt="" className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-white">
                <p className="text-[11px] uppercase tracking-wider text-white/70">{g.form} · {g.homeroom}</p>
                <p className="text-sm font-semibold truncate">{g.module_title}</p>
                <p className="text-[11px] text-white/70">{g.date} · {g.submitted_by_name}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      {preview && (
        <Dialog open onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <img src={preview.image} alt="" className="w-full max-h-[75vh] object-contain bg-black" />
            <div className="p-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline" style={{borderColor:"#4F46E540", color:"#4F46E5"}}>{preview.form}</Badge>
              <Badge variant="outline">{preview.homeroom}</Badge>
              <span className="text-sm font-medium ml-1">{preview.module_title}</span>
              <span className="text-xs text-neutral-500 ml-auto">{preview.date} · {preview.submitted_by_name}</span>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
