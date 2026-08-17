import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { http } from "../lib/api";
import { t } from "../lib/i18n";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, UserSquare2, ShieldCheck } from "lucide-react";

const LOGO = "https://customer-assets-m6fa6gv7.emergentagent.net/job_d09d4ddb-8d6c-4717-8c23-3bcb599efb3f/artifacts/k6dw99js_logo-mrsm%20%281%29.jpg";

export default function Login() {
  const { lang, login, toggleLang } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState("student");
  const [ident, setIdent] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!ident.trim()) return;
    setLoading(true);
    try {
      const { data } = await http.post("/auth/login", {
        role, identifier: ident.trim()
      });
      login(data.token, data.user);
      toast.success(t(lang, "welcome") + ", " + data.user.name);
      if (data.user.role === "admin") nav("/admin");
      else nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || t(lang, "error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT — Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 text-white overflow-hidden"
           style={{background: "linear-gradient(135deg, #1E3A5F 0%, #2E4F82 45%, #4F46E5 100%)"}}>
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#FFC72C]/25 blur-3xl" />
        <div className="absolute -left-16 -bottom-24 w-96 h-96 rounded-full bg-[#22D3EE]/25 blur-3xl" />
        <div className="absolute right-20 top-40 w-72 h-72 rounded-full bg-[#F472B6]/15 blur-3xl" />
        <div className="relative z-10">
          <img src={LOGO} alt="MRSM Kuching" className="h-20 w-20 bg-white rounded-xl p-2 shadow-2xl" />
          <p className="mt-8 text-xs uppercase tracking-[0.3em] text-white/70">Maktab Rendah Sains Mara</p>
          <h1 className="mt-3 font-heading text-5xl xl:text-6xl font-extrabold leading-[1.05]">
            DocAtt<br /><span className="text-[#FFC72C]">MRSM Kuching</span>
          </h1>
          <p className="mt-4 inline-block px-3 py-1 rounded-full bg-[#FFC72C] text-neutral-900 font-heading font-bold text-xs tracking-[0.28em]">
            {t(lang, "school_motto")}
          </p>
          <p className="mt-6 max-w-md text-white/85 text-base leading-relaxed">
            Homeroom reporting, weekly champions, and academic resources — all in one place.
          </p>
        </div>
        <div className="relative z-10 border-t border-white/20 pt-6">
          <p className="font-heading text-sm tracking-[0.32em] font-bold text-[#FFC72C]">
            BERDISIPLIN · BERILMU · BERAMAL
          </p>
        </div>
      </div>

      {/* RIGHT — Login card */}
      <div className="flex items-center justify-center p-6 md:p-12 relative bg-transparent">
        <button
          data-testid="login-lang-toggle"
          onClick={toggleLang}
          className="absolute top-6 right-6 h-9 px-3 rounded-full bg-neutral-900 text-white text-xs font-semibold uppercase tracking-wider"
        >
          {lang === "en" ? "EN / BM" : "BM / EN"}
        </button>
        <div className="w-full max-w-md animate-fade-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src={LOGO} alt="MRSM" className="h-14 w-14" />
            <div>
              <h1 className="font-heading text-2xl font-extrabold">DocAtt</h1>
              <p className="text-xs uppercase tracking-widest text-neutral-500">MRSM Kuching</p>
            </div>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900">
            {t(lang, "login_title")}
          </h2>
          <p className="mt-2 text-neutral-600">{t(lang, "login_subtitle")}</p>

          <Card className="mt-8 p-6 md:p-8 border-neutral-200/80 shadow-sm">
            <Tabs value={role} onValueChange={(v) => { setRole(v); setIdent(""); }}>
              <TabsList className="grid w-full grid-cols-2 h-11 bg-neutral-100 p-1">
                <TabsTrigger data-testid="tab-student" value="student" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1E3A5F]">
                  <GraduationCap className="h-4 w-4" />
                  {t(lang, "student")}
                </TabsTrigger>
                <TabsTrigger data-testid="tab-teacher" value="teacher" className="gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1E3A5F]">
                  <UserSquare2 className="h-4 w-4" />
                  {t(lang, "teacher")}
                </TabsTrigger>
              </TabsList>

              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                <TabsContent value="student" className="m-0 space-y-3">
                  <Label htmlFor="ident">{t(lang, "matrix_number")}</Label>
                  <Input
                    id="ident"
                    data-testid="student-matrix-input"
                    placeholder={t(lang, "matrix_placeholder")}
                    value={ident}
                    onChange={(e) => setIdent(e.target.value.toUpperCase())}
                    className="h-11 uppercase tracking-wider font-medium"
                  />
                </TabsContent>
                <TabsContent value="teacher" className="m-0 space-y-3">
                  <Label htmlFor="ident">{t(lang, "teacher_code")}</Label>
                  <Input
                    id="ident"
                    data-testid="teacher-code-input"
                    placeholder={t(lang, "code_placeholder")}
                    value={ident}
                    onChange={(e) => setIdent(e.target.value.toUpperCase())}
                    className="h-11 uppercase tracking-wider font-medium"
                  />
                </TabsContent>

                <Button
                  data-testid="login-submit-btn"
                  type="submit"
                  disabled={loading || !ident.trim()}
                  className="w-full h-11 bg-[#1E3A5F] hover:bg-[#152A45] text-white font-semibold text-base"
                >
                  {loading ? "…" : t(lang, "login")}
                  <ShieldCheck className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Tabs>
          </Card>

          <p className="mt-6 text-center text-xs text-neutral-500 tracking-wider">
            <span className="font-heading font-bold text-neutral-800">{t(lang, "school_motto")}</span>
            <span className="mx-2 text-neutral-300">·</span>
            {t(lang, "motto")}
          </p>
        </div>
      </div>
    </div>
  );
}
