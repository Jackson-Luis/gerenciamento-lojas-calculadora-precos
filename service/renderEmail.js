const { render } = require('@vue-email/render')
const EmailRSenhaTemplate = require('../dist/emailRSenhaTemplate.vue')

async function gerarHtmlEmail(title) {
  const html = await render(EmailRSenhaTemplate, {
    title
  })
  return html
}

module.exports = { gerarHtmlEmail }
