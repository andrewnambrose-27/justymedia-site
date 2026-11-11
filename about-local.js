/* Progressive enhancement: all coverage copy and the enquiry link live in HTML. */
(function () {
  const section = document.querySelector('[data-local-coverage]');
  if (!section) return;

  const towns = [...section.querySelectorAll('[data-town]')];
  const heading = section.querySelector('[data-town-heading]');
  if (!towns.length || !heading) return;

  function selectTown(town) {
    for (const control of towns) {
      control.setAttribute('aria-pressed', String(control === town));
    }
    heading.textContent = `Have a project in ${town.dataset.town}?`;
  }

  for (const town of towns) {
    town.addEventListener('click', () => selectTown(town));
    town.disabled = false;
  }
  section.querySelector('[data-map-instruction]').hidden = false;
  selectTown(towns[0]);
})();
