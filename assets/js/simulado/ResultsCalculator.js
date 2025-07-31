// Calculador de resultados do simulado
export class ResultsCalculator {
  constructor(app) {
    this.app = app;
    this.resetPatterns();
  }

  resetPatterns() {
    this.examOrderPattern = "";
    this.originalOrderPattern = "";
    this.difficultyOrderPattern = "";
    this.discriminationOrderPattern = "";
    this.areaPatterns = {};
    this.cancelledPositions = {};
  }

  calculateResults() {
    const questions = this.app.getQuestions();
    const answers = this.app.getAnswers();

    let totalQuestions = questions.length;
    let correctAnswers = 0;
    let cancelledQuestions = 0;

    // Padrões de acerto
    let examOrderPattern = "";
    let originalOrderPattern = "";
    let difficultyOrderPattern = "";
    let discriminationOrderPattern = "";

    // Arrays para diferentes ordenações
    let resultsWithOriginalPos = [];
    let resultsWithDifficulty = [];
    let resultsWithDiscrimination = [];

    questions.forEach((question) => {
      const { isCorrect, isCancelled } = this.processQuestionResult(
        question,
        answers
      );

      if (isCancelled) {
        cancelledQuestions++;
        // Questões anuladas não contam como acerto na estatística final
      } else {
        if (isCorrect) {
          correctAnswers++;
        }
      }

      // Para o padrão visual:
      // 1 = acerto, 0 = erro, A = anulada
      if (isCancelled) {
        examOrderPattern += "A";
      } else {
        examOrderPattern += isCorrect ? "1" : "0";
      }

      const resultData = this.createResultData(
        question,
        isCorrect,
        isCancelled
      );
      resultsWithOriginalPos.push(resultData);

      if (!isCancelled) {
        resultsWithDifficulty.push(resultData);
        resultsWithDiscrimination.push(resultData);
      }
    });

    // Criar padrões ordenados
    this.createOrderedPatterns(
      resultsWithOriginalPos,
      resultsWithDifficulty,
      resultsWithDiscrimination
    );

    // Armazenar padrões
    this.examOrderPattern = examOrderPattern;
    this.originalOrderPattern = originalOrderPattern;
    this.difficultyOrderPattern = difficultyOrderPattern;
    this.discriminationOrderPattern = discriminationOrderPattern;

    this.createAreaPatterns(resultsWithOriginalPos);
    this.createCancelledPositions(
      resultsWithOriginalPos,
      resultsWithDifficulty.length,
      resultsWithDiscrimination.length
    );

    // Calcular estatísticas finais
    const stats = this.calculateStatistics(
      totalQuestions,
      correctAnswers,
      cancelledQuestions
    );

    // Log dos resultados
    this.logResults(stats);

    // Atualizar interface com os resultados
    this.updateUI(stats);
  }

  processQuestionResult(question, answers) {
    let isCorrect = false;
    let isCancelled = question.cancelled;

    if (isCancelled) {
      isCorrect = false; // Sempre 0 no padrão interno
    } else {
      const correctAnswer =
        this.app.questionGenerator.getCorrectAnswer(question);
      const userAnswer = answers[question.position];
      isCorrect = userAnswer === correctAnswer;
    }

    return { isCorrect, isCancelled };
  }

  createResultData(question, isCorrect, isCancelled) {
    const config = this.app.getCurrentConfig();
    const meta = this.app.getMeta();

    let difficulty = null;
    let discrimination = null;

    if (
      !isCancelled &&
      meta[config.year] &&
      meta[config.year][question.area] &&
      meta[config.year][question.area][question.originalPosition]
    ) {
      const metaData =
        meta[config.year][question.area][question.originalPosition];
      difficulty = metaData.difficulty || null;
      discrimination = metaData.discrimination || null;
    }

    return {
      originalPosition: question.originalPosition,
      isCorrect: isCorrect,
      area: question.area,
      cancelled: isCancelled,
      difficulty: difficulty,
      discrimination: discrimination,
      position: question.position,
      examPosition: this.app.getQuestions().indexOf(question),
    };
  }

  createOrderedPatterns(
    resultsWithOriginalPos,
    resultsWithDifficulty,
    resultsWithDiscrimination
  ) {
    // Padrão por posição original
    const sortedByOriginal = [...resultsWithOriginalPos].sort(
      (a, b) => a.originalPosition - b.originalPosition
    );
    this.originalOrderPattern = sortedByOriginal
      .map((r) => (r.isCorrect ? "1" : "0"))
      .join("");

    // Padrão por dificuldade
    const sortedByDifficulty = [...resultsWithDifficulty].sort((a, b) => {
      if (a.difficulty !== null && b.difficulty !== null) {
        return a.difficulty - b.difficulty;
      }
      if (a.difficulty !== null) return -1;
      if (b.difficulty !== null) return 1;
      return a.originalPosition - b.originalPosition;
    });

    this.difficultyOrderPattern = sortedByDifficulty
      .map((r) => (r.isCorrect ? "1" : "0"))
      .join("");

    const cancelledResults = resultsWithOriginalPos.filter((r) => r.cancelled);
    this.difficultyOrderPattern += "0".repeat(cancelledResults.length);

    // Padrão por discriminação
    const sortedByDiscrimination = [...resultsWithDiscrimination].sort(
      (a, b) => {
        if (a.discrimination !== null && b.discrimination !== null) {
          return a.discrimination - b.discrimination;
        }
        if (a.discrimination !== null) return -1;
        if (b.discrimination !== null) return 1;
        return a.originalPosition - b.originalPosition;
      }
    );

    this.discriminationOrderPattern = sortedByDiscrimination
      .map((r) => (r.isCorrect ? "1" : "0"))
      .join("");
    this.discriminationOrderPattern += "0".repeat(cancelledResults.length);
  }

  createAreaPatterns(resultsWithOriginalPos) {
    const areas = ["LC0", "LC1", "CH", "CN", "MT"];
    areas.forEach((area) => {
      const areaResults = resultsWithOriginalPos
        .filter((r) => r.area === area)
        .sort((a, b) => a.originalPosition - b.originalPosition);

      this.areaPatterns[area] = areaResults
        .map((r) => (r.isCorrect ? "1" : "0"))
        .join("");
    });
  }

  createCancelledPositions(
    resultsWithOriginalPos,
    difficultyLength,
    discriminationLength
  ) {
    const cancelledResults = resultsWithOriginalPos.filter((r) => r.cancelled);

    this.cancelledPositions = {
      examOrder: resultsWithOriginalPos
        .map((r, index) => (r.cancelled ? r.examPosition : null))
        .filter((pos) => pos !== null),
      originalOrder: resultsWithOriginalPos
        .sort((a, b) => a.originalPosition - b.originalPosition)
        .map((r, index) => (r.cancelled ? index : null))
        .filter((pos) => pos !== null),
      difficultyOrder: Array.from(
        { length: cancelledResults.length },
        (_, i) => difficultyLength + i
      ),
      discriminationOrder: Array.from(
        { length: cancelledResults.length },
        (_, i) => discriminationLength + i
      ),
    };
  }

  calculateStatistics(totalQuestions, correctAnswers, cancelledQuestions) {
    // Questões válidas para resposta = total - anuladas
    const validQuestions = totalQuestions - cancelledQuestions;

    // Erros = questões válidas - acertos
    const wrongAnswers = validQuestions - correctAnswers;

    // Performance = acertos / questões válidas
    const performance =
      validQuestions > 0
        ? Math.round((correctAnswers / validQuestions) * 100)
        : 0;

    return {
      totalQuestions,
      correctAnswers, // Acertos reais (não incluem anuladas)
      wrongAnswers,
      cancelledQuestions,
      performance,
    };
  }

  updateUI(stats) {
    document.getElementById("total-questions").textContent =
      stats.totalQuestions;
    document.getElementById("correct-answers").textContent =
      stats.correctAnswers;
    document.getElementById("wrong-answers").textContent = stats.wrongAnswers;
    document.getElementById("cancelled-questions").textContent =
      stats.cancelledQuestions;
    document.getElementById(
      "performance"
    ).textContent = `${stats.performance}%`;

    // Atualizar dados nas abas
    if (this.app.resultsTabsController) {
      this.app.resultsTabsController.updateResults(stats);
    }
  }

  logResults(stats) {
    console.log("=== PADRÕES DE ACERTO (INTERNOS) ===");
    console.log("Ordem da prova:", this.examOrderPattern);
    console.log("Ordem original:", this.originalOrderPattern);
    console.log("Ordem por dificuldade:", this.difficultyOrderPattern);
    console.log("Ordem por discriminação:", this.discriminationOrderPattern);
    console.log("Padrões por área:", this.areaPatterns);
    console.log("Posições das anuladas:", this.cancelledPositions);
    console.log("=== ESTATÍSTICAS PARA O USUÁRIO ===");
    console.log(`Total de questões: ${stats.totalQuestions}`);
    console.log(`Acertos (excluindo anuladas): ${stats.correctAnswers}`);
    console.log(`Erros: ${stats.wrongAnswers}`);
    console.log(`Anuladas: ${stats.cancelledQuestions}`);
    console.log(`Performance: ${stats.performance}%`);
  }
}
