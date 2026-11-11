/* Native scrolling and native dialog semantics; no wheel or touch interception. */
(function () {
  'use strict';
  const previews = document.querySelectorAll('[data-website-preview]');

  function mountViews(root) {
    const group = root.querySelector('.browser-preview-views');
    if (!group) return;
    const viewport = root.querySelector('.browser-preview-scroll');
    group.addEventListener('click', (event) => {
      const button = event.target.closest('[data-preview-view]');
      if (!button) return;
      const template = root.querySelector(`template[data-preview-variant="${button.dataset.previewView}"]`);
      if (!template) return;
      viewport.replaceChildren(template.content.cloneNode(true));
      viewport.scrollTop = viewport.scrollLeft = 0;
      root.dataset.previewLayout = button.dataset.previewView;
      viewport.setAttribute('aria-label', `Scrollable ${button.dataset.previewView} screenshot of ${root.dataset.previewTitle}`);
      for (const control of group.querySelectorAll('button')) control.setAttribute('aria-pressed', String(control === button));
      root.querySelector('.preview-disclaimer').textContent = `${button.textContent} screenshot. Pictured controls are not interactive.`;
      const expand = root.querySelector('[data-preview-expand]');
      if (expand) expand.href = viewport.querySelector('img').getAttribute('srcset').split(',').at(-1).trim().split(' ')[0];
    });
    group.hidden = false;
  }

  for (const preview of previews) {
    mountViews(preview);
    const expand = preview.querySelector('[data-preview-expand]');
    if (!expand || typeof HTMLDialogElement === 'undefined') continue;
    expand.setAttribute('aria-haspopup', 'dialog');
    expand.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const dialog = document.createElement('dialog');
      dialog.className = 'website-preview-dialog';
      dialog.setAttribute('aria-labelledby', `${preview.dataset.previewId}-dialog-title`);
      const header = document.createElement('div');
      header.className = 'preview-dialog-heading';
      const title = document.createElement('h2');
      title.id = `${preview.dataset.previewId}-dialog-title`;
      title.textContent = `${preview.dataset.previewTitle} — screenshot preview`;
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'button button-secondary';
      close.textContent = 'Close preview';
      header.append(title, close);
      const expanded = preview.cloneNode(true);
      expanded.removeAttribute('data-website-preview');
      expanded.querySelector('[data-preview-expand]').remove();
      const hint = expanded.querySelector('.browser-preview-footer [id]');
      hint.id += '-expanded';
      expanded.querySelector('.browser-preview-scroll').setAttribute('aria-describedby', hint.id);
      mountViews(expanded);
      dialog.append(header, expanded);
      document.body.append(dialog);
      close.addEventListener('click', () => dialog.close());
      dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
      dialog.addEventListener('close', () => { dialog.remove(); expand.focus({preventScroll:true}); }, {once:true});
      dialog.showModal();
      close.focus();
    });
  }
})();
