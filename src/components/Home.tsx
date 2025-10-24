import { useState } from "react";
import { validatePrompt } from "../services/llmClient";
import { PromptValidationResult } from "../types";
import SettingsPage from "./SettingsPage";
import styles from "./Home.module.css";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<PromptValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  const handleValidate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to validate");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const validationResult = await validatePrompt(prompt);
      setResult(validationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
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
                    key as keyof Omit<PromptValidationResult, "overall_clarity">
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

        <button onClick={() => setResult(null)} className={styles.resetButton}>
          🔄 Validate Another Prompt
        </button>
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
              Analyze and improve your prompts with AI-powered validation
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className={styles.settingsButton}
            title="Settings"
          >
            <span className={styles.settingsIcon}>⚙️</span>
            Settings
          </button>
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
                  Validate Prompt
                </>
              )}
            </button>

            <div className={styles.infoBox}>
              <p className={styles.infoTitle}>
                <span className={styles.infoIcon}>ℹ️</span>
                What gets evaluated?
              </p>
              <ul className={styles.infoList}>
                <li>🧠 Explicit reasoning instructions</li>
                <li>📋 Structured output format</li>
                <li>🔧 Tool separation clarity</li>
                <li>💬 Conversation loop support</li>
                <li>📖 Instructional framing quality</li>
                <li>✅ Internal self-checks</li>
                <li>🎯 Reasoning type awareness</li>
                <li>🛡️ Error handling & fallbacks</li>
              </ul>
            </div>
          </div>
        ) : (
          renderResult()
        )}
      </div>

      {showSettings && <SettingsPage onClose={() => setShowSettings(false)} />}
    </div>
  );
}
