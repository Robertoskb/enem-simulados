/**
 * Módulo para análise de padrões de resposta
 */
export class PatternAnalyzer {
  /**
   * Gera string de respostas baseada nas questões e respostas
   * @param {Array} questions - Array de questões
   * @param {Object} answers - Objeto com respostas do usuário
   * @param {Object} app - Instância da aplicação
   * @returns {string} - String de padrões (1=correto, 0=incorreto, C=anulada)
   */
  static getAnswerString(questions, answers, app) {
    return questions
      .map((question) => {
        if (question.cancelled) {
          return "C"; // C para cancelled (anulada)
        }

        const userAnswer = answers[question.position];
        const correctAnswer = app.questionGenerator.getCorrectAnswer(question);

        // Para questões não anuladas, compara com o gabarito
        const isCorrect = userAnswer === correctAnswer;
        return isCorrect ? "1" : "0";
      })
      .join("");
  }

  /**
   * Analisa sequências de acertos e erros
   * @param {string} answerString - String de padrões de resposta
   * @returns {Object} - Análise das sequências
   */
  static analyzeSequences(answerString) {
    let maxCorrectStreak = 0;
    let maxIncorrectStreak = 0;
    let currentCorrectStreak = 0;
    let currentIncorrectStreak = 0;
    let alternations = 0;
    let lastType = null;

    for (let i = 0; i < answerString.length; i++) {
      const char = answerString[i];

      if (char === "C") continue; // Pular anuladas

      const isCorrect = char === "1";

      if (isCorrect) {
        currentCorrectStreak++;
        if (currentIncorrectStreak > 0) {
          maxIncorrectStreak = Math.max(
            maxIncorrectStreak,
            currentIncorrectStreak
          );
          currentIncorrectStreak = 0;
        }
        if (lastType === "0") alternations++;
        lastType = "1";
      } else {
        currentIncorrectStreak++;
        if (currentCorrectStreak > 0) {
          maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak);
          currentCorrectStreak = 0;
        }
        if (lastType === "1") alternations++;
        lastType = "0";
      }
    }

    // Verificar streaks finais
    maxCorrectStreak = Math.max(maxCorrectStreak, currentCorrectStreak);
    maxIncorrectStreak = Math.max(maxIncorrectStreak, currentIncorrectStreak);

    return {
      maxCorrectStreak,
      maxIncorrectStreak,
      alternations,
      currentCorrectStreak,
      currentIncorrectStreak,
    };
  }

  /**
   * Divide as respostas em chunks temporais de 15 questões
   * @param {string} answerString - String de padrões de resposta
   * @returns {Array} - Array de chunks com estatísticas
   */
  static getTemporalChunks(answerString) {
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

  /**
   * Analisa frequência de alternativas escolhidas
   * @param {Array} questions - Array de questões
   * @param {Object} answers - Objeto com respostas do usuário
   * @returns {Object} - Frequência e insights das alternativas
   */
  static analyzeOptionFrequency(questions, answers) {
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

    return { frequency, total };
  }

  /**
   * Gera insights baseados na frequência das alternativas
   * @param {Object} frequency - Frequência das alternativas
   * @param {number} total - Total de questões válidas
   * @returns {string} - Insights formatados em HTML
   */
  static generateFrequencyInsights(frequency, total) {
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
}
