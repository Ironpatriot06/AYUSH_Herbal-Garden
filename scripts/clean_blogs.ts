/* scripts/clean_blogs.ts
   Input : blogs.json [{ url, title, content }]
   Output: blogs_clean.json (noise stripped)
*/
import fs from "fs";
import "dotenv/config";

// In scripts/clean_blogs.ts
const ALLOW_DOMAINS = [
  "pmc.ncbi.nlm.nih.gov", "ncbi.nlm.nih.gov", "nccih.nih.gov",
  "ayush.gov.in", "namayush.gov.in", "nmpb.nic.in", "ccras.nic.in",
  "nia.nic.in", "dbtindia.gov.in", "dst.gov.in", "who.int",
  "bsi.gov.in", "drdo.gov.in",
];

const BLOCK_DOMAINS = [
  "ayushedu.bisag-n.gov.in",
  "pharmeasy.in", "healthline.com", "dabur.com",
  "sciencedirect.com", "timesofagriculture.in", "medium.com",
];


const BLOCK_PATTERNS = [
  /enter\s+otp/i, /\botp\b/i, /send\s+otp/i, /login/i, /sign\s*in/i, /register/i,
  /download app/i, /subscribe/i, /newsletter/i, /cookie/i, /privacy policy/i, /terms and conditions/i,
  /comments?/i, /leave your comment/i, /share this/i, /related posts?/i, /top searched/i,
  /add items worth/i, /coupon/i, /avail/i, /download app/i, /whatsapp/i,
  /^\s*(hi there|home|contact|site map|follow|accessibility)\b/i,
];

const MIN_WORDS_PAGE = 120;
const MAX_NONALNUM_RATIO = 0.35;

function hostname(url: string): string {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ""; }
}
function allowed(url: string): boolean {
  const h = hostname(url);
  if (BLOCK_DOMAINS.some(b => h.includes(b))) return false;
  return ALLOW_DOMAINS.some(a => h.endsWith(a));
}

function looksBinaryish(s: string): boolean {
  const total = s.length || 1;
  let non = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 9 || (c > 13 && c < 32)) non++;
  }
  return non / total > 0.02;
}
function nonAlnumRatio(s: string): number {
  const non = (s.match(/[^A-Za-z0-9\s.,;:()'"\-–—]/g) || []).length;
  return non / (s.length || 1);
}
function stripLines(text: string): string {
  const keep: string[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (BLOCK_PATTERNS.some((re) => re.test(line))) continue;
    if (line.length < 6) continue;
    keep.push(line);
  }
  return keep.join("\n");
}
function normalize(s: string): string {
  return s.replace(/\u00A0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function wordCount(s: string): number {
  return (s.match(/\b[\p{L}\p{N}’']+\b/gu) || []).length;
}

async function main() {
  if (!fs.existsSync("blogs.json")) {
    console.error("❌ blogs.json not found");
    process.exit(1);
  }
  const raw = fs.readFileSync("blogs.json", "utf-8");
  let items: Array<{ url: string; title?: string; content: string }> = [];
  try { items = JSON.parse(raw); } catch { console.error("❌ blogs.json invalid"); process.exit(1); }

  const cleaned: Array<{ url: string; title: string; content: string }> = [];
  for (const it of items) {
    const url = (it.url || "").trim();
    if (!allowed(url)) continue;

    let title = (it.title || "").trim();
    let content = (it.content || "").toString();

    if (looksBinaryish(content) || nonAlnumRatio(content) > MAX_NONALNUM_RATIO) continue;

    content = stripLines(content);
    content = normalize(content);
    if (wordCount(content) < MIN_WORDS_PAGE) continue;

    cleaned.push({ url, title, content });
  }

  fs.writeFileSync("blogs_clean.json", JSON.stringify(cleaned, null, 2));
  console.log(`✅ Wrote ${cleaned.length} cleaned articles to blogs_clean.json`);
}

main().catch((e) => { console.error("❌ Clean failed:", e); process.exit(1); });
