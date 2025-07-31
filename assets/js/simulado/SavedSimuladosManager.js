// Gerenciador de simulados salvos
export class SavedSimuladosManager {
  constructor(app) {
    this.app = app;
    this.storageKey = "enem_simulados_salvos";
  }

  // Salvar simulado atual
  saveCurrentSimulado() {
    const simuladoData = {
      id: this.generateId(),
      timestamp: Date.now(),
      date: new Date().toLocaleString("pt-BR"),
      config: { ...this.app.getCurrentConfig() },
      questions: [...this.app.getQuestions()],
      answers: { ...this.app.getAnswers() },
      meta: this.app.getMeta(),
      positions: this.app.getPositions(),
    };

    // Adicionar informações extras para identificação
    simuladoData.title = this.generateTitle(simuladoData.config);
    simuladoData.questionsCount = simuladoData.questions.length;

    // Calcular acertos para preview (excluindo questões anuladas)
    let correctAnswers = 0;
    let validQuestions = 0;

    simuladoData.questions.forEach((question) => {
      // Pular questões anuladas
      if (question.cancelled) {
        return;
      }

      validQuestions++;
      const userAnswer = simuladoData.answers[question.position];
      const correctAnswer =
        this.app.questionGenerator.getCorrectAnswer(question);
      if (userAnswer === correctAnswer) {
        correctAnswers++;
      }
    });

    simuladoData.correctAnswers = correctAnswers;
    simuladoData.validQuestions = validQuestions;
    simuladoData.performance =
      validQuestions > 0
        ? Math.round((correctAnswers / validQuestions) * 100)
        : 0;

    const savedSimulados = this.getSavedSimulados();
    savedSimulados.push(simuladoData);

    // Manter apenas os últimos 50 simulados
    if (savedSimulados.length > 50) {
      savedSimulados.shift();
    }

    localStorage.setItem(this.storageKey, JSON.stringify(savedSimulados));
    return simuladoData.id;
  }

  // Obter todos os simulados salvos
  getSavedSimulados() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Erro ao carregar simulados salvos:", error);
      return [];
    }
  }

  // Carregar simulado específico
  loadSimulado(simuladoId) {
    const savedSimulados = this.getSavedSimulados();
    return savedSimulados.find((simulado) => simulado.id === simuladoId);
  }

  // Excluir simulado salvo
  deleteSimulado(simuladoId) {
    const savedSimulados = this.getSavedSimulados();
    const filteredSimulados = savedSimulados.filter(
      (simulado) => simulado.id !== simuladoId
    );
    localStorage.setItem(this.storageKey, JSON.stringify(filteredSimulados));
  }

  // Aplicar simulado salvo ao app
  applySimuladoToApp(simuladoData) {
    // Restaurar configuração
    this.app.currentConfig = { ...simuladoData.config };

    // Restaurar questões e respostas
    this.app.questions = [...simuladoData.questions];
    this.app.answers = { ...simuladoData.answers };

    // Restaurar dados de meta e posições (caso sejam diferentes)
    if (simuladoData.meta) {
      this.app.meta = simuladoData.meta;
    }
    if (simuladoData.positions) {
      this.app.positions = simuladoData.positions;
    }
  }

  // Gerar ID único para simulado
  generateId() {
    return "sim_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  // Gerar título descritivo para o simulado
  generateTitle(config) {
    const typeNames = {
      dia1: "1º Dia",
      dia2: "2º Dia",
      LC0: "Linguagens (Inglês)",
      LC1: "Linguagens (Espanhol)",
      CH: "Ciências Humanas",
      CN: "Ciências da Natureza",
      MT: "Matemática",
    };

    let title = `${config.year} - ${typeNames[config.type] || config.type}`;

    if (config.color) {
      title += ` - Cor ${config.color}`;
    }

    if (config.language && config.type === "dia1") {
      const langName = config.language === "LC0" ? "Inglês" : "Espanhol";
      title += ` (${langName})`;
    }

    return title;
  }

  // Obter estatísticas dos simulados salvos
  getStats() {
    const savedSimulados = this.getSavedSimulados();

    if (savedSimulados.length === 0) {
      return {
        total: 0,
        averagePerformance: 0,
        bestPerformance: 0,
        recentCount: 0,
      };
    }

    const performances = savedSimulados.map((s) => s.performance);
    const recentSimulados = savedSimulados.filter(
      (s) => Date.now() - s.timestamp < 7 * 24 * 60 * 60 * 1000 // Últimos 7 dias
    );

    return {
      total: savedSimulados.length,
      averagePerformance: Math.round(
        performances.reduce((a, b) => a + b, 0) / performances.length
      ),
      bestPerformance: Math.max(...performances),
      recentCount: recentSimulados.length,
    };
  }
}
