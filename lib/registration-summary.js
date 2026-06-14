const { getConfirmDisplay } = require('../data/registration-fields');
const formOptions = require('../data/form-options');

const EXTRA_OPTIONS = {
  salutation: [
    { value: 'Mr', label: 'Mr' },
    { value: 'Mrs', label: 'Mrs' },
    { value: 'Ms', label: 'Ms' },
    { value: 'Miss', label: 'Miss' },
  ],
  shirtSize: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map((s) => ({ value: s, label: s })),
};

function resolveLabel(key, value) {
  if (!value) return '';
  const options = EXTRA_OPTIONS[key] || formOptions.getOptions(key);
  const match = options.find((o) => String(o.value) === String(value));
  return match?.label || value;
}

function userToRegistrationBody(user) {
  return {
    category: user.category || '',
    jobTitle: user.jobTitle || '',
    functionUnit: user.functionUnit || '',
    functionUnitOthers: user.functionUnitOthers || '',
    businessUnit: user.businessUnit || '',
    workEmail: user.email || user.userId || '',
    salutation: user.salutation || '',
    surname: user.surname || '',
    givenName: user.givenName || '',
    nameOnBadge: user.nameOnBadge || '',
    gender: user.gender || '',
    officeTelCountry: user.officeTel?.countryCode || '',
    officeTelArea: user.officeTel?.areaCode || '',
    officeTel: user.officeTel?.number || '',
    mobileCountry: user.mobile?.countryCode || '',
    mobileArea: user.mobile?.areaCode || '',
    mobileNumber: user.mobile?.number || '',
    specialPhysicalCondition: user.specialPhysicalCondition || '',
    specialPhysicalConditionDetail: user.specialPhysicalConditionDetail || '',
    dietaryRequirements: user.dietaryRequirements || [],
    otherDietaryRequirements: user.otherDietaryRequirements || '',
    galaMainCourse: user.galaMainCourse || '',
    shirtSize: user.shirtSize || '',
  };
}

function buildRegistrationSummary(user) {
  const body = userToRegistrationBody(user);
  const { part1, part2 } = getConfirmDisplay(user.category || '', body, resolveLabel);
  return { accountLogin: part1, profile: part2 };
}

function formatSummarySection(title, items) {
  if (!items.length) return '';
  const lines = items.map(({ label, value }) => `${label}: ${value || '—'}`);
  return `${title}\n${lines.join('\n')}`;
}

function formatRegistrationSummaryText(user) {
  const { accountLogin, profile } = buildRegistrationSummary(user);
  const sections = [
    formatSummarySection('ACCOUNT LOGIN', accountLogin),
    formatSummarySection('PROFILE', profile),
  ].filter(Boolean);
  return sections.join('\n\n');
}

function formatRegistrationSummaryHtml(user) {
  const { accountLogin, profile } = buildRegistrationSummary(user);

  function sectionHtml(title, items) {
    if (!items.length) return '';
    const rows = items
      .map(({ label, value }) => `<tr><td style="padding:4px 12px 4px 0;color:#666;">${label}</td><td style="padding:4px 0;">${value || '—'}</td></tr>`)
      .join('');
    return `<p style="margin:16px 0 8px;font-weight:bold;">${title}</p><table style="border-collapse:collapse;font-size:14px;">${rows}</table>`;
  }

  return [sectionHtml('ACCOUNT LOGIN', accountLogin), sectionHtml('PROFILE', profile)].join('');
}

module.exports = {
  buildRegistrationSummary,
  formatRegistrationSummaryText,
  formatRegistrationSummaryHtml,
};
