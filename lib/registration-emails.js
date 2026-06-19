const { sendEmail, isValidEmail, normalizeAddress } = require('./email');
const { getSiteUrl } = require('./site-url');
const {
  ACCOUNT_WELCOME_EMAIL,
  ACCOUNT_CREATED_EMAIL,
  REGISTRATION_UPDATED_EMAIL,
} = require('../data/message-templates');

function getRecipient(user) {
  return normalizeAddress(user?.email || user?.userId).toLowerCase();
}

function buildEmailParams(req, user) {
  const siteUrl = getSiteUrl(req);
  return {
    firstName: user.givenName || '',
    lastName: user.surname || '',
    applicationUrl: `${siteUrl}/application`,
    user,
  };
}

/** Email 1 — register / account created */
async function sendAccountWelcomeEmail(req, user) {
  const recipient = getRecipient(user);
  if (!isValidEmail(recipient)) {
    return { sent: false, emailType: 'welcome', reason: `Invalid recipient: ${recipient || '(empty)'}` };
  }

  const emailParams = buildEmailParams(req, user);

  await sendEmail({
    to: recipient,
    subject: ACCOUNT_WELCOME_EMAIL.emailSubject,
    body: ACCOUNT_WELCOME_EMAIL.buildEmailBody(emailParams),
    html: ACCOUNT_WELCOME_EMAIL.buildEmailHtml(emailParams),
  });

  return { sent: true, emailType: 'welcome' };
}

/** Email 2 — first application save (registration confirmation + summary) */
async function sendRegistrationConfirmationEmail(req, user) {
  const recipient = getRecipient(user);
  if (!isValidEmail(recipient)) {
    return { sent: false, emailType: 'created', reason: `Invalid recipient: ${recipient || '(empty)'}` };
  }

  const emailParams = buildEmailParams(req, user);

  await sendEmail({
    to: recipient,
    subject: ACCOUNT_CREATED_EMAIL.emailSubject,
    body: ACCOUNT_CREATED_EMAIL.buildEmailBody(emailParams),
    html: ACCOUNT_CREATED_EMAIL.buildEmailHtml(emailParams),
  });

  return { sent: true, emailType: 'created', registrationConfirmationEmailSent: true };
}

/** Email 3 — subsequent application saves */
async function sendRegistrationUpdatedEmail(req, user) {
  const recipient = getRecipient(user);
  if (!isValidEmail(recipient)) {
    return { sent: false, emailType: 'updated', reason: `Invalid recipient: ${recipient || '(empty)'}` };
  }

  const emailParams = buildEmailParams(req, user);

  await sendEmail({
    to: recipient,
    subject: REGISTRATION_UPDATED_EMAIL.emailSubject,
    body: REGISTRATION_UPDATED_EMAIL.buildEmailBody(emailParams),
    html: REGISTRATION_UPDATED_EMAIL.buildEmailHtml(emailParams),
  });

  return { sent: true, emailType: 'updated' };
}

async function sendApplicationSaveEmail(req, user, application) {
  const isFirstSave = application?.registrationConfirmationEmailSent !== true;

  if (isFirstSave) {
    return sendRegistrationConfirmationEmail(req, user);
  }

  return sendRegistrationUpdatedEmail(req, user);
}

module.exports = {
  sendAccountWelcomeEmail,
  sendRegistrationConfirmationEmail,
  sendRegistrationUpdatedEmail,
  sendApplicationSaveEmail,
  // legacy alias
  sendAccountCreatedEmail: sendRegistrationConfirmationEmail,
};
