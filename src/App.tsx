import React, { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { BiomedicalArticle } from './types';
import { Header } from './components/Header';
import { SearchSection, SearchOptions } from './components/SearchSection';
import { RecentSearchesSidebar, RecentSearchItem } from './components/RecentSearchesSidebar';
import { ArticleCard } from './components/ArticleCard';
import { ArticleImportModal } from './components/ArticleImportModal';
import { CorpusDrawer } from './components/CorpusDrawer';
import { SummarizeModal } from './components/SummarizeModal';
import { BibliographyModal } from './components/BibliographyModal';
import { EmailModal } from './components/EmailModal';
import { ChatAssistant } from './components/ChatAssistant';
import { searchPubMedApi, searchEuropePmcApi } from './services/api';
import { initAuth, googleSignIn, logout } from './services/auth';
import { Sparkles, BookOpen, Download, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

const LOCAL_STORAGE_SEARCHES_KEY = 'bioscholar_recent_searches';
const LOCAL_STORAGE_NOTES_KEY = 'bioscholar_article_notes';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<'search' | 'chat'>('search');

  // Search State
  const [activeQuery, setActiveQuery] = useState('CRISPR Cas9 Sickle Cell Disease');
  const [activeOptions, setActiveOptions] = useState<SearchOptions>({
    source: 'pubmed',
    sort: 'pub_date',
    freeFullText: false,
    clinicalTrials: false,
    years: 5,
  });
  const [articles, setArticles] = useState<BiomedicalArticle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Recent Searches Sidebar
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SEARCHES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback on corrupt JSON
    }
    return [];
  });
  const [isRecentSidebarOpen, setIsRecentSidebarOpen] = useState(true);

  // Local Article Notes Map
  const [articleNotes, setArticleNotes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_NOTES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return {};
  });

  // Selected Corpus
  const [corpus, setCorpus] = useState<BiomedicalArticle[]>([]);
  const [isCorpusOpen, setIsCorpusOpen] = useState(false);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summaryTargetArticle, setSummaryTargetArticle] = useState<BiomedicalArticle | undefined>();
  const [isBibliographyOpen, setIsBibliographyOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [emailInitialSummary, setEmailInitialSummary] = useState<string | undefined>();

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save recent searches to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch (err) {
      console.warn('Unable to persist recent searches:', err);
    }
  }, [recentSearches]);

  // Save personal notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES_KEY, JSON.stringify(articleNotes));
    } catch (err) {
      console.warn('Unable to persist article notes:', err);
    }
  }, [articleNotes]);

  // Initial search on mount
  useEffect(() => {
    handleSearch('CRISPR Cas9 Sickle Cell Disease', {
      source: 'pubmed',
      sort: 'pub_date',
      freeFullText: false,
      clinicalTrials: false,
      years: 5,
    });
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
      }
    } catch (err: any) {
      console.error('Login error:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSearch = async (query: string, options: SearchOptions) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setActiveQuery(trimmedQuery);
    setActiveOptions(options);
    setIsSearching(true);
    setSearchError(null);

    try {
      let results: BiomedicalArticle[] = [];
      if (options.source === 'pubmed') {
        results = await searchPubMedApi(trimmedQuery, {
          maxResults: 10,
          sort: options.sort,
          freeFullText: options.freeFullText,
          clinicalTrials: options.clinicalTrials,
          years: options.years,
        });
      } else {
        results = await searchEuropePmcApi(trimmedQuery, {
          pageSize: 10,
          openAccess: options.freeFullText,
          preprints: false,
        });
      }

      // Attach saved user notes if any exist
      const populatedResults = results.map((a) => ({
        ...a,
        userNotes: articleNotes[a.id] || a.userNotes,
      }));

      setArticles(populatedResults);

      // Auto-populate the first 2 results into the active corpus on initial search if corpus is empty
      setCorpus((prev) => {
        if (prev.length === 0 && populatedResults.length > 0) {
          return populatedResults.slice(0, 2);
        }
        return prev;
      });

      // Update Recent Searches in localStorage
      setRecentSearches((prev) => {
        const existing = prev.find(
          (item) =>
            item.query.toLowerCase() === trimmedQuery.toLowerCase() &&
            item.source === options.source
        );

        const updatedItem: RecentSearchItem = {
          id: existing?.id || `search-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          query: trimmedQuery,
          source: options.source,
          timestamp: Date.now(),
          resultCount: populatedResults.length,
          options,
          isPinned: existing?.isPinned || false,
        };

        const remaining = prev.filter(
          (item) =>
            !(
              item.query.toLowerCase() === trimmedQuery.toLowerCase() &&
              item.source === options.source
            )
        );

        return [updatedItem, ...remaining].slice(0, 25);
      });
    } catch (err: any) {
      console.error(err);
      setSearchError(err.message || 'Impossible d\'effectuer la recherche.');
    } finally {
      setIsSearching(false);
    }
  };

  // Save personal note for an article
  const handleSaveArticleNote = (articleId: string, noteText: string) => {
    setArticleNotes((prev) => {
      const next = { ...prev };
      if (!noteText.trim()) {
        delete next[articleId];
      } else {
        next[articleId] = noteText.trim();
      }
      return next;
    });

    // Update in articles and corpus
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, userNotes: noteText.trim() || undefined } : a))
    );
    setCorpus((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, userNotes: noteText.trim() || undefined } : a))
    );
  };

  // Re-run search from recent sidebar
  const handleSelectRecentSearch = (item: RecentSearchItem) => {
    setActiveTab('search');
    setActiveQuery(item.query);
    setActiveOptions(item.options);
    handleSearch(item.query, item.options);
  };

  const handleDeleteRecentSearch = (id: string) => {
    setRecentSearches((prev) => prev.filter((item) => item.id !== id));
  };

  const handleTogglePinRecentSearch = (id: string) => {
    setRecentSearches((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isPinned: !item.isPinned } : item))
    );
  };

  const handleClearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(LOCAL_STORAGE_SEARCHES_KEY);
  };

  const handleToggleCorpus = (article: BiomedicalArticle) => {
    setCorpus((prev) => {
      const exists = prev.some((a) => a.id === article.id);
      if (exists) {
        return prev.filter((a) => a.id !== article.id);
      } else {
        return [...prev, article];
      }
    });
  };

  const handleRemoveFromCorpus = (id: string) => {
    setCorpus((prev) => prev.filter((a) => a.id !== id));
  };

  const handleClearCorpus = () => {
    setCorpus([]);
  };

  const handleAddUserArticle = (article: BiomedicalArticle) => {
    const withNotes = { ...article, userNotes: articleNotes[article.id] || article.userNotes };
    setCorpus((prev) => [withNotes, ...prev.filter((a) => a.id !== article.id)]);
    setArticles((prev) => [withNotes, ...prev.filter((a) => a.id !== article.id)]);
  };

  const handleOpenSummarizeSingle = (article: BiomedicalArticle) => {
    setSummaryTargetArticle(article);
    setIsSummaryOpen(true);
  };

  const handleOpenSummarizeComparative = () => {
    setSummaryTargetArticle(undefined);
    setIsSummaryOpen(true);
  };

  const handleOpenEmailWithText = (text: string) => {
    setEmailInitialSummary(text);
    setIsEmailOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        user={user}
        corpusCount={corpus.length}
        onOpenCorpus={() => setIsCorpusOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenEmail={() => setIsEmailOpen(true)}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isLoggingIn={isLoggingIn}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Literature Search & Corpus Workbench */}
        {activeTab === 'search' && (
          <div className="flex items-start gap-6">
            {/* Recent Searches Sidebar */}
            <RecentSearchesSidebar
              searches={recentSearches}
              activeQuery={activeQuery}
              onSelectSearch={handleSelectRecentSearch}
              onDeleteSearch={handleDeleteRecentSearch}
              onTogglePin={handleTogglePinRecentSearch}
              onClearAll={handleClearAllRecentSearches}
              isOpen={isRecentSidebarOpen}
              onToggleOpen={() => setIsRecentSidebarOpen(!isRecentSidebarOpen)}
            />

            {/* Main Search and Articles Column */}
            <div className="flex-1 min-w-0">
              {/* Search and Filters */}
              <SearchSection
                onSearch={handleSearch}
                isLoading={isSearching}
                currentQuery={activeQuery}
                currentOptions={activeOptions}
                onToggleSidebar={() => setIsRecentSidebarOpen(!isRecentSidebarOpen)}
                isSidebarOpen={isRecentSidebarOpen}
                recentCount={recentSearches.length}
              />

              {/* Sticky Actions Bar for active Corpus */}
              {corpus.length > 0 && (
                <div className="mb-6 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-900">
                      {corpus.length} publication{corpus.length > 1 ? 's' : ''} dans votre corpus
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 hidden sm:inline">
                      Prêtes pour la synthèse comparative et l'analyse IA
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      onClick={handleOpenSummarizeComparative}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold shadow-2xs transition-colors whitespace-nowrap"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Synthèse Comparative</span>
                    </button>

                    <button
                      onClick={() => setIsBibliographyOpen(true)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 font-medium transition-colors whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Export Bibliographique</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('chat')}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-blue-700 rounded-lg border border-blue-200 font-medium transition-colors whitespace-nowrap"
                    >
                      <span>Poser des questions</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error banner */}
              {searchError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Erreur de recherche</p>
                    <p className="mt-0.5">{searchError}</p>
                  </div>
                </div>
              )}

              {/* Articles List */}
              {isSearching ? (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin mb-3" />
                  <p className="text-sm font-semibold text-slate-800">
                    Interrogation en direct des serveurs PubMed & Europe PMC...
                  </p>
                  <p className="text-xs text-slate-500">
                    Extraction des résumés structurés, identifiants vérifiés et affiliations
                  </p>
                </div>
              ) : articles.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-slate-800 mb-1">
                    Aucun résultat trouvé
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    Essayez d'ajuster vos mots-clés, de sélectionner une période plus large ou d'importer directement un article par PMID / DOI.
                  </p>
                  <button
                    onClick={() => setIsImportOpen(true)}
                    className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Importer un document
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs text-slate-500 font-mono">
                    <span>
                      <strong>{articles.length}</strong> publications vérifiées
                    </span>
                    <span>Citations vérifiables par PMID & DOI</span>
                  </div>

                  <div className="space-y-4">
                    {articles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isInCorpus={corpus.some((a) => a.id === article.id)}
                        onToggleCorpus={handleToggleCorpus}
                        onSummarize={handleOpenSummarizeSingle}
                        initialNote={articleNotes[article.id] || ''}
                        onSaveNote={handleSaveArticleNote}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Multi-Turn Verifiable Q&A Assistant */}
        {activeTab === 'chat' && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950 tracking-tight">
                Assistant Biomédical & Citations Vérifiables
              </h2>
              <p className="text-xs text-slate-500">
                Interrogez vos publications chargées avec analyse critique des preuves, endpoints et références strictes
              </p>
            </div>

            <ChatAssistant
              corpusArticles={corpus}
              onOpenEmail={handleOpenEmailWithText}
              onOpenImport={() => setIsImportOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 sm:gap-2 text-center sm:text-left">
            <span className="font-bold text-slate-900 text-sm">BioScholar</span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="text-slate-700 font-semibold">
              Développé par <span className="text-slate-950 font-bold">Roqia Benaboud</span>
            </span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="text-slate-500">
              Intelligence Artificielle & Science des Données
            </span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span>PubMed & Europe PMC</span>
            <span>·</span>
            <span>Google Workspace Gmail</span>
            <span>·</span>
            <span>Gemini 3.8 Flash</span>
          </div>
        </div>
      </footer>

      {/* Slide-over Corpus Drawer */}
      <CorpusDrawer
        isOpen={isCorpusOpen}
        onClose={() => setIsCorpusOpen(false)}
        corpus={corpus}
        onRemoveFromCorpus={handleRemoveFromCorpus}
        onClearCorpus={handleClearCorpus}
        onComparativeSummary={handleOpenSummarizeComparative}
        onOpenBibliography={() => setIsBibliographyOpen(true)}
        onStartChat={() => setActiveTab('chat')}
        onOpenEmail={() => setIsEmailOpen(true)}
      />

      {/* Import User Article Modal */}
      <ArticleImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onAddArticle={handleAddUserArticle}
      />

      {/* Structured Scientific Summary Modal */}
      <SummarizeModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        targetArticle={summaryTargetArticle}
        corpusArticles={corpus}
        onOpenBibliography={() => setIsBibliographyOpen(true)}
        onOpenEmailWithSummary={handleOpenEmailWithText}
      />

      {/* Standard Bibliography Export Modal */}
      <BibliographyModal
        isOpen={isBibliographyOpen}
        onClose={() => setIsBibliographyOpen(false)}
        articles={corpus.length > 0 ? corpus : articles}
      />

      {/* Gmail Workspace Share Modal */}
      <EmailModal
        isOpen={isEmailOpen}
        onClose={() => setIsEmailOpen(false)}
        user={user}
        onSignIn={handleSignIn}
        corpusArticles={corpus.length > 0 ? corpus : articles.slice(0, 3)}
        customSummaryText={emailInitialSummary}
      />
    </div>
  );
}
