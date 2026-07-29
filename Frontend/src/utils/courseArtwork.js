const PALETTES = [
  ["#4f46e5", "#7c3aed", "#a855f7"],
  ["#0f766e", "#14b8a6", "#2dd4bf"],
  ["#1d4ed8", "#2563eb", "#60a5fa"],
  ["#334155", "#475569", "#94a3b8"],
  ["#7c2d12", "#b45309", "#f59e0b"],
  ["#111827", "#1f2937", "#374151"],
];

function hashString(value = "") {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function escapeXml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function splitTitle(title = "") {
  const words = String(title).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [brand.name, "Course"];

  const first = [];
  const second = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= 18 && first.length < 2) {
      current = candidate;
      continue;
    }

    if (current) {
      first.push(current);
      current = "";
    }

    second.push(word);
    if (first.length + second.length >= 4) break;
  }

  if (current) first.push(current);
  if (first.length === 0) first.push(words[0]);
  if (second.length === 0 && words.length > 1) second.push(words.slice(1).join(" "));

  return [first[0] || brand.name, second[0] || ""];
}

export function getCourseArtwork(course = {}, variant = "card") {
  const title = course.title || course.name || `${brand.name} Course`;
  const level = course.level || "Course";
  const seed = hashString(`${course._id || course.slug || title}`);
  const palette = PALETTES[seed % PALETTES.length];
  const [colorA, colorB, colorC] = palette;
  const [line1, line2] = splitTitle(title);
  const width = variant === "wide" ? 1200 : variant === "hero" ? 900 : 800;
  const height = variant === "wide" ? 720 : variant === "hero" ? 540 : 480;
  const titleSize = variant === "wide" ? 64 : variant === "hero" ? 54 : 42;
  const levelSize = variant === "wide" ? 28 : variant === "hero" ? 24 : 20;
  const textX = variant === "wide" ? 70 : 48;
  const textY = variant === "wide" ? 160 : 128;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="55%" stop-color="${colorB}" />
          <stop offset="100%" stop-color="${colorC}" />
        </linearGradient>
        <radialGradient id="glow" cx="100%" cy="0%" r="80%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.28)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)" />
      <circle cx="${width * 0.12}" cy="${height * 0.78}" r="${height * 0.24}" fill="rgba(255,255,255,0.12)" />
      <circle cx="${width * 0.92}" cy="${height * 0.14}" r="${height * 0.22}" fill="url(#glow)" />
      <circle cx="${width * 0.83}" cy="${height * 0.82}" r="${height * 0.18}" fill="rgba(255,255,255,0.08)" />
      <rect x="${width * 0.06}" y="${height * 0.08}" rx="${variant === "wide" ? 26 : 20}" ry="${variant === "wide" ? 26 : 20}" width="${width * 0.28}" height="${height * 0.12}" fill="rgba(0,0,0,0.28)" />
      <text x="${width * 0.06 + 22}" y="${height * 0.08 + 34}" font-family="Arial, sans-serif" font-size="${levelSize}" font-weight="700" fill="#ffffff">${escapeXml(level)}</text>
      <text x="${textX}" y="${textY}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="#ffffff">
        <tspan x="${textX}" dy="0">${escapeXml(line1)}</tspan>
        ${line2 ? `<tspan x="${textX}" dy="${Math.round(titleSize * 1.15)}">${escapeXml(line2)}</tspan>` : ""}
      </text>
      <text x="${textX}" y="${height - 52}" font-family="Arial, sans-serif" font-size="${Math.round(titleSize * 0.42)}" font-weight="600" fill="rgba(255,255,255,0.88)">${brand.name} learning workspace</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, " ").trim())}`;
}
import { brand } from "@/utils/brand";
