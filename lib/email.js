const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

let sesClient;

function normalizeAddress(value) {
  return String(value || '').trim().replace(/^["']|["']$/g, '');
}

function isValidEmail(value) {
  const email = normalizeAddress(value);
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getSesConfigStatus() {
  const senderEmail = normalizeAddress(process.env.SENDER_EMAIL);
  const hasSender = isValidEmail(senderEmail);
  const hasAccessKey = !!normalizeAddress(process.env.AWS_SES_ACCESS_KEY_ID);
  const hasSecretKey = !!normalizeAddress(process.env.AWS_SES_SECRET_ACCESS_KEY);
  const region = normalizeAddress(process.env.AWS_SES_REGION) || 'ap-southeast-1';

  return {
    senderEmail,
    hasSender,
    hasAccessKey,
    hasSecretKey,
    region,
    ready: hasSender && (hasAccessKey && hasSecretKey),
  };
}

function logEmailConfigOnStartup() {
  const status = getSesConfigStatus();
  if (!status.hasSender) {
    console.warn('[email] SENDER_EMAIL is missing or invalid — emails will not send.');
    return;
  }
  if (!status.hasAccessKey || !status.hasSecretKey) {
    console.warn('[email] AWS_SES_ACCESS_KEY_ID / AWS_SES_SECRET_ACCESS_KEY not set — using default AWS credential chain (IAM role).');
  }
  console.log(`[email] SES configured: region=${status.region}, from=${status.senderEmail}`);
}

function getSesClient() {
  if (!sesClient) {
    const region = normalizeAddress(process.env.AWS_SES_REGION) || 'ap-southeast-1';
    const accessKeyId = normalizeAddress(process.env.AWS_SES_ACCESS_KEY_ID);
    const secretAccessKey = normalizeAddress(process.env.AWS_SES_SECRET_ACCESS_KEY);

    sesClient = new SESClient({
      region,
      credentials: accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
    });
  }
  return sesClient;
}

async function sendEmail({ to, subject, body, html }) {
  const from = normalizeAddress(process.env.SENDER_EMAIL);
  const recipient = normalizeAddress(to).toLowerCase();

  if (!isValidEmail(from)) {
    throw new Error('SENDER_EMAIL is missing or invalid');
  }
  if (!isValidEmail(recipient)) {
    throw new Error(`Invalid recipient email: "${to || ''}"`);
  }
  if (!subject || !body) {
    throw new Error('Email subject and body are required');
  }

  const messageBody = html
    ? {
      Text: { Data: body, Charset: 'UTF-8' },
      Html: { Data: html, Charset: 'UTF-8' },
    }
    : { Text: { Data: body, Charset: 'UTF-8' } };

  const command = new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: [recipient] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: messageBody,
    },
  });

  const result = await getSesClient().send(command);
  console.log(`[email] Sent to ${recipient} (MessageId: ${result.MessageId || 'n/a'})`);
  return result;
}

module.exports = {
  sendEmail,
  isValidEmail,
  normalizeAddress,
  getSesConfigStatus,
  logEmailConfigOnStartup,
};
