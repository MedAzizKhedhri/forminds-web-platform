# Documentation Frontend -- Sprint 1

## ForMinds -- Plateforme Web de Mise en Relation Etudiants-Recruteurs

**Version** : 1.0
**Date** : 08 mars 2026
**Sprint** : Sprint 1 -- BF-001 (Authentification et Gestion des Roles) + BF-002 partiel (Profils de base)

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Structure du projet](#3-structure-du-projet)
4. [Architecture applicative](#4-architecture-applicative)
5. [Gestion de l'etat (State Management)](#5-gestion-de-letat-state-management)
6. [Client API (Axios)](#6-client-api-axios)
7. [Routage et navigation](#7-routage-et-navigation)
8. [Composants](#8-composants)
9. [Hooks personnalises](#9-hooks-personnalises)
10. [Validation des formulaires (Zod)](#10-validation-des-formulaires-zod)
11. [Types TypeScript](#11-types-typescript)
12. [Internationalisation (i18n)](#12-internationalisation-i18n)
13. [Bibliotheque de composants UI](#13-bibliotheque-de-composants-ui)
14. [Variables d'environnement](#14-variables-denvironnement)
15. [Docker](#15-docker)
16. [Couverture fonctionnelle du Sprint 1](#16-couverture-fonctionnelle-du-sprint-1)

---

## 1. Vue d'ensemble

Le frontend de ForMinds est une application **Next.js 16** utilisant **React 19** et **TypeScript**, construite autour de l'App Router. L'application fournit une interface utilisateur pour la mise en relation entre etudiants et recruteurs, avec un systeme d'authentification complet et une gestion de profils differenciee par role.

Le Sprint 1 couvre deux blocs fonctionnels :

| Bloc fonctionnel | Perimetre Sprint 1 |
|---|---|
| **BF-001** -- Authentification et Gestion des Roles | Complet : inscription, connexion, verification email, mot de passe oublie, reinitialisation, 2FA, deconnexion |
| **BF-002** -- Profils de base | Partiel : consultation et edition de profil (etudiant/recruteur), profil public, gestion des competences, education, experience, projets |

---

## 2. Stack technique

| Categorie | Technologie | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 |
| Bibliotheque UI | React | 19.2.3 |
| Langage | TypeScript | -- |
| Styling | Tailwind CSS | 4 |
| Composants UI | Radix UI (shadcn/ui) | -- |
| Icones | Lucide React | -- |
| Formulaires | React Hook Form + @hookform/resolvers | -- |
| Client HTTP | Axios | -- |
| Validation | Zod (schemas partages frontend/backend) | -- |
| Internationalisation | next-intl | 4.8.3 |
| Utilitaires | class-variance-authority, clsx, tailwind-merge | -- |

### Justification des choix techniques

- **Next.js 16 (App Router)** : Framework React de reference pour le rendu hybride (SSR/SSG/CSR), le routage base fichiers et les layouts imbriques.
- **React Hook Form + Zod** : Gestion performante des formulaires avec validation declarative. Les schemas Zod sont partages avec le backend pour garantir la coherence des regles de validation.
- **Radix UI (shadcn/ui)** : Composants accessibles et non-styles par defaut, personalises via Tailwind CSS avec le pattern shadcn/ui.
- **Axios** : Client HTTP avec systeme d'intercepteurs pour la gestion automatique des tokens et le rafraichissement transparent des sessions.
- **next-intl** : Support natif de l'internationalisation pour Next.js avec gestion FR/EN.

---

## 3. Structure du projet

```
frontend/
├── public/
│   ├── IconeForMinds.png           # Favicon / icone de la plateforme
│   └── LogoForMinds.png            # Logo de la plateforme (utilise dans la Navbar)
│
└── src/
    ├── app/                            # Pages et layouts (App Router)
│   ├── layout.tsx                  # Layout racine : police Inter, AuthProvider, Toaster, lang="fr", icons metadata (IconeForMinds.png)
│   ├── page.tsx                    # Page d'accueil (hero section, redirection si authentifie)
│   ├── globals.css                 # Styles globaux Tailwind CSS
│   │
│   ├── (auth)/                     # Groupe de routes authentification (layout centre)
│   │   ├── layout.tsx              # Layout auth : carte centree, branding ForMinds
│   │   ├── login/page.tsx          # Page de connexion → LoginForm
│   │   ├── register/page.tsx       # Page d'inscription → RegisterForm
│   │   ├── forgot-password/page.tsx    # Mot de passe oublie
│   │   ├── reset-password/page.tsx     # Reinitialisation (Suspense → ResetPasswordForm)
│   │   ├── verify-email/page.tsx       # Verification email (Suspense → VerifyEmailCard)
│   │   └── verify-2fa/page.tsx         # Verification 2FA (Suspense → TwoFactorForm)
│   │
│   ├── (dashboard)/                # Groupe de routes tableau de bord (protege)
│   │   ├── layout.tsx              # Layout dashboard : Navbar + Sidebar + garde d'auth
│   │   ├── dashboard/page.tsx      # Accueil : message de bienvenue, completion profil, actions
│   │   ├── profile/page.tsx        # Consultation du profil (conditionnel etudiant/recruteur)
│   │   ├── profile/edit/page.tsx   # Edition du profil → formulaire selon le role
│   │   ├── settings/page.tsx       # Parametres : mot de passe, 2FA, suppression de compte
│   │   └── projects/page.tsx       # Gestion des projets (etudiants uniquement)
│   │
│   └── p/
│       └── [username]/page.tsx     # Profil public (route dynamique, sans authentification)
│
├── providers/
│   └── AuthProvider.tsx            # Context React + useReducer pour l'etat d'authentification
│
├── lib/
│   ├── auth.ts                     # Gestion du token d'acces en memoire
│   ├── api.ts                      # Instance Axios avec intercepteurs
│   ├── validations.ts              # Schemas Zod pour les formulaires
│   └── utils.ts                    # Utilitaire cn() (clsx + tailwind-merge)
│
├── hooks/
│   ├── useAuth.ts                  # Hook consommateur du contexte d'authentification
│   ├── useProfile.ts               # Hook de chargement des donnees profil
│   └── use-toast.ts                # Hook de notifications toast
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx              # Barre de navigation superieure
│   │   ├── Sidebar.tsx             # Barre laterale gauche
│   │   └── LanguageSwitcher.tsx    # Selecteur de langue FR/EN
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx           # Formulaire de connexion
│   │   ├── RegisterForm.tsx        # Formulaire d'inscription
│   │   ├── ForgotPasswordForm.tsx  # Formulaire mot de passe oublie
│   │   ├── ResetPasswordForm.tsx   # Formulaire de reinitialisation
│   │   ├── VerifyEmailCard.tsx     # Carte de verification email
│   │   └── TwoFactorForm.tsx       # Formulaire de verification 2FA
│   │
│   ├── profile/
│   │   ├── StudentProfileForm.tsx  # Formulaire profil etudiant (5 onglets)
│   │   ├── RecruiterProfileForm.tsx    # Formulaire profil recruteur
│   │   ├── EducationSection.tsx    # CRUD formation
│   │   ├── ExperienceSection.tsx   # CRUD experience professionnelle
│   │   ├── ProjectCard.tsx         # CRUD projets
│   │   ├── SkillTags.tsx           # Saisie de competences par tags
│   │   └── PublicProfileView.tsx   # Vue du profil public
│   │
│   └── ui/                         # Primitives UI (Radix UI + shadcn/ui)
│       ├── alert-dialog.tsx        # Dialogue de confirmation (suppression de compte)
│       ├── avatar.tsx              # Avatar avec image + fallback (initiales)
│       ├── badge.tsx               # Badges avec variantes
│       ├── button.tsx              # Boutons avec systeme de variantes CVA
│       ├── card.tsx                # Composants Card
│       ├── dialog.tsx              # Boites de dialogue modales
│       ├── dropdown-menu.tsx       # Menus deroulants
│       ├── input.tsx               # Champ de saisie
│       ├── label.tsx               # Labels (Radix Label)
│       ├── separator.tsx           # Separateurs visuels
│       ├── tabs.tsx                # Interface a onglets
│       ├── toaster.tsx             # Conteneur de notifications
│       ├── toast.tsx               # Composant de notification
│       └── use-toast.ts            # Hook du systeme de toast
│
├── types/
│   └── index.ts                    # Definitions de types : User, Profile, ApiResponse
│
└── i18n/
    ├── fr.json                     # Traductions francaises
    └── en.json                     # Traductions anglaises
```

---

## 4. Architecture applicative

### Schema general

```
┌─────────────────────────────────────────────────────────────────┐
│                        Layout Racine                            │
│  (Inter font, AuthProvider, Toaster, lang="fr")                 │
│                                                                 │
│  ┌───────────────────────┐   ┌────────────────────────────────┐ │
│  │   Groupe (auth)       │   │   Groupe (dashboard)           │ │
│  │   Layout centre       │   │   Layout protege               │ │
│  │                       │   │   ┌──────────────────────────┐ │ │
│  │  /login               │   │   │ Navbar (haut)            │ │ │
│  │  /register            │   │   ├──────┬───────────────────┤ │ │
│  │  /forgot-password     │   │   │Side- │ Contenu principal │ │ │
│  │  /reset-password      │   │   │bar   │                   │ │ │
│  │  /verify-email        │   │   │(gauche)│  /dashboard     │ │ │
│  │  /verify-2fa          │   │   │      │  /profile         │ │ │
│  │                       │   │   │      │  /profile/edit    │ │ │
│  └───────────────────────┘   │   │      │  /settings        │ │ │
│                              │   │      │  /projects        │ │ │
│  ┌───────────────────────┐   │   └──────┴───────────────────┘ │ │
│  │  Route publique       │   └────────────────────────────────┘ │
│  │  /p/[username]        │                                      │
│  └───────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Flux d'authentification

```
Utilisateur          Frontend                    Backend API
    │                    │                            │
    │  Saisie email/mdp  │                            │
    ├───────────────────>│                            │
    │                    │  POST /auth/login           │
    │                    ├───────────────────────────>│
    │                    │                            │
    │                    │  { accessToken, user }     │
    │                    │  + Set-Cookie: refreshToken │
    │                    │<───────────────────────────┤
    │                    │                            │
    │                    │  Stocke accessToken        │
    │                    │  en memoire (variable JS)  │
    │                    │                            │
    │                    │  Dispatch SET_USER         │
    │                    │  Redirection /dashboard    │
    │<───────────────────┤                            │
    │                    │                            │
    │  --- Rafraichissement page ---                  │
    │                    │                            │
    │                    │  POST /auth/refresh         │
    │                    │  (cookie refreshToken)     │
    │                    ├───────────────────────────>│
    │                    │                            │
    │                    │  { accessToken }           │
    │                    │<───────────────────────────┤
    │                    │                            │
    │                    │  GET /auth/me               │
    │                    ├───────────────────────────>│
    │                    │                            │
    │                    │  { user }                  │
    │                    │<───────────────────────────┤
    │                    │                            │
    │                    │  Restauration de la session │
    │<───────────────────┤                            │
```

### Flux de rafraichissement automatique du token (intercepteur 401)

```
Requete API ────> Intercepteur requete ────> Serveur API
                  (ajoute Bearer token)         │
                                                │
                                          Reponse 401
                                                │
                                                v
                  Intercepteur reponse <─────────
                        │
                        │  POST /auth/refresh
                        │  (cookie refreshToken)
                        ├──────────────────────> Serveur API
                        │                           │
                        │  Nouveau accessToken      │
                        │<──────────────────────────┤
                        │
                        │  Stocke nouveau token
                        │  Rejoue requete originale
                        ├──────────────────────> Serveur API
                        │                           │
                        │  Reponse OK               │
                        │<──────────────────────────┤
                        │
                        v
                  Reponse retournee au composant
```

---

## 5. Gestion de l'etat (State Management)

### AuthProvider -- Contexte React avec useReducer

**Fichier** : `frontend/src/providers/AuthProvider.tsx`

Le state global d'authentification est gere par un **React Context** combine avec **useReducer**, fournissant un etat predictible et des transitions claires.

#### Etat

```typescript
interface AuthState {
  user: User | null       // Utilisateur connecte (null si deconnecte)
  isLoading: boolean      // Chargement en cours (initialisation, requete)
  isAuthenticated: boolean // Indique si l'utilisateur est authentifie
}
```

#### Actions du reducer

| Action | Effet |
|---|---|
| `SET_USER` | Definit `user`, met `isAuthenticated` a `true`, met `isLoading` a `false` |
| `LOGOUT` | Met `user` a `null`, `isAuthenticated` a `false` |
| `SET_LOADING` | Met a jour `isLoading` |

#### Methodes exposees par le contexte

| Methode | Signature | Description |
|---|---|---|
| `login` | `(email: string, password: string) => Promise` | Envoie `POST /auth/login`. Si la reponse indique `requires2FA`, retourne sans definir l'utilisateur (le composant redirige vers `/verify-2fa`). Sinon, stocke le `accessToken` en memoire et dispatche `SET_USER`. |
| `register` | `(data) => Promise` | Envoie `POST /auth/register`. Retourne la reponse (le composant appelant gere la redirection). |
| `logout` | `() => Promise` | Envoie `POST /auth/logout`. Efface le token en memoire et dispatche `LOGOUT`. |
| `refreshUser` | `() => Promise` | Envoie `GET /auth/me`. Met a jour l'utilisateur dans le contexte via `SET_USER`. |

#### Restauration de session au montage (initAuth)

La fonction `initAuth` est executee au montage du `AuthProvider` pour restaurer la session de l'utilisateur apres un rafraichissement de page :

1. Envoie `POST /auth/refresh` (via `axios` brut, pas l'instance `api`, pour eviter une boucle avec l'intercepteur 401)
2. En cas de succes : stocke le `accessToken`, puis envoie `GET /auth/me` pour recuperer les donnees utilisateur
3. En cas d'echec : efface le token, met `isLoading` a `false` (l'utilisateur n'est pas authentifie)

### Gestion du token d'acces

**Fichier** : `frontend/src/lib/auth.ts`

Le token d'acces est stocke dans une **variable de module** (closure JavaScript), et non dans `localStorage` ou `sessionStorage`. Ce choix est delibere pour des raisons de securite :

- Le token n'est pas accessible via `document.cookie` ou le stockage navigateur
- Le token est perdu lors d'un rafraichissement de page (par conception)
- La session est restauree automatiquement via le cookie `refreshToken` (HttpOnly, Secure)

```typescript
let accessToken: string | null = null

function getAccessToken(): string | null    // Retourne le token courant
function setAccessToken(token: string): void // Definit le token
function clearAccessToken(): void            // Efface le token
function isAuthenticated(): boolean          // Verifie si un token existe
```

---

## 6. Client API (Axios)

**Fichier** : `frontend/src/lib/api.ts`

### Configuration de l'instance

| Parametre | Valeur | Description |
|---|---|---|
| `baseURL` | `NEXT_PUBLIC_API_URL` (defaut : `/api`) | URL de base de l'API backend |
| `withCredentials` | `true` | Envoie les cookies cross-origin (necessaire pour le `refreshToken`) |
| `Content-Type` | `application/json` | Format des requetes |
| `Cache-Control` | `no-cache` | Desactive le cache navigateur |

### Intercepteur de requete

Chaque requete sortante passe par un intercepteur qui attache automatiquement le header `Authorization: Bearer <accessToken>` si un token est disponible en memoire.

### Intercepteur de reponse (gestion des erreurs)

L'intercepteur de reponse gere automatiquement le rafraichissement du token en cas d'expiration :

| Etape | Description |
|---|---|
| 1. Detection du 401 | Verifie que l'erreur est un 401, que l'endpoint n'est pas un endpoint d'authentification (`/auth/*`), et que la requete n'a pas deja ete retentee |
| 2. Rafraichissement | Envoie `POST /auth/refresh` (via `axios` brut, avec `withCredentials: true`) |
| 3a. Succes | Stocke le nouveau `accessToken`, rejoue la requete originale avec le nouveau token |
| 3b. Echec | Efface le token, redirige vers `/login` (sauf si l'utilisateur est sur une page publique) |

**Pages publiques exclues de la redirection** : `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/verify-2fa`, `/`

**Endpoints d'authentification exclus du retry** : tous les endpoints commencant par `/auth/` (pour eviter les boucles infinies)

---

## 7. Routage et navigation

### Vue d'ensemble des routes

L'application utilise le systeme de **Route Groups** de Next.js App Router pour organiser les pages en groupes logiques sans affecter l'URL.

#### Groupe de routes `(auth)` -- Authentification

**Layout** : Carte centree avec branding ForMinds. Aucune authentification requise.

| Route | Composant | Description | Suspense |
|---|---|---|---|
| `/login` | `LoginForm` | Connexion : email + mot de passe, liens vers inscription et mot de passe oublie | Non |
| `/register` | `RegisterForm` | Inscription : nom, prenom, username, email, mot de passe, confirmation, role | Non |
| `/forgot-password` | `ForgotPasswordForm` | Saisie de l'email pour reinitialisation du mot de passe | Non |
| `/reset-password` | `ResetPasswordForm` | Nouveau mot de passe + confirmation. Lit `token` et `email` depuis `searchParams` | Oui |
| `/verify-email` | `VerifyEmailCard` | Verification automatique de l'email. Lit `token` et `email` depuis `searchParams` | Oui |
| `/verify-2fa` | `TwoFactorForm` | Saisie du code 2FA a 6 chiffres | Oui |

> **Note** : Les pages qui utilisent `useSearchParams()` sont encapsulees dans un composant `<Suspense>` (exigence Next.js App Router pour les composants client qui lisent les parametres de recherche).

#### Groupe de routes `(dashboard)` -- Tableau de bord

**Layout** : Route protegee avec garde d'authentification. Redirige vers `/login` si l'utilisateur n'est pas authentifie. Affiche la Navbar (en haut) et la Sidebar (a gauche, masquee sur mobile). Zone de contenu principal avec padding responsive.

| Route | Description | Restriction de role |
|---|---|---|
| `/dashboard` | Accueil : message de bienvenue, barre de completion du profil (etudiants), cartes d'actions rapides (Editer profil, Parametres, etc.) | Aucune |
| `/profile` | Consultation du profil. En-tete avec avatar, nom, username, titre/entreprise. Sections conditionnelles selon le role. | Aucune |
| `/profile/edit` | Edition du profil. Affiche `StudentProfileForm` ou `RecruiterProfileForm` selon `user.role`. | Aucune |
| `/settings` | Parametres du compte : formulaire de changement de mot de passe, activation/desactivation de la 2FA, suppression de compte (Danger Zone). | Aucune |
| `/projects` | Gestion des projets (CRUD). | Etudiants uniquement |

**Affichage conditionnel sur `/profile`** :

| Role | Sections affichees |
|---|---|
| **Etudiant** | Bio, competences (badges), formation, experience professionnelle, grille de projets |
| **Recruteur** | Description de l'entreprise, informations de contact (email, telephone, site web) |

#### Route publique

| Route | Description |
|---|---|
| `/p/[username]` | Profil public. Route dynamique, aucune authentification requise. Affiche `PublicProfileView` via `GET /profiles/public/:username`. |

### Navigation dans la Sidebar

| Element | Route | Visible par |
|---|---|---|
| Tableau de bord | `/dashboard` | Tous les roles |
| Mon Profil | `/profile` | Tous les roles |
| Parametres | `/settings` | Tous les roles |
| Mes Projets | `/projects` | Etudiants uniquement |
| Gestion des utilisateurs | -- | Administrateurs uniquement |

L'element actif est mis en surbrillance automatiquement en fonction du `pathname` courant.

---

## 8. Composants

### 8.1 Composants de mise en page (Layout)

#### Navbar (`components/layout/Navbar.tsx`)

Barre de navigation superieure fixe (sticky) contenant :

| Element | Description |
|---|---|
| Logo ForMinds | Image `LogoForMinds.png` affichee via `next/image` (remplace l'ancien texte `<span>ForMinds</span>`) |
| Menu hamburger (mobile) | Bouton de bascule pour afficher/masquer la Sidebar en mode mobile |
| Selecteur de langue | Icone Globe pour basculer entre FR et EN |
| Avatar utilisateur | Menu deroulant avec : Profil, Parametres, Deconnexion |

#### Sidebar (`components/layout/Sidebar.tsx`)

Barre laterale gauche avec deux comportements :

| Mode | Comportement |
|---|---|
| **Desktop** (lg+) | Fixe sur le cote gauche, toujours visible |
| **Mobile** (< lg) | Overlay avec fond assombri, bouton X pour fermer |

Contenu : Elements de navigation conditionnels selon le role (voir section Navigation dans la Sidebar).

#### LanguageSwitcher (`components/layout/LanguageSwitcher.tsx`)

| Fonctionnalite | Description |
|---|---|
| Bascule FR/EN | Alternance entre francais et anglais |
| Persistance | Sauvegarde le choix de langue dans `localStorage` |
| Hook `useLocale()` | Fournit l'objet de traduction `t` |
| Sources de traduction | `i18n/fr.json` et `i18n/en.json` |

---

### 8.2 Composants d'authentification

#### LoginForm (`components/auth/LoginForm.tsx`)

Formulaire de connexion utilisant `react-hook-form` avec `zodResolver(loginSchema)`.

| Champ | Type | Validation |
|---|---|---|
| Email | `input[type=email]` | Email valide (Zod) |
| Mot de passe | `input[type=password]` | Minimum 1 caractere |

**Flux** :
1. Appelle `useAuth().login(email, password)`
2. Si la reponse contient `requires2FA` : redirige vers `/verify-2fa`
3. Sinon : redirige vers `/dashboard`

**Liens** : Inscription (`/register`), Mot de passe oublie (`/forgot-password`)

#### RegisterForm (`components/auth/RegisterForm.tsx`)

Formulaire d'inscription complet avec selection du role.

| Champ | Type | Validation |
|---|---|---|
| Prenom | `input[type=text]` | 2 a 50 caracteres |
| Nom | `input[type=text]` | 2 a 50 caracteres |
| Nom d'utilisateur | `input[type=text]` | 3 a 30 caracteres, pattern `/^[a-z0-9_-]+$/` |
| Email | `input[type=email]` | Email valide |
| Mot de passe | `input[type=password]` | 8+ caracteres, majuscule, minuscule, chiffre, caractere special |
| Confirmation mot de passe | `input[type=password]` | Doit correspondre au mot de passe (refine Zod) |
| Role | `select` | `student` ou `recruiter` |

**Flux** :
1. Retire `confirmPassword` avant l'envoi
2. Appelle `useAuth().register(data)`
3. Affiche un toast de succes
4. Redirige vers `/login`

#### ForgotPasswordForm (`components/auth/ForgotPasswordForm.tsx`)

Formulaire de demande de reinitialisation du mot de passe.

| Champ | Type | Validation |
|---|---|---|
| Email | `input[type=email]` | Email valide |

**Flux** : Soumet a `POST /auth/forgot-password`. Affiche un message de confirmation.

#### ResetPasswordForm (`components/auth/ResetPasswordForm.tsx`)

Formulaire de reinitialisation du mot de passe. Lit `token` et `email` depuis `useSearchParams()`.

| Champ | Type | Validation |
|---|---|---|
| Nouveau mot de passe | `input[type=password]` | 8+ caracteres, majuscule, minuscule, chiffre, caractere special |
| Confirmation | `input[type=password]` | Doit correspondre (refine Zod) |

**Flux** : Soumet a `POST /auth/reset-password` avec `{ token, email, newPassword, confirmNewPassword }`.

#### VerifyEmailCard (`components/auth/VerifyEmailCard.tsx`)

Carte de verification de l'email. Lit `token` et `email` depuis `useSearchParams()`.

**Flux** :
1. Soumission automatique de `POST /auth/verify-email` au montage du composant
2. Affiche l'etat de succes ou d'erreur

#### TwoFactorForm (`components/auth/TwoFactorForm.tsx`)

Formulaire de verification a deux facteurs.

| Champ | Type | Validation |
|---|---|---|
| Code 2FA | `input[type=text]` | Exactement 6 chiffres |

**Flux** :
1. Recupere l'email de l'etape de connexion precedente (state ou searchParams)
2. Soumet a `POST /auth/verify-2fa`
3. En cas de succes : stocke le token et redirige vers `/dashboard`

---

### 8.3 Composants de profil

#### StudentProfileForm (`components/profile/StudentProfileForm.tsx`)

Formulaire d'edition du profil etudiant organise en **5 onglets** (Radix Tabs) :

| Onglet | Contenu | Champs |
|---|---|---|
| **1. General** | Informations generales | `headline` (max 120), `bio` (max 2000), `location`, `phone`, `website`, `linkedinUrl`, `githubUrl`, `isPublic` (toggle) |
| **2. Competences** | Gestion des competences | Composant `SkillTags` : saisie par touche Entree, badges avec suppression, maximum 20 |
| **3. Formation** | Parcours educatif | Composant `EducationSection` : liste + dialogue ajout/edition/suppression |
| **4. Experience** | Experience professionnelle | Composant `ExperienceSection` : liste + dialogue ajout/edition/suppression |
| **5. Projets** | Portfolio de projets | Composant `ProjectCard` : grille + dialogue ajout/edition/suppression |

**Fonctionnement** :
- Utilise le hook `useProfile()` pour charger les donnees existantes
- Au montage, reinitialise le formulaire avec les donnees du profil via `useEffect`
- A la soumission : `PUT /profiles/me`, puis `await refetch()` pour mettre a jour les donnees

#### RecruiterProfileForm (`components/profile/RecruiterProfileForm.tsx`)

Formulaire d'edition du profil recruteur (formulaire unique, sans onglets).

| Champ | Type | Validation |
|---|---|---|
| Nom de l'entreprise | `input[type=text]` | Requis |
| Secteur d'activite | `input[type=text]` | Requis |
| Description | `textarea` | Maximum 2000 caracteres |
| Site web | `input[type=url]` | URL valide ou vide |
| Email de contact | `input[type=email]` | Email valide ou vide |
| Telephone de contact | `input[type=text]` | -- |
| Localisation | `input[type=text]` | -- |

**Fonctionnement** :
- Utilise le hook `useProfile()` pour charger les donnees existantes
- A la soumission : `PUT /profiles/me`, puis `await refetch()`

#### EducationSection (`components/profile/EducationSection.tsx`)

Gestion CRUD des entrees de formation via dialogues modaux.

| Operation | Endpoint API |
|---|---|
| Ajouter | `POST /profiles/me/education` |
| Modifier | `PUT /profiles/me/education/:id` |
| Supprimer | `DELETE /profiles/me/education/:id` |

| Champ | Type | Obligatoire |
|---|---|---|
| Etablissement | `input[type=text]` | Oui |
| Diplome | `input[type=text]` | Oui |
| Domaine | `input[type=text]` | Oui |
| Date de debut | `input[type=date]` | Oui |
| Date de fin | `input[type=date]` | Non (si "en cours") |
| En cours | `toggle` | Non |

#### ExperienceSection (`components/profile/ExperienceSection.tsx`)

Gestion CRUD des entrees d'experience professionnelle via dialogues modaux.

| Operation | Endpoint API |
|---|---|
| Ajouter | `POST /profiles/me/experiences` |
| Modifier | `PUT /profiles/me/experiences/:id` |
| Supprimer | `DELETE /profiles/me/experiences/:id` |

| Champ | Type | Obligatoire |
|---|---|---|
| Entreprise | `input[type=text]` | Oui |
| Poste | `input[type=text]` | Oui |
| Description | `textarea` | Non |
| Date de debut | `input[type=date]` | Oui |
| Date de fin | `input[type=date]` | Non (si "en cours") |
| En cours | `toggle` | Non |

#### ProjectCard (`components/profile/ProjectCard.tsx`)

Gestion CRUD des projets avec affichage en grille et dialogue de confirmation de suppression.

| Operation | Endpoint API |
|---|---|
| Ajouter | `POST /profiles/me/projects` |
| Modifier | `PUT /profiles/me/projects/:id` |
| Supprimer | `DELETE /profiles/me/projects/:id` |

| Champ | Type | Obligatoire |
|---|---|---|
| Titre | `input[type=text]` | Oui |
| Description | `textarea` | Oui |
| Technologies | Tag input (`string[]`) | Non |
| Lien | `input[type=url]` | Non (URL valide ou vide) |

#### SkillTags (`components/profile/SkillTags.tsx`)

Composant de saisie de competences par tags.

| Fonctionnalite | Description |
|---|---|
| Ajout | Touche Entree pour ajouter un tag |
| Suppression par clic | Bouton X sur chaque badge |
| Suppression par clavier | Touche Retour arriere pour supprimer le dernier tag |
| Limite | Maximum 20 competences |
| Affichage | Badges cliquables |

#### PublicProfileView (`components/profile/PublicProfileView.tsx`)

Affichage en lecture seule du profil public d'un utilisateur.

**Source de donnees** : `GET /profiles/public/:username`
**Authentification** : Non requise
**Route** : `/p/[username]`

---

### 8.4 Page Settings (`app/(dashboard)/settings/page.tsx`)

La page Settings regroupe les parametres du compte utilisateur : changement de mot de passe, activation/desactivation de la 2FA, et suppression du compte.

#### Suppression de compte (Delete Account)

La page Settings inclut une section "Danger Zone" permettant la suppression definitive du compte :

| Element | Description |
|---------|-------------|
| **Carte danger** | Carte avec bordure rouge, icone `Trash2`, titre rouge "Delete Account", avertissement explicite |
| **Bouton** | `Button variant="destructive"` ouvre une `AlertDialog` de confirmation |
| **AlertDialog** | Titre "Are you absolutely sure?", description des consequences, champ de saisie du mot de passe |
| **Confirmation** | L'utilisateur doit saisir son mot de passe pour confirmer la suppression |
| **Endpoint** | `DELETE /api/profiles/me/account` avec `{ password }` dans le body |
| **Post-suppression** | Appel de `logout()` puis redirection vers `/login` via `router.push()` |
| **Gestion d'erreur** | Mot de passe incorrect affiche inline sous le champ, le dialog reste ouvert pour retry |

**Composants utilises** : `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel` (shadcn/ui), `Button variant="destructive"`, `Input type="password"`, `Trash2` (lucide-react)

---

## 9. Hooks personnalises

### useAuth

**Fichier** : `frontend/src/hooks/useAuth.ts`

Hook consommateur du contexte d'authentification (`AuthContext`). Lance une erreur si utilise en dehors du `AuthProvider`.

| Propriete/Methode | Type | Description |
|---|---|---|
| `user` | `User \| null` | Utilisateur connecte |
| `isLoading` | `boolean` | Chargement en cours |
| `isAuthenticated` | `boolean` | Utilisateur authentifie |
| `login` | `(email, password) => Promise` | Connexion |
| `register` | `(data) => Promise` | Inscription |
| `logout` | `() => Promise` | Deconnexion |
| `refreshUser` | `() => Promise` | Rafraichir les donnees utilisateur |

### useProfile

**Fichier** : `frontend/src/hooks/useProfile.ts`

Hook de chargement des donnees du profil de l'utilisateur authentifie.

| Propriete/Methode | Type | Description |
|---|---|---|
| `profile` | `StudentProfile \| RecruiterProfile \| null` | Donnees du profil |
| `isLoading` | `boolean` | Chargement en cours |
| `error` | `Error \| null` | Erreur eventuelle |
| `refetch` | `() => Promise` | Recharger les donnees |

**Fonctionnement** :
- Appelle `GET /profiles/me` via l'instance `api`
- Extrait le profil de la reponse : `res.data.profile` (le backend encapsule dans `{ data: { profile } }`)
- Dependances : `[isAuthenticated, user]` (relance la requete quand l'etat d'authentification change)

### use-toast

**Fichier** : `frontend/src/hooks/use-toast.ts`

Hook du systeme de notifications toast.

**Utilisation** :
```typescript
const { toast } = useToast()
toast({ title: "Succes", description: "Profil mis a jour" })
toast({ title: "Erreur", description: "...", variant: "destructive" })
```

---

## 10. Validation des formulaires (Zod)

**Fichier** : `frontend/src/lib/validations.ts`

Les schemas Zod sont partages entre le frontend et le backend pour garantir la coherence des regles de validation. Chaque schema est utilise avec `react-hook-form` via `zodResolver`.

### Schemas d'authentification

#### loginSchema

| Champ | Regle |
|---|---|
| `email` | Email valide |
| `password` | Minimum 1 caractere |

#### registerSchema

| Champ | Regle |
|---|---|
| `email` | Email valide |
| `password` | 8+ caracteres, au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 caractere special |
| `confirmPassword` | Doit correspondre a `password` (refine Zod) |
| `firstName` | 2 a 50 caracteres |
| `lastName` | 2 a 50 caracteres |
| `username` | 3 a 30 caracteres, pattern `/^[a-z0-9_-]+$/` |
| `role` | `"student"` ou `"recruiter"` |

#### forgotPasswordSchema

| Champ | Regle |
|---|---|
| `email` | Email valide |

#### resetPasswordSchema

| Champ | Regle |
|---|---|
| `token` | Requis |
| `email` | Email valide |
| `newPassword` | Memes regles que `registerSchema.password` |
| `confirmNewPassword` | Doit correspondre a `newPassword` (refine Zod) |

#### twoFactorSchema

| Champ | Regle |
|---|---|
| `email` | Email valide |
| `code` | Exactement 6 chiffres |

### Schemas de profil

#### studentProfileSchema

| Champ | Regle |
|---|---|
| `headline` | Maximum 120 caracteres |
| `bio` | Maximum 2000 caracteres |
| `phone` | Optionnel |
| `location` | Optionnel |
| `website` | URL valide ou chaine vide |
| `linkedinUrl` | URL valide ou chaine vide |
| `githubUrl` | URL valide ou chaine vide |
| `skills` | Tableau de chaines (`string[]`) |
| `isPublic` | Booleen |

#### recruiterProfileSchema

| Champ | Regle |
|---|---|
| `companyName` | Requis |
| `sector` | Requis |
| `companyDescription` | Maximum 2000 caracteres |
| `companyWebsite` | URL valide ou chaine vide |
| `contactEmail` | Email valide ou chaine vide |
| `contactPhone` | Optionnel |
| `location` | Optionnel |

#### projectSchema

| Champ | Regle |
|---|---|
| `title` | Requis |
| `description` | Requis |
| `technologies` | Tableau de chaines (`string[]`) |
| `link` | URL valide ou chaine vide |

#### educationSchema

| Champ | Regle |
|---|---|
| `institution` | Requis |
| `degree` | Requis |
| `field` | Requis |
| `startDate` | Requis |
| `endDate` | Optionnel |
| `current` | Booleen |

#### experienceSchema

| Champ | Regle |
|---|---|
| `company` | Requis |
| `position` | Requis |
| `description` | Optionnel |
| `startDate` | Requis |
| `endDate` | Optionnel |
| `current` | Booleen |

---

## 11. Types TypeScript

**Fichier** : `frontend/src/types/index.ts`

### User

```typescript
interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  username: string
  role: 'student' | 'recruiter' | 'admin'
  isEmailVerified: boolean
  is2FAEnabled: boolean
  isActive: boolean
  avatar?: string
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}
```

| Champ | Type | Description |
|---|---|---|
| `_id` | `string` | Identifiant MongoDB |
| `email` | `string` | Adresse email de l'utilisateur |
| `firstName` | `string` | Prenom |
| `lastName` | `string` | Nom |
| `username` | `string` | Nom d'utilisateur unique |
| `role` | `'student' \| 'recruiter' \| 'admin'` | Role de l'utilisateur |
| `isEmailVerified` | `boolean` | Email verifie |
| `is2FAEnabled` | `boolean` | 2FA active |
| `isActive` | `boolean` | Compte actif |
| `avatar` | `string?` | URL de l'avatar |
| `lastLoginAt` | `string?` | Date de derniere connexion |
| `createdAt` | `string` | Date de creation |
| `updatedAt` | `string` | Date de derniere modification |

### StudentProfile

```typescript
interface StudentProfile {
  _id: string
  userId: string
  headline?: string
  bio?: string
  phone?: string
  location?: string
  website?: string
  linkedinUrl?: string
  githubUrl?: string
  skills: string[]
  education: Education[]
  experiences: Experience[]
  projects: Project[]
  cvUrl?: string
  profileCompletionPercent: number
  isPublic: boolean
  createdAt: string
  updatedAt: string
}
```

| Champ | Type | Description |
|---|---|---|
| `_id` | `string` | Identifiant du profil |
| `userId` | `string` | Reference vers le document User |
| `headline` | `string?` | Titre professionnel (max 120 caracteres) |
| `bio` | `string?` | Biographie (max 2000 caracteres) |
| `phone` | `string?` | Telephone |
| `location` | `string?` | Localisation |
| `website` | `string?` | Site web personnel |
| `linkedinUrl` | `string?` | URL du profil LinkedIn |
| `githubUrl` | `string?` | URL du profil GitHub |
| `skills` | `string[]` | Liste des competences |
| `education` | `Education[]` | Liste des formations |
| `experiences` | `Experience[]` | Liste des experiences professionnelles |
| `projects` | `Project[]` | Liste des projets |
| `cvUrl` | `string?` | URL du CV |
| `profileCompletionPercent` | `number` | Pourcentage de completion du profil |
| `isPublic` | `boolean` | Profil visible publiquement |

### RecruiterProfile

```typescript
interface RecruiterProfile {
  _id: string
  userId: string
  companyName: string
  sector: string
  companyDescription?: string
  companyWebsite?: string
  companyLogo?: string
  contactEmail?: string
  contactPhone?: string
  location?: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
}
```

| Champ | Type | Description |
|---|---|---|
| `_id` | `string` | Identifiant du profil |
| `userId` | `string` | Reference vers le document User |
| `companyName` | `string` | Nom de l'entreprise |
| `sector` | `string` | Secteur d'activite |
| `companyDescription` | `string?` | Description de l'entreprise |
| `companyWebsite` | `string?` | Site web de l'entreprise |
| `companyLogo` | `string?` | URL du logo |
| `contactEmail` | `string?` | Email de contact |
| `contactPhone` | `string?` | Telephone de contact |
| `location` | `string?` | Localisation |
| `isVerified` | `boolean` | Profil verifie par un administrateur |

### ApiResponse

```typescript
interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  errors?: Array<{ field: string; message: string }>
}
```

Ce type generique encapsule toutes les reponses de l'API backend. Le champ `errors` est utilise pour les erreurs de validation (retournees champ par champ).

---

## 12. Internationalisation (i18n)

### Configuration

| Parametre | Valeur |
|---|---|
| Bibliotheque | next-intl 4.8.3 |
| Langue par defaut | Francais (`lang="fr"` sur le document HTML) |
| Langues supportees | Francais (FR), Anglais (EN) |
| Fichiers de traduction | `i18n/fr.json`, `i18n/en.json` |
| Persistance | `localStorage` (via `LanguageSwitcher`) |

### Utilisation

Le composant `LanguageSwitcher` permet a l'utilisateur de basculer entre les langues. Le choix est persiste dans `localStorage` et restaure au prochain chargement.

Le hook `useLocale()` fournit un objet de traduction `t` qui permet d'acceder aux chaines traduites dans les cles du fichier JSON correspondant a la langue active.

### Composants traduits

Les traductions sont appliquees dans les composants suivants :
- `Navbar` (elements de navigation)
- `Sidebar` (elements de menu)
- Page `Profile` (labels et sections)
- Page `Dashboard` (textes d'accueil et actions)

---

## 13. Bibliotheque de composants UI

L'application utilise le pattern **shadcn/ui** : des primitives Radix UI non-stylees, personnalisees avec Tailwind CSS et organisees localement dans le dossier `components/ui/`.

### Composants disponibles

| Composant | Base | Description |
|---|---|---|
| **AlertDialog** | Radix AlertDialog | Dialogue de confirmation avec titre, description et actions. Utilise pour la suppression de compte (Danger Zone) |
| **Avatar** | Radix Avatar | Avatar avec image et fallback (initiales de l'utilisateur) |
| **Badge** | -- | Badges avec variantes : `default`, `secondary`, `outline`, `destructive` |
| **Button** | CVA (class-variance-authority) | Systeme de variantes : `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`. Tailles : `default`, `sm`, `lg`, `icon` |
| **Card** | -- | Ensemble de composants : `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` |
| **Dialog** | Radix Dialog | Boites de dialogue modales. Utilisees pour les operations CRUD (formation, experience, projets) |
| **DropdownMenu** | Radix DropdownMenu | Menu deroulant. Utilise dans la Navbar pour le menu utilisateur (avatar) |
| **Input** | -- | Champ de saisie style avec Tailwind CSS |
| **Label** | Radix Label | Label accessible associe aux champs de formulaire |
| **Separator** | Radix Separator | Separateur visuel horizontal ou vertical |
| **Tabs** | Radix Tabs | Interface a onglets. Utilisee dans le formulaire profil etudiant (5 onglets) |
| **Toast** | -- | Composant de notification individuelle |
| **Toaster** | -- | Conteneur de notifications, place dans le layout racine |

### Utilitaire cn()

**Fichier** : `frontend/src/lib/utils.ts`

La fonction `cn()` combine `clsx` et `tailwind-merge` pour permettre la composition conditionnelle de classes Tailwind CSS sans conflits :

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 14. Variables d'environnement

| Variable | Valeur par defaut | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5001/api` | URL de base de l'API backend |

> **Note** : Le prefixe `NEXT_PUBLIC_` rend la variable accessible cote client (navigateur). C'est necessaire car le client API Axios envoie les requetes directement depuis le navigateur vers le backend.

---

## 15. Docker

**Fichier** : `Dockerfile.frontend`

Build multi-etapes pour une image de production optimisee :

| Etape | Image de base | Description |
|---|---|---|
| 1. Dependencies | `node:20-alpine` | Installation des dependances via `npm ci` |
| 2. Build | `node:20-alpine` | Build Next.js en mode standalone (`npm run build`) |
| 3. Runtime | `node:20-alpine` | Copie de `.next/standalone`, `.next/static`, `public`. Execution sous utilisateur non-root (`nextjs:1001`) |

| Parametre | Valeur |
|---|---|
| Port d'ecoute | 3000 |
| Utilisateur d'execution | `nextjs` (UID 1001) |
| Mode de sortie | Next.js standalone |

---

## 16. Couverture fonctionnelle du Sprint 1

### BF-001 -- Authentification et Gestion des Roles

| Fonctionnalite | Statut | Pages/Composants |
|---|---|---|
| Inscription (etudiant/recruteur) | Implemente | `/register` -- `RegisterForm` |
| Connexion (email/mot de passe) | Implemente | `/login` -- `LoginForm` |
| Deconnexion | Implemente | `Navbar` (menu avatar) -- `useAuth().logout()` |
| Verification email | Implemente | `/verify-email` -- `VerifyEmailCard` |
| Mot de passe oublie | Implemente | `/forgot-password` -- `ForgotPasswordForm` |
| Reinitialisation mot de passe | Implemente | `/reset-password` -- `ResetPasswordForm` |
| Authentification a deux facteurs (2FA) | Implemente | `/verify-2fa` -- `TwoFactorForm`, `/settings` (activation/desactivation) |
| Suppression de compte | Implemente | `/settings` -- Danger Zone, `AlertDialog` de confirmation avec mot de passe |
| Gestion des sessions (JWT) | Implemente | `AuthProvider`, `lib/auth.ts`, `lib/api.ts` (intercepteurs) |
| Rafraichissement automatique du token | Implemente | Intercepteur de reponse Axios (retry sur 401) |
| Protection des routes (garde d'auth) | Implemente | Layout `(dashboard)` -- redirection vers `/login` |
| Gestion des roles (student/recruiter/admin) | Implemente | `User.role`, navigation conditionnelle dans `Sidebar` |

### BF-002 -- Profils de base (partiel)

| Fonctionnalite | Statut | Pages/Composants |
|---|---|---|
| Consultation du profil | Implemente | `/profile` -- affichage conditionnel par role |
| Edition du profil etudiant | Implemente | `/profile/edit` -- `StudentProfileForm` (5 onglets) |
| Edition du profil recruteur | Implemente | `/profile/edit` -- `RecruiterProfileForm` |
| Gestion des competences (tags) | Implemente | `SkillTags` (max 20, ajout/suppression) |
| CRUD Formation | Implemente | `EducationSection` (dialogue modal) |
| CRUD Experience professionnelle | Implemente | `ExperienceSection` (dialogue modal) |
| CRUD Projets | Implemente | `ProjectCard` (grille + dialogue), `/projects` |
| Profil public | Implemente | `/p/[username]` -- `PublicProfileView` |
| Barre de completion du profil | Implemente | `/dashboard` -- `profileCompletionPercent` |
| Toggle visibilite publique | Implemente | `StudentProfileForm` -- champ `isPublic` |

### Resume des endpoints API consommes (Sprint 1)

#### Authentification

| Methode | Endpoint | Utilise par |
|---|---|---|
| `POST` | `/auth/login` | `AuthProvider.login()` |
| `POST` | `/auth/register` | `AuthProvider.register()` |
| `POST` | `/auth/logout` | `AuthProvider.logout()` |
| `POST` | `/auth/refresh` | `AuthProvider.initAuth()`, intercepteur 401 |
| `GET` | `/auth/me` | `AuthProvider.refreshUser()` |
| `POST` | `/auth/forgot-password` | `ForgotPasswordForm` |
| `POST` | `/auth/reset-password` | `ResetPasswordForm` |
| `POST` | `/auth/verify-email` | `VerifyEmailCard` |
| `POST` | `/auth/verify-2fa` | `TwoFactorForm` |

#### Profils

| Methode | Endpoint | Utilise par |
|---|---|---|
| `GET` | `/profiles/me` | `useProfile()` |
| `DELETE` | `/profiles/me/account` | Page Settings -- suppression de compte |
| `PUT` | `/profiles/me` | `StudentProfileForm`, `RecruiterProfileForm` |
| `GET` | `/profiles/public/:username` | `PublicProfileView` |
| `POST` | `/profiles/me/education` | `EducationSection` (ajout) |
| `PUT` | `/profiles/me/education/:id` | `EducationSection` (modification) |
| `DELETE` | `/profiles/me/education/:id` | `EducationSection` (suppression) |
| `POST` | `/profiles/me/experiences` | `ExperienceSection` (ajout) |
| `PUT` | `/profiles/me/experiences/:id` | `ExperienceSection` (modification) |
| `DELETE` | `/profiles/me/experiences/:id` | `ExperienceSection` (suppression) |
| `POST` | `/profiles/me/projects` | `ProjectCard` (ajout) |
| `PUT` | `/profiles/me/projects/:id` | `ProjectCard` (modification) |
| `DELETE` | `/profiles/me/projects/:id` | `ProjectCard` (suppression) |

---

*Document genere pour le Sprint 1 de la plateforme ForMinds.*
