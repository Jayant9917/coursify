const React = require("react");
const {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} = require("@react-email/components");

const h = React.createElement;

const baseStyles = {
  body: { backgroundColor: "#f5f7f4", color: "#172019", fontFamily: "Arial, sans-serif", margin: 0 },
  container: { backgroundColor: "#ffffff", border: "1px solid #e2e8e3", borderRadius: "18px", margin: "32px auto", maxWidth: "560px", padding: "32px" },
  eyebrow: { color: "#5c7c63", fontSize: "12px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" },
  text: { color: "#526157", fontSize: "15px", lineHeight: "1.6" },
  button: { backgroundColor: "#b9ef66", borderRadius: "10px", color: "#172019", display: "inline-block", fontSize: "15px", fontWeight: "700", padding: "13px 20px", textDecoration: "none" },
  footer: { color: "#78857b", fontSize: "12px", lineHeight: "1.5" },
};

function EmailShell({ preview, children, logoUrl }) {
  return h(
    Html,
    null,
    h(Head),
    h(Preview, null, preview),
    h(
      Body,
      { style: baseStyles.body },
      h(
        Container,
        { style: baseStyles.container },
        logoUrl ? h(Img, { src: logoUrl, width: "42", height: "42", alt: "Skillnest", style: { marginBottom: "24px" } }) : null,
        children,
        h(Hr, { style: { borderColor: "#e2e8e3", margin: "28px 0 18px" } }),
        h(Text, { style: baseStyles.footer }, "If you did not request this email, you can safely ignore it. For help, contact support@skillnest.com."),
      ),
    ),
  );
}

function PasswordResetEmail({ resetUrl, logoUrl }) {
  return h(
    EmailShell,
    { preview: "Reset your Skillnest password", logoUrl },
    h(Text, { style: baseStyles.eyebrow }, "Skillnest security"),
    h(Heading, { style: { color: "#172019", fontSize: "30px", lineHeight: "1.15", margin: "12px 0 16px" } }, "Reset your password"),
    h(Text, { style: baseStyles.text }, "We received a request to change your Skillnest password. Use the button below to choose a new one."),
    h(Section, { style: { margin: "28px 0" } }, h(Button, { href: resetUrl, style: baseStyles.button }, "Reset password")),
    h(Text, { style: baseStyles.text }, "This link expires in 15 minutes and can only be used once."),
  );
}

module.exports = { PasswordResetEmail };
