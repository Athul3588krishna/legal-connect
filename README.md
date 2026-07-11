# LegalAssist – AI-Powered Citizen Legal Guidance System

LegalAssist is a production-quality, full-stack web application designed to help ordinary citizens understand their legal disputes, classifications, statutory frameworks, and resolution procedures before consulting a lawyer. 

***
> [!NOTE]
> **Important Disclaimer Requirement**
> "This platform provides informational guidance only and is not a substitute for professional legal advice or court decisions."
***

## Features

### 👤 Citizen Portal
- Register, login, and verify email.
- Lodge complaint grievances (with title, description, incident date, state, district, and document uploads).
- View AI-generated structured guidance reports (summary, classifications, applicable acts, suggested forums, step timelines).
- Interactively check off evidence requirements.
- Ask follow-up questions to an AI legal chatbot.
- Download reports as styled PDF briefs.
- View advice replies submitted by registered advocate panels.

### 💼 Advocate Portal
- Access open citizen case dossiers and uploaded files.
- Submit expert legal advice responses.
- Update case status (Under Review / Resolved).
- Monitor previous case resolution histories.

### 👑 Admin Portal
- Aggregated executive analytics dashboard featuring statistics widgets and charts (Recharts trends and distributions).
- Manage user profiles, roles, and verification flags.
- Audit and modify case statuses or delete dossiers.
- Monitor system-wide citizen feedback reports.

---

## Technical Stack
- **Frontend**: React.js, Tailwind CSS, React Router, Axios, Lucide React, Recharts
- **Backend**: Node.js, Express.js, Multer (file uploads), PDFKit (dossier PDF compilation), Nodemailer (email services)
- **Database**: MongoDB (via Mongoose ODM)
- **AI Engine**: Google Gemini API (`@google/generative-ai`)

---

## Installation & Setup

### Prerequisites
1. **Node.js** (v16 or higher)
2. **MongoDB** (running locally or via a cloud URI)
3. **Google Gemini API Key**

### 1. Backend Setup
1. Open the backend folder:
   ```bash
   cd backend
   ```
2. Create or open the `.env` file and input your credentials:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/legalassist
   JWT_SECRET=supersecret_key_for_legalassist_session_jwt
   JWT_EXPIRE=30d
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   
   # Initial Administrator Seed Config
   INITIAL_ADMIN_USERNAME=admin
   INITIAL_ADMIN_EMAIL=admin@legalassist.com
   INITIAL_ADMIN_PASSWORD=AdminSecurePassword2026!
   ```
3. Run the backend server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Open the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Launch the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:5173`.

---

## Administrative Initial Account Seeding

To seed the initial administrator account, make sure your MongoDB database is running, set the `INITIAL_ADMIN_*` fields in your backend `.env` file, and execute:
```bash
node bin/create-admin.js
```
This script will verify your database configuration, hash the password using bcrypt, and set up the admin profile. All subsequent users (Citizens/Advocates) register directly through the login page in the frontend application.
