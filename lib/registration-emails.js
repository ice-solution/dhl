const { sendEmail } = require('./email');
const { getSiteUrl } = require('./site-url');
const { ACCOUNT_CREATED_EMAIL, REGISTRATION_UPDATED_EMAIL } = require('../data/message-templates');

async function sendAccountCreatedEmail(req, user) {
  const siteUrl = getSiteUrl(req);
  const applicationUrl = `${siteUrl}/application`;
  const recipient = user.email || user.userId;
  const emailParams = {
    firstName: user.givenName || '',
    lastName: user.surname || '',
    applicationUrl,
    user,
  };

  await sendEmail({
    to: recipient,
    subject: ACCOUNT_CREATED_EMAIL.emailSubject,
    body: ACCOUNT_CREATED_EMAIL.buildEmailBody(emailParams),
    html: ACCOUNT_CREATED_EMAIL.buildEmailHtml(emailParams),
  });
}

async function sendRegistrationUpdatedEmail(req, user) {
  const siteUrl = getSiteUrl(req);
  const applicationUrl = `${siteUrl}/application`;
  const recipient = user.email || user.userId;
  const emailParams = {
    firstName: user.givenName || '',
    lastName: user.surname || '',
    applicationUrl,
  };

  await sendEmail({
    to: recipient,
    subject: REGISTRATION_UPDATED_EMAIL.emailSubject,
    body: REGISTRATION_UPDATED_EMAIL.buildEmailBody(emailParams),
    html: REGISTRATION_UPDATED_EMAIL.buildEmailHtml(emailParams),
  });
}

async function sendApplicationSaveEmail(req, user, application) {
  const isFirstSave = application?.registrationConfirmationEmailSent !== true;

  if (isFirstSave) {
    await sendAccountCreatedEmail(req, user);
    return { registrationConfirmationEmailSent: true, emailType: 'created' };
  }

  await sendRegistrationUpdatedEmail(req, user);
  return { emailType: 'updated' };
}

module.exports = {
  sendAccountCreatedEmail,
  sendRegistrationUpdatedEmail,
  sendApplicationSaveEmail,
};
