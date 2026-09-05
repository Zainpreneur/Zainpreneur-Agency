/* =========================================================================
   Zainpreneur Agency — Documents page (SRS v2 §9/§10 documents)
   Metadata-only library (title, kind, service link, file name/size,
   notes). File bytes are outside frontend scope until object storage
   lands server-side — the picker records metadata, nothing more.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', function () {
  const session = zpInitShell({ role: 'customer', active: 'documents' });
  if (!session) return;

  const customer = session.record;
  const services = zpGetServicesForCustomer(customer.id);
  let activeKind = 'all';
  let activeService = 'all';
  let editingId = null;

  const KIND_LABEL = {
    report: 'Report', evidence: 'Evidence', config: 'Configuration',
    migration: 'Migration', approval: 'Approval', handover: 'Handover', other: 'Other'
  };

  /* --- filters --- */
  const tabs = document.getElementById('kindTabs');
  tabs.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-kind]');
    if (!btn) return;
    tabs.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeKind = btn.getAttribute('data-kind');
    render();
  });

  const svcSelect = document.getElementById('serviceFilter');
  svcSelect.innerHTML = '<option value="all">All services</option>' +
    services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  svcSelect.addEventListener('change', () => { activeService = svcSelect.value; render(); });

  /* --- table --- */
  const tbody = document.querySelector('#docTable tbody');

  function render() {
    const docs = zpGetDocumentsForCustomer(customer.id)
      .filter(d => (activeKind === 'all' || d.kind === activeKind) &&
        (activeService === 'all' || d.serviceId === activeService))
      .slice()
      .sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));
    if (!docs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="table-empty">No documents in this view.</td></tr>`;
      return;
    }
    tbody.innerHTML = docs.map(d => {
      const svc = d.serviceId ? zpGetService(d.serviceId) : null;
      return `<tr>
        <td><strong>${d.title}</strong></td>
        <td>${KIND_LABEL[d.kind] || d.kind}</td>
        <td>${svc ? `<a href="services.html?svc=${svc.id}">${svc.name}</a>` : '—'}</td>
        <td class="text-muted" style="font-size:0.82rem;">${d.fileName || '—'}${d.fileSize ? ' · ' + d.fileSize : ''}</td>
        <td>${zpFormatDate(d.updatedDate)}</td>
        <td style="white-space:nowrap;">
          <button type="button" class="btn btn-secondary btn-sm" data-preview="${d.id}">Preview</button>
          <button type="button" class="btn btn-secondary btn-sm" data-rename="${d.id}">Rename</button>
          <button type="button" class="btn btn-secondary btn-sm" data-delete="${d.id}">Delete</button>
        </td>
      </tr>`;
    }).join('');
  }

  tbody.addEventListener('click', function (e) {
    const prevBtn = e.target.closest('[data-preview]');
    const renameBtn = e.target.closest('[data-rename]');
    const delBtn = e.target.closest('[data-delete]');
    if (prevBtn) { openPreview(prevBtn.getAttribute('data-preview')); return; }
    if (renameBtn) {
      const d = zpGetDocument(renameBtn.getAttribute('data-rename'));
      if (!d || d.customerId !== customer.id) return;
      openEditor(d.id);
      return;
    }
    if (delBtn) {
      const id = delBtn.getAttribute('data-delete');
      const d = zpGetDocument(id);
      if (!d || d.customerId !== customer.id) return;
      if (!window.confirm(`Delete “${d.title}”? Metadata only — linked services are untouched.`)) return;
      ZP.data.documents = ZP.data.documents.filter(x => x.id !== id);
      zpPersist();
      render();
    }
  });

  /* --- preview --- */
  const previewModal = document.getElementById('previewModal');
  document.getElementById('previewClose').addEventListener('click', () => previewModal.classList.remove('open'));
  previewModal.addEventListener('click', e => { if (e.target === previewModal) previewModal.classList.remove('open'); });

  function openPreview(id) {
    const d = zpGetDocument(id);
    if (!d) return;
    const svc = d.serviceId ? zpGetService(d.serviceId) : null;
    document.getElementById('previewTitle').textContent = d.title;
    document.getElementById('previewBody').innerHTML = `
      <div class="kv-list" style="margin-top:0;">
        <div class="kv"><div class="k">Kind</div><div class="v">${KIND_LABEL[d.kind] || d.kind}</div></div>
        <div class="kv"><div class="k">File</div><div class="v">${d.fileName || '—'}${d.fileSize ? ' · ' + d.fileSize : ''}</div></div>
        <div class="kv"><div class="k">Service</div><div class="v">${svc ? svc.name : '—'}</div></div>
        <div class="kv"><div class="k">Updated</div><div class="v">${zpFormatDate(d.updatedDate)}</div></div>
      </div>
      ${d.notes ? `<p class="text-muted" style="font-size:0.85rem;">${d.notes}</p>` : ''}
      <p class="text-muted" style="font-size:0.8rem;">Byte preview and download arrive with backend object storage.</p>
    `;
    previewModal.classList.add('open');
  }

  /* --- upload / rename editor --- */
  const docModal = document.getElementById('docModal');
  document.getElementById('d_service').innerHTML =
    '<option value="">General (no service)</option>' +
    services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  document.getElementById('uploadBtn').addEventListener('click', () => openEditor(null));
  document.getElementById('docModalClose').addEventListener('click', () => docModal.classList.remove('open'));
  document.getElementById('docCancelBtn').addEventListener('click', () => docModal.classList.remove('open'));
  docModal.addEventListener('click', e => { if (e.target === docModal) docModal.classList.remove('open'); });

  function openEditor(id) {
    editingId = id;
    const d = id ? zpGetDocument(id) : null;
    document.getElementById('docModalTitle').textContent = d ? 'Rename Document' : 'Upload Document';
    document.getElementById('d_title').value = d ? d.title : '';
    document.getElementById('d_kind').value = d ? d.kind : 'report';
    document.getElementById('d_service').value = d && d.serviceId ? d.serviceId : '';
    document.getElementById('d_notes').value = d ? d.notes || '' : '';
    document.getElementById('d_file').value = '';
    docModal.classList.add('open');
  }

  function fmtSize(bytes) {
    if (!bytes && bytes !== 0) return null;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  document.getElementById('docSaveBtn').addEventListener('click', () => {
    const title = document.getElementById('d_title').value.trim();
    if (!title) return;
    const today = ZP_TODAY.toISOString().slice(0, 10);
    const fileInput = document.getElementById('d_file');
    const file = fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
    if (editingId) {
      const d = zpGetDocument(editingId);
      if (!d) return;
      d.title = title;
      d.kind = document.getElementById('d_kind').value;
      d.serviceId = document.getElementById('d_service').value || null;
      d.notes = document.getElementById('d_notes').value.trim();
      if (file) { d.fileName = file.name; d.fileSize = fmtSize(file.size); }
      d.updatedDate = today;
    } else {
      ZP.data.documents.push({
        id: 'doc-' + Date.now().toString().slice(-6), customerId: customer.id,
        serviceId: document.getElementById('d_service').value || null,
        title, kind: document.getElementById('d_kind').value,
        fileName: file ? file.name : null, fileSize: file ? fmtSize(file.size) : null,
        notes: document.getElementById('d_notes').value.trim(),
        createdDate: today, updatedDate: today
      });
    }
    zpPersist();
    document.getElementById('docForm').reset();
    docModal.classList.remove('open');
    render();
  });

  render();
});
