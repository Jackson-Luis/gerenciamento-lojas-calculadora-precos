import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarEmail(para, html) {
  await transporter.sendMail({
    from: `"Sistema" <${process.env.EMAIL_USER}>`,
    to: para,
    subject: 'Recuperação de Senha',
    html,
  });
}
