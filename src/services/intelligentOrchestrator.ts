import { validatePrompt, generateImprovedPrompt } from "./llmClient";
import { routePrompt, RouterDecision } from "./llmRouter";
import { updateUserContext, getContextSummary } from "./contextStorage";
import { savePromptToHistory } from "./promptHistoryStorage";
import { circuitBreaker, CircuitBreakerOpenError } from "../lib/circuitBreaker";
import { ExtractedContext } from "../types/context";

export interface OrchestrationStep {
  action: string;
  decision: RouterDecision;
  result?: any;
  error?: string;
}

export interface OrchestrationResult {
  steps: OrchestrationStep[];
  validationResult?: any;
  extractedContext?: ExtractedContext;
  improvedPrompt?: any;
  errors: string[];
  totalSteps: number;
}

/**
 * Sequential orchestrator - calls routePrompt iteratively
 * Each call decides the NEXT single action
 */
export async function orchestratePromptProcessing(
  prompt: string,
  onStepUpdate?: (step: OrchestrationStep) => void
): Promise<OrchestrationResult> {
  const result: OrchestrationResult = {
    steps: [],
    errors: [],
    totalSteps: 0,
  };

  const completedActions: string[] = [];
  const extractedContextParts: any = {};
  let maxIterations = 15; // Safety limit
  let iteration = 0;

  try {
    // Iterative loop: call routePrompt until it returns "done"
    while (iteration < maxIterations) {
      iteration++;

      // 🚫 CRITICAL: Check circuit breaker BEFORE each iteration
      if (circuitBreaker.isCircuitOpen()) {
        const remainingTime = circuitBreaker.getRemainingCooldown();
        console.error(
          `🚫 Circuit breaker is OPEN - stopping orchestration. Wait ${remainingTime}s`
        );
        throw new CircuitBreakerOpenError(remainingTime);
      }

      // Step 1: Ask router for next action
      const decision = await routePrompt(prompt, completedActions);

      // If done, break
      if (decision.nextAction === "done") {
        result.steps.push({
          action: "done",
          decision,
        });
        if (onStepUpdate) {
          onStepUpdate({
            action: "done",
            decision,
          });
        }
        break;
      }

      // Step 2: Execute the decided action
      const step: OrchestrationStep = {
        action: decision.nextAction,
        decision,
      };

      try {
        switch (decision.nextAction) {
          case "validate":
            // Only validation and improvement need separate LLM calls
            step.result = await validatePrompt(prompt);
            result.validationResult = step.result;
            break;

          case "extractPersonal":
            // Data already extracted by router in decision.extractedData
            step.result = decision.extractedData || {};
            extractedContextParts.personalInfo = step.result;
            break;

          case "extractProfessional":
            // Data already extracted by router
            step.result = decision.extractedData || {};
            extractedContextParts.professionalInfo = step.result;
            break;

          case "extractTask":
            // Data already extracted by router
            step.result = decision.extractedData || {};
            extractedContextParts.taskContext = step.result;
            break;

          case "extractIntent":
            // Data already extracted by router
            step.result = decision.extractedData || {};
            extractedContextParts.intent = step.result;
            break;

          case "extractTone":
            // Data already extracted by router
            step.result = decision.extractedData || {};
            extractedContextParts.tonePersonality = step.result;
            break;

          case "extractExternal":
            // Data already extracted by router
            step.result = decision.extractedData || {};
            extractedContextParts.externalContext = step.result;
            break;

          case "extractTags":
            // Data already extracted by router (array of tags)
            step.result = decision.extractedData || [];
            extractedContextParts.tags = Array.isArray(decision.extractedData)
              ? decision.extractedData
              : decision.extractedData?.tags || [];
            break;

          case "generateImprovement":
            // Generate improvement needs LLM call with context
            const contextSummary = await getContextSummary();
            step.result = await generateImprovedPrompt(prompt, contextSummary);
            result.improvedPrompt = step.result;
            break;

          default:
            step.error = `Unknown action: ${decision.nextAction}`;
        }

        // Mark action as completed
        completedActions.push(decision.nextAction);
      } catch (error: any) {
        step.error = error.message;
        result.errors.push(`${decision.nextAction} failed: ${error.message}`);

        // 🚫 CRITICAL: Check if it's a rate limit or circuit breaker error
        // If so, STOP the orchestration immediately
        const errorMsg = error.message || "";
        const isRateLimitError =
          error instanceof CircuitBreakerOpenError ||
          errorMsg.includes("429") ||
          errorMsg.includes("Rate limit") ||
          errorMsg.includes("Circuit breaker") ||
          error.status === 429;

        if (isRateLimitError) {
          console.error(
            "🚫 Rate limit/circuit breaker error - stopping orchestration immediately"
          );

          // Add the failed step
          result.steps.push(step);
          if (onStepUpdate) {
            onStepUpdate(step);
          }

          // Re-throw to exit the orchestration
          throw error;
        }
      }

      // Add step to results
      result.steps.push(step);

      // Notify UI of progress
      if (onStepUpdate) {
        onStepUpdate(step);
      }
    }

    // Step 3: Save all extracted context at the end
    if (Object.keys(extractedContextParts).length > 0) {
      result.extractedContext = extractedContextParts;
      await updateUserContext(
        extractedContextParts,
        prompt,
        result.validationResult
      );
    }

    result.totalSteps = result.steps.length;

    // Step 4: Save prompt to history
    try {
      await savePromptToHistory({
        originalPrompt: prompt,
        validationResult: result.validationResult,
        extractedContext: result.extractedContext,
        improvedPrompt: result.improvedPrompt,
        routerDecisions: result.steps.map((step) => ({
          action: step.action,
          reasoning: step.decision.reasoning,
        })),
        tags: result.extractedContext?.tags || [],
      });
    } catch (error: any) {
      console.error("Failed to save prompt to history:", error);
      // Don't fail the entire operation if history save fails
    }
  } catch (error: any) {
    result.errors.push(`Orchestration failed: ${error.message}`);
  }

  return result;
}

/**
 * Get a human-readable status summary
 */
export function getOrchestrationStatus(result: OrchestrationResult): string {
  const completed = result.steps.filter((s) => !s.error && s.action !== "done");

  if (result.errors.length > 0) {
    return `⚠️ Completed ${completed.length} of ${result.totalSteps} steps with errors`;
  }

  if (completed.length === 0) {
    return "❌ No actions were completed";
  }

  return `✅ Successfully completed ${completed.length} steps`;
}

/**
 * Get action display name with emoji
 */
export function getActionDisplayName(action: string): string {
  const actionMap: Record<string, string> = {
    validate: "✅ Validate Prompt",
    extractPersonal: "👤 Extract Personal Info",
    extractProfessional: "💼 Extract Professional Info",
    extractTask: "📋 Extract Task Context",
    extractIntent: "🎯 Extract Intent",
    extractTone: "🎨 Extract Tone/Style",
    extractExternal: "🔧 Extract External Context",
    extractTags: "🏷️ Generate Tags",
    generateImprovement: "✨ Generate Improvement",
    done: "🎉 Complete",
  };

  return actionMap[action] || action;
}
