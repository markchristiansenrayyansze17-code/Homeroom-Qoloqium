import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../lib/auth";
import { http } from "../lib/api";
import { t } from "../lib/i18n";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft, ClipboardList, FileDown, ImageIcon, Printer } from "lucide-react";

const FORMS = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];

export default function HomeroomArena() {
  const { user, lang } = useAuth();
  const nav = useNavigate();
  const isAdmin = user?.role === "admin";
  const [reports, setReports] = useState([]);
  const [modules, setModules] = useState([]);
  const [homerooms, setHomerooms] = useState([]);
  const [filterForm, setFilterForm] = useState("all");
  const [filterHR, setFilterHR] = useState("all");

  const load = async () => {
    const p = {};
    if (isAdmin && filterForm !== "all") p.form = filterForm;
    if (isAdmin && filterHR !== "all") p.homeroom = filterHR;
    const [{ data: r }, { data: m }, { data: h }] = await Promise.all([
      http.get("/reports", { params: p }),
      http.get("/modules", isAdmin && filterForm !== "all" ? { params: { form: filterForm } } : {}),
      http.get("/homerooms"),
    ]);
    setReports(r); setModules(m); setHomerooms(h);
  };
  useEffect(() => { if (user) load(); }, [filterForm, filterHR]);
  if (!user) { nav("/"); return null; }

  const modTitle = (id) => modules.find(m => m.id === id)?.title || "—";

  const hrOptions = filterForm === "all" ? homerooms : homerooms.filter(h => h.form === filterForm);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => nav("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#B91C1C]">
          <ArrowLeft className="h-4 w-4" /> {t(lang, "back")}
        </button>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#B91C1C] font-semibold">04 · History</p>
            <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold flex items-center gap-3">
              <ClipboardList className="h-10 w-10" /> {t(lang, "homeroom_arena")}
            </h1>
            <p className="mt-2 text-neutral-600">{isAdmin ? t(lang, "manage") : user.homeroom}</p>
          </div>
          {isAdmin && (
            <div className="flex gap-3">
              <Select value={filterForm} onValueChange={(v) => { setFilterForm(v); setFilterHR("all"); }}>
                <SelectTrigger data-testid="arena-form-filter" className="w-36 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t(lang, "all_forms")}</SelectItem>
                  {FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterHR} onValueChange={setFilterHR}>
                <SelectTrigger data-testid="arena-hr-filter" className="w-56 h-10"><SelectValue placeholder="Homeroom" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Homerooms</SelectItem>
                  {hrOptions.map(h => <SelectItem key={h.homeroom} value={h.homeroom}>{h.homeroom}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-4">
          {reports.length === 0 && (
            <Card className="p-10 text-center text-neutral-500">{t(lang, "no_data")}</Card>
          )}
          {reports.map(r => (
            <Card key={r.id} data-testid={`arena-report-${r.id}`}
                  className="p-6 border-neutral-200">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-[#B91C1C]/40 text-[#B91C1C]">{r.form}</Badge>
                <Badge variant="outline">{r.homeroom}</Badge>
                <span className="text-xs text-neutral-500 ml-auto">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <h3 className="mt-2 font-heading text-xl font-bold">{modTitle(r.module_id)}</h3>
              <p className="mt-1 text-sm text-neutral-600">
                By {r.submitted_by_name} ({r.submitted_by_role}) · {r.date}
              </p>
              {r.meeting_report && <p className="mt-3 text-sm">{r.meeting_report}</p>}
              {r.description && <p className="mt-2 text-sm text-neutral-600 italic">{r.description}</p>}
              {r.custom_values && Object.keys(r.custom_values).length > 0 && (
                <div className="mt-3 grid gap-1 rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
                  {Object.entries(r.custom_values).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-3 gap-2 text-xs">
                      <span className="font-semibold text-indigo-700">{k}</span>
                      <span className="col-span-2 text-neutral-700">{v || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-3 items-center">
                {r.attendance_image && (
                  <a href={r.attendance_image} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[#B91C1C] hover:underline">
                    <ImageIcon className="h-3.5 w-3.5" /> {t(lang, "attendance_image")}
                  </a>
                )}
                {r.hr_upload && (
                  <a href={r.hr_upload} download={r.hr_upload_name || "hr_upload"} className="inline-flex items-center gap-1 text-xs text-[#B91C1C] hover:underline">
                    <FileDown className="h-3.5 w-3.5" /> {r.hr_upload_name || "HR file"}
                  </a>
                )}
                <button
                  data-testid={`print-report-${r.id}`}
                  onClick={() => window.open(`/report/${r.id}/print`, "_blank")}
                  className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold h-8 px-3 rounded-full text-white shadow-sm hover:opacity-95 transition"
                  style={{background:"linear-gradient(135deg,#B91C1C 0%,#0D9488 100%)"}}
                >
                  <Printer className="h-3.5 w-3.5" /> {t(lang, "print_pdf")}
                </button>
              </div>
              {r.attendance_image && (
                <img src={r.attendance_image} alt="" className="mt-3 max-h-40 rounded-md border" />
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
