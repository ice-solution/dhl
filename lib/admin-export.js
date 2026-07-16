const XLSX = require('xlsx');
const { extractFieldValues, FIELD_LABELS } = require('./admin-review');
const { ADMIN_REVIEW_FIELD_ORDER } = require('../data/form-field-order');

const META_COLUMNS = [
  { id: '_workEmail', label: 'Work Email Address' },
  { id: '_fullName', label: 'Full Name' },
  { id: '_status', label: 'Application Status' },
  { id: '_hasChanges', label: 'Pending Changes' },
  { id: '_updatedAt', label: 'Last Updated' },
  { id: '_createdAt', label: 'Account Created' },
];

// Column order based on the current "REORDER.xlsx" the user provided.
// Note: `Work Email Address` must appear only once (we keep `_workEmail`).
const EXPORT_COLUMN_ORDER = [
  '_updatedAt',
  '_createdAt',
  '_status',
  '_hasChanges',
  'globalId',
  '_workEmail',
  '_fullName',
  'category',
  'jobTitle',
  'functionUnit',
  'businessUnit',
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
  'accommodationRequired',
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
  'reservationLinkEmail',
  'tourSelection',
  'uniformPhoto',
  'nicePhoto',
  'winnerMessage',
  'emergencyName',
  'emergencyContactNumber',
  'emergencyRelationship',
  'agreement',
];

function getFieldColumns() {
  const seen = new Set();
  const columns = [];

  Object.values(ADMIN_REVIEW_FIELD_ORDER).forEach((fieldIds) => {
    fieldIds.forEach((fieldId) => {
      // `_workEmail` meta column already provides Work Email Address.
      // Avoid duplicating `accountUserId` in the dynamic field columns.
      if (fieldId === 'functionUnitOthers' || fieldId === 'accountUserId' || seen.has(fieldId)) return;
      seen.add(fieldId);
      columns.push({
        id: fieldId,
        label: FIELD_LABELS[fieldId] || fieldId,
      });
    });
  });

  return columns;
}

function formatExportValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatTimestamp(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('en-GB', {
    timeZone: 'Asia/Hong_Kong',
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function buildExportRow(user, application) {
  const values = extractFieldValues(user, application);
  const row = {
    _workEmail: values.accountUserId || user.userId || '',
    _fullName: user.fullName || application?.accountLogin?.fullName || '',
    _status: values.status === 'submitted'
      ? 'Submitted'
      : values.status === 'draft'
        ? 'Draft'
        : 'No Application',
    _hasChanges: application?.hasChanges ? 'Yes' : 'No',
    _updatedAt: formatTimestamp(application?.updatedAt || user.updatedAt),
    _createdAt: formatTimestamp(user.createdAt),
  };

  getFieldColumns().forEach(({ id }) => {
    row[id] = formatExportValue(values[id]);
  });

  return row;
}

function buildExportWorkbook(users, applications) {
  const appMap = Object.fromEntries(applications.map((a) => [a.user.toString(), a]));
  const metaById = Object.fromEntries(META_COLUMNS.map((c) => [c.id, c]));
  const fieldColumns = getFieldColumns();
  const fieldById = Object.fromEntries(fieldColumns.map((c) => [c.id, c]));

  const columns = EXPORT_COLUMN_ORDER.map((id) => {
    if (metaById[id]) return metaById[id];
    return fieldById[id] || { id, label: FIELD_LABELS[id] || id };
  });

  const headerRow = columns.map((column) => column.label);
  const dataRows = users.map((user) => {
    const application = appMap[user._id.toString()];
    const row = buildExportRow(user, application);
    return columns.map((column) => row[column.id] ?? '');
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  worksheet['!cols'] = columns.map((column) => ({
    wch: Math.min(Math.max(column.label.length + 2, 14), 42),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');
  return workbook;
}

function exportToBuffer(users, applications) {
  const workbook = buildExportWorkbook(users, applications);
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

function buildExportFilename() {
  const date = new Date().toISOString().slice(0, 10);
  return `dhl-eoy-registrations-${date}.xlsx`;
}

module.exports = {
  buildExportRow,
  buildExportFilename,
  exportToBuffer,
};
