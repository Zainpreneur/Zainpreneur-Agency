/* =========================================================================
   Zainpreneur Agency — Settings (SRS v2 §10 settings)
   Agency-wide defaults. Billing defaults feed the quote flow and invoice
   due dates; catalogue threshold feeds staleness badges; security items
   are recorded as policy until server-side enforcement lands.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'agency', active: 'settings' });
  if (!session) return;

  function load() {
    const s = zpSettings();
    try {
      document.getElementById('api_mode').value = localStorage.getItem('zp_api_mode') || 'mock';
      document.getElementById('api_base').value = localStorage.getItem('zp_api_base') || Api.baseUrl;
    } catch (e) { /* ignore */ }    document.getElementById('g_name').value = s.general.agencyName;
    document.getElementById('g_support').value = s.general.supportEmail;
    document.getElementById('b_currency').value = s.billing.currency;
    document.getElementById('b_terms').value = s.billing.paymentTermsDays;
    document.getElementById('b_deposit').value = s.billing.depositPercent;
    document.getElementById('n_default').value = s.notifications.defaultLevel;
    document.getElementById('c_stale').value = s.catalogue.staleDays;
    document.getElementById('s_timeout').value = s.security.sessionTimeoutMins;
    document.getElementById('s_mfa').value = s.security.mfaRequired ? 'required' : 'optional';
  }

  document.getElementById('settingsSaveBtn').addEventListener('click', () => {
    const s = zpSettings();
    s.general.agencyName = document.getElementById('g_name').value.trim() || s.general.agencyName;
    s.general.supportEmail = document.getElementById('g_support').value.trim();
    s.billing.currency = document.getElementById('b_currency').value;
    s.billing.paymentTermsDays = Math.max(0, parseInt(document.getElementById('b_terms').value, 10) || 0);
    s.billing.depositPercent = Math.min(100, Math.max(0, parseInt(document.getElementById('b_deposit').value, 10) || 0));
    s.notifications.defaultLevel = document.getElementById('n_default').value;
    s.catalogue.staleDays = Math.max(1, parseInt(document.getElementById('c_stale').value, 10) || 90);
    s.security.sessionTimeoutMins = Math.max(15, parseInt(document.getElementById('s_timeout').value, 10) || 480);
    s.security.mfaRequired = document.getElementById('s_mfa').value === 'required';
    try {
      localStorage.setItem('zp_api_mode', document.getElementById('api_mode').value);
      const base = document.getElementById('api_base').value.trim();
      if (base) localStorage.setItem('zp_api_base', base);
      else localStorage.removeItem('zp_api_base');
    } catch (e) { /* ignore */ }
    zpPersist();
    document.getElementById('formAlert').innerHTML =
      `<div class="alert alert-success">Settings saved. Billing defaults apply to new quotes; staleness badges update immediately.</div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.getElementById('apiTestBtn').addEventListener('click', async () => {
    const out = document.getElementById('apiTestResult');
    const base = document.getElementById('api_base').value.trim() || Api.baseUrl;
    out.textContent = 'Testing…';
    try {
      const res = await fetch(base + '/api/health');
      const body = await res.json();
      out.textContent = res.ok && body.ok ? `Connected — API time ${body.time}` : 'Unhealthy response';
    } catch (e) {
      out.textContent = 'Unreachable: ' + e.message;
    }
  });

  load();
});
