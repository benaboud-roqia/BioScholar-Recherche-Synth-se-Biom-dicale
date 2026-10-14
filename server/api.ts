import express, { Request, Response } from 'express';
import { searchPubMed, searchEuropePMC, fetchArticleByIdentifier } from './ncbi';
import { generateBiomedicalChat, generateBiomedicalSummary } from './gemini';

export const apiApp = express();
apiApp.use(express.json({ limit: '10mb' }));

const router = express.Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'BioScholar Biomedical Engine' });
});

// PubMed Search API
router.get('/pubmed/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const maxResults = parseInt(String(req.query.maxResults || '10'), 10);
    const sort = req.query.sort === 'relevance' ? 'relevance' : 'pub_date';
    const freeFullTextOnly = req.query.freeFullText === 'true';
    const clinicalTrialsOnly = req.query.clinicalTrials === 'true';
    const years = req.query.years ? parseInt(String(req.query.years), 10) : undefined;

    const articles = await searchPubMed(query, {
      maxResults,
      sort,
      freeFullTextOnly,
      clinicalTrialsOnly,
      years,
    });

    res.json({ articles, count: articles.length });
  } catch (err: any) {
    console.error('PubMed search error:', err);
    res.status(500).json({ error: err.message || 'Failed to search PubMed' });
  }
});

// Europe PMC Search API
router.get('/europepmc/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.query || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const pageSize = parseInt(String(req.query.pageSize || '10'), 10);
    const openAccessOnly = req.query.openAccess === 'true';
    const preprintsOnly = req.query.preprints === 'true';

    const articles = await searchEuropePMC(query, {
      pageSize,
      openAccessOnly,
      preprintsOnly,
    });

    res.json({ articles, count: articles.length });
  } catch (err: any) {
    console.error('Europe PMC search error:', err);
    res.status(500).json({ error: err.message || 'Failed to search Europe PMC' });
  }
});

// Fetch Article by Identifier (PMID or DOI)
router.get('/pubmed/fetch', async (req: Request, res: Response) => {
  try {
    const identifier = String(req.query.identifier || '').trim();
    if (!identifier) {
      return res.status(400).json({ error: 'Identifier parameter is required' });
    }

    const article = await fetchArticleByIdentifier(identifier);
    if (!article) {
      return res.status(404).json({ error: `Article not found for identifier "${identifier}"` });
    }

    res.json({ article });
  } catch (err: any) {
    console.error('Fetch article error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch article' });
  }
});

// Gemini Multi-turn Biomedical Chat
router.post('/gemini/chat', async (req: Request, res: Response) => {
  try {
    const { messages, contextArticles, personaRole, model } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const result = await generateBiomedicalChat({
      messages,
      contextArticles: contextArticles || [],
      personaRole,
      model,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Gemini chat error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate chat response' });
  }
});

// Gemini Structured Summarization
router.post('/gemini/summarize', async (req: Request, res: Response) => {
  try {
    const { article, articles, mode, focusArea, model } = req.body;

    const result = await generateBiomedicalSummary({
      article,
      articles,
      mode,
      focusArea,
      model,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Gemini summarize error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate summary' });
  }
});

// Register routes both at root and with /api prefix so it handles any Connect/Express mount
apiApp.use('/api', router);
apiApp.use('/', router);

export const apiRouter = router;
