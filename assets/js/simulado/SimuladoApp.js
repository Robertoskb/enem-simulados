// Classe principal do Simulado ENEM
import { DataLoader } from "./DataLoader.js";
import { UIController } from "./UIController.js";
import { QuestionGenerator } from "./QuestionGenerator.js";
import { ResultsCalculator } from "./ResultsCalculator.js";
import { ModalController } from "./ModalController.js";
import { SkillsReportCalculator } from "./SkillsReportCalculator.js";
import { ResultsTabsController } from "./ResultsTabsController.js";
import { SavedSimuladosManager } from "./SavedSimuladosManager.js";
import { ScoreCalculator } from "./ScoreCalculator.js";

export class SimuladoApp {
  constructor() {
    this.currentConfig = {
      year: null,
      type: null,
      color: null,
      language: null, // Para quando tipo = "dia1"
    };
    this.questions = [];
    this.answers = {};
    this.positions = {};
    this.meta = {};
    this.isLoadingFromSaved = false; // Flag para controlar se está carregando um simulado salvo

    // Instanciar módulos
    this.dataLoader = new DataLoader();
    this.uiController = new UIController(this);
    this.questionGenerator = new QuestionGenerator(this);
    this.resultsCalculator = new ResultsCalculator(this);
    this.modalController = new ModalController(this);
    this.skillsReportCalculator = new SkillsReportCalculator(this);
    this.resultsTabsController = new ResultsTabsController(this);
    this.savedSimuladosManager = new SavedSimuladosManager(this);
    this.scoreCalculator = new ScoreCalculator(this);

    this.init();
  }

  async init() {
    await this.loadData();
    this.uiController.initEventListeners();
    this.uiController.loadYearButtons();
    this.uiController.updateColorSelection(null); // Inicializar com mensagem
    this.uiController.initTheme();

    // Inicializar modo debug se ativado
    this.uiController.initializeDebugMode();
  }

  async loadData() {
    try {
      const data = await this.dataLoader.loadAllData();
      this.positions = data.positions;
      this.meta = data.meta;
      this.uiController.showDataLoadSuccess();
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      this.uiController.showDataLoadError(error);
      // Fallback data
      this.positions = { 2017: { LC0: {}, LC1: {}, CH: {}, CN: {}, MT: {} } };
      this.meta = { 2017: { LC0: {}, LC1: {}, CH: {}, CN: {}, MT: {} } };
    }
  }

  // Métodos de configuração
  selectYear(year) {
    this.uiController.selectYear(year);
  }

  selectExamType(type) {
    this.uiController.selectExamType(type);
  }

  selectColor(color) {
    this.uiController.selectColor(color);
  }

  selectLanguage(language) {
    this.uiController.selectLanguage(language);
  }

  // Métodos do simulado
  startSimulado() {
    this.questions = this.questionGenerator.generateQuestions();
    this.uiController.showSimuladoScreen();
    this.uiController.renderQuestions();

    // Atualizar debug panel se estiver ativo
    this.uiController.updateDebugPanel();
  }

  finishSimulado() {
    this.modalController.showFinishModal();
  }

  async calculateAndShowResults() {
    this.resultsCalculator.calculateResults();

    // Mostrar a tela de resultados primeiro
    this.uiController.showResultsScreen();

    // Garantir que as descrições de habilidades estejam carregadas
    await this.skillsReportCalculator.loadSkillsDescriptions();

    // Calcular e renderizar relatório de habilidades
    const skillsData = this.skillsReportCalculator.calculateSkillsReport();
    this.skillsReportCalculator.renderSkillsReport(skillsData);

    // Aguardar um pouco para garantir que as abas sejam renderizadas
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Forçar a renderização das abas primeiro
    if (this.resultsTabsController && this.resultsTabsController.resultsData) {
      this.resultsTabsController.renderTabContent("geral");
    }

    // DEPOIS calcular nota TRI para a área selecionada
    console.log("Iniciando cálculo de nota TRI...");
    try {
      const triResult = await this.scoreCalculator.calculateAllScores();
      console.log("Nota TRI calculada:", triResult);

      // Armazenar o resultado TRI para uso nas abas
      this.triResult = triResult;

      // Aguardar um pouco mais para garantir que a aba geral foi renderizada
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Atualizar interface com a nota TRI se calculada
      this.updateTRIScoresDisplay(triResult);
    } catch (error) {
      console.warn("Erro ao calcular nota TRI:", error);
      this.triResult = null;
    }

    // Mostrar modal de salvamento apenas se não estiver carregando um simulado salvo
    if (!this.isLoadingFromSaved) {
      this.uiController.showSaveConfirmation();
    }

    // Reset da flag
    this.isLoadingFromSaved = false;
  }

  backToConfig() {
    this.modalController.showBackModal();
  }

  newSimulado() {
    this.uiController.showConfigScreen();
    this.resetSimulado();
  }

  resetSimulado() {
    this.questions = [];
    this.answers = {};
    this.resultsCalculator.resetPatterns();
    this.uiController.resetUI();

    // Limpar container de habilidades
    const skillsContainer = document.getElementById("skills-container");
    if (skillsContainer) {
      skillsContainer.innerHTML = "";
    }
  }

  // Métodos para simulados salvos
  loadSavedSimulado(simuladoId) {
    const simuladoData = this.savedSimuladosManager.loadSimulado(simuladoId);
    if (simuladoData) {
      this.isLoadingFromSaved = true; // Marcar que está carregando um simulado salvo
      this.savedSimuladosManager.applySimuladoToApp(simuladoData);
      this.calculateAndShowResults();
      return true;
    }
    return false;
  }

  showSavedSimuladosList() {
    this.uiController.showSavedSimuladosScreen();
  }

  getSavedSimulados() {
    return this.savedSimuladosManager.getSavedSimulados();
  }

  deleteSavedSimulado(simuladoId) {
    this.savedSimuladosManager.deleteSimulado(simuladoId);
  }

  saveCurrentSimulado() {
    const simuladoId = this.savedSimuladosManager.saveCurrentSimulado();
    console.log("Simulado salvo com ID:", simuladoId);
    return simuladoId;
  }

  // Getters para os módulos acessarem os dados
  getCurrentConfig() {
    return this.currentConfig;
  }

  getQuestions() {
    return this.questions;
  }

  getAnswers() {
    return this.answers;
  }

  getPositions() {
    return this.positions;
  }

  getMeta() {
    return this.meta;
  }

  setAnswer(position, answer) {
    this.answers[position] = answer;
  }

  clearAnswer(position) {
    delete this.answers[position];
  }

  /**
   * Atualiza a interface com a nota TRI calculada
   * @param {Object} triResult - Resultado do cálculo TRI
   */
  updateTRIScoresDisplay(triResult) {
    console.log(
      "🎯 updateTRIScoresDisplay: INICIANDO atualização da interface"
    );

    if (!triResult) {
      console.log(
        "❌ updateTRIScoresDisplay: Nenhum resultado TRI para exibir"
      );
      return;
    }

    console.log(
      "✅ updateTRIScoresDisplay: Resultado TRI recebido:",
      triResult
    );

    // Função para tentar atualizar a interface
    const tryUpdateInterface = () => {
      console.log("🔍 tryUpdateInterface: Procurando container geral...");

      const generalContainer = document.getElementById("general-stats-content");

      if (!generalContainer) {
        console.warn(
          "⚠️ updateTRIScoresDisplay: Container 'general-stats-content' não encontrado!"
        );
        return false;
      }

      console.log(
        "✅ tryUpdateInterface: Container encontrado:",
        generalContainer
      );

      // Remover seção anterior se existir
      const existingSection = generalContainer.querySelector(
        ".tri-scores-section"
      );
      if (existingSection) {
        console.log("🗑️ Removendo seção TRI anterior");
        existingSection.remove();
      }

      console.log("🎨 Criando nova seção TRI...");

      // Criar nova seção de nota TRI
      const triSection = document.createElement("div");
      triSection.className = "tri-scores-section";
      triSection.style.marginTop = "2rem";

      if (triResult.success) {
        // Sucesso: mostrar nota
        triSection.innerHTML = `
          <h4><i class="fa fa-calculator"></i> 🎯 Nota TRI Estimada</h4>
          <div class="tri-info-header">
            <p><strong>✨ Cálculo baseado no padrão de acertos</strong></p>
          </div>
          <div class="tri-score-display">
            <div class="score-card single-area">
              <div class="score-area">🎯 ${triResult.areaName}</div>
              <div class="score-value">${triResult.score.toFixed(1)}</div>
              <div class="score-subtitle">pontos TRI</div>
            </div>
          </div>
          <div class="calculation-details">
            <h5><i class="fa fa-info-circle"></i> 📋 Detalhes do Cálculo</h5>
            <ul>
              <li><strong>📅 Ano:</strong> ${triResult.year}</li>
              <li><strong>📚 Área:</strong> ${triResult.areaName}</li>
              <li><strong>🎯 Modelo:</strong> ${
                triResult.modelKey || "Padrão"
              }</li>
            </ul>
          </div>
        `;
      } else {
        // Erro: mostrar mensagem de erro
        triSection.innerHTML = `
          <h4><i class="fa fa-exclamation-triangle"></i> ⚠️ Nota TRI</h4>
          <div class="tri-error-display">
            <div class="error-card">
              <div class="error-area">🎯 ${triResult.areaName}</div>
              <div class="error-message">${triResult.error}</div>
            </div>
          </div>
        `;
      }

      generalContainer.appendChild(triSection);
      console.log("✅ Seção TRI adicionada ao container");

      console.log(
        "🎉 updateTRIScoresDisplay: Interface TRI atualizada com SUCESSO!"
      );

      // Adicionar destaque visual temporário
      triSection.style.border = triResult.success
        ? "3px solid #28a745"
        : "3px solid #dc3545";
      triSection.style.boxShadow = triResult.success
        ? "0 0 20px rgba(40, 167, 69, 0.3)"
        : "0 0 20px rgba(220, 53, 69, 0.3)";

      setTimeout(() => {
        triSection.style.border = "2px solid var(--primary-color)";
        triSection.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.1)";
      }, 2000);

      return true;
    };

    // Tentar atualizar imediatamente
    console.log("🚀 Tentando atualizar interface TRI imediatamente...");
    if (!tryUpdateInterface()) {
      console.log("⏳ Primeira tentativa falhou, aguardando 500ms...");
      // Se falhar, aguardar um pouco e tentar novamente
      setTimeout(() => {
        console.log("🔄 Segunda tentativa...");
        if (!tryUpdateInterface()) {
          console.log("⏳ Segunda tentativa falhou, aguardando 1000ms...");
          // Última tentativa após mais tempo
          setTimeout(() => {
            console.log("🔄 Última tentativa...");
            if (tryUpdateInterface()) {
              console.log("✅ Interface TRI atualizada na terceira tentativa!");
            } else {
              console.error(
                "❌ FALHA: Não foi possível atualizar interface TRI após 3 tentativas"
              );
            }
          }, 1000);
        } else {
          console.log("✅ Interface TRI atualizada na segunda tentativa!");
        }
      }, 500);
    } else {
      console.log("✅ Interface TRI atualizada na primeira tentativa!");
    }
  }

  /**
   * Método auxiliar para garantir que a nota TRI seja exibida na aba geral
   * Pode ser chamado a qualquer momento após o cálculo
   */
  ensureTRIScoresDisplay() {
    if (this.triResult) {
      console.log(
        "🔄 ensureTRIScoresDisplay: Re-aplicando nota TRI na interface"
      );
      this.updateTRIScoresDisplay(this.triResult);
    } else {
      console.log("ℹ️ ensureTRIScoresDisplay: Nenhuma nota TRI disponível");
    }
  }

  /**
   * Função de debug para analisar modelos TRI disponíveis
   * Pode ser chamada via console: app.debugTRIModels()
   */
  debugTRIModels() {
    console.log("🔍 Analisando disponibilidade dos modelos TRI...");
    const report = this.scoreCalculator.generateMissingModelsReport();
    console.log(report);

    // Também retornar o objeto estruturado para análise
    const analysis = this.scoreCalculator.analyzeModelAvailability();
    console.log("📊 Dados estruturados:", analysis);

    return analysis;
  }

  /**
   * Função de debug para testar um modelo específico
   * @param {number} year - Ano
   * @param {string} area - Área (CH, CN, MT, LC0, LC1)
   */
  async debugTestModel(year, area) {
    console.log(`🧪 Testando modelo ${year} - ${area}...`);

    // Mapear área para parâmetros do modelo
    let targetArea = area;
    let language = null;

    if (area === "LC0") {
      targetArea = "LC";
      language = "0";
    } else if (area === "LC1") {
      targetArea = "LC";
      language = "1";
    }

    try {
      const modelExists = await this.scoreCalculator.modelExists(
        year,
        targetArea,
        language
      );
      console.log(`📄 Modelo existe: ${modelExists}`);

      if (modelExists) {
        const model = await this.scoreCalculator.loadModel(
          year,
          targetArea,
          language
        );
        console.log(`✅ Modelo carregado:`, model ? "Sucesso" : "Falhou");

        if (model) {
          // Testar com um padrão de exemplo
          const testPattern = new Array(45)
            .fill(0)
            .map(() => (Math.random() > 0.5 ? 1 : 0));
          const score = model.predictWithArray
            ? model.predictWithArray(testPattern)
            : model.predict(testPattern);
          console.log(`🎯 Teste de predição: ${score}`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao testar modelo:`, error);
    }
  }

  // Getters para os módulos acessarem os dados
  getCurrentConfig() {
    return this.currentConfig;
  }

  getQuestions() {
    return this.questions;
  }

  getAnswers() {
    return this.answers;
  }

  getPositions() {
    return this.positions;
  }

  getMeta() {
    return this.meta;
  }

  getTRIScores() {
    return this.triResult;
  }
}
