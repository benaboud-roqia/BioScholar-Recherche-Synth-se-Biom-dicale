import React, { useState } from 'react';
import {
  History,
  Search,
  Trash2,
  Pin,
  Clock,
  ArrowRight,
  Database,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import type { SearchOptions } from './SearchSection';

export interface RecentSearchItem {
  id: string;
  query: string;
  source: 'pubmed' | 'europepmc';
  timestamp: number;
  resultCount?: number;
  options: SearchOptions;
  isPinned?: boolean;
}

interface RecentSearchesSidebarProps {
  searches: RecentSearchItem[];
  activeQuery?: string;
  onSelectSearch: (item: RecentSearchItem) => void;
  onDeleteSearch: (id: string) => void;
  onTogglePin: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const RecentSearchesSidebar: React.FC<RecentSearchesSidebarProps> = ({
  searches,
  activeQuery,
  onSelectSearch,
  onDeleteSearch,
  onTogglePin,
  onClearAll,
  isOpen,
  onToggleOpen,
}) => {
  const [filterText, setFilterText] = useState('');

  const formatRelativeTime = (timestamp: number): string => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'À l\'instant';
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} j`;
  };

  const filteredSearches = searches.filter((item) =>
    item.query.toLowerCase().includes(filterText.toLowerCase())
  );

  // Sort pinned first, then newest
  const sortedSearches = [...filteredSearches].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp - a.timestamp;
  });

  return (
    <>
      {/* Sidebar toggle button when collapsed */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="fixed left-0 top-32 z-20 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-y border-r border-slate-300 rounded-r-xl p-2.5 shadow-md flex items-center space-x-1.5 transition-all text-xs font-semibold group"
          title="Ouvrir l'historique des recherches récentes"
        >
          <History className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Historique</span>
          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-mono text-[10px]">
            {searches.length}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
        </button>
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`transition-all duration-200 ease-in-out shrink-0 ${
          isOpen ? 'w-80' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="w-80 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[750px] sticky top-20">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <History className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <span>Recherches Récentes</span>
                  <span className="px-1.5 py-0.2 bg-slate-200/80 text-slate-700 rounded-full font-mono text-[10px]">
                    {searches.length}
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500">Relancez vos requêtes en 1 clic</p>
              </div>
            </div>

            <button
              onClick={onToggleOpen}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Replier le panneau"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Filter Input if multiple searches */}
          {searches.length > 3 && (
            <div className="px-3 py-2 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filtrer les recherches..."
                  className="w-full text-[11px] bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-7 py-1.5 focus:outline-hidden focus:border-blue-500"
                />
                {filterText && (
                  <button
                    onClick={() => setFilterText('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Search items list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {searches.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <History className="w-8 h-8 text-slate-300 stroke-1 mb-2" />
                <p className="text-xs font-medium text-slate-600 mb-0.5">Aucune recherche récente</p>
                <p className="text-[10px] text-slate-400 max-w-[190px]">
                  Vos requêtes PubMed et Europe PMC seront sauvegardées ici automatiquement.
                </p>
              </div>
            ) : sortedSearches.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucune recherche ne correspond à "{filterText}".
              </div>
            ) : (
              sortedSearches.map((item) => {
                const isActive = activeQuery?.toLowerCase() === item.query.toLowerCase();
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-2.5 transition-all text-xs relative group ${
                      isActive
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-200'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      {/* Clickable Query Text */}
                      <button
                        onClick={() => onSelectSearch(item)}
                        className="flex-1 text-left group-hover:text-blue-700 transition-colors"
                        title="Relancer cette recherche"
                      >
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span
                            className={`font-semibold line-clamp-1 leading-snug ${
                              isActive ? 'text-blue-900 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {item.query}
                          </span>
                        </div>
                      </button>

                      {/* Pin & Delete Actions */}
                      <div className="flex items-center space-x-0.5 shrink-0">
                        <button
                          onClick={() => onTogglePin(item.id)}
                          className={`p-1 rounded-md transition-colors ${
                            item.isPinned
                              ? 'text-amber-500 hover:text-amber-600'
                              : 'text-slate-300 hover:text-amber-500 opacity-0 group-hover:opacity-100'
                          }`}
                          title={item.isPinned ? 'Détacher' : 'Épingler en haut'}
                        >
                          <Pin className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => onDeleteSearch(item.id)}
                          className="p-1 rounded-md text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                          title="Supprimer de l'historique"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meta info & Filters applied */}
                    <div
                      onClick={() => onSelectSearch(item)}
                      className="cursor-pointer flex items-center flex-wrap gap-1 mt-1 text-[10px]"
                    >
                      {/* Database badge */}
                      <span
                        className={`px-1.5 py-0.2 rounded-md font-mono font-medium ${
                          item.source === 'pubmed'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {item.source === 'pubmed' ? 'PubMed' : 'Europe PMC'}
                      </span>

                      {/* Filter flags */}
                      {item.options?.freeFullText && (
                        <span className="px-1.5 py-0.2 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-medium">
                          OA
                        </span>
                      )}
                      {item.options?.clinicalTrials && (
                        <span className="px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                          RCT
                        </span>
                      )}
                      {item.options?.years && (
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-mono">
                          {item.options.years}a
                        </span>
                      )}

                      {/* Count if available */}
                      {typeof item.resultCount === 'number' && (
                        <span className="text-slate-400 font-mono">
                          ({item.resultCount} rés.)
                        </span>
                      )}
                    </div>

                    {/* Bottom Timestamp & Re-run Hint */}
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/80 text-[10px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatRelativeTime(item.timestamp)}</span>
                      </span>

                      <button
                        onClick={() => onSelectSearch(item)}
                        className="inline-flex items-center space-x-0.5 text-blue-600 hover:text-blue-800 font-medium"
                      >
                        <span>Relancer</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Clear All button */}
          {searches.length > 0 && (
            <div className="p-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs rounded-b-2xl">
              <button
                onClick={onClearAll}
                className="text-[11px] text-red-600 hover:text-red-800 font-medium inline-flex items-center space-x-1 hover:underline p-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Effacer tout</span>
              </button>

              <span className="text-[10px] text-slate-400">
                Stocké localement
              </span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
