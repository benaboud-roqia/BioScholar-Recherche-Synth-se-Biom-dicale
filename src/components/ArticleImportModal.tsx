import React, { useState } from 'react';
import { X, Search, FileUp, Clipboard, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { BiomedicalArticle } from '../types';
import { fetchArticleByIdentifierApi } from '../services/api';

interface ArticleImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddArticle: (article: BiomedicalArticle) => void;
}

export const ArticleImportModal: React.FC<ArticleImportModalProps> = ({
  isOpen,
  onClose,
  onAddArticle,
}) => {
  const [activeTab, setActiveTab] = useState<'id' | 'paste' | 'file'>('id');
  const [identifier, setIdentifier] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Manual paste fields
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [journal, setJournal] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [abstractText, setAbstractText] = useState('');
  const [pmidInput, setPmidInput] = useState('');
  const [doiInput, setDoiInput] = useState('');

  if (!isOpen) return null;

  const handleFetchByIdentifier = async (idToUse?: string) => {
    const target = (idToUse || identifier).trim();
    if (!target) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      const article = await fetchArticleByIdentifierApi(target);
      onAddArticle(article);
      setIdentifier('');
      onClose();
    } catch (err: any) {
      setFetchError(err.message || 'Impossible de récupérer cet article.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !abstractText.trim()) return;

    const parsedAuthors = authors
      .split(/[,;\n]/)
      .map((a) => a.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    const newArticle: BiomedicalArticle = {
      id: `user-${Date.now()}`,
      pmid: pmidInput.trim() || undefined,
      doi: doiInput.trim() || undefined,
      title: title.trim(),
      authors: parsedAuthors.length > 0 ? parsedAuthors : [{ name: 'Auteur non spécifié' }],
      journal: journal.trim() || 'Document de Recherche Fourni',
      pubDate: year,
      year: parseInt(year, 10) || new Date().getFullYear(),
      abstract: abstractText.trim(),
      source: 'user-input',
    };

    onAddArticle(newArticle);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      // Extract basic fields or default to text content
      const lines = text.split('\n');
      const inferredTitle = file.name.replace(/\.[^/.]+$/, '');

      const newArticle: BiomedicalArticle = {
        id: `file-${Date.now()}`,
        title: inferredTitle,
        authors: [{ name: 'Document Importé' }],
        journal: file.name,
        pubDate: `${new Date().getFullYear()}`,
        year: new Date().getFullYear(),
        abstract: text.slice(0, 15000),
        source: 'user-input',
      };

      onAddArticle(newArticle);
      onClose();
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Fournir un Article pour Analyse & Synthèse
            </h2>
            <p className="text-xs text-slate-500">
              Importez par identifiant officiel, texte brut ou fichier bibliographique
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex rounded-xl bg-slate-100 p-1 my-4 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('id')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'id' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            Par Identifiant (PMID / DOI)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'paste' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            Coller le Texte / Résumé
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'file' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600'
            }`}
          >
            Fichier (.txt / .bib / .ris)
          </button>
        </div>

        {/* Tab 1: By Identifier */}
        {activeTab === 'id' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Entrez un PMID, un DOI ou une URL PubMed :
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ex: 38289412 ou 10.1038/s41586-021-03819-2"
                  className="flex-1 text-xs border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-hidden"
                />
                <button
                  onClick={() => handleFetchByIdentifier()}
                  disabled={isFetching || !identifier.trim()}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                >
                  {isFetching ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Extraction...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Importer</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {fetchError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{fetchError}</span>
              </div>
            )}

            {/* Quick Suggestions for verified real articles */}
            <div className="pt-2">
              <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                Exemples d'articles vérifiés à tester :
              </span>
              <div className="space-y-1.5">
                {[
                  {
                    pmid: '38289412',
                    desc: 'Frangoul et al. (NEJM 2024) - CRISPR-Cas9 Sickle Cell Disease & Beta-Thalassemia',
                  },
                  {
                    pmid: '38152391',
                    desc: 'Lincoff et al. (NEJM 2023) - Semaglutide and Cardiovascular Outcomes in Obesity',
                  },
                  {
                    pmid: '34265844',
                    desc: 'Jumper et al. (Nature 2021) - Highly accurate protein structure prediction with AlphaFold',
                  },
                ].map((item) => (
                  <button
                    key={item.pmid}
                    type="button"
                    onClick={() => handleFetchByIdentifier(item.pmid)}
                    className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 text-xs text-slate-700 transition-colors flex items-center justify-between"
                  >
                    <span className="truncate pr-2">{item.desc}</span>
                    <span className="font-mono text-[10px] text-blue-600 font-medium shrink-0">
                      PMID:{item.pmid}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manual Paste */}
        {activeTab === 'paste' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Titre de l'article *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Impact of GLP-1 receptor agonists on renal outcomes"
                className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Auteurs</label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="Ex: Martin J., Dupont C., Smith K."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Journal & Année</label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={journal}
                    onChange={(e) => setJournal(e.target.value)}
                    placeholder="Ex: Lancet Diabetes"
                    className="flex-2 text-xs border border-slate-300 rounded-lg p-2 focus:border-blue-500 focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="flex-1 text-xs border border-slate-300 rounded-lg p-2 focus:border-blue-500 focus:outline-hidden font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">PMID (optionnel)</label>
                <input
                  type="text"
                  value={pmidInput}
                  onChange={(e) => setPmidInput(e.target.value)}
                  placeholder="Ex: 38289412"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">DOI (optionnel)</label>
                <input
                  type="text"
                  value={doiInput}
                  onChange={(e) => setDoiInput(e.target.value)}
                  placeholder="Ex: 10.1056/NEJMoa2306983"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2 focus:border-blue-500 focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Texte intégral ou Résumé de l'article *
              </label>
              <textarea
                required
                rows={5}
                value={abstractText}
                onChange={(e) => setAbstractText(e.target.value)}
                placeholder="Collez ici le résumé ou les sections de résultats/méthodes de l'article..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Ajouter au Corpus
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: File Upload */}
        {activeTab === 'file' && (
          <div className="py-6 text-center">
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-8 transition-colors">
              <FileUp className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-800 mb-1">
                Déposez un fichier bibliographique ou texte
              </p>
              <p className="text-[11px] text-slate-500 mb-4">
                Formats acceptés : .txt, .bib (BibTeX), .ris, .json
              </p>
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors">
                <span>Parcourir mes fichiers</span>
                <input
                  type="file"
                  accept=".txt,.bib,.ris,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
