import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertNoFabrication,
  assertNoOutcomeClaims,
} from "@/lib/rules";
import { generateDraft } from "@/lib/templates";
import { normalizeCase } from "@/lib/case";

/**
 * Appeal_Service (Req 6.2, 6.5, 6.6).
 *
 * Produces an appeal draft from ONLY the user-confirmed inputs when
 * OPENAI_API_KEY + OPENAI_MODEL exist, validates the result server-side, and
 * falls back to the deterministic template on any failure. The API key is read
 * from process.env only and never returned to the browser.
 */

export const runtime = "nodejs";

const FactSchema = z.object({
  id: z.string(),
  text: z.string(),
  source: z.string(),
  verificationStatus: z.string(),
});

const EvidenceSchema = z.object({
  kind: z.string(),
  label: z.string(),
  notes: z.string().optional(),
  status: z.string(),
});

const BodySchema = z.object({
  city: z.string(),
  violationType: z.string(),
  ticketDate: z.string().default(""),
  statement: z.string().default(""),
  confirmedFacts: z.array(FactSchema).default([]),
  evidence: z.array(EvidenceSchema).default([]),
});

const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 8000);

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ source: "error", draft: "" }, { status: 400 });
  }

  // Reconstruct a minimal case for the deterministic generator / allowed text.
  const caseForDraft = normalizeCase({
    caseId: "api",
    isSynthetic: true,
    city: body.city,
    violationType: body.violationType,
    ticketDate: body.ticketDate,
    statement: body.statement,
    scenario: "other",
    residencyLanguage: "en",
    selectedFacts: body.confirmedFacts,
    evidence: body.evidence,
    status: "draft",
  });

  const deterministic = generateDraft(caseForDraft);
  const allowedText = [
    body.city,
    body.violationType,
    body.ticketDate,
    body.statement,
    ...body.confirmedFacts.map((f) => f.text),
    ...body.evidence.map((e) => `${e.kind} ${e.label} ${e.notes ?? ""}`),
  ].join(" ");

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return NextResponse.json({ source: "deterministic", draft: deterministic });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    const prompt = buildPrompt(body);
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You draft a short, polite, first-person English appeal letter using ONLY the facts provided. " +
              "If any provided claim is written in another language (e.g. Chinese or Spanish), translate it faithfully into English " +
              "without adding or changing meaning. The entire output must be in English. " +
              "Never invent laws, statutes, codes, case ids, documents, dates, or events. " +
              "Never state a win probability or guaranteed outcome. Keep claims framed as the resident's statements.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const draft = data.choices?.[0]?.message?.content?.trim();
    if (!draft) throw new Error("empty LLM draft");

    // Validate before trusting it (Req 6.3, 6.4, 14.3).
    assertNoFabrication(draft, allowedText);
    assertNoOutcomeClaims(draft);

    return NextResponse.json({ source: "llm", draft });
  } catch {
    // Any failure (timeout, HTTP error, invalid/invented/outcome content):
    // fall back to the guaranteed deterministic draft (Req 6.6).
    return NextResponse.json({ source: "deterministic", draft: deterministic });
  }
}

function buildPrompt(body: z.infer<typeof BodySchema>): string {
  const facts = body.confirmedFacts.map((f) => `- ${f.text}`).join("\n");
  const evidence = body.evidence
    .map((e) => `- ${e.label} (${e.kind}): ${e.status}`)
    .join("\n");
  return [
    `City: ${body.city}`,
    `Violation: ${body.violationType}`,
    body.ticketDate ? `Ticket date: ${body.ticketDate}` : "",
    "Confirmed resident claims:",
    facts || "(none)",
    "Evidence:",
    evidence || "(none)",
  ]
    .filter(Boolean)
    .join("\n");
}
