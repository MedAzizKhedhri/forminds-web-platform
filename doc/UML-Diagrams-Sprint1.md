# Diagrammes UML — ForMinds Platform

---

## 1. Diagramme de Cas d'Utilisation Global (Macro Vision)

```plantuml
@startuml UC_Global
!theme plain
skinparam actorStyle awesome
skinparam packageStyle rectangle
skinparam usecaseBackgroundColor #F0F4FF
skinparam usecaseBorderColor #3366CC
skinparam actorBackgroundColor #FFCC00
left to right direction

actor "Etudiant" as student
actor "Recruteur" as recruiter
actor "Admin" as admin
actor "Service IA" as ai <<system>>
actor "Service Email" as email <<system>>

rectangle "ForMinds Platform" {

  package "Authentification & Gestion des Roles (BF-001)" {
    usecase "S'inscrire" as UC_REGISTER
    usecase "Se connecter" as UC_LOGIN
    usecase "Se deconnecter" as UC_LOGOUT
    usecase "Reinitialiser mot de passe" as UC_RESET_PWD
    usecase "Verifier email" as UC_VERIFY_EMAIL
    usecase "Activer 2FA" as UC_ENABLE_2FA
    usecase "Desactiver 2FA" as UC_DISABLE_2FA
    usecase "Verifier 2FA" as UC_VERIFY_2FA
  }

  package "Profils & Portfolio (BF-002)" {
    usecase "Gerer profil etudiant" as UC_PROFILE_STU
    usecase "Gerer profil recruteur" as UC_PROFILE_REC
    usecase "Gerer portfolio\n(projets, education,\nexperiences)" as UC_PORTFOLIO
    usecase "Uploader CV" as UC_CV
    usecase "Uploader avatar" as UC_AVATAR
    usecase "Consulter profil public" as UC_PUBLIC_PROFILE
  }

  package "Networking & Annuaire (BF-003)" {
    usecase "Envoyer demande\nde connexion" as UC_CONNECT_REQ
    usecase "Accepter / Refuser\nconnexion" as UC_CONNECT_RESP
    usecase "Consulter annuaire\ndes profils" as UC_DIRECTORY
    usecase "Rechercher profils\n(skills, domaine, ville)" as UC_SEARCH_PROFILES
  }

  package "Opportunites & Candidatures (BF-004)" {
    usecase "Publier une opportunite" as UC_POST_OPP
    usecase "Rechercher opportunites" as UC_SEARCH_OPP
    usecase "Postuler a une\nopportunite" as UC_APPLY
    usecase "Suivre ses candidatures" as UC_TRACK_APP
  }

  package "Matching IA (BF-005)" {
    usecase "Obtenir recommandations\npersonnalisees" as UC_MATCH
    usecase "Calculer score\nde matching" as UC_SCORE
  }

  package "Evenements Hybrides (BF-006)" {
    usecase "Creer un evenement" as UC_CREATE_EVENT
    usecase "S'inscrire a\nun evenement" as UC_JOIN_EVENT
    usecase "Generer QR Code\nparticipant" as UC_QR_GEN
    usecase "Check-in QR" as UC_QR_CHECKIN
  }

  package "Administration (BF-007)" {
    usecase "Consulter dashboard\nadmin" as UC_DASHBOARD
    usecase "Valider / Rejeter\nopportunites" as UC_VALIDATE_OPP
    usecase "Valider role recruteur" as UC_VALIDATE_RECRUITER
    usecase "Suspendre / Reactiver\nutilisateur" as UC_MANAGE_USERS
    usecase "Consulter journal\nd'audit" as UC_AUDIT_LOG
  }
}

' --- Etudiant ---
student --> UC_REGISTER
student --> UC_LOGIN
student --> UC_LOGOUT
student --> UC_RESET_PWD
student --> UC_VERIFY_EMAIL
student --> UC_ENABLE_2FA
student --> UC_DISABLE_2FA
student --> UC_PROFILE_STU
student --> UC_PORTFOLIO
student --> UC_CV
student --> UC_AVATAR
student --> UC_PUBLIC_PROFILE
student --> UC_CONNECT_REQ
student --> UC_CONNECT_RESP
student --> UC_DIRECTORY
student --> UC_SEARCH_PROFILES
student --> UC_SEARCH_OPP
student --> UC_APPLY
student --> UC_TRACK_APP
student --> UC_MATCH
student --> UC_JOIN_EVENT
student --> UC_QR_GEN

' --- Recruteur ---
recruiter --> UC_REGISTER
recruiter --> UC_LOGIN
recruiter --> UC_LOGOUT
recruiter --> UC_RESET_PWD
recruiter --> UC_VERIFY_EMAIL
recruiter --> UC_ENABLE_2FA
recruiter --> UC_DISABLE_2FA
recruiter --> UC_PROFILE_REC
recruiter --> UC_AVATAR
recruiter --> UC_PUBLIC_PROFILE
recruiter --> UC_CONNECT_REQ
recruiter --> UC_CONNECT_RESP
recruiter --> UC_DIRECTORY
recruiter --> UC_SEARCH_PROFILES
recruiter --> UC_POST_OPP
recruiter --> UC_SEARCH_OPP
recruiter --> UC_CREATE_EVENT
recruiter --> UC_QR_CHECKIN

' --- Admin ---
admin --> UC_LOGIN
admin --> UC_LOGOUT
admin --> UC_DASHBOARD
admin --> UC_VALIDATE_OPP
admin --> UC_VALIDATE_RECRUITER
admin --> UC_MANAGE_USERS
admin --> UC_AUDIT_LOG
admin --> UC_CREATE_EVENT

' --- Systemes ---
UC_REGISTER ..> email : <<include>>
UC_VERIFY_EMAIL ..> email : <<include>>
UC_RESET_PWD ..> email : <<include>>
UC_ENABLE_2FA ..> email : <<include>>
UC_MATCH ..> ai : <<include>>
UC_SCORE ..> ai : <<include>>
UC_MATCH ..> UC_SCORE : <<include>>

UC_LOGIN ..> UC_VERIFY_2FA : <<extend>>

@enduml
```

---

## 2. Diagramme de Cas d'Utilisation — Sprint 1

Sprint 1 couvre : **BF-001 (Auth complete)** + **BF-002 partiel (Profils de base)**

```plantuml
@startuml UC_Sprint1
!theme plain
skinparam actorStyle awesome
skinparam packageStyle rectangle
skinparam usecaseBackgroundColor #E8F5E9
skinparam usecaseBorderColor #2E7D32
left to right direction

actor "Etudiant" as student
actor "Recruteur" as recruiter
actor "Admin" as admin
actor "Service Email\n(Nodemailer)" as email <<system>>

rectangle "ForMinds — Sprint 1" {

  package "BF-001 : Authentification & Gestion des Roles" {
    usecase "S'inscrire\n(email + role)" as UC_REG
    usecase "Verifier email\n(lien token)" as UC_VERIF
    usecase "Renvoyer lien\nde verification" as UC_RESEND
    usecase "Se connecter\n(email + password)" as UC_LOG
    usecase "Se deconnecter" as UC_OUT
    usecase "Reinitialiser\nmot de passe" as UC_FORGOT
    usecase "Confirmer reset\n(token + new pwd)" as UC_RESET
    usecase "Rafraichir session\n(refresh token)" as UC_REFRESH
    usecase "Activer 2FA" as UC_2FA_ENABLE
    usecase "Confirmer activation\n2FA (code)" as UC_2FA_CONFIRM
    usecase "Desactiver 2FA" as UC_2FA_DISABLE
    usecase "Verifier code 2FA\n(a la connexion)" as UC_2FA_VERIFY
    usecase "Consulter son profil\n(GET /auth/me)" as UC_ME
  }

  package "BF-002 : Profils de Base (partiel)" {
    usecase "Consulter son profil" as UC_GET_PROFILE
    usecase "Modifier profil\netudiant" as UC_UPD_STUDENT
    usecase "Modifier profil\nrecruteur" as UC_UPD_RECRUITER
    usecase "Ajouter / Modifier /\nSupprimer projet" as UC_PROJECT
    usecase "Ajouter / Modifier /\nSupprimer education" as UC_EDU
    usecase "Ajouter / Modifier /\nSupprimer experience" as UC_EXP
    usecase "Uploader / Supprimer CV" as UC_CV
    usecase "Uploader avatar" as UC_AVATAR
    usecase "Consulter profil\npublic (par username)" as UC_PUBLIC
    usecase "Supprimer son compte\n(mot de passe requis)" as UC_DELETE_ACCOUNT
  }
}

' --- Etudiant ---
student --> UC_REG
student --> UC_VERIF
student --> UC_RESEND
student --> UC_LOG
student --> UC_OUT
student --> UC_FORGOT
student --> UC_RESET
student --> UC_REFRESH
student --> UC_2FA_ENABLE
student --> UC_2FA_CONFIRM
student --> UC_2FA_DISABLE
student --> UC_ME
student --> UC_GET_PROFILE
student --> UC_UPD_STUDENT
student --> UC_PROJECT
student --> UC_EDU
student --> UC_EXP
student --> UC_CV
student --> UC_AVATAR
student --> UC_PUBLIC
student --> UC_DELETE_ACCOUNT

' --- Recruteur ---
recruiter --> UC_REG
recruiter --> UC_VERIF
recruiter --> UC_RESEND
recruiter --> UC_LOG
recruiter --> UC_OUT
recruiter --> UC_FORGOT
recruiter --> UC_RESET
recruiter --> UC_REFRESH
recruiter --> UC_2FA_ENABLE
recruiter --> UC_2FA_CONFIRM
recruiter --> UC_2FA_DISABLE
recruiter --> UC_ME
recruiter --> UC_GET_PROFILE
recruiter --> UC_UPD_RECRUITER
recruiter --> UC_AVATAR
recruiter --> UC_PUBLIC
recruiter --> UC_DELETE_ACCOUNT

' --- Admin ---
admin --> UC_LOG
admin --> UC_OUT
admin --> UC_ME

' --- Relations ---
UC_REG ..> email : <<include>>\nEnvoi lien verification
UC_VERIF ..> email : <<include>>
UC_RESEND ..> email : <<include>>
UC_FORGOT ..> email : <<include>>\nEnvoi lien reset
UC_2FA_ENABLE ..> email : <<include>>\nEnvoi code 2FA
UC_LOG ..> UC_2FA_VERIFY : <<extend>>\nSi 2FA actif

@enduml
```

---

## 3. Diagrammes de Sequence — Sprint 1

### 3.1 Inscription (Register)

```plantuml
@startuml SEQ_Register
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

user -> front : Remplit formulaire inscription\n(email, password, nom, prenom,\nusername, role)
front -> front : Validation Zod cote client
front -> api : POST /api/auth/register\n{email, password, firstName,\nlastName, username, role}

api -> api : Validation Zod cote serveur
api -> db : Verifier unicite email & username
alt Email ou username deja existant
  db --> api : Erreur doublon
  api --> front : 409 {success: false,\nmessage: "Duplicate value..."}
  front --> user : Afficher erreur
else Donnees valides
  api -> api : Hasher mot de passe (bcrypt)
  api -> db : Creer User
  db --> api : User cree
  api -> db : Generer token verification\n(UUID v4, expire 24h)
  db --> api : Token sauvegarde
  api -> mail : Envoyer email verification\n(lien avec token + email)
  mail --> api : Email envoye
  api --> front : 201 {success: true,\nmessage: "Registration successful.\nPlease check your email..."}
  front --> user : Afficher message succes\n"Verifiez votre email"
end

@enduml
```

### 3.2 Verification Email

```plantuml
@startuml SEQ_VerifyEmail
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
database "MongoDB" as db

user -> front : Clique lien verification\n(/verify-email?token=xxx&email=yyy)
front -> front : Extraire token et email\nde searchParams
front -> api : POST /api/auth/verify-email\n{token, email}

api -> api : Validation Zod
api -> db : Chercher User par email
alt User non trouve
  api --> front : 404 {success: false}
  front --> user : Afficher erreur
else User trouve
  api -> db : Chercher Token\n(type: email_verification,\nnon utilise, non expire)
  alt Token invalide ou expire
    api --> front : 400 {success: false,\nmessage: "Invalid or expired token"}
    front --> user : Afficher erreur
  else Token valide
    api -> db : Marquer token comme utilise\n(isUsed = true)
    api -> db : Mettre a jour User\n(isEmailVerified = true)
    db --> api : OK
    api --> front : 200 {success: true,\nmessage: "Email verified successfully"}
    front --> user : Afficher succes +\nbouton "Aller au login"
  end
end

@enduml
```

### 3.3 Connexion (Login)

```plantuml
@startuml SEQ_Login
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

user -> front : Saisir email + password
front -> front : Validation Zod
front -> api : POST /api/auth/login\n{email, password}

api -> api : Validation Zod
api -> db : Chercher User par email\n(avec password)
alt User non trouve
  api --> front : 401 {success: false,\nmessage: "Invalid credentials"}
  front --> user : Afficher erreur
else User trouve
  api -> api : Verifier password (bcrypt.compare)
  alt Password incorrect
    api --> front : 401 {success: false}
    front --> user : Afficher erreur
  else Password correct
    api -> api : Verifier isEmailVerified
    alt Email non verifie
      api --> front : 403 {success: false,\nmessage: "Email not verified"}
      front --> user : Afficher erreur
    else Email verifie
      api -> api : Verifier isActive
      alt Compte desactive
        api --> front : 403 {success: false}
        front --> user : Afficher erreur
      else Compte actif
        alt 2FA active (is2FAEnabled)
          api -> db : Generer code 2FA\n(6 chiffres, expire 10min)
          api -> mail : Envoyer code 2FA par email
          api --> front : 200 {success: true,\ndata: {requires2FA: true}}
          front --> user : Rediriger vers page 2FA
        else 2FA non active
          api -> api : Generer Access Token (JWT RS256)
          api -> db : Generer Refresh Token\n(UUID, hash bcrypt, expire 7j)
          api -> db : Mettre a jour lastLoginAt
          api --> front : 200 {success: true,\ndata: {user, accessToken}}\n+ Set-Cookie: refreshToken (httpOnly)
          front -> front : Stocker accessToken en memoire\nDispatch SET_USER
          front --> user : Rediriger vers /dashboard
        end
      end
    end
  end
end

@enduml
```

### 3.4 Verification 2FA

```plantuml
@startuml SEQ_Verify2FA
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
database "MongoDB" as db

user -> front : Saisir code 2FA (6 chiffres)
front -> api : POST /api/auth/verify-2fa\n{email, code}

api -> api : Validation Zod
api -> db : Chercher User par email
api -> db : Chercher Token\n(type: two_factor, non utilise,\nnon expire, code correspondant)

alt Code invalide ou expire
  api --> front : 401 {success: false,\nmessage: "Invalid 2FA code"}
  front --> user : Afficher erreur
else Code valide
  api -> db : Marquer token 2FA comme utilise
  api -> api : Generer Access Token (JWT RS256)
  api -> db : Generer Refresh Token
  api -> db : Mettre a jour lastLoginAt
  api --> front : 200 {success: true,\ndata: {user, accessToken}}\n+ Set-Cookie: refreshToken
  front -> front : Stocker accessToken\nDispatch SET_USER
  front --> user : Rediriger vers /dashboard
end

@enduml
```

### 3.5 Desactivation 2FA

```plantuml
@startuml SEQ_Disable2FA
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate)" as mw
database "MongoDB" as db

user -> front : Cliquer "Desactiver 2FA"\ndans Settings
front -> api : POST /api/auth/disable-2fa\n(Authorization: Bearer <token>)

api -> mw : authenticate
mw -> mw : Verifier JWT (RS256)
mw -> db : Verifier User existe et actif
mw --> api : req.user = {userId, role, email}

api -> db : Chercher User par userId
alt User non trouve
  api --> front : 404 {success: false,\nmessage: "User not found."}
  front --> user : Afficher erreur
else User trouve
  alt 2FA non active
    api --> front : 400 {success: false,\nmessage: "Two-factor authentication\nis not enabled."}
    front --> user : Afficher erreur
  else 2FA active
    api -> db : Mettre a jour User\n(is2FAEnabled = false)
    db --> api : OK
    api --> front : 200 {success: true,\nmessage: "Two-factor authentication\nhas been disabled successfully."}
    front -> front : Mettre a jour etat local\n(is2FAEnabled = false)
    front --> user : Afficher toast succes\n+ mettre a jour toggle 2FA
  end
end

@enduml
```

### 3.6 Rafraichissement de Session (Refresh Token)

```plantuml
@startuml SEQ_RefreshToken
!theme plain
skinparam sequenceMessageAlign center

participant "Frontend\n(Next.js)" as front
participant "Axios\nInterceptor" as interceptor
participant "Backend API\n(Express)" as api
database "MongoDB" as db

== Cas 1 : Restauration de session (chargement page) ==

front -> front : useEffect — initAuth()
front -> api : POST /api/auth/refresh\n(Cookie: refreshToken)
note right of front : Pas d'Authorization header\n(accessToken perdu apres refresh page)

api -> api : Extraire refreshToken du cookie
api -> db : Chercher tous les Refresh Tokens\nvalides (non expires, non utilises)
api -> api : bcrypt.compare pour chaque token
alt Token trouve
  api -> db : Invalider ancien token (isUsed=true)
  api -> api : Generer nouveau Access Token
  api -> db : Generer nouveau Refresh Token
  api --> front : 200 {data: {accessToken}}\n+ Set-Cookie: nouveau refreshToken
  front -> front : setAccessToken(accessToken)
  front -> api : GET /api/auth/me\n(Authorization: Bearer <token>)
  api --> front : 200 {data: {user}}
  front -> front : dispatch SET_USER
else Token invalide / expire
  api --> front : 401 {success: false}
  front -> front : clearAccessToken()\ndispatch SET_LOADING(false)
  front -> front : Afficher page login
end

== Cas 2 : Renouvellement automatique (401 intercepte) ==

front -> api : GET /api/profiles/me\n(Authorization: Bearer <token_expire>)
api --> front : 401 Unauthorized
interceptor -> api : POST /api/auth/refresh\n(Cookie: refreshToken)
api --> interceptor : 200 {data: {accessToken}}
interceptor -> interceptor : setAccessToken(nouveau token)
interceptor -> api : Rejouer requete originale\nGET /api/profiles/me\n(Authorization: Bearer <nouveau_token>)
api --> front : 200 {data: {profile}}

@enduml
```

### 3.7 Reinitialisation Mot de Passe

```plantuml
@startuml SEQ_ResetPassword
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
database "MongoDB" as db
participant "Email Service\n(Nodemailer)" as mail

== Phase 1 : Demande de reinitialisation ==

user -> front : Saisir email
front -> api : POST /api/auth/forgot-password\n{email}
api -> db : Chercher User par email
alt User existe
  api -> db : Invalider anciens tokens reset
  api -> db : Generer token reset\n(UUID, expire 1h)
  api -> mail : Envoyer email avec lien reset
end
api --> front : 200 {success: true,\nmessage: "If an account exists..."}
note right : Toujours 200 pour eviter\nl'enumeration d'emails
front --> user : Afficher message\n"Verifiez votre email"

== Phase 2 : Nouveau mot de passe ==

user -> front : Clique lien reset +\nsaisit nouveau mot de passe
front -> api : POST /api/auth/reset-password\n{token, email, newPassword}
api -> api : Validation Zod (password rules)
api -> db : Valider token\n(type: password_reset,\nnon utilise, non expire)
alt Token valide
  api -> db : Marquer token comme utilise
  api -> api : Hasher nouveau password (bcrypt)
  api -> db : Mettre a jour password User
  api --> front : 200 {success: true,\nmessage: "Password reset successful"}
  front --> user : Afficher succes +\nrediriger vers login
else Token invalide
  api --> front : 400 {success: false}
  front --> user : Afficher erreur
end

@enduml
```

### 3.8 Gestion Profil (Consulter & Modifier)

```plantuml
@startuml SEQ_Profile
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
participant "Middleware\n(authenticate + authorize)" as mw
database "MongoDB" as db

== Consulter son profil ==

user -> front : Naviguer vers /profile
front -> api : GET /api/profiles/me\n(Authorization: Bearer <token>)
api -> mw : authenticate
mw -> mw : Verifier JWT (RS256)
mw -> db : Verifier User existe et actif
mw --> api : req.user = {userId, role, email}
api -> db : Chercher profil par userId et role\n(StudentProfile ou RecruiterProfile)
db --> api : Profil
api --> front : 200 {data: {profile}}
front --> user : Afficher formulaire profil

== Modifier profil etudiant ==

user -> front : Modifier champs + soumettre
front -> api : PUT /api/profiles/me\n{headline, bio, skills, ...}
api -> mw : authenticate
mw --> api : OK
api -> api : Validation Zod (updateStudentProfileSchema)
api -> db : findOneAndUpdate StudentProfile
db --> api : Profil mis a jour
api --> front : 200 {data: {profile}}
front --> user : Afficher notification succes

== Ajouter un projet (etudiant) ==

user -> front : Remplir formulaire projet
front -> api : POST /api/profiles/me/projects\n{title, description, technologies, link}
api -> mw : authenticate + authorize(STUDENT)
alt Role != student
  mw --> front : 403 Forbidden
else Autorise
  api -> api : Validation Zod (projectSchema)
  api -> db : Push projet dans StudentProfile.projects
  db --> api : Profil mis a jour
  api --> front : 201 {data: {profile}}
  front --> user : Afficher projet ajoute
end

@enduml
```

### 3.9 Deconnexion (Logout)

```plantuml
@startuml SEQ_Logout
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
database "MongoDB" as db

user -> front : Cliquer "Deconnexion"
front -> api : POST /api/auth/logout\n(Authorization: Bearer <token>)\n(Cookie: refreshToken)

api -> api : authenticate middleware
api -> db : Revoquer tous les refresh tokens\nde l'utilisateur (isUsed = true)
api -> api : Supprimer cookie refreshToken
api --> front : 200 {success: true,\nmessage: "Logged out successfully"}

front -> front : clearAccessToken()
front -> front : dispatch LOGOUT
front --> user : Rediriger vers /login

@enduml
```

### 3.10 Suppression de Compte (Delete Account)

```plantuml
@startuml SEQ_DeleteAccount
!theme plain
skinparam sequenceMessageAlign center

actor Utilisateur as user
participant "Frontend\n(Next.js)" as front
participant "Backend API\n(Express)" as api
database "MongoDB" as db

user -> front : Cliquer "Delete Account"\ndans Settings
front --> user : Afficher AlertDialog\nde confirmation

user -> front : Saisir mot de passe\net confirmer
front -> api : DELETE /api/profiles/me/account\n{password}\n(Authorization: Bearer <token>)

api -> api : authenticate middleware
api -> api : Validation Zod ({password})
api -> db : Chercher User par ID\n(avec password)

alt User non trouve
  api --> front : 404 {success: false}
  front --> user : Afficher erreur
else User trouve
  api -> api : Verifier password (bcrypt.compare)
  alt Password incorrect
    api --> front : 401 {success: false,\nmessage: "Incorrect password."}
    front --> user : Afficher erreur inline\n(dialog reste ouvert)
  else Password correct
    api -> db : Collecter chemins fichiers\n(avatar, cover, CV)
    api -> db : Phase 1 : Decrementer likesCount\net commentsCount sur les posts\ndes autres utilisateurs
    api -> db : Phase 2 : Supprimer\nLikes, Comments, Applications
    api -> db : Phase 3 : Supprimer\nPosts, Opportunities,\nConnections, Tokens
    api -> db : Phase 4 : Supprimer\nStudentProfile, RecruiterProfile, User
    api -> api : Nettoyer fichiers sur disque\n(best-effort)
    api --> front : 200 {success: true,\nmessage: "Account deleted successfully."}
    front -> front : logout()\nclearAccessToken()\ndispatch LOGOUT
    front --> user : Rediriger vers /login
  end
end

@enduml
```

---

## 4. Diagramme de Classes — Sprint 1

```plantuml
@startuml CLASS_Sprint1
!theme plain
skinparam classAttributeIconSize 0
skinparam classFontSize 13
skinparam classAttributeFontSize 11

' === Enums ===

enum UserRole {
  STUDENT = "student"
  RECRUITER = "recruiter"
  ADMIN = "admin"
}

enum AuthProvider {
  LOCAL = "local"
  GOOGLE = "google"
  LINKEDIN = "linkedin"
}

enum TokenType {
  REFRESH = "refresh"
  EMAIL_VERIFICATION = "email_verification"
  PASSWORD_RESET = "password_reset"
  TWO_FACTOR = "two_factor"
}

' === Models ===

class User <<Document>> {
  - _id : ObjectId
  - email : string {unique}
  - password : string {select: false}
  - firstName : string
  - lastName : string
  - username : string {unique}
  - role : UserRole
  - authProvider : AuthProvider
  - isEmailVerified : boolean
  - is2FAEnabled : boolean
  - isActive : boolean
  - avatar? : string
  - coverImage? : string
  - lastLoginAt? : Date
  - createdAt : Date
  - updatedAt : Date
}

class Token <<Document>> {
  - _id : ObjectId
  - userId : ObjectId <<FK>>
  - token : string
  - type : TokenType
  - expiresAt : Date
  - isUsed : boolean
  - createdAt : Date
  - updatedAt : Date
}

class StudentProfile <<Document>> {
  - _id : ObjectId
  - userId : ObjectId {unique} <<FK>>
  - headline? : string
  - bio? : string
  - phone? : string
  - location? : string
  - website? : string
  - linkedinUrl? : string
  - githubUrl? : string
  - skills : string[]
  - education : Education[]
  - experiences : Experience[]
  - projects : Project[]
  - cvUrl? : string
  - profileCompletionPercent : number
  - isPublic : boolean
  - createdAt : Date
  - updatedAt : Date
}

class RecruiterProfile <<Document>> {
  - _id : ObjectId
  - userId : ObjectId {unique} <<FK>>
  - companyName : string
  - sector : string
  - companyDescription? : string
  - companyWebsite? : string
  - companyLogo? : string
  - contactEmail? : string
  - contactPhone? : string
  - location? : string
  - isVerified : boolean
  - createdAt : Date
  - updatedAt : Date
}

' === Sub-documents (embedded) ===

class Project <<Embedded>> {
  - _id : ObjectId
  - title : string
  - description : string
  - technologies : string[]
  - link? : string
  - image? : string
}

class Education <<Embedded>> {
  - _id : ObjectId
  - institution : string
  - degree : string
  - field : string
  - startDate : Date
  - endDate? : Date
  - current : boolean
}

class Experience <<Embedded>> {
  - _id : ObjectId
  - company : string
  - position : string
  - description? : string
  - startDate : Date
  - endDate? : Date
  - current : boolean
}

' === Services ===

class AuthService <<Service>> {
  + register(data) : User
  + login(email, password) : {user, accessToken, refreshToken}
  + verifyEmail(token, email) : void
  + resendVerification(email) : void
  + forgotPassword(email) : void
  + resetPassword(token, email, newPassword) : void
  + enable2FA(userId) : void
  + confirm2FA(userId, code) : void
  + disable2FA(userId) : void
  + verify2FA(email, code) : {user, accessToken, refreshToken}
}

class TokenService <<Service>> {
  + generateAccessToken(user) : string
  + generateRefreshToken(userId) : string
  + verifyAccessToken(token) : JwtPayload
  + refreshTokens(refreshToken, userId?) : {accessToken, refreshToken}
  + revokeAllRefreshTokens(userId) : void
  + generateVerificationToken(userId) : string
  + generatePasswordResetToken(userId) : string
  + generate2FACode(userId) : string
  + validateToken(token, type) : Token | null
}

class ProfileService <<Service>> {
  + getProfile(userId, role) : Profile
  + updateStudentProfile(userId, data) : StudentProfile
  + updateRecruiterProfile(userId, data) : RecruiterProfile
  + addProject(userId, data) : StudentProfile
  + updateProject(userId, projectId, data) : StudentProfile
  + removeProject(userId, projectId) : StudentProfile
  + addEducation(userId, data) : StudentProfile
  + updateEducation(userId, eduId, data) : StudentProfile
  + removeEducation(userId, eduId) : StudentProfile
  + addExperience(userId, data) : StudentProfile
  + updateExperience(userId, expId, data) : StudentProfile
  + removeExperience(userId, expId) : StudentProfile
  + updateCV(userId, cvUrl) : StudentProfile
  + removeCV(userId) : StudentProfile
  + updateAvatar(userId, avatarUrl) : User
  + removeAvatar(userId) : User
  + updateCoverImage(userId, coverImageUrl) : User
  + removeCoverImage(userId) : User
  + getPublicProfile(username) : {user, profile}
  + deleteAccount(userId, password) : void
}

class EmailService <<Service>> {
  + sendVerificationEmail(email, token) : void
  + sendPasswordResetEmail(email, token) : void
  + send2FACode(email, code) : void
}

' === Middleware ===

class AuthMiddleware <<Middleware>> {
  + authenticate(req, res, next) : void
  + authorize(...roles) : Middleware
}

' === Relationships ===

User "1" -- "0..*" Token : possede >
User "1" -- "0..1" StudentProfile : a >
User "1" -- "0..1" RecruiterProfile : a >
User ..> UserRole : utilise >
User ..> AuthProvider : utilise >
Token ..> TokenType : utilise >

StudentProfile *-- "0..*" Project : contient >
StudentProfile *-- "0..*" Education : contient >
StudentProfile *-- "0..*" Experience : contient >

AuthService ..> TokenService : utilise >
AuthService ..> EmailService : utilise >
AuthService ..> User : manipule >
TokenService ..> Token : manipule >
ProfileService ..> StudentProfile : manipule >
ProfileService ..> RecruiterProfile : manipule >
ProfileService ..> User : manipule >

AuthMiddleware ..> TokenService : utilise >
AuthMiddleware ..> User : verifie >

@enduml
```

---

## 5. Diagramme de Deploiement

```plantuml
@startuml DEPLOY
!theme plain
skinparam nodeBackgroundColor #F5F5F5
skinparam nodeBorderColor #333333
skinparam componentBackgroundColor #E3F2FD

node "Client" as client {
  component "Navigateur Web\n(Chrome, Firefox, Safari)" as browser
}

node "Serveur Docker Host" as server {

  node "Docker Network : forminds_network" as docker {

    node "Container : forminds-nginx\n(nginx:1.25-alpine)" as nginx_node {
      component "NGINX\nReverse Proxy" as nginx
      note right of nginx
        Port 80 / 443
        TLS 1.3
        Route /api -> backend:5000
        Route / -> frontend:3000
      end note
    }

    node "Container : forminds-frontend\n(node:20-alpine)" as front_node {
      component "Next.js 16\n(React 19 + TypeScript)" as nextjs
      component "SSR / CSR\nApp Router" as ssr
      nextjs --> ssr
    }

    node "Container : forminds-backend\n(node:20-alpine)" as back_node {
      component "Express.js\nREST API" as express
      component "Middleware Stack\n(helmet, cors, rate-limit,\nauthenticate, authorize)" as middleware
      component "JWT RS256\n(private.pem / public.pem)" as jwt
      express --> middleware
      express --> jwt
    }

    node "Container : forminds-ai\n(python:3.11)" as ai_node {
      component "FastAPI\n+ Uvicorn" as fastapi
      component "Moteur de Matching\n(ML / Similarite)" as ml
      fastapi --> ml
    }

    node "Container : forminds-mongodb\n(mongo:7.0)" as db_node {
      database "MongoDB\nBase : forminds" as mongo
      component "Collections :\n- users\n- tokens\n- studentprofiles\n- recruiterprofiles" as collections
      mongo --> collections
    }
  }
}

' === Connections ===

browser --> nginx : HTTPS (443)
nginx --> nextjs : HTTP (3000)
nginx --> express : HTTP (5000)\n/api/*
nextjs --> express : HTTP (5000)\nAppels API (SSR)
express --> mongo : TCP (27017)\nMongoose
express --> fastapi : HTTP (8000)\n/api/match
browser --> nextjs : WebSocket\n(HMR dev uniquement)

' === Volume ===

note bottom of db_node
  Volume persistant :
  forminds_mongo_data -> /data/db
end note

note bottom of back_node
  Volumes :
  - ./keys -> JWT RSA keys
  - ./uploads -> fichiers CV, avatars
end note

@enduml
```

---

## Legende

| Diagramme | Description |
|-----------|-------------|
| **1. UC Global** | Vision macro de tous les cas d'utilisation du projet (tous sprints confondus) |
| **2. UC Sprint 1** | Cas d'utilisation specifiques au Sprint 1 (BF-001 + BF-002 partiel) |
| **3. Sequences** | Flux detailles des interactions pour chaque fonctionnalite du Sprint 1 |
| **4. Classes** | Structure des donnees (modeles MongoDB) et services metier du Sprint 1 |
| **5. Deploiement** | Architecture d'infrastructure avec Docker Compose et NGINX |
