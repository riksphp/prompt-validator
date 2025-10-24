import {
  UserContext,
  ExtractedContext,
  PromptMetadata,
} from "../types/context";

const CONTEXT_STORAGE_KEY = "userContext";

function hasChromeStorage(): boolean {
  return Boolean(
    window.chrome && window.chrome.storage && window.chrome.storage.local
  );
}

export async function getUserContext(): Promise<UserContext> {
  const defaultContext: UserContext = {
    personalInfo: {},
    professionalInfo: {},
    taskContext: { recentTasks: [], taskHistory: [] },
    intent: {},
    tonePersonality: {},
    externalContext: {
      tools: [],
      apis: [],
      fileNames: [],
      urls: [],
      frameworks: [],
      libraries: [],
    },
    metadata: [],
    lastUpdated: new Date().toISOString(),
  };

  try {
    if (hasChromeStorage()) {
      return new Promise((resolve) => {
        window.chrome!.storage!.local.get(
          [CONTEXT_STORAGE_KEY],
          (items: Record<string, unknown>) => {
            const context = items?.[CONTEXT_STORAGE_KEY] as UserContext;
            resolve(context || defaultContext);
          }
        );
      });
    }
    const raw = localStorage.getItem(CONTEXT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultContext;
  } catch {
    return defaultContext;
  }
}

export async function saveUserContext(context: UserContext): Promise<void> {
  const withTimestamp: UserContext = {
    ...context,
    lastUpdated: new Date().toISOString(),
  };

  try {
    if (hasChromeStorage()) {
      await new Promise<void>((resolve) => {
        window.chrome!.storage!.local.set(
          { [CONTEXT_STORAGE_KEY]: withTimestamp },
          () => resolve()
        );
      });
      return;
    }
    localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(withTimestamp));
  } catch (error) {
    console.error("Failed to save user context:", error);
  }
}

export async function updateUserContext(
  extracted: ExtractedContext,
  originalPrompt: string,
  validationResult?: any
): Promise<UserContext> {
  const currentContext = await getUserContext();

  // Merge personal info
  if (extracted.personalInfo) {
    currentContext.personalInfo = {
      ...currentContext.personalInfo,
      ...extracted.personalInfo,
      goals: mergeArrays(
        currentContext.personalInfo.goals,
        extracted.personalInfo.goals
      ),
      interests: mergeArrays(
        currentContext.personalInfo.interests,
        extracted.personalInfo.interests
      ),
    };
  }

  // Merge professional info
  if (extracted.professionalInfo) {
    currentContext.professionalInfo = {
      ...currentContext.professionalInfo,
      ...extracted.professionalInfo,
      ongoingProjects: mergeArrays(
        currentContext.professionalInfo.ongoingProjects,
        extracted.professionalInfo.ongoingProjects
      ),
      techStack: mergeArrays(
        currentContext.professionalInfo.techStack,
        extracted.professionalInfo.techStack
      ),
    };
  }

  // Update task context
  if (extracted.taskContext?.currentTask) {
    const taskHistory = currentContext.taskContext.taskHistory || [];
    taskHistory.push({
      task: extracted.taskContext.currentTask,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 20 tasks
    const recentHistory = taskHistory.slice(-20);

    currentContext.taskContext = {
      currentTask: extracted.taskContext.currentTask,
      recentTasks: recentHistory.map((t) => t.task).slice(-5),
      taskHistory: recentHistory,
    };
  }

  // Update intent (keep most recent)
  if (extracted.intent) {
    currentContext.intent = {
      ...currentContext.intent,
      ...extracted.intent,
    };
  }

  // Update tone/personality
  if (extracted.tonePersonality) {
    currentContext.tonePersonality = {
      ...currentContext.tonePersonality,
      ...extracted.tonePersonality,
      preferences: mergeArrays(
        currentContext.tonePersonality.preferences,
        extracted.tonePersonality.preferences
      ),
    };
  }

  // Merge external context
  if (extracted.externalContext) {
    currentContext.externalContext = {
      tools: mergeArrays(
        currentContext.externalContext.tools,
        extracted.externalContext.tools
      ),
      apis: mergeArrays(
        currentContext.externalContext.apis,
        extracted.externalContext.apis
      ),
      fileNames: mergeArrays(
        currentContext.externalContext.fileNames,
        extracted.externalContext.fileNames
      ),
      urls: mergeArrays(
        currentContext.externalContext.urls,
        extracted.externalContext.urls
      ),
      frameworks: mergeArrays(
        currentContext.externalContext.frameworks,
        extracted.externalContext.frameworks
      ),
      libraries: mergeArrays(
        currentContext.externalContext.libraries,
        extracted.externalContext.libraries
      ),
    };
  }

  // Add metadata
  const metadata: PromptMetadata = {
    tags: extracted.tags || [],
    promptType: (extracted.promptType as any) || "instruction",
    confidenceScore: extracted.confidenceScore || 0.8,
    timestamp: new Date().toISOString(),
    originalPrompt,
    validationResult,
  };

  currentContext.metadata.push(metadata);

  // Keep only last 50 prompts
  if (currentContext.metadata.length > 50) {
    currentContext.metadata = currentContext.metadata.slice(-50);
  }

  await saveUserContext(currentContext);
  return currentContext;
}

export async function clearUserContext(): Promise<void> {
  const defaultContext: UserContext = {
    personalInfo: {},
    professionalInfo: {},
    taskContext: { recentTasks: [], taskHistory: [] },
    intent: {},
    tonePersonality: {},
    externalContext: {
      tools: [],
      apis: [],
      fileNames: [],
      urls: [],
      frameworks: [],
      libraries: [],
    },
    metadata: [],
    lastUpdated: new Date().toISOString(),
  };

  await saveUserContext(defaultContext);
}

// Helper function to merge arrays without duplicates
function mergeArrays(
  existing?: string[],
  newItems?: string[]
): string[] | undefined {
  if (!newItems || newItems.length === 0) return existing;
  if (!existing || existing.length === 0) return newItems;

  const combined = [...existing, ...newItems];
  return Array.from(new Set(combined));
}

export async function getContextSummary(): Promise<string> {
  const context = await getUserContext();
  const parts: string[] = [];

  if (context.personalInfo.name) {
    parts.push(`Name: ${context.personalInfo.name}`);
  }
  if (context.personalInfo.location) {
    parts.push(`Location: ${context.personalInfo.location}`);
  }
  if (context.professionalInfo.jobTitle) {
    parts.push(`Role: ${context.professionalInfo.jobTitle}`);
  }
  if (context.professionalInfo.domain) {
    parts.push(`Domain: ${context.professionalInfo.domain}`);
  }
  if (context.professionalInfo.techStack?.length) {
    parts.push(`Tech Stack: ${context.professionalInfo.techStack.join(", ")}`);
  }
  if (context.taskContext.currentTask) {
    parts.push(`Current Task: ${context.taskContext.currentTask}`);
  }
  if (context.tonePersonality.tone) {
    parts.push(`Preferred Tone: ${context.tonePersonality.tone}`);
  }
  if (context.externalContext.tools?.length) {
    parts.push(`Tools: ${context.externalContext.tools.join(", ")}`);
  }

  return parts.length > 0 ? parts.join("\n") : "No context available yet";
}
