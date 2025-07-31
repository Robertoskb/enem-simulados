import { BaseTabRenderer } from "./BaseTabRenderer.js";

export class DifficultyTabRenderer extends BaseTabRenderer {
  constructor(app) {
    super(app);
  }

  render() {
    const container = document.getElementById("difficulty-container");
    if (!container) return;

    const questions = this.app.getQuestions();
    const answers = this.app.getAnswers();
    const meta = this.app.getMeta();
    const config = this.app.getCurrentConfig();

    // Analisar questões por dificuldade
    const difficultyData = this.analyzeDifficultyData(
      questions,
      answers,
      meta,
      config
    );

    const areaNames = {
      LC0: "Linguagens (Inglês)",
      LC1: "Linguagens (Espanhol)",
      CH: "Ciências Humanas",
      CN: "Ciências da Natureza",
      MT: "Matemática",
    };

    // Obter áreas disponíveis
    const availableAreas = [
      ...new Set(difficultyData.questions.map((q) => q.area)),
    ];

    let html = `
      <div class="difficulty-analysis">
        <h4><i class="fa fa-signal"></i> Análise por Dificuldade</h4>
    `;

    // Se há múltiplas áreas, adicionar sub-navegação por área
    if (availableAreas.length > 1) {
      html += `
        <div class="difficulty-sub-nav">
          <button class="difficulty-filter-btn active" data-area="all">
            <i class="fa fa-chart-bar"></i> Todas as Áreas
          </button>
          ${availableAreas
            .map(
              (area) => `
            <button class="difficulty-filter-btn" data-area="${area}">
              <i class="fa fa-layer-group"></i> ${areaNames[area] || area}
            </button>
          `
            )
            .join("")}
        </div>
      `;
    }

    html += '<div class="difficulty-content">';

    // Visão geral (todas as áreas)
    html += '<div class="difficulty-view" data-difficulty-view="all">';
    html += this.renderDifficultyStats(difficultyData);
    html += this.renderDifficultyPattern(difficultyData);
    html += this.renderDifficultyTable(difficultyData);
    html += "</div>";

    // Visões por área
    if (availableAreas.length > 1) {
      availableAreas.forEach((area) => {
        const areaQuestions = difficultyData.questions.filter(
          (q) => q.area === area
        );
        const areaData = {
          questions: areaQuestions,
          hasDifficultyData: difficultyData.hasDifficultyData,
        };

        html += `
          <div class="difficulty-view" data-difficulty-view="${area}" style="display: none;">
            <div class="level-detailed-view">
              <div class="level-header">
                <h4><i class="fa fa-layer-group"></i> ${
                  areaNames[area] || area
                }</h4>
                <div class="level-summary">
                  <span class="summary-item">
                    <strong>${
                      areaQuestions.filter((q) => q.isCorrect).length
                    }/${areaQuestions.length}</strong> questões corretas
                  </span>
                  <span class="summary-item">
                    <strong>${Math.round(
                      (areaQuestions.filter((q) => q.isCorrect).length /
                        areaQuestions.length) *
                        100
                    )}%</strong> de aproveitamento
                  </span>
                </div>
              </div>
              ${this.renderDifficultyStats(areaData)}
              ${this.renderDifficultyPattern(areaData)}
              ${this.renderDifficultyTable(areaData)}
            </div>
          </div>
        `;
      });
    }

    html += "</div>";
    html += "</div>";

    container.innerHTML = html;

    // Configurar filtros se necessário
    if (availableAreas.length > 1) {
      this.setupDifficultyFilters();
    }
  }

  analyzeDifficultyData(questions, answers, meta, config) {
    const questionsWithDifficulty = [];
    let hasDifficultyData = false;

    questions.forEach((question, examIndex) => {
      const userAnswer = answers[question.position];
      const correctAnswer =
        this.app.questionGenerator.getCorrectAnswer(question);

      // Determinar se a resposta está correta
      let isCorrect = false;
      if (question.cancelled) {
        // Para questões anuladas, considera correto se o usuário respondeu
        isCorrect = userAnswer !== undefined && userAnswer !== null;
      } else {
        // Para questões não anuladas, compara com o gabarito
        isCorrect = userAnswer === correctAnswer;
      }

      let difficulty = null;
      let difficultyLevel = "Desconhecida";

      // CORREÇÃO: Questões anuladas não devem ter dados de dificuldade
      if (question.cancelled) {
        difficultyLevel = "Anulada";
      } else {
        // Tentar obter dificuldade dos metadados apenas para questões válidas
        // Usar originalPosition (posição na prova azul) para buscar no meta.json
        const metaPosition = question.originalPosition;
        if (
          metaPosition &&
          meta[config.year] &&
          meta[config.year][question.area] &&
          meta[config.year][question.area][metaPosition]
        ) {
          const metaData = meta[config.year][question.area][metaPosition];

          // Calcular dificuldade usando parâmetros da TRI: 100*B + 500
          if (
            metaData.difficulty !== null &&
            metaData.difficulty !== undefined
          ) {
            difficulty = 100 * metaData.difficulty + 500;
            hasDifficultyData = true;

            // Classificar por nível baseado na escala TRI (seguindo padrão do app.js)
            if (difficulty < 550.0) difficultyLevel = "Muito fácil";
            else if (difficulty < 650.0) difficultyLevel = "Fácil";
            else if (difficulty < 750.0) difficultyLevel = "Média";
            else if (difficulty < 850.0) difficultyLevel = "Difícil";
            else difficultyLevel = "Muito difícil";
          }
        }
      }

      // Se não há dados de dificuldade, usar posição na prova como aproximação
      if (!hasDifficultyData) {
        const totalQuestions = questions.length;
        const position = examIndex + 1;

        difficultyLevel = "N/A";
      }

      questionsWithDifficulty.push({
        questionNumber: question.position, // Usar posição real da prova
        originalPosition: question.originalPosition,
        area: question.area,
        difficulty: difficulty,
        difficultyLevel: difficultyLevel,
        isCorrect: isCorrect,
        cancelled: question.cancelled,
        userAnswer: userAnswer || "-",
        correctAnswer: correctAnswer,
      });
    });

    return {
      questions: questionsWithDifficulty,
      hasDifficultyData: hasDifficultyData,
    };
  }

  renderDifficultyStats(difficultyData) {
    const { questions, hasDifficultyData } = difficultyData;

    // Agrupar por nível de dificuldade
    const groups = {};
    questions.forEach((q) => {
      if (!groups[q.difficultyLevel]) {
        groups[q.difficultyLevel] = { total: 0, correct: 0 };
      }
      groups[q.difficultyLevel].total++;
      if (q.isCorrect) groups[q.difficultyLevel].correct++;
    });

    let html = `
      <div class="difficulty-stats-grid">
        <h5>
          <i class="fa fa-chart-line"></i>
          ${
            hasDifficultyData
              ? "Desempenho por Nível de Dificuldade"
              : "Desempenho por Posição na Prova"
          }
        </h5>
        <div class="stats-cards">
    `;

    // Definir ordem correta dos níveis de dificuldade
    const difficultyOrder = hasDifficultyData
      ? ["Muito fácil", "Fácil", "Média", "Difícil", "Muito difícil", "Anulada"]
      : ["Início da Prova", "Meio da Prova", "Fim da Prova", "Anulada"];

    // Ordenar grupos pela ordem correta
    const sortedGroups = difficultyOrder
      .filter((level) => groups[level]) // Apenas incluir níveis que existem nos dados
      .map((level) => [level, groups[level]]);

    sortedGroups.forEach(([level, data]) => {
      const percentage = Math.round((data.correct / data.total) * 100);

      // Determinar ícone baseado no nível
      let iconClass = "fa-chart-bar";
      let shortLevel = level; // Versão abreviada para evitar quebra

      if (hasDifficultyData || level === "Anulada") {
        if (level === "Muito fácil") {
          iconClass = "fa-smile";
          shortLevel = "M. Fácil";
        } else if (level === "Fácil") {
          iconClass = "fa-check-circle";
          shortLevel = "Fácil";
        } else if (level === "Média") {
          iconClass = "fa-minus-circle";
          shortLevel = "Média";
        } else if (level === "Difícil") {
          iconClass = "fa-exclamation-triangle";
          shortLevel = "Difícil";
        } else if (level === "Muito difícil") {
          iconClass = "fa-times-circle";
          shortLevel = "M. Difícil";
        } else if (level === "Anulada") {
          iconClass = "fa-ban";
          shortLevel = "Anulada";
        }
      }

      html += `
        <div class="difficulty-stat-card">
          <h6><i class="fa ${iconClass}"></i> ${shortLevel}</h6>
          <div class="stat-content">
            <div class="stat-number">${
              level === "Anulada" ? data.total : `${data.correct}/${data.total}`
            }</div>
            <div class="stat-percentage">${
              level === "Anulada" ? "questões" : `${percentage}%`
            }</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  renderDifficultyPattern(difficultyData) {
    const { questions, hasDifficultyData } = difficultyData;

    // Separar questões anuladas das questões válidas
    const validQuestions = questions.filter((q) => !q.cancelled);
    const cancelledQuestions = questions.filter((q) => q.cancelled);

    // Ordenar questões válidas por dificuldade
    let sortedValidQuestions;
    if (hasDifficultyData) {
      sortedValidQuestions = [...validQuestions].sort((a, b) => {
        if (a.difficulty !== null && b.difficulty !== null) {
          return a.difficulty - b.difficulty;
        }
        if (a.difficulty !== null) return -1;
        if (b.difficulty !== null) return 1;
        return a.originalPosition - b.originalPosition;
      });
    } else {
      // Se não há dados de dificuldade, manter ordem da prova
      sortedValidQuestions = validQuestions;
    }

    // Questões anuladas ficam por último, ordenadas por posição
    const sortedCancelledQuestions = [...cancelledQuestions].sort(
      (a, b) => a.originalPosition - b.originalPosition
    );

    // Combinar questões válidas + anuladas
    const sortedQuestions = [
      ...sortedValidQuestions,
      ...sortedCancelledQuestions,
    ];

    const pattern = sortedQuestions
      .map((q) => {
        if (q.cancelled) return "C"; // C para cancelled (anulada)
        return q.isCorrect ? "1" : "0";
      })
      .join("");

    return `
      <div class="difficulty-pattern">
        <h5>
          <i class="fa fa-sort-amount-up"></i>
          ${
            hasDifficultyData
              ? "Padrão Ordenado por Dificuldade (Fácil → Difícil)"
              : "Padrão na Ordem da Prova"
          }
        </h5>
        <div class="pattern-string">
          ${pattern
            .split("")
            .map(
              (bit, index) =>
                `<span class="bit bit-${bit}" title="${
                  bit === "1" ? "Acerto" : bit === "0" ? "Erro" : "Anulada"
                }" data-position="${index + 1}"></span>`
            )
            .join("")}
        </div>
        <small>
          <i class="fa fa-info-circle"></i>
          ${
            hasDifficultyData
              ? "Questões ordenadas da mais fácil para a mais difícil com base nos metadados TRI"
              : "Padrão na ordem que as questões apareceram na prova"
          }
          <br><br>
          <strong>Legenda:</strong> 
          <span class="bit bit-1" style="display: inline-block; margin: 0 4px; width: 12px; height: 12px; border-radius: 50%;"></span> <strong>Verde</strong> = Acerto |
          <span class="bit bit-0" style="display: inline-block; margin: 0 4px; width: 12px; height: 12px; border-radius: 50%;"></span> <strong>Vermelho</strong> = Erro |
          <span class="bit bit-C" style="display: inline-block; margin: 0 4px; width: 12px; height: 12px; border-radius: 50%;"></span> <strong>Cinza</strong> = Anulada
        </small>
      </div>
    `;
  }

  renderDifficultyTable(difficultyData) {
    const { questions, hasDifficultyData } = difficultyData;

    // Separar questões anuladas das questões válidas
    const validQuestions = questions.filter((q) => !q.cancelled);
    const cancelledQuestions = questions.filter((q) => q.cancelled);

    // Ordenar questões válidas por dificuldade para exibir na tabela
    let sortedValidQuestions;
    if (hasDifficultyData) {
      sortedValidQuestions = [...validQuestions].sort((a, b) => {
        if (a.difficulty !== null && b.difficulty !== null) {
          return a.difficulty - b.difficulty; // Ordem crescente (mais fácil primeiro)
        }
        if (a.difficulty !== null) return -1;
        if (b.difficulty !== null) return 1;
        return a.originalPosition - b.originalPosition;
      });
    } else {
      // Se não há dados de dificuldade, manter ordem da prova
      sortedValidQuestions = validQuestions;
    }

    // Questões anuladas ficam por último, ordenadas por posição
    const sortedCancelledQuestions = [...cancelledQuestions].sort(
      (a, b) => a.originalPosition - b.originalPosition
    );

    // Combinar questões válidas + anuladas
    const sortedQuestions = [
      ...sortedValidQuestions,
      ...sortedCancelledQuestions,
    ];

    let html = `
      <div class="difficulty-table">
        <h5>
          <i class="fa fa-table"></i>
          Detalhamento das Questões ${
            hasDifficultyData ? "(Ordenadas por Dificuldade)" : ""
          }
        </h5>
        <div class="table-responsive">
          <table class="difficulty-questions-table">
            <thead>
              <tr>
                <th><i class="fa fa-hashtag"></i> Questão</th>
                <th><i class="fa fa-signal"></i> ${
                  hasDifficultyData ? "Dificuldade (TRI)" : "Posição"
                }</th>
                <th><i class="fa fa-layer-group"></i> Nível</th>
                <th><i class="fa fa-user-edit"></i> Sua Resposta</th>
                <th><i class="fa fa-check-circle"></i> Gabarito</th>
                <th><i class="fa fa-flag"></i> Status</th>
              </tr>
            </thead>
            <tbody>
    `;

    sortedQuestions.forEach((question) => {
      const statusClass = question.cancelled
        ? "answer-cancelled"
        : question.isCorrect
        ? "answer-correct"
        : "answer-wrong";

      const status = question.cancelled
        ? "Anulada"
        : question.isCorrect
        ? "Correto"
        : "Incorreto";

      const statusIcon = question.cancelled
        ? "fa-ban"
        : question.isCorrect
        ? "fa-check"
        : "fa-times";

      html += `
        <tr class="${statusClass}">
          <td><strong>${question.questionNumber}</strong></td>
          <td>
            ${
              question.cancelled
                ? "<span class='text-muted'>N/A</span>"
                : hasDifficultyData
                ? question.difficulty !== null
                  ? `<span class="difficulty-score">${Math.round(
                      question.difficulty
                    )}</span>`
                  : "<span class='text-muted'>N/A</span>"
                : question.difficultyLevel
            }
          </td>
          <td>
            <span class="difficulty-level-badge level-${question.difficultyLevel
              .toLowerCase()
              .replace(/\s+/g, "-")}">
              ${question.difficultyLevel}
            </span>
          </td>
          <td><span class="answer-badge">${question.userAnswer}</span></td>
          <td><span class="answer-badge correct-answer">${
            question.correctAnswer
          }</span></td>
          <td>
            <span class="status-badge status-${statusClass}">
              <i class="fa ${statusIcon}"></i> ${status}
            </span>
          </td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
        ${
          hasDifficultyData
            ? `
          <div class="difficulty-legend">
            <i class="fa fa-info-circle"></i>
            <strong>Escala TRI de Dificuldade:</strong>
            <span class="difficulty-range very-easy">Muito fácil (&lt;550)</span>
            <span class="difficulty-range easy">Fácil (550-649)</span>
            <span class="difficulty-range medium">Média (650-749)</span>
            <span class="difficulty-range hard">Difícil (750-849)</span>
            <span class="difficulty-range very-hard">Muito difícil (≥850)</span>
          </div>
        `
            : ""
        }
      </div>
    `;

    return html;
  }

  setupDifficultyFilters() {
    const filterButtons = document.querySelectorAll(".difficulty-filter-btn");
    const difficultyViews = document.querySelectorAll(".difficulty-view");

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetArea = button.dataset.area;

        // Remover active de todos os botões
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        // Mostrar/esconder views apropriadas
        difficultyViews.forEach((view) => {
          const viewArea = view.dataset.difficultyView;
          if (viewArea === targetArea) {
            view.style.display = "block";
          } else {
            view.style.display = "none";
          }
        });
      });
    });
  }
}
