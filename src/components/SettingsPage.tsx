import { useState, useEffect } from "react";
import {
  getAISettings,
  saveAISettings,
  getProviderDefaults,
  type AISettings,
} from "../services/aiSettingsStorage";
import { useTheme } from "../hooks/useTheme";
import styles from "./SettingsPage.module.css";

interface SettingsPageProps {
  onClose: () => void;
}

const SettingsPage = ({ onClose }: SettingsPageProps) => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AISettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "success" | "error" | null
  >(null);
  const [connectionMessage, setConnectionMessage] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const currentSettings = await getAISettings();
      setSettings(currentSettings);
    } catch (error) {
      console.error("Failed to load AI settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveAISettings(settings);
      alert("Settings saved successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleProviderChange(provider: string) {
    const defaults = getProviderDefaults(provider);
    setSettings((prev) => ({
      ...prev,
      provider: provider as AISettings["provider"],
      ...defaults,
    }));
  }

  function handleInputChange(field: keyof AISettings, value: string) {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function testConnection() {
    if (!settings.apiKey || !settings.apiUrl) {
      setConnectionStatus("error");
      setConnectionMessage(
        "Please fill in all required fields before testing."
      );
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);
    setConnectionMessage("");

    try {
      // Save current settings temporarily to test them
      await saveAISettings(settings);

      // Import the API function dynamically to test with current settings
      const { validatePrompt } = await import("../services/llmClient");

      const testPrompt = 'Respond with just "Connection successful"';
      await validatePrompt(testPrompt);

      setConnectionStatus("success");
      setConnectionMessage(
        "Connection successful! Your AI settings are working correctly."
      );
    } catch (error) {
      setConnectionStatus("error");
      setConnectionMessage(
        `Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setTestingConnection(false);
    }
  }

  const providers = [
    { value: "gemini", label: "Google Gemini" },
    { value: "openai", label: "OpenAI" },
    { value: "groq", label: "Groq" },
    { value: "custom", label: "Custom API" },
  ];

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.container}>
          <div className={styles.loading}>
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={onClose}>
            ← Back
          </button>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>AI Settings</h1>
            <p className={styles.subtitle}>
              Configure your AI model for prompt analysis
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>

        <div className={styles.settingsForm}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Provider Configuration</h3>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="provider">
                AI Provider
              </label>
              <select
                id="provider"
                className={styles.select}
                value={settings.provider || "gemini"}
                onChange={(e) => handleProviderChange(e.target.value)}
              >
                {providers.map((provider) => (
                  <option key={provider.value} value={provider.value}>
                    {provider.label}
                  </option>
                ))}
              </select>
              <p className={styles.fieldHint}>
                Choose your preferred AI provider
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="apiKey">
                API Key <span className={styles.required}>*</span>
              </label>
              <input
                id="apiKey"
                type="password"
                className={styles.input}
                value={settings.apiKey || ""}
                onChange={(e) => handleInputChange("apiKey", e.target.value)}
                placeholder={
                  settings.provider === "openai"
                    ? "sk-..."
                    : settings.provider === "groq"
                    ? "gsk_..."
                    : settings.provider === "gemini"
                    ? "AIza..."
                    : "Your API key"
                }
              />
              <p className={styles.fieldHint}>
                Your API key for authentication
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="apiUrl">
                API URL <span className={styles.required}>*</span>
              </label>
              <input
                id="apiUrl"
                type="url"
                className={styles.input}
                value={settings.apiUrl || ""}
                onChange={(e) => handleInputChange("apiUrl", e.target.value)}
                placeholder="https://api.example.com/v1/chat/completions"
              />
              <p className={styles.fieldHint}>
                The API endpoint URL for your provider
              </p>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="modelName">
                Model Name
              </label>
              <input
                id="modelName"
                type="text"
                className={styles.input}
                value={settings.modelName || ""}
                onChange={(e) => handleInputChange("modelName", e.target.value)}
                placeholder={
                  settings.provider === "openai"
                    ? "gpt-4o-mini"
                    : settings.provider === "groq"
                    ? "llama-3.1-8b-instant"
                    : settings.provider === "gemini"
                    ? "gemini-2.0-flash"
                    : "model-name"
                }
              />
              <p className={styles.fieldHint}>
                Specific model to use (optional)
              </p>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Connection Test</h3>
            <p className={styles.sectionDescription}>
              Verify your configuration is working correctly
            </p>

            <div className={styles.testSection}>
              <button
                className={styles.testButton}
                onClick={testConnection}
                disabled={
                  testingConnection || !settings.apiKey || !settings.apiUrl
                }
              >
                {testingConnection ? "Testing..." : "Test Connection"}
              </button>

              {connectionStatus && (
                <div
                  className={`${styles.connectionResult} ${styles[connectionStatus]}`}
                >
                  <span className={styles.statusMessage}>
                    {connectionMessage}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.saveButton}
              onClick={handleSave}
              disabled={saving || !settings.apiKey || !settings.apiUrl}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>

            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.providerHelp}>
            <h4>Get API Keys</h4>
            <ul>
              <li>
                <strong>Google Gemini:</strong>{" "}
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google AI Studio
                </a>
              </li>
              <li>
                <strong>OpenAI:</strong>{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  OpenAI Platform
                </a>
              </li>
              <li>
                <strong>Groq:</strong>{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Groq Console
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
