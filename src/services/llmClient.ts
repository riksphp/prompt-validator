import { PromptValidationResult } from "../types";
import { getAISettings } from "./aiSettingsStorage";

function cleanJsonResponse(raw: string): string {
  // Remove markdown code blocks if present
  return raw
    .trim()
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

function ensureJsonObject(raw: string): PromptValidationResult {
  const cleaned = cleanJsonResponse(raw);
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      return parsed as PromptValidationResult;
    }
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    throw new Error("LLM did not return valid JSON.");
  }
  throw new Error("LLM response is not a valid object.");
}

export async function validatePrompt(
  prompt: string
): Promise<PromptValidationResult> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey) {
    throw new Error(
      "API key not configured. Please enter your API key in settings."
    );
  }

  if (!apiUrl) {
    throw new Error("API URL not configured. Please check your settings.");
  }

  const validationPrompt = `You are a Prompt Evaluation Assistant.
You will receive a prompt written by a student. Your job is to review this prompt
and assess how well it supports structured, step-by-step reasoning in an LLM (e.g.,
for math, logic, planning, or tool use).
Evaluate the prompt on the following criteria:
1. Explicit Reasoning Instructions✅
- Does the prompt tell the model to reason step-by-step?
- Does it include instructions like “explain your thinking” or “think before you
answer”?
2. Structured Output Format✅
- Does the prompt enforce a predictable output format (e.g., FUNCTION_CALL,
JSON, numbered steps)?
- Is the output easy to parse or validate?
3. Separation of Reasoning and Tools✅
- Are reasoning steps clearly separated from computation or tool-use steps?
- Is it clear when to calculate, when to verify, when to reason?
4. Conversation Loop Support✅
- Could this prompt work in a back-and-forth (multi-turn) setting?
- Is there a way to update the context with results from previous steps?
5. Instructional Framing✅
- Are there examples of desired behavior or “formats” to follow?
- Does the prompt define exactly how responses should look?
6. Internal Self-Checks✅
- Does the prompt instruct the model to self-verify or sanity-check intermediate
steps?
7. Reasoning Type Awareness✅
- Does the prompt encourage the model to tag or identify the type of reasoning
used (e.g., arithmetic, logic, lookup)?
8. Error Handling or Fallbacks✅
- Does the prompt specify what to do if an answer is uncertain, a tool fails, or
the model is unsure?
9. Overall Clarity and Robustness✅
- Is the prompt easy to follow?
- Is it likely to reduce hallucination and drift?
---
Respond with a structured review in this format:

"""
{
"explicit_reasoning": true,
"structured_output": true,
"tool_separation": true,
"conversation_loop": true,
"instructional_framing": true,
"internal_self_checks": false,
"reasoning_type_awareness": false,
"fallbacks": false,
"overall_clarity": "Excellent structure, but could improve with self-checks and
error fallbacks."
}
"""

Prompt to analyze:
"""
${prompt}
"""

Return ONLY the JSON object, no other text.`;

  try {
    // Add API key to URL for Gemini
    const url = apiUrl.includes("?")
      ? `${apiUrl}&key=${apiKey}`
      : `${apiUrl}?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: validationPrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    return ensureJsonObject(aiResponse);
  } catch (error) {
    console.error("LLM API error:", error);
    throw error;
  }
}

// Legacy exports for backward compatibility
export { saveAISettings as saveAPISettings } from "./aiSettingsStorage";
