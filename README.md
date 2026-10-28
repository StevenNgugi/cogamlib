# COGAM DIGITAL LIBRARY

A responsive digital Christian media library for **COGAM {Word of Truth}**.

## Live site
https://cogam-digital-library-6kql36.v2.appdeploy.ai/

## Features
- Public home, browse, categories, search and media-format filters
- Audio messages, video, eBooks, article viewer, and browser-saved favourites
- Admin-only sign-in with server-enforced email allowlist
- Admin dashboard, upload, publish/unpublish, feature, edit, delete
- Secure hosted storage for small media files (3.5 MB maximum via form)
- Direct HTTPS links for larger audio, video and eBooks
- Responsive installable web-app experience and manifest

## Project structure
- src/ – React/Vite frontend
- backend/index.ts – AppDeploy APIs and protected content endpoints
- public/ – web icon and manifest
- tests/tests.json – end-to-end workflow tests

## Development
Run npm install then npm run dev.

The AppDeploy SDK supplies the hosted backend, authentication, database and storage; standalone local Vite development does not run the backend automatically.

## Admin security
Admin API routes check the authenticated account against an explicit email allowlist in backend/index.ts. Do not put passwords or API secrets in this public repository.

## Deployment
This repository is a source snapshot. Changes published through AppDeploy are not automatically pushed to GitHub, and GitHub pushes are not configured to redeploy AppDeploy.
