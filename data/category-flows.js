/**
 * Category workflow types from resource/*.png
 * awardees | gmb | oc | kr_smt | others
 */
const { APPLICATION_SECTION_ORDER } = require('./form-field-order');

const AWARDEES_CATEGORIES = [
  'Employee of the Year - Overall Excellence',
  'Employee of the Year - Sales Excellence',
  'Supervisor of the Year',
  "DHL's Got Heart Finalist",
];

const GMB_FLOW_CATEGORIES = [
  'GMB',
  'APMB',
  'AP Country Manager',
  'AP Hub Manager',
  'GHO',
];

const CATEGORY_TO_FLOW = {};

AWARDEES_CATEGORIES.forEach((c) => { CATEGORY_TO_FLOW[c] = 'awardees'; });
GMB_FLOW_CATEGORIES.forEach((c) => { CATEGORY_TO_FLOW[c] = 'gmb'; });
CATEGORY_TO_FLOW['Organising Committee'] = 'oc';
CATEGORY_TO_FLOW['KR SMT'] = 'kr_smt';
CATEGORY_TO_FLOW['VN SMT'] = 'kr_smt'; // legacy records
CATEGORY_TO_FLOW.Others = 'others';

/** Section order per workflow diagram (aligned with OVERVIEW FORM SUMMARY) */
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
    lodgingRemarks: true,
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
    excludedSections: ['flight'],
  },
  'VN SMT': {
    flight: false,
    excludedSections: ['flight'],
  },
};

function getFlowType(category) {
  return CATEGORY_TO_FLOW[category] || 'gmb';
}

function getFlowSections(category) {
  const flow = getFlowType(category);
  let sections = FLOW_SECTIONS[flow] || FLOW_SECTIONS.gmb;
  const override = CATEGORY_RULE_OVERRIDES[category];
  if (override?.excludedSections?.length) {
    sections = sections.filter((s) => !override.excludedSections.includes(s));
  }
  return sections;
}

function getFlowRules(category) {
  const flow = getFlowType(category);
  const rules = { ...(FLOW_FIELD_RULES[flow] || FLOW_FIELD_RULES.gmb) };
  const override = CATEGORY_RULE_OVERRIDES[category];
  if (override?.flight === false) {
    rules.flight = false;
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
  FLOW_SECTIONS,
  getFlowType,
  getFlowSections,
  getFlowRules,
  isFlowSectionEnabled,
};
