const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function previewImage(view, { eager = false } = {}) {
  const widths = view.widths || [960, 1600, 2400];
  return `<img src="${escape(view.base)}-${widths[0]}.webp" srcset="${widths.map(w => `${escape(view.base)}-${w}.webp ${w}w`).join(', ')}" sizes="(max-width: 900px) calc(100vw - 40px), min(100vw - 80px, 1220px)" width="${view.width}" height="${view.height}" alt="${escape(view.alt)}" loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''} decoding="async">`;
}

function websitePreview(project) {
  const views = Object.entries(project.preview);
  const desktop = project.preview.desktop;
  const id = `preview-${project.slug}`;
  return `<figure class="browser-preview" data-website-preview data-preview-layout="desktop" data-preview-title="${escape(project.name)}" data-preview-id="${id}">
    <div class="browser-preview-toolbar"><span class="browser-preview-lights" aria-hidden="true"><i></i><i></i><i></i></span><span class="browser-preview-domain">${escape(project.domain)}</span><span class="browser-preview-label">Screenshot preview</span></div>
    ${views.length > 1 ? `<div class="browser-preview-views" role="group" aria-label="Screenshot layout" hidden>${views.map(([key]) => `<button type="button" class="button button-secondary" data-preview-view="${key}" aria-pressed="${key === 'desktop'}">${key === 'desktop' ? 'Desktop' : 'Mobile'}</button>`).join('')}</div>` : ''}
    <div class="browser-preview-scroll" tabindex="0" role="region" aria-label="Scrollable desktop screenshot of ${escape(project.name)}" aria-describedby="${id}-hint">${previewImage(desktop, {eager:true})}</div>
    <figcaption class="browser-preview-footer"><div id="${id}-hint"><span class="preview-scroll-hint"><span aria-hidden="true">↓</span> Scroll to explore</span><span class="preview-disclaimer">Desktop screenshot. Pictured controls are not interactive.</span></div><a class="button button-secondary" data-preview-expand href="${escape(desktop.base)}-2400.webp" target="_blank" rel="noopener noreferrer">Expand preview <span aria-hidden="true">↗</span></a></figcaption>
    ${views.length > 1 ? views.map(([key, view]) => `<template data-preview-variant="${key}">${previewImage(view)}</template>`).join('') : ''}
  </figure>`.replace(/[ \t]+$/gm, '');
}

module.exports = { websitePreview };
