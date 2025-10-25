# Prompt Validator

A Chrome Extension and Web App with **sequential AI-powered analysis** - where an LLM router intelligently decides each processing step.

## 🎯 Key Features

- 🧠 **Sequential LLM Router**: AI decides the next action step-by-step
- ✅ **Prompt Validation**: Analyze prompts for quality and structure
- 👤 **Context Extraction**: Personal, professional, task, and external context
- ✨ **Intelligent Improvement**: Generate enhanced prompts using accumulated context
- 🔄 **Iterative Processing**: Router called repeatedly until complete
- 📊 **Real-Time Progress**: See each decision and action as it happens
- 💾 **Persistent Storage**: All context and prompts saved automatically to localStorage
- 📜 **Prompt History**: View, search, and reuse past prompts with full analysis
- 🎨 **Modern UI**: Dark glassmorphic design with live step visualization
- 🔧 **Dual Mode**: Works as Chrome Extension AND standalone web app

## 🎯 Router Quality - All Checks Passing!

The router prompt has been validated and **passes all quality checks**:

```
✅ Explicit Reasoning          ✅ Internal Self-Checks
✅ Structured Output           ✅ Reasoning Type Awareness
✅ Tool Separation             ✅ Fallbacks
✅ Conversation Loop           ✨ Production Ready
✅ Instructional Framing
```

**Key Features:**

- 🧠 **Reasoning Type Awareness**: LLM declares its reasoning approach (analytical, sequential, pattern-matching, contextual)
- 🔍 **Pattern Matching**: Prevents duplicate actions by recognizing similar completed actions
- 🛡️ **Edge Case Handling**: Considers potential issues before making decisions
- 📊 **Confidence Calibration**: Honest confidence scores (0.0-1.0) trigger fallbacks when needed
- ⚠️ **Anti-Hallucination**: Warns against making up data, extracts only what's present

See [ROUTER_PROMPT_ENHANCEMENT.md](./ROUTER_PROMPT_ENHANCEMENT.md) for full details.

---

## 🧠 Sequential Router Architecture

### **How It Works**

Instead of deciding everything upfront, the system:

1. **Calls `routePrompt()`** → LLM decides the first action
2. **Executes that action** (e.g., validate prompt)
3. **Calls `routePrompt()` again** → LLM decides the next action (knowing what's been done)
4. **Executes next action** (e.g., extract professional info)
5. **Repeats until complete** → LLM returns "done"

### **Example Flow**

```
User Input: "I'm a React developer building an auth system"

Step 1: routePrompt() → "validate" → ✅ Validates prompt quality
Step 2: routePrompt() → "extractProfessional" → 💼 Extracts React/developer info
Step 3: routePrompt() → "extractTask" → 📋 Extracts auth system task
Step 4: routePrompt() → "extractExternal" → 🔧 Extracts React framework
Step 5: routePrompt() → "extractTags" → 🏷️ Generates tags
Step 6: routePrompt() → "generateImprovement" → ✨ Creates enhanced prompt
Step 7: routePrompt() → "done" → 🎉 Complete!
```

## 📋 Available Actions

The LLM router can choose from:

| Action                | Icon | Description                              |
| --------------------- | ---- | ---------------------------------------- |
| `validate`            | ✅   | Validate prompt quality and structure    |
| `extractPersonal`     | 👤   | Extract name, location, goals, interests |
| `extractProfessional` | 💼   | Extract job, tech stack, projects        |
| `extractTask`         | 📋   | Extract current task being worked on     |
| `extractIntent`       | 🎯   | Extract primary goal and intent          |
| `extractTone`         | 🎨   | Extract style and tone preferences       |
| `extractExternal`     | 🔧   | Extract tools, frameworks, APIs          |
| `extractTags`         | 🏷️   | Generate relevant keywords               |
| `generateImprovement` | ✨   | Create improved prompt with context      |
| `done`                | 🎉   | Signal completion                        |

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Install dependencies**

   ```bash
   cd prompt-validator
   npm install
   ```

2. **Development (Web App)**

   ```bash
   npm run dev
   ```

   Open http://localhost:5173

3. **Build for production**

   ```bash
   npm run build
   ```

### Chrome Extension Setup

1. **Build the extension**

   ```bash
   npm run build
   ```

2. **Load in Chrome**

   - Open `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder
   - Pin the extension to your toolbar

3. **Configure API Key**
   - Click the extension icon
   - Click "Settings" ⚙️
   - Select provider (Gemini, OpenAI, Groq, Custom)
   - Enter your API key
   - Save settings

## 🏗️ Project Structure

```
prompt-validator/
├── src/
│   ├── components/
│   │   ├── Home.tsx                    # Main UI with live steps
│   │   ├── Home.module.css             # Modern dark theme
│   │   ├── SettingsPage.tsx            # Comprehensive settings
│   │   └── SettingsPage.module.css     # Settings styling
│   ├── services/
│   │   ├── llmRouter.ts                # Sequential LLM router ⭐
│   │   ├── intelligentOrchestrator.ts  # Iterative orchestration ⭐
│   │   ├── llmClient.ts                # LLM API integration
│   │   ├── contextStorage.ts           # Context persistence
│   │   └── aiSettingsStorage.ts        # Settings management
│   ├── types/
│   │   ├── index.ts                    # Core types
│   │   ├── context.ts                  # Context types
│   │   └── chrome.d.ts                 # Chrome API types
│   ├── main.tsx                        # App entry point
│   └── styles.css                      # Global styles
├── public/
│   └── manifest.json                   # Chrome Extension manifest
├── SEQUENTIAL_ROUTER.md                # 📖 Router architecture docs
├── ARCHITECTURE.md                     # 📖 System architecture
├── CONTEXT_FEATURE.md                  # 📖 Context extraction docs
└── README.md                           # This file
```

## 🔧 Architecture

### Core Components

1. **LLM Router (`llmRouter.ts`)**

   - Makes sequential decisions
   - Sees what's already been done
   - Returns ONE next action
   - Provides reasoning for each decision

2. **Intelligent Orchestrator (`intelligentOrchestrator.ts`)**

   - Calls router iteratively
   - Executes each action
   - Tracks progress
   - Updates UI in real-time

3. **Context Storage (`contextStorage.ts`)**

   - Persists extracted information
   - Accumulates user context over time
   - Provides context summary for improvements

4. **UI Components (`Home.tsx`)**
   - Live step visualization
   - Router decision display
   - Real-time progress updates
   - Result presentation

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS + CSS Modules
- **AI**: Google Gemini API (or OpenAI, Groq, Custom)
- **Storage**: Chrome Storage API / localStorage

## 📖 Usage

### Basic Flow

1. **Enter Prompt**: Type your prompt in the text area
2. **Click "Sequential Analysis"**: Start the intelligent processing
3. **Watch Live Steps**: See each router decision and action execution
4. **Review Results**: View validation, extracted context, and improvements
5. **Use Improved Prompt**: Click to replace your prompt with the enhanced version

### **NEW: Persistent Features** 💾

#### **Automatic Context Saving**

- All extracted context is **automatically saved** to localStorage
- Context **accumulates over time** - each prompt adds to your profile
- Tech stack, preferences, and goals build up naturally
- Used for better prompt improvements in future

#### **Prompt History** 📜

- Every prompt is **automatically saved with timestamp**
- Access via **"📜 History"** button in header
- **Search** prompts by content or tags
- **Filter** by specific tags
- **Reuse** any past prompt with one click
- **Export** your entire history as JSON
- See full analysis results for each prompt

#### **History Panel Features**

- 🔍 Real-time search across all prompts
- 🏷️ Tag filtering for organization
- 📊 Statistics (total prompts, validated, improved)
- 🧩 Expandable entries with full details
- 🧠 Router decision timeline for each prompt
- ✨ One-click prompt reuse
- 💾 Export/import functionality
- 🗑️ Delete individual or clear all

### Example Prompts

**Simple Validation:**

```
Analyze this code and identify bugs. Be thorough and explain your reasoning.
```

**With Context:**

```
I'm a Python developer working on a FastAPI backend. Help me implement
JWT authentication with proper error handling and security best practices.
```

**Complex Task:**

```
I work with React, TypeScript, and Tailwind. I'm building a real-time
chat application. Create a component for message display with typing
indicators, read receipts, and emoji support.
```

## ⚙️ Configuration

### AI Provider Settings

Supported providers:

- **Gemini** (Google): Fast, reliable, generous free tier
- **OpenAI**: GPT-4o, GPT-4o-mini
- **Groq**: Ultra-fast Llama models
- **Custom**: Any OpenAI-compatible API

### Router Configuration

```typescript
// In llmRouter.ts
maxIterations = 15; // Safety limit for loops
```

### Extraction Specificity

Each extraction function is focused and specific:

- Personal info: name, location, goals, interests
- Professional: job, tech stack, domain, projects
- Task: current work, specific tasks
- External: tools, frameworks, APIs, libraries
- Tone: style preferences, verbosity

## 🎨 UI Features

### Live Steps Display

- Real-time progress visualization
- Each step shows:
  - Step number and action name
  - Router's reasoning
  - Success/error status
  - Progress estimate

### Modern Design

- Dark glassmorphic theme
- Smooth animations
- Icon-based navigation
- Color-coded results
- Responsive layout

### Results Presentation

- Validation scores with visual indicators
- Context cards with categorized info
- Improved prompt with diff highlighting
- Reasoning and improvements breakdown

## 🔄 Sequential vs Parallel

### Old Approach (Removed)

```
❌ One big decision → Execute all → Done
   - All-or-nothing
   - No adaptation
   - Wastes API calls
```

### New Approach (Current)

```
✅ Decide → Execute → Decide → Execute → ...
   - Step-by-step intelligence
   - Adapts to content
   - Only runs what's needed
```

## 🚀 Performance

### API Efficiency

- **Typical prompts**: 5-8 LLM calls
- **Simple prompts**: 2-3 calls
- **Complex prompts**: 8-12 calls
- **Maximum**: 16 calls (safety limit)

### Execution Time

- **Simple**: ~5-10 seconds
- **Typical**: ~15-25 seconds
- **Complex**: ~30-45 seconds

### Cost Optimization

- Router calls are lightweight (small tokens)
- Only extracts relevant information
- Skips unnecessary steps
- Accumulates context efficiently

## 🐛 Debugging

### Enable Console Logs

Router and orchestrator log decisions and results to console.

### Common Issues

**Router loops?**

- Check max iteration limit
- Verify "done" action is being returned
- Review router prompt clarity

**Missing extractions?**

- Router decides based on content
- Not all prompts need all extractions
- Check router's reasoning in UI

**Slow performance?**

- Too many sequential calls
- Consider adjusting router prompt
- Check API response times

## 📚 Documentation

- **[SEQUENTIAL_ROUTER.md](./SEQUENTIAL_ROUTER.md)** - Complete router architecture
- **[PERSISTENCE_FEATURES.md](./PERSISTENCE_FEATURES.md)** - Context & history persistence guide ⭐ NEW
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design deep dive
- **[CONTEXT_FEATURE.md](./CONTEXT_FEATURE.md)** - Context extraction guide
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Step-by-step setup

## 🔒 Privacy

- No data sent anywhere except your chosen LLM provider
- API keys stored locally (Chrome storage or localStorage)
- No tracking, analytics, or telemetry
- All processing happens client-side
- Open source and auditable

## 💡 Tips

1. **Be specific in prompts** - More context = better routing decisions
2. **Watch the steps** - Learn how the router thinks
3. **Use improved prompts** - They incorporate all your context
4. **Build context over time** - System remembers your preferences
5. **Clear context when needed** - Start fresh for different projects

## 🤝 Contributing

Ideas to extend:

- Add more extraction categories
- Improve router decision-making
- Add prompt templates
- Export/import functionality
- Context visualization dashboard
- Multi-language support

## 📄 License

MIT License - free to use and modify

## 🙏 Credits

- Architecture inspired by **base-truths** project
- Sequential routing concept for intelligent processing
- Powered by Google Gemini API (and compatible APIs)
- Built with React + Vite + Tailwind CSS

---

**An intelligent prompt analysis system that thinks for itself** 🧠✨

For detailed technical documentation, see [SEQUENTIAL_ROUTER.md](./SEQUENTIAL_ROUTER.md)
