# Estrutura Modular do Simulado ENEM

## Arquivos Principais

### `simulado-main.js`

- Arquivo de entrada principal
- Importa e inicializa a aplicação
- Substitui o antigo `simulado.js`

### Módulos (`assets/js/simulado/`)

#### `SimuladoApp.js`

- Classe principal que coordena todos os módulos
- Gerencia o estado global da aplicação
- Controla o fluxo entre as diferentes telas

#### `DataLoader.js`

- Responsável pelo carregamento dos dados JSON
- Carrega `positions.json` e `meta.json`
- Gerencia erros de carregamento

#### `UIController.js`

- Controla toda a interface do usuário
- Gerencia eventos de clique e interações
- Renderiza questões e atualiza elementos visuais
- Controla temas e navegação

#### `QuestionGenerator.js`

- Gera as questões do simulado
- Determina questões anuladas
- Mapeia posições e cores das provas
- Calcula gabaritos

#### `ResultsCalculator.js`

- Calcula resultados e estatísticas
- Gera padrões de acerto para análise
- Processa questões anuladas
- Atualiza interface de resultados

#### `ModalController.js`

- Gerencia modais de confirmação
- Substitui os `confirm()` JavaScript nativos
- Controla foco e acessibilidade

#### `SkillsReportCalculator.js`

- Responsável por calcular e renderizar relatórios de desempenho por habilidade
- Agrupa questões por área (MT, CH, CN, LC0, LC1) e habilidade (H1, H2, etc.)
- Calcula percentual de acerto para cada habilidade
- Classifica desempenho em: Excelente (≥80%), Bom (≥65%), Regular (≥50%), Insuficiente (<50%)
- Exibe gráficos de progresso coloridos para cada habilidade
- Mostra estatísticas detalhadas (acertos/total, erros, questões anuladas)
- Inclui descrições pedagógicas de cada habilidade

**Estrutura de dados:**

```javascript
// Meta.json contém habilidades:
{
  "2017": {
    "MT": {
      "136": {
        "hability": 1,  // H1
        "answer": "C",
        "difficulty": -0.5
      }
    }
  }
}

// skills-descriptions.json contém descrições:
{
  "MT_H1": "Construir significados para os números naturais, inteiros, racionais e reais.",
  "CH_H1": "Interpretar historicamente e/ou geograficamente fontes documentais..."
}
```

## Vantagens da Nova Estrutura

### ✅ **Organização**

- Código dividido por responsabilidade
- Cada módulo tem uma função específica
- Fácil localização de funcionalidades

### ✅ **Manutenibilidade**

- Arquivos menores e mais focados
- Mudanças isoladas em módulos específicos
- Menor risco de efeitos colaterais

### ✅ **Reutilização**

- Módulos podem ser reutilizados
- Fácil teste de componentes individuais
- Estrutura escalável

### ✅ **Performance**

- Carregamento modular (ES6 modules)
- Browser pode otimizar imports
- Cache individual de módulos

## Como Usar

1. **Desenvolvimento**: Trabalhe no módulo específico da funcionalidade
2. **Debug**: Logs estão organizados por módulo
3. **Testes**: Cada módulo pode ser testado independentemente
4. **Extensão**: Adicione novos módulos sem afetar existentes

## Migração Completa

- ✅ **1078 linhas** → **6 módulos organizados**
- ✅ **Funcionalidade mantida** 100%
- ✅ **Melhor organização** do código
- ✅ **Estrutura escalável** para futuras features

## Próximos Passos

- Adicionar testes unitários para cada módulo
- Implementar lazy loading se necessário
- Considerar TypeScript para maior segurança de tipos
- Adicionar documentação JSDoc nos métodos principais
