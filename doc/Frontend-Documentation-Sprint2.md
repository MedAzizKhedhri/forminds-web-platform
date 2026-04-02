# Documentation Frontend -- Sprint 2

## ForMinds -- Plateforme Web de Mise en Relation Etudiants-Recruteurs

**Version** : 2.0
**Date** : 07 mars 2026
**Sprint** : Sprint 2 -- BF-003 (Reseau Social, Fil d'actualite, Annuaire) + BF-004 (Opportunites, Candidatures)

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet (ajouts Sprint 2)](#2-structure-du-projet-ajouts-sprint-2)
3. [Routage et navigation](#3-routage-et-navigation)
4. [Types TypeScript](#4-types-typescript)
5. [Validation des formulaires (Zod)](#5-validation-des-formulaires-zod)
6. [Hooks personnalises](#6-hooks-personnalises)
7. [Composants UI (shadcn/ui)](#7-composants-ui-shadcnui)
8. [Module Reseau (Network)](#8-module-reseau-network)
9. [Module Annuaire (Directory)](#9-module-annuaire-directory)
10. [Module Fil d'actualite (Feed)](#10-module-fil-dactualite-feed)
11. [Module Opportunites](#11-module-opportunites)
12. [Module Candidatures (Applications)](#12-module-candidatures-applications)
13. [Dashboard (mises a jour Sprint 2)](#13-dashboard-mises-a-jour-sprint-2)
14. [Internationalisation (i18n)](#14-internationalisation-i18n)
15. [Patterns transversaux](#15-patterns-transversaux)
16. [Recapitulatif des endpoints API](#16-recapitulatif-des-endpoints-api)

---

## 1. Vue d'ensemble

Le Sprint 2 etend le frontend ForMinds avec quatre sections majeures, couvrant deux blocs fonctionnels :

| Bloc fonctionnel | Perimetre Sprint 2 |
|---|---|
| **BF-003** -- Reseau social | Gestion des connexions (demandes, acceptation, suppression), suggestions de contacts, fil d'actualite (posts, likes, commentaires), annuaire de profils avec recherche et filtres |
| **BF-004** -- Opportunites | Publication d'opportunites (stages, emplois, benevolat) par les recruteurs, recherche/filtrage pour les etudiants, candidatures avec lettre de motivation, suivi des statuts |

### Resume quantitatif

| Element | Quantite |
|---|---|
| Nouvelles pages | 8 |
| Nouveaux composants metier | 23 |
| Nouveaux composants UI | 4 |
| Nouveaux hooks | 5 |
| Nouveaux types TypeScript | 6 |
| Nouveaux schemas Zod | 4 |
| Nouvelles cles i18n | ~60 (par langue) |
| Fichiers modifies | 7 |
| **Total fichiers impactes** | **~47** |

### Dependances ajoutees

| Package | Version | Utilisation |
|---|---|---|
| `@radix-ui/react-select` | ^2.1 | Primitive Select pour les filtres et formulaires |
| `@radix-ui/react-alert-dialog` | ^1.1 | Dialogues de confirmation |

---

## 2. Structure du projet (ajouts Sprint 2)

```
frontend/src/
├── app/(dashboard)/
│   ├── applications/
│   │   └── page.tsx                    # Page "Mes candidatures" (etudiant)
│   ├── directory/
│   │   └── page.tsx                    # Page annuaire des profils
│   ├── feed/
│   │   └── page.tsx                    # Page fil d'actualite
│   ├── network/
│   │   └── page.tsx                    # Page reseau / connexions
│   ├── opportunities/
│   │   ├── page.tsx                    # Liste des opportunites
│   │   ├── create/page.tsx             # Creation d'opportunite (recruteur)
│   │   ├── mine/page.tsx               # Mes opportunites (recruteur)
│   │   └── [id]/page.tsx               # Detail d'une opportunite
│   └── dashboard/page.tsx              # (modifie) Widgets Sprint 2
│
├── components/
│   ├── applications/
│   │   ├── ApplicationCard.tsx         # Carte candidature (vue etudiant)
│   │   ├── ApplicationReceivedCard.tsx # Carte candidature (vue recruteur)
│   │   └── ApplicationStatusBadge.tsx  # Badge de statut candidature
│   ├── directory/
│   │   ├── DirectoryFilters.tsx        # Barre de filtres avec debounce
│   │   ├── DirectoryGrid.tsx           # Grille responsive avec pagination
│   │   └── ProfileDirectoryCard.tsx    # Carte profil dans l'annuaire
│   ├── feed/
│   │   ├── CommentForm.tsx             # Formulaire de commentaire
│   │   ├── CommentItem.tsx             # Affichage d'un commentaire
│   │   ├── CommentSection.tsx          # Section commentaires extensible
│   │   ├── LikeButton.tsx              # Bouton like avec coeur anime
│   │   ├── PostCard.tsx                # Carte de publication complete
│   │   ├── PostFeed.tsx                # Liste de publications
│   │   └── PostForm.tsx                # Formulaire de publication
│   ├── network/
│   │   ├── ConnectionCard.tsx          # Carte connexion polyvalente
│   │   ├── ConnectionList.tsx          # Liste des connexions acceptees
│   │   ├── ConnectionStatusBadge.tsx   # Badge statut connexion
│   │   ├── PendingRequestList.tsx      # Liste des demandes recues
│   │   └── SuggestionList.tsx          # Liste des suggestions
│   ├── opportunities/
│   │   ├── OpportunityCard.tsx         # Carte opportunite (liste)
│   │   ├── OpportunityDetail.tsx       # Vue detail opportunite
│   │   ├── OpportunityFilters.tsx      # Filtres opportunites
│   │   ├── OpportunityForm.tsx         # Formulaire creation/edition
│   │   └── OpportunityStatusBadge.tsx  # Badge statut opportunite
│   ├── layout/
│   │   └── Sidebar.tsx                 # (modifie) Navigation Sprint 2
│   └── ui/
│       ├── alert-dialog.tsx            # (nouveau) Dialogue de confirmation
│       ├── select.tsx                  # (nouveau) Select Radix
│       ├── skeleton.tsx                # (nouveau) Placeholder chargement
│       └── textarea.tsx                # (nouveau) Zone de texte
│
├── hooks/
│   ├── useApplications.ts             # Hook candidatures
│   ├── useConnections.ts              # Hook connexions
│   ├── useDirectory.ts                # Hook annuaire
│   ├── useOpportunities.ts            # Hook opportunites
│   └── usePosts.ts                    # Hook publications
│
├── i18n/
│   ├── en.json                        # (modifie) +60 cles anglais
│   └── fr.json                        # (modifie) +60 cles francais
│
├── lib/
│   └── validations.ts                 # (modifie) +4 schemas Zod
│
└── types/
    └── index.ts                       # (modifie) +6 interfaces
```

---

## 3. Routage et navigation

### 3.1 Nouvelles routes

Toutes les routes Sprint 2 sont sous le groupe `(dashboard)` et beneficient de la protection d'authentification cote client du layout parent.

| Route | Fichier | Composant | Restriction de role |
|---|---|---|---|
| `/feed` | `app/(dashboard)/feed/page.tsx` | `FeedPage` | Aucune |
| `/network` | `app/(dashboard)/network/page.tsx` | `NetworkPage` | Aucune |
| `/directory` | `app/(dashboard)/directory/page.tsx` | `DirectoryPage` | Aucune |
| `/opportunities` | `app/(dashboard)/opportunities/page.tsx` | `OpportunitiesPage` | Aucune |
| `/opportunities/[id]` | `app/(dashboard)/opportunities/[id]/page.tsx` | `OpportunityDetailPage` | Aucune |
| `/opportunities/create` | `app/(dashboard)/opportunities/create/page.tsx` | `CreateOpportunityPage` | Recruteur uniquement |
| `/opportunities/mine` | `app/(dashboard)/opportunities/mine/page.tsx` | `MyOpportunitiesPage` | Recruteur uniquement |
| `/applications` | `app/(dashboard)/applications/page.tsx` | `ApplicationsPage` | Etudiant uniquement |

### 3.2 Gardes de role (Role Guards)

Les pages restreintes implementent un pattern de garde via `useEffect` :

```tsx
// Pattern utilise dans create, mine, applications
const { user, isLoading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!isLoading && user?.role !== 'recruiter') {
    router.replace('/dashboard');
  }
}, [user, isLoading, router]);

// Empeche le flash de contenu non autorise
if (isLoading || user?.role !== 'recruiter') return null;
```

### 3.3 Sidebar mise a jour

La sidebar a ete reorganisee en **4 sections** separees par des `<Separator />` :

| Section | Elements | Icones | Roles |
|---|---|---|---|
| **Principal** | Dashboard, Feed | LayoutDashboard, MessageSquare | Tous |
| **Social** | Network, Directory | Users, Search | student+recruiter, Tous |
| **Opportunites** | Opportunities, My Opportunities, My Applications | Briefcase, ClipboardList, FileText | Tous, Recruteur, Etudiant |
| **Personnel** | Profile, My Projects, Settings, Users Management | User, FolderOpen, Settings, Users | Tous, Etudiant, Tous, Admin |

**Logique `isActive` personnalisee :**

```typescript
const isActive = (href: string) => {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/opportunities') {
    return pathname === '/opportunities' || pathname.match(/^\/opportunities\/[^/]+$/);
  }
  return pathname.startsWith(href);
};
```

Cette logique evite que `/opportunities` soit actif quand on est sur `/opportunities/mine` ou `/opportunities/create`.

---

## 4. Types TypeScript

Fichier : `frontend/src/types/index.ts`

### 4.1 PaginatedResponse\<T>

Interface generique de pagination utilisee par tous les hooks de liste :

```typescript
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}
```

### 4.2 Connection

```typescript
export interface Connection {
  _id: string;
  senderId: string | User;    // Populate conditionnelle
  receiverId: string | User;  // Populate conditionnelle
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 Post

```typescript
export interface Post {
  _id: string;
  authorId: User;            // Toujours populated
  content: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe?: boolean;     // Indique si l'utilisateur courant a like
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 Comment

```typescript
export interface Comment {
  _id: string;
  authorId: User;            // Toujours populated
  postId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.5 Opportunity

```typescript
export interface Opportunity {
  _id: string;
  recruiterId: User | string;
  title: string;
  description: string;
  type: 'stage' | 'emploi' | 'benevolat';
  location: string;
  domain: string;
  skills: string[];
  requirements?: string;
  deadline?: string;
  status: 'pending' | 'approved' | 'rejected' | 'closed';
  createdAt: string;
  updatedAt: string;
}
```

### 4.6 Application

```typescript
export interface Application {
  _id: string;
  studentId: User | string;
  opportunityId: Opportunity | string;  // Populate conditionnelle
  status: 'pending' | 'reviewed' | 'shortlisted' | 'accepted' | 'rejected';
  coverLetter?: string;
  appliedAt: string;
  updatedAt: string;
}
```

---

## 5. Validation des formulaires (Zod)

Fichier : `frontend/src/lib/validations.ts`

### 5.1 createOpportunitySchema

```typescript
export const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  type: z.enum(['stage', 'emploi', 'benevolat']),
  location: z.string().min(1, 'Location is required'),
  domain: z.string().min(1, 'Domain is required'),
  skills: z.array(z.string()).optional().default([]),
  requirements: z.string().max(3000).optional(),
  deadline: z.string().optional(),
});
export type CreateOpportunityFormData = z.infer<typeof createOpportunitySchema>;
```

Utilise dans : `OpportunityForm.tsx` avec `react-hook-form` + `zodResolver`.

### 5.2 createPostSchema

```typescript
export const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
});
export type CreatePostFormData = z.infer<typeof createPostSchema>;
```

### 5.3 createCommentSchema

```typescript
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment is required').max(1000),
});
export type CreateCommentFormData = z.infer<typeof createCommentSchema>;
```

### 5.4 applySchema

```typescript
export const applySchema = z.object({
  opportunityId: z.string().min(1),
  coverLetter: z.string().max(3000).optional(),
});
export type ApplyFormData = z.infer<typeof applySchema>;
```

---

## 6. Hooks personnalises

Tous les hooks suivent le pattern etabli au Sprint 1 : `useState` + `useCallback` + appels via l'instance Axios (`api`).

### 6.1 useConnections

**Fichier** : `frontend/src/hooks/useConnections.ts`
**Export** : `useConnections()`

**Etat retourne :**

| Variable | Type | Description |
|---|---|---|
| `connections` | `Connection[]` | Connexions acceptees |
| `pendingRequests` | `Connection[]` | Demandes recues en attente |
| `sentRequests` | `Connection[]` | Demandes envoyees |
| `suggestions` | `User[]` | Profils suggeres |
| `total` | `number` | Total pour la pagination |
| `totalPages` | `number` | Nombre de pages |
| `isLoading` | `boolean` | Etat de chargement |

**Fonctions :**

| Fonction | Methode | Endpoint | Description |
|---|---|---|---|
| `fetchConnections(page, limit)` | GET | `/connections` | Recupere les connexions acceptees |
| `fetchPendingRequests(page, limit)` | GET | `/connections/pending` | Recupere les demandes recues |
| `fetchSentRequests(page, limit)` | GET | `/connections/sent` | Recupere les demandes envoyees |
| `fetchSuggestions(limit)` | GET | `/connections/suggestions` | Recupere les suggestions |
| `sendRequest(receiverId)` | POST | `/connections/request` | Envoie une demande de connexion |
| `respondToRequest(id, status)` | PATCH | `/connections/${id}` | Accepte ou rejette une demande |
| `removeConnection(id)` | DELETE | `/connections/${id}` | Supprime une connexion |
| `getConnectionStatus(userId)` | GET | `/connections/status/${userId}` | Verifie le statut avec un utilisateur |

### 6.2 useDirectory

**Fichier** : `frontend/src/hooks/useDirectory.ts`
**Export** : `useDirectory()`

**Interface locale :**

```typescript
interface DirectoryProfile {
  _id: string;
  userId: { _id: string; firstName: string; lastName: string; username: string; avatar?: string };
  headline?: string;
  skills: string[];
  location?: string;
  domain?: string;
}

interface DirectoryFilters {
  skills?: string;
  domain?: string;
  city?: string;
  page?: number;
  limit?: number;
}
```

**Etat** : `profiles: DirectoryProfile[]`, `total`, `totalPages`, `isLoading`

| Fonction | Methode | Endpoint | Description |
|---|---|---|---|
| `searchProfiles(filters)` | GET | `/profiles/directory` | Recherche avec filtres optionnels |

### 6.3 usePosts

**Fichier** : `frontend/src/hooks/usePosts.ts`
**Export** : `usePosts()`

**Etat** : `posts: Post[]`, `totalPages: number`, `isLoading: boolean`

| Fonction | Methode | Endpoint | Description |
|---|---|---|---|
| `fetchFeed(page, limit)` | GET | `/posts` | Recupere le fil (page=1 remplace, page>1 ajoute) |
| `createPost(content)` | POST | `/posts` | Cree un post (ajoute en tete de liste) |
| `updatePost(id, content)` | PATCH | `/posts/${id}` | Modifie un post |
| `deletePost(id)` | DELETE | `/posts/${id}` | Supprime un post |
| `likePost(id)` | POST | `/posts/${id}/like` | Like avec **mise a jour optimiste** |
| `unlikePost(id)` | DELETE | `/posts/${id}/like` | Unlike avec **mise a jour optimiste** |
| `fetchComments(postId, page, limit)` | GET | `/posts/${id}/comments` | Recupere les commentaires |
| `addComment(postId, content)` | POST | `/posts/${id}/comments` | Ajoute un commentaire |
| `deleteComment(postId, commentId)` | DELETE | `/posts/${id}/comments/${commentId}` | Supprime un commentaire |

**Mise a jour optimiste (likes) :**

```typescript
const likePost = useCallback(async (postId: string) => {
  // Sauvegarde de l'etat pour rollback
  const previousPosts = posts;
  // Mise a jour optimiste immediate
  setPosts((prev) =>
    prev.map((p) =>
      p._id === postId
        ? { ...p, likesCount: p.likesCount + 1, isLikedByMe: true }
        : p
    )
  );
  try {
    await api.post(`/posts/${postId}/like`);
  } catch {
    // Rollback en cas d'erreur
    setPosts(previousPosts);
  }
}, [posts]);
```

### 6.4 useOpportunities

**Fichier** : `frontend/src/hooks/useOpportunities.ts`
**Export** : `useOpportunities()`

**Etat** : `opportunities: Opportunity[]`, `opportunity: Opportunity | null`, `total`, `totalPages`, `isLoading`

| Fonction | Methode | Endpoint | Description |
|---|---|---|---|
| `searchOpportunities(filters)` | GET | `/opportunities` | Recherche avec filtres (type, location, domain) |
| `getOpportunity(id)` | GET | `/opportunities/${id}` | Recupere une opportunite |
| `getMyOpportunities(page, limit)` | GET | `/opportunities/mine` | Opportunites du recruteur |
| `createOpportunity(data)` | POST | `/opportunities` | Cree une opportunite |
| `updateOpportunity(id, data)` | PATCH | `/opportunities/${id}` | Modifie une opportunite |
| `closeOpportunity(id)` | PATCH | `/opportunities/${id}/close` | Cloture une opportunite |

### 6.5 useApplications

**Fichier** : `frontend/src/hooks/useApplications.ts`
**Export** : `useApplications()`

**Etat** : `applications: Application[]`, `total`, `totalPages`, `isLoading`

| Fonction | Methode | Endpoint | Description |
|---|---|---|---|
| `apply(opportunityId, coverLetter?)` | POST | `/applications` | Soumet une candidature |
| `getMyApplications(page, limit)` | GET | `/applications/mine` | Candidatures de l'etudiant |
| `getOpportunityApplications(oppId, page, limit)` | GET | `/applications/opportunity/${id}` | Candidatures recues (recruteur) |
| `updateApplicationStatus(appId, status)` | PATCH | `/applications/${id}/status` | Change le statut d'une candidature |

---

## 7. Composants UI (shadcn/ui)

Quatre nouveaux composants de la bibliotheque design system, suivant le pattern shadcn/ui (fichiers source dans `components/ui/`).

### 7.1 Skeleton

**Fichier** : `components/ui/skeleton.tsx`

Placeholder de chargement anime. Rendu : `<div>` avec les classes `animate-pulse rounded-md bg-muted`.

```tsx
<Skeleton className="h-4 w-32" />     {/* Ligne de texte */}
<Skeleton className="h-10 w-10 rounded-full" />  {/* Avatar */}
```

Utilise dans : tous les composants de liste (PostFeed, ConnectionList, DirectoryGrid, etc.).

### 7.2 Textarea

**Fichier** : `components/ui/textarea.tsx`

Zone de texte stylisee via `React.forwardRef`. Hauteur minimum de 80px, bordure arrondie, anneau de focus, gestion de l'etat desactive.

Utilise dans : `PostForm`, `OpportunityForm`, dialogue de candidature.

### 7.3 Select

**Fichier** : `components/ui/select.tsx`
**Base** : `@radix-ui/react-select`

Exporte 9 sous-composants : `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`.

Utilise dans : `OpportunityFilters` (filtre par type), `OpportunityForm` (selection du type), `ApplicationReceivedCard` (changement de statut).

### 7.4 AlertDialog

**Fichier** : `components/ui/alert-dialog.tsx`
**Base** : `@radix-ui/react-alert-dialog`

Exporte 11 sous-composants pour les dialogues de confirmation. Overlay avec `bg-black/80`, contenu centre avec animations, layout footer responsive (colonne sur mobile, ligne sur desktop). Utilise `buttonVariants()` du composant Button.

---

## 8. Module Reseau (Network)

### 8.1 ConnectionStatusBadge

**Fichier** : `components/network/ConnectionStatusBadge.tsx`

| Props | Type | Description |
|---|---|---|
| `status` | `'pending' \| 'accepted' \| 'rejected'` | Statut de la connexion |

**Couleurs :**
- `pending` : fond jaune, texte jaune fonce (`bg-yellow-100 text-yellow-800`)
- `accepted` : fond vert, texte vert fonce (`bg-green-100 text-green-800`)
- `rejected` : fond rouge, texte rouge fonce (`bg-red-100 text-red-800`)

### 8.2 ConnectionCard

**Fichier** : `components/network/ConnectionCard.tsx`

| Props | Type | Description |
|---|---|---|
| `connection` | `Connection` | Donnees de la connexion |
| `variant` | `'received' \| 'sent' \| 'accepted' \| 'suggestion'` | Determine l'affichage et les actions |
| `onAccept?` | `() => void` | Callback acceptation (variant=received) |
| `onReject?` | `() => void` | Callback rejet (variant=received) |
| `onRemove?` | `() => void` | Callback suppression (variant=accepted) |
| `onConnect?` | `() => void` | Callback connexion (variant=suggestion) |
| `isLoading?` | `boolean` | Affiche un spinner sur les boutons |

**Logique `getUser`** : extrait l'utilisateur pertinent selon le variant -- pour `received` c'est `senderId`, pour `sent`/`accepted` c'est `receiverId`.

**Rendu conditionnel par variant :**
- `received` : boutons Accepter (Check) + Rejeter (X)
- `accepted` : bouton Supprimer (UserMinus)
- `sent` : badge "Pending"
- `suggestion` : bouton Connecter (UserPlus)

### 8.3 ConnectionList

**Fichier** : `components/network/ConnectionList.tsx`

| Props | Type | Description |
|---|---|---|
| `connections` | `Connection[]` | Liste des connexions |
| `isLoading` | `boolean` | Etat de chargement |
| `onRemove` | `(id: string) => void` | Callback suppression |
| `currentUserId` | `string` | ID utilisateur courant |

Grille responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`). Inclut un composant `ConnectionListSkeleton` interne (3 cartes skeleton).

### 8.4 PendingRequestList

**Fichier** : `components/network/PendingRequestList.tsx`

| Props | Type | Description |
|---|---|---|
| `requests` | `Connection[]` | Demandes en attente |
| `isLoading` | `boolean` | Etat de chargement |
| `onAccept` | `(id: string) => void` | Callback acceptation |
| `onReject` | `(id: string) => void` | Callback rejet |

Etat vide : icone Inbox avec message `t.network.noPending`.

### 8.5 SuggestionList

**Fichier** : `components/network/SuggestionList.tsx`

| Props | Type | Description |
|---|---|---|
| `suggestions` | `User[]` | Utilisateurs suggeres |
| `isLoading` | `boolean` | Etat de chargement |
| `onConnect` | `(userId: string) => void` | Callback connexion |

Contient un sous-composant `SuggestionCard` avec son propre etat `isLoading` local pour le bouton "Connecter". Chaque carte affiche : Avatar, nom complet (lien vers `/p/${username}`), headline, bouton Connect.

Etat vide : icone Lightbulb avec message `t.network.noSuggestions`.

### 8.6 Page Network

**Fichier** : `app/(dashboard)/network/page.tsx`
**Composant** : `NetworkPage`

**Hooks utilises** : `useAuth`, `useLocale`, `useToast`, `useConnections`

**Lifecycle** : `useEffect` appelle les 4 fonctions de chargement au montage (`fetchConnections`, `fetchPendingRequests`, `fetchSentRequests`, `fetchSuggestions`).

**Structure** : Composant `Tabs` avec 4 onglets :

| Onglet | Composant | Badge |
|---|---|---|
| Connexions (defaut) | `ConnectionList` | - |
| Demandes recues | `PendingRequestList` | Nombre de demandes (variant destructive) |
| Demandes envoyees | Grille customisee de `ConnectionCard variant="sent"` | - |
| Suggestions | `SuggestionList` | - |

**Handlers :**
- `handleAccept` : accepte la demande, rafraichit pending + connections
- `handleReject` : rejette la demande, rafraichit pending
- `handleRemove` : confirmation + suppression, rafraichit connections
- `handleConnect` : envoie une demande, rafraichit suggestions + sent

---

## 9. Module Annuaire (Directory)

### 9.1 ProfileDirectoryCard

**Fichier** : `components/directory/ProfileDirectoryCard.tsx`

| Props | Type | Description |
|---|---|---|
| `profile` | `{ _id, userId: {...}, headline?, skills: string[], location? }` | Profil a afficher |
| `onConnect?` | `(userId: string) => void` | Callback connexion |
| `connectionStatus?` | `string` | Statut de connexion existant |

Affiche : Avatar avec initiales, nom (lien `/p/${username}`), headline (line-clamp-1), localisation (MapPin), jusqu'a 5 badges de competences + badge "+N more" pour le surplus.

**Bouton conditionnel :**
- `connectionStatus === 'accepted'` : pas de bouton
- `connectionStatus === 'pending'` : bouton desactive "Pending"
- Sinon : bouton "Connect"

### 9.2 DirectoryFilters

**Fichier** : `components/directory/DirectoryFilters.tsx`

| Props | Type | Description |
|---|---|---|
| `onFilterChange` | `(filters: { skills?, domain?, city? }) => void` | Callback changement de filtre |
| `initialFilters?` | `{ skills?, domain?, city? }` | Valeurs initiales |

**Trois champs** : Skills, Domain, City (tous des `Input`).

**Debounce** : 300ms via `useRef<ReturnType<typeof setTimeout>>`, nettoyage au demontage.

Layout responsive : `flex-col sm:flex-row gap-3`.

### 9.3 DirectoryGrid

**Fichier** : `components/directory/DirectoryGrid.tsx`

| Props | Type | Description |
|---|---|---|
| `profiles` | `any[]` | Profils a afficher |
| `isLoading` | `boolean` | Etat de chargement |
| `page` | `number` | Page courante |
| `totalPages` | `number` | Total des pages |
| `onPageChange` | `(page: number) => void` | Callback changement de page |
| `onConnect?` | `(userId: string) => void` | Callback connexion |

**Chargement** : 6 `SkeletonCard` (composant interne) dans une grille responsive.

**Pagination** : Boutons Previous / Next avec icones ChevronLeft / ChevronRight et indicateur "Page X / Y".

### 9.4 Page Directory

**Fichier** : `app/(dashboard)/directory/page.tsx`
**Composant** : `DirectoryPage`

**Etat** : `page: number`, `filters: { skills?, domain?, city? }`

**Lifecycle** : `useEffect` appelle `searchProfiles({...filters, page})` quand `filters` ou `page` changent.

**Structure** : Icone Search + titre, `DirectoryFilters`, `DirectoryGrid`.

---

## 10. Module Fil d'actualite (Feed)

### 10.1 LikeButton

**Fichier** : `components/feed/LikeButton.tsx`

| Props | Type | Description |
|---|---|---|
| `isLiked` | `boolean` | L'utilisateur a-t-il like |
| `count` | `number` | Nombre total de likes |
| `onToggle` | `() => void` | Callback toggle |

Icone Heart de lucide-react. Quand `isLiked=true` : `text-red-500 fill-red-500` (coeur plein rouge). Sinon : `text-muted-foreground`. Transition `hover:text-red-500`.

### 10.2 CommentForm

**Fichier** : `components/feed/CommentForm.tsx`

| Props | Type | Description |
|---|---|---|
| `onSubmit` | `(content: string) => void` | Callback soumission |
| `isLoading?` | `boolean` | Etat de chargement |

Formulaire avec `Input` + bouton Send (icone). Efface l'input apres soumission. Bouton desactive si champ vide ou loading.

### 10.3 CommentItem

**Fichier** : `components/feed/CommentItem.tsx`

| Props | Type | Description |
|---|---|---|
| `comment` | `Comment` | Donnees du commentaire |
| `onDelete?` | `() => void` | Callback suppression |
| `canDelete` | `boolean` | Autorisation de suppression |

**Fonction utilitaire `formatRelativeDate`** : calcule une date relative (Xs ago, Xm ago, Xh ago, Xd ago), repli vers `toLocaleDateString()` apres 30 jours.

Affiche : Avatar (8x8), nom + date relative, contenu, bouton Trash2 si `canDelete && onDelete`.

### 10.4 CommentSection

**Fichier** : `components/feed/CommentSection.tsx`

| Props | Type | Description |
|---|---|---|
| `postId` | `string` | ID du post parent |
| `commentsCount` | `number` | Nombre de commentaires |
| `currentUserId` | `string` | ID utilisateur courant |
| `isAdmin?` | `boolean` | Est administrateur |

**Etat** : `isExpanded`, `comments: Comment[]`, `isLoadingComments`, `isSubmitting`

Section extensible : clic sur le bouton MessageSquare + compteur pour ouvrir/fermer. Au deploiement, charge les commentaires via `usePosts().fetchComments`. Affiche la liste de `CommentItem` avec formulaire `CommentForm` en bas.

**Permission de suppression** : `comment.authorId._id === currentUserId || isAdmin`.

### 10.5 PostForm

**Fichier** : `components/feed/PostForm.tsx`

| Props | Type | Description |
|---|---|---|
| `onSubmit` | `(content: string) => void` | Callback soumission |
| `initialContent?` | `string` | Contenu initial (edition) |
| `isEditing?` | `boolean` | Mode edition |
| `isLoading?` | `boolean` | Etat de chargement |
| `onCancel?` | `() => void` | Callback annulation |

Constante `MAX_CHARACTERS = 2000`. Card avec Textarea (3 lignes) + compteur "N/2000". Bouton : "Publier" (creation) ou "Mettre a jour" (edition). Bouton Annuler visible uniquement en mode edition.

### 10.6 PostCard

**Fichier** : `components/feed/PostCard.tsx`

| Props | Type | Description |
|---|---|---|
| `post` | `Post` | Donnees du post |
| `onLike` | `() => void` | Callback like |
| `onUnlike` | `() => void` | Callback unlike |
| `onEdit?` | `(content: string) => void` | Callback edition |
| `onDelete?` | `() => void` | Callback suppression |
| `currentUserId` | `string` | ID utilisateur courant |
| `isAdmin?` | `boolean` | Est administrateur |

**Structure :**
- **En-tete** : Avatar + nom auteur + Badge de role + date relative
- **Menu actions** (DropdownMenu, icone MoreHorizontal) : visible si auteur ou admin. Options : Editer (auteur uniquement), Supprimer (auteur ou admin)
- **Corps** : contenu texte avec `whitespace-pre-wrap break-words`, remplace par `PostForm` en mode edition
- **Pied** : `LikeButton` + `CommentSection`, separes par `border-t`

**Fonction `getRoleBadgeVariant`** : admin = `default`, recruiter = `secondary`, defaut = `outline`.

### 10.7 PostFeed

**Fichier** : `components/feed/PostFeed.tsx`

| Props | Type | Description |
|---|---|---|
| `posts` | `Post[]` | Liste des posts |
| `isLoading` | `boolean` | Etat de chargement |
| `hasMore` | `boolean` | D'autres posts disponibles |
| `onLoadMore` | `() => void` | Callback chargement supplementaire |
| `currentUserId` | `string` | ID utilisateur courant |
| `isAdmin?` | `boolean` | Est administrateur |
| `onLike` | `(postId: string) => void` | Callback like |
| `onUnlike` | `(postId: string) => void` | Callback unlike |
| `onEdit` | `(postId: string, content: string) => void` | Callback edition |
| `onDelete` | `(postId: string) => void` | Callback suppression |

**Composant interne `PostSkeleton`** : Card avec skeleton avatar + lignes de texte + zone d'interaction.

**Etats** : chargement (3 skeletons), vide ("Pas encore de publications"), donnees (liste de PostCard + bouton "Charger plus").

### 10.8 Page Feed

**Fichier** : `app/(dashboard)/feed/page.tsx`
**Composant** : `FeedPage`

**Etat** : `currentPage: number`, `isCreating: boolean`

**Hooks** : `usePosts`, `useAuth`, `useLocale`, `useToast`

**Lifecycle** : `useEffect` appelle `fetchFeed(1)` au montage.

**Handlers :**
- `handleLoadMore` : incremente la page, appelle `fetchFeed(nextPage)` (pattern scroll infini)
- `handleCreate` : appelle `createPost`, toast succes/erreur
- `handleEdit` / `handleDelete` : appels correspondants
- `handleLike` / `handleUnlike` : appels correspondants

**Structure** : Conteneur max-width 2xl, icone MessageSquare + titre, `PostForm` (creation), `PostFeed`.

---

## 11. Module Opportunites

### 11.1 OpportunityStatusBadge

**Fichier** : `components/opportunities/OpportunityStatusBadge.tsx`

| Props | Type | Description |
|---|---|---|
| `status` | `'pending' \| 'approved' \| 'rejected' \| 'closed'` | Statut de l'opportunite |

Badge variant `outline` avec couleurs : pending=jaune, approved=vert, rejected=rouge, closed=gris. Labels depuis `t.opportunities.status[status]`.

### 11.2 OpportunityFilters

**Fichier** : `components/opportunities/OpportunityFilters.tsx`

| Props | Type | Description |
|---|---|---|
| `onFilterChange` | `(filters: { type?, location?, domain? }) => void` | Callback filtres |

**Champs** :
- Select pour le type : Tous, Stage, Emploi, Benevolat (declenchement immediat)
- Input location et domain (debounce 300ms)

### 11.3 OpportunityCard

**Fichier** : `components/opportunities/OpportunityCard.tsx`

| Props | Type | Description |
|---|---|---|
| `opportunity` | `Opportunity` | Donnees de l'opportunite |

Carte cliquable (lien vers `/opportunities/${id}`) avec `hover:shadow-md transition-shadow`.

**Badge type avec couleurs :**
- `stage` : bleu (`bg-blue-100 text-blue-800`)
- `emploi` : vert (`bg-green-100 text-green-800`)
- `benevolat` : violet (`bg-purple-100 text-purple-800`)

Affiche : titre (line-clamp-2), badge type, localisation (MapPin), domaine, deadline (Calendar), recruteur (Building2).

### 11.4 OpportunityForm

**Fichier** : `components/opportunities/OpportunityForm.tsx`

| Props | Type | Description |
|---|---|---|
| `onSubmit` | `(data: CreateOpportunityFormData) => void` | Callback soumission |
| `initialData?` | `Partial<Opportunity>` | Donnees initiales (edition) |
| `isEditing?` | `boolean` | Mode edition |
| `isLoading?` | `boolean` | Etat de chargement |

**Librairie** : `react-hook-form` avec `zodResolver(createOpportunitySchema)`

**Champs** :

| Champ | Composant | Validation |
|---|---|---|
| Titre | `Input` | Requis, max 200 |
| Description | `Textarea` (5 lignes) | Requis, max 5000 |
| Type | `Select` via Controller (stage/emploi/benevolat) | Requis, enum |
| Localisation | `Input` | Requis |
| Domaine | `Input` | Requis |
| Competences | `SkillTags` via Controller | Optionnel |
| Exigences | `Textarea` (3 lignes) | Optionnel, max 3000 |
| Date limite | `Input type="date"` | Optionnel |

**Note** : reutilise le composant `SkillTags` de `@/components/profile/SkillTags` via Controller.

### 11.5 OpportunityDetail

**Fichier** : `components/opportunities/OpportunityDetail.tsx`

| Props | Type | Description |
|---|---|---|
| `opportunity` | `Opportunity` | Donnees de l'opportunite |
| `userRole?` | `string` | Role de l'utilisateur courant |
| `onApply?` | `() => void` | Callback candidature |
| `hasApplied?` | `boolean` | Candidature deja soumise |
| `onEdit?` | `() => void` | Callback edition |
| `onClose?` | `() => void` | Callback cloture |

**Calculs internes** :
- `isDeadlinePassed` : `new Date(deadline) < new Date()`
- `isClosed` : `status === 'closed'`
- `isOwner` : `userRole === 'recruiter' && recruiter !== null`

**Sections** : en-tete (titre + badges), meta (localisation, domaine, deadline, recruteur), description, competences, exigences.

**Boutons conditionnels :**
- Etudiant, ouvert, non candidat : bouton "Postuler"
- Etudiant, deja candidat : badge "Deja postule"
- Etudiant, ferme : badge "Fermee"
- Recruteur (proprietaire), non ferme : boutons "Modifier" + "Fermer"

### 11.6 Page Liste des Opportunites

**Fichier** : `app/(dashboard)/opportunities/page.tsx`

Icone Briefcase + titre. Bouton "Creer une opportunite" (recruteurs uniquement, lien vers `/opportunities/create`). `OpportunityFilters` + grille responsive de `OpportunityCard`. Skeleton (6 cartes), etat vide, pagination numerotee.

### 11.7 Page Detail Opportunite

**Fichier** : `app/(dashboard)/opportunities/[id]/page.tsx`

Utilise `useParams()` pour recuperer l'ID. Affiche `OpportunityDetail` avec :
- **Dialogue de candidature** : `Dialog` avec Textarea pour lettre de motivation (6 lignes), boutons Annuler + Postuler
- Navigation : bouton retour vers `/opportunities`
- Handlers : `handleApply`, `handleEdit` (redirect), `handleClose` (confirmation)

### 11.8 Page Creation d'Opportunite

**Fichier** : `app/(dashboard)/opportunities/create/page.tsx`

Garde de role : recruteur uniquement. Formulaire `OpportunityForm`. Succes : redirect vers `/opportunities/mine` + toast.

### 11.9 Page Mes Opportunites

**Fichier** : `app/(dashboard)/opportunities/mine/page.tsx`

Garde de role : recruteur uniquement. Grille de cartes personnalisees (pas `OpportunityCard`) avec :
- Titre + `OpportunityStatusBadge`
- Localisation, domaine
- Bouton "Voir" (Eye, lien detail) + bouton "Fermer" (XCircle, destructive) si non cloture
- Skeleton (6 cartes), etat vide, pagination numerotee

---

## 12. Module Candidatures (Applications)

### 12.1 ApplicationStatusBadge

**Fichier** : `components/applications/ApplicationStatusBadge.tsx`

| Statut | Couleur |
|---|---|
| `pending` | Jaune (`bg-yellow-100 text-yellow-800`) |
| `reviewed` | Bleu (`bg-blue-100 text-blue-800`) |
| `shortlisted` | Violet (`bg-violet-100 text-violet-800`) |
| `accepted` | Vert (`bg-green-100 text-green-800`) |
| `rejected` | Rouge (`bg-red-100 text-red-800`) |

Labels depuis `t.applications.status[status]`.

### 12.2 ApplicationCard

**Fichier** : `components/applications/ApplicationCard.tsx`

| Props | Type | Description |
|---|---|---|
| `application` | `Application` | Donnees de la candidature |

Vue etudiant. Carte cliquable (lien vers `/opportunities/${opportunityId}`). Affiche : titre de l'opportunite, badge de statut, badge de type, localisation, recruteur, date de candidature.

**Type guard** : `isPopulatedOpportunity(value)` verifie si `opportunityId` est un objet `Opportunity` populate.

### 12.3 ApplicationReceivedCard

**Fichier** : `components/applications/ApplicationReceivedCard.tsx`

| Props | Type | Description |
|---|---|---|
| `application` | `Application` | Donnees de la candidature |
| `onStatusChange` | `(appId: string, status: Application['status']) => void` | Callback changement de statut |

Vue recruteur. Affiche : Avatar etudiant, nom, badge de statut, date, apercu lettre de motivation (line-clamp-3).

**Select de statut** : liste des 5 statuts (`pending`, `reviewed`, `shortlisted`, `accepted`, `rejected`), declenche `onStatusChange`.

**Lien profil** : lien vers `/p/${student.username}` avec icone ExternalLink.

### 12.4 Page Mes Candidatures

**Fichier** : `app/(dashboard)/applications/page.tsx`
**Composant** : `ApplicationsPage`

Garde de role : etudiant uniquement. Icone FileText + titre "Mes candidatures".

**Lifecycle** : `useEffect` appelle `getMyApplications(page)`.

Grille de `ApplicationCard`. Skeleton (3 cartes), etat vide (Inbox + "Aucune candidature"), pagination Previous/Next.

---

## 13. Dashboard (mises a jour Sprint 2)

**Fichier** : `app/(dashboard)/dashboard/page.tsx`

### 13.1 Nouveaux etats

```typescript
const [pendingCount, setPendingCount] = useState(0);
const [recentPosts, setRecentPosts] = useState<Post[]>([]);
const [recentApplications, setRecentApplications] = useState<Application[]>([]);
const [widgetsLoading, setWidgetsLoading] = useState(true);
```

### 13.2 Appels API (`fetchWidgets`)

Un `useEffect` appelle 3 endpoints en parallele via `Promise.all` :

| Endpoint | Parametres | Donnee extraite |
|---|---|---|
| `GET /connections/pending` | `page=1, limit=1` | `pendingCount` (nombre total) |
| `GET /posts` | `page=1, limit=3` | `recentPosts` (3 derniers posts) |
| `GET /applications/mine` | `page=1, limit=3` | `recentApplications` (etudiant uniquement) |

### 13.3 Nouveaux widgets

| Widget | Icone | Couleur | Contenu | Lien |
|---|---|---|---|---|
| Demandes en attente | Users | Orange | Compteur avec Badge destructive | `/network` |
| Publications recentes | MessageSquare | Bleu | Apercu 2 posts (auteur + extrait 60 chars) | `/feed` |
| Opportunites | Briefcase | Vert | Description conditionnelle par role | `/opportunities` ou `/opportunities/mine` |
| Candidatures recentes | FileText | Violet | 3 candidatures avec statut colore (etudiant uniquement) | `/applications` |

Chaque widget utilise `Skeleton` pendant le chargement et un etat vide textuel.

---

## 14. Internationalisation (i18n)

### 14.1 Nouvelles sections ajoutees

Les fichiers `i18n/fr.json` et `i18n/en.json` ont ete enrichis avec les sections suivantes :

| Section | Nombre de cles | Utilisation |
|---|---|---|
| `common` (extensions) | 4 | `loadMore`, `confirm`, `close`, `next` |
| `dashboard` (extensions) | 5 | `pendingConnections`, `recentPosts`, `recentApplications`, `receivedApplications`, `viewAll` |
| `nav` (extensions) | 5 | `feed`, `directory`, `applications`, `myOpportunities` |
| `feed` | 17 | Toutes les interactions du fil d'actualite |
| `network` | 13 | Connexions, demandes, suggestions |
| `directory` | 7 | Recherche, filtres, annuaire |
| `opportunities` | 26 | Types, filtres, actions, statuts (incluant objet `status`) |
| `applications` | 10 | Candidatures, statuts (incluant objet `status`), actions |

### 14.2 Exemple de traductions (feed)

| Cle | Francais | Anglais |
|---|---|---|
| `feed.title` | Fil d'actualite | Feed |
| `feed.createPost` | Publier | Publish |
| `feed.placeholder` | Qu'avez-vous en tete ? | What's on your mind? |
| `feed.like` | J'aime | Like |
| `feed.loadMore` | Charger plus | Load more |
| `feed.noPosts` | Aucune publication pour le moment | No posts yet |

### 14.3 Pattern d'utilisation

Tous les composants Sprint 2 suivent le pattern etabli au Sprint 1 :

```tsx
const { t } = useLocale();
// Utilisation avec fallback
{t.feed?.title || 'Feed'}
// Acces a un objet imbrique
{t.applications?.status?.[app.status] || app.status}
```

---

## 15. Patterns transversaux

### 15.1 Gestion des erreurs

- **Hook level** : les fonctions de fetch utilisent `try/catch` avec commentaire "error handled by interceptor" (l'intercepteur Axios gere les 401)
- **Page level** : les handlers encapsulent les appels dans `try/catch` et affichent des notifications `useToast` (variant `destructive` pour les erreurs)

### 15.2 Etats de chargement (Skeleton)

Chaque composant de liste inclut un composant Skeleton interne :

| Composant | Skeletons affiches |
|---|---|
| `PostFeed` | 3 `PostSkeleton` (avatar + lignes + zone interaction) |
| `ConnectionList` | 3 cartes skeleton en grille |
| `PendingRequestList` | 3 cartes skeleton avec boutons |
| `SuggestionList` | Grille skeleton |
| `DirectoryGrid` | 6 `SkeletonCard` (avatar + texte + badges + bouton) |
| `OpportunitiesPage` | 6 cartes skeleton |
| `MyOpportunitiesPage` | 6 cartes skeleton |
| `ApplicationsPage` | 3 `ApplicationCardSkeleton` |

### 15.3 Etats vides

Chaque liste affiche un etat vide centre avec icone + message :

| Composant | Icone | Message (cle i18n) |
|---|---|---|
| `PostFeed` | - | `feed.noPosts` |
| `ConnectionList` | Users | `network.noConnections` |
| `PendingRequestList` | Inbox | `network.noPending` |
| `SuggestionList` | Lightbulb | `network.noSuggestions` |
| `DirectoryGrid` | Users | `directory.noProfiles` |
| `OpportunitiesPage` | Briefcase | `opportunities.noOpportunities` |
| `MyOpportunitiesPage` | ClipboardList | `opportunities.noOpportunities` |
| `ApplicationsPage` | Inbox | `applications.noApplications` |

### 15.4 Pagination

Deux patterns de pagination sont utilises :

**Pattern 1 : Scroll infini (Feed)**
```
fetchFeed(page): page=1 remplace les posts, page>1 les ajoute
Bouton "Charger plus" en bas si hasMore=true
```

**Pattern 2 : Navigation par pages (Directory, Opportunities, Applications)**
```
Boutons Previous/Next avec indicateur "Page X / Y"
OU pagination numerotee avec boutons de page cliquables
```

### 15.5 Controle d'acces par role

| Mecanisme | Utilisation |
|---|---|
| Sidebar `filterItems` | Filtrage des items de navigation selon `user.role` |
| `useEffect` role guard | Redirect vers `/dashboard` si role incorrect (create, mine, applications) |
| `return null` pendant loading | Empeche le flash de contenu non autorise |
| Rendu conditionnel | Dashboard widgets, boutons d'action (ex: "Creer" pour recruteurs) |

### 15.6 Mises a jour optimistes

Uniquement pour les likes/unlikes dans `usePosts` :

1. Sauvegarde de l'etat precedent
2. Mise a jour immediate du state (increment/decrement `likesCount`, toggle `isLikedByMe`)
3. Appel API asynchrone
4. Rollback vers l'etat sauvegarde en cas d'erreur

### 15.7 Debounce des filtres

Les composants `DirectoryFilters` et `OpportunityFilters` implementent un debounce de 300ms :

```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout>>();

const handleChange = (field: string, value: string) => {
  setState(value);
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    onFilterChange({ ...currentFilters, [field]: value });
  }, 300);
};

useEffect(() => {
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
}, []);
```

### 15.8 Validation de formulaires

Deux approches employees :

| Approche | Composantes | Methode |
|---|---|---|
| `react-hook-form` + Zod | `OpportunityForm` | `zodResolver(createOpportunitySchema)`, messages d'erreur par champ |
| Validation manuelle | `PostForm`, `CommentForm` | Verification `trim()` + longueur, desactivation du bouton |

---

## 16. Recapitulatif des endpoints API

Tous les appels passent par l'instance Axios configuree dans `lib/api.ts` (avec intercepteur JWT).

### 16.1 Connexions

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/connections` | `useConnections.fetchConnections` | Liste des connexions acceptees |
| GET | `/connections/pending` | `useConnections.fetchPendingRequests` | Demandes recues |
| GET | `/connections/sent` | `useConnections.fetchSentRequests` | Demandes envoyees |
| GET | `/connections/suggestions` | `useConnections.fetchSuggestions` | Suggestions |
| POST | `/connections/request` | `useConnections.sendRequest` | Envoyer une demande |
| PATCH | `/connections/${id}` | `useConnections.respondToRequest` | Accepter/rejeter |
| DELETE | `/connections/${id}` | `useConnections.removeConnection` | Supprimer |
| GET | `/connections/status/${userId}` | `useConnections.getConnectionStatus` | Verifier le statut |

### 16.2 Publications et commentaires

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/posts` | `usePosts.fetchFeed` | Fil d'actualite pagine |
| POST | `/posts` | `usePosts.createPost` | Creer un post |
| PATCH | `/posts/${id}` | `usePosts.updatePost` | Modifier un post |
| DELETE | `/posts/${id}` | `usePosts.deletePost` | Supprimer un post |
| POST | `/posts/${id}/like` | `usePosts.likePost` | Liker un post |
| DELETE | `/posts/${id}/like` | `usePosts.unlikePost` | Retirer le like |
| GET | `/posts/${id}/comments` | `usePosts.fetchComments` | Commentaires d'un post |
| POST | `/posts/${id}/comments` | `usePosts.addComment` | Ajouter un commentaire |
| DELETE | `/posts/${id}/comments/${cId}` | `usePosts.deleteComment` | Supprimer un commentaire |

### 16.3 Annuaire

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/profiles/directory` | `useDirectory.searchProfiles` | Recherche de profils |

### 16.4 Opportunites

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/opportunities` | `useOpportunities.searchOpportunities` | Recherche filtree |
| GET | `/opportunities/${id}` | `useOpportunities.getOpportunity` | Detail |
| GET | `/opportunities/mine` | `useOpportunities.getMyOpportunities` | Mes opportunites |
| POST | `/opportunities` | `useOpportunities.createOpportunity` | Creer |
| PATCH | `/opportunities/${id}` | `useOpportunities.updateOpportunity` | Modifier |
| PATCH | `/opportunities/${id}/close` | `useOpportunities.closeOpportunity` | Cloturer |

### 16.5 Candidatures

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| POST | `/applications` | `useApplications.apply` | Soumettre |
| GET | `/applications/mine` | `useApplications.getMyApplications` | Mes candidatures |
| GET | `/applications/opportunity/${id}` | `useApplications.getOpportunityApplications` | Candidatures recues |
| PATCH | `/applications/${id}/status` | `useApplications.updateApplicationStatus` | Changer le statut |

### 16.6 Dashboard (appels directs)

| Methode | Endpoint | Utilisation |
|---|---|---|
| GET | `/connections/pending` | Widget compteur demandes |
| GET | `/posts` | Widget publications recentes |
| GET | `/applications/mine` | Widget candidatures recentes (etudiant) |

---

**Total endpoints Sprint 2 : 26** (dont 3 appeles directement depuis le dashboard sans hook dedie).
