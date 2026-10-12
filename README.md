# Bengal Care Hospital — Billing Desk

Front-desk web app for **OPD doctor appointment billing** and **laboratory test billing**, with A4 PDF bills.
Built on top of the EMR prescription reader project (https://github.com/sayantanIFAI/emr).

## Folders

```
bengal-care-billing/
├── app/                       ← standalone version: open app/index.html in any browser
│   ├── index.html             page structure (screens, forms, tables)
│   ├── css/style.css          all styles (white + blue design)
│   └── js/
│       ├── app.js             all logic: patients, OPD billing, lab billing, dashboard, reports, PDF preview
│       └── pdf-bill-builder.js  A4 bill PDF layout (jsPDF)
├── claude-artifact/
│   └── index.html             the exact single-file version running on the live claude.ai page
├── tools/                     Node script that makes sample bill PDFs
├── samples/                   sample OPD and Lab bill PDFs
└── screenshots/
```

## Run the standalone version

1. Unzip.
2. Double-click `app/index.html` (Chrome, Edge or Firefox). An internet connection is needed for the font and the PDF library.

Or serve the folder (recommended): `cd app && python -m http.server 8000`, then open http://localhost:8000

In the standalone version:

| Works | How |
|---|---|
| All screens, billing, discounts, balances, time slots, reports | Same code as the live page |
| Saving | Kept in this browser (localStorage). Clearing browser data removes it. Each browser/computer has its own data. |
| Doctors | 5 sample doctors are added on first run. Replace them with your own (see below). |
| PDF bill | "Print Receipt" → preview → **Download PDF**, or **Open & Print** (opens the PDF in a new tab; press Ctrl+P) |
| Prescription reading | **Off.** It uses Claude to read the photo, which only exists on the claude.ai page. To run it on your own server, connect `readRx()` in `js/app.js` to the EMR pipeline's `POST /api/jobs`. |

## Screens

- **Dashboard**: today's OPD appointments, lab bills, collected amount, balance due.
- **Patients**: register, search (UHID / name / phone), edit, visit history. UHID format `WB-YYYY-NNNNN`.
- **Appointments**: day-wise list per doctor, receipt, cancel.
- **OPD Billing**: patient, date, time slot (booked slots blocked), doctor, department, consultation type,
  registration + consultation fee, extra items, **lab tests on the same bill**, discount, payment, balance.
- **Lab Billing**: referring doctor, sample date/time/type, test search, quantity/rate, home collection,
  discount, payment, sample status (Pending → Collected → Sent to Lab → Report Ready).
- **Reports**: billed / collected / due for a date range, by payment method and department.
- **Hospital Details** (user menu ▾, or Reports page): name, address, tagline, phone, email, website,
  OPD timings, registration no., GSTIN — printed at the top of every bill.

## Bill PDF

A4, following the `Medical_Bill_Suresh.pdf` template: invoice no., date and contact top-right, hospital
block top-left, Patient Information, Services table (Consultation & Services and Laboratory Tests as
separate sections), totals with amount in words, payment method, PAID/UNPAID mark, footer note.
Long bills continue on page 2. Libraries: jsPDF 2.5.1 + jspdf-autotable 3.8.2 (cdnjs, jsDelivr fallback).

## Where to change things (in `app/js/app.js`)

| What | Search for |
|---|---|
| Test rate card and prices | `const CATALOGUE` |
| Sample doctors added on first run | `function seedLocalDoctors` (or add doctors to the stored list) |
| Registration fee (₹100) | `Registration Fee` in `function opdLines` |
| Payment methods | `const METHODS` |
| Storage (to move to your own server) | `const store` — `set`, `update`, `del`, `exists`; plus `watchDb()` |
| Bill layout | `app/js/pdf-bill-builder.js` → `buildBillPdf` |

## Lab test matching

Tests read from a prescription are matched to the rate card with the alias list from the EMR repo's
`extract/lab_gazetteer.py` plus the Levenshtein + character-bigram matcher from the EMR notebook.
Close (non-exact) matches are marked "check" on screen.

## Before real use

- Doctors and test prices are **sample data** — replace them.
- Fill **Hospital Details** with the real address, phone and registration number.
- The bill states healthcare services by a clinical establishment are GST-exempt — confirm with your accountant.

## Regenerate sample PDFs

```
cd tools
npm install
npm run samples
```
