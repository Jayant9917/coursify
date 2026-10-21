const { Resend } = require("resend");
const { render } = require("@react-email/render");

const config = require("../config");
const { PasswordResetEmail, PaymentNotificationEmail } = require("./emailTemplates");

let resendClient;

function getResendClient() {
  if (!config.resendApiKey) return null;
  if (!resendClient) resendClient = new Resend(config.resendApiKey);
  return resendClient;
}

function isEmailConfigured() {
  return config.emailProvider === "resend" && Boolean(config.resendApiKey);
}

async function sendEmail({ from, to, subject, react, replyTo = config.emailReplyTo }) {
  const html = await render(react);
  const client = getResendClient();

  if (!client) {
    if (config.emailProvider === "console") {
      console.info(`[email.preview] ${subject} -> ${to}`);
      return { id: "development-preview" };
    }
    throw new Error("Resend email delivery is not configured");
  }

  const { data, error } = await client.emails.send({
    from,
    to: [to],
    subject,
    html,
    replyTo,
  });

  if (error) {
    const deliveryError = new Error(error.message || "Email delivery failed");
    deliveryError.cause = error;
    throw deliveryError;
  }

  return data;
}

async function sendPasswordResetEmail({ email, resetUrl }) {
  return sendEmail({
    from: config.emailFromSecurity,
    to: email,
    subject: "Reset your Skillnest password",
    react: PasswordResetEmail({ resetUrl, logoUrl: config.emailLogoUrl }),
  });
}

async function sendPaymentNotificationEmail({ email, title, message, orderId, actionUrl }) {
  return sendEmail({
    from: config.emailFromNotifications,
    to: email,
    subject: title,
    react: PaymentNotificationEmail({ title, message, orderId, actionUrl, logoUrl: config.emailLogoUrl }),
  });
}

module.exports = { isEmailConfigured, sendEmail, sendPasswordResetEmail, sendPaymentNotificationEmail };
