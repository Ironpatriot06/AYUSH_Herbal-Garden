// app/api/chat/route.ts
import "dotenv/config";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { Document } from "langchain/document";

// ---- Config ----
const GOOGLE_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
if (!GOOGLE_KEY) {
  console.error("❌ Missing GOOGLE_API_KEY/GEMINI_API_KEY env var");
}
const VECTOR_FILE = "vector_store_precomputed.json"; // created by scripts/ingest.ts
const GEN_MODEL = "models/gemini-2.5-flash";          // generation
const EMBEDDING_MODEL = "models/text-embedding-004";  // embeddings used during ingestion
const GEMINI_TIMEOUT_MS = 30000; // 30s guard

const genAI = new GoogleGenerativeAI(GOOGLE_KEY || "");

// cache the vector store once loaded
let loadPromise: Promise<MemoryVectorStore> | null = null;

async function loadVectorStore(): Promise<MemoryVectorStore> {
  if (!loadPromise) {
    console.log("🧠 Loading vector store…");
    if (!fs.existsSync(VECTOR_FILE)) {
      throw new Error(
        `Vector store not found: ${VECTOR_FILE}. Run: npx ts-node --esm scripts/ingest.ts`
      );
    }

    const raw = fs.readFileSync(VECTOR_FILE, "utf-8");
    const pre: {
      vectors: number[][];
      docs: { pageContent: string; metadata?: Record<string, any> }[];
      model?: string;
    } = JSON.parse(raw);

    if (pre.model && pre.model !== EMBEDDING_MODEL) {
      console.warn(`⚠️ Vector store was built with ${pre.model}, expected ${EMBEDDING_MODEL}`);
    }

    const docs: Document[] = pre.docs.map(
      (d) => new Document({ pageContent: d.pageContent, metadata: d.metadata ?? {} })
    );

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: GOOGLE_KEY || "",
      model: EMBEDDING_MODEL,
    });

    const store = new MemoryVectorStore(embeddings as any);
    await store.addVectors(pre.vectors, docs);

    loadPromise = Promise.resolve(store);
    console.log(`✅ Vector store loaded: ${docs.length} docs`);
  }
  return loadPromise!;
}

/** Remove clearly UI/junk lines from a chunk at response time (extra safety) */
function stripUiNoise(text: string): string {
  const lines = text.split(/\r?\n/);
  const UI_REGEX =
    /(privacy policy|terms and conditions|subscribe|cookie|login|otp|newsletter|site map|comments|share this|related posts)/i;
  return lines.filter((l) => l.trim() && !UI_REGEX.test(l)).join("\n");
}

/** Compress multiple docs into the most relevant sentences for the question */
function compressContext(question: string, docs: Document[], maxChars = 2000): string {
  const qTokens = question.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
  const key = new Set(qTokens);

  // collect sentences with simple relevance heuristic
  const sentences: string[] = [];
  for (const d of docs) {
    const clean = stripUiNoise(d.pageContent);
    const parts = clean.split(/(?<=[.!?])\s+/);
    for (const s of parts) {
      const ls = s.toLowerCase();
      const hit = [...key].some((k) => ls.includes(k));
      if (hit || s.length > 60) sentences.push(s.trim());
    }
  }

  // de-dup similar starts to avoid repetition
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const s of sentences) {
    const k = s.slice(0, 128);
    if (!seen.has(k)) {
      seen.add(k);
      uniq.push(s);
    }
  }

  // clip to maxChars
  let out = "";
  for (const s of uniq) {
    if ((out + (out ? "\n" : "") + s).length > maxChars) break;
    out += (out ? "\n" : "") + s;
  }

  // fallback if nothing survived
  if (!out) {
    const joined = docs.map((d) => stripUiNoise(d.pageContent).slice(0, 400)).join("\n\n");
    return joined.slice(0, maxChars);
  }
  return out;
}

function jsonOk(body: any) {
  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
function jsonErr(status: number, message: string) {
  return new NextResponse(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔔 /api/chat hit");
    const { question } = await req.json().catch(() => ({} as any));
    if (!question || !question.trim()) {
      return jsonErr(400, "Missing question");
    }

    if (!GOOGLE_KEY) {
      return jsonErr(500, "Server misconfigured: Missing GOOGLE_API_KEY");
    }

    // Friendly greeting fallback (don’t hammer RAG for “hi”)
    if (/^\s*(hi|hello|hey|namaste)\b/i.test(question)) {
      return jsonOk({
        answer:
          "Namaste! I’m your Ayurveda assistant. Ask about a herb (Tulsi, Ashwagandha, Neem), a condition (cold, headache, digestion), or dosage/preparations.",
      });
    }

    const store = await loadVectorStore();
    console.log("🔎 Retrieving for:", question);

    // retrieve more, then compress
    const results = await store.similaritySearch(question, 8);
    console.log("📄 Retrieved docs:", results.length);

    // filter out obvious UI chunks at response time
    const UI_REGEX =
      /(privacy policy|terms and conditions|subscribe|cookie|login|otp|newsletter|site map|comments|share this|related posts)/i;
    const filtered = results.filter((r) => !UI_REGEX.test(r.pageContent));
    const context = compressContext(question, filtered.length ? filtered : results, 2000);

    console.log("📝 Context passed to ChatBot:\n", context);

    // Build prompt: allow own knowledge + prioritize context
    const prompt = `You are an Ayurveda assistant.
Use the context below if it is relevant, but you can also use your own Ayurvedic knowledge to answer the question.
Be accurate, practical, and concise. If suggesting remedies, include typical dosage forms and common precautions; advise consulting a qualified practitioner for personalized care.

Context:
${context}

Question:
${question}
`;

    console.log("⚡ Calling ChatBot");
    const model = genAI.getGenerativeModel({ model: GEN_MODEL });

    // Simple timeout guard without AbortController flakiness
    const llmPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("Chatbot timeout")), GEMINI_TIMEOUT_MS)
    );

    const resp = (await Promise.race([llmPromise, timeoutPromise])) as any;

    let answer =
      resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      (typeof resp?.response?.text === "function" ? resp.response.text() : null) ??
      "Sorry, I couldn’t compose a response.";

    if (typeof answer === "string") answer = answer.trim();

    console.log("✅ ChatBot responded");
    return jsonOk({ answer });
  } catch (e: any) {
    console.error("❌ API error:", e?.message || e);
    if (String(e?.message || "").includes("timeout")) {
      return jsonErr(
        504,
        "The model took too long to respond. Please try rephrasing or asking a more specific question."
      );
    }
    return jsonErr(500, e?.message || "Server error");
  }
}
