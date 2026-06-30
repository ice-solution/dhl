/**
 * Message templates from fields_details.xlsx → sheet "MESSAGE AFTER SUBMISSION"
 */
const {
  formatRegistrationSummaryText,
  formatRegistrationSummaryHtml,
} = require('../lib/registration-summary');

const SECRETARIAT_EMAIL = 'apeceoy@dhl.com';
const ENQUIRY_EMAIL = 'apeceoy@dhl.com';
const REGISTRATION_DEADLINE = '24 July 2026';
const EVENT_NAME = 'DHL EOY 2025';
const EMAIL_FONT = 'Arial, Helvetica, sans-serif';

function formatGreetingName(firstName, lastName) {
  const given = (firstName || '').trim();
  const surname = (lastName || '').trim();
  if (given && surname) return `${given} ${surname}`;
  return given || surname || 'Participant';
}

function buildCtaButtonHtml(url, label = 'Complete Registration') {
  return `<p style="margin:24px 0;font-family:${EMAIL_FONT};">
  <a href="${url}" style="display:inline-block;padding:14px 32px;background:#FFCC00;color:#D40511;font-weight:bold;text-decoration:none;border-radius:4px;">${label}</a>
</p>`;
}

function buildEmailSignatureText() {
  return `With Regards,
Eva Ng
Event Secretariat`;
}

function buildEmailSignatureHtml() {
  return `<p style="font-family:${EMAIL_FONT};">With Regards,<br>Eva Ng<br>Event Secretariat</p>`;
}

function buildWelcomeSignOffText() {
  return `Sincerely,
Event Secretariat
Eva Ng
e: ${SECRETARIAT_EMAIL}`;
}

function buildWelcomeSignOffHtml() {
  return `<p style="font-family:${EMAIL_FONT};">Sincerely,<br>Event Secretariat<br>Eva Ng<br>e: <a href="mailto:${SECRETARIAT_EMAIL}">${SECRETARIAT_EMAIL}</a></p>`;
}

const ACCOUNT_CREATED_PAGE = {
  title: 'Your Account has been CREATED!',
  bodyParagraphs: [
    `Thank you for creating your ${EVENT_NAME} account. `,
    'Please click on the button below to complete your registration.',
  ],
  deadlineReminder: `To ensure smooth arrangement, please be reminded to complete your personal and traveling details by ${REGISTRATION_DEADLINE}.`,
  loginReminder: 'You can log in to your account to update these details before the deadline.',
  closing: 'Thank you and we look forward to welcoming you in Seoul, South Korea!',
  signOff: 'Sincerely,\nEva Ng\nEvent Secretariat',
};

/** Email 1 — sent immediately when account is created (register) */
const ACCOUNT_WELCOME_EMAIL = {
  emailSubject: `${EVENT_NAME} - Your Account has been CREATED!`,
  ctaLabel: 'Complete Registration',
  buildEmailBody({ firstName, lastName, applicationUrl }) {
    const name = formatGreetingName(firstName, lastName);

    return `Dear ${name},

Thank you for creating your ${EVENT_NAME} account.

Please click on the button below to complete your registration.

Registration link: ${applicationUrl}

To ensure smooth arrangement, please be reminded to complete your personal and traveling details by ${REGISTRATION_DEADLINE}.

You can log in to your account to update these details before the deadline.

Should you have any enquiries, please contact our event secretariat by email ${ENQUIRY_EMAIL}

Thank you and we look forward to welcoming you in Seoul, South Korea!

${buildWelcomeSignOffText()}`;
  },
  buildEmailHtml({ firstName, lastName, applicationUrl }) {
    const name = formatGreetingName(firstName, lastName);

    return `<!DOCTYPE html>
<html>
<body style="font-family:${EMAIL_FONT};color:#333;line-height:1.6;max-width:600px;">
  <p>Dear ${name},</p>
  <p>Thank you for creating your ${EVENT_NAME} account. </p>
  <p>Please click on the button below to complete your registration.</p>
  ${buildCtaButtonHtml(applicationUrl, ACCOUNT_WELCOME_EMAIL.ctaLabel)}
  <p style="font-size:13px;color:#666;font-family:${EMAIL_FONT};">Or copy this link: <a href="${applicationUrl}" style="font-family:${EMAIL_FONT};">${applicationUrl}</a></p>
  <p>To ensure smooth arrangement, please be reminded to complete your personal and traveling details by <strong>${REGISTRATION_DEADLINE}</strong>.</p>
  <p>You can log in to your account to update these details before the deadline.</p>
  <p>Should you have any enquiries, please contact our event secretariat by email <a href="mailto:${ENQUIRY_EMAIL}">${ENQUIRY_EMAIL}</a></p>
  <p>Thank you and we look forward to welcoming you in Seoul, South Korea!</p>
  ${buildWelcomeSignOffHtml()}
</body>
</html>`;
  },
};

/** Email 2 — sent on first application save (includes registration summary) */
const ACCOUNT_CREATED_EMAIL = {
  emailSubject: `${EVENT_NAME} - Your Information has been REGISTERED!`,
  ctaLabel: 'Complete Registration',
  buildEmailBody({ firstName, lastName, applicationUrl, user }) {
    const name = formatGreetingName(firstName, lastName);
    const summary = formatRegistrationSummaryText(user);

    return `Dear ${name},

Thank you for registering for ${EVENT_NAME}.

If you would like to modify your registration information or update us your flight details, please click the below link. The deadline to complete your registration is ${REGISTRATION_DEADLINE}.

Registration link: ${applicationUrl}

Registration Summary

${summary}

A confirmation note with the event details will be sent to you closer to the event date.

In the meantime, if you have any inquiries regarding this event, please contact our event secretariat by email at ${SECRETARIAT_EMAIL}.

${buildEmailSignatureText()}`;
  },
  buildEmailHtml({ firstName, lastName, applicationUrl, user }) {
    const name = formatGreetingName(firstName, lastName);
    const summaryHtml = formatRegistrationSummaryHtml(user);

    return `<!DOCTYPE html>
<html>
<body style="font-family:${EMAIL_FONT};color:#333;line-height:1.6;max-width:600px;">
  <p>Dear ${name},</p>
  <p>Thank you for registering for ${EVENT_NAME}.</p>
  <p>If you would like to modify your registration information or update us your flight details, please click the button below. The deadline to complete your registration is <strong>${REGISTRATION_DEADLINE}</strong>.</p>
  ${buildCtaButtonHtml(applicationUrl, ACCOUNT_CREATED_EMAIL.ctaLabel)}
  <p style="font-size:13px;color:#666;font-family:${EMAIL_FONT};">Or copy this link: <a href="${applicationUrl}" style="font-family:${EMAIL_FONT};">${applicationUrl}</a></p>
  <p style="margin-top:24px;font-weight:bold;font-family:${EMAIL_FONT};">Registration Summary</p>
  ${summaryHtml}
  <p style="margin-top:24px;">A confirmation note with the event details will be sent to you closer to the event date.</p>
  <p>In the meantime, if you have any inquiries regarding this event, please contact our event secretariat by email at <a href="mailto:${SECRETARIAT_EMAIL}">${SECRETARIAT_EMAIL}</a>.</p>
  ${buildEmailSignatureHtml()}
</body>
</html>`;
  },
};

/** Email 3 — sent on subsequent application saves */
const REGISTRATION_UPDATED_EMAIL = {
  emailSubject: `${EVENT_NAME} - Your Information has been UPDATED!`,
  buildEmailBody({ firstName, lastName, applicationUrl }) {
    const name = formatGreetingName(firstName, lastName);

    return `Dear ${name},

Thank you for updating the information.

To ensure smooth arrangement, please be reminded to complete your personal and traveling details by ${REGISTRATION_DEADLINE}.

You can log in to your account to update these details before the deadline.

Registration link: ${applicationUrl}

Should you have any enquiries, please contact our event secretariat by email at ${SECRETARIAT_EMAIL}

Thank you and we look forward to welcoming you in Seoul, South Korea!

${buildEmailSignatureText()}`;
  },
  buildEmailHtml({ firstName, lastName, applicationUrl }) {
    const name = formatGreetingName(firstName, lastName);

    return `<!DOCTYPE html>
<html>
<body style="font-family:${EMAIL_FONT};color:#333;line-height:1.6;max-width:600px;">
  <p>Dear ${name},</p>
  <p>Thank you for updating the information.</p>
  <p>To ensure smooth arrangement, please be reminded to complete your personal and traveling details by <strong>${REGISTRATION_DEADLINE}</strong>.</p>
  <p>You can log in to your account to update these details before the deadline.</p>
  ${buildCtaButtonHtml(applicationUrl, 'Continue Registration')}
  <p style="font-size:13px;color:#666;font-family:${EMAIL_FONT};">Or copy this link: <a href="${applicationUrl}" style="font-family:${EMAIL_FONT};">${applicationUrl}</a></p>
  <p>Should you have any enquiries, please contact our event secretariat by email at <a href="mailto:${SECRETARIAT_EMAIL}">${SECRETARIAT_EMAIL}</a></p>
  <p>Thank you and we look forward to welcoming you in Seoul, South Korea!</p>
  ${buildEmailSignatureHtml()}
</body>
</html>`;
  },
};

/** Email 4 — forgot password */
const FORGOT_PASSWORD = {
  pageTitle: 'Forgotten your password?',
  pageInstruction: 'Please fill in your registered email',
  emailLabel: 'Email',
  submitLabel: 'Submit',
  successMessage: 'A password reset email has been sent to your registered email address. Please check your inbox.',
  notRegisteredMessage: 'This email address is not registered. Please check your email or create a new account.',
  emailSubject: `${EVENT_NAME} - Reset your PASSWORD!`,
  buildEmailBody({ firstName, lastName, email, password, siteUrl }) {
    const name = formatGreetingName(firstName, lastName);
    return `Dear ${name},

Further to your request, please find below your login credential and new password. You may use these information to access your account through
${siteUrl}

Email: ${email}
New Password: ${password}

A confirmation note with the event details will be sent to you closer to the event date.
In the meantime, if you have any inquiries regarding this event, please contact our event secretariat by email at ${SECRETARIAT_EMAIL}.

${buildEmailSignatureText()}`;
  },
  buildEmailHtml({ firstName, lastName, email, password, siteUrl }) {
    const name = formatGreetingName(firstName, lastName);
    return `<!DOCTYPE html>
<html>
<body style="font-family:${EMAIL_FONT};color:#333;line-height:1.6;max-width:600px;">
  <p style="font-family:${EMAIL_FONT};">Dear ${name},</p>
  <p style="font-family:${EMAIL_FONT};">Further to your request, please find below your login credential and new password. You may use these information to access your account through
  <a href="${siteUrl}">${siteUrl}</a></p>
  <p style="font-family:${EMAIL_FONT};">Email: ${email}<br>New Password: ${password}</p>
  <p style="font-family:${EMAIL_FONT};">A confirmation note with the event details will be sent to you closer to the event date.</p>
  <p style="font-family:${EMAIL_FONT};">In the meantime, if you have any inquiries regarding this event, please contact our event secretariat by email at <a href="mailto:${SECRETARIAT_EMAIL}">${SECRETARIAT_EMAIL}</a>.</p>
  ${buildEmailSignatureHtml()}
</body>
</html>`;
  },
};

module.exports = {
  SECRETARIAT_EMAIL,
  ENQUIRY_EMAIL,
  REGISTRATION_DEADLINE,
  EVENT_NAME,
  EMAIL_FONT,
  ACCOUNT_CREATED_PAGE,
  ACCOUNT_WELCOME_EMAIL,
  ACCOUNT_CREATED_EMAIL,
  REGISTRATION_UPDATED_EMAIL,
  FORGOT_PASSWORD,
};
