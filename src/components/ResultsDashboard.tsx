import { useState } from "react";
import {
  OrchestrationResult,
  getOrchestrationStatus,
  getActionDisplayName,
} from "../services/intelligentOrchestrator";
import { PromptValidationResult } from "../types";
import styles from "./ResultsDashboard.module.css";

interface ResultsDashboardProps {
  prompt: string;
  result: OrchestrationResult;
  onBack: () => void;
  onUseImprovedPrompt?: (prompt: string) => void;
}

export default function ResultsDashboard({
  prompt,
  result,
  onBack,
  onUseImprovedPrompt,
}: ResultsDashboardProps) {
  const [expandedSections, setExpandedSections] = useState({
    steps: true,
    validation: true,
    context: true,
    improved: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderLiveSteps = () => {
    if (!result.steps || result.steps.length === 0) return null;

    return (
      <div className={styles.dashboardCard}>
        <div
          className={styles.cardHeader}
          onClick={() => toggleSection("steps")}
        >
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>🔄</span>
            Processing Steps ({result.steps.length})
          </h3>
          <button className={styles.toggleButton}>
            {expandedSections.steps ? "▼" : "▶"}
          </button>
        </div>

        {expandedSections.steps && (
          <div className={styles.cardContent}>
            <div className={styles.stepsList}>
              {result.steps.map((step, idx) => (
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
        )}
      </div>
    );
  };

  const renderValidationResult = () => {
    if (!result.validationResult) return null;

    const validationResult = result.validationResult;
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
      <div className={styles.dashboardCard}>
        <div
          className={styles.cardHeader}
          onClick={() => toggleSection("validation")}
        >
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>📊</span>
            Prompt Validation Results
          </h3>
          <button className={styles.toggleButton}>
            {expandedSections.validation ? "▼" : "▶"}
          </button>
        </div>

        {expandedSections.validation && (
          <div className={styles.cardContent}>
            <div className={styles.criteriaGrid}>
              {fields.map(({ key, label, icon }) => (
                <div
                  key={key}
                  className={`${styles.criteriaItem} ${
                    validationResult[
                      key as keyof Omit<
                        PromptValidationResult,
                        "overall_clarity"
                      >
                    ]
                      ? styles.criteriaItemSuccess
                      : styles.criteriaItemError
                  }`}
                >
                  <span className={styles.criteriaIcon}>{icon}</span>
                  <span className={styles.criteriaLabel}>{label}:</span>
                  <span className={styles.criteriaValue}>
                    {validationResult[
                      key as keyof Omit<
                        PromptValidationResult,
                        "overall_clarity"
                      >
                    ]
                      ? "✓ Yes"
                      : "✗ No"}
                  </span>
                </div>
              ))}
            </div>

            <div className={styles.claritySection}>
              <h4 className={styles.clarityTitle}>
                <span className={styles.clarityIcon}>✨</span>
                Overall Clarity
              </h4>
              <p className={styles.clarityText}>
                {validationResult.overall_clarity}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderExtractedContext = () => {
    if (!result.extractedContext) return null;

    const extractedContext = result.extractedContext;
    const hasContext =
      extractedContext.personalInfo ||
      extractedContext.professionalInfo ||
      extractedContext.taskContext ||
      extractedContext.intent ||
      extractedContext.tonePersonality ||
      extractedContext.externalContext;

    if (!hasContext) return null;

    return (
      <div className={styles.dashboardCard}>
        <div
          className={styles.cardHeader}
          onClick={() => toggleSection("context")}
        >
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>🧩</span>
            Extracted & Saved Context
            {extractedContext.confidenceScore !== undefined && (
              <span className={styles.confidenceBadge}>
                {(extractedContext.confidenceScore * 100).toFixed(0)}%
                confidence
              </span>
            )}
          </h3>
          <button className={styles.toggleButton}>
            {expandedSections.context ? "▼" : "▶"}
          </button>
        </div>

        {expandedSections.context && (
          <div className={styles.cardContent}>
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
        )}
      </div>
    );
  };

  const renderImprovedPrompt = () => {
    if (!result.improvedPrompt) return null;

    const improvedPrompt = result.improvedPrompt;

    return (
      <div className={styles.dashboardCard}>
        <div
          className={styles.cardHeader}
          onClick={() => toggleSection("improved")}
        >
          <h3 className={styles.cardTitle}>
            <span className={styles.cardIcon}>✨</span>
            Improved Prompt Suggestion
          </h3>
          <button className={styles.toggleButton}>
            {expandedSections.improved ? "▼" : "▶"}
          </button>
        </div>

        {expandedSections.improved && (
          <div className={styles.cardContent}>
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

            {onUseImprovedPrompt && (
              <button
                onClick={() =>
                  onUseImprovedPrompt(improvedPrompt.improvedPrompt)
                }
                className={styles.useImprovedButton}
              >
                ✅ Use This Prompt
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
        <div className={styles.headerContent}>
          <h1 className={styles.dashboardTitle}>
            <span className={styles.titleIcon}>📊</span>
            Analysis Dashboard
          </h1>
          <div className={styles.statusBadge}>
            {getOrchestrationStatus(result)}
          </div>
        </div>
      </div>

      <div className={styles.originalPromptCard}>
        <h4 className={styles.originalPromptTitle}>
          <span className={styles.promptIcon}>📝</span>
          Original Prompt
        </h4>
        <div className={styles.originalPromptText}>{prompt}</div>
      </div>

      <div className={styles.dashboardContent}>
        {renderLiveSteps()}
        {renderValidationResult()}
        {renderExtractedContext()}
        {renderImprovedPrompt()}

        {result.errors && result.errors.length > 0 && (
          <div className={styles.errorsCard}>
            <h3 className={styles.errorsTitle}>
              <span className={styles.errorIcon}>⚠️</span>
              Errors Encountered
            </h3>
            <ul className={styles.errorsList}>
              {result.errors.map((error, idx) => (
                <li key={idx} className={styles.errorItem}>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
