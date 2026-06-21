(function () {
  const categorySelect = document.querySelector('[name="category"]');
  const visibility = window.APP_VISIBILITY || {};
  const sectionFields = window.APP_SECTIONS || {};
  const lodgingRemarksByCategory = window.APP_LODGING_REMARKS_BY_CATEGORY || {};
  const flightGroupByCategory = window.APP_FLIGHT_GROUP_BY_CATEGORY || {};
  const lodgingGroupByCategory = window.APP_LODGING_GROUP_BY_CATEGORY || {};

  const requiredFields = new Set([
    'jobTitle', 'functionUnit', 'businessUnit', 'globalId',
    'salutation', 'firstName', 'surname', 'nameOnTag', 'gender',
    'mobileCountryCode', 'mobileAreaCode', 'mobileNumber',
    'dietaryRequirements', 'galaMainCourse', 'shirtSize', 'specialPhysicalCondition',
    'arrivalDate', 'arrivalTime', 'airlineRegistration', 'arrivalFlightNo', 'airportPickup',
    'departureDate', 'departureTime', 'departureAirline', 'departureFlightNo', 'airportDropoff',
    'accommodationRequired', 'tourSelection', 'emergencyName', 'emergencyContactNumber',
    'emergencyRelationship', 'agreement',
    'nameOnPassport', 'passportNumber', 'nationality', 'passportPlaceIssue',
    'passportIssueDate', 'passportExpiryDate', 'dateOfBirth', 'checkInDate', 'checkOutDate', 'bedType',
  ]);

  function setFieldRequired(fieldEl, required) {
    fieldEl.querySelectorAll('input, select, textarea').forEach((input) => {
      if (input.type === 'radio' || input.type === 'checkbox') return;
      input.required = required;
    });
    fieldEl.querySelectorAll('input[type="radio"]').forEach((r) => {
      r.required = required;
    });
  }

  function getAccommodationAnswer() {
    const selected = document.querySelector('[name="accommodationRequired"]:checked');
    return selected ? selected.value : '';
  }

  function isLodgingField(id) {
    return (sectionFields.lodging || []).includes(id);
  }

  function getLodgingRemarks(category) {
    if (category in lodgingRemarksByCategory) {
      return lodgingRemarksByCategory[category] !== false;
    }
    return true;
  }

  function updateCopyBlocks(category) {
    const flightGroup = flightGroupByCategory[category];
    document.querySelectorAll('[data-flight-copy-group]').forEach((el) => {
      if (el.dataset.flightBlock === 'bottom') return;
      el.hidden = el.dataset.flightCopyGroup !== flightGroup;
    });
    document.querySelectorAll('[data-flight-copy-category]').forEach((el) => {
      if (el.dataset.flightBlock !== 'bottom') return;
      el.hidden = el.dataset.flightCopyCategory !== category;
    });

    const lodgingGroup = lodgingGroupByCategory[category];
    const lodgingRemarks = getLodgingRemarks(category);
    document.querySelectorAll('[data-lodging-copy-group]').forEach((el) => {
      if (el.dataset.lodgingBlock === 'remarks') return;
      el.hidden = el.dataset.lodgingCopyGroup !== lodgingGroup;
    });
    document.querySelectorAll('[data-lodging-copy-category]').forEach((el) => {
      if (el.dataset.lodgingBlock !== 'remarks') return;
      el.hidden = el.dataset.lodgingCopyCategory !== category || !lodgingRemarks;
    });
  }

  function applyVisibility(category) {
    const map = visibility[category] || {};
    const accommodationAnswer = getAccommodationAnswer();
    const lodgingVisible = accommodationAnswer === 'Yes';
    const lodgingRemarks = getLodgingRemarks(category);

    document.querySelectorAll('[data-app-field]').forEach((el) => {
      const id = el.dataset.appField;
      if (id === 'specialPhysicalConditionYes' || id === 'functionUnitOthers') return;

      let visible = map[id] === true;

      if (isLodgingField(id)) {
        visible = lodgingVisible;
        if (!lodgingRemarks && id === 'otherRequests') {
          visible = false;
        }
      }

      el.classList.toggle('app-field--hidden', !visible);
      if (requiredFields.has(id)) {
        setFieldRequired(el, visible);
      } else {
        setFieldRequired(el, false);
      }
    });

    document.querySelectorAll('[data-app-section-wrap]').forEach((wrap) => {
      const sectionId = wrap.dataset.appSectionWrap;
      let visible = false;
      if (sectionId === 'lodging') {
        visible = lodgingVisible && map.accommodationRequired === true;
      } else if (sectionId === 'profileSummary') {
        const ids = sectionFields.profileSummary || [];
        visible = ids.some((id) => id === 'category' || id === 'accountUserId' || map[id] === true);
      } else {
        const ids = sectionFields[sectionId] || [];
        visible = ids.some((id) => !isLodgingField(id) && map[id] === true);
      }
      wrap.classList.toggle('app-field--hidden', !visible);
    });

    toggleSpecialPhysicalDetail(map);
    toggleFunctionUnitOthers(map);
    updateCopyBlocks(category);
  }

  function toggleFunctionUnitOthers(map) {
    const othersWrap = document.getElementById('functionUnitOthersWrap');
    if (!othersWrap) return;
    const baseVisible = map.functionUnit === true;
    const functionUnit = document.querySelector('[name="functionUnit"]');
    const show = baseVisible && functionUnit && functionUnit.value === 'Others';
    othersWrap.classList.toggle('app-field--hidden', !show);
    const input = othersWrap.querySelector('input');
    if (input) input.required = show;
  }

  function toggleSpecialPhysicalDetail(map) {
    const detailWrap = document.querySelector('[data-app-field="specialPhysicalConditionYes"]');
    if (!detailWrap) return;
    const baseVisible = map.specialPhysicalCondition === true;
    const selected = document.querySelector('[name="specialPhysicalCondition"]');
    const show = baseVisible && selected && selected.value === 'Yes';
    detailWrap.classList.toggle('app-field--hidden', !show);
  }

  function clearRequiredOnHiddenFields() {
    document.querySelectorAll('[data-app-field]').forEach((el) => {
      const sectionHidden = el.closest('[data-app-section-wrap].app-field--hidden');
      const fieldHidden = el.classList.contains('app-field--hidden');
      if (fieldHidden || sectionHidden) {
        setFieldRequired(el, false);
      }
    });
  }

  function handleFormSubmit(e) {
    const form = e.currentTarget;
    const submitter = e.submitter;
    const action = submitter?.getAttribute('value') ?? submitter?.value ?? '';

    // Save Section / Save Draft / Save Changes — no validation
    if (action === 'save' || submitter?.hasAttribute('formnovalidate')) {
      return;
    }

    // Submit Application — validate visible fields only
    if (action === 'submit') {
      clearRequiredOnHiddenFields();
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
      }
      const category = categorySelect?.value || window.APP_CATEGORY || '';
      applyVisibility(category);
    }
  }

  function init() {
    const category = window.APP_CATEGORY || categorySelect?.value || '';
    if (category && categorySelect) categorySelect.value = category;
    applyVisibility(category);

    categorySelect?.addEventListener('change', () => applyVisibility(categorySelect.value));
    document.querySelectorAll('[name="accommodationRequired"]').forEach((r) => {
      r.addEventListener('change', () => applyVisibility(categorySelect?.value || ''));
    });
    document.querySelector('[name="specialPhysicalCondition"]')?.addEventListener('change', () => {
      applyVisibility(categorySelect?.value || '');
    });
    document.querySelector('[name="functionUnit"]')?.addEventListener('change', () => {
      applyVisibility(categorySelect?.value || '');
    });

    document.getElementById('applicationForm')?.addEventListener('submit', handleFormSubmit);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
