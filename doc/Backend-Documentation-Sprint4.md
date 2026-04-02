# ForMinds - Backend Documentation Sprint 4 (BF-007: Administration & Governance)

## ForMinds -- Plateforme Web de Mise en Relation Etudiants-Recruteurs

**Version** : 4.0
**Date** : 09 mars 2026
**Sprint** : Sprint 4 -- BF-007 (Administration & Gouvernance)

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet (ajouts Sprint 4)](#2-structure-du-projet-ajouts-sprint-4)
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

Le Sprint 4 etend le backend ForMinds avec le module d'administration et de gouvernance de la plateforme :

| Bloc fonctionnel | Perimetre Sprint 4 |
|---|---|
| **BF-007** -- Administration & Gouvernance | Dashboard admin avec KPIs, validation des opportunites (approbation/rejet), verification des recruteurs, gestion des utilisateurs (suspension/reactivation avec raisons), journal d'audit pour toutes les actions administratives, notifications email pour les actions d'administration |

### Resume quantitatif

| Element | Quantite |
|---|---|
| Nouveaux modeles Mongoose | 1 |
| Modeles etendus | 1 |
| Nouveaux services | 2 |
| Nouveaux controllers | 1 |
| Nouveaux fichiers de routes | 1 |
| Nouveaux enums | 1 |
| Nouvelles methodes email | 4 |
| Fichiers existants modifies | 4 |
| Nouveaux endpoints API | 9 |
| **Total nouveaux fichiers** | **5** |

### Architecture maintenue

L'architecture reste identique aux Sprints precedents : **Routes -> Controllers -> Services -> Models** avec middlewares transversaux (`authenticate`, `authorize`, `errorHandler`). Toutes les routes du module administration necessitent le role `admin`.

---

## 2. Structure du projet (ajouts Sprint 4)

```
backend/src/
├── models/
│   ├── AuditLog.ts              ← NOUVEAU
│   └── Opportunity.ts           ← MODIFIE (+3 champs : reviewedBy, reviewedAt, rejectionReason)
│
├── services/
│   ├── admin.service.ts         ← NOUVEAU
│   ├── audit.service.ts         ← NOUVEAU
│   └── email.service.ts         ← MODIFIE (+4 methodes)
│
├── controllers/
│   ├── admin.controller.ts      ← NOUVEAU
│   └── user.controller.ts       ← MODIFIE (enrichi avec filtres et audit)
│
├── routes/
│   ├── admin.routes.ts          ← NOUVEAU
│   └── user.routes.ts           ← MODIFIE (routes admin-only)
│
├── utils/
│   └── constants.ts             ← MODIFIE (+1 enum AuditAction)
│
└── app.ts                       ← MODIFIE (+1 routeur admin)
```

---

## 3. Enums et constantes

Fichier : `backend/src/utils/constants.ts`

Un nouvel enum ajoute apres les constantes existantes :

### 3.1 AuditAction

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

Cet enum est utilise par le modele `AuditLog` et le service `audit.service.ts` pour typer les actions tracees dans le journal d'audit administratif. Les actions `EVENT_APPROVED` et `EVENT_REJECTED` ont ete ajoutees pour tracer la validation des evenements par les administrateurs.

---

## 4. Modeles de donnees (Mongoose)

### 4.1 AuditLog (`models/AuditLog.ts`) -- NOUVEAU

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

Le modele n'enregistre que le `createdAt` (pas de `updatedAt`), car les logs d'audit sont immuables et ne sont jamais modifies apres creation.

**Indexes :**

| Index | Objectif |
|---|---|
| `{ adminId: 1 }` | Requetes par administrateur |
| `{ action: 1 }` | Filtrage par type d'action |
| `{ createdAt: -1 }` | Tri chronologique descendant |
| `{ targetType: 1, targetId: 1 }` | Recherche par cible |

### 4.2 Opportunity (`models/Opportunity.ts`) -- MODIFIE

Trois nouveaux champs ajoutes au modele Opportunity existant pour supporter la validation administrative :

**Champs ajoutes a l'interface :**

```typescript
reviewedBy?: mongoose.Types.ObjectId;
reviewedAt?: Date;
rejectionReason?: string;
```

**Champs ajoutes au schema :**

| Champ | Type | Contraintes |
|---|---|---|
| `reviewedBy` | `ObjectId` ref `User` | optionnel |
| `reviewedAt` | `Date` | optionnel |
| `rejectionReason` | `String` | optionnel, trim, maxlength: 1000 |

Ces champs sont remplis par le service `admin.service.ts` lors de la validation (approbation ou rejet) d'une opportunite par un administrateur. `reviewedBy` reference l'admin ayant effectue la revue, `reviewedAt` enregistre la date de la decision, et `rejectionReason` stocke la raison du rejet le cas echeant.

---

## 5. Services (logique metier)

Tous les services suivent le pattern etabli aux Sprints precedents : fonctions asynchrones exportees nommees, types de retour `Promise<T>`, erreurs via `AppError`.

### 5.1 AuditService (`services/audit.service.ts`)

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `logAction` | `adminId, action, targetType, targetId, details?, ipAddress?` | `IAuditLog` | Cree une entree dans le journal d'audit. Enregistre l'admin, l'action, la cible, les details optionnels et l'adresse IP. |
| `getAuditLogs` | `filters, page?, limit?` | `{ logs, total }` | Liste les logs d'audit avec filtres optionnels. Populate `adminId` (firstName, lastName, username). Tri `createdAt` descendant. Pagination (defaut: 50 par page). |

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

### 5.2 AdminService (`services/admin.service.ts`)

**Interface DashboardStats :**

```typescript
export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalRecruiters: number;
  suspendedUsers: number;
  pendingOpportunities: number;
  approvedOpportunities: number;
  rejectedOpportunities: number;
  pendingEvents: number;
  totalApplications: number;
  newUsersLast30Days: number;
}
```

| Methode | Parametres | Retour | Description |
|---|---|---|---|
| `getStats` | -- | `DashboardStats` | Calcule 10 KPIs via `Promise.all` de `countDocuments`. Inclut les nouveaux utilisateurs des 30 derniers jours et les evenements en attente. |
| `getPendingOpportunities` | `page?, limit?` | `{ opportunities, total }` | Liste les opportunites en status `pending`. Populate `recruiterId` (firstName, lastName, username, avatar). Tri `createdAt` ascendant (les plus anciennes d'abord). |
| `validateOpportunity` | `opportunityId, adminId, status, rejectionReason?, ipAddress?` | `IOpportunity` | Approuve ou rejette une opportunite. Verifie que l'opportunite est en status `pending`. Met a jour `status`, `reviewedBy`, `reviewedAt`, `rejectionReason`. Cree une entree audit. Envoie un email de notification au recruteur. |
| `getPendingEvents` | `page?, limit?` | `{ events, total }` | Liste les evenements en status `pending`. Populate `organizerId` (firstName, lastName, username, avatar). Tri `createdAt` ascendant. |
| `validateEvent` | `eventId, adminId, status, rejectionReason?, ipAddress?` | `IEvent` | Approuve ou rejette un evenement. Met a jour le status (`upcoming` si approuve, `cancelled` si rejete). Cree une entree audit (`EVENT_APPROVED` ou `EVENT_REJECTED`). Envoie un email de notification a l'organisateur. |
| `getUnverifiedRecruiters` | `page?, limit?` | `{ recruiters, total }` | Liste les profils recruteurs non verifies (`isVerified: false`). Populate `userId` (firstName, lastName, email, avatar, createdAt). Tri `createdAt` ascendant. |
| `verifyRecruiter` | `userId, adminId, ipAddress?` | `RecruiterProfile` | Verifie un profil recruteur. Verifie que le profil existe et n'est pas deja verifie. Met `isVerified` a `true`. Cree une entree audit. Envoie un email de notification au recruteur. |
| `updateUserStatus` | `userId, adminId, isActive, reason?, ipAddress?` | `IUser` | Suspend ou reactive un utilisateur. Interdit la modification d'un compte admin (`role === 'admin'` -> erreur 403). Met a jour `isActive`. Cree une entree audit. Envoie un email de suspension ou de reactivation. |

**Detail de `getStats` -- 10 compteurs executes en parallele :**

```
Promise.all([
  User.countDocuments()                                        → totalUsers
  User.countDocuments({ role: 'student' })                     → totalStudents
  User.countDocuments({ role: 'recruiter' })                   → totalRecruiters
  User.countDocuments({ isActive: false })                     → suspendedUsers
  Opportunity.countDocuments({ status: 'pending' })            → pendingOpportunities
  Opportunity.countDocuments({ status: 'approved' })           → approvedOpportunities
  Opportunity.countDocuments({ status: 'rejected' })           → rejectedOpportunities
  Event.countDocuments({ status: 'pending' })                  → pendingEvents
  Application.countDocuments()                                 → totalApplications
  User.countDocuments({ createdAt: { $gte: 30 jours } })      → newUsersLast30Days
])
```

**Logique de `validateOpportunity` :**

1. Recherche de l'opportunite par ID
2. Verification que le status est `pending` (sinon erreur 400 : "Opportunity has already been processed")
3. Mise a jour du status (`approved` ou `rejected`)
4. Enregistrement de `reviewedBy` (ObjectId de l'admin) et `reviewedAt` (date courante)
5. Si rejet avec raison, enregistrement de `rejectionReason`
6. Sauvegarde de l'opportunite
7. Creation d'une entree audit (`OPPORTUNITY_APPROVED` ou `OPPORTUNITY_REJECTED`)
8. Envoi d'un email de notification au recruteur (echec silencieux)

**Logique de `validateEvent` :**

1. Recherche de l'evenement par ID
2. Verification que le status est `pending` (sinon erreur 400 : "Event has already been processed")
3. Mise a jour du status (`upcoming` si approuve, `cancelled` si rejete)
4. Sauvegarde de l'evenement
5. Creation d'une entree audit (`EVENT_APPROVED` ou `EVENT_REJECTED`)
6. Envoi d'un email de notification a l'organisateur (echec silencieux)

**Logique de `updateUserStatus` :**

1. Recherche de l'utilisateur par ID
2. Verification que l'utilisateur n'est pas un admin (sinon erreur 403 : "Cannot modify an admin account")
3. Mise a jour de `isActive`
4. Creation d'une entree audit (`USER_SUSPENDED` ou `USER_REACTIVATED`)
5. Envoi d'un email de suspension (avec raison) ou de reactivation (echec silencieux)

**Note importante sur les evenements :**

L'administrateur n'a **pas** acces aux operations CRUD sur les evenements. Son role est uniquement d'approuver ou rejeter les evenements crees par les recruteurs. Les routes de creation, modification, annulation et check-in d'evenements sont reservees aux recruteurs (`UserRole.RECRUITER`).

---

## 6. Controllers et validation Zod

Tous les controllers suivent le pattern etabli aux Sprints precedents : schemas Zod definis en haut du fichier, handlers wrapes dans `asyncHandler()`, validation inline via `schema.parse(req.body)`, reponses au format `ApiResponse`.

### 6.1 AdminController (`controllers/admin.controller.ts`)

**Schema Zod :**

```typescript
const validateOpportunitySchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(1000).optional(),
});
```

**Handlers :**

| Handler | HTTP | Route | Validation | Status |
|---|---|---|---|---|
| `getStats` | GET | `/stats` | -- | 200 |
| `getPendingOpportunities` | GET | `/opportunities` | query: page, limit | 200 |
| `validateOpportunity` | PATCH | `/opportunities/:opportunityId` | `validateOpportunitySchema` (body) | 200 |
| `getUnverifiedRecruiters` | GET | `/recruiters` | query: page, limit | 200 |
| `verifyRecruiter` | PATCH | `/recruiters/:userId/verify` | params: userId | 200 |
| `getAuditLogs` | GET | `/audit-log` | query: action, adminId, targetType, page, limit | 200 |

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

**Limites de pagination :**

Les valeurs de `page` et `limit` sont bornees dans le controller :
- `page` : minimum 1 (`Math.max(1, ...)`)
- `limit` : minimum 1, maximum 100 (`Math.min(100, Math.max(1, ...))`)
- `limit` par defaut : 20 pour les opportunites et recruteurs, 50 pour les logs d'audit

**Capture de l'adresse IP :**

Les handlers qui declenchent des actions auditees recuperent l'adresse IP du client :

```typescript
const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
```

### 6.2 UserController (`controllers/user.controller.ts`) -- MODIFIE

**Handlers :**

| Handler | HTTP | Route | Validation | Status |
|---|---|---|---|---|
| `listUsers` | GET | `/` | query: role, status, search, page, limit | 200 |
| `getUserById` | GET | `/:id` | params: id | 200 |
| `updateUserStatus` | PATCH | `/:id/status` | body: isActive (boolean), reason? (string) | 200 |

**Filtrage dynamique de `listUsers` :**

Le handler construit une requete MongoDB dynamique a partir des query params :

| Query param | Filtre MongoDB | Description |
|---|---|---|
| `role` | `{ role: value }` | Filtrage exact par role (student, recruiter, admin) |
| `status=active` | `{ isActive: true }` | Utilisateurs actifs uniquement |
| `status=suspended` | `{ isActive: false }` | Utilisateurs suspendus uniquement |
| `search` | `{ $or: [...] }` | Recherche regex case-insensitive sur firstName, lastName, email, username |

**Logique de `updateUserStatus` :**

Le handler supporte deux modes de fonctionnement :

1. **Mode explicite** (Sprint 4) : Si `isActive` est un booleen dans le body, utilise `adminService.updateUserStatus()` avec journal d'audit, email de notification et protection anti-modification des admins.
2. **Mode toggle** (retrocompatibilite) : Si `isActive` n'est pas fourni, inverse le statut `isActive` de l'utilisateur directement (sans audit ni email).

---

## 7. Routes

### 7.1 Admin Routes (`routes/admin.routes.ts`)

**Prefixe** : `/api/admin`

```
GET    /stats                          → authenticate → authorize(ADMIN) → getStats
GET    /opportunities                  → authenticate → authorize(ADMIN) → getPendingOpportunities
PATCH  /opportunities/:opportunityId   → authenticate → authorize(ADMIN) → validateOpportunity
GET    /events                         → authenticate → authorize(ADMIN) → getPendingEvents
PATCH  /events/:eventId                → authenticate → authorize(ADMIN) → validateEvent
GET    /recruiters                     → authenticate → authorize(ADMIN) → getUnverifiedRecruiters
PATCH  /recruiters/:userId/verify      → authenticate → authorize(ADMIN) → verifyRecruiter
GET    /audit-log                      → authenticate → authorize(ADMIN) → getAuditLogs
```

**Toutes les routes requierent `authenticate` + `authorize(ADMIN)`.**

### 7.2 User Routes (`routes/user.routes.ts`) -- MODIFIE

**Prefixe** : `/api/users`

```
GET    /                               → authenticate → authorize(ADMIN) → listUsers
GET    /:id                            → authenticate → authorize(ADMIN) → getUserById
PATCH  /:id/status                     → authenticate → authorize(ADMIN) → updateUserStatus
```

**Toutes les routes requierent `authenticate` + `authorize(ADMIN)`.**

### 7.3 Event Routes (`routes/event.routes.ts`) -- MODIFIE

**Note importante** : Les routes de gestion des evenements sont reservees aux **recruteurs uniquement**. L'administrateur n'a pas acces aux operations CRUD sur les evenements.

```
POST   /                               → authenticate → authorize(RECRUITER) → createEvent
POST   /upload-image                   → authenticate → authorize(RECRUITER) → uploadEventImage
GET    /organizer/mine                 → authenticate → authorize(RECRUITER) → getOrganizerEvents
PATCH  /:eventId                       → authenticate → authorize(RECRUITER) → updateEvent
PATCH  /:eventId/cancel                → authenticate → authorize(RECRUITER) → cancelEvent
POST   /:eventId/checkin               → authenticate → authorize(RECRUITER) → checkin
GET    /:eventId/participants          → authenticate → authorize(RECRUITER) → getEventParticipants
```

L'administrateur peut uniquement approuver ou rejeter les evenements via les routes `/api/admin/events`.

---

## 8. Notifications email

Fichier : `backend/src/services/email.service.ts`

Quatre nouvelles methodes ajoutees, suivant le pattern existant (HTML inline, preview URL en dev, transporter via Ethereal en dev) :

### 8.1 sendOpportunityValidationNotification

```typescript
sendOpportunityValidationNotification(
  email: string,
  firstName: string,
  opportunityTitle: string,
  status: string,
  reason?: string
): Promise<void>
```

Notifie le recruteur de l'approbation ou du rejet de son opportunite. Affiche le statut avec un code couleur (`#10B981` pour approuve, `#EF4444` pour rejete). Inclut la raison du rejet si applicable. Inclut un bouton CTA vers `/opportunities/mine`.

### 8.2 sendRecruiterVerificationNotification

```typescript
sendRecruiterVerificationNotification(
  email: string,
  firstName: string
): Promise<void>
```

Notifie le recruteur que son compte a ete verifie par l'equipe d'administration. Indique qu'il peut desormais publier des opportunites et se connecter avec les etudiants. Inclut un bouton CTA vers `/opportunities/create`.

### 8.3 sendAccountSuspensionNotification

```typescript
sendAccountSuspensionNotification(
  email: string,
  firstName: string,
  reason: string
): Promise<void>
```

Notifie l'utilisateur que son compte a ete suspendu par un administrateur. Inclut la raison de la suspension. Invite l'utilisateur a contacter le support s'il estime que c'est une erreur.

### 8.4 sendAccountReactivationNotification

```typescript
sendAccountReactivationNotification(
  email: string,
  firstName: string
): Promise<void>
```

Notifie l'utilisateur que son compte a ete reactive. Indique qu'il peut a nouveau se connecter et utiliser la plateforme. Inclut un bouton CTA vers `/login`.

---

## 9. Montage dans app.ts

Fichier : `backend/src/app.ts`

Un nouveau routeur monte apres les routeurs des Sprints precedents :

```typescript
import adminRoutes from './routes/admin.routes';

// Dans la section routes
app.use('/api/admin', adminRoutes);
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

---

## 10. Recapitulatif des endpoints API

### 10.1 Admin (`/api/admin`) -- 8 endpoints

| # | Methode | Route | Auth | Role | Description |
|---|---|---|---|---|---|
| 1 | GET | `/stats` | Oui | Admin | Obtenir les KPIs du dashboard (inclut `pendingEvents`) |
| 2 | GET | `/opportunities` | Oui | Admin | Lister les opportunites en attente de validation |
| 3 | PATCH | `/opportunities/:opportunityId` | Oui | Admin | Approuver ou rejeter une opportunite |
| 4 | GET | `/events` | Oui | Admin | Lister les evenements en attente de validation |
| 5 | PATCH | `/events/:eventId` | Oui | Admin | Approuver ou rejeter un evenement |
| 6 | GET | `/recruiters` | Oui | Admin | Lister les recruteurs non verifies |
| 7 | PATCH | `/recruiters/:userId/verify` | Oui | Admin | Verifier un recruteur |
| 8 | GET | `/audit-log` | Oui | Admin | Consulter le journal d'audit |

### 10.2 Users (`/api/users`) -- 3 endpoints

| # | Methode | Route | Auth | Role | Description |
|---|---|---|---|---|---|
| 1 | GET | `/` | Oui | Admin | Lister les utilisateurs avec filtres (role, status, search) |
| 2 | GET | `/:id` | Oui | Admin | Voir le detail d'un utilisateur |
| 3 | PATCH | `/:id/status` | Oui | Admin | Suspendre ou reactiver un utilisateur |

### Total Sprint 4 : 11 nouveaux endpoints

---

## 11. Index MongoDB

Resume de tous les index crees par les modeles Sprint 4 :

| Collection | Index | Type | Objectif |
|---|---|---|---|
| `auditlogs` | `{ adminId: 1 }` | Simple | Requetes par administrateur |
| `auditlogs` | `{ action: 1 }` | Simple | Filtrage par type d'action |
| `auditlogs` | `{ createdAt: -1 }` | Desc (-1) | Tri chronologique descendant |
| `auditlogs` | `{ targetType: 1, targetId: 1 }` | Compose | Recherche par cible |

**Total : 4 index**

**Note** : Le modele Opportunity n'ajoute pas de nouveaux index dans le Sprint 4. Les nouveaux champs (`reviewedBy`, `reviewedAt`, `rejectionReason`) ne necessitent pas d'index supplementaires car ils sont accedes uniquement lors de la lecture du document individuel.

---

## 12. Gestion des erreurs

Les erreurs metier sont gerees via `AppError` avec des codes HTTP semantiques :

| Code HTTP | Utilisation |
|---|---|
| `400` | Operation invalide (ex: opportunite deja traitee -- "Opportunity has already been processed", recruteur deja verifie -- "Recruiter is already verified") |
| `401` | Authentification requise (`req.user` manquant) |
| `403` | Autorisation refusee (ex: tentative de modifier un compte admin -- "Cannot modify an admin account", role non admin) |
| `404` | Ressource introuvable (ex: opportunite, profil recruteur, utilisateur) |

Les erreurs Zod (`ZodError`) sont interceptees par le `errorHandler` global existant et formatees en reponse `ApiResponse` avec le detail des champs invalides.

**Echec silencieux des emails :**

Les envois d'emails de notification dans le service admin sont enveloppes dans un `try/catch` avec un `console.error`. L'echec de l'envoi d'un email ne bloque jamais la reponse HTTP :

```typescript
try {
  await emailService.sendOpportunityValidationNotification(...);
} catch {
  console.error('[Admin] Failed to send opportunity validation email');
}
```

---

## 13. Patterns transversaux

### 13.1 Format de reponse

Toutes les reponses suivent l'interface `ApiResponse<T>` :

```typescript
{
  success: boolean;
  message: string;
  data?: {
    [entity]: T;           // Ex: { stats }, { opportunity }, { profile }, { user }, { logs }
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

Toutes les listes supportent la pagination via query params `page` (defaut: 1) et `limit` (defaut: 20 ou 50). Le calcul se fait via :

```typescript
const skip = (page - 1) * limit;
const totalPages = Math.ceil(total / limit);
```

### 13.3 Authentification et autorisation

Toutes les routes du Sprint 4 sont protegees par deux middlewares enchaines :

1. **`authenticate`** : verifie le JWT et injecte `req.user` (userId, role)
2. **`authorize(UserRole.ADMIN)`** : verifie que le role de l'utilisateur est `admin`

Aucune route du Sprint 4 n'est publique. L'ensemble du module d'administration est reserve aux administrateurs.

### 13.4 Journal d'audit

Chaque action administrative significative genere automatiquement une entree dans le journal d'audit via `auditService.logAction()` :

| Action | Declencheur | TargetType | Details enregistres |
|---|---|---|---|
| `OPPORTUNITY_APPROVED` | Approbation d'une opportunite | `Opportunity` | `{ status, rejectionReason }` |
| `OPPORTUNITY_REJECTED` | Rejet d'une opportunite | `Opportunity` | `{ status, rejectionReason }` |
| `EVENT_APPROVED` | Approbation d'un evenement | `Event` | `{ status, rejectionReason }` |
| `EVENT_REJECTED` | Rejet d'un evenement | `Event` | `{ status, rejectionReason }` |
| `RECRUITER_VERIFIED` | Verification d'un recruteur | `User` | -- |
| `USER_SUSPENDED` | Suspension d'un utilisateur | `User` | `{ reason }` |
| `USER_REACTIVATED` | Reactivation d'un utilisateur | `User` | `{ reason }` |

Chaque entree enregistre egalement l'`adminId` (l'administrateur ayant effectue l'action) et l'`ipAddress` du client.

### 13.5 Notifications email liees aux actions admin

Chaque action administrative declenche un email de notification au destinataire concerne :

| Action admin | Destinataire | Email envoye |
|---|---|---|
| Validation d'opportunite | Recruteur (proprietaire) | `sendOpportunityValidationNotification` |
| Validation d'evenement | Recruteur (organisateur) | `sendEventValidationNotification` |
| Verification de recruteur | Recruteur (verifie) | `sendRecruiterVerificationNotification` |
| Suspension d'utilisateur | Utilisateur (suspendu) | `sendAccountSuspensionNotification` |
| Reactivation d'utilisateur | Utilisateur (reactive) | `sendAccountReactivationNotification` |

### 13.6 Protection des comptes admin

Le service `updateUserStatus` interdit la modification du statut d'un compte admin. Si l'utilisateur cible a le role `admin`, une erreur 403 est levee :

```typescript
if (user.role === UserRole.ADMIN) {
  throw new AppError('Cannot modify an admin account.', 403);
}
```

### 13.7 Populate conditionnel

Les references ObjectId sont resolues (`populate`) avec des projections minimales pour limiter la taille des reponses :

| Reference | Champs populated | Contexte |
|---|---|---|
| `adminId` (audit logs) | `firstName lastName username` | Journal d'audit |
| `recruiterId` (opportunities) | `firstName lastName username avatar` | Opportunites en attente |
| `userId` (recruiter profiles) | `firstName lastName email avatar createdAt` | Recruteurs non verifies |

---

*Documentation generee pour le Sprint 4 Backend de la plateforme ForMinds.*
