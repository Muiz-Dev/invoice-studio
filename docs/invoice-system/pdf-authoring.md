# PDF Authoring Guide

This document defines how the invoice system should be authored for PDF generation.

The point is not only to generate a PDF.

The point is to generate a durable, branded, legible financial document that survives real-world use.

## 1. Authoring Philosophy

PDF generation should be approached as document design engineering.

That means:

- layout decisions are intentional
- hierarchy is explicit
- page flow is considered
- content failure modes are planned

## 2. Why The PDF Layer Matters

The PDF is often:

- the version emailed to a client
- the version attached to accounting records
- the version uploaded to portals
- the version printed or archived

So it must not behave like an afterthought export.

## 3. PDF Layer Responsibilities

The PDF system is responsible for:

- page composition
- repeatable structure
- document metadata
- file consistency
- export trust

It is not responsible for:

- product onboarding
- editing experience
- gallery selection

## 4. Renderer Choice

The current system uses `@react-pdf/renderer`.

Why it fits:

- no browser binary dependency
- explicit document primitives
- predictable server-side generation
- good alignment with React mental models

## 5. Shared Data Contract

The PDF layer should consume one normalized payload shape shared by:

- studio
- preview
- export

That avoids drift between:

- what the user edited
- what the preview showed
- what the PDF exported

## 6. Template Responsibility In PDF

Templates are not cosmetic overlays.

Each template must influence:

- header composition
- typographic emphasis
- table rhythm
- summary placement
- support section flow

## 7. General PDF Rules

### 7.1 Never Assume Short Content

Fields that can grow:

- business address
- client address
- line item descriptions
- notes
- payment details

### 7.2 Never Assume Single Page

Long invoices must still look intentional.

### 7.3 Never Depend On Browser HTML

The PDF structure must be authored directly for the document system.

## 8. Page Rules

### 8.1 Margins

Margins should be wide enough to feel premium and narrow enough to preserve usable table width.

### 8.2 Backgrounds

Use soft page tone only when it survives printing gracefully.

### 8.3 Content Density

Template density affects:

- top spacing
- row spacing
- section spacing
- summary compactness

## 9. Metadata Rules

The PDF should provide:

- title
- author
- subject
- creator
- producer

This improves professionalism and document management.

## 10. Header Rules

The header must make clear:

- this is an invoice
- which invoice it is
- whether it is draft, sent, or paid
- what total is due

Do not let status dominate the page.

## 11. Parties Rules

The seller and buyer blocks should remain clear even with missing optional lines.

If an address is absent:

- collapse naturally
- do not leave visual ghosts or awkward space

## 12. Table Rules

### 12.1 Column Priorities

1. description
2. amount
3. rate
4. quantity

in terms of expressive importance

### 12.2 Long Descriptions

Descriptions must wrap without breaking financial alignment.

### 12.3 Row Rhythm

Rows should feel even and intentional across pages.

### 12.4 Headers

Column headers should be repeated when page flow requires it in future iterations.

## 13. Totals Rules

The summary must:

- read clearly
- stay compact
- remain distinct from notes
- visually conclude the document

The total due should be the most important financial number on the page.

## 14. Support Section Rules

Support sections include:

- payment details
- payment reference
- notes
- signature

These should:

- be readable
- remain secondary
- avoid container spam

## 15. Signature Rules

Signatures should:

- render at a controlled height
- use transparent or light-background-compatible images
- avoid dominating the support area

## 16. Template-Specific PDF Behavior

## 16.1 Minimal Ledger

PDF behavior:

- compact, clean, balanced
- right summary column
- restrained rules

## 16.2 Editorial Serif

PDF behavior:

- slightly larger heading moments
- lower border dependence
- calmer field rhythm

## 16.3 Studio Modern

PDF behavior:

- stronger top accent gesture
- more assertive asymmetry
- modern balance between branding and billing

## 16.4 Warm Service

PDF behavior:

- softer tonal environment
- approachable support area
- friendly but grown-up spacing

## 16.5 Contractor Utility

PDF behavior:

- denser metadata handling
- more rigorous table structure
- practical summary emphasis

## 16.6 Statement Balance

PDF behavior:

- balance-centered composition
- reduced ornament
- strong account-document discipline

## 17. Page Break Strategy

Future-safe page break logic should assume:

- line items may span multiple pages
- totals should avoid isolation where possible
- support sections should not start in awkward fragments

## 18. Image Rules

### 18.1 Logos

When logo support is added:

- preserve aspect ratio
- cap rendered size
- avoid visual takeover

### 18.2 Signatures

Trim whitespace when possible.

### 18.3 Embedded Assets

Only embed what materially improves the document.

## 19. Failure Mode Planning

The renderer should behave well when:

- business fields are partially missing
- notes are empty
- payment details are hidden
- there is no signature
- only one line item exists
- many line items exist

## 20. QA Checklist For PDF

Before shipping a template, test:

1. one short item
2. many items
3. very long descriptions
4. missing client address
5. hidden notes
6. hidden payment details
7. paid status
8. no signature
9. large signature
10. different currencies

## 21. Export Naming Rules

The file name should be:

- predictable
- safe for common systems
- based on invoice number when present

## 22. Performance Rules

### 22.1 Generate On Demand

Render only when needed.

### 22.2 Keep Data Clean

Normalized data reduces renderer branching complexity.

### 22.3 Avoid Unnecessary Asset Weight

Huge images and oversized base64 payloads will slow export.

## 23. Design Review Questions For PDF

1. Does this feel like a finished invoice?
2. Does the layout still work on paper?
3. Does the template feel distinct from the others?
4. Does this template rely on container styling too much?
5. Would a client trust this document immediately?

## 24. Future Work

The PDF layer should be ready for:

- template packs
- more metadata fields
- recurring invoice variants
- logo support
- grouped line items
- discount and deposit rows
- multi-page table header repetition

## 25. Final Rule

If the PDF starts to feel like a UI screenshot, the authoring approach is wrong.
