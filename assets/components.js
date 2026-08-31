/* ============================================================
   Insurance Product Studio — Shared Component Behaviours
   components.js
   ============================================================ */

window.PS = window.PS || {};

PS.components = {
  statusBadge(status, label) {
    const normalized = String(status || 'draft').toLowerCase().replace(/\s+/g, '-');
    const text = label || normalized.replace(/-/g, ' ');
    return `<span class="badge badge-${normalized}" role="status">${text}</span>`;
  },

  outcomeBadge(outcome, label) {
    const normalized = String(outcome || 'refer').toLowerCase().replace(/\s+/g, '-');
    const text = label || normalized.replace(/-/g, ' ');
    return `<span class="outcome-badge outcome-${normalized}" role="status">${text}</span>`;
  },

  emptyState(title, description, actionHtml = '') {
    return `<div class="empty-state" role="status">
      <div class="empty-state-illustration" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <h3 class="empty-state-title">${title}</h3>
      <p class="empty-state-desc">${description}</p>
      ${actionHtml}
    </div>`;
  },

  enhance(root = document) {
    this.ensureResponsiveWarning();
    this.enhanceBadges(root);
    this.enhanceLabels(root);
    this.enhanceTabs(root);
    this.enhanceTables(root);
    this.enhanceIconButtons(root);
  },

  ensureResponsiveWarning() {
    const copy = 'Insurance Product Studio is optimized for desktop screens (1280px and wider).';
    const existing = document.querySelector('.responsive-warning');
    if (existing) {
      existing.setAttribute('role', 'status');
      if (existing.textContent.replace(/\s+/g, ' ').trim() !== copy) existing.textContent = copy;
      return;
    }
    const warning = document.createElement('div');
    warning.className = 'responsive-warning';
    warning.setAttribute('role', 'status');
    warning.textContent = copy;
    document.body.appendChild(warning);
  },

  enhanceBadges(root) {
    const badges = [
      ...(root.matches?.('.badge, .status-badge, .outcome-badge') ? [root] : []),
      ...root.querySelectorAll('.badge, .status-badge, .outcome-badge')
    ];
    badges.forEach(badge => {
      if (!badge.hasAttribute('role')) badge.setAttribute('role', 'status');
      if (!badge.hasAttribute('aria-label')) {
        badge.setAttribute('aria-label', badge.textContent.replace(/\s+/g, ' ').trim());
      }
    });
  },

  enhanceLabels(root) {
    let sequence = Number(document.documentElement.dataset.controlSequence || 0);
    root.querySelectorAll('label:not([for])').forEach(label => {
      if (label.querySelector('input, select, textarea')) return;
      const fieldRoot = label.closest('.form-group, .detail-field') || label.parentElement;
      const control = fieldRoot?.querySelector('input:not([type="hidden"]), select, textarea');
      if (!control) return;
      if (!control.id) control.id = `ps-control-${++sequence}`;
      label.htmlFor = control.id;
    });
    document.documentElement.dataset.controlSequence = String(sequence);
  },

  enhanceTabs(root) {
    const tablists = [
      ...(root.matches?.('.tabs, .panel-tabs') ? [root] : []),
      ...root.querySelectorAll('.tabs, .panel-tabs')
    ];
    tablists.forEach(tablist => {
      tablist.setAttribute('role', 'tablist');
      tablist.querySelectorAll('.tab-btn, .panel-tab').forEach(tab => {
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
      });
    });
  },

  enhanceTables(root) {
    const relatedTable = root.closest?.('table');
    const tables = [
      ...(root.matches?.('table') ? [root] : []),
      ...(relatedTable ? [relatedTable] : []),
      ...root.querySelectorAll('table')
    ];
    [...new Set(tables)].forEach(table => {
      const newRows = table.querySelectorAll('tbody tr:not([tabindex])');
      newRows.forEach(row => row.tabIndex = -1);
      if (table.dataset.keyboardReady === 'true') return;
      table.dataset.keyboardReady = 'true';
      table.querySelectorAll('tbody tr').forEach(row => row.tabIndex = -1);
      const firstRow = table.querySelector('tbody tr');
      if (firstRow) firstRow.tabIndex = 0;
      table.addEventListener('keydown', event => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        const rows = Array.from(table.querySelectorAll('tbody tr:not([hidden])'));
        if (!rows.length) return;
        const current = event.target.closest('tr');
        let index = Math.max(0, rows.indexOf(current));
        if (event.key === 'ArrowDown') index = Math.min(rows.length - 1, index + 1);
        if (event.key === 'ArrowUp') index = Math.max(0, index - 1);
        if (event.key === 'Home') index = 0;
        if (event.key === 'End') index = rows.length - 1;
        rows.forEach(row => row.tabIndex = -1);
        rows[index].tabIndex = 0;
        rows[index].focus();
        event.preventDefault();
      });
    });
  },

  enhanceIconButtons(root) {
    const buttons = [
      ...(root.matches?.('button.btn-icon, button.topbar-icon-btn') ? [root] : []),
      ...root.querySelectorAll('button.btn-icon, button.topbar-icon-btn')
    ];
    buttons.forEach(button => {
      if (button.hasAttribute('aria-label')) return;
      const label = button.getAttribute('title') || button.textContent.replace(/\s+/g, ' ').trim();
      button.setAttribute('aria-label', label || 'Action');
    });
  }
};

PS._modalState = { opener: null, keyHandler: null };

PS.openModal = function openModal(html, sizeClass = '') {
  PS.closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal-overlay';
  overlay.innerHTML = `<div class="modal ${sizeClass}" role="dialog" aria-modal="true">${html}</div>`;
  const dialog = overlay.firstElementChild;
  dialog.tabIndex = -1;
  const title = dialog.querySelector('.modal-title');
  if (title) {
    title.id = title.id || `modal-title-${Date.now()}`;
    dialog.setAttribute('aria-labelledby', title.id);
  } else {
    dialog.setAttribute('aria-label', 'Dialog');
  }

  PS._modalState.opener = document.activeElement;
  PS._modalState.keyHandler = event => {
    if (event.key === 'Escape') {
      PS.closeModal();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.hidden && el.offsetParent !== null);
    if (!focusable.length) {
      dialog.tabIndex = -1;
      dialog.focus();
      event.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  };

  overlay.addEventListener('click', event => {
    if (event.target === overlay) PS.closeModal();
  });
  document.addEventListener('keydown', PS._modalState.keyHandler);
  document.body.appendChild(overlay);
  document.body.classList.add('modal-open');
  PS.components.enhance(dialog);
  requestAnimationFrame(() => {
    const autofocus = dialog.querySelector('[autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href]');
    (autofocus || dialog).focus();
  });
};

PS.closeModal = function closeModal() {
  const overlay = document.getElementById('active-modal-overlay');
  if (!overlay) return;
  overlay.remove();
  document.body.classList.remove('modal-open');
  if (PS._modalState.keyHandler) document.removeEventListener('keydown', PS._modalState.keyHandler);
  const opener = PS._modalState.opener;
  PS._modalState = { opener: null, keyHandler: null };
  if (opener && document.contains(opener)) opener.focus();
};

document.addEventListener('DOMContentLoaded', () => {
  PS.components.enhance(document);
  const observer = new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) PS.components.enhance(node);
    }));
  });
  observer.observe(document.body, { childList: true, subtree: true });
});
