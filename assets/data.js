/* ============================================================
   Insurance Product Studio — Shared Dummy Data Store
   data.js
   ============================================================ */

window.PS = window.PS || {};

PS.data = {
  productFamilies: [
    'Motor', 'Trucking', 'Cyber', 'Property', 'Workers Compensation',
    'Health', 'Marine', 'Travel', 'Life', 'Liability'
  ],

  currentUser: {
    id: 'U006',
    name: 'Marcus Lee',
    initials: 'ML',
    role: 'Administrator',
    avatarClass: 'av-adm'
  },

  users: [
    { id:'U001', name:'Anika Sharma',    initials:'AS', role:'Product Manager',       avatarClass:'av-pm'  },
    { id:'U002', name:'Rajan Mehta',     initials:'RM', role:'Pricing Actuary',        avatarClass:'av-act' },
    { id:'U003', name:'Sunita Pillai',   initials:'SP', role:'Underwriting Manager',   avatarClass:'av-uw'  },
    { id:'U004', name:'David Okonkwo',   initials:'DO', role:'Compliance Officer',     avatarClass:'av-co'  },
    { id:'U005', name:'Priya Varghese',  initials:'PV', role:'Publisher',              avatarClass:'av-pub' },
    { id:'U006', name:'Marcus Lee',      initials:'ML', role:'Administrator',          avatarClass:'av-adm' }
  ],

  products: [
    {
      id: 'PRD-001', name: 'Private Car Comprehensive',
      family: 'Motor', version: '2026.04', status: 'published',
      effectiveFrom: '01-Apr-2026', effectiveTo: '30-Sep-2026',
      lastModified: '21-Aug-2026', lastModifiedBy: 'Priya Varghese',
      pending: true
    },
    {
      id: 'PRD-002', name: 'Private Car Third Party Only',
      family: 'Motor', version: '2026.07-DRAFT', status: 'draft',
      effectiveFrom: null, effectiveTo: null,
      lastModified: 'Yesterday', lastModifiedBy: 'Anika Sharma',
      pending: true
    },
    {
      id: 'PRD-003', name: 'SME Property All Risks',
      family: 'Property', version: '2026.06-RC1', status: 'review',
      effectiveFrom: null, effectiveTo: null,
      lastModified: '2 days ago', lastModifiedBy: 'Anika Sharma',
      pending: false
    },
    {
      id: 'PRD-004', name: 'Group Health — Corporate Plan',
      family: 'Health', version: '2026.05', status: 'approved',
      effectiveFrom: null, effectiveTo: null,
      lastModified: 'Yesterday', lastModifiedBy: 'Rajan Mehta',
      pending: true
    },
    {
      id: 'PRD-005', name: 'Marine Cargo Open Cover',
      family: 'Marine', version: '2025.12', status: 'superseded',
      effectiveFrom: '01-Jan-2025', effectiveTo: '31-Dec-2025',
      lastModified: '01-Jan-2026', lastModifiedBy: 'Priya Varghese',
      pending: false
    },
    {
      id: 'PRD-006', name: 'Travel Worldwide Annual',
      family: 'Travel', version: '2024.01', status: 'retired',
      effectiveFrom: '01-Jan-2024', effectiveTo: '31-Dec-2024',
      lastModified: '01-Jan-2025', lastModifiedBy: 'Priya Varghese',
      pending: false
    }
  ],

  pendingActions: [
    {
      type: 'approval', typeLabel: 'Approval Request',
      product: 'Group Health — Corporate Plan',
      productId: 'PRD-004',
      detail: 'Awaiting actuarial sign-off before publication',
      since: '2 days ago',
      action: 'Review'
    },
    {
      type: 'draft', typeLabel: 'Draft Incomplete',
      product: 'Private Car Third Party Only',
      productId: 'PRD-002',
      detail: 'Rating Studio has no base rate configured',
      since: '5 days ago',
      action: 'Complete'
    },
    {
      type: 'expiring', typeLabel: 'Version Expiring',
      product: 'Private Car Comprehensive v2026.04',
      productId: 'PRD-001',
      detail: 'Effective end date: 30-Sep-2026. A successor version is not published.',
      since: '14 days ago',
      action: 'View'
    }
  ],

  activityFeed: [
    { userId:'U005', action:'published', subject:'Private Car Comprehensive v2026.04', time:'2 hours ago', status:'published' },
    { userId:'U002', action:'approved rating for', subject:'Group Health Corporate Plan', time:'Yesterday 14:22', status:'approved' },
    { userId:'U001', action:'created', subject:'Private Car Third Party Only v2026.07-DRAFT', time:'Yesterday 10:05', status:null },
    { userId:'U003', action:'updated 3 underwriting rules in', subject:'SME Property All Risks', time:'2 days ago', status:null },
    { userId:'U004', action:'commented on', subject:'Group Health Corporate Plan compliance review', time:'2 days ago', status:null },
    { userId:'U006', action:'added distribution channel CHAN-API01 — API Partner', subject:'', time:'3 days ago', status:null },
    { userId:'U002', action:'ran simulation on', subject:'SME Property All Risks v2026.06-RC1', time:'3 days ago', status:null },
    { userId:'U001', action:'submitted', subject:'SME Property All Risks for review', time:'4 days ago', status:'review' }
  ],

  pipeline: {
    draft:      { count: 7,  label: 'Draft' },
    review:     { count: 3,  label: 'In Review' },
    approved:   { count: 1,  label: 'Approved' },
    published:  { count: 4,  label: 'Published' },
    superseded: { count: 2,  label: 'Superseded' },
    retired:    { count: 3,  label: 'Retired' }
  },

  kpis: {
    activeProducts:    { value: 14, label: 'Total Active Products', sub: 'Published and Approved versions', trend: '+2', trendDir: 'up' },
    pendingApproval:   { value: 3,  label: 'Pending Approval', sub: 'Awaiting governance action', trend: '+1', trendDir: 'down' },
    inDraft:           { value: 7,  label: 'In Draft', sub: 'Versions in active design', trend: '+3', trendDir: 'up' },
    publishedThisMonth:{ value: 2,  label: 'Published This Month', sub: 'Released this calendar month', trend: '0', trendDir: null }
  }
};

PS.getUser = (id) => PS.data.users.find(u => u.id === id);
PS.statusBadgeClass = (status) => {
  const map = { draft:'badge-draft', review:'badge-review', approved:'badge-approved', published:'badge-published', superseded:'badge-superseded', retired:'badge-retired' };
  return map[status] || 'badge-draft';
};
PS.statusLabel = (status) => {
  const map = { draft:'Draft', review:'In Review', approved:'Approved', published:'Published', superseded:'Superseded', retired:'Retired' };
  return map[status] || status;
};
