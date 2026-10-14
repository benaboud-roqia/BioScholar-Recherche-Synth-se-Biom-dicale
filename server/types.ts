export interface BiomedicalAuthor {
  name: string;
  affiliation?: string;
}

export interface StructuredAbstractSection {
  label: string; // e.g. "BACKGROUND", "METHODS", "RESULTS", "CONCLUSIONS"
  text: string;
}

export interface BiomedicalArticle {
  id: string; // Internal unique ID or PMID
  pmid?: string;
  doi?: string;
  pmcid?: string;
  title: string;
  authors: BiomedicalAuthor[];
  journal: string;
  pubDate: string; // YYYY or YYYY-MM-DD
  year: number;
  abstract: string;
  structuredAbstract?: StructuredAbstractSection[];
  keywords?: string[];
  meshTerms?: string[];
  source: 'pubmed' | 'europepmc' | 'user-input' | 'biorxiv';
  isOpenAccess?: boolean;
  citationCount?: number;
  url?: string;
  userNotes?: string;
  studyType?: string; // e.g., "Randomized Controlled Trial", "Systematic Review", "Cohort Study", etc.
}

export interface ChatCitation {
  pmid?: string;
  doi?: string;
  articleTitle: string;
  citationKey: string; // e.g., "[1]" or "[PMID: 38289412]"
  snippet: string;
  authorsYear: string;
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: ChatCitation[];
  timestamp: number;
  modelUsed?: string;
}

export interface SummarizeRequest {
  article?: BiomedicalArticle;
  articles?: BiomedicalArticle[];
  mode?: 'single' | 'comparative' | 'rapid';
  focusArea?: string;
  model?: string;
}

export interface SummarizeResponse {
  summary: {
    title: string;
    background: string;
    methodology: string;
    keyFindings: string[];
    clinicalRelevance: string;
    limitations: string[];
    verifiableCitations: {
      citationRef: string;
      articleTitle: string;
      pmid?: string;
      doi?: string;
      evidenceClaim: string;
    }[];
    comparativeTable?: {
      study: string;
      design: string;
      sampleSize: string;
      primaryEndpoint: string;
      keyOutcome: string;
    }[];
  };
  modelUsed: string;
}
