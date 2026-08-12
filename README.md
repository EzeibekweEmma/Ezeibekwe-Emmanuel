# EcomExperts Shopify Gift Guide

A responsive Shopify implementation of the EcomExperts hiring-test Figma design. The page is built from scratch as two configurable Shopify sections and includes dynamic product quick-view popups, variant selection, and functional cart integration.

## Store preview

[View the Gift Guide storefront page](https://emmanuel-ezeibekwe-566-teststore.myshopify.com/pages/gift-guide)

> Password:

## Design reference

- [Figma design](https://www.figma.com/design/rGvsmLucp7jFpMWUKYCgU3/Test-for-Candidates--Copy-?node-id=0-1)
- [Figma prototype](https://www.figma.com/proto/rGvsmLucp7jFpMWUKYCgU3/Test-for-Candidates--Copy-?node-id=1-1588&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A1588)

## Features

- Two original Shopify sections: Gift Guide Banner and Gift Guide Grid
- Merchant-editable banner content, links, labels, and strapline
- Six configurable product blocks with adjustable desktop and mobile hotspot positions
- Dynamic product title, price, description, image, options, and variants
- Accessible quick-view dialog opened from each product hotspot
- Color choices and size selection generated from Shopify product data
- Functional Add to Cart request using Shopify's Ajax Cart API
- Automatic addition of the Soft Winter Jacket when a Black and Medium variant is added
- Responsive layouts for desktop, tablet, mobile, and narrow mobile screens
- Keyboard-accessible controls and visible focus states
- Button and hotspot interactions implemented with scoped CSS and vanilla JavaScript
- No jQuery or third-party frontend libraries

## Project structure

| File                                | Purpose                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `sections/gift-guide-banner.liquid` | Configurable announcement bar, hero content, calls to action, and strapline      |
| `sections/gift-guide-grid.liquid`   | Six product blocks, Shopify product JSON, hotspots, and quick-view dialog markup |
| `templates/page.gift-guide.json`    | Composes the Banner and Grid sections into the Gift Guide page template          |
| `assets/gift-guide.css`             | Scoped typography, layouts, responsive behavior, popup styling, and animations   |
| `assets/gift-guide.js`              | Popup lifecycle, dynamic variants, option state, and Add to Cart logic           |
| `assets/gift-guide-hero*.svg`       | Exported desktop and mobile hero artwork                                         |

## Local development

### Prerequisites

- A Shopify Partner or development store account
- Access to the target Shopify store
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)

### Run the theme locally

1. Clone the repository and enter the project directory:

   ```bash
   git clone git@github.com:EzeibekweEmma/Ezeibekwe-Emmanuel.git
   cd Ezeibekwe-Emmanuel
   ```

2. Sign in and start a development preview:

   ```bash
   shopify theme dev --store emmanuel-ezeibekwe-566-teststore.myshopify.com
   ```

3. Open the preview URL printed by Shopify CLI and navigate to:

   ```text
   /pages/gift-guide
   ```

The CLI provides local and shareable preview URLs and automatically reloads theme changes.

## Shopify configuration

1. In Shopify Admin, go to **Online Store → Pages**.
2. Create or open the Gift Guide page.
3. Assign the **gift-guide** theme template and save.
4. Open **Online Store → Themes → Customize** and select the Gift Guide page.
5. Configure the banner content and links.
6. Select one product for each of the six Grid blocks.
7. Select the Soft Winter Jacket as the companion product, or ensure its handle is `soft-winter-jacket` so the fallback can resolve it.
8. Adjust desktop and mobile hotspot positions when product imagery changes.

## Technology

- Shopify Liquid
- JSON templates and section schemas
- CSS
- Vanilla JavaScript
- Shopify Ajax Cart API
