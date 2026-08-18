// Standard MRSM Kuching Homeroom Report Template
// Every module report follows this exact set of fields.
// Admin can still add EXTRA columns per-module via ModuleDialog.

export const TEMPLATE_IMAGE = "/report-template.jpg";

export const STANDARD_TEMPLATE = [
  { key: "tarikh",            label: "TARIKH",             type: "date" },
  { key: "tempat",            label: "TEMPAT",             type: "text" },
  { key: "masa",              label: "MASA",               type: "time" },
  { key: "kehadiran",         label: "KEHADIRAN",          type: "text",     hint: "cth. 25 / 28 pelajar" },
  { key: "kehadiran_phr",     label: "KEHADIRAN PHR",      type: "text",     hint: "Penasihat Homeroom" },
  { key: "minit_laporan",     label: "MINIT LAPORAN PERTEMUAN", type: "long_text", hint: "Laporan lengkap 80-100 perkataan" },
  { key: "disediakan_oleh",   label: "DISEDIAKAN OLEH (Setiausaha HR)", type: "text" },
  { key: "disediakan_tarikh", label: "TARIKH (Disediakan)", type: "date" },
  { key: "disemak_oleh",      label: "DISEMAK OLEH (Penasihat Homeroom)", type: "text" },
  { key: "disemak_tarikh",    label: "TARIKH (Disemak)",   type: "date" },
];

/** Hydrate template values from a saved report (with backward compat) */
export function hydrateTemplate(report) {
  const cv = (report && report.custom_values) || {};
  return {
    tarikh:            cv.tarikh            || report?.date || "",
    tempat:            cv.tempat            || "",
    masa:              cv.masa              || "",
    kehadiran:         cv.kehadiran         || "",
    kehadiran_phr:     cv.kehadiran_phr     || "",
    minit_laporan:     cv.minit_laporan     || report?.meeting_report || "",
    disediakan_oleh:   cv.disediakan_oleh   || "",
    disediakan_tarikh: cv.disediakan_tarikh || "",
    disemak_oleh:      cv.disemak_oleh      || "",
    disemak_tarikh:    cv.disemak_tarikh    || "",
  };
}
