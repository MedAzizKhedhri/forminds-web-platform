# Documentation Backend -- Sprint 3

## ForMinds -- Plateforme Web de Mise en Relation Etudiants-Recruteurs

**Version** : 3.0
**Date** : 10 mars 2026
**Sprint** : Sprint 3 -- BF-005 (Matching IA) + BF-006 (Evenements Hybrides & QR Code)

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet (ajouts Sprint 3)](#2-structure-du-projet-ajouts-sprint-3)
3. [Enums et constantes](#3-enums-et-constantes)
4. [Modeles de donnees (Mongoose)](#4-modeles-de-donnees-mongoose)
5. [Services (logique metier)](#5-services-logique-metier)
6. [Controllers et validation Zod](#6-controllers-et-validation-zod)
7. [Routes](#7-routes)
8. [Notifications email](#8-notifications-email)
9. [Montage dans app.ts](#9-montage-dans-appts)
10. [Recapitulatif des endpoints API](#10-recapitulatif-des-endpoints-api)
11. [Index MongoDB](#11-index-mongodb)
12. [Gestion des erreurs](#12-gestion-des-erreurs)
13. [Patterns transversaux](#13-patterns-transversaux)

---

## 1. Vue d'ensemble

Le Sprint 3 etend le backend ForMinds avec deux domaines fonctionnels couvrant deux blocs fonctionnels :

| Bloc fonctionnel | Perimetre Sprint 3 |
|---|---|
| **BF-005** -- Matching IA | Recommandations d'opportunites basees sur le profil etudiant, score detaille explicable, fallback deterministe si service IA indisponible |
| **BF-006** -- Evenements Hybrides | Creation et gestion d'evenements, inscription, QR code, check-in, gestion des participants |

### Resume quantitatif

| Element | Quantite |
|---|---|
| Nouveaux modeles Mongoose | 3 |
| Nouveaux services | 5 |
| Nouveaux controllers | 2 |
| Nouveaux fichiers de routes | 3 |
| Nouveaux enums | 4 |
| Nouvelles methodes email | 4 |
| Fichiers existants modifies | 4 |
| Nouveaux endpoints API | 16 |
| **Total nouveaux fichiers** | **14** |

### Architecture maintenue

L'architecture reste identique aux Sprints precedents : **Routes -> Controllers -> Services -> Models** avec middlewares transversaux (`authenticate`, `authorize`, `errorHandler`).

---

## 2. Structure du projet (ajouts Sprint 3)

```
backend/src/
├── controllers/
│   ├── event.controller.ts          ← NOUVEAU
│   └── matching.controller.ts       ← NOUVEAU
│
├── models/
│   ├── AuditLog.ts                  ← NOUVEAU
│   ├── Event.ts                     ← NOUVEAU
│   └── Registration.ts             ← NOUVEAU
│
├── routes/
│   ├── event.routes.ts              ← NOUVEAU
│   └── matching.routes.ts           ← NOUVEAU
│
├── services/
│   ├── ai.service.ts                ← NOUVEAU
│   ├── audit.service.ts             ← NOUVEAU
│   ├── event.service.ts             ← NOUVEAU
│   └── matching.service.ts          ← NOUVEAU
│
├── middleware/
│   └── upload.ts                    ← MODIFIE (ajout eventImageStorage)
│
├── utils/
│   └── constants.ts                 ← MODIFIE (ajout enums Sprint 3)
│
└── app.ts                           ← MODIFIE (montage nouvelles routes)
```

---

## 3. Enums et constantes

Fichier : `backend/src/utils/constants.ts`

Quatre nouveaux enums ajoutes apres les constantes existantes :

### 3.1 EventType

```typescript
export enum EventType {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  NETWORKING = 'networking',
  WEBINAR = 'webinar',
  CAREER_FAIR = 'career_fair',
}
```

| Valeur | Description |
|---|---|
| `CONFERENCE` | Conference |
| `WORKSHOP` | Atelier |
| `NETWORKING` | Evenement de networking |
| `WEBINAR` | Webinaire |
| `CAREER_FAIR` | Salon de l'emploi |

### 3.2 EventStatus

```typescript
export enum EventStatus {
  PENDING = 'pending',
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}
```

| Valeur | Description |
|---|---|
| `PENDING` | En attente de validation admin |
| `UPCOMING` | Valide et a venir |
| `ONGOING` | En cours |
| `COMPLETED` | Termine |
| `CANCELLED` | Annule |
| `REJECTED` | Rejete par l'admin |

### 3.3 RegistrationStatus

```typescript
export enum RegistrationStatus {
  REGISTERED = 'registered',
  CANCELLED = 'cancelled',
  CHECKED_IN = 'checked_in',
}
```

| Valeur | Description |
|---|---|
| `REGISTERED` | Inscrit |
| `CANCELLED` | Inscription annulee |
| `CHECKED_IN` | Presente (check-in effectue) |

### 3.4 AuditAction (preparation Sprint 4)

```typescript
export enum AuditAction {
  OPPORTUNITY_APPROVED = 'opportunity_approved',
  OPPORTUNITY_REJECTED = 'opportunity_rejected',
  EVENT_APPROVED = 'event_approved',
  EVENT_REJECTED = 'event_rejected',
  RECRUITER_VERIFIED = 'recruiter_verified',
  USER_SUSPENDED = 'user_suspended',
  USER_REACTIVATED = 'user_reactivated',
}
```

| Valeur | Description |
|---|---|
| `OPPORTUNITY_APPROVED` | Opportunite approuvee |
| `OPPORTUNITY_REJECTED` | Opportunite rejetee |
| `EVENT_APPROVED` | Evenement approuve |
| `EVENT_REJECTED` | Evenement rejete |
| `RECRUITER_VERIFIED` | Recruteur verifie |
| `USER_SUSPENDED` | Utilisateur suspendu |
| `USER_REACTIVATED` | Utilisateur reactive |

---

## 4. Modeles de donnees (Mongoose)

Tous les modeles suivent le pattern etabli aux Sprints precedents : interface TypeScript `extends Document`, schema Mongoose avec `timestamps: true`, indexes explicites, export par defaut du modele.

### 4.1 Event (`models/Event.ts`)

**Interface :**

```typescript
export interface IEvent extends Document {
  organizerId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: EventType;
  location: string;
  date: Date;
  startTime: string;
  endTime: string;
  capacity: number;
  registeredCount: number;
  isOnline: boolean;
  meetingUrl?: string;
  image?: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `organizerId` | `ObjectId` ref `User` | required |
| `title` | `String` | required, trim, maxlength: 200 |
| `description` | `String` | required, trim, maxlength: 5000 |
| `type` | `String` enum `EventType` | required |
| `location` | `String` | required, trim |
| `date` | `Date` | required |
| `startTime` | `String` | required, trim |
| `endTime` | `String` | required, trim |
| `capacity` | `Number` | required, min: 1 |
| `registeredCount` | `Number` | default: 0 |
| `isOnline` | `Boolean` | default: false |
| `meetingUrl` | `String` | optionnel, trim |
| `image` | `String` | optionnel, trim |
| `status` | `String` enum `EventStatus` | default: `PENDING` |

**Indexes :**

| Index | Options |
|---|---|
| `{ organizerId: 1 }` | -- |
| `{ status: 1, date: 1 }` | -- |
| `{ date: 1 }` | -- |
| `{ type: 1 }` | -- |

### 4.2 Registration (`models/Registration.ts`)

**Interface :**

```typescript
export interface IRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: RegistrationStatus;
  qrCode: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `eventId` | `ObjectId` ref `Event` | required |
| `userId` | `ObjectId` ref `User` | required |
| `status` | `String` enum `RegistrationStatus` | default: `REGISTERED` |
| `qrCode` | `String` | required, unique |
| `checkedIn` | `Boolean` | default: false |
| `checkedInAt` | `Date` | optionnel |

**Indexes :**

| Index | Options |
|---|---|
| `{ eventId: 1, userId: 1 }` | `unique: true` |
| `{ eventId: 1, status: 1 }` | -- |
| `{ qrCode: 1 }` | `unique: true` |
| `{ userId: 1 }` | -- |

### 4.3 AuditLog (`models/AuditLog.ts`)

**Interface :**

```typescript
export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: AuditAction;
  targetType: string;
  targetId: mongoose.Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}
```

**Schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `adminId` | `ObjectId` ref `User` | required |
| `action` | `String` enum `AuditAction` | required |
| `targetType` | `String` | required, trim |
| `targetId` | `ObjectId` | required |
| `details` | `Mixed` | optionnel |
| `ipAddress` | `String` | optionnel, trim |

**Options du schema :**

```typescript
{ timestamps: { createdAt: true, updatedAt: false } }
```

Le modele n'enregistre que le `createdAt` (pas de `updatedAt`), car les logs d'audit sont immuables et ne sont jamais modifies apres creation (append-only).

**Indexes :**

| Index | Options |
|---|---|
| `{ adminId: 1 }` | -- |
| `{ action: 1 }` | -- |
| `{ createdAt: -1 }` | -- |
| `{ targetType: 1, targetId: 1 }` | -- |

---

## 5. Services (logique metier)

Tous les services suivent le pattern etabli aux Sprints precedents : fonctions asynchrones exportees nommees, types de retour `Promise<T>`, erreurs via `AppError`.

### 5.1 MatchingService (`services/matching.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `getRecommendations` | `userId: string, limit: number = 10` | `{ recommendations, total }` | Charge le profil etudiant, les opportunites approuvees, appelle l'IA pour le scoring, trie par score desc puis limite |
| `getMatchScore` | `userId: string, opportunityId: string` | `{ opportunity, matching }` | Calcul detaille du matching pour une seule opportunite |

**Logique de `getRecommendations` :**

1. Charge `StudentProfile` par userId (erreur 400 si non trouve ou skills vide)
2. Charge toutes les Opportunities `{ status: APPROVED, deadline >= now ou null }`
3. Retourne liste vide si aucune opportunite
4. Prepare `studentData` (skills, location, education mapped, experiences mapped)
5. Prepare `opportunityData` (id, title, skills, location, domain, type, requirements)
6. Appelle `aiService.calculateMatches`
7. Trie par score descendant, limite les resultats
8. Enrichit chaque match avec les donnees completes de l'opportunite via `Map`

### 5.2 AIService (`services/ai.service.ts`)

**Interfaces exportees :**

```typescript
interface MatchResult {
  opportunityId: string;
  score: number;
  breakdown: {
    skillsScore: number;
    locationScore: number;
    domainScore: number;
  };
  explanation: string;
}

interface DetailedMatchResult {
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

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `calculateMatches` | `student: StudentData, opportunities: OpportunityData[]` | `MatchResult[]` | POST vers IA `/api/match`. Fallback deterministe si indisponible |
| `calculateScore` | `student: StudentData, opportunity: OpportunityData` | `DetailedMatchResult` | POST vers IA `/api/match/score`. Fallback deterministe si indisponible |
| `calculateBasicMatches` (prive) | `student, opportunities` | `MatchResult[]` | Fallback : skill intersection, location exact match, domain fixe (50%). Formule : `skills*0.5 + location*0.25 + domain*0.25` |
| `calculateBasicScore` (prive) | `student, opportunity` | `DetailedMatchResult` | Fallback : memes criteres + experienceScore (60 si experiences, 20 sinon). Formule : `skills*0.4 + location*0.2 + domain*0.2 + experience*0.2` |

**Mecanisme de fallback :**

Si le service FastAPI est indisponible (erreur reseau, timeout, etc.), les methodes `calculateMatches` et `calculateScore` basculent automatiquement sur les methodes privees `calculateBasicMatches` et `calculateBasicScore`. Ce fallback deterministe garantit que les recommandations restent disponibles meme sans le service IA externe.

### 5.3 EventService (`services/event.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `createEvent` | `organizerId, data` | `IEvent` | Cree evenement avec status `PENDING`, registeredCount 0 |
| `updateEvent` | `eventId, organizerId, data` | `IEvent` | Verification ownership (403). Interdit si annule (400). `Object.assign` + save |
| `cancelEvent` | `eventId, organizerId` | `IEvent` | Verification ownership. Interdit si deja annule. Annule toutes les inscriptions `REGISTERED`. Envoie email d'annulation a chaque participant |
| `deleteEvent` | `eventId, organizerId` | `void` | Verification ownership. Seulement si status `CANCELLED` (400). Supprime Registration puis Event |
| `getEvent` | `eventId` | `IEvent` | FindById + populate organizerId |
| `listEvents` | `filters, page, limit` | `{ events, total }` | Filtres : type, status (defaut `UPCOMING`), search (regex sur title/description/location). Tri date asc |
| `getOrganizerEvents` | `organizerId, page, limit` | `{ events, total }` | Evenements du recruteur. Tri date desc |
| `registerForEvent` | `eventId, userId` | `IRegistration` | Validations : event existe, status `UPCOMING`, date future, pas deja inscrit (409, sauf re-inscription si cancelled), capacite non atteinte. Genere QR code UUID. Envoie email confirmation |
| `cancelRegistration` | `eventId, userId` | `void` | Validations : inscription existe (404), pas deja annulee (400), pas apres check-in (400). Decremente registeredCount atomiquement |
| `getMyRegistration` | `eventId, userId` | `IRegistration` | Retourne inscription + populate eventId |
| `checkinByQR` | `eventId, qrCode, organizerId` | `IRegistration` | Verification ownership. Cherche Registration par qrCode. 409 si deja check-in. Met a jour checkedIn, checkedInAt, status `CHECKED_IN` |
| `getEventParticipants` | `eventId, organizerId, page, limit` | `{ participants, total }` | Verification ownership. Inscriptions non annulees. Populate userId avec email |
| `getUserRegistrations` | `userId, page, limit` | `{ registrations, total }` | Inscriptions non annulees. Populate eventId + event.organizerId |

**Logique de `registerForEvent` :**

1. Verifie que l'evenement existe (404)
2. Verifie que le status est `UPCOMING` (400)
3. Verifie que la date n'est pas passee (400)
4. Verifie qu'il n'y a pas deja une inscription active (409), sauf si l'inscription precedente est `CANCELLED` (re-inscription autorisee avec regeneration du QR code)
5. Verifie que la capacite n'est pas atteinte (400)
6. Genere un QR code via UUID v4
7. Cree l'inscription et incremente `registeredCount` atomiquement via `$inc`
8. Envoie un email de confirmation d'inscription

**Logique de `cancelEvent` :**

1. Verifie l'ownership de l'evenement
2. Verifie que l'evenement n'est pas deja annule
3. Met le status a `CANCELLED`
4. Recupere toutes les inscriptions avec status `REGISTERED`
5. Annule toutes les inscriptions (status `CANCELLED`)
6. Envoie un email de notification a chaque participant inscrit

### 5.4 AuditService (`services/audit.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `logAction` | `adminId, action, targetType, targetId, details?, ipAddress?` | `IAuditLog` | Cree un enregistrement d'audit |
| `getAuditLogs` | `filters, page?, limit?` | `{ logs, total }` | Filtres : action (!= 'all'), adminId, targetType. Tri `createdAt` desc. Populate adminId |

**Interface des filtres :**

```typescript
interface AuditLogFilters {
  action?: string;    // Filtrage par type d'action (valeur 'all' ignoree)
  adminId?: string;   // Filtrage par administrateur
  targetType?: string; // Filtrage par type de cible
}
```

**Logique de filtrage :**

Les filtres sont appliques conditionnellement : seuls les champs fournis et non vides sont inclus dans la requete MongoDB. La valeur `'all'` pour le filtre `action` est explicitement ignoree pour permettre un comportement "tous les types" cote frontend.

---

## 6. Controllers et validation Zod

Tous les controllers suivent le pattern etabli aux Sprints precedents : schemas Zod definis en haut du fichier, handlers wrapes dans `asyncHandler()`, validation inline via `schema.parse(req.body)`, reponses au format `ApiResponse`.

### 6.1 MatchingController (`controllers/matching.controller.ts`)

Pas de schemas Zod. Les parametres sont parses depuis query et params.

**Handlers :**

| Handler | HTTP | Route | Validation | Status |
|---|---|---|---|---|
| `getRecommendations` | GET | `/matching/recommendations` | query.limit (parseInt, default 10) | 200 |
| `getMatchScore` | GET | `/matching/score/:opportunityId` | params.opportunityId | 200 |

### 6.2 EventController (`controllers/event.controller.ts`)

**Schemas Zod :**

```typescript
const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: z.nativeEnum(EventType),
  location: z.string().min(1),
  date: z.string().refine(val => !isNaN(Date.parse(val)), 'Invalid date'),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  capacity: z.number().int().min(1),
  isOnline: z.boolean().optional(),
  meetingUrl: z.string().url().optional(),
  image: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

const checkinSchema = z.object({
  qrCode: z.string().min(1),
});
```

**Handlers :**

| Handler | HTTP | Route | Validation | Status |
|---|---|---|---|---|
| `createEvent` | POST | `/events` | `createEventSchema` (body) | 201 |
| `updateEvent` | PATCH | `/events/:eventId` | `updateEventSchema` (body) | 200 |
| `cancelEvent` | PATCH | `/events/:eventId/cancel` | -- | 200 |
| `deleteEvent` | DELETE | `/events/:eventId` | -- | 200 |
| `getEvent` | GET | `/events/:eventId` | -- | 200 |
| `listEvents` | GET | `/events` | query params | 200 |
| `getOrganizerEvents` | GET | `/events/organizer/mine` | query params | 200 |
| `registerForEvent` | POST | `/events/:eventId/register` | -- | 201 |
| `cancelRegistration` | DELETE | `/events/:eventId/register` | -- | 200 |
| `getMyRegistration` | GET | `/events/:eventId/my-registration` | -- | 200 |
| `checkin` | POST | `/events/:eventId/checkin` | `checkinSchema` (body) | 200 |
| `getEventParticipants` | GET | `/events/:eventId/participants` | query params | 200 |
| `getUserRegistrations` | GET | `/events/registrations/mine` | query params | 200 |
| `uploadEventImage` | POST | `/events/upload-image` | req.file required | 200 |

**Pagination :**

Les handlers de liste retournent un objet `pagination` standardise :

```typescript
pagination: {
  page: number,
  limit: number,
  total: number,
  totalPages: number,   // Math.ceil(total / limit)
}
```

---

## 7. Routes

### 7.1 Matching Routes (`routes/matching.routes.ts`)

**Prefixe** : `/api/matching`

```
GET    /recommendations       → authenticate → authorize(STUDENT) → getRecommendations
GET    /score/:opportunityId  → authenticate → authorize(STUDENT) → getMatchScore
```

Toutes les routes sont authentifiees et reservees aux etudiants (`authorize(STUDENT)`).

### 7.2 Event Routes (`routes/event.routes.ts`)

**Prefixe** : `/api/events`

```
GET    /                          → listEvents                    (public)
GET    /registrations/mine        → authenticate → getUserRegistrations
POST   /                          → authenticate → authorize(RECRUITER) → createEvent
POST   /upload-image              → authenticate → authorize(RECRUITER) → uploadEventImage(multer) → uploadEventImage
GET    /organizer/mine            → authenticate → authorize(RECRUITER) → getOrganizerEvents
GET    /:eventId                  → getEvent                      (public)
PATCH  /:eventId                  → authenticate → authorize(RECRUITER) → updateEvent
PATCH  /:eventId/cancel           → authenticate → authorize(RECRUITER) → cancelEvent
DELETE /:eventId                  → authenticate → authorize(RECRUITER) → deleteEvent
POST   /:eventId/register         → authenticate → registerForEvent
DELETE /:eventId/register         → authenticate → cancelRegistration
GET    /:eventId/my-registration  → authenticate → getMyRegistration
POST   /:eventId/checkin          → authenticate → authorize(RECRUITER) → checkin
GET    /:eventId/participants     → authenticate → authorize(RECRUITER) → getEventParticipants
```

**Important** : Les routes statiques (`/registrations/mine`, `/organizer/mine`, `/upload-image`) sont placees AVANT `/:eventId` pour eviter qu'Express ne les traite comme des parametres.

### 7.3 Admin Routes (`routes/admin.routes.ts`)

**Prefixe** : `/api/admin`

Les routes admin sont preparees dans ce Sprint pour le Sprint 4. Le routeur est monte dans `app.ts`.

---

## 8. Notifications email

Fichier : `backend/src/services/email.service.ts`

Quatre nouvelles methodes ajoutees, suivant le pattern existant (HTML inline, preview URL en dev, transporter via Ethereal en dev) :

### 8.1 sendEventRegistrationConfirmation

```typescript
sendEventRegistrationConfirmation(
  email: string,
  firstName: string,
  eventTitle: string,
  eventDate: string,
  qrCode: string
): Promise<void>
```

Notifie le participant de son inscription a un evenement. Inclut les details de l'evenement et le QR code pour le check-in.

### 8.2 sendEventCancellationNotification

```typescript
sendEventCancellationNotification(
  email: string,
  firstName: string,
  eventTitle: string
): Promise<void>
```

Notifie chaque participant inscrit de l'annulation d'un evenement par l'organisateur.

### 8.3 sendEventValidationNotification

```typescript
sendEventValidationNotification(
  email: string,
  firstName: string,
  eventTitle: string,
  status: string,
  reason?: string
): Promise<void>
```

Notifie l'organisateur de l'approbation ou du rejet de son evenement par l'administration. Affiche le statut avec un code couleur. Inclut la raison du rejet si applicable.

### 8.4 sendOpportunityValidationNotification

```typescript
sendOpportunityValidationNotification(
  email: string,
  firstName: string,
  opportunityTitle: string,
  status: string,
  reason?: string
): Promise<void>
```

Notifie le recruteur de l'approbation ou du rejet de son opportunite par l'administration. Affiche le statut avec un code couleur (`#10B981` pour approuve, `#EF4444` pour rejete). Inclut la raison du rejet si applicable.

Tous les emails utilisent le branding ForMinds (indigo `#4F46E5`, Arial, max-width 600px). Pattern d'echec silencieux (`try/catch` avec `console.error`).

---

## 9. Montage dans app.ts

Fichier : `backend/src/app.ts`

Deux nouveaux routeurs montes apres les routeurs des Sprints precedents :

```typescript
import eventRoutes from './routes/event.routes';
import matchingRoutes from './routes/matching.routes';

// Dans la section routes
app.use('/api/events', eventRoutes);
app.use('/api/matching', matchingRoutes);
```

**Ordre de montage complet :**

| # | Prefixe | Routeur |
|---|---|---|
| 1 | `/api/health` | healthRoutes |
| 2 | `/api/auth` | authRoutes |
| 3 | `/api/profiles` | profileRoutes |
| 4 | `/api/users` | userRoutes |
| 5 | `/api/connections` | connectionRoutes |
| 6 | `/api/opportunities` | opportunityRoutes |
| 7 | `/api/applications` | applicationRoutes |
| 8 | `/api/profiles/directory` | directoryRoutes |
| 9 | `/api/posts` | postRoutes |
| 10 | `/api/admin` | adminRoutes |
| 11 | `/api/events` | eventRoutes |
| 12 | `/api/matching` | matchingRoutes |

**Extension du middleware upload :**

Ajout de `eventImageStorage` (repertoire `events/`) et du middleware `uploadEventImage` (5MB, images uniquement) dans `backend/src/middleware/upload.ts`.

---

## 10. Recapitulatif des endpoints API

### 10.1 Matching (`/api/matching`) -- 2 endpoints

| # | Methode | Route | Auth | Role | Description |
|---|---|---|---|---|---|
| 1 | GET | `/recommendations` | Oui | Student | Obtenir les recommandations personnalisees |
| 2 | GET | `/score/:opportunityId` | Oui | Student | Obtenir le score detaille pour une opportunite |

### 10.2 Events (`/api/events`) -- 14 endpoints

| # | Methode | Route | Auth | Role | Description |
|---|---|---|---|---|---|
| 1 | GET | `/` | Non | -- | Lister les evenements |
| 2 | POST | `/` | Oui | Recruiter | Creer un evenement |
| 3 | POST | `/upload-image` | Oui | Recruiter | Upload image d'evenement |
| 4 | GET | `/organizer/mine` | Oui | Recruiter | Mes evenements organises |
| 5 | GET | `/registrations/mine` | Oui | -- | Mes inscriptions |
| 6 | GET | `/:eventId` | Non | -- | Detail d'un evenement |
| 7 | PATCH | `/:eventId` | Oui | Recruiter | Modifier un evenement |
| 8 | PATCH | `/:eventId/cancel` | Oui | Recruiter | Annuler un evenement |
| 9 | DELETE | `/:eventId` | Oui | Recruiter | Supprimer un evenement |
| 10 | POST | `/:eventId/register` | Oui | -- | S'inscrire a un evenement |
| 11 | DELETE | `/:eventId/register` | Oui | -- | Annuler son inscription |
| 12 | GET | `/:eventId/my-registration` | Oui | -- | Mon inscription a un evenement |
| 13 | POST | `/:eventId/checkin` | Oui | Recruiter | Check-in QR code |
| 14 | GET | `/:eventId/participants` | Oui | Recruiter | Liste des participants |

### Total Sprint 3 : 16 nouveaux endpoints

---

## 11. Index MongoDB

Resume de tous les index crees par les modeles Sprint 3 :

### 11.1 Event

| Collection | Index | Type | Objectif |
|---|---|---|---|
| `events` | `{ organizerId: 1 }` | Simple | Requetes par organisateur |
| `events` | `{ status: 1, date: 1 }` | Compose | Filtrage par statut et tri par date |
| `events` | `{ date: 1 }` | Simple | Tri/filtrage par date |
| `events` | `{ type: 1 }` | Simple | Filtrage par type |

### 11.2 Registration

| Collection | Index | Type | Objectif |
|---|---|---|---|
| `registrations` | `{ eventId: 1, userId: 1 }` | Unique compose | Empecher les inscriptions dupliquees |
| `registrations` | `{ eventId: 1, status: 1 }` | Compose | Requetes par evenement et statut |
| `registrations` | `{ qrCode: 1 }` | Unique | Lookup rapide pour check-in QR |
| `registrations` | `{ userId: 1 }` | Simple | Requetes par utilisateur |

### 11.3 AuditLog

| Collection | Index | Type | Objectif |
|---|---|---|---|
| `auditlogs` | `{ adminId: 1 }` | Simple | Logs par administrateur |
| `auditlogs` | `{ action: 1 }` | Simple | Filtrage par type d'action |
| `auditlogs` | `{ createdAt: -1 }` | Desc (-1) | Tri chronologique inverse |
| `auditlogs` | `{ targetType: 1, targetId: 1 }` | Compose | Historique d'audit d'une entite |

**Total : 12 index** (dont 2 uniques)

---

## 12. Gestion des erreurs

Les erreurs metier sont gerees via `AppError` avec des codes HTTP semantiques :

### 12.1 Matching

| Code HTTP | Message | Condition |
|---|---|---|
| `400` | Please complete your profile to get recommendations | Profil non trouve ou skills vide |
| `404` | Opportunity not found | Opportunite inexistante |
| `503` | AI service unavailable | Service IA indisponible (bascule automatique sur fallback) |

### 12.2 Events

| Code HTTP | Message | Condition |
|---|---|---|
| `400` | Event is not open for registration | Status !== `UPCOMING` |
| `400` | Event has already passed | Date passee |
| `400` | Event is full | registeredCount >= capacity |
| `400` | Cannot update a cancelled event | Tentative de modifier un evenement annule |
| `400` | Registration already cancelled | Inscription deja annulee |
| `400` | Cannot cancel registration after check-in | Tentative d'annuler apres check-in |
| `400` | Can only delete cancelled events | Tentative de supprimer un evenement non annule |
| `400` | Validation errors | Donnees invalides (Zod) |
| `403` | Forbidden / Not the organizer | Pas proprietaire de l'evenement |
| `404` | Event not found | Evenement inexistant |
| `404` | Registration not found | Inscription inexistante |
| `404` | Invalid QR code | QR code ne correspond a aucune inscription |
| `409` | Already registered for this event | Inscription dupliquee |
| `409` | Already checked in | Participant deja presente |

Les erreurs Zod (`ZodError`) sont interceptees par le `errorHandler` global existant et formatees en reponse `ApiResponse` avec le detail des champs invalides.

---

## 13. Patterns transversaux

### 13.1 Format de reponse API

Toutes les reponses suivent l'interface `ApiResponse<T>` :

```typescript
{
  success: boolean;
  message: string;
  data?: {
    [entity]: T;           // Ex: { recommendations }, { event }, { registration }
    pagination?: {         // Present sur les listes
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### 13.2 Pagination

Toutes les listes supportent la pagination via query params `page` (defaut: 1) et `limit` (defaut: 20 pour events, 50 pour audit). Le calcul se fait via :

```typescript
const skip = (page - 1) * limit;
const totalPages = Math.ceil(total / limit);
```

### 13.3 Verification de propriete (Ownership)

Toutes les operations de modification, annulation et suppression d'evenements verifient que l'organisateur est le proprietaire de l'evenement :

```typescript
if (event.organizerId.toString() !== organizerId) {
  throw new AppError('Forbidden', 403);
}
```

Ce pattern s'applique aux methodes `updateEvent`, `cancelEvent`, `deleteEvent`, `checkinByQR` et `getEventParticipants`.

### 13.4 Fallback IA

Si le service FastAPI est indisponible, le calcul de matching bascule automatiquement sur un algorithme deterministe base sur :

- **Intersection des skills** : pourcentage de skills communs entre le profil et l'opportunite
- **Correspondance de localisation** : match exact (100%) ou non (0%)
- **Score de domaine** : valeur fixe de 50%

Formule pour `calculateBasicMatches` : `skills * 0.5 + location * 0.25 + domain * 0.25`
Formule pour `calculateBasicScore` : `skills * 0.4 + location * 0.2 + domain * 0.2 + experience * 0.2`

### 13.5 QR Code

Le QR code est genere via UUID v4 lors de l'inscription (`registerForEvent`). Chaque inscription possede un QR code unique, utilise pour le check-in par l'organisateur via la methode `checkinByQR`.

### 13.6 Re-inscription

Si un utilisateur a annule son inscription a un evenement, il peut se re-inscrire. Lors de la re-inscription :

- Le QR code est regenere (nouveau UUID v4)
- Le status repasse a `REGISTERED`
- Le compteur `registeredCount` est incremente

### 13.7 Suppression en cascade

La suppression d'un evenement (`deleteEvent`) supprime toutes les `Registration` associees avant de supprimer l'`Event` :

```
deleteEvent(eventId) →
  Registration.deleteMany({ eventId })
  Event.findByIdAndDelete(eventId)
```

L'annulation d'un evenement (`cancelEvent`) annule toutes les inscriptions actives et notifie chaque participant par email.

### 13.8 Emails silencieux

Les envois d'emails sont encapsules dans `try/catch`. Les echecs sont loggues (`console.error`) sans bloquer la reponse API :

```typescript
try {
  await emailService.sendEventRegistrationConfirmation(...);
} catch {
  console.error('[Event] Failed to send registration confirmation email');
}
```

### 13.9 Compteurs atomiques

Le champ `registeredCount` est incremente et decremente via l'operateur MongoDB `$inc` pour eviter les conditions de concurrence :

```typescript
await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
```

### 13.10 Routes statiques vs parametrees

Les routes statiques (`/registrations/mine`, `/organizer/mine`, `/upload-image`) sont declarees avant `/:eventId` dans le fichier de routes pour eviter les conflits de parametres Express. Sans cet ordre, Express interpreterait `registrations` ou `organizer` comme une valeur du parametre `:eventId`.

---

*Documentation generee pour le Sprint 3 Backend de la plateforme ForMinds.*
