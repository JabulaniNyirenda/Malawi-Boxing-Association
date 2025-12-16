================================================================================
QUICK REFERENCE CARD - LBRMS AUTHENTICATION SYSTEM
================================================================================

🚀 QUICK START COMMANDS
────────────────────────────────────────────────────────────────────────────

Build APK:
  Windows: .\gradlew assembleDebug
  Mac/Linux: ./gradlew assembleDebug

Run Tests:
  .\gradlew test

Install on Device:
  adb install app/build/outputs/apk/debug/app-debug.apk

Open Android Studio:
  studio .

View Logs:
  firebase functions:log --lines 50

================================================================================
📁 FILE LOCATIONS & DESCRIPTIONS
================================================================================

LAYOUTS (UI)
├─ activity_role_selection.xml .......... Modern role selection with cards
├─ activity_login.xml .................. Beautiful login screen
├─ activity_sign_up.xml ................ Enhanced signup form
├─ activity_main.xml
├─ activity_admin_dashboard.xml
├─ activity_coach_dashboard.xml
└─ activity_athlete_dashboard.xml

KOTLIN ACTIVITIES
├─ RoleSelectionActivity.kt ............ Role selection logic
├─ SignUpActivity.kt ................... HARDENED role validation
├─ LoginActivity.kt .................... LOGIN TRACKING implemented
├─ MainActivity.kt
├─ AdminDashboardActivity.kt
├─ CoachDashboardActivity.kt
└─ AthleteDashboardActivity.kt

RESOURCES
├─ colors.xml .......................... 20+ colors for Material Design 3
├─ strings.xml ......................... 50+ localized strings
├─ themes.xml .......................... Material Design 3 styles
└─ AndroidManifest.xml ................. App configuration

FIREBASE & SECURITY
├─ google-services.json ................ Firebase config (FIXED ✓)
├─ FIRESTORE_SECURITY_RULES.txt ........ Role-based access control
├─ CLOUD_FUNCTIONS_SCAFFOLD.js ......... Server-side validation
└─ firestore.rules ..................... Production rules file

DOCUMENTATION
├─ IMPLEMENTATION_GUIDE.md ............. 800+ lines, complete guide
├─ README_IMPLEMENTATION.md ............ Quick summary (this one)
└─ QUICK_REFERENCE_CARD.md ............. This file

================================================================================
🔐 SECURITY FEATURES AT A GLANCE
================================================================================

PREVENT SELF-PROMOTION TO ADMIN:
┌────────────────────────────────────────────────────────────┐
│ Layer 1: Client validation - Only coach/athlete allowed    │
│ Layer 2: Firestore Rules - Cannot modify own role         │
│ Layer 3: Cloud Functions - Server-side verification        │
│ Layer 4: Approval workflow - Admin must approve requests   │
└────────────────────────────────────────────────────────────┘

LOGIN TRACKING:
┌────────────────────────────────────────────────────────────┐
│ On Login:                                                   │
│  • Record timestamp                                         │
│  • Capture device info                                      │
│  • Store IP address                                         │
│                                                              │
│ On Logout:                                                  │
│  • Increment loginCount (only on proper logout)            │
│  • Record logout timestamp                                  │
│  • Calculate session duration                              │
└────────────────────────────────────────────────────────────┘

ROLE-BASED ACCESS CONTROL (RBAC):
┌────────────────────────────────────────────────────────────┐
│ ATHLETE can:                    COACH can:   ADMIN can:    │
│  • View own profile              • Manage   • Everything   │
│  • View own records                athletes  • Approve     │
│  • See own logins              • View team     admins      │
│                                  logins      • View all    │
│                                              logins        │
└────────────────────────────────────────────────────────────┘

================================================================================
📊 DATABASE SCHEMA REFERENCE
================================================================================

USERS COLLECTION:
┌─ {uid}
│  ├─ fullName: string
│  ├─ email: string
│  ├─ phone: string
│  ├─ role: "athlete" | "coach" | "admin"  ← PROTECTED
│  ├─ loginCount: number (incremented only on logout)
│  ├─ lastLogin: timestamp
│  ├─ status: "active" | "inactive" | "suspended"
│  │
│  └─ loginHistory/ {SUBCOLLECTION}
│     ├─ timestamp: timestamp
│     ├─ deviceInfo: string
│     ├─ ipAddress: string
│     └─ loginType: string

ADMIN REQUESTS COLLECTION:
┌─ {requestId}
│  ├─ userId: string
│  ├─ reason: string
│  ├─ status: "pending" | "approved" | "rejected"
│  ├─ createdAt: timestamp
│  ├─ processedAt: timestamp
│  └─ processedBy: string (admin uid)

AUDIT LOG COLLECTION:
┌─ {logId}
│  ├─ eventType: string ("INVALID_ROLE_ATTEMPT", etc.)
│  ├─ userId: string
│  ├─ timestamp: timestamp
│  └─ severity: "LOW" | "MEDIUM" | "HIGH"

================================================================================
🎨 COLOR PALETTE QUICK REFERENCE
================================================================================

Primary Colors:
  #0D47A1 - Primary (Deep Blue) - Use for main elements
  #08306B - Primary Variant (Darker) - Use for status bar
  #1565C0 - Primary Light - Use for hover states

Accent Colors:
  #FFB300 - Secondary (Gold) - Use for highlights
  #F57C00 - Tertiary (Orange) - Alternative accent

Role Colors:
  #D32F2F - Admin (Red)
  #7E57C2 - Coach (Purple)
  #388E3C - Athlete (Green)

Status Colors:
  #B00020 - Error (Red)
  #00B050 - Success (Green)
  #FFA500 - Warning (Orange)

Neutral Colors:
  #212121 - Text Primary
  #757575 - Text Secondary
  #BDBDBD - Text Hint
  #FFFFFF - Surface/White
  #F5F5F5 - Surface Variant
  #FFF7FAFF - Background

================================================================================
✅ TESTING CHECKLIST
================================================================================

SIGNUP WORKFLOW:
☐ Select "Register as Coach" role
☐ Fill all form fields
☐ Submit form
☐ Verify user created in Firestore with role="coach"
☐ Verify redirected to login screen

☐ Select "Register as Athlete" role
☐ Repeat above steps
☐ Verify user created with role="athlete"

☐ Try to select "Admin" (should not be available)
☐ Verify "Request Admin" leads to approval workflow

LOGIN WORKFLOW:
☐ Enter valid email and password
☐ Verify login succeeds
☐ Check Firestore: lastLogin timestamp updated
☐ Check Firestore: lastLoginDevice updated
☐ Verify redirected to correct dashboard

☐ Try with wrong password
☐ Verify error message: "Incorrect password"

☐ Try with non-existent email
☐ Verify error message: "No account found"

LOGIN TRACKING:
☐ After login, check users/{uid}.lastLogin is set
☐ After proper logout, check loginCount incremented
☐ Check loginHistory subcollection has entry

SECURITY:
☐ Try to modify role in Firestore directly → Fails
☐ Try admin request → Appears in adminRequests collection
☐ Only admin can approve/reject requests
☐ On approval, user role changes to "admin"
☐ Audit log captures the approval

================================================================================
🛠️ COMMON TASKS & SOLUTIONS
================================================================================

DEPLOY FIRESTORE RULES:
1. Go to: https://console.firebase.google.com
2. Select your project
3. Firestore Database → Rules tab
4. Copy entire content from FIRESTORE_SECURITY_RULES.txt
5. Paste into Rules editor
6. Click "Publish"

DEPLOY CLOUD FUNCTIONS:
1. Terminal: firebase init functions
2. Choose JavaScript
3. Copy CLOUD_FUNCTIONS_SCAFFOLD.js content to functions/index.js
4. Terminal: cd functions && npm install
5. Terminal: firebase deploy --only functions
6. Verify: Check Firebase Console > Cloud Functions

VIEW CLOUD FUNCTION LOGS:
1. Firebase Console > Cloud Functions
2. Click function name
3. Click "Logs" tab
4. Or terminal: firebase functions:log --lines 100

DEBUG FIRESTORE RULES:
1. Firestore Database → Rules tab
2. Click "Rules Playground"
3. Test read/write operations
4. Check which rules block access

RESET EMULATOR:
firebase emulators:start --only firestore,functions --force

CLEAR APP DATA:
adb shell pm clear com.example.malawiboxingassociation

VIEW FIRESTORE DATA:
Firebase Console > Firestore Database > Data tab

================================================================================
⚠️ COMMON ERRORS & FIXES
================================================================================

ERROR: "google-services.json is missing"
FIX: Ensure file is in: app/google-services.json (NOT app/google-services .json)

ERROR: "User record not found"
FIX: Check user document created in Firestore during signup

ERROR: "Authentication failed"
FIX: Verify email/password match Firebase Auth records

ERROR: "Permission denied" in Firestore
FIX: Check Firestore Rules are deployed and user is authenticated

ERROR: Cloud Function doesn't execute
FIX: Verify functions deployed and no syntax errors: firebase functions:log

ERROR: Progress indicator stays visible
FIX: Check all exception paths call showLoadingState(false)

ERROR: Role changes to admin aren't persisting
FIX: Use Cloud Function processAdminRequest(), not direct update

================================================================================
📞 IMPORTANT FIRESTORE RULES PATTERNS
================================================================================

Allow user to read own document:
  allow read: if uid() == userId;

Allow authenticated users only:
  allow read: if isAuth();

Allow admin only:
  allow read: if isAdmin();

Prevent role modification:
  allow update: if !request.resource.data.role in resource.data.role;

Enforce read-only for audit logs:
  allow read: if isAuth();
  allow write: if false;  // Cloud Functions only

Check user status:
  allow read: if get(/databases/$(database)/documents/users/$(uid())).data.status == 'active';

================================================================================
🔄 FIREBASE EMULATOR SETUP
================================================================================

Install Emulator Suite:
  npm install -g firebase-tools

Start Emulator:
  firebase emulators:start

Access UI:
  http://localhost:4000  (Main Emulator UI)
  http://localhost:4002  (Firestore Emulator)

Run Functions Locally:
  firebase emulators:start --only functions

Clear Emulator Data:
  firebase emulators:start --only firestore --force

Tests Against Emulator:
  Set FIREBASE_EMULATOR_HOST=127.0.0.1:8080 (in code)
  Run your test suite
  Check Emulator UI at http://localhost:4000

================================================================================
📈 PRODUCTION DEPLOYMENT CHECKLIST
================================================================================

PRE-DEPLOYMENT:
☐ All tests passing
☐ No console errors in logcat
☐ Firestore Rules updated
☐ Cloud Functions deployed
☐ google-services.json verified
☐ All layout files render correctly
☐ All validations working
☐ Error messages clear

SWITCH TO PRODUCTION RULES:
☐ Firestore: Change rules from test to production
☐ Remove any debug logging
☐ Disable emulator settings
☐ Enable Firestore backups

APP SUBMISSION:
☐ Build release APK with signing
☐ Test on real device
☐ Update version number
☐ Create release notes
☐ Submit to Play Store

MONITORING:
☐ Set up Firebase alerts
☐ Monitor Cloud Function performance
☐ Watch for error spikes
☐ Review audit logs regularly
☐ Track user signup/login rates

================================================================================
🎯 KEY METRICS TO MONITOR
================================================================================

Signup Metrics:
  • New signups per day
  • Signup completion rate
  • Most selected role (athlete/coach)
  • Failed signup attempts

Login Metrics:
  • Daily active users (DAU)
  • Login success rate
  • Unusual login patterns
  • Failed login attempts

Performance Metrics:
  • Average signup time
  • Average login time
  • Cloud Function execution time
  • Firestore query response time

Security Metrics:
  • Invalid role attempts
  • Unauthorized access attempts
  • Admin request volume
  • Audit log entries

================================================================================
📚 USEFUL REFERENCES
================================================================================

Material Design 3: https://m3.material.io
Firebase Docs: https://firebase.google.com/docs
Kotlin: https://kotlinlang.org/docs
Android: https://developer.android.com
Firestore Rules: https://firebase.google.com/docs/firestore/security/rules

================================================================================
💡 TIPS & BEST PRACTICES
================================================================================

1. Always test role validation with actual Firebase project
2. Use Firestore Emulator for development, not production database
3. Monitor Cloud Function logs immediately after deployment
4. Keep audit logs for at least 90 days
5. Test on multiple Android versions (API 26+)
6. Use strong passwords in test accounts
7. Document any custom modifications
8. Review Firestore Rules quarterly
9. Update dependencies regularly
10. Maintain backup of Firestore data

================================================================================

