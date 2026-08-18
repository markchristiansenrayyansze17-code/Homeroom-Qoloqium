import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../lib/auth";
import { http } from "../lib/api";
import { t } from "../lib/i18n";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowLeft, Library, Lock, Clock, AlertTriangle, Search } from "lucide-react";

const FORMS = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];

function moduleState(m) {
  const now = new Date();
  const s = new Date(m.start_at);
  const e = new Date(m.deadline_at);
  if (now < s) return "locked";
  if (now > e) return "overdue";
  return "open";
}
const stateStyle = {
  open: { icon: Clock, cls: "bg-emerald-50 text-emerald-700 border-emerald-200", key: "open_now" },
  locked: { icon: Lock, cls: "bg-neutral-100 text-neutral-600 border-neutral-200", key: "locked" },
  overdue: { icon: AlertTriangle, cls: "bg-red-50 text-red-700 border-red-200", key: "overdue" },
};

export default function ModuleLibrary() {
  const { user, lang } = useAuth();
  const nav = useNavigate();
  const [modules, setModules] = useState([]);
  const [filterForm, setFilterForm] = useState("all");
  const [q, setQ] = useState("");

  const load = async () => {
    const { data } = await http.get("/modules", { params: { all: true } });
    setModules(data);
  };
  useEffect(() => { if (user) load(); }, []);
  if (!user) { nav("/"); return null; }

  const filtered = modules
    .filter(m => filterForm === "all" || m.form === filterForm)
    .filter(m => !q || m.title.toLowerCase().includes(q.toLowerCase()) || (m.description || "").toLowerCase().includes(q.toLowerCase()));

  const byForm = FORMS.reduce((acc, f) => {
    acc[f] = filtered.filter(m => m.form === f);
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => nav("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#B91C1C]">
          <ArrowLeft className="h-4 w-4" /> {t(lang, "back")}
        </button>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] font-semibold" style={{color: "#0D9488"}}>06 · Archive</p>
            <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold flex items-center gap-3">
              <Library className="h-10 w-10" /> {t(lang, "module_library")}
            </h1>
            <p className="mt-2 text-neutral-600">{t(lang, "library_ro")} · {t(lang, "module_library_desc")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input data-testid="lib-search" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="pl-9 w-64 h-10" />
            </div>
            <Select value={filterForm} onValueChange={setFilterForm}>
              <SelectTrigger data-testid="lib-form-filter" className="w-36 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t(lang, "all_forms")}</SelectItem>
                {FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          {(filterForm === "all" ? FORMS : [filterForm]).map(f => (
            byForm[f] && byForm[f].length > 0 && (
              <section key={f}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-1.5 rounded-full" style={{background: "linear-gradient(180deg,#DC2626,#0D9488)"}} />
                  <h2 className="font-heading text-2xl font-bold">{f}</h2>
                  <Badge variant="outline" className="ml-1">{byForm[f].length}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {byForm[f].map(m => {
                    const st = moduleState(m); const S = stateStyle[st];
                    return (
                      <Card key={m.id} data-testid={`lib-mod-${m.id}`} className="p-5 border-neutral-200 rounded-xl">
                        {m.image && <img src={m.image} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`gap-1 ${S.cls}`}>
                            <S.icon className="h-3 w-3" /> {t(lang, S.key)}
                          </Badge>
                          <Badge variant="outline">{m.form}</Badge>
                        </div>
                        <h3 className="mt-3 font-heading text-lg font-bold">{m.title}</h3>
                        {m.description && <p className="mt-1 text-sm text-neutral-600 line-clamp-2">{m.description}</p>}
                        {m.custom_fields?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {m.custom_fields.map((cf, i) => (
                              <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {cf.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="mt-3 text-[11px] text-neutral-500">
                          {new Date(m.start_at).toLocaleDateString()} → {new Date(m.deadline_at).toLocaleDateString()}
                        </p>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )
          ))}
          {filtered.length === 0 && (
            <Card className="p-10 text-center text-neutral-500">{t(lang, "no_data")}</Card>
          )}
        </div>
      </main>
    </div>
  );
}
