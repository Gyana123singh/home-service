const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendContactMail = async ({ name, email, phone, subject, message }) => {
  const mailOptions = {
    from: process.env.SMTP_USER, // Always use authenticated email
    to: process.env.ADMIN_EMAIL,
    replyTo: email,
    subject: `New Contact Form Submission: ${subject || "No Subject"}`,
    html: `
      <h3>New Contact Request</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <div>
        <strong>Message:</strong><br/>
        ${message.replace(/\n/g, "<br>")}
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendRegistrationMail = async ({ firstName, lastName, email }) => {
  const fullName = `${firstName} ${lastName}`;
  // Email to admin
  const adminMailOptions = {
    from: process.env.SMTP_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `New User Registration`,
    html: `
      <h3>New User Registered</h3>
      <p>A new customer has signed up on the platform.</p>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
    `,
  };

  // Welcome email to user
  const userMailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: `Welcome to Home Service!`,
    html: `
      <h3>Welcome, ${firstName}!</h3>
      <p>Thank you for registering with <strong>Home Service</strong>.</p>
      <p>Your account has been created successfully. You can now log in and explore our services.</p>
      <br/>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br/>The Home Service Team</p>
    `,
  };

  await Promise.all([
    transporter.sendMail(adminMailOptions),
    transporter.sendMail(userMailOptions),
  ]);
};


module.exports = { sendContactMail, sendRegistrationMail };