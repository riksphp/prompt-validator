# Prompt Validator - Quick Start Guide

## ✅ What Was Created

A **minimal Chrome Extension and Web App** that validates prompts using LLM, based on the architecture patterns from your **base-truths** project.

### Key Features

- ✓ Single input box for prompts
- ✓ LLM validation via Gemini API
- ✓ Structured JSON output display
- ✓ Works as Chrome Extension OR Web App
- ✓ Minimal architecture (only 6 core files!)

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Your API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Create a Google Gemini API key
3. Copy it (you'll need it in Step 3)

### Step 2: Load the Extension

**Option A: Chrome Extension** (Recommended)

```bash
# Already built! Just load it:
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select: /Users/rishikesh.kumar/Desktop/EAGV2/prompt-validator/dist
# 5. Pin the extension to your toolbar
```

**Option B: Web App**

```bash
cd /Users/rishikesh.kumar/Desktop/EAGV2/prompt-validator
npm run dev
# Opens at http://localhost:5173
```

### Step 3: Configure API Key

1. Click the extension icon (or open web app)
2. Click "⚙️ Settings" button (top-right)
3. Paste your Gemini API key
4. Click "Save"

**You're ready!** 🎉

---

## 📝 How to Use

### Basic Usage

1. **Enter a Prompt**

   ```
   Type or paste any prompt in the text area
   ```

2. **Click "Validate Prompt"**

   ```
   The LLM will analyze your prompt (takes 2-5 seconds)
   ```

3. **View Results**

   ```
   See validation results with boolean flags:
   ✓ Explicit Reasoning: Yes
   ✗ Tool Separation: No
   ... and more

   Plus an overall clarity assessment
   ```

4. **Validate Another**
   ```
   Click "Validate Another Prompt" to start over
   ```

### Example Prompt

Try this sample prompt:

```
You are an expert code reviewer. Analyze the following code and:

1. Identify any bugs or security issues
2. Suggest performance improvements
3. Provide refactored code with comments
4. Explain your reasoning step by step

If you need clarification on any part, ask before proceeding.

[CODE WOULD GO HERE]
```

**Expected Results:**

- ✓ Explicit Reasoning: Yes (requests step-by-step explanation)
- ✓ Structured Output: Yes (numbered list format)
- ✗ Tool Separation: No (no tools mentioned)
- ✓ Conversation Loop: Yes (asks for clarification)
- ✓ Instructional Framing: Yes (clear instructions)
- ✗ Internal Self-Checks: No (no self-verification)
- ✓ Reasoning Type Awareness: Yes (specifies analytical approach)
- ✓ Fallbacks: Yes (handles ambiguity)

---

## 🎯 Validation Output Format

The LLM returns this exact JSON structure:

```json
{
  "explicit_reasoning": true,
  "structured_output": true,
  "tool_separation": false,
  "conversation_loop": true,
  "instructional_framing": true,
  "internal_self_checks": false,
  "reasoning_type_awareness": true,
  "fallbacks": true,
  "overall_clarity": "Excellent structure with clear instructions and fallback handling."
}
```

---

## 📁 Project Structure

```
prompt-validator/
├── dist/                    ← Built files (load this in Chrome)
├── src/
│   ├── components/
│   │   └── Home.tsx        ← Main UI (input, results, settings)
│   ├── services/
│   │   └── llmClient.ts    ← LLM API integration
│   ├── types/
│   │   └── index.ts        ← TypeScript types
│   ├── main.tsx            ← Entry point
│   └── styles.css          ← Tailwind CSS
├── public/
│   └── manifest.json       ← Chrome Extension config
├── README.md               ← Full documentation
├── ARCHITECTURE.md         ← Technical architecture details
└── QUICKSTART.md           ← This file!
```

---

## 🔧 Development Commands

```bash
# Install dependencies (already done)
npm install

# Development mode (web app with hot reload)
npm run dev

# Build for production
npm run build

# Watch mode (rebuild on changes)
npm run build:watch

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🏗️ Architecture Highlights

### Inspired by Base-Truths

✅ **Same patterns, minimal implementation**

| Component        | Description                                    |
| ---------------- | ---------------------------------------------- |
| **Home.tsx**     | Single-page UI with input, validation, results |
| **llmClient.ts** | LLM integration (Gemini API)                   |
| **Storage**      | Chrome Storage + localStorage fallback         |
| **Types**        | TypeScript interfaces for type safety          |
| **Build**        | Vite + React + Tailwind CSS                    |

### Key Differences from Base-Truths

- ❌ No routing (single page)
- ❌ No multi-agent system
- ❌ No dashboard/chat/scoring
- ✅ Focused on ONE task: prompt validation
- ✅ ~6 core files vs 30+ in base-truths
- ✅ Easier to understand and extend

---

## 🎨 How It Works

### Step-by-Step Flow

```
1. User enters prompt
   ↓
2. Click "Validate Prompt"
   ↓
3. llmClient.validatePrompt() called
   ↓
4. Constructs validation prompt for LLM
   ↓
5. Sends to Gemini API
   ↓
6. Receives JSON response
   ↓
7. Parses and validates structure
   ↓
8. Displays results in UI
```

### LLM Validation Prompt Template

The app sends this to Gemini:

```
Analyze the following prompt and validate it according to these criteria.
Return ONLY a JSON object with these exact fields (no additional text):

{
  "explicit_reasoning": boolean,
  "structured_output": boolean,
  "tool_separation": boolean,
  "conversation_loop": boolean,
  "instructional_framing": boolean,
  "internal_self_checks": boolean,
  "reasoning_type_awareness": boolean,
  "fallbacks": boolean,
  "overall_clarity": string
}

Prompt to analyze:
"""
[YOUR PROMPT HERE]
"""

Return ONLY the JSON object, no other text.
```

---

## 🔐 Privacy & Security

- ✓ API key stored locally (Chrome Storage or localStorage)
- ✓ No data sent to external servers (except your configured LLM)
- ✓ No tracking or analytics
- ✓ Open source and transparent
- ✓ Minimal permissions required

---

## 🐛 Troubleshooting

### "API key not configured"

→ Click Settings and enter your Gemini API key

### "API error: 400"

→ Check if your API key is valid and active

### "No response from AI"

→ Verify API URL in settings (default should work)

### Extension not loading

→ Make sure you selected the `dist/` folder, not the root

### Changes not showing

→ Click reload icon in chrome://extensions after rebuilding

---

## 🚀 Next Steps

### Test It Out

1. Load the extension
2. Configure your API key
3. Try the example prompt above
4. Experiment with different prompts

### Customize It

- Add more validation criteria
- Change the UI styling
- Support different LLM providers
- Add export/import functionality

### Extend It

- See `ARCHITECTURE.md` for extension points
- All code is well-commented
- Follow base-truths patterns

---

## 📚 Documentation

- **README.md** - User guide and features
- **ARCHITECTURE.md** - Technical deep dive
- **QUICKSTART.md** - This file (quick setup)

---

## ✨ Summary

You now have a **working Chrome Extension** that:

- ✅ Validates prompts using LLM
- ✅ Returns structured JSON analysis
- ✅ Works as extension or web app
- ✅ Uses base-truths architecture
- ✅ Is minimal and easy to understand

**Total build time**: Already done! Just load and configure.

---

**Happy prompt validating!** 🎉

For questions or issues, refer to:

- `README.md` for detailed usage
- `ARCHITECTURE.md` for technical details
- Source code (it's minimal and well-commented!)
