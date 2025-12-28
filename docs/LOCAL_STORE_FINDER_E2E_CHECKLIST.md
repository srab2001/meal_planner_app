# Local Store Finder - End-to-End Testing Checklist

## Pre-requisites
- [ ] Database migrations applied (018, 019)
- [ ] Stores seeded (`npm run seed:stores`)
- [ ] Server running with valid JWT authentication

---

## 1. Switchboard Tile Loads and Routes
- [ ] Local Store Finder tile appears in Switchboard
- [ ] Tile shows correct icon and label
- [ ] Clicking tile navigates to Local Store Finder app
- [ ] URL updates to reflect Local Store Finder route
- [ ] Back button returns to Switchboard

---

## 2. Locate Stores Returns 3 Stores for Each Store Type
- [ ] **Home**: Returns exactly 3 stores (Home Depot, Lowe's, Ace Hardware)
- [ ] **Appliances**: Returns exactly 3 stores (Best Buy, Home Depot Appliances, Lowe's Appliances)
- [ ] **Clothing**: Returns exactly 3 stores (Nordstrom, Macy's, Gap)
- [ ] **Restaurants**: Returns exactly 3 stores (Yelp, OpenTable, Google Maps)
- [ ] Each store has: id, name, base_url, search_url_template
- [ ] API response includes sessionId for logging

---

## 3. User Can Deselect Stores
- [ ] All 3 stores are initially selected (checkboxes checked)
- [ ] Clicking a checkbox deselects that store
- [ ] Deselected store visual state changes (unchecked, dimmed)
- [ ] User can re-select a deselected store
- [ ] Selected store count updates dynamically
- [ ] "Continue" button is disabled when 0 stores selected
- [ ] User can proceed with 1, 2, or 3 stores selected

---

## 4. Find Returns a Row Per Selected Store
- [ ] With 1 store selected: Results table shows 1 row
- [ ] With 2 stores selected: Results table shows 2 rows
- [ ] With 3 stores selected: Results table shows 3 rows
- [ ] Each row contains: store_name, item_name, price, unit, notes
- [ ] Rows are clearly distinguishable (alternating colors or borders)
- [ ] Store names match the selected stores

---

## 5. Failures Do Not Block Results
- [ ] If 1 of 3 stores fails, other 2 results still display
- [ ] Failed store row shows price as "not available"
- [ ] Failed store row shows error in notes field
- [ ] No JavaScript errors in console
- [ ] UI does not crash or freeze
- [ ] User can still "Search Again" or "Start Over"

---

## 6. Table Renders Correctly
- [ ] Table has headers: Store, Product, Price, Notes
- [ ] Columns are properly aligned
- [ ] Text does not overflow cells
- [ ] Long product names are truncated or wrapped
- [ ] Price column is right-aligned
- [ ] Product name links to product_url (if available)
- [ ] Table is responsive on different screen sizes
- [ ] Empty state shows appropriate message

---

## 7. No Prices Are Invented When Scrape Returns None
- [ ] When scraper returns no price, display shows "not available"
- [ ] Price field is never empty string
- [ ] Price field never shows "$0.00" for missing prices
- [ ] Price field never shows placeholder like "N/A" or "-"
- [ ] AI normalizer (if enabled) does not invent prices
- [ ] Database logs show actual scraped values, not invented ones

---

## Smoke Test
Run the Node.js smoke test to verify endpoints:
```bash
node scripts/smoke-test-local-store-finder.js
```

Pass JWT token as environment variable:
```bash
JWT_TOKEN=your_token node scripts/smoke-test-local-store-finder.js
```
