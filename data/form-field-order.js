/**
 * Field order from fields_details.xlsx → sheet "OVERVIEW FORM SUMMARY"
 * Single source of truth for form section and field ordering.
 */

/** Application section display order (Part 1 → Agreement) */
const APPLICATION_SECTION_ORDER = [
  'profileSummary',
  'profilePart2',
  'flight',
  'accommodation',
  'lodging',
  'tour',
  'photo',
  'emergency',
  'agreement',
];

/** Application field ids per section (matches xlsx row order) */
const APPLICATION_FIELD_ORDER = {
  profileSummary: [
    'category',
    'jobTitle',
    'functionUnit',
    'functionUnitOthers',
    'businessUnit',
    'accountUserId',
  ],
  profilePart2: [
    'salutation',
    'surname',
    'firstName',
    'nameOnTag',
    'gender',
    'officeTelCountry',
    'officeTelArea',
    'officeTel',
    'mobileCountryCode',
    'mobileAreaCode',
    'mobileNumber',
    'specialPhysicalCondition',
    'specialPhysicalConditionYes',
    'dietaryRequirements',
    'otherDietaryRequirements',
    'galaMainCourse',
    'shirtSize',
  ],
  flight: [
    'arrivalDate',
    'arrivalTime',
    'airlineRegistration',
    'arrivalFlightNo',
    'airportPickup',
    'departureDate',
    'departureTime',
    'departureAirline',
    'departureFlightNo',
    'airportDropoff',
    'apecCard',
  ],
  accommodation: ['accommodationRequired'],
  lodging: [
    'nameOnPassport',
    'passportNumber',
    'nationality',
    'passportPlaceIssue',
    'passportIssueDate',
    'passportExpiryDate',
    'dateOfBirth',
    'checkInDate',
    'checkOutDate',
    'bedType',
    'otherRequests',
    'primaryStayDuration',
    'reservationLinkEmail',
  ],
  tour: ['tourSelection'],
  photo: ['uniformPhoto', 'nicePhoto', 'winnerMessage'],
  emergency: ['emergencyName', 'emergencyContactNumber', 'emergencyRelationship'],
  agreement: ['agreement'],
};

/** Admin review display order (combined phone/date fields) */
const ADMIN_REVIEW_FIELD_ORDER = {
  profileSummary: APPLICATION_FIELD_ORDER.profileSummary,
  profilePart2: [
    'salutation',
    'surname',
    'firstName',
    'nameOnTag',
    'gender',
    'officePhone',
    'mobilePhone',
    'specialPhysicalCondition',
    'specialPhysicalConditionDetail',
    'dietaryRequirements',
    'otherDietaryRequirements',
    'galaMainCourse',
    'shirtSize',
  ],
  flight: APPLICATION_FIELD_ORDER.flight,
  accommodation: APPLICATION_FIELD_ORDER.accommodation,
  lodging: [
    'nameOnPassport',
    'passportNumber',
    'nationality',
    'passportPlaceIssue',
    'passportIssueDate',
    'passportExpiryDate',
    'dateOfBirth',
    'checkInDate',
    'checkOutDate',
    'bedType',
    'otherRequests',
    'primaryStayDuration',
    'reservationLinkEmail',
  ],
  tour: APPLICATION_FIELD_ORDER.tour,
  photo: APPLICATION_FIELD_ORDER.photo,
  emergency: APPLICATION_FIELD_ORDER.emergency,
  agreement: APPLICATION_FIELD_ORDER.agreement,
};

/**
 * Entitlement keys in xlsx row order (registration + visibility source)
 */
const ENTITLEMENT_KEY_ORDER = [
  'category_dropdown_list',
  'job_title',
  'function_unit',
  'business_unit',
  'work_email_address',
  'password',
  'conirm_password',
  'salutation',
  'surname_as_in_passport',
  'given_name_as_in_passport',
  'name_to_be_printed_on_badge',
  'gender',
  'office_phone',
  'mobile_phone',
  'special_physical_condition',
  'special_dietary_requirements',
  'other_dietary_requirments_food_allegies_if_any',
  'gala_dinner_main_course',
  't_shirt_size',
  'arrival_date',
  'arrival_time_eta',
  'arrival_airline',
  'arrival_flight_number',
  'do_you_require_arrival_pick_up_flight_details_will_appear_on_top',
  'departure_date',
  'departure_time_etd',
  'departure_airline',
  'departure_flight_number',
  'do_you_require_departure_transfer',
  'do_you_have_apec_business_travel_card',
  'do_you_require_accommodation_during_event_period',
  'please_select_your_preferred_your_option',
  'uniform_photo',
  'nice_photo_of_yourself',
  'winner_s_message',
  'name',
  'contact_number',
  'relationship',
  'tick_box_please_note_that_at_this_event_photos_and_videos_will_be_taken_by_checking_this_box_i_agree_to_the_following_i_acknowledge_and_agree_that_i_may_be_included_in_photos_headshots_and_videos_of_the_event_and_those_may_be_unremunerated_used_by_dhl_international_gmbh_in_connection_with_internal_and_external_communications_about_the_event_and_internal_and_external_company_presentations_of_dhl_international_gmbh_and_its_affiliates_this_might_include_the_right_to_use_them_in_printed_including_the_event_yearbook_and_hall_of_fame_and_online_publicity_of_dpdhl_group_e_g_on_the_intranet_mynet_on_the_public_event_website_for_social_media_presentations_and_or_press_releases_usage_of_the_images_for_purposes_other_than_described_above_is_prohibited',
];

const ENTITLEMENT_ORDER_INDEX = Object.fromEntries(
  ENTITLEMENT_KEY_ORDER.map((key, index) => [key, index])
);

function sortByEntitlementOrder(items, getKey) {
  return [...items].sort((a, b) => {
    const ai = ENTITLEMENT_ORDER_INDEX[getKey(a)];
    const bi = ENTITLEMENT_ORDER_INDEX[getKey(b)];
    const aIdx = ai === undefined ? Number.MAX_SAFE_INTEGER : ai;
    const bIdx = bi === undefined ? Number.MAX_SAFE_INTEGER : bi;
    return aIdx - bIdx;
  });
}

function sortFieldIds(fieldIds, sectionId) {
  const order = APPLICATION_FIELD_ORDER[sectionId] || [];
  const orderIndex = Object.fromEntries(order.map((id, index) => [id, index]));
  return [...fieldIds].sort((a, b) => {
    const ai = orderIndex[a] ?? Number.MAX_SAFE_INTEGER;
    const bi = orderIndex[b] ?? Number.MAX_SAFE_INTEGER;
    return ai - bi;
  });
}

module.exports = {
  APPLICATION_SECTION_ORDER,
  APPLICATION_FIELD_ORDER,
  ADMIN_REVIEW_FIELD_ORDER,
  ENTITLEMENT_KEY_ORDER,
  ENTITLEMENT_ORDER_INDEX,
  sortByEntitlementOrder,
  sortFieldIds,
};
