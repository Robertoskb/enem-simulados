import { BaseTabRenderer } from "./BaseTabRenderer.js";

export class PatternsTabRenderer extends BaseTabRenderer {
  constructor(app) {
    super(app);
  }

  render() {
    const container = document.getElementById("patterns-container");
    if (!container) return;

    const questions = this.app.getQuestions();
    const answers = this.app.getAnswers();
    const config = this.app.getCurrentConfig();
    const triResult = this.app.getTRIScores();

    // Verificar se há dados TRI disponíveis
    if (!triResult || !triResult.success || !triResult.score) {
      container.innerHTML = `
        <div class="consistency-analysis">
          <h4><i class="fa fa-balance-scale"></i> Análise de Consistência TRI</h4>
          <div class="tri-error-info">
            <i class="fa fa-exclamation-triangle"></i>
            <p>Análise de consistência TRI não disponível. É necessário que a nota TRI seja calculada com sucesso para realizar esta análise.</p>
          </div>
        </div>
      `;
      return;
    }

    // Analisar consistência TRI
    const consistencyData = this.analyzeConsistencyData(
      questions,
      answers,
      config,
      triResult
    );

    let html = `
      <div class="consistency-analysis">
        <h4><i class="fa fa-balance-scale"></i> Análise de Consistência TRI</h4>
        ${this.renderConsistencyTable(consistencyData, triResult)}
      </div>
    `;

    container.innerHTML = html;
  }

  /**
   * Analisa a consistência das respostas baseada na TRI
   */
  analyzeConsistencyData(questions, answers, config, triResult) {
    const questionsWithConsistency = [];
    const meta = this.app.getMeta();

    // Converter nota TRI para theta: θ = (nota - 500) / 100
    const theta = (triResult.score - 500) / 100;

    questions.forEach((question) => {
      const userAnswer = answers[question.position];
      const correctAnswer =
        this.app.questionGenerator.getCorrectAnswer(question);
      const isCorrect = userAnswer === correctAnswer;

      // Buscar parâmetros TRI no meta.json
      let triParams = null;
      if (
        meta[config.year] &&
        meta[config.year][question.area] &&
        meta[config.year][question.area][question.originalPosition]
      ) {
        const questionMeta =
          meta[config.year][question.area][question.originalPosition];
        triParams = {
          a: questionMeta.discrimination, // discriminação
          b: questionMeta.difficulty, // dificuldade
          c: questionMeta["casual hit"] / 100, // acerto casual (converter % para decimal)
        };
      }

      let probability = null;
      let consistency = null;
      let consistencyType = "unknown";

      if (
        triParams &&
        triParams.a &&
        triParams.b !== null &&
        triParams.c !== null
      ) {
        // Calcular probabilidade usando modelo 3PL: P(θ) = c + (1-c) * e^(a(θ-b)) / (1 + e^(a(θ-b)))
        const exponent = triParams.a * (theta - triParams.b);
        const exponential = Math.exp(exponent);
        probability =
          triParams.c + (1 - triParams.c) * (exponential / (1 + exponential));

        // Calcular inconsistência
        if (isCorrect) {
          // Acerto: quanto menor a probabilidade, mais inconsistente (surpreendente)
          consistency = 1 - probability;
          consistencyType =
            probability < 0.5 ? "unexpected_correct" : "expected_correct";
        } else {
          // Erro: quanto maior a probabilidade, mais inconsistente (surpreendente)
          consistency = probability;
          consistencyType =
            probability > 0.5 ? "unexpected_wrong" : "expected_wrong";
        }
      }

      questionsWithConsistency.push({
        questionNumber: question.position,
        originalPosition: question.originalPosition,
        area: question.area,
        isCorrect: isCorrect,
        cancelled: question.cancelled,
        userAnswer: userAnswer || "-",
        correctAnswer: correctAnswer,
        triParams: triParams,
        probability: probability,
        consistency: consistency,
        consistencyType: consistencyType,
      });
    });

    // Ordenar por inconsistência (mais inconsistente primeiro)
    questionsWithConsistency.sort((a, b) => {
      if (a.consistency === null && b.consistency === null) return 0;
      if (a.consistency === null) return 1;
      if (b.consistency === null) return -1;
      return b.consistency - a.consistency;
    });

    return {
      questions: questionsWithConsistency,
      theta: theta,
      totalQuestions: questionsWithConsistency.length,
      questionsWithTRI: questionsWithConsistency.filter(
        (q) => q.triParams !== null
      ).length,
    };
  }

  /**
   * Renderiza a tabela de consistência TRI
   */
  renderConsistencyTable(consistencyData, triResult) {
    const { questions, theta, questionsWithTRI } = consistencyData;

    // Filtrar apenas questões com dados TRI válidos
    const questionsWithValidTRI = questions.filter(
      (q) => q.triParams !== null && q.consistency !== null
    );

    if (questionsWithValidTRI.length === 0) {
      return `
        <div class="tri-error-info">
          <i class="fa fa-exclamation-triangle"></i>
          <p>Não há questões com parâmetros TRI disponíveis para análise de consistência.</p>
        </div>
      `;
    }

    return `
      <div class="consistency-info">
        <div class="consistency-header">
          <div class="theta-info">
            <span class="label">Theta (θ) do candidato:</span>
            <span class="value">${theta.toFixed(3)}</span>
            <small>(Nota TRI: ${triResult.score.toFixed(1)})</small>
          </div>
          <div class="summary-info">
            <span>${questionsWithValidTRI.length} de ${
      questions.length
    } questões com dados TRI</span>
          </div>
        </div>
        
        <div class="consistency-explanation">
          <h5><i class="fa fa-info-circle"></i> Como interpretar</h5>
          <ul>
            <li><strong>Acertos Inesperados:</strong> Questões acertadas com baixa probabilidade (prob. < 50%)</li>
            <li><strong>Erros Inesperados:</strong> Questões erradas com alta probabilidade (prob. > 50%)</li>
            <li><strong>Inconsistência:</strong> Probabilidade de acerto em caso de erro ou a probabilidade de erro em caso de acerto.</li>
          </ul>
        </div>

        <div class="consistency-table-container">
          <table class="consistency-table">
            <thead>
              <tr>
                <th>Questão</th>
                <th>Área</th>
                <th>Resposta</th>
                <th>Prob. Acerto</th>
                <th>Dificuldade (b)</th>
                <th>Discriminação (a)</th>
                <th>Inconsistência</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              ${questionsWithValidTRI
                .map((question) => this.renderConsistencyRow(question))
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza uma linha da tabela de consistência
   */
  renderConsistencyRow(question) {
    const probPercent = (question.probability * 100).toFixed(1);
    const consistencyPercent = (question.consistency * 100).toFixed(1);

    let typeClass = "";
    let typeText = "";
    let typeIcon = "";

    switch (question.consistencyType) {
      case "unexpected_correct":
        typeClass = "unexpected-correct";
        typeText = "Acerto Inesperado";
        typeIcon = "🎯";
        break;
      case "unexpected_wrong":
        typeClass = "unexpected-wrong";
        typeText = "Erro Inesperado";
        typeIcon = "⚠️";
        break;
      case "expected_correct":
        typeClass = "expected-correct";
        typeText = "Acerto Esperado";
        typeIcon = "✅";
        break;
      case "expected_wrong":
        typeClass = "expected-wrong";
        typeText = "Erro Esperado";
        typeIcon = "❌";
        break;
    }

    const resultClass = question.isCorrect ? "correct" : "incorrect";
    const resultText = question.isCorrect
      ? `${question.userAnswer} ✓`
      : `${question.userAnswer} (correto: ${question.correctAnswer})`;

    return `
      <tr class="consistency-row ${typeClass}">
        <td class="question-number">${question.questionNumber}</td>
        <td class="area">${question.area}</td>
        <td class="result ${resultClass}">${resultText}</td>
        <td class="probability">${probPercent}%</td>
        <td class="difficulty">${question.triParams.b.toFixed(3)} (${
      question.triParams.b.toFixed(2) * 100 + 500
    })</td>
        <td class="discrimination">${question.triParams.a.toFixed(2)}</td>
        <td class="consistency">
          <div class="consistency-bar">
            <div class="consistency-fill" style="width: ${consistencyPercent}%"></div>
            <span class="consistency-text">${consistencyPercent}%</span>
          </div>
        </td>
        <td class="type">
          <span class="type-badge ${typeClass}">
            ${typeIcon} ${typeText}
          </span>
        </td>
      </tr>
    `;
  }
}
