// services/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function enviarEmail({ to, subject='Notificação', text='', html='' }) {
  const transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    html
  });
}
