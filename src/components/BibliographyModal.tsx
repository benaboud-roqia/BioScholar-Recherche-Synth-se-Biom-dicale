import React, { useState } from 'react';
import { X, Copy, Download, Check, BookOpen, FileText } from 'lucide-react';
import type { BiomedicalArticle } from '../types';
import {
  generateBibTeX,
  generateRIS,
  generateAPA,
  generateVancouver,
  generateMLA,
  generateChicago,
  downloadTextFile,
} from '../services/citations';

interface BibliographyModalProps {
  isOpen: boolean;
  onClose: () => void;
  articles: BiomedicalArticle[];
}

type CitationFormat = 'bibtex' | 'ris' | 'vancouver' | 'apa' | 'mla' | 'chicago' | 'json';

export const BibliographyModal: React.FC<BibliographyModalProps> = ({
  isOpen,
  onClose,
  articles,
}) => {
  const [activeFormat, setActiveFormat] = useState<CitationFormat>('bibtex');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const getContent = (): string => {
    if (articles.length === 0) return 'Aucun article sélectionné pour l\'exportation.';

    switch (activeFormat) {
      case 'bibtex':
        return generateBibTeX(articles);
      case 'ris':
        return generateRIS(articles);
      case 'vancouver':
        return articles.map((a, i) => `${i + 1}. ${generateVancouver(a)}`).join('\n\n');
      case 'apa':
        return articles.map((a) => generateAPA(a)).join('\n\n');
      case 'mla':
        return articles.map((a) => generateMLA(a)).join('\n\n');
      case 'chicago':
        return articles.map((a) => generateChicago(a)).join('\n\n');
      case 'json':
        return JSON.stringify(articles, null, 2);
    }
  };

  const currentContent = getContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    let filename = `bioscholar-citations-${timestamp}`;
    let mime = 'text/plain';

    if (activeFormat === 'bibtex') {
      filename += '.bib';
      mime = 'application/x-bibtex';
    } else if (activeFormat === 'ris') {
      filename += '.ris';
      mime = 'application/x-research-info-systems';
    } else if (activeFormat === 'json') {
      filename += '.json';
      mime = 'application/json';
    } else {
      filename += '.txt';
    }

    downloadTextFile(filename, currentContent, mime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Export Bibliographique Standard ({articles.length} article{articles.length > 1 ? 's' : ''})
              </h2>
              <p className="text-xs text-slate-500">
                Formats compatibles Zotero, EndNote, Mendeley, Overleaf/LaTeX et revues biomédicales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center overflow-x-auto space-x-1 text-xs">
          {[
            { id: 'bibtex', label: 'BibTeX (.bib)' },
            { id: 'ris', label: 'RIS (Zotero/EndNote)' },
            { id: 'vancouver', label: 'Vancouver (NLM)' },
            { id: 'apa', label: 'APA 7th' },
            { id: 'mla', label: 'MLA 9th' },
            { id: 'chicago', label: 'Chicago 17th' },
            { id: 'json', label: 'JSON' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFormat(tab.id as CitationFormat)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeFormat === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed selection:bg-blue-600">
          <pre className="whitespace-pre-wrap break-words">{currentContent}</pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {articles.length} référence{articles.length > 1 ? 's' : ''} formatée{articles.length > 1 ? 's' : ''}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-medium transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copié dans le presse-papier !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copier les références</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger ({activeFormat === 'bibtex' ? '.bib' : activeFormat === 'ris' ? '.ris' : '.txt'})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
