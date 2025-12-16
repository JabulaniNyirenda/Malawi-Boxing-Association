================================================================================
CLOUD FUNCTIONS SCAFFOLD FOR LBRMS
================================================================================

Location: functions/index.js
This file provides server-side validation and security enhancements for:
- Role assignment validation
- Login activity tracking
- Admin request processing
- Audit logging

IMPLEMENTATION:
1. Ensure Firebase Functions CLI is installed: npm install -g firebase-tools
2. Initialize functions in project root: firebase init functions
3. Replace functions/index.js with the content below
4. Deploy: firebase deploy --only functions

================================================================================
JAVASCRIPT IMPLEMENTATION
================================================================================

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

// ============================================================================
// 1. VALIDATE ROLE ASSIGNMENT (Called after user signup)
// ============================================================================

/**
 * Validates that role assignment is correct and prevents privilege escalation
 * Callable function that validates role assignment during signup
 */
exports.validateRoleAssignment = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const uid = context.auth.uid;
  const requestedRole = data.role;

  // SECURITY: Only allow athlete and coach roles for self-registration
  const ALLOWED_SELF_ROLES = ['athlete', 'coach'];

  if (!ALLOWED_SELF_ROLES.includes(requestedRole)) {
    // Log suspicious activity
    await logAuditEvent('INVALID_ROLE_ATTEMPT', uid, {
      attemptedRole: requestedRole,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid role selection. Only athlete and coach roles are available for self-registration.'
    );
  }

  // Verify the user document matches the requested role
  const userDoc = await db.collection('users').doc(uid).get();

  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User document not found'
    );
  }

  const storedRole = userDoc.data().role;

  if (storedRole !== requestedRole) {
    // Log role mismatch
    await logAuditEvent('ROLE_MISMATCH', uid, {
      requestedRole,
      storedRole,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    throw new functions.https.HttpsError(
      'failed-precondition',
      'Role mismatch detected'
    );
  }

  return {
    success: true,
    message: 'Role assignment validated successfully',
    role: storedRole
  };
});

// ============================================================================
// 2. TRACK LOGIN ACTIVITY
// ============================================================================

/**
 * Records login activity and increments login count
 * Called after successful authentication
 */
exports.recordLoginActivity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const uid = context.auth.uid;
  const deviceInfo = data.deviceInfo || 'Unknown Device';

  try {
    const userRef = db.collection('users').doc(uid);
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Create login record
    const loginRecord = {
      uid,
      timestamp,
      deviceInfo,
      ipAddress: context.rawRequest.ip || 'unknown',
      loginType: 'manual'
    };

    // Add to loginHistory subcollection
    await userRef.collection('loginHistory').add(loginRecord);

    // Update user's last login (but NOT loginCount yet)
    await userRef.update({
      lastLogin: timestamp,
      lastDevice: deviceInfo
    });

    return {
      success: true,
      message: 'Login activity recorded'
    };
  } catch (error) {
    console.error('Error recording login activity:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to record login activity'
    );
  }
});

// ============================================================================
// 3. LOGOUT AND INCREMENT LOGIN COUNT
// ============================================================================

/**
 * Handles logout and increments login count
 * Called when user explicitly logs out
 */
exports.recordLogout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const uid = context.auth.uid;

  try {
    const userRef = db.collection('users').doc(uid);
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    // Increment login count only on proper logout
    await userRef.update({
      loginCount: admin.firestore.FieldValue.increment(1),
      lastLogout: timestamp,
      sessionDuration: data.sessionDuration || null
    });

    // Log the logout event
    await logAuditEvent('USER_LOGOUT', uid, {
      sessionDuration: data.sessionDuration,
      timestamp
    });

    return {
      success: true,
      message: 'Logout recorded and login count incremented'
    };
  } catch (error) {
    console.error('Error recording logout:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to record logout'
    );
  }
});

// ============================================================================
// 4. PROCESS ADMIN REQUESTS
// ============================================================================

/**
 * Admins call this to approve/reject admin role requests
 */
exports.processAdminRequest = functions.https.onCall(async (data, context) => {
  // Verify requester is admin
  const adminDoc = await db.collection('users').doc(context.auth.uid).get();

  if (!adminDoc.exists || adminDoc.data().role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only admins can process admin requests'
    );
  }

  const requestId = data.requestId;
  const action = data.action; // 'approve' or 'reject'
  const reason = data.reason || '';

  if (!['approve', 'reject'].includes(action)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Action must be approve or reject'
    );
  }

  try {
    const requestRef = db.collection('adminRequests').doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Request not found'
      );
    }

    const requestData = requestDoc.data();
    const userId = requestData.userId;

    if (action === 'approve') {
      // Update user role to admin
      await db.collection('users').doc(userId).update({
        role: 'admin',
        approvedByAdmin: context.auth.uid,
        approvedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Log the approval
      await logAuditEvent('ADMIN_APPROVED', userId, {
        approvedByAdmin: context.auth.uid,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Update request status
    await requestRef.update({
      status: action === 'approve' ? 'approved' : 'rejected',
      processedBy: context.auth.uid,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      reason
    });

    return {
      success: true,
      message: `Request ${action}ed successfully`
    };
  } catch (error) {
    console.error('Error processing admin request:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process request'
    );
  }
});

// ============================================================================
// 5. AUDIT LOGGING FUNCTION
// ============================================================================

/**
 * Internal function to log all security-relevant events
 */
async function logAuditEvent(eventType, userId, details = {}) {
  try {
    await db.collection('auditLog').add({
      eventType,
      userId,
      relatedUserIds: [userId],
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      severity: getSeverity(eventType)
    });
  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Determine severity level for audit events
 */
function getSeverity(eventType) {
  const severityMap = {
    'INVALID_ROLE_ATTEMPT': 'HIGH',
    'ROLE_MISMATCH': 'HIGH',
    'ADMIN_APPROVED': 'MEDIUM',
    'USER_LOGIN': 'LOW',
    'USER_LOGOUT': 'LOW'
  };

  return severityMap[eventType] || 'MEDIUM';
}

// ============================================================================
// 6. SCHEDULED: CLEANUP OLD LOGIN RECORDS (Optional)
// ============================================================================

/**
 * Runs daily to clean up very old login records (>90 days)
 * to manage database storage
 */
exports.cleanupOldLoginRecords = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const snapshot = await db.collectionGroup('loginHistory')
      .where('timestamp', '<', ninetyDaysAgo)
      .limit(1000) // Process in batches
      .get();

    const batch = db.batch();

    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`Deleted ${snapshot.size} old login records`);
    return null;
  });

// ============================================================================
// 7. VALIDATE NEW USER SIGNUP (Server-side validation)
// ============================================================================

/**
 * Triggered when new user is created
 * Adds security validations and initializations
 */
exports.onNewUserCreated = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email;

  try {
    // Verify user document exists (created by client during signup)
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      console.warn(`User document missing for ${uid}. Creating default record.`);

      // This shouldn't happen with proper implementation, but act as safety net
      await db.collection('users').doc(uid).set({
        email,
        role: 'athlete', // Default safe role
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        loginCount: 0,
        verified: false,
        status: 'active'
      });
    } else {
      // Validate role is one of the allowed values
      const role = userDoc.data().role;
      const VALID_ROLES = ['athlete', 'coach', 'admin'];

      if (!VALID_ROLES.includes(role)) {
        console.error(`Invalid role assigned to user ${uid}: ${role}`);

        // Set to default role
        await db.collection('users').doc(uid).update({
          role: 'athlete'
        });
      }
    }

    // Log user creation
    await logAuditEvent('USER_CREATED', uid, {
      email,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error in onNewUserCreated:', error);
  }
});

// ============================================================================
// EXPORT MODULE
// ============================================================================

exports.auth = {
  validateRoleAssignment,
  recordLoginActivity,
  recordLogout,
  processAdminRequest,
  onNewUserCreated
};

================================================================================
DEPLOYMENT INSTRUCTIONS
================================================================================

1. Initialize Firebase Functions:
   firebase init functions

2. Replace functions/index.js with the code above

3. Update functions/package.json to include:
   "dependencies": {
     "firebase-admin": "^11.0.0",
     "firebase-functions": "^4.0.0"
   }

4. Run locally for testing:
   firebase emulators:start --only functions

5. Deploy to production:
   firebase deploy --only functions

6. Monitor function execution:
   firebase functions:log

================================================================================
CLIENT-SIDE USAGE EXAMPLES
================================================================================

// Kotlin example - Calling Cloud Functions from Android:

// After signup, validate role assignment
val functions = FirebaseFunctions.getInstance()
val data = hashMapOf(
    "uid" to uid,
    "role" to selectedRole
)
functions.getHttpsCallable("validateRoleAssignment")
    .call(data)
    .addOnSuccessListener { result ->
        Log.d("RoleValidation", "Success: ${result.data}")
    }
    .addOnFailureListener { e ->
        Log.e("RoleValidation", "Error: ${e.message}")
    }

// Record login activity
val loginData = hashMapOf(
    "deviceInfo" to getDeviceInfo()
)
functions.getHttpsCallable("recordLoginActivity")
    .call(loginData)
    .addOnSuccessListener { _ ->
        Log.d("LoginActivity", "Login recorded")
    }

// Record logout and increment login count
val logoutData = hashMapOf(
    "sessionDuration" to (System.currentTimeMillis() - loginTime)
)
functions.getHttpsCallable("recordLogout")
    .call(logoutData)
    .addOnSuccessListener { _ ->
        Log.d("LogoutActivity", "Logout recorded")
    }

================================================================================

