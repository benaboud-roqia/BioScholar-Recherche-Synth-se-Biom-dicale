import type { BiomedicalArticle } from '../types';

/**
 * Generate cite key from first author and year
 */
function getCiteKey(article: BiomedicalArticle, index: number): string {
  const firstAuthor = article.authors[0]?.name || 'Author';
  const lastName = firstAuthor.split(' ').pop()?.replace(/[^a-zA-Z]/g, '') || 'Article';
  const year = article.year || new Date().getFullYear();
  return `${lastName.toLowerCase()}${year}_${article.pmid || index + 1}`;
}

/**
 * Clean text for BibTeX escaping
 */
function escapeBibTeX(text: string): string {
  return text.replace(/([&%$#_{}])/g, '\\$1');
}

/**
 * Format BibTeX export
 */
export function generateBibTeX(articles: BiomedicalArticle[]): string {
  return articles
    .map((art, index) => {
      const citeKey = getCiteKey(art, index);
      const authors = art.authors.map((a) => a.name).join(' and ');
      const lines = [
        `@article{${citeKey},`,
        `  author    = {${escapeBibTeX(authors)}},`,
        `  title     = {{${escapeBibTeX(art.title)}}},`,
        `  journal   = {${escapeBibTeX(art.journal)}},`,
        `  year      = {${art.year}},`,
      ];

      if (art.doi) lines.push(`  doi       = {${art.doi}},`);
      if (art.pmid) lines.push(`  pmid      = {${art.pmid}},`);
      if (art.pmcid) lines.push(`  pmcid     = {${art.pmcid}},`);
      if (art.url) lines.push(`  url       = {${art.url}},`);

      lines.push('}');
      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * Format RIS export (compatible with Zotero, EndNote, Mendeley, Papers)
 */
export function generateRIS(articles: BiomedicalArticle[]): string {
  return articles
    .map((art) => {
      const lines = ['TY  - JOUR', `TI  - ${art.title}`];

      for (const author of art.authors) {
        lines.push(`AU  - ${author.name}`);
      }

      if (art.journal) lines.push(`JO  - ${art.journal}`);
      if (art.year) lines.push(`PY  - ${art.year}`);
      if (art.doi) lines.push(`DO  - ${art.doi}`);
      if (art.pmid) lines.push(`AN  - ${art.pmid}`);
      if (art.url) lines.push(`UR  - ${art.url}`);
      if (art.abstract) lines.push(`AB  - ${art.abstract.replace(/\n+/g, ' ')}`);

      lines.push('ER  - ');
      return lines.join('\r\n');
    })
    .join('\r\n\r\n');
}

/**
 * Format APA 7th Edition citation
 */
export function generateAPA(article: BiomedicalArticle): string {
  const authorStr = formatAuthorsAPA(article.authors);
  const yearStr = article.year ? `(${article.year})` : '(n.d.)';
  const titleStr = article.title.endsWith('.') ? article.title : `${article.title}.`;
  const journalStr = article.journal ? `*${article.journal}*.` : '';
  const doiStr = article.doi ? ` https://doi.org/${article.doi}` : article.url ? ` ${article.url}` : '';

  return `${authorStr} ${yearStr}. ${titleStr} ${journalStr}${doiStr}`.trim();
}

/**
 * Format Vancouver / NLM citation (standard for biomedical journals)
 */
export function generateVancouver(article: BiomedicalArticle): string {
  const authorStr = formatAuthorsVancouver(article.authors);
  const titleStr = article.title.endsWith('.') ? article.title : `${article.title}.`;
  const journalStr = article.journal ? `${article.journal}.` : '';
  const yearStr = article.year ? ` ${article.year}.` : '';
  const pmidStr = article.pmid ? ` PMID: ${article.pmid}.` : '';
  const doiStr = article.doi ? ` doi: ${article.doi}.` : '';

  return `${authorStr}. ${titleStr} ${journalStr}${yearStr}${doiStr}${pmidStr}`.replace(/\s+/g, ' ').trim();
}

/**
 * Format MLA 9th Edition citation
 */
export function generateMLA(article: BiomedicalArticle): string {
  const authorStr = formatAuthorsMLA(article.authors);
  const titleStr = `"${article.title.replace(/\.$/, '')}."`;
  const journalStr = article.journal ? `*${article.journal}*,` : '';
  const yearStr = article.year ? ` ${article.year},` : '';
  const doiStr = article.doi ? ` doi:${article.doi}.` : article.url ? ` ${article.url}.` : '';

  return `${authorStr}. ${titleStr} ${journalStr}${yearStr}${doiStr}`.replace(/\s+/g, ' ').trim();
}

/**
 * Format Chicago 17th Edition citation
 */
export function generateChicago(article: BiomedicalArticle): string {
  const authorStr = formatAuthorsChicago(article.authors);
  const yearStr = article.year ? `${article.year}.` : '';
  const titleStr = `"${article.title.replace(/\.$/, '')}."`;
  const journalStr = article.journal ? `*${article.journal}*` : '';
  const doiStr = article.doi ? ` https://doi.org/${article.doi}.` : '';

  return `${authorStr}. ${yearStr} ${titleStr} ${journalStr}.${doiStr}`.replace(/\s+/g, ' ').trim();
}

/**
 * Helper: APA authors format
 */
function formatAuthorsAPA(authors: { name: string }[]): string {
  if (!authors || authors.length === 0) return 'Anonymous';
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return `${authors[0].name} & ${authors[1].name}`;
  return `${authors[0].name} et al.`;
}

/**
 * Helper: Vancouver authors format
 */
function formatAuthorsVancouver(authors: { name: string }[]): string {
  if (!authors || authors.length === 0) return 'Author unavailable';
  if (authors.length <= 6) {
    return authors.map((a) => a.name).join(', ');
  }
  return `${authors.slice(0, 6).map((a) => a.name).join(', ')}, et al.`;
}

/**
 * Helper: MLA authors format
 */
function formatAuthorsMLA(authors: { name: string }[]): string {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return `${authors[0].name}, and ${authors[1].name}`;
  return `${authors[0].name}, et al.`;
}

/**
 * Helper: Chicago authors format
 */
function formatAuthorsChicago(authors: { name: string }[]): string {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return authors[0].name;
  if (authors.length <= 3) return authors.map((a) => a.name).join(', ');
  return `${authors[0].name} et al.`;
}

/**
 * Download string content as a client-side file
 */
export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
