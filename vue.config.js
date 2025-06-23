
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  publicPath: '/gerenciamento-lojas-calculadora-precos/',
  transpileDependencies: true,

  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.xlsx$/i,
          use: [
            {
              loader: 'arraybuffer-loader'
            }
          ]
        }
      ]
    }
  }
})
