# Prompt Validator - Architecture Documentation

## 📋 Overview

A minimal Chrome Extension and Web App that validates prompts using LLM. Built using architecture patterns from the **base-truths** project with streamlined, focused functionality.

---

## 🏗️ Architecture Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROMPT VALIDATOR SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐      │
│  │    HOME     │────►│ LLM CLIENT  │────►│   STORAGE   │      │
│  │  COMPONENT  │     │  SERVICE    │     │    LAYER    │      │
│  └─────────────┘     └─────────────┘     └─────────────┘      │
│         │                    │                    │            │
│         │                    ▼                    ▼            │
│         │            ┌─────────────┐     ┌─────────────┐      │
│         │            │   GEMINI    │     │  CHROME /   │      │
│         └───────────►│     API     │     │ LOCALSTORAGE│      │
│                      └─────────────┘     └─────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input → Validation Request → LLM Processing → JSON Response → UI Display

1. User enters prompt in textarea
2. Click "Validate Prompt" button
3. LLM Client constructs validation prompt
4. Gemini API analyzes the prompt
5. Response parsed as structured JSON
6. Results displayed with boolean flags + clarity assessment
```

---

## 📁 Project Structure

```
prompt-validator/
│
├── public/
│   ├── manifest.json           # Chrome Extension Manifest V3
│   └── icon128.png             # Extension icon
│
├── src/
│   ├── components/
│   │   └── Home.tsx            # Main UI component
│   │                          # - Input textarea
│   │                          # - Settings modal
│   │                          # - Results display
│   │
│   ├── services/
│   │   └── llmClient.ts        # LLM API integration
│   │                          # - validatePrompt()
│   │                          # - API key management
│   │                          # - Storage abstraction
│   │
│   ├── types/
│   │   ├── index.ts            # Core TypeScript types
│   │   └── chrome.d.ts         # Chrome API type definitions
│   │
│   ├── main.tsx                # Application entry point
│   └── styles.css              # Global Tailwind CSS
│
├── index.html                  # HTML template
├── vite.config.ts             # Vite build configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies & scripts
└── README.md                  # User documentation
```

---

## 🔧 Component Breakdown

### 1. **Home Component** (`src/components/Home.tsx`)

**Responsibility**: Main UI and user interaction

**Features**:

- Input textarea for prompt entry
- Validate button with loading state
- Results display with structured output
- Settings modal for API configuration
- Error handling and user feedback

**State Management**:

```typescript
- prompt: string                    // User input
- result: PromptValidationResult    // LLM response
- loading: boolean                  // Request state
- error: string                     // Error messages
- showSettings: boolean             // Settings modal visibility
- apiKey: string                    // API key (in settings)
- apiUrl: string                    // API URL (in settings)
```

**Key Functions**:

- `handleValidate()` - Calls LLM for validation
- `handleSaveSettings()` - Persists API configuration
- `renderResult()` - Displays validation results
- `renderSettings()` - Settings modal UI

---

### 2. **LLM Client Service** (`src/services/llmClient.ts`)

**Responsibility**: LLM API communication and storage

**Core Functions**:

```typescript
// Main validation function
validatePrompt(prompt: string): Promise<PromptValidationResult>

// Storage functions
getAPIKey(): Promise<string>
getAPIUrl(): Promise<string>
saveAPIKey(apiKey: string): Promise<void>
saveAPIUrl(apiUrl: string): Promise<void>

// Utility functions
cleanJsonResponse(raw: string): string
ensureJsonObject(raw: string): PromptValidationResult
```

**API Integration Pattern** (Inspired by base-truths):

1. Retrieve API key from storage
2. Construct validation prompt
3. Call Gemini API with structured prompt
4. Parse and validate JSON response
5. Return typed result or throw error

**Storage Abstraction**:

- Tries Chrome Storage API first (for extension)
- Falls back to localStorage (for web app)
- Seamless dual-mode operation

---

### 3. **Type Definitions** (`src/types/index.ts`)

```typescript
// Core validation result structure
export interface PromptValidationResult {
  explicit_reasoning: boolean;
  structured_output: boolean;
  tool_separation: boolean;
  conversation_loop: boolean;
  instructional_framing: boolean;
  internal_self_checks: boolean;
  reasoning_type_awareness: boolean;
  fallbacks: boolean;
  overall_clarity: string;
}

// AI Settings configuration
export interface AISettings {
  apiKey: string;
  apiUrl: string;
  provider: "gemini" | "openai" | "groq" | "custom";
  modelName: string;
}
```

---

## 🚀 Build System

### Vite Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  base: "./", // Relative paths for Chrome Extension
  plugins: [
    react(), // React JSX transformation
    tailwindcss(), // Tailwind CSS processing
  ],
  build: {
    outDir: "dist", // Output directory
    assetsDir: "assets", // Assets subdirectory
  },
});
```

**Key Features**:

- HMR (Hot Module Replacement) for development
- Optimized production builds
- Chrome Extension compatible output
- Tailwind CSS integration

---

## 🔐 Chrome Extension Integration

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Prompt Validator",
  "version": "0.1.0",
  "permissions": ["storage"],
  "host_permissions": ["https://generativelanguage.googleapis.com/*"],
  "action": {
    "default_popup": "index.html"
  }
}
```

**Permissions**:

- `storage`: For Chrome Storage API access
- `host_permissions`: Allow Gemini API calls

**Extension Type**: Browser Action (Popup)

---

## 🎨 UI/UX Design

### Layout Structure

```
┌─────────────────────────────────────────┐
│  [Prompt Validator]        [⚙️ Settings] │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐  │
│  │                                   │  │
│  │   Enter your prompt here...       │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      [Validate Prompt]            │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Validation Results               │  │
│  │  ✓ Explicit Reasoning: Yes        │  │
│  │  ✗ Tool Separation: No            │  │
│  │  ...                              │  │
│  │  Overall: Excellent structure...  │  │
│  └───────────────────────────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

### Design Principles

1. **Minimal & Clean**: Single-page interface, no complex navigation
2. **Progressive Disclosure**: Results appear after validation
3. **Clear Feedback**: Boolean flags with color coding (green/red)
4. **Accessible Settings**: Easy API configuration via modal
5. **Responsive**: Works in both extension popup and full browser

---

## 🔄 Comparison with Base-Truths

### Similarities (Inspired By)

| Feature              | Base-Truths                   | Prompt-Validator |
| -------------------- | ----------------------------- | ---------------- |
| **Tech Stack**       | React + TypeScript + Vite     | ✓ Same           |
| **Build System**     | Vite with Tailwind            | ✓ Same           |
| **LLM Integration**  | Gemini API                    | ✓ Same           |
| **Storage Pattern**  | Chrome Storage + localStorage | ✓ Same           |
| **Extension Type**   | Browser Action Popup          | ✓ Same           |
| **Manifest Version** | V3                            | ✓ Same           |

### Differences (Minimal Focus)

| Feature        | Base-Truths                               | Prompt-Validator           |
| -------------- | ----------------------------------------- | -------------------------- |
| **Components** | Multiple pages/routes                     | Single Home component      |
| **Routing**    | React Router                              | None                       |
| **Features**   | Task prediction, chat, dashboard, scoring | Prompt validation only     |
| **Storage**    | Multiple storage modules                  | Single storage abstraction |
| **Agents**     | Multi-agent orchestration                 | Direct LLM call            |
| **Complexity** | 30+ files                                 | 6 core files               |

---

## 📊 Validation Logic

### Prompt Analysis Criteria

The LLM evaluates prompts across 8 dimensions:

1. **Explicit Reasoning**: Does it request step-by-step thinking?
2. **Structured Output**: Is formatted output specified?
3. **Tool Separation**: Are different tools/functions mentioned?
4. **Conversation Loop**: Does it enable back-and-forth?
5. **Instructional Framing**: Clear instruction format?
6. **Internal Self-Checks**: Requests for self-verification?
7. **Reasoning Type Awareness**: Specifies reasoning approach?
8. **Fallbacks**: Includes error handling instructions?

### LLM Prompt Template

```
Analyze the following prompt and validate it according to these criteria.
Return ONLY a JSON object with these exact fields (no additional text):

{
  "explicit_reasoning": boolean,
  "structured_output": boolean,
  ...
  "overall_clarity": string
}

Prompt to analyze:
"""
[USER'S PROMPT]
"""

Return ONLY the JSON object, no other text.
```

---

## 🔐 Security Considerations

### API Key Handling

- Never hardcoded in source
- Stored in Chrome Storage (encrypted by browser)
- localStorage fallback for web mode
- Not logged or transmitted except to configured API

### CORS & Permissions

- Host permissions limited to Gemini API domain
- No background scripts (minimal attack surface)
- Content Security Policy enforced by Vite

---

## 🚦 Development Workflow

### Development Mode

```bash
npm run dev
# Opens web app on localhost:5173
# Hot reload on file changes
```

### Build for Production

```bash
npm run build
# Compiles TypeScript
# Bundles with Vite
# Output to dist/ directory
```

### Extension Installation

```bash
npm run build
# Then load dist/ in chrome://extensions
```

---

## 🔮 Extension Points

Easy to extend with:

1. **Additional Validation Criteria**: Add fields to `PromptValidationResult`
2. **Multiple LLM Providers**: Add provider logic in `llmClient.ts`
3. **Prompt Templates**: Create preset prompts for testing
4. **History/Favorites**: Add storage for past validations
5. **Export/Import**: Save results as JSON/CSV
6. **Advanced Analytics**: Chart validation trends over time

---

## 📚 Key Learnings from Base-Truths

### Architecture Patterns Applied

1. **Clean Separation of Concerns**

   - Components (UI)
   - Services (Logic)
   - Types (Contracts)

2. **Storage Abstraction**

   - Single interface for multiple backends
   - Graceful fallbacks

3. **Type Safety**

   - Strict TypeScript
   - Explicit interfaces

4. **Build Configuration**

   - Chrome Extension compatible
   - Web app compatible
   - Single codebase

5. **Error Handling**
   - Try-catch patterns
   - User-friendly error messages
   - Graceful degradation

---

## 🎯 Design Decisions

### Why Minimal?

- **Focus**: Single purpose, do it well
- **Learning**: Easier to understand and modify
- **Performance**: Fast loading, minimal bundle size
- **Maintenance**: Less code = fewer bugs

### Why No Routing?

- Single page sufficient for use case
- Reduces complexity
- Faster user interaction

### Why No Agent System?

- Validation is straightforward task
- Direct LLM call is sufficient
- Keeps codebase simple

---

## 📈 Performance Metrics

### Bundle Size

- **JavaScript**: ~150 KB (gzipped: 48 KB)
- **CSS**: ~3.4 KB (gzipped: 1.1 KB)
- **HTML**: ~0.4 KB (gzipped: 0.3 KB)

### Loading Time

- **Initial Load**: < 500ms
- **Validation Request**: 2-5s (depends on LLM)
- **Settings Save**: < 100ms

---

## 🛣️ Future Enhancements

### Potential Features

- [ ] Support for OpenAI, Anthropic APIs
- [ ] Batch validation (multiple prompts)
- [ ] Comparison mode (before/after)
- [ ] Prompt improvement suggestions
- [ ] Historical tracking and analytics
- [ ] Export results to JSON/CSV
- [ ] Shareable validation reports
- [ ] Preset prompt templates
- [ ] Custom validation criteria

---

**Built with inspiration from base-truths, optimized for simplicity and focus.**
