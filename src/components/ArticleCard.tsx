import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  BookPlus,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
  FileEdit,
  Save,
  Trash2,
  Tag,
  Clock,
  Notebook,
} from 'lucide-react';
import type { BiomedicalArticle } from '../types';
import { generateAPA, generateVancouver, generateBibTeX, generateRIS } from '../services/citations';

interface ArticleCardProps {
  article: BiomedicalArticle;
  isInCorpus: boolean;
  onToggleCorpus: (article: BiomedicalArticle) => void;
  onSummarize: (article: BiomedicalArticle) => void;
  initialNote?: string;
  onSaveNote?: (articleId: string, noteText: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isInCorpus,
  onToggleCorpus,
  onSummarize,
  initialNote = '',
  onSaveNote,
}) => {
  const [isAbstractExpanded, setIsAbstractExpanded] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);
  const [showCitationMenu, setShowCitationMenu] = useState(false);

  // Local Notes State
  const [isNotesOpen, setIsNotesOpen] = useState(Boolean(initialNote));
  const [noteContent, setNoteContent] = useState(initialNote);
  const [isNoteSaved, setIsNoteSaved] = useState(false);

  useEffect(() => {
    setNoteContent(initialNote);
  }, [initialNote]);

  const handleSaveNote = () => {
    if (onSaveNote) {
      onSaveNote(article.id, noteContent.trim());
    }
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2000);
  };

  const handleDeleteNote = () => {
    setNoteContent('');
    if (onSaveNote) {
      onSaveNote(article.id, '');
    }
  };

  const handleCopyCitation = (format: 'apa' | 'vancouver' | 'bibtex' | 'ris') => {
    let text = '';
    if (format === 'apa') text = generateAPA(article);
    else if (format === 'vancouver') text = generateVancouver(article);
    else if (format === 'bibtex') text = generateBibTeX([article]);
    else if (format === 'ris') text = generateRIS([article]);

    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => {
      setCopiedFormat(null);
      setShowCitationMenu(false);
    }, 1800);
  };

  const authorDisplay =
    article.authors.length > 4
      ? `${article.authors.slice(0, 3).map((a) => a.name).join(', ')} et al.`
      : article.authors.map((a) => a.name).join(', ');

  const hasNote = Boolean(noteContent.trim());

  return (
    <article className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 transition-all p-5 mb-4 relative shadow-2xs">
      {/* Zero-Pill Unboxed Metadata Kicker */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2 text-xs text-slate-500 font-mono">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
          <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
            {article.source === 'pubmed'
              ? 'NCBI PubMed'
              : article.source === 'europepmc'
              ? 'Europe PMC'
              : article.source === 'biorxiv'
              ? 'bioRxiv Preprint'
              : 'Article Fourni'}
          </span>

          <span aria-hidden="true" className="text-slate-300">·</span>

          <span className="text-slate-600 font-medium">
            {article.pubDate || article.year}
          </span>

          {article.pmid && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-600">PMID: {article.pmid}</span>
            </>
          )}

          {article.doi && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-slate-500 truncate max-w-[200px]" title={article.doi}>
                DOI: {article.doi}
              </span>
            </>
          )}

          {article.isOpenAccess && (
            <>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="text-teal-700 font-medium">Accès Libre</span>
            </>
          )}
        </div>

        {typeof article.citationCount === 'number' && article.citationCount > 0 && (
          <span className="text-[11px] text-slate-400 font-mono">
            {article.citationCount} citation{article.citationCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Article Title */}
      <h3 className="text-base font-semibold text-slate-900 leading-snug mb-2 group">
        <a
          href={article.url || `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600 transition-colors inline-flex items-baseline"
        >
          <span>{article.title}</span>
          <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-400 group-hover:text-blue-600 inline-block shrink-0" />
        </a>
      </h3>

      {/* Authors and Journal */}
      <div className="text-xs text-slate-600 mb-3 space-y-0.5">
        <p className="font-medium text-slate-800">{authorDisplay}</p>
        <p className="text-slate-500">
          <span className="italic">{article.journal}</span>
        </p>
      </div>

      {/* Structured Abstract Viewport */}
      <div className="text-xs text-slate-700 bg-slate-50/60 rounded-xl p-3.5 border border-slate-100 mb-3">
        {article.structuredAbstract && article.structuredAbstract.length > 0 ? (
          <div className="space-y-2.5">
            {(isAbstractExpanded ? article.structuredAbstract : article.structuredAbstract.slice(0, 2)).map(
              (section, idx) => (
                <div key={idx} className="leading-relaxed">
                  <span className="font-mono font-semibold text-blue-900 uppercase text-[10px] tracking-wider block mb-0.5">
                    {section.label}
                  </span>
                  <p className="text-slate-700">{section.text}</p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="leading-relaxed">
            {isAbstractExpanded
              ? article.abstract
              : `${article.abstract.slice(0, 260)}${article.abstract.length > 260 ? '...' : ''}`}
          </p>
        )}

        {article.abstract.length > 260 && (
          <button
            onClick={() => setIsAbstractExpanded(!isAbstractExpanded)}
            className="mt-2 text-blue-600 hover:text-blue-800 font-medium inline-flex items-center space-x-1"
          >
            <span>{isAbstractExpanded ? 'Réduire le résumé' : 'Afficher le résumé complet'}</span>
            {isAbstractExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* MeSH Terms Clean Inline Text */}
      {article.meshTerms && article.meshTerms.length > 0 && (
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-3 text-[11px] text-slate-500">
          <span className="font-medium text-slate-400">MeSH :</span>
          {article.meshTerms.slice(0, 4).map((term, i) => (
            <React.Fragment key={i}>
              <span className="text-slate-600 hover:text-slate-900 cursor-default">{term}</span>
              {i < Math.min(article.meshTerms!.length, 4) - 1 && (
                <span aria-hidden="true" className="text-slate-300">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Personal Notes Drawer (Saved Locally) */}
      {isNotesOpen && (
        <div className="mt-3 mb-3 p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/80 animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-900">
              <Notebook className="w-3.5 h-3.5 text-amber-700" />
              <span>Observations & Notes Personnelles</span>
            </div>
            {hasNote && (
              <span className="text-[10px] text-amber-700/80 font-mono">
                Sauvegardé localement
              </span>
            )}
          </div>

          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            onBlur={handleSaveNote}
            placeholder="Écrivez vos remarques de recherche sur cet article (méthode, résultats à retenir, critique, hypothèses)..."
            rows={3}
            className="w-full text-xs bg-white border border-amber-200 rounded-lg p-2.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-200 leading-relaxed font-sans"
          />

          <div className="flex items-center justify-between mt-2 pt-1 text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSaveNote}
                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-medium text-[11px] shadow-2xs transition-colors"
              >
                {isNoteSaved ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Enregistré</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3" />
                    <span>Enregistrer</span>
                  </>
                )}
              </button>

              {hasNote && (
                <button
                  type="button"
                  onClick={handleDeleteNote}
                  className="inline-flex items-center space-x-1 px-2 py-1 text-slate-500 hover:text-red-600 rounded-md text-[11px] transition-colors"
                  title="Supprimer cette note"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Effacer</span>
                </button>
              )}
            </div>

            <span className="text-[10px] font-mono text-slate-400">
              {noteContent.length} car.
            </span>
          </div>
        </div>
      )}

      {/* Card Actions Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
        {/* Toggle Corpus Button */}
        <button
          onClick={() => onToggleCorpus(article)}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
            isInCorpus
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
          }`}
        >
          {isInCorpus ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Dans le Corpus</span>
            </>
          ) : (
            <>
              <BookPlus className="w-3.5 h-3.5" />
              <span>Ajouter au Corpus</span>
            </>
          )}
        </button>

        {/* Right Action Tools: Notes, Summarize, Cite */}
        <div className="flex items-center space-x-2">
          {/* Notes Toggle Button */}
          <button
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              hasNote
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
            title="Ajouter ou modifier des notes personnelles sur cette publication"
          >
            <FileEdit className={`w-3.5 h-3.5 ${hasNote ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>{hasNote ? 'Note enregistrée' : 'Notes'}</span>
          </button>

          {/* Direct Summarize Button */}
          <button
            onClick={() => onSummarize(article)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Synthèse IA</span>
          </button>

          {/* Quick Cite Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCitationMenu(!showCitationMenu)}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap transition-colors"
              title="Copier la référence bibliographique"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Citer</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showCitationMenu && (
              <div className="absolute right-0 bottom-full mb-1.5 w-48 bg-white rounded-xl shadow-lg border border-slate-200 p-1.5 z-20 text-xs animate-in fade-in duration-150">
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Copier la citation
                </div>
                <button
                  onClick={() => handleCopyCitation('vancouver')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span>Vancouver (NLM)</span>
                  {copiedFormat === 'vancouver' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => handleCopyCitation('apa')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span>APA 7th</span>
                  {copiedFormat === 'apa' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => handleCopyCitation('bibtex')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span>BibTeX (.bib)</span>
                  {copiedFormat === 'bibtex' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => handleCopyCitation('ris')}
                  className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-slate-700 flex items-center justify-between"
                >
                  <span>RIS (Zotero/EndNote)</span>
                  {copiedFormat === 'ris' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
