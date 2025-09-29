import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email using SendGrid
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<object>} SendGrid API response
 */
export const sendEmail = async (to, subject, html) => {
  const msg = {
    to,
    from: `${'Unique Fitness'} <${process.env.SENDGRID_FROM_EMAIL}>`,
    subject,
    html,
  };
  try {
    const response = await sgMail.send(msg);
    console.log('SendGrid response:', response);
    return response;
  } catch (error) {
    console.error('SendGrid error:', error);
    throw error;
  }
};
