import React from 'react';
import { X, Trash2, Sparkles, Download, MessageSquare, ExternalLink, Mail, BookOpen } from 'lucide-react';
import type { BiomedicalArticle } from '../types';

interface CorpusDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  corpus: BiomedicalArticle[];
  onRemoveFromCorpus: (id: string) => void;
  onClearCorpus: () => void;
  onComparativeSummary: () => void;
  onOpenBibliography: () => void;
  onStartChat: () => void;
  onOpenEmail: () => void;
}

export const CorpusDrawer: React.FC<CorpusDrawerProps> = ({
  isOpen,
  onClose,
  corpus,
  onRemoveFromCorpus,
  onClearCorpus,
  onComparativeSummary,
  onOpenBibliography,
  onStartChat,
  onOpenEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Corpus de Recherche ({corpus.length})
              </h2>
              <p className="text-[11px] text-slate-500">
                Articles actifs pour la synthèse et l'assistant IA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Actions Toolbar */}
        {corpus.length > 0 && (
          <div className="p-3 bg-blue-50/50 border-b border-blue-100 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => {
                onComparativeSummary();
                onClose();
              }}
              className="flex-1 min-w-[130px] flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Synthèse Comparative</span>
            </button>

            <button
              onClick={() => {
                onOpenBibliography();
                onClose();
              }}
              className="flex items-center space-x-1 px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium border border-slate-200 transition-colors"
              title="Exporter au format BibTeX / RIS / APA"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exporter</span>
            </button>

            <button
              onClick={() => {
                onStartChat();
                onClose();
              }}
              className="flex items-center space-x-1 px-2.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium border border-slate-200 transition-colors"
              title="Interroger l'assistant avec ce corpus"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Interroger</span>
            </button>

            <button
              onClick={() => {
                onOpenEmail();
                onClose();
              }}
              className="flex items-center space-x-1 px-2.5 py-2 bg-white hover:bg-slate-50 text-red-700 rounded-lg font-medium border border-red-200 transition-colors"
              title="Envoyer par Gmail"
            >
              <Mail className="w-3.5 h-3.5 text-red-600" />
              <span>Gmail</span>
            </button>
          </div>
        )}

        {/* Articles List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {corpus.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <BookOpen className="w-12 h-12 stroke-1 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-700 mb-1">Votre corpus est vide</p>
              <p className="text-[11px] text-slate-500 max-w-[220px]">
                Recherchez des articles sur PubMed ou importez vos propres documents pour générer des synthèses comparatives.
              </p>
            </div>
          ) : (
            corpus.map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-slate-300 transition-all text-xs relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-slate-900 line-clamp-2 leading-snug">
                    {art.title}
                  </h4>
                  <button
                    onClick={() => onRemoveFromCorpus(art.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors shrink-0"
                    title="Retirer du corpus"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                  {art.authors.map((a) => a.name).slice(0, 2).join(', ')} • {art.journal} ({art.year})
                </p>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5 font-mono text-[10px] text-slate-500">
                    {art.pmid && <span className="bg-slate-100 px-1 py-0.5 rounded">PMID: {art.pmid}</span>}
                    {art.doi && <span className="bg-slate-100 px-1 py-0.5 rounded truncate max-w-[120px]">DOI: {art.doi}</span>}
                  </div>

                  {art.url && (
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-[11px] font-medium inline-flex items-center"
                    >
                      <span>Consulter</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {corpus.length > 0 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <button
              onClick={onClearCorpus}
              className="text-red-600 hover:text-red-800 font-medium inline-flex items-center space-x-1 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Vider le corpus</span>
            </button>
            <span className="text-[11px] text-slate-400">
              {corpus.length} article{corpus.length > 1 ? 's' : ''} sélectionné{corpus.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
