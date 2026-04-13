# Visual Rules

This document defines the visual laws for invoice design in this product.

It exists to stop the system from drifting back into generic component-library habits.

## 1. Foundational Position

The invoice is a document.

The application is a product.

These are related, but they are not the same thing.

The invoice surface should inherit the brand and template system, but it should not inherit dashboard metaphors.

## 2. Visual Priorities

When making any invoice design choice, the priorities are:

1. legibility
2. financial clarity
3. hierarchy
4. document rhythm
5. brand tone
6. ornament

If ornament is competing with hierarchy, ornament loses.

## 3. The Reading Path

The invoice must support a clean first-pass scan.

The typical reading order is:

1. invoice identity
2. seller identity
3. client identity
4. due date and total due
5. what the invoice covers
6. supporting details

Every template should make this reading path obvious even when the composition is more expressive.

## 4. Document Zones

Each invoice is composed of six zones:

- masthead
- meta
- parties
- line items
- totals
- support

### 4.1 Masthead

Must establish:

- document identity
- invoice number
- business authority

### 4.2 Meta

Must establish:

- issue timing
- due timing
- billing state

### 4.3 Parties

Must establish:

- seller
- buyer

### 4.4 Line Items

Must establish:

- what was billed
- how it was priced
- how the amount was calculated

### 4.5 Totals

Must establish:

- subtotal
- tax
- amount due

### 4.6 Support

Must establish:

- how payment should happen
- what clarifications matter
- signature if present

## 5. What We Never Do

The following are hard no rules unless there is a very specific invoice-type reason:

- card around every section
- thick border around every group
- multiple filled panels stacked on a page
- dashboard badge clutter
- decorative gradients inside the invoice body
- noisy shape systems that interrupt financial reading
- giant “status pill” that dominates the document
- iconography inside the invoice document body

## 6. What We Prefer Instead

- typographic contrast
- spacing rhythm
- restrained rules
- tonal paper differences
- asymmetry when useful
- one accent band or anchor at most

## 7. Spacing Rules

Spacing is a primary structural tool.

### 7.1 Vertical Rhythm

Every template should have a clear vertical cadence.

Typical pattern:

- compact label-to-value spacing
- medium section-to-section spacing
- generous zone-to-zone spacing

### 7.2 Section Gaps

Do not create a new border if a spacing change solves the same problem.

### 7.3 Totals Breathing Room

The totals block always needs slightly more air than surrounding utility information.

### 7.4 Long Content

Long notes, long addresses, and long item descriptions should increase height gracefully rather than breaking rhythm.

## 8. Alignment Rules

Alignment is an invoice trust signal.

### 8.1 Left Alignment

Use for:

- names
- descriptions
- notes
- payment details

### 8.2 Right Alignment

Use for:

- financial figures
- quantity if narrow
- rates
- totals

### 8.3 Center Alignment

Use sparingly.

Centering is almost never the right default for financial documents.

## 9. Typography Rules

### 9.1 Heading Hierarchy

There should be only one dominant display moment:

- invoice number
- invoice title
- or total due

Not all three at the same size.

### 9.2 Label Hierarchy

Labels should feel informative, not loud.

Use:

- smaller size
- wider tracking
- quieter tone

### 9.3 Value Hierarchy

Values should feel readable and direct.

### 9.4 Numeral Treatment

Totals, rates, and amounts need stable alignment and consistent weight.

### 9.5 Serif Usage

Serif should signal editorial confidence, not decorative flourish.

If serif is used:

- keep it on headings or highlighted values
- do not let the body become muddy

### 9.6 Mono Usage

Use mono only where precision is enhanced:

- invoice number
- PO
- account reference
- date strings in operational templates

## 10. Color Rules

### 10.1 Accent Use

Every template may have one accent role, not ten.

Accent is for:

- title emphasis
- top band
- totals emphasis
- support rules

### 10.2 Neutral Base

Invoices should mostly live in a calm neutral world.

### 10.3 Status Colors

Status is secondary information.

Its visual treatment must never overpower:

- invoice number
- due date
- total due

### 10.4 Warm Templates

Warm palettes should remain restrained and grown-up.

### 10.5 Modern Templates

Modern palettes can feel sharper, but should remain sober enough for financial trust.

## 11. Border Rules

Borders are allowed.

Border addiction is not.

### Use Borders For

- table structure
- one major document break
- a single total or status emphasis if the template truly needs it

### Avoid Borders For

- every content block
- every metadata group
- signature area by default
- notes by default

## 12. Table Rules

### 12.1 Table Importance

The table is not just data.

It is the invoice’s proof structure.

### 12.2 Description Column

Always give descriptions the most room.

### 12.3 Header Tone

Header rows should be quiet, measured, and precise.

### 12.4 Row Treatment

Prefer:

- light divider rhythm
- alternating tone only when restrained
- no heavy cell boxes

### 12.5 Dense Templates

Utility templates may use stronger table lines, but still should avoid spreadsheet ugliness where possible.

## 13. Totals Rules

### 13.1 Total Due

Must be obvious on first pass.

### 13.2 Subtotal And Tax

Should support the total, not compete with it.

### 13.3 Visual Weight

Increase total emphasis with:

- weight
- scale
- spacing
- position

not with:

- giant boxes
- flashy backgrounds
- oversized pills

## 14. Notes And Payment Rules

### 14.1 Payment Details

Must be easy to find and copy.

### 14.2 Notes

Must read like supporting prose, not like another dashboard tile.

### 14.3 Signature

If present, it should feel credible and understated.

### 14.4 Supporting Order

Order support information by practical value:

- payment details
- reference
- notes
- signature

unless a template family has a strong reason to reorder them.

## 15. Template Family Signatures

Each family must own a distinct visual signature.

## 15.1 Minimal Ledger Signature

Defining traits:

- quiet masthead
- strong numerical order
- slim rules
- efficient side summary

Never do:

- ornamental shapes
- oversized hero treatment

## 15.2 Editorial Serif Signature

Defining traits:

- more generous whitespace
- serif authority
- low-border composition
- luxury through restraint

Never do:

- artificial luxury textures
- faux magazine gimmicks

## 15.3 Studio Modern Signature

Defining traits:

- stronger composition contrast
- visible accent gesture
- crisp typographic authority
- asymmetry with discipline

Never do:

- startup admin-dashboard energy

## 15.4 Warm Service Signature

Defining traits:

- softened edges in tone, not necessarily rounded UI
- approachable copy rhythm
- warm neutral color base

Never do:

- childish or “cute” styling

## 15.5 Contractor Utility Signature

Defining traits:

- denser reference handling
- practical table structure
- audit-friendly summary

Never do:

- overly airy layout that hides details

## 15.6 Statement Balance Signature

Defining traits:

- balance-first hierarchy
- low ornament
- quiet authority

Never do:

- aggressive branding
- playful decorative treatment

## 16. Preview-Specific Rules

The screen preview is still a document surface.

### 16.1 Preview Container

The preview may live on a paper-like canvas inside the app shell.

### 16.2 Preview Chrome

App chrome should stay outside the document surface.

### 16.3 Preview Width

The document should have enough width to breathe.

### 16.4 Preview Contrast

The screen version can use slightly stronger paper-shadow cues than the PDF, but should stay tasteful.

## 17. PDF-Specific Rules

### 17.1 Print Reality

The PDF is not the place for surface-level web tricks.

### 17.2 Edge Discipline

Margins must feel intentional and durable.

### 17.3 Multi-Page Stability

Design must survive page breaks without visual collapse.

### 17.4 Image Discipline

Use logos and signatures carefully to avoid oversized visual noise.

## 18. Content Tone Rules

Invoice tone should match the template, but all copy should remain professional.

### Good Tone

- calm
- direct
- competent

### Bad Tone

- overly promotional
- too casual
- emotionally loud

## 19. Premium Feel Checklist

An invoice feels premium when:

- the page breathes
- the hierarchy is obvious
- the financial center is calm but clear
- the table feels trustworthy
- the document uses fewer treatments with more discipline

An invoice does not feel premium merely because:

- it has more boxes
- it has more decoration
- it has more labels
- it has more UI-like affordances

## 20. Anti-Pattern Library

### 20.1 Accordion Invoice

The page looks like collapsed UI sections instead of a document.

### 20.2 Card Stack Invoice

The document body is just a column of containers.

### 20.3 Widget Summary

Totals look like a dashboard widget instead of a financial conclusion.

### 20.4 Badge Overload

Status, references, and metadata all compete as pills or chips.

### 20.5 Border Addiction

Everything has an outline because spacing was not trusted.

### 20.6 Empty Luxury

The page is sparse but hierarchy is weak, so it feels expensive and unclear at the same time.

## 21. Design Review Questions

Before approving any invoice design, ask:

1. What is the first thing the reader sees?
2. Can the total due be found instantly?
3. Are the seller and buyer identities obvious?
4. Does the line-item structure feel stable?
5. Are support sections understated?
6. Is this document being held together by spacing or by containers?
7. If the borders disappeared, would the layout still work?

## 22. Approval Standard

A template is ready only when:

- it has a unique compositional idea
- it feels document-first
- it remains readable under real content
- it does not relapse into app-card styling
