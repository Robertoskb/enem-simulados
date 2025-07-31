// Gerador de questões do simulado
import { PositionMapper } from "./PositionMapper.js";

export class QuestionGenerator {
  constructor(app) {
    this.app = app;
    this.positionMapper = new PositionMapper(app);
  }

  getQuestionRanges(type) {
    const ranges = {
      LC0: { start: 1, end: 45, areas: ["LC0"] },
      LC1: { start: 1, end: 45, areas: ["LC1"] },
      CH: { start: 46, end: 90, areas: ["CH"] },
      CN: { start: 91, end: 135, areas: ["CN"] },
      MT: { start: 136, end: 180, areas: ["MT"] },
      dia1: { start: 1, end: 90, areas: ["LC0", "LC1", "CH"] },
      dia2: { start: 91, end: 180, areas: ["CN", "MT"] },
    };

    return ranges[type] || ranges["LC0"];
  }

  generateQuestions() {
    const config = this.app.getCurrentConfig();
    const range = this.getQuestionRanges(config.type);
    const yearData = this.app.getPositions()[config.year];

    const colorMapping = {
      azul: "AZUL",
      amarela: "AMARELA",
      branca: "BRANCA",
      rosa: "ROSA",
      verde: "VERDE",
      cinza: "CINZA",
    };

    const color = colorMapping[config.color];
    const questions = [];

    // Para dia1, usar o idioma selecionado
    let areas = range.areas;
    console.log(
      `🎯 QuestionGenerator: Tipo de simulado: ${
        config.type
      }, áreas padrão: [${range.areas.join(", ")}]`
    );

    if (config.type === "dia1") {
      if (config.language) {
        areas = [config.language, "CH"];
      } else {
        areas = ["LC0", "CH"];
      }
      console.log(
        `📝 QuestionGenerator: Dia1 - áreas ajustadas: [${areas.join(", ")}]`
      );
    } else if (config.type === "dia2") {
      // Para dia2, usar as áreas padrão CN e MT
      areas = ["CN", "MT"];
      console.log(`📝 QuestionGenerator: Dia2 - áreas: [${areas.join(", ")}]`);
    }

    console.log(
      `✅ QuestionGenerator: Áreas finais para ${config.type}: [${areas.join(
        ", "
      )}]`
    );

    // Mapear posições baseado na cor da prova
    for (let pos = range.start; pos <= range.end; pos++) {
      const questionData = this.processQuestion(
        pos,
        areas,
        yearData,
        color,
        config
      );
      if (questionData) {
        questions.push(questionData);
      }
    }

    // Ordenar por posição (ordem da prova)
    questions.sort((a, b) => a.position - b.position);

    console.log(
      `Geradas ${questions.length} questões, sendo ${
        questions.filter((q) => q.cancelled).length
      } anuladas`
    );

    return questions;
  }

  processQuestion(pos, areas, yearData, color, config) {
    let questionArea = this.determineQuestionArea(pos, areas, config);

    if (!questionArea || !areas.includes(questionArea)) {
      console.log(
        `❌ QuestionGenerator: Questão ${pos} rejeitada - área: ${questionArea}, áreas permitidas: [${areas.join(
          ", "
        )}]`
      );
      return null;
    }

    // Usar PositionMapper para criar a questão com mapeamento correto
    return this.positionMapper.createQuestionObject(
      pos,
      questionArea,
      config.color,
      config.year
    );
  }

  determineQuestionArea(pos, areas, config) {
    console.log(
      `🔍 QuestionGenerator: determineQuestionArea para posição ${pos}, áreas disponíveis: [${areas.join(
        ", "
      )}], tipo: ${config?.type}`
    );

    if (pos >= 1 && pos <= 45) {
      // Para questões de Linguagens (posições 1-45)
      // No ENEM real, todas as 45 questões são da língua escolhida
      let area = null;

      // Se há configuração de idioma, usar ela
      if (config && config.language) {
        if (areas.includes(config.language)) {
          area = config.language;
          console.log(
            `📝 QuestionGenerator: Posição ${pos} (1-45, idioma configurado) -> área: ${area}`
          );
          return area;
        }
      }

      // Fallback: usar a primeira área de linguagem disponível
      if (areas.includes("LC0")) {
        area = "LC0";
      } else if (areas.includes("LC1")) {
        area = "LC1";
      }

      console.log(
        `📝 QuestionGenerator: Posição ${pos} (1-45, fallback) -> área: ${area}`
      );
      return area;
    } else if (pos >= 46 && pos <= 90) {
      if (areas.includes("CH")) {
        console.log(`📝 QuestionGenerator: Posição ${pos} (46-90) -> área: CH`);
        return "CH";
      } else {
        console.log(
          `❌ QuestionGenerator: Posição ${pos} (46-90) CH não disponível nas áreas: [${areas.join(
            ", "
          )}]`
        );
        return null;
      }
    } else if (pos >= 91 && pos <= 135) {
      if (areas.includes("CN")) {
        console.log(
          `📝 QuestionGenerator: Posição ${pos} (91-135) -> área: CN`
        );
        return "CN";
      } else {
        console.log(
          `❌ QuestionGenerator: Posição ${pos} (91-135) CN não disponível nas áreas: [${areas.join(
            ", "
          )}]`
        );
        return null;
      }
    } else if (pos >= 136 && pos <= 180) {
      if (areas.includes("MT")) {
        console.log(
          `📝 QuestionGenerator: Posição ${pos} (136-180) -> área: MT`
        );
        return "MT";
      } else {
        console.log(
          `❌ QuestionGenerator: Posição ${pos} (136-180) MT não disponível nas áreas: [${areas.join(
            ", "
          )}]`
        );
        return null;
      }
    }
    console.log(
      `❌ QuestionGenerator: Posição ${pos} não mapeada para nenhuma área`
    );
    return null;
  }

  getCorrectAnswer(question) {
    return this.positionMapper.getCorrectAnswer(question);
  }
}
