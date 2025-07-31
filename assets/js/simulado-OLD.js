// Simulado JavaScript
class SimuladoApp {
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

    this.init();
  }

  async init() {
    await this.loadData();
    this.initEventListeners();
    this.loadYearButtons();
    this.updateColorSelection(null); // Inicializar com mensagem
    this.initTheme();
  }

  async loadData() {
    try {
      // Carregando dados do positions.json
      console.log("Carregando positions.json...");
      const positionsResponse = await fetch("positions.json");

      if (!positionsResponse.ok) {
        throw new Error(`HTTP error! status: ${positionsResponse.status}`);
      }

      const positionsText = await positionsResponse.text();
      console.log("Positions carregado, tamanho:", positionsText.length);

      this.positions = JSON.parse(positionsText);
      console.log(
        "Positions parseado com sucesso. Anos disponíveis:",
        Object.keys(this.positions)
      );

      // Carregando dados do meta.json
      console.log("Carregando meta.json...");
      const metaResponse = await fetch("meta.json");

      if (!metaResponse.ok) {
        throw new Error(`HTTP error! status: ${metaResponse.status}`);
      }

      const metaText = await metaResponse.text();
      console.log("Meta carregado, tamanho:", metaText.length);

      this.meta = JSON.parse(metaText);
      console.log(
        "Meta parseado com sucesso. Anos disponíveis no meta:",
        Object.keys(this.meta)
      );
    } catch (error) {
      console.error("Erro ao carregar dados:", error);

      // Mostrar erro na interface
      const yearContainer = document.getElementById("year-selection");
      if (yearContainer) {
        yearContainer.innerHTML =
          '<p style="color: red;">Erro ao carregar dados. Verifique o console.</p>';
      }

      // Dados de fallback para teste
      this.positions = {
        2017: { LC0: {}, LC1: {}, CH: {}, CN: {}, MT: {} },
      };
      this.meta = {
        2017: { LC0: {}, LC1: {}, CH: {}, CN: {}, MT: {} },
      };
    }
  }

  initEventListeners() {
    // Toggle do menu
    const menuToggle = document.getElementById("menuToggleBtn");
    const sidebar = document.getElementById("sidebar");

    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", () => {
        if (sidebar.style.transform === "translateX(0px)") {
          sidebar.style.transform = "translateX(-250px)";
        } else {
          sidebar.style.transform = "translateX(0px)";
        }
      });
    }

    // Toggle do tema
    const toggleTheme = document.getElementById("toggleTheme");
    if (toggleTheme) {
      toggleTheme.addEventListener("click", this.toggleTheme.bind(this));
    }

    // Seleção de ano
    document.addEventListener("click", (e) => {
      const yearBtn = e.target.closest(".year-btn");
      if (yearBtn) {
        this.selectYear(yearBtn.dataset.year);
      }
    });

    // Seleção de tipo de prova
    document.addEventListener("click", (e) => {
      const examTypeBtn = e.target.closest(".exam-type-btn");
      if (examTypeBtn) {
        this.selectExamType(examTypeBtn.dataset.type);
      }
    });

    // Seleção de cor
    document.addEventListener("click", (e) => {
      const colorBtn = e.target.closest(".color-btn");
      if (colorBtn) {
        this.selectColor(colorBtn.dataset.color);
      }
    });

    // Seleção de idioma
    document.addEventListener("click", (e) => {
      const languageBtn = e.target.closest(".language-btn");
      if (languageBtn) {
        this.selectLanguage(languageBtn.dataset.language);
      }
    });

    // Iniciar simulado
    const startBtn = document.getElementById("start-simulado");
    if (startBtn) {
      startBtn.addEventListener("click", this.startSimulado.bind(this));
    }

    // Finalizar simulado
    const finishBtn = document.getElementById("finish-simulado");
    if (finishBtn) {
      finishBtn.addEventListener("click", this.finishSimulado.bind(this));
    }

    // Voltar para configuração
    const backBtn = document.getElementById("back-config");
    if (backBtn) {
      backBtn.addEventListener("click", this.backToConfig.bind(this));
    }

    // Novo simulado
    const newSimuladoBtn = document.getElementById("new-simulado");
    if (newSimuladoBtn) {
      newSimuladoBtn.addEventListener("click", this.newSimulado.bind(this));
    }

    // Revisar respostas
    const reviewBtn = document.getElementById("review-answers");
    if (reviewBtn) {
      reviewBtn.addEventListener("click", this.reviewAnswers.bind(this));
    }

    // Suporte para ESC fechar modais
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
      }
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  }

  loadYearButtons() {
    const yearContainer = document.getElementById("year-selection");
    const years = Object.keys(this.positions).sort((a, b) => b - a);

    yearContainer.innerHTML = "";
    years.forEach((year) => {
      const button = document.createElement("button");
      button.className = "year-btn";
      button.dataset.year = year;
      button.textContent = year;
      yearContainer.appendChild(button);
    });
  }

  selectYear(year) {
    // Remove seleção anterior
    document.querySelectorAll(".year-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    // Adiciona seleção atual
    document.querySelector(`[data-year="${year}"]`).classList.add("selected");
    this.currentConfig.year = year;

    // Atualizar cores disponíveis para este ano
    this.updateColorSelection(year);

    this.updateStartButton();
  }

  getAvailableColors(year, examType = null, language = null) {
    if (!this.positions[year]) return [];

    // Determinar quais áreas verificar baseado no tipo de prova
    let areasToCheck = [];
    if (examType) {
      const range = this.getQuestionRanges(examType);
      areasToCheck = range.areas;

      // Para dia1, usar o idioma específico selecionado
      if (examType === "dia1" && language) {
        areasToCheck = [language, "CH"]; // LC0 ou LC1 + CH
      } else if (examType === "dia1") {
        // Se não tem idioma ainda, usar LC0 como padrão para buscar cores
        areasToCheck = ["LC0", "CH"];
      }
    } else {
      // Se não especificado, usar todas as áreas disponíveis
      areasToCheck = Object.keys(this.positions[year]);
    }

    if (areasToCheck.length === 0) return [];

    // Pegar as cores da primeira área que tem dados
    const firstAreaWithData = areasToCheck.find((area) => {
      const areaData = this.positions[year][area];
      return areaData && Object.keys(areaData).length > 0;
    });

    if (!firstAreaWithData) return [];

    const firstQuestion = Object.keys(
      this.positions[year][firstAreaWithData]
    )[0];
    const questionData = this.positions[year][firstAreaWithData][firstQuestion];

    return Object.keys(questionData);
  }

  updateColorSelection(year, examType = null, language = null) {
    const colorContainer = document.querySelector(".color-selection");
    if (!colorContainer) return;

    if (!year) {
      colorContainer.innerHTML =
        '<p style="color: var(--muted-color); font-style: italic;">Selecione um ano primeiro</p>';
      return;
    }

    // Se é dia1 e não tem idioma selecionado ainda, mostrar mensagem
    if (examType === "dia1" && !language) {
      colorContainer.innerHTML =
        '<p style="color: var(--muted-color); font-style: italic;">Selecione o idioma primeiro</p>';
      return;
    }

    const availableColors = this.getAvailableColors(year, examType, language);

    if (availableColors.length === 0) {
      colorContainer.innerHTML =
        '<p style="color: var(--muted-color); font-style: italic;">Nenhuma cor disponível para este ano</p>';
      return;
    }

    // Mapeamento de cores para display
    const colorInfo = {
      AZUL: { name: "Azul", class: "blue", value: "azul" },
      AMARELA: { name: "Amarela", class: "yellow", value: "amarela" },
      BRANCA: { name: "Branca", class: "white", value: "branca" },
      ROSA: { name: "Rosa", class: "pink", value: "rosa" },
      VERDE: { name: "Verde", class: "green", value: "verde" },
      CINZA: { name: "Cinza", class: "gray", value: "cinza" },
    };

    colorContainer.innerHTML = "";

    availableColors.forEach((color) => {
      if (colorInfo[color]) {
        const info = colorInfo[color];
        const button = document.createElement("button");
        button.className = "color-btn";
        button.dataset.color = info.value;
        button.innerHTML = `
                <div class="color-circle ${info.class}"></div>
                <span style="pointer-events: none;">${info.name}</span>
            `;
        colorContainer.appendChild(button);
      }
    });

    // Limpar seleção anterior de cor se não estiver disponível
    if (this.currentConfig.color) {
      const colorMapping = {
        azul: "AZUL",
        amarela: "AMARELA",
        branca: "BRANCA",
        rosa: "ROSA",
        verde: "VERDE",
        cinza: "CINZA",
      };

      const selectedColorKey = colorMapping[this.currentConfig.color];
      if (!availableColors.includes(selectedColorKey)) {
        this.currentConfig.color = null;
        this.updateStartButton();
      }
    }
  }

  selectExamType(type) {
    // Remove seleção anterior
    document.querySelectorAll(".exam-type-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    // Adiciona seleção atual
    document.querySelector(`[data-type="${type}"]`).classList.add("selected");
    this.currentConfig.type = type;

    // Mostrar/esconder seleção de idioma
    const languageSection = document.getElementById("language-section");
    if (type === "dia1") {
      languageSection.style.display = "block";
      // Resetar seleção de idioma
      this.currentConfig.language = null;
      document.querySelectorAll(".language-btn").forEach((btn) => {
        btn.classList.remove("selected");
      });
    } else {
      languageSection.style.display = "none";
      this.currentConfig.language = null;
    }

    // Atualizar cores disponíveis para este tipo de prova
    if (this.currentConfig.year) {
      this.updateColorSelection(this.currentConfig.year, type);
    }

    this.updateStartButton();
  }

  selectColor(color) {
    // Remove seleção anterior
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    // Adiciona seleção atual
    document.querySelector(`[data-color="${color}"]`).classList.add("selected");
    this.currentConfig.color = color;
    this.updateStartButton();
  }

  selectLanguage(language) {
    // Remove seleção anterior
    document.querySelectorAll(".language-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    // Adiciona seleção atual
    document
      .querySelector(`[data-language="${language}"]`)
      .classList.add("selected");
    this.currentConfig.language = language;

    // Atualizar cores disponíveis baseado no idioma selecionado
    if (this.currentConfig.year) {
      this.updateColorSelection(
        this.currentConfig.year,
        this.currentConfig.type,
        language
      );
    }

    this.updateStartButton();
  }

  updateStartButton() {
    const startBtn = document.getElementById("start-simulado");

    let isValid =
      this.currentConfig.year &&
      this.currentConfig.type &&
      this.currentConfig.color;

    // Para dia1, também precisa ter idioma selecionado
    if (this.currentConfig.type === "dia1") {
      isValid = isValid && this.currentConfig.language;
    }

    startBtn.disabled = !isValid;
  }

  getQuestionRanges(type) {
    const ranges = {
      LC0: { start: 1, end: 45, areas: ["LC0"] },
      LC1: { start: 1, end: 45, areas: ["LC1"] },
      CH: { start: 46, end: 90, areas: ["CH"] },
      CN: { start: 91, end: 135, areas: ["CN"] },
      MT: { start: 136, end: 180, areas: ["MT"] },
      dia1: { start: 1, end: 90, areas: ["LC0", "LC1", "CH"] }, // Permitir escolha entre LC0 ou LC1
      dia2: { start: 91, end: 180, areas: ["CN", "MT"] },
    };

    return ranges[type] || ranges["LC0"];
  }

  generateQuestions() {
    const range = this.getQuestionRanges(this.currentConfig.type);
    const yearData = this.positions[this.currentConfig.year];

    // Mapear nomes das cores para o formato do JSON
    const colorMapping = {
      azul: "AZUL",
      amarela: "AMARELA",
      branca: "BRANCA",
      rosa: "ROSA",
      verde: "VERDE",
      cinza: "CINZA",
    };

    const color = colorMapping[this.currentConfig.color];

    this.questions = [];
    this.answers = {};

    // Para dia1, usar o idioma selecionado
    let areas = range.areas;
    if (this.currentConfig.type === "dia1") {
      if (this.currentConfig.language) {
        areas = [this.currentConfig.language, "CH"]; // LC0 ou LC1 + CH
      } else {
        // Fallback para LC0 se não especificado
        areas = ["LC0", "CH"];
      }
    }

    // Mapear posições baseado na cor da prova
    for (let pos = range.start; pos <= range.end; pos++) {
      let questionArea = null;
      let realPosition = null;

      // Determinar a área baseada na posição
      if (pos >= 1 && pos <= 45) {
        questionArea = areas.includes("LC0")
          ? "LC0"
          : areas.includes("LC1")
          ? "LC1"
          : null;
      } else if (pos >= 46 && pos <= 90) {
        questionArea = "CH";
      } else if (pos >= 91 && pos <= 135) {
        questionArea = "CN";
      } else if (pos >= 136 && pos <= 180) {
        questionArea = "MT";
      }

      // Verificar se a área está incluída no tipo de prova
      if (questionArea && areas.includes(questionArea)) {
        let hasValidPosition = false;

        // Buscar a posição real baseada na cor da prova
        if (yearData && yearData[questionArea]) {
          // Procurar qual questão original corresponde a esta posição na cor selecionada
          for (const [originalPos, colorMapping] of Object.entries(
            yearData[questionArea]
          )) {
            if (colorMapping[color] === pos) {
              realPosition = parseInt(originalPos);
              hasValidPosition = true;
              break;
            }
          }
        }

        // Uma questão é anulada se:
        // 1. Não tem mapeamento no positions.json para esta cor, OU
        // 2. Não tem dados no meta.json (se meta.json estiver disponível para este ano/área)
        let isCancelled = !hasValidPosition;

        if (
          hasValidPosition &&
          this.meta[this.currentConfig.year] &&
          this.meta[this.currentConfig.year][questionArea]
        ) {
          // Se meta.json está disponível para esta área, verificar se a questão existe
          const metaData =
            this.meta[this.currentConfig.year][questionArea][realPosition];
          if (!metaData) {
            isCancelled = true;
            console.log(
              `Questão ${realPosition} da área ${questionArea} anulada (não encontrada no meta.json)`
            );
          }
        }

        // Se não há posição real válida, a questão é definitivamente anulada
        if (!realPosition && hasValidPosition) {
          realPosition = pos; // Usar posição da prova como fallback
        }

        const question = {
          position: pos, // Posição na prova
          originalPosition: realPosition, // Posição original da questão
          area: questionArea,
          cancelled: isCancelled,
          color: this.currentConfig.color,
        };

        this.questions.push(question);
      }
    }

    // Ordenar por posição (ordem da prova)
    this.questions.sort((a, b) => a.position - b.position);

    console.log(
      `Geradas ${this.questions.length} questões, sendo ${
        this.questions.filter((q) => q.cancelled).length
      } anuladas`
    );
  }

  startSimulado() {
    this.generateQuestions();
    this.showSimuladoScreen();
    this.renderQuestions();
  }

  showSimuladoScreen() {
    document.getElementById("config-screen").style.display = "none";
    document.getElementById("simulado-screen").style.display = "block";
    document.getElementById("results-screen").style.display = "none";

    // Atualizar informações do cabeçalho
    document.getElementById(
      "simulado-year"
    ).textContent = `Ano: ${this.currentConfig.year}`;
    document.getElementById(
      "simulado-type"
    ).textContent = `Tipo: ${this.getTypeName(this.currentConfig.type)}`;
    document.getElementById(
      "simulado-color"
    ).textContent = `Cor: ${this.getColorName(this.currentConfig.color)}`;
  }

  getTypeName(type) {
    const names = {
      dia1: "1º Dia",
      dia2: "2º Dia",
      LC0: "LC - Inglês",
      LC1: "LC - Espanhol",
      CH: "Ciências Humanas",
      CN: "Ciências da Natureza",
      MT: "Matemática",
    };
    return names[type] || type;
  }

  getColorName(color) {
    const names = {
      azul: "Azul",
      amarela: "Amarela",
      branca: "Branca",
      rosa: "Rosa",
      verde: "Verde",
      cinza: "Cinza",
    };
    return names[color] || color;
  }

  renderQuestions() {
    const container = document.getElementById("questions-container");
    container.innerHTML = "";

    this.questions.forEach((question, index) => {
      const questionDiv = document.createElement("div");
      questionDiv.className = "question-card";

      const questionTitle = question.cancelled
        ? `Questão ${question.position} (ANULADA)`
        : `Questão ${question.position}`;

      const questionDescription = question.cancelled
        ? "Esta questão foi anulada. Qualquer alternativa marcada será considerada correta."
        : `${question.area} - Prova ${this.getColorName(question.color)}`;

      questionDiv.innerHTML = `
                <div class="question-header">
                    <div class="question-number">${questionTitle}</div>
                    ${
                      question.cancelled
                        ? '<div class="question-cancelled">ANULADA</div>'
                        : ""
                    }
                </div>
                <div class="question-text">
                    ${questionDescription}
                </div>
                <div class="alternatives">
                    ${["A", "B", "C", "D", "E"]
                      .map(
                        (letter) => `
                        <label class="alternative">
                            <input type="radio" name="question_${question.position}" value="${letter}">
                            <span class="alternative-letter">${letter}</span>
                            <span>Alternativa ${letter}</span>
                        </label>
                    `
                      )
                      .join("")}
                </div>
            `;

      // Adicionar event listeners para as alternativas
      questionDiv.querySelectorAll(".alternative").forEach((alternative) => {
        const radio = alternative.querySelector('input[type="radio"]');

        // Fazer toda a área da alternativa clicável
        alternative.addEventListener("click", (e) => {
          // Não fazer nada se já clicou no radio button
          if (e.target.type === "radio") return;

          // Marcar o radio button
          radio.checked = true;

          // Remover seleção visual anterior
          questionDiv.querySelectorAll(".alternative").forEach((alt) => {
            alt.classList.remove("selected");
          });

          // Adicionar seleção visual atual
          alternative.classList.add("selected");

          // Armazenar resposta
          this.answers[question.position] = radio.value;
        });

        // Event listener para o radio button também
        radio.addEventListener("change", (e) => {
          // Remover seleção visual anterior
          questionDiv.querySelectorAll(".alternative").forEach((alt) => {
            alt.classList.remove("selected");
          });

          // Adicionar seleção visual atual
          e.target.closest(".alternative").classList.add("selected");

          // Armazenar resposta
          this.answers[question.position] = e.target.value;
        });
      });

      container.appendChild(questionDiv);
    });
  }

  finishSimulado() {
    this.showFinishModal();
  }

  showFinishModal() {
    const modal = document.getElementById("finish-modal");
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    const cancelBtn = document.getElementById("finish-cancel");
    const confirmBtn = document.getElementById("finish-confirm");

    // Focus no botão cancelar por padrão
    setTimeout(() => cancelBtn.focus(), 100);

    const closeModal = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      setTimeout(() => (modal.style.display = "none"), 300);
    };

    cancelBtn.onclick = closeModal;

    confirmBtn.onclick = () => {
      closeModal();
      this.calculateResults();
      this.showResultsScreen();
    };

    // Fechar modal clicando fora
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };
  }

  calculateResults() {
    let totalQuestions = this.questions.length;
    let correctAnswers = 0;
    let cancelledQuestions = 0;

    // Padrões de acerto (para implementações futuras)
    let examOrderPattern = ""; // Padrão na ordem da prova
    let originalOrderPattern = ""; // Padrão na ordem original das questões
    let difficultyOrderPattern = ""; // Padrão ordenado por dificuldade
    let discriminationOrderPattern = ""; // Padrão ordenado por discriminação

    // Criar arrays para armazenar resultados com diferentes ordenações
    let resultsWithOriginalPos = [];
    let resultsWithDifficulty = [];
    let resultsWithDiscrimination = [];

    this.questions.forEach((question) => {
      let isCorrect = false;
      let isCancelled = question.cancelled;

      if (isCancelled) {
        cancelledQuestions++;
        // Questões anuladas sempre são 0 no padrão interno, mas não contam como erro para o usuário
        isCorrect = false; // Sempre 0 no padrão

        // Se o usuário respondeu uma questão anulada, conta como acerto para ele
        if (this.answers[question.position]) {
          correctAnswers++;
        }
      } else {
        // Para questões não anuladas, usar gabarito real
        const correctAnswer = this.getCorrectAnswer(question);
        const userAnswer = this.answers[question.position];

        if (userAnswer === correctAnswer) {
          correctAnswers++;
          isCorrect = true;
        }
      }

      // Padrão na ordem da prova
      examOrderPattern += isCorrect ? "1" : "0";

      // Buscar dados do meta para esta questão (se existir e não for anulada)
      let difficulty = null;
      let discrimination = null;

      if (
        !isCancelled &&
        this.meta[this.currentConfig.year] &&
        this.meta[this.currentConfig.year][question.area] &&
        this.meta[this.currentConfig.year][question.area][
          question.originalPosition
        ]
      ) {
        const metaData =
          this.meta[this.currentConfig.year][question.area][
            question.originalPosition
          ];
        difficulty = metaData.difficulty || null;
        discrimination = metaData.discrimination || null;
      }

      // Guardar para diferentes ordenações
      const resultData = {
        originalPosition: question.originalPosition || question.position,
        isCorrect: isCorrect,
        area: question.area,
        cancelled: isCancelled,
        difficulty: difficulty,
        discrimination: discrimination,
        position: question.position,
        examPosition: this.questions.indexOf(question), // Posição no array da prova
      };

      resultsWithOriginalPos.push(resultData);

      // Só adicionar nas ordenações de parâmetros se não for anulada
      if (!isCancelled) {
        resultsWithDifficulty.push(resultData);
        resultsWithDiscrimination.push(resultData);
      }
    });

    // Criar padrão ordenado por posição original (mantém posição das anuladas)
    const sortedByOriginal = [...resultsWithOriginalPos].sort(
      (a, b) => a.originalPosition - b.originalPosition
    );

    sortedByOriginal.forEach((result) => {
      originalOrderPattern += result.isCorrect ? "1" : "0";
    });

    // Criar padrão ordenado por dificuldade (questões válidas primeiro, anuladas no final)
    const sortedByDifficulty = [...resultsWithDifficulty].sort((a, b) => {
      // Se ambos têm dificuldade, ordenar por dificuldade
      if (a.difficulty !== null && b.difficulty !== null) {
        return a.difficulty - b.difficulty;
      }
      // Se só um tem dificuldade, o que tem vai primeiro
      if (a.difficulty !== null) return -1;
      if (b.difficulty !== null) return 1;
      // Se nenhum tem, ordenar por posição original
      return a.originalPosition - b.originalPosition;
    });

    sortedByDifficulty.forEach((result) => {
      difficultyOrderPattern += result.isCorrect ? "1" : "0";
    });

    // Adicionar zeros das questões anuladas no final do padrão de dificuldade
    const cancelledResults = resultsWithOriginalPos.filter((r) => r.cancelled);
    cancelledResults.forEach(() => {
      difficultyOrderPattern += "0";
    });

    // Criar padrão ordenado por discriminação (questões válidas primeiro, anuladas no final)
    const sortedByDiscrimination = [...resultsWithDiscrimination].sort(
      (a, b) => {
        // Se ambos têm discriminação, ordenar por discriminação
        if (a.discrimination !== null && b.discrimination !== null) {
          return a.discrimination - b.discrimination;
        }
        // Se só um tem discriminação, o que tem vai primeiro
        if (a.discrimination !== null) return -1;
        if (b.discrimination !== null) return 1;
        // Se nenhum tem, ordenar por posição original
        return a.originalPosition - b.originalPosition;
      }
    );

    sortedByDiscrimination.forEach((result) => {
      discriminationOrderPattern += result.isCorrect ? "1" : "0";
    });

    // Adicionar zeros das questões anuladas no final do padrão de discriminação
    cancelledResults.forEach(() => {
      discriminationOrderPattern += "0";
    });

    // Armazenar padrões para uso futuro
    this.examOrderPattern = examOrderPattern;
    this.originalOrderPattern = originalOrderPattern;
    this.difficultyOrderPattern = difficultyOrderPattern;
    this.discriminationOrderPattern = discriminationOrderPattern;

    // Criar padrões por área
    this.areaPatterns = {};
    const areas = ["LC0", "LC1", "CH", "CN", "MT"];
    areas.forEach((area) => {
      const areaResults = resultsWithOriginalPos
        .filter((r) => r.area === area)
        .sort((a, b) => a.originalPosition - b.originalPosition);

      this.areaPatterns[area] = areaResults
        .map((r) => (r.isCorrect ? "1" : "0"))
        .join("");
    });

    // Mapear posições das questões anuladas para diferentes ordenações
    this.cancelledPositions = {
      examOrder: resultsWithOriginalPos
        .map((r, index) => (r.cancelled ? r.examPosition : null))
        .filter((pos) => pos !== null),
      originalOrder: sortedByOriginal
        .map((r, index) => (r.cancelled ? index : null))
        .filter((pos) => pos !== null),
      difficultyOrder: Array.from(
        { length: cancelledResults.length },
        (_, i) => difficultyOrderPattern.length - cancelledResults.length + i
      ),
      discriminationOrder: Array.from(
        { length: cancelledResults.length },
        (_, i) =>
          discriminationOrderPattern.length - cancelledResults.length + i
      ),
    };

    // Calcular estatísticas (questões anuladas não contam como erro)
    const answeredQuestions = totalQuestions - cancelledQuestions;
    const wrongAnswers =
      answeredQuestions - (correctAnswers - cancelledQuestions);
    const performance =
      answeredQuestions > 0
        ? Math.round(
            ((correctAnswers - cancelledQuestions) / answeredQuestions) * 100
          )
        : 0;

    // Atualizar interface
    document.getElementById("total-questions").textContent = totalQuestions;
    document.getElementById("correct-answers").textContent = correctAnswers;
    document.getElementById("wrong-answers").textContent = wrongAnswers;
    document.getElementById("cancelled-questions").textContent =
      cancelledQuestions;
    document.getElementById("performance").textContent = `${performance}%`;

    // Log dos padrões para debug
    console.log("=== PADRÕES DE ACERTO (INTERNOS) ===");
    console.log("Ordem da prova:", examOrderPattern);
    console.log("Ordem original:", originalOrderPattern);
    console.log("Ordem por dificuldade:", difficultyOrderPattern);
    console.log("Ordem por discriminação:", discriminationOrderPattern);
    console.log("Padrões por área:", this.areaPatterns);
    console.log("Posições das anuladas:", this.cancelledPositions);
    console.log("=== ESTATÍSTICAS PARA O USUÁRIO ===");
    console.log(`Total de questões: ${totalQuestions}`);
    console.log(`Acertos (incluindo anuladas): ${correctAnswers}`);
    console.log(`Erros: ${wrongAnswers}`);
    console.log(`Anuladas: ${cancelledQuestions}`);
    console.log(`Performance: ${performance}%`);
  }

  getCorrectAnswer(question) {
    // Verificar se há gabarito real no meta.json
    if (
      this.meta[this.currentConfig.year] &&
      this.meta[this.currentConfig.year][question.area] &&
      this.meta[this.currentConfig.year][question.area][
        question.originalPosition
      ]
    ) {
      const metaData =
        this.meta[this.currentConfig.year][question.area][
          question.originalPosition
        ];

      // Usar o campo 'answer' como gabarito oficial
      if (metaData.answer) {
        console.log(
          `Questão ${question.originalPosition} (${question.area}): Gabarito oficial = ${metaData.answer}`
        );
        return metaData.answer;
      }
    }

    // Fallback: simular gabarito baseado na posição original
    // Este será usado apenas se não houver dados no meta.json
    const answers = ["A", "B", "C", "D", "E"];
    const position = question.originalPosition || question.position;
    return answers[position % 5];
  }

  showResultsScreen() {
    document.getElementById("config-screen").style.display = "none";
    document.getElementById("simulado-screen").style.display = "none";
    document.getElementById("results-screen").style.display = "block";
  }

  backToConfig() {
    this.showBackModal();
  }

  showBackModal() {
    const modal = document.getElementById("back-modal");
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    const cancelBtn = document.getElementById("back-cancel");
    const confirmBtn = document.getElementById("back-confirm");

    // Focus no botão cancelar por padrão
    setTimeout(() => cancelBtn.focus(), 100);

    const closeModal = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      setTimeout(() => (modal.style.display = "none"), 300);
    };

    cancelBtn.onclick = closeModal;

    confirmBtn.onclick = () => {
      closeModal();
      this.showConfigScreen();
      this.resetSimulado();
    };

    // Fechar modal clicando fora
    modal.onclick = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };
  }

  showConfigScreen() {
    document.getElementById("config-screen").style.display = "block";
    document.getElementById("simulado-screen").style.display = "none";
    document.getElementById("results-screen").style.display = "none";
  }

  newSimulado() {
    this.showConfigScreen();
    this.resetSimulado();
  }

  resetSimulado() {
    this.questions = [];
    this.answers = {};
    this.examOrderPattern = "";
    this.originalOrderPattern = "";
    this.difficultyOrderPattern = "";
    this.discriminationOrderPattern = "";
    this.areaPatterns = {};
    this.cancelledPositions = {};

    // Limpar seleções
    document.querySelectorAll(".selected").forEach((el) => {
      el.classList.remove("selected");
    });

    // Esconder seção de idioma
    const languageSection = document.getElementById("language-section");
    if (languageSection) {
      languageSection.style.display = "none";
    }

    this.currentConfig = {
      year: null,
      type: null,
      color: null,
      language: null,
    };

    this.updateStartButton();
  }

  reviewAnswers() {
    // Voltar para a tela do simulado em modo de revisão
    this.showSimuladoScreen();

    // Marcar as respostas dadas
    Object.keys(this.answers).forEach((position) => {
      const radio = document.querySelector(
        `input[name="question_${position}"][value="${this.answers[position]}"]`
      );
      if (radio) {
        radio.checked = true;
        radio.closest(".alternative").classList.add("selected");
      }
    });

    // Desabilitar todas as alternativas
    document.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.disabled = true;
    });

    // Alterar texto do botão de finalizar
    const finishBtn = document.getElementById("finish-simulado");
    finishBtn.innerHTML =
      '<i class="fa fa-arrow-left"></i> Voltar aos Resultados';
    finishBtn.onclick = () => this.showResultsScreen();
  }

  closeAllModals() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      setTimeout(() => (modal.style.display = "none"), 300);
    });
  }
}

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  new SimuladoApp();
});
