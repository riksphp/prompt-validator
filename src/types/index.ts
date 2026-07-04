export interface PromptValidationResult {
  explicit_reasoning: boolean;
  structured_output: boolean;
  tool_separation: boolean;
  conversation_loop: boolean;
  instructional_framing: boolean;
  internal_self_checks: boolean;
  reasoning_type_awareness: boolean;
  fallbacks: boolean;
  overall_clarity: string;
}

// Re-export AISettings from service layer
export type { AISettings } from "../services/aiSettingsStorage";
