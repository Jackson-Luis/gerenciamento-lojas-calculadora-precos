# gerenciamento-lojas-calculadora-precos

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

# Erro 502 Bad Gateway ao acessar a API no Render

Esse erro geralmente significa que o backend (Node.js/Express) **não está rodando corretamente** no Render ou está caindo por timeout/inatividade.

## Possíveis causas e soluções

1. **O serviço Node.js no Render está em modo "Free" e hibernou**
   - Acesse o painel do Render e veja se o serviço está "Suspended" ou "Building".
   - Aguarde alguns segundos/minutos e tente novamente (o Render pode demorar para acordar).

2. **O backend está com erro de inicialização**
   - No painel do Render, vá em "Logs" e veja se há erros de conexão ao banco, porta ocupada, etc.
   - Corrija qualquer erro mostrado nos logs.

3. **Porta errada**
   - O Render espera que seu app escute na porta definida pela variável de ambiente `PORT`.
   - No seu `server.js`, troque:
     ```js
     const PORT = process.env.PORT || 3001;
     ```
     E use `app.listen(PORT, ...)` (não use sempre 3001 fixo).

4. **Banco de dados inacessível**
   - Verifique se as variáveis de ambiente do banco estão corretas no Render.
   - Veja se o banco Railway está ativo e aceitando conexões externas.

5. **Problema de CORS**
   - Certifique-se de que o middleware `cors()` está ativado no seu backend (já está no seu código).

## Ajuste recomendado no server.js

Garanta que o backend use a porta do Render:

````javascript
// filepath: f:\Projetos\gerenciamento-lojas-calculadora-precos\server.js
// ...existing code...
const PORT = process.env.PORT || 3001;
// ...existing code...
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
````

## Resumo

- Verifique os logs do Render.
- Use sempre `process.env.PORT` para a porta do Express.
- Aguarde alguns segundos se o serviço estava hibernado.
- Confirme as variáveis de ambiente do banco.
