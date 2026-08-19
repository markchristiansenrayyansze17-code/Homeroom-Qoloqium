import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "../components/AppHeader";
import { useAuth } from "../lib/auth";
import { http, fileToBase64 } from "../lib/api";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Image, Newspaper, TrendingUp, Sparkles, Shield, Mail } from "lucide-react";

const KIND_META = {
  banner: { title: "Hero Banner", icon: Image, needs: ["image", "title", "description"] },
  news: { title: "Berita Terkini", icon: Newspaper, needs: ["image", "title", "description", "link"] },
  stat: { title: "Fakta Menarik", icon: TrendingUp, needs: ["title", "value", "description"] },
  uniqueness: { title: "Keistimewaan MRSM", icon: Sparkles, needs: ["image", "title", "description"] },
};

export default function AdminLanding() {
  const { user } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (user && user.role !== "admin") nav("/dashboard"); }, [user]);
  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        <button onClick={() => nav("/dashboard")} className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-[#B91C1C]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.22em] text-[#B91C1C] font-semibold">CMS</p>
          <h1 className="mt-2 font-heading text-4xl md:text-5xl font-extrabold">Landing Page CMS</h1>
          <p className="mt-2 text-neutral-600">Urus banner, berita, statistik, keistimewaan & security.</p>
        </div>

        <Tabs defaultValue="banner" className="mt-8">
          <TabsList className="bg-neutral-100 p-1 h-auto grid grid-cols-3 md:grid-cols-6 gap-1 w-full">
            {Object.entries(KIND_META).map(([k, m]) => (
              <TabsTrigger key={k} value={k} className="gap-2 h-10 justify-center"><m.icon className="h-4 w-4" /><span className="hidden md:inline">{m.title}</span></TabsTrigger>
            ))}
            <TabsTrigger value="settings" className="gap-2 h-10 justify-center"><TrendingUp className="h-4 w-4" /><span className="hidden md:inline">Settings</span></TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security" className="gap-2 h-10 justify-center"><Shield className="h-4 w-4" /><span className="hidden md:inline">Security</span></TabsTrigger>
          </TabsList>

          {Object.keys(KIND_META).map(k => (
            <TabsContent key={k} value={k} className="mt-6"><LandingCrud kind={k} /></TabsContent>
          ))}
          <TabsContent value="settings" className="mt-6"><LandingSettings /></TabsContent>
          <TabsContent value="security" className="mt-6"><SecurityTab /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function LandingCrud({ kind }) {
  const meta = KIND_META[kind];
  const [items, setItems] = useState([]);
  const [dlg, setDlg] = useState(null);
  const load = async () => {
    const { data } = await http.get("/landing");
    setItems(data.filter(x => x.kind === kind).sort((a, b) => a.order - b.order));
  };
  useEffect(() => { load(); }, [kind]);
  const del = async (id) => { if (!window.confirm("Delete?")) return; await http.delete(`/landing/${id}`); toast.success("Deleted"); load(); };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl font-bold flex items-center gap-2"><meta.icon className="h-5 w-5" /> {meta.title} ({items.length})</h2>
        <Button data-testid={`add-${kind}-btn`} onClick={() => setDlg({})} className="bg-[#B91C1C] hover:bg-[#7F1D1D] gap-2"><Plus className="h-4 w-4" /> Add</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map(it => (
          <Card key={it.id} className="p-4 border-neutral-200 rounded-xl flex gap-3">
            {it.image && <img src={it.image} alt="" className="w-24 h-24 object-cover rounded-lg" />}
            {kind === "stat" && !it.image && (
              <div className="w-24 h-24 rounded-full flex items-center justify-center bg-red-50 text-[#B91C1C] font-heading font-extrabold text-2xl">{it.value}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold truncate">{it.title || "—"}</p>
              {kind === "stat" && <p className="text-sm text-neutral-500">Value: <b>{it.value}</b></p>}
              <p className="text-xs text-neutral-500 line-clamp-2">{it.description}</p>
              <div className="mt-2 flex gap-1">
                <Button size="sm" variant="outline" onClick={() => setDlg(it)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => del(it.id)}><Trash2 className="h-3.5 w-3.5 text-red-600" /></Button>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: it.active ? "#DCFCE7" : "#FEE2E2", color: it.active ? "#065F46" : "#991B1B" }}>
                  {it.active ? "ACTIVE" : "HIDDEN"}
                </span>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && <Card className="p-8 md:col-span-2 text-center text-neutral-500">No {kind} yet</Card>}
      </div>
      {dlg !== null && <ItemDialog kind={kind} item={dlg} onClose={() => setDlg(null)} onSaved={() => { setDlg(null); load(); }} />}
    </div>
  );
}

function ItemDialog({ kind, item, onClose, onSaved }) {
  const meta = KIND_META[kind];
  const isEdit = !!item?.id;
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [image, setImage] = useState(item?.image || "");
  const [value, setValue] = useState(item?.value || "");
  const [link, setLink] = useState(item?.link || "");
  const [order, setOrder] = useState(item?.order ?? 0);
  const [active, setActive] = useState(item?.active !== false);

  const save = async () => {
    try {
      const body = { kind, title, description, image: image || null, value, link, order: Number(order) || 0, active };
      if (isEdit) await http.put(`/landing/${item.id}`, body);
      else await http.post("/landing", body);
      toast.success("Saved"); onSaved();
    } catch (e) { toast.error(e?.response?.data?.detail || "Error"); }
  };
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{isEdit ? "Edit" : "Add"} · {meta.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {meta.needs.includes("image") && (
            <div><Label>Image</Label>
              <Input data-testid="item-img" type="file" accept="image/*" onChange={async e => { const f = e.target.files?.[0]; if (f) setImage(await fileToBase64(f)); }} />
              {image && <img src={image} alt="" className="mt-2 h-24 rounded border" />}
            </div>
          )}
          <div><Label>Title / Label</Label>
            <Input data-testid="item-title" value={title} onChange={e => setTitle(e.target.value)} /></div>
          {meta.needs.includes("value") && (
            <div><Label>Value (big number/text)</Label>
              <Input data-testid="item-value" value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. 91 or 1993" /></div>
          )}
          {meta.needs.includes("description") && (
            <div><Label>Description</Label>
              <Textarea data-testid="item-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} /></div>
          )}
          {meta.needs.includes("link") && (
            <div><Label>Link (optional)</Label>
              <Input data-testid="item-link" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Order</Label>
              <Input type="number" value={order} onChange={e => setOrder(e.target.value)} /></div>
            <div className="flex items-end gap-2">
              <Switch checked={active} onCheckedChange={setActive} /> <span className="text-sm">Active</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button data-testid="item-save" onClick={save} className="bg-[#B91C1C] hover:bg-[#7F1D1D]">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LandingSettings() {
  const [cols, setCols] = useState(3);
  const [showU, setShowU] = useState(true);
  useEffect(() => {
    (async () => { const { data } = await http.get("/landing/settings"); setCols(data.news_columns); setShowU(data.show_keistimewaan); })();
  }, []);
  const save = async () => {
    await http.put("/landing/settings", { news_columns: Number(cols), show_keistimewaan: showU });
    toast.success("Settings saved");
  };
  return (
    <Card className="p-6 rounded-xl border-neutral-200 max-w-lg space-y-4">
      <div>
        <Label>News columns on landing page</Label>
        <Select value={String(cols)} onValueChange={v => setCols(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="3">3 columns</SelectItem><SelectItem value="6">6 columns</SelectItem></SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <Switch checked={showU} onCheckedChange={setShowU} />
        <span className="text-sm">Show "Keistimewaan MRSM" section</span>
      </div>
      <Button onClick={save} className="bg-[#B91C1C] hover:bg-[#7F1D1D]">Save</Button>
    </Card>
  );
}

function SecurityTab() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [newCode, setNewCode] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [devCode, setDevCode] = useState(null);
  const [busy, setBusy] = useState(false);

  const request = async () => {
    if (!email || !newCode) return toast.error("Email + new code required");
    if (newCode !== confirmCode) return toast.error("Codes do not match");
    if (newCode.length < 4) return toast.error("New code too short");
    setBusy(true);
    try {
      const { data } = await http.post("/admin/passcode/request-code", { email, new_code: newCode });
      toast.success("Verification code sent to your email");
      if (data.dev_code) setDevCode(data.dev_code);
      setStep(2);
    } catch (e) { toast.error(e?.response?.data?.detail || "Error"); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true);
    try {
      await http.post("/admin/passcode/verify", { email, code: verifyCode });
      toast.success("Passcode activated — confirmation email sent");
      setStep(3);
    } catch (e) { toast.error(e?.response?.data?.detail || "Error"); }
    finally { setBusy(false); }
  };

  return (
    <Card className="p-6 rounded-xl border-neutral-200 max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-[#B91C1C]" />
        <h3 className="font-heading font-bold text-lg">Change Admin Passcode</h3>
      </div>
      <p className="text-sm text-neutral-600">A 6-digit verification code will be emailed to confirm the change. After verification, a confirmation email is sent showing the new active passcode.</p>

      {step === 1 && (
        <div className="space-y-3">
          <div><Label>Admin Email <Mail className="inline h-3 w-3" /></Label>
            <Input data-testid="pc-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@mrsmkuching.edu.my" /></div>
          <div><Label>New Passcode</Label>
            <Input data-testid="pc-new" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="e.g. MK2026" className="uppercase font-mono" /></div>
          <div><Label>Confirm New Passcode</Label>
            <Input data-testid="pc-confirm" value={confirmCode} onChange={e => setConfirmCode(e.target.value.toUpperCase())} className="uppercase font-mono" /></div>
          <Button data-testid="pc-request" onClick={request} disabled={busy} className="bg-[#B91C1C] hover:bg-[#7F1D1D]">Send Verification Code</Button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-neutral-700">Check <b>{email}</b> for the 6-digit code (valid 15 minutes).</p>
          {devCode && (<p className="text-xs bg-yellow-50 border border-yellow-300 p-2 rounded">Dev fallback code (email not configured): <b className="font-mono">{devCode}</b></p>)}
          <div><Label>6-digit code</Label>
            <Input data-testid="pc-verify" value={verifyCode} onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className="tracking-widest font-mono text-center text-2xl" /></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button data-testid="pc-verify-btn" onClick={verify} disabled={busy || verifyCode.length !== 6} className="bg-[#059669] hover:bg-[#065F46]">Verify & Activate</Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm">
          <p className="font-bold text-emerald-800">✓ Passcode updated</p>
          <p className="mt-1 text-emerald-700">The new passcode is now active. A confirmation email has been sent to <b>{email}</b>.</p>
        </div>
      )}
    </Card>
  );
}
