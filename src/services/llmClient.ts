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

// Context extraction
export async function extractContext(prompt: string): Promise<any> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const extractionPrompt = `Extract structured information from the following user prompt.
Analyze and extract:

1. **Personal Info**: name, location, age, goals, interests, language preference
2. **Professional Info**: job title, domain, company, ongoing projects, tech stack, experience
3. **Task Context**: what they're currently working on
4. **Intent**: what the prompt is trying to achieve, intent type (question/instruction/creative/code/analysis)
5. **Tone/Personality**: preferred style, tone (concise/detailed/casual/professional/technical), verbosity
6. **External Context**: tools, APIs, file names, URLs, frameworks, libraries mentioned
7. **Tags**: auto-generate relevant keywords (max 5)
8. **Prompt Type**: classify as question, instruction, creative, or code
9. **Confidence Score**: 0-1 score for how much context you could extract

Return ONLY valid JSON with this structure:
{
  "personalInfo": { "name": "", "location": "", "goals": [], "interests": [] },
  "professionalInfo": { "jobTitle": "", "domain": "", "company": "", "ongoingProjects": [], "techStack": [] },
  "taskContext": { "currentTask": "" },
  "intent": { "primaryIntent": "", "intentType": "" },
  "tonePersonality": { "tone": "", "style": "", "verbosity": "" },
  "externalContext": { "tools": [], "frameworks": [], "libraries": [] },
  "tags": [],
  "promptType": "",
  "confidenceScore": 0.0
}

Only include fields where you found actual information. Omit empty fields.

User Prompt:
"""
${prompt}
"""

Return ONLY the JSON object, no other text.`;

  try {
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
            parts: [{ text: extractionPrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    return ensureJsonObject(aiResponse);
  } catch (error) {
    console.error("Context extraction error:", error);
    // Return minimal context on error
    return {
      tags: [],
      promptType: "instruction",
      confidenceScore: 0,
    };
  }
}

// Generate improved prompt based on user context
export async function generateImprovedPrompt(
  originalPrompt: string,
  contextSummary: string
): Promise<any> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const improvementPrompt = `You are a Prompt Engineering Expert. 
Given the user's original prompt and their accumulated context/profile, generate an improved version of the prompt.

**User Context:**
${contextSummary}

**Original Prompt:**
"""
${originalPrompt}
"""

**Your Task:**
1. Incorporate relevant context to make the prompt more personalized
2. Make it more specific and actionable
3. Add structure and clarity
4. Ensure it follows prompt engineering best practices
5. List specific improvements made
6. Explain your reasoning

Return ONLY valid JSON:
{
  "improvedPrompt": "the enhanced prompt here",
  "improvements": ["list of specific improvements made"],
  "reasoning": "why these changes improve the prompt",
  "contextUsed": ["which context elements were incorporated"]
}

Return ONLY the JSON object, no other text.`;

  try {
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
            parts: [{ text: improvementPrompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    return ensureJsonObject(aiResponse);
  } catch (error) {
    console.error("Prompt improvement error:", error);
    throw error;
  }
}
