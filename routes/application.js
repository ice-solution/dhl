const express = require('express');
const Application = require('../models/Application');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function parseBody(body) {
  const dietaryRequirements = Array.isArray(body.dietaryRequirements)
    ? body.dietaryRequirements
    : body.dietaryRequirements
      ? [body.dietaryRequirements]
      : [];

  return {
    accountLogin: {
      category: body.category || '',
      userId: body.accountUserId || '',
      jobTitle: body.jobTitle || '',
      functionUnit: body.functionUnit || '',
      functionUnitOthers: body.functionUnitOthers || '',
      businessUnit: body.businessUnit || '',
      joinDhl: body.joinDhl || '',
      fullName: body.fullName || '',
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
      bloodType: body.bloodType || '',
      powerBank: {
        brand: body.powerBankBrand || '',
        modelType: body.powerBankModel || '',
        powerCapacity: body.powerBankCapacity || '',
      },
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
      departureAirport: body.departureAirport || '',
      airportDropoff: body.airportDropoff || '',
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
    },
    culturalTour: {
      tourSelection: body.tourSelection || '',
    },
    costume: {
      height: body.height || '',
      weight: body.weight || '',
      chest: body.chest || '',
      waist: body.waist || '',
      upperArm: body.upperArm || '',
      neck: body.neck || '',
      lengthShoulder: body.lengthShoulder || '',
      lengthSleeve: body.lengthSleeve || '',
      aodaiColor: body.aodaiColor || '',
      aobabaColor: body.aobabaColor || '',
      shirtSize: body.shirtSize || '',
    },
    status: body.action === 'submit' ? 'submitted' : 'draft',
  };
}

router.get('/application', requireAuth, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const application = await Application.findOne({ user: req.session.userId });
  res.render('application-form', {
    user,
    application,
    success: req.query.success || null,
  });
});

router.post('/application', requireAuth, async (req, res) => {
  try {
    const data = parseBody(req.body);
    await Application.findOneAndUpdate(
      { user: req.session.userId },
      { ...data, user: req.session.userId, hasChanges: true },
      { upsert: true, new: true }
    );

    const message = data.status === 'submitted' ? 'submitted' : 'saved';
    res.redirect(`/application?success=${message}`);
  } catch (err) {
    console.error(err);
    const user = await User.findById(req.session.userId);
    const application = await Application.findOne({ user: req.session.userId });
    res.render('application-form', {
      user,
      application,
      error: 'Failed to save application. Please try again.',
      success: null,
    });
  }
});

module.exports = router;
