import { BaseTabRenderer } from "./BaseTabRenderer.js";
import { PatternAnalyzer } from "./patterns/PatternAnalyzer.js";
import { PatternVisualizer } from "./patterns/PatternVisualizer.js";
import { TemporalPatternRenderer } from "./patterns/TemporalPatternRenderer.js";
import { OptionFrequencyRenderer } from "./patterns/OptionFrequencyRenderer.js";

export class PatternsTabRenderer extends BaseTabRenderer {
  constructor(app) {
    super(app);
  }

  /**
   * Obtém o casual hit de uma questão dos metadados
   * @param {Object} meta - Metadados do simulado
   * @param {Object} config - Configuração atual
   * @param {Object} question - Objeto da questão
   * @returns {number|null} - Valor do casual hit em decimal (0-1) ou null se não encontrado
   */
  getCasualHit(meta, config, question) {
    try {
      if (
        !meta[config.year] ||
        !meta[config.year][question.area] ||
        !meta[config.year][question.area][question.originalPosition]
      ) {
        return null;
      }

      const questionMeta =
        meta[config.year][question.area][question.originalPosition];
      const casualHitPercent = questionMeta["casual hit"];

      if (casualHitPercent === null || casualHitPercent === undefined) {
        return null;
      }

      // Converter de percentual para decimal
      return casualHitPercent / 100;
    } catch (error) {
      console.warn("Erro ao obter casual hit:", error);
      return null;
    }
  }

  /**
   * Função principal de renderização
   * @param {Object} resultsData - Dados dos resultados (opcional)
   */
  render(resultsData = null) {
    console.log("🎯 PatternsTabRenderer: render() chamada");

    const container = document.getElementById("patterns-container");
    if (!container) {
      console.error(
        "❌ PatternsTabRenderer: Container 'patterns-container' não encontrado"
      );
      return;
    }

    const questions = this.app.getQuestions();
    const answers = this.app.getAnswers();

    console.log("📊 PatternsTabRenderer: Dados coletados", {
      questionsCount: questions?.length || 0,
      answersCount: Object.keys(answers || {}).length,
      sampleAnswers: Object.entries(answers || {}).slice(0, 3),
      hasApp: !!this.app,
      hasContainer: !!container,
    });

    // Verificar se há dados suficientes
    if (!questions || questions.length === 0) {
      console.log("⚠️ PatternsTabRenderer: Nenhuma questão encontrada");
      container.innerHTML = this.renderNoData();
      return;
    }

    // Obter string de respostas
    const answerString = PatternAnalyzer.getAnswerString(
      questions,
      answers,
      this.app
    );

    console.log("🔤 PatternsTabRenderer: String de respostas", {
      answerString: answerString,
      length: answerString?.length || 0,
      preview:
        answerString?.substring(0, 20) +
        (answerString?.length > 20 ? "..." : ""),
    });

    if (!answerString || answerString.length === 0) {
      console.log("⚠️ PatternsTabRenderer: String de respostas vazia");
      container.innerHTML = this.renderNoAnswers();
      return;
    }

    // Renderizar conteúdo completo
    try {
      console.log("🎨 PatternsTabRenderer: Iniciando renderização do conteúdo");

      const html = `
        <div class="patterns-analysis">
          <h4><i class="fa fa-search"></i> Análise de Padrões</h4>
          
          ${PatternVisualizer.renderBasicStats(answerString)}
          ${PatternVisualizer.renderResponsePattern(answerString)}
          
          <div class="patterns-grid">
            ${OptionFrequencyRenderer.render(
              questions,
              answers,
              PatternVisualizer.getOptionColor,
              PatternVisualizer.createProgressBar,
              PatternAnalyzer.generateFrequencyInsights
            )}
            ${TemporalPatternRenderer.render(
              answerString,
              PatternVisualizer.createProgressBar
            )}
          </div>
        </div>
      `;

      container.innerHTML = html;
      console.log("✅ PatternsTabRenderer: Renderização concluída com sucesso");
    } catch (error) {
      console.error("❌ Erro ao renderizar aba Padrões:", error);
      console.error("🔍 Stack trace:", error.stack);
      container.innerHTML = this.renderError(error.message);
    }
  }

  /**
   * Renderiza mensagem quando não há dados
   */
  renderNoData() {
    return `
      <div class="patterns-analysis">
        <h4><i class="fa fa-search"></i> Análise de Padrões</h4>
        <div class="no-data" style="
          text-align: center;
          padding: 3rem;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        ">
          <i class="fa fa-info-circle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--text-secondary);"></i>
          <h3>Dados não disponíveis</h3>
          <p style="color: var(--text-secondary);">Complete um simulado para ver a análise de padrões.</p>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza mensagem quando não há respostas
   */
  renderNoAnswers() {
    return `
      <div class="patterns-analysis">
        <h4><i class="fa fa-search"></i> Análise de Padrões</h4>
        <div class="no-answers" style="
          text-align: center;
          padding: 3rem;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        ">
          <i class="fa fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--warning-color);"></i>
          <h3>Respostas não encontradas</h3>
          <p style="color: var(--text-secondary);">Responda algumas questões para ver a análise de padrões.</p>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza mensagem de erro
   * @param {string} errorMessage - Mensagem de erro
   */
  renderError(errorMessage) {
    return `
      <div class="patterns-analysis">
        <h4><i class="fa fa-search"></i> Análise de Padrões</h4>
        <div class="error" style="
          text-align: center;
          padding: 3rem;
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        ">
          <i class="fa fa-exclamation-circle" style="font-size: 3rem; margin-bottom: 1rem; color: var(--danger-color);"></i>
          <h3>Erro na renderização</h3>
          <p style="color: var(--text-secondary);">Ocorreu um erro ao carregar a análise de padrões.</p>
          <small style="color: var(--text-muted); display: block; margin-top: 1rem; font-family: monospace;">${errorMessage}</small>
        </div>
      </div>
    `;
  }

  /**
   * Função de teste para verificar se o casual hit está sendo obtido corretamente
   * Use no console: renderer.testCasualHit()
   */
  testCasualHit() {
    const config = this.app.getCurrentConfig();
    const meta = this.app.getMeta();
    const questions = this.app.getQuestions();

    console.log("=== TESTE DE CASUAL HIT ===");
    console.log("Config:", config);

    // Testar com as primeiras 5 questões
    questions.slice(0, 5).forEach((question, index) => {
      if (question.cancelled) {
        console.log(
          `Questão ${index + 1} (${question.originalPosition}): ANULADA`
        );
        return;
      }

      const casualHit = this.getCasualHit(meta, config, question);
      const questionMeta =
        meta[config.year]?.[question.area]?.[question.originalPosition];

      console.log(`Questão ${index + 1} (${question.originalPosition}):`, {
        area: question.area,
        casualHitPercent: questionMeta?.["casual hit"],
        casualHitDecimal: casualHit,
        difficulty: questionMeta?.difficulty,
        discrimination: questionMeta?.discrimination,
      });
    });
  }
}
