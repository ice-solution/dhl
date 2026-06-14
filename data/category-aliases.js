/**
 * Form dropdown values that map to a different xlsx entitlement column.
 */
const CATEGORY_ENTITLEMENT_KEY = {
  'VN SMT': 'KR SMT', // legacy records
  Others: 'Other',
};

function entitlementKey(category) {
  return CATEGORY_ENTITLEMENT_KEY[category] || category;
}

function hasEntitlementAlias(category) {
  return Object.prototype.hasOwnProperty.call(CATEGORY_ENTITLEMENT_KEY, category);
}

module.exports = {
  CATEGORY_ENTITLEMENT_KEY,
  entitlementKey,
  hasEntitlementAlias,
};
