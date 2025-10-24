import { useState } from "react";
import {
  validatePrompt,
  extractContext,
  generateImprovedPrompt,
} from "../services/llmClient";
import { PromptValidationResult } from "../types";
import { ExtractedContext, ImprovedPromptSuggestion } from "../types/context";
import {
  updateUserContext,
  getContextSummary,
  getUserContext,
  clearUserContext,
} from "../services/contextStorage";
import SettingsPage from "./SettingsPage";
import styles from "./Home.module.css";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<PromptValidationResult | null>(null);
  const [extractedContext, setExtractedContext] =
    useState<ExtractedContext | null>(null);
  const [improvedPrompt, setImprovedPrompt] =
    useState<ImprovedPromptSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [extractingContext, setExtractingContext] = useState(false);
  const [generatingImprovement, setGeneratingImprovement] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(false);

  const handleValidate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to validate");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setExtractedContext(null);
    setImprovedPrompt(null);

    try {
      // Step 1: Validate the prompt
      const validationResult = await validatePrompt(prompt);
      setResult(validationResult);

      // Step 2: Extract context from the prompt
      setExtractingContext(true);
      try {
        const context = await extractContext(prompt);
        setExtractedContext(context);

        // Step 3: Update stored user context
        await updateUserContext(context, prompt, validationResult);
      } catch (ctxError) {
        console.error("Context extraction failed:", ctxError);
        // Don't fail the whole validation if context extraction fails
      } finally {
        setExtractingContext(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImprovedPrompt = async () => {
    if (!prompt) return;

    setGeneratingImprovement(true);
    setError("");

    try {
      const contextSummary = await getContextSummary();
      const improvement = await generateImprovedPrompt(prompt, contextSummary);
      setImprovedPrompt(improvement);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate improved prompt"
      );
    } finally {
      setGeneratingImprovement(false);
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

  const renderExtractedContext = () => {
    if (!extractedContext) return null;

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
          Extracted Context
          <span className={styles.confidenceBadge}>
            Confidence:{" "}
            {((extractedContext.confidenceScore || 0) * 100).toFixed(0)}%
          </span>
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
                        {Array.isArray(value) ? value.length + " tasks" : value}
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
                        <strong>{key}:</strong> {value}
                      </li>
                    )
                )}
              </ul>
            </div>
          )}

          {extractedContext.tonePersonality && (
            <div className={styles.contextSection}>
              <h4>🎨 Tone & Style</h4>
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
                    value &&
                    Array.isArray(value) &&
                    value.length > 0 && (
                      <li key={key}>
                        <strong>{key}:</strong> {value.join(", ")}
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
    if (!improvedPrompt) return null;

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
          <div className={styles.improvementSection}>
            <h4>📝 Improvements Made:</h4>
            <ul>
              {improvedPrompt.improvements.map((improvement, idx) => (
                <li key={idx}>{improvement}</li>
              ))}
            </ul>
          </div>

          <div className={styles.improvementSection}>
            <h4>💡 Reasoning:</h4>
            <p>{improvedPrompt.reasoning}</p>
          </div>

          {improvedPrompt.contextUsed &&
            improvedPrompt.contextUsed.length > 0 && (
              <div className={styles.improvementSection}>
                <h4>🧩 Context Used:</h4>
                <ul>
                  {improvedPrompt.contextUsed.map((ctx, idx) => (
                    <li key={idx}>{ctx}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>

        <button
          onClick={() => {
            setPrompt(improvedPrompt.improvedPrompt);
            setImprovedPrompt(null);
            setResult(null);
            setExtractedContext(null);
          }}
          className={styles.useImprovedButton}
        >
          ✅ Use This Prompt
        </button>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

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
      <div className={styles.resultsContainer}>
        <div className={styles.resultCard}>
          <h2 className={styles.resultTitle}>
            <span className={styles.resultIcon}>📊</span>
            Validation Results
          </h2>

          <div className={styles.resultGrid}>
            {fields.map(({ key, label, icon }) => (
              <div
                key={key}
                className={`${styles.resultItem} ${
                  result[
                    key as keyof Omit<PromptValidationResult, "overall_clarity">
                  ]
                    ? styles.success
                    : styles.error
                }`}
              >
                <span className={styles.criteriaIcon}>{icon}</span>
                <div className={styles.criteriaContent}>
                  <span className={styles.criteriaLabel}>{label}</span>
                  <span className={styles.criteriaValue}>
                    {result[
                      key as keyof Omit<
                        PromptValidationResult,
                        "overall_clarity"
                      >
                    ]
                      ? "✓ Yes"
                      : "✗ No"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.claritySection}>
            <h3 className={styles.clarityTitle}>
              <span className={styles.clarityIcon}>💡</span>
              Overall Clarity
            </h3>
            <p className={styles.clarityText}>{result.overall_clarity}</p>
          </div>

          <div className={styles.actionButtons}>
            <button
              onClick={handleGenerateImprovedPrompt}
              disabled={generatingImprovement}
              className={styles.improveButton}
            >
              {generatingImprovement ? (
                <>
                  <span className={styles.spinner}>⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>✨</span>
                  Generate Improved Prompt
                </>
              )}
            </button>

            <button
              onClick={() => setResult(null)}
              className={styles.resetButton}
            >
              🔄 Validate Another Prompt
            </button>
          </div>
        </div>

        {extractingContext && (
          <div className={styles.loadingContext}>
            <span className={styles.spinner}>⏳</span>
            Extracting context...
          </div>
        )}

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
              <span className={styles.titleIcon}>✨</span>
              Prompt Validator
            </h1>
            <p className={styles.subtitle}>
              Analyze, improve, and learn from your prompts with AI-powered
              validation
            </p>
          </div>
          <div className={styles.headerButtons}>
            <button
              onClick={() => setShowContextPanel(true)}
              className={styles.contextButton}
              title="View Stored Context"
            >
              <span className={styles.settingsIcon}>🧩</span>
              My Context
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={styles.settingsButton}
              title="Settings"
            >
              <span className={styles.settingsIcon}>⚙️</span>
              Settings
            </button>
          </div>
        </div>

        {!result ? (
          <div className={styles.inputCard}>
            <label className={styles.inputLabel} htmlFor="prompt">
              <span className={styles.labelIcon}>📝</span>
              Enter your prompt to validate
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type or paste your prompt here...

Example: You are an expert code reviewer. Analyze the following code and provide structured feedback with clear explanations..."
              rows={10}
              className={styles.textarea}
            />

            {error && (
              <div className={styles.errorBox}>
                <span className={styles.errorIcon}>❌</span>
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleValidate}
              disabled={loading}
              className={styles.validateButton}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}>⏳</span>
                  Validating...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>🚀</span>
                  Validate & Extract Context
                </>
              )}
            </button>

            <div className={styles.infoBox}>
              <p className={styles.infoTitle}>
                <span className={styles.infoIcon}>ℹ️</span>
                What happens when you validate?
              </p>
              <ul className={styles.infoList}>
                <li>🧠 Validates prompt quality (8 criteria)</li>
                <li>🧩 Extracts context (personal, professional, task info)</li>
                <li>💾 Stores learning for future improvements</li>
                <li>✨ Suggests improved version based on your history</li>
              </ul>
            </div>
          </div>
        ) : (
          renderResult()
        )}
      </div>

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}

      {showContextPanel && (
        <ContextPanel
          onClose={() => setShowContextPanel(false)}
          onClear={handleClearContext}
        />
      )}
    </div>
  );
}

// Context Panel Component
function ContextPanel({
  onClose,
  onClear,
}: {
  onClose: () => void;
  onClear: () => void;
}) {
  const [context, setContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useState(() => {
    getUserContext().then((ctx) => {
      setContext(ctx);
      setLoading(false);
    });
  });

  if (loading) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div
          className={styles.contextPanelContainer}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.loading}>Loading context...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.contextPanelContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.panelHeader}>
          <h2>🧩 Your Stored Context</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <div className={styles.panelContent}>
          <div className={styles.contextStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>
                {context?.metadata?.length || 0}
              </span>
              <span className={styles.statLabel}>Prompts Analyzed</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>
                {context?.professionalInfo?.techStack?.length || 0}
              </span>
              <span className={styles.statLabel}>Technologies</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>
                {context?.externalContext?.tools?.length || 0}
              </span>
              <span className={styles.statLabel}>Tools</span>
            </div>
          </div>

          <pre className={styles.contextData}>
            {JSON.stringify(context, null, 2)}
          </pre>
        </div>

        <div className={styles.panelActions}>
          <button onClick={onClear} className={styles.clearButton}>
            🗑️ Clear All Context
          </button>
          <button onClick={onClose} className={styles.cancelButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
