# Estrutura Modular - Renderizadores de Abas

Esta pasta contém os renderizadores modulares para as abas de resultados do simulado.

## Estrutura

### BaseTabRenderer.js

Classe base que contém funcionalidades compartilhadas entre todos os renderizadores:

- Acesso à instância da aplicação
- Métodos utilitários comuns
- Interface consistente para renderização

### Renderizadores Específicos

#### GeneralTabRenderer.js

- **Responsabilidade**: Renderiza a aba "Geral" com estatísticas principais
- **Contêiner**: `#general-stats-content`
- **Conteúdo**: Taxa de acerto, padrão geral, áreas avaliadas

#### AreasTabRenderer.js

- **Responsabilidade**: Renderiza a aba "Áreas" com análise por área de conhecimento
- **Contêiner**: `#areas-container`
- **Conteúdo**: Performance por área, sub-navegação, detalhes por área

#### DifficultyTabRenderer.js

- **Responsabilidade**: Renderiza a aba "Dificuldade" com análise por nível TRI
- **Contêiner**: `#difficulty-container`
- **Conteúdo**: Estatísticas por dificuldade, padrões ordenados, tabela detalhada

#### PatternsTabRenderer.js

- **Responsabilidade**: Renderiza a aba "Padrões" com análise de sequências
- **Contêiner**: `#patterns-container`
- **Conteúdo**: Sequências de acertos/erros, frequência de alternativas, análise temporal

#### AnswerSheetTabRenderer.js

- **Responsabilidade**: Renderiza a aba "Gabarito" com cartão de respostas
- **Contêiner**: `#answer-sheet-container`
- **Conteúdo**: Tabela de respostas, resumo estatístico

#### LegendTabRenderer.js

- **Responsabilidade**: Renderiza informações de legenda e ajuda
- **Contêiner**: `#legend-container` (se existir)
- **Conteúdo**: Explicações de cores, escalas, cálculos

## Como Usar

1. Cada renderizador é instanciado no `ResultsTabsController`
2. O método `render()` é chamado quando a aba correspondente é ativada
3. Todos compartilham acesso à instância da aplicação através de `this.app`

## Vantagens da Modularização

- **Maintainability**: Cada aba tem sua própria responsabilidade
- **Testability**: Renderizadores podem ser testados individualmente
- **Extensibility**: Fácil adicionar novas abas ou modificar existentes
- **Performance**: Apenas o renderizador necessário é executado
- **Clean Code**: Código mais organizado e legível

## Tratamento de Questões Anuladas

Todos os renderizadores implementam a lógica correta para questões anuladas:

- Questão anulada + resposta = CORRETO
- Questão anulada + sem resposta = INCORRETO
- Esta lógica está centralizada nos métodos de análise de cada renderizador
