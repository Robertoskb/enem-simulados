/**
 * Visualizador de padrões de resposta
 * Cria representações visuais dos padrões de acerto e erro
 */
export class PatternVisualizer {
  /**
   * @param {Object} app - Instância da aplicação
   */
  constructor(app) {
    this.app = app;
  }

  /**
   * Cria visualização de padrões de resposta
   * @param {string} answerString - String com padrão de respostas (1=correto, 0=incorreto, C=anulada)
   * @param {Array} questions - Lista de questões
   * @returns {string} HTML da visualização
   */
  createPatternVisualization(answerString, questions) {
    return `
      <div class="pattern-visualization">
        <h4><i class="fa fa-eye"></i> Visualização dos Padrões</h4>
        <div class="pattern-display">
          ${this.renderPatternGrid(answerString, questions)}
        </div>
        <div class="pattern-legend">
          ${this.renderLegend()}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o grid de padrões
   * @param {string} answerString - String de padrões
   * @param {Array} questions - Lista de questões
   * @returns {string} HTML do grid
   */
  renderPatternGrid(answerString, questions) {
    const chunks = this.chunkString(answerString, 10); // 10 questões por linha

    return `
      <div class="pattern-grid">
        ${chunks
          .map(
            (chunk, chunkIndex) => `
          <div class="pattern-row">
            <div class="row-label">Q${chunkIndex * 10 + 1}-${Math.min(
              (chunkIndex + 1) * 10,
              answerString.length
            )}</div>
            <div class="pattern-cells">
              ${chunk
                .split("")
                .map((char, index) => {
                  const questionIndex = chunkIndex * 10 + index;
                  const question = questions[questionIndex];
                  return this.renderPatternCell(
                    char,
                    questionIndex + 1,
                    question
                  );
                })
                .join("")}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  /**
   * Renderiza uma célula individual do padrão
   * @param {string} char - Caractere do padrão (1, 0, ou C)
   * @param {number} questionNumber - Número da questão
   * @param {Object} question - Objeto da questão
   * @returns {string} HTML da célula
   */
  renderPatternCell(char, questionNumber, question) {
    let className = "pattern-cell";
    let symbol = "";
    let title = "";

    switch (char) {
      case "1":
        className += " correct";
        symbol = "✓";
        title = `Questão ${questionNumber}: Correta`;
        break;
      case "0":
        className += " incorrect";
        symbol = "✗";
        title = `Questão ${questionNumber}: Incorreta`;
        break;
      case "C":
        className += " cancelled";
        symbol = "A";
        title = `Questão ${questionNumber}: Anulada`;
        break;
      default:
        className += " unanswered";
        symbol = "?";
        title = `Questão ${questionNumber}: Não respondida`;
    }

    return `
      <div class="${className}" title="${title}" data-question="${questionNumber}">
        <span class="cell-symbol">${symbol}</span>
        <span class="cell-number">${questionNumber}</span>
      </div>
    `;
  }

  /**
   * Renderiza a legenda
   * @returns {string} HTML da legenda
   */
  renderLegend() {
    return `
      <div class="pattern-legend-items">
        <div class="legend-item">
          <div class="legend-color correct"></div>
          <span>Correta (✓)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color incorrect"></div>
          <span>Incorreta (✗)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color cancelled"></div>
          <span>Anulada (A)</span>
        </div>
        <div class="legend-item">
          <div class="legend-color unanswered"></div>
          <span>Não respondida (?)</span>
        </div>
      </div>
    `;
  }

  /**
   * Cria visualização de sequências de acertos/erros
   * @param {Object} sequences - Análise de sequências
   * @returns {string} HTML da visualização de sequências
   */
  createSequenceVisualization(sequences) {
    return `
      <div class="sequence-visualization">
        <h4><i class="fa fa-chart-line"></i> Análise de Sequências</h4>
        <div class="sequence-stats">
          <div class="stat-card positive">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number">${sequences.maxCorrectStreak}</div>
              <div class="stat-label">Maior sequência de acertos</div>
            </div>
          </div>
          
          <div class="stat-card negative">
            <div class="stat-icon">📉</div>
            <div class="stat-content">
              <div class="stat-number">${sequences.maxIncorrectStreak}</div>
              <div class="stat-label">Maior sequência de erros</div>
            </div>
          </div>
          
          <div class="stat-card neutral">
            <div class="stat-icon">🔄</div>
            <div class="stat-content">
              <div class="stat-number">${sequences.alternations}</div>
              <div class="stat-label">Alternâncias</div>
            </div>
          </div>
        </div>
        
        <div class="sequence-insights">
          ${this.generateSequenceInsights(sequences)}
        </div>
      </div>
    `;
  }

  /**
   * Gera insights baseados nas sequências
   * @param {Object} sequences - Análise de sequências
   * @returns {string} HTML dos insights
   */
  generateSequenceInsights(sequences) {
    const insights = [];

    if (sequences.maxCorrectStreak >= 5) {
      insights.push(
        `🎯 <strong>Excelente!</strong> Você teve uma sequência de ${sequences.maxCorrectStreak} acertos consecutivos.`
      );
    }

    if (sequences.maxIncorrectStreak >= 5) {
      insights.push(
        `⚠️ <strong>Atenção:</strong> Houve uma sequência de ${sequences.maxIncorrectStreak} erros consecutivos. Considere revisar o conteúdo.`
      );
    }

    if (sequences.alternations >= 10) {
      insights.push(
        `🔄 <strong>Padrão variado:</strong> Muitas alternâncias entre acertos e erros podem indicar conhecimento inconsistente.`
      );
    } else if (sequences.alternations <= 3) {
      insights.push(
        `📊 <strong>Padrão consistente:</strong> Poucas alternâncias indicam domínio ou dificuldade consistente do conteúdo.`
      );
    }

    if (sequences.currentCorrectStreak >= 3) {
      insights.push(
        `🚀 <strong>Finalizando bem!</strong> Você terminou com ${sequences.currentCorrectStreak} acertos consecutivos.`
      );
    }

    return insights.length > 0
      ? `<div class="insights-list">${insights
          .map((insight) => `<p>${insight}</p>`)
          .join("")}</div>`
      : "<p>Complete mais questões para gerar insights detalhados sobre sequências.</p>";
  }

  /**
   * Divide uma string em chunks de tamanho específico
   * @param {string} str - String para dividir
   * @param {number} size - Tamanho de cada chunk
   * @returns {Array} Array de chunks
   */
  chunkString(str, size) {
    const chunks = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Cria gráfico de barras simples para frequência temporal
   * @param {Array} chunks - Chunks temporais
   * @returns {string} HTML do gráfico
   */
  createTemporalChart(chunks) {
    if (!chunks || chunks.length === 0) return "";

    const maxCorrect = Math.max(...chunks.map((c) => c.correct));

    return `
      <div class="temporal-chart">
        <h4><i class="fa fa-clock"></i> Desempenho Temporal</h4>
        <div class="chart-container">
          ${chunks
            .map((chunk) => {
              const percentage =
                maxCorrect > 0 ? (chunk.correct / maxCorrect) * 100 : 0;
              const accuracy =
                chunk.validTotal > 0
                  ? Math.round((chunk.correct / chunk.validTotal) * 100)
                  : 0;

              return `
              <div class="chart-bar">
                <div class="bar-container">
                  <div class="bar-fill" style="height: ${percentage}%"></div>
                  <div class="bar-value">${chunk.correct}</div>
                </div>
                <div class="bar-label">${chunk.label}</div>
                <div class="bar-accuracy">${accuracy}%</div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }
}
