/**
 * FLIGHT DETAILS (Part 3) intro copy from fields_details.xlsx → sheet "FLIGHT DETAILS"
 *
 * Group 1: AWARDEES + Organising Committee + GMB
 * Group 2: NON-AWARDEE (all other categories with flight section)
 */
const { AWARDEES_CATEGORIES } = require('./category-flows');
const { resolveCategory } = require('./category-aliases');

const SECRETARIAT_EMAIL = 'apeceoy@dhl.com';
const FLIGHT_DEADLINE = '24 July 2026';

const TRANSFER_TABLE = {
  title: 'Transfer rate from the hotel',
  headers: ['Route', 'One Way Transfer Price'],
  rows: [
    { route: 'Airport <> The Westin Seoul Parnas', price: '~KRW 270,000' },
  ],
};

const AIRPORT_TRANSFER_MASTER_BILL_REMARK =
  'Airport transfers for one participant (to and from the airport) are included in the master bill.';

const HOTEL_TRANSFER_REMARK =
  'Should you need to book any additional hotel transfers, please see below information for your reference.';

const CATEGORIES_WITH_AIRPORT_MASTER_BILL_REMARK = [
  'APMB',
  'AP Country Manager',
  'AP Hub Manager',
  'Guests',
  ...AWARDEES_CATEGORIES,
];

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
      'Participants arriving on the same flight may be grouped for shared car transfers',
    ],
  },
};

const INCLUDED_AWARDEE_GMB_CATEGORIES = [
  ...AWARDEES_CATEGORIES,
  'Organising Committee',
  'GMB',
];

function getFlightDetailsGroup(category) {
  const resolved = resolveCategory(category);
  if (!resolved) return null;
  return INCLUDED_AWARDEE_GMB_CATEGORIES.includes(resolved)
    ? 'included_awardee_gmb'
    : 'non_awardee';
}

function getFlightDetailsCopy(category) {
  const resolved = resolveCategory(category);
  const group = getFlightDetailsGroup(resolved);
  if (!group) return null;

  const base = FLIGHT_DETAILS_COPY[group];
  const bottomRemarks = [];
  if (CATEGORIES_WITH_AIRPORT_MASTER_BILL_REMARK.includes(resolved)) {
    bottomRemarks.push(AIRPORT_TRANSFER_MASTER_BILL_REMARK);
  }
  bottomRemarks.push(HOTEL_TRANSFER_REMARK);

  return {
    ...base,
    deadline: FLIGHT_DEADLINE,
    secretariatEmail: SECRETARIAT_EMAIL,
    transferTable: resolved === 'GMB' ? null : TRANSFER_TABLE,
    showBottomRemarks: resolved !== 'GMB',
    bottomRemarks,
  };
}

function showFlightBottomRemarks(category) {
  const copy = getFlightDetailsCopy(category);
  return copy?.showBottomRemarks === true;
}

module.exports = {
  FLIGHT_DETAILS_COPY,
  INCLUDED_AWARDEE_GMB_CATEGORIES,
  getFlightDetailsGroup,
  getFlightDetailsCopy,
  showFlightBottomRemarks,
};
