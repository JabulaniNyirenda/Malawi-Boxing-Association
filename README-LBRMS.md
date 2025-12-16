Lilongwe Boxing Registration and Management System (LBRMS)

What I added
- Role-based signup flow: Role selection, SignUp, Login
- Per-role dashboards (Admin, Coach, Athlete)
- Firebase initialization in `MyApp`
- Firestore user document creation on signup with fields: fullName, email, phone, dateOfBirth, role, loginCount, createdAt
- loginCount increment on logout from dashboards
- Admin request flow so normal users cannot self-assign admin role
- Firestore security rules (firestore.rules)
- Cloud Functions scaffold (functions/index.js) to approve admin requests and set custom claims

How admin approval works
1. A user taps "Request Admin Access" and submits a form which creates a document in `adminRequests` with status `pending`.
2. An existing admin reviews requests (via Firebase console or a custom admin UI) and calls the `approveAdminRequest` Cloud Function (or runs the function from the console).
3. The Cloud Function sets a custom claim `admin: true` for the approved user's auth account and updates the user's Firestore document role to `admin`.
4. Firestore security rules allow admins to read/manage requests.

Cloud Function deploy (requires Firebase CLI and project access):
```bash
cd functions
npm install firebase-functions firebase-admin
# deploy the function
firebase deploy --only functions
```

How to test locally
1. Ensure `google-services.json` is present in `app/` (already in the repo).
2. Open project in Android Studio and let it sync Gradle.
3. Run the app on a device or emulator. The launcher is now `RoleSelectionActivity`.
4. Choose a role and create an account. After signup you'll be redirected to Login.
5. Login; you'll be taken to the role-specific dashboard.
6. Press Logout to increment `loginCount` and return to Login.
7. (Admin only) Use the admin dashboard to review and approve admin requests.

Notes
- Passwords are handled by Firebase Authentication (secure).
- Firestore security rules are not modified here; configure them in the Firebase console to enforce access control.
- Make sure the Firebase project has the Admin SDK privileges (you run deploy with a user that can set claims).
- The app prevents client-side admin signups by providing a request path and rejecting role=="admin" in `SignUpActivity`.
