const express = require('express');
const multer = require('multer');
const Application = require('../models/Application');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendApplicationSaveEmail } = require('../lib/registration-emails');
const {
  getAppVisibilityMatrix,
  APPLICATION_SECTIONS,
  isAppFieldVisible,
  isAppSectionVisible,
  getAppSectionVisibility,
  getFlowType,
} = require('../data/application-fields');
const { getFlowRules } = require('../data/category-flows');
const { getFlightDetailsCopy, getFlightDetailsGroup } = require('../data/flight-details-copy');
const { getLodgingInfoCopy, getLodgingInfoGroup } = require('../data/lodging-info-copy');
const { getPhotoUploadCopy } = require('../data/photo-upload-copy');
const { saveUserPhoto } = require('../lib/upload-photos');
const formOptions = require('../data/form-options');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const categoryOptions = formOptions.getOptions('titleGroup');
const categoryValues = categoryOptions.map((o) => o.value);

function buildCategoryMeta() {
  const flightGroupByCategory = {};
  const lodgingGroupByCategory = {};
  const lodgingRemarksByCategory = {};
  const flightCopyByGroup = {};
  const lodgingCopyByGroup = {};

  categoryValues.filter(Boolean).forEach((cat) => {
    const flightGroup = getFlightDetailsGroup(cat);
    flightGroupByCategory[cat] = flightGroup;
    if (flightGroup && !flightCopyByGroup[flightGroup]) {
      flightCopyByGroup[flightGroup] = getFlightDetailsCopy(cat);
    }

    const lodgingGroup = getLodgingInfoGroup(cat);
    lodgingGroupByCategory[cat] = lodgingGroup;
    if (lodgingGroup && !lodgingCopyByGroup[lodgingGroup]) {
      lodgingCopyByGroup[lodgingGroup] = getLodgingInfoCopy(cat);
    }

    lodgingRemarksByCategory[cat] = getFlowRules(cat).lodgingRemarks;
  });

  return {
    flightGroupByCategory,
    lodgingGroupByCategory,
    lodgingRemarksByCategory,
    flightCopyByGroup,
    lodgingCopyByGroup,
  };
}

const categoryMeta = buildCategoryMeta();

function buildRenderContext(user, application, extras = {}) {
  const category = application?.accountLogin?.category || user?.category || '';
  const accommodationAnswer = application?.flightDetails?.accommodationRequired || '';
  const opts = { accommodationAnswer };
  const appVisibilityMatrix = getAppVisibilityMatrix(categoryValues, {
    [category]: accommodationAnswer,
  });

  return {
    user,
    application,
    category,
    flowType: getFlowType(category),
    flowRules: getFlowRules(category),
    accommodationAnswer,
    appVisibilityMatrix,
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

function parseBody(body) {
  const dietaryRequirements = Array.isArray(body.dietaryRequirements)
    ? body.dietaryRequirements
    : body.dietaryRequirements ? [body.dietaryRequirements] : [];

  const firstName = body.firstName || '';
  const surname = body.surname || '';

  return {
    accountLogin: {
      category: body.category || '',
      userId: body.accountUserId || '',
      jobTitle: body.jobTitle || '',
      functionUnit: body.functionUnit || '',
      functionUnitOthers: body.functionUnitOthers || '',
      businessUnit: body.businessUnit || '',
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
      primaryStayDuration: body.primaryStayDuration || '',
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
    status: parsed.status,
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

  if (body.category) user.category = body.category.trim();
  user.jobTitle = body.jobTitle || '';
  user.functionUnit = body.functionUnit || '';
  user.functionUnitOthers = body.functionUnitOthers || '';
  user.businessUnit = body.businessUnit || '';
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

router.get('/application', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const application = await Application.findOne({ user: req.session.userId });
  res.render('application-form', buildRenderContext(user, application, {
    success: req.query.success || null,
  }));
});

router.post('/application', requireAuth, upload.fields([
  { name: 'uniformPhotoFile', maxCount: 1 },
  { name: 'nicePhotoFile', maxCount: 1 },
]), async (req, res) => {
  try {
    const existing = await Application.findOne({ user: req.session.userId });
    const parsed = parseBody(req.body);
    const data = mergeApplicationData(existing, parsed);

    const uniformFile = req.files?.uniformPhotoFile?.[0];
    const niceFile = req.files?.nicePhotoFile?.[0];
    if (uniformFile) {
      data.photoUpload.uniformPhoto = await saveUserPhoto(req.session.userId, 'uniform', uniformFile);
    }
    if (niceFile) {
      data.photoUpload.nicePhoto = await saveUserPhoto(req.session.userId, 'nice', niceFile);
    }

    const user = await syncUserProfile(req.session.userId, req.body);
    if (user) {
      req.session.displayName = user.fullName || user.userId;
    }

    let emailFlags = {};
    if (user) {
      try {
        emailFlags = await sendApplicationSaveEmail(req, user, existing);
      } catch (emailErr) {
        console.error('Application save email failed:', emailErr);
      }
    }

    await Application.findOneAndUpdate(
      { user: req.session.userId },
      {
        ...data,
        user: req.session.userId,
        hasChanges: true,
        ...(emailFlags.registrationConfirmationEmailSent
          ? { registrationConfirmationEmailSent: true }
          : {}),
      },
      { upsert: true, new: true }
    );

    let message;
    if (data.status === 'submitted') {
      message = 'submitted';
    } else if (emailFlags.emailType === 'created') {
      message = 'confirmed';
    } else if (emailFlags.emailType === 'updated') {
      message = 'updated';
    } else {
      message = 'saved';
    }
    res.redirect(`/application?success=${message}`);
  } catch (err) {
    console.error(err);
    const user = await User.findById(req.session.userId);
    const application = await Application.findOne({ user: req.session.userId });
    res.render('application-form', buildRenderContext(user, application, {
      error: err.message || 'Failed to save application. Please try again.',
      success: null,
    }));
  }
});

module.exports = router;
