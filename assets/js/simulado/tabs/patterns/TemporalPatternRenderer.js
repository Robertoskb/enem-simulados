/**
 * Renderizador para análise temporal de padrões
 * Analisa como o desempenho varia ao longo do tempo durante o simulado
 */
export class TemporalPatternRenderer {
  /**
   * @param {Object} app - Instância da aplicação
   */
  constructor(app) {
    this.app = app;
  }

  /**
   * Renderiza a análise temporal completa
   * @param {Array} questions - Lista de questões
   * @param {Object} answers - Respostas do usuário
   * @returns {string} HTML da análise temporal
   */
  render(questions, answers) {
    const chunks = this.createTemporalChunks(questions, answers);
    const trends = this.analyzeTrends(chunks);

    return `
      <div class="temporal-analysis">
        <h4><i class="fa fa-clock"></i> Análise Temporal do Desempenho</h4>
        <div class="temporal-overview">
          ${this.renderOverview(chunks, trends)}
        </div>
        <div class="temporal-chart">
          ${this.renderTemporalChart(chunks)}
        </div>
        <div class="temporal-insights">
          ${this.renderInsights(chunks, trends)}
        </div>
      </div>
    `;
  }

  /**
   * Cria chunks temporais das respostas
   * @param {Array} questions - Lista de questões
   * @param {Object} answers - Respostas do usuário
   * @returns {Array} Array de chunks com estatísticas
   */
  createTemporalChunks(questions, answers) {
    const chunkSize = 9; // 9 questões por chunk para melhor visualização
    const chunks = [];

    for (let i = 0; i < questions.length; i += chunkSize) {
      const chunkQuestions = questions.slice(i, i + chunkSize);
      const chunk = this.analyzeChunk(chunkQuestions, answers, i);
      chunks.push(chunk);
    }

    return chunks;
  }

  /**
   * Analisa um chunk específico de questões
   * @param {Array} chunkQuestions - Questões do chunk
   * @param {Object} answers - Respostas do usuário
   * @param {number} startIndex - Índice inicial do chunk
   * @returns {Object} Estatísticas do chunk
   */
  analyzeChunk(chunkQuestions, answers, startIndex) {
    let correct = 0;
    let incorrect = 0;
    let cancelled = 0;
    let unanswered = 0;

    chunkQuestions.forEach((question) => {
      if (question.cancelled) {
        cancelled++;
      } else {
        const userAnswer = answers[question.position];
        if (!userAnswer) {
          unanswered++;
        } else {
          const correctAnswer =
            this.app.questionGenerator.getCorrectAnswer(question);
          if (userAnswer === correctAnswer) {
            correct++;
          } else {
            incorrect++;
          }
        }
      }
    });

    const validTotal = correct + incorrect;
    const accuracy =
      validTotal > 0 ? Math.round((correct / validTotal) * 100) : 0;

    return {
      label: `Q${startIndex + 1}-${startIndex + chunkQuestions.length}`,
      correct,
      incorrect,
      cancelled,
      unanswered,
      total: chunkQuestions.length,
      validTotal,
      accuracy,
      startIndex,
    };
  }

  /**
   * Analisa tendências ao longo do tempo
   * @param {Array} chunks - Chunks temporais
   * @returns {Object} Análise de tendências
   */
  analyzeTrends(chunks) {
    if (chunks.length < 2) return { trend: "insufficient_data" };

    const validChunks = chunks.filter((c) => c.validTotal > 0);
    if (validChunks.length < 2) return { trend: "insufficient_data" };

    const firstHalf = validChunks.slice(0, Math.ceil(validChunks.length / 2));
    const secondHalf = validChunks.slice(Math.floor(validChunks.length / 2));

    const firstHalfAvg =
      firstHalf.reduce((sum, c) => sum + c.accuracy, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, c) => sum + c.accuracy, 0) / secondHalf.length;

    const improvement = secondHalfAvg - firstHalfAvg;
    const maxAccuracy = Math.max(...validChunks.map((c) => c.accuracy));
    const minAccuracy = Math.min(...validChunks.map((c) => c.accuracy));

    let trend = "stable";
    if (improvement > 15) trend = "improving";
    else if (improvement < -15) trend = "declining";

    return {
      trend,
      improvement,
      firstHalfAvg: Math.round(firstHalfAvg),
      secondHalfAvg: Math.round(secondHalfAvg),
      maxAccuracy,
      minAccuracy,
      consistency: maxAccuracy - minAccuracy,
    };
  }

  /**
   * Renderiza o overview da análise temporal
   * @param {Array} chunks - Chunks temporais
   * @param {Object} trends - Análise de tendências
   * @returns {string} HTML do overview
   */
  renderOverview(chunks, trends) {
    if (trends.trend === "insufficient_data") {
      return '<p class="insufficient-data">Dados insuficientes para análise temporal. Complete mais questões.</p>';
    }

    return `
      <div class="temporal-overview-grid">
        <div class="overview-item">
          <div class="overview-icon ${trends.trend}">
            ${this.getTrendIcon(trends.trend)}
          </div>
          <div class="overview-content">
            <div class="overview-value">${this.getTrendLabel(
              trends.trend
            )}</div>
            <div class="overview-label">Tendência Geral</div>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-icon">📊</div>
          <div class="overview-content">
            <div class="overview-value">${
              trends.improvement > 0 ? "+" : ""
            }${Math.round(trends.improvement)}%</div>
            <div class="overview-label">Variação</div>
          </div>
        </div>
        
        <div class="overview-item">
          <div class="overview-icon">🎯</div>
          <div class="overview-content">
            <div class="overview-value">${trends.consistency}%</div>
            <div class="overview-label">Variação (Max-Min)</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza o gráfico temporal
   * @param {Array} chunks - Chunks temporais
   * @returns {string} HTML do gráfico
   */
  renderTemporalChart(chunks) {
    const maxAccuracy = Math.max(...chunks.map((c) => c.accuracy));
    const minAccuracy = Math.min(...chunks.map((c) => c.accuracy));
    const range = maxAccuracy - minAccuracy;

    return `
      <div class="temporal-chart-container">
        <div class="chart-title">Precisão ao Longo do Tempo</div>
        <div class="chart-bars">
          ${chunks
            .map((chunk, index) => {
              const height =
                maxAccuracy > 0 ? (chunk.accuracy / maxAccuracy) * 100 : 0;
              const color = this.getAccuracyColor(chunk.accuracy);

              return `
              <div class="temporal-bar">
                <div class="bar-container">
                  <div class="bar-fill ${color}" style="height: ${height}%">
                    <div class="bar-tooltip">
                      <div class="tooltip-title">${chunk.label}</div>
                      <div class="tooltip-stats">
                        <div>Precisão: ${chunk.accuracy}%</div>
                        <div>Acertos: ${chunk.correct}/${chunk.validTotal}</div>
                        ${
                          chunk.cancelled > 0
                            ? `<div>Anuladas: ${chunk.cancelled}</div>`
                            : ""
                        }
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bar-label">${chunk.label}</div>
                <div class="bar-value">${chunk.accuracy}%</div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Renderiza insights da análise temporal
   * @param {Array} chunks - Chunks temporais
   * @param {Object} trends - Análise de tendências
   * @returns {string} HTML dos insights
   */
  renderInsights(chunks, trends) {
    if (trends.trend === "insufficient_data") {
      return "";
    }

    const insights = [];

    // Insight sobre tendência
    switch (trends.trend) {
      case "improving":
        insights.push(
          `📈 <strong>Tendência positiva!</strong> Seu desempenho melhorou ao longo do simulado (${trends.firstHalfAvg}% → ${trends.secondHalfAvg}%).`
        );
        break;
      case "declining":
        insights.push(
          `📉 <strong>Atenção:</strong> Houve queda no desempenho ao longo do simulado (${trends.firstHalfAvg}% → ${trends.secondHalfAvg}%). Pode indicar cansaço ou aumento da dificuldade.`
        );
        break;
      case "stable":
        insights.push(
          `📊 <strong>Desempenho consistente:</strong> Manteve estabilidade ao longo do simulado (variação de ${Math.abs(
            trends.improvement
          ).toFixed(1)}%).`
        );
        break;
    }

    // Insight sobre consistência
    if (trends.consistency <= 20) {
      insights.push(
        `🎯 <strong>Boa consistência:</strong> Pouca variação entre diferentes momentos do simulado (${trends.consistency}% de diferença).`
      );
    } else if (trends.consistency >= 40) {
      insights.push(
        `⚠️ <strong>Alta variação:</strong> Grande diferença de desempenho entre diferentes momentos (${trends.consistency}% de diferença). Analise os fatores que podem ter influenciado.`
      );
    }

    // Insight sobre melhor e pior momento
    const bestChunk = chunks.reduce((best, current) =>
      current.accuracy > best.accuracy ? current : best
    );
    const worstChunk = chunks.reduce((worst, current) =>
      current.accuracy < worst.accuracy ? current : worst
    );

    if (bestChunk.accuracy > worstChunk.accuracy + 20) {
      insights.push(
        `🏆 <strong>Melhor momento:</strong> ${bestChunk.label} (${bestChunk.accuracy}%). <strong>Momento mais difícil:</strong> ${worstChunk.label} (${worstChunk.accuracy}%).`
      );
    }

    return insights.length > 0
      ? `<div class="insights-list">${insights
          .map((insight) => `<p>${insight}</p>`)
          .join("")}</div>`
      : "<p>Complete mais questões para gerar insights temporais detalhados.</p>";
  }

  /**
   * Retorna ícone para a tendência
   * @param {string} trend - Tipo de tendência
   * @returns {string} Ícone
   */
  getTrendIcon(trend) {
    switch (trend) {
      case "improving":
        return "📈";
      case "declining":
        return "📉";
      case "stable":
        return "📊";
      default:
        return "❓";
    }
  }

  /**
   * Retorna label para a tendência
   * @param {string} trend - Tipo de tendência
   * @returns {string} Label
   */
  getTrendLabel(trend) {
    switch (trend) {
      case "improving":
        return "Melhorando";
      case "declining":
        return "Declinando";
      case "stable":
        return "Estável";
      default:
        return "Indefinido";
    }
  }

  /**
   * Retorna cor baseada na precisão
   * @param {number} accuracy - Precisão (0-100)
   * @returns {string} Classe CSS da cor
   */
  getAccuracyColor(accuracy) {
    if (accuracy >= 80) return "excellent";
    if (accuracy >= 60) return "good";
    if (accuracy >= 40) return "average";
    return "poor";
  }
}
