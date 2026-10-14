# BioScholar — Recherche & Synthèse Biomédicale

> **Développé par Roqia Benaboud**  
> *Spécialité : Intelligence Artificielle & Science des Données* (Université Larbi Ben M'hidi d'Oum El Bouaghi)  
> *Contact : benaboud.roqia@univ-oeb.dz*

**BioScholar** est un établi scientifique moderne et une plateforme de recherche de publications biomédicales en direct. L'application permet d'interroger les serveurs officiels de **NCBI PubMed** et **Europe PMC**, de synthétiser des articles fournis par l'utilisateur ou trouvés en ligne, de poser des questions à un assistant IA propulsé par **Gemini** avec des citations vérifiables (`[PMID]`, `[DOI]`), d'ajouter des notes personnelles d'analyse critique, d'exporter les résultats dans tous les formats bibliographiques standards (**BibTeX**, **RIS**, **Vancouver**, **APA**), et de partager les rapports de recherche via **Google Workspace Gmail**.

---

## Sommaire

1. [Fonctionnalités Principales](#fonctionnalités-principales)
2. [Architecture Technique](#architecture-technique)
3. [Bases de Données & API Scientifiques](#bases-de-données--api-scientifiques)
4. [Assistant IA & Synthèse avec Preuves](#assistant-ia--synthèse-avec-preuves)
5. [Formats Bibliographiques Supportés](#formats-bibliographiques-supportés)
6. [Intégration Google Workspace Gmail](#intégration-google-workspace-gmail)
7. [Installation et Lancement](#installation-et-lancement)
8. [Variables d'Environnement](#variables-denvironnement)
9. [Design & Expérience Utilisateur](#design--expérience-utilisateur)

---

## Fonctionnalités Principales

### 1. Recherche Biomédicale en Temps Réel
- Requêtes directes sur l'API officielle **NCBI Entrez E-utilities** (`esearch`, `esummary`, `efetch` XML) et **Europe PMC REST API**.
- Basculement automatique (*failover*) transparent vers Europe PMC si les quotas NCBI sont temporairement limités.
- Filtres de recherche :
  - **Texte intégral en libre accès** (*Free Full Text / Open Access*).
  - **Essais cliniques randomisés** (*Clinical Trials / RCT*).
  - Période de publication (1 an, 5 ans, 10 ans, toutes dates).
  - Tri par date de parution ou par pertinence biomédicale.
- Suggestions de recherche pré-configurées (*CRISPR-Cas9*, *Agonistes GLP-1*, *Vaccins à ARNm*, *CAR-T Cells*, *AlphaFold*).

### 2. Ingestion et Analyse d'Articles Fournis par l'Utilisateur
- **Par identifiant officiel** : Saisissez un `PMID` (ex: `38289412`), un `DOI` ou une URL PubMed pour extraire instantanément le résumé structuré et les métadonnées.
- **Par copier-coller brut** : Importez un texte intégral, une section de résultats ou un résumé personnalisé.
- **Par téléversement de fichier** : Importation de fichiers `.bib` (BibTeX), `.ris` (Zotero/EndNote), `.txt` ou `.json`.

### 3. Notes Personnelles Locales par Article
- Chaque carte d'article intègre un tiroir d'annotations personnelles.
- Sauvegardez vos observations méthodologiques, critiques de biais, hypothèses ou points cliniques.
- Stockage persistant dans le navigateur (`localStorage`).
- Prise en compte automatique de vos observations par l'assistant IA lors des synthèses.

### 4. Volet Latéral « Recherches Récentes »
- Historique automatique des requêtes effectuées avec leurs filtres et le nombre de résultats trouvés.
- Relance instantanée d'une recherche passée en **1 clic**.
- Épinglage des requêtes prioritaires en haut de liste.
- Recherche et filtrage dans l'historique, suppression unitaire ou globale.

### 5. Synthèse Scientifique Structurée
- Synthèse mono-article ou **revue comparative multi-articles** :
  - Contexte & Hypothèses de départ.
  - Méthodologie, design d'étude et cohortes ($n$).
  - Résultats majeurs avec données chiffrées et significativité statistique ($p$-value).
  - Portée clinique et translationnelle.
  - Limites méthodologiques et risques de biais.
  - Tableau synoptique comparatif (pour les synthèses multi-études).

### 6. Assistant IA Multi-Tours avec Citations Vérifiables
- Maintien complet de l'historique de conversation.
- Sélection du modèle Gemini :
  - **gemini-3.8-flash** : Modèle principal équilibré pour la synthèse scientifique.
  - **gemini-3.1-flash-lite** : Réponses instantanées et extraction rapide.
  - **gemini-4-argon** : Analyses critiques approfondies et méta-synthèses.
- Rôles spécialisés :
  - *Évaluateur Méthodologique & Preuves*.
  - *Spécialiste Essais Cliniques & Pharmacologie*.
  - *Biologiste Moléculaire & Mécanismes d'Action*.
- **Accordéon de citations vérifiables** sous chaque réponse assistant : chaque assertion est étayée par un lien direct vers la publication (`PMID` / `DOI`).

---

## Architecture Technique

L'application est construite selon une architecture full-stack robuste et typée :

```
/
├── index.html                   # Point d'entrée HTML avec polices Plus Jakarta Sans & JetBrains Mono
├── metadata.json                # Métadonnées de l'application AI Studio
├── package.json                 # Dépendances et scripts de build/démarrage
├── vite.config.ts               # Configuration Vite avec middleware API Express
├── server.ts                    # Serveur Express full-stack de production
├── server/
│   ├── api.ts                   # Routes API REST (/api/pubmed, /api/gemini, /api/europepmc)
│   ├── ncbi.ts                  # Connecteur NCBI PubMed E-utilities & Europe PMC
│   ├── gemini.ts                # Client officiel @google/genai avec telemetry User-Agent
│   └── types.ts                 # Interfaces TypeScript partagées
└── src/
    ├── main.tsx                 # Point de montage React
    ├── App.tsx                  # Composant racine orchestrant le banc de recherche
    ├── index.css                # Styles globaux Tailwind CSS et styles officiels Google Sign-In
    ├── types.ts                 # Typages TypeScript frontend
    ├── services/
    │   ├── api.ts               # Client HTTP vers les endpoints Express
    │   ├── auth.ts              # Firebase Authentication & Google OAuth (scopes Gmail)
    │   ├── gmail.ts             # API REST Gmail côté client (envoi & brouillons RFC 2822)
    │   └── citations.ts         # Formateurs BibTeX, RIS, APA, Vancouver, MLA, Chicago
    └── components/
        ├── Header.tsx           # Barre de navigation respectant le Top Bar Contract
        ├── SearchSection.tsx    # Barre de recherche avancée avec filtres et suggestions
        ├── RecentSearchesSidebar.tsx # Volet latéral des recherches récentes (localStorage)
        ├── ArticleCard.tsx      # Carte d'article avec métadonnées unboxed et champ de notes
        ├── ArticleImportModal.tsx # Fenêtre d'importation (PMID, DOI, texte, fichiers)
        ├── CorpusDrawer.tsx     # Tiroir coulissant du corpus d'articles sélectionnés
        ├── SummarizeModal.tsx   # Fenêtre de synthèse structurée et tableaux comparatifs
        ├── BibliographyModal.tsx # Exporteur bibliographique multi-formats avec téléchargement
        └── EmailModal.tsx       # Boîte d'envoi Gmail avec dialogue de confirmation obligatoire
```

---

## Formats Bibliographiques Supportés

L'exportateur bibliographique intégré permet de copier dans le presse-papier ou de télécharger des fichiers pour intégration immédiate dans les gestionnaires de références :

| Format | Extension | Utilisation Principale |
| :--- | :--- | :--- |
| **BibTeX** | `.bib` | LaTeX, Overleaf, Obsidian, revues informatiques et bio-informatiques |
| **RIS** | `.ris` | Zotero, EndNote, Mendeley, Papers, Citavi |
| **Vancouver** | `.txt` | Style standard des revues médicales et biomédicales (NLM) |
| **APA 7th** | `.txt` | Sciences comportementales, psychologie clinique, neurosciences |
| **MLA 9th** | `.txt` | Sciences humaines et bioéthique |
| **Chicago 17th** | `.txt` | Format auteur-date académique |
| **JSON** | `.json` | Export de données brutes programmatique |

---

## Intégration Google Workspace Gmail

L'application intègre l'API Gmail avec le protocole sécurisé Google Workspace :

- **Bouton officiel « Sign in with Google »** via Firebase Authentication.
- **Sécurité des jetons** : Le jeton d'accès OAuth est conservé en mémoire volatile (`cachedAccessToken`) et n'est **jamais** stocké dans le `localStorage` ou le `sessionStorage`.
- **Scopes autorisés** :
  - `https://www.googleapis.com/auth/gmail.send`
  - `https://www.googleapis.com/auth/gmail.compose`
- **Confirmation obligatoire** : Conformément aux exigences de sécurité pour les opérations Workspace, un dialogue de confirmation explicite avec case à cocher est requis avant tout envoi d'email depuis le compte personnel de l'utilisateur.
- Possibilité d'**enregistrer en brouillon** (*Draft*) ou d'**envoyer directement**.

---

## Installation et Lancement

### 1. Prérequis
- Node.js (version 20 ou supérieure recommandée).
- Une clé d'API Gemini (`GEMINI_API_KEY`).

### 2. Installation des dépendances
```bash
npm install
```

### 3. Variables d'environnement
Créez un fichier `.env` à la racine (ou configurez vos variables dans le panneau **Settings > Secrets** d'AI Studio) :

```env
GEMINI_API_KEY="votre_cle_gemini_api"
PORT=3000
```

### 4. Lancement en mode développement
```bash
npm run dev
```
L'application est accessible à l'adresse [http://localhost:3000](http://localhost:3000).

### 5. Build et lancement en production
```bash
npm run build
npm run start
```

---

## Design & Expérience Utilisateur

BioScholar respecte une esthétique de **laboratoire de recherche haut de gamme** :
- **Surface clinique** : Teintes claires reposantes (`#F8FAFC`), cartes blanches à bordures fines 1px (`#E2E8F0`), absence d'ombres superflues pour un confort de lecture optimal.
- **Discipline Zéro-Pilule (Zero-Pill)** : Les métadonnées (PMID, DOI, année, source) sont présentées en typographie unboxed épurée avec séparateurs points médians (`·`).
- **Typographie double** :
  - **Plus Jakarta Sans** : Lisibilité géométrique moderne pour l'interface et les titres.
  - **JetBrains Mono** : Monospace avec chiffres tabulaires (`tabular-nums`) pour les identifiants, dates et statistiques.

---

## Avertissement Scientifique

Les synthèses et réponses générées par les modèles d'intelligence artificielle doivent être évaluées avec discernement critique. Vérifiez systématiquement les résultats à l'aide des identifiants **PMID** et **DOI** fournis vers les articles originaux évalués par les pairs. BioScholar est un outil d'assistance à la recherche documentaire et ne constitue pas un avis médical.
