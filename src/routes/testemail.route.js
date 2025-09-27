import express from 'express';
import { sendEmail } from '../utils/mail.js';

const router = express.Router();

// Simple test route to check email sending
router.post('/send', async (req, res) => {
  const { to, subject, html } = req.body;
  try {
    const response = await sendEmail(
      to || 'your@email.com',
      subject || 'Test Email from Unique Fitness',
  html || '<h2>This is a test email from Unique Fitness using SendGrid.</h2>'
    );
    res.status(200).json({ success: true, response });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
