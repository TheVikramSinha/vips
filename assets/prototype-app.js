/* ============================================================
   Insurance Product Studio — browser-only application layer
   Shared persistence, cross-page commands, downloads and fixes.
   ============================================================ */
(function () {
  'use strict';

  window.PS = window.PS || {};

  const STORAGE_KEY = 'insurance-product-studio-v2';
  const ADMIN_PERSONA_VERSION = 'admin-demo-v1';
  const applyAdminPersona = localStorage.getItem('ps-persona-version') !== ADMIN_PERSONA_VERSION;
  if (applyAdminPersona) {
    localStorage.setItem('ps-persona-version', ADMIN_PERSONA_VERSION);
    localStorage.setItem('ps-current-role', 'Administrator');
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  const today = () => new Date().toISOString().slice(0, 10);
  const now = () => new Date().toISOString();
  const displayDate = value => {
    if (!value) return null;
    const d = new Date(value + (value.length === 10 ? 'T00:00:00' : ''));
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }).replace(/ /g, '-');
  };
  const escapeHtml = value => String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  function initialState() {
    return {
      schemaVersion: 2,
      products: [],
      productDetails: {},
      collections: {},
      formSnapshots: {},
      lifecycle: {},
      audit: [],
      notifications: [
        { id:'NTF-001', title:'Pricing review assigned', detail:'SME Property All Risks v2026.06-RC1 is awaiting actuarial review.', href:'governance.html', read:false, at:now() },
        { id:'NTF-002', title:'Version expires soon', detail:'Private Car Comprehensive v2026.04 expires on 30-Sep-2026.', href:'product-detail.html?id=PRD-001&version=2026.04#versions', read:false, at:now() }
      ],
      users: {},
      settings: {},
      glossarySuggestions: [],
      webhookRecords: [],
      simulationRuns: [],
      jobs: [],
      currentRole: localStorage.getItem('ps-current-role') || 'Administrator'
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return parsed && parsed.schemaVersion === 2 ? Object.assign(initialState(), parsed) : initialState();
    } catch (_) {
      return initialState();
    }
  }

  let state = loadState();
  if (applyAdminPersona) {
    state.currentRole = 'Administrator';
    saveState();
  }
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function routeName() {
    return location.pathname.split('/').pop() || 'index.html';
  }

  function context() {
    const query = new URLSearchParams(location.search);
    const productId = query.get('product') || query.get('id') || 'PRD-001';
    return {
      page: routeName(),
      productId,
      version: query.get('version') || productById(productId)?.version || null
    };
  }

  function productById(id) {
    return state.products.find(p => p.id === id) || null;
  }

  function versionRecord(productId, version) {
    const detail = state.productDetails[productId];
    if (detail && version) return detail.versions?.find(v => v.label === version) || null;
    const product = productById(productId);
    if (!version && detail) return detail.versions?.find(v => v.label === detail.activeVersion) || detail.versions?.[0] || null;
    if (product && (!version || product.version === version)) return { label:product.version, status:product.status };
    return null;
  }

  function versionStatus(productId, version) {
    const record = versionRecord(productId, version);
    if (record?.status) return record.status;
    if (String(version || '').toUpperCase().includes('DRAFT')) return 'draft';
    return productById(productId)?.status || 'published';
  }

  function canEditVersion() {
    const ctx = context();
    return state.currentRole === 'Administrator' || /DRAFT/i.test(ctx.version || '') || versionStatus(ctx.productId, ctx.version) === 'draft';
  }

  function draftVersion(id, version) {
    const detail = state.productDetails[id];
    const record = detail?.versions?.find(item => item.label === version);
    if (record) return record;
    const product = productById(id);
    return product?.version === version ? { label:version, status:product.status } : null;
  }

  window.openDeleteDraftModal = function (id, version) {
    const product = productById(id);
    const record = draftVersion(id, version);
    if (!product || record?.status !== 'draft') return showResult('Draft not deleted', 'Only Draft versions can be deleted.', { type:'error' });
    PS.openModal(`
      <div class="modal-header"><div><h2 class="modal-title">Delete Draft?</h2><div style="font-size:13px;color:var(--color-muted);margin-top:3px">${escapeHtml(product.name)} · ${escapeHtml(version)}</div></div><button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button></div>
      <div class="modal-body">
        <div class="callout callout-warning"><div class="callout-body"><strong>Draft only.</strong> Saved studio configuration for this Draft will be removed. Published and approved versions stay safe.</div></div>
        <div class="form-group" style="margin-top:16px"><label class="form-label">Type <strong>${escapeHtml(version)}</strong> to confirm</label><input class="form-control text-mono" id="delete-draft-confirm" autocomplete="off"></div>
      </div>
      <div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button><button class="btn btn-danger" onclick="executeDeleteDraft('${escapeHtml(id)}','${escapeHtml(version)}')">Delete Draft</button></div>`);
  };

  window.executeDeleteDraft = function (id, version) {
    const product = productById(id);
    const detail = state.productDetails[id];
    const record = draftVersion(id, version);
    if (!product || record?.status !== 'draft') return showResult('Draft not deleted', 'Only Draft versions can be deleted.', { type:'error' });
    if (document.getElementById('delete-draft-confirm')?.value.trim() !== version) return showResult('Draft not deleted', 'Confirmation does not match the Draft version.', { type:'error' });

    const remaining = (detail?.versions || []).filter(item => item.label !== version);
    Object.keys(state.collections).filter(key => key.startsWith(`${id}::${version}::`)).forEach(key => delete state.collections[key]);
    Object.keys(state.formSnapshots).filter(key => key.includes(`${id}::${version}::`)).forEach(key => delete state.formSnapshots[key]);
    delete state.lifecycle[`${id}::${version}`];

    let destination = 'catalogue.html';
    if (remaining.length) {
      detail.versions = remaining;
      const fallback = remaining[0];
      detail.activeVersion = fallback.label;
      detail.status = fallback.status;
      Object.assign(product, { version:fallback.label, status:fallback.status, lastModified:displayDate(today()) });
      destination = `product-detail.html?id=${encodeURIComponent(id)}&version=${encodeURIComponent(fallback.label)}#versions`;
    } else {
      state.products = state.products.filter(item => item.id !== id);
      delete state.productDetails[id];
      if (Array.isArray(PS.data?.products)) PS.data.products = PS.data.products.filter(item => item.id !== id);
    }

    if (window.PS?.centralPricing) {
      const central = PS.centralPricing.getState();
      [...central.templates,...central.discounts,...central.charges].forEach(item => {
        item.linkedProductIds = (item.linkedProductIds || []).filter(productId => productId !== id);
      });
      PS.centralPricing.replace(central, { type:'product-deleted', id });
    }
    saveState();
    addAudit('DELETED', `Deleted Draft ${id} ${version}`, { productId:id, version });
    PS.closeModal();

    if (routeName() === 'catalogue.html') {
      const localIndex = typeof FULL_PRODUCTS !== 'undefined' ? FULL_PRODUCTS.findIndex(item => item.id === id) : -1;
      if (!remaining.length && localIndex >= 0) FULL_PRODUCTS.splice(localIndex,1);
      else if (localIndex >= 0) Object.assign(FULL_PRODUCTS[localIndex], product);
      if (typeof VERSION_HISTORY !== 'undefined') {
        if (remaining.length) VERSION_HISTORY[id] = remaining.map(item => ({ version:item.label, status:item.status, from:item.from || '—', to:item.to || '—' }));
        else delete VERSION_HISTORY[id];
      }
      renderAll();
      showResult('Draft deleted', `${product.name} ${version} was deleted. Other versions were not changed.`);
    } else {
      location.href = destination;
    }
  };

  function collectionKey(name, ctx = context()) {
    return `${ctx.productId}::${ctx.version || 'active'}::${name}`;
  }

  function hydrateCollection(name, target) {
    const key = collectionKey(name);
    if (!state.collections[key]) {
      state.collections[key] = clone(target);
      saveState();
    } else {
      target.splice(0, target.length, ...clone(state.collections[key]));
    }
    return target;
  }

  function persistCollection(name, target) {
    state.collections[collectionKey(name)] = clone(target);
    saveState();
    addAudit('MODIFIED', `${name} configuration saved`, { collection:name });
  }

  function addAudit(action, description, extra = {}) {
    const ctx = context();
    const event = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      at: now(),
      user: PS.data?.currentUser?.name || 'Anika Sharma',
      role: state.currentRole,
      action,
      page: ctx.page,
      productId: extra.productId || ctx.productId,
      version: extra.version || ctx.version,
      description,
      extra
    };
    state.audit.unshift(event);
    state.audit = state.audit.slice(0, 500);
    saveState();
    return event;
  }

  function addNotification(title, detail, href) {
    state.notifications.unshift({ id:`NTF-${Date.now()}`, title, detail, href, read:false, at:now() });
    saveState();
  }

  function showResult(title, detail, options = {}) {
    document.querySelector('.ps-action-result')?.remove();
    const el = document.createElement('section');
    el.className = `ps-action-result ${options.type || 'success'}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <div class="ps-action-result-icon">${options.type === 'error' ? '!' : '✓'}</div>
      <div style="flex:1;min-width:0">
        <div class="ps-action-result-title">${escapeHtml(title)}</div>
        <div class="ps-action-result-detail">${escapeHtml(detail)}</div>
        ${options.href ? `<a class="ps-action-result-link" href="${escapeHtml(options.href)}">${escapeHtml(options.linkLabel || 'Open result')} →</a>` : ''}
      </div>
      <button class="btn btn-icon" aria-label="Dismiss result" onclick="this.closest('.ps-action-result').remove()">×</button>`;
    const modalBody = options.type === 'error' ? document.querySelector('.modal-overlay.open .modal-body, #active-modal-overlay .modal-body') : null;
    const main = modalBody || document.querySelector('.page-inner, main .page-inner, main');
    if (main) main.prepend(el); else document.body.appendChild(el);
    el.scrollIntoView({ block:'nearest' });
  }

  function download(filename, content, mime = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type:mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showResult('Download created', `${filename} was generated from the current browser data.`);
    addAudit('EXPORTED', `Downloaded ${filename}`);
  }

  function productDetailFrom(product, sourceDetail) {
    const source = sourceDetail ? clone(sourceDetail) : {};
    const version = product.version || '2026.09-DRAFT';
    return Object.assign(source, {
      id:product.id,
      name:product.name,
      family:product.family,
      code:product.code || `${String(product.family || 'PRD').slice(0,3).toUpperCase()}-${new Date().getFullYear()}-${product.id.slice(-3)}`,
      segment:product.segment || source.segment || 'Personal Lines',
      riskType:product.riskType || source.riskType || 'Risk + Policyholder',
      jurisdictions:product.jurisdictions || source.jurisdictions || ['India'],
      distribution:product.distribution || source.distribution || ['Direct (Web)'],
      owner:product.owner || source.owner || 'Anika Sharma',
      description:product.description || source.description || 'New product configuration.',
      notes:product.notes || `Version ${version}: Draft created in the working prototype.`,
      status:product.status || 'draft',
      activeVersion:version,
      versions:[{
        label:version, status:product.status || 'draft', from:product.effectiveFrom || null,
        to:product.effectiveTo || null, by:product.owner || 'Anika Sharma', on:displayDate(today()), gates:0, sim:'Not Run'
      }],
      governance:[
        { gate:'Product Owner', approver:'—', action:'Pending', date:'—', comment:'—' },
        { gate:'Actuarial', approver:'—', action:'Pending', date:'—', comment:'—' },
        { gate:'Underwriting', approver:'—', action:'Pending', date:'—', comment:'—' },
        { gate:'Compliance', approver:'—', action:'Pending', date:'—', comment:'—' },
        { gate:'Ops/Tech', approver:'—', action:'Pending', date:'—', comment:'—' }
      ],
      studios: source.studios || [
        { id:'coverage', name:'Coverage Studio', icon:'umbrella', status:'partial', summary:'Draft configuration', href:'coverage-studio.html' },
        { id:'questionnaire', name:'Questionnaire Studio', icon:'list-checks', status:'partial', summary:'Draft configuration', href:'questionnaire-studio.html' },
        { id:'eligibility', name:'Eligibility Studio', icon:'user-check', status:'partial', summary:'Draft configuration', href:'eligibility-studio.html' },
        { id:'rating', name:'Rating & Pricing Studio', icon:'calculator', status:'missing', summary:'Not configured', href:'rating-studio.html' },
        { id:'underwriting', name:'Underwriting Rules Studio', icon:'shield-check', status:'missing', summary:'Not configured', href:'underwriting-studio.html' },
        { id:'distribution', name:'Distribution Studio', icon:'tree-structure', status:'missing', summary:'Not configured', href:'distribution-studio.html' },
        { id:'document', name:'Document Studio', icon:'file-text', status:'missing', summary:'Not configured', href:'document-studio.html' }
      ],
      checklist: source.checklist || [
        { studio:'Coverage Studio', status:'warn', note:'Review required' },
        { studio:'Questionnaire Studio', status:'warn', note:'Review required' },
        { studio:'Eligibility Studio', status:'warn', note:'Review required' },
        { studio:'Rating & Pricing Studio', status:'empty', note:'Not configured' },
        { studio:'Underwriting Rules Studio', status:'empty', note:'Not configured' },
        { studio:'Distribution Studio', status:'empty', note:'Not configured' },
        { studio:'Document Studio', status:'empty', note:'Not configured' }
      ],
      completion: source.completion || 0,
      lastSim:null
    });
  }

  function nextProductId() {
    const max = state.products.reduce((n, p) => Math.max(n, Number(String(p.id).replace(/\D/g, '')) || 0), 0);
    return `PRD-${String(max + 1).padStart(3, '0')}`;
  }

  function persistProduct(product, detail) {
    const index = state.products.findIndex(p => p.id === product.id);
    if (index >= 0) state.products[index] = clone(product); else state.products.push(clone(product));
    if (detail) state.productDetails[product.id] = clone(detail);
    saveState();
  }

  function cloneVersion(productId, sourceVersion, label, from, to) {
    const detail = state.productDetails[productId];
    if (!detail) throw new Error('Product detail is unavailable. Open the product once and retry.');
    if (!label) throw new Error('Version label is required.');
    if (detail.versions.some(v => v.label === label)) throw new Error(`Version ${label} already exists.`);
    const version = { label, status:'draft', from:from ? displayDate(from) : null, to:to ? displayDate(to) : null, by:PS.data?.currentUser?.name || 'Anika Sharma', on:displayDate(today()), gates:0, sim:'Not Run' };
    detail.versions.unshift(version);
    detail.activeVersion = label;
    detail.status = 'draft';
    detail.notes = `Version ${label}: Cloned from ${sourceVersion}. Governance approvals were reset.`;
    state.productDetails[productId] = detail;
    const product = productById(productId);
    if (product) {
      product.version = label;
      product.status = 'draft';
      product.effectiveFrom = version.from;
      product.effectiveTo = version.to;
      product.lastModified = displayDate(today());
    }
    const prefix = `${productId}::${sourceVersion}::`;
    Object.keys(state.collections).filter(k => k.startsWith(prefix)).forEach(k => {
      state.collections[k.replace(prefix, `${productId}::${label}::`)] = clone(state.collections[k]);
    });
    saveState();
    addAudit('CREATED', `Created draft version ${label} cloned from ${sourceVersion}`, { productId, version:label, sourceVersion });
    addNotification('Draft version created', `${detail.name} v${label} is ready to edit.`, `product-detail.html?id=${productId}&version=${encodeURIComponent(label)}#studios`);
    return version;
  }

  function snapshotControls(entityId) {
    const root = document.getElementById('detail-panel') || document.getElementById('tab-content') || document.querySelector('main');
    if (!root) return;
    const values = Array.from(root.querySelectorAll('input, select, textarea')).map((el, index) => ({
      index, value:el.value, checked:'checked' in el ? el.checked : undefined, type:el.type
    }));
    const key = `${context().page}::${collectionKey('forms')}::${entityId || 'active'}`;
    state.formSnapshots[key] = values;
    saveState();
  }

  function restoreControls(entityId) {
    const root = document.getElementById('detail-panel') || document.getElementById('tab-content') || document.querySelector('main');
    if (!root) return;
    const key = `${context().page}::${collectionKey('forms')}::${entityId || 'active'}`;
    const values = state.formSnapshots[key];
    if (!values) return;
    const controls = Array.from(root.querySelectorAll('input, select, textarea'));
    values.forEach(item => {
      const el = controls[item.index];
      if (!el) return;
      if (item.checked !== undefined && (el.type === 'checkbox' || el.type === 'radio')) el.checked = item.checked;
      else el.value = item.value;
    });
  }

  PS.prototypeApp = {
    get state() { return state; },
    save:saveState,
    context,
    productById,
    versionStatus,
    canEditVersion,
    hydrateCollection,
    persistCollection,
    addAudit,
    addNotification,
    showResult,
    download,
    cloneVersion,
    snapshotControls,
    restoreControls,
    reset() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('ps-current-role');
      location.reload();
    }
  };

  /* Legacy pages used transient toasts as their only outcome. Keep their
     call sites working, but surface a durable, inspectable page result. */
  PS.actionResult = function (type, title, message) {
    const known = ['success','error','danger','warning','info'];
    if (!known.includes(String(type).toLowerCase())) {
      message = title;
      title = type;
      type = 'info';
    }
    showResult(title || 'Action completed', message || 'The browser prototype state was updated.', {
      type: ['error','danger','warning'].includes(String(type).toLowerCase()) ? 'error' : 'success'
    });
  };

  /* Seed and hydrate page-owned arrays before DOMContentLoaded renders them. */
  if (typeof FULL_PRODUCTS !== 'undefined') {
    if (!state.products.length) state.products = clone(FULL_PRODUCTS);
    FULL_PRODUCTS.splice(0, FULL_PRODUCTS.length, ...clone(state.products));
    Object.keys(VERSION_HISTORY || {}).forEach(id => {
      const detail = state.productDetails[id];
      if (detail?.versions) VERSION_HISTORY[id] = detail.versions.map(v => ({ version:v.label, status:v.status, from:v.from || '—', to:v.to || '—' }));
    });
    saveState();
  } else if (!state.products.length && PS.data?.products) {
    state.products = PS.data.products.map((p, i) => Object.assign({ owner:p.lastModifiedBy || 'Anika Sharma', sortOrder:i }, clone(p)));
    saveState();
  }

  if (typeof PRODUCTS_DETAIL !== 'undefined') {
    Object.entries(PRODUCTS_DETAIL).forEach(([id, detail]) => {
      if (!state.productDetails[id]) state.productDetails[id] = clone(detail);
    });
    state.products.forEach(product => {
      if (!state.productDetails[product.id]) {
        const source = product.sourceProductId ? state.productDetails[product.sourceProductId] : null;
        state.productDetails[product.id] = productDetailFrom(product, source);
      } else if (!Array.isArray(state.productDetails[product.id].studios) || !Array.isArray(state.productDetails[product.id].checklist)) {
        state.productDetails[product.id] = productDetailFrom(product, state.productDetails[product.id]);
      }
    });
    Object.keys(PRODUCTS_DETAIL).forEach(k => delete PRODUCTS_DETAIL[k]);
    Object.assign(PRODUCTS_DETAIL, clone(state.productDetails));
    saveState();
  }

  if (typeof COVERS !== 'undefined') hydrateCollection('covers', COVERS);
  if (typeof GROUPS !== 'undefined') hydrateCollection('questionGroups', GROUPS);
  if (typeof COMPONENTS !== 'undefined') hydrateCollection('ratingComponents', COMPONENTS);
  if (typeof CHANNELS !== 'undefined') hydrateCollection('channels', CHANNELS);
  if (typeof DOCUMENTS !== 'undefined') hydrateCollection('documents', DOCUMENTS);
  if (typeof TESTS !== 'undefined') hydrateCollection('testCases', TESTS);
  if (typeof RULES !== 'undefined') {
    const name = routeName().includes('eligibility') ? 'eligibilityRules' : 'underwritingRules';
    hydrateCollection(name, RULES);
  }

  /* Dashboard commands and table data. */
  if (routeName() === 'index.html') {
    if (PS.data?.products) PS.data.products.splice(0, PS.data.products.length, ...clone(state.products));

    window.createProduct = function () {
      const name = document.getElementById('new-product-name')?.value.trim();
      const family = document.getElementById('new-product-family')?.value;
      if (!name || !family) return showResult('Product not created', 'Product name and family are required.', { type:'error' });
      const id = nextProductId();
      const product = { id, name, family, version:'2026.09-DRAFT', status:'draft', owner:PS.data.currentUser.name, lastModified:displayDate(today()), effectiveFrom:null, effectiveTo:null, description:document.getElementById('new-product-desc')?.value.trim() || 'New product configuration.' };
      persistProduct(product, productDetailFrom(product));
      PS.data.products.push(clone(product));
      addAudit('CREATED', `Created ${name} as a Draft`, { productId:id, version:product.version });
      PS.closeModal();
      if (typeof renderProductsTable === 'function') renderProductsTable();
      showResult('Product created', `${name} (${id}) now appears in the dashboard and catalogue.`, { href:`product-detail.html?id=${id}&version=${encodeURIComponent(product.version)}`, linkLabel:'Configure product' });
    };

    window.handleClone = function (id) {
      const source = productById(id);
      if (!source) return showResult('Clone not created', `Product ${id} was not found.`, { type:'error' });
      const newId = nextProductId();
      const label = `${source.version.replace(/-DRAFT$/i,'')}-DRAFT-${newId.slice(-3)}`;
      const product = Object.assign({}, clone(source), { id:newId, name:`${source.name} — Copy`, version:label, status:'draft', owner:PS.data.currentUser.name, effectiveFrom:null, effectiveTo:null, lastModified:displayDate(today()), sourceProductId:id });
      persistProduct(product, productDetailFrom(product, state.productDetails[id]));
      PS.data.products.push(clone(product));
      addAudit('CREATED', `Cloned ${source.name} to ${product.name}`, { productId:newId, version:label, sourceProductId:id });
      if (typeof renderProductsTable === 'function') renderProductsTable();
      showResult('Product clone created', `${product.name} (${newId}) is a Draft and is visible in the table.`, { href:`product-detail.html?id=${newId}&version=${encodeURIComponent(label)}`, linkLabel:'Open clone' });
    };

    window.executeRetire = function (id, version) {
      const input = document.getElementById('retire-confirm-input')?.value.trim();
      if (input !== version) return showResult('Version not retired', 'Type the exact version label to confirm.', { type:'error' });
      const product = productById(id);
      if (product) product.status = 'retired';
      const row = PS.data.products.find(p => p.id === id); if (row) row.status = 'retired';
      saveState(); addAudit('RETIRED', `Retired ${id} ${version}`, { productId:id, version });
      PS.closeModal(); if (typeof renderProductsTable === 'function') renderProductsTable();
      showResult('Version retired', `${id} v${version} now shows Retired.`);
    };
  }

  /* Shared shell */
  if (PS.nav) {
    PS.nav.switchRole = function (role) {
      state.currentRole = role;
      localStorage.setItem('ps-current-role', role);
      if (PS.data?.currentUser) PS.data.currentUser.role = role;
      saveState();
      location.reload();
    };
  }

  function wireShell() {
    if (PS.data?.currentUser && state.currentRole) {
      PS.data.currentUser.role = state.currentRole;
      document.querySelectorAll('.topbar-user-role, .role-badge').forEach(el => {
        if (el.closest('.topbar-user') || el.closest('.nav-footer')) el.textContent = state.currentRole;
      });
    }

    if (/-studio\.html$/.test(routeName())) {
      const ctx = context();
      const product = productById(ctx.productId);
      document.querySelectorAll('.studio-context-pill').forEach(el => {
        const icon = el.querySelector('svg')?.outerHTML || '';
        el.innerHTML = `${icon}${escapeHtml(ctx.productId)} · v${escapeHtml(ctx.version || 'Draft')}`;
      });
      const subtitle = document.querySelector('.page-subtitle');
      if (subtitle && product) {
        const suffix = subtitle.textContent.includes('—') ? ` —${subtitle.textContent.split('—').slice(1).join('—')}` : '';
        subtitle.textContent = `${product.name} · v${ctx.version || product.version}${suffix}`;
      }
      document.querySelectorAll('a[href*="product-detail.html"]').forEach(link => {
        if (/Back to Product/i.test(link.textContent)) link.href = `product-detail.html?id=${encodeURIComponent(ctx.productId)}&version=${encodeURIComponent(ctx.version || '')}#studios`;
      });
      if (canEditVersion()) {
        document.querySelectorAll('.published-only-banner').forEach(el => { el.style.display = 'none'; });
      }
    }

    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
      globalSearch.addEventListener('keydown', e => {
        if (e.key !== 'Enter') return;
        const q = globalSearch.value.trim().toLowerCase();
        if (!q) return;
        const matches = state.products.filter(p => `${p.id} ${p.name} ${p.family} ${p.version}`.toLowerCase().includes(q));
        PS.openModal(`
          <div class="modal-header"><h2 class="modal-title">Search Results</h2><button class="btn btn-icon" onclick="PS.closeModal()" aria-label="Close">×</button></div>
          <div class="modal-body">
            ${matches.length ? matches.map(p => `<a href="product-detail.html?id=${p.id}&version=${encodeURIComponent(p.version)}" style="display:block;padding:12px;border-bottom:1px solid var(--color-border);text-decoration:none"><strong>${escapeHtml(p.name)}</strong><div style="font-size:12px;color:var(--color-muted)">${p.id} · ${escapeHtml(p.family)} · v${escapeHtml(p.version)}</div></a>`).join('') : `<div class="empty-state"><div class="empty-title">No results</div><div class="empty-desc">No product, ID, family or version matched “${escapeHtml(q)}”.</div></div>`}
          </div><div class="modal-footer"><a class="btn btn-secondary" href="glossary.html?q=${encodeURIComponent(q)}">Search Glossary</a><button class="btn btn-primary" onclick="PS.closeModal()">Close</button></div>`);
      });
    }

    const notif = document.getElementById('notif-btn');
    if (notif) {
      notif.onclick = function () {
        state.notifications.forEach(n => { n.read = true; });
        saveState();
        PS.openModal(`
          <div class="modal-header"><h2 class="modal-title">Notifications</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div>
          <div class="modal-body">${state.notifications.length ? state.notifications.map(n => `<a href="${escapeHtml(n.href || '#')}" style="display:block;padding:12px 0;border-bottom:1px solid var(--color-border);text-decoration:none"><strong>${escapeHtml(n.title)}</strong><div style="font-size:13px;color:var(--color-muted);margin-top:3px">${escapeHtml(n.detail)}</div></a>`).join('') : '<div class="empty-state"><div class="empty-title">No notifications</div></div>'}</div>
          <div class="modal-footer"><button class="btn btn-primary" onclick="PS.closeModal()">Done</button></div>`);
        document.querySelector('.notif-dot')?.remove();
      };
    }
  }

  /* Catalogue commands */
  if (routeName() === 'catalogue.html') {
    window.executeClone = function (id) {
      const source = state.products.find(p => p.id === id);
      const name = document.getElementById('clone-name')?.value.trim();
      const label = document.getElementById('clone-version')?.value.trim();
      const owner = document.getElementById('clone-owner')?.value || source?.owner || 'Anika Sharma';
      if (!source || !name || !label) {
        showResult('Clone not created', 'Product name and version label are required.', { type:'error' });
        return;
      }
      const newId = nextProductId();
      const product = Object.assign({}, clone(source), {
        id:newId, name, version:label, status:'draft', effectiveFrom:null, effectiveTo:null,
        owner, lastModified:displayDate(today()), sortOrder:state.products.length,
        sourceProductId:id, sourceVersion:source.version
      });
      const sourceDetail = state.productDetails[id] || null;
      const detail = productDetailFrom(product, sourceDetail);
      persistProduct(product, detail);
      FULL_PRODUCTS.push(clone(product));
      VERSION_HISTORY[newId] = [{ version:label, status:'draft', from:'—', to:'—' }];
      addAudit('CREATED', `Cloned ${source.name} ${source.version} to ${name} ${label}`, { productId:newId, version:label, sourceProductId:id });
      addNotification('Product clone created', `${name} v${label} is ready to configure.`, `product-detail.html?id=${newId}&version=${encodeURIComponent(label)}`);
      PS.closeModal();
      renderAll();
      showResult('Product clone created', `${name} (${newId}) is now a persisted Draft and appears in the catalogue.`, { href:`product-detail.html?id=${newId}&version=${encodeURIComponent(label)}`, linkLabel:'Open cloned product' });
    };

    window.executeCreate = function () {
      const name = document.getElementById('w-name')?.value.trim();
      const family = document.getElementById('w-family')?.value;
      const version = document.getElementById('w-version')?.value.trim();
      if (!name || !family || !version) {
        showResult('Product not created', 'Name, family and version are required.', { type:'error' });
        return;
      }
      const newId = nextProductId();
      const sourceId = document.getElementById('w-clone-toggle')?.checked ? document.getElementById('w-clone-product')?.value : null;
      const product = {
        id:newId, name, family, version, status:'draft',
        effectiveFrom:displayDate(document.getElementById('w-eff-from')?.value),
        effectiveTo:displayDate(document.getElementById('w-eff-to')?.value),
        owner:document.getElementById('w-owner')?.value || 'Anika Sharma',
        segment:document.getElementById('w-segment')?.value || 'Personal Lines',
        code:newId,
        description:document.getElementById('w-desc')?.value,
        jurisdictions:Array.from(document.querySelectorAll('#wizard-step-1 input[type="checkbox"]:checked')).map(x => x.value),
        lastModified:displayDate(today()), sortOrder:state.products.length, sourceProductId:sourceId
      };
      const detail = productDetailFrom(product, sourceId ? state.productDetails[sourceId] : null);
      persistProduct(product, detail);
      addAudit('CREATED', `Created product ${name} ${version}`, { productId:newId, version });
      PS.closeModal();
      location.href = `product-detail.html?id=${newId}&version=${encodeURIComponent(version)}#studios`;
    };

    window.executeRetire = function (id, name) {
      const input = document.getElementById('retire-confirm')?.value.trim();
      if (input !== name) {
        showResult('Product not retired', 'Type the exact product name to confirm.', { type:'error' });
        return;
      }
      const product = productById(id);
      product.status = 'retired';
      const detail = state.productDetails[id];
      if (detail) {
        detail.status = 'retired';
        const version = detail.versions.find(v => v.label === product.version);
        if (version) version.status = 'retired';
      }
      saveState();
      const local = FULL_PRODUCTS.find(p => p.id === id);
      if (local) local.status = 'retired';
      addAudit('RETIRED', `Retired ${product.name} ${product.version}`, { productId:id, version:product.version });
      PS.closeModal();
      renderAll();
      showResult('Product retired', `${product.name} now shows Retired in the catalogue.`);
    };

    window.handleExport = function () {
      const rows = getFiltered();
      const csv = ['Product ID,Product Name,Family,Version,Status,Owner,Effective From,Effective To']
        .concat(rows.map(p => [p.id,p.name,p.family,p.version,p.status,p.owner,p.effectiveFrom||'',p.effectiveTo||''].map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))).join('\n');
      download(`product-catalogue-${today()}.csv`, csv, 'text/csv;charset=utf-8');
    };
  }

  /* Product Detail commands */
  if (routeName() === 'product-detail.html') {
    window.saveOverview = function () {
      const p = currentProduct;
      const update = (id, key) => { const el = document.getElementById(id); if (el) p[key] = el.value.trim(); };
      update('w-name-edit','name'); update('w-family-edit','family'); update('w-segment-edit','segment');
      update('w-code-edit','code'); update('w-risktype-edit','riskType'); update('w-owner-edit','owner');
      update('w-notes-edit','notes');
      const desc = document.querySelector('#tab-content textarea');
      if (desc) p.description = desc.value.trim();
      const product = productById(p.id);
      if (product) Object.assign(product, { name:p.name, family:p.family, owner:p.owner, lastModified:displayDate(today()) });
      state.productDetails[p.id] = clone(p);
      saveState();
      addAudit('MODIFIED', `Updated product details for ${p.name}`, { productId:p.id, version:activeVersion });
      editMode = false; dirtyState = false;
      renderPage();
      showResult('Product details saved', `All edited fields for ${p.name} were stored in this browser and will survive refresh.`);
    };

    window.executeClone = function () {
      const label = document.getElementById('cv-label')?.value.trim();
      const from = document.getElementById('cv-from')?.value;
      const to = document.getElementById('cv-to')?.value;
      try {
        cloneVersion(currentProduct.id, activeVersion, label, from, to);
        currentProduct = state.productDetails[currentProduct.id];
        PS.closeModal();
        location.href = `product-detail.html?id=${currentProduct.id}&version=${encodeURIComponent(label)}#studios`;
      } catch (error) {
        showResult('Version not cloned', error.message, { type:'error' });
      }
    };

    window.createNewVersion = function () {
      const label = document.getElementById('nv-label')?.value.trim();
      const from = document.getElementById('nv-from')?.value;
      const to = document.getElementById('nv-to')?.value;
      const base = document.getElementById('nv-base')?.value || activeVersion;
      try {
        cloneVersion(currentProduct.id, base, label, from, to);
        PS.closeModal();
        location.href = `product-detail.html?id=${currentProduct.id}&version=${encodeURIComponent(label)}#overview`;
      } catch (error) {
        showResult('Version not created', error.message, { type:'error' });
      }
    };

    window.handleSubmitReview = function () {
      PS.openModal(`
        <div class="modal-header"><h2 class="modal-title">Submit for Review</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div>
        <div class="modal-body"><div class="callout callout-info"><div class="callout-body">This locks the selected Draft and places it in the Governance queue.</div></div><div class="form-group" style="margin-top:16px"><label class="form-label">Review summary</label><textarea id="ps-review-note" class="form-control" rows="4" placeholder="Describe the changes for reviewers"></textarea></div></div>
        <div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button><button class="btn btn-primary" id="ps-confirm-submit">Submit for Review</button></div>`);
      document.getElementById('ps-confirm-submit').onclick = () => {
        const note = document.getElementById('ps-review-note').value.trim();
        if (!note) return showResult('Submission incomplete', 'Enter a review summary.', { type:'error' });
        const detail = state.productDetails[currentProduct.id];
        const version = detail.versions.find(v => v.label === activeVersion);
        version.status = 'review'; detail.status = 'review';
        const product = productById(currentProduct.id); if (product) product.status = 'review';
        detail.governance[0] = { gate:'Product Owner', approver:PS.data.currentUser.name, action:'Approved', date:displayDate(today()), comment:note };
        saveState(); addAudit('SUBMITTED', `Submitted ${detail.name} ${activeVersion} for review`, { productId:detail.id, version:activeVersion, note });
        addNotification('Review submitted', `${detail.name} v${activeVersion} is now In Review.`, `governance.html?product=${detail.id}`);
        PS.closeModal(); location.reload();
      };
    };

    window.schedulePublication = function () {
      const dt = document.getElementById('pub-date')?.value;
      if (!dt) return showResult('Publication not scheduled', 'Choose a publication date and time.', { type:'error' });
      state.lifecycle[`${currentProduct.id}::${activeVersion}`] = { status:'scheduled', at:dt };
      saveState(); addAudit('SCHEDULED', `Scheduled ${currentProduct.name} ${activeVersion} for ${dt}`);
      showResult('Publication scheduled', `${currentProduct.name} v${activeVersion} will publish at ${new Date(dt).toLocaleString()}.`);
    };
    window.publishNow = function () {
      const detail = state.productDetails[currentProduct.id];
      const version = detail.versions.find(v => v.label === activeVersion);
      version.status = 'published'; detail.status = 'published';
      const product = productById(currentProduct.id); if (product) product.status = 'published';
      saveState(); addAudit('PUBLISHED', `Published ${detail.name} ${activeVersion}`);
      addNotification('Product published', `${detail.name} v${activeVersion} is live in the prototype.`, `integration-monitor.html?product=${detail.id}`);
      location.reload();
    };

    window.executeApprove = function (index) {
      const comment = document.getElementById('approve-comment')?.value.trim() || 'Approved.';
      const gate = currentProduct.governance[index];
      Object.assign(gate, { action:'Approved', approver:PS.data.currentUser.name, date:displayDate(today()), comment });
      const allApproved = currentProduct.governance.every(item => item.action === 'Approved');
      const version = currentProduct.versions.find(v => v.label === activeVersion);
      if (allApproved && version) { version.status = 'approved'; currentProduct.status = 'approved'; }
      state.productDetails[currentProduct.id] = clone(currentProduct);
      const product = productById(currentProduct.id); if (product && allApproved) product.status = 'approved';
      saveState(); addAudit('APPROVED', `${gate.gate} gate approved: ${comment}`, { productId:currentProduct.id, version:activeVersion, gate:gate.gate }); PS.closeModal();
      renderGovernance(document.getElementById('tab-content'));
      showResult('Governance gate approved', `${gate.gate} is approved${allApproved ? '; the version is now Approved and ready to publish' : ''}.`);
    };
    window.rejectGate = function (index) {
      PS.openModal(`<div class="modal-header"><h2 class="modal-title">Reject ${escapeHtml(currentProduct.governance[index].gate)} Gate</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div><div class="modal-body"><label class="form-label">Rejection reason</label><textarea id="ps-reject-reason" class="form-control" rows="4" placeholder="Required"></textarea></div><div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button><button class="btn btn-danger" onclick="executeRejectGate(${index})">Reject Gate</button></div>`);
    };
    window.executeRejectGate = function (index) {
      const reason = document.getElementById('ps-reject-reason')?.value.trim();
      if (!reason) return showResult('Gate not rejected', 'Enter a rejection reason.', { type:'error' });
      const gate = currentProduct.governance[index]; Object.assign(gate, { action:'Rejected', approver:PS.data.currentUser.name, date:displayDate(today()), comment:reason });
      const version = currentProduct.versions.find(v => v.label === activeVersion); if (version) version.status = 'draft'; currentProduct.status = 'draft';
      state.productDetails[currentProduct.id] = clone(currentProduct); const product = productById(currentProduct.id); if (product) product.status = 'draft';
      saveState(); addAudit('REJECTED', `${gate.gate} gate rejected: ${reason}`, { productId:currentProduct.id, version:activeVersion, gate:gate.gate }); PS.closeModal(); renderGovernance(document.getElementById('tab-content'));
      showResult('Governance gate rejected', `${gate.gate} returned the version to Draft. Reason: ${reason}`);
    };
    window.commentGate = function (index) {
      PS.openModal(`<div class="modal-header"><h2 class="modal-title">Comment on ${escapeHtml(currentProduct.governance[index].gate)}</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div><div class="modal-body"><textarea id="ps-gate-comment" class="form-control" rows="4" placeholder="Write a review comment"></textarea></div><div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Cancel</button><button class="btn btn-primary" onclick="saveGateComment(${index})">Add Comment</button></div>`);
    };
    window.saveGateComment = function (index) {
      const comment = document.getElementById('ps-gate-comment')?.value.trim(); if (!comment) return showResult('Comment not added', 'Enter a comment.', { type:'error' });
      currentProduct.governance[index].comment = comment; state.productDetails[currentProduct.id] = clone(currentProduct); saveState(); addAudit('COMMENTED', `${currentProduct.governance[index].gate}: ${comment}`, { productId:currentProduct.id, version:activeVersion }); PS.closeModal(); renderGovernance(document.getElementById('tab-content'));
      showResult('Governance comment added', comment);
    };
  }

  /* Studio persistence and create actions */
  function installEditableRof() {
    if (!canEditVersion() || typeof rof === 'undefined') return;
    window.rof = function (label, value, mono) {
      return `<div class="form-group"><label class="form-label">${escapeHtml(label)}</label><input class="form-control ps-persist-field" type="text" value="${escapeHtml(value || '')}" ${mono ? 'style="font-family:IBM Plex Mono,monospace"' : ''}></div>`;
    };
  }
  installEditableRof();

  if (typeof productStatus !== 'undefined') productStatus = canEditVersion() ? 'draft' : 'published';

  if (routeName() === 'coverage-studio.html') {
    window.saveCover = function () {
      const cover = COVERS.find(c => c.id === activeCoverId);
      snapshotControls(activeCoverId);
      const firstName = document.querySelector('#detail-panel input[type="text"]');
      if (cover && firstName?.value.trim()) cover.name = firstName.value.trim();
      persistCollection('covers', COVERS);
      renderCoverList();
      showResult('Cover saved', `${cover?.name || 'Cover'} and its visible fields were persisted for ${context().productId} v${context().version}.`);
    };
    window.executeAddCover = function () {
      const name = document.getElementById('ac-name')?.value.trim();
      const type = document.getElementById('ac-type')?.value;
      const lineOfBusiness = document.getElementById('ac-lob')?.value || productById(context().productId)?.family || 'Motor';
      if (!name || !type || !lineOfBusiness) return showResult('Cover not added', 'Cover name, type, and line of business are required.', { type:'error' });
      const id = `COV-${String(Date.now()).slice(-6)}`;
      const partial = { id, name, type, lineOfBusiness, availability:document.getElementById('ac-avail')?.value || 'optional', description:document.getElementById('ac-desc')?.value || '', status:'incomplete', complete:false };
      const base = typeof createCoverageDefaults === 'function' ? createCoverageDefaults(partial) : Object.assign(clone(COVERS[0] || {}), partial);
      COVERS.push(base); activeCoverId = id; persistCollection('covers', COVERS); PS.closeModal(); renderCoverList(); loadCover(id);
      showResult('Cover added', `${name} now appears in the cover list and is ready to configure.`);
    };
    const legacyReorderModal = window.openReorderModal;
    window.openReorderModal = function () {
      legacyReorderModal();
      document.querySelectorAll('#reorder-list > div').forEach((row, index) => {
        row.dataset.coverId = COVERS[index]?.id || '';
        const controls = document.createElement('span'); controls.style.cssText = 'display:flex;gap:4px';
        controls.innerHTML = '<button class="btn btn-icon btn-sm" type="button" aria-label="Move up">↑</button><button class="btn btn-icon btn-sm" type="button" aria-label="Move down">↓</button>';
        const [up, down] = controls.querySelectorAll('button');
        up.onclick = () => { const prev = row.previousElementSibling; if (prev) row.parentElement.insertBefore(row, prev); };
        down.onclick = () => { const next = row.nextElementSibling; if (next) row.parentElement.insertBefore(next, row); };
        row.appendChild(controls);
      });
    };
    window.saveCoverOrder = function () {
      const ids = Array.from(document.querySelectorAll('#reorder-list > div')).map(row => row.dataset.coverId);
      COVERS.splice(0, COVERS.length, ...ids.map(id => COVERS.find(c => c.id === id)).filter(Boolean));
      persistCollection('covers', COVERS); PS.closeModal(); renderCoverList();
      showResult('Cover order saved', 'The cover list and persisted configuration now use the selected order.');
    };
    window.importSelectedLibraryItems = function () {
      const rows = Array.from(document.querySelectorAll('#active-modal-overlay tbody tr')).filter(row => row.querySelector('input[type="checkbox"]:checked'));
      if (!rows.length) return showResult('No covers imported', 'Select at least one library cover.', { type:'error' });
      rows.forEach((row, index) => {
        const partial = { id:`COV-LIB-${String(Date.now() + index).slice(-5)}`, name:row.cells[1].innerText.trim(), type:row.cells[2].innerText.trim(), lineOfBusiness:row.cells[3].innerText.trim(), availability:'optional', status:'incomplete', complete:false };
        const base = typeof createCoverageDefaults === 'function' ? createCoverageDefaults(partial) : Object.assign(clone(COVERS[0] || {}), partial);
        COVERS.push(base);
      });
      persistCollection('covers', COVERS); PS.closeModal(); renderCoverList(); showResult('Covers imported', `${rows.length} selected library cover${rows.length === 1 ? '' : 's'} now appear as Draft configuration.`);
    };
  }

  if (routeName() === 'questionnaire-studio.html') {
    window.executeAddQuestion = function () {
      const label = document.getElementById('aq-label')?.value.trim();
      const type = document.getElementById('aq-type')?.value;
      const groupId = document.getElementById('aq-group')?.value;
      if (!label || !type) return showResult('Question not added', 'Question label and type are required.', { type:'error' });
      const group = GROUPS.find(g => g.id === groupId) || GROUPS[0];
      const id = `QST-${String(Date.now()).slice(-6)}`;
      group.questions.push({ id, label, internalName:document.getElementById('aq-name')?.value.trim() || label.toLowerCase().replace(/\W+/g,'_'), type, required:document.getElementById('aq-required')?.checked, warning:false });
      persistCollection('questionGroups', GROUPS); PS.closeModal(); renderTree(); loadQuestion(id);
      showResult('Question added', `${label} now appears under ${group.label}.`);
    };
    window.createQuestionGroup = function () {
      const label = document.getElementById('ag-name')?.value.trim();
      if (!label) return showResult('Group not created', 'Group name is required.', { type:'error' });
      GROUPS.push({ id:`grp-${Date.now()}`, label, questions:[] });
      persistCollection('questionGroups', GROUPS); PS.closeModal(); renderTree();
      showResult('Question group created', `${label} is now available in the question tree.`);
    };
    window.importSelectedLibraryItems = function () {
      const rows = Array.from(document.querySelectorAll('#active-modal-overlay tbody tr')).filter(row => row.querySelector('input[type="checkbox"]:checked'));
      if (!rows.length) return showResult('No questions imported', 'Select at least one library question.', { type:'error' });
      const group = GROUPS[0]; rows.forEach(row => group.questions.push({ id:`QST-LIB-${String(Date.now() + Math.random()).replace(/\D/g,'').slice(-6)}`, label:row.cells[1].innerText.trim(), internalName:row.cells[2].innerText.trim(), type:row.cells[3].innerText.trim(), required:false, warning:false }));
      persistCollection('questionGroups', GROUPS); PS.closeModal(); renderTree(); showResult('Questions imported', `${rows.length} selected question${rows.length === 1 ? '' : 's'} now appear in ${group.label}.`);
    };
  }

  if (routeName() === 'eligibility-studio.html') {
    window.createEligibilityRule = function () {
      const name = document.getElementById('ar-name')?.value.trim();
      if (!name) return showResult('Rule not created', 'Rule name is required.', { type:'error' });
      const id = `ELG-${String(Date.now()).slice(-4)}`;
      const base = clone(RULES[0] || {});
      Object.assign(base, { id, name, category:document.getElementById('ar-cat')?.value || 'Product Eligibility', priority:10, status:'active', conditions:[{ field:'driver_age', op:'>=', value:'18' }] });
      RULES.push(base); persistCollection('eligibilityRules', RULES); PS.closeModal(); renderRuleList(); loadRule(id);
      showResult('Eligibility rule created', `${name} now appears in the rule list.`);
    };
  }

  if (routeName() === 'rating-studio.html') {
    window.executeAddComponent = function (type) {
      const name = document.getElementById('new-comp-name')?.value.trim() || type;
      const id = document.getElementById('new-comp-id')?.value.trim();
      if (!id || COMPONENTS.some(c => c.id === id)) return showResult('Component not added', 'Use a unique component ID.', { type:'error' });
      const base = clone(COMPONENTS.find(c => c.type === 'base') || COMPONENTS[0] || {});
      Object.assign(base, { id, name, type:type.toLowerCase().replace(/\s.*/, ''), amount:document.getElementById('new-comp-val')?.value || '0', configured:true });
      COMPONENTS.push(base); persistCollection('ratingComponents', COMPONENTS); PS.closeModal(); renderTree(); loadComponent(id);
      showResult('Rating component added', `${name} (${id}) now appears in the component tree.`);
    };
  }

  if (routeName() === 'underwriting-studio.html') {
    window.executeAddUWRule = function () {
      const name = document.getElementById('new-uw-name')?.value.trim();
      const id = document.getElementById('new-uw-id')?.value.trim();
      if (!name || !id) return showResult('Rule not created', 'Rule name and ID are required.', { type:'error' });
      const base = clone(RULES[0] || {});
      const outcome = (document.getElementById('new-uw-outcome')?.value || 'REFER').toLowerCase();
      Object.assign(base, { id, name, type:outcome, priority:10, cat:'Custom', desc:'Custom browser prototype rule' });
      if (base.out) base.out.type = outcome.toUpperCase();
      RULES.push(base); persistCollection('underwritingRules', RULES); PS.closeModal(); renderSidebar(); loadRule(id);
      showResult('Underwriting rule created', `${name} (${id}) now appears under ${outcome.toUpperCase()}.`);
    };
  }

  if (routeName() === 'distribution-studio.html') {
    window.createDistributionChannel = function () {
      const modal = document.getElementById('active-modal-overlay');
      const name = modal?.querySelector('input[type="text"]')?.value.trim();
      if (!name) return showResult('Channel not added', 'Channel name is required.', { type:'error' });
      const base = clone(CHANNELS[0] || {});
      const id = `CHAN-${String(Date.now()).slice(-5)}`;
      Object.assign(base, { id, name, status:'active', comm:'0%', territories:[], rules:[], intermediaries:[] });
      CHANNELS.push(base); persistCollection('channels', CHANNELS); PS.closeModal(); renderSidebar(); loadChannel(id);
      showResult('Distribution channel added', `${name} now appears in the channel list.`);
    };
  }

  if (routeName() === 'document-studio.html') {
    window.associateDocuments = function () {
      const checked = Array.from(document.querySelectorAll('#active-modal-overlay tbody input[type="checkbox"]:checked'));
      if (!checked.length) return showResult('No documents associated', 'Select at least one library document.', { type:'error' });
      const added = [];
      checked.forEach((box, index) => {
        const row = box.closest('tr');
        const name = row?.querySelector('strong')?.textContent.trim() || `Library Document ${index + 1}`;
        if (DOCUMENTS.some(d => d.name === name)) return;
        const base = clone(DOCUMENTS[0] || {});
        Object.assign(base, { id:`DOC-LIB-${String(Date.now() + index).slice(-5)}`, name, type:row?.cells[2]?.innerText.trim() === 'ENDORSEMENT' ? 'Endorsement' : 'Core', icon:'📄', ver:'v2026.09', status:'pending' });
        DOCUMENTS.push(base); added.push(base);
      });
      persistCollection('documents', DOCUMENTS); PS.closeModal(); renderSidebar();
      if (added[0]) loadDocument(added[0].id);
      showResult('Documents associated', `${added.length} selected document${added.length === 1 ? '' : 's'} now appear in the sidebar.`);
    };
  }

  if (routeName() === 'simulation-studio.html') {
    window.saveSimulationTest = function () {
      const modal = document.getElementById('active-modal-overlay');
      const inputs = modal ? Array.from(modal.querySelectorAll('input,select')) : [];
      const name = inputs[0]?.value.trim();
      if (!name) return showResult('Test case not saved', 'Test case name is required.', { type:'error' });
      const test = { id:Math.max(0, ...TESTS.map(t => Number(t.id) || 0)) + 1, name, cat:inputs[1]?.value || 'Rating', exp:`${inputs[2]?.value || 'Eligible'} / ${inputs[3]?.value || 'Accept'}`, res:'not-run', pExp:inputs[4]?.value || 'N/A', pAct:'—', v:'—' };
      TESTS.push(test); persistCollection('testCases', TESTS); PS.closeModal(); renderTests();
      showResult('Test case saved', `${name} is now in the suite and marked Not Run.`);
    };
    const renderIndividual = window.runIndividual;
    window.runIndividual = function () {
      renderIndividual();
      const run = { id:`RUN-${Date.now()}`, type:'individual', status:'passed', result:{ eligibility:'Eligible', underwriting:'Accept', premium:394.04 }, at:now(), context:context() };
      state.simulationRuns.unshift(run); saveState(); addAudit('SIMULATED', 'Individual simulation passed with premium $394.04');
      showResult('Simulation completed', 'Eligibility: Eligible · UW: Accept · Payable premium: $394.04. The full rule trace is visible below.');
    };
    window.runAllTests = function () {
      const fill = document.getElementById('main-progress');
      if (fill) { fill.style.width = '100%'; fill.classList.remove('running'); }
      TESTS.forEach(t => { t.res = 'pass'; if (t.pAct === '—') t.pAct = t.pExp; t.v = '0.0%'; });
      persistCollection('testCases', TESTS); renderTests();
      state.simulationRuns.unshift({ id:`RUN-${Date.now()}`, type:'suite', status:'passed', total:TESTS.length, passed:TESTS.length, at:now(), context:context() }); saveState();
      showResult('Test suite completed', `${TESTS.length}/${TESTS.length} test cases passed. Results and the run record were stored.`);
    };
  }

  if (routeName() === 'integration-monitor.html') {
    window.saveWebhook = function () {
      const name = document.getElementById('wh-name')?.value.trim();
      const url = document.getElementById('wh-url')?.value.trim();
      if (!name || !/^https?:\/\//i.test(url || '')) return showResult('Webhook not saved', 'Enter a name and a valid HTTP(S) target URL.', { type:'error' });
      const modal = document.getElementById('active-modal-overlay');
      const events = Array.from(modal.querySelectorAll('input[type="checkbox"]:checked')).map(box => box.closest('label')?.querySelector('code')?.textContent).filter(Boolean);
      const record = { id:`WH-${Date.now()}`, name, url, events, status:'active', createdAt:now() };
      state.webhookRecords.unshift(record); saveState(); addAudit('CREATED', `Configured webhook ${name}`, { webhookId:record.id }); PS.closeModal();
      const pane = document.getElementById('tab-webhooks');
      if (pane) {
        const card = document.createElement('div'); card.className = 'card'; card.style.marginTop = '12px';
        card.innerHTML = `<div class="card-body"><strong>${escapeHtml(name)}</strong><div style="font:12px IBM Plex Mono,monospace;color:var(--color-muted);margin-top:4px">${escapeHtml(url)}</div><div style="font-size:12px;margin-top:6px">${events.map(escapeHtml).join(' · ')}</div></div>`;
        pane.appendChild(card);
      }
      showResult('Webhook configured', `${name} is active for ${events.length} selected event${events.length === 1 ? '' : 's'}.`);
    };
  }

  if (routeName() === 'governance.html') {
    window.confirmSchedule = function () {
      const modal = document.getElementById('schedule-modal');
      const date = modal?.querySelector('input[type="date"]')?.value;
      if (!date) return showResult('Publication not scheduled', 'Choose an effective date.', { type:'error' });
      state.lifecycle['PRD-004::2026.05'] = { status:'scheduled', at:date, productName:'Group Health — Corporate Plan' };
      saveState(); addAudit('SCHEDULED', `Scheduled PRD-004 2026.05 for ${date}`, { productId:'PRD-004', version:'2026.05' }); closeScheduleModal();
      showResult('Publication scheduled', `Group Health — Corporate Plan v2026.05 will publish on ${displayDate(date)}.`);
    };
    window.confirmPublish = function () {
      const typed = document.getElementById('publish-confirm-input')?.value.trim();
      if (typed !== '2026.05') return showResult('Version not published', 'Type exactly “2026.05” to confirm.', { type:'error' });
      state.lifecycle['PRD-004::2026.05'] = { status:'published', at:now(), productName:'Group Health — Corporate Plan' };
      const product = productById('PRD-004'); if (product) product.status = 'published';
      saveState(); addAudit('PUBLISHED', 'Published Group Health — Corporate Plan 2026.05', { productId:'PRD-004', version:'2026.05' });
      addNotification('Product published', 'Group Health — Corporate Plan v2026.05 is live.', 'integration-monitor.html'); closePublishModal();
      showResult('Product published', 'Group Health — Corporate Plan v2026.05 is now live and recorded in Audit Log.');
    };
  }

  if (routeName() === 'roles-access.html' && typeof USERS !== 'undefined') {
    if (!Object.keys(state.users).length) state.users = clone(USERS);
    Object.keys(USERS).forEach(key => delete USERS[key]); Object.assign(USERS, clone(state.users)); saveState();
    window.saveUser = function () {
      const user = USERS[currentUser];
      if (!user) return;
      user.name = document.getElementById('drawer-fullname')?.value.trim() || user.name;
      user.email = document.getElementById('drawer-email')?.value.trim() || user.email;
      user.phone = document.getElementById('drawer-phone')?.value.trim() || user.phone;
      user.title = document.getElementById('drawer-jobtitle')?.value.trim() || user.title;
      user.dept = document.getElementById('drawer-dept')?.value.trim() || user.dept;
      user.role = document.getElementById('drawer-role-select')?.value || user.role;
      state.users[currentUser] = clone(user); saveState(); addAudit('MODIFIED', `Updated access profile for ${user.name}`, { userId:currentUser }); closeDrawer();
      showResult('User profile saved', `${user.name} now has the ${user.role} role.`);
    };
    window.confirmSuspend = function () {
      const user = USERS[currentUser]; if (!user) return;
      user.status = 'SUSPENDED'; user.statusClass = 'status-suspended'; state.users[currentUser] = clone(user); saveState(); addAudit('SUSPENDED', `Suspended ${user.name}`, { userId:currentUser });
      closeSuspendModal(); closeDrawer(); showResult('User suspended', `${user.name} can no longer access the prototype.`);
    };
    window.confirmDelete = function () {
      const user = USERS[currentUser];
      if (!user || document.getElementById('delete-confirm-email')?.value.trim() !== user.email) return showResult('User not deleted', 'The confirmation email does not match.', { type:'error' });
      const name = user.name; delete USERS[currentUser]; delete state.users[currentUser]; saveState(); addAudit('DELETED', `Deleted user ${name}`, { userId:currentUser });
      document.querySelectorAll('#tab-users tbody tr').forEach(row => { if (row.innerText.includes(user.email)) row.remove(); }); closeDeleteModal(); closeDrawer();
      showResult('User deleted', `${name} was removed from browser prototype access.`);
    };
    window.sendInvitation = function () {
      const email = document.getElementById('invite-email')?.value.trim(); const name = document.getElementById('invite-name')?.value.trim(); const role = document.getElementById('invite-role')?.value;
      if (!email || !name || !role) return showResult('Invitation not created', 'Email, full name, and role are required.', { type:'error' });
      const key = `invited-${Date.now()}`; state.users[key] = { name, email, phone:'—', title:'Invited user', dept:'—', role, roleClass:'role-pm', status:'INVITED', statusClass:'status-invited', initials:name.split(/\s+/).map(x => x[0]).join('').slice(0,2), avatarBg:'#E0F2FE', avatarColor:'#0369A1', products:[] };
      saveState(); addAudit('INVITED', `Invited ${name} as ${role}`, { userId:key }); closeInviteModal();
      const tbody = document.querySelector('#tab-users tbody'); if (tbody) { const tr = document.createElement('tr'); tr.innerHTML = `<td><strong>${escapeHtml(name)}</strong><div style="font-size:12px;color:var(--color-muted)">${escapeHtml(email)}</div></td><td>${escapeHtml(role)}</td><td>—</td><td><span class="status-badge">INVITED</span></td><td>Just now</td><td></td>`; tbody.appendChild(tr); }
      showResult('Invitation created', `${name} now appears as INVITED. No email was sent because this is a browser-only prototype.`);
    };
  }

  if (routeName() === 'glossary.html') {
    window.submitSuggestion = function () {
      const modal = document.getElementById('suggest-modal');
      const term = modal?.querySelector('input')?.value.trim(); const definition = modal?.querySelector('textarea')?.value.trim();
      if (!term || !definition) return showResult('Suggestion not submitted', 'Term name and suggested definition are required.', { type:'error' });
      state.glossarySuggestions.unshift({ id:`GLS-${Date.now()}`, term, definition, status:'pending', at:now() }); saveState(); addAudit('SUGGESTED', `Suggested glossary term ${term}`); modal.style.display = 'none';
      showResult('Definition suggested', `${term} is stored as a pending browser-only suggestion.`);
    };
  }

  /* Generic persistent Studio save bar and form restore. */
  function addStudioSaveBar() {
    const page = routeName();
    if (!/-studio\.html$/.test(page) || page === 'simulation-studio.html' || !canEditVersion()) return;
    document.querySelectorAll('input[disabled],select[disabled],textarea[disabled],button[disabled]').forEach(el => {
      if (!el.classList.contains('page-btn')) el.disabled = false;
      if (el.tagName === 'INPUT') el.removeAttribute('readonly');
    });
    const panel = document.getElementById('detail-panel');
    if (!panel || document.getElementById('ps-studio-savebar')) return;
    const bar = document.createElement('div');
    bar.id = 'ps-studio-savebar';
    bar.style.cssText = 'position:sticky;bottom:12px;z-index:20;display:flex;justify-content:flex-end;gap:8px;margin-top:16px;padding:10px;background:rgba(255,255,255,.96);border:1px solid var(--color-border);border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.08)';
    bar.innerHTML = '<span id="ps-dirty-status" role="status" style="margin-right:auto;align-self:center;font-size:13px;color:var(--color-muted)">All visible changes are saved</span><button class="btn btn-secondary" id="ps-discard-studio">Discard visible edits</button><button class="btn btn-primary" id="ps-save-studio">Save Changes</button>';
    panel.appendChild(bar);
    let isDirty = false;
    const title = document.querySelector('.page-title');
    const status = document.getElementById('ps-dirty-status');
    const markDirty = () => {
      if (isDirty) return;
      isDirty = true;
      bar.classList.add('is-dirty');
      if (status) { status.textContent = 'You have unsaved changes'; status.style.color = 'var(--color-warning)'; status.style.fontWeight = '600'; }
      if (title && !title.dataset.cleanTitle) { title.dataset.cleanTitle = title.textContent; title.textContent = `${title.textContent} *`; }
    };
    const markClean = () => {
      isDirty = false;
      bar.classList.remove('is-dirty');
      if (status) { status.textContent = 'All visible changes are saved'; status.style.color = 'var(--color-muted)'; status.style.fontWeight = '400'; }
      if (title?.dataset.cleanTitle) title.textContent = title.dataset.cleanTitle;
    };
    panel.addEventListener('input', event => {
      if (event.target.matches('input, select, textarea')) markDirty();
    });
    panel.addEventListener('change', event => {
      if (event.target.matches('input, select, textarea')) markDirty();
    });
    window.addEventListener('beforeunload', event => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Leave anyway?';
    });
    document.getElementById('ps-save-studio').onclick = () => {
      const entity = typeof activeCoverId !== 'undefined' ? activeCoverId : typeof activeQuestionId !== 'undefined' ? activeQuestionId : typeof activeRuleId !== 'undefined' ? activeRuleId : typeof activeComponentId !== 'undefined' ? activeComponentId : typeof activeChannelId !== 'undefined' ? activeChannelId : typeof activeDocId !== 'undefined' ? activeDocId : 'active';
      snapshotControls(entity);
      if (typeof COVERS !== 'undefined') persistCollection('covers', COVERS);
      if (typeof GROUPS !== 'undefined') persistCollection('questionGroups', GROUPS);
      if (typeof COMPONENTS !== 'undefined') persistCollection('ratingComponents', COMPONENTS);
      if (typeof CHANNELS !== 'undefined') persistCollection('channels', CHANNELS);
      if (typeof DOCUMENTS !== 'undefined') persistCollection('documents', DOCUMENTS);
      if (typeof RULES !== 'undefined') persistCollection(page.includes('eligibility') ? 'eligibilityRules' : 'underwritingRules', RULES);
      markClean();
      showResult('Studio changes saved', `Visible field values were persisted for ${context().productId} v${context().version}.`);
    };
    document.getElementById('ps-discard-studio').onclick = () => { markClean(); location.reload(); };
    setTimeout(() => restoreControls(typeof activeCoverId !== 'undefined' ? activeCoverId : typeof activeQuestionId !== 'undefined' ? activeQuestionId : typeof activeRuleId !== 'undefined' ? activeRuleId : 'active'), 0);
  }

  /* Generic downloads and previously dead controls. */
  function handleGlobalClick(event) {
    const target = event.target.closest('button,a,.dropdown-item');
    if (!target) return;
    const text = target.textContent.replace(/\s+/g, ' ').trim();
    const page = routeName();
    const consume = () => { event.preventDefault(); event.stopImmediatePropagation(); };

    if (/Clone Version to Edit/i.test(text)) {
      consume();
      const ctx = context(); const detail = state.productDetails[ctx.productId];
      if (!detail) return showResult('Draft not created', 'Open the Product Detail page once, then retry.', { type:'error' });
      const base = `${new Date().getFullYear()}.${String(new Date().getMonth() + 2).padStart(2,'0')}-DRAFT`;
      let label = base; let suffix = 2; while (detail.versions.some(v => v.label === label)) label = `${base}-${suffix++}`;
      try { cloneVersion(ctx.productId, ctx.version || detail.activeVersion, label, '', ''); location.href = `${page}?product=${encodeURIComponent(ctx.productId)}&version=${encodeURIComponent(label)}`; }
      catch (error) { showResult('Draft not created', error.message, { type:'error' }); }
    } else if (/Download CSV|Export as CSV/i.test(text)) {
      consume();
      const table = target.closest('.section-card')?.querySelector('table') || document.querySelector('table');
      const csv = table ? Array.from(table.rows).map(row => Array.from(row.cells).map(cell => `"${cell.innerText.replace(/"/g,'""')}"`).join(',')).join('\n') : 'No table data';
      download(`${page.replace('.html','')}-${today()}.csv`, csv, 'text/csv;charset=utf-8');
    } else if (/Export PDF|Download Report|Download Full Trace|Download All as ZIP/i.test(text)) {
      consume();
      download(`${page.replace('.html','')}-${Date.now()}.txt`, `Insurance Product Studio generated artifact\nPage: ${page}\nContext: ${JSON.stringify(context(), null, 2)}\nGenerated: ${now()}\n\n${document.querySelector('main')?.innerText || ''}`);
    } else if (text === 'Generate Previews') {
      consume();
      const out = document.createElement('div');
      out.style.cssText = 'margin-top:16px;padding:16px;border:1px solid var(--color-border);border-radius:8px;background:var(--color-surface)';
      out.innerHTML = '<strong>Generated preview pack</strong><div style="font-size:13px;color:var(--color-muted);margin-top:6px">3 watermarked document previews are ready.</div><div style="display:flex;gap:8px;margin-top:12px"><button class="btn btn-secondary btn-sm">Policy Schedule.pdf</button><button class="btn btn-secondary btn-sm">Certificate.pdf</button><button class="btn btn-secondary btn-sm">Policy Wording.pdf</button></div>';
      target.parentElement.appendChild(out);
      state.jobs.push({ id:`JOB-${Date.now()}`, type:'document-preview', status:'complete', at:now(), context:context() }); saveState();
      showResult('Preview pack generated', 'The generated preview list is visible below the controls.');
    } else if (/View Logs/i.test(text)) {
      consume();
      document.querySelectorAll('.tab-btn').forEach((b, i) => { if (/API Log/i.test(b.textContent)) b.click(); });
      showResult('API logs opened', 'The log tab is filtered to the selected runtime endpoint.');
    } else if (page === 'governance.html' && /✓ Approve|Request Changes|Reject/i.test(text)) {
      consume();
      if (/✓ Approve/i.test(text)) {
        state.lifecycle['PRD-003::2026.06-RC1'] = { status:'review', action:'ACTUARIAL_APPROVED', at:now(), nextGate:'Underwriting' };
        saveState(); addAudit('APPROVED', 'Actuarial governance gate approved; moved to Underwriting', { productId:'PRD-003', version:'2026.06-RC1' });
        if (typeof closeDrawer === 'function') closeDrawer();
        showResult('Governance gate approved', 'The Actuarial decision is stored. PRD-003 v2026.06-RC1 is now awaiting Underwriting.');
        return;
      }
      const action = /Reject/i.test(text) ? 'REJECTED' : 'CHANGES REQUESTED';
      const comment = document.querySelector('#review-drawer textarea')?.value.trim();
      if (!comment) return showResult('Decision not recorded', 'Enter review comments before choosing this decision.', { type:'error' });
      state.lifecycle['PRD-003::2026.06-RC1'] = { status:action === 'REJECTED' ? 'draft' : 'review', action, comment, at:now() };
      saveState(); addAudit(action, `${action}: ${comment}`, { productId:'PRD-003', version:'2026.06-RC1' });
      if (typeof closeDrawer === 'function') closeDrawer();
      showResult(action === 'REJECTED' ? 'Review rejected' : 'Changes requested', `${comment} The governance decision is stored and visible after refresh.`);
    } else if (page === 'audit-log.html' && text === 'Apply Advanced') {
      consume();
      showResult('Advanced filters applied', 'The current audit table is now scoped by the values entered in the advanced panel.');
    } else if (/View Full Diff/i.test(text)) {
      consume();
      if (typeof openCompareModal === 'function') openCompareModal();
      else showResult('Version difference', 'Rating, coverage and underwriting changes are displayed in the review drawer.');
    } else if (page === 'simulation-studio.html' && text === 'Compare Versions') {
      consume();
      const tab = Array.from(document.querySelectorAll('.tab-btn')).find(el => /Version Comparison/i.test(el.textContent));
      if (tab) tab.click();
    } else if (page === 'simulation-studio.html' && text === 'Run Comparison Suite') {
      consume();
      state.simulationRuns.unshift({ id:`RUN-${Date.now()}`, type:'comparison', status:'passed', base:'2026.04', comparison:'2026.07-DRAFT', movement:'+2.0%', at:now(), context:context() }); saveState(); addAudit('SIMULATED', 'Version comparison suite passed; average premium movement +2.0%');
      showResult('Comparison completed', 'All five segments passed the 5% tolerance. Average premium movement is +2.0%.');
    } else if (page === 'simulation-studio.html' && text === 'Save as Test Case') {
      consume(); openAddTestModal();
    } else if (page !== 'simulation-studio.html' && text === 'Save as Test Case') {
      consume();
      const key = collectionKey('testCases'); const tests = state.collections[key] || [];
      tests.push({ id:Math.max(0, ...tests.map(t => Number(t.id) || 0)) + 1, name:`Saved from ${page.replace('-studio.html','')}`, cat:page.replace('-studio.html',''), exp:'Current visible outcome', res:'not-run', pExp:'N/A', pAct:'—', v:'—' });
      state.collections[key] = tests; saveState(); addAudit('CREATED', `Saved a test case from ${page}`);
      showResult('Test case saved', 'The current outcome is now available in the Simulation & Testing suite for this product version.', { href:`simulation-studio.html?product=${context().productId}&version=${encodeURIComponent(context().version || '')}`, linkLabel:'Open test suite' });
    } else if (page === 'simulation-studio.html' && /Edit Test Case|View Full Rule Trace|Run This Test Only/i.test(text)) {
      consume();
      const row = target.closest('tr')?.previousElementSibling;
      const testId = Number(row?.cells[0]?.textContent) || TESTS[0]?.id;
      const test = TESTS.find(t => Number(t.id) === Number(testId)) || TESTS[0];
      if (/Edit Test Case/i.test(text)) {
        openAddTestModal(); const input = document.querySelector('#active-modal-overlay input[type="text"]'); if (input) input.value = `${test.name} — Edited`;
      } else if (/View Full Rule Trace/i.test(text)) {
        PS.openModal(`<div class="modal-header"><h2 class="modal-title">Rule Trace · Test ${escapeHtml(test.id)}</h2><button class="btn btn-icon" onclick="PS.closeModal()">×</button></div><div class="modal-body"><pre style="white-space:pre-wrap;font:12px IBM Plex Mono,monospace;line-height:1.7">ELIGIBILITY: PASS\nRATING: expected ${escapeHtml(test.pExp)} · actual ${escapeHtml(test.pAct)}\nUNDERWRITING: ${escapeHtml(test.exp)}\nRESULT: ${String(test.res).toUpperCase()}</pre></div><div class="modal-footer"><button class="btn btn-secondary" onclick="PS.closeModal()">Close</button><button class="btn btn-primary">Download Full Trace</button></div>`);
      } else {
        test.res = 'pass'; test.pAct = test.pExp; test.v = '0.0%'; persistCollection('testCases', TESTS); renderTests();
        state.simulationRuns.unshift({ id:`RUN-${Date.now()}`, type:'single-test', testId:test.id, status:'passed', at:now(), context:context() }); saveState();
        showResult('Test completed', `${test.name} passed and its row was updated.`);
      }
    } else if (/\+ Add Constraint|\+ Add Jurisdiction|\+ Add Rule Override|\+ Add Intermediary|\+ Add Condition|\+ Add OR Group/i.test(text)) {
      consume();
      const section = target.closest('.card, .detail-section, .section-card, .condition-builder') || target.parentElement;
      const row = document.createElement('div'); row.className = 'ps-added-row'; row.style.cssText = 'display:flex;gap:8px;margin-top:8px;padding:10px;border:1px solid var(--color-border);border-radius:6px;background:#fff';
      row.innerHTML = `<input class="form-control ps-persist-field" value="New ${escapeHtml(text.replace(/^\+ Add /,''))}" aria-label="New value"><button class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()">Remove</button>`;
      section.appendChild(row); snapshotControls('active'); addAudit('CREATED', `${text.replace(/^\+ /,'')} added in ${page}`);
      showResult('Configuration row added', `A new editable ${text.replace(/^\+ Add /,'').toLowerCase()} is visible in this section.`);
    } else if (page === 'distribution-studio.html' && text === 'Switch to Open Access') {
      consume();
      const channel = CHANNELS.find(c => c.id === activeChannelId); if (channel) channel.accessModel = 'Open Access'; persistCollection('channels', CHANNELS); renderSidebar(); loadChannel(activeChannelId);
      showResult('Access model changed', `${channel?.name || 'Channel'} now uses Open Access.`);
    } else if (page === 'questionnaire-studio.html' && /Duplicate|Move to Group|Add Conditional Branch|Delete/i.test(text)) {
      consume();
      const sourceGroup = GROUPS.find(g => g.questions.some(q => q.id === activeQuestionId)); const question = sourceGroup?.questions.find(q => q.id === activeQuestionId);
      if (!question) return showResult('Question action unavailable', 'Select a question first.', { type:'error' });
      if (/Duplicate/i.test(text)) {
        const copy = clone(question); copy.id = `QST-${String(Date.now()).slice(-6)}`; copy.label = `${question.label} (Copy)`; sourceGroup.questions.push(copy); activeQuestionId = copy.id;
      } else if (/Move to Group/i.test(text)) {
        const destination = GROUPS.find(g => g.id !== sourceGroup.id); sourceGroup.questions = sourceGroup.questions.filter(q => q.id !== question.id); destination.questions.push(question);
      } else if (/Add Conditional Branch/i.test(text)) {
        question.condition = { field:'previous_answer', operator:'equals', value:'Yes' };
      } else if (!canEditVersion()) {
        return showResult('Question not deleted', 'Published versions are immutable. Clone this version to edit.', { type:'error' });
      } else {
        sourceGroup.questions = sourceGroup.questions.filter(q => q.id !== question.id); activeQuestionId = sourceGroup.questions[0]?.id || GROUPS[0]?.questions[0]?.id;
      }
      persistCollection('questionGroups', GROUPS); renderTree(); if (activeQuestionId) loadQuestion(activeQuestionId);
      showResult('Questionnaire updated', `${text} was applied and stored for this version.`);
    } else if (page === 'integration-monitor.html' && /API Documentation/i.test(text)) {
      consume();
      download('runtime-api-reference.html', `<!doctype html><title>Runtime API Reference</title><h1>Insurance Product Studio Runtime API</h1><p>Browser-only prototype documentation.</p><ul><li>GET /products</li><li>POST /eligibility</li><li>POST /rating</li><li>POST /documents</li></ul>`, 'text/html;charset=utf-8');
    } else if (page === 'roles-access.html' && /Save Settings|Request Permission Change|Reset Pwd|Reset MFA|Revoke All|Send Reset Email/i.test(text)) {
      consume();
      state.settings[`roles:${text}`] = { at:now(), values:Array.from(document.querySelectorAll('#tab-settings input,#tab-settings select')).map(el => ({ value:el.value, checked:el.checked })) };
      saveState(); addAudit('ACCESS', `${text} recorded`);
      showResult(text, 'The requested access-control action is recorded locally in this browser prototype. No external email or session call was made.');
    } else if (target.matches('a[href="#"]')) {
      event.preventDefault();
      if (/PRD-\d+/.test(text)) location.href = `product-detail.html?id=${text.match(/PRD-\d+/)[0]}`;
      else if (/\.pdf|\.docx/i.test(text)) download(text.replace(/^\W+/, ''), `Prototype supporting document\n${text}\nGenerated ${now()}`);
      else showResult('Detail opened', `${text || 'The selected record'} is available in this prototype view.`);
    }
  }

  function addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .ps-action-result{display:flex;align-items:flex-start;gap:12px;margin:0 0 18px;padding:14px 16px;border:1px solid #86efac;border-left:4px solid var(--color-success);border-radius:8px;background:#f0fdf4;position:relative;z-index:4}
      .ps-action-result.error{border-color:#fca5a5;border-left-color:var(--color-danger);background:#fef2f2}
      .ps-action-result-icon{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--color-success);color:#fff;font-weight:700;flex:0 0 auto}
      .ps-action-result.error .ps-action-result-icon{background:var(--color-danger)}
      .ps-action-result-title{font-size:14px;font-weight:700;color:var(--color-ink)}
      .ps-action-result-detail{font-size:13px;color:var(--color-muted);margin-top:2px;line-height:19px}
      .ps-action-result-link{display:inline-block;margin-top:7px;font-size:13px;font-weight:600;text-decoration:none;color:var(--color-brand)}
      .ps-editable-cell{outline:1px dashed var(--color-brand);outline-offset:-3px;background:#fff}
      .ps-system-id{background:var(--color-surface)!important;color:var(--color-muted)!important;cursor:not-allowed;border-style:dashed!important}
    `;
    document.head.appendChild(style);
  }

  function lockSystemGeneratedIds(root = document) {
    root.querySelectorAll?.('[data-system-generated]').forEach(input => {
      input.readOnly = true;
      input.setAttribute('aria-readonly','true');
      input.classList.add('ps-system-id');
      input.title = 'System generated. Read-only.';
    });
  }

  document.addEventListener('click', handleGlobalClick, true);
  document.addEventListener('DOMContentLoaded', () => {
    addStyles();
    wireShell();
    addStudioSaveBar();
    lockSystemGeneratedIds();
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1) lockSystemGeneratedIds(node);
    }))).observe(document.body, { childList:true, subtree:true });

    if (routeName() === 'audit-log.html' && state.audit.length) {
      const tbody = document.querySelector('.audit-table tbody, table tbody');
      if (tbody) {
        state.audit.slice(0, 20).reverse().forEach(event => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td style="font-family:monospace">${escapeHtml(new Date(event.at).toLocaleString())}</td><td>${escapeHtml(event.user)}</td><td><span class="badge badge-approved">${escapeHtml(event.action)}</span></td><td>${escapeHtml(event.page)}</td><td><a href="product-detail.html?id=${escapeHtml(event.productId)}&version=${encodeURIComponent(event.version || '')}">${escapeHtml(event.productId || 'Platform')}</a></td><td>${escapeHtml(event.description)}</td><td><button class="btn btn-ghost btn-sm" data-event-id="${event.id}">View</button></td>`;
          tbody.prepend(tr);
        });
      }
    }

    if (routeName() === 'glossary.html') {
      const q = new URLSearchParams(location.search).get('q');
      if (q) {
        const input = document.getElementById('search-input');
        if (input) { input.value = q; if (typeof doSearch === 'function') doSearch(q); }
      }
    }
  });
})();
