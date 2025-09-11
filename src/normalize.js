// src/normalize.js
export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function iso(dateLike) {
  if (!dateLike) return null;
  const d = new Date(dateLike);
  return isNaN(d) ? null : d.toISOString();
}

export function money(n, currency = "ILS", locale = "he-IL") {
  if (typeof n !== "number") return "";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function first(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}
