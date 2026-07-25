# AI Prompt+ — Complete Workflows

## 1. Prompt Builder Flow

### Overview

The Prompt Builder is the core feature of AI Prompt+. It guides users from a simple prompt to a production-ready, AI-optimized prompt through analysis, enhancement, and scoring.

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROMPT BUILDER FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  INPUT   │───▶│ ANALYZE  │───▶│ ENHANCE  │───▶│  RESULT  │  │
│  │          │    │          │    │          │    │          │  │
│  │ User     │    │ AI       │    │ AI       │    │ Score +  │  │
│  │ writes   │    │ analyzes │    │ enhances │    │ Actions  │  │
│  │ prompt   │    │ prompt   │    │ prompt   │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│       │               │               │               │        │
│       ▼               ▼               ▼               ▼        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │ Validate │    │ Intent   │    │ Template │    │ Copy     │  │
│  │ Sanitize │    │ Category │    │ Context  │    │ Save     │  │
│  │ Count    │    │ Complex. │    │ Role     │    │ Export   │  │
│  │          │    │ Missing  │    │ Format   │    │ Share    │  │
│  │          │    │ Suggest  │    │ Optimize │    │          │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Step Breakdown

#### Step 1: Input

**User Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  New Prompt                                                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  Write your prompt here...                          │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │                                              │  │   │
│  │  │                                              │  │   │
│  │  │                                              │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  Characters: 0 / 2,000                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Model: [ChatGPT (GPT-4o) ▼]                               │
│                                                             │
│  Category: [Code] [Content] [Image] [Data] [Email] [Other] │
│                                                             │
│  Tone: [Professional ▼]                                     │
│                                                             │
│  Length: [Short] [Medium] [Long] [Custom]                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ▶ Advanced Options                                  │   │
│  │    ├─ Temperature: [0.7]                             │   │
│  │    ├─ Include examples: [✓]                          │   │
│  │    ├─ Output format: [Markdown ▼]                    │   │
│  │    └─ Language: [English ▼]                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              [ 🔍 Analyze Prompt ]                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Backend Action:**
```typescript
// POST /api/v1/prompts/analyze
async function analyzePrompt(input: PromptInput) {
  // 1. Validate input
  const validated = PromptInputSchema.parse(input);
  
  // 2. Sanitize text
  const sanitized = sanitizeText(validated.text);
  
  // 3. Count characters/words
  const stats = {
    characters: sanitized.length,
    words: sanitized.split(/\s+/).length,
    sentences: sanitized.split(/[.!?]+/).length,
  };
  
  // 4. Store original prompt
  const prompt = await db.prompt.create({
    data: {
      userId: user.id,
      originalText: sanitized,
      model: validated.model,
      category: validated.category,
      tone: validated.tone,
      length: validated.length,
    },
  });
  
  return { promptId: prompt.id, stats };
}
```

**Validation Rules:**
- Minimum 10 characters
- Maximum 2,000 characters
- No script injection (XSS prevention)
- No profanity (configurable)
- Unicode normalization

---

#### Step 2: Analysis

**User Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Analysis Results                                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Confidence: 92%                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Intent: Content Generation                         │   │
│  │  Category: Blog Post                                │   │
│  │  Complexity: Simple (2/5)                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Missing Information                                 │   │
│  │                                                     │   │
│  │  ⚠️ Target audience not specified                   │   │
│  │  ⚠️ Tone not specified                              │   │
│  │  ⚠️ Length not specified                            │   │
│  │  ⚠️ Key points not specified                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Suggestions                                        │   │
│  │                                                     │   │
│  │  💡 Consider specifying target audience             │   │
│  │  💡 Add desired tone of voice                       │   │
│  │  💡 Specify word count or reading time              │   │
│  │  💡 Include key topics to cover                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         [ ✨ Enhance Prompt ]                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Backend Action:**
```typescript
// POST /api/v1/prompts/analyze
async function analyzePrompt(promptId: string) {
  const prompt = await db.prompt.findUnique({ where: { id: promptId } });
  
  // 1. Intent Detection
  const intent = await aiService.detectIntent(prompt.originalText);
  // Returns: "content_generation", "code_generation", "image_generation", etc.
  
  // 2. Category Classification
  const category = await aiService.classifyCategory(prompt.originalText);
  // Returns: "blog_post", "email", "tutorial", etc.
  
  // 3. Entity Recognition
  const entities = await aiService.extractEntities(prompt.originalText);
  // Returns: ["AI", "blog_post", "technology"]
  
  // 4. Context Detection
  const context = await aiService.detectContext(prompt.originalText);
  // Returns: ["technology", "artificial_intelligence", "writing"]
  
  // 5. Complexity Calculation
  const complexity = await aiService.calculateComplexity(prompt.originalText);
  // Returns: 1-5 (simple to complex)
  
  // 6. Missing Requirements
  const missing = await aiService.findMissingRequirements(
    prompt.originalText,
    intent,
    category
  );
  // Returns: ["target_audience", "tone", "length", "key_points"]
  
  // 7. Suggestions Generation
  const suggestions = await aiService.generateSuggestions(
    prompt.originalText,
    missing,
    intent
  );
  // Returns: ["Consider specifying...", "Add desired tone...", ...]
  
  // 8. Store analysis
  await db.analysis.create({
    data: {
      promptId,
      intent,
      category,
      entities,
      context,
      complexity,
      missing,
      suggestions,
      confidence: 0.92,
    },
  });
  
  return {
    intent,
    category,
    complexity,
    missing,
    suggestions,
    confidence: 0.92,
  };
}
```

**Analysis Output Schema:**
```typescript
interface AnalysisResult {
  intent: 'content_generation' | 'code_generation' | 'image_generation' | 
          'data_analysis' | 'email' | 'education' | 'business' | 'creative';
  category: string;
  entities: string[];
  context: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
  missing: string[];
  suggestions: string[];
  confidence: number; // 0-1
}
```

---

#### Step 3: Enhancement

**User Interface:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Enhancement Results                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Original                                           │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  "Write me a blog post about AI"                    │   │
│  │                                                     │   │
│  │  Score: 45/100                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Enhanced                                           │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  "You are an expert content writer and SEO          │   │
│  │   specialist with 10+ years of experience writing   │   │
│  │   about technology.                                 │   │
│  │                                                     │   │
│  │   Write a comprehensive, SEO-optimized blog post    │   │
│  │   about Artificial Intelligence (AI).               │   │
│  │                                                     │   │
│  │   Requirements:                                     │   │
│  │   - Target audience: [specify your audience]        │   │
│  │   - Tone: [professional/casual/technical]           │   │
│  │   - Length: [500/1000/2000] words                   │   │
│  │   - Format: Markdown with H2, H3 headings           │   │
│  │   - Include: Introduction hook, key concepts,       │   │
│  │     practical examples, and a conclusion            │   │
│  │   - Keywords to include: AI, artificial             │   │
│  │     intelligence, machine learning                  │   │
│  │                                                     │   │
│  │   Structure:                                        │   │
│  │   1. Compelling headline                            │   │
│  │   2. Introduction (hook + context)                  │   │
│  │   3. Main sections (3-5 key points)                 │   │
│  │   4. Practical examples                             │   │
│  │   5. Conclusion (CTA)                               │   │
│  │                                                     │   │
│  │   Make it engaging, informative, and shareable."    │   │
│  │                                                     │   │
│  │  Score: 87/100                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Quality Score                                      │   │
│  │                                                     │   │
│  │  Clarity:      ████████████░░░░  92                │   │
│  │  Specificity:  ██████████░░░░░░  85                │   │
│  │  Context:      ██████████░░░░░░  88                │   │
│  │  Completeness: █████████░░░░░░░  83                │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Overall:      ██████████░░░░░░  87/100            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Changes Made                                       │   │
│  │                                                     │   │
│  │  ✅ Added role context (+15% clarity)               │   │
│  │  ✅ Added structure (+20% completeness)             │   │
│  │  ✅ Added formatting (+10% specificity)             │   │
│  │  ✅ Added examples (+12% context)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [📋 Copy] [💾 Save] [📤 Export] [🔗 Share]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Backend Action:**
```typescript
// POST /api/v1/prompts/enhance
async function enhancePrompt(promptId: string) {
  const prompt = await db.prompt.findUnique({
    where: { id: promptId },
    include: { analysis: true },
  });
  
  // 1. Template Selection
  const template = await selectTemplate(
    prompt.analysis.category,
    prompt.analysis.intent
  );
  
  // 2. Context Expansion
  const contextExpanded = await aiService.expandContext(
    prompt.originalText,
    template,
    prompt.analysis
  );
  
  // 3. Role Assignment
  const withRole = await aiService.assignRole(
    contextExpanded,
    prompt.analysis.category,
    prompt.model
  );
  
  // 4. Constraint Addition
  const withConstraints = await aiService.addConstraints(
    withRole,
    prompt.analysis.missing,
    { tone: prompt.tone, length: prompt.length }
  );
  
  // 5. Formatting
  const formatted = await aiService.applyFormatting(
    withConstraints,
    prompt.analysis.category
  );
  
  // 6. Example Generation
  const withExamples = await aiService.generateExamples(
    formatted,
    prompt.analysis.category
  );
  
  // 7. Optimization
  const optimized = await aiService.optimize(
    withExamples,
    prompt.model
  );
  
  // 8. Scoring
  const score = await scorePrompt(optimized);
  
  // 9. Store enhanced prompt
  await db.prompt.update({
    where: { id: promptId },
    data: {
      enhancedText: optimized,
      score,
      enhancedAt: new Date(),
    },
  });
  
  // 10. Create version
  await db.version.create({
    data: {
      promptId,
      version: 1,
      text: optimized,
      score,
      changes: [
        { type: 'role', impact: 0.15 },
        { type: 'structure', impact: 0.20 },
        { type: 'formatting', impact: 0.10 },
        { type: 'examples', impact: 0.12 },
      ],
    },
  });
  
  return { enhancedText: optimized, score };
}
```

**Enhancement Stages:**

| Stage | What It Does | Example Addition |
|-------|--------------|------------------|
| Template Selection | Picks the right enhancement template | "Blog Post Template" |
| Context Expansion | Adds background and scope | "Write a comprehensive, SEO-optimized..." |
| Role Assignment | Sets the AI's expertise | "You are an expert content writer..." |
| Constraint Addition | Adds requirements | "Include headings, keywords, examples..." |
| Formatting | Applies structure rules | "Use Markdown with H2, H3 headings..." |
| Example Generation | Adds sample structures | "1. Compelling headline, 2. Introduction..." |
| Optimization | Refines for target model | Model-specific adjustments |

---

#### Step 4: Result & Actions

**Actions Available:**

```typescript
interface PromptActions {
  copy: () => void;      // Copy to clipboard
  save: () => void;      // Save to library
  export: (format) => void;  // Export as file
  share: () => void;     // Generate share link
  duplicate: () => void; // Create a copy
  versionHistory: () => void; // View versions
}
```

**Copy Flow:**
```typescript
async function copyPrompt(enhancedText: string) {
  await navigator.clipboard.writeText(enhancedText);
  showToast('Copied to clipboard!', 'success');
  
  // Track usage
  await trackEvent('prompt_copied', { promptId });
}
```

**Save Flow:**
```typescript
async function savePrompt(promptId: string, metadata: SaveMetadata) {
  await db.prompt.update({
    where: { id: promptId },
    data: {
      title: metadata.title,
      tags: metadata.tags,
      collectionId: metadata.collectionId,
      savedAt: new Date(),
      isSaved: true,
    },
  });
  
  showToast('Prompt saved to library!', 'success');
}
```

**Export Flow:**
```typescript
async function exportPrompt(promptId: string, format: ExportFormat) {
  const prompt = await db.prompt.findUnique({ where: { id: promptId } });
  
  let content: string;
  let filename: string;
  let mimeType: string;
  
  switch (format) {
    case 'txt':
      content = prompt.enhancedText;
      filename = `${prompt.title}.txt`;
      mimeType = 'text/plain';
      break;
    case 'json':
      content = JSON.stringify(prompt, null, 2);
      filename = `${prompt.title}.json`;
      mimeType = 'application/json';
      break;
    case 'md':
      content = `# ${prompt.title}\n\n${prompt.enhancedText}`;
      filename = `${prompt.title}.md`;
      mimeType = 'text/markdown';
      break;
    case 'pdf':
      // Generate PDF
      const pdf = await generatePDF(prompt);
      return downloadFile(pdf, `${prompt.title}.pdf`, 'application/pdf');
  }
  
  downloadFile(content, filename, mimeType);
  showToast('Exported successfully!', 'success');
}
```

---

## 2. Prompt Analyzer Flow

### Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                   ANALYSIS PIPELINE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input: "Write me a blog post about AI"                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 1: TEXT CLEANING                             │   │
│  │  - Normalize whitespace                             │   │
│  │  - Fix encoding issues                              │   │
│  │  - Remove special characters                        │   │
│  │  Output: "Write me a blog post about AI"            │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 2: GRAMMAR CHECK                             │   │
│  │  - Check grammar rules                              │   │
│  │  - Identify errors                                  │   │
│  │  - Suggest corrections                              │   │
│  │  Output: { errors: [], suggestions: [] }            │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 3: INTENT DETECTION                          │   │
│  │  - Classify user intent                             │   │
│  │  - Map to predefined categories                     │   │
│  │  - Calculate confidence score                       │   │
│  │  Output: { intent: "content_generation", conf: 0.95 }│  │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 4: CATEGORY CLASSIFICATION                   │   │
│  │  - Identify content type                            │   │
│  │  - Determine specific category                      │   │
│  │  - Map to template family                           │   │
│  │  Output: { category: "blog_post", family: "content" }│  │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 5: ENTITY RECOGNITION                        │   │
│  │  - Extract named entities                           │   │
│  │  - Identify key terms                               │   │
│  │  - Map relationships                                │   │
│  │  Output: { entities: ["AI", "blog", "post"] }       │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 6: CONTEXT DETECTION                         │   │
│  │  - Understand surrounding context                   │   │
│  │  - Identify topic domain                            │   │
│  │  - Determine specificity level                      │   │
│  │  Output: { context: ["technology", "writing"] }     │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 7: COMPLEXITY CALCULATION                    │   │
│  │  - Analyze sentence structure                       │   │
│  │  - Measure vocabulary level                         │   │
│  │  - Assess technical depth                           │   │
│  │  Output: { complexity: 2, scale: "simple" }         │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 8: MISSING REQUIREMENTS                      │   │
│  │  - Compare against best practices                   │   │
│  │  - Identify gaps                                    │   │
│  │  - Prioritize missing elements                      │   │
│  │  Output: { missing: ["audience", "tone", "length"] }│  │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 9: SUGGESTIONS                               │   │
│  │  - Generate improvement suggestions                 │   │
│  │  - Provide actionable advice                        │   │
│  │  - Rank by impact                                   │   │
│  │  Output: { suggestions: ["...", "...", "..."] }     │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 10: JSON RESPONSE                            │   │
│  │  - Assemble final output                            │   │
│  │  - Add metadata                                     │   │
│  │  - Return structured response                       │   │
│  │  Output: AnalysisResult                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Analysis Input/Output Schema

**Input:**
```typescript
interface AnalysisInput {
  text: string;           // The prompt to analyze
  model?: string;         // Target AI model (optional)
  category?: string;      // Hint category (optional)
}
```

**Output:**
```typescript
interface AnalysisOutput {
  // Core Analysis
  intent: IntentType;
  category: CategoryType;
  complexity: ComplexityLevel;
  confidence: number;
  
  // Detailed Breakdown
  entities: Entity[];
  context: ContextInfo;
  keywords: string[];
  
  // Quality Assessment
  missing: MissingRequirement[];
  suggestions: Suggestion[];
  score: {
    clarity: number;
    specificity: number;
    context: number;
    completeness: number;
    overall: number;
  };
  
  // Metadata
  processingTime: number;
  modelUsed: string;
  timestamp: Date;
}
```

---

## 3. AI Enhancement Flow

### Enhancement Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                  ENHANCEMENT PIPELINE                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Input: "Write me a blog post about AI"                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 1: TEMPLATE SELECTION                        │   │
│  │                                                     │   │
│  │  Based on: category="blog_post", intent="content"   │   │
│  │                                                     │   │
│  │  Selected: "Blog Post Enhancement Template"         │   │
│  │                                                     │   │
│  │  Template includes:                                 │   │
│  │  - Role: "Expert content writer"                    │   │
│  │  - Structure: Introduction → Body → Conclusion      │   │
│  │  - Format: Markdown with headings                   │   │
│  │  - Keywords: SEO-optimized                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 2: CONTEXT EXPANSION                         │   │
│  │                                                     │   │
│  │  Adds: "Write a comprehensive, SEO-optimized        │   │
│  │         blog post about Artificial Intelligence     │   │
│  │         (AI)."                                      │   │
│  │                                                     │   │
│  │  Why: The original is too vague. Adding "compre-    │   │
│  │       hensive" and "SEO-optimized" gives the AI     │   │
│  │       clear quality expectations.                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 3: ROLE ASSIGNMENT                           │   │
│  │                                                     │   │
│  │  Adds: "You are an expert content writer and SEO    │   │
│  │         specialist with 10+ years of experience     │   │
│  │         writing about technology."                  │   │
│  │                                                     │   │
│  │  Why: Role assignment improves output quality by    │   │
│  │       20-40%. It sets expertise level and domain.   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 4: CONSTRAINT ADDITION                       │   │
│  │                                                     │   │
│  │  Adds:                                              │   │
│  │  - "Target audience: [specify your audience]"       │   │
│  │  - "Tone: [professional/casual/technical]"          │   │
│  │  - "Length: [500/1000/2000] words"                  │   │
│  │  - "Keywords to include: AI, artificial             │   │
│  │     intelligence, machine learning"                 │   │
│  │                                                     │   │
│  │  Why: Constraints guide the AI to produce content   │   │
│  │       that matches user expectations.               │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 5: FORMATTING                                │   │
│  │                                                     │   │
│  │  Adds: "Format: Markdown with H2, H3 headings"      │   │
│  │                                                     │   │
│  │  Why: Formatting rules ensure consistent,           │   │
│  │       readable output structure.                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 6: EXAMPLE GENERATION                        │   │
│  │                                                     │   │
│  │  Adds: "Structure:                                  │   │
│  │         1. Compelling headline                      │   │
│  │         2. Introduction (hook + context)            │   │
│  │         3. Main sections (3-5 key points)           │   │
│  │         4. Practical examples                       │   │
│  │         5. Conclusion (CTA)"                        │   │
│  │                                                     │   │
│  │  Why: Examples demonstrate expected structure and   │   │
│  │       help the AI follow the format.                │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Stage 7: OPTIMIZATION                              │   │
│  │                                                     │   │
│  │  Model-specific adjustments:                        │   │
│  │  - ChatGPT: Add "Be concise" for GPT-4o-mini       │   │
│  │  - Claude: Add "Be thorough" for detailed output    │   │
│  │  - Gemini: Add "Use structured output"              │   │
│  │                                                     │   │
│  │  Final polish:                                      │   │
│  │  - Remove redundancy                                │   │
│  │  - Improve flow                                     │   │
│  │  - Ensure clarity                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                         ▼                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  OUTPUT: ENHANCED PROMPT                            │   │
│  │                                                     │   │
│  │  "You are an expert content writer and SEO          │   │
│  │   specialist with 10+ years of experience writing   │   │
│  │   about technology.                                 │   │
│  │                                                     │   │
│  │   Write a comprehensive, SEO-optimized blog post    │   │
│  │   about Artificial Intelligence (AI).               │   │
│  │                                                     │   │
│  │   Requirements:                                     │   │
│  │   - Target audience: [specify your audience]        │   │
│  │   - Tone: [professional/casual/technical]           │   │
│  │   - Length: [500/1000/2000] words                   │   │
│  │   - Format: Markdown with H2, H3 headings           │   │
│  │   - Include: Introduction hook, key concepts,       │   │
│  │     practical examples, and a conclusion            │   │
│  │   - Keywords to include: AI, artificial             │   │
│  │     intelligence, machine learning                  │   │
│  │                                                     │   │
│  │   Structure:                                        │   │
│  │   1. Compelling headline                            │   │
│  │   2. Introduction (hook + context)                  │   │
│  │   3. Main sections (3-5 key points)                 │   │
│  │   4. Practical examples                             │   │
│  │   5. Conclusion (CTA)                               │   │
│  │                                                     │   │
│  │   Make it engaging, informative, and shareable."    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Enhancement Quality Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Clarity | 65 | 92 | +42% |
| Specificity | 40 | 85 | +113% |
| Context | 30 | 88 | +193% |
| Completeness | 25 | 83 | +232% |
| **Overall** | **45** | **87** | **+93%** |

---

## 4. Prompt Comparison Flow

### Comparison Interface

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPARE PROMPTS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Select Prompt A: [Search... ▼]    Select Prompt B: [Search... ▼]
│                                                             │
│  ┌─────────────────────────────┬─────────────────────────┐  │
│  │  PROMPT A (Original)        │  PROMPT B (Enhanced)    │  │
│  │                             │                         │  │
│  │  "Write me a blog post      │  "You are an expert     │  │
│  │   about AI"                 │   content writer...     │  │
│  │                             │                         │  │
│  │  ─────────────────────────  │  ─────────────────────  │  │
│  │                             │                         │  │
│  │  Score: 45/100              │  Score: 87/100          │  │
│  │  Words: 8                   │  Words: 156             │  │
│  │  Sentences: 1               │  Sentences: 12          │  │
│  │  Readability: Simple        │  Readability: Prof.     │  │
│  │                             │                         │  │
│  │  [Edit] [Copy]              │  [Edit] [Copy]          │  │
│  └─────────────────────────────┴─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  DIFF VIEW                                          │   │
│  │                                                     │   │
│  │  [Original] "Write me a blog post about AI"         │   │
│  │              ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓ ↓       │   │
│  │  [Enhanced]  "You are an expert content writer      │   │
│  │               and SEO specialist with 10+ years     │   │
│  │               of experience writing about           │   │
│  │               technology.                           │   │
│  │                                                     │   │
│  │               Write a comprehensive, SEO-optimized  │   │
│  │               blog post about Artificial            │   │
│  │               Intelligence (AI).                    │   │
│  │                                                     │   │
│  │               Requirements:                         │   │
│  │               - Target audience: [specify]"         │   │
│  │                                                     │   │
│  │  Added: 148 words (+1850%)                          │   │
│  │  Score improvement: +42 points (+93%)               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  CHANGES SUMMARY                                    │   │
│  │                                                     │   │
│  │  ✅ Added role context (+15% clarity)               │   │
│  │  ✅ Added structure (+20% completeness)             │   │
│  │  ✅ Added formatting (+10% specificity)             │   │
│  │  ✅ Added examples (+12% context)                   │   │
│  │  ✅ Added keywords (+8% relevance)                  │   │
│  │  ✅ Added CTA (+5% actionability)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [📤 Export Comparison] [💾 Save as Version]         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Comparison Backend

```typescript
async function comparePrompts(promptIdA: string, promptIdB: string) {
  const [promptA, promptB] = await Promise.all([
    db.prompt.findUnique({ where: { id: promptIdA } }),
    db.prompt.findUnique({ where: { id: promptIdB } }),
  ]);
  
  // 1. Word count comparison
  const wordCountA = promptA.enhancedText.split(/\s+/).length;
  const wordCountB = promptB.enhancedText.split(/\s+/).length;
  
  // 2. Score comparison
  const scoreDiff = promptB.score.overall - promptA.score.overall;
  const scoreImprovement = (scoreDiff / promptA.score.overall) * 100;
  
  // 3. Diff calculation
  const diff = computeDiff(promptA.enhancedText, promptB.enhancedText);
  
  // 4. Change detection
  const changes = detectChanges(promptA.enhancedText, promptB.enhancedText);
  
  // 5. Readability comparison
  const readabilityA = calculateReadability(promptA.enhancedText);
  const readabilityB = calculateReadability(promptB.enhancedText);
  
  return {
    promptA: {
      text: promptA.enhancedText,
      score: promptA.score,
      wordCount: wordCountA,
      readability: readabilityA,
    },
    promptB: {
      text: promptB.enhancedText,
      score: promptB.score,
      wordCount: wordCountB,
      readability: readabilityB,
    },
    comparison: {
      wordCountDiff: wordCountB - wordCountA,
      wordCountImprovement: ((wordCountB - wordCountA) / wordCountA) * 100,
      scoreDiff,
      scoreImprovement,
      diff,
      changes,
    },
  };
}
```

---

## 5. Prompt History Flow

### History View

```
┌─────────────────────────────────────────────────────────────┐
│                   PROMPT HISTORY                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Search: [Search history...]                                │
│                                                             │
│  Filters: [Date ▼] [Action ▼] [Model ▼] [Clear All]        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TODAY                                             │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  🕐 10:45 AM — Prompt Enhanced               │  │   │
│  │  │     "Write me a blog post about AI"          │  │   │
│  │  │     Model: ChatGPT | Score: 45 → 87          │  │   │
│  │  │     [View] [Copy] [Delete]                   │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  🕐 09:30 AM — Prompt Saved                  │  │   │
│  │  │     "Generate Python function"               │  │   │
│  │  │     Model: Claude | Score: 82                │  │   │
│  │  │     [View] [Copy] [Delete]                   │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  │  YESTERDAY                                         │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │  🕐 03:15 PM — Prompt Created                │  │   │
│  │  │     "Email template for client"              │  │   │
│  │  │     Model: GPT-4o | Score: 71                │  │   │
│  │  │     [View] [Copy] [Delete]                   │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Load More]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### History Database Interactions

```typescript
// Get history with filters
async function getHistory(userId: string, filters: HistoryFilters) {
  const where: Prisma.PromptWhereInput = {
    userId,
    ...(filters.dateFrom && { createdAt: { gte: filters.dateFrom } }),
    ...(filters.dateTo && { createdAt: { lte: filters.dateTo } }),
    ...(filters.model && { model: filters.model }),
    ...(filters.action && { lastAction: filters.action }),
  };
  
  const history = await db.prompt.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters.limit || 20,
    skip: filters.offset || 0,
    include: {
      versions: { select: { score: true } },
      analyses: { select: { confidence: true } },
    },
  });
  
  // Transform to history items
  return history.map(prompt => ({
    id: prompt.id,
    action: prompt.lastAction,
    timestamp: prompt.createdAt,
    text: prompt.originalText.substring(0, 100),
    model: prompt.model,
    score: prompt.versions[0]?.score?.overall || 0,
  }));
}

// Delete history item
async function deleteHistoryItem(userId: string, promptId: string) {
  await db.prompt.delete({
    where: { id: promptId, userId },
  });
  
  // Also delete related data
  await db.version.deleteMany({ where: { promptId } });
  await db.analysis.deleteMany({ where: { promptId } });
}

// Clear all history
async function clearHistory(userId: string) {
  await db.prompt.deleteMany({
    where: { userId, isSaved: false }, // Only delete unsaved
  });
}
```

---

## 6. Collection Management Flow

### Create Collection

```
User clicks "Create Collection"
    │
    ▼
Modal:
┌─────────────────────────────────┐
│  Create Collection              │
│                                 │
│  Name: [________________]       │
│                                 │
│  Description: [____________]    │
│              [____________]     │
│                                 │
│  Color: [🔵] [🟢] [🟡] [🔴]   │
│                                 │
│  Icon: [📁] [📝] [💡] [🎯]     │
│                                 │
│  [Cancel]  [Create]             │
└─────────────────────────────────┘
    │
    ▼
POST /api/v1/collections
    │
    ▼
Collection created
    │
    ▼
Toast: "Collection created!"
    │
    ▼
Redirect to collection page
```

### Add Prompts to Collection

```
From Library or Prompt Detail:
    │
    ▼
Click "Add to Collection"
    │
    ▼
Dropdown/Modal:
┌─────────────────────────────────┐
│  Add to Collection              │
│                                 │
│  ☐ My Prompts                   │
│  ☐ Work Projects                │
│  ☐ Personal                     │
│  ☐ Research                     │
│                                 │
│  [+ Create New Collection]      │
│                                 │
│  [Add]                          │
└─────────────────────────────────┘
    │
    ▼
POST /api/v1/collections/:id/prompts
    │
    ▼
Toast: "Added to collection!"
```

### Bulk Actions

```
In Collection Detail view:
    │
    ▼
Select multiple prompts (checkboxes)
    │
    ▼
Bulk action bar appears:
┌─────────────────────────────────────────────────────┐
│  3 selected  [Export] [Remove] [Move to Collection] │
└─────────────────────────────────────────────────────┘
    │
    ▼
Action performed with confirmation
```

---

## 7. API Key Management Flow

### Add Provider

```
Click "Add Provider"
    │
    ▼
Provider Selection:
┌─────────────────────────────────┐
│  Select Provider                │
│                                 │
│  ┌───────────┐ ┌───────────┐   │
│  │  OpenAI   │ │ Anthropic │   │
│  └───────────┘ └───────────┘   │
│  ┌───────────┐ ┌───────────┐   │
│  │  Google   │ │    xAI    │   │
│  └───────────┘ └───────────┘   │
│  ┌───────────┐ ┌───────────┐   │
│  │ DeepSeek  │ │  Ollama   │   │
│  └───────────┘ └───────────┘   │
│  ┌───────────┐                 │
│  │ LM Studio │                 │
│  └───────────┘                 │
└─────────────────────────────────┘
    │
    ▼
Select provider (e.g., Anthropic)
    │
    ▼
Enter API Key:
┌─────────────────────────────────┐
│  Connect Anthropic              │
│                                 │
│  API Key:                       │
│  [sk-ant-api03-________________] │
│                                 │
│  Get your key from:             │
│  console.anthropic.com          │
│                                 │
│  [Test Connection]              │
│                                 │
│  Status: ⏳ Testing...          │
│  ─────────────────────────────  │
│  Status: ✅ Connection successful│
│  Models: Claude 3.5 Sonnet,     │
│          Claude 3 Opus,         │
│          Claude 3 Haiku         │
│                                 │
│  [Connect]                      │
└─────────────────────────────────┘
    │
    ▼
POST /api/v1/api-keys
    │
    ▼
API Key encrypted and stored
    │
    ▼
Toast: "Anthropic connected!"
    │
    ▼
Models available in dropdown
```

### Test Connection

```typescript
async function testConnection(provider: string, apiKey: string) {
  try {
    let result: TestResult;
    
    switch (provider) {
      case 'openai':
        result = await testOpenAI(apiKey);
        break;
      case 'anthropic':
        result = await testAnthropic(apiKey);
        break;
      case 'google':
        result = await testGoogle(apiKey);
        break;
      // ... other providers
    }
    
    return {
      success: true,
      models: result.models,
      rateLimit: result.rateLimit,
      quota: result.quota,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      suggestion: getSuggestion(error),
    };
  }
}
```

---

## 8. Template Usage Flow

### Browse Templates

```
Click "Templates"
    │
    ▼
Templates Page:
┌─────────────────────────────────────────────────────┐
│  Templates                                           │
│                                                     │
│  Search: [Search templates...]                      │
│                                                     │
│  ┌──────────┬───────────────────────────────────┐   │
│  │ CATEGORIES│  TEMPLATES                       │   │
│  │          │                                   │   │
│  │ Code (45)│  ┌─────────────────────────────┐ │   │
│  │ Content  │  │ Generate Python Function    │ │   │
│  │ Image    │  │ Create a well-documented... │ │   │
│  │ Data     │  │ ⭐ 4.8 | 1,234 uses         │ │   │
│  │ Email    │  │ [Use Template]              │ │   │
│  │ Education│  └─────────────────────────────┘ │   │
│  │ Business │                                   │   │
│  │ Creative │  ┌─────────────────────────────┐ │   │
│  │          │  │ Debug Code                  │ │   │
│  │          │  │ Analyze and fix bugs in...  │ │   │
│  │          │  │ ⭐ 4.9 | 987 uses           │ │   │
│  │          │  │ [Use Template]              │ │   │
│  │          │  └─────────────────────────────┘ │   │
│  └──────────┴───────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
    │
    ▼
Click "Use Template" on "Generate Python Function"
    │
    ▼
Template Detail:
┌─────────────────────────────────────────────────────┐
│  Generate Python Function                           │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  TEMPLATE PREVIEW                           │   │
│  │                                             │   │
│  │  "Create a well-documented Python function  │   │
│  │   called {{function_name}} that             │   │
│  │   {{description}}.                          │   │
│  │                                             │   │
│  │   Parameters: {{parameters}}                │   │
│  │   Return type: {{return_type}}              │   │
│  │                                             │   │
│  │   Include:                                  │   │
│  │   - Type hints                              │   │
│  │   - Docstring                               │   │
│  │   - Error handling                          │   │
│  │   - Example usage"                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  VARIABLES:                                         │
│                                                     │
│  function_name: [calculate_distance____________]    │
│                                                     │
│  description: [Calculate distance between___]       │
│               [two points___________________]       │
│                                                     │
│  parameters: [x1, y1, x2, y2 (float)________]      │
│                                                     │
│  return_type: [float ▼]                             │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  LIVE PREVIEW                              │   │
│  │                                             │   │
│  │  "Create a well-documented Python function  │   │
│  │   called calculate_distance that            │   │
│  │   calculates the distance between two       │   │
│  │   points.                                   │   │
│  │                                             │   │
│  │   Parameters: x1, y1, x2, y2 (float)       │   │
│  │   Return type: float                        │   │
│  │                                             │   │
│  │   Include:                                  │   │
│  │   - Type hints                              │   │
│  │   - Docstring                               │   │
│  │   - Error handling                          │   │
│  │   - Example usage"                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Use Template]                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
    │
    ▼
Click "Use Template"
    │
    ▼
Redirect to Prompt Builder with pre-filled prompt
    │
    ▼
Continue with normal flow (Analyze → Enhance → Result)
```

---

## 9. Authentication Flow

### Email/Password Signup

```
Click "Get Started"
    │
    ▼
Signup Page:
┌─────────────────────────────────┐
│  Create Account                 │
│                                 │
│  Name: [________________]       │
│  Email: [________________]      │
│  Password: [________________]   │
│  Confirm: [________________]    │
│                                 │
│  [Sign Up]                      │
│                                 │
│  ─── or continue with ───      │
│                                 │
│  [🔵 Google] [⚫ GitHub]        │
│                                 │
│  Already have an account?       │
│  Log In                         │
└─────────────────────────────────┘
    │
    ▼
Client validation (Zod schema)
    │
    ▼
POST /api/v1/auth/signup
    │
    ▼
Server:
1. Validate input
2. Check email availability
3. Hash password (bcrypt)
4. Create user record
5. Generate verification token
6. Send verification email
7. Generate JWT tokens
    │
    ▼
Response: { user, accessToken, refreshToken }
    │
    ▼
Store tokens (httpOnly cookie + memory)
    │
    ▼
Redirect to Onboarding
```

### OAuth Login (Google)

```
Click "Continue with Google"
    │
    ▼
Redirect to Google OAuth:
https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=...
  &redirect_uri=...
  &scope=openid email profile
  &response_type=code
    │
    ▼
User consents on Google
    │
    ▼
Redirect back to /auth/callback?code=...
    │
    ▼
Server:
1. Exchange code for tokens
2. Get user info from Google
3. Find or create user
4. Generate JWT tokens
    │
    ▼
Response: { user, accessToken, refreshToken }
    │
    ▼
Redirect to Dashboard (or Onboarding if new)
```

### Session Refresh

```typescript
// Token refresh interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken: getRefreshToken(),
        });
        
        // Update tokens
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${data.accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```
