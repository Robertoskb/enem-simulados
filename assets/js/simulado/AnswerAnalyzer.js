// Classe responsável por calcular estatísticas de acerto de forma precisa
export class AnswerAnalyzer {
  constructor(app) {
    this.app = app;
  }

  /**
   * Calcula estatísticas detalhadas de uma lista de questões
   * @param {Array} questions - Array de questões
   * @param {Object} answers - Objeto com respostas do usuário
   * @returns {Object} - Estatísticas detalhadas
   */
  calculateDetailedStats(questions, answers) {
    const stats = {
      total: questions.length,
      correct: 0,
      wrong: 0,
      blank: 0,
      cancelledAnswered: 0,
      cancelledBlank: 0,
      valid: 0, // Questões válidas (não anuladas)
      answered: 0, // Questões respondidas (válidas + anuladas respondidas)
      details: [], // Detalhes de cada questão
    };

    questions.forEach((question, index) => {
      const userAnswer = answers[question.position];

      // Verificar resposta usando PositionMapper
      const answerCheck =
        this.app.questionGenerator.positionMapper.checkUserAnswer(
          question,
          userAnswer
        );

      const detail = {
        position: question.position,
        originalPosition: question.originalPosition,
        area: question.area,
        cancelled: question.cancelled,
        userAnswer: userAnswer,
        correctAnswer: this.app.questionGenerator.getCorrectAnswer(question),
        isCorrect: answerCheck.isCorrect,
        explanation: answerCheck.explanation,
      };

      stats.details.push(detail);

      // Contabilizar estatísticas
      if (question.cancelled) {
        if (answerCheck.isCorrect) {
          stats.cancelledAnswered++;
          stats.correct++; // Anuladas respondidas contam como acerto
        } else {
          stats.cancelledBlank++;
        }
      } else {
        stats.valid++;
        if (!userAnswer) {
          stats.blank++;
        } else {
          stats.answered++;
          if (answerCheck.isCorrect) {
            stats.correct++;
          } else {
            stats.wrong++;
          }
        }
      }
    });

    // Calcular porcentagens
    stats.validQuestionsAnswered = stats.answered;
    stats.totalAnswered = stats.answered + stats.cancelledAnswered;
    stats.accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    stats.validAccuracy =
      stats.validQuestionsAnswered > 0
        ? ((stats.correct - stats.cancelledAnswered) /
            stats.validQuestionsAnswered) *
          100
        : 0;

    return stats;
  }

  /**
   * Calcula estatísticas por área
   * @param {Array} questions - Array de questões
   * @param {Object} answers - Objeto com respostas do usuário
   * @returns {Object} - Estatísticas por área
   */
  calculateStatsByArea(questions, answers) {
    const statsByArea = {};

    questions.forEach((question) => {
      const area = question.area;
      if (!statsByArea[area]) {
        statsByArea[area] = {
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
          cancelledAnswered: 0,
          cancelledBlank: 0,
          questions: [],
        };
      }

      const areaStats = statsByArea[area];
      areaStats.total++;
      areaStats.questions.push(question);

      const userAnswer = answers[question.position];
      const answerCheck =
        this.app.questionGenerator.positionMapper.checkUserAnswer(
          question,
          userAnswer
        );

      if (question.cancelled) {
        if (answerCheck.isCorrect) {
          areaStats.cancelledAnswered++;
          areaStats.correct++;
        } else {
          areaStats.cancelledBlank++;
        }
      } else {
        if (!userAnswer) {
          areaStats.blank++;
        } else if (answerCheck.isCorrect) {
          areaStats.correct++;
        } else {
          areaStats.wrong++;
        }
      }
    });

    // Calcular porcentagens para cada área
    Object.keys(statsByArea).forEach((area) => {
      const stats = statsByArea[area];
      const validQuestions =
        stats.total - stats.cancelledAnswered - stats.cancelledBlank;
      const answeredValid =
        stats.correct + stats.wrong - stats.cancelledAnswered;

      stats.accuracy =
        stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
      stats.validAccuracy =
        answeredValid > 0
          ? ((stats.correct - stats.cancelledAnswered) / answeredValid) * 100
          : 0;
    });

    return statsByArea;
  }

  /**
   * Calcula estatísticas por habilidade (apenas questões válidas)
   * @param {Array} questions - Array de questões
   * @param {Object} answers - Objeto com respostas do usuário
   * @returns {Object} - Estatísticas por habilidade
   */
  calculateStatsBySkill(questions, answers) {
    const skillStats = {};
    const meta = this.app.getMeta();
    const config = this.app.getCurrentConfig();

    questions.forEach((question) => {
      // Pular questões anuladas para estatísticas de habilidade
      if (question.cancelled) {
        console.log(
          `⏭️ Questão ${question.position} anulada, ignorada no cálculo de habilidades`
        );
        return;
      }

      // Buscar habilidade no meta.json usando posição mapeada
      const targetPosition = question.originalPosition || question.position;

      if (
        !meta[config.year] ||
        !meta[config.year][question.area] ||
        !meta[config.year][question.area][targetPosition]
      ) {
        console.warn(
          `⚠️ Meta não encontrado para questão ${question.position} → posição azul ${targetPosition}`
        );
        return;
      }

      const metaData = meta[config.year][question.area][targetPosition];
      const hability = metaData.hability;

      if (!hability) {
        console.warn(
          `⚠️ Habilidade não encontrada para questão ${question.position}`
        );
        return;
      }

      // Inicializar área/habilidade se necessário
      if (!skillStats[question.area]) {
        skillStats[question.area] = {};
      }
      if (!skillStats[question.area][hability]) {
        skillStats[question.area][hability] = {
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
          questions: [],
        };
      }

      const skill = skillStats[question.area][hability];
      skill.total++;
      skill.questions.push(question);

      const userAnswer = answers[question.position];
      const answerCheck =
        this.app.questionGenerator.positionMapper.checkUserAnswer(
          question,
          userAnswer
        );

      if (!userAnswer) {
        skill.blank++;
      } else if (answerCheck.isCorrect) {
        skill.correct++;
      } else {
        skill.wrong++;
      }
    });

    // Calcular porcentagens para cada habilidade
    Object.keys(skillStats).forEach((area) => {
      Object.keys(skillStats[area]).forEach((hability) => {
        const skill = skillStats[area][hability];
        const answered = skill.correct + skill.wrong;
        skill.accuracy = answered > 0 ? (skill.correct / answered) * 100 : 0;
      });
    });

    return skillStats;
  }

  /**
   * Cria padrão de acertos para análises futuras
   * @param {Array} questions - Array de questões
   * @param {Object} answers - Objeto com respostas do usuário
   * @returns {Object} - Padrões de acerto em diferentes ordenações
   */
  createAnswerPatterns(questions, answers) {
    const patterns = {
      examOrder: "", // Ordem da prova
      originalOrder: "", // Ordem original (prova azul)
      difficultyOrder: "", // Ordem por dificuldade
      discriminationOrder: "", // Ordem por discriminação
    };

    const meta = this.app.getMeta();
    const config = this.app.getCurrentConfig();

    // Padrão na ordem da prova
    questions.forEach((question) => {
      if (question.cancelled) {
        patterns.examOrder += "A"; // A = Anulada
      } else {
        const answerCheck =
          this.app.questionGenerator.positionMapper.checkUserAnswer(
            question,
            answers[question.position]
          );
        patterns.examOrder += answerCheck.isCorrect ? "1" : "0";
      }
    });

    // Padrão na ordem original (apenas questões válidas)
    const validQuestions = questions.filter((q) => !q.cancelled);
    const sortedByOriginal = [...validQuestions].sort(
      (a, b) =>
        (a.originalPosition || a.position) - (b.originalPosition || b.position)
    );

    sortedByOriginal.forEach((question) => {
      const answerCheck =
        this.app.questionGenerator.positionMapper.checkUserAnswer(
          question,
          answers[question.position]
        );
      patterns.originalOrder += answerCheck.isCorrect ? "1" : "0";
    });

    // Padrões por dificuldade e discriminação (apenas questões com meta)
    const questionsWithMeta = validQuestions.filter((question) => {
      const targetPosition = question.originalPosition || question.position;
      return (
        meta[config.year] &&
        meta[config.year][question.area] &&
        meta[config.year][question.area][targetPosition]
      );
    });

    // Ordenar por dificuldade
    const sortedByDifficulty = [...questionsWithMeta].sort((a, b) => {
      const aTarget = a.originalPosition || a.position;
      const bTarget = b.originalPosition || b.position;
      const aDiff = meta[config.year][a.area][aTarget].difficulty || 0;
      const bDiff = meta[config.year][b.area][bTarget].difficulty || 0;
      return aDiff - bDiff;
    });

    sortedByDifficulty.forEach((question) => {
      const answerCheck =
        this.app.questionGenerator.positionMapper.checkUserAnswer(
          question,
          answers[question.position]
        );
      patterns.difficultyOrder += answerCheck.isCorrect ? "1" : "0";
    });

    // Ordenar por discriminação
    const sortedByDiscrimination = [...questionsWithMeta].sort((a, b) => {
      const aTarget = a.originalPosition || a.position;
      const bTarget = b.originalPosition || b.position;
      const aDisc = meta[config.year][a.area][aTarget].discrimination || 0;
      const bDisc = meta[config.year][b.area][bTarget].discrimination || 0;
      return aDisc - bDisc;
    });

    sortedByDiscrimination.forEach((question) => {
      const answerCheck =
        this.app.questionGenerator.positionMapper.checkUserAnswer(
          question,
          answers[question.position]
        );
      patterns.discriminationOrder += answerCheck.isCorrect ? "1" : "0";
    });

    // Adicionar posições das anuladas
    patterns.cancelledPositions = {
      examOrder: questions
        .map((q, index) => (q.cancelled ? index : null))
        .filter((pos) => pos !== null),
      originalOrder: [], // Anuladas não aparecem na ordem original
      difficultyOrder: [], // Anuladas não aparecem na ordem por dificuldade
      discriminationOrder: [], // Anuladas não aparecem na ordem por discriminação
    };

    return patterns;
  }
}
