import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Download,
  Mail,
  AlertCircle,
  ExternalLink,
  Table,
  CheckCircle2,
} from 'lucide-react';
import type { BiomedicalArticle, ScientificSummaryData } from '../types';
import { generateSummaryApi } from '../services/api';

interface SummarizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetArticle?: BiomedicalArticle;
  corpusArticles?: BiomedicalArticle[];
  onOpenBibliography: () => void;
  onOpenEmailWithSummary: (summaryText: string) => void;
}

export const SummarizeModal: React.FC<SummarizeModalProps> = ({
  isOpen,
  onClose,
  targetArticle,
  corpusArticles = [],
  onOpenBibliography,
  onOpenEmailWithSummary,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ScientificSummaryData | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.8-flash');
  const [copied, setCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');

  // Determine articles to summarize
  const articlesToProcess = targetArticle
    ? [targetArticle]
    : corpusArticles.length > 0
    ? corpusArticles
    : [];

  const isMultiArticle = articlesToProcess.length > 1;

  const triggerSummary = async () => {
    if (articlesToProcess.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      const res = await generateSummaryApi({
        article: targetArticle,
        articles: targetArticle ? undefined : corpusArticles,
        mode: isMultiArticle ? 'comparative' : 'single',
        model: selectedModel,
      });

      setSummaryData(res.summary);
      setModelUsed(res.modelUsed);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Échec de la génération du résumé biomédical.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && articlesToProcess.length > 0) {
      triggerSummary();
    } else if (!isOpen) {
      setSummaryData(null);
      setError(null);
    }
  }, [isOpen, targetArticle?.id, corpusArticles.length]);

  if (!isOpen) return null;

  const getPlainTextSummary = (): string => {
    if (!summaryData) return '';
    let out = `# ${summaryData.title}\n\n`;
    out += `## 1. Contexte & Hypothèses\n${summaryData.background}\n\n`;
    out += `## 2. Méthodologie & Modèle d'Étude\n${summaryData.methodology}\n\n`;
    out += `## 3. Résultats Clés & Données Statistiques\n`;
    for (const f of summaryData.keyFindings) {
      out += `- ${f}\n`;
    }
    out += `\n## 4. Pertinence Clinique & Translationnelle\n${summaryData.clinicalRelevance}\n\n`;
    out += `## 5. Limites & Biais Méthodologiques\n`;
    for (const l of summaryData.limitations) {
      out += `- ${l}\n`;
    }
    out += `\n## 6. Références Vérifiables Citées\n`;
    for (const c of summaryData.verifiableCitations) {
      out += `- ${c.citationRef} ${c.articleTitle}: ${c.evidenceClaim}\n`;
    }
    return out;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(getPlainTextSummary());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isMultiArticle
                  ? `Synthèse Comparative Biomédicale (${articlesToProcess.length} études)`
                  : "Synthèse Structurée de l'Article"}
              </h2>
              <p className="text-xs text-slate-500">
                Génération rigoureuse avec extraction méthodologique et citations vérifiables
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="text-xs bg-white border border-slate-300 rounded-lg py-1 px-2 text-slate-700 font-medium focus:outline-hidden"
              title="Modèle d'IA utilisé"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Standard/Équilibré)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Rapide)</option>
            </select>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 text-slate-800 space-y-6">
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-800">
                Analyse systématique et extraction des preuves biomédicales...
              </p>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Extraction des protocoles expérimentaux, critères d'évaluation et formulation des citations vérifiables.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erreur lors de la synthèse</p>
                <p className="mt-1">{error}</p>
                <button
                  onClick={triggerSummary}
                  className="mt-2 text-red-800 font-semibold underline hover:no-underline"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {summaryData && !loading && (
            <div className="space-y-6 text-xs sm:text-sm">
              {/* Review Title */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
                <span className="text-[10px] font-mono font-semibold text-blue-700 uppercase tracking-wider block mb-1">
                  Synthèse Clinique & Moléculaire
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {summaryData.title}
                </h3>
              </div>

              {/* 1. Background */}
              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center text-blue-900">
                  <span className="w-2 h-2 rounded-full bg-blue-600 mr-2" />
                  1. Contexte & Problématique Scientifique
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 leading-relaxed text-slate-700">
                  {summaryData.background}
                </div>
              </section>

              {/* 2. Methodology */}
              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center text-blue-900">
                  <span className="w-2 h-2 rounded-full bg-teal-600 mr-2" />
                  2. Méthodologie & Modèle Expérimental / Clinique
                </h4>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 leading-relaxed text-slate-700 font-mono text-xs">
                  {summaryData.methodology}
                </div>
              </section>

              {/* Comparative Table if present */}
              {summaryData.comparativeTable && summaryData.comparativeTable.length > 0 && (
                <section className="space-y-2">
                  <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center text-blue-900">
                    <Table className="w-4 h-4 mr-1.5 text-blue-600" />
                    Tableau Comparatif des Études Analysées
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                        <tr>
                          <th className="p-2.5">Étude / Référence</th>
                          <th className="p-2.5">Design</th>
                          <th className="p-2.5">Échantillon (n)</th>
                          <th className="p-2.5">Critère Principal</th>
                          <th className="p-2.5">Résultat Majeur</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {summaryData.comparativeTable.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2.5 font-medium text-slate-900">{row.study}</td>
                            <td className="p-2.5 text-slate-600">{row.design}</td>
                            <td className="p-2.5 font-mono text-slate-600">{row.sampleSize}</td>
                            <td className="p-2.5 text-slate-600">{row.primaryEndpoint}</td>
                            <td className="p-2.5 text-slate-800 font-medium">{row.keyOutcome}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* 3. Key Findings */}
              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                  3. Résultats Majeurs & Preuves Statistiques
                </h4>
                <ul className="space-y-2">
                  {summaryData.keyFindings.map((finding, idx) => (
                    <li
                      key={idx}
                      className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl text-slate-800 leading-relaxed flex items-start space-x-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 4. Clinical Relevance */}
              <section className="space-y-1.5">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center text-purple-900">
                  <span className="w-2 h-2 rounded-full bg-purple-600 mr-2" />
                  4. Portée Clinique & Impact Thérapeutique
                </h4>
                <div className="p-3.5 bg-purple-50/40 rounded-xl border border-purple-100 leading-relaxed text-slate-800">
                  {summaryData.clinicalRelevance}
                </div>
              </section>

              {/* 5. Limitations */}
              <section className="space-y-2">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider flex items-center text-amber-900">
                  <span className="w-2 h-2 rounded-full bg-amber-600 mr-2" />
                  5. Limites de l'Étude & Précautions d'Interprétation
                </h4>
                <ul className="space-y-1.5">
                  {summaryData.limitations.map((lim, i) => (
                    <li
                      key={i}
                      className="p-2.5 bg-amber-50/30 border border-amber-100 rounded-lg text-slate-700 leading-relaxed flex items-start space-x-2"
                    >
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* 6. Verifiable Citations */}
              <section className="space-y-2 pt-2 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider text-slate-700">
                  6. Preuves & Références Vérifiables
                </h4>
                <div className="space-y-2">
                  {summaryData.verifiableCitations.map((cite, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            {cite.citationRef}
                          </span>
                          <span className="font-semibold text-slate-900 text-xs">
                            {cite.articleTitle}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] italic">
                          "{cite.evidenceClaim}"
                        </p>
                      </div>

                      {cite.pmid && (
                        <a
                          href={`https://pubmed.ncbi.nlm.nih.gov/${cite.pmid}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                          title="Vérifier sur PubMed"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {summaryData && !loading && (
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              Généré via {modelUsed}
            </span>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyMarkdown}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copier Synthèse</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  onOpenBibliography();
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Exporter Références</span>
              </button>

              <button
                onClick={() => {
                  onOpenEmailWithSummary(getPlainTextSummary());
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Envoyer par Gmail</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
