/* =========================================================================
   Zainpreneur Agency — Client Portal auth (demo only)
   Session lives in sessionStorage so each browser tab/session needs a
   fresh login. This is a client-side demo — there is no server, so
   passwords are plain text in data.js purely to make the demo runnable.
   ========================================================================= */

const ZP_SESSION_KEY = 'zp_session_v1';

function zpLogin(type, id) {
  sessionStorage.setItem(ZP_SESSION_KEY, JSON.stringify({ type, id }));
}

function zpLogout() {
  sessionStorage.removeItem(ZP_SESSION_KEY);
}

function zpSession() {
  try {
    return JSON.parse(sessionStorage.getItem(ZP_SESSION_KEY));
  } catch (e) {
    return null;
  }
}

/**
 * Guards a page. Pass the required session type ('customer' | 'agency' | 'team'),
 * or an array of acceptable types (e.g. ['agency', 'team'] for a shared reference page).
 * Redirects to login.html when there's no valid session and returns null;
 * otherwise returns { type, id, record } for the caller to use.
 */
function zpRequireAuth(requiredType) {
  const allowed = Array.isArray(requiredType) ? requiredType : (requiredType ? [requiredType] : null);
  const loginTarget = allowed && allowed[0] !== 'customer' ? allowed[0] : null;
  const loginUrl = loginTarget ? 'login.html?as=' + loginTarget : 'login.html';
  const s = zpSession();
  if (!s || !s.type || !s.id) {
    window.location.href = loginUrl;
    return null;
  }
  if (allowed && allowed.indexOf(s.type) === -1) {
    window.location.href = loginUrl;
    return null;
  }
  const record = s.type === 'agency' ? ZP.data.agencyUsers.find(a => a.id === s.id)
    : s.type === 'team' ? zpGetTeamMember(s.id)
    : zpGetCustomer(s.id);
  if (!record) {
    zpLogout();
    window.location.href = 'login.html';
    return null;
  }
  return { type: s.type, id: s.id, record };
}
