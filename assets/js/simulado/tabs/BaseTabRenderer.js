// Classe base para renderizadores de abas
export class BaseTabRenderer {
  constructor(app) {
    this.app = app;
  }

  // Obter questões e respostas
  getQuestionsAndAnswers() {
    return {
      questions: this.app.getQuestions(),
      answers: this.app.getAnswers(),
    };
  }

  // Nomes das áreas
  getAreaNames() {
    return {
      LC0: "Linguagens (Inglês)",
      LC1: "Linguagens (Espanhol)",
      CH: "Ciências Humanas",
      CN: "Ciências da Natureza",
      MT: "Matemática",
    };
  }

  // Determinar se a resposta está correta (considerando questões anuladas)
  isCorrectAnswer(question, userAnswer, correctAnswer) {
    if (question.cancelled) {
      // Para questões anuladas, considera correto se o usuário respondeu
      return userAnswer !== undefined && userAnswer !== null;
    } else {
      // Para questões não anuladas, compara com o gabarito
      return userAnswer === correctAnswer;
    }
  }

  // Calcular porcentagem
  calculatePercentage(correct, total) {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  }

  // Gerar padrão binário de acertos
  generatePattern(data) {
    return data.map((item) => (item.isCorrect ? "1" : "0")).join("");
  }
}
