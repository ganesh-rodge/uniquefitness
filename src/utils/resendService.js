import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email using Resend
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<object>} Resend API response
 */
export const sendEmail = async (to, subject, html) => {
  try {
    const response = await resend.emails.send({
      from: 'Unique Fitness <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    console.log('Resend API response:', response);
    return response;
  } catch (error) {
    console.error('Resend API error:', error);
    throw error;
  }
};
