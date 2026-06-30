const {
  isAppFieldVisible,
  isAppSectionVisible,
} = require('../data/application-fields');
const formOptions = require('../data/form-options');
const { APPLICATION_FIELD_ORDER, ADMIN_REVIEW_FIELD_ORDER } = require('../data/form-field-order');
const { isStoredPhotoPath } = require('./upload-photos');

const PHOTO_FIELD_IDS = new Set(['uniformPhoto', 'nicePhoto']);

function buildPhotoField(fieldId, currentValues, snapshot, hasChanges) {
  const rawValue = currentValues[fieldId] || '';
  const photoPath = isStoredPhotoPath(rawValue) ? rawValue : '';

  return {
    id: fieldId,
    label: FIELD_LABELS[fieldId] || fieldId,
    value: photoPath ? '' : displayValue(rawValue),
    type: 'photo',
    photoPath,
    changed: isFieldChanged(fieldId, currentValues, snapshot, hasChanges),
  };
}

function buildTextField(fieldId, currentValues, snapshot, hasChanges) {
  return {
    id: fieldId,
    label: FIELD_LABELS[fieldId] || fieldId,
    value: displayValue(currentValues[fieldId]),
    type: 'text',
    photoPath: '',
    changed: isFieldChanged(fieldId, currentValues, snapshot, hasChanges),
  };
}

const VISIBILITY_ALIASES = {
  officePhone: 'officeTelCountry',
  mobilePhone: 'mobileCountryCode',
  specialPhysicalConditionDetail: 'specialPhysicalConditionYes',
};

const SECTION_TITLES = {
  profileSummary: 'Account Login',
  profilePart2: 'Profile',
  flight: 'Flight Details',
  accommodation: 'Accommodation',
  lodging: 'Lodging Information',
  tour: 'Tour Selection',
  photo: 'Photo Upload',
  emergency: 'Emergency Personal Contact',
  agreement: 'Agreement',
};

const FIELD_LABELS = {
  category: 'Category',
  accountUserId: 'Work Email Address',
  jobTitle: 'Job Title',
  functionUnit: 'Function Unit',
  functionUnitOthers: 'Function Unit (Others)',
  businessUnit: 'Business Unit',
  globalId: 'Global ID (GID)',
  salutation: 'Salutation',
  surname: 'Surname (As in Passport)',
  firstName: 'Given Name (As in Passport)',
  nameOnTag: 'Name to be printed on badge',
  gender: 'Gender',
  officePhone: 'Office Phone',
  mobilePhone: 'Mobile Phone',
  specialPhysicalCondition: 'Special Physical Condition',
  specialPhysicalConditionDetail: 'Please specify',
  dietaryRequirements: 'Special Dietary Requirements',
  otherDietaryRequirements: 'Other Dietary Requirements / Food Allergies',
  galaMainCourse: 'Gala Dinner Main Course',
  shirtSize: 'T-shirt size',
  arrivalDate: 'Arrival Date',
  arrivalTime: 'Arrival Time (ETA)',
  airlineRegistration: 'Arrival Airline',
  arrivalFlightNo: 'Arrival Flight Number',
  airportPickup: 'Arrival Pick-up Required',
  departureDate: 'Departure Date',
  departureTime: 'Departure Time (ETD)',
  departureAirline: 'Departure Airline',
  departureFlightNo: 'Departure Flight Number',
  airportDropoff: 'Departure Transfer Required',
  apecCard: 'APEC Business Travel Card',
  accommodationRequired: 'Accommodation Required',
  nameOnPassport: 'Name on Passport',
  passportNumber: 'Passport Number',
  nationality: 'Nationality',
  passportPlaceIssue: 'Place of Issue',
  passportIssueDate: 'Passport Issue Date',
  passportExpiryDate: 'Passport Expiry Date',
  dateOfBirth: 'Date of Birth',
  checkInDate: 'Check-in Date',
  checkOutDate: 'Check-out Date',
  bedType: 'Bed Type',
  otherRequests: 'Other Requests',
  reservationLinkEmail: 'Reservation Link Email',
  tourSelection: 'Tour Selection',
  uniformPhoto: 'Uniform Photo',
  nicePhoto: 'Nice Photo',
  winnerMessage: "Winner's Message",
  emergencyName: 'Emergency Contact Name',
  emergencyContactNumber: 'Emergency Contact Number',
  emergencyRelationship: 'Relationship',
  agreement: 'Photo / Video Agreement',
  status: 'Application Status',
};

function formatPhone(tel = {}) {
  const parts = [tel.countryCode, tel.areaCode, tel.number]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  return parts.length ? parts.join(' - ') : '';
}

function formatDate(date = {}) {
  const parts = [date.day, date.month, date.year]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  return parts.length ? parts.join(' / ') : '';
}

function formatTime(time = {}) {
  const parts = [time.hour, time.minute]
    .map((p) => (p || '').trim())
    .filter(Boolean);
  return parts.length ? parts.join(' : ') : '';
}

function normalizeValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).sort().join(', ');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value).trim();
}

function displayValue(value) {
  const normalized = normalizeValue(value);
  return normalized || '—';
}

function isFieldChanged(fieldId, currentValues, snapshot, hasChanges) {
  if (!hasChanges) return false;
  const current = normalizeValue(currentValues[fieldId]);
  const previous = normalizeValue(snapshot?.[fieldId]);
  if (!snapshot || Object.keys(snapshot).length === 0) {
    return current !== '';
  }
  return current !== previous;
}

function extractFieldValues(user, application) {
  const app = application || {};
  const acct = app.accountLogin || {};
  const prof = app.profile || {};
  const flight = app.flightDetails || {};
  const lodge = app.lodging || {};
  const tour = app.culturalTour || {};
  const photos = app.photoUpload || {};
  const emergency = app.emergencyContact || {};
  const costume = app.costume || {};
  const officeTel = user.officeTel || {};
  const mobile = prof.mobile || user.mobile || {};
  const diets = prof.dietaryRequirements || user.dietaryRequirements || [];

  let functionUnit = acct.functionUnit || user.functionUnit || '';
  if (functionUnit === 'Others') {
    functionUnit = acct.functionUnitOthers || user.functionUnitOthers || functionUnit;
  }

  const specialPhysicalCondition = prof.specialPhysicalCondition || user.specialPhysicalCondition || '';
  const specialPhysicalConditionDetail = prof.specialPhysicalConditionYes || user.specialPhysicalConditionDetail || '';

  return {
    category: formOptions.getCategoryLabel(user.category || acct.category || '') || user.category || acct.category || '',
    accountUserId: user.userId || acct.userId || '',
    jobTitle: acct.jobTitle || user.jobTitle || '',
    functionUnit,
    functionUnitOthers: acct.functionUnitOthers || user.functionUnitOthers || '',
    businessUnit: acct.businessUnit || user.businessUnit || '',
    globalId: acct.globalId || user.globalId || '',
    salutation: prof.salutation || user.salutation || '',
    surname: prof.surname || user.surname || '',
    firstName: prof.firstName || user.givenName || '',
    nameOnTag: prof.nameOnTag || user.nameOnBadge || '',
    gender: prof.gender || user.gender || '',
    officePhone: formatPhone(officeTel),
    mobilePhone: formatPhone(mobile),
    specialPhysicalCondition,
    specialPhysicalConditionDetail: specialPhysicalCondition === 'Yes' ? specialPhysicalConditionDetail : '',
    dietaryRequirements: diets,
    otherDietaryRequirements: prof.otherDietaryRequirements || user.otherDietaryRequirements || '',
    galaMainCourse: prof.galaMainCourse || user.galaMainCourse || '',
    shirtSize: costume.shirtSize || user.shirtSize || '',
    arrivalDate: formatDate(flight.arrivalDate),
    arrivalTime: formatTime(flight.arrivalTime),
    airlineRegistration: flight.airlineRegistration || '',
    arrivalFlightNo: flight.arrivalFlightNo || '',
    airportPickup: flight.airportPickup || '',
    departureDate: formatDate(flight.departureDate),
    departureTime: formatTime(flight.departureTime),
    departureAirline: flight.departureAirline || '',
    departureFlightNo: flight.departureFlightNo || '',
    airportDropoff: flight.airportDropoff || '',
    apecCard: flight.apecCard || '',
    accommodationRequired: flight.accommodationRequired || '',
    nameOnPassport: lodge.nameOnPassport || '',
    passportNumber: lodge.passportNumber || '',
    nationality: lodge.nationality || '',
    passportPlaceIssue: lodge.passportPlaceIssue || '',
    passportIssueDate: formatDate(lodge.passportIssueDate),
    passportExpiryDate: formatDate(lodge.passportExpiryDate),
    dateOfBirth: formatDate(lodge.dateOfBirth),
    checkInDate: formatDate(lodge.checkInDate),
    checkOutDate: formatDate(lodge.checkOutDate),
    bedType: lodge.bedType || '',
    otherRequests: lodge.otherRequests || '',
    reservationLinkEmail: lodge.reservationLinkEmail || user.email || '',
    tourSelection: tour.tourSelection || '',
    uniformPhoto: photos.uniformPhoto || '',
    nicePhoto: photos.nicePhoto || '',
    winnerMessage: photos.winnerMessage || '',
    emergencyName: emergency.name || '',
    emergencyContactNumber: emergency.contactNumber || '',
    emergencyRelationship: emergency.relationship || '',
    agreement: app.agreementAccepted ? 'Accepted' : 'Not accepted',
    status: app.status || 'none',
  };
}

const ADMIN_FIELD_IDS = ADMIN_REVIEW_FIELD_ORDER;

function isAdminFieldVisible(fieldId, category, accommodationAnswer) {
  const options = { accommodationAnswer };

  if (fieldId === 'category' || fieldId === 'accountUserId') return true;
  if (fieldId === 'reservationLinkEmail') {
    return isAppSectionVisible('lodging', category, options);
  }

  const visibilityId = VISIBILITY_ALIASES[fieldId] || fieldId;
  return isAppFieldVisible(visibilityId, category, options);
}

function buildAdminReview(user, application) {
  const category = user.category || application?.accountLogin?.category || '';
  const accommodationAnswer = application?.flightDetails?.accommodationRequired || '';
  const currentValues = extractFieldValues(user, application);
  const snapshot = application?.lastReviewedSnapshot || null;
  const hasChanges = application?.hasChanges || false;
  const changedCount = Object.keys(currentValues).filter(
    (fieldId) => isFieldChanged(fieldId, currentValues, snapshot, hasChanges)
  ).length;

  const sections = Object.entries(ADMIN_FIELD_IDS)
    .filter(([sectionId]) => isAppSectionVisible(sectionId, category, { accommodationAnswer }))
    .map(([sectionId, fieldIds]) => {
      const fields = fieldIds
        .filter((fieldId) => isAdminFieldVisible(fieldId, category, accommodationAnswer))
        .filter((fieldId) => {
          if (fieldId === 'specialPhysicalConditionDetail') {
            return currentValues.specialPhysicalCondition === 'Yes'
              || normalizeValue(currentValues.specialPhysicalConditionDetail) !== '';
          }
          if (fieldId === 'functionUnitOthers') return false;
          return true;
        })
        .map((fieldId) => (
          PHOTO_FIELD_IDS.has(fieldId)
            ? buildPhotoField(fieldId, currentValues, snapshot, hasChanges)
            : buildTextField(fieldId, currentValues, snapshot, hasChanges)
        ));

      return {
        id: sectionId,
        title: SECTION_TITLES[sectionId] || sectionId,
        fields,
      };
    })
    .filter((section) => section.fields.length > 0);

  return {
    category,
    accommodationAnswer,
    currentValues,
    sections,
    hasChanges,
    changedCount,
    status: application?.status || 'none',
    updatedAt: application?.updatedAt || user.updatedAt,
    createdAt: user.createdAt,
  };
}

function createReviewSnapshot(user, application) {
  return extractFieldValues(user, application);
}

module.exports = {
  buildAdminReview,
  createReviewSnapshot,
  extractFieldValues,
  FIELD_LABELS,
};
