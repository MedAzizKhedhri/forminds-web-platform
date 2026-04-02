# Documentation Frontend -- Sprint 3

## ForMinds -- Plateforme Web de Mise en Relation Etudiants-Recruteurs

**Version** : 3.0
**Date** : 10 mars 2026
**Sprint** : Sprint 3 -- BF-005 (Matching IA) + BF-006 (Evenements Hybrides & QR Code)

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet (ajouts Sprint 3)](#2-structure-du-projet-ajouts-sprint-3)
3. [Routage et navigation](#3-routage-et-navigation)
4. [Types TypeScript](#4-types-typescript)
5. [Validation des formulaires (Zod)](#5-validation-des-formulaires-zod)
6. [Hooks personnalises](#6-hooks-personnalises)
7. [Composants UI (shadcn/ui)](#7-composants-ui-shadcnui)
8. [Module Matching IA (Recommandations)](#8-module-matching-ia-recommandations)
9. [Module Matching IA (Detail)](#9-module-matching-ia-detail)
10. [Module Evenements - Pages publiques](#10-module-evenements---pages-publiques)
11. [Module Evenements - Gestion organisateur](#11-module-evenements---gestion-organisateur)
12. [Module Evenements - Participation](#12-module-evenements---participation)
13. [Internationalisation (i18n)](#13-internationalisation-i18n)
14. [Patterns transversaux](#14-patterns-transversaux)
15. [Dependencies externes Sprint 3](#15-dependencies-externes-sprint-3)
16. [Recapitulatif des endpoints API](#16-recapitulatif-des-endpoints-api)

---

## 1. Vue d'ensemble

Le Sprint 3 etend le frontend ForMinds avec deux modules majeurs, couvrant deux blocs fonctionnels :

| Bloc fonctionnel | Perimetre Sprint 3 |
|---|---|
| **BF-005** -- Matching IA | Recommandations d'opportunites basees sur le profil etudiant (competences, localisation, domaine, experience), score de matching detaille avec decomposition, competences correspondantes et manquantes, explication IA |
| **BF-006** -- Evenements Hybrides & QR Code | Publication d'evenements (conferences, ateliers, networking, webinaires, salons) par les recruteurs, inscription et annulation pour les participants, generation de QR codes pour les tickets, check-in via scanner camera ou saisie manuelle |

### Resume quantitatif

| Element | Quantite |
|---|---|
| Nouvelles pages | 10 |
| Nouveaux composants metier | 2 |
| Nouveaux hooks | 2 |
| Nouvelles cles i18n | ~70 (par langue) |
| Dependances externes ajoutees | 2 |
| Fichiers modifies | 4 |
| **Total fichiers impactes** | **~18** |

### Dependances ajoutees

| Package | Version | Utilisation |
|---|---|---|
| `qrcode.react` | ^4.x | Generation d'images QR Code cote client (composant QRCodeSVG) |
| `html5-qrcode` | ^2.x | Scanner QR via camera (Html5Qrcode) pour la page check-in |

---

## 2. Structure du projet (ajouts Sprint 3)

```
frontend/src/
├── app/(dashboard)/
│   ├── recommendations/
│   │   ├── page.tsx                           # Liste des recommandations IA (etudiant)
│   │   └── [id]/
│   │       └── page.tsx                       # Detail du score de matching
│   ├── events/
│   │   ├── page.tsx                           # Liste des evenements (public)
│   │   ├── [id]/
│   │   │   ├── page.tsx                       # Detail d'un evenement
│   │   │   ├── edit/
│   │   │   │   └── page.tsx                   # Modifier un evenement (recruteur)
│   │   │   ├── checkin/
│   │   │   │   └── page.tsx                   # Scanner QR check-in (recruteur)
│   │   │   └── my-registration/
│   │   │       └── page.tsx                   # Mon ticket pour un evenement
│   │   ├── create/
│   │   │   └── page.tsx                       # Creer un evenement (recruteur)
│   │   ├── mine/
│   │   │   └── page.tsx                       # Mes evenements organises (recruteur)
│   │   └── my-tickets/
│   │       └── page.tsx                       # Mes tickets/inscriptions
│
├── components/
│   └── events/
│       ├── EventForm.tsx                      # Formulaire creation/edition d'evenement
│       └── EventCard.tsx                      # Carte evenement (liste)
│
├── hooks/
│   ├── useMatching.ts                         # Hook matching IA (recommandations + score)
│   └── useEvents.ts                           # Hook evenements (CRUD + inscriptions + check-in)
│
├── i18n/
│   ├── en.json                                # (modifie) +70 cles anglais (sections matching + events + nav)
│   └── fr.json                                # (modifie) +70 cles francais (sections matching + events + nav)
│
├── components/layout/
│   └── Sidebar.tsx                            # (modifie) Sections evenements + matching
│
└── types/
    └── index.ts                               # (modifie) +4 interfaces (MatchResult, DetailedMatchResult, Event, Registration)
```

---

## 3. Routage et navigation

### 3.1 Nouvelles routes

Toutes les routes Sprint 3 sont sous le groupe `(dashboard)` et beneficient de la protection d'authentification cote client du layout parent.

| Route | Fichier | Composant | Restriction de role |
|---|---|---|---|
| `/recommendations` | `app/(dashboard)/recommendations/page.tsx` | `RecommendationsPage` | Etudiant uniquement |
| `/recommendations/[id]` | `app/(dashboard)/recommendations/[id]/page.tsx` | `MatchDetailPage` | Etudiant uniquement |
| `/events` | `app/(dashboard)/events/page.tsx` | `EventsPage` | Aucune (public) |
| `/events/[id]` | `app/(dashboard)/events/[id]/page.tsx` | `EventDetailPage` | Aucune (public) |
| `/events/create` | `app/(dashboard)/events/create/page.tsx` | `CreateEventPage` | Recruteur uniquement |
| `/events/[id]/edit` | `app/(dashboard)/events/[id]/edit/page.tsx` | `EditEventPage` | Recruteur uniquement |
| `/events/mine` | `app/(dashboard)/events/mine/page.tsx` | `MyEventsPage` | Recruteur uniquement |
| `/events/my-tickets` | `app/(dashboard)/events/my-tickets/page.tsx` | `MyTicketsPage` | Tous les authentifies |
| `/events/[id]/checkin` | `app/(dashboard)/events/[id]/checkin/page.tsx` | `CheckinPage` | Recruteur uniquement |
| `/events/[id]/my-registration` | `app/(dashboard)/events/[id]/my-registration/page.tsx` | `MyRegistrationPage` | Tous les authentifies |

### 3.2 Gardes de role (Role Guards)

Les pages restreintes implementent un pattern de garde via `useEffect` :

```tsx
// Pattern utilise dans les pages Matching (etudiant uniquement)
const { user, isLoading: authLoading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!authLoading && user && user.role !== 'student') {
    router.replace('/dashboard');
  }
}, [authLoading, user, router]);

// Empeche le flash de contenu non autorise
if (authLoading || !user || user.role !== 'student') {
  return null;
}
```

Les pages de gestion organisateur (create, edit, mine, checkin) utilisent le meme pattern avec la verification `user.role !== 'recruiter'`.

### 3.3 Sidebar mise a jour

La sidebar a ete etendue avec une section **Evenements** et un lien **Recommandations**, separees par des `<Separator />` :

| Section | Elements | Icones | Roles |
|---|---|---|---|
| **Principal** | Dashboard, Feed | LayoutDashboard, MessageSquare | Tous |
| **Social** | Network, Directory | Users, Search | student+recruiter, Tous |
| **Evenements** | Events, My Events, My Tickets | Calendar, CalendarCheck, Ticket | Tous, Recruteur uniquement, Etudiant |
| **Opportunites** | Opportunities, My Opportunities, My Applications, Recommendations | Briefcase, ClipboardList, FileText, Sparkles | Tous, Recruteur, Etudiant, Etudiant |
| **Personnel** | Profile, My Projects, Settings | User, FolderOpen, Settings | Tous, Etudiant, Tous |

---

## 4. Types TypeScript

Fichier : `frontend/src/types/index.ts`

### 4.1 MatchResult

Interface representant une recommandation de matching dans la liste :

```typescript
export interface MatchResult {
  opportunityId: string;
  score: number;
  breakdown: {
    skillsScore: number;
    locationScore: number;
    domainScore: number;
  };
  explanation: string;
}
```

### 4.2 DetailedMatchResult

Interface representant le score de matching detaille pour une opportunite specifique :

```typescript
export interface DetailedMatchResult {
  overallScore: number;
  breakdown: {
    skillsScore: number;
    locationScore: number;
    domainScore: number;
    experienceScore: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  explanation: string;
}
```

### 4.3 Event

Interface representant un evenement :

```typescript
export interface Event {
  _id: string;
  organizerId: User | string;            // Populate conditionnelle
  title: string;
  description: string;
  type: 'conference' | 'workshop' | 'networking' | 'webinar' | 'career_fair';
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  isOnline: boolean;
  meetingUrl?: string;                    // Uniquement si isOnline=true
  image?: string;                         // URL de l'image uploadee
  status: 'pending' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'rejected';
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 Registration

Interface representant une inscription a un evenement :

```typescript
export interface Registration {
  _id: string;
  eventId: Event | string;               // Populate conditionnelle
  userId: User | string;                  // Populate conditionnelle
  status: 'registered' | 'cancelled' | 'checked_in';
  qrCode: string;                        // Donnees du QR code
  checkedIn: boolean;
  checkedInAt?: string;                   // Date du check-in
  createdAt: string;
}
```

---

## 5. Validation des formulaires (Zod)

Fichier : `frontend/src/lib/validations.ts`

### 5.1 createEventSchema

```typescript
export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  type: z.enum(['conference', 'workshop', 'networking', 'webinar', 'career_fair']),
  location: z.string().min(1, 'Location is required'),
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  isOnline: z.boolean().optional().default(false),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  image: z.string().optional(),
});
export type CreateEventFormData = z.infer<typeof createEventSchema>;
```

Utilise dans : `EventForm.tsx` avec `react-hook-form` + `zodResolver`.

---

## 6. Hooks personnalises

Tous les hooks suivent le pattern etabli aux sprints precedents : `useState` + `useCallback` + appels via l'instance Axios (`api`).

### 6.1 useMatching

**Fichier** : `frontend/src/hooks/useMatching.ts`
**Export** : `useMatching()`

**Etat retourne :**

| Variable | Type | Description |
|---|---|---|
| `recommendations` | `MatchResult[]` | Liste des recommandations |
| `matchDetail` | `{opportunity, matching} \| null` | Detail du matching pour une opportunite |
| `total` | `number` | Nombre total de recommandations |
| `isLoading` | `boolean` | Indicateur de chargement |

**Fonctions :**

| Fonction | Methode | Endpoint | Description |
|---|---|---|---|
| `getRecommendations(limit?)` | GET | `/matching/recommendations` | Charge les recommandations (limite par defaut : 10) |
| `getMatchScore(id)` | GET | `/matching/score/${id}` | Charge le score de matching detaille pour une opportunite |

### 6.2 useEvents

**Fichier** : `frontend/src/hooks/useEvents.ts`
**Export** : `useEvents()`

**Etat retourne :**

| Variable | Type | Description |
|---|---|---|
| `events` | `Event[]` | Liste d'evenements |
| `event` | `Event \| null` | Detail d'un evenement |
| `registrations` | `Registration[]` | Inscriptions de l'utilisateur |
| `registration` | `Registration \| null` | Inscription pour un evenement specifique |
| `participants` | `Registration[]` | Participants d'un evenement |
| `total` | `number` | Total pour pagination |
| `totalPages` | `number` | Pages totales |
| `isLoading` | `boolean` | Indicateur de chargement |

**Fonctions :**

| Fonction | Methode | Endpoint | Description |
|---|---|---|---|
| `listEvents(filters)` | GET | `/events` | Lister les evenements avec filtres (type, status, search) |
| `getEvent(id)` | GET | `/events/${id}` | Recuperer le detail d'un evenement |
| `createEvent(data)` | POST | `/events` | Creer un evenement |
| `updateEvent(id, data)` | PATCH | `/events/${id}` | Modifier un evenement |
| `cancelEvent(id)` | PATCH | `/events/${id}/cancel` | Annuler un evenement |
| `deleteEvent(id)` | DELETE | `/events/${id}` | Supprimer un evenement |
| `getOrganizerEvents(page, limit)` | GET | `/events/organizer/mine` | Recuperer les evenements de l'organisateur |
| `registerForEvent(id)` | POST | `/events/${id}/register` | S'inscrire a un evenement |
| `cancelRegistration(id)` | DELETE | `/events/${id}/register` | Annuler une inscription |
| `getMyRegistration(id)` | GET | `/events/${id}/my-registration` | Recuperer mon inscription pour un evenement |
| `getUserRegistrations(page, limit)` | GET | `/events/registrations/mine` | Recuperer toutes mes inscriptions |
| `checkin(id, qrCode)` | POST | `/events/${id}/checkin` | Check-in via QR code |
| `getEventParticipants(id, page, limit)` | GET | `/events/${id}/participants` | Recuperer la liste des participants |

---

## 7. Composants UI (shadcn/ui)

Le Sprint 3 reutilise les composants UI existants des sprints precedents. Aucun nouveau composant UI n'est ajoute :

| Composant | Origine | Utilisation Sprint 3 |
|---|---|---|
| `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` | Sprint 1 | Conteneurs de recommandations, evenements, tickets, scores |
| `Button` | Sprint 1 | Actions (inscrire, annuler, scanner, postuler, pagination) |
| `Badge` | Sprint 1 | Types d'evenements, statuts, competences, scores |
| `Input` | Sprint 1 | Recherche, saisie manuelle QR, champs formulaire |
| `Skeleton` | Sprint 2 | Etats de chargement (grilles de cartes) |
| `Textarea` | Sprint 2 | Description dans EventForm |
| `Label` | Sprint 1 | Labels des champs de formulaire |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | Sprint 2 | Filtres (type d'evenement), formulaire (type) |
| `AlertDialog` et sous-composants | Sprint 2 | Confirmations (annuler evenement, supprimer evenement, annuler inscription) |
| `Avatar`, `AvatarFallback`, `AvatarImage` | Sprint 1 | Avatars des organisateurs et participants |
| `Dialog` | Sprint 2 | Dialogues contextuels |
| `Checkbox` | Sprint 1 | Champ isOnline dans EventForm |

---

## 8. Module Matching IA (Recommandations)

### 8.1 Page Recommandations

**Fichier** : `app/(dashboard)/recommendations/page.tsx`
**Composant** : `RecommendationsPage`

**Hooks utilises** : `useMatching`, `useAuth`, `useLocale`, `useRouter`

**Garde de role** : Redirige les non-etudiants vers `/dashboard`.

**Lifecycle** : `useEffect` appelle `getRecommendations()` au montage si l'utilisateur a le role `student`.

### 8.2 Sous-composant ScoreBar

Barre de progression coloree selon le seuil du score :

| Seuil | Couleur |
|---|---|
| score >= 80 | Vert (`bg-green-500`) |
| score >= 60 | Bleu (`bg-blue-500`) |
| score >= 40 | Jaune (`bg-yellow-500`) |
| score < 40 | Rouge (`bg-red-500`) |

### 8.3 Structure de la page

**En-tete** : Icone Sparkles + titre + bouton "Refresh" pour recharger les recommandations.

**Etats de la page :**

| Etat | Rendu |
|---|---|
| Chargement | 4 cartes Skeleton en grille |
| Vide | Icone Sparkles + message "Pas de recommandations" + bouton "Complete Your Profile" -> `/profile` |
| Donnees | Grille de cartes de recommandation |

### 8.4 Cartes de recommandation

Chaque carte affiche :

| Element | Rendu |
|---|---|
| Score global | Jauge circulaire SVG avec `stroke-dasharray` anime |
| Titre de l'opportunite | `CardTitle` |
| Nom du recruteur | Texte sous le titre |
| Type | `Badge variant="secondary"` |
| Localisation | Icone MapPin + texte |
| Domaine | Texte descriptif |
| Decomposition du score | 3 ScoreBars (skills, location, domain) |
| Explication IA | Texte en italique (optionnel) |
| Actions | Boutons "View Detail" + "Apply" |

---

## 9. Module Matching IA (Detail)

### 9.1 Page Detail du Matching

**Fichier** : `app/(dashboard)/recommendations/[id]/page.tsx`
**Composant** : `MatchDetailPage`

**Hooks utilises** : `useParams`, `useRouter`, `useMatching`, `useAuth`, `useLocale`

**Garde de role** : Redirige les non-etudiants vers `/dashboard`.

**Lifecycle** : `useEffect` appelle `getMatchScore(id)` au montage.

### 9.2 Sous-composant ProgressBar

Barre de progression animee avec couleur contextuelle selon le score. Meme logique de seuil que ScoreBar.

### 9.3 Structure de la page

| Section | Contenu |
|---|---|
| Navigation | Bouton retour -> `/recommendations` |
| En-tete opportunite | Carte avec titre, recruteur, localisation, domaine, badge de type |
| Score global | Carte avec grande jauge circulaire SVG (136px) |
| Decomposition du score | Carte avec 4 ProgressBars : skills (violet), location (bleu), domain (orange), experience (vert) |
| Grille des competences | Competences correspondantes (badges verts, icone CheckCircle2) + competences manquantes (badges rouges, icone XCircle) |
| Explication IA | Carte avec texte en italique |
| Action | Bouton "Apply" -> `/opportunities/${id}` |

---

## 10. Module Evenements - Pages publiques

### 10.1 EventCard

**Fichier** : `components/events/EventCard.tsx`

| Props | Type | Description |
|---|---|---|
| `event` | `Event` | Donnees de l'evenement |
| `translations?` | `object` | Traductions i18n |

Composant purement presentationnel, enveloppe dans un `Link` vers `/events/${id}`.

**Contenu affiche :**

| Element | Rendu |
|---|---|
| Image | Image de l'evenement ou gradient placeholder |
| Type | `Badge` avec couleur contextuelle (voir `typeColors`) |
| Statut | `Badge` (affiche uniquement si le statut n'est pas `upcoming`) |
| En ligne | `Badge` "Online" si `isOnline=true` |
| Titre | Texte `font-semibold` |
| Date | Icone Calendar + date formatee |
| Horaire | Icone Clock + startTime - endTime |
| Localisation | Icone MapPin + location |
| Capacite | Places restantes ou "Full" si complet |
| Organisateur | Nom de l'organisateur |

**Couleurs par type (`typeColors`) :**

| Type | Couleur |
|---|---|
| `conference` | Bleu |
| `workshop` | Vert |
| `networking` | Violet |
| `webinar` | Orange |
| `career_fair` | Rose |

### 10.2 Page Liste des Evenements

**Fichier** : `app/(dashboard)/events/page.tsx`
**Composant** : `EventsPage`

**Hooks utilises** : `useEvents`, `useAuth`, `useLocale`

**Aucune garde de role** (page publique). Le bouton "Create Event" est visible uniquement pour les recruteurs.

**Etat local** : `page`, `search`, `typeFilter`

**Structure** : En-tete + barre de filtres (Input recherche, Select type, bouton Search), grille 3 colonnes de `EventCard`, pagination Previous/Next.

**Etats de la page :**

| Etat | Rendu |
|---|---|
| Chargement | 6 cartes Skeleton en grille |
| Vide | Icone Calendar + message `events.noEvents` |
| Donnees | Grille de cartes + pagination |

### 10.3 Page Detail d'un Evenement

**Fichier** : `app/(dashboard)/events/[id]/page.tsx`
**Composant** : `EventDetailPage`

**Hooks utilises** : `useParams`, `useRouter`, `useEvents`, `useAuth`, `useLocale`, `useToast`

**Aucune garde de role** (page publique).

**Etat local** : `actionLoading`

**Structure :**

| Section | Contenu |
|---|---|
| Navigation | Bouton retour |
| En-tete | Image de l'evenement (ou gradient placeholder), badges type/statut/online, titre |
| Contenu principal | Carte description + carte URL de reunion (conditionnelle, pour les inscrits) |
| Barre laterale | Carte details (date, horaire, localisation, capacite, organisateur) + boutons d'action |

**Actions conditionnelles par role :**

| Condition | Actions affichees |
|---|---|
| Non-organisateur, non-admin, evenement `upcoming`, non inscrit | Bouton "Register" |
| Non-organisateur, non-admin, evenement `upcoming`, inscrit | Boutons "View Ticket" + "Cancel Registration" |
| Organisateur, evenement `upcoming` | Boutons "Edit" + "Scan QR" + "Cancel Event" (AlertDialog) |
| Organisateur, evenement `cancelled` | Bouton "Delete Event" (AlertDialog, redirige vers `/events/mine`) |

---

## 11. Module Evenements - Gestion organisateur

### 11.1 EventForm

**Fichier** : `components/events/EventForm.tsx`

| Props | Type | Description |
|---|---|---|
| `defaultValues?` | `Partial<CreateEventFormData>` | Valeurs initiales (edition) |
| `onSubmit` | `(data: CreateEventFormData) => void` | Callback soumission |
| `isSubmitting?` | `boolean` | Etat de chargement |
| `submitLabel?` | `string` | Label du bouton de soumission |
| `translations?` | `object` | Traductions i18n |

**Librairie** : `react-hook-form` avec `zodResolver(createEventSchema)`

**Champs :**

| Champ | Composant | Validation |
|---|---|---|
| Titre | `Input` | Requis, max 200 |
| Description | `Textarea` | Requis, max 5000 |
| Type | `Select` via Controller (conference/workshop/networking/webinar/career_fair) | Requis, enum |
| Localisation | `Input` | Requis |
| Date | `Input type="date"` | Requis |
| Heure de debut | `Input type="time"` | Requis |
| Heure de fin | `Input type="time"` | Requis |
| Capacite | `Input type="number"` | Requis, entier >= 1 |
| Image | Zone d'upload | Optionnel |
| Evenement en ligne | `Checkbox` | Optionnel, defaut false |
| URL de reunion | `Input` (conditionnel, si isOnline) | URL valide ou vide |

**Upload d'image** : Appel `POST /events/upload-image` en `multipart/form-data`. Affiche un apercu avec bouton de suppression.

### 11.2 Page Creation d'Evenement

**Fichier** : `app/(dashboard)/events/create/page.tsx`
**Composant** : `CreateEventPage`

**Garde de role** : Recruteur uniquement.

Utilise le composant `EventForm`. Succes : redirect vers `/events/mine` + toast de confirmation.

### 11.3 Page Modification d'Evenement

**Fichier** : `app/(dashboard)/events/[id]/edit/page.tsx`
**Composant** : `EditEventPage`

**Garde de role** : Recruteur uniquement.

Pre-remplit le formulaire `EventForm` avec les `defaultValues` de l'evenement existant. Succes : redirect vers `/events/${id}` + toast de confirmation.

### 11.4 Page Mes Evenements

**Fichier** : `app/(dashboard)/events/mine/page.tsx`
**Composant** : `MyEventsPage`

**Garde de role** : Recruteur uniquement.

**Hooks utilises** : `useEvents` (`getOrganizerEvents`), `useAuth`, `useLocale`

**Structure** : En-tete + bouton "Create Event" (lien vers `/events/create`), grille 3 colonnes de `EventCard`, pagination Previous/Next.

**Etats de la page :**

| Etat | Rendu |
|---|---|
| Chargement | 6 cartes Skeleton en grille |
| Vide | Icone Calendar + message "Aucun evenement" |
| Donnees | Grille de cartes + pagination |

### 11.5 Page Check-in

**Fichier** : `app/(dashboard)/events/[id]/checkin/page.tsx`
**Composant** : `CheckinPage`

**Garde de role** : Recruteur uniquement.

**Hooks utilises** : `useParams`, `useRouter`, `useEvents`, `useAuth`, `useLocale`, `useRef` (x3), `useCallback` (x3), `useEffect` (x3)

**Librairie externe** : `html5-qrcode` (`Html5Qrcode`)

**Deux modes de scan :**

| Mode | Description |
|---|---|
| Camera | Camera arriere, 10fps, zone de scan 250x250px, `facingMode: environment` |
| Manuel | Input texte pour saisir le code QR manuellement |

**Resultat du scan (feedback colore) :**

| Resultat | Couleur | Message |
|---|---|---|
| Succes | Vert | `events.checkinSuccess` |
| Deja presente | Jaune | `events.alreadyCheckedIn` |
| QR invalide | Rouge | `events.invalidQR` |

**Liste des participants** : Affiche la liste des participants de l'evenement avec un badge indiquant le ratio de check-in (ex: "5/20 Checked In").

**Gestion du cycle de vie camera** : Utilise un verrou de transition (`isTransitioningRef`) pour prevenir les race conditions sur les operations start/stop de la camera.

---

## 12. Module Evenements - Participation

### 12.1 Page Mes Tickets

**Fichier** : `app/(dashboard)/events/my-tickets/page.tsx`
**Composant** : `MyTicketsPage`

**Hooks utilises** : `useEvents` (`getUserRegistrations`), `useLocale`

**Lifecycle** : `useEffect` appelle `getUserRegistrations(page)` au montage et a chaque changement de page.

**Structure** : Liste de cartes de tickets. Chaque carte affiche :

| Element | Rendu |
|---|---|
| QR Code | `QRCodeSVG` de `qrcode.react` (112px, level M) |
| Statut de check-in | Badge colore (checked_in=vert, registered=bleu) |
| Type d'evenement | Badge |
| Titre de l'evenement | Texte `font-semibold` |
| Date | Date formatee |
| Horaire | startTime - endTime |
| Localisation | Lieu de l'evenement |

**Etats de la page :**

| Etat | Rendu |
|---|---|
| Chargement | 4 cartes Skeleton |
| Vide | Icone Ticket + message `events.noTickets` |
| Donnees | Liste de cartes tickets + pagination Previous/Next |

### 12.2 Page Mon Inscription

**Fichier** : `app/(dashboard)/events/[id]/my-registration/page.tsx`
**Composant** : `MyRegistrationPage`

**Hooks utilises** : `useParams`, `useRouter`, `useEvents`, `useAuth`, `useLocale`

**Lifecycle** : `useEffect` appelle `getMyRegistration(id)` au montage.

**Structure** : Affiche un ticket individuel avec :

| Element | Rendu |
|---|---|
| QR Code | `QRCodeSVG` de `qrcode.react` (168px, level M) |
| Statut de check-in | Badge colore |
| Titre de l'evenement | Texte |
| Date | Date formatee |
| Horaire | startTime - endTime |
| Localisation | Lieu de l'evenement |

---

## 13. Internationalisation (i18n)

### 13.1 Nouvelles sections ajoutees

Les fichiers `i18n/fr.json` et `i18n/en.json` ont ete enrichis avec les sections suivantes :

| Section | Nombre de cles | Utilisation |
|---|---|---|
| `nav` (extensions) | 4 | `events`, `myEvents`, `myTickets`, `recommendations` |
| `matching` | 18 | Toutes les interactions du module matching IA |
| `events` | ~52 | Toutes les interactions du module evenements (incluant objets `types` et `status`) |

### 13.2 Cles de navigation

| Cle | Anglais | Francais |
|---|---|---|
| `nav.events` | Events | Evenements |
| `nav.myEvents` | My Events | Mes evenements |
| `nav.myTickets` | My Tickets | Mes tickets |
| `nav.recommendations` | Recommendations | Recommandations |

### 13.3 Cles du module matching

| Cle | Anglais | Francais |
|---|---|---|
| `matching.title` | AI Recommendations | Recommandations IA |
| `matching.subtitle` | Opportunities matched to your profile | Opportunites correspondant a votre profil |
| `matching.refresh` | Refresh | Actualiser |
| `matching.noRecommendations` | No recommendations yet | Pas de recommandations |
| `matching.completeProfile` | Complete Your Profile | Completez votre profil |
| `matching.score` | Match Score | Score de matching |
| `matching.overallScore` | Overall Score | Score global |
| `matching.skills` | Skills | Competences |
| `matching.location` | Location | Localisation |
| `matching.domain` | Domain | Domaine |
| `matching.experience` | Experience | Experience |
| `matching.matchedSkills` | Matched Skills | Competences correspondantes |
| `matching.missingSkills` | Missing Skills | Competences manquantes |
| `matching.explanation` | AI Explanation | Explication IA |
| `matching.viewDetail` | View Detail | Voir le detail |
| `matching.apply` | Apply | Postuler |
| `matching.backToList` | Back to Recommendations | Retour aux recommandations |
| `matching.breakdown` | Score Breakdown | Decomposition du score |

### 13.4 Cles du module evenements

| Cle | Anglais | Francais |
|---|---|---|
| `events.title` | Events | Evenements |
| `events.create` | Create Event | Creer un evenement |
| `events.edit` | Edit Event | Modifier l'evenement |
| `events.myEvents` | My Events | Mes evenements |
| `events.myTickets` | My Tickets | Mes Tickets |
| `events.type` | Event Type | Type d'evenement |
| `events.noEvents` | No events found | Aucun evenement trouve |
| `events.noTickets` | No tickets yet | Aucun ticket |
| `events.register` | Register | S'inscrire |
| `events.eventFull` | Event Full | Complet |
| `events.spotsLeft` | spots left | places restantes |
| `events.cancelRegistration` | Cancel Registration | Annuler l'inscription |
| `events.cancelEvent` | Cancel Event | Annuler l'evenement |
| `events.confirmCancel` | Are you sure? | Etes-vous sur ? |
| `events.deleteEvent` | Delete Event | Supprimer l'evenement |
| `events.confirmDelete` | Are you sure? | Etes-vous sur ? |
| `events.viewTicket` | View Ticket | Voir le ticket |
| `events.scanQR` | Scan QR | Scanner QR |
| `events.checkin` | Check-in | Check-in |
| `events.camera` | Camera | Camera |
| `events.manual` | Manual | Manuel |
| `events.checkinSuccess` | Check-in successful | Check-in reussi |
| `events.alreadyCheckedIn` | Already checked in | Deja presente |
| `events.invalidQR` | Invalid QR code | QR code invalide |
| `events.switchToManual` | Switch to manual mode | Passer en mode manuel |
| `events.pointCamera` | Point camera at QR code | Pointer la camera vers le QR code |
| `events.participants` | Participants | Participants |
| `events.checkedIn` | Checked In | Presente |
| `events.notCheckedIn` | Not Checked In | Non presente |
| `events.online` | Online | En ligne |
| `events.organizer` | Organizer | Organisateur |
| `events.meetingUrl` | Meeting URL | Lien de la reunion |
| `events.capacity` | Capacity | Capacite |
| `events.isOnline` | Online Event | Evenement en ligne |
| `events.date` | Date | Date |
| `events.startTime` | Start Time | Heure de debut |
| `events.endTime` | End Time | Heure de fin |
| `events.image` | Event Image | Image de l'evenement |
| `events.eventTitle` | Event Title | Titre de l'evenement |
| `events.description` | Description | Description |
| `events.location` | Location | Lieu |

### 13.5 Cles de types d'evenements

| Cle | Anglais | Francais |
|---|---|---|
| `events.types.conference` | Conference | Conference |
| `events.types.workshop` | Workshop | Atelier |
| `events.types.networking` | Networking | Networking |
| `events.types.webinar` | Webinar | Webinaire |
| `events.types.career_fair` | Career Fair | Salon de l'emploi |

### 13.6 Cles de statuts d'evenements

| Cle | Anglais | Francais |
|---|---|---|
| `events.status.pending` | Pending | En attente |
| `events.status.upcoming` | Upcoming | A venir |
| `events.status.ongoing` | Ongoing | En cours |
| `events.status.completed` | Completed | Termine |
| `events.status.cancelled` | Cancelled | Annule |
| `events.status.rejected` | Rejected | Rejete |

### 13.7 Pattern d'utilisation

Tous les composants Sprint 3 suivent le pattern etabli aux sprints precedents :

```tsx
const { t } = useLocale();
// Utilisation avec fallback
{t.matching?.title || 'AI Recommendations'}
// Acces a un objet imbrique
{t.events?.types?.[event.type] || event.type}
// Acces a un statut
{t.events?.status?.[event.status] || event.status}
```

---

## 14. Patterns transversaux

### 14.1 Guard de role

Les pages Matching redirigent les non-etudiants vers `/dashboard`. Les pages de gestion organisateur redirigent les non-recruteurs. Pattern : `useEffect` + `useAuth` + `router.replace`.

### 14.2 Etats de chargement (Skeleton)

Chaque page utilise des Skeleton placeholders pendant le chargement :

| Page | Type de skeleton | Quantite |
|---|---|---|
| RecommendationsPage | Cartes skeleton en grille | 4 cartes |
| EventsPage | Cartes skeleton en grille | 6 cartes |
| MyEventsPage | Cartes skeleton en grille | 6 cartes |
| MyTicketsPage | Cartes skeleton avec QR placeholder | 4 cartes |

### 14.3 Etats vides

Les pages de liste affichent un etat vide centre avec icone + message descriptif + bouton d'action :

| Page | Icone | Message | Action |
|---|---|---|---|
| RecommendationsPage | Sparkles | `matching.noRecommendations` | "Complete Your Profile" -> `/profile` |
| EventsPage | Calendar | `events.noEvents` | - |
| MyEventsPage | Calendar | `events.noEvents` | - |
| MyTicketsPage | Ticket | `events.noTickets` | - |

### 14.4 Pagination

Boutons Previous/Next avec indicateur de page "X / Y (total Z)". Pattern identique aux sprints precedents.

### 14.5 Toast notifications

Succes apres creation/modification/inscription. Erreur apres echec d'action. Utilisation de `useToast` avec variant par defaut (succes) ou `destructive` (erreur).

### 14.6 Dialogues de confirmation

`AlertDialog` pour les actions destructives :

| Page | Action | Dialogue |
|---|---|---|
| EventDetailPage | Annuler un evenement | AlertDialog avec message `events.confirmCancel` |
| EventDetailPage | Supprimer un evenement | AlertDialog avec message `events.confirmDelete`, redirige vers `/events/mine` |
| EventDetailPage | Annuler une inscription | AlertDialog avec message `events.confirmCancel` |

### 14.7 Mise a jour optimiste

`cancelRegistration` met `registration` a `null` immediatement avant la confirmation serveur, offrant un retour visuel instantane.

### 14.8 Rendu conditionnel par role

`EventDetailPage` affiche des boutons d'action differents selon le role de l'utilisateur et le statut de propriete de l'evenement (voir section 10.3).

### 14.9 QR Code rendering

Utilisation de `qrcode.react` (`QRCodeSVG`) avec deux tailles :

| Contexte | Taille | Niveau de correction |
|---|---|---|
| Liste des tickets (MyTicketsPage) | 112px | M |
| Detail du ticket (MyRegistrationPage) | 168px | M |

### 14.10 Camera lifecycle

Utilisation de `html5-qrcode` avec gestion des transitions (`isTransitioningRef`) pour eviter les race conditions sur les operations start/stop de la camera. Le verrou de transition empeche les appels concurrents qui pourraient corrompre l'etat du scanner.

---

## 15. Dependencies externes Sprint 3

| Dependance | Version | Usage |
|---|---|---|
| `qrcode.react` | ^4.x | Generation d'images QR Code cote client (composant `QRCodeSVG`) |
| `html5-qrcode` | ^2.x | Scanner QR via camera (`Html5Qrcode`) pour la page check-in |

---

## 16. Recapitulatif des endpoints API

Tous les appels passent par l'instance Axios configuree dans `lib/api.ts` (avec intercepteur JWT).

### 16.1 Matching IA

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/matching/recommendations` | `useMatching.getRecommendations` | Liste des recommandations IA |
| GET | `/matching/score/${id}` | `useMatching.getMatchScore` | Score de matching detaille |

### 16.2 Evenements - CRUD

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/events` | `useEvents.listEvents` | Liste des evenements avec filtres |
| POST | `/events` | `useEvents.createEvent` | Creer un evenement |
| POST | `/events/upload-image` | EventForm (appel direct) | Upload d'image pour un evenement |
| GET | `/events/organizer/mine` | `useEvents.getOrganizerEvents` | Evenements de l'organisateur |
| GET | `/events/${id}` | `useEvents.getEvent` | Detail d'un evenement |
| PATCH | `/events/${id}` | `useEvents.updateEvent` | Modifier un evenement |
| PATCH | `/events/${id}/cancel` | `useEvents.cancelEvent` | Annuler un evenement |
| DELETE | `/events/${id}` | `useEvents.deleteEvent` | Supprimer un evenement |

### 16.3 Evenements - Inscriptions

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/events/registrations/mine` | `useEvents.getUserRegistrations` | Toutes mes inscriptions |
| POST | `/events/${id}/register` | `useEvents.registerForEvent` | S'inscrire a un evenement |
| DELETE | `/events/${id}/register` | `useEvents.cancelRegistration` | Annuler une inscription |
| GET | `/events/${id}/my-registration` | `useEvents.getMyRegistration` | Mon inscription pour un evenement |

### 16.4 Evenements - Check-in

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| POST | `/events/${id}/checkin` | `useEvents.checkin` | Check-in via QR code |
| GET | `/events/${id}/participants` | `useEvents.getEventParticipants` | Liste des participants |

---

**Total endpoints Sprint 3 : 17** (2 matching + 15 evenements).

---

*Document genere pour le Sprint 3 de la plateforme ForMinds.*
*Couvre les fonctionnalites frontend BF-005 (Matching IA) et BF-006 (Evenements Hybrides & QR Code).*
