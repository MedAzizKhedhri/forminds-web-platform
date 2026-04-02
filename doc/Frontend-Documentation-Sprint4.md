# ForMinds - Frontend Documentation Sprint 4 (BF-007: Administration & Governance)

## ForMinds -- Plateforme Web de Mise en Relation Etudiants-Recruteurs

**Version** : 4.0
**Date** : 09 mars 2026
**Sprint** : Sprint 4 -- BF-007 (Administration & Gouvernance)

---

## Table des matieres

1. [Vue d'ensemble](#1-vue-densemble)
2. [Structure du projet (ajouts Sprint 4)](#2-structure-du-projet-ajouts-sprint-4)
3. [Routage et navigation](#3-routage-et-navigation)
4. [Types TypeScript](#4-types-typescript)
5. [Hooks personnalises](#5-hooks-personnalises)
6. [Composants UI (shadcn/ui)](#6-composants-ui-shadcnui)
7. [Module Administration - Dashboard](#7-module-administration---dashboard)
8. [Module Administration - Gestion des utilisateurs](#8-module-administration---gestion-des-utilisateurs)
9. [Module Administration - Revision des opportunites](#9-module-administration---revision-des-opportunites)
10. [Module Administration - Verification des recruteurs](#10-module-administration---verification-des-recruteurs)
11. [Module Administration - Journal d'audit](#11-module-administration---journal-daudit)
12. [Internationalisation (i18n)](#12-internationalisation-i18n)
13. [Patterns transversaux](#13-patterns-transversaux)
14. [Recapitulatif des endpoints API](#14-recapitulatif-des-endpoints-api)

---

## 1. Vue d'ensemble

Le Sprint 4 etend le frontend ForMinds avec un module d'administration complet, couvrant un bloc fonctionnel :

| Bloc fonctionnel | Perimetre Sprint 4 |
|---|---|
| **BF-007** -- Administration & Gouvernance | Tableau de bord administrateur avec KPI, gestion des utilisateurs (suspension/reactivation), revision des opportunites et evenements en attente, verification des profils recruteurs, journal d'audit avec filtrage par action |

### Resume quantitatif

| Element | Quantite |
|---|---|
| Nouvelles pages | 6 |
| Nouveaux hooks | 1 |
| Nouveaux types TypeScript | 2 |
| Nouvelles cles i18n | ~75 (par langue) |
| Fichiers modifies | 4 |
| **Total fichiers impactes** | **~12** |

### Dependances ajoutees

Aucune nouvelle dependance ajoutee. Le Sprint 4 reutilise exclusivement les composants UI et les librairies installes lors des sprints precedents (`@radix-ui/react-select`, `@radix-ui/react-alert-dialog`, `lucide-react`, etc.).

### Note importante sur les evenements

L'administrateur n'a **pas** acces aux operations CRUD sur les evenements. Son role est uniquement :
- Approuver ou rejeter les evenements crees par les recruteurs (via `/admin/events`)
- Visualiser les evenements publics (via `/events`)

Les fonctionnalites suivantes sont reservees aux **recruteurs uniquement** :
- Creation d'evenements (`/events/create`)
- Modification d'evenements (`/events/:id/edit`)
- Annulation d'evenements
- Check-in des participants (`/events/:id/checkin`)
- Gestion des participants

---

## 2. Structure du projet (ajouts Sprint 4)

```
frontend/src/
├── app/(dashboard)/
│   └── admin/
│       ├── page.tsx                      # Tableau de bord admin (KPI + actions rapides)
│       ├── users/
│       │   └── page.tsx                  # Gestion des utilisateurs
│       ├── opportunities/
│       │   └── page.tsx                  # Revision des opportunites en attente
│       ├── events/
│       │   └── page.tsx                  # Revision des evenements en attente
│       ├── recruiters/
│       │   └── page.tsx                  # Verification des recruteurs
│       └── audit-log/
│           └── page.tsx                  # Journal d'audit
│
├── components/
│   └── layout/
│       └── Sidebar.tsx                   # (modifie) Section admin avec 6 liens
│
├── hooks/
│   └── useAdmin.ts                      # Hook administration (toutes les interactions API admin)
│
├── i18n/
│   ├── en.json                          # (modifie) +75 cles anglais (section admin + nav)
│   └── fr.json                          # (modifie) +75 cles francais (section admin + nav)
│
└── types/
    └── index.ts                         # (modifie) +2 interfaces (AdminStats, AuditLog)
```

---

## 3. Routage et navigation

### 3.1 Nouvelles routes

Toutes les routes Sprint 4 sont sous le groupe `(dashboard)/admin` et beneficient de la protection d'authentification cote client du layout parent. Chaque page implemente en plus une garde de role `admin`.

| Route | Fichier | Composant | Restriction de role |
|---|---|---|---|
| `/admin` | `app/(dashboard)/admin/page.tsx` | `AdminDashboardPage` | Admin uniquement |
| `/admin/users` | `app/(dashboard)/admin/users/page.tsx` | `AdminUsersPage` | Admin uniquement |
| `/admin/opportunities` | `app/(dashboard)/admin/opportunities/page.tsx` | `AdminOpportunitiesPage` | Admin uniquement |
| `/admin/events` | `app/(dashboard)/admin/events/page.tsx` | `AdminEventsPage` | Admin uniquement |
| `/admin/recruiters` | `app/(dashboard)/admin/recruiters/page.tsx` | `AdminRecruitersPage` | Admin uniquement |
| `/admin/audit-log` | `app/(dashboard)/admin/audit-log/page.tsx` | `AdminAuditLogPage` | Admin uniquement |

### 3.2 Gardes de role (Role Guards)

Toutes les pages d'administration implementent un pattern de garde identique via `useEffect` :

```tsx
// Pattern utilise dans toutes les pages admin
const { user, isLoading: authLoading } = useAuth();
const router = useRouter();

useEffect(() => {
  if (!authLoading && user && user.role !== 'admin') {
    router.replace('/dashboard');
  }
}, [authLoading, user, router]);

// Empeche le flash de contenu non autorise
if (authLoading || !user || user.role !== 'admin') {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
```

Ce pattern combine trois mecanismes :
1. `useEffect` redirige vers `/dashboard` si l'utilisateur n'est pas admin
2. Un spinner de chargement s'affiche pendant la verification
3. Le contenu de la page n'est rendu qu'apres confirmation du role admin

### 3.3 Sidebar mise a jour

La sidebar a ete etendue avec une **5eme section** dediee a l'administration, separee par un `<Separator />` :

| Section | Elements | Icones | Roles |
|---|---|---|---|
| **Principal** | Dashboard, Feed | LayoutDashboard, MessageSquare | Tous |
| **Social** | Network, Directory | Users, Search | student+recruiter, Tous |
| **Evenements** | Events, My Events, My Tickets | Calendar, Calendar, Ticket | Tous, Recruteur uniquement, student+recruiter |
| **Opportunites** | Opportunities, My Opportunities, My Applications | Briefcase, ClipboardList, FileText | Tous, Recruteur, Etudiant |
| **Personnel** | Profile, My Projects, Settings | User, FolderOpen, Settings | Tous, Etudiant, Tous |
| **Administration** | Admin Dashboard, Pending Opportunities, Pending Events, Verify Recruiters, Users Management, Audit Log | Shield, ClipboardCheck, Calendar, UserCheck, Users, ScrollText | Admin uniquement (6 liens) |

**Note importante** : Le lien "My Events" est reserve aux **recruteurs uniquement**. L'administrateur n'a pas acces aux operations CRUD sur les evenements, il peut uniquement approuver ou rejeter les evenements via "Pending Events".

**Logique `isActive` mise a jour :**

```typescript
const isActive = (href: string) => {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/admin') return pathname === '/admin';
  if (href === '/opportunities') {
    return pathname === '/opportunities' || pathname.match(/^\/opportunities\/[^/]+$/);
  }
  return pathname.startsWith(href);
};
```

La route `/admin` utilise une correspondance exacte (`pathname === '/admin'`) pour eviter que le lien "Admin Dashboard" reste actif lorsque l'utilisateur navigue vers les sous-pages (`/admin/users`, `/admin/opportunities`, etc.).

**Filtrage par role :**

```typescript
const filterItems = (items: NavItem[]) =>
  items.filter((item) => {
    if (!item.roles) return true;
    return user?.role && item.roles.includes(user.role);
  });
```

La section administration complete est masquee pour les utilisateurs non-admin grace a la propriete `roles: ['admin']` sur chaque lien.

---

## 4. Types TypeScript

Fichier : `frontend/src/types/index.ts`

### 4.1 AdminStats

Interface representant les statistiques de la plateforme affichees sur le tableau de bord admin :

```typescript
export interface AdminStats {
  totalUsers: number;         // Nombre total d'utilisateurs
  totalStudents: number;      // Nombre d'etudiants
  totalRecruiters: number;    // Nombre de recruteurs
  suspendedUsers: number;     // Nombre d'utilisateurs suspendus
  pendingOpportunities: number;   // Opportunites en attente de validation
  approvedOpportunities: number;  // Opportunites approuvees
  rejectedOpportunities: number;  // Opportunites rejetees
  pendingEvents: number;          // Evenements en attente de validation
  totalApplications: number;      // Nombre total de candidatures
  newUsersLast30Days: number;     // Nouveaux utilisateurs (30 derniers jours)
}
```

### 4.2 AuditLog

Interface representant une entree du journal d'audit :

```typescript
export interface AuditLog {
  _id: string;
  adminId: User;                          // Admin ayant effectue l'action (toujours populated)
  action: string;                         // Type d'action (ex: 'opportunity_approved', 'event_approved', 'user_suspended')
  targetType: string;                     // Type de la cible (ex: 'Opportunity', 'Event', 'User')
  targetId: string;                       // ID de l'entite ciblee
  details?: Record<string, unknown>;      // Details supplementaires (JSON libre)
  ipAddress?: string;                     // Adresse IP de l'administrateur
  createdAt: string;                      // Date de l'action
}
```

---

## 5. Hooks personnalises

### 5.1 useAdmin

**Fichier** : `frontend/src/hooks/useAdmin.ts`
**Export** : `useAdmin()`

Hook centralisant toutes les interactions API du module d'administration. Suit le pattern etabli aux sprints precedents : `useState` + `useCallback` + appels via l'instance Axios (`api`).

**Types locaux :**

```typescript
interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type PopulatedRecruiter = Omit<RecruiterProfile, 'userId'> & { userId: User | string };
```

**Etat retourne :**

| Variable | Type | Description |
|---|---|---|
| `stats` | `AdminStats \| null` | Statistiques de la plateforme |
| `pendingOpportunities` | `Opportunity[]` | Opportunites en attente de validation |
| `unverifiedRecruiters` | `PopulatedRecruiter[]` | Recruteurs non verifies |
| `auditLogs` | `AuditLog[]` | Entrees du journal d'audit |
| `users` | `User[]` | Liste des utilisateurs |
| `pagination` | `PaginationData` | Donnees de pagination courantes |
| `isLoading` | `boolean` | Etat de chargement |

**Fonctions :**

| Fonction | Methode | Endpoint | Description |
|---|---|---|---|
| `fetchStats()` | GET | `/admin/stats` | Recupere les statistiques de la plateforme |
| `fetchPendingOpportunities(page, limit)` | GET | `/admin/opportunities` | Recupere les opportunites en attente avec pagination |
| `validateOpportunity(id, status, rejectionReason?)` | PATCH | `/admin/opportunities/${id}` | Approuve ou rejette une opportunite, retire l'element de la liste locale |
| `fetchUnverifiedRecruiters(page, limit)` | GET | `/admin/recruiters` | Recupere les recruteurs non verifies avec pagination |
| `verifyRecruiter(userId)` | PATCH | `/admin/recruiters/${userId}/verify` | Verifie un recruteur, retire l'element de la liste locale |
| `fetchAuditLogs(filters, page, limit)` | GET | `/admin/audit-log` | Recupere les logs d'audit avec filtre optionnel par action |
| `fetchUsers(filters, page, limit)` | GET | `/users` | Recherche des utilisateurs avec filtres (role, status, search) |
| `updateUserStatus(userId, isActive, reason?)` | PATCH | `/users/${userId}/status` | Suspend ou reactive un utilisateur, met a jour la liste locale |

**Mise a jour locale apres action :**

Certaines fonctions mettent a jour l'etat local immediatement apres une action reussie, evitant un rechargement complet :

```typescript
// validateOpportunity : retire l'opportunite de la liste
setPendingOpportunities((prev) => prev.filter((o) => o._id !== opportunityId));

// verifyRecruiter : retire le recruteur de la liste
setUnverifiedRecruiters((prev) => prev.filter((r) => {
  const rUserId = typeof r.userId === 'string' ? r.userId : r.userId._id;
  return rUserId !== userId;
}));

// updateUserStatus : met a jour le statut dans la liste
setUsers((prev) =>
  prev.map((u) => (u._id === userId ? { ...u, isActive } : u))
);
```

---

## 6. Composants UI (shadcn/ui)

Le Sprint 4 ne necessite aucun nouveau composant UI. Toutes les pages d'administration reutilisent les composants existants des sprints precedents :

| Composant | Origine | Utilisation Sprint 4 |
|---|---|---|
| `Card`, `CardContent`, `CardHeader`, `CardTitle` | Sprint 1 | Conteneurs de KPI, filtres, tableaux, cartes recruteurs |
| `Button` | Sprint 1 | Actions (approuver, rejeter, suspendre, verifier, pagination) |
| `Badge` | Sprint 1 | Roles, statuts, types d'action |
| `Input` | Sprint 1 | Recherche d'utilisateurs |
| `Skeleton` | Sprint 2 | Etats de chargement (tableaux, cartes, KPI) |
| `Textarea` | Sprint 2 | Motifs de suspension et de rejet |
| `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` | Sprint 2 | Filtres (role, statut, action) |
| `AlertDialog` et sous-composants | Sprint 2 | Confirmations (suspension utilisateur, rejet d'opportunite) |
| `Separator` | Sprint 1 | Separation des sections de la sidebar |

---

## 7. Module Administration - Dashboard

### 7.1 Page Admin Dashboard

**Fichier** : `app/(dashboard)/admin/page.tsx`
**Composant** : `AdminDashboardPage`

**Hooks utilises** : `useAuth`, `useAdmin`, `useLocale`

**Lifecycle** : `useEffect` appelle `fetchStats()` au montage si l'utilisateur a le role `admin`.

### 7.2 Cartes KPI

La page affiche 8 cartes KPI dans une grille responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) :

| KPI | Champ `AdminStats` | Icone | Couleur icone | Fond |
|---|---|---|---|---|
| Total Users | `totalUsers` | Users | `text-blue-600` | `bg-blue-50` |
| Students | `totalStudents` | GraduationCap | `text-green-600` | `bg-green-50` |
| Recruiters | `totalRecruiters` | Building2 | `text-purple-600` | `bg-purple-50` |
| Suspended | `suspendedUsers` | UserX | `text-red-600` | `bg-red-50` |
| Pending Opportunities | `pendingOpportunities` | Clock | `text-orange-600` | `bg-orange-50` |
| Approved Opportunities | `approvedOpportunities` | CheckCircle | `text-green-600` | `bg-green-50` |
| Total Applications | `totalApplications` | FileText | `text-blue-600` | `bg-blue-50` |
| New Users (30 days) | `newUsersLast30Days` | UserPlus | `text-teal-600` | `bg-teal-50` |

Chaque carte est composee de :
- **En-tete** : label texte + icone avec fond colore (`rounded-lg`)
- **Contenu** : valeur numerique en `text-3xl font-bold`, ou `Skeleton` pendant le chargement

La carte "Pending Opportunities" est cliquable et redirige vers `/admin/opportunities` via un composant `Link`.

### 7.3 Actions rapides

Quatre boutons d'action rapide dans une grille responsive (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) :

| Action | Route | Icone | Couleur |
|---|---|---|---|
| View Pending Opportunities | `/admin/opportunities` | ClipboardList | Orange |
| Verify Recruiters | `/admin/recruiters` | ShieldCheck | Violet |
| Manage Users | `/admin/users` | UserCog | Bleu |
| View Audit Log | `/admin/audit-log` | ScrollText | Gris |

Chaque bouton utilise `Button asChild variant="outline"` avec un layout en colonne (`flex-col gap-3 p-6`) et un `Link` interne.

---

## 8. Module Administration - Gestion des utilisateurs

### 8.1 Page Users Management

**Fichier** : `app/(dashboard)/admin/users/page.tsx`
**Composant** : `AdminUsersPage`

**Hooks utilises** : `useAuth`, `useAdmin`, `useLocale`, `useToast`

### 8.2 Filtres

La page propose trois mecanismes de filtrage dans une carte dediee :

| Filtre | Composant | Options | Declenchement |
|---|---|---|---|
| Recherche | `Input` avec icone Search | Texte libre (nom ou email) | Touche Entree ou bouton Search |
| Role | `Select` | All Roles, Student, Recruiter, Admin | Immediat (`onValueChange`) |
| Statut | `Select` | All Statuses, Active, Suspended | Immediat (`onValueChange`) |

**Etat local** : `search`, `roleFilter`, `statusFilter`, `currentPage`

**Rechargement automatique** : un `useEffect` rappelle `loadUsers(1)` lorsque `roleFilter` ou `statusFilter` changent, avec remise a zero de la page courante.

### 8.3 Tableau des utilisateurs

Tableau HTML (`<table>`) dans une carte avec debordement horizontal (`overflow-x-auto`) :

| Colonne | Donnee | Rendu |
|---|---|---|
| Name | `firstName` + `lastName` | Texte avec `font-medium` |
| Email | `email` | Texte `text-muted-foreground` |
| Role | `role` | `Badge` (admin=`default`, recruiter=`secondary`, student=`outline`) |
| Status | `isActive` | `Badge` (active=vert `border-green-300 bg-green-50`, suspended=`destructive`) |
| Joined | `createdAt` | `toLocaleDateString()` |
| Actions | - | Boutons Suspend/Reactivate (voir ci-dessous) |

**Actions conditionnelles (colonne Actions) :**
- Les administrateurs n'ont pas de bouton d'action (`u.role !== 'admin'`)
- Utilisateur actif : bouton `Suspend` (variant `destructive`)
- Utilisateur suspendu : bouton `Reactivate` (variant `outline`, style vert)

### 8.4 Dialogue de suspension

`AlertDialog` avec les elements suivants :

| Element | Description |
|---|---|
| Titre | "Suspend User" |
| Description | Message de confirmation |
| Champ | `Textarea` pour le motif de suspension (optionnel) |
| Bouton annuler | `AlertDialogCancel` |
| Bouton confirmer | `Button variant="destructive"`, texte "Suspend" ou "Suspending..." pendant le chargement |

**Flow :**
1. Clic sur "Suspend" ouvre le dialogue avec le nom de l'utilisateur cible
2. L'administrateur peut saisir un motif (optionnel)
3. Clic sur confirmer appelle `updateUserStatus(id, false, reason)`
4. Succes : toast de confirmation, dialogue se ferme
5. Erreur : toast destructive

### 8.5 Reactivation

La reactivation est directe (sans dialogue de confirmation) :
1. Clic sur "Reactivate" appelle `updateUserStatus(id, true)`
2. Succes : toast de confirmation
3. Erreur : toast destructive

### 8.6 Pagination

Pattern Previous/Next avec indicateur "Page X / Y". Boutons `ChevronLeft` / `ChevronRight`. Visible uniquement si `pagination.totalPages > 1`.

---

## 9. Module Administration - Revision des opportunites

### 9.1 Page Pending Opportunities

**Fichier** : `app/(dashboard)/admin/opportunities/page.tsx`
**Composant** : `AdminOpportunitiesPage`

**Hooks utilises** : `useAuth`, `useAdmin`, `useLocale`, `useToast`

**Lifecycle** : `useEffect` appelle `fetchPendingOpportunities(1, 20)` au montage.

### 9.2 Cartes d'opportunite

Grille responsive (`grid-cols-1 lg:grid-cols-2`) de cartes `Card` avec `hover:shadow-md transition-shadow` :

| Element | Rendu |
|---|---|
| Titre | `CardTitle text-lg` |
| Type | `Badge variant="secondary"` avec label traduit (Internship/Job/Volunteering) |
| Description | Texte tronque a 200 caracteres |
| Localisation | Icone MapPin + texte |
| Domaine | Icone Briefcase + texte |
| Date de creation | Icone Calendar + `toLocaleDateString()` |
| Competences | Liste de `Badge variant="outline"` |
| Recruteur | Nom du recruteur (extrait via `getRecruiterName`) |
| Actions | Boutons Approve + Reject |

**Fonction `getRecruiterName`** : extrait le nom du recruteur a partir du champ `recruiterId` qui peut etre un objet `User` populate ou une simple chaine :

```typescript
const getRecruiterName = (opp: Opportunity): string => {
  if (typeof opp.recruiterId === 'object' && opp.recruiterId !== null) {
    const recruiter = opp.recruiterId as User;
    return `${recruiter.firstName} ${recruiter.lastName}`;
  }
  return 'Unknown Recruiter';
};
```

**Fonction `typeLabel`** : convertit le type technique en label affichable en utilisant les traductions i18n :

```typescript
const typeLabel = (type: string) => {
  const labels: Record<string, string> = {
    stage: t.opportunities?.stage || 'Internship',
    emploi: t.opportunities?.emploi || 'Job',
    benevolat: t.opportunities?.benevolat || 'Volunteering',
  };
  return labels[type] || type;
};
```

### 9.3 Actions d'approbation et de rejet

**Approbation :**
1. Clic sur le bouton "Approve" (icone CheckCircle, style vert)
2. Appel direct `validateOpportunity(id, 'approved')`
3. Succes : toast de confirmation
4. L'opportunite est retiree automatiquement de la liste locale

**Rejet :**
1. Clic sur le bouton "Reject" (icone XCircle, style rouge) ouvre un `AlertDialog`
2. L'administrateur peut saisir un motif de rejet (optionnel) dans une `Textarea`
3. Clic sur confirmer appelle `validateOpportunity(id, 'rejected', rejectionReason)`
4. Succes : toast de confirmation, dialogue se ferme
5. L'opportunite est retiree automatiquement de la liste locale

### 9.4 Etats de la page

| Etat | Rendu |
|---|---|
| Chargement | 4 cartes skeleton en grille (Skeleton pour titre, badge, lignes, boutons) |
| Vide | Icone Inbox + "No pending opportunities" + "All opportunities have been reviewed" |
| Donnees | Grille de cartes + pagination |

---

## 10. Module Administration - Verification des recruteurs

### 10.1 Page Recruiter Verification

**Fichier** : `app/(dashboard)/admin/recruiters/page.tsx`
**Composant** : `AdminRecruitersPage`

**Hooks utilises** : `useAuth`, `useAdmin`, `useLocale`, `useToast`

**Lifecycle** : `useEffect` appelle `fetchUnverifiedRecruiters(1, 20)` au montage.

### 10.2 Cartes de recruteur

Grille responsive (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) de cartes `Card` avec `hover:shadow-md transition-shadow` :

| Element | Icone | Rendu |
|---|---|---|
| Nom du recruteur | - | `CardTitle text-lg` (via `getRecruiterName`) |
| Statut | - | `Badge variant="outline"` avec style orange ("Unverified") |
| Entreprise | Building2 | Texte avec `font-medium` |
| Secteur | - | `Badge variant="secondary"` |
| Localisation | MapPin | Texte |
| Email de contact | Mail | Texte tronque |
| Date d'inscription | Calendar | "Registered: " + `toLocaleDateString()` |
| Bouton de verification | ShieldCheck | `Button` pleine largeur ("Verify" ou "Verifying...") |

**Fonctions utilitaires :**

| Fonction | Description |
|---|---|
| `getRecruiterUserId` | Extrait l'ID utilisateur, que `userId` soit un objet `User` ou une chaine |
| `getRecruiterName` | Extrait le nom complet, ou retourne "Unknown User" |
| `getRecruiterRegisteredDate` | Extrait la date d'inscription depuis l'objet `User` populate ou la date de creation du profil |

### 10.3 Action de verification

1. Clic sur "Verify" appelle `verifyRecruiter(userId)`
2. L'etat de chargement est gere par recruteur individuel (`actionLoading === userId`)
3. Succes : toast "Recruiter verified successfully", le recruteur est retire de la liste locale
4. Erreur : toast destructive

### 10.4 Etats de la page

| Etat | Rendu |
|---|---|
| Chargement | 6 cartes skeleton en grille |
| Vide | Icone Inbox + "No unverified recruiters" + "All recruiters have been verified" |
| Donnees | Grille de cartes + pagination |

---

## 11. Module Administration - Journal d'audit

### 11.1 Page Audit Log

**Fichier** : `app/(dashboard)/admin/audit-log/page.tsx`
**Composant** : `AdminAuditLogPage`

**Hooks utilises** : `useAuth`, `useAdmin`, `useLocale`

### 11.2 Types d'actions

Constante `ACTION_TYPES` definissant les filtres disponibles :

```typescript
const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'opportunity_approved', label: 'Opportunity Approved' },
  { value: 'opportunity_rejected', label: 'Opportunity Rejected' },
  { value: 'event_approved', label: 'Event Approved' },
  { value: 'event_rejected', label: 'Event Rejected' },
  { value: 'recruiter_verified', label: 'Recruiter Verified' },
  { value: 'user_suspended', label: 'User Suspended' },
  { value: 'user_reactivated', label: 'User Reactivated' },
];
```

### 11.3 Filtre par action

Carte de filtre avec un `Select` unique (`w-full sm:w-[250px]`). Le changement de filtre declenche un rechargement automatique via `useEffect` qui observe `actionFilter` :

```typescript
const loadLogs = useCallback(
  (page: number) => {
    const filters: { action?: string } = {};
    if (actionFilter !== 'all') filters.action = actionFilter;
    fetchAuditLogs(filters, page, 50);
  },
  [actionFilter, fetchAuditLogs]
);

useEffect(() => {
  if (user?.role === 'admin') {
    setCurrentPage(1);
    loadLogs(1);
  }
}, [user, actionFilter, loadLogs]);
```

### 11.4 Tableau du journal d'audit

Tableau HTML (`<table>`) dans une carte avec debordement horizontal :

| Colonne | Donnee | Rendu |
|---|---|---|
| Date | `createdAt` | `toLocaleString()` avec `whitespace-nowrap` |
| Admin | `adminId` | Nom complet via `getAdminName` (ou "Unknown Admin") |
| Action | `action` | `Badge variant="outline"` avec couleur contextuelle |
| Target Type | `targetType` | Texte avec `capitalize` |
| Details | `details` | `JSON.stringify(details)` ou "-", tronque a 200px |
| IP Address | `ipAddress` | Texte `font-mono` ou "-" |

### 11.5 Badges d'action colores

Fonction `getActionBadgeVariant` qui categorise les actions par couleur :

| Categorie | Actions | Style CSS |
|---|---|---|
| **Positives** (vert) | `opportunity_approved`, `event_approved`, `recruiter_verified`, `user_reactivated` | `border-green-300 bg-green-50 text-green-700` |
| **Negatives** (rouge) | `opportunity_rejected`, `event_rejected`, `user_suspended` | `border-red-300 bg-red-50 text-red-700` |
| **Neutres** | Toute autre action | Style par defaut du `Badge` |

Le label est genere dynamiquement a partir de l'identifiant de l'action :

```typescript
const label = action
  .split('_')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ');
// Exemple : 'opportunity_approved' => 'Opportunity Approved'
```

### 11.6 Etats de la page

| Etat | Rendu |
|---|---|
| Chargement | 8 lignes skeleton dans le tableau |
| Vide | Icone Inbox + "No audit logs found" (centr dans une cellule `colSpan={6}`) |
| Donnees | Tableau rempli + pagination |

---

## 12. Internationalisation (i18n)

### 12.1 Nouvelles sections ajoutees

Les fichiers `i18n/fr.json` et `i18n/en.json` ont ete enrichis avec les sections suivantes :

| Section | Nombre de cles | Utilisation |
|---|---|---|
| `nav` (extensions) | 5 | `adminDashboard`, `adminOpportunities`, `adminRecruiters`, `adminUsers`, `adminAuditLog` |
| `admin` | 63 | Toutes les interactions du module administration |

### 12.2 Cles de navigation admin

| Cle | Anglais | Francais |
|---|---|---|
| `nav.adminDashboard` | Admin Dashboard | Admin |
| `nav.adminOpportunities` | Pending Opportunities | Opportunites en attente |
| `nav.adminRecruiters` | Verify Recruiters | Verifier recruteurs |
| `nav.adminUsers` | Users Management | Gestion utilisateurs |
| `nav.adminAuditLog` | Audit Log | Journal d'audit |

### 12.3 Cles du tableau de bord admin

| Cle | Anglais | Francais |
|---|---|---|
| `admin.dashboard` | Admin Dashboard | Tableau de bord Admin |
| `admin.totalUsers` | Total Users | Total utilisateurs |
| `admin.students` | Students | Etudiants |
| `admin.recruiters` | Recruiters | Recruteurs |
| `admin.suspended` | Suspended | Suspendus |
| `admin.pendingOpportunities` | Pending Opportunities | Opportunites en attente |
| `admin.approvedOpportunities` | Approved Opportunities | Opportunites approuvees |
| `admin.totalApplications` | Total Applications | Total candidatures |
| `admin.newUsers30Days` | New Users (30 days) | Nouveaux utilisateurs (30 jours) |
| `admin.quickActions` | Quick Actions | Actions rapides |
| `admin.viewPendingOpportunities` | View Pending Opportunities | Voir les opportunites en attente |
| `admin.verifyRecruiters` | Verify Recruiters | Verifier les recruteurs |
| `admin.manageUsers` | Manage Users | Gerer les utilisateurs |
| `admin.viewAuditLog` | View Audit Log | Voir le journal d'audit |

### 12.4 Cles de gestion des utilisateurs

| Cle | Anglais | Francais |
|---|---|---|
| `admin.usersManagement` | Users Management | Gestion des utilisateurs |
| `admin.name` | Name | Nom |
| `admin.email` | Email | Email |
| `admin.role` | Role | Role |
| `admin.status` | Status | Statut |
| `admin.joined` | Joined | Inscrit le |
| `admin.actions` | Actions | Actions |
| `admin.active` | Active | Actif |
| `admin.suspendedStatus` | Suspended | Suspendu |
| `admin.suspend` | Suspend | Suspendre |
| `admin.reactivate` | Reactivate | Reactiver |
| `admin.suspendUser` | Suspend User | Suspendre l'utilisateur |
| `admin.suspendConfirm` | Are you sure you want to suspend this user? | Etes-vous sur de vouloir suspendre cet utilisateur ? |
| `admin.suspendReason` | Reason for suspension | Motif de suspension |
| `admin.suspendReasonPlaceholder` | Enter the reason for suspension... | Entrez le motif de suspension... |
| `admin.noUsers` | No users found | Aucun utilisateur trouve |
| `admin.searchPlaceholder` | Search users... | Rechercher des utilisateurs... |
| `admin.allRoles` | All Roles | Tous les roles |
| `admin.allStatuses` | All Statuses | Tous les statuts |

### 12.5 Cles de revision des opportunites et verification des recruteurs

| Cle | Anglais | Francais |
|---|---|---|
| `admin.opportunitiesReview` | Opportunities Review | Revision des opportunites |
| `admin.approve` | Approve | Approuver |
| `admin.reject` | Reject | Rejeter |
| `admin.rejectOpportunity` | Reject Opportunity | Rejeter l'opportunite |
| `admin.rejectionReason` | Rejection reason | Motif de rejet |
| `admin.rejectionReasonPlaceholder` | Enter the reason for rejection (optional)... | Entrez le motif de rejet (optionnel)... |
| `admin.noPendingOpportunities` | No pending opportunities to review | Aucune opportunite en attente de revision |
| `admin.recruitersVerification` | Recruiters Verification | Verification des recruteurs |
| `admin.verify` | Verify | Verifier |
| `admin.company` | Company | Entreprise |
| `admin.sector` | Sector | Secteur |
| `admin.location` | Location | Localisation |
| `admin.contact` | Contact | Contact |
| `admin.registeredOn` | Registered on | Inscrit le |
| `admin.submittedOn` | Submitted on | Soumis le |
| `admin.noUnverifiedRecruiters` | All recruiters are verified | Tous les recruteurs sont verifies |

### 12.6 Cles du journal d'audit

| Cle | Anglais | Francais |
|---|---|---|
| `admin.auditLog` | Audit Log | Journal d'audit |
| `admin.date` | Date | Date |
| `admin.adminCol` | Admin | Admin |
| `admin.action` | Action | Action |
| `admin.targetType` | Target Type | Type de cible |
| `admin.details` | Details | Details |
| `admin.ipAddress` | IP Address | Adresse IP |
| `admin.unknownAdmin` | Unknown Admin | Admin inconnu |
| `admin.filterByAction` | Filter by action | Filtrer par action |
| `admin.allActions` | All Actions | Toutes les actions |
| `admin.noAuditLogs` | No audit logs found | Aucun journal d'audit trouve |

### 12.7 Pattern d'utilisation

Tous les composants Sprint 4 suivent le pattern etabli aux sprints precedents :

```tsx
const { t } = useLocale();
// Utilisation avec fallback
{t.admin?.dashboard || 'Admin Dashboard'}
// Acces a une cle de navigation
{t.nav?.adminDashboard || 'Admin Dashboard'}
```

---

## 13. Patterns transversaux

### 13.1 Gestion des erreurs

- **Hook level** : les fonctions de fetch utilisent `try/catch` avec commentaire "handled by interceptor" (l'intercepteur Axios gere les 401)
- **Page level** : les handlers de mutation (suspend, reactivate, approve, reject, verify) encapsulent les appels dans `try/catch` et affichent des notifications `useToast` (variant `destructive` pour les erreurs)

### 13.2 Etats de chargement (Skeleton)

Chaque page d'administration inclut des composants Skeleton adaptes a sa structure :

| Page | Type de skeleton | Quantite |
|---|---|---|
| Admin Dashboard | Cartes KPI (`Skeleton h-8 w-16` dans `CardContent`) | 8 cartes |
| Users Management | Lignes de tableau (6 colonnes de `Skeleton`) | 5 lignes |
| Pending Opportunities | Cartes avec skeleton titre + badge + lignes + boutons | 4 cartes |
| Recruiter Verification | Cartes avec skeleton titre + sous-titre + lignes + bouton | 6 cartes |
| Audit Log | Lignes de tableau (6 colonnes de `Skeleton`) | 8 lignes |

### 13.3 Etats vides

Les pages de liste affichent un etat vide centre avec icone + message :

| Page | Icone | Message (cle i18n) |
|---|---|---|
| Users Management | Users | `admin.noUsers` |
| Pending Opportunities | Inbox | `admin.noPendingOpportunities` |
| Recruiter Verification | Inbox | `admin.noUnverifiedRecruiters` |
| Audit Log | Inbox | `admin.noAuditLogs` |

### 13.4 Pagination

Toutes les pages paginables (Users, Opportunities, Recruiters, Audit Log) utilisent le meme pattern de pagination Previous/Next :

```tsx
{!isLoading && pagination.totalPages > 1 && (
  <div className="flex items-center justify-center gap-4">
    <Button
      variant="outline"
      size="sm"
      onClick={() => handlePageChange(currentPage - 1)}
      disabled={currentPage <= 1}
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      {'Previous'}
    </Button>
    <span className="text-sm text-muted-foreground">
      {'Page'} {currentPage} / {pagination.totalPages}
    </span>
    <Button
      variant="outline"
      size="sm"
      onClick={() => handlePageChange(currentPage + 1)}
      disabled={currentPage >= pagination.totalPages}
    >
      {'Next'}
      <ChevronRight className="h-4 w-4 ml-1" />
    </Button>
  </div>
)}
```

La pagination n'est visible que lorsque `pagination.totalPages > 1`.

### 13.5 Controle d'acces par role

| Mecanisme | Utilisation |
|---|---|
| Sidebar `filterItems` | Masque les 5 liens admin pour les utilisateurs non-admin |
| `useEffect` role guard | Redirect vers `/dashboard` si role !== admin (toutes les pages admin) |
| Spinner pendant loading | Empeche le flash de contenu non autorise |
| Actions conditionnelles | Les boutons Suspend/Reactivate ne sont pas affiches pour les utilisateurs ayant le role admin |

### 13.6 Dialogues de confirmation

Deux pages utilisent des `AlertDialog` pour confirmer les actions destructives :

| Page | Action | Champ supplementaire |
|---|---|---|
| Users Management | Suspension d'un utilisateur | `Textarea` pour le motif (optionnel) |
| Pending Opportunities | Rejet d'une opportunite | `Textarea` pour le motif de rejet (optionnel) |

Structure commune des dialogues :
- `AlertDialogHeader` : titre + description
- Zone de contenu : `Textarea` avec placeholder
- `AlertDialogFooter` : bouton Cancel + bouton d'action (variant `destructive`, texte dynamique pendant le chargement)

### 13.7 Mise a jour locale apres action

Contrairement au pattern de rechargement complet, le hook `useAdmin` met a jour l'etat local apres une action reussie :

| Action | Mise a jour locale |
|---|---|
| `validateOpportunity` | Retire l'opportunite de `pendingOpportunities` via `filter` |
| `verifyRecruiter` | Retire le recruteur de `unverifiedRecruiters` via `filter` |
| `updateUserStatus` | Met a jour `isActive` dans la liste `users` via `map` |

Ce pattern offre un retour visuel immediat sans necessiter un rechargement complet depuis le serveur.

---

## 14. Recapitulatif des endpoints API

Tous les appels passent par l'instance Axios configuree dans `lib/api.ts` (avec intercepteur JWT).

### 14.1 Administration - Statistiques

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/admin/stats` | `useAdmin.fetchStats` | Statistiques globales de la plateforme |

### 14.2 Administration - Opportunites

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/admin/opportunities` | `useAdmin.fetchPendingOpportunities` | Opportunites en attente de validation (paginee) |
| PATCH | `/admin/opportunities/${id}` | `useAdmin.validateOpportunity` | Approuver ou rejeter une opportunite |

### 14.3 Administration - Recruteurs

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/admin/recruiters` | `useAdmin.fetchUnverifiedRecruiters` | Recruteurs non verifies (paginee) |
| PATCH | `/admin/recruiters/${userId}/verify` | `useAdmin.verifyRecruiter` | Verifier un recruteur |

### 14.4 Administration - Journal d'audit

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/admin/audit-log` | `useAdmin.fetchAuditLogs` | Journal d'audit avec filtre par action (pagine) |

### 14.5 Administration - Utilisateurs

| Methode | Endpoint | Hook | Description |
|---|---|---|---|
| GET | `/users` | `useAdmin.fetchUsers` | Recherche d'utilisateurs avec filtres (role, status, search) |
| PATCH | `/users/${userId}/status` | `useAdmin.updateUserStatus` | Suspendre ou reactiver un utilisateur |

---

**Total endpoints Sprint 4 : 8** (tous appeles via le hook `useAdmin`).
