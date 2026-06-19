#!/usr/bin/env node
/**
 * Test SES email configuration. Usage:
 *   node scripts/test-email.js recipient@example.com
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { sendEmail, getSesConfigStatus } = require('../lib/email');

async function main() {
  const to = process.argv[2];
  const status = getSesConfigStatus();

  console.log('SES config:', {
    region: status.region,
    from: status.senderEmail || '(missing)',
    hasSender: status.hasSender,
    hasAccessKey: status.hasAccessKey,
    hasSecretKey: status.hasSecretKey,
  });

  if (!to) {
    console.error('Usage: node scripts/test-email.js recipient@example.com');
    process.exit(1);
  }

  await sendEmail({
    to,
    subject: 'DHL EOY – SES test',
    body: 'This is a test email from the DHL registration portal.',
    html: '<p>This is a <strong>test email</strong> from the DHL registration portal.</p>',
  });

  console.log('Test email sent successfully.');
}

main().catch((err) => {
  console.error('Test email failed:', err.message || err);
  process.exit(1);
});
