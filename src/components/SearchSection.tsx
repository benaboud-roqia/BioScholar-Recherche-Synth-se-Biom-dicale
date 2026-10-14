import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, Database, SlidersHorizontal, X, History } from 'lucide-react';

export interface SearchOptions {
  source: 'pubmed' | 'europepmc';
  sort: 'pub_date' | 'relevance';
  freeFullText: boolean;
  clinicalTrials: boolean;
  years?: number;
}

interface SearchSectionProps {
  onSearch: (query: string, options: SearchOptions) => void;
  isLoading: boolean;
  currentQuery?: string;
  currentOptions?: SearchOptions;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  recentCount?: number;
}

const EXAMPLE_QUERIES = [
  'CRISPR Cas9 Sickle Cell Disease',
  'GLP-1 receptor agonists type 2 diabetes',
  'mRNA vaccines neoantigens oncology',
  'CAR-T cell therapy B-cell lymphoma',
  'AlphaFold structural prediction accuracy',
  'Tau protein phosphorylation Alzheimer',
];

export const SearchSection: React.FC<SearchSectionProps> = ({
  onSearch,
  isLoading,
  currentQuery,
  currentOptions,
  onToggleSidebar,
  isSidebarOpen,
  recentCount = 0,
}) => {
  const [query, setQuery] = useState(currentQuery || 'CRISPR Cas9 Sickle Cell Disease');
  const [source, setSource] = useState<'pubmed' | 'europepmc'>(currentOptions?.source || 'pubmed');
  const [sort, setSort] = useState<'pub_date' | 'relevance'>(currentOptions?.sort || 'pub_date');
  const [freeFullText, setFreeFullText] = useState(currentOptions?.freeFullText || false);
  const [clinicalTrials, setClinicalTrials] = useState(currentOptions?.clinicalTrials || false);
  const [years, setYears] = useState<number | undefined>(currentOptions?.years ?? 5);
  const [showFilters, setShowFilters] = useState(false);

  // Sync state if parent passes a different query or options (e.g. from Recent Searches)
  useEffect(() => {
    if (currentQuery !== undefined && currentQuery !== query) {
      setQuery(currentQuery);
    }
  }, [currentQuery]);

  useEffect(() => {
    if (currentOptions) {
      if (currentOptions.source) setSource(currentOptions.source);
      if (currentOptions.sort) setSort(currentOptions.sort);
      setFreeFullText(Boolean(currentOptions.freeFullText));
      setClinicalTrials(Boolean(currentOptions.clinicalTrials));
      setYears(currentOptions.years);
    }
  }, [currentOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), {
      source,
      sort,
      freeFullText,
      clinicalTrials,
      years,
    });
  };

  const handleChipClick = (example: string) => {
    setQuery(example);
    onSearch(example, {
      source,
      sort,
      freeFullText,
      clinicalTrials,
      years,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 mb-6">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center rounded-xl border border-slate-300 focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100/80 bg-white transition-all shadow-2xs overflow-hidden">
          <div className="pl-4 text-slate-400">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par mot-clé biomédical, gène, pathologie, molécule, PMID ou auteur..."
            className="w-full py-3 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center pr-2 space-x-1.5">
            {/* Toggle Recent Searches Sidebar */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className={`p-2 rounded-lg text-xs font-medium border flex items-center space-x-1 transition-colors ${
                  isSidebarOpen
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Afficher/masquer les recherches récentes"
              >
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Historique</span>
                {recentCount > 0 && (
                  <span className="px-1 py-0.2 bg-blue-100 text-blue-800 rounded-full font-mono text-[10px]">
                    {recentCount}
                  </span>
                )}
              </button>
            )}

            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg text-xs font-medium border flex items-center space-x-1 transition-colors ${
                showFilters || freeFullText || clinicalTrials || years
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title="Filtres avancés"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filtres</span>
            </button>

            {/* Search Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center space-x-1.5"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Recherche...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rechercher</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Database Source & Filters Drawer */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-in fade-in duration-200">
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Base de données</label>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setSource('pubmed')}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all ${
                  source === 'pubmed' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                NCBI PubMed
              </button>
              <button
                type="button"
                onClick={() => setSource('europepmc')}
                className={`flex-1 py-1.5 px-2 rounded-md font-medium text-center transition-all ${
                  source === 'europepmc' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-600'
                }`}
              >
                Europe PMC
              </button>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Période de publication</label>
            <select
              value={years || ''}
              onChange={(e) => setYears(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            >
              <option value="1">Dernière année (12 mois)</option>
              <option value="5">5 dernières années</option>
              <option value="10">10 dernières années</option>
              <option value="">Toutes les dates</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Ordre de tri</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'pub_date' | 'relevance')}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
            >
              <option value="pub_date">Date la plus récente</option>
              <option value="relevance">Pertinence biomédicale</option>
            </select>
          </div>

          <div className="flex flex-col justify-end space-y-2">
            <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={freeFullText}
                onChange={(e) => setFreeFullText(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Texte intégral gratuit (Free Full Text)</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={clinicalTrials}
                onChange={(e) => setClinicalTrials(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>Essais cliniques uniquement (RCT)</span>
            </label>
          </div>
        </div>
      )}

      {/* Quick Example Chips */}
      <div className="mt-3.5 flex items-center flex-wrap gap-1.5">
        <span className="text-[11px] font-medium text-slate-400 flex items-center mr-1">
          <Sparkles className="w-3 h-3 mr-1 text-blue-500" /> Suggestions :
        </span>
        {EXAMPLE_QUERIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => handleChipClick(item)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/80 hover:border-blue-200 transition-colors"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
