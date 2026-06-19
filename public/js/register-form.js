(function () {
  const categorySelect = document.getElementById('category');
  const fieldsWrap = document.getElementById('regFieldsWrap');
  const visibility = window.REG_VISIBILITY || {};
  const requiredFields = new Set([
    'jobTitle', 'functionUnit', 'businessUnit', 'workEmail', 'globalId', 'password', 'confirmPassword',
    'salutation', 'surname', 'givenName', 'nameOnBadge', 'gender', 'mobilePhone',
    'specialPhysicalCondition', 'dietaryRequirements', 'galaMainCourse', 'shirtSize',
  ]);
  const optionalFields = new Set(['officePhone', 'otherDietaryRequirements']);

  const sectionFields = {
    part2: [
      'salutation', 'surname', 'givenName', 'nameOnBadge', 'gender', 'officePhone',
      'mobilePhone', 'specialPhysicalCondition', 'dietaryRequirements', 'otherDietaryRequirements',
      'galaMainCourse', 'shirtSize',
    ],
  };

  function setFieldRequired(fieldEl, required) {
    fieldEl.querySelectorAll('input, select, textarea').forEach((input) => {
      if (input.type === 'radio' || input.type === 'checkbox') return;
      input.required = required;
    });
    const radios = fieldEl.querySelectorAll('input[type="radio"]');
    if (radios.length) {
      radios.forEach((r) => { r.required = required; });
    }
  }

  function applyCategoryVisibility(category) {
    const map = visibility[category] || {};
    const showField = (id) => map[id] === true;

    document.querySelectorAll('[data-reg-field]').forEach((el) => {
      const id = el.dataset.regField;
      if (id === 'functionUnitOthers' || id === 'specialPhysicalDetail') return;

      const visible = showField(id);
      el.classList.toggle('reg-field--hidden', !visible);
      if (requiredFields.has(id)) {
        setFieldRequired(el, visible);
      } else if (optionalFields.has(id)) {
        setFieldRequired(el, false);
      }
    });

    Object.entries(sectionFields).forEach(([section, ids]) => {
      const heading = document.querySelector(`[data-reg-section="${section}"]`);
      if (!heading) return;
      const anyVisible = ids.some((id) => showField(id));
      heading.classList.toggle('reg-field--hidden', !anyVisible);
    });

    if (fieldsWrap) {
      fieldsWrap.hidden = !category;
    }

    toggleFunctionUnitOthers();
    toggleSpecialDetail();
  }

  function toggleFunctionUnitOthers() {
    const functionUnit = document.querySelector('[name="functionUnit"]');
    const othersWrap = document.getElementById('functionUnitOthersWrap');
    if (!functionUnit || !othersWrap) return;

    const category = categorySelect?.value || '';
    const map = visibility[category] || {};
    const baseVisible = map.functionUnit === true;
    const show = baseVisible && functionUnit.value === 'Others';

    othersWrap.classList.toggle('reg-field--hidden', !show);
    const input = othersWrap.querySelector('input');
    if (input) input.required = show;
  }

  function toggleSpecialDetail() {
    const specialWrap = document.getElementById('specialPhysicalDetailWrap');
    if (!specialWrap) return;

    const category = categorySelect?.value || '';
    const map = visibility[category] || {};
    const baseVisible = map.specialPhysicalCondition === true;
    const selected = document.querySelector('[name="specialPhysicalCondition"]:checked');
    const show = baseVisible && selected && selected.value === 'Yes';

    specialWrap.classList.toggle('reg-field--hidden', !show);
  }

  function init() {
    if (!categorySelect) return;

    categorySelect.addEventListener('change', () => {
      applyCategoryVisibility(categorySelect.value);
    });

    document.querySelector('[name="functionUnit"]')?.addEventListener('change', toggleFunctionUnitOthers);
    document.querySelectorAll('[name="specialPhysicalCondition"]').forEach((r) => {
      r.addEventListener('change', toggleSpecialDetail);
    });

    const initial = window.REG_SELECTED_CATEGORY || categorySelect.value;
    if (initial) {
      categorySelect.value = initial;
      applyCategoryVisibility(initial);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
