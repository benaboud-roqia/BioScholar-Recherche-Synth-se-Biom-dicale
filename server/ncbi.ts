import type { BiomedicalArticle, StructuredAbstractSection } from './types';

const NCBI_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const EUROPE_PMC_BASE = 'https://www.ebi.ac.uk/europepmc/webservices/rest';
const USER_AGENT = 'BioScholar/1.0 (biomedical-research-app; mailto:scientist@example.com)';

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        ...(options.headers || {}),
      },
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Search PubMed using ESearch + ESummary + EFetch
 */
export async function searchPubMed(
  query: string,
  options: {
    maxResults?: number;
    sort?: 'pub_date' | 'relevance';
    freeFullTextOnly?: boolean;
    clinicalTrialsOnly?: boolean;
    years?: number; // e.g. last 5 years
  } = {}
): Promise<BiomedicalArticle[]> {
  const retmax = options.maxResults || 10;
  const sort = options.sort === 'relevance' ? 'relevance' : 'pub_date';

  let term = query.trim();
  if (options.freeFullTextOnly) {
    term += ' AND free full text[sb]';
  }
  if (options.clinicalTrialsOnly) {
    term += ' AND clinical trial[pt]';
  }
  if (options.years && options.years > 0) {
    const currentYear = new Date().getFullYear();
    const fromYear = currentYear - options.years;
    term += ` AND (${fromYear}:${currentYear}[pdat])`;
  }

  try {
    const esearchUrl = `${NCBI_BASE}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
      term
    )}&sort=${sort}&retmode=json&retmax=${retmax}&tool=AIStudioBuild&email=scientist@example.com`;

    const searchRes = await fetchWithTimeout(esearchUrl);
    if (!searchRes.ok) {
      throw new Error(`NCBI ESearch failed: ${searchRes.statusText}`);
    }
    const searchData = await searchRes.json();
    const idlist: string[] = searchData?.esearchresult?.idlist || [];

    if (idlist.length === 0) {
      // Try Europe PMC as secondary check before returning empty
      try {
        const epmcFallback = await searchEuropePMC(query, {
          pageSize: retmax,
          openAccessOnly: options.freeFullTextOnly,
        });
        if (epmcFallback.length > 0) return epmcFallback;
      } catch {
        // Ignore secondary error
      }
      return [];
    }

    // Fetch summaries
    const esummaryUrl = `${NCBI_BASE}/esummary.fcgi?db=pubmed&id=${idlist.join(
      ','
    )}&retmode=json&tool=AIStudioBuild&email=scientist@example.com`;
    const summaryRes = await fetchWithTimeout(esummaryUrl);
    if (!summaryRes.ok) {
      throw new Error(`NCBI ESummary failed: ${summaryRes.statusText}`);
    }
    const summaryData = await summaryRes.json();
    const resultObj = summaryData?.result || {};

    // Fetch XML abstracts for structured text
    const efetchUrl = `${NCBI_BASE}/efetch.fcgi?db=pubmed&id=${idlist.join(
      ','
    )}&retmode=xml&tool=AIStudioBuild&email=scientist@example.com`;
    let xmlText = '';
    try {
      const fetchRes = await fetchWithTimeout(efetchUrl);
      if (fetchRes.ok) {
        xmlText = await fetchRes.text();
      }
    } catch {
      // Graceful fallback to summary
    }

    const articles: BiomedicalArticle[] = [];

    for (const pmid of idlist) {
      const item = resultObj[pmid];
      if (!item) continue;

      const title = (item.title || 'Untitled Article').replace(/<[^>]+>/g, '').trim();
      const authors = (item.authors || []).map((a: { name: string; authtype?: string }) => ({
        name: a.name,
      }));
      const journal = item.source || item.fulljournalname || 'Biomedical Journal';
      const pubDate = item.pubdate || item.sortpubdate || '';
      const yearMatch = pubDate.match(/\b(19\d\d|20\d\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

      let doi = '';
      let pmcid = '';
      if (Array.isArray(item.articleids)) {
        for (const aid of item.articleids) {
          if (aid.idtype === 'doi') doi = aid.value;
          if (aid.idtype === 'pmc') pmcid = aid.value;
        }
      }

      const { abstract, structuredAbstract, meshTerms } = parseArticleXml(xmlText, pmid);

      articles.push({
        id: `pmid-${pmid}`,
        pmid,
        doi: doi || undefined,
        pmcid: pmcid || undefined,
        title,
        authors: authors.length > 0 ? authors : [{ name: 'Author list unavailable' }],
        journal,
        pubDate,
        year,
        abstract: abstract || 'Abstract text available in full-text archives.',
        structuredAbstract: structuredAbstract.length > 0 ? structuredAbstract : undefined,
        meshTerms: meshTerms.length > 0 ? meshTerms : undefined,
        source: 'pubmed',
        isOpenAccess: Boolean(pmcid || item.attributes?.includes('Has Abstract')),
        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      });
    }

    return articles;
  } catch (err: any) {
    console.warn('NCBI search failed, falling back to Europe PMC:', err?.message);
    try {
      return await searchEuropePMC(query, {
        pageSize: retmax,
        openAccessOnly: options.freeFullTextOnly,
      });
    } catch (fallbackErr: any) {
      console.error('Europe PMC fallback also failed:', fallbackErr?.message);
      return [];
    }
  }
}

/**
 * Simple XML parser helper for PubMed XML responses
 */
function parseArticleXml(xml: string, targetPmid: string): {
  abstract: string;
  structuredAbstract: StructuredAbstractSection[];
  meshTerms: string[];
} {
  if (!xml) return { abstract: '', structuredAbstract: [], meshTerms: [] };

  // Locate the PubmedArticle chunk for this PMID
  const pmidIndex = xml.indexOf(`<PMID Version="1">${targetPmid}</PMID>`);
  if (pmidIndex === -1 && !xml.includes(`<PMID>${targetPmid}</PMID>`)) {
    return { abstract: '', structuredAbstract: [], meshTerms: [] };
  }

  // Find start and end of this PubmedArticle
  const startTag = xml.lastIndexOf('<PubmedArticle>', pmidIndex !== -1 ? pmidIndex : 0);
  const endTag = xml.indexOf('</PubmedArticle>', startTag);
  const articleXml =
    startTag !== -1 && endTag !== -1 ? xml.substring(startTag, endTag + 16) : xml;

  const structuredAbstract: StructuredAbstractSection[] = [];
  const abstractRegex = /<AbstractText(?:\s+Label="([^"]+)")?[^>]*>([\s\S]*?)<\/AbstractText>/gi;
  let match: RegExpExecArray | null;
  const abstractParts: string[] = [];

  while ((match = abstractRegex.exec(articleXml)) !== null) {
    const label = match[1] || '';
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    if (text) {
      if (label) {
        structuredAbstract.push({ label, text });
        abstractParts.push(`${label}: ${text}`);
      } else {
        abstractParts.push(text);
      }
    }
  }

  // Extract MeSH Terms
  const meshTerms: string[] = [];
  const meshRegex = /<DescriptorName[^>]*>([\s\S]*?)<\/DescriptorName>/gi;
  let meshMatch: RegExpExecArray | null;
  while ((meshMatch = meshRegex.exec(articleXml)) !== null) {
    const term = meshMatch[1].replace(/<[^>]+>/g, '').trim();
    if (term && !meshTerms.includes(term)) {
      meshTerms.push(term);
    }
  }

  return {
    abstract: abstractParts.join('\n\n'),
    structuredAbstract,
    meshTerms: meshTerms.slice(0, 10),
  };
}

/**
 * Search Europe PMC REST API
 */
export async function searchEuropePMC(
  query: string,
  options: {
    pageSize?: number;
    openAccessOnly?: boolean;
    preprintsOnly?: boolean;
  } = {}
): Promise<BiomedicalArticle[]> {
  const pageSize = options.pageSize || 10;
  let searchTerms = query.trim();

  if (options.openAccessOnly) {
    searchTerms += ' AND OPEN_ACCESS:Y';
  }
  if (options.preprintsOnly) {
    searchTerms += ' AND SRC:PPR';
  }

  const url = `${EUROPE_PMC_BASE}/search?query=${encodeURIComponent(
    searchTerms
  )}&format=json&pageSize=${pageSize}&resultType=core`;

  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error(`Europe PMC query failed: ${res.statusText}`);
  }

  const data = await res.json();
  const results = data?.resultList?.result || [];

  return results.map((item: any) => {
    const authorList = (item.authorList?.author || []).map((a: any) => ({
      name: a.fullName || `${a.lastName || ''} ${a.firstName || ''}`.trim() || 'Author',
      affiliation: a.authorAffiliationDetailsList?.authorAffiliation?.[0]?.affiliation,
    }));

    const year = parseInt(item.pubYear || item.journalInfo?.yearOfPublication || '2024', 10);
    const pmid = item.pmid;
    const doi = item.doi;
    const pmcid = item.pmcid;

    return {
      id: pmid ? `pmid-${pmid}` : `epmc-${item.id}`,
      pmid: pmid || undefined,
      doi: doi || undefined,
      pmcid: pmcid || undefined,
      title: (item.title || 'Untitled Article').replace(/<[^>]+>/g, '').trim(),
      authors: authorList.length > 0 ? authorList : [{ name: item.authorString || 'Unknown Authors' }],
      journal: item.journalTitle || item.bookOrReportDetails?.publisher || 'Europe PMC Indexed',
      pubDate: item.firstPublicationDate || `${year}`,
      year,
      abstract: (item.abstractText || 'Abstract not available').replace(/<[^>]+>/g, '').trim(),
      source: item.source === 'PPR' ? 'biorxiv' : 'europepmc',
      isOpenAccess: item.isOpenAccess === 'Y',
      citationCount: item.citedByCount || 0,
      url: pmid
        ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
        : doi
        ? `https://doi.org/${doi}`
        : `https://europepmc.org/article/${item.source}/${item.id}`,
    };
  });
}

/**
 * Fetch a single article by PMID or DOI
 */
export async function fetchArticleByIdentifier(identifier: string): Promise<BiomedicalArticle | null> {
  const cleanId = identifier.trim().replace(/^https?:\/\/(www\.)?pubmed\.ncbi\.nlm\.nih\.gov\//, '').replace(/\/$/, '');

  // Is it a clean PMID (digits only)?
  if (/^\d+$/.test(cleanId)) {
    const list = await searchPubMed(cleanId, { maxResults: 1 });
    if (list.length > 0) return list[0];
  }

  // Is it a DOI or starts with 10.?
  const doiMatch = identifier.match(/(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)/);
  if (doiMatch) {
    const doi = doiMatch[1];
    // Query Europe PMC by DOI
    const list = await searchEuropePMC(`DOI:"${doi}"`, { pageSize: 1 });
    if (list.length > 0) return list[0];

    // Fallback to PubMed search by DOI
    const pubmedList = await searchPubMed(`${doi}[aid]`, { maxResults: 1 });
    if (pubmedList.length > 0) return pubmedList[0];
  }

  // Otherwise try Europe PMC search
  const results = await searchEuropePMC(identifier, { pageSize: 1 });
  if (results.length > 0) return results[0];

  return null;
}
