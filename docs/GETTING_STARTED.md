# 🎯 Getting Started with Prompt Validator

## 🎉 Welcome!

Your **Prompt Validator** Chrome Extension is ready to use! This guide will get you up and running in **under 5 minutes**.

---

## ⚡ Quick Install (3 Easy Steps)

### Step 1️⃣: Get Your API Key (2 minutes)

1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (you'll paste it in Step 3)

### Step 2️⃣: Load Extension in Chrome (1 minute)

1. Open Chrome and go to: **`chrome://extensions`**
2. Toggle **"Developer mode"** ON (top-right corner)
3. Click **"Load unpacked"** button
4. Navigate to and select:
   ```
   /Users/rishikesh.kumar/Desktop/EAGV2/prompt-validator/dist
   ```
5. The extension should now appear in your extensions list!
6. **Pin it**: Click the puzzle icon 🧩 in Chrome toolbar, then pin "Prompt Validator"

### Step 3️⃣: Configure API Key (30 seconds)

1. Click the **Prompt Validator** icon in your Chrome toolbar
2. Click **"⚙️ Settings"** button (top-right)
3. Paste your Gemini API key
4. Click **"Save"**

**✅ Done! You're ready to validate prompts!**

---

## 🎮 First Validation (Try It Now!)

### Step-by-Step Tutorial

1. **Click** the Prompt Validator extension icon
2. **Type or paste** this example prompt:

```
You are an expert code reviewer. Analyze the following code and:

1. Identify any bugs or security issues
2. Suggest performance improvements
3. Provide refactored code with comments
4. Explain your reasoning step by step

If you need clarification on any part, ask before proceeding.
```

3. **Click** "Validate Prompt" button
4. **Wait** 2-5 seconds for LLM analysis
5. **Review** the results!

### Expected Results

You should see:

```
✓ Explicit Reasoning: Yes
✓ Structured Output: Yes
✗ Tool Separation: No
✓ Conversation Loop: Yes
✓ Instructional Framing: Yes
✗ Internal Self-Checks: No
✓ Reasoning Type Awareness: Yes
✓ Fallbacks: Yes

Overall Clarity: "Excellent structure with clear instructions..."
```

---

## 📖 Understanding the Results

### What Each Criterion Means

| Criterion                 | What It Checks                      | Good Example                                  |
| ------------------------- | ----------------------------------- | --------------------------------------------- |
| **Explicit Reasoning**    | Requests step-by-step thinking      | "Explain your reasoning..."                   |
| **Structured Output**     | Specifies format (list, JSON, etc.) | "Return results in JSON format"               |
| **Tool Separation**       | Mentions different tools/functions  | "Use Calculator for math, Browser for search" |
| **Conversation Loop**     | Enables back-and-forth dialogue     | "Ask for clarification if needed"             |
| **Instructional Framing** | Clear, directive language           | "Analyze... Then provide..."                  |
| **Internal Self-Checks**  | Requests self-verification          | "Double-check your answer"                    |
| **Reasoning Type**        | Specifies reasoning approach        | "Use deductive reasoning"                     |
| **Fallbacks**             | Handles errors/ambiguity            | "If unsure, ask first"                        |

### Green ✓ vs Red ✗

- **Green ✓ (Yes)**: This criterion is present in the prompt
- **Red ✗ (No)**: This criterion is missing from the prompt

**Note**: Not all criteria need to be "Yes" - it depends on your use case!

---

## 🎨 Interface Guide

### Main Screen

```
┌────────────────────────────────────────┐
│  Prompt Validator        [⚙️ Settings]  │  ← Header
├────────────────────────────────────────┤
│  Enter your prompt to validate:        │  ← Label
│  ┌──────────────────────────────────┐  │
│  │                                  │  │
│  │  [Your prompt goes here]         │  │  ← Input Area
│  │                                  │  │     (Resizable)
│  │                                  │  │
│  └──────────────────────────────────┘  │
│                                        │
│  ┌──────────────────────────────────┐  │
│  │    [Validate Prompt]             │  │  ← Action Button
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

### Settings Modal

```
┌────────────────────────────────────────┐
│  API Settings                      [×] │
├────────────────────────────────────────┤
│                                        │
│  API Key:                              │
│  ┌──────────────────────────────────┐  │
│  │ ••••••••••••••••••••••••••••     │  │  ← Masked input
│  └──────────────────────────────────┘  │
│                                        │
│  API URL:                              │
│  ┌──────────────────────────────────┐  │
│  │ https://generativelanguage...    │  │  ← Default URL
│  └──────────────────────────────────┘  │
│                                        │
│  [Save]                     [Cancel]   │
└────────────────────────────────────────┘
```

---

## 🔧 Alternative: Run as Web App

Don't want to use as Chrome Extension? Run it as a web app!

```bash
# Navigate to project
cd /Users/rishikesh.kumar/Desktop/EAGV2/prompt-validator

# Start development server
npm run dev

# Opens at http://localhost:5173
```

**Same functionality**, just in a browser tab instead of a popup!

---

## 🎓 Tips & Best Practices

### For Best Results

1. **Test Iteratively**: Start with basic prompts, refine based on validation
2. **Compare Variants**: Validate different versions of the same prompt
3. **Learn Patterns**: See which criteria matter for your use case
4. **Balance Criteria**: Not all prompts need all 8 criteria
5. **Context Matters**: "Good" validation depends on your goal

### Common Use Cases

| Use Case             | Key Criteria to Focus On                 |
| -------------------- | ---------------------------------------- |
| **Code Review**      | Explicit Reasoning, Structured Output    |
| **Data Analysis**    | Structured Output, Internal Self-Checks  |
| **Creative Writing** | Instructional Framing, Conversation Loop |
| **Research**         | Explicit Reasoning, Fallbacks            |
| **Debugging**        | Internal Self-Checks, Reasoning Type     |

---

## 🐛 Troubleshooting

### "API key not configured"

**Problem**: No API key set
**Solution**: Click Settings → Enter your Gemini API key → Save

### "API error: 400" or "API error: 401"

**Problem**: Invalid or expired API key
**Solution**:

1. Go to https://makersuite.google.com/app/apikey
2. Generate a new key
3. Update in Settings

### "No response from AI"

**Problem**: API endpoint not responding
**Solution**: Check Settings → Verify API URL is correct

### Extension not loading

**Problem**: Wrong folder selected
**Solution**: Load the `dist/` folder specifically, not the root

### Results seem wrong

**Problem**: LLM interpretation varies
**Solution**: LLMs can have different interpretations - try again or rephrase

### Extension disappeared after restart

**Problem**: Unpacked extensions don't persist by default
**Solution**: Reload the extension from `chrome://extensions`

---

## 📚 Learn More

### Documentation Files

Located in: `/Users/rishikesh.kumar/Desktop/EAGV2/prompt-validator/`

1. **GETTING_STARTED.md** ← You are here!
2. **QUICKSTART.md** - Condensed setup guide
3. **README.md** - Full feature documentation
4. **ARCHITECTURE.md** - Technical deep dive
5. **PROJECT_SUMMARY.md** - Complete project overview

### Recommended Reading Order

```
1. GETTING_STARTED.md  → Set up and first validation
2. README.md           → Understand all features
3. ARCHITECTURE.md     → Learn how it works (if customizing)
```

---

## 🚀 What's Next?

### Immediate Actions

- ✅ Validate 3-5 of your own prompts
- ✅ Compare results with different prompt styles
- ✅ Experiment with each validation criterion

### Advanced Usage

- 📝 Create a library of validated prompts
- 🎯 Develop prompt templates for common tasks
- 📊 Track which criteria matter most for your work

### Customization

- 🎨 Modify UI styling (edit `src/components/Home.tsx`)
- ➕ Add custom validation criteria (edit `src/types/index.ts`)
- 🔧 Support different LLM providers (edit `src/services/llmClient.ts`)

---

## 💡 Pro Tips

### Keyboard Shortcuts

- `Cmd/Ctrl + A` in textarea → Select all
- `Cmd/Ctrl + V` → Paste prompt
- `Enter` in settings → Save settings

### Workflow Integration

1. **Write prompt** in your editor
2. **Copy** to clipboard
3. **Click** extension icon
4. **Paste** and validate
5. **Refine** based on results
6. **Repeat** until optimal

### Validation Workflow

```
Draft Prompt → Validate → Review Results → Refine → Validate Again → Use!
```

---

## 🎯 Example Prompts to Try

### Example 1: Data Analysis

```
Analyze the attached dataset and:
1. Calculate summary statistics
2. Identify trends and patterns
3. Create visualizations (describe them)
4. Provide actionable insights

Return results in JSON format with keys: stats, trends, viz, insights.
```

**Expected**: High structured output, explicit reasoning

### Example 2: Code Generation

```
Write a Python function that:
- Accepts a list of integers
- Returns the median value
- Handles edge cases (empty list, single element)
- Includes docstring and type hints

Explain your implementation choices step by step.
```

**Expected**: High instructional framing, explicit reasoning

### Example 3: Creative Writing

```
Write a short story (200-300 words) about an AI assistant.
Include:
- An unexpected twist
- Dialogue between characters
- A moral lesson

Feel free to ask clarifying questions about tone or style.
```

**Expected**: High conversation loop, lower structured output

---

## 🎊 You're All Set!

**Congratulations!** You now have a working prompt validation tool.

### Quick Recap

✅ Extension installed in Chrome
✅ API key configured
✅ First validation completed
✅ Understand the results
✅ Ready to validate your own prompts!

### Need Help?

1. Check **troubleshooting** section above
2. Read **README.md** for detailed docs
3. Review source code (well-commented!)

---

**Happy Prompt Validating! 🚀**

Built with architecture from **base-truths** ❤️
