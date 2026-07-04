# Sequential Router Architecture

## 🎯 **Overview**

The system now uses a **sequential, iterative approach** where the LLM router is called **multiple times**, deciding **one action at a time** based on what has already been completed.

## 🔄 **How It Works**

### **Old Approach (Parallel - Removed)**

```
❌ Call routePrompt() once
   ↓
   Returns: {
     shouldValidate: true,
     shouldExtractPersonal: true,
     shouldExtractProfessional: true,
     shouldExtractTags: true,
     shouldGenerateImprovement: true
   }
   ↓
   Execute ALL actions at once
```

### **New Approach (Sequential - Current)**

```
✅ Step 1: Call routePrompt(prompt, [])
   ↓
   Returns: { nextAction: "validate", reasoning: "..." }
   ↓
   Execute validate()

✅ Step 2: Call routePrompt(prompt, ["validate"])
   ↓
   Returns: { nextAction: "extractProfessional", reasoning: "..." }
   ↓
   Execute extractProfessional()

✅ Step 3: Call routePrompt(prompt, ["validate", "extractProfessional"])
   ↓
   Returns: { nextAction: "extractExternal", reasoning: "..." }
   ↓
   Execute extractExternal()

... continues until ...

✅ Step N: Call routePrompt(prompt, [all previous actions])
   ↓
   Returns: { nextAction: "generateImprovement", reasoning: "..." }
   ↓
   Execute generateImprovement()

✅ Step N+1: Call routePrompt(prompt, [all actions including improvement])
   ↓
   Returns: { nextAction: "done", reasoning: "All work complete" }
   ↓
   Process complete!
```

---

## 📁 **Architecture Components**

### **1. Router (`llmRouter.ts`)**

**Interface:**

```typescript
export interface RouterDecision {
  nextAction:
    | "validate"
    | "extractPersonal"
    | "extractProfessional"
    | "extractTask"
    | "extractIntent"
    | "extractTone"
    | "extractExternal"
    | "extractTags"
    | "generateImprovement"
    | "done";
  reasoning: string;
  progress?: string; // e.g., "Step 3 of ~5"
}
```

**Main Function:**

```typescript
export async function routePrompt(
  prompt: string,
  completedActions: string[] = []
): Promise<RouterDecision>;
```

**Key Features:**

- Takes the original prompt
- Takes an array of already-completed actions
- Returns **ONE** next action to perform
- Returns "done" when all work is complete
- Provides reasoning for each decision
- Optionally includes progress estimate

**Example Responses:**

```json
// First call
{
  "nextAction": "validate",
  "reasoning": "This is a well-formed prompt that should be validated for quality",
  "progress": "Step 1 of ~5"
}

// Second call (after validate)
{
  "nextAction": "extractProfessional",
  "reasoning": "User mentions React and TypeScript - extract professional info",
  "progress": "Step 2 of ~5"
}

// Final call
{
  "nextAction": "done",
  "reasoning": "All relevant information extracted and prompt improved",
  "progress": "Complete"
}
```

---

### **2. Orchestrator (`intelligentOrchestrator.ts`)**

**Main Function:**

```typescript
export async function orchestratePromptProcessing(
  prompt: string,
  onStepUpdate?: (step: OrchestrationStep) => void
): Promise<OrchestrationResult>;
```

**Process Flow:**

```typescript
1. Initialize: completedActions = [], iteration = 0
2. Loop (max 15 iterations):
   a. Call routePrompt(prompt, completedActions)
   b. Get decision.nextAction
   c. If "done" → break
   d. Execute the action (validate, extract, etc.)
   e. Store result
   f. Add action to completedActions
   g. Notify UI (onStepUpdate)
   h. Repeat
3. Save all extracted context
4. Return complete results
```

**Result Interface:**

```typescript
export interface OrchestrationResult {
  steps: OrchestrationStep[]; // All executed steps
  validationResult?: any; // If validation was run
  extractedContext?: ExtractedContext; // All extracted info
  improvedPrompt?: any; // If improvement generated
  errors: string[]; // Any errors
  totalSteps: number; // Total steps executed
}

export interface OrchestrationStep {
  action: string; // e.g., "validate"
  decision: RouterDecision; // Router's decision
  result?: any; // Result of execution
  error?: string; // Error if failed
}
```

**Safety Features:**

- Maximum 15 iterations to prevent infinite loops
- Error handling for each step
- Continues even if one step fails
- Tracks all errors in result

---

### **3. UI (`Home.tsx`)**

**Real-Time Display:**

- Shows each step as it's being executed
- Displays router's reasoning for each decision
- Live progress updates
- Success/error indicators for each step

**Key UI Elements:**

1. **Live Steps Container**

   - Shows all executed steps in real-time
   - Each step shows:
     - Step number
     - Action name with icon
     - Router's reasoning
     - Success/error status
     - Progress estimate

2. **Status Summary**

   - Overall progress
   - Total steps completed
   - Reset button

3. **Results Display**
   - Validation results (if run)
   - Extracted context (all categories)
   - Improved prompt (if generated)

---

## 🎨 **Available Actions**

### **1. validate**

- Validates prompt quality
- Checks for best practices
- Returns quality scores

### **2. extractPersonal**

- Extracts: name, location, age, goals, interests, language preference
- Only called if personal info mentioned

### **3. extractProfessional**

- Extracts: job title, domain, company, projects, tech stack, experience
- Only called if professional info mentioned

### **4. extractTask**

- Extracts: current task being worked on
- Only called if task context is present

### **5. extractIntent**

- Extracts: primary intent and goal
- Classifies intent type

### **6. extractTone**

- Extracts: tone, style, verbosity preferences
- Only called if tone indicators present

### **7. extractExternal**

- Extracts: tools, APIs, frameworks, libraries, file names, URLs
- Only called if external resources mentioned

### **8. extractTags**

- Generates 3-5 relevant keywords
- For categorization

### **9. generateImprovement**

- Creates improved version of prompt
- Uses all accumulated context
- Lists improvements made
- **Should be one of the last steps**

### **10. done**

- Signals completion
- No further actions needed

---

## 💡 **Example Flow**

**User Input:**

```
I'm a React developer working on an e-commerce site.
Help me implement a shopping cart with proper state management.
```

**Sequential Execution:**

```
Step 1: routePrompt(prompt, [])
   → Decision: "validate"
   → Reasoning: "This is a well-formed instruction that should be validated"
   → Execute: validatePrompt()
   → Result: { explicit_reasoning: true, ... }

Step 2: routePrompt(prompt, ["validate"])
   → Decision: "extractProfessional"
   → Reasoning: "User mentions React developer - extract professional context"
   → Execute: extractProfessionalInfo()
   → Result: { techStack: ["React"], domain: "frontend", ... }

Step 3: routePrompt(prompt, ["validate", "extractProfessional"])
   → Decision: "extractTask"
   → Reasoning: "User is working on e-commerce site - extract task context"
   → Execute: extractTaskContext()
   → Result: { currentTask: "implementing shopping cart" }

Step 4: routePrompt(prompt, ["validate", "extractProfessional", "extractTask"])
   → Decision: "extractExternal"
   → Reasoning: "React mentioned - extract framework details"
   → Execute: extractExternalContext()
   → Result: { frameworks: ["React"] }

Step 5: routePrompt(prompt, ["validate", "extractProfessional", "extractTask", "extractExternal"])
   → Decision: "extractTags"
   → Reasoning: "Generate tags for categorization"
   → Execute: extractTags()
   → Result: ["react", "state-management", "shopping-cart", "e-commerce"]

Step 6: routePrompt(prompt, ["validate", "extractProfessional", "extractTask", "extractExternal", "extractTags"])
   → Decision: "generateImprovement"
   → Reasoning: "All context gathered - generate improved prompt"
   → Execute: generateImprovedPrompt()
   → Result: {
       improvedPrompt: "As a React developer building an e-commerce platform...",
       improvements: ["Added specific context", "Clarified requirements", ...],
       reasoning: "..."
     }

Step 7: routePrompt(prompt, [all previous actions])
   → Decision: "done"
   → Reasoning: "All relevant actions completed"
   → COMPLETE! ✅
```

---

## 🚀 **Benefits of Sequential Approach**

### **1. Intelligent Decision-Making**

- LLM sees what's already been done
- Makes context-aware decisions
- Can adapt based on previous results

### **2. Flexible Execution**

- Not all prompts need all actions
- Router decides what's relevant
- Saves API calls and time

### **3. Better Context Building**

- Extracts info step by step
- Each extraction informs the next
- Final improvement uses all context

### **4. Transparent Process**

- User sees each decision
- Clear reasoning provided
- Real-time progress updates

### **5. Error Resilient**

- If one step fails, others continue
- Tracks errors per step
- Provides partial results

### **6. Maintainable**

- Easy to add new actions
- Each extraction focused and specific
- Clear separation of concerns

---

## 🔧 **Configuration**

### **Router Prompt**

The router uses a carefully crafted prompt that:

- Lists all available actions
- Shows what actions are already completed
- Asks for ONE next action
- Requests reasoning
- Asks for progress estimate

### **Safety Limits**

```typescript
maxIterations = 15; // Prevents infinite loops
```

### **Action Mapping**

Each action maps to a specific function:

- `validate` → `validatePrompt()`
- `extractPersonal` → `extractPersonalInfo()`
- `extractProfessional` → `extractProfessionalInfo()`
- `extractTask` → `extractTaskContext()`
- `extractIntent` → (custom handler)
- `extractTone` → `extractTonePreferences()`
- `extractExternal` → `extractExternalContext()`
- `extractTags` → `extractTags()`
- `generateImprovement` → `generateImprovedPrompt()`
- `done` → (break loop)

---

## 📊 **Performance**

### **API Calls**

- **Minimum:** 2 calls (1 route + 1 action or immediate done)
- **Typical:** 5-8 calls (route + actions for a comprehensive prompt)
- **Maximum:** 16 calls (15 iterations + 1 final route)

### **Execution Time**

- **Simple prompt:** ~5-10 seconds (2-3 steps)
- **Complex prompt:** ~15-25 seconds (6-8 steps)
- **Maximum:** ~60 seconds (full iteration)

### **Cost Optimization**

- Only executes relevant actions
- Router calls are lightweight
- Extraction calls are focused

---

## 🎯 **Best Practices**

### **For LLM Router**

1. Always provide clear reasoning
2. Consider what's already been done
3. Extract related info together (e.g., all personal info in one step)
4. Generate improvement near the end
5. Return "done" when truly complete

### **For Orchestrator**

1. Always set a max iteration limit
2. Track all errors but continue processing
3. Save context only after all extractions
4. Provide real-time updates to UI

### **For UI**

1. Show each step as it happens
2. Display router's reasoning
3. Indicate success/failure clearly
4. Allow interruption if needed

---

## 🐛 **Debugging**

### **Router Not Progressing?**

- Check `completedActions` array is being updated
- Verify router is seeing the completed actions
- Check for infinite loops (same action repeated)

### **Wrong Action Sequence?**

- Review router prompt clarity
- Add more specific guidelines
- Adjust action descriptions

### **Missing Actions?**

- Router decides based on content
- Not all prompts need all actions
- Check router's reasoning

### **Too Many Iterations?**

- Adjust max iteration limit
- Check if router is properly returning "done"
- Review action completion logic

---

## 📚 **API Reference**

### **routePrompt**

```typescript
async function routePrompt(
  prompt: string,
  completedActions: string[] = []
): Promise<RouterDecision>;
```

### **orchestratePromptProcessing**

```typescript
async function orchestratePromptProcessing(
  prompt: string,
  onStepUpdate?: (step: OrchestrationStep) => void
): Promise<OrchestrationResult>;
```

### **getActionDisplayName**

```typescript
function getActionDisplayName(action: string): string;
// Returns formatted name with emoji
// e.g., "validate" → "✅ Validate Prompt"
```

### **getOrchestrationStatus**

```typescript
function getOrchestrationStatus(result: OrchestrationResult): string;
// Returns human-readable summary
// e.g., "✅ Successfully completed 6 steps"
```

---

## 🎉 **Summary**

The sequential router architecture provides:

- ✅ **Intelligent** - LLM decides each step
- ✅ **Adaptive** - Responds to what's been done
- ✅ **Efficient** - Only runs what's needed
- ✅ **Transparent** - Shows all decisions
- ✅ **Flexible** - Easy to extend
- ✅ **Robust** - Handles errors gracefully

The system now truly thinks for itself, making decisions step by step, just like a human would approach the task!
