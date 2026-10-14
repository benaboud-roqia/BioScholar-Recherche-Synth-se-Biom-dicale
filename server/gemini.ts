import { GoogleGenAI, Type } from '@google/genai';
import type { BiomedicalArticle, ChatMessage, SummarizeRequest, SummarizeResponse } from './types';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function normalizeModelName(requested?: string): string {
  if (!requested) return 'gemini-3.8-flash';
  const clean = requested.replace(/^models\//, '');
  if (clean.includes('argon')) return 'gemini-4-argon';
  if (clean.includes('flash-lite')) return 'gemini-3.1-flash-lite';
  if (clean.includes('flash')) return 'gemini-3.8-flash';
  return 'gemini-3.8-flash';
}

/**
 * Generate multi-turn chat response with strict biomedical grounding and verifiable citations
 */
export async function generateBiomedicalChat(params: {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  contextArticles: BiomedicalArticle[];
  personaRole?: string;
  model?: string;
}) {
  const ai = getGeminiClient();
  const modelName = normalizeModelName(params.model);

  const persona =
    params.personaRole ||
    'Senior Biomedical Research Scientist & Systematic Evidence Specialist';

  // Build the corpus context
  let corpusText = '';
  if (params.contextArticles && params.contextArticles.length > 0) {
    corpusText = params.contextArticles
      .map((art, idx) => {
        const authors = art.authors.map((a) => a.name).slice(0, 3).join(', ') +
          (art.authors.length > 3 ? ' et al.' : '');
        return `[ARTICLE ${idx + 1}]
PMID: ${art.pmid || 'N/A'}
DOI: ${art.doi || 'N/A'}
Title: ${art.title}
Authors: ${authors} (${art.year})
Journal: ${art.journal}
Abstract / Content:
${art.abstract}`;
      })
      .join('\n\n---\n\n');
  }

  const systemInstruction = `You are an elite AI ${persona}.
Your mission is to analyze biomedical literature provided by the user, summarize articles, and answer queries with verifiable, verifiable citations.

CRITICAL EVIDENCE RULES:
1. Ground your answers strictly in the provided articles when available.
2. Every major scientific assertion, therapeutic finding, statistic, or numerical outcome must include a citation in the format [PMID: <pmid>] or [Author et al., Year] (e.g. [PMID: 38289412] or [Chen et al., 2024]).
3. If an article does not contain enough data to answer a specific question, clearly state the limitation rather than speculating or hallucinating.
4. Distinguish between experimental evidence (in vitro, in vivo animal models, Phase 1/2/3 human trials) and observational or computational predictions.
5. Structure answers cleanly using Markdown headers, bullet points, and concise comparative summaries when relevant.
6. The user may write in French or English. Always respond politely in the language used by the user in their latest prompt (French by default if French query is used).

AVAILABLE CORPUS OF ARTICLES:
${corpusText || '(No specific articles loaded in corpus yet. Rely on verified peer-reviewed scientific consensus and encourage loading articles for verified grounding.)'}
`;

  // Format messages for Gemini API
  // Filter out system messages since we pass it in systemInstruction
  const contents = params.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: 'Bonjour, peux-tu te présenter et m\'expliquer comment tu analyses les publications biomédicales ?' }],
    });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents,
    config: {
      systemInstruction,
      temperature: 0.2, // Low temperature for high factual accuracy
      topP: 0.95,
    },
  });

  const replyText = response.text || 'Unable to generate biomedical response.';

  // Extract citations mentioned in response
  const citations = extractVerifiableCitations(replyText, params.contextArticles);

  return {
    content: replyText,
    citations,
    modelUsed: modelName,
  };
}

/**
 * Generate a rigorous structured scientific summary for single or multiple articles
 */
export async function generateBiomedicalSummary(req: SummarizeRequest): Promise<SummarizeResponse> {
  const ai = getGeminiClient();
  const modelName = normalizeModelName(req.model);

  const articlesToProcess: BiomedicalArticle[] = [];
  if (req.article) articlesToProcess.push(req.article);
  if (req.articles) {
    for (const a of req.articles) {
      if (!articlesToProcess.some((x) => x.id === a.id)) {
        articlesToProcess.push(a);
      }
    }
  }

  if (articlesToProcess.length === 0) {
    throw new Error('No articles provided for summarization.');
  }

  const formattedCorpus = articlesToProcess
    .map((art, idx) => {
      const authors = art.authors.map((a) => a.name).join(', ');
      return `Article #${idx + 1}:
Title: ${art.title}
PMID: ${art.pmid || 'N/A'} | DOI: ${art.doi || 'N/A'}
Authors: ${authors} (${art.year})
Journal: ${art.journal}
Full Abstract / Content:
${art.abstract}`;
    })
    .join('\n\n====================\n\n');

  const prompt = `Perform a high-level scientific and biomedical literature synthesis of the following article(s).
Focus: ${req.focusArea || 'Comprehensive clinical and mechanistic synthesis'}.
Mode: ${req.mode || (articlesToProcess.length > 1 ? 'comparative' : 'single')}.

Provide the response strictly in JSON format according to the schema.
Ensure all key findings are supported by specific data from the articles and include verifiable citations.
Write the summary in French (or bilingual French/English technical terms).

Articles:
${formattedCorpus}`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Synthesized title of the review/summary',
          },
          background: {
            type: Type.STRING,
            description: 'Context, rationale, and primary research questions/hypotheses',
          },
          methodology: {
            type: Type.STRING,
            description: 'Study design, cohorts, molecular assays, models, or trial protocols',
          },
          keyFindings: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Bullet points of primary quantitative and qualitative results',
          },
          clinicalRelevance: {
            type: Type.STRING,
            description: 'Translational impact, therapeutic consequences, or practice guidelines',
          },
          limitations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Sample size limits, confounding factors, lack of longitudinal data, etc.',
          },
          verifiableCitations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                citationRef: { type: Type.STRING, description: 'e.g. [PMID: 38289412]' },
                articleTitle: { type: Type.STRING },
                pmid: { type: Type.STRING },
                doi: { type: Type.STRING },
                evidenceClaim: { type: Type.STRING, description: 'What this paper specifically verified' },
              },
              required: ['citationRef', 'articleTitle', 'evidenceClaim'],
            },
          },
          comparativeTable: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                study: { type: Type.STRING },
                design: { type: Type.STRING },
                sampleSize: { type: Type.STRING },
                primaryEndpoint: { type: Type.STRING },
                keyOutcome: { type: Type.STRING },
              },
              required: ['study', 'design', 'primaryEndpoint', 'keyOutcome'],
            },
          },
        },
        required: [
          'title',
          'background',
          'methodology',
          'keyFindings',
          'clinicalRelevance',
          'limitations',
          'verifiableCitations',
        ],
      },
    },
  });

  const rawJson = response.text || '{}';
  const parsed = JSON.parse(rawJson);

  return {
    summary: parsed,
    modelUsed: modelName,
  };
}

/**
 * Helper to match citations mentioned in text back to known articles
 */
function extractVerifiableCitations(text: string, articles: BiomedicalArticle[]) {
  const citations = [];
  for (const art of articles) {
    const hasPmid = art.pmid && text.includes(art.pmid);
    const firstAuthor = art.authors[0]?.name?.split(' ')[0] || '';
    const hasAuthor = firstAuthor.length > 2 && text.toLowerCase().includes(firstAuthor.toLowerCase());
    const hasTitle = text.toLowerCase().includes(art.title.toLowerCase().slice(0, 30));

    if (hasPmid || hasAuthor || hasTitle) {
      citations.push({
        pmid: art.pmid,
        doi: art.doi,
        articleTitle: art.title,
        citationKey: art.pmid ? `[PMID: ${art.pmid}]` : `[${art.authors[0]?.name || 'Ref'}]`,
        snippet: art.abstract.slice(0, 150) + '...',
        authorsYear: `${art.authors[0]?.name || 'Authors'} (${art.year})`,
        url: art.url,
      });
    }
  }
  return citations;
}
