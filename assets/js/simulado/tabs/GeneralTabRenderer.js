import { BaseTabRenderer } from "./BaseTabRenderer.js";

// Renderizador para a aba geral
export class GeneralTabRenderer extends BaseTabRenderer {
  render(resultsData) {
    console.log("📊 GeneralTabRenderer: Renderizando aba geral...");
    const container = document.getElementById("general-stats-content");
    if (!container) {
      console.error(
        "GeneralTabRenderer: Container 'general-stats-content' não encontrado"
      );
      return;
    }

    const { areaPatterns, examOrderPattern } = this.app.resultsCalculator;

    let html = `
      <div class="general-overview">
        <div class="stat-grid">
          <div class="stat-card">
            <h4><i class="fa fa-chart-line"></i> Padrão Geral</h4>
            <p class="pattern-preview">${examOrderPattern}</p>
            <small>Sequência: acertos (1), erros (0), anuladas (A)</small>
          </div>
          
          <div class="stat-card">
            <h4><i class="fa fa-percentage"></i> Taxa de Acerto</h4>
            <p class="percentage-big">${resultsData.performance}%</p>
            <small>${resultsData.correctAnswers} de ${
      resultsData.totalQuestions
    } questões</small>
            ${
              resultsData.cancelledQuestions > 0
                ? `<small class="cancelled-info">(incluindo ${resultsData.cancelledQuestions} questões anuladas)</small>`
                : ""
            }
          </div>
          
          <div class="stat-card">
            <h4><i class="fa fa-layer-group"></i> Áreas Avaliadas</h4>
            <p class="areas-count">${
              Object.keys(areaPatterns).filter(
                (area) => areaPatterns[area].length > 0
              ).length
            }</p>
            <small>Diferentes áreas do conhecimento</small>
          </div>
        </div>
      </div>
    `;

    // Preservar seção TRI existente antes de atualizar
    const existingTriSection = container.querySelector(".tri-scores-section");

    container.innerHTML = html;

    // Recolocar seção TRI se existia
    if (existingTriSection) {
      console.log("🔄 GeneralTabRenderer: Preservando seção TRI existente");
      container.appendChild(existingTriSection);
    } else {
      console.log(
        "ℹ️ GeneralTabRenderer: Nenhuma seção TRI encontrada para preservar"
      );
    }

    console.log("✅ GeneralTabRenderer: Renderização concluída");

    // Garantir que as notas TRI sejam exibidas após a renderização
    setTimeout(() => {
      if (this.app.ensureTRIScoresDisplay) {
        this.app.ensureTRIScoresDisplay();
      }
    }, 100);
  }
}
