/* Rating Studio — guided, browser-only pricing experience for non-technical users. */
(function () {
  'use strict';

  const STORE_KEY = 'insurance-product-studio-rating-gui-v1';
  const STEPS = [
    { id:'start', name:'Starting price', desc:'Assigned automatically' },
    { id:'risk', name:'Risk adjustments', desc:'Customer and risk details' },
    { id:'discounts', name:'Discounts', desc:'Rewards and savings' },
    { id:'fees', name:'Fees & taxes', desc:'Managed charges' },
    { id:'review', name:'Review', desc:'Check the complete journey' }
  ];
  const TEMPLATES = (window.PS?.centralPricing?.getState?.().templates || [
    { id:'motor-comprehensive', family:'Motor', match:'Comprehensive', name:'Private car · Comprehensive', base:350, unit:'per year', source:'Motor pricing library', evidence:'Based on 42 comparable products', updated:'18 Aug 2026', fit:'Best match' },
    { id:'motor-liability', family:'Motor', match:'Third Party', name:'Private car · Third party', base:185, unit:'per year', source:'Motor pricing library', evidence:'Based on 31 comparable products', updated:'18 Aug 2026', fit:'Best match' },
    { id:'property-sme', family:'Property', name:'Small business property', base:740, unit:'per year', source:'Commercial pricing library', evidence:'Based on 27 comparable products', updated:'11 Aug 2026', fit:'Best match' },
    { id:'trucking-fleet', family:'Trucking', name:'Commercial trucking fleet', base:2200, unit:'per vehicle / year', source:'Transportation pricing library', evidence:'Fleet physical damage and liability benchmark', updated:'28 Aug 2026', fit:'Best match' },
    { id:'cyber-sme', family:'Cyber', name:'SME cyber protection', base:1100, unit:'per year', source:'Cyber pricing library', evidence:'Network, privacy, response, and interruption benchmark', updated:'28 Aug 2026', fit:'Best match' },
    { id:'workers-comp', family:'Workers Compensation', name:'Workers compensation standard', base:1.8, unit:'per $100 payroll', source:'Casualty pricing library', evidence:'Industry and payroll-based statutory benefit benchmark', updated:'28 Aug 2026', fit:'Best match' },
    { id:'health-group', family:'Health', name:'Group health · Corporate', base:165, unit:'per member / month', source:'Health pricing library', evidence:'Based on 19 comparable schemes', updated:'20 Aug 2026', fit:'Best match' },
    { id:'marine-cargo', family:'Marine', name:'Marine cargo · Open cover', base:520, unit:'per shipment', source:'Marine pricing library', evidence:'Based on 16 comparable products', updated:'07 Aug 2026', fit:'Best match' },
    { id:'travel-annual', family:'Travel', name:'Worldwide annual travel', base:145, unit:'per traveller / year', source:'Travel pricing library', evidence:'Based on 36 comparable products', updated:'15 Aug 2026', fit:'Best match' },
    { id:'general', family:'General', name:'General insurance starter', base:300, unit:'per year', source:'Central pricing library', evidence:'Conservative portfolio benchmark', updated:'18 Aug 2026', fit:'Available' }
  ]).filter(item => (!item.status || item.status === "active"));
  const FIELD_OPTIONS = {
    driverAge:{ label:'Driver age', type:'number', placeholder:'e.g. 25' },
    vehicleAge:{ label:'Vehicle age', type:'number', placeholder:'e.g. 5' },
    location:{ label:'Where the vehicle is kept', type:'select', values:[['metro','Large city'],['town','Town or small city'],['rural','Rural area']] },
    use:{ label:'How the vehicle is used', type:'select', values:[['personal','Personal trips only'],['commute','Personal trips and commuting'],['business','Business use']] },
    claims:{ label:'Claims in the last 3 years', type:'number', placeholder:'e.g. 1' },
    claimFreeYears:{ label:'Claim-free years', type:'number', placeholder:'e.g. 3' },
    vehicleValue:{ label:'Vehicle value', type:'number', placeholder:'e.g. 25000' },
    convictions:{ label:'Driving convictions', type:'select', values:[['yes','Yes'],['no','No']] }
  };
  const SCENARIOS = {
    standard:{ driverAge:38, vehicleAge:4, location:'town', use:'personal', claims:0, claimFreeYears:4, vehicleValue:22000, convictions:'no', loyalty:'yes', multi:'no' },
    young:{ driverAge:22, vehicleAge:2, location:'metro', use:'commute', claims:0, claimFreeYears:1, vehicleValue:18000, convictions:'no', loyalty:'no', multi:'no' },
    highvalue:{ driverAge:46, vehicleAge:1, location:'metro', use:'personal', claims:0, claimFreeYears:5, vehicleValue:52000, convictions:'no', loyalty:'yes', multi:'yes' },
    claims:{ driverAge:41, vehicleAge:6, location:'town', use:'commute', claims:2, claimFreeYears:0, vehicleValue:16000, convictions:'yes', loyalty:'no', multi:'no' }
  };

  let root;
  let activeStep = 'start';
  let pageResult = null;
  let lastEstimate = null;
  let context;
  let product;
  let record;

  const esc = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const money = value => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:2 }).format(Number(value) || 0);
  const round = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const clone = value => JSON.parse(JSON.stringify(value));

  function getContext() {
    const query = new URLSearchParams(location.search);
    const id = query.get('product') || query.get('id') || 'PRD-001';
    const known = window.PS?.prototypeApp?.productById(id) || window.PS?.data?.products?.find(item => item.id === id);
    return { productId:id, version:query.get('version') || known?.version || '2026.04' };
  }

  function findProduct() {
    return window.PS?.prototypeApp?.productById(context.productId)
      || window.PS?.data?.products?.find(item => item.id === context.productId)
      || { id:context.productId, name:'Insurance product', family:'General', version:context.version, status:'draft' };
  }

  function automaticTemplate() {
    const family = String(product.family || 'General').toLowerCase();
    const name = String(product.name || '').toLowerCase();
    const matches = TEMPLATES.filter(template => (!template.status || template.status === "active") && template.family.toLowerCase() === family);
    return matches.find(template => !template.match || name.includes(template.match.toLowerCase())) || matches[0] || TEMPLATES.at(-1);
  }

  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (_) { return {}; }
  }

  function defaultRecord() {
    const template = automaticTemplate();
    return {
      templateId:template.id,
      lastSaved:new Date().toISOString(),
      bands:{
        driver:[{ label:'Under 25', action:'increase', value:25 },{ label:'25 to 69', action:'same', value:0 },{ label:'70 and over', action:'increase', value:15 }],
        vehicle:[{ label:'Up to 3 years old', action:'reduce', value:5 },{ label:'4 to 8 years old', action:'same', value:0 },{ label:'9 years or older', action:'increase', value:12 }],
        location:[{ label:'Large city', action:'increase', value:10 },{ label:'Town or small city', action:'same', value:0 },{ label:'Rural area', action:'reduce', value:5 }],
        use:[{ label:'Personal trips only', action:'same', value:0 },{ label:'Personal trips and commuting', action:'increase', value:5 },{ label:'Business use', action:'increase', value:15 }]
      },
      discounts:{ claimFree:{ enabled:true, name:'Claim-free reward', summary:'More claim-free years earn a larger saving.' }, loyalty:{ enabled:true, name:'Renewing customer', summary:'Existing customers receive a 5% saving.' }, multi:{ enabled:true, name:'More than one policy', summary:'Customers with another policy receive an 8% saving.' } },
      charges:{ admin:{ enabled:true, name:'Policy administration', kind:'fixed', value:18, managed:true }, stamp:{ enabled:true, name:'Stamp duty', kind:'fixed', value:6, managed:true }, tax:{ enabled:true, name:'Insurance tax', kind:'percent', value:18, managed:true } },
      customRules:[]
    };
  }

  function loadRecord() {
    const store = loadStore();
    const key = `${context.productId}::${context.version}`;
    const loaded = Object.assign(defaultRecord(), store[key] || {});
    const central = window.PS?.centralPricing?.getState?.();
    if (central) {
      const discountIds = { claimFree:'discount-claim-free', loyalty:'discount-loyalty', multi:'discount-multi' };
      Object.entries(discountIds).forEach(([localKey, centralId]) => {
        const source = central.discounts.find(item => item.id === centralId && item.status === 'active');
        if (source && loaded.discounts[localKey]) Object.assign(loaded.discounts[localKey], { name:source.name, enabled:(source.linkedProductIds || []).includes(context.productId) });
      });
      ['admin','stamp','tax'].forEach(localKey => {
        const source = central.charges.find(item => item.key === localKey && item.status === 'active');
        if (source && loaded.charges[localKey]) Object.assign(loaded.charges[localKey], { name:source.name, kind:source.kind, value:source.value, managed:true, centralId:source.id });
      });
    }
    return loaded;
  }

  function centralDiscount(id) {
    return window.PS?.centralPricing?.getState?.().discounts.find(item => item.id === id && item.status === 'active' && (item.linkedProductIds || []).includes(context.productId)) || null;
  }

  function linkCentralTemplate(templateId) {
    if (!window.PS?.centralPricing) return;
    const central = window.PS.centralPricing.getState();
    central.templates.forEach(item => { item.linkedProductIds = (item.linkedProductIds || []).filter(id => id !== context.productId); });
    const selected = central.templates.find(item => item.id === templateId);
    if (selected && !selected.linkedProductIds.includes(context.productId)) selected.linkedProductIds.push(context.productId);
    window.PS.centralPricing.addHistory(central, { action:'Linked', record:selected?.name || templateId, before:context.productId, after:`${context.productId} uses this template` });
    window.PS.centralPricing.replace(central, { type:'template-link', id:templateId });
  }

  function saveRecord(message) {
    record.lastSaved = new Date().toISOString();
    const store = loadStore();
    store[`${context.productId}::${context.version}`] = record;
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    window.PS?.prototypeApp?.addAudit('MODIFIED', message || 'Updated guided pricing setup', { productId:context.productId, version:context.version });
  }

  function template() { return TEMPLATES.find(item => item.id === record.templateId) || automaticTemplate(); }
  function canEdit() { return window.PS?.prototypeApp ? window.PS.prototypeApp.canEditVersion() : /draft/i.test(context.version || product.status || ''); }
  function statusLabel() { return canEdit() ? 'Ready to edit' : 'Published · View only'; }
  function enabledRuleCount() { return 4 + Object.values(record.discounts).filter(item => item.enabled).length + record.customRules.filter(item => item.enabled !== false).length; }

  function resultHtml() {
    if (!pageResult) return '<div id="rating-page-result"></div>';
    return `<div id="rating-page-result" class="rating-inline-result ${pageResult.type === 'error' ? 'error' : ''}" role="status"><div>${pageResult.type === 'error' ? '!' : '✓'}</div><div><strong>${esc(pageResult.title)}</strong><span>${esc(pageResult.detail)}</span></div><button class="btn btn-icon" data-rating-action="dismiss-result" aria-label="Dismiss">×</button></div>`;
  }

  function setResult(title, detail, type = 'success') {
    pageResult = { title, detail, type };
    render();
    document.getElementById('rating-page-result')?.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function render() {
    const selected = template();
    const edit = canEdit();
    const estimate = estimatePrice(SCENARIOS.standard);
    root.innerHTML = `<div class="rating-page">
      <div class="page-header">
        <div class="page-header-left">
          <div class="rating-eyebrow">${esc(product.id)} · ${esc(context.version)} · ${esc(product.family || 'Insurance')}</div>
          <h1 class="page-title">Rating & Pricing Studio</h1>
          <p class="page-subtitle">Build customer pricing with guided choices. No technical setup required.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-ghost" data-rating-action="explain">How pricing works</button>
          <button class="btn btn-secondary" data-rating-action="preview">Preview a price</button>
          ${edit ? '<button class="btn btn-primary" data-rating-action="add-rule">＋ Add pricing rule</button>' : `<a class="btn btn-primary" href="product-detail.html?id=${encodeURIComponent(context.productId)}&version=${encodeURIComponent(context.version)}#versions">Create editable copy</a>`}
        </div>
      </div>
      ${resultHtml()}
      <section class="rating-autosetup">
        <div class="rating-autosetup-icon">✓</div>
        <div><div class="rating-autosetup-title">Pricing setup applied automatically</div><div class="rating-autosetup-copy">We matched <strong>${esc(product.name)}</strong> to the centrally managed <strong>${esc(selected.name)}</strong> template. Its starting price stays current without product-by-product entry.</div></div>
        ${edit ? '<button class="btn btn-secondary btn-sm" data-rating-action="change-template">Change template</button>' : '<span class="managed-badge">🔒 Centrally managed</span>'}
      </section>
      <div class="rating-summary-grid">
        ${summaryCard('Starting price', money(selected.base), `${selected.unit} · automatic`)}
        ${summaryCard('Pricing rules', enabledRuleCount(), 'Active customer-facing decisions')}
        ${summaryCard('Example price', money(estimate.total), 'Standard customer scenario')}
        ${summaryCard('Status', statusLabel(), edit ? `Saved ${timeSaved(record.lastSaved)}` : 'Preview and download available')}
      </div>
      <div class="rating-workspace">
        <aside class="rating-steps">
          <div class="rating-steps-head"><div class="rating-steps-title">Price-building journey</div><div class="rating-steps-subtitle">Select a step to view or change it</div></div>
          ${STEPS.map((step, index) => `<button class="rating-step ${step.id === activeStep ? 'active' : ''}" data-rating-action="step" data-step="${step.id}"><span class="rating-step-number">${index + 1}</span><span class="rating-step-copy"><span class="rating-step-name">${step.name}</span><span class="rating-step-desc">${step.desc}</span></span><span class="rating-step-status">✓</span></button>`).join('')}
        </aside>
        <section class="rating-panel">${renderPanel(edit)}</section>
      </div>
    </div>`;
  }

  function summaryCard(label, value, detail) {
    return `<div class="rating-summary-card"><div class="rating-summary-label">${esc(label)}</div><div class="rating-summary-value">${esc(value)}</div><div class="rating-summary-detail">${esc(detail)}</div></div>`;
  }

  function panelShell(title, copy, action, body) {
    return `<section class="rating-panel-card"><div class="rating-panel-head"><div><div class="rating-panel-title">${esc(title)}</div><div class="rating-panel-copy">${esc(copy)}</div></div>${action || ''}</div><div class="rating-panel-body">${body}</div></section>`;
  }

  function renderPanel(edit) {
    if (activeStep === 'start') return renderStart(edit);
    if (activeStep === 'risk') return renderRisk(edit);
    if (activeStep === 'discounts') return renderDiscounts(edit);
    if (activeStep === 'fees') return renderFees(edit);
    return renderReview(edit);
  }

  function renderStart(edit) {
    const item = template();
    const source = `<div class="pricing-source"><div class="pricing-source-main"><div class="pricing-source-kicker">Starting price</div><div class="pricing-source-price"><strong>${money(item.base)}</strong><span>${esc(item.unit)}</span></div><div class="pricing-source-name">${esc(item.name)}</div><div class="pricing-source-desc">This amount is supplied by the central pricing team and updated once for every linked product.</div><span class="managed-badge">🔒 Managed centrally · no manual entry</span></div><div class="pricing-source-side"><div class="plain-list"><div class="plain-list-row"><span>Source</span><strong>${esc(item.source)}</strong></div><div class="plain-list-row"><span>Evidence</span><strong>${esc(item.evidence)}</strong></div><div class="plain-list-row"><span>Last reviewed</span><strong>${esc(item.updated || item.reviewed || "Not set")}</strong></div><div class="plain-list-row"><span>Product match</span><strong>${esc(item.fit || "Approved central template")}</strong></div></div></div></div>`;
    const flow = `<div class="pricing-flow">${[
      ['①','Starting price','Selected from the portfolio library'],['②','Risk details','Customer details may increase or reduce it'],['③','Savings','Eligible discounts are applied'],['④','Charges','Required fees and taxes are included'],['⑤','Customer price','A clear annual and monthly price is shown']
    ].map(item => `<div class="pricing-flow-card"><div class="pricing-flow-icon">${item[0]}</div><div class="pricing-flow-name">${item[1]}</div><div class="pricing-flow-desc">${item[2]}</div></div>`).join('')}</div>`;
    const action = `<div style="display:flex;gap:8px"><a class="btn btn-ghost btn-sm" href="pricing-library.html">Open central library</a>${edit ? '<button class="btn btn-secondary btn-sm" data-rating-action="change-template">Choose another template</button>' : ''}</div>`;
    return panelShell('1. Starting price', 'The product is connected to one approved portfolio template. You choose the right template; the central pricing team maintains its price.', action, source + flow);
  }

  function impactText(item) {
    if (item.action === 'same' || Number(item.value) === 0) return '<span class="impact-pill impact-same">No change</span>';
    return `<span class="impact-pill ${item.action === 'reduce' ? 'impact-down' : 'impact-up'}">${item.action === 'reduce' ? 'Reduce' : 'Increase'} ${esc(item.value)}%</span>`;
  }

  function ruleCard(id, icon, name, summary, bands, edit) {
    return `<article class="rule-card"><div class="rule-card-top"><div class="rule-icon">${icon}</div><div><div class="rule-card-name">${esc(name)}</div><div class="rule-card-summary">${esc(summary)}</div></div>${edit ? `<button class="btn btn-ghost btn-sm rule-card-action" data-rating-action="edit-bands" data-band="${id}">Edit choices</button>` : ''}</div><div class="impact-list">${bands.map(item => `<div class="impact-row"><span>${esc(item.label)}</span>${impactText(item)}</div>`).join('')}</div></article>`;
  }

  function renderRisk(edit) {
    const custom = record.customRules.length ? `<div style="margin-top:18px"><div style="font-size:14px;font-weight:700;margin-bottom:9px">Additional business rules</div>${record.customRules.map(rule => customRuleHtml(rule, edit)).join('')}</div>` : '';
    const cards = `<div class="rule-grid">${ruleCard('driver','👤','Driver age','Use familiar age groups and select their price effect.',record.bands.driver,edit)}${ruleCard('vehicle','🚗','Vehicle age','Older vehicles can carry a different level of risk.',record.bands.vehicle,edit)}${ruleCard('location','📍','Where the vehicle is kept','Use simple location categories rather than codes.',record.bands.location,edit)}${ruleCard('use','🧭','How the vehicle is used','Separate personal, commuting, and business use.',record.bands.use,edit)}</div>${custom}`;
    const action = edit ? '<button class="btn btn-primary btn-sm" data-rating-action="add-rule">＋ Add pricing rule</button>' : '';
    return panelShell('2. Risk adjustments', 'Each card says exactly who it applies to and what happens to their price. Select Edit choices to change the bands through guided controls.', action, cards);
  }

  function customRuleHtml(rule, edit) {
    const field = FIELD_OPTIONS[rule.field]?.label || rule.field;
    const operator = operatorLabel(rule.operator);
    const value = displayRuleValue(rule.field, rule.value);
    const effect = rule.action === 'reduce' ? `Reduce price by ${rule.amount}${rule.unit === 'percent' ? '%' : ''}` : rule.action === 'fixed' ? `Add ${money(rule.amount)}` : `Increase price by ${rule.amount}%`;
    return `<div class="plain-rule"><span class="rule-icon">✨</span><div class="plain-rule-when"><strong>${esc(rule.name)}</strong><br>When ${esc(field.toLowerCase())} ${esc(operator)} ${esc(value)}</div><div class="plain-rule-then">${esc(effect)}</div>${edit ? `<div class="plain-rule-controls"><button class="btn btn-ghost btn-sm" data-rating-action="toggle-rule" data-rule="${esc(rule.id)}">${rule.enabled === false ? 'Resume' : 'Pause'}</button><button class="btn btn-ghost btn-sm" data-rating-action="edit-rule" data-rule="${esc(rule.id)}">Edit</button><button class="btn btn-icon btn-sm" data-rating-action="delete-rule" data-rule="${esc(rule.id)}" aria-label="Delete ${esc(rule.name)}">×</button></div>` : ''}</div>`;
  }

  function renderDiscounts(edit) {
    const claimFree = centralDiscount('discount-claim-free') || { displayValue:'3% / 7% / 12%', eligibility:'1, 3, and 5 completed claim-free years' };
    const loyalty = centralDiscount('discount-loyalty') || { displayValue:'5%', eligibility:'Customer is renewing an active policy' };
    const multi = centralDiscount('discount-multi') || { displayValue:'8%', eligibility:'Customer holds another active policy' };
    const data = [
      ['claimFree','🛡️',claimFree.displayValue,claimFree.eligibility],
      ['loyalty','🤝',loyalty.displayValue,loyalty.eligibility],
      ['multi','⊕',multi.displayValue,multi.eligibility]
    ];
    const html = data.map(([id,icon,value,detail]) => { const item = record.discounts[id]; return `<div class="plain-rule"><span class="rule-icon">${icon}</span><div class="plain-rule-when"><strong>${esc(item.name)}</strong><br>${esc(detail)}</div><div class="plain-rule-then">${item.enabled ? `Reduce ${value}` : 'Not used'}</div>${edit ? `<button class="btn ${item.enabled ? 'btn-secondary' : 'btn-primary'} btn-sm" data-rating-action="toggle-discount" data-discount="${id}">${item.enabled ? 'Turn off' : 'Turn on'}</button>` : ''}</div>`; }).join('');
    return panelShell('3. Discounts', 'Turn approved customer savings on or off. Amounts come from the Central Pricing Library and cannot be changed on this product.', '<a class="btn btn-ghost btn-sm" href="pricing-library.html">Open central library</a>', html);
  }

  function renderFees(edit) {
    const html = Object.entries(record.charges).map(([id,item]) => `<div class="plain-rule"><span class="rule-icon">${id === 'tax' ? '🏛️' : '🧾'}</span><div class="plain-rule-when"><strong>${esc(item.name)}</strong><br>${item.managed ? 'Maintained by the central finance and compliance teams' : 'Maintained for this product'}</div><div class="plain-rule-then">${item.enabled ? (item.kind === 'percent' ? `${item.value}%` : money(item.value)) : 'Not used'}</div><span class="managed-badge">🔒 Centrally managed</span></div>`).join('');
    return panelShell('4. Fees & taxes', 'Required charges are brought in automatically from the approved jurisdiction setup. Product users can review them but do not need to maintain them.', '<a class="btn btn-ghost btn-sm" href="pricing-library.html">Open central library</a>', html);
  }

  function renderReview(edit) {
    const item = template();
    const checks = [
      ['Starting price connected', `${item.name} supplies ${money(item.base)} ${item.unit}.`],
      ['Risk choices are complete', 'Driver, vehicle, location, and use choices all have a clear outcome.'],
      ['Customer savings are clear', `${Object.values(record.discounts).filter(value => value.enabled).length} approved discounts are active.`],
      ['Required charges included', 'Administration, stamp duty, and tax appear in the customer price.'],
      ['Customer preview available', 'Run a realistic scenario before sending this version for review.']
    ];
    const list = checks.map(item => `<div class="review-check"><div class="review-check-icon">✓</div><div><div class="review-check-title">${item[0]}</div><div class="review-check-copy">${item[1]}</div></div></div>`).join('');
    const actions = `<div style="display:flex;gap:9px;margin-top:18px"><button class="btn btn-primary" data-rating-action="preview">Preview a customer price</button><button class="btn btn-secondary" data-rating-action="download-summary">Download pricing summary</button>${edit ? '<button class="btn btn-secondary" data-rating-action="save">Save changes</button>' : ''}</div>`;
    return panelShell('5. Review the customer journey', 'Everything below is written as a business decision, so product, operations, and compliance teams can review it together.', '', list + actions);
  }

  function openTemplateModal() {
    const current = template();
    const choices = TEMPLATES.filter(item => (!item.status || item.status === "active") && (item.family === product.family || item.family === "General"));
    window.PS.openModal(`<div class="modal-header"><div><h2 class="modal-title">Choose a pricing template</h2><div class="rating-panel-copy">Starting prices are maintained centrally. Select the portfolio group that best matches this product.</div></div><button class="btn btn-icon" data-rating-action="close-modal" aria-label="Close">×</button></div><div class="modal-body"><div id="rating-modal-result"></div>${choices.map(item => `<label class="template-option"><input type="radio" name="pricing-template" value="${item.id}" ${item.id === current.id ? 'checked' : ''}><div><div class="template-name">${esc(item.name)} · ${money(item.base)} ${esc(item.unit)}</div><div class="template-copy">${esc(item.evidence)}. Maintained in the ${esc(item.source)}.</div><div class="template-meta">${item.id === automaticTemplate().id ? 'Recommended for this product' : 'Available alternative'} · Reviewed ${esc(item.updated || item.reviewed || "Not set")}</div></div></label>`).join('')}</div><div class="modal-footer"><button class="btn btn-secondary" data-rating-action="close-modal">Cancel</button><button class="btn btn-primary" data-rating-action="apply-template">Use selected template</button></div>`);
  }

  function openBandsModal(kind) {
    const labels = { driver:'Driver age', vehicle:'Vehicle age', location:'Where the vehicle is kept', use:'How the vehicle is used' };
    window.PS.openModal(`<div class="modal-header"><div><h2 class="modal-title">Edit ${esc(labels[kind])} choices</h2><div class="rating-panel-copy">Choose the outcome for each customer group. No calculations are required.</div></div><button class="btn btn-icon" data-rating-action="close-modal">×</button></div><div class="modal-body"><div id="rating-modal-result"></div><div class="range-editor">${record.bands[kind].map((row,index) => `<div class="range-row"><input class="form-control" value="${esc(row.label)}" data-band-label="${index}" aria-label="Customer group"><select class="form-control" data-band-action="${index}"><option value="increase" ${row.action === 'increase' ? 'selected' : ''}>Increase price</option><option value="same" ${row.action === 'same' ? 'selected' : ''}>No change</option><option value="reduce" ${row.action === 'reduce' ? 'selected' : ''}>Reduce price</option></select><div style="display:flex;align-items:center;gap:4px"><input class="form-control" type="number" min="0" max="100" value="${esc(row.value)}" data-band-value="${index}" aria-label="Percentage"><span>%</span></div><span></span></div>`).join('')}</div><div class="callout callout-info" style="margin-top:14px"><div class="callout-body">Example: choosing “Increase price” and “25%” means a customer in that group pays 25% more than the starting price.</div></div></div><div class="modal-footer"><button class="btn btn-secondary" data-rating-action="close-modal">Cancel</button><button class="btn btn-primary" data-rating-action="save-bands" data-band="${kind}">Save choices</button></div>`);
  }

  function ruleValueControl(field, value = '') {
    const config = FIELD_OPTIONS[field];
    if (config.type === 'select') return `<select class="form-control" id="rating-rule-value">${config.values.map(item => `<option value="${item[0]}" ${String(value) === item[0] ? 'selected' : ''}>${item[1]}</option>`).join('')}</select>`;
    return `<input class="form-control" id="rating-rule-value" type="number" min="0" value="${esc(value)}" placeholder="${esc(config.placeholder)}">`;
  }

  function openRuleModal(existing) {
    const rule = existing || { id:'', name:'', field:'driverAge', operator:'lt', value:25, action:'increase', amount:20, unit:'percent', enabled:true };
    window.PS.openModal(`<div class="modal-header"><div><h2 class="modal-title">${existing ? 'Edit' : 'Add'} a pricing rule</h2><div class="rating-panel-copy">Complete the sentence using everyday business choices.</div></div><button class="btn btn-icon" data-rating-action="close-modal">×</button></div><div class="modal-body"><div id="rating-modal-result"></div><div class="gui-builder"><div><label class="form-label">Rule name</label><input class="form-control" id="rating-rule-name" value="${esc(rule.name)}" placeholder="e.g. Young driver adjustment"></div><div class="gui-sentence"><span class="gui-word">WHEN</span><select class="form-control" id="rating-rule-field" data-rating-change="rule-field">${Object.entries(FIELD_OPTIONS).map(([id,item]) => `<option value="${id}" ${rule.field === id ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select><select class="form-control" id="rating-rule-operator"><option value="eq" ${rule.operator === 'eq' ? 'selected' : ''}>is</option><option value="neq" ${rule.operator === 'neq' ? 'selected' : ''}>is not</option><option value="lt" ${rule.operator === 'lt' ? 'selected' : ''}>is less than</option><option value="gte" ${rule.operator === 'gte' ? 'selected' : ''}>is at least</option></select><div id="rating-rule-value-wrap">${ruleValueControl(rule.field,rule.value)}</div></div><div class="gui-action"><span class="gui-word">THEN</span><select class="form-control" id="rating-rule-action"><option value="increase" ${rule.action === 'increase' ? 'selected' : ''}>Increase price by</option><option value="reduce" ${rule.action === 'reduce' ? 'selected' : ''}>Reduce price by</option><option value="fixed" ${rule.action === 'fixed' ? 'selected' : ''}>Add a fixed amount</option></select><input class="form-control" id="rating-rule-amount" type="number" min="0" value="${esc(rule.amount)}"><span id="rating-rule-unit">${rule.action === 'fixed' ? '$' : '%'}</span></div><div class="callout callout-info"><div class="callout-body">The finished rule will be shown as a readable sentence on the page and in the customer price breakdown.</div></div></div></div><div class="modal-footer"><button class="btn btn-secondary" data-rating-action="close-modal">Cancel</button><button class="btn btn-primary" data-rating-action="save-rule" data-rule="${esc(rule.id)}">${existing ? 'Save rule' : 'Add rule'}</button></div>`);
  }

  function openExplainModal() {
    window.PS.openModal(`<div class="modal-header"><h2 class="modal-title">How a customer price is built</h2><button class="btn btn-icon" data-rating-action="close-modal">×</button></div><div class="modal-body"><div class="pricing-flow" style="grid-template-columns:1fr">${[
      ['1','Start with the portfolio price','The central pricing team maintains one approved price for the selected product group.'],['2','Apply customer risk choices','Age, vehicle, location, use, and any additional business rules increase or reduce the price.'],['3','Apply savings','Claim-free, loyalty, and multi-policy discounts reduce the customer price when eligible.'],['4','Include required charges','Administration, duty, and tax are added automatically.'],['5','Show the price clearly','The customer sees an annual price, monthly equivalent, and an understandable breakdown.']
    ].map(item => `<div class="pricing-flow-card"><div class="pricing-flow-name">${item[0]}. ${item[1]}</div><div class="pricing-flow-desc">${item[2]}</div></div>`).join('')}</div></div><div class="modal-footer"><button class="btn btn-primary" data-rating-action="close-modal">Got it</button></div>`);
  }

  function previewFields(values) {
    return `<div class="form-grid-2"><div><label class="form-label">Driver age</label><input id="preview-driverAge" class="form-control" type="number" min="17" value="${values.driverAge}"></div><div><label class="form-label">Vehicle age</label><input id="preview-vehicleAge" class="form-control" type="number" min="0" value="${values.vehicleAge}"></div><div><label class="form-label">Where the vehicle is kept</label><select id="preview-location" class="form-control"><option value="metro" ${values.location === 'metro' ? 'selected' : ''}>Large city</option><option value="town" ${values.location === 'town' ? 'selected' : ''}>Town or small city</option><option value="rural" ${values.location === 'rural' ? 'selected' : ''}>Rural area</option></select></div><div><label class="form-label">How the vehicle is used</label><select id="preview-use" class="form-control"><option value="personal" ${values.use === 'personal' ? 'selected' : ''}>Personal trips only</option><option value="commute" ${values.use === 'commute' ? 'selected' : ''}>Personal trips and commuting</option><option value="business" ${values.use === 'business' ? 'selected' : ''}>Business use</option></select></div><div><label class="form-label">Claims in the last 3 years</label><input id="preview-claims" class="form-control" type="number" min="0" value="${values.claims}"></div><div><label class="form-label">Claim-free years</label><input id="preview-claimFreeYears" class="form-control" type="number" min="0" value="${values.claimFreeYears}"></div><div><label class="form-label">Vehicle value</label><input id="preview-vehicleValue" class="form-control" type="number" min="0" value="${values.vehicleValue}"></div><div><label class="form-label">Any driving convictions?</label><select id="preview-convictions" class="form-control"><option value="no" ${values.convictions === 'no' ? 'selected' : ''}>No</option><option value="yes" ${values.convictions === 'yes' ? 'selected' : ''}>Yes</option></select></div><div><label class="form-label">Renewing customer?</label><select id="preview-loyalty" class="form-control"><option value="no" ${values.loyalty === 'no' ? 'selected' : ''}>No</option><option value="yes" ${values.loyalty === 'yes' ? 'selected' : ''}>Yes</option></select></div><div><label class="form-label">Has another policy?</label><select id="preview-multi" class="form-control"><option value="no" ${values.multi === 'no' ? 'selected' : ''}>No</option><option value="yes" ${values.multi === 'yes' ? 'selected' : ''}>Yes</option></select></div></div>`;
  }

  function openPreviewModal(values = SCENARIOS.standard) {
    lastEstimate = estimatePrice(values);
    window.PS.openModal(`<div class="modal-header"><div><h2 class="modal-title">Preview a customer price</h2><div class="rating-panel-copy">Choose a sample customer or enter details, then calculate a clear price.</div></div><button class="btn btn-icon" data-rating-action="close-modal">×</button></div><div class="price-test-layout"><div class="price-test-inputs"><div id="rating-modal-result"></div><div class="scenario-pills"><button class="scenario-pill" data-rating-action="scenario" data-scenario="standard">Standard customer</button><button class="scenario-pill" data-rating-action="scenario" data-scenario="young">Young driver</button><button class="scenario-pill" data-rating-action="scenario" data-scenario="highvalue">High-value vehicle</button><button class="scenario-pill" data-rating-action="scenario" data-scenario="claims">Recent claims</button></div><div id="rating-preview-fields">${previewFields(values)}</div><button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:16px" data-rating-action="calculate">Calculate price</button></div><div class="price-test-output" id="rating-preview-output">${estimateHtml(lastEstimate)}</div></div><div class="modal-footer"><button class="btn btn-secondary" data-rating-action="download-breakdown">Download breakdown</button><button class="btn btn-secondary" data-rating-action="save-test">Save as test case</button><button class="btn btn-primary" data-rating-action="close-modal">Done</button></div>`, 'modal-lg');
  }

  function readPreview() {
    const value = id => document.getElementById(`preview-${id}`)?.value;
    return { driverAge:Number(value('driverAge')), vehicleAge:Number(value('vehicleAge')), location:value('location'), use:value('use'), claims:Number(value('claims')), claimFreeYears:Number(value('claimFreeYears')), vehicleValue:Number(value('vehicleValue')), convictions:value('convictions'), loyalty:value('loyalty'), multi:value('multi') };
  }

  function bandPercent(kind, value) {
    const rows = record.bands[kind];
    let row;
    if (kind === 'driver') row = value < 25 ? rows[0] : value < 70 ? rows[1] : rows[2];
    if (kind === 'vehicle') row = value <= 3 ? rows[0] : value <= 8 ? rows[1] : rows[2];
    if (kind === 'location') row = rows[{ metro:0, town:1, rural:2 }[value] ?? 1];
    if (kind === 'use') row = rows[{ personal:0, commute:1, business:2 }[value] ?? 0];
    if (!row || row.action === 'same') return 0;
    return Number(row.value) * (row.action === 'reduce' ? -1 : 1);
  }

  function compare(actual, operator, expected) {
    const numeric = !Number.isNaN(Number(actual)) && !Number.isNaN(Number(expected));
    const a = numeric ? Number(actual) : String(actual);
    const b = numeric ? Number(expected) : String(expected);
    if (operator === 'eq') return a === b;
    if (operator === 'neq') return a !== b;
    if (operator === 'lt') return a < b;
    if (operator === 'gte') return a >= b;
    return false;
  }

  function estimatePrice(values) {
    const base = template().base;
    const items = [];
    const addPercent = (label, percent) => { if (!percent) return; const amount = round(base * percent / 100); items.push({ stage:'Risk adjustments', label, amount, detail:`${Math.abs(percent)}% ${percent > 0 ? 'increase' : 'reduction'}` }); };
    addPercent('Driver age', bandPercent('driver', values.driverAge));
    addPercent('Vehicle age', bandPercent('vehicle', values.vehicleAge));
    addPercent('Where the vehicle is kept', bandPercent('location', values.location));
    addPercent('How the vehicle is used', bandPercent('use', values.use));
    if (values.claims > 0) addPercent('Recent claims', Math.min(40, values.claims * 12));
    if (values.convictions === 'yes') addPercent('Driving convictions', 20);
    let subtotal = base + items.reduce((sum,item) => sum + item.amount, 0);
    record.customRules.filter(rule => rule.enabled !== false && compare(values[rule.field],rule.operator,rule.value)).forEach(rule => {
      const amount = rule.action === 'fixed' ? Number(rule.amount) : round(subtotal * Number(rule.amount) / 100) * (rule.action === 'reduce' ? -1 : 1);
      items.push({ stage:'Additional rules', label:rule.name, amount, detail:'Matched this customer' }); subtotal += amount;
    });
    const discounts = [];
    const discount = (label, percent) => { const amount = round(subtotal * percent / 100) * -1; discounts.push({ stage:'Savings', label, amount, detail:`${percent}% saving` }); subtotal += amount; };
    const claimFree = centralDiscount('discount-claim-free');
    if (record.discounts.claimFree.enabled && claimFree) {
      const eligible = (claimFree.bands || []).filter(item => values.claimFreeYears >= item.years).sort((a,b) => b.years - a.years)[0];
      if (eligible) discount(claimFree.name, eligible.value);
    }
    const loyalty = centralDiscount('discount-loyalty');
    if (record.discounts.loyalty.enabled && values.loyalty === 'yes' && loyalty) discount(loyalty.name, loyalty.value);
    const multi = centralDiscount('discount-multi');
    if (record.discounts.multi.enabled && values.multi === 'yes' && multi) discount(multi.name, multi.value);
    const charges = [];
    ['admin','stamp'].forEach(id => { const item = record.charges[id]; if (item.enabled) { charges.push({ stage:'Fees & taxes', label:item.name, amount:Number(item.value), detail:'Required charge' }); subtotal += Number(item.value); } });
    if (record.charges.tax.enabled) { const amount = round(subtotal * record.charges.tax.value / 100); charges.push({ stage:'Fees & taxes', label:record.charges.tax.name, amount, detail:`${record.charges.tax.value}% required tax` }); subtotal += amount; }
    return { base, total:round(subtotal), monthly:round(subtotal / 12), items:[...items,...discounts,...charges], values:clone(values) };
  }

  function estimateHtml(estimate) {
    const grouped = estimate.items.reduce((all,item) => { (all[item.stage] ||= []).push(item); return all; }, {});
    return `<div class="price-result-total"><span>Estimated annual price</span><strong>${money(estimate.total)}</strong><span>${money(estimate.monthly)} per month</span></div><div class="price-breakdown-row"><div><strong>Portfolio starting price</strong><small>${esc(template().name)}</small></div><strong>${money(estimate.base)}</strong></div>${Object.entries(grouped).map(([stage,items]) => `<div class="price-breakdown-section">${esc(stage)}</div>${items.map(item => `<div class="price-breakdown-row"><div><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small></div><strong>${item.amount >= 0 ? '+' : '−'}${money(Math.abs(item.amount))}</strong></div>`).join('')}`).join('')}<div class="callout callout-info" style="margin-top:15px"><div class="callout-body">This preview uses the choices saved in this browser prototype. It does not create a customer quote.</div></div>`;
  }

  function modalError(title, detail) {
    const target = document.getElementById('rating-modal-result');
    if (target) target.innerHTML = `<div class="rating-inline-result error"><div>!</div><div><strong>${esc(title)}</strong><span>${esc(detail)}</span></div></div>`;
  }

  function operatorLabel(operator) { return ({ eq:'is', neq:'is not', lt:'is less than', gte:'is at least' })[operator] || operator; }
  function displayRuleValue(field, value) { return FIELD_OPTIONS[field]?.values?.find(item => item[0] === String(value))?.[1] || String(value); }
  function timeSaved(value) { if (!value) return 'Not saved yet'; const date = new Date(value); return `at ${date.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}`; }

  function downloadSummary() {
    const item = template();
    const lines = [`PRICING SUMMARY`,`${product.name} · ${context.version}`,`Generated ${new Date().toLocaleString()}`,'',`STARTING PRICE`,`Template: ${item.name}`,`Price: ${money(item.base)} ${item.unit}`,`Source: ${item.source}`,`Evidence: ${item.evidence}`,'','RISK ADJUSTMENTS'];
    Object.entries(record.bands).forEach(([kind,bands]) => { lines.push(kind.toUpperCase()); bands.forEach(band => lines.push(`- ${band.label}: ${band.action === 'same' ? 'No change' : `${band.action === 'reduce' ? 'Reduce' : 'Increase'} ${band.value}%`}`)); });
    lines.push('','DISCOUNTS'); Object.values(record.discounts).forEach(item => lines.push(`- ${item.name}: ${item.enabled ? 'Active' : 'Not used'}`));
    lines.push('','FEES & TAXES'); Object.values(record.charges).forEach(item => lines.push(`- ${item.name}: ${item.enabled ? (item.kind === 'percent' ? `${item.value}%` : money(item.value)) : 'Not used'} (centrally managed)`));
    window.PS?.prototypeApp?.download(`pricing-summary-${context.productId}-${context.version}.txt`, lines.join('\n'));
  }

  function downloadBreakdown() {
    if (!lastEstimate) return;
    const lines = [`CUSTOMER PRICE PREVIEW`,`${product.name} · ${context.version}`,`Annual price: ${money(lastEstimate.total)}`,`Monthly equivalent: ${money(lastEstimate.monthly)}`,'',`Starting price: ${money(lastEstimate.base)}`];
    lastEstimate.items.forEach(item => lines.push(`${item.stage} · ${item.label}: ${item.amount >= 0 ? '+' : '-'}${money(Math.abs(item.amount))} (${item.detail})`));
    window.PS?.prototypeApp?.download(`price-preview-${context.productId}-${Date.now()}.txt`, lines.join('\n'));
  }

  function saveTestCase() {
    if (!lastEstimate) return;
    const app = window.PS?.prototypeApp;
    if (app) {
      const key = `${context.productId}::${context.version}::testCases`;
      const tests = app.state.collections[key] || [];
      tests.unshift({ id:`PRICE-${String(Date.now()).slice(-6)}`, type:'customer-price-preview', productId:context.productId, version:context.version, price:lastEstimate.total, monthly:lastEstimate.monthly, inputs:lastEstimate.values, createdAt:new Date().toISOString(), status:'saved' });
      app.state.collections[key] = tests; app.save(); app.addAudit('CREATED', `Saved customer price preview at ${money(lastEstimate.total)}`);
    }
    const target = document.getElementById('rating-modal-result');
    if (target) target.innerHTML = `<div class="rating-inline-result"><div>✓</div><div><strong>Test case saved</strong><span>The inputs and ${money(lastEstimate.total)} result are stored for ${esc(product.name)} ${esc(context.version)}.</span></div></div>`;
  }

  function handleClick(event) {
    const button = event.target.closest('[data-rating-action]');
    if (!button) return;
    const action = button.dataset.ratingAction;
    if (action === 'step') { activeStep = button.dataset.step; render(); }
    if (action === 'dismiss-result') { pageResult = null; render(); }
    if (action === 'close-modal') window.PS.closeModal();
    if (action === 'explain') openExplainModal();
    if (action === 'preview') openPreviewModal();
    if (action === 'change-template') openTemplateModal();
    if (action === 'apply-template') {
      const selected = document.querySelector('input[name="pricing-template"]:checked');
      if (!selected) return modalError('Choose a template', 'Select one portfolio template to continue.');
      record.templateId = selected.value; linkCentralTemplate(selected.value); saveRecord('Changed the portfolio pricing template'); window.PS.closeModal(); setResult('Pricing template applied', `${template().name} now supplies the starting price automatically from the Central Pricing Library.`);
    }
    if (action === 'edit-bands') openBandsModal(button.dataset.band);
    if (action === 'save-bands') {
      const kind = button.dataset.band;
      const rows = record.bands[kind].map((row,index) => ({ label:document.querySelector(`[data-band-label="${index}"]`).value.trim(), action:document.querySelector(`[data-band-action="${index}"]`).value, value:Number(document.querySelector(`[data-band-value="${index}"]`).value) }));
      if (rows.some(row => !row.label || row.value < 0 || row.value > 100)) return modalError('Check the choices', 'Every group needs a name and a percentage between 0 and 100.');
      record.bands[kind] = rows; saveRecord(`Updated ${kind} customer choices`); window.PS.closeModal(); setResult('Customer choices saved', 'The updated groups now appear in Risk adjustments and the price preview.');
    }
    if (action === 'add-rule') openRuleModal();
    if (action === 'edit-rule') openRuleModal(record.customRules.find(rule => rule.id === button.dataset.rule));
    if (action === 'save-rule') {
      const name = document.getElementById('rating-rule-name').value.trim();
      const field = document.getElementById('rating-rule-field').value;
      const operator = document.getElementById('rating-rule-operator').value;
      const value = document.getElementById('rating-rule-value').value;
      const ruleAction = document.getElementById('rating-rule-action').value;
      const amount = Number(document.getElementById('rating-rule-amount').value);
      if (!name || value === '' || !Number.isFinite(amount) || amount < 0) return modalError('Complete the rule', 'Add a rule name, comparison value, and valid price change.');
      const id = button.dataset.rule || `RULE-${Date.now()}`;
      const next = { id, name, field, operator, value, action:ruleAction, amount, unit:ruleAction === 'fixed' ? 'fixed' : 'percent', enabled:true };
      const index = record.customRules.findIndex(rule => rule.id === id);
      if (index >= 0) record.customRules[index] = next; else record.customRules.push(next);
      saveRecord(`${index >= 0 ? 'Updated' : 'Added'} pricing rule ${name}`); activeStep = 'risk'; window.PS.closeModal(); setResult(index >= 0 ? 'Pricing rule updated' : 'Pricing rule added', `${name} now appears as a readable business rule.`);
    }
    if (action === 'toggle-rule') { const rule = record.customRules.find(item => item.id === button.dataset.rule); rule.enabled = rule.enabled === false; saveRecord(`${rule.enabled ? 'Resumed' : 'Paused'} pricing rule ${rule.name}`); setResult(`Rule ${rule.enabled ? 'resumed' : 'paused'}`, `${rule.name} ${rule.enabled ? 'will now affect matching price previews' : 'will remain visible but will not affect prices'}.`); }
    if (action === 'delete-rule') { const rule = record.customRules.find(item => item.id === button.dataset.rule); if (!rule) return; record.customRules = record.customRules.filter(item => item.id !== rule.id); saveRecord(`Removed pricing rule ${rule.name}`); setResult('Pricing rule removed', `${rule.name} no longer affects customer prices.`); }
    if (action === 'toggle-discount') { const item = record.discounts[button.dataset.discount]; item.enabled = !item.enabled; saveRecord(`${item.enabled ? 'Enabled' : 'Disabled'} ${item.name}`); setResult(`Discount ${item.enabled ? 'turned on' : 'turned off'}`, `${item.name} ${item.enabled ? 'will now be considered in price previews' : 'will no longer be applied'}.`); }
    if (action === 'scenario') { const values = SCENARIOS[button.dataset.scenario]; document.getElementById('rating-preview-fields').innerHTML = previewFields(values); lastEstimate = estimatePrice(values); document.getElementById('rating-preview-output').innerHTML = estimateHtml(lastEstimate); }
    if (action === 'calculate') { const values = readPreview(); if (values.driverAge < 17 || values.vehicleAge < 0 || values.vehicleValue <= 0) return modalError('Check the customer details', 'Enter a valid driver age, vehicle age, and vehicle value.'); lastEstimate = estimatePrice(values); document.getElementById('rating-preview-output').innerHTML = estimateHtml(lastEstimate); }
    if (action === 'save-test') saveTestCase();
    if (action === 'download-breakdown') downloadBreakdown();
    if (action === 'download-summary') downloadSummary();
    if (action === 'save') { saveRecord('Saved guided pricing setup'); setResult('Pricing setup saved', `All guided choices are stored for ${product.name} ${context.version}.`); }
  }

  function handleChange(event) {
    if (event.target.id === 'rating-rule-field') {
      const wrap = document.getElementById('rating-rule-value-wrap');
      wrap.innerHTML = ruleValueControl(event.target.value);
      const config = FIELD_OPTIONS[event.target.value];
      const operator = document.getElementById('rating-rule-operator');
      if (config.type === 'select' && ['lt','gte'].includes(operator.value)) operator.value = 'eq';
    }
    if (event.target.id === 'rating-rule-action') document.getElementById('rating-rule-unit').textContent = event.target.value === 'fixed' ? '$' : '%';
  }

  function init() {
    root = document.querySelector('.page-inner');
    if (!root || !window.PS?.openModal) return;
    context = getContext(); product = findProduct(); record = loadRecord();
    document.title = `Rating & Pricing Studio · ${product.name} — Product Studio | VeriDex`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = 'Configure customer pricing with visual business rules, automatic portfolio starting prices, discounts, fees, taxes, and plain-language price previews.';
    const breadcrumb = document.getElementById("topbar-breadcrumb");
    if (breadcrumb) breadcrumb.innerHTML = `<a href="index.html">Studio</a><span>›</span><a href="catalogue.html">Product Catalogue</a><span>›</span><a href="product-detail.html?id=${encodeURIComponent(context.productId)}">${esc(context.productId)}</a><span>›</span><a href="product-detail.html?id=${encodeURIComponent(context.productId)}&version=${encodeURIComponent(context.version)}">${esc(context.version)}</a><span>›</span><span>Rating & Pricing Studio</span>`;
    document.addEventListener('click', handleClick);
    document.addEventListener('change', handleChange);
    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
