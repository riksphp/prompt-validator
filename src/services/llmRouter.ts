import { getAISettings } from "./aiSettingsStorage";
import { CircuitBreakerOpenError } from "../lib/circuitBreaker";

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
  extractedData?: any; // Data extracted in the same LLM call (if extraction action)

  // Enhanced fields for better prompt quality
  reasoningType?:
    | "analytical"
    | "sequential"
    | "pattern-matching"
    | "contextual";
  confidence?: number; // 0-1 score
  selfCheck?: {
    isActionValid: boolean;
    potentialIssues: string[];
    alternativeAction?: string;
  };
  fallbackAction?: string;
}

/**
 * Main LLM Router - Decides the NEXT single action to take
 * AND extracts data in the same call (eliminating redundant LLM calls)
 *
 * OPTIMIZATION: Instead of making separate LLM calls for each extraction,
 * the router now extracts data when deciding, reducing LLM calls by ~70%!
 *
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

  const routerPrompt = `You are an intelligent sequential router AND extractor for a prompt analysis system.
Your job is to decide the NEXT SINGLE ACTION and, if it's an extraction action, EXTRACT THE DATA in the same response.

As a sequential router and extractor, prioritize actions to efficiently analyze user prompts and extract relevant information. You will be provided with a user prompt and a string representing completed actions.

🎯 REASONING TYPE AWARENESS:
Identify which type of reasoning you're using for this decision:
- "analytical": Breaking down the prompt into components
- "sequential": Following a step-by-step process, considering completed actions
- "pattern-matching": Recognizing patterns in the prompt to identify relevant information
- "contextual": Understanding context from completed actions to make informed decisions

User Prompt:
"""
${prompt}
"""
${completedStr}

Available actions (choose ONE):
1. **validate**: Validate prompt quality (handled separately, no extraction needed)
2. **extractPersonal**: Extract personal info (name, location, age, goals, interests, language)
3. **extractProfessional**: Extract professional info (job title, domain, company, projects, tech stack, experience)
4. **extractTask**: Extract task context (current task, what they're working on)
5. **extractIntent**: Extract primary intent and goal type
6. **extractTone**: Extract tone/style preferences (concise/detailed, casual/professional)
7. **extractExternal**: Extract external context (tools, frameworks, APIs, libraries)
8. **extractTags**: Generate 3-5 relevant tags/keywords
9. **generateImprovement**: Generate improved prompt (handled separately, no extraction needed)
10. **done**: All relevant actions completed

🔍 INTERNAL SELF-CHECK REQUIRED:
Before finalizing your decision, perform these checks:
1. Is this action actually needed for this specific prompt, considering the already completed actions?
2. Have I already done this action (check completed actions)? Use pattern matching to identify if the action or a similar action has been completed
3. Is there enough information in the prompt for this action?
4. What could go wrong with this decision? Consider edge cases.
5. Is there a better alternative action, considering the overall goal of extracting maximum information?

🛡️ FALLBACK STRATEGY:
Always provide a fallback action in case your primary choice fails or is invalid. The fallback should be a logical next step given the current state.

CRITICAL INSTRUCTION:
- If you choose extractPersonal, extractProfessional, extractTask, extractIntent, extractTone, extractExternal, or extractTags, you MUST include "extractedData" with the actual extracted information.
- If you choose validate, generateImprovement, or done, do NOT include extractedData.

Return ONLY valid JSON with the following structure:

For EXTRACTION actions:
{
  "nextAction": "extractPersonal",
  "reasoning": "why this extraction is needed",
  "progress": "Step X of ~Y",
  "reasoningType": "analytical|sequential|pattern-matching|contextual",
  "confidence": 0.95,
  "selfCheck": {
    "isActionValid": true,
    "potentialIssues": ["issue1", "issue2"],
    "alternativeAction": "extractProfessional"
  },
  "fallbackAction": "extractIntent",
  "extractedData": {
    // Extract from the user prompt above. Only include fields with actual data.
    // For extractPersonal: { "name": "", "location": "", "age": 0, "goals": [], "interests": [], "languagePreference": "" }
    // For extractProfessional: { "jobTitle": "", "domain": "", "company": "", "ongoingProjects": [], "techStack": [], "experience": "" }
    // For extractTask: { "currentTask": "" }
    // For extractIntent: { "primaryIntent": "", "intentType": "question|instruction|creative|code|analysis" }
    // For extractTone: { "tone": "", "style": "", "verbosity": "" }
    // For extractExternal: { "tools": [], "frameworks": [], "libraries": [], "apis": [], "fileNames": [], "urls": [] }
    // For extractTags: ["tag1", "tag2", "tag3"]
  }
}

For NON-EXTRACTION actions:
{
  "nextAction": "validate" | "generateImprovement" | "done",
  "reasoning": "why this is the next step",
  "progress": "Step X of ~Y",
  "reasoningType": "analytical|sequential|pattern-matching|contextual",
  "confidence": 0.95,
  "selfCheck": {
    "isActionValid": true,
    "potentialIssues": [],
    "alternativeAction": null
  },
  "fallbackAction": "done"
}

Guidelines:
- ALWAYS start with "validate" as the first action if no actions have been completed yet. This is mandatory.
- Extract context actions should include extractedData immediately. Be thorough but avoid hallucinating.
- Extract only relevant info from the user prompt - omit empty fields. Be as concise as possible in the extracted data.
- ALWAYS call "generateImprovement" before returning "done". This is mandatory - every prompt must have an improved version generated.
- Only return "done" after "generateImprovement" has been completed. Check the completed actions list.
- Don't repeat actions already completed. Use the completed actions list to prevent repetition.
- ALWAYS include reasoningType, confidence, selfCheck, and fallbackAction.
- Be honest about confidence scores (0.0 to 1.0). Calibrate your confidence based on the clarity and completeness of information.
- If confidence < 0.7, strongly consider using the fallback action. Provide a clear explanation why you're choosing the fallback.

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
      // Create error with status code for React Query retry logic
      const error: any = new Error(`API error: ${response.status}`);
      error.status = response.status;
      error.response = { status: response.status };

      // Add specific error messages
      if (response.status === 429) {
        error.message =
          "Rate limit exceeded. Please wait before making more requests.";
      } else if (response.status === 503) {
        error.message = "Service temporarily overloaded. Retrying...";
      }

      throw error;
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

    const decision: RouterDecision = JSON.parse(cleaned);

    // ✅ VALIDATION & SELF-CHECK
    // Validate the LLM's decision before returning
    if (!decision.nextAction) {
      console.warn("⚠️ Invalid decision: missing nextAction");
      return useFallback(
        completedActions,
        "Missing nextAction in LLM response"
      );
    }

    // Check if action was already completed
    if (completedActions.includes(decision.nextAction)) {
      console.warn(
        `⚠️ LLM suggested already-completed action: ${decision.nextAction}`
      );
      // Use the LLM's own fallback or alternative action if available
      if (
        decision.fallbackAction &&
        !completedActions.includes(decision.fallbackAction)
      ) {
        console.log(`✅ Using LLM's fallback: ${decision.fallbackAction}`);
        return {
          ...decision,
          nextAction: decision.fallbackAction as any,
          reasoning: `Using fallback: ${decision.reasoning}`,
        };
      }
      return useFallback(
        completedActions,
        "Suggested action already completed"
      );
    }

    // 🔍 Check confidence level
    if (decision.confidence !== undefined && decision.confidence < 0.7) {
      console.warn(
        `⚠️ Low confidence (${decision.confidence}) - considering fallback`
      );

      // If self-check indicates issues and there's a valid fallback
      if (
        decision.selfCheck?.potentialIssues &&
        decision.selfCheck.potentialIssues.length > 0 &&
        decision.fallbackAction &&
        !completedActions.includes(decision.fallbackAction)
      ) {
        console.log(
          `✅ Using fallback due to low confidence: ${decision.fallbackAction}`
        );
        return {
          ...decision,
          nextAction: decision.fallbackAction as any,
          reasoning: `Low confidence fallback: ${decision.reasoning}`,
        };
      }
    }

    // ✅ Validation passed - return the decision
    return decision;
  } catch (error) {
    console.error("❌ Router error:", error);

    // 🚫 If it's a circuit breaker error, re-throw it immediately
    // Don't use fallback - let the orchestrator handle it
    if (error instanceof CircuitBreakerOpenError) {
      console.error(
        "🚫 Circuit breaker error in router - re-throwing to stop orchestration"
      );
      throw error;
    }

    return useFallback(
      completedActions,
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

/**
 * 🛡️ ENHANCED FALLBACK STRATEGY
 * Provides intelligent fallback based on what actions have been completed
 */
function useFallback(
  completedActions: string[],
  reason: string
): RouterDecision {
  console.log(`🛡️ Using fallback strategy. Reason: ${reason}`);

  // 🚫 CRITICAL: If it's a rate limit error, immediately return "done"
  // Don't try to continue with other actions - they will also fail!
  const isRateLimitError =
    reason.includes("429") ||
    reason.includes("Rate limit") ||
    reason.includes("Circuit breaker") ||
    reason.includes("rate limit");

  if (isRateLimitError) {
    console.error(
      `🚫 Rate limit error detected in fallback - returning "done" to stop orchestration`
    );
    return {
      nextAction: "done",
      reasoning: `Stopping due to rate limit: ${reason}`,
      reasoningType: "sequential",
      confidence: 1.0,
      selfCheck: {
        isActionValid: true,
        potentialIssues: ["Rate limit reached"],
      },
      fallbackAction: "done",
    };
  }

  // Strategy 1: If nothing done yet, ALWAYS start with validate (mandatory first step)
  if (completedActions.length === 0) {
    return {
      nextAction: "validate",
      reasoning: `Fallback: Starting with mandatory validation (${reason})`,
      progress: "Step 1",
      reasoningType: "sequential",
      confidence: 1.0, // High confidence - this is the required first step
      selfCheck: {
        isActionValid: true,
        potentialIssues: ["Using fallback due to error"],
        alternativeAction: "extractIntent",
      },
      fallbackAction: "extractIntent",
    };
  }

  // Strategy 2: If only validated, try extracting intent
  if (
    completedActions.length === 1 &&
    completedActions.includes("validate") &&
    !completedActions.includes("extractIntent")
  ) {
    return {
      nextAction: "extractIntent",
      reasoning: `Fallback: Extracting intent after validation (${reason})`,
      progress: "Step 2",
      reasoningType: "sequential",
      confidence: 0.6,
      selfCheck: {
        isActionValid: true,
        potentialIssues: ["Using fallback"],
        alternativeAction: "extractTags",
      },
      fallbackAction: "generateImprovement", // Always aim for improvement before done
    };
  }

  // Strategy 3: If many actions done but not tags, extract tags
  if (
    completedActions.length > 2 &&
    !completedActions.includes("extractTags")
  ) {
    return {
      nextAction: "extractTags",
      reasoning: `Fallback: Generating tags (${reason})`,
      progress: `Step ${completedActions.length + 1}`,
      reasoningType: "contextual",
      confidence: 0.7,
      selfCheck: {
        isActionValid: true,
        potentialIssues: ["Using fallback"],
        alternativeAction: "generateImprovement",
      },
      fallbackAction: "generateImprovement", // Always aim for improvement before done
    };
  }

  // Strategy 4: If improvement not done yet, do that (MANDATORY before done)
  if (!completedActions.includes("generateImprovement")) {
    return {
      nextAction: "generateImprovement",
      reasoning: `Fallback: Generating mandatory improved prompt (${reason})`,
      progress: `Step ${completedActions.length + 1}`,
      reasoningType: "analytical",
      confidence: 1.0, // High confidence - this is mandatory before done
      selfCheck: {
        isActionValid: true,
        potentialIssues: [],
        alternativeAction: "done",
      },
      fallbackAction: "done",
    };
  }

  // Strategy 5: Default fallback - we're done (only if generateImprovement already completed)
  return {
    nextAction: "done",
    reasoning: `Fallback: All required actions completed including improvement (${reason})`,
    reasoningType: "sequential",
    confidence: 1.0,
    selfCheck: {
      isActionValid: true,
      potentialIssues: [],
    },
    fallbackAction: "done",
  };
}

// ============================================================================
// EXTRACTION FUNCTIONS REMOVED - No longer needed!
// ============================================================================
// Previously, each extraction (extractPersonalInfo, extractProfessionalInfo,
// extractTaskContext, extractTonePreferences, extractExternalContext,
// extractTags) made a separate LLM call.
//
// NEW APPROACH:
// The router now extracts data in the same call via decision.extractedData.
// This eliminates 6+ redundant LLM calls per prompt analysis!
//
// OPTIMIZATION IMPACT:
// - Before: ~8-12 LLM calls per prompt (1 router + 6-7 extractions + validate + improve)
// - After: ~3-5 LLM calls per prompt (multiple routers with embedded extraction + validate + improve)
// - Reduction: ~70% fewer LLM calls!
// - Faster processing, lower costs, better UX
// ============================================================================
