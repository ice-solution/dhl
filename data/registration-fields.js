const entitlements = require('./field-entitlements.json');
const { entitlementKey } = require('./category-aliases');
const { sortByEntitlementOrder } = require('./form-field-order');

const FIELD_MAP = {
  job_title: { id: 'jobTitle', label: 'Job Title', type: 'text', required: true, section: 'part1' },
  function_unit: { id: 'functionUnit', label: 'Function Unit', type: 'select', optionsKey: 'functionUnit', required: true, section: 'part1' },
  business_unit: { id: 'businessUnit', label: 'Business Unit', type: 'select', optionsKey: 'businessUnit', required: true, section: 'part1' },
  work_email_address: { id: 'workEmail', label: 'Work Email Address', type: 'email', required: true, section: 'part1' },
  password: { id: 'password', label: 'Password', type: 'password', required: true, section: 'part1' },
  conirm_password: { id: 'confirmPassword', label: 'Confirm Password', type: 'password', required: true, section: 'part1' },
  salutation: { id: 'salutation', label: 'Salutation', type: 'select', optionsKey: 'salutation', required: true, section: 'part2a' },
  surname_as_in_passport: { id: 'surname', label: 'Surname (As in Passport)', type: 'text', required: true, section: 'part2a' },
  given_name_as_in_passport: { id: 'givenName', label: 'Given Name (As in Passport)', type: 'text', required: true, section: 'part2a' },
  name_to_be_printed_on_badge: { id: 'nameOnBadge', label: 'Name to be printed on badge', type: 'text', required: true, section: 'part2a' },
  gender: { id: 'gender', label: 'Gender', type: 'select', optionsKey: 'gender', required: true, section: 'part2a' },
  office_phone: { id: 'officePhone', label: 'Office Phone', type: 'phone', required: false, section: 'part2a' },
  mobile_phone: { id: 'mobilePhone', label: 'Mobile Phone', type: 'phone', required: true, section: 'part2a' },
  special_physical_condition: { id: 'specialPhysicalCondition', label: 'Special Physical Condition', type: 'yesno', required: true, section: 'part2a' },
  special_dietary_requirements: { id: 'dietaryRequirements', label: 'Special Dietary Requirements', type: 'checkboxes', required: true, section: 'part2b' },
  other_dietary_requirments_food_allegies_if_any: { id: 'otherDietaryRequirements', label: 'Other Dietary Requirements / Food Allergies (if any)', type: 'text', required: false, section: 'part2b' },
  gala_dinner_main_course: { id: 'galaMainCourse', label: 'Gala Dinner Main Course', type: 'select', optionsKey: 'galaMainCourse', required: true, section: 'part2b' },
  t_shirt_size: { id: 'shirtSize', label: 'T-shirt size', type: 'select', optionsKey: 'shirtSize', required: true, section: 'part2b' },
};

const DIETARY_OPTIONS = [
  'No Preference',
  'Halal - No Pork / No Lard',
  'Strict Halal',
  'No Beef',
  'No Spicy',
  'No Raw Food',
  'No Seafood',
  'Vegetarian',
  'Vegan',
  'Gluten Free',
];

function isFieldVisible(fieldKey, category) {
  if (!category) return false;
  const ent = entitlements.fields.find((f) => f.key === fieldKey);
  if (!ent) return true;
  const key = entitlementKey(category);
  return ent.visibility[key] === true;
}

function getRegistrationFields(category) {
  const fields = entitlements.fields
    .filter((f) => FIELD_MAP[f.key] && f.key !== 'category_dropdown_list')
    .map((f) => ({
      ...FIELD_MAP[f.key],
      entKey: f.key,
      visible: isFieldVisible(f.key, category),
    }))
    .filter((f) => f.visible);

  return sortByEntitlementOrder(fields, (f) => f.entKey);
}

function getFieldsBySection(category) {
  const fields = getRegistrationFields(category);
  return {
    part1: fields.filter((f) => f.section === 'part1'),
    part2a: fields.filter((f) => f.section === 'part2a'),
    part2b: fields.filter((f) => f.section === 'part2b'),
  };
}

function getVisibilityMatrix(categoryValues) {
  const matrix = {};
  categoryValues
    .filter((value) => value)
    .forEach((category) => {
      matrix[category] = {};
      Object.entries(FIELD_MAP).forEach(([entKey, field]) => {
        matrix[category][field.id] = isFieldVisible(entKey, category);
      });
    });
  return matrix;
}

function formatPhone(countryCode, areaCode, number) {
  const parts = [countryCode, areaCode, number].map((p) => (p || '').trim()).filter(Boolean);
  return parts.length ? parts.join(' - ') : '—';
}

function getConfirmDisplay(category, body, resolveLabel) {
  const fields = getRegistrationFields(category);
  const part1 = [{ label: 'Category', value: category || '—' }];
  const part2 = [];

  fields.forEach((field) => {
    if (field.id === 'password' || field.id === 'confirmPassword') return;

    let value = '—';

    switch (field.id) {
      case 'functionUnit':
        value = body.functionUnit || '—';
        if (body.functionUnit === 'Others' && body.functionUnitOthers) {
          value = body.functionUnitOthers;
        }
        break;
      case 'officePhone':
        value = formatPhone(body.officeTelCountry, body.officeTelArea, body.officeTel);
        break;
      case 'mobilePhone':
        value = formatPhone(body.mobileCountry, body.mobileArea, body.mobileNumber);
        break;
      case 'gender':
        value = resolveLabel('gender', body.gender) || body.gender || '—';
        break;
      case 'specialPhysicalCondition': {
        const base = body.specialPhysicalCondition || '—';
        value = base === 'Yes' && body.specialPhysicalConditionDetail
          ? `${base} (${body.specialPhysicalConditionDetail})`
          : base;
        break;
      }
      case 'dietaryRequirements': {
        const diets = Array.isArray(body.dietaryRequirements)
          ? body.dietaryRequirements
          : body.dietaryRequirements ? [body.dietaryRequirements] : [];
        value = diets.length ? diets.join(', ') : '—';
        break;
      }
      case 'galaMainCourse':
      case 'businessUnit':
      case 'salutation':
      case 'shirtSize':
        value = resolveLabel(field.optionsKey || field.id, body[field.id]) || body[field.id] || '—';
        break;
      default:
        value = body[field.id] || '—';
    }

    const item = { label: field.label, value };
    if (field.section === 'part1') part1.push(item);
    else part2.push(item);
  });

  return { part1, part2 };
}

function normalizeRegistrationBody(body) {
  const dietaryRequirements = Array.isArray(body.dietaryRequirements)
    ? body.dietaryRequirements
    : body.dietaryRequirements ? [body.dietaryRequirements] : [];

  return {
    ...body,
    workEmail: body.workEmail?.trim().toLowerCase() || '',
    dietaryRequirements,
    photoConsent: !!body.photoConsent,
  };
}

module.exports = {
  DIETARY_OPTIONS,
  isFieldVisible,
  getRegistrationFields,
  getFieldsBySection,
  getVisibilityMatrix,
  getConfirmDisplay,
  normalizeRegistrationBody,
  FIELD_MAP,
};
