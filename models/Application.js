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
    departureAirport: String,
    airportDropoff: String,
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
  },

  culturalTour: {
    tourSelection: String,
  },

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
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
