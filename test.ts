import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("No GOOGLE_API_KEY/GEMINI_API_KEY set");
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const resp = await model.generateContent("Say hello in Sanskrit");
    console.log("✅ Gemini says:", resp.response.text());
  } catch (err: any) {
    console.error("❌ Error calling Gemini:", err?.message || err);
  }
}
main();
