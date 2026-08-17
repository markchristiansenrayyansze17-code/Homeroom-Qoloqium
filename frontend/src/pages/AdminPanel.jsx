import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../lib/auth";
import { http } from "../lib/api";
import { t } from "../lib/i18n";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Users, UserSquare2, PieChart as PieIcon, LayoutGrid } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const FORMS = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];
const COLORS = ["#1E3A5F", "#FFC72C", "#334155", "#EA580C", "#059669"];

export default function AdminPanel() {
  const { user, lang } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (user && user.role !== "admin") nav("/dashboard"); }, [user]);
  if (!user) { nav("/"); return null; }
  if (user.role !== "admin") return null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => nav("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#1E3A5F]">
          <ArrowLeft className="h-4 w-4" /> {t(lang, "back")}
        </button>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[#1E3A5F] font-semibold">Admin</p>
          <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold">{t(lang, "admin_panel")}</h1>
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="bg-neutral-100 p-1 h-auto grid grid-cols-2 md:grid-cols-4 gap-1 w-full">
            <TabsTrigger data-testid="tab-overview" value="overview" className="gap-2 h-10 justify-center"><PieIcon className="h-4 w-4" />{t(lang, "stats_overview")}</TabsTrigger>
            <TabsTrigger data-testid="tab-students" value="students" className="gap-2 h-10 justify-center"><Users className="h-4 w-4" />{t(lang, "students")}</TabsTrigger>
            <TabsTrigger data-testid="tab-teachers" value="teachers" className="gap-2 h-10 justify-center"><UserSquare2 className="h-4 w-4" />{t(lang, "teachers")}</TabsTrigger>
            <TabsTrigger data-testid="tab-modules" value="modules" className="gap-2 h-10 justify-center"><LayoutGrid className="h-4 w-4" />{t(lang, "modules")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6"><Overview /></TabsContent>
          <TabsContent value="students" className="mt-6"><StudentsTab /></TabsContent>
          <TabsContent value="teachers" className="mt-6"><TeachersTab /></TabsContent>
          <TabsContent value="modules" className="mt-6"><ModulesTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Overview() {
  const { lang } = useAuth();
  const [ov, setOv] = useState({});
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState("all");
  const [pie, setPie] = useState([]);

  useEffect(() => {
    (async () => {
      const [{ data: o }, { data: m }] = await Promise.all([
        http.get("/stats/overview"), http.get("/modules")
      ]);
      setOv(o); setModules(m);
    })();
  }, []);
  useEffect(() => {
    (async () => {
      const params = moduleId === "all" ? {} : { module_id: moduleId };
      const { data } = await http.get("/stats/pie", { params });
      setPie(data);
    })();
  }, [moduleId]);

  const pieData = pie.map(p => ({ name: p.form, value: p.submitted, total: p.total }));
  const total = pieData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["students", ov.students],
          ["teachers", ov.teachers],
          ["modules", ov.modules],
          ["reports", ov.reports],
        ].map(([k, v]) => (
          <Card key={k} className="p-5 rounded-xl border-neutral-200">
            <p className="text-xs uppercase tracking-widest text-neutral-500">{t(lang, k)}</p>
            <p className="mt-2 font-heading text-4xl font-extrabold" style={{color: "#4F46E5"}}>{v ?? 0}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6 rounded-xl border-neutral-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h2 className="font-heading text-2xl font-bold">{t(lang, "submissions_by_form")}</h2>
          <Select value={moduleId} onValueChange={setModuleId}>
            <SelectTrigger data-testid="pie-module-select" className="w-64 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              {modules.map(m => <SelectItem key={m.id} value={m.id}>{m.form} · {m.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} innerRadius={55}
                     label={({ name, value }) => value ? `${name}: ${value}` : ""}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4F46E5" name={t(lang, "submitted")} />
                <Bar dataKey="total" fill="#F59E0B" name={t(lang, "homeroom") + "s"} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <p className="mt-4 text-sm text-neutral-500">Total submissions: <span className="font-semibold text-neutral-800">{total}</span></p>
      </Card>
    </div>
  );
}

/* ---------- Students ---------- */
function StudentsTab() {
  const { lang } = useAuth();
  const [items, setItems] = useState([]);
  const [homerooms, setHomerooms] = useState([]);
  const [q, setQ] = useState("");
  const [dlg, setDlg] = useState(null);

  const load = async () => {
    const [{ data: s }, { data: h }] = await Promise.all([http.get("/students"), http.get("/homerooms")]);
    setItems(s); setHomerooms(h);
  };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(x => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.matrix_number.toLowerCase().includes(q.toLowerCase()));

  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await http.delete(`/students/${id}`); toast.success(t(lang, "deleted")); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <Input data-testid="student-search" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="max-w-sm" />
        <Button data-testid="add-student-btn" onClick={() => setDlg({})} className="bg-[#1E3A5F] hover:bg-[#152A45] gap-2">
          <Plus className="h-4 w-4" /> {t(lang, "students")}
        </Button>
      </div>
      <Card className="overflow-hidden rounded-xl border-neutral-200">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left p-3">{t(lang, "name")}</th>
              <th className="text-left p-3">{t(lang, "matrix_number")}</th>
              <th className="text-left p-3">{t(lang, "form")}</th>
              <th className="text-left p-3">{t(lang, "homeroom")}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} data-testid={`student-row-${s.id}`} className="border-t">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3 font-mono">{s.matrix_number}</td>
                <td className="p-3">{s.form}</td>
                <td className="p-3">{s.homeroom}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => setDlg(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(s.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-neutral-500">{t(lang, "no_data")}</td></tr>}
          </tbody>
        </table>
        </div>
      </Card>
      {dlg !== null && <StudentDialog s={dlg} homerooms={homerooms} onClose={() => setDlg(null)} onSaved={() => { setDlg(null); load(); }} />}
    </div>
  );
}

function StudentDialog({ s, homerooms, onClose, onSaved }) {
  const { lang } = useAuth();
  const isEdit = !!s?.id;
  const [name, setName] = useState(s?.name || "");
  const [mn, setMn] = useState(s?.matrix_number || "");
  const [form, setForm] = useState(s?.form || "Form 1");
  const [hr, setHr] = useState(s?.homeroom || "");

  const hrOptions = homerooms.filter(h => h.form === form);

  const save = async () => {
    try {
      const body = { name, matrix_number: mn.toUpperCase(), form, homeroom: hr };
      if (isEdit) await http.put(`/students/${s.id}`, body);
      else await http.post("/students", body);
      toast.success(t(lang, "saved")); onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || t(lang, "error")); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? t(lang, "edit") : t(lang, "add")} {t(lang, "students")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>{t(lang, "name")}</Label><Input data-testid="stu-name" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>{t(lang, "matrix_number")}</Label><Input data-testid="stu-mn" value={mn} onChange={e => setMn(e.target.value.toUpperCase())} className="uppercase" /></div>
          <div><Label>{t(lang, "form")}</Label>
            <Select value={form} onValueChange={(v) => { setForm(v); setHr(""); }}>
              <SelectTrigger data-testid="stu-form"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t(lang, "homeroom")}</Label>
            <Select value={hr} onValueChange={setHr}>
              <SelectTrigger data-testid="stu-hr"><SelectValue placeholder="Select homeroom" /></SelectTrigger>
              <SelectContent>{hrOptions.map(h => <SelectItem key={h.homeroom} value={h.homeroom}>{h.homeroom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t(lang, "cancel")}</Button>
          <Button data-testid="stu-save" onClick={save} disabled={!name || !mn || !hr} className="bg-[#1E3A5F] hover:bg-[#152A45]">{t(lang, "save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Teachers ---------- */
function TeachersTab() {
  const { lang } = useAuth();
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [dlg, setDlg] = useState(null);

  const load = async () => { const { data } = await http.get("/teachers"); setItems(data); };
  useEffect(() => { load(); }, []);
  const filtered = items.filter(x => !q || x.name.toLowerCase().includes(q.toLowerCase()) || x.code.toLowerCase().includes(q.toLowerCase()));
  const del = async (id) => { if (!window.confirm("Delete?")) return; await http.delete(`/teachers/${id}`); toast.success(t(lang, "deleted")); load(); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <Input data-testid="teacher-search" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} className="max-w-sm" />
        <Button data-testid="add-teacher-btn" onClick={() => setDlg({})} className="bg-[#1E3A5F] hover:bg-[#152A45] gap-2">
          <Plus className="h-4 w-4" /> {t(lang, "teachers")}
        </Button>
      </div>
      <Card className="overflow-hidden rounded-xl border-neutral-200">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left p-3">{t(lang, "name")}</th>
              <th className="text-left p-3">{t(lang, "code")}</th>
              <th className="text-left p-3">{t(lang, "form")}</th>
              <th className="text-left p-3">{t(lang, "homeroom")}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t2 => (
              <tr key={t2.id} data-testid={`teacher-row-${t2.id}`} className="border-t">
                <td className="p-3 font-medium">{t2.name}</td>
                <td className="p-3 font-mono">{t2.code}</td>
                <td className="p-3">{t2.form}</td>
                <td className="p-3">{t2.homeroom}</td>
                <td className="p-3 text-right whitespace-nowrap">
                  <Button size="icon" variant="ghost" onClick={() => setDlg(t2)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(t2.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
      {dlg !== null && <TeacherDialog t2={dlg} onClose={() => setDlg(null)} onSaved={() => { setDlg(null); load(); }} />}
    </div>
  );
}

function TeacherDialog({ t2, onClose, onSaved }) {
  const { lang } = useAuth();
  const isEdit = !!t2?.id;
  const [name, setName] = useState(t2?.name || "");
  const [code, setCode] = useState(t2?.code || "");
  const [form, setForm] = useState(t2?.form || "Form 1");
  const [hr, setHr] = useState(t2?.homeroom || "");
  const save = async () => {
    try {
      const body = { name, code: code.toUpperCase(), form, homeroom: hr || `Homeroom ${name}` };
      if (isEdit) await http.put(`/teachers/${t2.id}`, body);
      else await http.post("/teachers", body);
      toast.success(t(lang, "saved")); onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || t(lang, "error")); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? t(lang, "edit") : t(lang, "add")} {t(lang, "teachers")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>{t(lang, "name")}</Label><Input data-testid="teacher-name" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>{t(lang, "code")}</Label><Input data-testid="teacher-code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} className="uppercase font-mono" /></div>
          <div><Label>{t(lang, "form")}</Label>
            <Select value={form} onValueChange={setForm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t(lang, "homeroom")}</Label>
            <Input data-testid="teacher-hr" value={hr} onChange={e => setHr(e.target.value)} placeholder={`Homeroom ${name || ""}`} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t(lang, "cancel")}</Button>
          <Button data-testid="teacher-save" onClick={save} disabled={!name || !code} className="bg-[#1E3A5F] hover:bg-[#152A45]">{t(lang, "save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Modules quick nav ---------- */
function ModulesTab() {
  const nav = useNavigate();
  const { lang } = useAuth();
  return (
    <Card className="p-8 text-center">
      <p className="text-neutral-600">{t(lang, "modules")} are managed from the {t(lang, "module_master")} screen with all filters and creation controls.</p>
      <Button data-testid="go-module-master" onClick={() => nav("/module-master")} className="mt-6 bg-[#1E3A5F] hover:bg-[#152A45]">
        {t(lang, "module_master")}
      </Button>
    </Card>
  );
}
