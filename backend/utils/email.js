import pug from "pug";
import { convert } from "html-to-text";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class Email {
  // Constructor remains mostly the same
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }

  // We replace the newTransport() method with a direct API call in send()
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../view/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // 2) Prepare the JSON payload for Brevo's API
    const emailData = {
      sender: { name: "OrderIt", email: this.from },
      to: [{ email: this.to, name: this.firstName }],
      subject: subject,
      htmlContent: html,
      textContent: convert(html), // Fallback text version
    };

    // 3) Send via Brevo REST API (HTTPS) - Bypasses SMTP blocking on Render
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": process.env.BREVO_API_KEY, // Your Brevo API Key
          "content-type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send email via Brevo API");
      }

      console.log(`Email sent successfully: ${result.messageId}`);
    } catch (error) {
      console.error("Brevo API Error:", error.message);
      throw error; // Passes error to your catchAsyncErrors middleware
    }
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to Order It!");
  }

  async sendPasswordReset() {
    await this.send("passwordReset", "Your password reset token (valid for 10 mins)");
  }
}