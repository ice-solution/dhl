const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

let sesClient;

function getSesClient() {
  if (!sesClient) {
    sesClient = new SESClient({
      region: process.env.AWS_SES_REGION || 'ap-southeast-1',
      credentials: process.env.AWS_SES_ACCESS_KEY_ID && process.env.AWS_SES_SECRET_ACCESS_KEY
        ? {
          accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
        }
        : undefined,
    });
  }
  return sesClient;
}

async function sendEmail({ to, subject, body, html }) {
  const from = process.env.SENDER_EMAIL;
  if (!from) {
    throw new Error('SENDER_EMAIL is not configured');
  }

  const messageBody = html
    ? {
      Text: { Data: body, Charset: 'UTF-8' },
      Html: { Data: html, Charset: 'UTF-8' },
    }
    : { Text: { Data: body, Charset: 'UTF-8' } };

  const command = new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: messageBody,
    },
  });

  await getSesClient().send(command);
}

module.exports = {
  sendEmail,
};
