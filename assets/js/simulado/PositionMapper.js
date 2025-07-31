// Classe responsável por mapear posições entre cores de prova e gerenciar questões anuladas
export class PositionMapper {
  constructor(app) {
    this.app = app;
    this.colorMapping = {
      azul: "AZUL",
      amarela: "AMARELA",
      branca: "BRANCA",
      rosa: "ROSA",
      verde: "VERDE",
      cinza: "CINZA",
    };
  }

  /**
   * Mapeia uma posição da cor escolhida para a posição equivalente na prova azul
   * @param {number} position - Posição na cor da prova escolhida
   * @param {string} area - Área da questão (LC0, LC1, CH, CN, MT)
   * @param {string} color - Cor da prova (azul, amarela, etc.)
   * @param {number} year - Ano da prova
   * @returns {Object} - {mappedPosition: number, isValid: boolean, reason: string}
   */
  mapToBluePosition(position, area, color, year) {
    const positions = this.app.getPositions();
    const yearData = positions[year];

    // Verificar se existem dados para o ano
    if (!yearData) {
      return {
        mappedPosition: position,
        isValid: false,
        reason: `Dados não encontrados para o ano ${year}`,
      };
    }

    // Verificar se existem dados para a área
    if (!yearData[area]) {
      return {
        mappedPosition: position,
        isValid: false,
        reason: `Área ${area} não encontrada no ano ${year}`,
      };
    }

    const mappedColor = this.colorMapping[color];
    if (!mappedColor) {
      return {
        mappedPosition: position,
        isValid: false,
        reason: `Cor '${color}' não reconhecida`,
      };
    }

    // Buscar a posição na prova azul que corresponde à posição na cor escolhida
    for (const [bluePosition, colorMap] of Object.entries(yearData[area])) {
      if (colorMap[mappedColor] === position) {
        const mapped = parseInt(bluePosition);
        console.log(
          `📍 Mapeamento: Posição ${position} (${color}) → ${mapped} (azul) na área ${area}`
        );
        return {
          mappedPosition: mapped,
          isValid: true,
          reason: "Mapeamento encontrado com sucesso",
        };
      }
    }

    // Não encontrou mapeamento
    return {
      mappedPosition: position,
      isValid: false,
      reason: `Posição ${position} não encontrada para cor ${color} na área ${area}`,
    };
  }

  /**
   * Verifica se uma questão deve ser considerada anulada
   * @param {number} position - Posição na cor da prova escolhida
   * @param {string} area - Área da questão
   * @param {string} color - Cor da prova
   * @param {number} year - Ano da prova
   * @returns {Object} - {isCancelled: boolean, reason: string, mappedPosition: number}
   */
  checkIfCancelled(position, area, color, year) {
    // Primeiro, tentar mapear para a posição azul
    const mappingResult = this.mapToBluePosition(position, area, color, year);

    // Se não conseguiu mapear, a questão é anulada
    if (!mappingResult.isValid) {
      return {
        isCancelled: true,
        reason: `Sem mapeamento: ${mappingResult.reason}`,
        mappedPosition: mappingResult.mappedPosition,
      };
    }

    // Se conseguiu mapear, verificar se existe no meta.json
    const meta = this.app.getMeta();
    if (!meta[year] || !meta[year][area]) {
      return {
        isCancelled: true,
        reason: `Meta.json não disponível para ${year}/${area}`,
        mappedPosition: mappingResult.mappedPosition,
      };
    }

    const metaData = meta[year][area][mappingResult.mappedPosition];
    if (!metaData) {
      return {
        isCancelled: true,
        reason: `Questão ${mappingResult.mappedPosition} não encontrada no meta.json`,
        mappedPosition: mappingResult.mappedPosition,
      };
    }

    // Questão válida
    return {
      isCancelled: false,
      reason: "Questão válida com meta.json disponível",
      mappedPosition: mappingResult.mappedPosition,
    };
  }

  /**
   * Obtém o gabarito correto para uma questão
   * @param {Object} question - Objeto da questão
   * @returns {string|null} - Letra da resposta correta ou null se não disponível
   */
  getCorrectAnswer(question) {
    // Se a questão está anulada, não há gabarito
    if (question.cancelled) {
      return null;
    }

    const config = this.app.getCurrentConfig();

    // Usar a posição mapeada se disponível, senão usar originalPosition
    const targetPosition = question.originalPosition || question.position;

    const meta = this.app.getMeta();
    if (
      meta[config.year] &&
      meta[config.year][question.area] &&
      meta[config.year][question.area][targetPosition]
    ) {
      const metaData = meta[config.year][question.area][targetPosition];
      if (metaData.answer) {
        console.log(
          `📝 Gabarito: Questão ${question.position} → Posição azul ${targetPosition} → ${metaData.answer}`
        );
        return metaData.answer;
      }
    }

    // Fallback para questões sem gabarito conhecido
    console.log(
      `⚠️ Gabarito não encontrado para questão ${question.position}, usando fallback`
    );
    const answers = ["A", "B", "C", "D", "E"];
    return answers[targetPosition % 5];
  }

  /**
   * Verifica se uma resposta do usuário está correta
   * @param {Object} question - Objeto da questão
   * @param {string} userAnswer - Resposta do usuário
   * @returns {Object} - {isCorrect: boolean, explanation: string}
   */
  checkUserAnswer(question, userAnswer) {
    // Para questões anuladas
    if (question.cancelled) {
      if (userAnswer) {
        return {
          isCorrect: true,
          explanation: "Questão anulada - qualquer resposta conta como acerto",
        };
      } else {
        return {
          isCorrect: false,
          explanation: "Questão anulada - não respondida",
        };
      }
    }

    // Para questões válidas
    const correctAnswer = this.getCorrectAnswer(question);
    if (!correctAnswer) {
      return {
        isCorrect: false,
        explanation: "Gabarito não disponível",
      };
    }

    if (!userAnswer) {
      return {
        isCorrect: false,
        explanation: "Questão não respondida",
      };
    }

    const isCorrect = userAnswer === correctAnswer;
    return {
      isCorrect,
      explanation: isCorrect
        ? `Correto: ${userAnswer} = ${correctAnswer}`
        : `Incorreto: ${userAnswer} ≠ ${correctAnswer}`,
    };
  }

  /**
   * Cria um objeto de questão com todas as informações necessárias
   * @param {number} position - Posição na prova
   * @param {string} area - Área da questão
   * @param {string} color - Cor da prova
   * @param {number} year - Ano da prova
   * @returns {Object} - Objeto da questão completo
   */
  createQuestionObject(position, area, color, year) {
    const cancelledInfo = this.checkIfCancelled(position, area, color, year);

    return {
      position: position,
      originalPosition: cancelledInfo.mappedPosition,
      area: area,
      cancelled: cancelledInfo.isCancelled,
      cancelledReason: cancelledInfo.reason,
      color: color,
    };
  }
}
