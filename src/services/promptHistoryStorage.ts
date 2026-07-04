import { PromptValidationResult } from "../types";
import { ExtractedContext } from "../types/context";

export interface PromptHistoryEntry {
  id: string;
  timestamp: string;
  originalPrompt: string;
  validationResult?: PromptValidationResult;
  extractedContext?: ExtractedContext;
  improvedPrompt?: {
    improvedPrompt: string;
    improvements: string[];
    reasoning: string;
    contextUsed?: string[];
  };
  routerDecisions?: {
    action: string;
    reasoning: string;
  }[];
  tags?: string[];
}

const PROMPT_HISTORY_KEY = "promptHistory";
const MAX_HISTORY_ENTRIES = 100; // Keep last 100 prompts

function hasChromeStorage(): boolean {
  return Boolean(
    window.chrome && window.chrome.storage && window.chrome.storage.local
  );
}

/**
 * Get all prompt history
 */
export async function getPromptHistory(): Promise<PromptHistoryEntry[]> {
  try {
    if (hasChromeStorage()) {
      return new Promise((resolve) => {
        window.chrome!.storage!.local.get(
          [PROMPT_HISTORY_KEY],
          (items: Record<string, unknown>) => {
            const history =
              (items?.[PROMPT_HISTORY_KEY] as PromptHistoryEntry[]) || [];
            resolve(history);
          }
        );
      });
    }
    const raw = localStorage.getItem(PROMPT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to get prompt history:", error);
    return [];
  }
}

/**
 * Save a new prompt to history
 */
export async function savePromptToHistory(
  entry: Omit<PromptHistoryEntry, "id" | "timestamp">
): Promise<PromptHistoryEntry> {
  const newEntry: PromptHistoryEntry = {
    ...entry,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  try {
    const history = await getPromptHistory();

    // Add new entry at the beginning (most recent first)
    history.unshift(newEntry);

    // Keep only MAX_HISTORY_ENTRIES
    const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);

    if (hasChromeStorage()) {
      await new Promise<void>((resolve) => {
        window.chrome!.storage!.local.set(
          { [PROMPT_HISTORY_KEY]: trimmedHistory },
          () => resolve()
        );
      });
    } else {
      localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(trimmedHistory));
    }

    return newEntry;
  } catch (error) {
    console.error("Failed to save prompt to history:", error);
    return newEntry;
  }
}

/**
 * Get a specific prompt by ID
 */
export async function getPromptById(
  id: string
): Promise<PromptHistoryEntry | null> {
  const history = await getPromptHistory();
  return history.find((entry) => entry.id === id) || null;
}

/**
 * Delete a prompt from history
 */
export async function deletePromptFromHistory(id: string): Promise<void> {
  try {
    const history = await getPromptHistory();
    const filtered = history.filter((entry) => entry.id !== id);

    if (hasChromeStorage()) {
      await new Promise<void>((resolve) => {
        window.chrome!.storage!.local.set(
          { [PROMPT_HISTORY_KEY]: filtered },
          () => resolve()
        );
      });
    } else {
      localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Failed to delete prompt from history:", error);
  }
}

/**
 * Clear all prompt history
 */
export async function clearPromptHistory(): Promise<void> {
  try {
    if (hasChromeStorage()) {
      await new Promise<void>((resolve) => {
        window.chrome!.storage!.local.set({ [PROMPT_HISTORY_KEY]: [] }, () =>
          resolve()
        );
      });
    } else {
      localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error("Failed to clear prompt history:", error);
  }
}

/**
 * Search prompts by text
 */
export async function searchPrompts(
  query: string
): Promise<PromptHistoryEntry[]> {
  const history = await getPromptHistory();
  const lowerQuery = query.toLowerCase();

  return history.filter((entry) => {
    return (
      entry.originalPrompt.toLowerCase().includes(lowerQuery) ||
      entry.improvedPrompt?.improvedPrompt.toLowerCase().includes(lowerQuery) ||
      entry.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  });
}

/**
 * Get prompts by date range
 */
export async function getPromptsByDateRange(
  startDate: Date,
  endDate: Date
): Promise<PromptHistoryEntry[]> {
  const history = await getPromptHistory();

  return history.filter((entry) => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= startDate && entryDate <= endDate;
  });
}

/**
 * Get prompts by tag
 */
export async function getPromptsByTag(
  tag: string
): Promise<PromptHistoryEntry[]> {
  const history = await getPromptHistory();

  return history.filter((entry) => {
    return entry.tags?.includes(tag);
  });
}

/**
 * Get all unique tags from history
 */
export async function getAllTags(): Promise<string[]> {
  const history = await getPromptHistory();
  const allTags = new Set<string>();

  history.forEach((entry) => {
    entry.tags?.forEach((tag) => allTags.add(tag));
  });

  return Array.from(allTags).sort();
}

/**
 * Get statistics about prompt history
 */
export async function getHistoryStats(): Promise<{
  totalPrompts: number;
  totalValidated: number;
  totalImproved: number;
  mostUsedTags: { tag: string; count: number }[];
  oldestPrompt?: string;
  newestPrompt?: string;
}> {
  const history = await getPromptHistory();

  const tagCounts = new Map<string, number>();

  history.forEach((entry) => {
    entry.tags?.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const mostUsedTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    totalPrompts: history.length,
    totalValidated: history.filter((e) => e.validationResult).length,
    totalImproved: history.filter((e) => e.improvedPrompt).length,
    mostUsedTags,
    oldestPrompt: history[history.length - 1]?.timestamp,
    newestPrompt: history[0]?.timestamp,
  };
}

/**
 * Export history as JSON
 */
export async function exportHistory(): Promise<string> {
  const history = await getPromptHistory();
  return JSON.stringify(history, null, 2);
}

/**
 * Import history from JSON
 */
export async function importHistory(jsonString: string): Promise<void> {
  try {
    const imported = JSON.parse(jsonString) as PromptHistoryEntry[];
    const currentHistory = await getPromptHistory();

    // Merge with current history, avoiding duplicates by ID
    const existingIds = new Set(currentHistory.map((e) => e.id));
    const newEntries = imported.filter((e) => !existingIds.has(e.id));

    const merged = [...currentHistory, ...newEntries]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, MAX_HISTORY_ENTRIES);

    if (hasChromeStorage()) {
      await new Promise<void>((resolve) => {
        window.chrome!.storage!.local.set(
          { [PROMPT_HISTORY_KEY]: merged },
          () => resolve()
        );
      });
    } else {
      localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(merged));
    }
  } catch (error) {
    console.error("Failed to import history:", error);
    throw error;
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
