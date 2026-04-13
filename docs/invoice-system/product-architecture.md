# Product Architecture

This document translates the research and template system into product structure.

## 1. Product Goal

The application should feel like:

- a premium invoice builder
- a template-driven document studio
- a reliable PDF export tool

It should not feel like:

- a single giant form
- a cramped dual-pane demo
- a generic dashboard template with invoice wording

## 2. Core User Journey

The recommended primary journey is:

1. User lands on a template gallery
2. User chooses a template family
3. User enters the studio
4. User moves through guided steps
5. User opens a dedicated preview view
6. User prints or downloads PDF

## 3. Recommended Route Structure

### `/`

Purpose:

- entry point
- positioning
- template discovery
- start or resume draft

Should contain:

- high-level product statement
- template gallery
- “resume draft” if local draft exists
- lightweight explanation of the workflow

### `/studio`

Purpose:

- invoice editing
- guided creation flow

Should contain:

- step navigation
- concise editing environment
- no forced side-by-side preview
- quick access to preview and export actions

### `/preview`

Purpose:

- full-page document preview
- print-friendly view
- confidence before export

Should contain:

- document-style preview surface
- edit/back action
- print action
- PDF download action

## 4. Editing Model

The editing model should move away from “everything visible at once.”

### Recommended Steps

1. Template
2. Business
3. Client
4. Invoice Meta
5. Line Items
6. Payment And Notes
7. Signature

This can be implemented as:

- a segmented stepper
- a left rail
- or top tabs

The important part is not the exact navigation shape.

The important part is progressive disclosure.

## 5. State Model

The app needs a shared draft model across:

- gallery
- studio
- preview
- PDF export

### Recommended Draft Shape

- invoice metadata
- business details
- client details
- line items
- tax and totals settings
- template selection
- signature data
- UI helper flags where needed

### Persistence Strategy

Use local storage for now, with one normalized draft schema.

Requirements:

- robust default initialization
- partial draft recovery
- safe parsing
- version key for future migrations

## 6. Validation Strategy

Validation should happen in layers.

### Layer 1: Live Field Hygiene

- empty required fields
- negative quantities or rates
- invalid paid-date logic

### Layer 2: Step Completion

- required business name
- required client name
- required invoice number
- at least one valid line item

### Layer 3: Export Validation

Before print or PDF:

- required fields checked again
- totals sanity checked
- invalid combinations blocked

## 7. UI Architecture Principles

### Principle 1

The product UI is not the invoice.

### Principle 2

Preview should be intentional, not squeezed.

### Principle 3

Template choice should feel meaningful before editing starts.

### Principle 4

Actions should be available from the studio and the preview route.

### Principle 5

The PDF system must share data and hierarchy with screen preview.

## 8. Information Architecture

### Home Page Blocks

- hero
- template gallery
- why this product is different
- continue draft block

### Studio Blocks

- slim masthead
- step navigation
- current step form
- action rail or footer

### Preview Blocks

- top toolbar
- centered document surface
- print/PDF actions

## 9. Template Gallery Requirements

The gallery must show real differences between templates.

Each tile should show:

- name
- one-line promise
- mood label
- sample composition
- fit examples

Each tile should not show:

- only a color swatch
- a fake app card
- vague marketing copy with no visual distinction

## 10. Studio Requirements

The studio should optimize for low friction.

### Good Studio Behaviors

- show only relevant fields for the current step
- keep actions visible
- let the user jump between steps
- save automatically
- offer preview without losing progress

### Bad Studio Behaviors

- huge scroll walls
- too many fields at once
- forcing preview to compete with form width
- mixing every concern on one page

## 11. Preview Requirements

Preview is a product surface, not just a debug aid.

### Preview Must

- feel like a document viewer
- use page-centered composition
- show the selected template clearly
- remain readable on laptop and desktop

### Preview Should

- allow quick return to edit
- allow print and PDF download
- allow template switching if desired

## 12. PDF Rendering Architecture

React PDF is a strong fit because:

- it avoids browser binaries in deployment
- it supports structured document rendering
- it lets us encode hierarchy intentionally

### PDF Layer Responsibilities

- document metadata
- page margins
- page flow and wrapping
- line item rendering
- totals logic
- signature rendering
- template-specific document styling

### PDF Layer Must Avoid

- HTML mentality
- component-dashboard styling
- accidental dependence on browser layout behavior

## 13. Shared Design Tokens

The system should define shared invoice tokens such as:

- page margin presets
- label sizes
- body sizes
- financial emphasis sizes
- divider weights
- accent palettes
- spacing scale

These can then be interpreted differently by:

- screen preview
- PDF renderer

## 14. Shared Template Contract

Each template should provide:

- title
- tagline
- use case
- screen preview styles
- PDF layout variant
- palette
- density
- type direction

The rendering layer should not guess these from arbitrary conditions.

## 15. Data Model Recommendations

### Existing Fields To Keep

- status
- currency
- business details
- client details
- invoice number
- issue date
- service date
- due date
- paid date
- notes
- payment details
- payment reference
- signature fields
- tax rate

### Fields To Add Next

- logo data URL
- project title
- PO number
- billing period
- discount
- deposit amount
- tax identifier
- terms

## 16. Component Strategy

The app should be componentized around product concerns, not giant file chunks.

### Suggested Component Groups

#### Template Selection

- `TemplateHero`
- `TemplateGallery`
- `TemplateCard`

#### Studio

- `StudioShell`
- `StudioStepper`
- `BusinessStep`
- `ClientStep`
- `MetaStep`
- `ItemsStep`
- `PaymentStep`
- `SignatureStep`

#### Shared Helpers

- `DraftStatus`
- `StudioActions`
- `ValidationSummary`

#### Preview

- `InvoicePreview`
- `PreviewToolbar`

## 17. File Organization Recommendation

Suggested shape:

- `app/page.tsx`
- `app/studio/page.tsx`
- `app/preview/page.tsx`
- `app/components/invoice/*`
- `lib/invoice-draft.ts`
- `lib/invoice-templates.ts`
- `lib/invoice-pdf.tsx`

## 18. Preview Rendering Strategy

The screen preview and PDF output do not need identical code.

They do need:

- shared data
- shared template semantics
- shared visual intent

The screen preview can use:

- regular React and Tailwind

The PDF can use:

- React PDF document primitives

But both should interpret the same template identity.

## 19. Template Implementation Strategy

Do not implement every template as a completely separate codebase.

Instead:

- define layout families
- define style tokens
- reuse shared sections

For example:

- one minimal family
- one editorial family
- one utility family

Then derive template variants from those families.

## 20. Performance And Reliability

### UI

- keep local state responsive
- avoid huge uncontrolled re-renders where possible

### PDF

- generate only on demand
- keep render logic deterministic
- avoid unnecessary image bloat

### Storage

- debounce local persistence
- guard corrupted drafts

## 21. Accessibility

Even if invoices are primarily visual documents, the product UI still needs strong accessibility.

Requirements:

- labeled fields
- keyboard-usable step navigation
- readable contrast
- focus states
- no hidden critical actions

## 22. Error Handling

The product should provide clear user-facing messages for:

- invalid required fields
- PDF generation failure
- broken stored draft
- image/signature processing failure

Messages should be plain and calm.

They should not expose internal tool instructions like “install playwright.”

## 23. Print Strategy

Preview print CSS should:

- hide app chrome
- center the document
- remove unnecessary shadows
- preserve page rhythm

The product should not depend on browser print as the only reliable export path, but it should still work well.

## 24. Rollout Strategy

### Phase 1

- documentation
- route separation
- template gallery
- multi-step studio
- full-page preview

### Phase 2

- improved PDF templates
- additional business fields
- logo support
- denser invoice variants

### Phase 3

- advanced invoice types
- saved template packs
- document family expansion

## 25. Definition Of Done

The rebuild is successful when:

1. The user starts from a real template gallery.
2. Editing happens in guided steps, not one giant wall.
3. Preview lives comfortably on its own route.
4. The PDF feels like a document, not a boxed UI mockup.
5. The template system clearly supports multiple visual identities.

## 26. Design Guardrails

The following questions should be used as a gate before shipping:

### For The Editor

- Is the step focused?
- Is the page calm?
- Is the next action obvious?

### For The Preview

- Does this feel like a finished invoice?
- Is the reading path clear?
- Is the total due impossible to miss?

### For The PDF

- Does this survive long content?
- Does this work without browser rendering tricks?
- Does this still feel premium when printed?

## 27. Final Architecture Decision

The app should move from:

- single-page form plus side-by-side preview

to:

- template-first multi-step studio with dedicated preview and shared PDF system
