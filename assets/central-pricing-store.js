/* Shared central pricing data for the browser-only prototype. */
(function () {
  'use strict';
  window.PS = window.PS || {};
  const KEY = 'insurance-product-studio-central-pricing-v1';
  const clone = value => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();

  function defaults() {
    return {
      schemaVersion:1,
      templates:[
        { id:'motor-comprehensive', type:'template', family:'Motor', match:'Comprehensive', name:'Private car · Comprehensive', base:350, unit:'per year', source:'Motor pricing library', evidence:'Based on 42 comparable products', reviewed:'2026-08-18', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-001'] },
        { id:'motor-liability', type:'template', family:'Motor', match:'Third Party', name:'Private car · Third party', base:185, unit:'per year', source:'Motor pricing library', evidence:'Based on 31 comparable products', reviewed:'2026-08-18', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-002'] },
        { id:'property-sme', type:'template', family:'Property', match:'', name:'Small business property', base:740, unit:'per year', source:'Commercial pricing library', evidence:'Based on 27 comparable products', reviewed:'2026-08-11', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-003'] },
        { id:'trucking-fleet', type:'template', family:'Trucking', match:'', name:'Commercial trucking fleet', base:2200, unit:'per vehicle / year', source:'Transportation pricing library', evidence:'Fleet physical damage and liability benchmark', reviewed:'2026-08-28', effectiveFrom:'2026-09-01', status:'active', linkedProductIds:[] },
        { id:'cyber-sme', type:'template', family:'Cyber', match:'', name:'SME cyber protection', base:1100, unit:'per year', source:'Cyber pricing library', evidence:'Network, privacy, response, and interruption benchmark', reviewed:'2026-08-28', effectiveFrom:'2026-09-01', status:'active', linkedProductIds:[] },
        { id:'workers-comp', type:'template', family:'Workers Compensation', match:'', name:'Workers compensation standard', base:1.8, unit:'per $100 payroll', source:'Casualty pricing library', evidence:'Industry and payroll-based statutory benefit benchmark', reviewed:'2026-08-28', effectiveFrom:'2026-09-01', status:'active', linkedProductIds:[] },
        { id:'health-group', type:'template', family:'Health', match:'', name:'Group health · Corporate', base:165, unit:'per member / month', source:'Health pricing library', evidence:'Based on 19 comparable schemes', reviewed:'2026-08-20', effectiveFrom:'2026-09-01', status:'active', linkedProductIds:['PRD-004'] },
        { id:'marine-cargo', type:'template', family:'Marine', match:'', name:'Marine cargo · Open cover', base:520, unit:'per shipment', source:'Marine pricing library', evidence:'Based on 16 comparable products', reviewed:'2026-08-07', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-005'] },
        { id:'travel-annual', type:'template', family:'Travel', match:'', name:'Worldwide annual travel', base:145, unit:'per traveller / year', source:'Travel pricing library', evidence:'Based on 36 comparable products', reviewed:'2026-08-15', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-006'] },
        { id:'general', type:'template', family:'General', match:'', name:'General insurance starter', base:300, unit:'per year', source:'Central pricing library', evidence:'Conservative portfolio benchmark', reviewed:'2026-08-18', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:[] }
      ],
      discounts:[
        { id:'discount-claim-free', type:'discount', name:'Claim-free reward', displayValue:'3% / 7% / 12%', bands:[{ years:1, value:3 },{ years:3, value:7 },{ years:5, value:12 }], eligibility:'1, 3, and 5 completed claim-free years', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-001','PRD-002'] },
        { id:'discount-loyalty', type:'discount', name:'Renewing customer', value:5, displayValue:'5%', eligibility:'Customer is renewing an active policy', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-001','PRD-002','PRD-003','PRD-004'] },
        { id:'discount-multi', type:'discount', name:'More than one policy', value:8, displayValue:'8%', eligibility:'Customer holds another active policy', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-001','PRD-002','PRD-003'] }
      ],
      charges:[
        { id:'charge-admin', type:'charge', key:'admin', name:'Policy administration', kind:'fixed', value:18, jurisdiction:'All', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-001','PRD-002','PRD-003','PRD-004','PRD-005','PRD-006'] },
        { id:'charge-stamp', type:'charge', key:'stamp', name:'Stamp duty', kind:'fixed', value:6, jurisdiction:'India', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-001','PRD-002','PRD-003','PRD-004'] },
        { id:'charge-tax', type:'charge', key:'tax', name:'Insurance tax', kind:'percent', value:18, jurisdiction:'India', effectiveFrom:'2026-08-01', status:'active', linkedProductIds:['PRD-001','PRD-002','PRD-003','PRD-004'] }
      ],
      history:[
        { id:'CPH-001', at:'2026-08-20T10:15:00.000Z', user:'Rajan Mehta', role:'Pricing Actuary', action:'Reviewed', record:'Group health · Corporate', before:'$160 per member / month', after:'$165 per member / month' },
        { id:'CPH-002', at:'2026-08-18T14:30:00.000Z', user:'Rajan Mehta', role:'Pricing Actuary', action:'Activated', record:'Motor portfolio prices', before:'July 2026 values', after:'August 2026 values' }
      ]
    };
  }

  function normalize(value) {
    const base = defaults();
    if (!value || value.schemaVersion !== 1) return base;
    const templates = Array.isArray(value.templates) ? value.templates : base.templates;
    const addedTemplateIds = new Set(['trucking-fleet','cyber-sme','workers-comp']);
    base.templates.filter(item => addedTemplateIds.has(item.id) && !templates.some(existing => existing.id === item.id)).forEach(item => templates.push(item));
    return { schemaVersion:1, templates, discounts:Array.isArray(value.discounts) ? value.discounts : base.discounts, charges:Array.isArray(value.charges) ? value.charges : base.charges, history:Array.isArray(value.history) ? value.history : base.history };
  }

  function getState() {
    try { return clone(normalize(JSON.parse(localStorage.getItem(KEY)))); }
    catch (_) { return clone(defaults()); }
  }

  function replace(state, detail) {
    const normalized = normalize(state);
    localStorage.setItem(KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('central-pricing-updated', { detail:detail || {} }));
    return clone(normalized);
  }

  function active(items) { return items.filter(item => item.status === 'active'); }

  function templateFor(product) {
    const state = getState();
    const family = String(product?.family || 'General').toLowerCase();
    const name = String(product?.name || '').toLowerCase();
    const candidates = active(state.templates).filter(item => String(item.family).toLowerCase() === family);
    return clone(candidates.find(item => item.match && name.includes(String(item.match).toLowerCase())) || candidates.find(item => !item.match) || candidates[0] || active(state.templates).find(item => item.family === 'General') || state.templates[0]);
  }

  function addHistory(state, entry) {
    state.history.unshift(Object.assign({ id:`CPH-${Date.now()}`, at:now(), user:window.PS?.data?.currentUser?.name || 'Anika Sharma', role:window.PS?.prototypeApp?.state?.currentRole || window.PS?.data?.currentUser?.role || 'Product Manager' }, entry));
    state.history = state.history.slice(0, 250);
    return state;
  }

  PS.centralPricing = { KEY, defaults, getState, replace, active, templateFor, addHistory, reset(){ localStorage.removeItem(KEY); window.dispatchEvent(new CustomEvent('central-pricing-updated')); } };
})();
