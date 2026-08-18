import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { http } from "../lib/api";
import { hydrateTemplate } from "../lib/reportTemplate";

/**
 * Printable "LAPORAN PERJUMPAAN RASMI HOMEROOM" — mirrors the official
 * MRSM Kuching template. Auto-triggers browser print (Save as PDF).
 */
export default function ReportPrint() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data } = await http.get(`/reports/${id}/full`);
      setData(data);
    })();
  }, [id]);

  useEffect(() => {
    if (data) {
      const t = setTimeout(() => window.print(), 700);
      return () => clearTimeout(t);
    }
  }, [data]);

  if (!data) return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Loading…</div>;

  const { report: r, module: m } = data;
  const v = hydrateTemplate(r);
  const cv = r.custom_values || {};
  const stdKeys = ["tarikh","tempat","masa","kehadiran","kehadiran_phr","minit_laporan","disediakan_oleh","disediakan_tarikh","disemak_oleh","disemak_tarikh"];
  const extras = Object.entries(cv).filter(([k]) => !stdKeys.includes(k));

  const infoCell = { border: "1.5px solid #1E3A5F", padding: "10px 14px", verticalAlign: "middle", fontSize: 14 };
  const labelCell = { ...infoCell, background: "#FFFFFF", fontWeight: 700, width: "34%", color: "#1E3A5F", letterSpacing: 0.5 };

  return (
    <div style={{
      padding: "22mm 18mm 18mm",
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: "#111",
      background: "white",
      minHeight: "100vh",
      position: "relative",
    }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
        }
        body { background: white !important; margin: 0; }
      `}</style>

      {/* Diagonal decorative corner (mirrors the template's bottom-right accent) */}
      <div style={{
        position: "absolute", right: 0, bottom: 0, width: 180, height: 120, overflow: "hidden", pointerEvents: "none"
      }}>
        <div style={{ position: "absolute", right: -30, bottom: 20, width: 220, height: 24, background: "#1E3A5F", transform: "rotate(-25deg)", borderRadius: 4 }} />
        <div style={{ position: "absolute", right: -50, bottom: 50, width: 220, height: 24, background: "#FFC72C", transform: "rotate(-25deg)", borderRadius: 4 }} />
        <div style={{ position: "absolute", right: -70, bottom: 80, width: 220, height: 24, background: "#1E3A5F", transform: "rotate(-25deg)", borderRadius: 4 }} />
      </div>

      {/* TITLE */}
      <h1 style={{
        margin: 0,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontSize: 42,
        letterSpacing: 1,
        color: "#111",
        fontWeight: 700,
      }}>
        LAPORAN
      </h1>
      <div style={{
        marginTop: 4,
        background: "#FFC72C",
        color: "#1E3A5F",
        padding: "6px 14px",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: 6,
        display: "inline-block",
      }}>
        PERJUMPAAN RASMI HOMEROOM
      </div>

      {/* Homeroom + module context row */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#374151" }}>
        <div>
          <strong style={{ color: "#1E3A5F" }}>{r.form}</strong> · {r.homeroom}
          {m?.title && <> · <em>{m.title}</em></>}
        </div>
        <img src="/mrsm-logo.png" alt="MRSM" style={{ height: 54, width: 54 }} />
      </div>

      {/* 5-row info table (Tarikh, Tempat, Masa, Kehadiran, Kehadiran PHR) */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14 }}>
        <tbody>
          <tr><td style={labelCell}>TARIKH</td>       <td style={infoCell}>{formatDate(v.tarikh)}</td></tr>
          <tr><td style={labelCell}>TEMPAT</td>       <td style={infoCell}>{v.tempat || "—"}</td></tr>
          <tr><td style={labelCell}>MASA</td>         <td style={infoCell}>{v.masa || "—"}</td></tr>
          <tr><td style={labelCell}>KEHADIRAN</td>    <td style={infoCell}>{v.kehadiran || "—"}</td></tr>
          <tr><td style={labelCell}>KEHADIRAN PHR</td><td style={infoCell}>{v.kehadiran_phr || "—"}</td></tr>
        </tbody>
      </table>

      {/* Minit Laporan banner */}
      <div style={{
        marginTop: 18,
        background: "#DDE3EE",
        border: "1.5px solid #1E3A5F",
        padding: "8px 14px",
        color: "#1E3A5F",
        fontWeight: 800,
        letterSpacing: 1.2,
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        fontSize: 13,
      }}>
        MINIT LAPORAN PERTEMUAN (LAPORAN LENGKAP 80-100 PERKATAAN)
      </div>

      {/* Dotted lines with content */}
      <div style={{ marginTop: 14, fontSize: 14, lineHeight: "26px", color: "#111", minHeight: 260, whiteSpace: "pre-wrap" }}>
        {(v.minit_laporan || "").split("\n").map((line, i) => (
          <div key={i} style={{ borderBottom: "1.5px dotted #6B7280", padding: "2px 0", minHeight: 26 }}>
            {line || "\u00A0"}
          </div>
        ))}
        {/* Fill 8 blank dotted lines minimum for the template look */}
        {Array.from({ length: Math.max(0, 8 - (v.minit_laporan || "").split("\n").length) }).map((_, i) => (
          <div key={`blank-${i}`} style={{ borderBottom: "1.5px dotted #9CA3AF", padding: "2px 0", minHeight: 26 }}>&nbsp;</div>
        ))}
      </div>

      {/* NOTA */}
      <div style={{ marginTop: 14, fontSize: 12, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <div style={{ fontWeight: 700, fontStyle: "italic" }}>NOTA :</div>
        <div style={{ fontWeight: 700 }}>PHR - PENASIHAT HOMEROOM</div>
      </div>

      {/* Signature blocks */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12 }}>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: 1 }}>DISEDIAKAN OLEH;</div>
          <div style={{ marginTop: 36, borderTop: "1.5px solid #111", paddingTop: 4 }}>
            ( <span style={{ display: "inline-block", minWidth: 200 }}>{v.disediakan_oleh || "\u00A0"}</span> )
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>SETIAUSAHA HR</div>
          <div style={{ marginTop: 4 }}>TARIKH : {formatDate(v.disediakan_tarikh)}</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, letterSpacing: 1 }}>DISEMAK OLEH;</div>
          <div style={{ marginTop: 36, borderTop: "1.5px solid #111", paddingTop: 4 }}>
            ( <span style={{ display: "inline-block", minWidth: 200 }}>{v.disemak_oleh || "\u00A0"}</span> )
          </div>
          <div style={{ fontWeight: 700, marginTop: 4 }}>PENASIHAT HOMEROOM</div>
          <div style={{ marginTop: 4 }}>TARIKH : {formatDate(v.disemak_tarikh)}</div>
        </div>
      </div>

      {/* Extra columns if any */}
      {extras.length > 0 && (
        <div style={{ marginTop: 24, pageBreakInside: "avoid" }}>
          <div style={{ background: "#EEF2FF", border: "1.5px solid #4F46E5", padding: "6px 12px", color: "#4F46E5", fontWeight: 700, letterSpacing: 1, fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12 }}>
            RUANGAN TAMBAHAN
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 13 }}>
            <tbody>
              {extras.map(([k, val]) => (
                <tr key={k}>
                  <td style={{ ...labelCell, fontSize: 12 }}>{k}</td>
                  <td style={{ ...infoCell, fontSize: 13 }}>{val || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Attendance photo */}
      {r.attendance_image && (
        <div style={{ marginTop: 24, pageBreakBefore: "auto" }}>
          <div style={{ background: "#DDE3EE", border: "1.5px solid #1E3A5F", padding: "6px 14px", color: "#1E3A5F", fontWeight: 800, letterSpacing: 1, fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: 12 }}>
            GAMBAR KEHADIRAN
          </div>
          <img src={r.attendance_image} alt="attendance" style={{ marginTop: 8, maxWidth: "100%", maxHeight: 380, border: "1px solid #E5E7EB" }} />
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: 30, borderTop: "3px solid #1E3A5F", paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
        <span style={{ fontWeight: 800, letterSpacing: 1, color: "#1E3A5F" }}>❝ HOMEROOM MUTIARA MRSM</span>
        <span style={{ color: "#6B7280" }}>DocAtt · {new Date().toLocaleDateString()} · #{r.id.slice(0, 6)}</span>
      </footer>

      <div className="no-print" style={{ marginTop: 22, textAlign: "center" }}>
        <button onClick={() => window.print()} style={{ padding: "10px 24px", background: "#1E3A5F", color: "white", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  } catch (_) { return d; }
}
