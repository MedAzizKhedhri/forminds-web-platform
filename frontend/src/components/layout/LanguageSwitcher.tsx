'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const;

export type Locale = 'en' | 'fr';

// Hardcoded translations for the application
const translations: Record<Locale, Record<string, any>> = {
  en: {
    language: 'Language',
    settings: 'Settings',
    profileLabel: 'Profile',
    logout: 'Logout',
    nav: {
      dashboard: 'Dashboard',
      feed: 'Feed',
      network: 'Network',
      directory: 'Directory',
      events: 'Events',
      myEvents: 'My Events',
      myTickets: 'My Tickets',
      recommendations: 'Recommendations',
      opportunities: 'Opportunities',
      myOpportunities: 'My Opportunities',
      applicants: 'Applicants',
      applications: 'My Applications',
      profile: 'Profile',
      settings: 'Settings',
      adminDashboard: 'Admin Dashboard',
      adminOpportunities: 'Pending Opportunities',
      adminEvents: 'Pending Events',
      adminRecruiters: 'Verify Organisations',
      adminUsers: 'Users Management',
      adminAuditLog: 'Audit Log'
    },
    common: {
      success: 'Success',
      error: 'Error',
      loading: 'Loading...',
      save: 'Update',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      no_data: 'No data found',
      logout: 'Log out',
      back: 'Previous',
      next: 'Next',
      search: 'All',
      confirm: 'Confirm',
      close: 'Close',
      notAvailable: 'This page is not available for your role.'
    },
    network: {
      title: 'My Network',
      connections: 'Connections',
      pendingRequests: 'Pending Requests',
      sentRequests: 'Sent Requests',
      suggestions: 'Suggestions',
      accept: 'Accept',
      reject: 'Reject',
      confirmRemove: 'Are you sure you want to remove this connection?',
      remove: 'Remove',
      connect: 'Connect',
      noConnections: 'No connections yet',
      noPendingRequests: 'No pending requests',
      noSentRequests: 'No sent requests',
      noSuggestions: 'No suggestions available',
      pending: 'Pending',
      noPending: 'No pending requests'
    },
    admin: {
      dashboard: 'Admin Dashboard',
      totalUsers: 'Total Users',
      students: 'Students',
      recruiters: 'Organisations',
      suspended: 'Suspended',
      pendingOpportunities: 'Pending Opportunities',
      approvedOpportunities: 'Approved Opportunities',
      totalApplications: 'Total Applications',
      newUsers30Days: 'New Users (30 days)',
      pendingEvents: 'Pending Events',
      quickActions: 'Quick Actions',
      viewPendingOpportunities: 'View Pending Opportunities',
      viewPendingEvents: 'View Pending Events',
      verifyRecruiters: 'Verify Organisations',
      manageUsers: 'Manage Users',
      viewAuditLog: 'View Audit Log',
      unknownAdmin: 'Unknown Admin',
      auditLog: 'Audit Log',
      filterByAction: 'Action Type',
      date: 'Date',
      adminCol: 'Admin',
      action: 'Action',
      targetType: 'Target Type',
      details: 'Details',
      ipAddress: 'IP Address',
      noAuditLogs: 'No audit logs found',
      recruitersVerification: 'Organisation Verification',
      noUnverifiedRecruiters: 'No unverified organisations',
      registeredOn: 'Registered',
      verify: 'Verify',
      usersManagement: 'Users Management',
      searchPlaceholder: 'Search',
      role: 'Role',
      allRoles: 'All Roles',
      status: 'Status',
      allStatuses: 'All Statuses',
      active: 'Active',
      suspendedStatus: 'Suspended',
      name: "Name",
      email: "Email",
      joined: "Joined",
      actions: "Actions",
      noUsers: "No users found",
      suspend: "Suspend",
      reactivate: "Reactivate",
      suspendUser: "Suspend User",
      suspendConfirm: "Are you sure you want to suspend this user?",
      suspendReason: "Reason (optional)",
      suspendReasonPlaceholder: "Enter reason for suspension...",
      eventApproved: "Event approved successfully",
      eventRejected: "Event rejected",
      noPendingEvents: "No pending events",
      approve: "Approve",
      reject: "Reject",
      rejectEvent: "Reject Event",
      rejectionReason: "Rejection reason (optional)",
      rejectionReasonPlaceholder: "Enter reason for rejection...",
      noPendingOpportunities: "No pending opportunities",
      rejectOpportunity: "Reject Opportunity"
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      completeProfile: "Complete your profile to increase your visibility",
      pendingConnections: "Pending requests",
      recentPosts: "Recent posts",
      recentApplications: "Recent applications"
    },
    opportunities: {
      title: 'Opportunities',
      create: 'Create',
      edit: 'Edit Opportunity',
      view: 'View Opportunity',
      applications: 'Applications',
      stage: "Internship",
      emploi: "Employment",
      benevolat: "Volunteering",
      coverLetter: "Cover letter",
      close: "Close opportunity",
      myOpportunities: "My Opportunities",
      noOpportunities: "No opportunities available",
      apply: "Apply",
      coverLetterPlaceholder: "Present your motivation (optional)...",
      domain: "Domain",
      deadline: "Deadline",
      description: "Description",
      skills: "Type a skill and press Enter",
      requirements: "Requirements",
      alreadyApplied: "Already applied",
      closed: "Closed",
      filterType: "Type",
      filterLocation: "Location",
      filterDomain: "Domain",
      type: "Type",
      location: "Location"
    },
    events: {
      title: 'Events',
      create: 'Create Event',
      edit: 'Edit Event',
      register: 'Register for Event',
      registered: 'Event registered successfully',
    },
    profile: {
      title: 'My Profile',
      edit: 'Edit Profile',
      saved: 'Profile saved successfully',
      myProfile: 'My Profile',
      projects: 'My Projects',
      profileCompletion: "Profile completion",
      editProfile: "Edit Profile",
      publicProfile: "Public Profile",
      skills: "Skills",
      education: "Education",
      experience: "Experience",
      projectsDescription: "Manage and showcase your projects."
    },
    feed: {
      title: 'Feed',
      noPostsYet: 'No posts yet',
      createPost: "Publish",
      editPost: "Post updated.",
      delete: "Delete",
      writeComment: "Write a comment...",
      send: "Send",
      comments: "Comments",
      confirmDelete: "Are you sure you want to delete this post?",
      edit: "Edit",
      noPosts: "No posts yet",
      loadMore: "Load more",
      update: "Update",
      placeholder: "What's on your mind?"
    },
    settingsPage: {
      changePassword: 'Change Password',
      updatePasswordDesc: 'Update your password to keep your account secure',
      currentPassword: 'Current Password',
      currentPasswordPlaceholder: 'Enter your current password',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter a new password',
      confirmNewPassword: 'Confirm New Password',
      confirmNewPasswordPlaceholder: 'Confirm your new password',
      changing: 'Changing...',
      changePasswordBtn: 'Change Password',
      twoFactor: 'Two-Factor Authentication',
      twoFactorDesc: 'Add an extra layer of security to your account',
      status: 'Status:',
      enabled: 'Enabled',
      disabled: 'Disabled',
      twoFactorActive: 'Two-factor authentication is active on your account.',
      twoFactorInactive: 'Enable 2FA to add an extra layer of security.',
      disable2FA: 'Disable 2FA',
      enable2FA: 'Enable 2FA',
      disabling: 'Disabling...',
      enabling: 'Enabling...',
      confirm2FA: 'Confirm Two-Factor Authentication',
      enter6digit: 'Enter the 6-digit verification code to confirm setup.',
      enterCodePlaceholder: 'Enter 6-digit code',
      cancel: 'Cancel',
      confirm: 'Confirm',
      confirming: 'Confirming...',
      deleteAccount: 'Delete Account',
      deleteAccountDesc: 'Permanently delete your account and all associated data',
      deleteWarning: 'Once you delete your account, there is no going back. All your data including your profile, posts, connections, and applications will be permanently removed.',
      areYouSure: 'Are you absolutely sure?',
      cannotUndo: 'This action cannot be undone. This will permanently delete your account and remove all your data from our servers, including your profile, posts, connections, opportunities, and applications.',
      enterPasswordConfirm: 'Enter your password to confirm',
      enterPasswordPlaceholder: 'Enter your password',
      deleting: 'Deleting...',
      deleteMyAccount: 'Delete my account'
    },
    applicants: {
      title: "Applicants",
      subtitle: "Review and manage applicants for your job postings.",
      all: "All",
      searchPlaceholder: "Search by name or email...",
      no: "NO",
      candidate: "CANDIDATE",
      opportunity: "OPPORTUNITY",
      coverLetter: "COVER LETTER",
      statusCol: "STATUS",
      noApplicants: "No applicants found",
      noCoverLetter: "No cover letter provided."
    },
    applications: {
      appliedOn: "Applied on",
      changeStatus: "Change status",
      viewProfile: "View Profile"
    },
    directory: {
      title: "Directory",
      filterSkills: "Skills",
      searchPlaceholder: "Search...",
      filterDomain: "Domain",
      filterCity: "City",
      noProfiles: "No profiles found"
    }
  },
  fr: {
    language: 'Langue',
    settings: 'Paramètres',
    profileLabel: 'Profil',
    logout: 'Déconnexion',
    nav: {
      dashboard: 'Tableau de bord',
      feed: 'Fil d\'actualité',
      network: 'Réseau',
      directory: 'Annuaire',
      events: 'Événements',
      myEvents: 'Mes événements',
      myTickets: 'Mes billets',
      recommendations: 'Recommandations',
      opportunities: 'Opportunités',
      myOpportunities: 'Mes opportunités',
      applicants: 'Candidats',
      applications: 'Mes candidatures',
      profile: 'Profil',
      settings: 'Paramètres',
      adminDashboard: 'Tableau de bord Admin',
      adminOpportunities: 'Opportunités en attente',
      adminEvents: 'Événements en attente',
      adminRecruiters: 'Vérifier Organisations',
      adminUsers: 'Gestion des utilisateurs',
      adminAuditLog: 'Journal d\'audit'
    },
    common: {
      success: 'Succès',
      error: 'Erreur',
      loading: 'Chargement...',
      save: 'Mettre à jour',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      add: 'Ajouter',
      no_data: 'Aucune donnée trouvée',
      logout: 'Se déconnecter',
      back: "Précédent",
      next: "Suivant",
      search: "Tout",
      confirm: "Confirmer",
      close: "Fermer",
      notAvailable: "Cette page n'est pas disponible pour votre rôle."
    },
    network: {
      title: 'Mon réseau',
      connections: 'Connexions',
      pendingRequests: 'Demandes en attente',
      sentRequests: 'Demandes envoyées',
      suggestions: 'Suggestions',
      accept: 'Accepter',
      reject: 'Rejeter',
      confirmRemove: 'Êtes-vous sûr de vouloir supprimer cette connexion?',
      remove: 'Supprimer',
      connect: 'Se connecter',
      noConnections: 'Aucune connexion pour le moment',
      noPendingRequests: 'Aucune demande en attente',
      noSentRequests: 'Aucune demande envoyée',
      noSuggestions: 'Aucune suggestion disponible',
      pending: "En attente",
      noPending: "Aucune demande en attente"
    },
    admin: {
      dashboard: 'Tableau de bord Admin',
      totalUsers: 'Total Utilisateurs',
      students: 'Étudiants',
      recruiters: 'Organisations',
      suspended: 'Suspendus',
      pendingOpportunities: 'Opportunités en attente',
      approvedOpportunities: 'Opportunités approuvées',
      totalApplications: 'Candidatures totales',
      newUsers30Days: 'Nouveaux utilisateurs (30 jours)',
      pendingEvents: 'Événements en attente',
      quickActions: 'Actions rapides',
      viewPendingOpportunities: 'Voir les opportunités en attente',
      viewPendingEvents: 'Voir les événements en attente',
      verifyRecruiters: 'Vérifier Organisations',
      manageUsers: 'Gérer les utilisateurs',
      viewAuditLog: 'Voir le journal d\'audit',
      unknownAdmin: 'Admin inconnu',
      auditLog: 'Journal d\'audit',
      filterByAction: 'Type d\'action',
      date: 'Date',
      adminCol: 'Admin',
      action: 'Action',
      targetType: 'Type de cible',
      details: 'Détails',
      ipAddress: 'Adresse IP',
      noAuditLogs: 'Aucun journal d\'audit trouvé',
      recruitersVerification: 'Vérification Organisation',
      noUnverifiedRecruiters: 'Aucune organisation non vérifiée',
      registeredOn: 'Inscrit le',
      verify: 'Vérifier',
      usersManagement: 'Gestion des utilisateurs',
      searchPlaceholder: 'Rechercher',
      role: 'Rôle',
      allRoles: 'Tous les rôles',
      status: 'Statut',
      allStatuses: 'Tous les statuts',
      active: 'Actif',
      suspendedStatus: 'Suspendu',
      name: "Nom",
      email: "Email",
      joined: "Inscrit",
      actions: "Actions",
      noUsers: "Aucun utilisateur trouvé",
      suspend: "Suspendre",
      reactivate: "Réactiver",
      suspendUser: "Suspendre Utilisateur",
      suspendConfirm: "Êtes-vous sûr de vouloir suspendre cet utilisateur?",
      suspendReason: "Raison (optionnel)",
      suspendReasonPlaceholder: "Entrez la raison de la suspension...",
      eventApproved: "Événement approuvé avec succès",
      eventRejected: "Événement rejeté",
      noPendingEvents: "Aucun événement en attente",
      approve: "Approuver",
      reject: "Rejeter",
      rejectEvent: "Rejeter l'événement",
      rejectionReason: "Raison du rejet (optionnel)",
      rejectionReasonPlaceholder: "Entrez la raison du rejet...",
      noPendingOpportunities: "Aucune opportunité en attente",
      rejectOpportunity: "Rejeter l'opportunité"
    },
    dashboard: {
      title: 'Tableau de bord',
      welcome: 'Bienvenue',
      completeProfile: "Complétez votre profil pour augmenter votre visibilité",
      pendingConnections: "Demandes en attente",
      recentPosts: "Posts récents",
      recentApplications: "Candidatures récentes"
    },
    opportunities: {
      title: 'Opportunités',
      create: 'Créer',
      edit: 'Modifier l\'opportunité',
      view: 'Voir l\'opportunité',
      applications: 'Candidatures',
      stage: "Stage",
      emploi: "Emploi",
      benevolat: "Bénévolat",
      coverLetter: "Lettre de motivation",
      close: "Fermer l'opportunité",
      myOpportunities: "Mes opportunités",
      noOpportunities: "Aucune opportunité disponible",
      apply: "Postuler",
      coverLetterPlaceholder: "Présentez vos motivations (optionnel)...",
      domain: "Domaine",
      deadline: "Date limite",
      description: "Description",
      skills: "Tapez une compétence et appuyez sur Entrée",
      requirements: "Exigences",
      alreadyApplied: "Déjà postulé",
      closed: "Fermé",
      filterType: "Type",
      filterLocation: "Emplacement",
      filterDomain: "Domaine",
      type: "Type",
      location: "Emplacement"
    },
    events: {
      title: 'Événements',
      create: 'Créer un événement',
      edit: 'Modifier l\'événement',
      register: 'S\'inscrire à l\'événement',
      registered: 'Inscription à l\'événement réussie',
    },
    profile: {
      title: 'Mon profil',
      edit: 'Modifier le profil',
      saved: 'Profil enregistré avec succès',
      myProfile: 'Mon Profil',
      projects: 'Mes Projets',
      profileCompletion: "Complétion du profil",
      editProfile: "Modifier le profil",
      publicProfile: "Profil public",
      skills: "Compétences",
      education: "Éducation",
      experience: "Expérience",
      projectsDescription: "Gérez et présentez vos projets."
    },
    feed: {
      title: 'Fil d\'actualité',
      noPostsYet: 'Aucun post pour le moment',
      createPost: "Publier",
      editPost: "Post mis à jour.",
      delete: "Supprimer",
      writeComment: "Écrire un commentaire...",
      send: "Envoyer",
      comments: "Commentaires",
      confirmDelete: "Êtes-vous sûr de vouloir supprimer ce post ?",
      edit: "Modifier",
      noPosts: "Aucun post pour le moment",
      loadMore: "Charger plus",
      update: "Mettre à jour",
      placeholder: "Quoi de neuf ?"
    },
    settingsPage: {
      changePassword: 'Changer le mot de passe',
      updatePasswordDesc: 'Mettez à jour votre mot de passe pour sécuriser votre compte',
      currentPassword: 'Mot de passe actuel',
      currentPasswordPlaceholder: 'Entrez votre mot de passe actuel',
      newPassword: 'Nouveau mot de passe',
      newPasswordPlaceholder: 'Entrez un nouveau mot de passe',
      confirmNewPassword: 'Confirmer le nouveau mot de passe',
      confirmNewPasswordPlaceholder: 'Confirmez votre nouveau mot de passe',
      changing: 'Modification...',
      changePasswordBtn: 'Changer le mot de passe',
      twoFactor: 'Authentification à deux facteurs',
      twoFactorDesc: 'Ajoutez une couche de sécurité supplémentaire à votre compte',
      status: 'Statut:',
      enabled: 'Activé',
      disabled: 'Désactivé',
      twoFactorActive: 'L\'authentification à deux facteurs est active sur votre compte.',
      twoFactorInactive: 'Activez l\'A2F pour ajouter une couche de sécurité.',
      disable2FA: 'Désactiver l\'A2F',
      enable2FA: 'Activer l\'A2F',
      disabling: 'Désactivation...',
      enabling: 'Activation...',
      confirm2FA: 'Confirmer l\'authentification à deux facteurs',
      enter6digit: 'Entrez le code de vérification à 6 chiffres pour confirmer.',
      enterCodePlaceholder: 'Entrez le code à 6 chiffres',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      confirming: 'Confirmation...',
      deleteAccount: 'Supprimer le compte',
      deleteAccountDesc: 'Supprimez définitivement votre compte et ses données',
      deleteWarning: 'Une fois votre compte supprimé, il n\'y a pas de retour en arrière. Toutes vos données, y compris votre profil, connexions, etc. seront définitivement supprimées.',
      areYouSure: 'Êtes-vous absolument sûr ?',
      cannotUndo: 'Cette action est irréversible. Elle supprimera définitivement votre compte et retirera toutes vos données de nos serveurs, y compris votre profil, vos posts, vos opportunités et vos candidatures.',
      enterPasswordConfirm: 'Entrez votre mot de passe pour confirmer',
      enterPasswordPlaceholder: 'Entrez votre mot de passe',
      deleting: 'Suppression...',
      deleteMyAccount: 'Supprimer mon compte'
    },
    applicants: {
      title: "Candidats",
      subtitle: "Examinez et gérez les candidats pour vos offres d'emploi.",
      all: "Tout",
      searchPlaceholder: "Rechercher par nom ou email...",
      no: "NON",
      candidate: "CANDIDAT",
      opportunity: "OPPORTUNITÉ",
      coverLetter: "LETTRE DE MOTIVATION",
      statusCol: "STATUT",
      noApplicants: "Aucun candidat trouvé",
      noCoverLetter: "Aucune lettre de motivation fournie."
    },
    applications: {
      appliedOn: "Postulé le",
      changeStatus: "Changer le statut",
      viewProfile: "Voir le profil"
    },
    directory: {
      title: "Annuaire",
      filterSkills: "Compétences",
      searchPlaceholder: "Rechercher...",
      filterDomain: "Domaine",
      filterCity: "Ville",
      noProfiles: "Aucun profil trouvé"
    }
  },
};

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('for-minds-locale');
    if (saved === 'fr' || saved === 'en') {
      return saved as Locale;
    }
  }
  return 'en';
}

export function getTranslations(locale: Locale) {
  return translations[locale];
}

export interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Record<string, any>;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(getLocale());
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      localStorage.setItem('for-minds-locale', l);
      document.documentElement.lang = l;
    }
  };

  const t = getTranslations(locale);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLocale() {
  const context = React.useContext(LanguageContext);
  if (!context) {
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: getTranslations('en')
    };
  }
  return context;
}

export function LanguageSwitcher({ onLocaleChange }: { onLocaleChange?: () => void }) {
  const { locale, setLocale } = useLocale();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="uppercase">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              setLocale(lang.code as Locale);
              if (onLocaleChange) onLocaleChange();
            }}
            className={locale === lang.code ? 'bg-accent cursor-pointer' : 'cursor-pointer'}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
