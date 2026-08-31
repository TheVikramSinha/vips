/* ============================================================
   Insurance Product Studio — Shared Nav + Topbar
   nav.js
   ============================================================ */

window.PS = window.PS || {};

PS.nav = {
  items: [
    { group: 'HOME' },
    { id: 'dashboard',      label: 'Dashboard',                href: 'index.html',                icon: 'house' },
    { group: 'PRODUCT DESIGN' },
    { id: 'catalogue',      label: 'Product Catalogue',        href: 'catalogue.html',             icon: 'book-open' },
    { id: 'coverage',       label: 'Coverage Studio',          href: 'coverage-studio.html',       icon: 'umbrella' },
    { id: 'questionnaire',  label: 'Questionnaire Studio',     href: 'questionnaire-studio.html',  icon: 'list-checks' },
    { id: 'eligibility',    label: 'Eligibility Studio',       href: 'eligibility-studio.html',    icon: 'user-check' },
    { id: 'rating',         label: 'Rating & Pricing Studio',  href: 'rating-studio.html',         icon: 'calculator' },
    { id: 'underwriting',   label: 'Underwriting Rules Studio',href: 'underwriting-studio.html',   icon: 'shield-check' },
    { id: 'distribution',   label: 'Distribution Studio',      href: 'distribution-studio.html',   icon: 'tree-structure' },
    { id: 'document',       label: 'Document Studio',          href: 'document-studio.html',       icon: 'file-text' },
    { group: 'GOVERNANCE' },
    { id: 'simulation',     label: 'Simulation & Testing',     href: 'simulation-studio.html',     icon: 'flask' },
    { id: 'governance',     label: 'Approval Workflow',        href: 'governance.html',            icon: 'git-merge' },
    { id: 'audit',          label: 'Audit Log',                href: 'audit-log.html',             icon: 'clock-counter' },
    { group: 'PLATFORM' },
    { id: 'pricing-library',label: 'Central Pricing Library',   href: 'pricing-library.html',       icon: 'calculator' },
    { id: 'integration',    label: 'Integration Monitor',      href: 'integration-monitor.html',   icon: 'plugs' },
    { id: 'roles',          label: 'Roles & Access Control',   href: 'roles-access.html',          icon: 'users' },
    { id: 'glossary',       label: 'Glossary',                 href: 'glossary.html',              icon: 'book' }
  ],

  icons: {
    'house': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M218.83 103.77l-80-75.48a1.14 1.14 0 01-.11-.11 16 16 0 00-21.53 0l-.11.11-79.93 75.48A16 16 0 0032 115.55V208a16 16 0 0016 16h56a16 16 0 0016-16v-48h16v48a16 16 0 0016 16h56a16 16 0 0016-16v-92.45a16 16 0 00-5.17-11.78zM208 208h-56v-48a16 16 0 00-16-16h-16a16 16 0 00-16 16v48H48v-92.45l.11-.1L128 40l79.9 75.43.1.12z" fill="currentColor"/></svg>`,
    'book-open': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M224 48h-72a40 40 0 00-24 8 40 40 0 00-24-8H32a16 16 0 00-16 16v144a16 16 0 0016 16h72a24 24 0 0124 24 8 8 0 0016 0 24 24 0 0124-24h72a16 16 0 0016-16V64a16 16 0 00-16-16zM104 208H32V64h72a24 24 0 0124 24v120a39.87 39.87 0 00-24-8zm120 0h-72a39.87 39.87 0 00-24 8V88a24 24 0 0124-24h72z" fill="currentColor"/></svg>`,
    'umbrella': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M240 120a112 112 0 00-224 0v8a8 8 0 008 8h104v56a16 16 0 01-32 0 8 8 0 00-16 0 32 32 0 0064 0v-56h104a8 8 0 008-8zm-216-8a96.11 96.11 0 01192 0z" fill="currentColor"/></svg>`,
    'list-checks': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M224 128a8 8 0 01-8 8H128a8 8 0 010-16h88a8 8 0 018 8zm-8-56H128a8 8 0 000 16h88a8 8 0 000-16zm0 112H128a8 8 0 000 16h88a8 8 0 000-16zM82.34 42.34 56 68.69 45.66 58.34a8 8 0 00-11.32 11.32l16 16a8 8 0 0011.32 0l32-32a8 8 0 00-11.32-11.32zm0 64-26.34 26.35-10.34-10.35a8 8 0 00-11.32 11.32l16 16a8 8 0 0011.32 0l32-32a8 8 0 00-11.32-11.32zm0 64-26.34 26.35-10.34-10.35a8 8 0 00-11.32 11.32l16 16a8 8 0 0011.32 0l32-32a8 8 0 00-11.32-11.32z" fill="currentColor"/></svg>`,
    'user-check': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M144 157.68A68 68 0 1072 40a68 68 0 0072 117.68zM72 56a52 52 0 110 104 52 52 0 010-104zm168 149.72a8 8 0 01-11 2.56A120.44 120.44 0 00144 192a8 8 0 010-16 136.62 136.62 0 0172 20.28 8 8 0 012.56 11zM0 200a8 8 0 018-8 136.62 136.62 0 0172-20.28 8 8 0 010 16A120.44 120.44 0 000 208a8 8 0 01-8-8zm232.49-90.84a8 8 0 01-1.65 11.17l-40 28a8 8 0 01-11-1.6l-16-20a8 8 0 1112.51-9.96l10.67 13.34 34.3-24.11a8 8 0 0111.17 3.16z" fill="currentColor"/></svg>`,
    'calculator': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M200 24H56a16 16 0 00-16 16v176a16 16 0 0016 16h144a16 16 0 0016-16V40a16 16 0 00-16-16zM56 40h144v48H56zm0 176V104h144v112zm36-80a12 12 0 110-24 12 12 0 010 24zm36 0a12 12 0 110-24 12 12 0 010 24zm36 0a12 12 0 110-24 12 12 0 010 24zM92 180a12 12 0 110-24 12 12 0 010 24zm36 0a12 12 0 110-24 12 12 0 010 24zm36-12a12 12 0 01-12 36v-24h-24v-12h36z" fill="currentColor"/></svg>`,
    'shield-check': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M208 40H48a16 16 0 00-16 16v58.67c0 89.18 71.16 121.55 90.6 128.63a15.91 15.91 0 0010.8 0c19.44-7.08 90.6-39.45 90.6-128.63V56a16 16 0 00-16-16zm0 74.67c0 77.92-62.71 107-80 113.07-17.41-6.1-80-35.23-80-113.07V56h160zM172.49 100.49l-52 52a8 8 0 01-11.32 0l-24-24a8 8 0 0111.32-11.32L114 135.51l46.34-46.34a8 8 0 0112.15 11.32z" fill="currentColor"/></svg>`,
    'tree-structure': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M216 152h-48V120h16a16 16 0 0016-16V56a16 16 0 00-16-16h-56a16 16 0 00-16 16v48a16 16 0 0016 16h16v32H88a16 16 0 00-16 16v16H56a16 16 0 00-16 16v48h16v-48h16v48h16v-48h16v-16h128v16h16v-48a16 16 0 00-16-16zm-88-48V56h56v48z" fill="currentColor"/></svg>`,
    'file-text': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M213.66 82.34l-56-56A8 8 0 00152 24H56a16 16 0 00-16 16v176a16 16 0 0016 16h144a16 16 0 0016-16V88a8 8 0 00-2.34-5.66zM160 51.31 188.69 80H160zM200 216H56V40h88v48a8 8 0 008 8h48v120zm-40-96H96a8 8 0 000 16h64a8 8 0 000-16zm0 32H96a8 8 0 000 16h64a8 8 0 000-16z" fill="currentColor"/></svg>`,
    'flask': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M221.69 199.77L160 96.92V40h8a8 8 0 000-16H88a8 8 0 000 16h8v56.92L34.31 199.77A16 16 0 0048 224h160a16 16 0 0013.69-24.23zM110.43 103.16A8 8 0 00112 99V40h32v59a8 8 0 001.57 4.78L177.12 152H78.88z" fill="currentColor"/></svg>`,
    'git-merge': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M200 48a28 28 0 100 56c.93 0 1.85-.05 2.76-.14C196.7 143.6 164 172.14 128 179.36V120a28 28 0 10-16 0v88a28 28 0 1016 0v-12.22C177.67 186.62 216 152.72 216 104a28 28 0 00-16-56zM84 64a12 12 0 110 24 12 12 0 010-24zm0 128a12 12 0 110-24 12 12 0 010 24zM200 88a12 12 0 110-24 12 12 0 010 24z" fill="currentColor"/></svg>`,
    'clock-counter': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M232 128A104 104 0 1128 71.12V56a8 8 0 00-16 0v40a8 8 0 008 8h40a8 8 0 000-16H43.8A88 88 0 11232 128zm-96-64a8 8 0 00-8 8v56a8 8 0 004.69 7.23l48 24a8 8 0 006.61-14.46L136 127.25V72a8 8 0 00-8-8z" fill="currentColor"/></svg>`,
    'plugs': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M229.66 58.34l-32-32a8 8 0 00-11.32 11.32L192 43.31l-19.31 19.32-51-51a8 8 0 00-11.32 11.32l8 8L96 53.37a40.08 40.08 0 000 56.57l6.06 6.06-60.37 60.37A8 8 0 0053 187.69l.31.31-16.65 16.66a8 8 0 0011.32 11.32l16.65-16.66.31.31a8 8 0 0011.32-11.32l-7-6.95 60.37-60.38 6.06 6.07a40.07 40.07 0 0056.57 0l22.38-22.38 5.66 5.65a8 8 0 0011.32-11.32l-51-51 19.32-19.31 5.65 5.65a8 8 0 0011.32-11.32zm-91.57 79.93a24 24 0 01-33.94 0l-28.42-28.43a24 24 0 010-33.93l22.38-22.38 62.35 62.35z" fill="currentColor"/></svg>`,
    'users': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M117.25 157.92a60 60 0 10-66.5 0A95.83 95.83 0 004 224a8 8 0 008 8 8 8 0 008-8 80 80 0 01160 0 8 8 0 008 8 8 8 0 008-8 95.83 95.83 0 00-78.75-66.08zM40 108a44 44 0 1188 0 44 44 0 01-88 0zm214.79 49.18a8 8 0 01-10 5.34A102.87 102.87 0 00206 157a8 8 0 010-16 86.78 86.78 0 0123.44 3.16 8 8 0 015.35 13.02zM170 132a44 44 0 010-88 44 44 0 010 88zm0-72a28 28 0 100 56 28 28 0 000-56z" fill="currentColor"/></svg>`,
    'book': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M208 24H72a32 32 0 00-32 32v160a32 32 0 0032 32h136a8 8 0 008-8V32a8 8 0 00-8-8zm-8 208H72a16 16 0 010-32h128zM72 184a31.82 31.82 0 00-16 4.29V56a16 16 0 0116-16h128v144z" fill="currentColor"/></svg>`,
    'chevron-left': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M165.66 202.34a8 8 0 01-11.32 11.32l-80-80a8 8 0 010-11.32l80-80a8 8 0 0111.32 11.32L91.31 128z" fill="currentColor"/></svg>`,
    'chevron-right': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M181.66 133.66l-80 80a8 8 0 01-11.32-11.32L164.69 128 90.34 53.66a8 8 0 0111.32-11.32l80 80a8 8 0 010 11.32z" fill="currentColor"/></svg>`,
    'bell': `<svg width="18" height="18" viewBox="0 0 256 256" fill="none"><path d="M221.8 175.94C216.25 166.38 208 139.33 208 104a80 80 0 00-160 0c0 35.34-8.26 62.38-13.81 71.94A16 16 0 0048 200h40.92a40 40 0 0078.17 0H208a16 16 0 0013.8-24.06zM128 216a24 24 0 01-22.62-16h45.24A24 24 0 01128 216z" fill="currentColor"/></svg>`,
    'magnifying-glass': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M229.66 218.34l-50.07-50.07a88 88 0 10-11.31 11.31l50.06 50.07a8 8 0 0011.32-11.31zM40 112a72 72 0 1172 72 72.08 72.08 0 01-72-72z" fill="currentColor"/></svg>`,
    'arrows-in': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M213.66 42.34a8 8 0 010 11.32L160.38 107H192a8 8 0 010 16h-48a8 8 0 01-8-8V67a8 8 0 0116 0v31.63l53.34-53.29a8 8 0 0111.32 0zM115 149a8 8 0 00-11.32 0L50.38 202.37 50 171a8 8 0 00-16 0v48a8 8 0 008 8h48a8 8 0 000-16H58.37L112 157a8 8 0 003-6.06 8 8 0 00-3-1.94z" fill="currentColor"/></svg>`,
    'arrows-out': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M213.66 42.34a8 8 0 010 11.32l-52 52H192a8 8 0 010 16h-48a8 8 0 01-8-8V65.37l-41.37 41.29A8 8 0 0183.31 95.34l52-52a8 8 0 0111.32 0zM152 181.37V192h-31.63l52-52a8 8 0 00-11.32-11.32L115 175.37V144a8 8 0 00-16 0v48a8 8 0 008 8h48a8 8 0 000-16z" fill="currentColor"/></svg>`,
    'x': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M205.66 194.34a8 8 0 01-11.32 11.32L128 139.31l-66.34 66.35a8 8 0 01-11.32-11.32L116.69 128 50.34 61.66a8 8 0 0111.32-11.32L128 116.69l66.34-66.35a8 8 0 0111.32 11.32L139.31 128z" fill="currentColor"/></svg>`,
    'dots-three': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M140 128a12 12 0 11-12-12 12 12 0 0112 12zm56-12a12 12 0 100 24 12 12 0 000-24zm-136 0a12 12 0 100 24 12 12 0 000-24z" fill="currentColor"/></svg>`,
    'plus': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M224 128a8 8 0 01-8 8h-80v80a8 8 0 01-16 0v-80H40a8 8 0 010-16h80V40a8 8 0 0116 0v80h80a8 8 0 018 8z" fill="currentColor"/></svg>`,
    'caret-down': `<svg width="12" height="12" viewBox="0 0 256 256" fill="none"><path d="M213.66 101.66l-80 80a8 8 0 01-11.32 0l-80-80a8 8 0 0111.32-11.32L128 164.69l74.34-74.35a8 8 0 0111.32 11.32z" fill="currentColor"/></svg>`,
    'clock': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M128 24a104 104 0 100 208A104 104 0 00128 24zm0 192a88 88 0 110-176 88 88 0 010 176zm64-88a8 8 0 01-8 8h-56a8 8 0 01-8-8V72a8 8 0 0116 0v48h48a8 8 0 018 8z" fill="currentColor"/></svg>`,
    'warning': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M236.8 188.09L149.35 36.22a24.76 24.76 0 00-42.7 0L19.2 188.09a23.51 23.51 0 000 23.72A24.35 24.35 0 0040.55 224h174.9a24.35 24.35 0 0021.33-12.19 23.51 23.51 0 00.02-23.72zm-13.87 15.71a8.3 8.3 0 01-7.48 4.2H40.55a8.3 8.3 0 01-7.48-4.2 7.59 7.59 0 010-7.72l87.45-151.87a8.76 8.76 0 0115 0L223 196.08a7.59 7.59 0 01-.07 7.72zM120 144v-40a8 8 0 0116 0v40a8 8 0 01-16 0zm20 36a12 12 0 11-12-12 12 12 0 0112 12z" fill="currentColor"/></svg>`,
    'check-circle': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M173.66 98.34a8 8 0 010 11.32l-56 56a8 8 0 01-11.32 0l-24-24a8 8 0 0111.32-11.32L112 148.69l50.34-50.35a8 8 0 0111.32 0zM232 128A104 104 0 1128 128a104 104 0 01208 0zm-16 0a88 88 0 10-176 0 88 88 0 00176 0z" fill="currentColor"/></svg>`,
    'copy': `<svg width="16" height="16" viewBox="0 0 256 256" fill="none"><path d="M216 32H88a8 8 0 00-8 8v40H40a8 8 0 00-8 8v128a8 8 0 008 8h128a8 8 0 008-8v-40h40a8 8 0 008-8V40a8 8 0 00-8-8zm-56 176H48V96h112zm48-48h-32V88a8 8 0 00-8-8H96V48h112z" fill="currentColor"/></svg>`
  },

  icon(name, size=18) {
    const svgStr = this.icons[name];
    if (!svgStr) return `<svg width="${size}" height="${size}" viewBox="0 0 256 256"></svg>`;
    return svgStr.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
  },

  render(activeId, breadcrumbs = []) {
    const u = PS.data.currentUser;

    // VeriDex v3 framework bootstrap: light-only, accessible shell, consistent title.
    document.documentElement.dataset.uiFramework = 'veridex-3';
    document.documentElement.dataset.theme = 'light';
    if (!document.querySelector('.skip-link')) {
      const skipLink = document.createElement('a');
      skipLink.className = 'skip-link';
      skipLink.href = '#main-content';
      skipLink.textContent = 'Skip to main content';
      document.body.prepend(skipLink);
    }
    const pageName = breadcrumbs.at(-1)?.label || document.title.split('—')[0].trim() || 'Product Studio';
    document.title = `${pageName} — Product Studio | VeriDex`;

    document.querySelector('.topbar-logo').innerHTML = `
      <div class="topbar-logo-mark">${this.icon('house', 16)}</div>
      <span class="topbar-logo-text">Product Studio</span>
    `;

    // Breadcrumb
    const bcEl = document.querySelector('.topbar-breadcrumb');
    if (bcEl) {
      const allCrumbs = [{ label: 'Studio', href: 'index.html' }, ...breadcrumbs];
      const crumbs = allCrumbs.length > 4
        ? [allCrumbs[0], { label: '…', title: allCrumbs.slice(1, -2).map(c => c.label).join(' › ') }, ...allCrumbs.slice(-2)]
        : allCrumbs;
      bcEl.innerHTML = crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (i > 0 ? `<span class="sep">›</span>` : '') +
          (isLast
            ? `<span class="current" aria-current="page">${c.label}</span>`
            : c.href
              ? `<a href="${c.href}">${c.label}</a>`
              : `<span class="breadcrumb-ellipsis" title="${c.title}" tabindex="0">${c.label}</span>`);
      }).join('');
    }

    // Right side
    document.querySelector('.topbar-right').innerHTML = `
      <div class="topbar-search">
        <span class="topbar-search-icon">${this.icon('magnifying-glass', 14)}</span>
        <input type="search" id="global-search" placeholder="Search products, rules, versions…" aria-label="Global search">
      </div>
      <div class="density-toggle" role="group" aria-label="Data density">
        <button class="density-btn active" id="density-comfortable" aria-pressed="true" onclick="PS.nav.setDensity('comfortable')">Comfortable</button>
        <button class="density-btn" id="density-compact" aria-pressed="false" onclick="PS.nav.setDensity('compact')">Compact</button>
      </div>
      <button class="topbar-icon-btn" id="notif-btn" aria-label="Notifications">
        ${this.icon('bell', 18)}
        <span class="notif-dot"></span>
      </button>
      <button type="button" class="topbar-user" id="topbar-user-btn" onclick="PS.nav.toggleUserMenu()" aria-haspopup="menu" aria-expanded="false">
        <div class="user-avatar ${u.avatarClass}">${u.initials}</div>
        <div class="topbar-user-info">
          <div class="topbar-user-name">${u.name}</div>
          <div class="topbar-user-role">${u.role}</div>
        </div>
        ${this.icon('caret-down', 12)}
      </button>
    `;

    // Sidenav
    const nav = document.querySelector('.sidenav');
    let html = '';
    let inGroup = false;
    for (const item of this.items) {
      if (item.group) {
        if (inGroup) html += '</div>';
        html += `<div class="nav-group"><div class="nav-group-label">${item.group}</div>`;
        inGroup = true;
      } else {
        const active = item.id === activeId ? 'active' : '';
        html += `<a href="${item.href}" class="nav-item ${active}" id="nav-${item.id}" data-tooltip="${item.label}" ${active ? 'aria-current="page"' : ''}>
          ${this.icon(item.icon)}
          <span>${item.label}</span>
        </a>`;
      }
    }
    if (inGroup) html += '</div>';
    html += `<div class="nav-footer">
      <div class="flex-center gap-2 mb-4">
        <div class="user-avatar ${u.avatarClass}" style="width:28px;height:28px;font-size:11px">${u.initials}</div>
        <div>
          <div style="font-size:12px;font-weight:500;color:var(--color-ink)">${u.name}</div>
          <span class="role-badge" style="margin-top:2px">${u.role}</span>
        </div>
      </div>
      <button class="nav-collapse-btn" onclick="PS.nav.toggleCollapse()" id="nav-collapse-btn" aria-label="Collapse navigation" data-tooltip="Collapse navigation">
        ${this.icon('arrows-in', 16)}
        <span>Collapse</span>
      </button>
    </div>`;
    nav.innerHTML = html;

    // Restore density
    const density = localStorage.getItem('ps-density') || 'comfortable';
    this.setDensity(density, true);

    // Restore nav collapse
    if (localStorage.getItem('ps-nav-collapsed') === 'true') {
      document.querySelector('.shell').classList.add('nav-collapsed');
      document.getElementById('nav-collapse-btn')?.setAttribute('aria-label', 'Expand navigation');
      document.getElementById('nav-collapse-btn')?.setAttribute('data-tooltip', 'Expand navigation');
    }

    // Show clear labels beside icons when the navigation is collapsed.
    nav.onmouseover = (event) => this.showCollapsedTooltip(event.target.closest('[data-tooltip]'));
    nav.onfocusin = (event) => this.showCollapsedTooltip(event.target.closest('[data-tooltip]'));
    nav.onmouseout = (event) => {
      if (!event.relatedTarget?.closest?.('[data-tooltip]')) this.hideCollapsedTooltip();
    };
    nav.onfocusout = () => this.hideCollapsedTooltip();

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#topbar-user-btn')) {
        document.getElementById('user-dropdown')?.remove();
        document.getElementById('topbar-user-btn')?.setAttribute('aria-expanded', 'false');
      }
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(m => {
          if (!m.closest('[data-keep]')) m.classList.add('hidden');
        });
      }
    });
  },

  setDensity(mode, silent = false) {
    document.body.classList.toggle('compact', mode === 'compact');
    localStorage.setItem('ps-density', mode);
    document.getElementById('density-comfortable')?.classList.toggle('active', mode === 'comfortable');
    document.getElementById('density-compact')?.classList.toggle('active', mode === 'compact');
    document.getElementById('density-comfortable')?.setAttribute('aria-pressed', mode === 'comfortable' ? 'true' : 'false');
    document.getElementById('density-compact')?.setAttribute('aria-pressed', mode === 'compact' ? 'true' : 'false');
  },

  toggleCollapse() {
    const shell = document.querySelector('.shell');
    const collapsed = shell.classList.toggle('nav-collapsed');
    localStorage.setItem('ps-nav-collapsed', collapsed);
    const btn = document.getElementById('nav-collapse-btn');
    if (btn) {
      btn.querySelector('svg').outerHTML; // force re-render
      btn.innerHTML = collapsed
        ? `${PS.nav.icon('arrows-out', 16)}<span>Expand</span>`
        : `${PS.nav.icon('arrows-in', 16)}<span>Collapse</span>`;
      const label = collapsed ? 'Expand navigation' : 'Collapse navigation';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('data-tooltip', label);
    }
    this.hideCollapsedTooltip();
  },

  showCollapsedTooltip(target) {
    const isCollapsed = document.querySelector('.shell')?.classList.contains('nav-collapsed') || window.matchMedia('(max-width: 1100px)').matches;
    if (!target || !isCollapsed) return;
    let tooltip = document.getElementById('nav-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'nav-tooltip';
      tooltip.className = 'nav-tooltip';
      tooltip.setAttribute('role', 'tooltip');
      document.body.appendChild(tooltip);
    }
    tooltip.textContent = target.dataset.tooltip;
    const rect = target.getBoundingClientRect();
    tooltip.style.left = `${rect.right + 10}px`;
    tooltip.style.top = `${Math.max(8, rect.top + (rect.height - tooltip.offsetHeight) / 2)}px`;
    tooltip.classList.add('visible');
    target.setAttribute('aria-describedby', 'nav-tooltip');
    this._tooltipTarget = target;
  },

  hideCollapsedTooltip() {
    document.getElementById('nav-tooltip')?.classList.remove('visible');
    this._tooltipTarget?.removeAttribute('aria-describedby');
    this._tooltipTarget = null;
  },

  toggleUserMenu() {
    const existing = document.getElementById('user-dropdown');
    const trigger = document.getElementById('topbar-user-btn');
    if (existing) { existing.remove(); trigger?.setAttribute('aria-expanded', 'false'); return; }
    const menu = document.createElement('div');
    menu.id = 'user-dropdown';
    menu.className = 'dropdown-menu';
    menu.setAttribute('role', 'menu');
    menu.style.cssText = 'position:fixed;right:24px;top:52px;z-index:999;';
    menu.innerHTML = `
      <div style="padding:10px 16px;border-bottom:1px solid var(--color-border)">
        <div style="font-size:13px;font-weight:500">${PS.data.currentUser.name}</div>
        <div style="font-size:12px;color:var(--color-muted)">Role: ${PS.data.currentUser.role}</div>
      </div>
      <div style="padding:8px 0;border-bottom:1px solid var(--color-border)">
        <div style="font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--color-muted);padding:4px 16px 4px">Switch Role</div>
        ${['Product Manager','Pricing Actuary','Underwriting Manager','Compliance Officer','Publisher','Administrator'].map(r =>
          `<div class="dropdown-item" onclick="PS.nav.switchRole('${r}')" style="font-size:13px">${r}</div>`
        ).join('')}
      </div>
      <div class="dropdown-item danger" style="font-size:13px">Sign out</div>
    `;
    document.body.appendChild(menu);
    trigger?.setAttribute('aria-expanded', 'true');
  },

  switchRole(role) {
    PS.data.currentUser.role = role;
    const initials = role.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
    PS.data.currentUser.initials = initials;
    document.getElementById('user-dropdown')?.remove();
    location.reload();
  }
};

/* ── Toast helper ─────────────────────────────────────────── */
PS.actionResult = function(type, title, desc, autoDismiss = true) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const iconMap = { success: 'check-circle', error: 'x', warning: 'warning', info: 'bell' };
  const colorMap = { success: 'var(--color-success)', error: 'var(--color-danger)', warning: 'var(--color-warning)', info: 'var(--color-info)' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `
    <div class="toast-icon" style="color:${colorMap[type]}">${PS.nav.icon(iconMap[type], 18)}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${desc ? `<div class="toast-desc">${desc}</div>` : ''}
    </div>
    <div class="toast-close" onclick="this.closest('.toast').remove()">${PS.nav.icon('x', 14)}</div>
  `;
  container.appendChild(t);
  if (type === 'error') autoDismiss = false;
  if (autoDismiss) setTimeout(() => t.remove(), 5000);
};

/* ── Modal helper ─────────────────────────────────────────── */
PS.openModal = function(html, sizeClass = '') {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal-overlay';
  overlay.innerHTML = `<div class="modal ${sizeClass}" role="dialog" aria-modal="true">${html}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) PS.closeModal(); });
  document.addEventListener('keydown', PS._modalEsc);
  document.body.appendChild(overlay);
};
PS._modalEsc = (e) => { if (e.key === 'Escape') PS.closeModal(); };
PS.closeModal = function() {
  document.getElementById('active-modal-overlay')?.remove();
  document.removeEventListener('keydown', PS._modalEsc);
};

/* ── Dropdown toggle helper ───────────────────────────────── */
PS.toggleDropdown = function(btn, menuEl) {
  const visible = !menuEl.classList.contains('hidden');
  document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
  if (!visible) menuEl.classList.remove('hidden');
};
