# Pantry App - User Testing Checklist

## Prerequisites
- [ ] User is logged in
- [ ] User has an active household
- [ ] User has appropriate role (test with both `member` and `viewer` roles)

---

## 1. Navigation & Access

### 1.1 Open Pantry App
- [ ] Navigate to Pantry app from app menu
- [ ] Page loads without errors
- [ ] "Back" button works to return to previous view

### 1.2 RBAC Verification
**As member/admin/owner:**
- [ ] "Add Item" button is visible
- [ ] Action buttons (Consume, Waste, Adjust) visible on items

**As viewer:**
- [ ] "Add Item" button is NOT visible
- [ ] Action buttons are NOT visible on items
- [ ] Can still view items in table

---

## 2. View & Search

### 2.1 Default View
- [ ] Table displays with columns: Item name, Brand, Quantity, Unit, Purchase date, Expiration date, Actions
- [ ] Items load correctly from API
- [ ] Events panel shows on right side

### 2.2 View Filters
- [ ] "All Items" filter shows all available items
- [ ] "Expiring in 3 days" shows items expiring within 3 days
- [ ] "Expiring in 7 days" shows items expiring within 7 days
- [ ] "Expiring in 14 days" shows items expiring within 14 days
- [ ] Filters exclude consumed/wasted items

### 2.3 Search
- [ ] Typing in search box filters items
- [ ] Search works on item name
- [ ] Search works on brand name
- [ ] Clearing search restores full list
- [ ] Search debounces (300ms delay before API call)

---

## 3. Add Item Modal

### 3.1 Open Modal
- [ ] Click "Add Item" opens modal
- [ ] Modal displays all fields: Item Name*, Brand, Quantity*, Unit, Purchase Date, Expiration Date, Notes

### 3.2 Validation
- [ ] Cannot submit without item name
- [ ] Cannot submit with quantity <= 0
- [ ] Cannot submit if expiration date < purchase date
- [ ] Notes limited to 500 characters
- [ ] Error messages display correctly

### 3.3 Success
- [ ] Fill valid data and submit
- [ ] Modal closes on success
- [ ] New item appears in table
- [ ] Event logged in events panel

### 3.4 Cancel
- [ ] Click Cancel closes modal without saving
- [ ] Click outside modal closes it

---

## 4. Consume Modal

### 4.1 Open Modal
- [ ] Click "Consume" on an item opens modal
- [ ] Shows item name and available quantity

### 4.2 Validation
- [ ] Amount must be > 0
- [ ] Amount cannot exceed available quantity
- [ ] Error messages display correctly

### 4.3 Success
- [ ] Enter valid amount and submit
- [ ] Modal closes on success
- [ ] Item quantity decreases in table
- [ ] Event logged in events panel
- [ ] If full quantity consumed, item is removed from view

---

## 5. Waste Modal

### 5.1 Open Modal
- [ ] Click "Waste" on an item opens modal
- [ ] Shows item name and available quantity
- [ ] Reason dropdown has options: Expired, Spoiled, Overbought, Other

### 5.2 Validation
- [ ] Amount must be > 0
- [ ] Amount cannot exceed available quantity

### 5.3 Success
- [ ] Enter amount, select reason, submit
- [ ] Modal closes on success
- [ ] Item quantity decreases in table
- [ ] Event logged with reason
- [ ] If full quantity wasted, item is removed from view

---

## 6. Adjust Modal

### 6.1 Open Modal
- [ ] Click "Adjust" on an item opens modal
- [ ] Shows current quantity
- [ ] Displays +/- difference indicator as you type

### 6.2 Validation
- [ ] Quantity cannot be negative

### 6.3 Success
- [ ] Enter new quantity and submit
- [ ] Modal closes on success
- [ ] Item quantity updates in table
- [ ] Event logged in events panel

---

## 7. Events Panel

- [ ] Shows last 10 events
- [ ] Displays event type (add, consume, waste, adjust)
- [ ] Shows item name
- [ ] Shows timestamp
- [ ] Updates when new actions are performed

---

## 8. Error Handling

- [ ] Network error shows appropriate message
- [ ] API errors display in modals
- [ ] Page gracefully handles missing household ID

---

## 9. Performance

- [ ] Page loads within 2 seconds
- [ ] Search response is quick after debounce
- [ ] Modal opens/closes smoothly

---

## Test Accounts

| Role | Expected Behavior |
|------|------------------|
| owner | Full access (view + all actions) |
| admin | Full access (view + all actions) |
| member | Full access (view + all actions) |
| viewer | View only (no action buttons) |

---

## Known Limits

- Notes: max 500 characters
- Events panel: shows last 10 events
- Search: debounced 300ms

---

**Version:** 1.0
**Last Updated:** 2025-12-29
