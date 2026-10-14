import React, { useState } from 'react';
import { X, Mail, Send, CheckCircle2, AlertCircle, FileEdit, ShieldCheck } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { BiomedicalArticle } from '../types';
import { sendGmailMessage, createGmailDraft } from '../services/gmail';
import { generateVancouver, generateBibTeX } from '../services/citations';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSignIn: () => void;
  corpusArticles: BiomedicalArticle[];
  customSummaryText?: string;
}

export const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  user,
  onSignIn,
  corpusArticles,
  customSummaryText,
}) => {
  if (!isOpen) return null;

  const defaultRecipient = user?.email || 'benaboud.roqia@univ-oeb.dz';
  const defaultSubject = corpusArticles.length > 0
    ? `[BioScholar] Revue & Synthèse Biomédicale (${corpusArticles.length} publications)`
    : '[BioScholar] Synthèse et Références de Recherche Biomédicale';

  // Construct initial email body
  const buildInitialBody = (): string => {
    let text = `Bonjour,\n\nVoici le rapport de synthèse biomédicale généré depuis BioScholar :\n\n`;

    if (customSummaryText) {
      text += `=== SYNTHÈSE & EXTRACTION SCIENTIFIQUE ===\n\n${customSummaryText}\n\n`;
    }

    if (corpusArticles.length > 0) {
      text += `=== RÉFÉRENCES BIBLIOGRAPHIQUES (Format Vancouver) ===\n\n`;
      corpusArticles.forEach((art, idx) => {
        text += `${idx + 1}. ${generateVancouver(art)}\n\n`;
      });

      text += `\n=== EXPORT BIBTEX ===\n\n${generateBibTeX(corpusArticles)}\n\n`;
    }

    text += `--\nGénéré avec BioScholar • Moteur de Recherche & Synthèse Biomédicale`;
    return text;
  };

  const [to, setTo] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [bodyText, setBodyText] = useState(buildInitialBody());
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedByUser, setConfirmedByUser] = useState(false);

  const handleSendEmail = async () => {
    if (!to.trim() || !subject.trim() || !bodyText.trim()) return;

    if (!confirmedByUser) {
      setErrorMessage('Veuillez cocher la confirmation avant d\'envoyer cet email.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await sendGmailMessage({
        to: to.trim(),
        subject: subject.trim(),
        bodyText: bodyText.trim(),
      });
      setSuccessMessage(`Email envoyé avec succès à ${to} via votre compte Gmail !`);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de l\'envoi de l\'email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateDraft = async () => {
    if (!to.trim() || !subject.trim() || !bodyText.trim()) return;

    setIsDrafting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await createGmailDraft({
        to: to.trim(),
        subject: subject.trim(),
        bodyText: bodyText.trim(),
      });
      setSuccessMessage('Brouillon créé avec succès dans votre boîte Gmail !');
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de la création du brouillon.');
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-red-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Partager la Recherche par Gmail
              </h2>
              <p className="text-xs text-slate-500">
                Composez et envoyez la synthèse et les références bibliographiques avec votre compte Gmail
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {!user ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <Mail className="w-8 h-8 text-red-500 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-900">
                Authentification Google requise
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Connectez-vous avec votre compte Google universitaire ou personnel pour envoyer cet email directement depuis votre messagerie Gmail.
              </p>
              <button
                onClick={onSignIn}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg font-medium shadow-2xs transition-colors"
              >
                <span>Connexion avec Google</span>
              </button>
            </div>
          ) : (
            <>
              {successMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Destinataire (Email) *
                  </label>
                  <input
                    type="email"
                    required
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="chercheur@universite.fr"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Expéditeur (Compte connecté)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={user.email || ''}
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Objet du message *</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Contenu du message (Synthèse, Citations & Bibliographie)
                </label>
                <textarea
                  rows={8}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-300 rounded-lg p-3 focus:border-red-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Mandatory Confirmation Step for Workspace Integration */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <label className="flex items-center space-x-2 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmedByUser}
                      onChange={(e) => setConfirmedByUser(e.target.checked)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span>
                      Je confirme l'envoi de cet email de recherche via mon compte Gmail personnel
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Conformément aux règles de sécurité Google Workspace, aucune action d'envoi n'est déclenchée sans votre validation explicite.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {user && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
            >
              Annuler
            </button>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCreateDraft}
                disabled={isDrafting || isSending}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-medium transition-colors shadow-2xs"
              >
                <FileEdit className="w-3.5 h-3.5 text-slate-500" />
                <span>{isDrafting ? 'Enregistrement...' : 'Enregistrer en brouillon'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending || isDrafting || !confirmedByUser}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg font-semibold transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Envoi en cours...' : 'Envoyer l\'email'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
