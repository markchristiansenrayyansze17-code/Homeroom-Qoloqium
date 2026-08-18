import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../lib/auth";
import { http, fileToBase64 } from "../lib/api";
import { t } from "../lib/i18n";
import { STANDARD_TEMPLATE, hydrateTemplate, TEMPLATE_IMAGE } from "../lib/reportTemplate";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Lock, CheckCircle2, Clock, AlertTriangle, Pencil, Trash2, Send, ArrowLeft, Filter, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

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

export default function ModuleMaster() {
  const { user, lang } = useAuth();
  const nav = useNavigate();
  const isAdmin = user?.role === "admin";
  const [modules, setModules] = useState([]);
  const [reports, setReports] = useState([]);
  const [form, setForm] = useState(user?.form || "Form 1");
  const [submitOpen, setSubmitOpen] = useState(null); // module
  const [editReport, setEditReport] = useState(null);
  const [modOpen, setModOpen] = useState(null);

  const load = async () => {
    const params = isAdmin ? { form } : {};
    const { data } = await http.get("/modules", { params });
    setModules(data);
    const { data: r } = await http.get("/reports");
    setReports(r);
  };
  useEffect(() => { if (user) load(); }, [form]);

  if (!user) { nav("/"); return null; }

  const myReport = (moduleId) =>
    reports.find(r => r.module_id === moduleId && (isAdmin || r.homeroom === user.homeroom));

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <button data-testid="back-dashboard-btn" onClick={() => nav("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#1E3A5F]">
          <ArrowLeft className="h-4 w-4" /> {t(lang, "back")}
        </button>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#1E3A5F] font-semibold">01 · E-Reporting</p>
            <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold">{t(lang, "module_master")}</h1>
            <p className="mt-2 text-neutral-600">
              {isAdmin ? t(lang, "manage") : user.homeroom}
            </p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-neutral-500" />
              <Select value={form} onValueChange={setForm}>
                <SelectTrigger data-testid="admin-form-filter" className="w-40 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button data-testid="admin-add-module-btn" onClick={() => setModOpen({})}
                      className="bg-[#1E3A5F] hover:bg-[#152A45]">+ {t(lang, "add")} {t(lang, "module")}</Button>
            </div>
          )}
        </div>

        <div className="mt-10 grid gap-5">
          {modules.length === 0 && (
            <Card className="p-10 text-center text-neutral-500">{t(lang, "no_data")}</Card>
          )}
          {modules.map(m => {
            const st = moduleState(m);
            const S = stateStyle[st];
            const rep = myReport(m.id);
            return (
              <Card key={m.id} data-testid={`module-card-${m.id}`}
                    className="p-6 md:p-7 border-neutral-200 flex flex-col md:flex-row gap-5">
                {m.image && (
                  <img src={m.image} alt="" className="w-full md:w-40 h-32 md:h-32 object-cover rounded-lg border" />
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={`gap-1 ${S.cls}`}>
                      <S.icon className="h-3 w-3" /> {t(lang, S.key)}
                    </Badge>
                    <Badge variant="outline" className="border-neutral-300">{m.form}</Badge>
                    {rep && <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1"><CheckCircle2 className="h-3 w-3" />{t(lang, "submitted")}</Badge>}
                  </div>
                  <h3 className="mt-3 font-heading text-2xl font-bold">{m.title}</h3>
                  <p className="mt-1 text-neutral-600">{m.description}</p>
                  <p className="mt-3 text-xs text-neutral-500">
                    {t(lang, "start_at")}: {new Date(m.start_at).toLocaleString()} · {t(lang, "deadline")}: {new Date(m.deadline_at).toLocaleString()}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!isAdmin && !rep && st === "open" && (
                      <Button data-testid={`submit-module-${m.id}`} onClick={() => setSubmitOpen(m)}
                              className="bg-[#1E3A5F] hover:bg-[#152A45] gap-2">
                        <Send className="h-4 w-4" /> {t(lang, "submit_report")}
                      </Button>
                    )}
                    {rep && (
                      <>
                        <Button variant="outline" size="sm" data-testid={`edit-report-${rep.id}`}
                                onClick={() => setEditReport({ report: rep, module: m })}><Pencil className="h-4 w-4 mr-1" />{t(lang, "edit")}</Button>
                        <Button variant="outline" size="sm" data-testid={`delete-report-${rep.id}`}
                                onClick={async () => {
                                  if (!window.confirm("Delete?")) return;
                                  await http.delete(`/reports/${rep.id}`);
                                  toast.success(t(lang, "deleted")); load();
                                }}>
                          <Trash2 className="h-4 w-4 mr-1" />{t(lang, "delete")}
                        </Button>
                      </>
                    )}
                    {isAdmin && (
                      <>
                        <Button variant="outline" size="sm" data-testid={`admin-edit-module-${m.id}`}
                                onClick={() => setModOpen(m)}><Pencil className="h-4 w-4 mr-1" />{t(lang, "edit")}</Button>
                        <Button variant="outline" size="sm" data-testid={`admin-delete-module-${m.id}`}
                                onClick={async () => {
                                  if (!window.confirm("Delete module and its reports?")) return;
                                  await http.delete(`/modules/${m.id}`);
                                  toast.success(t(lang, "deleted")); load();
                                }}>
                          <Trash2 className="h-4 w-4 mr-1" />{t(lang, "delete")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </main>

      {submitOpen && (
        <ReportDialog
          module={submitOpen}
          onClose={() => setSubmitOpen(null)}
          onSaved={() => { setSubmitOpen(null); load(); }}
        />
      )}
      {editReport && (
        <ReportDialog
          module={editReport.module}
          report={editReport.report}
          onClose={() => setEditReport(null)}
          onSaved={() => { setEditReport(null); load(); }}
        />
      )}
      {modOpen !== null && (
        <ModuleDialog
          module={modOpen}
          onClose={() => setModOpen(null)}
          onSaved={() => { setModOpen(null); load(); }}
        />
      )}
    </div>
  );
}

function ReportDialog({ module, report, onClose, onSaved }) {
  const { lang } = useAuth();
  const isEdit = !!report;
  const mod = module || report?.module || {};
  const extraFields = mod.custom_fields || [];

  // Standard template values
  const initial = hydrateTemplate(report);
  const [tpl, setTpl] = useState(initial);
  const setT = (k, v) => setTpl(prev => ({ ...prev, [k]: v }));

  // Extra custom fields go into a separate map
  const [extraValues, setExtraValues] = useState(() => {
    const cv = report?.custom_values || {};
    const tplKeys = STANDARD_TEMPLATE.map(f => f.key);
    return Object.fromEntries(Object.entries(cv).filter(([k]) => !tplKeys.includes(k)));
  });
  const setEv = (label, v) => setExtraValues(prev => ({ ...prev, [label]: v }));

  const [hr, setHr] = useState(report?.hr_upload || "");
  const [hrName, setHrName] = useState(report?.hr_upload_name || "");
  const [att, setAtt] = useState(report?.attendance_image || "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!tpl.minit_laporan?.trim() || !tpl.tarikh) {
      toast.error("Tarikh & Minit Laporan wajib diisi");
      return;
    }
    setBusy(true);
    try {
      const custom_values = { ...tpl, ...extraValues };
      const body = {
        meeting_report: tpl.minit_laporan,
        date: tpl.tarikh,
        description: "",
        hr_upload: hr || null,
        hr_upload_name: hrName || null,
        attendance_image: att || null,
        custom_values,
      };
      if (isEdit) {
        await http.put(`/reports/${report.id}`, body);
      } else {
        await http.post("/reports", { module_id: mod.id, ...body });
      }
      toast.success(t(lang, "saved"));
      onSaved();
    } catch (e) {
      toast.error(e?.response?.data?.detail || t(lang, "error"));
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{mod?.title || t(lang, "edit")}</DialogTitle>
        </DialogHeader>

        {/* Template preview */}
        <div className="rounded-lg overflow-hidden border-2 border-[#1E3A5F]/20">
          <div className="bg-[#1E3A5F] text-white px-4 py-2 flex items-center justify-between">
            <p className="text-xs font-heading font-bold uppercase tracking-[0.2em]">Template Rasmi</p>
            <span className="text-[10px] text-white/70">LAPORAN PERJUMPAAN RASMI HOMEROOM</span>
          </div>
          <img src={TEMPLATE_IMAGE} alt="Template" className="w-full max-h-56 object-contain bg-white" />
        </div>

        {/* Standard template fields — grouped like the template layout */}
        <div className="mt-4 rounded-xl border border-[#FFC72C]/60 bg-[#FFFDF6] p-4 space-y-3">
          <p className="text-[11px] font-heading font-bold uppercase tracking-[0.22em] text-[#B45309]">
            Sila lengkapkan borang laporan
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STANDARD_TEMPLATE.slice(0, 5).map(f => (
              <div key={f.key} className={f.key === "kehadiran_phr" ? "sm:col-span-2" : ""}>
                <Label className="text-[11px] font-bold text-[#1E3A5F] tracking-wider">{f.label}</Label>
                <Input
                  data-testid={`tpl-${f.key}`}
                  type={f.type === "date" ? "date" : f.type === "time" ? "time" : "text"}
                  value={tpl[f.key]}
                  onChange={e => setT(f.key, e.target.value)}
                  placeholder={f.hint || ""}
                  className="h-9"
                />
              </div>
            ))}
          </div>

          <div>
            <Label className="text-[11px] font-bold text-[#1E3A5F] tracking-wider">
              MINIT LAPORAN PERTEMUAN <span className="text-neutral-500 font-normal">(laporan lengkap 80-100 perkataan)</span>
            </Label>
            <Textarea
              data-testid="tpl-minit_laporan"
              rows={6}
              value={tpl.minit_laporan}
              onChange={e => setT("minit_laporan", e.target.value)}
              className="font-serif text-[13px] leading-relaxed"
            />
            <p className="mt-1 text-[10px] text-neutral-500 text-right">
              {tpl.minit_laporan.trim().split(/\s+/).filter(Boolean).length} perkataan
            </p>
          </div>

          <div className="pt-2 border-t border-[#FFC72C]/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Disediakan Oleh</p>
              <Input data-testid="tpl-disediakan_oleh" placeholder="Nama Setiausaha HR"
                     value={tpl.disediakan_oleh} onChange={e => setT("disediakan_oleh", e.target.value)} className="h-9" />
              <Input data-testid="tpl-disediakan_tarikh" type="date"
                     value={tpl.disediakan_tarikh} onChange={e => setT("disediakan_tarikh", e.target.value)} className="h-9" />
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Disemak Oleh</p>
              <Input data-testid="tpl-disemak_oleh" placeholder="Nama Penasihat Homeroom"
                     value={tpl.disemak_oleh} onChange={e => setT("disemak_oleh", e.target.value)} className="h-9" />
              <Input data-testid="tpl-disemak_tarikh" type="date"
                     value={tpl.disemak_tarikh} onChange={e => setT("disemak_tarikh", e.target.value)} className="h-9" />
            </div>
          </div>
        </div>

        {/* Admin-defined extra columns (if any) */}
        {extraFields.length > 0 && (
          <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/30 p-3 space-y-3">
            <p className="text-xs font-heading font-bold uppercase tracking-widest text-indigo-700">
              Ruangan Tambahan
            </p>
            {extraFields.map((cf, i) => (
              <div key={i}>
                <Label>{cf.label}</Label>
                {cf.type === "long_text" ? (
                  <Textarea data-testid={`cf-input-${i}`} rows={2}
                            value={extraValues[cf.label] || ""}
                            onChange={e => setEv(cf.label, e.target.value)} />
                ) : (
                  <Input data-testid={`cf-input-${i}`}
                         type={cf.type === "number" ? "number" : cf.type === "date" ? "date" : "text"}
                         value={extraValues[cf.label] || ""}
                         onChange={e => setEv(cf.label, e.target.value)} />
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>{t(lang, "hr_upload")}</Label>
            <Input data-testid="report-hr-input" type="file" onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              setHr(await fileToBase64(f)); setHrName(f.name);
            }} />
            {hrName && <p className="text-xs mt-1 text-neutral-500">{hrName}</p>}
          </div>
          <div>
            <Label>{t(lang, "attendance_image")}</Label>
            <Input data-testid="report-att-input" type="file" accept="image/*" onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return;
              setAtt(await fileToBase64(f));
            }} />
            {att && <img src={att} alt="" className="mt-2 h-20 rounded-md border" />}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t(lang, "cancel")}</Button>
          <Button data-testid="report-save-btn" onClick={submit} disabled={busy}
                  className="bg-[#1E3A5F] hover:bg-[#152A45]">{t(lang, "save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModuleDialog({ module, onClose, onSaved }) {
  const { lang } = useAuth();
  const isEdit = !!module?.id;
  const [title, setTitle] = useState(module?.title || "");
  const [desc, setDesc] = useState(module?.description || "");
  const [form, setForm] = useState(module?.form || "Form 1");
  const [image, setImage] = useState(module?.image || "");
  const [startAt, setStartAt] = useState(module?.start_at ? module.start_at.slice(0, 16) : "");
  const [deadline, setDeadline] = useState(module?.deadline_at ? module.deadline_at.slice(0, 16) : "");
  const [fields, setFields] = useState(module?.custom_fields || []);

  const addField = () => setFields([...fields, { label: "", type: "text" }]);
  const updField = (i, k, v) => setFields(fields.map((f, idx) => idx === i ? { ...f, [k]: v } : f));
  const rmField = (i) => setFields(fields.filter((_, idx) => idx !== i));

  const save = async () => {
    try {
      const clean = fields.filter(f => f.label.trim());
      const body = { title, description: desc, form, image: image || null,
        start_at: new Date(startAt).toISOString(), deadline_at: new Date(deadline).toISOString(),
        custom_fields: clean };
      if (isEdit) await http.put(`/modules/${module.id}`, body);
      else await http.post("/modules", body);
      toast.success(t(lang, "saved"));
      onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || t(lang, "error")); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{isEdit ? t(lang, "edit") : t(lang, "add")} {t(lang, "module")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div><Label>{t(lang, "title")} *</Label>
            <Input data-testid="mod-title-input" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><Label>{t(lang, "description")}</Label>
            <Textarea data-testid="mod-desc-input" value={desc} onChange={e => setDesc(e.target.value)} rows={2} /></div>
          <div><Label>{t(lang, "form")} *</Label>
            <Select value={form} onValueChange={setForm}>
              <SelectTrigger data-testid="mod-form-select"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t(lang, "start_at")} *</Label>
              <Input data-testid="mod-start-input" type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} /></div>
            <div><Label>{t(lang, "deadline_at")} *</Label>
              <Input data-testid="mod-deadline-input" type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} /></div>
          </div>
          <div><Label>{t(lang, "template")} Image</Label>
            <Input type="file" accept="image/*" onChange={async e => {
              const f = e.target.files?.[0]; if (!f) return; setImage(await fileToBase64(f));
            }} />
            {image && <img src={image} alt="" className="mt-2 h-24 rounded-md border" />}
          </div>

          {/* Custom fields (template columns) */}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-heading font-bold uppercase tracking-widest text-indigo-700">
                  Ruangan Tambahan
                </p>
                <p className="text-[10px] text-neutral-500 mt-0.5">Templat rasmi sudah termasuk (Tarikh, Tempat, Masa, Kehadiran, PHR, Minit Laporan, Disediakan/Disemak). Tambah ruangan tambahan di sini jika perlu.</p>
              </div>
              <Button size="sm" variant="outline" data-testid="add-cf-btn" onClick={addField} className="gap-1 h-8">
                <Plus className="h-3.5 w-3.5" /> {t(lang, "add_field")}
              </Button>
            </div>
            {fields.length === 0 && <p className="text-xs text-neutral-500 py-2">No template columns yet.</p>}
            <div className="space-y-2">
              {fields.map((f, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input data-testid={`cf-label-${i}`} placeholder={t(lang, "field_label")}
                         value={f.label} onChange={e => updField(i, "label", e.target.value)} className="flex-1" />
                  <Select value={f.type} onValueChange={v => updField(i, "type", v)}>
                    <SelectTrigger data-testid={`cf-type-${i}`} className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">{t(lang, "text")}</SelectItem>
                      <SelectItem value="long_text">{t(lang, "long_text")}</SelectItem>
                      <SelectItem value="number">{t(lang, "number")}</SelectItem>
                      <SelectItem value="date">{t(lang, "date")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" data-testid={`cf-rm-${i}`} onClick={() => rmField(i)}>
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t(lang, "cancel")}</Button>
          <Button data-testid="mod-save-btn" onClick={save} disabled={!title.trim() || !startAt || !deadline}
                  className="bg-[#1E3A5F] hover:bg-[#152A45]">{t(lang, "save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
