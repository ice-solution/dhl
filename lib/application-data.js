const User = require('../models/User');
const {
  getAppVisibilityMatrix,
  APPLICATION_SECTIONS,
  isAppFieldVisible,
  isAppSectionVisible,
  getAppSectionVisibility,
  getFlowType,
} = require('../data/application-fields');
const { getFlowRules, CATEGORY_RULE_OVERRIDES } = require('../data/category-flows');
const { resolveCategory, migrateLegacyGuestCategory } = require('../data/category-aliases');
const { getFlightDetailsCopy, getFlightDetailsGroup } = require('../data/flight-details-copy');
const { getLodgingInfoCopy, getLodgingInfoGroup, getLodgingRemarksVisible, LODGING_INFO_COPY } = require('../data/lodging-info-copy');
const { getPhotoUploadCopy } = require('../data/photo-upload-copy');
const formOptions = require('../data/form-options');

const categoryOptions = formOptions.getOptions('titleGroup');
const categoryValues = categoryOptions.map((o) => o.value);

function buildCategoryMeta() {
  const flightGroupByCategory = {};
  const flightCopyByCategory = {};
  const lodgingGroupByCategory = {};
  const lodgingRemarksByCategory = {};
  const lodgingCopyByCategory = {};
  const lodgingWithoutAccommodationByCategory = {};
  const flightCopyByGroup = {};
  const lodgingCopyByGroup = {};

  categoryValues.filter(Boolean).forEach((cat) => {
    const flightGroup = getFlightDetailsGroup(cat);
    flightGroupByCategory[cat] = flightGroup;
    flightCopyByCategory[cat] = getFlightDetailsCopy(cat);
    if (flightGroup && !flightCopyByGroup[flightGroup]) {
      flightCopyByGroup[flightGroup] = getFlightDetailsCopy(cat);
    }

    const lodgingGroup = getLodgingInfoGroup(cat);
    lodgingGroupByCategory[cat] = lodgingGroup;
    lodgingCopyByCategory[cat] = getLodgingInfoCopy(cat);
    if (lodgingGroup && !lodgingCopyByGroup[lodgingGroup]) {
      lodgingCopyByGroup[lodgingGroup] = { ...LODGING_INFO_COPY[lodgingGroup] };
    }

    lodgingRemarksByCategory[cat] = getLodgingRemarksVisible(cat);
    lodgingWithoutAccommodationByCategory[cat] = getFlowRules(cat).lodgingWithoutAccommodation === true;
  });

  Object.keys(CATEGORY_RULE_OVERRIDES).forEach((cat) => {
    lodgingWithoutAccommodationByCategory[cat] = getFlowRules(cat).lodgingWithoutAccommodation === true;
  });

  return {
    flightGroupByCategory,
    flightCopyByCategory,
    lodgingGroupByCategory,
    lodgingRemarksByCategory,
    lodgingCopyByCategory,
    lodgingWithoutAccommodationByCategory,
    flightCopyByGroup,
    lodgingCopyByGroup,
  };
}

const categoryMeta = buildCategoryMeta();

function buildApplicationRenderContext(user, application, extras = {}) {
  const rawCategory = application?.accountLogin?.category || user?.category || '';
  const category = resolveCategory(rawCategory);
  const accommodationAnswer = application?.flightDetails?.accommodationRequired || '';
  const opts = { accommodationAnswer };
  const appVisibilityMatrix = getAppVisibilityMatrix(categoryValues, {
    [category]: accommodationAnswer,
  });
  const sectionVisibilityByCategory = {};
  categoryValues.filter(Boolean).forEach((cat) => {
    sectionVisibilityByCategory[cat] = getAppSectionVisibility(cat, '');
  });

  return {
    user,
    application,
    category,
    flowType: getFlowType(category),
    flowRules: getFlowRules(category),
    accommodationAnswer,
    appVisibilityMatrix,
    sectionVisibilityByCategory,
    appSections: APPLICATION_SECTIONS,
    sectionVisibility: getAppSectionVisibility(category, accommodationAnswer),
    showAppField: (fieldId) => isAppFieldVisible(fieldId, category, opts),
    showAppSection: (sectionId) => isAppSectionVisible(sectionId, category, opts),
    flightDetailsCopy: getFlightDetailsCopy(category),
    lodgingInfoCopy: getLodgingInfoCopy(category),
    photoUploadCopy: getPhotoUploadCopy(),
    reservationLinkEmail: application?.lodging?.reservationLinkEmail || user?.email || '',
    categoryOptions,
    ...categoryMeta,
    ...extras,
  };
}

function parseApplicationBody(body) {
  const dietaryRequirements = Array.isArray(body.dietaryRequirements)
    ? body.dietaryRequirements
    : body.dietaryRequirements ? [body.dietaryRequirements] : [];

  const firstName = body.firstName || '';
  const surname = body.surname || '';

  return {
    accountLogin: {
      category: resolveCategory(body.category || ''),
      userId: body.accountUserId || '',
      jobTitle: body.jobTitle || '',
      functionUnit: body.functionUnit || '',
      functionUnitOthers: body.functionUnitOthers || '',
      businessUnit: body.businessUnit || '',
      globalId: body.globalId?.trim() || '',
      joinDhl: body.joinDhl || '',
      fullName: body.fullName || [firstName, surname].filter(Boolean).join(' '),
    },
    profile: {
      salutation: body.salutation || '',
      firstName: body.firstName || '',
      otherName: body.otherName || '',
      surname: body.surname || '',
      nameOnTag: body.nameOnTag || '',
      gender: body.gender || '',
      officeAddress: {
        street: body.officeStreet || '',
        city: body.officeCity || '',
        country: body.officeCountry || '',
      },
      mobile: {
        countryCode: body.mobileCountryCode || '',
        areaCode: body.mobileAreaCode || '',
        number: body.mobileNumber || '',
      },
      specialPhysicalCondition: body.specialPhysicalCondition || '',
      specialPhysicalConditionYes: body.specialPhysicalConditionYes || '',
      dietaryRequirements,
      otherDietaryRequirements: body.otherDietaryRequirements || '',
      galaMainCourse: body.galaMainCourse || '',
    },
    flightDetails: {
      arrivalDate: { day: body.arrivalDay || '', month: body.arrivalMonth || '', year: body.arrivalYear || '' },
      arrivalTime: { hour: body.arrivalHour || '', minute: body.arrivalMinute || '' },
      arrivalFlightNo: body.arrivalFlightNo || '',
      airlineRegistration: body.airlineRegistration || '',
      arrivalAirport: body.arrivalAirport || '',
      airportPickup: body.airportPickup || '',
      departureDate: { day: body.departureDay || '', month: body.departureMonth || '', year: body.departureYear || '' },
      departureTime: { hour: body.departureHour || '', minute: body.departureMinute || '' },
      departureFlightNo: body.departureFlightNo || '',
      departureAirline: body.departureAirline || '',
      departureAirport: body.departureAirport || '',
      airportDropoff: body.airportDropoff || '',
      apecCard: body.apecCard || '',
      accommodationRequired: body.accommodationRequired || '',
    },
    lodging: {
      nameOnPassport: body.nameOnPassport || '',
      passportNumber: body.passportNumber || '',
      nationality: body.nationality || '',
      passportPlaceIssue: body.passportPlaceIssue || '',
      roomType: body.roomType || '',
      passportIssueDate: { day: body.issueDay || '', month: body.issueMonth || '', year: body.issueYear || '' },
      passportExpiryDate: { day: body.expiryDay || '', month: body.expiryMonth || '', year: body.expiryYear || '' },
      dateOfBirth: { day: body.dobDay || '', month: body.dobMonth || '', year: body.dobYear || '' },
      checkInDate: { day: body.checkInDay || '', month: body.checkInMonth || '', year: body.checkInYear || '' },
      checkOutDate: { day: body.checkOutDay || '', month: body.checkOutMonth || '', year: body.checkOutYear || '' },
      bedType: body.bedType || '',
      otherRequests: body.otherRequests || '',
      reservationLinkEmail: body.reservationLinkEmail || '',
    },
    culturalTour: {
      tourSelection: body.tourSelection || '',
    },
    photoUpload: {
      uniformPhoto: body.uniformPhoto || '',
      nicePhoto: body.nicePhoto || '',
      winnerMessage: body.winnerMessage || '',
    },
    emergencyContact: {
      name: body.emergencyName || '',
      contactNumber: body.emergencyContactNumber || '',
      relationship: body.emergencyRelationship || '',
    },
    agreementAccepted: !!body.agreementAccepted,
    socialEventPolicyAccepted: !!body.socialEventPolicyAccepted,
    costume: {
      shirtSize: body.shirtSize || '',
    },
    status: body.action === 'submit' ? 'submitted' : 'draft',
  };
}

function mergeApplicationData(existing, parsed) {
  if (!existing) return parsed;

  const current = typeof existing.toObject === 'function' ? existing.toObject() : existing;

  return {
    accountLogin: { ...current.accountLogin, ...parsed.accountLogin },
    profile: {
      ...current.profile,
      ...parsed.profile,
      mobile: { ...current.profile?.mobile, ...parsed.profile.mobile },
      officeAddress: { ...current.profile?.officeAddress, ...parsed.profile.officeAddress },
      dietaryRequirements: parsed.profile.dietaryRequirements.length
        ? parsed.profile.dietaryRequirements
        : (current.profile?.dietaryRequirements || []),
    },
    flightDetails: {
      ...current.flightDetails,
      ...parsed.flightDetails,
      arrivalDate: { ...current.flightDetails?.arrivalDate, ...parsed.flightDetails.arrivalDate },
      arrivalTime: { ...current.flightDetails?.arrivalTime, ...parsed.flightDetails.arrivalTime },
      departureDate: { ...current.flightDetails?.departureDate, ...parsed.flightDetails.departureDate },
      departureTime: { ...current.flightDetails?.departureTime, ...parsed.flightDetails.departureTime },
    },
    lodging: {
      ...current.lodging,
      ...parsed.lodging,
      passportIssueDate: { ...current.lodging?.passportIssueDate, ...parsed.lodging.passportIssueDate },
      passportExpiryDate: { ...current.lodging?.passportExpiryDate, ...parsed.lodging.passportExpiryDate },
      dateOfBirth: { ...current.lodging?.dateOfBirth, ...parsed.lodging.dateOfBirth },
      checkInDate: { ...current.lodging?.checkInDate, ...parsed.lodging.checkInDate },
      checkOutDate: { ...current.lodging?.checkOutDate, ...parsed.lodging.checkOutDate },
    },
    culturalTour: { ...current.culturalTour, ...parsed.culturalTour },
    photoUpload: {
      ...current.photoUpload,
      ...parsed.photoUpload,
      uniformPhoto: parsed.photoUpload.uniformPhoto || current.photoUpload?.uniformPhoto || '',
      nicePhoto: parsed.photoUpload.nicePhoto || current.photoUpload?.nicePhoto || '',
    },
    emergencyContact: { ...current.emergencyContact, ...parsed.emergencyContact },
    costume: { ...current.costume, ...parsed.costume },
    agreementAccepted: parsed.agreementAccepted || current.agreementAccepted || false,
    socialEventPolicyAccepted: parsed.socialEventPolicyAccepted
      || current.socialEventPolicyAccepted
      || false,
    status: parsed.status === 'submitted'
      ? 'submitted'
      : (current.status === 'submitted' ? 'submitted' : parsed.status),
  };
}

async function syncUserProfile(userId, body) {
  const user = await User.findById(userId);
  if (!user) return null;

  const dietaryRequirements = Array.isArray(body.dietaryRequirements)
    ? body.dietaryRequirements
    : body.dietaryRequirements ? [body.dietaryRequirements] : [];

  const firstName = body.firstName || '';
  const surname = body.surname || '';

  if (body.category) user.category = resolveCategory(body.category.trim());
  user.jobTitle = body.jobTitle || '';
  user.functionUnit = body.functionUnit || '';
  user.functionUnitOthers = body.functionUnitOthers || '';
  user.businessUnit = body.businessUnit || '';
  user.globalId = body.globalId?.trim() || '';
  user.salutation = body.salutation || '';
  user.surname = surname;
  user.givenName = firstName;
  user.nameOnBadge = body.nameOnTag || '';
  user.fullName = [firstName, surname].filter(Boolean).join(' ');
  user.gender = body.gender || '';
  user.officeTel = {
    countryCode: body.officeTelCountry || '',
    areaCode: body.officeTelArea || '',
    number: body.officeTel || '',
  };
  user.mobile = {
    countryCode: body.mobileCountryCode || '',
    areaCode: body.mobileAreaCode || '',
    number: body.mobileNumber || '',
  };
  user.specialPhysicalCondition = body.specialPhysicalCondition || '';
  user.specialPhysicalConditionDetail = body.specialPhysicalConditionYes || '';
  user.dietaryRequirements = dietaryRequirements;
  user.otherDietaryRequirements = body.otherDietaryRequirements || '';
  user.galaMainCourse = body.galaMainCourse || '';
  user.shirtSize = body.shirtSize || '';

  await user.save();
  return user;
}

module.exports = {
  categoryOptions,
  buildApplicationRenderContext,
  parseApplicationBody,
  mergeApplicationData,
  syncUserProfile,
  migrateLegacyGuestCategory,
};
