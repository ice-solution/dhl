/**
 * FLIGHT DETAILS (Part 3) intro copy from fields_details.xlsx → sheet "FLIGHT DETAILS"
 *
 * Group 1: AWARDEES + Organising Committee + GMB
 * Group 2: NON-AWARDEE (all other categories with flight section)
 */
const { AWARDEES_CATEGORIES } = require('./category-flows');

const SECRETARIAT_EMAIL = 'apeceoy@dhl.com';
const FLIGHT_DEADLINE = '24 July 2026';

const TRANSFER_TABLE = {
  title: 'Transfer rate from the hotel',
  headers: ['Route', 'One Way Transfer Price'],
  rows: [
    { route: 'Airport <> The Westin Seoul Parnas', price: '~KRW 270,000' },
  ],
};

const FLIGHT_DETAILS_COPY = {
  included_awardee_gmb: {
    key: 'included_awardee_gmb',
    label: 'AWARDEES + Organising Committee + GMB',
    intro: [
      'During event period, airport and ground transfer will be provided back and forth between airport, lodging hotel and event venues.',
    ],
  },
  non_awardee: {
    key: 'non_awardee',
    label: 'NON-AWARDEE',
    intro: [
      'During event period, airport and ground transfer will be provided back and forth between airport, lodging hotel and event venues.',
      'Please note that car sharing might be offered for management members who have the same flight scheduled.',
    ],
  },
};

const INCLUDED_AWARDEE_GMB_CATEGORIES = [
  ...AWARDEES_CATEGORIES,
  'Organising Committee',
  'GMB',
];

function getFlightDetailsGroup(category) {
  if (!category) return null;
  return INCLUDED_AWARDEE_GMB_CATEGORIES.includes(category)
    ? 'included_awardee_gmb'
    : 'non_awardee';
}

function getFlightDetailsCopy(category) {
  const group = getFlightDetailsGroup(category);
  if (!group) return null;

  const base = FLIGHT_DETAILS_COPY[group];
  return {
    ...base,
    deadline: FLIGHT_DEADLINE,
    secretariatEmail: SECRETARIAT_EMAIL,
    transferTable: category === 'GMB' ? null : TRANSFER_TABLE,
    showBottomRemarks: category !== 'GMB',
    bottomRemarksText:
      'Should you need to book any additional hotel transfers, please see below information for your reference.',
  };
}

module.exports = {
  FLIGHT_DETAILS_COPY,
  INCLUDED_AWARDEE_GMB_CATEGORIES,
  getFlightDetailsGroup,
  getFlightDetailsCopy,
};
