import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { assertNoFabrication } from "@/lib/rules";

/**
 * Next_Question_Service (Req 13).
 *
 * Optionally lets an LLM reword/reorder the next question when
 * OPENAI_API_KEY + OPENAI_MODEL exist. Sends only confirmed, minimally
 * necessary, redacted context. Returns strict validated JSON; on missing
 * credentials, invalid JSON, an invented premise, or a timeout, returns
 * { source: "deterministic" } so the client uses the deterministic Branch_Bank.
 * The API key is read from process.env only and never reaches the browser.
 */

export const runtime = "nodejs";

const BodySchema = z.object({
  scenario: z.string(),
  confirmedFacts: z
    .array(z.object({ text: z.string() }))
    .default([]),
  answeredQuestionIds: z.array(z.string()).default([]),
});

const LlmQuestionSchema = z.object({
  promptText: z.string().min(1),
  choices: z
    .array(z.object({ id: z.string(), label: z.string().min(1) }))
    .min(2)
    .max(4),
});

const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? 8000);

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ source: "deterministic" }, { status: 200 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    return NextResponse.json({ source: "deterministic" });
  }

  const allowedText = body.confirmedFacts.map((f) => f.text).join(" ");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

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
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You propose ONE neutral, non-leading follow-up question with 2-4 answer choices to help a resident " +
              "describe a parking situation. Do not reference any law, document, case id, or fact not supplied. " +
              'Respond as JSON: {"promptText": string, "choices": [{"id": string, "label": string}]}.',
          },
          {
            role: "user",
            content: `Scenario: ${body.scenario}\nConfirmed claims: ${allowedText || "(none)"}\nAlready answered: ${body.answeredQuestionIds.join(", ") || "(none)"}`,
          },
        ],
      }),
    });
    clearTimeout(timer);

    if (!res.ok) throw new Error(`LLM HTTP ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty");

    const parsed = LlmQuestionSchema.parse(JSON.parse(content));

    // Reject invented premises in the prompt or any choice (Req 13.3, 14.3).
    assertNoFabrication(parsed.promptText, allowedText);
    for (const ch of parsed.choices) assertNoFabrication(ch.label, allowedText);

    return NextResponse.json({
      source: "llm",
      question: {
        id: "llm_q",
        promptText: parsed.promptText,
        // Append the neutral "Other / not sure" choice (Req 13.1).
        choices: [
          ...parsed.choices,
          { id: "other_not_sure", label: "Other / not sure" },
        ],
      },
    });
  } catch {
    return NextResponse.json({ source: "deterministic" });
  }
}
