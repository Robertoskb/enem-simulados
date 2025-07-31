/**
 * Renderizador para análise de frequência de opções
 * Analisa e exibe estatísticas sobre as alternativas escolhidas
 */
export class OptionFrequencyRenderer {
  /**
   * @param {Object} app - Instância da aplicação
   */
  constructor(app) {
    this.app = app;
  }

  /**
   * Renderiza a análise de frequência de opções
   * @param {Array} questions - Lista de questões
   * @param {Object} answers - Respostas do usuário
   * @returns {string} HTML da análise
   */
  render(questions, answers) {
    const analysis = this.analyzeOptionFrequency(questions, answers);

    return `
      <div class="option-frequency-analysis">
        <h4><i class="fa fa-chart-bar"></i> Análise de Frequência das Alternativas</h4>
        <div class="frequency-summary">
          ${this.renderFrequencySummary(analysis)}
        </div>
        <div class="frequency-details">
          ${this.renderFrequencyDetails(analysis)}
        </div>
      </div>
    `;
  }

  /**
   * Analisa a frequência das opções escolhidas
   * @param {Array} questions - Lista de questões
   * @param {Object} answers - Respostas do usuário
   * @returns {Object} Análise da frequência
   */
  analyzeOptionFrequency(questions, answers) {
    const frequency = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const totalAnswered = Object.keys(answers).length;

    // Contar frequência de cada alternativa
    Object.values(answers).forEach((answer) => {
      if (frequency.hasOwnProperty(answer)) {
        frequency[answer]++;
      }
    });

    // Calcular percentuais
    const percentages = {};
    Object.keys(frequency).forEach((option) => {
      percentages[option] =
        totalAnswered > 0
          ? Math.round((frequency[option] / totalAnswered) * 100)
          : 0;
    });

    return {
      frequency,
      percentages,
      totalAnswered,
      mostChosen: this.getMostChosen(frequency),
      leastChosen: this.getLeastChosen(frequency),
    };
  }

  /**
   * Encontra a alternativa mais escolhida
   * @param {Object} frequency - Frequência das alternativas
   * @returns {string} Alternativa mais escolhida
   */
  getMostChosen(frequency) {
    return Object.keys(frequency).reduce((a, b) =>
      frequency[a] > frequency[b] ? a : b
    );
  }

  /**
   * Encontra a alternativa menos escolhida
   * @param {Object} frequency - Frequência das alternativas
   * @returns {string} Alternativa menos escolhida
   */
  getLeastChosen(frequency) {
    return Object.keys(frequency).reduce((a, b) =>
      frequency[a] < frequency[b] ? a : b
    );
  }

  /**
   * Renderiza o resumo da frequência
   * @param {Object} analysis - Análise da frequência
   * @returns {string} HTML do resumo
   */
  renderFrequencySummary(analysis) {
    const { mostChosen, leastChosen, totalAnswered } = analysis;

    return `
      <div class="frequency-summary-grid">
        <div class="summary-item">
          <span class="summary-label">Total de Respostas:</span>
          <span class="summary-value">${totalAnswered}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Mais Escolhida:</span>
          <span class="summary-value highlight">${mostChosen}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Menos Escolhida:</span>
          <span class="summary-value highlight">${leastChosen}</span>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza os detalhes da frequência
   * @param {Object} analysis - Análise da frequência
   * @returns {string} HTML dos detalhes
   */
  renderFrequencyDetails(analysis) {
    const { frequency, percentages } = analysis;

    return `
      <div class="frequency-chart">
        ${Object.keys(frequency)
          .map(
            (option) => `
          <div class="frequency-bar">
            <div class="bar-label">${option}</div>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${percentages[option]}%"></div>
              <div class="bar-text">${frequency[option]} (${percentages[option]}%)</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }
}
