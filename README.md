# Invoice Generator

A clean, client-ready invoice builder with live preview, signatures, and professional PDF export. This app is designed to help freelancers and small teams create great-looking invoices fast, with a layout that stays consistent on screen and in PDF.

## Features

- Live preview with multiple templates
- Line items, tax, totals, and status (Draft / Sent / Paid)
- Optional notes and payment details
- Signature tools (draw or upload + crop)
- Autosave to localStorage
- Print and server-rendered PDF export
- Responsive layout for mobile, tablet, and desktop

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- React PDF (server-side PDF rendering)

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` to view the app.

## PDF Export

The Download PDF button uses `@react-pdf/renderer` on the server, so there is no browser install step required.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Contributing

We welcome UI polish and UX improvements. If you want to help, jump in:

- Add new invoice templates
- Improve mobile layout or typography
- Enhance validation or error messaging
- Add localization or multi-currency formatting
- Suggest better defaults for professional invoices

Open an issue or submit a PR. If you’re not sure where to start, describe the UI/UX pain point and we’ll figure it out together.

## Notes

- Print uses the browser print dialog. Download PDF generates a server-rendered PDF for consistent output.
- Invoice drafts are stored locally in your browser (localStorage) while you edit.
