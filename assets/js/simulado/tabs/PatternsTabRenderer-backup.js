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

      const questionMeta = meta[config.year][question.area][question.originalPosition];
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
      console.error("❌ PatternsTabRenderer: Container 'patterns-container' não encontrado");
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
    const answerString = PatternAnalyzer.getAnswerString(questions, answers, this.app);
    
    console.log("🔤 PatternsTabRenderer: String de respostas", {
      answerString: answerString,
      length: answerString?.length || 0,
      preview: answerString?.substring(0, 20) + (answerString?.length > 20 ? "..." : ""),
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
            ${TemporalPatternRenderer.render(answerString, PatternVisualizer.createProgressBar)}
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
        console.log(`Questão ${index + 1} (${question.originalPosition}): ANULADA`);
        return;
      }

      const casualHit = this.getCasualHit(meta, config, question);
      const questionMeta = meta[config.year]?.[question.area]?.[question.originalPosition];

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
      container.innerHTML = `
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
      return;
    }

    // Obter string de respostas
    const answerString = this.getAnswerString(questions, answers);

    console.log("🔤 PatternsTabRenderer: String de respostas", {
      answerString: answerString,
      length: answerString?.length || 0,
      preview:
        answerString?.substring(0, 20) +
        (answerString?.length > 20 ? "..." : ""),
    });

    if (!answerString || answerString.length === 0) {
      console.log("⚠️ PatternsTabRenderer: String de respostas vazia");
      container.innerHTML = `
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
      return;
    }

    // Renderizar conteúdo básico primeiro para testar
    try {
      console.log("🎨 PatternsTabRenderer: Iniciando renderização do conteúdo");

      const html = `
        <div class="patterns-analysis">
          <h4><i class="fa fa-search"></i> Análise de Padrões</h4>
          
          ${this.renderBasicStats(answerString)}
          ${this.renderResponsePattern(answerString)}
          
          <div class="patterns-grid">
            ${this.renderOptionFrequency(questions, answers)}
            ${this.renderTemporalPatterns(answerString)}
          </div>
        </div>
      `;

      container.innerHTML = html;
      console.log("✅ PatternsTabRenderer: Renderização concluída com sucesso");
    } catch (error) {
      console.error("❌ Erro ao renderizar aba Padrões:", error);
      console.error("🔍 Stack trace:", error.stack);
      container.innerHTML = `
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
            <small style="color: var(--text-muted); display: block; margin-top: 1rem; font-family: monospace;">${error.message}</small>
          </div>
        </div>
      `;
    }
  }

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

  generatePatternStats(answerString) {
    const correctCount = (answerString.match(/1/g) || []).length;
    const incorrectCount = (answerString.match(/0/g) || []).length;
    const cancelledCount = (answerString.match(/C/g) || []).length;
    const totalValid = correctCount + incorrectCount;
    const accuracy = totalValid > 0 ? (correctCount / totalValid) * 100 : 0;

    const stats = [
      {
        icon: "fa-check-circle",
        value: correctCount,
        label: "Corretas",
        color: "#10b981",
        bgColor: "rgba(16, 185, 129, 0.1)",
      },
      {
        icon: "fa-times-circle",
        value: incorrectCount,
        label: "Incorretas",
        color: "#ef4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
      },
      {
        icon: "fa-bullseye",
        value: accuracy.toFixed(1) + "%",
        label: "Precisão",
        color: "#3b82f6",
        bgColor: "rgba(59, 130, 246, 0.1)",
      },
    ];

    if (cancelledCount > 0) {
      stats.splice(2, 0, {
        icon: "fa-ban",
        value: cancelledCount,
        label: "Anuladas",
        color: "#f59e0b",
        bgColor: "rgba(245, 158, 11, 0.1)",
      });
    }

    return stats
      .map(
        (stat) => `
      <div class="pattern-stat" style="
        background: ${stat.bgColor};
        border: 1px solid ${stat.color}40;
        border-radius: 8px;
        padding: 1rem;
        text-align: center;
        transition: all 0.3s ease;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px ${stat.color}30'"
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
        <i class="fa ${stat.icon}" style="
          font-size: 1.5rem;
          color: ${stat.color};
          margin-bottom: 0.5rem;
          display: block;
        "></i>
        <div style="
          font-size: 1.25rem;
          font-weight: 700;
          color: ${stat.color};
          margin-bottom: 0.25rem;
        ">${stat.value}</div>
        <div style="
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        ">${stat.label}</div>
      </div>
    `
      )
      .join("");
  }

  renderSequencePatterns(answerString) {
    // Analisar sequências de acertos e erros
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
                <i class="fa fa-trophy" style="
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
                <div class="card-value" style="
                  font-size: 2rem;
                  font-weight: 700;
                  color: #155724;
                  margin-bottom: 0.25rem;
                ">${sequences.maxCorrectStreak}</div>
                <div class="card-label" style="
                  font-size: 0.875rem;
                  color: #155724;
                  font-weight: 500;
                  line-height: 1.3;
                ">Maior sequência<br>de acertos</div>
              </div>
            </div>
            
            <div class="summary-card danger" style="
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
                <i class="fa fa-exclamation-triangle" style="
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
                <div class="card-value" style="
                  font-size: 2rem;
                  font-weight: 700;
                  color: #721c24;
                  margin-bottom: 0.25rem;
                ">${sequences.maxIncorrectStreak}</div>
                <div class="card-label" style="
                  font-size: 0.875rem;
                  color: #721c24;
                  font-weight: 500;
                  line-height: 1.3;
                ">Maior sequência<br>de erros</div>
              </div>
            </div>
            
            <div class="summary-card info" style="
              background: linear-gradient(135deg, #cce7ff 0%, #b3d7ff 100%);
              border: 1px solid #b8daff;
              border-radius: 12px;
              padding: 1.5rem 1rem;
              text-align: center;
              box-shadow: 0 4px 8px rgba(0, 123, 255, 0.1);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0, 123, 255, 0.15)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 8px rgba(0, 123, 255, 0.1)'">
              <div class="card-icon" style="margin-bottom: 0.75rem;">
                <i class="fa fa-arrows-alt-h" style="
                  font-size: 2rem;
                  color: #007bff;
                  background: rgba(0, 123, 255, 0.1);
                  width: 3.5rem;
                  height: 3.5rem;
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 50%;
                "></i>
              </div>
              <div class="card-content">
                <div class="card-value" style="
                  font-size: 2rem;
                  font-weight: 700;
                  color: #004085;
                  margin-bottom: 0.25rem;
                ">${sequences.alternations}</div>
                <div class="card-label" style="
                  font-size: 0.875rem;
                  color: #004085;
                  font-weight: 500;
                  line-height: 1.3;
                ">Mudanças entre<br>acerto/erro</div>
              </div>
            </div>
          </div>
        </div>

        ${this.renderDetailedSequences(sequences)}
      </div>
    `;

    container.innerHTML = html;
  }

  renderBasicStats(answerString) {
    const correctCount = (answerString.match(/1/g) || []).length;
    const incorrectCount = (answerString.match(/0/g) || []).length;
    const cancelledCount = (answerString.match(/C/g) || []).length;
    const totalValid = correctCount + incorrectCount;
    const accuracy = totalValid > 0 ? (correctCount / totalValid) * 100 : 0;

    return `
      <div class="pattern-card">
        <h5><i class="fa fa-chart-bar"></i> Estatísticas Gerais</h5>
        <div class="stats-grid" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        ">
          <div class="stat-item" style="
            background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
            border: 1px solid #28a745;
            border-radius: 12px;
            padding: 1.5rem 1rem;
            text-align: center;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.transform='translateY(0)'">
            <i class="fa fa-check-circle" style="
              font-size: 2rem;
              color: #28a745;
              margin-bottom: 0.5rem;
              display: block;
            "></i>
            <div style="
              font-size: 1.5rem;
              font-weight: 700;
              color: #155724;
              margin-bottom: 0.25rem;
            ">${correctCount}</div>
            <div style="
              font-size: 0.875rem;
              color: #155724;
              font-weight: 500;
            ">Corretas</div>
          </div>

          <div class="stat-item" style="
            background: linear-gradient(135deg, #f8d7da 0%, #f1b0b7 100%);
            border: 1px solid #dc3545;
            border-radius: 12px;
            padding: 1.5rem 1rem;
            text-align: center;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.transform='translateY(0)'">
            <i class="fa fa-times-circle" style="
              font-size: 2rem;
              color: #dc3545;
              margin-bottom: 0.5rem;
              display: block;
            "></i>
            <div style="
              font-size: 1.5rem;
              font-weight: 700;
              color: #721c24;
              margin-bottom: 0.25rem;
            ">${incorrectCount}</div>
            <div style="
              font-size: 0.875rem;
              color: #721c24;
              font-weight: 500;
            ">Incorretas</div>
          </div>

          <div class="stat-item" style="
            background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
            border: 1px solid #3b82f6;
            border-radius: 12px;
            padding: 1.5rem 1rem;
            text-align: center;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.transform='translateY(0)'">
            <i class="fa fa-bullseye" style="
              font-size: 2rem;
              color: #3b82f6;
              margin-bottom: 0.5rem;
              display: block;
            "></i>
            <div style="
              font-size: 1.5rem;
              font-weight: 700;
              color: #1e3a8a;
              margin-bottom: 0.25rem;
            ">${accuracy.toFixed(1)}%</div>
            <div style="
              font-size: 0.875rem;
              color: #1e3a8a;
              font-weight: 500;
            ">Precisão</div>
          </div>

          ${
            cancelledCount > 0
              ? `
          <div class="stat-item" style="
            background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
            border: 1px solid #f59e0b;
            border-radius: 12px;
            padding: 1.5rem 1rem;
            text-align: center;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.transform='translateY(0)'">
            <i class="fa fa-ban" style="
              font-size: 2rem;
              color: #f59e0b;
              margin-bottom: 0.5rem;
              display: block;
            "></i>
            <div style="
              font-size: 1.5rem;
              font-weight: 700;
              color: #92400e;
              margin-bottom: 0.25rem;
            ">${cancelledCount}</div>
            <div style="
              font-size: 0.875rem;
              color: #92400e;
              font-weight: 500;
            ">Anuladas</div>
          </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  renderResponsePattern(answerString) {
    const correctCount = (answerString.match(/1/g) || []).length;
    const incorrectCount = (answerString.match(/0/g) || []).length;
    const cancelledCount = (answerString.match(/C/g) || []).length;
    const totalQuestions = answerString.length;
    const accuracy =
      totalQuestions > 0
        ? (correctCount / (correctCount + incorrectCount)) * 100
        : 0;

    // Cores para cada tipo de resposta
    const colors = {
      1: { bg: "#d4edda", border: "#28a745", name: "Corretas" },
      0: { bg: "#f8d7da", border: "#dc3545", name: "Incorretas" },
      C: { bg: "#fff3cd", border: "#ffc107", name: "Anuladas" },
    };

    return `
      <div class="pattern-card" style="
        background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
        border: 2px solid var(--border-color);
        border-radius: 16px;
        padding: 2rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
      ">
        <div class="card-header" style="
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--border-color);
        ">
          <div class="header-icon" style="
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            width: 3rem;
            height: 3rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
          ">
            <i class="fa fa-th" style="font-size: 1.25rem; color: white;"></i>
          </div>
          <div>
            <h5 style="
              margin: 0;
              font-size: 1.375rem;
              font-weight: 700;
              color: var(--text-primary);
              line-height: 1.2;
            ">Padrão de Respostas</h5>
            <p style="
              margin: 0.25rem 0 0 0;
              font-size: 0.875rem;
              color: var(--text-secondary);
              opacity: 0.8;
            ">Visualização bit a bit das suas respostas</p>
          </div>
        </div>

        <div class="response-stats" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        ">
          <div class="stat-card correct" style="
            background: linear-gradient(135deg, ${
              colors["1"].bg
            } 0%, #ffffff 100%);
            border: 2px solid ${colors["1"].border};
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(40, 167, 69, 0.2)'" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(40, 167, 69, 0.1)'">
            <i class="fa fa-check-circle" style="
              font-size: 2rem;
              color: ${colors["1"].border};
              margin-bottom: 0.5rem;
            "></i>
            <div class="stat-value" style="
              font-size: 2rem;
              font-weight: 700;
              color: ${colors["1"].border};
              margin-bottom: 0.25rem;
            ">${correctCount}</div>
            <div class="stat-label" style="
              font-size: 0.875rem;
              color: #155724;
              font-weight: 500;
            ">${colors["1"].name}</div>
          </div>

          <div class="stat-card incorrect" style="
            background: linear-gradient(135deg, ${
              colors["0"].bg
            } 0%, #ffffff 100%);
            border: 2px solid ${colors["0"].border};
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(220, 53, 69, 0.2)'" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(220, 53, 69, 0.1)'">
            <i class="fa fa-times-circle" style="
              font-size: 2rem;
              color: ${colors["0"].border};
              margin-bottom: 0.5rem;
            "></i>
            <div class="stat-value" style="
              font-size: 2rem;
              font-weight: 700;
              color: ${colors["0"].border};
              margin-bottom: 0.25rem;
            ">${incorrectCount}</div>
            <div class="stat-label" style="
              font-size: 0.875rem;
              color: #721c24;
              font-weight: 500;
            ">${colors["0"].name}</div>
          </div>

          ${
            cancelledCount > 0
              ? `
            <div class="stat-card cancelled" style="
              background: linear-gradient(135deg, ${colors["C"].bg} 0%, #ffffff 100%);
              border: 2px solid ${colors["C"].border};
              border-radius: 12px;
              padding: 1.5rem;
              text-align: center;
              transition: transform 0.3s ease, box-shadow 0.3s ease;
            " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(255, 193, 7, 0.2)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 193, 7, 0.1)'">
              <i class="fa fa-ban" style="
                font-size: 2rem;
                color: ${colors["C"].border};
                margin-bottom: 0.5rem;
              "></i>
              <div class="stat-value" style="
                font-size: 2rem;
                font-weight: 700;
                color: ${colors["C"].border};
                margin-bottom: 0.25rem;
              ">${cancelledCount}</div>
              <div class="stat-label" style="
                font-size: 0.875rem;
                color: #856404;
                font-weight: 500;
              ">${colors["C"].name}</div>
            </div>
          `
              : ""
          }

          <div class="stat-card accuracy" style="
            background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
            border: 2px solid var(--primary-color);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          " onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(59, 130, 246, 0.2)'" 
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.1)'">
            <i class="fa fa-bullseye" style="
              font-size: 2rem;
              color: var(--primary-color);
              margin-bottom: 0.5rem;
            "></i>
            <div class="stat-value" style="
              font-size: 2rem;
              font-weight: 700;
              color: var(--primary-color);
              margin-bottom: 0.25rem;
            ">${accuracy.toFixed(1)}%</div>
            <div class="stat-label" style="
              font-size: 0.875rem;
              color: var(--text-secondary);
              font-weight: 500;
            ">Precisão</div>
          </div>
        </div>
      </div>
    `;
  }

  renderOptionFrequency(questions, answers) {
    // Contar frequência de cada alternativa escolhida
    const frequency = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    const total = questions.filter((q) => !q.cancelled).length;

    questions.forEach((question) => {
      if (!question.cancelled) {
        const userAnswer = answers[question.position];
        if (userAnswer && frequency.hasOwnProperty(userAnswer)) {
          frequency[userAnswer]++;
        }
      }
    });

    return `
      <div class="pattern-card">
        <h5><i class="fa fa-chart-pie"></i> Frequência das Alternativas</h5>
        <div class="frequency-analysis" style="margin-top: 1.5rem;">
          ${Object.entries(frequency)
            .map(([option, count]) => {
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const color = this.getOptionColor(option);

              return `
              <div class="option-item" style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                margin-bottom: 0.75rem;
                background: linear-gradient(135deg, ${color}20, ${color}10);
                border: 1px solid ${color}40;
                border-radius: 12px;
                transition: all 0.3s ease;
              " onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px ${color}30'"
                 onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                <div class="option-info" style="display: flex; align-items: center;">
                  <div class="option-letter" style="
                    background: ${color};
                    color: white;
                    width: 2.5rem;
                    height: 2.5rem;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.125rem;
                    margin-right: 1rem;
                    box-shadow: 0 2px 8px ${color}40;
                  ">${option}</div>
                  <div>
                    <div style="font-weight: 600; color: var(--text-primary);">${count} questões</div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">${percentage.toFixed(
                      1
                    )}% do total</div>
                  </div>
                </div>
                <div class="option-progress" style="flex: 1; max-width: 150px; margin-left: 1rem;">
                  ${this.createProgressBar(percentage, color, "6px")}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
        
        <div class="frequency-insights" style="
          margin-top: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-secondary));
          border-radius: 12px;
          border: 1px solid var(--border-color);
        ">
          <h6 style="
            color: var(--text-primary);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          ">
            <i class="fa fa-lightbulb" style="color: var(--warning-color);"></i>
            Análise dos Padrões
          </h6>
          <div style="color: var(--text-secondary); line-height: 1.6;">
            ${this.generateFrequencyInsights(frequency, total)}
          </div>
        </div>
      </div>
    `;
  }

  renderTemporalPatterns(answerString) {
    const chunks = this.getTemporalChunks(answerString);

    return `
      <div class="pattern-card">
        <h5><i class="fa fa-clock"></i> Padrões Temporais</h5>
        <div class="temporal-analysis" style="
          display: grid;
          gap: 1rem;
          margin-top: 1.5rem;
        ">
          ${chunks
            .map((chunk, index) => {
              const percentage =
                chunk.validTotal > 0
                  ? (chunk.correct / chunk.validTotal) * 100
                  : 0;
              const color =
                percentage >= 70
                  ? "#10b981"
                  : percentage >= 50
                  ? "#f59e0b"
                  : "#ef4444";

              return `
              <div class="temporal-item" style="
                background: linear-gradient(135deg, ${color}15, ${color}08);
                border: 1px solid ${color}30;
                border-radius: 12px;
                padding: 1.5rem;
                transition: all 0.3s ease;
              " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px ${color}25'"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <div class="temporal-header" style="
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 1rem;
                ">
                  <h6 style="
                    color: var(--text-primary);
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                  ">${chunk.label}</h6>
                  <span style="
                    background: ${color};
                    color: white;
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                    font-weight: 600;
                  ">${percentage.toFixed(1)}%</span>
                </div>
                
                <div class="temporal-stats" style="
                  display: grid;
                  grid-template-columns: ${
                    chunk.cancelled > 0 ? "repeat(4, 1fr)" : "repeat(3, 1fr)"
                  };
                  gap: 1rem;
                  text-align: center;
                ">
                  <div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #10b981;">${
                      chunk.correct
                    }</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Corretas</div>
                  </div>
                  <div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #ef4444;">${
                      chunk.incorrect
                    }</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Incorretas</div>
                  </div>
                  ${
                    chunk.cancelled > 0
                      ? `
                  <div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #f59e0b;">${chunk.cancelled}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Anuladas</div>
                  </div>
                  `
                      : ""
                  }
                  <div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">${
                      chunk.total
                    }</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Total</div>
                  </div>
                </div>
                
                <div style="margin-top: 1rem;">
                  ${this.createProgressBar(percentage, color)}
                </div>
                
                ${
                  chunk.cancelled > 0
                    ? `
                <div style="
                  margin-top: 1rem;
                  padding: 0.75rem;
                  background: rgba(245, 158, 11, 0.1);
                  border: 1px solid rgba(245, 158, 11, 0.3);
                  border-radius: 8px;
                  font-size: 0.875rem;
                  color: var(--text-secondary);
                  text-align: center;
                ">
                  <i class="fa fa-info-circle" style="color: #f59e0b; margin-right: 0.5rem;"></i>
                  ${chunk.cancelled} questão${
                        chunk.cancelled === 1 ? "" : "ões"
                      } anulada${
                        chunk.cancelled === 1 ? "" : "s"
                      } neste intervalo
                </div>
                `
                    : ""
                }
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  getOptionColor(option) {
    const colors = {
      A: "#3b82f6", // Azul
      B: "#10b981", // Verde
      C: "#f59e0b", // Amarelo
      D: "#ef4444", // Vermelho
      E: "#8b5cf6", // Roxo
    };
    return colors[option] || "#6b7280";
  }

  generateFrequencyInsights(frequency, total) {
    const maxOption = Object.entries(frequency).reduce((a, b) =>
      frequency[a[0]] > frequency[b[0]] ? a : b
    );
    const minOption = Object.entries(frequency).reduce((a, b) =>
      frequency[a[0]] < frequency[b[0]] ? a : b
    );

    let insights = [];

    if (total > 0) {
      const maxPercentage = (maxOption[1] / total) * 100;
      const minPercentage = (minOption[1] / total) * 100;

      if (maxPercentage > 35) {
        insights.push(
          `• Você tem preferência pela alternativa <strong>${
            maxOption[0]
          }</strong> (${maxPercentage.toFixed(
            1
          )}%). Isso pode indicar um padrão de "chute".`
        );
      }

      if (minPercentage < 10 && total >= 10) {
        insights.push(
          `• A alternativa <strong>${
            minOption[0]
          }</strong> foi pouco escolhida (${minPercentage.toFixed(
            1
          )}%). Considere revisar se não está evitando alguma opção inconscientemente.`
        );
      }

      const distribution = Object.values(frequency);
      const isBalanced =
        Math.max(...distribution) - Math.min(...distribution) <=
        Math.ceil(total * 0.15);

      if (isBalanced && total >= 15) {
        insights.push(
          `• <strong>Distribuição equilibrada</strong> - Suas escolhas estão bem distribuídas entre as alternativas, indicando análise cuidadosa.`
        );
      }
    }

    return insights.length > 0
      ? insights.join("<br>")
      : "Complete mais questões para gerar insights detalhados.";
  }

  getTemporalChunks(answerString) {
    const chunkSize = 15; // Fixo em 15 questões por chunk
    const chunks = [];

    for (let i = 0; i < answerString.length; i += chunkSize) {
      const chunk = answerString.slice(i, i + chunkSize);
      const correct = (chunk.match(/1/g) || []).length;
      const incorrect = (chunk.match(/0/g) || []).length;
      const cancelled = (chunk.match(/C/g) || []).length;
      const total = correct + incorrect + cancelled;

      chunks.push({
        label: `Questões ${i + 1}-${Math.min(
          i + chunkSize,
          answerString.length
        )}`,
        correct,
        incorrect,
        cancelled,
        total,
        validTotal: correct + incorrect, // Total válido (excluindo anuladas)
      });
    }

    return chunks;
  }

  renderTRIConsistencyAnalysis(questions, answers) {
    const config = this.app.getCurrentConfig();
    const meta = this.app.getMeta();

    // Obter notas TRI calculadas do app
    const triResult = this.app.getTRIScores();

    if (!triResult || !triResult.success || !triResult.score) {
      return `
        <div class="pattern-card">
          <h5><i class="fa fa-chart-area"></i> Análise de Consistência TRI</h5>
          <div class="consistency-area">
            <p>Notas TRI não disponíveis. Calcule as notas primeiro para ver a análise de consistência.</p>
          </div>
        </div>
      `;
    }

    // Analisar inconsistências para a área do simulado
    const area = triResult.areaCode;
    const areaQuestions = questions.filter((q) => q.area === area);

    if (areaQuestions.length === 0) {
      return `
        <div class="pattern-card">
          <h5><i class="fa fa-chart-area"></i> Análise de Consistência TRI</h5>
          <div class="consistency-area">
            <p>Nenhuma questão encontrada para análise de consistência.</p>
          </div>
        </div>
      `;
    }

    const userScore = triResult.score;
    const userTheta = (userScore - 500) / 100; // Converter nota para parâmetro θ (theta)

    const inconsistencies = this.analyzeAreaInconsistencies(
      areaQuestions,
      answers,
      userTheta,
      meta,
      config
    );

    let html = `
      <div class="pattern-card">
        ${this.renderEnhancedTRIConsistency(area, inconsistencies, userScore)}
      </div>
    `;

    return html;
  }

  analyzeAreaInconsistencies(questions, answers, userTheta, meta, config) {
    const inconsistentItems = [];
    let totalAnalyzed = 0;
    let totalInconsistent = 0;

    questions.forEach((question, index) => {
      // Pular questões anuladas
      if (question.cancelled) return;

      // Verificar se há metadados disponíveis
      if (
        !meta[config.year] ||
        !meta[config.year][question.area] ||
        !meta[config.year][question.area][question.originalPosition]
      ) {
        return;
      }

      const questionMeta =
        meta[config.year][question.area][question.originalPosition];
      const difficulty = questionMeta.difficulty;
      const discrimination = questionMeta.discrimination;

      // Usar a função helper para obter casual hit
      const casualHitDecimal = this.getCasualHit(meta, config, question);

      if (difficulty === null || discrimination === null) return;

      // Calcular probabilidade de acerto usando modelo 3PL da TRI
      // P(θ) = c + (1 - c) / (1 + exp(-a * (θ - b)))
      // onde: c = casual_hit, a = discrimination, θ = ability (userTheta), b = difficulty
      const c = casualHitDecimal !== null ? casualHitDecimal : 0.2;
      const a = discrimination;
      const theta = userTheta;
      const b = difficulty;
      const probability = c + (1 - c) / (1 + Math.exp(-a * (theta - b)));

      const userAnswer = answers[question.position];
      const correctAnswer =
        this.app.questionGenerator.getCorrectAnswer(question);
      const isCorrect = userAnswer === correctAnswer;

      totalAnalyzed++;

      // Considerar inconsistente se:
      // 1. Probabilidade alta (>70%) mas errou
      // 2. Probabilidade baixa (<30%) mas acertou
      if (
        (probability > 0.7 && !isCorrect) ||
        (probability < 0.3 && isCorrect)
      ) {
        totalInconsistent++;
        inconsistentItems.push({
          questionNumber: question.position, // Usar posição real na prova
          originalPosition: question.originalPosition,
          probability: probability * 100,
          isCorrect: isCorrect,
          expectedResult: probability > 0.5 ? "acerto" : "erro",
          actualResult: isCorrect ? "acerto" : "erro",
          severity: Math.abs(probability - (isCorrect ? 1 : 0)),
          difficulty: difficulty,
          discrimination: discrimination,
          casualHit: c, // Adicionar casual_hit para debug/análise
        });
      }
    });

    // Ordenar por severidade (maior inconsistência primeiro)
    inconsistentItems.sort((a, b) => b.severity - a.severity);

    return {
      items: inconsistentItems.slice(0, 10), // Top 10 inconsistências
      totalAnalyzed: totalAnalyzed,
      totalInconsistent: totalInconsistent,
      consistencyRate:
        totalAnalyzed > 0
          ? ((totalAnalyzed - totalInconsistent) / totalAnalyzed) * 100
          : 0,
    };
  }

  renderAreaConsistency(area, analysis, userScore) {
    const areaNames = {
      LC0: "Linguagens (Inglês)",
      LC1: "Linguagens (Espanhol)",
      CH: "Ciências Humanas",
      CN: "Ciências da Natureza",
      MT: "Matemática",
    };

    const consistencyLevel =
      analysis.consistencyRate >= 80
        ? "alta"
        : analysis.consistencyRate >= 60
        ? "média"
        : "baixa";

    const consistencyColor =
      analysis.consistencyRate >= 80
        ? "#10b981"
        : analysis.consistencyRate >= 60
        ? "#f59e0b"
        : "#ef4444";

    let html = `
      <div class="consistency-area" style="
        background: linear-gradient(135deg, var(--bg-secondary), var(--bg-tertiary));
        border-radius: 12px;
        padding: 2rem;
        border: 1px solid var(--border-accent);
      ">
        <div class="area-header" style="
          display: flex;
          align-items: center;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid var(--border);
        ">
          <div class="area-icon" style="
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary)dd);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 1rem;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
          ">
            <i class="fa fa-chart-bar" style="
              color: white;
              font-size: 1.25rem;
            "></i>
          </div>
          <div>
            <h6 style="
              margin: 0 0 0.25rem 0;
              font-size: 1.3rem;
              font-weight: 600;
              color: var(--text-primary);
            ">${areaNames[area] || area}</h6>
            <div style="
              font-size: 0.9rem;
              color: var(--text-muted);
            ">Análise de Consistência TRI</div>
          </div>
        </div>
        
        <div class="consistency-stats" style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        ">
          <div class="stat-card" style="
            text-align: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05));
            border: 1px solid rgba(99, 102, 241, 0.3);
            border-radius: 12px;
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.transform='translateY(0)'">
            <div style="
              font-size: 2rem;
              font-weight: 700;
              color: var(--primary);
              margin-bottom: 0.5rem;
            ">${Math.round(userScore)}</div>
            <div style="
              font-size: 0.9rem;
              color: var(--text-secondary);
              font-weight: 500;
            ">Nota TRI</div>
          </div>
          
          <div class="stat-card" style="
            text-align: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, rgba(${parseInt(
              consistencyColor.slice(1, 3),
              16
            )}, ${parseInt(consistencyColor.slice(3, 5), 16)}, ${parseInt(
      consistencyColor.slice(5, 7),
      16
    )}, 0.1), rgba(${parseInt(consistencyColor.slice(1, 3), 16)}, ${parseInt(
      consistencyColor.slice(3, 5),
      16
    )}, ${parseInt(consistencyColor.slice(5, 7), 16)}, 0.05));
            border: 1px solid rgba(${parseInt(
              consistencyColor.slice(1, 3),
              16
            )}, ${parseInt(consistencyColor.slice(3, 5), 16)}, ${parseInt(
      consistencyColor.slice(5, 7),
      16
    )}, 0.3);
            border-radius: 12px;
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.transform='translateY(0)'">
            <div style="
              font-size: 2rem;
              font-weight: 700;
              color: ${consistencyColor};
              margin-bottom: 0.5rem;
            ">${analysis.consistencyRate.toFixed(1)}%</div>
            <div style="
              font-size: 0.9rem;
              color: var(--text-secondary);
              font-weight: 500;
            ">Consistência</div>
          </div>
          
          <div class="stat-card" style="
            text-align: center;
            padding: 1.5rem;
            background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(6, 182, 212, 0.05));
            border: 1px solid rgba(6, 182, 212, 0.3);
            border-radius: 12px;
            transition: all 0.3s ease;
          " onmouseover="this.style.transform='translateY(-2px)'" 
             onmouseout="this.style.transform='translateY(0)'">
            <div style="
              font-size: 2rem;
              font-weight: 700;
              color: #06b6d4;
              margin-bottom: 0.5rem;
            ">${analysis.totalAnalyzed}</div>
            <div style="
              font-size: 0.9rem;
              color: var(--text-secondary);
              font-weight: 500;
            ">Questões Analisadas</div>
          </div>
        </div>

        ${this.createConsistencyProgressBar(
          analysis.consistencyRate,
          consistencyColor
        )}

        ${
          analysis.items.length > 0
            ? this.renderInconsistencyList(analysis.items)
            : this.renderNoInconsistencies()
        }

        <div class="tri-insights" style="
          margin-top: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%);
          border-radius: 12px;
          border-left: 4px solid ${consistencyColor};
        ">
          <div style="
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
          ">
            <i class="fa fa-lightbulb" style="
              font-size: 1.25rem;
              color: ${consistencyColor};
              margin-right: 0.75rem;
            "></i>
            <strong style="
              color: var(--text-primary);
              font-size: 1.1rem;
            ">Interpretação</strong>
          </div>
          <div style="
            color: var(--text-secondary);
            line-height: 1.6;
            font-size: 0.9375rem;
          ">
            ${this.getConsistencyDescription(
              analysis.consistencyRate,
              analysis.totalInconsistent
            )}
          </div>
        </div>
      </div>
    `;
  }

  createConsistencyProgressBar(percentage, color) {
    return `
      <div class="consistency-progress" style="
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--bg-tertiary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        ">
          <span style="
            font-weight: 600;
            color: var(--text-primary);
            font-size: 1rem;
          ">Nível de Consistência</span>
          <span style="
            font-weight: 700;
            color: ${color};
            font-size: 1.1rem;
          ">${percentage.toFixed(1)}%</span>
        </div>
        
        <div class="progress-track" style="
          height: 12px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        ">
          <div class="progress-fill" style="
            background: linear-gradient(90deg, ${color}, ${color}cc);
            height: 100%;
            width: ${Math.min(percentage, 100)}%;
            border-radius: 6px;
            transition: width 2s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          ">
            <div class="progress-shine" style="
              position: absolute;
              top: 0;
              left: -100%;
              width: 100%;
              height: 100%;
              background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
              animation: shine 2s infinite;
            "></div>
          </div>
          
          <!-- Marcadores de nível -->
          <div class="level-markers" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            pointer-events: none;
          ">
            <div style="width: 2px; height: 100%; background: rgba(255,255,255,0.3); margin-left: 60%;"></div>
            <div style="width: 2px; height: 100%; background: rgba(255,255,255,0.3); margin-left: 80%;"></div>
          </div>
        </div>
        
        <div class="progress-labels" style="
          display: flex;
          justify-content: space-between;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        ">
          <span>Baixa</span>
          <span>Média</span>
          <span>Alta</span>
        </div>
      </div>
    `;
  }

  renderInconsistencyList(items) {
    return `
      <div class="inconsistency-section" style="
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--bg-tertiary);
        border-radius: 12px;
        border: 1px solid var(--border-color);
      ">
        <div style="
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
        ">
          <i class="fa fa-exclamation-triangle" style="
            font-size: 1.25rem;
            color: var(--warning-color);
            margin-right: 0.75rem;
          "></i>
          <h6 style="
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
          ">Principais Inconsistências</h6>
        </div>
        
        <div class="inconsistency-grid" style="
          display: grid;
          gap: 1rem;
        ">
          ${items
            .slice(0, 5)
            .map(
              (item, index) => `
            <div class="inconsistency-item" style="
              display: flex;
              align-items: center;
              padding: 1rem;
              background: var(--bg-secondary);
              border: 1px solid var(--border-color);
              border-radius: 8px;
              border-left: 4px solid ${item.isCorrect ? "#10b981" : "#ef4444"};
              transition: all 0.3s ease;
            " onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'" 
               onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
              
              <div class="question-number" style="
                background: ${item.isCorrect ? "#10b981" : "#ef4444"};
                color: white;
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                margin-right: 1rem;
                font-size: 0.875rem;
              ">Q${item.questionNumber}</div>
              
              <div class="inconsistency-details" style="flex: 1;">
                <div style="
                  font-weight: 600;
                  color: var(--text-primary);
                  margin-bottom: 0.25rem;
                  font-size: 0.9375rem;
                ">
                  ${
                    item.probability > 70 && !item.isCorrect
                      ? "🎯 Erro inesperado - Alta probabilidade de acerto"
                      : "🍀 Acerto improvável - Baixa probabilidade"
                  }
                </div>
                <div style="
                  font-size: 0.8125rem;
                  color: var(--text-secondary);
                ">
                  Probabilidade: ${item.probability.toFixed(1)}% • 
                  Resultado: ${item.isCorrect ? "Acertou" : "Errou"}
                </div>
              </div>
              
              <div class="severity-indicator" style="
                background: ${
                  item.severity > 0.7
                    ? "#ef4444"
                    : item.severity > 0.4
                    ? "#f59e0b"
                    : "#10b981"
                };
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">
                ${
                  item.severity > 0.7
                    ? "Alta"
                    : item.severity > 0.4
                    ? "Média"
                    : "Baixa"
                }
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
  }

  renderNoInconsistencies() {
    return `
      <div class="no-inconsistencies" style="
        text-align: center;
        padding: 2rem;
        background: linear-gradient(135deg, #f0f9f0 0%, #e8f5e8 100%);
        border-radius: 12px;
        border: 1px solid #d4edda;
        margin-bottom: 2rem;
      ">
        <i class="fa fa-check-circle" style="
          font-size: 3rem;
          color: #10b981;
          margin-bottom: 1rem;
        "></i>
        <div style="
          font-size: 1.25rem;
          font-weight: 600;
          color: #155724;
          margin-bottom: 0.5rem;
        ">Excelente Consistência!</div>
        <div style="
          font-size: 0.9375rem;
          color: #155724;
          opacity: 0.8;
        ">Nenhuma inconsistência significativa detectada em suas respostas.</div>
      </div>
    `;
  }

  // Função auxiliar para gerar gradientes baseados na performance
  getPerformanceGradient(percentage) {
    if (percentage >= 80) {
      return "linear-gradient(135deg, #10b981 0%, #059669 100%)"; // Verde
    } else if (percentage >= 60) {
      return "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"; // Azul
    } else if (percentage >= 40) {
      return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"; // Amarelo
    } else {
      return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"; // Vermelho
    }
  }

  // Função auxiliar para gerar ícones baseados na performance
  getPerformanceIcon(percentage) {
    if (percentage >= 80) {
      return { icon: "fa-star", color: "#10b981" };
    } else if (percentage >= 60) {
      return { icon: "fa-thumbs-up", color: "#3b82f6" };
    } else if (percentage >= 40) {
      return { icon: "fa-meh", color: "#f59e0b" };
    } else {
      return { icon: "fa-thumbs-down", color: "#ef4444" };
    }
  }

  // Função auxiliar para gerar badges visuais
  createBadge(text, type = "primary") {
    const badges = {
      success: { bg: "#d4edda", border: "#28a745", text: "#155724" },
      danger: { bg: "#f8d7da", border: "#dc3545", text: "#721c24" },
      warning: { bg: "#fff3cd", border: "#ffc107", text: "#856404" },
      info: { bg: "#d1ecf1", border: "#17a2b8", text: "#0c5460" },
      primary: { bg: "#cce7ff", border: "#007bff", text: "#004085" },
    };

    const style = badges[type] || badges.primary;

    return `
      <span class="custom-badge" style="
        background: ${style.bg};
        color: ${style.text};
        border: 1px solid ${style.border};
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: inline-flex;
        align-items: center;
        box-shadow: 0 2px 4px ${style.border}30;
      ">${text}</span>
    `;
  }

  // Função auxiliar para criar animações de progresso
  createProgressBar(percentage, color = "#3b82f6", height = "8px") {
    return `
      <div class="progress-container" style="
        background: rgba(0, 0, 0, 0.1);
        height: ${height};
        border-radius: ${parseInt(height) / 2}px;
        overflow: hidden;
        position: relative;
      ">
        <div class="progress-fill" style="
          background: linear-gradient(90deg, ${color}, ${color}cc);
          height: 100%;
          width: ${Math.min(percentage, 100)}%;
          border-radius: ${parseInt(height) / 2}px;
          transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        ">
          <div class="progress-shine" style="
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
            animation: shine 2s infinite;
          "></div>
        </div>
      </div>
      
      <style>
        @keyframes shine {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
      </style>
    `;
  }
}
