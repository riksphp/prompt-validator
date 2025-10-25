import { useState } from "react";
import {
  orchestratePromptProcessing,
  OrchestrationResult,
  OrchestrationStep,
} from "../services/intelligentOrchestrator";
import { clearUserContext } from "../services/contextStorage";
import { type PromptHistoryEntry } from "../services/promptHistoryStorage";
import SettingsPage from "./SettingsPage";
import HistoryPanel from "./HistoryPanel";
import ResultsDashboard from "./ResultsDashboard";
import styles from "./Home.module.css";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [orchestrationResult, setOrchestrationResult] =
    useState<OrchestrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>("");
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
    setCurrentStep("🧠 Starting intelligent analysis...");

    try {
      // Process with real-time step updates
      const result = await orchestratePromptProcessing(
        prompt,
        (step: OrchestrationStep) => {
          setCurrentStep(
            `Processing: ${step.action} - ${step.decision.reasoning}`
          );
        }
      );

      setOrchestrationResult(result);
      setCurrentStep("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setCurrentStep("");
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
  };

  const handleUseImprovedPrompt = (improvedPrompt: string) => {
    setPrompt(improvedPrompt);
    setOrchestrationResult(null);
  };

  const handleBackToInput = () => {
    setOrchestrationResult(null);
    setCurrentStep("");
    setError("");
  };

  // If we have results, show the dashboard
  if (orchestrationResult) {
    return (
      <ResultsDashboard
        prompt={prompt}
        result={orchestrationResult}
        onBack={handleBackToInput}
        onUseImprovedPrompt={handleUseImprovedPrompt}
      />
    );
  }

  // Otherwise, show the input page
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

        <div className={styles.inputCard}>
          <label className={styles.inputLabel} htmlFor="prompt">
            <span className={styles.labelIcon}>📝</span>
            Enter your prompt for intelligent analysis
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type or paste your prompt here...

Example: I work with React and TypeScript. Help me build a user authentication system with proper error handling.

The AI will automatically:
• Decide what to analyze
• Extract relevant context
• Validate prompt quality
• Generate improvements
• Store for future reference"
            rows={12}
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
                Intelligent Analysis
              </>
            )}
          </button>

          <div className={styles.infoBox}>
            <p className={styles.infoTitle}>
              <span className={styles.infoIcon}>🤖</span>
              How Intelligent Analysis Works
            </p>
            <ul className={styles.infoList}>
              <li>🧠 LLM Router decides the first action</li>
              <li>✅ Executes that action (e.g., validate)</li>
              <li>🔄 Calls router again for next decision</li>
              <li>🎯 Router sees what's already been done</li>
              <li>✨ Generates improvement at the end</li>
              <li>💾 All context and prompts saved automatically</li>
              <li>📜 View past prompts in History</li>
            </ul>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>💾</span>
              <h3>Persistent Storage</h3>
              <p>All context accumulates over time in localStorage</p>
            </div>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>📜</span>
              <h3>Prompt History</h3>
              <p>Every prompt saved with full analysis and timestamps</p>
            </div>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>🎯</span>
              <h3>Smart Routing</h3>
              <p>LLM decides which actions to take for each prompt</p>
            </div>
            <div className={styles.featureCard}>
              <span className={styles.featureIcon}>✨</span>
              <h3>Auto Improvements</h3>
              <p>Enhanced prompts generated using accumulated context</p>
            </div>
          </div>
        </div>
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
