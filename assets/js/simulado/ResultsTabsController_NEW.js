import { GeneralTabRenderer } from "./tabs/GeneralTabRenderer.js";
import { AreasTabRenderer } from "./tabs/AreasTabRenderer.js";
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
    this.renderers = {
      geral: new GeneralTabRenderer(app),
      areas: new AreasTabRenderer(app),
      dificuldade: new DifficultyTabRenderer(app),
      padroes: new PatternsTabRenderer(app),
      gabarito: new AnswerSheetTabRenderer(app),
      legenda: new LegendTabRenderer(app),
    };

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
    if (!this.resultsData) return;

    // Usar renderizadores modulares
    const renderer = this.renderers[tabName];
    if (renderer) {
      renderer.render();
    } else {
      // Fallback para abas não modularizadas ainda (como habilidades)
      switch (tabName) {
        case "habilidades":
          // Já é renderizada pelo SkillsReportCalculator
          break;
        default:
          console.warn(`Renderer não encontrado para aba: ${tabName}`);
      }
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
