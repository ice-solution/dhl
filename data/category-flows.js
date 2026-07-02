/**
 * Category workflow types from resource/*.png
 * awardees | gmb | oc | kr_smt | others
 */
const { APPLICATION_SECTION_ORDER } = require('./form-field-order');
const { resolveCategory } = require('./category-aliases');

const AWARDEES_CATEGORIES = [
  'Employee of the Year - Overall Excellence',
  'Supervisor of the Year',
  "DHL's Got Heart Finalist",
  'Others',
];

const GMB_FLOW_CATEGORIES = [
  'GMB',
  'APMB',
  'AP Country Manager',
  'AP Hub Manager',
];

const CATEGORY_TO_FLOW = {};

AWARDEES_CATEGORIES.forEach((c) => { CATEGORY_TO_FLOW[c] = 'awardees'; });
GMB_FLOW_CATEGORIES.forEach((c) => { CATEGORY_TO_FLOW[c] = 'gmb'; });
CATEGORY_TO_FLOW['Organising Committee'] = 'oc';
CATEGORY_TO_FLOW['KR SMT'] = 'kr_smt';
CATEGORY_TO_FLOW['VN SMT'] = 'kr_smt'; // legacy records
CATEGORY_TO_FLOW.Guests = 'others';
CATEGORY_TO_FLOW.Others = 'awardees';
CATEGORY_TO_FLOW['Employee of the Year - Sales Excellence'] = 'awardees'; // legacy records

function getFlowType(category) {
  return CATEGORY_TO_FLOW[resolveCategory(category)] || 'gmb';
}

const FLOW_SECTIONS = {
  awardees: APPLICATION_SECTION_ORDER,
  gmb: APPLICATION_SECTION_ORDER.filter((s) => s !== 'tour' && s !== 'photo'),
  oc: APPLICATION_SECTION_ORDER.filter((s) => s !== 'tour' && s !== 'photo'),
  kr_smt: APPLICATION_SECTION_ORDER.filter((s) => s !== 'tour' && s !== 'photo'),
  others: APPLICATION_SECTION_ORDER.filter((s) => s !== 'tour' && s !== 'photo'),
};

/** Fields only in specific flows (workflow overrides xlsx for Part 2 second half) */
const FLOW_FIELD_RULES = {
  awardees: {
    specialPhysicalCondition: true,
    shirtSize: true,
    globalId: true,
    flight: true,
    tour: true,
    photo: true,
    lodgingRemarks: true,
  },
  gmb: {
    specialPhysicalCondition: false,
    shirtSize: false,
    globalId: false,
    flight: true,
    tour: false,
    photo: false,
    lodgingRemarks: false,
  },
  oc: {
    specialPhysicalCondition: false,
    shirtSize: true,
    flight: true,
    tour: false,
    photo: false,
    lodgingRemarks: true,
  },
  kr_smt: {
    specialPhysicalCondition: true,
    shirtSize: false,
    flight: true,
    tour: false,
    photo: false,
    lodgingRemarks: false,
  },
  others: {
    specialPhysicalCondition: false,
    shirtSize: false,
    flight: true,
    tour: false,
    photo: false,
    lodgingRemarks: true,
  },
};

/** Per-category overrides */
const CATEGORY_RULE_OVERRIDES = {
  'KR SMT': {
    flight: false,
    excludedSections: ['flight', 'accommodation', 'lodging'],
  },
  'VN SMT': {
    flight: false,
    excludedSections: ['flight', 'accommodation', 'lodging'],
  },
};

function getFlowSections(category) {
  const resolved = resolveCategory(category);
  const flow = getFlowType(resolved);
  let sections = FLOW_SECTIONS[flow] || FLOW_SECTIONS.gmb;
  const override = CATEGORY_RULE_OVERRIDES[resolved] || CATEGORY_RULE_OVERRIDES[category];
  if (override?.excludedSections?.length) {
    sections = sections.filter((s) => !override.excludedSections.includes(s));
  }
  return sections;
}

function getFlowRules(category) {
  const resolved = resolveCategory(category);
  const flow = getFlowType(resolved);
  const rules = { ...(FLOW_FIELD_RULES[flow] || FLOW_FIELD_RULES.gmb) };
  const override = CATEGORY_RULE_OVERRIDES[resolved] || CATEGORY_RULE_OVERRIDES[category];
  if (override?.flight === false) {
    rules.flight = false;
  }
  if (override?.lodgingWithoutAccommodation) {
    rules.lodgingWithoutAccommodation = true;
  }
  return rules;
}

function isFlowSectionEnabled(category, sectionId) {
  return getFlowSections(category).includes(sectionId);
}

module.exports = {
  AWARDEES_CATEGORIES,
  GMB_FLOW_CATEGORIES,
  CATEGORY_TO_FLOW,
  CATEGORY_RULE_OVERRIDES,
  FLOW_SECTIONS,
  resolveCategory,
  getFlowType,
  getFlowSections,
  getFlowRules,
  isFlowSectionEnabled,
};
