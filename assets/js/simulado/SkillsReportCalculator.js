// Calculador de relatórios por habilidades
export class SkillsReportCalculator {
  constructor(app) {
    this.app = app;
    this.skillsDescriptions = {};
    this.loadSkillsDescriptions();
  }

  async loadSkillsDescriptions() {
    try {
      const response = await fetch("./skills-descriptions.json");
      if (response.ok) {
        this.skillsDescriptions = await response.json();
      } else {
        this.skillsDescriptions = this.getDefaultSkillsDescriptions();
      }
    } catch (error) {
      console.warn(
        "Erro ao carregar descrições de habilidades, usando padrão:",
        error
      );
      this.skillsDescriptions = this.getDefaultSkillsDescriptions();
    }
  }

  calculateSkillsReport() {
    const questions = this.app.getQuestions();
    const answers = this.app.getAnswers();
    const meta = this.app.getMeta();
    const config = this.app.getCurrentConfig();

    if (!questions.length || !meta[config.year]) {
      return this.getEmptyReport();
    }

    const skillsData = {};

    // Processar cada questão
    questions.forEach((question) => {
      const area = question.area;

      // CORREÇÃO: Pular questões anuladas - elas não têm habilidade conhecida
      // Se uma questão foi marcada como anulada, é porque não está no meta.json
      // Portanto, não faz sentido tentar processá-la para relatório de habilidades
      if (question.cancelled) {
        console.log(
          `⏭️ Questão ${question.position} (${area}) pulada - questão anulada (sem habilidade conhecida)`
        );
        return;
      }

      // Usar a posição mapeada (originalPosition) que já foi calculada pelo PositionMapper
      const mappedPosition = question.originalPosition;

      // Verificar se existe metadados para esta questão (usar posição mapeada da prova azul)
      if (
        !mappedPosition ||
        !meta[config.year][area] ||
        !meta[config.year][area][mappedPosition]
      ) {
        console.warn(
          `Metadados não encontrados para questão ${question.position} (${area}) → posição mapeada: ${mappedPosition}`
        );
        return;
      }

      const questionMeta = meta[config.year][area][mappedPosition];
      const hability = questionMeta.hability;

      if (!hability) {
        console.warn(
          `Habilidade não encontrada para questão ${question.position} (${area}) → posição mapeada: ${mappedPosition}`
        );
        return;
      }

      console.log(
        `📚 Questão ${question.position} (${area}) → posição ${mappedPosition} → H${hability}`
      );

      if (!hability) return;

      // Inicializar área se não existir
      if (!skillsData[area]) {
        skillsData[area] = {};
      }

      // Inicializar habilidade se não existir
      if (!skillsData[area][hability]) {
        skillsData[area][hability] = {
          total: 0,
          correct: 0,
          wrong: 0,
          cancelled: 0,
          questions: [],
        };
      }

      const skillData = skillsData[area][hability];
      skillData.total++;
      skillData.questions.push(question);

      // Como questões anuladas foram filtradas antes, todas as questões aqui são válidas
      const correctAnswer =
        this.app.questionGenerator.getCorrectAnswer(question);
      const userAnswer = answers[question.position];

      if (userAnswer && userAnswer === correctAnswer) {
        skillData.correct++;
      } else if (userAnswer) {
        // Só conta como erro se o usuário respondeu algo
        skillData.wrong++;
      }
      // Se não respondeu nada (userAnswer é undefined/null), não conta nem como certo nem como errado
    });

    return this.processSkillsData(skillsData);
  }

  processSkillsData(skillsData) {
    const processedData = {};

    Object.keys(skillsData).forEach((area) => {
      processedData[area] = {
        name: this.getAreaName(area),
        icon: this.getAreaIcon(area),
        skills: {},
      };

      Object.keys(skillsData[area]).forEach((hability) => {
        const skillData = skillsData[area][hability];

        // CORREÇÃO: Como questões anuladas não são mais processadas,
        // todas as questões em skillData são válidas
        // Calcular porcentagem sobre questões válidas (questões em branco penalizam)
        const validQuestions = skillData.total; // Todas são válidas agora
        const percentage =
          validQuestions > 0
            ? Math.round((skillData.correct / validQuestions) * 100)
            : 0;

        processedData[area].skills[hability] = {
          code: `H${hability}`,
          total: skillData.total,
          correct: skillData.correct,
          wrong: skillData.wrong,
          cancelled: skillData.cancelled, // Sempre será 0 agora
          percentage: percentage,
          performance: this.getPerformanceLevel(percentage),
          description: this.getSkillDescription(area, hability),
          questions: skillData.questions,
        };
      });
    });

    return processedData;
  }

  getPerformanceLevel(percentage) {
    if (percentage >= 80) return "excellent";
    if (percentage >= 65) return "good";
    if (percentage >= 50) return "average";
    return "poor";
  }

  getAreaName(area) {
    const names = {
      LC0: "Linguagens - Inglês",
      LC1: "Linguagens - Espanhol",
      CH: "Ciências Humanas",
      CN: "Ciências da Natureza",
      MT: "Matemática",
    };
    return names[area] || area;
  }

  getAreaIcon(area) {
    const icons = {
      LC0: "fa-language",
      LC1: "fa-language",
      CH: "fa-users",
      CN: "fa-flask",
      MT: "fa-calculator",
    };
    return icons[area] || "fa-book";
  }

  getSkillDescription(area, hability) {
    const key = `${area}_H${hability}`;
    return (
      this.skillsDescriptions[key] ||
      `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
    );
  }

  getDefaultSkillsDescriptions() {
    // Fallback case - descrições básicas
    return {
      MT_H1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Construir significados para os números.",
      MT_H2:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Utilizar o conhecimento geométrico.",
      CH_H1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Compreender os elementos culturais.",
      CH_H2:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Compreender as transformações dos espaços geográficos.",
      LC0_H1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aplicar as tecnologias da comunicação.",
      LC0_H2:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Conhecer e usar língua(s) estrangeira(s) moderna(s).",
      LC1_H1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aplicar as tecnologias da comunicação.",
      LC1_H2:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Conhecer e usar língua(s) estrangeira(s) moderna(s).",
      CN_H1:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Reconhecer características ou propriedades.",
      CN_H2:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Identificar a presença e aplicar as tecnologias.",
    };
  }

  getEmptyReport() {
    return {};
  }

  renderSkillsReport(skillsData) {
    const container = document.getElementById("skills-container");

    if (!container) return;

    if (Object.keys(skillsData).length === 0) {
      container.innerHTML = `
        <div class="no-skills-message">
          <i class="fa fa-info-circle"></i>
          <p>Nenhum dado de habilidade disponível para este simulado.</p>
        </div>
      `;
      return;
    }

    let html = "";

    Object.keys(skillsData).forEach((area) => {
      const areaData = skillsData[area];
      const skills = Object.keys(areaData.skills);

      if (skills.length === 0) return;

      html += `
        <div class="area-skills">
          <h4>
            <i class="fa ${areaData.icon} area-icon"></i>
            ${areaData.name}
          </h4>
          <div class="skills-grid">
      `;

      skills
        .sort((a, b) => parseInt(a) - parseInt(b))
        .forEach((hability) => {
          const skill = areaData.skills[hability];

          html += `
          <div class="skill-item" data-skill="${hability}">
            <div class="skill-header">
              <span class="skill-code">${skill.code}</span>
              <span class="skill-performance ${skill.performance}">${
            skill.percentage
          }%</span>
              <i class="fa fa-chevron-down skill-toggle" aria-hidden="true"></i>
            </div>
            
            <div class="skill-progress">
              <div class="progress-bar">
                <div class="progress-fill ${skill.performance}" style="width: ${
            skill.percentage
          }%"></div>
              </div>
            </div>
            
            <div class="skill-stats">
              <span>Acertos: ${skill.correct}/${skill.total}</span>
              <span>Erros: ${skill.wrong}</span>
              ${
                skill.cancelled > 0
                  ? `<span>Anuladas: ${skill.cancelled}</span>`
                  : ""
              }
            </div>
            
            <div class="skill-description" style="display: none;">
              <div class="description-content">
                <h5><i class="fa fa-info-circle"></i> Descrição da Habilidade</h5>
                <p>${skill.description}</p>
              </div>
            </div>
          </div>
        `;
        });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Adicionar event listeners para toggle das descrições
    container.addEventListener("click", (e) => {
      const skillItem = e.target.closest(".skill-item");
      if (skillItem) {
        const description = skillItem.querySelector(".skill-description");
        const toggle = skillItem.querySelector(".skill-toggle");

        if (description && toggle) {
          const isVisible = description.style.display !== "none";

          if (isVisible) {
            description.style.display = "none";
            toggle.classList.remove("fa-chevron-up");
            toggle.classList.add("fa-chevron-down");
            skillItem.classList.remove("expanded");
          } else {
            description.style.display = "block";
            toggle.classList.remove("fa-chevron-down");
            toggle.classList.add("fa-chevron-up");
            skillItem.classList.add("expanded");
          }
        }
      }
    });

    // Animar as barras de progresso
    setTimeout(() => {
      container.querySelectorAll(".progress-fill").forEach((bar) => {
        const width = bar.style.width;
        bar.style.width = "0%";
        setTimeout(() => {
          bar.style.width = width;
        }, 100);
      });
    }, 200);
  }
}
