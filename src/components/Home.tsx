import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  orchestratePromptProcessing,
  OrchestrationResult,
  OrchestrationStep,
} from "../services/intelligentOrchestrator";
import { clearUserContext } from "../services/contextStorage";
import { type PromptHistoryEntry } from "../services/promptHistoryStorage";
import { useTheme } from "../hooks/useTheme";
import { circuitBreaker, CircuitBreakerOpenError } from "../lib/circuitBreaker";
import SettingsPage from "./SettingsPage";
import HistoryPanel from "./HistoryPanel";
import ResultsDashboard from "./ResultsDashboard";
import styles from "./Home.module.css";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [orchestrationResult, setOrchestrationResult] =
    useState<OrchestrationResult | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // 🔄 React Query Mutation with automatic retry and exponential backoff
  const orchestrationMutation = useMutation({
    mutationFn: async (promptText: string) => {
      // 🚫 Check circuit breaker BEFORE making any calls
      if (circuitBreaker.isCircuitOpen()) {
        const remainingTime = circuitBreaker.getRemainingCooldown();
        throw new CircuitBreakerOpenError(remainingTime);
      }

      setCurrentStep("🧠 Starting intelligent analysis...");

      return await orchestratePromptProcessing(
        promptText,
        (step: OrchestrationStep) => {
          setCurrentStep(
            `Processing: ${step.action} - ${step.decision.reasoning}`
          );
        }
      );
    },
    onSuccess: (result) => {
      setOrchestrationResult(result);
      setError("");
      setCurrentStep("");
    },
    onError: (err: any) => {
      // Handle circuit breaker errors
      if (err instanceof CircuitBreakerOpenError) {
        setError(
          `🚫 Rate limit protection active. Too many requests. Please wait ${err.remainingCooldown} seconds before trying again.`
        );
        setCurrentStep("");
        return;
      }

      const status = err?.response?.status || err?.status;

      if (status === 429) {
        const cbState = circuitBreaker.getState();
        if (cbState.isOpen) {
          const remaining = circuitBreaker.getRemainingCooldown();
          setError(
            `🚫 Rate limit reached. Circuit breaker active. Wait ${remaining}s before trying again.`
          );
        } else {
          setError(
            `⏳ Rate limit hit (${cbState.totalRetries}/3 retries). Retrying with exponential backoff...`
          );
        }
      } else if (status === 503) {
        setError("⏳ Service overloaded. Retrying...");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }

      setCurrentStep("");
    },
  });

  const handleIntelligentProcessing = () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to analyze");
      return;
    }

    // Check circuit breaker before submitting
    if (circuitBreaker.isCircuitOpen()) {
      const remainingTime = circuitBreaker.getRemainingCooldown();
      setError(
        `🚫 Rate limit protection active. Please wait ${remainingTime} seconds before trying again.`
      );
      return;
    }

    setError("");
    setOrchestrationResult(null);
    orchestrationMutation.mutate(prompt);
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
            <h1 className={styles.title}>Prompt Validator</h1>
            <p className={styles.subtitle}>
              Sequential AI-powered prompt analysis
            </p>
          </div>
          <div className={styles.headerButtons}>
            <button
              onClick={toggleTheme}
              className={styles.themeToggle}
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={styles.button}
            >
              History
            </button>
            <button onClick={handleClearContext} className={styles.button}>
              Clear Context
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className={styles.button}
            >
              Settings
            </button>
          </div>
        </div>

        <div className={styles.inputCard}>
          <label className={styles.inputLabel} htmlFor="prompt">
            Enter Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type or paste your prompt here...

Example: I work with React and TypeScript. Help me build a user authentication system with proper error handling.

The AI will automatically decide what to analyze, extract context, validate quality, and generate improvements."
            rows={12}
            className={styles.textarea}
          />

          {error && <div className={styles.error}>{error}</div>}

          {currentStep && orchestrationMutation.isPending && (
            <div className={styles.status}>{currentStep}</div>
          )}

          <button
            onClick={handleIntelligentProcessing}
            disabled={orchestrationMutation.isPending}
            className={styles.primaryButton}
          >
            {orchestrationMutation.isPending
              ? "Processing..."
              : "Analyze Prompt"}
          </button>

          <div className={styles.infoSection}>
            <h3>How It Works</h3>
            <ul>
              <li>LLM router decides each action sequentially</li>
              <li>Executes actions and extracts data in one call</li>
              <li>Validates prompt quality and structure</li>
              <li>Generates improved version with context</li>
              <li>Saves everything to local storage</li>
            </ul>
          </div>

          <div className={styles.features}>
            <div className={styles.feature}>
              <h4>Persistent Storage</h4>
              <p>Context accumulates over time</p>
            </div>
            <div className={styles.feature}>
              <h4>Prompt History</h4>
              <p>Full analysis with timestamps</p>
            </div>
            <div className={styles.feature}>
              <h4>Smart Routing</h4>
              <p>AI decides optimal actions</p>
            </div>
            <div className={styles.feature}>
              <h4>Auto Improvements</h4>
              <p>Context-aware enhancements</p>
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
