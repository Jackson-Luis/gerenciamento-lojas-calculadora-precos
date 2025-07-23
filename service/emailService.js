const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // usa STARTTLS, então false
  auth: {
    user: process.env.EMAIL_USER,  // seu email Outlook
    pass: process.env.EMAIL_PASS   // sua senha ou senha de app (recomendado)
  }
})

async function enviarEmail(para, html) {
  await transporter.sendMail({
    from: `"Sistema" <${process.env.EMAIL_USER}>`,
    to: para,
    subject: 'Recuperação de Senha',
    html
  });
}


module.exports = { enviarEmail }
