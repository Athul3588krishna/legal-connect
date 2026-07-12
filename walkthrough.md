# LegalAssist Development Walkthrough

This walkthrough documents the full-stack development details of the **LegalAssist – AI-Powered Citizen Legal Guidance System** web application.

## Accomplished Tasks

We successfully scaffolded, coded, and integrated both the frontend and backend architectures:

### 1. Backend Service Layer (`/backend`)
- **Server Entry (`server.js`)**: Coordinates routers, initializes Mongoose database, logs static asset paths, and enforces rate limit rules.
- **Config & DB Connection (`config/db.js`, `config/gemini.js`)**: Establishes connections to MongoDB and initiates the Google Gemini API client with a fallback mock system.
- **Database Models (`models/User.js`, `models/Complaint.js`, `models/Notification.js`, `models/Feedback.js`)**: Defines schemas for JWT sessions, structured AI legal guidelines, advocate advice logs, in-app notifications, and citizen ratings.
- **API Controllers & Routes (`controllers/`, `routes/`)**: Implements clean architecture REST modules for JWT auth, password resets, citizen submissions, follow-up chats, advocate responses, admin charts aggregation, and notification markings.
- **Middlewares (`middleware/`)**: Formulates security limit protections including rate-limit boundaries, file uploads validation using Multer, and role-based permissions (Citizen, Advocate, Admin).
- **PDF Report Compiler (`services/pdfService.js`)**: Standardizes case summaries, statutes, procedure timelines, and disclaimer requirements into elegant, download-streamed PDF documents using `pdfkit`.

### 2. Frontend User Experience (`/frontend`)
- **Global Context (`context/AuthContext.jsx`, `context/ThemeContext.jsx`, `context/ToastContext.jsx`)**: Manages JWT credentials, toggle transitions (light/dark mode), and slide-in notifications.
- **API Linker (`services/api.js`)**: Embeds interceptors to automatically forward tokens and clear expired credential caches.
- **Common Layout (`components/Navbar.jsx`, `components/Footer.jsx`, `components/ProtectedRoute.jsx`)**: Handles burger navigation, notifications bells, warning boxes, and route blocks.
- **View Portals (`pages/`)**:
  - *Public*: Landing Page (Timelines, Heroes), About, Services list, FAQ accordions, and Contact forms.
  - *Auth*: Login, Register, Forgot Password, Reset Password, and Verify Email.
  - *Citizen*: Dashboard stats, file upload lodge forms, evidence check-offs (saved to local storage), and follow-up Gemini chat logs.
  - *Advocate*: Case directories (Open/Responded) and Guidance workspaces.
  - *Admin*: Analytics dashboards drawing Recharts distribution pies/line charts, role managers, and feedback audit boards.

### 🌟 3. Premium Interactive Additions (New!)
- **🎤 Speech-to-Text Dictation**: Incorporated Web Speech API inside the complaint details form (`SubmitComplaint.jsx`), allowing users to speak their grievance naturally and translate voice input to text.
- **📖 Hover-based Legal Dictionary (De-Legalese)**: Built a dynamic translation parser (`DeLegaleseText.jsx`) that underlines complex legalese terms in the AI report and shows definitions in tooltips upon hovering.
- **📄 AI Legal Notice Draft Builder**: Created a pre-filled legal warning notice generator modal (`ComplaintDetail.jsx`) that allows citizens to review, edit, copy, or download a formal letter draft for counterparties based on Gemini's analysis.

---

## Action Plan to Start the Application

### Step 1: Start Database
Ensure MongoDB is active on your machine:
```bash
# Example command for local Windows MongoDB
net start MongoDB
```

### Step 2: Start Backend Server
1. Navigate to `/backend`.
2. Add your **Google Gemini API Key** to the `GEMINI_API_KEY` field in the `.env` file.
3. Seed the initial production admin account:
   ```bash
   node bin/create-admin.js
   ```
4. Start the backend app server:
   ```bash
   npm start
   ```
   *(Server will listen on port `5000`)*

### Step 3: Start Frontend Server
1. Navigate to `/frontend`.
2. Run the Vite development compiler:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.
