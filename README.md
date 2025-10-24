# Prompt Validator

A minimal Chrome Extension and Web App that validates prompts using LLM and provides structured analysis.

## 🎯 Features

- ✅ **Prompt Validation**: Analyze prompts for quality and structure
- ✅ **LLM Integration**: Uses Google Gemini API (or custom LLM)
- ✅ **Dual Mode**: Works as Chrome Extension AND standalone web app
- ✅ **Structured Output**: Returns validation in JSON format
- ✅ **Modern UI**: Built with React + TypeScript + Tailwind CSS

## 📋 Validation Criteria

The tool analyzes prompts for:

- ✓ Explicit Reasoning
- ✓ Structured Output
- ✓ Tool Separation
- ✓ Conversation Loop
- ✓ Instructional Framing
- ✓ Internal Self-Checks
- ✓ Reasoning Type Awareness
- ✓ Fallbacks
- ✓ Overall Clarity Assessment

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone and navigate to project**

   ```bash
   cd prompt-validator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Development (Web App)**

   ```bash
   npm run dev
   ```

   Open http://localhost:5173

4. **Build for production**
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
   - Enter your Gemini API key
   - Save settings

## 🏗️ Project Structure

```
prompt-validator/
├── src/
│   ├── components/
│   │   └── Home.tsx          # Main UI component
│   ├── services/
│   │   └── llmClient.ts       # LLM API integration
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── main.tsx               # App entry point
│   └── styles.css             # Global styles
├── public/
│   └── manifest.json          # Chrome Extension manifest
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## 🔧 Architecture

Based on the **base-truths** project architecture with minimal components:

### Key Components

- **Home Component**: Input box + validation results display
- **LLM Client**: Handles API communication with Gemini
- **Storage Layer**: Chrome storage API + localStorage fallback

### Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Storage**: Chrome Storage API / localStorage

## 📖 Usage

1. **Enter Prompt**: Type or paste your prompt in the text area
2. **Validate**: Click "Validate Prompt" button
3. **Review Results**: See structured analysis with boolean flags and clarity assessment
4. **Try Again**: Click "Validate Another Prompt" to start over

### Example Prompt

```
You are an expert software engineer. Analyze the following code and:
1. Identify any bugs or issues
2. Suggest improvements
3. Provide refactored code
4. Explain your reasoning step by step

If you're unsure about anything, ask for clarification before proceeding.
```

### Expected Output

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

## ⚙️ Configuration

### API Settings

The extension stores settings in Chrome storage (or localStorage):

- **API Key**: Your Gemini API key
- **API URL**: Default is Gemini's endpoint, but you can use custom providers

### Custom LLM Providers

To use a different LLM provider:

1. Click Settings
2. Update API URL to your provider's endpoint
3. Ensure your API key is compatible
4. Save settings

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (web app)
npm run build        # Build for production
npm run build:watch  # Build and watch for changes
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Hot Reload for Extension

```bash
# Terminal 1: Watch mode
npm run build:watch

# Terminal 2: Web preview
npm run dev
```

Then reload extension in `chrome://extensions` after changes.

## 🌐 Dual Mode Support

The app automatically detects its environment:

- **Chrome Extension**: 500px wide, 600px tall popup
- **Web App**: Full responsive layout

Both modes use the same codebase with conditional styling.

## 🔒 Privacy

- No data is sent to external servers except your LLM provider
- API keys stored locally (Chrome storage or localStorage)
- No tracking or analytics
- Open source and transparent

## 🤝 Contributing

This is a minimal implementation. Feel free to extend:

- Add more validation criteria
- Support additional LLM providers
- Improve UI/UX
- Add prompt templates
- Export/import functionality

## 📄 License

MIT License - feel free to use and modify

## 🙏 Credits

- Architecture inspired by **base-truths** project
- Powered by Google Gemini API
- Built with React + Vite + Tailwind CSS

---

**Built for validating prompts and improving AI interactions** 🚀
