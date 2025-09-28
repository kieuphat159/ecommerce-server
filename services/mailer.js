const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail", // hoặc SMTP server khác
  auth: {
    user: process.env.EMAIL_USER, // địa chỉ Gmail
    pass: process.env.EMAIL_PASSWORD, // app password (16 ký tự)
  },
});

exports.sendMail = async (to, subject, html) => {
  return transporter.sendMail({
    from: `"3legant" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
