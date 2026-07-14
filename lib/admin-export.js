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

function getFieldColumns() {
  const seen = new Set();
  const columns = [];

  Object.values(ADMIN_REVIEW_FIELD_ORDER).forEach((fieldIds) => {
    fieldIds.forEach((fieldId) => {
      if (fieldId === 'functionUnitOthers' || seen.has(fieldId)) return;
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
  const columns = [...META_COLUMNS, ...getFieldColumns()];
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
