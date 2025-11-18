# Security Features Testing Checklist

## Test Credentials
- **User Email:** 1@gmail.com
- **User Password:** 123456

## Testing Environment
- Dev server should be running at: http://localhost:3000
- Make sure you have at least one PDF resource uploaded in admin panel

---

## ✅ Test 1: Initial Warning Popup on PDF Viewer

### Steps:
1. Open browser to http://localhost:3000/login
2. Login with credentials: `1@gmail.com` / `123456`
3. Navigate to Dashboard → Resources
4. Click "View" on any PDF resource

### Expected Results:
- ✅ Page should load with PDF loading in background
- ✅ **Large warning popup should appear immediately** covering the entire screen with black overlay
- ✅ Popup should display:
  - ⚠️ Warning icon
  - Title: "IMPORTANT WARNING" (or translated version)
  - List of 4 rules about what NOT to do
  - Red banner: "VIOLATION WILL RESULT IN IMMEDIATE ACCOUNT BAN"
  - Blue button: "I Understand - Proceed to View PDF"
- ✅ PDF should be loading in the background while popup is shown
- ✅ Click "Proceed" button - popup should disappear
- ✅ PDF should now be visible with watermarks

### Verification:
- [ ] Warning popup appears immediately
- [ ] Popup content is complete and readable
- [ ] "Proceed" button works correctly
- [ ] PDF becomes visible after clicking proceed

---

## ✅ Test 2: Multi-Language Switching for PDF Viewer

### Steps:
1. While viewing a PDF, note the language of the warning (should be in English by default)
2. Look for language selector in the navbar/header
3. Switch language to **Hindi (हिंदी)**
4. Refresh the page or navigate to another PDF
5. Click "View" on a PDF resource again

### Expected Results:
- ✅ Initial warning popup should now display in Hindi:
  - Title: "महत्वपूर्ण चेतावनी"
  - Rules in Hindi
  - Button: "मैं समझता हूं - PDF देखने के लिए आगे बढ़ें"
- ✅ All violation messages should be in Hindi

### Repeat for Marathi:
6. Switch language to **Marathi (मराठी)**
7. View another PDF

### Expected Results:
- ✅ Initial warning popup should now display in Marathi:
  - Title: "महत्त्वाचा इशारा"
  - Rules in Marathi
  - Button: "मला समजले आहे - PDF पाहण्यासाठी पुढे जा"

### Verification:
- [ ] Language selector is accessible
- [ ] Warning popup text changes with language
- [ ] Hindi translations display correctly
- [ ] Marathi translations display correctly
- [ ] All violation messages respect language selection

---

## ✅ Test 3: Screenshot Detection and 3-Strike System

### Steps:
1. Login and view any PDF resource
2. Click "Proceed" on initial warning
3. **Attempt Screenshot #1:**
   - Press `Print Screen` key OR
   - Press `Windows + Shift + S` (Snipping Tool)

### Expected Results (Strike 1):
- ✅ **Violation popup should appear immediately**
- ✅ Popup should show:
  - 🚫 Icon
  - Title: "Screenshot Violation!" (or translated)
  - Message: "Screenshot attempt detected and blocked"
  - Red box: "Violation #1 of 3"
  - Warning: "2 warning(s) remaining before permanent ban"
  - Small text: "This violation has been logged and reported to administrators"
  - Close (X) button in top-right
- ✅ Screenshot should NOT be taken
- ✅ Content should be briefly blurred/hidden

### Steps (Continue):
4. Close the violation popup (click X)
5. **Attempt Screenshot #2:**
   - Try `Print Screen` again OR
   - Try `Windows + Shift + S` again

### Expected Results (Strike 2):
- ✅ Violation popup appears again
- ✅ Should show: "Violation #2 of 3"
- ✅ Should show: "1 warning(s) remaining before permanent ban"
- ✅ Still able to close popup with X button

### Steps (Continue):
6. Close the violation popup
7. **Attempt Screenshot #3:**
   - Try screenshot one more time

### Expected Results (Strike 3 - CRITICAL):
- ✅ Violation popup appears with different styling
- ✅ Title should change to: "FINAL VIOLATION - ACCOUNT BANNED!"
- ✅ Should show: "Violation #3 of 3"
- ✅ Red message: "Account will be logged out immediately. All access revoked."
- ✅ Black box: "Logging out in 2 seconds..."
- ✅ **NO X button** (cannot close this popup)
- ✅ After 2 seconds, user should be automatically logged out
- ✅ Should redirect to login page with message about violations

### Verification:
- [ ] Strike 1 violation popup appears correctly
- [ ] Strike 2 violation popup shows updated count
- [ ] Strike 3 popup has different appearance (no close button)
- [ ] Auto-logout happens after strike 3
- [ ] Screenshots are successfully blocked
- [ ] All violation messages display in correct language

---

## ✅ Test 4: Violation Logging to Database

This test verifies that violations are being saved to the database.

### Steps:
1. Complete Test 3 above (trigger 3 violations)
2. After being logged out, **login to admin panel**:
   - Go to http://localhost:3000/admin/login
   - Enter admin credentials (check with system admin)
3. Navigate to **"Violations"** section in admin sidebar

### Expected Results:
- ✅ Should see violations listed in the table
- ✅ Each violation should show:
  - User name: (name of user who triggered violation)
  - User email: 1@gmail.com
  - Resource title: (name of PDF that was being viewed)
  - Type: "screenshot_attempt"
  - Strike number: 1, 2, or 3
  - Timestamp: date and time of violation
  - Notified status: "Mark as Notified" button or "Notified" badge

### Verification:
- [ ] All 3 violations are logged in database
- [ ] Violation details are accurate
- [ ] Timestamp is correct
- [ ] User information matches

---

## ✅ Test 5: Admin Notifications Page Displays Violations

### Steps:
1. Stay logged in to admin panel
2. Navigate to **"Violations"** page (should already be there)
3. Review the violations table

### Expected Results - Table Display:
- ✅ Table shows columns:
  - ID, User, Email, Resource, Type, Strike, Timestamp, Notified
- ✅ Violations with strike 3 should have **red background highlight**
- ✅ Strike numbers displayed as badges (orange for 1-2, red with ⚠️ for 3)
- ✅ Type shows "screenshot attempt"

### Steps (Continue):
4. Test the **filter buttons** at the top:
   - Click "All Violations"
   - Click "Unnotified Only"
   - Click "Critical (3 strikes)"

### Expected Results - Filters:
- ✅ "All Violations" shows all records
- ✅ "Unnotified Only" shows only violations without green "Notified" badge
  - Should have red badge showing count of unnotified violations
- ✅ "Critical (3 strikes)" shows only violations with strike count ≥ 3
  - Should have red badge showing count of critical violations

### Steps (Continue):
5. Click **"Mark as Notified"** button on any unnotified violation

### Expected Results - Mark Notified:
- ✅ Button should disappear
- ✅ Should be replaced with green badge: "✓ Notified"
- ✅ Unnotified count in filter badge should decrease by 1

### Steps (Continue):
6. Check the **statistics footer** at bottom of table

### Expected Results - Statistics:
- ✅ Shows "Total Violations: X"
- ✅ Shows "Critical (3+ strikes): X"
- ✅ Shows "Unnotified: X"
- ✅ Counts should be accurate

### Steps (Continue):
7. Test **mobile responsive design**:
   - Resize browser window to mobile size (< 768px width) OR
   - Open on actual mobile device

### Expected Results - Mobile:
- ✅ Table should switch to card layout
- ✅ Each violation shown as a card with all details
- ✅ Cards should be readable and properly formatted
- ✅ Filter buttons should wrap nicely
- ✅ "Mark as Notified" button should be full-width in cards

### Verification:
- [ ] Violations table displays correctly
- [ ] All columns show proper data
- [ ] Strike 3 violations highlighted in red
- [ ] Filter "All" works correctly
- [ ] Filter "Unnotified Only" works correctly
- [ ] Filter "Critical" works correctly
- [ ] "Mark as Notified" functionality works
- [ ] Statistics are accurate
- [ ] Mobile responsive layout works
- [ ] Translations work in admin panel (if multi-language is enabled for admin)

---

## ✅ Test 6: Additional Security Features

While viewing a PDF, test these additional security measures:

### Test Right-Click Protection:
1. Right-click anywhere on the PDF
   - ✅ Context menu should NOT appear
   - ✅ Small toast notification: "Right-click is disabled on this content"

### Test Copy Protection:
2. Try to select text in PDF and press `Ctrl+C`
   - ✅ Should not be able to select text
   - ✅ Toast notification: "Copying is disabled on this content"

### Test Save/Print Protection:
3. Press `Ctrl+S` (Save) or `Ctrl+P` (Print)
   - ✅ Save/Print dialog should NOT open
   - ✅ Toast notification: "This action is disabled for content protection"

### Test DevTools Detection:
4. Press `F12` or `Ctrl+Shift+I` to open DevTools
   - ✅ DevTools should NOT open
   - ✅ Red toast notification: "Developer Tools Detected - This action has been logged"

### Test Watermarks:
5. Observe the PDF carefully
   - ✅ Should see multiple watermarks (approximately 20)
   - ✅ Watermarks should show "CrackTET" and username alternately
   - ✅ Watermarks should be diagonal (45° angle)
   - ✅ Watermarks should be semi-transparent (visible but not too intrusive)

### Verification:
- [ ] Right-click is blocked
- [ ] Text selection is disabled
- [ ] Copy is blocked
- [ ] Save is blocked
- [ ] Print is blocked
- [ ] DevTools opening is blocked
- [ ] Watermarks are visible
- [ ] Watermarks show correct text

---

## 📝 Test Results Summary

### Test 1: Initial Warning Popup
- Status: [ ] PASS / [ ] FAIL
- Notes: _______________________________

### Test 2: Multi-Language Switching
- Status: [ ] PASS / [ ] FAIL
- Notes: _______________________________

### Test 3: Screenshot Detection & 3-Strike System
- Status: [ ] PASS / [ ] FAIL
- Notes: _______________________________

### Test 4: Violation Logging to Database
- Status: [ ] PASS / [ ] FAIL
- Notes: _______________________________

### Test 5: Admin Notifications Page
- Status: [ ] PASS / [ ] FAIL
- Notes: _______________________________

### Test 6: Additional Security Features
- Status: [ ] PASS / [ ] FAIL
- Notes: _______________________________

---

## 🐛 Bug Reporting Format

If you find any issues, report them with this format:

**Bug Title:** [Short description]
**Test:** [Which test from above]
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Screenshot/Video:** [If available]
**Browser:** [Chrome/Firefox/Safari/Edge]
**Language:** [English/Hindi/Marathi]

---

## ✅ Final Checklist

Before marking testing complete:
- [ ] All 6 main tests completed
- [ ] Tested in English language
- [ ] Tested in Hindi language
- [ ] Tested in Marathi language
- [ ] Tested on desktop browser
- [ ] Tested on mobile browser (or responsive mode)
- [ ] All violations logged correctly in database
- [ ] Admin panel displays violations correctly
- [ ] No console errors in browser DevTools
- [ ] All features work as expected

---

## 🎯 Success Criteria

**✅ ALL TESTS MUST PASS** for the feature to be considered complete:

1. ✅ Initial warning displays before PDF viewing
2. ✅ All translations work correctly (EN/HI/MR)
3. ✅ Screenshot detection blocks all attempts
4. ✅ 3-strike system counts correctly and auto-logs out
5. ✅ Violations are logged to database with correct details
6. ✅ Admin notifications page displays all violations
7. ✅ Filters and "Mark as Notified" work correctly
8. ✅ Additional security features (right-click, copy, etc.) are blocked

---

**Testing Date:** _____________
**Tested By:** _____________
**Result:** [ ] PASS / [ ] FAIL
**Notes:** _______________________________
