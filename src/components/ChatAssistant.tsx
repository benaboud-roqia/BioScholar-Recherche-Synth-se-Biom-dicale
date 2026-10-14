import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Trash2,
  Mail,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import type { BiomedicalArticle, ChatMessage } from '../types';
import { sendChatMessageApi } from '../services/api';

interface ChatAssistantProps {
  corpusArticles: BiomedicalArticle[];
  onOpenEmail: (initialText: string) => void;
  onOpenImport: () => void;
}

const ROLES = [
  {
    id: 'biomedical-fellow',
    title: 'Évaluateur Méthodologique & Preuves',
    promptRole: 'Senior Biomedical Research Scientist & Systematic Evidence Specialist',
    description: 'Analyse critique des critères de jugement, risques de biais et cohérence statistique.',
  },
  {
    id: 'clinical-specialist',
    title: 'Spécialiste Essais Cliniques & Pharmacologie',
    promptRole: 'Clinical Pharmacology and Human Trials Medical Specialist',
    description: 'Focus sur les phases cliniques, endpoints primaires, posologies et tolérance.',
  },
  {
    id: 'molecular-biologist',
    title: 'Biologiste Moléculaire & Mécanismes',
    promptRole: 'Molecular Biologist & Mechanism of Action Expert',
    description: 'Focus sur les voies de signalisation, cibles génétiques et affinités biochimiques.',
  },
];

const SUGGESTED_PROMPTS = [
  "Compare les critères d'évaluation primaires et les tailles d'échantillon des études.",
  'Quels sont les mécanismes moléculaires d\'action démontrés dans ces publications ?',
  'Quels sont les effets indésirables et limitations méthodologiques rapportés ?',
  'Existe-t-il des divergences ou résultats contradictoires entre ces études ?',
];

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  corpusArticles,
  onOpenEmail,
  onOpenImport,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        `Bonjour ! Je suis votre assistant de recherche biomédicale propulsé par Gemini.\n\n` +
        (corpusArticles.length > 0
          ? `J'ai chargé **${corpusArticles.length} article(s)** de votre corpus en contexte de travail. Toutes mes réponses s'appuient sur ces publications avec des **références et citations vérifiables** [PMID].\n\nQue souhaitez-vous explorer ou comparer ?`
          : `Aucun article n'est actuellement sélectionné dans votre corpus. Vous pouvez rechercher des articles sur PubMed / Europe PMC, ou importer vos propres documents pour une analyse fondée sur des preuves.`),
      timestamp: Date.now(),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const activeRoleConfig = ROLES.find((r) => r.id === selectedRole);

      // Call server-side Gemini chat API
      const response = await sendChatMessageApi({
        messages: newHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        contextArticles: corpusArticles,
        personaRole: activeRoleConfig?.promptRole,
        model: selectedModel,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        citations: response.citations,
        timestamp: Date.now(),
        modelUsed: response.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Désolé, une erreur est survenue lors de l'interrogation du modèle Gemini : ${err.message || 'Erreur réseau'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Historique réinitialisé. Prêt pour une nouvelle analyse sur vos ${corpusArticles.length} publication(s) biomédicale(s).`,
        timestamp: Date.now(),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col h-[750px] overflow-hidden">
      {/* Chat Header Toolbar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
        {/* Active Model & Role Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Persona Role Dropdown */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Rôle IA :
            </span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg text-xs py-1.5 px-2.5 font-medium text-slate-800 focus:outline-hidden focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection Dropdown */}
          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="bg-white border border-slate-300 rounded-lg text-xs py-1.5 px-2.5 font-medium text-slate-800 focus:outline-hidden focus:border-blue-500"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Tâches Générales / Défaut)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Rapide)</option>
              <option value="gemini-4-argon">gemini-4-argon (Méta-analyse Complexe)</option>
            </select>
          </div>
        </div>

        {/* Corpus Status Badge & Clear button */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              {corpusArticles.length} article{corpusArticles.length > 1 ? 's' : ''} en contexte
            </span>
          </div>

          {corpusArticles.length === 0 && (
            <button
              onClick={onOpenImport}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              + Charger des articles
            </button>
          )}

          <button
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60 transition-colors"
            title="Effacer la conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scrollable Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        {messages.map((message) => {
          const isUser = message.role === 'user';
          return (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white ${
                  isUser
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-tr from-blue-700 via-blue-600 to-teal-500 ring-2 ring-blue-100'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-2xs'
                    : 'bg-slate-50 border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-2xs'
                }`}
              >
                {/* Content text */}
                <div className="whitespace-pre-wrap space-y-2">
                  {message.content}
                </div>

                {/* Citations section if assistant response has citations */}
                {!isUser && message.citations && message.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider flex items-center mb-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                      Références & Citations Vérifiables :
                    </span>
                    <div className="space-y-1.5">
                      {message.citations.map((cite, i) => (
                        <div
                          key={i}
                          className="bg-white border border-slate-200 rounded-lg p-2 text-xs flex items-center justify-between"
                        >
                          <div className="truncate pr-2">
                            <span className="font-mono font-bold text-blue-600 mr-1.5">
                              {cite.citationKey}
                            </span>
                            <span className="text-slate-800 font-medium">
                              {cite.articleTitle}
                            </span>
                          </div>

                          {cite.url && (
                            <a
                              href={cite.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded shrink-0"
                              title="Voir sur PubMed"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistant Message Actions (Copy & Gmail) */}
                {!isUser && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono">
                      {message.modelUsed || 'gemini-3.8-flash'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyMessage(message.id, message.content)}
                        className="inline-flex items-center space-x-1 hover:text-slate-700 transition-colors"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onOpenEmail(message.content)}
                        className="inline-flex items-center space-x-1 hover:text-red-600 transition-colors"
                        title="Partager cette réponse par Gmail"
                      >
                        <Mail className="w-3 h-3 text-red-500" />
                        <span>Partager</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs p-4 flex items-center space-x-2 text-xs text-slate-500">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-100" />
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce delay-200" />
              <span className="pl-1">Analyse des articles biomédicaux et formulation vérifiable...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts footer chips */}
      <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex items-center overflow-x-auto space-x-2 text-[11px]">
        <span className="text-slate-400 font-medium shrink-0">Questions suggérées :</span>
        {SUGGESTED_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question sur les articles (méthodes, endpoints, comparaison, sécurité)..."
            disabled={loading}
            className="flex-1 text-xs sm:text-sm border border-slate-300 rounded-xl py-3 px-3.5 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-100/80 transition-all shadow-2xs"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-medium transition-colors shadow-xs flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
