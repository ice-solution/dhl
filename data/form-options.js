const options = require('./form-options.json');

const EVENT_DATE_PREFIXES = new Set(['arrival', 'departure', 'checkIn', 'checkOut']);

const EVENT_DATE_DAY_OPTIONS = [
  { value: '', label: 'Please select' },
  ...['03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13'].map((d) => ({ value: d, label: d })),
];

const EVENT_DATE_MONTH_OPTIONS = [{ value: '09', label: 'September' }];

const EVENT_DATE_YEAR_OPTIONS = [{ value: '2026', label: '2026' }];

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
  if (EVENT_DATE_PREFIXES.has(prefix)) {
    if (part === 'day') return EVENT_DATE_DAY_OPTIONS;
    if (part === 'month') return EVENT_DATE_MONTH_OPTIONS;
    if (part === 'year') return EVENT_DATE_YEAR_OPTIONS;
  }
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
