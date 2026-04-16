// Import nodemailer to send emails from Node.js
const nodemailer = require("nodemailer");

// Import pug template engine to create HTML email templates
const pug = require("pug");

// Convert HTML email to plain text version (some email clients require this)
const htmlToText = require("html-to-text");

// Email class used to send different types of emails to users
module.exports = class Email {

  // Constructor runs whenever we create a new Email object
  // It receives user data and a URL (usually used for password reset or verification)
  constructor(user, url) {

    // Receiver email address
    this.to = user.email;

    // Extract first name from full name (for personalization)
    this.firstName = user.name.split(" ")[0];

    // URL used in email (example: password reset link)
    this.url = url;

    // Sender email address from environment variables
    this.from = `OrderIt <${process.env.EMAIL_FROM}>`;
  }

  // Create a transporter that connects to the email server
  // This transporter is responsible for actually sending the email
  newTransport() {

    // In production we might use services like SendGrid
    // but here we configure a custom SMTP server

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,

      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Main function used to send emails
  // It receives template name and email subject
  async send(template, subject) {

    // Render HTML email using pug template
    // The template receives dynamic data such as name and URL
    const html = pug.renderFile(`${__dirname}/../view/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // Email options that define the email structure
    const mailOptions = {

      // Sender address
      from: this.from,

      // Receiver address
      to: this.to,

      // Email subject
      subject,

      // HTML version of the email
      html,

      // Plain text version of the email
      text: htmlToText.convert(html),
    };

    // Send email using configured transporter
    await this.newTransport().sendMail(mailOptions);
  }

  // Function used to send welcome email after user registers
  async sendWelcome() {

    await this.send("welcome", "welcome to the Order It!");
  }

  // Function used to send password reset email
  async sendPasswordReset() {

    await this.send(
      "passwordReset",
      "password reset token (valid for only 10 minutes)"
    );
  }
};



// Notes for development

// Mailtrap is commonly used during development
// It captures emails instead of actually sending them to real users
// This prevents accidental emails being sent to customers

// Example service:
// https://mailtrap.io

// Another service used in production:
// SendGrid
// SendGrid provides an SMTP server to send emails reliably

// For testing you can also use mailsac
// Example: anything@mailsac.com will receive emails instantly