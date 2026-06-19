const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

  accountLogin: {
    category: String,
    userId: String,
    jobTitle: String,
    functionUnit: String,
    functionUnitOthers: String,
    businessUnit: String,
    globalId: String,
    joinDhl: String,
    fullName: String,
  },

  profile: {
    salutation: String,
    firstName: String,
    otherName: String,
    surname: String,
    nameOnTag: String,
    gender: String,
    officeAddress: {
      street: String,
      city: String,
      country: String,
    },
    mobile: {
      countryCode: String,
      areaCode: String,
      number: String,
    },
    specialPhysicalCondition: String,
    specialPhysicalConditionYes: String,
    dietaryRequirements: [String],
    otherDietaryRequirements: String,
    galaMainCourse: String,
    bloodType: String,
    powerBank: {
      brand: String,
      modelType: String,
      powerCapacity: String,
    },
  },

  flightDetails: {
    arrivalDate: { day: String, month: String, year: String },
    arrivalTime: { hour: String, minute: String },
    arrivalFlightNo: String,
    airlineRegistration: String,
    arrivalAirport: String,
    airportPickup: String,
    departureDate: { day: String, month: String, year: String },
    departureTime: { hour: String, minute: String },
    departureFlightNo: String,
    departureAirline: String,
    departureAirport: String,
    airportDropoff: String,
    apecCard: String,
    accommodationRequired: String,
  },

  lodging: {
    nameOnPassport: String,
    passportNumber: String,
    nationality: String,
    passportPlaceIssue: String,
    roomType: String,
    passportIssueDate: { day: String, month: String, year: String },
    passportExpiryDate: { day: String, month: String, year: String },
    dateOfBirth: { day: String, month: String, year: String },
    checkInDate: { day: String, month: String, year: String },
    checkOutDate: { day: String, month: String, year: String },
    bedType: String,
    otherRequests: String,
    primaryStayDuration: String,
    reservationLinkEmail: String,
  },

  culturalTour: {
    tourSelection: String,
  },

  photoUpload: {
    uniformPhoto: String,
    nicePhoto: String,
    winnerMessage: String,
  },

  emergencyContact: {
    name: String,
    contactNumber: String,
    relationship: String,
  },

  agreementAccepted: { type: Boolean, default: false },

  costume: {
    height: String,
    weight: String,
    chest: String,
    waist: String,
    upperArm: String,
    neck: String,
    lengthShoulder: String,
    lengthSleeve: String,
    aodaiColor: String,
    aobabaColor: String,
    shirtSize: String,
  },

  status: { type: String, enum: ['draft', 'submitted'], default: 'draft' },
  hasChanges: { type: Boolean, default: false },
  registrationConfirmationEmailSent: { type: Boolean, default: false },
  lastReviewedSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
