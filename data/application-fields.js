const entitlements = require('./field-entitlements.json');
const { entitlementKey, hasEntitlementAlias } = require('./category-aliases');
const { APPLICATION_FIELD_ORDER } = require('./form-field-order');
const {
  getFlowType,
  getFlowRules,
  isFlowSectionEnabled,
} = require('./category-flows');

const AGREEMENT_ENT_KEY = 'tick_box_please_note_that_at_this_event_photos_and_videos_will_be_taken_by_checking_this_box_i_agree_to_the_following_i_acknowledge_and_agree_that_i_may_be_included_in_photos_headshots_and_videos_of_the_event_and_those_may_be_unremunerated_used_by_dhl_international_gmbh_in_connection_with_internal_and_external_communications_about_the_event_and_internal_and_external_company_presentations_of_dhl_international_gmbh_and_its_affiliates_this_might_include_the_right_to_use_them_in_printed_including_the_event_yearbook_and_hall_of_fame_and_online_publicity_of_dpdhl_group_e_g_on_the_intranet_mynet_on_the_public_event_website_for_social_media_presentations_and_or_press_releases_usage_of_the_images_for_purposes_other_than_described_above_is_prohibited';

const APPLICATION_FIELD_MAP = {
  category: null,
  accountUserId: 'work_email_address',
  jobTitle: 'job_title',
  functionUnit: 'function_unit',
  functionUnitOthers: 'function_unit',
  businessUnit: 'business_unit',
  globalId: null,
  salutation: 'salutation',
  firstName: 'given_name_as_in_passport',
  surname: 'surname_as_in_passport',
  nameOnTag: 'name_to_be_printed_on_badge',
  gender: 'gender',
  officeTelCountry: 'office_phone',
  officeTelArea: 'office_phone',
  officeTel: 'office_phone',
  mobileCountryCode: 'mobile_phone',
  mobileAreaCode: 'mobile_phone',
  mobileNumber: 'mobile_phone',
  mobilePhone: 'mobile_phone',
  specialPhysicalCondition: 'special_physical_condition',
  specialPhysicalConditionYes: 'special_physical_condition',
  dietaryRequirements: 'special_dietary_requirements',
  otherDietaryRequirements: 'other_dietary_requirments_food_allegies_if_any',
  galaMainCourse: 'gala_dinner_main_course',
  shirtSize: 't_shirt_size',
  arrivalDate: 'arrival_date',
  arrivalTime: 'arrival_time_eta',
  airlineRegistration: 'arrival_airline',
  arrivalFlightNo: 'arrival_flight_number',
  airportPickup: 'do_you_require_arrival_pick_up_flight_details_will_appear_on_top',
  departureDate: 'departure_date',
  departureTime: 'departure_time_etd',
  departureAirline: 'departure_airline',
  departureFlightNo: 'departure_flight_number',
  airportDropoff: 'do_you_require_departure_transfer',
  apecCard: 'do_you_have_apec_business_travel_card',
  accommodationRequired: 'do_you_require_accommodation_during_event_period',
  nameOnPassport: null,
  passportNumber: null,
  nationality: null,
  passportPlaceIssue: null,
  passportIssueDate: null,
  passportExpiryDate: null,
  dateOfBirth: null,
  checkInDate: null,
  checkOutDate: null,
  bedType: null,
  otherRequests: null,
  tourSelection: 'please_select_your_preferred_your_option',
  uniformPhoto: 'uniform_photo',
  nicePhoto: 'nice_photo_of_yourself',
  winnerMessage: 'winner_s_message',
  emergencyName: 'name',
  emergencyContactNumber: 'contact_number',
  emergencyRelationship: 'relationship',
  agreement: AGREEMENT_ENT_KEY,
};

const APPLICATION_SECTIONS = APPLICATION_FIELD_ORDER;

function isEntitlementVisible(fieldKey, category) {
  if (!category || !fieldKey) return false;
  const ent = entitlements.fields.find((f) => f.key === fieldKey);
  if (!ent) return false;
  return ent.visibility[entitlementKey(category)] === true;
}

function isAppFieldVisible(fieldId, category, options = {}) {
  const { accommodationAnswer } = options;
  const rules = getFlowRules(category);
  const useXlsxOnly = hasEntitlementAlias(category);
  const lodgingWithoutAccommodation = rules.lodgingWithoutAccommodation === true;

  if (fieldId === 'specialPhysicalCondition' || fieldId === 'specialPhysicalConditionYes') {
    if (useXlsxOnly) {
      return isEntitlementVisible('special_physical_condition', category);
    }
    return rules.specialPhysicalCondition && isEntitlementVisible('special_physical_condition', category);
  }
  if (fieldId === 'shirtSize') {
    if (useXlsxOnly) {
      return isEntitlementVisible('t_shirt_size', category);
    }
    return rules.shirtSize && isEntitlementVisible('t_shirt_size', category);
  }
  if (fieldId === 'globalId') {
    return rules.globalId === true;
  }
  if (fieldId === 'functionUnitOthers') {
    return isEntitlementVisible('function_unit', category);
  }
  if (fieldId === 'officeTelCountry' || fieldId === 'officeTelArea' || fieldId === 'officeTel') {
    return isEntitlementVisible('office_phone', category);
  }
  if (fieldId === 'mobileCountryCode' || fieldId === 'mobileAreaCode' || fieldId === 'mobileNumber') {
    return isEntitlementVisible('mobile_phone', category);
  }
  if (fieldId === 'otherRequests') {
    if (!rules.lodgingRemarks) return false;
  }

  const lodgingFields = APPLICATION_SECTIONS.lodging;
  if (lodgingFields.includes(fieldId)) {
    if (!isFlowSectionEnabled(category, 'lodging')) return false;
    if (!lodgingWithoutAccommodation
      && !isEntitlementVisible('do_you_require_accommodation_during_event_period', category)) {
      return false;
    }
    if (lodgingWithoutAccommodation) return true;
    const answer = accommodationAnswer !== undefined
      ? accommodationAnswer
      : null;
    if (answer !== 'Yes') return false;
    return true;
  }

  if (APPLICATION_SECTIONS.flight.includes(fieldId)) {
    if (!isFlowSectionEnabled(category, 'flight')) return false;
    const flightEntKey = APPLICATION_FIELD_MAP[fieldId];
    if (useXlsxOnly) {
      return flightEntKey ? isEntitlementVisible(flightEntKey, category) : false;
    }
    if (rules.flight !== true) return false;
    // Respect field entitlements (e.g. hide APEC card for awardees)
    if (flightEntKey && !isEntitlementVisible(flightEntKey, category)) return false;
    return true;
  }
  if (APPLICATION_SECTIONS.tour.includes(fieldId)) {
    if (!useXlsxOnly && (!rules.tour || !isFlowSectionEnabled(category, 'tour'))) return false;
    if (useXlsxOnly && !isFlowSectionEnabled(category, 'tour')) return false;
  }
  if (APPLICATION_SECTIONS.photo.includes(fieldId)) {
    if (!useXlsxOnly && (!rules.photo || !isFlowSectionEnabled(category, 'photo'))) return false;
    if (useXlsxOnly && !isFlowSectionEnabled(category, 'photo')) return false;
  }

  if (!(fieldId in APPLICATION_FIELD_MAP)) return false;
  const entKey = APPLICATION_FIELD_MAP[fieldId];
  if (!entKey) {
    if (lodgingFields.includes(fieldId)) return false;
    return false;
  }
  return isEntitlementVisible(entKey, category);
}

function isAppSectionVisible(sectionId, category, options = {}) {
  if (sectionId === 'flight' && hasEntitlementAlias(category)) {
    return APPLICATION_SECTIONS.flight.some((fieldId) => isAppFieldVisible(fieldId, category, options));
  }

  if (sectionId === 'profileSummary') {
    return APPLICATION_SECTIONS.profileSummary.some((fieldId) => {
      if (fieldId === 'category' || fieldId === 'accountUserId') return true;
      if (fieldId === 'globalId') return isAppFieldVisible(fieldId, category, options);
      return isAppFieldVisible(fieldId, category, options);
    });
  }

  if (!isFlowSectionEnabled(category, sectionId)) return false;

  if (sectionId === 'lodging') {
    const rules = getFlowRules(category);
    if (rules.lodgingWithoutAccommodation) return true;
    if (!isEntitlementVisible('do_you_require_accommodation_during_event_period', category)) return false;
    const answer = options.accommodationAnswer;
    return answer === 'Yes';
  }

  const fields = APPLICATION_SECTIONS[sectionId] || [];
  return fields.some((fieldId) => isAppFieldVisible(fieldId, category, options));
}

function getAppVisibilityMatrix(categoryValues, accommodationByCategory = {}) {
  const matrix = {};
  categoryValues.filter(Boolean).forEach((category) => {
    const accommodationAnswer = accommodationByCategory[category];
    matrix[category] = {};
    Object.keys(APPLICATION_FIELD_MAP).forEach((fieldId) => {
      matrix[category][fieldId] = isAppFieldVisible(fieldId, category, { accommodationAnswer });
    });
    matrix[category].category = true;
    matrix[category].accountUserId = true;
  });
  return matrix;
}

function getAppSectionVisibility(category, accommodationAnswer) {
  const sections = {};
  Object.keys(APPLICATION_SECTIONS).forEach((sectionId) => {
    sections[sectionId] = isAppSectionVisible(sectionId, category, { accommodationAnswer });
  });
  return sections;
}

module.exports = {
  APPLICATION_FIELD_MAP,
  APPLICATION_SECTIONS,
  isEntitlementVisible,
  isAppFieldVisible,
  isAppSectionVisible,
  getAppVisibilityMatrix,
  getAppSectionVisibility,
  getFlowType,
};
