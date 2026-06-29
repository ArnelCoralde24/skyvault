# File Vault

A secure, full-stack file management app with:
- Secure login and registration
- JWT authentication
- Password hashing with bcrypt
- Role-based access (admin/user)
- File upload, listing, and deletion
- Activity log and admin overview
- Responsive modern UI

## Structure
- frontend/: static UI served by a simple web server
- backend/: Express API with auth and file routes

## Backend setup
1. `cd backend`
2. Copy `.env.example` to `.env`
3. Install dependencies: `npm install`
4. Start the server: `npm run dev`

## Frontend setup
1. `cd frontend`
2. Install dependencies: `npm install`
3. Start the UI: `npm start`

## Environment variables
See `backend/.env.example`.

## Notes
- MongoDB is preferred. If it is unavailable, the app falls back to in-memory storage.
- Google OAuth can be enabled by adding Google credentials and wiring the callback route.
