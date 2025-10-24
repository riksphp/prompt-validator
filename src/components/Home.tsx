import { useState } from "react";
import {
  orchestratePromptProcessing,
  getOrchestrationStatus,
  getActionDisplayName,
  OrchestrationResult,
  OrchestrationStep,
} from "../services/intelligentOrchestrator";
import { PromptValidationResult } from "../types";
import { clearUserContext } from "../services/contextStorage";
import { type PromptHistoryEntry } from "../services/promptHistoryStorage";
import SettingsPage from "./SettingsPage";
import HistoryPanel from "./HistoryPanel";
import styles from "./Home.module.css";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [orchestrationResult, setOrchestrationResult] =
    useState<OrchestrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [liveSteps, setLiveSteps] = useState<OrchestrationStep[]>([]);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleIntelligentProcessing = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to analyze");
      return;
    }

    setLoading(true);
    setError("");
    setOrchestrationResult(null);
    setLiveSteps([]);
    setCurrentStep("🧠 Starting intelligent analysis...");

    try {
      // Process with real-time step updates
      const result = await orchestratePromptProcessing(
        prompt,
        (step: OrchestrationStep) => {
          setCurrentStep(
            `${getActionDisplayName(step.action)}: ${step.decision.reasoning}`
          );
          setLiveSteps((prev) => [...prev, step]);
        }
      );

      setOrchestrationResult(result);
      setCurrentStep(getOrchestrationStatus(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep("❌ Processing failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClearContext = async () => {
    if (
      confirm(
        "Are you sure you want to clear all stored context? This cannot be undone."
      )
    ) {
      await clearUserContext();
      alert("Context cleared successfully!");
    }
  };

  const handleSelectHistoryPrompt = (entry: PromptHistoryEntry) => {
    // Use the improved prompt if available, otherwise the original
    const promptToUse =
      entry.improvedPrompt?.improvedPrompt || entry.originalPrompt;
    setPrompt(promptToUse);
    setShowHistory(false);
    setOrchestrationResult(null);
    setLiveSteps([]);
  };

  const renderLiveSteps = () => {
    if (liveSteps.length === 0) return null;

    return (
      <div className={styles.liveStepsContainer}>
        <h3 className={styles.liveStepsTitle}>
          <span className={styles.liveStepsIcon}>🔄</span>
          Processing Steps
        </h3>

        <div className={styles.stepsList}>
          {liveSteps.map((step, idx) => (
            <div
              key={idx}
              className={`${styles.stepItem} ${
                step.error ? styles.stepError : styles.stepSuccess
              }`}
            >
              <div className={styles.stepHeader}>
                <span className={styles.stepNumber}>Step {idx + 1}</span>
                <span className={styles.stepAction}>
                  {getActionDisplayName(step.action)}
                </span>
                {step.decision.progress && (
                  <span className={styles.stepProgress}>
                    {step.decision.progress}
                  </span>
                )}
              </div>

              <div className={styles.stepReasoning}>
                <strong>Reasoning:</strong> {step.decision.reasoning}
              </div>

              {step.error && (
                <div className={styles.stepErrorMessage}>
                  <span className={styles.errorIcon}>❌</span>
                  {step.error}
                </div>
              )}

              {step.result && !step.error && (
                <div className={styles.stepResult}>
                  <span className={styles.successIcon}>✅</span>
                  Completed successfully
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderExtractedContext = () => {
    if (!orchestrationResult?.extractedContext) return null;

    const extractedContext = orchestrationResult.extractedContext;
    const hasContext =
      extractedContext.personalInfo ||
      extractedContext.professionalInfo ||
      extractedContext.taskContext ||
      extractedContext.intent ||
      extractedContext.tonePersonality ||
      extractedContext.externalContext;

    if (!hasContext) return null;

    return (
      <div className={styles.contextCard}>
        <h3 className={styles.contextTitle}>
          <span className={styles.contextIcon}>🧩</span>
          Extracted & Saved Context
        </h3>

        <div className={styles.contextGrid}>
          {extractedContext.personalInfo && (
            <div className={styles.contextSection}>
              <h4>👤 Personal Info</h4>
              <ul>
                {Object.entries(extractedContext.personalInfo).map(
                  ([key, value]) =>
                    value && (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {Array.isArray(value) ? value.join(", ") : value}
                      </li>
                    )
                )}
              </ul>
            </div>
          )}

          {extractedContext.professionalInfo && (
            <div className={styles.contextSection}>
              <h4>💼 Professional Info</h4>
              <ul>
                {Object.entries(extractedContext.professionalInfo).map(
                  ([key, value]) =>
                    value && (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {Array.isArray(value) ? value.join(", ") : value}
                      </li>
                    )
                )}
              </ul>
            </div>
          )}

          {extractedContext.taskContext && (
            <div className={styles.contextSection}>
              <h4>📋 Task Context</h4>
              <ul>
                {Object.entries(extractedContext.taskContext).map(
                  ([key, value]) =>
                    value && (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {typeof value === "string"
                          ? value
                          : JSON.stringify(value)}
                      </li>
                    )
                )}
              </ul>
            </div>
          )}

          {extractedContext.intent && (
            <div className={styles.contextSection}>
              <h4>🎯 Intent</h4>
              <ul>
                {Object.entries(extractedContext.intent).map(
                  ([key, value]) =>
                    value && (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {Array.isArray(value) ? value.join(", ") : value}
                      </li>
                    )
                )}
              </ul>
            </div>
          )}

          {extractedContext.tonePersonality && (
            <div className={styles.contextSection}>
              <h4>🎨 Tone/Personality</h4>
              <ul>
                {Object.entries(extractedContext.tonePersonality).map(
                  ([key, value]) =>
                    value && (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {Array.isArray(value) ? value.join(", ") : value}
                      </li>
                    )
                )}
              </ul>
            </div>
          )}

          {extractedContext.externalContext && (
            <div className={styles.contextSection}>
              <h4>🔧 External Context</h4>
              <ul>
                {Object.entries(extractedContext.externalContext).map(
                  ([key, value]) =>
                    value && (
                      <li key={key}>
                        <strong>{key}:</strong>{" "}
                        {Array.isArray(value) ? value.join(", ") : value}
                      </li>
                    )
                )}
              </ul>
            </div>
          )}
        </div>

        {extractedContext.tags && extractedContext.tags.length > 0 && (
          <div className={styles.tagsContainer}>
            <span className={styles.tagsLabel}>🏷️ Tags:</span>
            {extractedContext.tags.map((tag, idx) => (
              <span key={idx} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderImprovedPrompt = () => {
    if (!orchestrationResult?.improvedPrompt) return null;

    const improvedPrompt = orchestrationResult.improvedPrompt;

    return (
      <div className={styles.improvedPromptCard}>
        <h3 className={styles.improvedTitle}>
          <span className={styles.improvedIcon}>✨</span>
          Improved Prompt Suggestion
        </h3>

        <div className={styles.improvedPromptText}>
          {improvedPrompt.improvedPrompt}
        </div>

        <div className={styles.improvementDetails}>
          {improvedPrompt.improvements && (
            <div className={styles.improvementSection}>
              <h4>📝 Improvements Made:</h4>
              <ul>
                {improvedPrompt.improvements.map(
                  (improvement: string, idx: number) => (
                    <li key={idx}>{improvement}</li>
                  )
                )}
              </ul>
            </div>
          )}

          {improvedPrompt.reasoning && (
            <div className={styles.improvementSection}>
              <h4>💡 Reasoning:</h4>
              <p>{improvedPrompt.reasoning}</p>
            </div>
          )}

          {improvedPrompt.contextUsed &&
            improvedPrompt.contextUsed.length > 0 && (
              <div className={styles.improvementSection}>
                <h4>🧩 Context Used:</h4>
                <ul>
                  {improvedPrompt.contextUsed.map(
                    (ctx: string, idx: number) => (
                      <li key={idx}>{ctx}</li>
                    )
                  )}
                </ul>
              </div>
            )}
        </div>

        <button
          onClick={() => {
            setPrompt(improvedPrompt.improvedPrompt);
            setOrchestrationResult(null);
            setLiveSteps([]);
          }}
          className={styles.useImprovedButton}
        >
          ✅ Use This Prompt
        </button>
      </div>
    );
  };

  const renderValidationResult = () => {
    if (!orchestrationResult?.validationResult) return null;

    const result = orchestrationResult.validationResult;
    const fields = [
      { key: "explicit_reasoning", label: "Explicit Reasoning", icon: "🧠" },
      { key: "structured_output", label: "Structured Output", icon: "📋" },
      { key: "tool_separation", label: "Tool Separation", icon: "🔧" },
      { key: "conversation_loop", label: "Conversation Loop", icon: "💬" },
      {
        key: "instructional_framing",
        label: "Instructional Framing",
        icon: "📖",
      },
      {
        key: "internal_self_checks",
        label: "Internal Self-Checks",
        icon: "✅",
      },
      {
        key: "reasoning_type_awareness",
        label: "Reasoning Type Awareness",
        icon: "🎯",
      },
      { key: "fallbacks", label: "Fallbacks", icon: "🛡️" },
    ];

    return (
      <div className={styles.resultCard}>
        <h2 className={styles.resultTitle}>
          <span className={styles.resultIcon}>📊</span>
          Prompt Validation Results
        </h2>

        <div className={styles.criteriaGrid}>
          {fields.map(({ key, label, icon }) => (
            <div
              key={key}
              className={`${styles.criteriaItem} ${
                result[
                  key as keyof Omit<PromptValidationResult, "overall_clarity">
                ]
                  ? styles.criteriaItemSuccess
                  : styles.criteriaItemError
              }`}
            >
              <span className={styles.criteriaIcon}>{icon}</span>
              <span className={styles.criteriaLabel}>{label}:</span>
              <span className={styles.criteriaValue}>
                {result[
                  key as keyof Omit<PromptValidationResult, "overall_clarity">
                ]
                  ? "✓ Yes"
                  : "✗ No"}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.claritySection}>
          <h3 className={styles.clarityTitle}>
            <span className={styles.clarityIcon}>✨</span>
            Overall Clarity
          </h3>
          <p className={styles.clarityText}>{result.overall_clarity}</p>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!orchestrationResult) return null;

    return (
      <div className={styles.resultsContainer}>
        <div className={styles.statusSummary}>
          <h2 className={styles.statusTitle}>
            {currentStep || getOrchestrationStatus(orchestrationResult)}
          </h2>
          <button
            onClick={() => {
              setOrchestrationResult(null);
              setLiveSteps([]);
            }}
            className={styles.resetButton}
          >
            🔄 Analyze Another Prompt
          </button>
        </div>

        {renderLiveSteps()}
        {renderValidationResult()}
        {renderExtractedContext()}
        {renderImprovedPrompt()}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}>✨</span>Prompt Validator
            </h1>
            <p className={styles.subtitle}>
              Sequential AI-powered prompt analysis - LLM decides each step.
            </p>
          </div>
          <div className={styles.headerButtons}>
            <button
              onClick={() => setShowHistory(true)}
              className={styles.historyButton}
            >
              <span className={styles.buttonIcon}>📜</span>
              History
            </button>
            <button
              onClick={handleClearContext}
              className={styles.contextButton}
            >
              <span className={styles.buttonIcon}>🗑️</span>
              Clear Context
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={styles.settingsButton}
            >
              <span className={styles.settingsIcon}>⚙️</span>
              Settings
            </button>
          </div>
        </div>

        {!orchestrationResult ? (
          <div className={styles.inputCard}>
            <label className={styles.inputLabel} htmlFor="prompt">
              <span className={styles.labelIcon}>📝</span>
              Enter your prompt for sequential intelligent analysis
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type or paste your prompt here...

Example: I work with React and TypeScript. Help me build a user authentication system with proper error handling.

The AI will:
1. Call routePrompt() → decide first action
2. Execute that action (e.g., validate)
3. Call routePrompt() again → decide next action
4. Execute (e.g., extract professional info)
5. Repeat until complete
6. Finally generate improvement based on all saved data"
              rows={10}
              className={styles.textarea}
            />

            {error && (
              <div className={styles.errorBox}>
                <span className={styles.errorIcon}>❌</span>
                <span>{error}</span>
              </div>
            )}

            {currentStep && loading && (
              <div className={styles.statusMessage}>
                <span className={styles.spinner}>⏳</span>
                {currentStep}
              </div>
            )}

            <button
              onClick={handleIntelligentProcessing}
              disabled={loading}
              className={styles.validateButton}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}>⏳</span>
                  Processing...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>🧠</span>
                  Sequential Analysis
                </>
              )}
            </button>

            <div className={styles.infoBox}>
              <p className={styles.infoTitle}>
                <span className={styles.infoIcon}>🤖</span>
                How Sequential Analysis Works
              </p>
              <ul className={styles.infoList}>
                <li>🧠 LLM Router called repeatedly</li>
                <li>📍 Each call decides ONE next action</li>
                <li>✅ Execute that action</li>
                <li>🔄 Call router again with updated history</li>
                <li>🎯 Router considers what's already done</li>
                <li>✨ Improvement generated at the end</li>
                <li>💾 All context saved automatically</li>
              </ul>
            </div>
          </div>
        ) : (
          renderResult()
        )}
      </div>

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
      {showHistory && (
        <HistoryPanel
          onClose={() => setShowHistory(false)}
          onSelectPrompt={handleSelectHistoryPrompt}
        />
      )}
    </div>
  );
}
