import type { BiomedicalArticle, ChatMessage, ScientificSummaryData } from '../types';

async function parseJsonResponse<T>(res: Response, fallbackError: string): Promise<T> {
  const contentType = res.headers.get('content-type') || '';

  if (!res.ok) {
    if (contentType.includes('application/json')) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `${fallbackError} (${res.status})`);
    } else {
      const text = await res.text().catch(() => '');
      throw new Error(`${fallbackError} (${res.status})`);
    }
  }

  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    throw new Error(`Format inattendu reçu du serveur (non-JSON): ${text.slice(0, 80)}`);
  }

  return await res.json();
}

export async function searchPubMedApi(
  query: string,
  params: {
    maxResults?: number;
    sort?: 'pub_date' | 'relevance';
    freeFullText?: boolean;
    clinicalTrials?: boolean;
    years?: number;
  } = {}
): Promise<BiomedicalArticle[]> {
  const queryParams = new URLSearchParams();
  queryParams.set('query', query);
  if (params.maxResults) queryParams.set('maxResults', params.maxResults.toString());
  if (params.sort) queryParams.set('sort', params.sort);
  if (params.freeFullText) queryParams.set('freeFullText', 'true');
  if (params.clinicalTrials) queryParams.set('clinicalTrials', 'true');
  if (params.years) queryParams.set('years', params.years.toString());

  const res = await fetch(`/api/pubmed/search?${queryParams.toString()}`);
  const data = await parseJsonResponse<{ articles: BiomedicalArticle[] }>(
    res,
    'Erreur lors de la recherche PubMed'
  );
  return data.articles || [];
}

export async function searchEuropePmcApi(
  query: string,
  params: {
    pageSize?: number;
    openAccess?: boolean;
    preprints?: boolean;
  } = {}
): Promise<BiomedicalArticle[]> {
  const queryParams = new URLSearchParams();
  queryParams.set('query', query);
  if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString());
  if (params.openAccess) queryParams.set('openAccess', 'true');
  if (params.preprints) queryParams.set('preprints', 'true');

  const res = await fetch(`/api/europepmc/search?${queryParams.toString()}`);
  const data = await parseJsonResponse<{ articles: BiomedicalArticle[] }>(
    res,
    'Erreur lors de la recherche Europe PMC'
  );
  return data.articles || [];
}

export async function fetchArticleByIdentifierApi(identifier: string): Promise<BiomedicalArticle> {
  const res = await fetch(`/api/pubmed/fetch?identifier=${encodeURIComponent(identifier.trim())}`);
  const data = await parseJsonResponse<{ article: BiomedicalArticle }>(
    res,
    `Article introuvable pour "${identifier}"`
  );
  return data.article;
}

export async function sendChatMessageApi(params: {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  contextArticles: BiomedicalArticle[];
  personaRole?: string;
  model?: string;
}): Promise<{ content: string; citations?: any[]; modelUsed: string }> {
  const res = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return await parseJsonResponse<{ content: string; citations?: any[]; modelUsed: string }>(
    res,
    'Erreur de communication avec l\'assistant Gemini'
  );
}

export async function generateSummaryApi(params: {
  article?: BiomedicalArticle;
  articles?: BiomedicalArticle[];
  mode?: 'single' | 'comparative' | 'rapid';
  focusArea?: string;
  model?: string;
}): Promise<{ summary: ScientificSummaryData; modelUsed: string }> {
  const res = await fetch('/api/gemini/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return await parseJsonResponse<{ summary: ScientificSummaryData; modelUsed: string }>(
    res,
    'Erreur lors de la génération de la synthèse biomédicale'
  );
}
