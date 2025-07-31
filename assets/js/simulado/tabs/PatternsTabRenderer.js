import { BaseTabRenderer } from "./BaseTabRenderer.js";
import { PatternAnalyzer } from "./patterns/PatternAnalyzer.js";
import { PatternVisualizer } from "./patterns/PatternVisualizer.js";
import { TemporalPatternRenderer } from "./patterns/TemporalPatternRenderer.js";
import { OptionFrequencyRenderer } from "./patterns/OptionFrequencyRenderer.js";

export class PatternsTabRenderer extends BaseTabRenderer {
  constructor(app) {
    super(app);
    this.patternAnalyzer = new PatternAnalyzer(app);
    this.patternVisualizer = new PatternVisualizer(app);
    this.temporalRenderer = new TemporalPatternRenderer(app);
    this.optionFrequencyRenderer = new OptionFrequencyRenderer(app);
  }

  /**
   * Função principal de renderização
   * @param {Object} resultsData - Dados dos resultados (opcional)
   */
  render(resultsData = null) {
    console.log("🎯 PatternsTabRenderer: render() chamada");

    try {
      const container = document.getElementById("patterns-container");
      if (!container) {
        console.error("❌ Container 'patterns-container' não encontrado");
        return;
      }

      const questions = this.app.getQuestions();
      const answers = this.app.getAnswers();

      // Verificações básicas
      if (!questions || questions.length === 0) {
        container.innerHTML = this.renderEmptyState();
        return;
      }

      if (!answers || Object.keys(answers).length === 0) {
        container.innerHTML = this.renderNoAnswersState();
        return;
      }

      // Gerar string de padrões de resposta
      const answerString = this.getAnswerString(questions, answers);

      // Renderizar análise completa usando os métodos locais
      const html = `
        <div class="patterns-analysis">
          <h4><i class="fa fa-search"></i> Análise de Padrões de Resposta</h4>
          
          ${this.renderResponsePattern(answerString)}
          
          <div class="patterns-grid" style="display: grid; gap: 2rem; margin-top: 2rem;">
            ${this.renderSequencePatterns(answerString)}
            ${this.renderTemporalPatterns(answerString)}
            ${this.renderOptionFrequency(questions, answers)}
            ${this.renderConsistencyAnalysis(questions, answers)}
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error("❌ Erro ao renderizar aba Padrões:", error);
      const container = document.getElementById("patterns-container");
      if (container) {
        container.innerHTML = this.renderErrorState(error.message);
      }
    }
  }

  /**
   * Gera string de respostas baseada nas questões e respostas
   * @param {Array} questions - Array de questões
   * @param {Object} answers - Objeto com respostas do usuário
   * @returns {string} - String de padrões (1=correto, 0=incorreto, C=anulada)
   */
  getAnswerString(questions, answers) {
    return questions
      .map((question) => {
        if (question.cancelled) {
          return "C"; // C para cancelled (anulada)
        }

        const userAnswer = answers[question.position];
        const correctAnswer =
          this.app.questionGenerator.getCorrectAnswer(question);

        // Para questões não anuladas, compara com o gabarito
        const isCorrect = userAnswer === correctAnswer;
        return isCorrect ? "1" : "0";
      })
      .join("");
  }

  /**
   * Renderiza o padrão visual de respostas
   * @param {string} answerString - String de padrões
   * @returns {string} HTML do padrão visual
   */
  renderResponsePattern(answerString) {
    return `
      <div class="pattern-card">
        <h5><i class="fa fa-eye"></i> Padrão Visual de Respostas</h5>
        <div class="answer-pattern">
          ${answerString
            .split("")
            .map((bit, index) => {
              const questionNum = index + 1;
              let title, status;
              if (bit === "C") {
                title = `Questão ${questionNum}: Anulada`;
                status = "anulada";
              } else if (bit === "1") {
                title = `Questão ${questionNum}: Correta`;
                status = "correta";
              } else {
                title = `Questão ${questionNum}: Incorreta`;
                status = "incorreta";
              }
              return `<span class="pattern-bit bit-${bit}" title="${title}" data-question="${questionNum}">
                <span class="bit-number">${questionNum}</span>
                <span class="bit-symbol">${
                  bit === "C" ? "A" : bit === "1" ? "✓" : "✗"
                }</span>
              </span>`;
            })
            .join("")}
        </div>
        <div class="pattern-legend">
          <div class="legend-item">
            <span class="legend-symbol correct">✓</span>
            <span>Correta</span>
          </div>
          <div class="legend-item">
            <span class="legend-symbol incorrect">✗</span>
            <span>Incorreta</span>
          </div>
          <div class="legend-item">
            <span class="legend-symbol cancelled">A</span>
            <span>Anulada</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Analisa sequências de acertos e erros no padrão de resposta
   * @param {string} answerString - String de padrões (1=correto, 0=incorreto, C=anulada)
   * @returns {Object} Análise das sequências
   */
  analyzeSequences(answerString) {
    let maxCorrectStreak = 0;
    let maxIncorrectStreak = 0;
    let currentCorrectStreak = 0;
    let currentIncorrectStreak = 0;
    let alternations = 0;
    let lastBit = null;
    let correctStreaks = [];
    let incorrectStreaks = [];

    for (let i = 0; i < answerString.length; i++) {
      const bit = answerString[i];

      // Pular questões anuladas para contagem de streaks
      if (bit === "C") continue;

      // Contar alternações (mudanças de padrão)
      if (lastBit !== null && lastBit !== bit && lastBit !== "C") {
        alternations++;
      }

      if (bit === "1") {
        // Questão correta
        if (currentIncorrectStreak > 0) {
          incorrectStreaks.push({
            length: currentIncorrectStreak,
            start: i - currentIncorrectStreak,
            end: i - 1,
          });
          currentIncorrectStreak = 0;
        }
        currentCorrectStreak++;
        maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak);
      } else {
        // Questão incorreta
        if (currentCorrectStreak > 0) {
          correctStreaks.push({
            length: currentCorrectStreak,
            start: i - currentCorrectStreak,
            end: i - 1,
          });
          currentCorrectStreak = 0;
        }
        currentIncorrectStreak++;
        maxIncorrectStreak = Math.max(
          maxIncorrectStreak,
          currentIncorrectStreak
        );
      }

      // Só atualizar lastBit se não for questão anulada
      if (bit !== "C") {
        lastBit = bit;
      }
    }

    // Finalizar última sequência
    if (currentCorrectStreak > 0) {
      correctStreaks.push({
        length: currentCorrectStreak,
        start: answerString.length - currentCorrectStreak,
        end: answerString.length - 1,
      });
    }
    if (currentIncorrectStreak > 0) {
      incorrectStreaks.push({
        length: currentIncorrectStreak,
        start: answerString.length - currentIncorrectStreak,
        end: answerString.length - 1,
      });
    }

    return {
      maxCorrectStreak,
      maxIncorrectStreak,
      alternations,
      correctStreaks: correctStreaks.sort((a, b) => b.length - a.length),
      incorrectStreaks: incorrectStreaks.sort((a, b) => b.length - a.length),
    };
  }

  /**
   * Renderiza detalhes das sequências
   * @param {Object} sequences - Análise das sequências
   * @returns {string} HTML dos detalhes
   */
  renderDetailedSequences(sequences) {
    if (
      sequences.correctStreaks.length === 0 &&
      sequences.incorrectStreaks.length === 0
    ) {
      return `
        <div class="no-sequences" style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 12px;">
          <i class="fa fa-info-circle" style="font-size: 2.5rem; color: #6c757d; margin-bottom: 1rem;"></i>
          <div style="font-size: 1.1rem; color: #495057; font-weight: 500;">Nenhuma sequência significativa identificada</div>
        </div>
      `;
    }

    let html = `<div class="sequences-container" style="display: grid; gap: 1.5rem;">`;

    // Sequências de acertos
    if (sequences.correctStreaks.length > 0) {
      html += `
        <div class="sequence-section" style="background: #f8fff9; border: 1px solid #d4edda; border-radius: 12px; padding: 1.5rem;">
          <div class="section-header" style="display: flex; align-items: center; margin-bottom: 1rem;">
            <i class="fa fa-check-circle" style="color: #28a745; margin-right: 0.5rem;"></i>
            <h6 style="margin: 0; color: #155724;">Sequências de Acertos</h6>
          </div>
          <div class="sequence-items">
            ${sequences.correctStreaks
              .slice(0, 3)
              .map(
                (streak, index) => `
              <div class="sequence-row" style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 8px; margin-bottom: 0.75rem;">
                <div class="sequence-badge" style="width: 3rem; height: 3rem; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                  <span style="color: white; font-weight: bold;">${
                    streak.length
                  }</span>
                </div>
                <div class="sequence-info">
                  <div style="font-weight: 600; color: #155724;">${
                    streak.length
                  } questões corretas consecutivas</div>
                  <div style="font-size: 0.875rem; color: #6c757d;">Questões ${
                    streak.start + 1
                  } a ${streak.end + 1}</div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    // Sequências de erros
    if (sequences.incorrectStreaks.length > 0) {
      html += `
        <div class="sequence-section" style="background: #fff5f5; border: 1px solid #f8d7da; border-radius: 12px; padding: 1.5rem;">
          <div class="section-header" style="display: flex; align-items: center; margin-bottom: 1rem;">
            <i class="fa fa-times-circle" style="color: #dc3545; margin-right: 0.5rem;"></i>
            <h6 style="margin: 0; color: #721c24;">Sequências de Erros</h6>
          </div>
          <div class="sequence-items">
            ${sequences.incorrectStreaks
              .slice(0, 3)
              .map(
                (streak, index) => `
              <div class="sequence-row" style="display: flex; align-items: center; padding: 1rem; background: white; border-radius: 8px; margin-bottom: 0.75rem;">
                <div class="sequence-badge" style="width: 3rem; height: 3rem; background: #dc3545; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                  <span style="color: white; font-weight: bold;">${
                    streak.length
                  }</span>
                </div>
                <div class="sequence-info">
                  <div style="font-weight: 600; color: #721c24;">${
                    streak.length
                  } questões incorretas consecutivas</div>
                  <div style="font-size: 0.875rem; color: #6c757d;">Questões ${
                    streak.start + 1
                  } a ${streak.end + 1}</div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Analisa padrões temporais (terços da prova)
   * @param {string} answerString - String de padrões
   * @returns {Object} Análise temporal
   */
  analyzeByThirds(answerString) {
    const length = answerString.length;
    const thirdSize = Math.ceil(length / 3);

    const first = answerString.slice(0, thirdSize);
    const second = answerString.slice(thirdSize, thirdSize * 2);
    const third = answerString.slice(thirdSize * 2);

    const analyzeChunk = (chunk) => {
      const correct = (chunk.match(/1/g) || []).length;
      const total = chunk.replace(/C/g, "").length; // Excluir anuladas
      return {
        correct,
        total,
        percentage: total > 0 ? (correct / total) * 100 : 0,
      };
    };

    return {
      first: analyzeChunk(first),
      second: analyzeChunk(second),
      third: analyzeChunk(third),
    };
  }

  /**
   * Renderiza padrões temporais
   * @param {string} answerString - String de padrões
   * @returns {string} HTML dos padrões temporais
   */
  renderTemporalPatterns(answerString) {
    const thirds = this.analyzeByThirds(answerString);
    const totalQuestions = answerString.length;
    const validQuestions = answerString.replace(/C/g, "").length;

    return `
      <div class="pattern-card">
        <h5><i class="fa fa-clock"></i> Desempenho Temporal</h5>
        
        <div class="temporal-summary" style="margin-bottom: 1.5rem;">
          <div class="summary-item" style="margin-bottom: 0.5rem;">
            <strong>Total de questões:</strong> ${totalQuestions} (${validQuestions} válidas)
          </div>
          <div class="summary-item">
            <strong>Análise:</strong> Divisão em terços para identificar fadiga ou melhora
          </div>
        </div>
        
        <div class="temporal-analysis" style="display: grid; gap: 1rem;">
          <div class="temporal-item" style="display: flex; align-items: center; padding: 1rem; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 8px;">
            <div class="temporal-label" style="flex: 1;">
              <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <i class="fa fa-play" style="margin-right: 0.5rem; color: #1976d2;"></i>
                <span style="font-weight: 600;">Início da Prova</span>
                <small style="margin-left: 0.5rem; color: #666;">(1º terço)</small>
              </div>
              <div class="temporal-bar" style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-bottom: 0.5rem;">
                <div class="temporal-fill" style="width: ${
                  thirds.first.percentage
                }%; height: 100%; background: linear-gradient(90deg, #4caf50, #8bc34a); border-radius: 4px;"></div>
              </div>
            </div>
            <div class="temporal-stats" style="text-align: center; margin-left: 1rem;">
              <div class="temporal-score" style="font-weight: 600; color: #1976d2;">${
                thirds.first.correct
              }/${thirds.first.total}</div>
              <div class="temporal-percentage" style="font-size: 0.875rem; color: #666;">${thirds.first.percentage.toFixed(
                1
              )}%</div>
            </div>
          </div>
          
          <div class="temporal-item" style="display: flex; align-items: center; padding: 1rem; background: linear-gradient(135deg, #fff3e0, #fce4ec); border-radius: 8px;">
            <div class="temporal-label" style="flex: 1;">
              <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <i class="fa fa-pause" style="margin-right: 0.5rem; color: #f57c00;"></i>
                <span style="font-weight: 600;">Meio da Prova</span>
                <small style="margin-left: 0.5rem; color: #666;">(2º terço)</small>
              </div>
              <div class="temporal-bar" style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-bottom: 0.5rem;">
                <div class="temporal-fill" style="width: ${
                  thirds.second.percentage
                }%; height: 100%; background: linear-gradient(90deg, #ff9800, #ffc107); border-radius: 4px;"></div>
              </div>
            </div>
            <div class="temporal-stats" style="text-align: center; margin-left: 1rem;">
              <div class="temporal-score" style="font-weight: 600; color: #f57c00;">${
                thirds.second.correct
              }/${thirds.second.total}</div>
              <div class="temporal-percentage" style="font-size: 0.875rem; color: #666;">${thirds.second.percentage.toFixed(
                1
              )}%</div>
            </div>
          </div>
          
          <div class="temporal-item" style="display: flex; align-items: center; padding: 1rem; background: linear-gradient(135deg, #fce4ec, #f3e5f5); border-radius: 8px;">
            <div class="temporal-label" style="flex: 1;">
              <div style="display: flex; align-items: center; margin-bottom: 0.5rem;">
                <i class="fa fa-stop" style="margin-right: 0.5rem; color: #7b1fa2;"></i>
                <span style="font-weight: 600;">Final da Prova</span>
                <small style="margin-left: 0.5rem; color: #666;">(3º terço)</small>
              </div>
              <div class="temporal-bar" style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; margin-bottom: 0.5rem;">
                <div class="temporal-fill" style="width: ${
                  thirds.third.percentage
                }%; height: 100%; background: linear-gradient(90deg, #9c27b0, #e91e63); border-radius: 4px;"></div>
              </div>
            </div>
            <div class="temporal-stats" style="text-align: center; margin-left: 1rem;">
              <div class="temporal-score" style="font-weight: 600; color: #7b1fa2;">${
                thirds.third.correct
              }/${thirds.third.total}</div>
              <div class="temporal-percentage" style="font-size: 0.875rem; color: #666;">${thirds.third.percentage.toFixed(
                1
              )}%</div>
            </div>
          </div>
        </div>
        
        <div class="temporal-insights" style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
          <h6 style="margin-bottom: 0.75rem;"><i class="fa fa-lightbulb"></i> Insights Temporais</h6>
          <div style="font-size: 0.875rem; color: #495057;">
            ${this.generateTemporalInsights(thirds)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera insights sobre padrões temporais
   * @param {Object} thirds - Análise dos terços
   * @returns {string} Insights em texto
   */
  generateTemporalInsights(thirds) {
    let insights = [];

    const performances = [
      thirds.first.percentage,
      thirds.second.percentage,
      thirds.third.percentage,
    ];
    const best = Math.max(...performances);
    const worst = Math.min(...performances);

    if (
      performances[0] > performances[1] &&
      performances[0] > performances[2]
    ) {
      insights.push(
        "• Melhor desempenho no início da prova, indicando boa preparação inicial."
      );
    }

    if (
      performances[2] > performances[0] &&
      performances[2] > performances[1]
    ) {
      insights.push(
        "• Melhora progressiva ao longo da prova, demonstrando resistência e concentração."
      );
    }

    if (
      performances[1] < performances[0] &&
      performances[1] < performances[2]
    ) {
      insights.push(
        "• Queda no meio da prova, possível fadiga mental ou perda de concentração."
      );
    }

    if (best - worst > 20) {
      insights.push(
        "• Grande variação de desempenho entre os terços - revisar estratégia de prova."
      );
    } else if (best - worst < 10) {
      insights.push("• Desempenho consistente ao longo da prova.");
    }

    return insights.length > 0
      ? insights.join("<br>")
      : "Padrão temporal dentro do esperado.";
  }

  /**
   * Analisa frequência de opções escolhidas
   * @param {Array} questions - Lista de questões
   * @param {Object} answers - Respostas do usuário
   * @returns {Object} Análise de frequência
   */
  analyzeOptionFrequency(questions, answers) {
    const frequency = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const totalAnswered = Object.keys(answers).length;

    Object.values(answers).forEach((answer) => {
      if (frequency.hasOwnProperty(answer)) {
        frequency[answer]++;
      }
    });

    const percentages = {};
    Object.entries(frequency).forEach(([option, count]) => {
      percentages[option] =
        totalAnswered > 0 ? (count / totalAnswered) * 100 : 0;
    });

    return { frequency, percentages, totalAnswered };
  }

  /**
   * Renderiza análise de frequência de opções
   * @param {Array} questions - Lista de questões
   * @param {Object} answers - Respostas do usuário
   * @returns {string} HTML da análise
   */
  renderOptionFrequency(questions, answers) {
    const analysis = this.analyzeOptionFrequency(questions, answers);

    return `
      <div class="pattern-card">
        <h5><i class="fa fa-chart-bar"></i> Frequência das Alternativas</h5>
        
        <div class="frequency-summary" style="margin-bottom: 1.5rem;">
          <div><strong>Total de respostas:</strong> ${
            analysis.totalAnswered
          }</div>
          <div><strong>Distribuição esperada:</strong> ~20% por alternativa</div>
        </div>
        
        <div class="frequency-chart" style="display: grid; gap: 0.75rem;">
          ${Object.entries(analysis.frequency)
            .map(
              ([option, count]) => `
            <div class="frequency-item" style="display: flex; align-items: center; padding: 0.75rem; background: white; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div class="option-label" style="width: 3rem; height: 3rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 1rem;">
                <span style="color: white; font-weight: bold; font-size: 1.1rem;">${option}</span>
              </div>
              <div class="option-info" style="flex: 1;">
                <div class="option-stats" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-weight: 600;">${count} respostas</span>
                  <span style="font-size: 0.875rem; color: #666;">${analysis.percentages[
                    option
                  ].toFixed(1)}%</span>
                </div>
                <div class="option-bar" style="width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px;">
                  <div style="width: ${
                    analysis.percentages[option]
                  }%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); border-radius: 3px;"></div>
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="frequency-analysis" style="margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
          <h6 style="margin-bottom: 0.75rem;"><i class="fa fa-search"></i> Análise do Padrão</h6>
          <div style="font-size: 0.875rem; color: #495057;">
            ${this.generateFrequencyInsights(analysis)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera insights sobre frequência de opções
   * @param {Object} analysis - Análise de frequência
   * @returns {string} Insights em texto
   */
  generateFrequencyInsights(analysis) {
    const { percentages, totalAnswered } = analysis;
    let insights = [];

    const expectedPercentage = 20;
    const maxDeviation = Math.max(
      ...Object.values(percentages).map((p) => Math.abs(p - expectedPercentage))
    );

    if (maxDeviation < 5) {
      insights.push("• Distribuição equilibrada entre as alternativas.");
    } else {
      const mostChosen = Object.entries(percentages).reduce(
        (max, [option, pct]) => (pct > max.pct ? { option, pct } : max),
        { option: "", pct: 0 }
      );

      const leastChosen = Object.entries(percentages).reduce(
        (min, [option, pct]) => (pct < min.pct ? { option, pct } : min),
        { option: "", pct: 100 }
      );

      if (mostChosen.pct > 30) {
        insights.push(
          `• Tendência a escolher alternativa ${
            mostChosen.option
          } (${mostChosen.pct.toFixed(1)}%).`
        );
      }

      if (leastChosen.pct < 10) {
        insights.push(
          `• Alternativa ${
            leastChosen.option
          } raramente escolhida (${leastChosen.pct.toFixed(1)}%).`
        );
      }
    }

    return insights.length > 0
      ? insights.join("<br>")
      : "Padrão de escolha dentro do esperado.";
  }

  /**
   * Renderiza análise de consistência
   * @param {Array} questions - Lista de questões
   * @param {Object} answers - Respostas do usuário
   * @returns {string} HTML da análise
   */
  renderConsistencyAnalysis(questions, answers) {
    return `
      <div class="pattern-card">
        <h5><i class="fa fa-balance-scale"></i> Análise de Consistência</h5>
        
        <div class="consistency-summary" style="padding: 1rem; background: #f8f9fa; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 1rem;">
            <i class="fa fa-info-circle" style="font-size: 2rem; color: #17a2b8; margin-bottom: 0.5rem;"></i>
            <div style="font-weight: 600; color: #495057;">Análise Básica de Padrões</div>
          </div>
          
          <div style="font-size: 0.875rem; color: #6c757d; text-align: center;">
            A análise de consistência mais avançada requer dados de dificuldade das questões.<br>
            Esta versão apresenta análises básicas de padrões de resposta.
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza estado vazio
   */
  renderEmptyState() {
    return `
      <div class="no-data" style="
        text-align: center;
        padding: 3rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 16px;
        border: 1px solid #dee2e6;
      ">
        <i class="fa fa-info-circle" style="font-size: 3rem; margin-bottom: 1rem; color: #6c757d;"></i>
        <h3 style="color: #495057;">Dados não disponíveis</h3>
        <p style="color: #6c757d;">Complete um simulado para ver a análise de padrões.</p>
      </div>
    `;
  }

  /**
   * Renderiza estado sem respostas
   */
  renderNoAnswersState() {
    return `
      <div class="no-answers" style="
        text-align: center;
        padding: 3rem;
        background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
        border-radius: 16px;
        border: 1px solid #ffeaa7;
      ">
        <i class="fa fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: #856404;"></i>
        <h3 style="color: #856404;">Respostas não encontradas</h3>
        <p style="color: #856404;">Responda algumas questões para ver a análise de padrões.</p>
      </div>
    `;
  }

  /**
   * Renderiza estado de erro
   * @param {string} errorMessage - Mensagem de erro
   */
  renderErrorState(errorMessage = "Erro desconhecido") {
    return `
      <div class="error" style="
        text-align: center;
        padding: 3rem;
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border-radius: 16px;
        border: 1px solid #f5c6cb;
      ">
        <i class="fa fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; color: #721c24;"></i>
        <h3 style="color: #721c24;">Erro na renderização</h3>
        <p style="color: #721c24;">Ocorreu um erro ao carregar a análise de padrões.</p>
        <small style="color: #721c24; display: block; margin-top: 1rem; font-family: monospace;">${errorMessage}</small>
      </div>
    `;
  }

  /**
   * Renderiza análise de sequências de acertos e erros
   * @param {string} answerString - String de padrões de resposta
   * @returns {string} HTML da análise de sequências
   */
  renderSequencePatterns(answerString) {
    const sequences = this.analyzeSequences(answerString);

    return `
      <div class="pattern-card">
        <h5><i class="fa fa-chart-line"></i> Análise de Sequências</h5>
        
        <div class="sequence-summary" style="margin-bottom: 1.5rem;">
          <div class="summary-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem;">
            <div class="summary-card success" style="
              background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
              border: 1px solid #b8dabc;
              border-radius: 12px;
              padding: 1.5rem 1rem;
              text-align: center;
              box-shadow: 0 4px 8px rgba(40, 167, 69, 0.1);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(40, 167, 69, 0.15)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(40, 167, 69, 0.1)'">
              <div class="card-icon" style="margin-bottom: 0.75rem;">
                <i class="fa fa-trophy" style=""
                  font-size: 2rem;
                  color: #28a745;
                  background: rgba(40, 167, 69, 0.1);
                  width: 3.5rem;
                  height: 3.5rem;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 50%;
                "></i>
              </div>
              <div class="card-content">
                <div class="card-value" style=""
                  font-size: 2rem;
                  font-weight: 700;
                  color: #155724;
                  margin-bottom: 0.25rem;
                ">${sequences.maxCorrectStreak}</div>
                <div class="card-label" style=""
                  font-size: 0.875rem;
                  color: #155724;
                  font-weight: 500;
                  line-height: 1.3;
                ">Maior sequência<br>de acertos</div>
              </div>
            </div>
            
            <div class="summary-card danger" style=""
              background: linear-gradient(135deg, #f8d7da 0%, #f1b0b7 100%);
              border: 1px solid #f5c6cb;
              border-radius: 12px;
              padding: 1.5rem 1rem;
              text-align: center;
              box-shadow: 0 4px 8px rgba(220, 53, 69, 0.1);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(220, 53, 69, 0.15)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(220, 53, 69, 0.1)'">
              <div class="card-icon" style="margin-bottom: 0.75rem;">
                <i class="fa fa-exclamation-triangle" style=""
                  font-size: 2rem;
                  color: #dc3545;
                  background: rgba(220, 53, 69, 0.1);
                  width: 3.5rem;
                  height: 3.5rem;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 50%;
                "></i>
              </div>
              <div class="card-content">
                <div class="card-value" style=""
                  font-size: 2rem;
                  font-weight: 700;
                  color: #721c24;
                  margin-bottom: 0.25rem;
                ">${sequences.maxIncorrectStreak}</div>
                <div class="card-label" style=""
                  font-size: 0.875rem;
                  color: #721c24;
                  font-weight: 500;
                  line-height: 1.3;
                ">Maior sequência<br>de erros</div>
              </div>
            </div>
            
            <div class="summary-card info" style=""
              background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
              border: 1px solid #bee5eb;
              border-radius: 12px;
              padding: 1.5rem 1rem;
              text-align: center;
              box-shadow: 0 4px 8px rgba(23, 162, 184, 0.1);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(23, 162, 184, 0.15)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(23, 162, 184, 0.1)'">
              <div class="card-icon" style="margin-bottom: 0.75rem;">
                <i class="fa fa-exchange-alt" style=""
                  font-size: 2rem;
                  color: #17a2b8;
                  background: rgba(23, 162, 184, 0.1);
                  width: 3.5rem;
                  height: 3.5rem;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 50%;
                "></i>
              </div>
              <div class="card-content">
                <div class="card-value" style=""
                  font-size: 2rem;
                  font-weight: 700;
                  color: #0c5460;
                  margin-bottom: 0.25rem;
                ">${sequences.alternations}</div>
                <div class="card-label" style=""
                  font-size: 0.875rem;
                  color: #0c5460;
                  font-weight: 500;
                  line-height: 1.3;
                ">Alternâncias<br>de padrão</div>
              </div>
            </div>
          </div>
        </div>
        
        ${this.renderDetailedSequences(sequences)}
      </div>
    `;
  }
}
