const options = require('./form-options.json');

const DATE_FIELDS = {
  arrival: { day: 'arrDateDD', month: 'arrDateMM', year: 'arrDateYY' },
  departure: { day: 'depDateDD', month: 'depDateMM', year: 'depDateYY' },
  issue: { day: 'visaIssueDD', month: 'visaIssueMM', year: 'visaIssueYY' },
  expiry: { day: 'visaExpiryDD', month: 'visaExpiryMM', year: 'visaExpiryYY' },
  dob: { day: 'dateOfBirthDD', month: 'dateOfBirthMM', year: 'dateOfBirthYY' },
  checkIn: { day: 'checkInDateDD', month: 'checkInDateMM', year: 'checkInDateYY' },
  checkOut: { day: 'checkOutDateDD', month: 'checkOutDateMM', year: 'checkOutDateYY' },
};

const TIME_FIELDS = {
  arrival: { hour: 'arrTimeHH', minute: 'arrTimeMM' },
  departure: { hour: 'depTimeHH', minute: 'depTimeMM' },
};

function getOptions(fieldName) {
  return options[fieldName] || [];
}

function getDateOptions(prefix, part) {
  const fields = DATE_FIELDS[prefix];
  if (!fields) return [];
  return getOptions(fields[part]);
}

function getTimeOptions(prefix, part) {
  const fields = TIME_FIELDS[prefix];
  if (!fields) return [];
  return getOptions(fields[part]);
}

module.exports = {
  getOptions,
  getDateOptions,
  getTimeOptions,
  DATE_FIELDS,
  TIME_FIELDS,
};
