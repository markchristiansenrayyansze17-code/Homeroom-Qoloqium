import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../lib/auth";
import { http } from "../lib/api";
import { t } from "../lib/i18n";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { GraduationCap, ArrowLeft, Plus, Pencil, Trash2, ExternalLink, BookOpen } from "lucide-react";

const FORMS = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"];

export default function Edustation() {
  const { user, lang } = useAuth();
  const nav = useNavigate();
  const canEdit = user?.role === "admin" || user?.role === "teacher";
  const [form, setForm] = useState(user?.form || "Form 1");
  const [subjects, setSubjects] = useState([]);
  const [openDlg, setOpenDlg] = useState(null);

  const load = async () => {
    const { data } = await http.get("/subjects", { params: { form } });
    setSubjects(data);
  };
  useEffect(() => { if (user) load(); }, [form]);
  if (!user) { nav("/"); return null; }

  const del = async (id) => {
    if (!window.confirm("Delete?")) return;
    await http.delete(`/subjects/${id}`);
    toast.success(t(lang, "deleted")); load();
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => nav("/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#1E3A5F]">
          <ArrowLeft className="h-4 w-4" /> {t(lang, "back")}
        </button>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#1E3A5F] font-semibold">03 · Academic</p>
            <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold flex items-center gap-3">
              <GraduationCap className="h-10 w-10" /> {t(lang, "edustation")}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={form} onValueChange={setForm}>
              <SelectTrigger data-testid="edu-form-select" className="w-40 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>{FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
            {canEdit && (
              <Button data-testid="add-subject-btn" onClick={() => setOpenDlg({})}
                      className="bg-[#1E3A5F] hover:bg-[#152A45] gap-2">
                <Plus className="h-4 w-4" /> {t(lang, "subject")}
              </Button>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {subjects.length === 0 && (
            <Card className="p-10 md:col-span-2 text-center text-neutral-500">{t(lang, "no_data")}</Card>
          )}
          {subjects.map(s => (
            <Card key={s.id} data-testid={`subject-card-${s.id}`}
                  className="p-6 border-neutral-200 hover:border-[#1E3A5F]/40 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-11 w-11 rounded-lg bg-[#1E3A5F]/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-[#1E3A5F]" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold">{s.name}</h3>
                    <p className="text-sm text-neutral-600 mt-0.5">{s.teacher || "-"}</p>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" data-testid={`edit-subj-${s.id}`} onClick={() => setOpenDlg(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" data-testid={`del-subj-${s.id}`} onClick={() => del(s.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-2 text-sm">
                {s.link && (
                  <a data-testid={`subj-link-${s.id}`} href={s.link} target="_blank" rel="noreferrer"
                     className="inline-flex items-center gap-2 text-[#1E3A5F] hover:underline font-medium">
                    <ExternalLink className="h-3.5 w-3.5" /> {t(lang, "link")}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </main>

      {openDlg !== null && (
        <SubjectDialog
          subject={openDlg}
          currentForm={form}
          onClose={() => setOpenDlg(null)}
          onSaved={() => { setOpenDlg(null); load(); }}
        />
      )}
    </div>
  );
}

function SubjectDialog({ subject, currentForm, onClose, onSaved }) {
  const { lang } = useAuth();
  const isEdit = !!subject?.id;
  const [name, setName] = useState(subject?.name || "");
  const [teacher, setTeacher] = useState(subject?.teacher || "");
  const [link, setLink] = useState(subject?.link || "");
  const [form, setForm] = useState(subject?.form || currentForm);

  const save = async () => {
    try {
      const body = { name, teacher, link, form };
      if (isEdit) await http.put(`/subjects/${subject.id}`, body);
      else await http.post("/subjects", body);
      toast.success(t(lang, "saved"));
      onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || t(lang, "error")); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t(lang, "edit") : t(lang, "add")} {t(lang, "subject")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>{t(lang, "form")}</Label>
            <Select value={form} onValueChange={setForm}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FORMS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>{t(lang, "subject")} *</Label>
            <Input data-testid="subj-name" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>{t(lang, "assigned_teacher")}</Label>
            <Input data-testid="subj-teacher" value={teacher} onChange={e => setTeacher(e.target.value)} /></div>
          <div><Label>{t(lang, "link")}</Label>
            <Input data-testid="subj-link" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{t(lang, "cancel")}</Button>
          <Button data-testid="subj-save-btn" onClick={save} disabled={!name.trim()}
                  className="bg-[#1E3A5F] hover:bg-[#152A45]">{t(lang, "save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
