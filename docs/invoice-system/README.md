# Invoice System Documentation

This folder is the working research base for rebuilding the invoice experience as a real product instead of a single-page form.

The goal is to make every design and engineering decision traceable back to a clear understanding of:

- what an invoice must contain
- how invoices differ by industry and billing model
- what premium invoice documents actually look like
- how template systems should work
- how the UI flow should be structured
- how the PDF renderer should behave in production

## Document Map

1. [Research](./research.md)
   Covers invoice anatomy, legal and operational expectations, invoice types, layout principles, typography, and PDF rules.

2. [Template Catalog](./template-catalog.md)
   Defines a full template family system with visual directions, document personalities, and intended industries.

3. [Product Architecture](./product-architecture.md)
   Translates the research into product structure, page flow, state management, data rules, and rendering strategy.

4. [Visual Rules](./visual-rules.md)
   Captures the visual laws for invoice composition, hierarchy, spacing, typography, and anti-patterns.

5. [PDF Authoring Guide](./pdf-authoring.md)
   Defines the rendering-side rules for writing durable, premium invoices in PDF.

## Core Position

An invoice is not a dashboard.

An invoice is a financial document with a brand voice.

That means the design system must prioritize:

- payment clarity before decoration
- typography before containers
- spacing before card wrappers
- hierarchy before novelty
- durable document structure before UI gimmicks

## Working Principles

1. The app UI may use supportive interface structure, but the invoice itself must feel like a document.
2. Templates must differ in composition, rhythm, and tone, not just color.
3. The invoice should remain readable when fields are sparse and when content is dense.
4. The PDF output is a first-class product surface, not a technical export afterthought.
5. Preview and PDF should share the same design language even if they are rendered differently.

## Scope Of The Rebuild

The intended rebuild covers:

- a template gallery entry point
- a multi-step invoice creation studio
- a dedicated full-page preview route
- a more intentional template system
- a cleaner React PDF generation layer
- stronger document hierarchy across preview and PDF

## Research Sources

Primary and high-signal references used in this documentation include:

- HMRC VAT invoice guidance: https://www.gov.uk/guidance/vat-invoices
- European Commission VAT invoice overview: https://taxation-customs.ec.europa.eu/taxation/vat/vat-businesses/invoicing_en
- IRS recordkeeping guidance: https://www.irs.gov/businesses/small-businesses-self-employed/what-kind-of-records-should-i-keep
- Stripe invoice customization: https://docs.stripe.com/invoicing/customize
- Stripe invoice rendering template docs: https://docs.stripe.com/invoicing/invoice-rendering-template
- React PDF docs: https://react-pdf.org/
- Microsoft invoice templates: https://create.microsoft.com/en-us/templates/invoices
- Canva invoice design examples: https://www.canva.com/learn/invoice-design-with-samples/
- Zoho invoice templates: https://www.zoho.com/invoice/templates/
- Xero invoice template guidance: https://www.xero.com/us/templates/invoice-template/
- Wave invoice templates: https://www.waveapps.com/invoice-templates/
- Adobe Express invoice templates and examples: https://www.adobe.com/express/create/invoice
- QuickBooks invoicing guides and examples: https://quickbooks.intuit.com/

## How To Use These Docs

Use them in this order:

1. Read `research.md` to understand what invoices are and how they vary.
2. Read `template-catalog.md` to understand the template families we should support.
3. Read `product-architecture.md` to see how the application should be structured around those findings.

## Important Constraint

No future invoice redesign should default to:

- box around every section
- card around every idea
- border around every grouping
- dashboard-style UI metaphors inside the document

If separation is needed, prefer:

- spacing
- typographic contrast
- thin rules
- tonal shifts
- alignment changes
- page rhythm

The rebuild should always ask:

`Is this a real document decision, or am I accidentally designing a settings panel?`
