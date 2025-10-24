export interface PersonalInfo {
  name?: string;
  location?: string;
  age?: string;
  goals?: string[];
  interests?: string[];
  languagePreference?: string;
}

export interface ProfessionalInfo {
  jobTitle?: string;
  domain?: string;
  company?: string;
  ongoingProjects?: string[];
  techStack?: string[];
  experience?: string;
}

export interface TaskContext {
  currentTask?: string;
  recentTasks?: string[];
  taskHistory?: Array<{
    task: string;
    timestamp: string;
  }>;
}

export interface Intent {
  primaryIntent?: string;
  intentType?: "question" | "instruction" | "creative" | "code" | "analysis";
  expectedOutput?: string;
}

export interface TonePersonality {
  tone?: "concise" | "detailed" | "casual" | "professional" | "technical";
  style?: string;
  verbosity?: "brief" | "moderate" | "verbose";
  preferences?: string[];
}

export interface ExternalContext {
  tools?: string[];
  apis?: string[];
  fileNames?: string[];
  urls?: string[];
  frameworks?: string[];
  libraries?: string[];
}

export interface PromptMetadata {
  tags?: string[];
  promptType?: "question" | "instruction" | "creative" | "code";
  confidenceScore?: number;
  timestamp: string;
  originalPrompt: string;
  validationResult?: any;
}

export interface UserContext {
  personalInfo: PersonalInfo;
  professionalInfo: ProfessionalInfo;
  taskContext: TaskContext;
  intent: Intent;
  tonePersonality: TonePersonality;
  externalContext: ExternalContext;
  metadata: PromptMetadata[];
  lastUpdated: string;
}

export interface ExtractedContext {
  personalInfo?: Partial<PersonalInfo>;
  professionalInfo?: Partial<ProfessionalInfo>;
  taskContext?: Partial<TaskContext>;
  intent?: Partial<Intent>;
  tonePersonality?: Partial<TonePersonality>;
  externalContext?: Partial<ExternalContext>;
  tags?: string[];
  promptType?: string;
  confidenceScore?: number;
}

export interface ImprovedPromptSuggestion {
  improvedPrompt: string;
  improvements: string[];
  reasoning: string;
  contextUsed: string[];
}
