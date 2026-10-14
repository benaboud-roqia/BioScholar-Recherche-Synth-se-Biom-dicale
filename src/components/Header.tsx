import React from 'react';
import { Microscope, BookOpen, Mail, LogOut, PlusCircle, Sparkles } from 'lucide-react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  corpusCount: number;
  onOpenCorpus: () => void;
  onOpenImport: () => void;
  onOpenEmail: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoggingIn: boolean;
  activeTab: 'search' | 'chat';
  setActiveTab: (tab: 'search' | 'chat') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  corpusCount,
  onOpenCorpus,
  onOpenImport,
  onOpenEmail,
  onSignIn,
  onSignOut,
  isLoggingIn,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Microscope className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <span className="font-extrabold text-slate-950 text-base tracking-tight whitespace-nowrap block leading-tight">
                BioScholar
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:block leading-tight">
                Par Roqia Benaboud · IA & Science des Données
              </span>
            </div>
          </div>

          {/* Zone 2: Clean 1-line Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeTab === 'search'
                  ? 'text-slate-950 bg-slate-100 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Publications & Recherche
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                activeTab === 'chat'
                  ? 'text-slate-950 bg-slate-100 font-bold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Assistant Citations Vérifiables</span>
            </button>

            <button
              onClick={onOpenCorpus}
              className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 whitespace-nowrap transition-colors flex items-center space-x-1"
            >
              <span>Corpus d'Études</span>
              {corpusCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-slate-900 text-white text-[10px] font-mono rounded-md">
                  {corpusCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenImport}
              className="px-3 py-2 rounded-lg hover:text-slate-900 hover:bg-slate-50 whitespace-nowrap transition-colors flex items-center space-x-1"
            >
              <PlusCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Importer un Document</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action & Google Workspace Auth */}
          <div className="flex items-center space-x-2 shrink-0">
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenEmail}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs whitespace-nowrap"
                  title="Partager les synthèses par Gmail"
                >
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Partager via Gmail</span>
                </button>

                <div
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 border border-slate-300 flex items-center justify-center text-xs font-bold"
                  title={user.email || 'Utilisateur'}
                >
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>

                <button
                  onClick={onSignOut}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Déconnexion"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                disabled={isLoggingIn}
                className="gsi-material-button inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors whitespace-nowrap"
              >
                <div className="gsi-material-button-icon w-4 h-4">
                  <svg viewBox="0 0 48 48" className="w-4 h-4">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span>{isLoggingIn ? 'Connexion...' : 'Connexion Gmail'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
