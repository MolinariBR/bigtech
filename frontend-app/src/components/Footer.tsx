// Baseado em: 5.Pages.md, 8.DesignSystem.md
// Componente Footer compartilhado - copyright e links

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-60 bg-card border-t border-border px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
          <div className="text-sm text-muted-foreground">
            Copyright © 2024-2025 Recupera Big Tech - Consultas
          </div>
          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Política de Privacidade
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Suporte
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}