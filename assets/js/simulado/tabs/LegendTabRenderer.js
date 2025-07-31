import { BaseTabRenderer } from "./BaseTabRenderer.js";

export class LegendTabRenderer extends BaseTabRenderer {
  constructor(app) {
    super(app);
  }

  render() {
    const container = document.getElementById("legend-container");
    if (!container) return;

    container.innerHTML = this.renderLegend();
  }

  renderLegend() {
    return `
      <div class="legend-content">
        <h4><i class="fa fa-info-circle"></i> Legenda e Informações</h4>
        
        <div class="legend-sections">
          
          <div class="legend-section">
            <h5><i class="fa fa-palette"></i> Cores dos Status</h5>
            <div class="legend-items">
              <div class="legend-item">
                <span class="legend-color answer-correct"></span>
                <span class="legend-text">Resposta Correta</span>
              </div>
              <div class="legend-item">
                <span class="legend-color answer-wrong"></span>
                <span class="legend-text">Resposta Incorreta</span>
              </div>
              <div class="legend-item">
                <span class="legend-color answer-blank"></span>
                <span class="legend-text">Questão Não Respondida</span>
              </div>
              <div class="legend-item">
                <span class="legend-color answer-cancelled"></span>
                <span class="legend-text">Questão Anulada (Não Respondida)</span>
              </div>
              <div class="legend-item">
                <span class="legend-color answer-cancelled-answered"></span>
                <span class="legend-text">Questão Anulada (Respondida)</span>
              </div>
            </div>
          </div>

          <div class="legend-section">
            <h5><i class="fa fa-graduation-cap"></i> Áreas do Conhecimento</h5>
            <div class="legend-items">
              <div class="legend-item">
                <span class="legend-icon"><i class="fa fa-language"></i></span>
                <span class="legend-text"><strong>LC:</strong> Linguagens, Códigos e suas Tecnologias</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon"><i class="fa fa-users"></i></span>
                <span class="legend-text"><strong>CH:</strong> Ciências Humanas e suas Tecnologias</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon"><i class="fa fa-atom"></i></span>
                <span class="legend-text"><strong>CN:</strong> Ciências da Natureza e suas Tecnologias</span>
              </div>
              <div class="legend-item">
                <span class="legend-icon"><i class="fa fa-calculator"></i></span>
                <span class="legend-text"><strong>MT:</strong> Matemática e suas Tecnologias</span>
              </div>
            </div>
          </div>

          <div class="legend-section">
            <h5><i class="fa fa-signal"></i> Níveis de Dificuldade (TRI)</h5>
            <div class="legend-items">
              <div class="legend-item">
                <span class="legend-difficulty very-easy"></span>
                <span class="legend-text"><strong>Muito Fácil:</strong> Abaixo de 550 pontos</span>
              </div>
              <div class="legend-item">
                <span class="legend-difficulty easy"></span>
                <span class="legend-text"><strong>Fácil:</strong> 550 a 649 pontos</span>
              </div>
              <div class="legend-item">
                <span class="legend-difficulty medium"></span>
                <span class="legend-text"><strong>Médio:</strong> 650 a 749 pontos</span>
              </div>
              <div class="legend-item">
                <span class="legend-difficulty hard"></span>
                <span class="legend-text"><strong>Difícil:</strong> 750 a 849 pontos</span>
              </div>
              <div class="legend-item">
                <span class="legend-difficulty very-hard"></span>
                <span class="legend-text"><strong>Muito Difícil:</strong> 850 pontos ou mais</span>
              </div>
            </div>
          </div>

          <div class="legend-section">
            <h5><i class="fa fa-chart-bar"></i> Análise de Padrões</h5>
            <div class="legend-items">
              <div class="legend-item">
                <span class="legend-pattern">
                  <span class="bit bit-1">1</span>
                  <span class="bit bit-0">0</span>
                  <span class="bit bit-C">C</span>
                </span>
                <span class="legend-text">
                  <strong>String de Respostas:</strong> 1 = Correto, 0 = Incorreto, C = Anulada
                </span>
              </div>
              <div class="legend-item">
                <span class="legend-icon"><i class="fa fa-chart-line"></i></span>
                <span class="legend-text">
                  <strong>Sequências:</strong> Padrões consecutivos de acertos e erros
                </span>
              </div>
              <div class="legend-item">
                <span class="legend-icon"><i class="fa fa-chart-pie"></i></span>
                <span class="legend-text">
                  <strong>Frequência:</strong> Distribuição de escolhas por alternativa
                </span>
              </div>
            </div>
          </div>

          <div class="legend-section">
            <h5><i class="fa fa-question-circle"></i> Questões Anuladas</h5>
            <div class="legend-description">
              <p>
                <strong>Questões anuladas</strong> são questões que foram invalidadas pelo INEP por 
                problemas no enunciado, alternativas ou gabarito. No sistema:
              </p>
              <ul>
                <li>Se você <strong>respondeu</strong> uma questão anulada, ela conta como <strong>correta</strong></li>
                <li>Se você <strong>não respondeu</strong> uma questão anulada, ela conta como <strong>incorreta</strong></li>
                <li>Questões anuladas aparecem com gabarito "ANULADA" no cartão de respostas</li>
                <li>O cálculo da taxa de acerto considera questões anuladas respondidas como corretas</li>
              </ul>
            </div>
          </div>

          <div class="legend-section">
            <h5><i class="fa fa-calculator"></i> Cálculos Estatísticos</h5>
            <div class="legend-description">
              <p><strong>Taxa de Acerto:</strong> (Questões Corretas ÷ Total de Questões) × 100</p>
              <p><strong>Aproveitamento por Área:</strong> (Corretas na Área ÷ Total na Área) × 100</p>
              <p><strong>Dificuldade TRI:</strong> Escala de 100 × B + 500, onde B é o parâmetro de dificuldade</p>
              <p><strong>Tendência Temporal:</strong> Comparação do desempenho entre início, meio e fim da prova</p>
            </div>
          </div>

          <div class="legend-section">
            <h5><i class="fa fa-lightbulb"></i> Dicas de Interpretação</h5>
            <div class="legend-description">
              <ul>
                <li><strong>Alta frequência em uma alternativa:</strong> Pode indicar "chute direcionado"</li>
                <li><strong>Muitas sequências de erros:</strong> Possível dificuldade com o conteúdo específico</li>
                <li><strong>Desempenho decrescente:</strong> Pode indicar fadiga ou pressão do tempo</li>
                <li><strong>Desempenho crescente:</strong> Indica adaptação e concentração durante a prova</li>
                <li><strong>Baixo desempenho em questões fáceis:</strong> Foque na revisão de conceitos básicos</li>
                <li><strong>Bom desempenho em questões difíceis:</strong> Continue aprofundando o conhecimento</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
