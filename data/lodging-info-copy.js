/**
 * LODGING INFORMATION copy from fields_details.xlsx → sheet "LODGING INFORMATION"
 *
 * Group 1: AWARDEES + Organising Committee + Others
 * Group 2: APMB / AP Country Manager / AP Hub Manager / GHO
 * Group 3: KR SMT
 */
const { AWARDEES_CATEGORIES } = require('./category-flows');

const WESTIN_SEOUL = {
  name: 'The Westin Seoul Parnas',
  address: '524 Bongeunsa-ro, Gangnam-gu, Seoul 06164, Republic of Korea',
  telephone: '+82-2-3452-2500',
  passportNote: 'Due to security reasons, kindly present your passport for verification upon check-in at the hotel.',
};

const SHARED_NUMBERED_REMARKS = [
  'Any extras and incidentals will be on guests\' own account.',
  'Other special requests will be subject to hotel availability upon check-in.',
  'The official check-in time is 1500 hrs. If you arrive earlier than that, you may still check-in at the hotel and leave your luggage at the hospitality room.',
  'The check-out time is 1100 hrs. You may leave your luggage with the concierge and get it back when you are due to leave to the Airport.',
  'Late checkout will be available on request and is subject to room availability. Late check out up to 1800 hrs will incur additional charge of 50% based on room rates, after 1800 hrs will incur a full night charge.',
  'The room reservations you indicate on this registration will be booked by DHL and guaranteed. Should you not take up the room as a result of flight changes or other arrangements, the hotel will still levy room cancellation charges to you - unless you update the Event Secretariat changes by 24 July 2026.',
  'One night non refundable deposit will be charged upon reservation',
];

const AWARDEES_OC_OTHERS_REMARK_BULLETS = [
  'Payment has already been made for 4 nights on 06 -10 September 2026.',
  'No complimentary early check-in and/or late check-out will be provided. Please adjust your room reservation to accommodate your requirements.',
  'Additional room charges for early arrivals or late departure for personal stays will be borne by attendees. Room rate for Guest Room, Single Occupancy includes 1 breakfast is ~KRW 375,100/room/night',
  'Room rates stated are inclusive of 10% service charge & 11% prevailing VAT',
];

// Organising Committee: same group as Awardees/Others but without the payment sentence.
const ORGANISING_COMMITTEE_REMARK_BULLETS = AWARDEES_OC_OTHERS_REMARK_BULLETS.slice(1);

const LODGING_INFO_COPY = {
  awardees_oc_others: {
    key: 'awardees_oc_others',
    hotel: WESTIN_SEOUL,
    showRemarks: true,
    remarkBullets: AWARDEES_OC_OTHERS_REMARK_BULLETS,
    numberedRemarks: SHARED_NUMBERED_REMARKS,
    accommodationTable: null,
  },
  apmb_tier: {
    key: 'apmb_tier',
    hotel: WESTIN_SEOUL,
    showRemarks: true,
    remarkBullets: [
      'Payment has already been made for 2 nights on 08 - 10 September 2026.',
      'Additional room charges for early arrivals or late departure for personal stays will be borne by attendees. Room rate for Club Studio Single Occupancy with Club Access includes 1 breakfast is ~KRW 580,800/room/night.',
      'Room rates stated are inclusive of 10% service charge & 11% prevailing VAT, totally 21%',
    ],
    numberedRemarks: SHARED_NUMBERED_REMARKS,
    accommodationTable: null,
  },
  kr_smt: {
    key: 'kr_smt',
    hotel: WESTIN_SEOUL,
    showRemarks: true,
    remarkBullets: [
      'All the hotel guest rooms will be charged on your own account.',
      'Additional room charges for early arrivals or late departure for personal stays will be borne by attendees. Room rate for Club Studio Single Occupancy with Club Access includes 1 breakfast is ~KRW 580,800/room/night.',
      'Room rates stated are inclusive of 10% service charge & 11% prevailing VAT, totally 21%',
    ],
    numberedRemarks: SHARED_NUMBERED_REMARKS,
    accommodationTable: {
      title: 'Accommodation details',
      headers: ['Room type', 'Room rate'],
      rows: [
        { type: 'Club Guest Room, Single Occupancy', rate: '~KRW 580,800 per room per night' },
      ],
      footnote: 'The reservation link will be sent to your email seaprately where a credit card guarantee will be taken at the time of making the reservation but will only be charged on departure or in the instance of cancellation, no show or early departure.',
      showReservationEmail: true,
    },
  },
};

const AWARDEES_OC_OTHERS_CATEGORIES = [
  ...AWARDEES_CATEGORIES,
  'Organising Committee',
  'Others',
];

const APMB_TIER_CATEGORIES = [
  'APMB',
  'AP Country Manager',
  'AP Hub Manager',
  'GHO',
];

function getLodgingInfoGroup(category) {
  if (!category) return null;
  if (AWARDEES_OC_OTHERS_CATEGORIES.includes(category)) return 'awardees_oc_others';
  if (category === 'KR SMT' || category === 'VN SMT') return 'kr_smt';
  if (APMB_TIER_CATEGORIES.includes(category)) return 'apmb_tier';
  if (category === 'GMB') return 'awardees_oc_others';
  return 'awardees_oc_others';
}

function getLodgingRemarksVisible(category) {
  if (!category || category === 'GMB') return false;
  const groupKey = getLodgingInfoGroup(category);
  if (!groupKey) return false;
  return LODGING_INFO_COPY[groupKey]?.showRemarks !== false;
}

function getLodgingInfoCopy(category) {
  const groupKey = getLodgingInfoGroup(category);
  if (!groupKey) return null;

  const base = { ...LODGING_INFO_COPY[groupKey] };
  if (category === 'Organising Committee') {
    base.remarkBullets = ORGANISING_COMMITTEE_REMARK_BULLETS;
  }

  return {
    ...base,
    showRemarks: getLodgingRemarksVisible(category),
  };
}

module.exports = {
  LODGING_INFO_COPY,
  AWARDEES_OC_OTHERS_CATEGORIES,
  APMB_TIER_CATEGORIES,
  getLodgingInfoGroup,
  getLodgingInfoCopy,
  getLodgingRemarksVisible,
};
