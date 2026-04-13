# Invoice Research

## 1. Definition

An invoice is a billing document issued by a seller to a buyer that records:

- what was supplied
- when it was supplied
- how much is owed
- when payment is due
- how payment should be made

It is both:

- an operational payment document
- a business record

In some jurisdictions and contexts it is also:

- a tax document
- a customs or export support document
- an accounting evidence record

The design implication is simple:

an invoice must never sacrifice clarity for decoration.

## 2. What An Invoice Must Achieve

Every strong invoice must help the reader answer these questions fast:

1. Who sent this invoice?
2. Who is being billed?
3. What is this for?
4. How much is owed?
5. When is it due?
6. How should it be paid?
7. Which invoice is this if we need to reference it later?

If the layout does not help a busy accounts team or client answer those questions within seconds, the invoice is under-designed even if it looks visually polished.

## 3. Common Structural Elements

Across public guidance, accounting tools, and business templates, the recurring core fields are:

- invoice title
- invoice number
- issue date
- due date
- supplier identity
- customer identity
- itemization
- subtotal
- taxes
- total due
- payment instructions

Frequently useful optional fields include:

- service date
- paid date
- purchase order number
- project name
- contract reference
- billing period
- payment reference
- notes
- tax registration number
- shipping information
- banking details
- remit-to address
- signature
- late payment terms

## 4. Jurisdiction Notes

Invoice law varies. The app should support flexible fields and never hardcode one country’s rules as universal truth.

### 4.1 UK VAT Context

HMRC guidance makes clear that VAT invoices have specific information requirements that differ by invoice type and value threshold.

Design takeaway:

- tax-related identifiers need dedicated placement
- VAT-specific details should not feel bolted on
- the system should support simplified and full invoice variants

Source:
https://www.gov.uk/guidance/vat-invoices

### 4.2 EU VAT Context

European Commission invoicing guidance emphasizes invoice content, authenticity, integrity, and legibility in VAT contexts.

Design takeaway:

- legibility is not optional
- structured dates and numbering matter
- invoice systems should protect consistency and traceability

Source:
https://taxation-customs.ec.europa.eu/taxation/vat/vat-businesses/invoicing_en

### 4.3 US Small Business Recordkeeping Context

IRS guidance focuses on keeping complete records for income and expenses rather than prescribing a single invoice design.

Design takeaway:

- invoices are part of a broader recordkeeping system
- references, itemization, dates, and amounts need to stay durable and export-friendly

Source:
https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep

## 5. Invoice Versus Related Documents

Design and product systems get messy when they confuse these documents.

### 5.1 Invoice

Requests payment for delivered or billable work.

### 5.2 Estimate

Projects cost before work starts.

### 5.3 Quote

Often similar to an estimate, but can be more formal or binding depending on context.

### 5.4 Proforma Invoice

Looks invoice-like but is not usually the final payment-demand document.

### 5.5 Receipt

Confirms payment already happened.

### 5.6 Credit Note

Reduces a previous charge.

### 5.7 Debit Note

Increases or adjusts a prior amount in some workflows.

### 5.8 Statement

Summarizes account activity, often across multiple invoices.

Product implication:

The system should be built so it can grow into adjacent documents later without pretending they are all the same artifact.

## 6. Invoice Taxonomy By Billing Model

There is no single universal invoice design because billing models vary.

### 6.1 Standard Service Invoice

Used for straightforward billed services.

Typical needs:

- business and client details
- service descriptions
- rates
- due date
- payment instructions

Best fit:

- freelancers
- consultants
- agencies
- studios

### 6.2 Product Invoice

Used when billing physical or digital goods.

Typical needs:

- SKU or product labels
- quantity
- unit price
- shipping or delivery data
- taxes

Best fit:

- retail
- wholesale
- product businesses

### 6.3 Freelance Invoice

Similar to a service invoice but often more personal and brand-led.

Typical needs:

- project name
- deliverable descriptions
- payment method details
- clean, professional presentation

Best fit:

- independent creatives
- developers
- consultants
- copywriters

### 6.4 Agency Invoice

Usually needs clearer project references and stronger structure for multiple line items.

Typical needs:

- project name
- campaign or sprint reference
- multiple services
- contact details
- net terms

### 6.5 Contractor Invoice

Often needs operational detail, dates, progress references, labor/material breakdowns, or site references.

Typical needs:

- job location
- work period
- labor/material split
- retention/deposit references
- stage payment history

### 6.6 Time-And-Materials Invoice

Needs hour and rate visibility or grouped time entries.

Typical needs:

- person/role
- date range
- hours
- rate
- subtotal by role or task

### 6.7 Milestone Invoice

Invoices tied to project phases.

Typical needs:

- milestone title
- milestone completion indicator
- linked contract reference
- partial payment context

### 6.8 Progress Invoice

Common in construction and long-running engagements.

Typical needs:

- prior billed amount
- current billed amount
- remaining balance
- progress percentage

### 6.9 Recurring Invoice

Generated on a schedule for repeat billing.

Typical needs:

- billing period
- subscription or retainer label
- automatic numbering consistency
- predictable visual clarity

### 6.10 Retainer Invoice

Common in legal, consulting, and agency work.

Typical needs:

- retained service scope
- retained hours or access
- billing period
- overage references if needed

### 6.11 Deposit Invoice

Requests an upfront partial payment.

Typical needs:

- deposit percentage or amount
- remaining balance note
- project trigger or reservation note

### 6.12 Final Invoice

Closes out a project after deposits or interim charges.

Typical needs:

- prior payments
- outstanding balance
- final deliverable or completion note

### 6.13 Subscription Invoice

Needs period clarity and service plan labeling.

Typical needs:

- plan name
- term
- next billing understanding
- recurring clarity

### 6.14 Commercial Invoice

Used in international shipping and customs contexts.

Typical needs:

- origin
- destination
- importer/exporter details
- product values
- codes and descriptions
- shipping-related documentation

This is not just a prettier standard invoice. It is operational paperwork with heavier compliance implications.

### 6.15 Tax Invoice

Explicitly used where tax reporting requires a specified invoice format.

Typical needs:

- tax registration details
- taxable amount
- tax rate
- tax amount
- supplier and customer identity

### 6.16 Self-Billing Invoice

Created by the buyer on behalf of the seller in specific business arrangements.

### 6.17 Mixed Invoice

Combines products, services, discounts, credits, deposits, and taxes.

Typical needs:

- robust line item model
- discount handling
- custom labels
- grouped subtotals

### 6.18 Internal Or Intercompany Invoice

Used within organizations or between entities in a group.

### 6.19 Event Invoice

Used for production, bookings, shoots, catering, venue, or creative engagements.

Typical needs:

- event date
- location
- package line items
- deposit/final payment split

### 6.20 Medical Or Professional Service Invoice

Often requires codes, visit dates, practitioner identity, or service descriptions with more precision.

### 6.21 Legal Invoice

Often requires:

- matter number
- attorney or staff role
- billed hours
- disbursements
- trust/retainer references

### 6.22 Consultant Statement-Style Invoice

Used when an executive or specialist wants polished but information-dense billing with minimal decoration.

### 6.23 Creator Or Studio Invoice

Often benefits from:

- stronger brand identity
- cleaner typography
- soft notes tone
- fewer operational fields unless required

### 6.24 Wholesale Invoice

Needs stronger quantity, unit, and shipment clarity than a freelance invoice.

### 6.25 Education Or Training Invoice

Typical needs:

- course or session title
- learner or organization
- date range
- seat counts
- tuition or session fee references

## 7. Invoice Anatomy

Most invoice layouts can be broken into six zones:

1. Masthead
2. Parties
3. Meta
4. Line items
5. Financial summary
6. Ancillary information

### 7.1 Masthead

Contains:

- invoice title
- invoice number
- logo or business name
- status or paid marker if used

This is the fastest identity anchor on the page.

### 7.2 Parties

Contains:

- supplier identity
- client identity

This area should be immediately scannable and never visually drowned by decoration.

### 7.3 Meta

Contains:

- issue date
- due date
- service date
- period
- PO number
- project reference

The layout can either:

- merge meta into masthead
- float it in a side column
- place it as a small structured block below the header

### 7.4 Line Items

This is the operational heart of the invoice.

A weak line-item area breaks trust faster than almost any other layout mistake.

The table must support:

- short and long descriptions
- variable counts
- quantities
- rates
- amounts
- multi-page continuation if needed

### 7.5 Financial Summary

Contains:

- subtotal
- discounts if applicable
- taxes
- deposits or credits if applicable
- total due

This area should be visually important without turning into a loud dashboard widget.

### 7.6 Ancillary Information

Contains:

- payment instructions
- payment reference
- notes
- terms
- signature
- thank-you note

This area should be supportive, not dominant.

## 8. Document Hierarchy Rules

Every invoice should establish:

- one primary heading
- one primary number block
- one dominant financial summary
- one clear itemization zone

When everything is highlighted, nothing is highlighted.

### Hierarchy Pyramid

Top layer:

- invoice title
- invoice number
- total due or balance due

Second layer:

- due date
- seller/client identity
- line item descriptions

Third layer:

- tax details
- notes
- payment instructions
- signatures
- support text

## 9. Visual Archetypes

Across template libraries and invoicing tools, invoice visuals usually fall into these families.

### 9.1 Minimal Corporate

Traits:

- restrained sans-serif typography
- thin dividers
- structured spacing
- low-color design
- neutral authority

Works for:

- agencies
- startups
- consultants
- SaaS

### 9.2 Editorial Minimal

Traits:

- more sophisticated typography
- larger margins
- fewer lines
- more white space
- elegant composition

Works for:

- boutique firms
- studios
- high-end services
- personal brands

### 9.3 Branded Modern

Traits:

- stronger accent use
- brand shapes or header moments
- deliberate asymmetry
- cleaner but more distinctive tone

Works for:

- design agencies
- product studios
- creators

### 9.4 Utility Dense

Traits:

- more operational detail
- structured information blocks
- line-heavy or grid-heavy item areas
- less whitespace

Works for:

- contractors
- industrial suppliers
- logistics
- field services

### 9.5 Warm Service

Traits:

- softer colors
- approachable tone
- rounded or gentle details
- professional but not cold

Works for:

- salons
- wellness
- coaches
- solo businesses

### 9.6 Statement Style

Traits:

- highly restrained
- almost accounting-led
- balance visibility
- low ornament

Works for:

- retainers
- recurring billing
- executive consultants

### 9.7 Classic Ledger

Traits:

- serif or traditional typography
- strong rules
- timeless document feel
- conservative professionalism

Works for:

- law
- accounting
- advisory

## 10. Typography Research

Typography carries more of invoice quality than most teams expect.

### 10.1 Typography Jobs Inside An Invoice

Type must handle:

- identity
- authority
- financial precision
- supporting detail
- long-form notes

### 10.2 Good Invoice Font Characteristics

- high legibility at small sizes
- stable numerals
- calm spacing
- clear bold weights
- not overly decorative

### 10.3 Common Font Strategies

#### Strategy A: All Sans

Best for:

- modern
- neutral
- startup
- software-like business branding

Good effect:

- clean
- current
- easy to scale

Risk:

- can look generic if not paired with good spacing

#### Strategy B: Serif + Sans

Best for:

- editorial
- premium
- luxury service brands

Good effect:

- stronger elegance
- clearer contrast between heading and detail

Risk:

- can feel theatrical if overdone

#### Strategy C: Sans + Mono Accents

Best for:

- tech-forward
- operational
- systems-oriented layouts

Good effect:

- references, invoice numbers, and metadata feel precise

Risk:

- too much mono makes the invoice feel technical or cold

### 10.4 Typography Rules

1. Use one display voice and one body voice at most.
2. Total due should use stronger weight, not novelty.
3. Metadata labels should be quieter than values.
4. Tables should not mix too many font treatments.
5. Notes should remain readable, not shrunk into footnote territory.

### 10.5 Typography Anti-Rules

- no decorative script for financial data
- no over-condensed headlines for invoice numbers
- no random weight jumps
- no giant badge text that competes with total due

## 11. Color Research

Invoices usually perform best with:

- one strong anchor color
- one or two support neutrals
- restrained highlight usage

### Good Roles For Color

- section labels
- subtle rules
- header accent
- paid status marker
- total due emphasis

### Bad Roles For Color

- coloring every section differently
- filling many big containers
- overwhelming line items
- treating the invoice like a marketing flyer

### Color Strategy Patterns

#### Neutral Core

- black
- slate
- stone
- warm gray

#### Soft Accent

- amber
- navy
- forest
- burgundy
- muted teal

#### Status Color

Use very selectively for:

- paid
- overdue
- draft

## 12. Grid And Spacing Research

The best invoices feel deliberate because of spacing, not widgets.

### Spacing Principles

1. Group related content with vertical rhythm before drawing borders.
2. Use alignment to create order.
3. Give the totals area room to breathe.
4. Avoid stacking too many dense modules above the item table.
5. Keep the main reading path obvious from top to bottom.

### Margin Principles

- generous margins feel premium
- narrow margins feel cramped
- margins can tighten slightly for dense contractor or operational documents

### Table Spacing Principles

- generous row height improves readability
- overly compressed rows feel cheap
- long descriptions need breathing room

## 13. Table Design Research

The line-item table is where invoice quality is tested.

### Essential Columns

- description
- quantity
- rate
- amount

Additional columns by context:

- date
- role
- SKU
- unit
- tax code
- discount

### Table Design Rules

1. Description column should dominate width.
2. Numeric columns should align consistently.
3. Header row should be quiet but clear.
4. Use thin dividers or row rhythm, not heavy boxing.
5. Allow long descriptions to wrap cleanly.

### Table Design Anti-Patterns

- tiny numeric columns with clipped text
- too many full-cell borders
- over-styled header rows
- inconsistent numeric alignment
- strong shadows or container effects

## 14. Totals Area Research

The totals block is the emotional center of payment.

It should answer:

- what has already been calculated
- what tax was applied
- what is due now

Good totals design:

- compact but prominent
- visually anchored
- not buried below many other elements

Bad totals design:

- loud banner card with too many treatments
- too much decorative styling
- using giant background boxes when simple hierarchy would work better

## 15. Notes, Terms, Payment, And Signature Research

These are supporting sections, not the main event.

### Notes

Best used for:

- thank-you note
- delivery note
- clarifications
- project reminders

### Payment Details

Must be:

- clear
- copyable
- separated enough to be found

### Payment Reference

Helpful for:

- bank transfer matching
- accounting reconciliation

### Signature

Optional in many invoices.

If present, it should feel quiet and credible, not like decorative clip art.

## 16. Multi-Page Invoice Research

Long invoices expose weak systems.

The PDF engine and design must handle:

- repeated header context
- repeated column headers
- page breaks inside long item lists
- notes or totals not separating awkwardly from the table

### Multi-Page Rules

1. Repeat the table header.
2. Avoid orphaned totals if possible.
3. Keep branding consistent but light on subsequent pages.
4. Maintain invoice number visibility somewhere in repeated page context.

## 17. PDF-Specific Research

The PDF version is not just a screenshot of the app.

It is its own document output with its own rules.

### PDF Rendering Priorities

- reliability in deployment
- consistent typography
- predictable page breaks
- correct file naming
- sharp logo/signature rendering

### React PDF Considerations

The React PDF toolchain supports:

- server-side PDF generation
- document/page/view/text/image primitives
- explicit page layout control
- stylesheets
- font registration
- page wrapping behavior
- render-to-buffer workflows

Source:
https://react-pdf.org/

### PDF Design Rules

1. Never rely on browser quirks for layout fidelity.
2. Keep the document composition intentional.
3. Support page wrapping and long rows cleanly.
4. Use real document hierarchy, not UI metaphor boxes.

## 18. Template Gallery Research

Popular template platforms reveal how users browse invoice designs:

- by industry
- by mood
- by visual tone
- by use case

That means our template selection page should not just show names.

It should show:

- a miniature composition preview
- intended use case
- design personality
- density level
- recommended business types

Relevant template ecosystems:

- Microsoft Create invoice templates
- Canva invoice templates and examples
- Zoho invoice templates
- Wave invoice templates
- Adobe Express invoice templates

## 19. Template System Research

There are two wrong extremes:

1. one rigid invoice layout dressed up in colors
2. many unrelated designs with no shared system

The correct middle is:

- one shared data model
- multiple layout archetypes
- multiple visual voices
- consistent PDF logic

### Shared Template Dimensions

Every template can be described by:

- mood
- structure
- density
- typography direction
- color strategy
- industry fit
- line item behavior
- totals presentation
- support-section treatment

## 20. Design Anti-Patterns

These are the patterns we should actively avoid.

### 20.1 Dashboard Syndrome

Symptoms:

- too many cards
- too many badges
- too many borders
- interface panels inside the document

### 20.2 Decorative Poverty

Symptoms:

- no hierarchy
- random accents
- bland but busy layout

### 20.3 Template Fraud

Symptoms:

- “different templates” are just color swaps
- composition never changes

### 20.4 Form Creep

Symptoms:

- too many fields visible at once in the editor
- no progressive disclosure
- overwhelming first-time users

### 20.5 Print Neglect

Symptoms:

- preview looks nice but PDF breaks
- inconsistent margins
- long notes overflow
- item table collapses under real data

## 21. Product Implications

The product should support both:

- document excellence
- easier editing

That means the UI should not imitate the document too literally.

Instead:

- the editor should reduce cognitive load
- the preview should show document reality
- the PDF should be a stable final artifact

## 22. Product Architecture Findings

The research strongly points toward:

- a template gallery on entry
- a multi-step creation studio
- a separate preview route
- a shared draft model
- clear distinction between edit mode and final document mode

## 23. Recommended Data Model Extensions

Current fields cover the core fairly well, but a stronger invoice system should be ready for:

- logo image
- project title
- purchase order number
- billing period
- discount
- deposit paid
- balance due
- terms
- tax ID
- custom fields

Not every field must surface immediately in the UI, but the model should not block them.

## 24. Recommended Template Strategy

The first release of the improved system should not try to cover every invoice type in the world with exact legal specialization.

Instead it should ship template families that map to common high-level needs:

- minimalist professional
- editorial premium
- modern branded
- utility contractor
- warm service
- statement recurring

These cover most real user intent while leaving room to extend into niche documents later.

## 25. Recommended Experience Strategy

The ideal journey is:

1. choose a template family
2. create or continue a draft
3. move through guided steps
4. open full preview
5. print or export PDF

This is better than a dense single-page editor because it:

- lowers initial overwhelm
- gives the templates more presence
- lets preview feel intentional
- makes the product feel larger than a form

## 26. Source Notes

### Government And Official Sources

- HMRC VAT invoices: https://www.gov.uk/guidance/vat-invoices
- European Commission invoicing and VAT: https://taxation-customs.ec.europa.eu/taxation/vat/vat-businesses/invoicing_en
- IRS recordkeeping guidance: https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep

### Product And Platform Sources

- Stripe customization: https://docs.stripe.com/invoicing/customize
- Stripe rendering templates: https://docs.stripe.com/invoicing/invoice-rendering-template
- React PDF docs: https://react-pdf.org/

### Template And Design Sources

- Microsoft Create invoices: https://create.microsoft.com/en-us/templates/invoices
- Canva invoice design examples: https://www.canva.com/learn/invoice-design-with-samples/
- Zoho invoice templates: https://www.zoho.com/invoice/templates/
- Xero invoice template guidance: https://www.xero.com/us/templates/invoice-template/
- Wave invoice templates: https://www.waveapps.com/invoice-templates/
- Adobe Express invoice templates: https://www.adobe.com/express/create/invoice
- QuickBooks invoicing resources: https://quickbooks.intuit.com/

## 27. Final Research Conclusion

The rebuild should follow these non-negotiables:

1. The invoice must feel like a document, not a stack of cards.
2. The app must separate template choice, editing, and preview.
3. The templates must differ by structure and tone, not color only.
4. The PDF output must be treated as a primary surface.
5. The design system must support both sparse and dense invoices.
