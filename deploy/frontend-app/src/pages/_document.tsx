import Document, { Html, Head, Main, NextScript } from 'next/document'

// Baseado em: 1.Project.md, 2.Architecture.md
// Precedência: aplicar classe `dark` no documento antes da hidratação
// Decisão: evitar mistura de temas (flash/theme-mix) aplicando classe no HTML no carregamento
export default class MyDocument extends Document {
  render() {
    const setInitialTheme = `(function() {
      try {
        var theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) { }
    })()`

    return (
      <Html>
        <Head>
          <script dangerouslySetInnerHTML={{ __html: setInitialTheme }} />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}