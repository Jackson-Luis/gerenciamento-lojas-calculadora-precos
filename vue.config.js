import { defineConfig } from '@vue/cli-service'

export default defineConfig({
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
