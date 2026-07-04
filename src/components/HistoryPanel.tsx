import { useState, useEffect } from "react";
import {
  getPromptHistory,
  deletePromptFromHistory,
  clearPromptHistory,
  searchPrompts,
  getAllTags,
  getHistoryStats,
  exportHistory,
  type PromptHistoryEntry,
} from "../services/promptHistoryStorage";
import styles from "./HistoryPanel.module.css";

interface HistoryPanelProps {
  onClose: () => void;
  onSelectPrompt?: (entry: PromptHistoryEntry) => void;
}

export default function HistoryPanel({
  onClose,
  onSelectPrompt,
}: HistoryPanelProps) {
  const [history, setHistory] = useState<PromptHistoryEntry[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PromptHistoryEntry[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
    loadTags();
    loadStats();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchQuery, selectedTag]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await getPromptHistory();
    setHistory(data);
    setFilteredHistory(data);
    setLoading(false);
  };

  const loadTags = async () => {
    const tags = await getAllTags();
    setAllTags(tags);
  };

  const loadStats = async () => {
    const data = await getHistoryStats();
    setStats(data);
  };

  const filterHistory = async () => {
    let filtered = history;

    if (searchQuery) {
      filtered = await searchPrompts(searchQuery);
    }

    if (selectedTag) {
      filtered = filtered.filter((entry) => entry.tags?.includes(selectedTag));
    }

    setFilteredHistory(filtered);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this prompt from history?")) {
      await deletePromptFromHistory(id);
      await loadHistory();
      await loadTags();
      await loadStats();
    }
  };

  const handleClearAll = async () => {
    if (
      confirm(
        "Clear ALL prompt history? This cannot be undone.\n\nNote: User context will be preserved."
      )
    ) {
      await clearPromptHistory();
      await loadHistory();
      await loadTags();
      await loadStats();
    }
  };

  const handleExport = async () => {
    const json = await exportHistory();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompt-history-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return formatDate(timestamp);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>
              <span className={styles.titleIcon}>📜</span>
              Prompt History
            </h2>
            {stats && (
              <div className={styles.statsBar}>
                <span className={styles.stat}>
                  <span className={styles.statIcon}>📝</span>
                  {stats.totalPrompts} prompts
                </span>
                <span className={styles.stat}>
                  <span className={styles.statIcon}>✅</span>
                  {stats.totalValidated} validated
                </span>
                <span className={styles.stat}>
                  <span className={styles.statIcon}>✨</span>
                  {stats.totalImproved} improved
                </span>
              </div>
            )}
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchRow}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search prompts..."
              className={styles.searchInput}
            />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className={styles.tagFilter}
            >
              <option value="">All Tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  🏷️ {tag}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.actionButtons}>
            <button onClick={handleExport} className={styles.actionButton}>
              <span className={styles.buttonIcon}>💾</span>
              Export
            </button>
            <button
              onClick={handleClearAll}
              className={`${styles.actionButton} ${styles.dangerButton}`}
            >
              <span className={styles.buttonIcon}>🗑️</span>
              Clear All
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>
              <span className={styles.spinner}>⏳</span>
              Loading history...
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📭</span>
              <p className={styles.emptyText}>
                {searchQuery || selectedTag
                  ? "No prompts found matching your filters"
                  : "No prompt history yet"}
              </p>
              <p className={styles.emptySubtext}>
                Analyze some prompts to build your history!
              </p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {filteredHistory.map((entry) => (
                <div
                  key={entry.id}
                  className={`${styles.historyItem} ${
                    expandedId === entry.id ? styles.expanded : ""
                  }`}
                >
                  <div className={styles.itemHeader}>
                    <div className={styles.itemMeta}>
                      <span className={styles.timestamp}>
                        {formatRelativeTime(entry.timestamp)}
                      </span>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className={styles.itemTags}>
                          {entry.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                          {entry.tags.length > 3 && (
                            <span className={styles.tagMore}>
                              +{entry.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === entry.id ? null : entry.id
                          )
                        }
                        className={styles.expandButton}
                      >
                        {expandedId === entry.id ? "▲" : "▼"}
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className={styles.deleteButton}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div className={styles.promptPreview}>
                    {entry.originalPrompt.length > 150
                      ? entry.originalPrompt.slice(0, 150) + "..."
                      : entry.originalPrompt}
                  </div>

                  {expandedId === entry.id && (
                    <div className={styles.itemDetails}>
                      <div className={styles.detailSection}>
                        <h4>📝 Original Prompt</h4>
                        <p className={styles.fullPrompt}>
                          {entry.originalPrompt}
                        </p>
                      </div>

                      {entry.validationResult && (
                        <div className={styles.detailSection}>
                          <h4>✅ Validation Result</h4>
                          <div className={styles.validationGrid}>
                            {Object.entries(entry.validationResult)
                              .filter(([key]) => key !== "overall_clarity")
                              .map(([key, value]) => (
                                <div
                                  key={key}
                                  className={`${styles.validationItem} ${
                                    value ? styles.pass : styles.fail
                                  }`}
                                >
                                  {value ? "✓" : "✗"} {key.replace(/_/g, " ")}
                                </div>
                              ))}
                          </div>
                          {entry.validationResult.overall_clarity && (
                            <p className={styles.clarity}>
                              <strong>Overall:</strong>{" "}
                              {entry.validationResult.overall_clarity}
                            </p>
                          )}
                        </div>
                      )}

                      {entry.extractedContext && (
                        <div className={styles.detailSection}>
                          <h4>🧩 Extracted Context</h4>
                          <pre className={styles.contextJson}>
                            {JSON.stringify(entry.extractedContext, null, 2)}
                          </pre>
                        </div>
                      )}

                      {entry.improvedPrompt && (
                        <div className={styles.detailSection}>
                          <h4>✨ Improved Prompt</h4>
                          <p className={styles.improvedPrompt}>
                            {entry.improvedPrompt.improvedPrompt}
                          </p>
                          {entry.improvedPrompt.improvements && (
                            <div className={styles.improvements}>
                              <strong>Improvements:</strong>
                              <ul>
                                {entry.improvedPrompt.improvements.map(
                                  (imp, idx) => (
                                    <li key={idx}>{imp}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                          {onSelectPrompt && (
                            <button
                              onClick={() => onSelectPrompt(entry)}
                              className={styles.useButton}
                            >
                              ✅ Use This Prompt
                            </button>
                          )}
                        </div>
                      )}

                      {entry.routerDecisions &&
                        entry.routerDecisions.length > 0 && (
                          <div className={styles.detailSection}>
                            <h4>🧠 Router Decisions</h4>
                            <div className={styles.decisionsTimeline}>
                              {entry.routerDecisions.map((decision, idx) => (
                                <div key={idx} className={styles.decisionItem}>
                                  <div className={styles.decisionNumber}>
                                    {idx + 1}
                                  </div>
                                  <div className={styles.decisionContent}>
                                    <div className={styles.decisionAction}>
                                      {decision.action}
                                    </div>
                                    <div className={styles.decisionReasoning}>
                                      {decision.reasoning}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <div className={styles.fullTimestamp}>
                        <span className={styles.timestampIcon}>🕒</span>
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
