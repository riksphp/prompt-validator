import { getAISettings } from "./aiSettingsStorage";

export interface RouterDecision {
  nextAction:
    | "validate"
    | "extractPersonal"
    | "extractProfessional"
    | "extractTask"
    | "extractIntent"
    | "extractTone"
    | "extractExternal"
    | "extractTags"
    | "generateImprovement"
    | "done";
  reasoning: string;
  progress?: string;
}

/**
 * Main LLM Router - Decides the NEXT single action to take
 * Called iteratively until it returns "done"
 */
export async function routePrompt(
  prompt: string,
  completedActions: string[] = []
): Promise<RouterDecision> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const completedStr =
    completedActions.length > 0
      ? `\n\nActions already completed:\n${completedActions
          .map((a) => `- ${a}`)
          .join("\n")}`
      : "\n\nNo actions completed yet. This is the first step.";

  const routerPrompt = `You are an intelligent sequential router for a prompt analysis system.
Your job is to decide the NEXT SINGLE ACTION to perform based on the user's prompt and what has already been done.

User Prompt:
"""
${prompt}
"""
${completedStr}

Available actions (choose ONE):
1. **validate**: Validate prompt quality and structure
2. **extractPersonal**: Extract personal info (name, location, goals, interests)
3. **extractProfessional**: Extract professional info (job, domain, tech stack, projects)
4. **extractTask**: Extract task context (what they're working on)
5. **extractIntent**: Extract primary intent and goal
6. **extractTone**: Extract tone/style preferences
7. **extractExternal**: Extract external context (tools, frameworks, APIs)
8. **extractTags**: Generate relevant tags
9. **generateImprovement**: Generate improved prompt based on all saved context
10. **done**: All relevant actions completed

Return ONLY valid JSON:
{
  "nextAction": "validate" | "extractPersonal" | "extractProfessional" | "extractTask" | "extractIntent" | "extractTone" | "extractExternal" | "extractTags" | "generateImprovement" | "done",
  "reasoning": "why this is the next logical step",
  "progress": "Step X of ~Y"
}

Guidelines:
- Start with "validate" if the input is a prompt that needs quality checking
- Extract context BEFORE generating improvement
- Generate improvement should be one of the last steps (after context extraction)
- Return "done" when all relevant actions are completed
- Consider what's already been done - don't repeat actions
- Be intelligent about the sequence - extract related info together

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
            parts: [{ text: routerPrompt }],
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

    const cleaned = aiResponse
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Router error:", error);
    // Fallback: if nothing done yet, start with validate
    if (completedActions.length === 0) {
      return {
        nextAction: "validate",
        reasoning: "Starting with validation (fallback)",
        progress: "Step 1",
      };
    }
    // Otherwise, we're done
    return {
      nextAction: "done",
      reasoning: "Error occurred, completing process",
    };
  }
}

/**
 * Extract only personal information
 */
export async function extractPersonalInfo(prompt: string): Promise<any> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const extractionPrompt = `Extract personal information from the following prompt.
Focus ONLY on: name, location, age, goals, interests, language preference

Prompt:
"""
${prompt}
"""

Return ONLY valid JSON:
{
  "name": "",
  "location": "",
  "age": "",
  "goals": [],
  "interests": [],
  "languagePreference": ""
}

Only include fields where you found actual information. Omit empty fields.
Return ONLY the JSON object, no other text.`;

  return await callLLM(apiKey, apiUrl, extractionPrompt);
}

/**
 * Extract only professional information
 */
export async function extractProfessionalInfo(prompt: string): Promise<any> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const extractionPrompt = `Extract professional information from the following prompt.
Focus ONLY on: job title, domain, company, ongoing projects, tech stack, experience

Prompt:
"""
${prompt}
"""

Return ONLY valid JSON:
{
  "jobTitle": "",
  "domain": "",
  "company": "",
  "ongoingProjects": [],
  "techStack": [],
  "experience": ""
}

Only include fields where you found actual information. Omit empty fields.
Return ONLY the JSON object, no other text.`;

  return await callLLM(apiKey, apiUrl, extractionPrompt);
}

/**
 * Extract only task context
 */
export async function extractTaskContext(prompt: string): Promise<any> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const extractionPrompt = `Extract task context from the following prompt.
Focus ONLY on: what they're currently working on, the specific task

Prompt:
"""
${prompt}
"""

Return ONLY valid JSON:
{
  "currentTask": ""
}

Return ONLY the JSON object, no other text.`;

  return await callLLM(apiKey, apiUrl, extractionPrompt);
}

/**
 * Extract only tone and style preferences
 */
export async function extractTonePreferences(prompt: string): Promise<any> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const extractionPrompt = `Extract tone and style preferences from the following prompt.
Focus ONLY on: tone, style, verbosity preferences

Prompt:
"""
${prompt}
"""

Return ONLY valid JSON:
{
  "tone": "concise|detailed|casual|professional|technical",
  "style": "",
  "verbosity": "brief|moderate|verbose",
  "preferences": []
}

Only include fields where you found actual information. Omit empty fields.
Return ONLY the JSON object, no other text.`;

  return await callLLM(apiKey, apiUrl, extractionPrompt);
}

/**
 * Extract only external context (tools, frameworks, APIs)
 */
export async function extractExternalContext(prompt: string): Promise<any> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const extractionPrompt = `Extract external context from the following prompt.
Focus ONLY on: tools, APIs, frameworks, libraries, file names, URLs mentioned

Prompt:
"""
${prompt}
"""

Return ONLY valid JSON:
{
  "tools": [],
  "apis": [],
  "frameworks": [],
  "libraries": [],
  "fileNames": [],
  "urls": []
}

Only include arrays where you found actual information. Omit empty arrays.
Return ONLY the JSON object, no other text.`;

  return await callLLM(apiKey, apiUrl, extractionPrompt);
}

/**
 * Extract only tags
 */
export async function extractTags(prompt: string): Promise<string[]> {
  const settings = await getAISettings();
  const { apiKey, apiUrl } = settings;

  if (!apiKey || !apiUrl) {
    throw new Error("API not configured");
  }

  const extractionPrompt = `Generate 3-5 relevant tags for the following prompt.
Tags should be keywords that categorize the prompt.

Prompt:
"""
${prompt}
"""

Return ONLY valid JSON:
{
  "tags": ["tag1", "tag2", "tag3"]
}

Return ONLY the JSON object, no other text.`;

  const result = await callLLM(apiKey, apiUrl, extractionPrompt);
  return result.tags || [];
}

/**
 * Helper function to call LLM
 */
async function callLLM(
  apiKey: string,
  apiUrl: string,
  prompt: string
): Promise<any> {
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
            parts: [{ text: prompt }],
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

    const cleaned = aiResponse
      .trim()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("LLM call error:", error);
    return {};
  }
}
