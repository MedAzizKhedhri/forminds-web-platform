# ForMinds Web Platform - General Documentation

## 1. Executive Summary
**ForMinds** is a digital community engagement platform designed to connect students and graduates with recruiters and industry experts. The platform solves the problem of fragmented job markets, specifically in Tunisia and Africa, by offering a unified space for professional networking, intelligent talent discovery, and community event management.

## 2. System Architecture & Tech Stack

The project follows a distributed, multi-tier architecture to separate concerns, improve scalability, and enable dedicated AI processing workloads.

### 2.1 The Components

- **Frontend (Web Application)**
  - **Framework**: Next.js 16 (React 19)
  - **Language**: TypeScript
  - **Styling**: Tailwind CSS 4, Radix UI for accessible base components
  - **State/Forms**: React Hook Form with Zod for validation
  - **Role**: Serves the user interface, routing, and client-side logic. Communicates with the Backend API. Includes internationalization (default: French).

- **Backend (API Server)**
  - **Environment**: Node.js 20+
  - **Framework**: Express.js 4
  - **Language**: TypeScript
  - **Role**: The core business logic server. Exposes a RESTful API to the Frontend. Manages authentication, database interactions, external integrations (emailing), and delegates AI tasks to the dedicated service.

- **AI Service (Dedicated ML Server)**
  - **Environment**: Python 3.11
  - **Framework**: FastAPI (served via Uvicorn)
  - **Role**: Evaluates applications and connections using AI matching algorithms (TF-IDF/embedding scoring). It processes complex inputs (e.g., CV parsing, skill matching) and returns computed scores to the Backend. The Backend has fallback mechanisms if this service goes down.

- **Database Component**
  - **Database**: MongoDB 7
  - **ORM**: Mongoose 8
  - **Role**: Stores all platform data including User profiles (Student/Recruiter/Admin), Posts, Events, Opportunities, and Applications.

- **Infrastructure & Deployment**
  - **Containerization**: Docker & Docker Compose
  - **Web Server / Reverse Proxy**: Nginx
  - **CI/CD**: GitHub Actions for automated linting, testing, and Docker image building.

### 2.2 How Everything Connects
The platform connects through a clearly defined network and API structure:
1. **User Action**: The User interacts with the Next.js Frontend.
2. **API Request**: The Frontend generates a REST HTTP request (e.g., `POST /api/opportunities/`) and sends it to the Backend.
3. **Authentication Boundary**: The Backend verifies the requested action using JWT (RS256 asymmetric encryption).
4. **Execution & Storage**: The Backend executes the logic, potentially reading/writing to the MongoDB database via Mongoose, or reading/writing files (e.g., image/CV uploads via Multer).
5. **AI Evaluation (Optional Flow)**: If the request involves AI Opportunity Matching or recommendation scoring, the Backend sends an internal HTTP request to the FastAPI AI Service (running on port `8000`). The Python service computes the semantic matches and returns the scoring block to the Node.js Backend.
6. **Response**: The Backend aggregates all data and responds to the Frontend, which updates the UI seamlessly.
7. **Production Environment**: In production, Docker Compose orchestrates these services. Nginx acts as a reverse proxy on ports `80`/`443`, routing `/api/*` traffic to the Express backend and other traffic to the Next.js frontend, all communicating internally over a bridged Docker network (`forminds_network`).

---

## 3. How It Works (User Roles & Workflows)

The platform categorizes users into three distinct roles, each providing specialized workflows:

### 3.1 The Student Workflow
- **Profile Building**: Students register and build comprehensive profiles out of their skills, education journey, past experiences, and portfolio projects (including CV uploads).
- **Networking & Feed**: They can search for peers or recruiters in the Directory, send connection requests, and interact (post, like, comment) in a centralized Social Feed.
- **Opportunities**: Students browse Job and Internship listings. They can rely on **AI Matching** to instantly single out opportunities tailored to their profile score. When applying, the process is streamlined (1-click apply).
- **Events**: They can register for online or in-person events and receive a generated QR code ticket via email for event check-in.

### 3.2 The Recruiter Workflow
- **Company Identity**: Recruiters set up organizational profiles detailing their company, sector, and location. These accounts can be formally *Verified* by an Admin.
- **Talent Discovery**: Recruiters post Opportunities. They access candidate dashboards to review, shortlist, accept, or reject incoming student applications.
- **Event Organization**: Recruiters create Events (from webinars to local career fairs). They handle event capacity, image uploads, and on the day of the event, they use an integrated QR scanner (`html5-qrcode`) to check-in student attendees in real-time.

### 3.3 The Admin Workflow
- **Governance**: Admins monitor health metrics (opportunities, interactions, system loads) via statistical dashboards.
- **Moderation**: Since quality is crucial, Admins must approve or reject pending Opportunities and Events created by Recruiters before they reach the main feed.
- **System Integrity**: Admins verify recruiter identities, handle user suspensions, delete abusive posts/comments, and track all administrative actions through an integrated Audit Log.

---

## 4. Key Security & Functional Features

- **Authentication & Security**
  - **JWT (RS256)**: Secure token signing using asymmetric keys.
  - **2FA**: Email-based two-factor authentication toggled via user settings.
  - **Cascade Processing**: If a user permanently deletes their account, the backend rigorously cascades deletion, effectively erasing user data across posts, likes, comments, and applications.
  
- **Email Communications**
  - Uses `Nodemailer` integrated securely (with Brevo for production or Ethereal for dev). Handles verification links, password resets, and Event QR Code ticketing automated dispatch.

- **Storage Handling**
  - Local disk storage manages assets up to 5MB (avatars, CVs, event banners), connected contextually to MongoDB records.

## 5. Conclusion
ForMinds is built on a modern, typed JavaScript ecosystem with a decoupled Python AI layer. By separating the computationally heavy matching algorithms from the transactional backend APIs, the platform remains highly available, secure, and smoothly interactive under scale.
