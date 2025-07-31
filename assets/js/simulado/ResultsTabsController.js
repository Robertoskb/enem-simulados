import { GeneralTabRenderer } from "./tabs/GeneralTabRenderer.js";
import { DifficultyTabRenderer } from "./tabs/DifficultyTabRenderer.js";
import { PatternsTabRenderer } from "./tabs/PatternsTabRenderer.js";
import { AnswerSheetTabRenderer } from "./tabs/AnswerSheetTabRenderer.js";
import { LegendTabRenderer } from "./tabs/LegendTabRenderer.js";

// Controlador para as abas de resultados (refatorado)
export class ResultsTabsController {
  constructor(app) {
    this.app = app;
    this.currentTab = "geral";
    this.resultsData = null;

    // Inicializar renderizadores modulares
    try {
      this.renderers = {
        geral: new GeneralTabRenderer(app),
        habilidades: null, // Gerenciado pelo SkillsReportCalculator
        dificuldade: new DifficultyTabRenderer(app),
        padroes: new PatternsTabRenderer(app),
        gabarito: new AnswerSheetTabRenderer(app),
      };
    } catch (error) {
      console.error(
        "ResultsTabsController: Erro ao criar renderizadores:",
        error
      );
    }

    this.init();
  }

  init() {
    this.setupTabListeners();
  }

  setupTabListeners() {
    // Event delegation para os botões das abas
    document.addEventListener("click", (e) => {
      if (e.target.closest(".tab-button")) {
        const button = e.target.closest(".tab-button");
        const tabName = button.dataset.tab;
        this.switchTab(tabName);
      }
    });
  }

  switchTab(tabName) {
    // Remover active de todos os botões e painéis
    document.querySelectorAll(".tab-button").forEach((btn) => {
      btn.classList.remove("active");
    });

    document.querySelectorAll(".tab-panel").forEach((panel) => {
      panel.classList.remove("active");
    });

    // Ativar o botão e painel atual
    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    const activePanel = document.getElementById(`tab-${tabName}`);

    if (activeButton && activePanel) {
      activeButton.classList.add("active");
      activePanel.classList.add("active");
      this.currentTab = tabName;

      // Renderizar conteúdo específico da aba se necessário
      this.renderTabContent(tabName);
    }
  }

  renderTabContent(tabName) {
    console.log(`🎯 ResultsTabsController: renderTabContent('${tabName}')`, {
      hasResultsData: !!this.resultsData,
      renderer: !!this.renderers[tabName],
    });

    // Check for results data
    if (!this.resultsData) {
      console.warn(
        "ResultsTabsController: Dados de resultado não disponíveis para aba:",
        tabName
      );
      return;
    }

    // Usar renderizadores modulares
    const renderer = this.renderers[tabName];
    if (renderer) {
      try {
        renderer.render(this.resultsData);
      } catch (error) {
        console.error(`Erro ao renderizar aba ${tabName}:`, error);
      }
    } else if (tabName === "habilidades") {
      // A aba habilidades é gerenciada pelo SkillsReportCalculator
      // Não precisa fazer nada aqui pois já foi renderizada
    } else {
      console.warn(`Renderer não encontrado para aba: ${tabName}`);
    }
  }

  updateResults(resultsData) {
    this.resultsData = resultsData;

    // Renderizar conteúdo da aba atual
    this.renderTabContent(this.currentTab);
  }

  // Método utilitário para obter cores das áreas (mantido para compatibilidade)
  getAreaColor(area) {
    const colors = {
      LC: "#4e79a7",
      LC0: "#4e79a7",
      LC1: "#f28e2c",
      CH: "#e15759",
      CN: "#76b7b2",
      MT: "#59a14f",
    };

    return colors[area] || "#e2e3e5";
  }
}
