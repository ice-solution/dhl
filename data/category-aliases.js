/**
 * Form dropdown values that map to a different xlsx entitlement column.
 */
const CATEGORY_ENTITLEMENT_KEY = {
  'VN SMT': 'KR SMT', // legacy records
  Others: 'Employee of the Year - Sales Excellence',
  'Employee of the Year - Sales Excellence': 'Employee of the Year - Sales Excellence',
};

/** Normalize stored category values to current dropdown values */
const CATEGORY_VALUE_ALIASES = {
  'Employee of the Year - Sales Excellence': 'Others',
};

function normalizeCategoryValue(category) {
  if (!category) return category;
  return CATEGORY_VALUE_ALIASES[category] || category;
}

function resolveCategory(category) {
  return normalizeCategoryValue(category);
}

function entitlementKey(category) {
  const resolved = resolveCategory(category);
  return CATEGORY_ENTITLEMENT_KEY[resolved] || resolved;
}

function hasEntitlementAlias(category) {
  const resolved = resolveCategory(category);
  return Object.prototype.hasOwnProperty.call(CATEGORY_ENTITLEMENT_KEY, resolved)
    || Object.prototype.hasOwnProperty.call(CATEGORY_VALUE_ALIASES, category);
}

/**
 * Legacy non-awardee accounts may still have category "Others" before Guests rename.
 * Awardee "Others" requires GID / shirt size — migrate old guest records to Guests.
 */
async function migrateLegacyGuestCategory(user) {
  if (!user || user.category !== 'Others') return user;
  if (user.globalId || user.shirtSize) return user;

  user.category = 'Guests';
  await user.save();
  return user;
}

module.exports = {
  CATEGORY_ENTITLEMENT_KEY,
  CATEGORY_VALUE_ALIASES,
  normalizeCategoryValue,
  resolveCategory,
  entitlementKey,
  hasEntitlementAlias,
  migrateLegacyGuestCategory,
};
