export interface BiomedicalAuthor {
  name: string;
  affiliation?: string;
}

export interface StructuredAbstractSection {
  label: string;
  text: string;
}

export interface BiomedicalArticle {
  id: string;
  pmid?: string;
  doi?: string;
  pmcid?: string;
  title: string;
  authors: BiomedicalAuthor[];
  journal: string;
  pubDate: string;
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
  studyType?: string;
}

export interface ChatCitation {
  pmid?: string;
  doi?: string;
  articleTitle: string;
  citationKey: string;
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

export interface ScientificSummaryData {
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
}
