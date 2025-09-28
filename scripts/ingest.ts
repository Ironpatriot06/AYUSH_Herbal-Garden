/* scripts/ingest.ts
   - Reads blogs_clean.json (fallback to blogs.json)
   - Splits, cleans chunks, embeds with text-embedding-004
   - Saves precomputed vectors to public/vector_store_precomputed.json
*/
import "dotenv/config";
import fs from "fs";
import path from "path";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

type SerializedDoc = { pageContent: string; metadata?: Record<string, any> };

const MIN_WORDS_CHUNK = 40;
const DROP_PATTERNS = [
  /enter\s+otp/i,
  /\botp\b/i,
  /login/i,
  /sign\s*in/i,
  /register/i,
  /download app/i,
  /subscribe/i,
  /privacy policy|terms and conditions/i,
  /^\s*(hi there|comments|code: )/i,
];

function isGoodChunk(text: string): boolean {
  if ((text.match(/\b[\p{L}\p{N}’']+\b/gu) || []).length < MIN_WORDS_CHUNK) return false;
  if (DROP_PATTERNS.some((re) => re.test(text))) return false;
  return true;
}

async function main() {
  const src = fs.existsSync("blogs_clean.json") ? "blogs_clean.json" : "blogs.json";
  const raw = fs.readFileSync(src, "utf-8");
  const blogs: Array<{ url: string; title: string; content: string }> = JSON.parse(raw);

  if (!Array.isArray(blogs) || blogs.length === 0) {
    console.error("❌ No blogs to ingest.");
    process.exit(1);
  }

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });

  const docs: Document[] = [];
  for (const blog of blogs) {
    const pieces = await splitter.createDocuments(
      [blog.content || ""],
      [{ source: blog.url, title: blog.title || "" }]
    );
    for (const p of pieces) {
      const text = p.pageContent.trim();
      if (!isGoodChunk(text)) continue;
      docs.push(p);
    }
  }

  if (docs.length === 0) {
    console.error("❌ All chunks filtered out. Check your cleaner rules.");
    process.exit(1);
  }

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    model: "models/text-embedding-004",
  });

  console.log(`Embedding ${docs.length} clean chunks...`);
  const texts = docs.map((d) => d.pageContent);
  const vectors = await embeddings.embedDocuments(texts);

  const serializedDocs: SerializedDoc[] = docs.map((d) => ({
    pageContent: d.pageContent,
    metadata: d.metadata ? (d.metadata as Record<string, any>) : undefined,
  }));

  // ✅ Write into public/ so Vercel ships it
  const outPath = path.join(process.cwd(), "public", "vector_store_precomputed.json");

  fs.writeFileSync(
    outPath,
    JSON.stringify({ vectors, docs: serializedDocs, model: "models/text-embedding-004" }, null, 2)
  );

  console.log("✅ Saved precomputed vectors to vector_store_precomputed.json");
}

main().catch((e) => {
  console.error("❌ Ingestion failed:", e);
  process.exit(1);
});
