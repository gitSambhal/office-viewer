import {
  CreateMLCEngine,
  MLCEngineInterface,
  InitProgressCallback,
  prebuiltAppConfig,
} from '@mlc-ai/web-llm';

// AI Model configurations - using smaller models for faster downloads
// AI Model configurations - dynamically loaded from WebLLM prebuilt config
// Filter out embedding models - they cannot be used for chat completion
const processedModels = prebuiltAppConfig.model_list
  .filter((model) => {
    // Exclude embedding models (they use EmbeddingPipeline, not LLMChatPipeline)
    const isEmbeddingModel = model.model_id.toLowerCase().includes('embed');
    return !isEmbeddingModel;
  })
  .map((model) => {
    const vram = model.vram_required_MB || 2500;
    const sizeStr =
      vram > 1024 ? `${(vram / 1024).toFixed(1)} GB` : `${Math.round(vram)} MB`;

    // Format display name
    let name = model.model_id.replace(/-MLC/g, '').replace(/-/g, ' ');

    // Heuristic for performance
    let perf = 'Medium';
    if (vram < 1500) perf = 'Fastest';
    else if (vram < 4000) perf = 'Fast';
    else if (vram > 8000) perf = 'Slow';

    return {
      id: model.model_id,
      displayName: name,
      description: `Requires ~${sizeStr} VRAM`,
      size: sizeStr,
      minMemory: sizeStr,
      performance: perf,
      isDefault: model.model_id === 'smollm2-135m-MLC', // Set smollm2-135m as default
    };
  });

// Ensure only unique models are kept, based on their ID
const uniqueModels = Array.from(
  new Map(processedModels.map((model) => [model.id, model])).values()
);

export const AI_MODELS = uniqueModels;

// Fallback default if specific one not found
if (!AI_MODELS.some((m) => m.isDefault) && AI_MODELS.length > 0) {
  AI_MODELS[0].isDefault = true;
}

// Storage key for selected model
const SELECTED_MODEL_KEY = 'ai-selected-model';
const DOWNLOADED_MODELS_KEY = 'ai-downloaded-models';

// Get the default model (first one marked as default)
export function getDefaultModel(): string {
  const defaultModel = AI_MODELS.find((m) => m.isDefault);
  return defaultModel?.id || AI_MODELS[0].id;
}

// Get saved selected model from localStorage, or default
export function getSelectedModel(): string {
  const saved = localStorage.getItem(SELECTED_MODEL_KEY);
  if (saved && AI_MODELS.some((m) => m.id === saved)) {
    return saved;
  }
  return getDefaultModel();
}

// Save selected model to localStorage
export function setSelectedModel(modelId: string): void {
  localStorage.setItem(SELECTED_MODEL_KEY, modelId);
}

// Get list of downloaded models
export function getDownloadedModels(): string[] {
  try {
    const saved = localStorage.getItem(DOWNLOADED_MODELS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Add a model to downloaded list
export function addDownloadedModel(modelId: string): void {
  const downloaded = getDownloadedModels();
  if (!downloaded.includes(modelId)) {
    downloaded.push(modelId);
    localStorage.setItem(DOWNLOADED_MODELS_KEY, JSON.stringify(downloaded));
  }
}

// Remove a model from downloaded list
export function removeDownloadedModel(modelId: string): void {
  const downloaded = getDownloadedModels();
  const updated = downloaded.filter((id) => id !== modelId);
  localStorage.setItem(DOWNLOADED_MODELS_KEY, JSON.stringify(updated));
}

// Check if a model is downloaded
export function isModelDownloaded(modelId: string): boolean {
  return getDownloadedModels().includes(modelId);
}

// Get model info by ID
export function getModelInfo(modelId: string) {
  return AI_MODELS.find((m) => m.id === modelId);
}

// Global state for tracking active operations
let isGenerating = false;

let engine: MLCEngineInterface | null = null;
let isInitializing = false;
let initializationPromise: Promise<void> | null = null;
let currentModelId: string = getSelectedModel();

export interface ExtendedInitProgressReport {
  progress: number;
  timeElapsed: number;
  text: string;
  eta?: number;
  status: 'downloading' | 'compiling' | 'initializing' | 'ready';
  downloadedBytes?: number;
  totalBytes?: number;
}

export type ExtendedInitProgressCallback = (
  report: ExtendedInitProgressReport
) => void;

// Initialize AI engine with specific model
export async function initializeAI(
  modelId?: string,
  onProgress?: ExtendedInitProgressCallback
): Promise<MLCEngineInterface> {
  const targetModel = modelId || getSelectedModel();
  currentModelId = targetModel;

  // If we already have an engine initialized with the same model, return it
  if (engine && currentModelId === targetModel) {
    return engine;
  }

  // If we're initializing, wait for it to complete
  if (isInitializing && initializationPromise) {
    return initializationPromise.then(() => engine!);
  }

  isInitializing = true;

  try {
    initializationPromise = new Promise((resolve, reject) => {
      console.log(`[AI Service] Initializing model: ${targetModel}`);

      const progressCallback: InitProgressCallback = (report) => {
        const extendedReport: ExtendedInitProgressReport = {
          ...report,
          eta:
            report.progress > 0
              ? (report.timeElapsed / report.progress) * (1 - report.progress)
              : undefined,
          status: determineStatus(report.text),
        };

        if (onProgress) {
          onProgress(extendedReport);
        }
      };

      // Check if model is already downloaded
      if (isModelDownloaded(targetModel)) {
        console.log(
          `[AI Service] Model ${targetModel} already downloaded, loading from cache`
        );
      }

      CreateMLCEngine(targetModel, {
        appConfig: prebuiltAppConfig,
        initProgressCallback: progressCallback,
      })
        .then((initializedEngine) => {
          engine = initializedEngine;
          addDownloadedModel(targetModel);
          setSelectedModel(targetModel);
          console.log('[AI Service] WebLLM engine initialized successfully');
          resolve();
        })
        .catch((error) => {
          console.error(
            '[AI Service] Error initializing WebLLM engine:',
            error
          );
          reject(error);
        });
    });

    await initializationPromise;
    return engine!;
  } catch (error) {
    console.error('[AI Service] Error in initializeAI:', error);
    isInitializing = false;
    initializationPromise = null;
    throw error;
  } finally {
    if (initializationPromise) {
      initializationPromise.finally(() => {
        isInitializing = false;
        initializationPromise = null;
      });
    }
  }
}

// Determine status from progress text
function determineStatus(text: string): ExtendedInitProgressReport['status'] {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('download') || lowerText.includes('fetch')) {
    return 'downloading';
  }
  if (lowerText.includes('compil') || lowerText.includes('optimize')) {
    return 'compiling';
  }
  if (lowerText.includes('init') || lowerText.includes('start')) {
    return 'initializing';
  }
  return 'ready';
}

// Switch to a different model
export async function switchModel(
  modelId: string,
  onProgress?: ExtendedInitProgressCallback
): Promise<MLCEngineInterface> {
  // Cleanup current engine
  if (engine) {
    try {
      await engine.unload();
      engine = null;
    } catch (error) {
      console.error('[AI Service] Error unloading current engine:', error);
    }
  }

  // Reset initialization state
  isInitializing = false;
  initializationPromise = null;

  // Initialize with new model
  return initializeAI(modelId, onProgress);
}

// Cancel ongoing initialization
export function cancelInitialization(): void {
  if (isInitializing) {
    console.log('[AI Service] Cancelling initialization');
    isInitializing = false;
    initializationPromise = null;
  }
}

// Summarize text content with streaming support
export async function summarizeText(
  text: string,
  onProgress?: (chunk: string) => void,
  fileName?: string
): Promise<string> {
  if (!engine) {
    await initializeAI();
  }

  const maxTokens = 1500;
  const charsPerToken = 1.5;
  const maxLength = Math.floor(maxTokens * charsPerToken);
  let truncatedText = text;
  if (text.length > maxLength) {
    truncatedText = text.substring(0, maxLength);
    const lastBoundary = Math.max(
      truncatedText.lastIndexOf('\n'),
      truncatedText.lastIndexOf('.')
    );
    if (lastBoundary > maxLength * 0.7) {
      truncatedText = truncatedText.substring(0, lastBoundary + 1);
    }
    truncatedText += '... [text truncated]';
  }

  const prompt = `Analyze this document content and provide:
### 📑 EXECUTIVE SUMMARY
Summarize objectively in 2 sentences.

### 💡 CRITICAL DATA POINTS
3-5 high-impact, verifiable facts (names, dates, numbers).

### 🎯 KEY TAKEAWAY
The single most important conclusion.

DOC CONTENT:
"""
${truncatedText}
"""

STRICT PROTOCOL: EVIDENCE ONLY. NO GUESSING.
BEGIN ANALYSIS:`;

  try {
    console.log('[AI Service] Generating summary...');
    console.log(
      `[AI Service] Input length: ${truncatedText.length} chars, estimated tokens: ${Math.ceil(truncatedText.length / 2.5)}`
    );

    // Track generation state
    isGenerating = true;

    let fullContent = '';

    const asyncIter = await engine!.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are a professional document analyst. You output ONLY accurate facts from the source. You never hallucinate or guess.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.0,
      max_tokens: 800,
      stream: true,
    });

    for await (const chunk of asyncIter) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      if (onProgress) onProgress(fullContent);
    }

    return fullContent.trim();
  } catch (error: any) {
    // Handle abort gracefully
    if (error.name === 'AbortError' || error.message.includes('interrupted')) {
      console.log('[AI Service] Summary generation aborted');
      throw new Error('Generation interrupted');
    }

    // Handle tokenizer/binding errors - reset engine
    if (
      error.message?.includes('deleted object') ||
      error.message?.includes('Tokenizer')
    ) {
      console.warn(
        '[AI Service] Tokenizer error detected, resetting engine...'
      );
      try {
        await cleanupAI();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    console.error('[AI Service] Error generating summary:', error);
    if (
      error instanceof Error &&
      (error.message.includes('ContextWindowSizeExceededError') ||
        error.message.includes('prompt tokens exceed'))
    ) {
      throw new Error(
        'Document too large to summarize. Please try with a shorter document or extract specific sections.'
      );
    }
    throw new Error('Failed to generate summary');
  } finally {
    isGenerating = false;
  }
}

// Answer questions about document content with streaming and history support
export async function askQuestion(
  context: string,
  question: string,
  history: { role: 'user' | 'assistant'; content: string }[] = [],
  onProgress?: (chunk: string) => void,
  fileName?: string
): Promise<string> {
  if (!engine) {
    await initializeAI();
  }

  const maxTokens = 1200;
  const charsPerToken = 1.5;
  const maxLength = Math.floor(maxTokens * charsPerToken);
  const truncatedContext =
    context.length > maxLength
      ? context.substring(0, maxLength) + '... [truncated]'
      : context;

  console.log(
    `[AI Service] Context size: ${context.length} chars. Snippet: "${context.substring(0, 100)}..."`
  );

  const systemPrompt = `You are an Absolute-Truth-First Document Analyst. Your purpose is to provide surgically accurate metadata from the document.

[DOCUMENT SOURCE DATA START]
${truncatedContext}
[DOCUMENT SOURCE DATA END]

CRITICAL OPERATIONAL CONSTRAINTS:
1. DOCUMENT OVERRIDE: The [DOCUMENT SOURCE DATA] is the SUPREME authority. If a user suggests $X$ but the document says $Y$, you MUST say: "According to the document, Y is the case, correcting your mention of X."
2. NO HALLUCINATION: You are a "Stateless Fact Engine". Do not remember anything outside this chat and this document.
3. METADATA TRUST: The file name is "${fileName || 'Unknown'}". Trust only the numbers and labels in the scan.
4. NO APPROXIMATIONS: Prohibited words: "likely", "probably", "seems", "estimate", "approximate". Use "Explicitly stated:" or "No data available:".
5. SILENCE ON UNKNOWN: If the answer is not in the text, you MUST state: "I'm sorry, but that specific data point is not explicitly present in the provided document source."
6. NO SMALL TALK: Zero intro/outro. Direct answer only.

USER QUERY:`;

  const recentHistory = history.slice(-10);
  const messages: any[] = [{ role: 'system', content: systemPrompt }];

  const historyIncludesQuestion =
    recentHistory.length > 0 &&
    recentHistory[recentHistory.length - 1].content === question &&
    recentHistory[recentHistory.length - 1].role === 'user';

  messages.push(...recentHistory);

  if (!historyIncludesQuestion) {
    messages.push({ role: 'user', content: question });
  }

  try {
    console.log('[AI Service] Generating answer with history...');
    console.log(
      `[AI Service] Context length: ${truncatedContext.length} chars, estimated tokens: ${Math.ceil(truncatedContext.length / 2.5)}, history messages: ${recentHistory.length}`
    );

    // Track generation state
    isGenerating = true;

    let fullContent = '';

    const asyncIter = await engine!.chat.completions.create({
      messages,
      temperature: 0.0,
      max_tokens: 800,
      stream: true,
    });

    for await (const chunk of asyncIter) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      if (onProgress) onProgress(fullContent);
    }

    return fullContent.trim();
  } catch (error: any) {
    // Handle abort gracefully
    if (error.name === 'AbortError' || error.message?.includes('interrupted')) {
      console.log('[AI Service] QA generation aborted');
      throw new Error('Generation interrupted');
    }

    // Handle tokenizer/binding errors - reset engine
    if (
      error.message?.includes('deleted object') ||
      error.message?.includes('Tokenizer')
    ) {
      console.warn(
        '[AI Service] Tokenizer error detected, resetting engine...'
      );
      try {
        await cleanupAI();
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    console.error('[AI Service] Error generating answer:', error);
    if (
      error instanceof Error &&
      (error.message.includes('ContextWindowSizeExceededError') ||
        error.message.includes('prompt tokens exceed'))
    ) {
      throw new Error(
        'Document context too large. Please try with a shorter document or ask about specific sections.'
      );
    }
    throw new Error('Failed to generate answer');
  } finally {
    isGenerating = false;
  }
}

// Cleanup AI engine
export async function cleanupAI(): Promise<void> {
  console.log('[AI Service] Cleaning up AI engine...');

  // First interrupt any ongoing generation
  if (isGenerating && engine) {
    try {
      await engine.interruptGenerate();
      console.log('[AI Service] Interrupted ongoing generation');
      // Give a small delay for the interrupt to take effect
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.warn(
        '[AI Service] Error interrupting generation during cleanup:',
        error
      );
    }
  }

  // Reset generation state
  isGenerating = false;

  if (engine) {
    const engineToCleanup = engine;
    engine = null; // Set to null first to prevent other operations from using it

    try {
      // Add a small delay before unload to allow GPU operations to complete
      await new Promise((resolve) => setTimeout(resolve, 200));
      await engineToCleanup.unload();
      console.log('[AI Service] WebLLM engine terminated');
    } catch (error) {
      // Suppress cleanup errors - web-llm has known issues with cleanup
      // This prevents the GPUBuffer unmapped error from being shown
      console.warn(
        '[AI Service] Engine cleanup completed with warnings:',
        error
      );
    }
  }
}

// Stop the current generation
export async function stopGeneration(): Promise<void> {
  if (engine && isGenerating) {
    try {
      await engine.interruptGenerate();
      console.log('[AI Service] Generation interrupted by user');
    } catch (error) {
      console.error('[AI Service] Error interrupting generation:', error);
    } finally {
      isGenerating = false;
    }
  } else {
    isGenerating = false;
  }
}

// Check if AI engine is initialized
export function isAIInitialized(): boolean {
  return !!engine;
}

// Check if AI engine is initializing
export function isAIInitializing(): boolean {
  return isInitializing;
}

// Get the currently selected model ID
export function getCurrentModelId(): string {
  return currentModelId;
}

// Get all available models
export function getAvailableModels() {
  return AI_MODELS;
}
