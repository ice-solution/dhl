const express = require('express');
const User = require('../models/User');
const Application = require('../models/Application');
const {
  isFieldVisible,
  isGlobalIdVisible,
  DIETARY_OPTIONS,
  getVisibilityMatrix,
  getConfirmDisplay,
  normalizeRegistrationBody,
} = require('../data/registration-fields');
const formOptions = require('../data/form-options');
const { SECRETARIAT_EMAIL } = require('../data/message-templates');
const { clearUserSession } = require('../middleware/auth');
const { sendAccountWelcomeEmail } = require('../lib/registration-emails');

const router = express.Router();

const categoryOptions = formOptions.getOptions('titleGroup');
const categoryValues = categoryOptions.map((o) => o.value);
const visibilityMatrix = getVisibilityMatrix(categoryValues);

function getExtraOptions() {
  return {
    salutation: [
      { value: '', label: 'Please select' },
      { value: 'Mr', label: 'Mr' },
      { value: 'Mrs', label: 'Mrs' },
      { value: 'Ms', label: 'Ms' },
      { value: 'Miss', label: 'Miss' },
    ],
    shirtSize: [
      { value: '', label: 'Please select' },
      ...['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'].map((s) => ({ value: s, label: s })),
    ],
  };
}

function resolveLabel(key, value) {
  if (!value) return '';
  const extra = getExtraOptions();
  const options = extra[key] || formOptions.getOptions(key);
  const match = options.find((o) => String(o.value) === String(value));
  return match?.label || value;
}

function renderRegisterForm(res, { error = null, values = {}, selectedCategory = '' } = {}) {
  const extra = getExtraOptions();
  res.render('register/form', {
    categories: categoryOptions,
    selectedCategory,
    dietaryOptions: DIETARY_OPTIONS,
    visibilityMatrix,
    getOptions: (key) => extra[key] || formOptions.getOptions(key),
    error,
    values,
  });
}

function isValidCategory(category) {
  return categoryValues.includes(category);
}

function validateRegistration(body) {
  const category = body.category?.trim() || '';
  const errors = [];
  const workEmail = body.workEmail?.trim().toLowerCase();
  const password = body.password || '';
  const confirmPassword = body.confirmPassword || '';

  if (!isValidCategory(category)) {
    errors.push('Please select a category.');
  }
  if (isFieldVisible('work_email_address', category) && !workEmail) {
    errors.push('Work Email Address is required.');
  }
  if (isFieldVisible('password', category) && password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  }
  if (isFieldVisible('conirm_password', category) && password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }
  if (isGlobalIdVisible(category) && !body.globalId?.trim()) {
    errors.push('Global ID (GID) is required.');
  }
  if (!body.photoConsent) {
    errors.push('You must agree to the photo/video notice.');
  }
  if (!body.socialEventPolicyConsent) {
    errors.push('You must agree to the Social Event Policy declaration.');
  }

  return { category, workEmail, password, errors };
}

async function createRegistration(req, body) {
  const category = body.category?.trim() || '';
  const workEmail = body.workEmail?.trim().toLowerCase();
  const password = body.password || '';
  const dietaryRequirements = Array.isArray(body.dietaryRequirements)
    ? body.dietaryRequirements
    : body.dietaryRequirements ? [body.dietaryRequirements] : [];

  const user = await User.create({
    userId: workEmail,
    password,
    email: workEmail,
    category,
    jobTitle: body.jobTitle || '',
    functionUnit: body.functionUnit || '',
    functionUnitOthers: body.functionUnitOthers || '',
    businessUnit: body.businessUnit || '',
    globalId: body.globalId?.trim() || '',
    salutation: body.salutation || '',
    surname: body.surname || '',
    givenName: body.givenName || '',
    nameOnBadge: body.nameOnBadge || '',
    fullName: [body.givenName, body.surname].filter(Boolean).join(' '),
    gender: body.gender || '',
    officeTel: {
      countryCode: body.officeTelCountry || '',
      areaCode: body.officeTelArea || '',
      number: body.officeTel || '',
    },
    mobile: {
      countryCode: body.mobileCountry || '',
      areaCode: body.mobileArea || '',
      number: body.mobileNumber || '',
    },
    specialPhysicalCondition: body.specialPhysicalCondition || '',
    specialPhysicalConditionDetail: body.specialPhysicalConditionDetail || '',
    dietaryRequirements,
    otherDietaryRequirements: body.otherDietaryRequirements || '',
    galaMainCourse: body.galaMainCourse || '',
    shirtSize: body.shirtSize || '',
    photoConsent: !!body.photoConsent,
    socialEventPolicyConsent: !!body.socialEventPolicyConsent,
  });

  await Application.create({
    user: user._id,
    accountLogin: {
      category,
      userId: workEmail,
      jobTitle: body.jobTitle || '',
      functionUnit: body.functionUnit || '',
      businessUnit: body.businessUnit || '',
      globalId: body.globalId?.trim() || '',
      fullName: user.fullName,
    },
    profile: {
      salutation: body.salutation || '',
      firstName: body.givenName || '',
      surname: body.surname || '',
      nameOnTag: body.nameOnBadge || '',
      gender: body.gender || '',
      mobile: user.mobile,
      specialPhysicalCondition: body.specialPhysicalCondition || '',
      specialPhysicalConditionYes: body.specialPhysicalConditionDetail || '',
      dietaryRequirements,
      otherDietaryRequirements: body.otherDietaryRequirements || '',
      galaMainCourse: body.galaMainCourse || '',
    },
    costume: {
      shirtSize: body.shirtSize || '',
    },
    status: 'draft',
    hasChanges: true,
    registrationConfirmationEmailSent: false,
    socialEventPolicyAccepted: !!body.socialEventPolicyConsent,
    agreementAccepted: !!body.photoConsent,
  });

  return user;
}

function buildGreetingName(user) {
  const given = (user.givenName || '').trim();
  const surname = (user.surname || '').trim();
  if (given && surname) {
    return `${given} ${surname.toUpperCase()}`;
  }
  return user.fullName || user.userId || 'Participant';
}

router.get('/register/success', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  if (!req.session.regJustCreated) {
    return res.redirect('/application');
  }

  try {
    const user = await User.findById(req.session.userId);
    if (!user) {
      clearUserSession(req);
      return res.redirect('/login');
    }

    req.session.regJustCreated = false;

    res.render('register/success', {
      greetingName: buildGreetingName(user),
      secretariatEmail: SECRETARIAT_EMAIL,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/application');
  }
});

router.get('/register', async (req, res) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user) {
      return res.redirect('/application');
    }
    clearUserSession(req);
  }
  res.render('register/landing');
});

router.get('/register/new', async (req, res) => {
  if (req.session.userId) {
    const user = await User.findById(req.session.userId);
    if (user) {
      return res.redirect('/application');
    }
    clearUserSession(req);
  }
  const draft = req.session.regDraft || {};
  renderRegisterForm(res, {
    values: draft,
    selectedCategory: draft.category || '',
  });
});

router.get('/register/form', (req, res) => {
  res.redirect('/register/new');
});

router.get('/register/confirm', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/application');
  }
  if (!req.session.regDraft) {
    return res.redirect('/register/new');
  }

  const body = req.session.regDraft;
  const category = body.category || '';
  const display = getConfirmDisplay(category, body, resolveLabel);

  res.render('register/confirm', {
    display,
    photoConsent: !!body.photoConsent,
    error: null,
  });
});

router.post('/register/new', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/application');
  }

  const body = normalizeRegistrationBody(req.body);
  const { category, workEmail, errors } = validateRegistration(body);

  if (workEmail && isFieldVisible('work_email_address', category)) {
    const existing = await User.findOne({ userId: workEmail });
    if (existing) errors.push('This email is already registered. Please log in instead.');
  }

  if (errors.length) {
    return renderRegisterForm(res, {
      error: errors.join(' '),
      values: body,
      selectedCategory: category,
    });
  }

  req.session.regDraft = body;
  res.redirect('/register/confirm');
});

router.post('/register/confirm', async (req, res) => {
  if (req.session.userId) {
    return res.redirect('/application');
  }

  const body = req.session.regDraft;
  if (!body) {
    return res.redirect('/register/new');
  }

  const { category, workEmail, password, errors } = validateRegistration(body);

  if (workEmail && isFieldVisible('work_email_address', category)) {
    const existing = await User.findOne({ userId: workEmail });
    if (existing) errors.push('This email is already registered. Please log in instead.');
  }

  if (errors.length) {
    const display = getConfirmDisplay(category, body, resolveLabel);
    return res.render('register/confirm', {
      display,
      photoConsent: !!body.photoConsent,
      error: errors.join(' '),
    });
  }

  try {
    const user = await createRegistration(req, body);
    delete req.session.regDraft;
    req.session.userId = user._id.toString();
    req.session.displayName = user.fullName || user.userId;
    req.session.regJustCreated = true;

    try {
      const emailResult = await sendAccountWelcomeEmail(req, user);
      if (emailResult.sent) {
        console.log(`[email] Account welcome email sent to ${user.userId}`);
      } else if (emailResult.reason) {
        console.error(`[email] Account welcome email skipped: ${emailResult.reason}`);
      }
    } catch (emailErr) {
      console.error('Account welcome email failed:', emailErr);
    }

    res.redirect('/register/success');
  } catch (err) {
    console.error(err);
    const display = getConfirmDisplay(category, body, resolveLabel);
    res.render('register/confirm', {
      display,
      photoConsent: !!body.photoConsent,
      error: 'Registration failed. Please try again.',
    });
  }
});

router.post('/register/form', (req, res) => {
  res.redirect(307, '/register/new');
});

module.exports = router;
