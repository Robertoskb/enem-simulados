// Controlador de interface do usuário
export class UIController {
  constructor(app) {
    this.app = app;
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

    // Event delegation para seleções
    document.addEventListener("click", (e) => {
      const yearBtn = e.target.closest(".year-btn");
      if (yearBtn) {
        this.selectYear(yearBtn.dataset.year);
        return;
      }

      const examTypeBtn = e.target.closest(".exam-type-btn");
      if (examTypeBtn) {
        this.selectExamType(examTypeBtn.dataset.type);
        return;
      }

      const colorBtn = e.target.closest(".color-btn");
      if (colorBtn) {
        this.selectColor(colorBtn.dataset.color);
        return;
      }

      const languageBtn = e.target.closest(".language-btn");
      if (languageBtn) {
        this.selectLanguage(languageBtn.dataset.language);
        return;
      }
    });

    // Botões principais
    this.setupMainButtons();
  }

  setupMainButtons() {
    const startBtn = document.getElementById("start-simulado");
    if (startBtn) {
      startBtn.addEventListener("click", () => this.app.startSimulado());
    }

    const viewSavedBtn = document.getElementById("view-saved-simulados");
    if (viewSavedBtn) {
      viewSavedBtn.addEventListener("click", () =>
        this.app.showSavedSimuladosList()
      );
    }

    const backToConfigBtn = document.getElementById("back-to-config");
    if (backToConfigBtn) {
      backToConfigBtn.addEventListener("click", () => this.showConfigScreen());
    }

    // Modal de exclusão de simulado
    const deleteModal = document.getElementById("delete-simulado-modal");
    const deleteCancelBtn = document.getElementById("delete-cancel");
    const deleteConfirmBtn = document.getElementById("delete-confirm");

    if (deleteCancelBtn) {
      deleteCancelBtn.addEventListener("click", () => {
        deleteModal.style.display = "none";
      });
    }

    if (deleteConfirmBtn) {
      deleteConfirmBtn.addEventListener("click", () => {
        const simuladoId = deleteConfirmBtn.dataset.simuladoId;
        if (simuladoId) {
          this.app.deleteSavedSimulado(simuladoId);
          this.loadSavedSimuladosList();
          deleteModal.style.display = "none";
        }
      });
    }

    // Modal de salvamento de simulado
    const saveModal = document.getElementById("save-simulado-modal");
    const saveCancelBtn = document.getElementById("save-cancel");
    const saveConfirmBtn = document.getElementById("save-confirm");

    if (saveCancelBtn) {
      saveCancelBtn.addEventListener("click", () => {
        saveModal.style.display = "none";
      });
    }

    if (saveConfirmBtn) {
      saveConfirmBtn.addEventListener("click", () => {
        this.app.saveCurrentSimulado();
        saveModal.style.display = "none";
        this.showSaveSuccessMessage();
      });
    }

    const finishBtn = document.getElementById("finish-simulado");
    if (finishBtn) {
      // Criar e armazenar o handler original
      const originalHandler = () => this.app.finishSimulado();

      finishBtn._originalHandler = originalHandler;
      finishBtn.addEventListener("click", originalHandler);
    }

    const backBtn = document.getElementById("back-config");
    if (backBtn) {
      backBtn.addEventListener("click", () => this.app.backToConfig());
    }

    const newSimuladoBtn = document.getElementById("new-simulado");
    if (newSimuladoBtn) {
      newSimuladoBtn.addEventListener("click", () => {
        window.location.reload();
      });
    }

    // Entrada rápida de gabarito
    this.setupGabaritoInput();
  }

  setupGabaritoInput() {
    const gabaritoInput = document.getElementById("gabarito-input");
    const clearBtn = document.getElementById("clear-gabarito");
    const applyBtn = document.getElementById("apply-gabarito");

    if (gabaritoInput) {
      // Filtrar entrada para permitir A, B, C, D, E e caracteres especiais (X, ., *)
      gabaritoInput.addEventListener("input", (e) => {
        let value = e.target.value.toUpperCase();
        // Permitir letras A, B, C, D, E e caracteres especiais X, ., *
        value = value.replace(/[^ABCDEX.*]/g, "");
        e.target.value = value;

        // Aplicar gabarito às questões (apenas em desktop)
        if (!this.isMobile()) {
          this.applyGabaritoToQuestions(value);
        }
      });

      // Também aplicar quando colar texto
      gabaritoInput.addEventListener("paste", (e) => {
        setTimeout(() => {
          let value = e.target.value.toUpperCase();
          value = value.replace(/[^ABCDEX.*]/g, "");
          e.target.value = value;
          if (!this.isMobile()) {
            this.applyGabaritoToQuestions(value);
          }
        }, 0);
      });

      // Enter também aplica o gabarito
      gabaritoInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.applyGabaritoToQuestions(gabaritoInput.value);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (gabaritoInput) {
          gabaritoInput.value = "";
          this.clearAllAnswers();
        }
      });
    }

    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        if (gabaritoInput) {
          this.applyGabaritoToQuestions(gabaritoInput.value);
        }
      });
    }
  }

  applyGabaritoToQuestions(gabarito) {
    const questions = this.app.getQuestions();

    for (let i = 0; i < gabarito.length && i < questions.length; i++) {
      const question = questions[i];
      const answer = gabarito[i];

      // Limpar seleções anteriores da questão primeiro
      const questionDiv = document
        .querySelector(
          `.question-card input[name="question_${question.position}"]`
        )
        ?.closest(".question-card");
      if (questionDiv) {
        questionDiv.querySelectorAll(".alternative").forEach((alt) => {
          alt.classList.remove("selected");
        });

        // Desmarcar todos os radios da questão
        questionDiv.querySelectorAll('input[type="radio"]').forEach((radio) => {
          radio.checked = false;
        });
      }

      // Se for uma resposta válida (A, B, C, D, E), marcar a opção
      if (["A", "B", "C", "D", "E"].includes(answer)) {
        const radio = document.querySelector(
          `input[name="question_${question.position}"][value="${answer}"]`
        );

        if (radio) {
          // Marcar a nova resposta
          radio.checked = true;
          radio.closest(".alternative").classList.add("selected");

          // Salvar a resposta no app
          this.app.setAnswer(question.position, answer);
        }
      } else if (["X", ".", "*"].includes(answer)) {
        // Para caracteres especiais (X, ., *), apenas limpar a resposta
        this.app.clearAnswer(question.position);
      }
    }
  }

  clearAllAnswers() {
    // Limpar todas as seleções visuais
    document.querySelectorAll(".alternative.selected").forEach((alt) => {
      alt.classList.remove("selected");
    });

    // Desmarcar todos os radios
    document
      .querySelectorAll('input[type="radio"][name^="question_"]')
      .forEach((radio) => {
        radio.checked = false;
      });

    // Limpar respostas no app
    const questions = this.app.getQuestions();
    questions.forEach((question) => {
      this.app.clearAnswer(question.position);
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
    const years = Object.keys(this.app.getPositions()).sort((a, b) => b - a);

    yearContainer.innerHTML = "";
    years.forEach((year) => {
      const button = document.createElement("button");
      button.className = "year-btn";
      button.dataset.year = year;
      button.textContent = year;
      yearContainer.appendChild(button);
    });

    // Inicializar estado sequencial
    this.initializeSequentialState();
  }

  initializeSequentialState() {
    // Desabilitar todas as etapas exceto ano
    this.disableExamTypeSelection();
    this.disableLanguageSelection();
    this.disableColorSelection();

    // Esconder seção de idioma inicialmente
    const languageSection = document.getElementById("language-section");
    if (languageSection) {
      languageSection.style.display = "none";
    }

    // Atualizar indicadores visuais
    this.updateProgressIndicators();
  }

  selectYear(year) {
    // Limpar seleções posteriores quando ano muda
    this.clearSubsequentSelections("year");

    document.querySelectorAll(".year-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    document.querySelector(`[data-year="${year}"]`).classList.add("selected");
    this.app.currentConfig.year = year;

    // Habilitar próxima etapa (área/tipo)
    this.enableExamTypeSelection();
    this.updateColorSelection(year);
    this.updateProgressIndicators();
    this.updateStartButton();
  }

  selectExamType(type) {
    // Só permitir se ano estiver selecionado
    if (!this.app.currentConfig.year) {
      this.showStepMessage("type", "Selecione um ano primeiro");
      return;
    }

    // Limpar seleções posteriores quando tipo muda
    this.clearSubsequentSelections("type");

    document.querySelectorAll(".exam-type-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    document.querySelector(`[data-type="${type}"]`).classList.add("selected");
    this.app.currentConfig.type = type;

    // Mostrar/esconder seleção de idioma
    const languageSection = document.getElementById("language-section");
    if (type === "dia1") {
      languageSection.style.display = "block";
      this.enableLanguageSelection();
      // Desabilitar seleção de cor até idioma ser escolhido
      this.disableColorSelection();
    } else {
      languageSection.style.display = "none";
      this.app.currentConfig.language = null;
      // Habilitar seleção de cor diretamente
      this.enableColorSelection();
    }

    if (this.app.currentConfig.year) {
      this.updateColorSelection(this.app.currentConfig.year, type);
    }

    this.updateProgressIndicators();
    this.updateStartButton();
  }

  selectColor(color) {
    // Verificar se pode selecionar cor
    if (!this.canSelectColor()) {
      const message = this.getColorSelectionMessage();
      this.showStepMessage("color", message);
      return;
    }

    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    document.querySelector(`[data-color="${color}"]`).classList.add("selected");
    this.app.currentConfig.color = color;
    this.updateProgressIndicators();
    this.updateStartButton();
  }

  selectLanguage(language) {
    // Só permitir se tipo estiver selecionado e for dia1
    if (
      !this.app.currentConfig.type ||
      this.app.currentConfig.type !== "dia1"
    ) {
      this.showStepMessage("language", 'Selecione "1º Dia" primeiro');
      return;
    }

    // Limpar seleções posteriores quando idioma muda
    this.clearSubsequentSelections("language");

    document.querySelectorAll(".language-btn").forEach((btn) => {
      btn.classList.remove("selected");
    });

    document
      .querySelector(`[data-language="${language}"]`)
      .classList.add("selected");
    this.app.currentConfig.language = language;

    // Habilitar seleção de cor
    this.enableColorSelection();

    if (this.app.currentConfig.year) {
      this.updateColorSelection(
        this.app.currentConfig.year,
        this.app.currentConfig.type,
        language
      );
    }

    this.updateProgressIndicators();
    this.updateStartButton();
  }

  updateColorSelection(year, examType = null, language = null) {
    const colorContainer = document.querySelector(".color-selection");
    if (!colorContainer) return;

    if (!year) {
      colorContainer.innerHTML =
        '<p style="color: var(--muted-color); font-style: italic;">Selecione um ano primeiro</p>';
      return;
    }

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
    if (this.app.currentConfig.color) {
      const colorMapping = {
        azul: "AZUL",
        amarela: "AMARELA",
        branca: "BRANCA",
        rosa: "ROSA",
        verde: "VERDE",
        cinza: "CINZA",
      };

      const selectedColorKey = colorMapping[this.app.currentConfig.color];
      if (!availableColors.includes(selectedColorKey)) {
        this.app.currentConfig.color = null;
        this.updateStartButton();
      }
    }
  }

  getAvailableColors(year, examType = null, language = null) {
    const positions = this.app.getPositions();
    if (!positions[year]) return [];

    let areasToCheck = [];
    if (examType) {
      const range = this.app.questionGenerator.getQuestionRanges(examType);
      areasToCheck = range.areas;

      if (examType === "dia1" && language) {
        areasToCheck = [language, "CH"];
      } else if (examType === "dia1") {
        areasToCheck = ["LC0", "CH"];
      }
    } else {
      areasToCheck = Object.keys(positions[year]);
    }

    if (areasToCheck.length === 0) return [];

    const firstAreaWithData = areasToCheck.find((area) => {
      const areaData = positions[year][area];
      return areaData && Object.keys(areaData).length > 0;
    });

    if (!firstAreaWithData) return [];

    const firstQuestion = Object.keys(positions[year][firstAreaWithData])[0];
    const questionData = positions[year][firstAreaWithData][firstQuestion];

    return Object.keys(questionData);
  }

  updateStartButton() {
    const startBtn = document.getElementById("start-simulado");
    const config = this.app.getCurrentConfig();

    let isValid = config.year && config.type && config.color;

    if (config.type === "dia1") {
      isValid = isValid && config.language;
    }

    startBtn.disabled = !isValid;
  }

  showSimuladoScreen() {
    document.getElementById("config-screen").style.display = "none";
    document.getElementById("simulado-screen").style.display = "block";
    document.getElementById("results-screen").style.display = "none";
    document.getElementById("saved-simulados-screen").style.display = "none";

    const config = this.app.getCurrentConfig();
    document.getElementById(
      "simulado-year"
    ).textContent = `Ano: ${config.year}`;
    document.getElementById(
      "simulado-type"
    ).textContent = `Tipo: ${this.getTypeName(config.type)}`;
    document.getElementById(
      "simulado-color"
    ).textContent = `Cor: ${this.getColorName(config.color)}`;

    // Garantir que a entrada de gabarito seja mostrada (pode ter sido escondida no modo revisão)
    this.showGabaritoInput();
  }

  showConfigScreen() {
    document.getElementById("config-screen").style.display = "block";
    document.getElementById("simulado-screen").style.display = "none";
    document.getElementById("results-screen").style.display = "none";
    document.getElementById("saved-simulados-screen").style.display = "none";
  }

  showSavedSimuladosScreen() {
    document.getElementById("config-screen").style.display = "none";
    document.getElementById("simulado-screen").style.display = "none";
    document.getElementById("results-screen").style.display = "none";
    document.getElementById("saved-simulados-screen").style.display = "block";
    this.loadSavedSimuladosList();
  }

  showResultsScreen() {
    document.getElementById("config-screen").style.display = "none";
    document.getElementById("simulado-screen").style.display = "none";
    document.getElementById("results-screen").style.display = "block";
    document.getElementById("saved-simulados-screen").style.display = "none";
  }

  showDataLoadSuccess() {
    // Pode implementar feedback visual se necessário
  }

  showDataLoadError(error) {
    const yearContainer = document.getElementById("year-selection");
    if (yearContainer) {
      yearContainer.innerHTML =
        '<p style="color: red;">Erro ao carregar dados. Verifique o console.</p>';
    }
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

    this.app.getQuestions().forEach((question) => {
      const questionDiv = this.createQuestionElement(question);
      container.appendChild(questionDiv);
    });

    // Atualizar informações do debug se estiver ativo
    if (this.debugMode) {
      this.updateDebugInfo();
    }
  }

  createQuestionElement(question) {
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
      <div class="question-text">${questionDescription}</div>
      <div class="alternatives">
        ${["A", "B", "C", "D", "E"]
          .map(
            (letter) => `
          <label class="alternative">
            <input type="radio" name="question_${question.position}" value="${letter}">
            <span class="alternative-letter">${letter}</span>
            <span>Alternativa ${letter}</span>
          </label>`
          )
          .join("")}
      </div>
    `;

    this.setupQuestionEventListeners(questionDiv, question);
    return questionDiv;
  }

  setupQuestionEventListeners(questionDiv, question) {
    questionDiv.querySelectorAll(".alternative").forEach((alternative) => {
      const radio = alternative.querySelector('input[type="radio"]');

      alternative.addEventListener("click", (e) => {
        if (e.target.type === "radio") return;

        radio.checked = true;
        questionDiv.querySelectorAll(".alternative").forEach((alt) => {
          alt.classList.remove("selected");
        });
        alternative.classList.add("selected");
        this.app.setAnswer(question.position, radio.value);

        // Atualizar entrada de gabarito
        setTimeout(() => this.updateGabaritoFromAnswers(), 0);
      });

      radio.addEventListener("change", (e) => {
        questionDiv.querySelectorAll(".alternative").forEach((alt) => {
          alt.classList.remove("selected");
        });
        e.target.closest(".alternative").classList.add("selected");
        this.app.setAnswer(question.position, e.target.value);

        // Atualizar entrada de gabarito
        setTimeout(() => this.updateGabaritoFromAnswers(), 0);
      });
    });
  }

  resetUI() {
    document.querySelectorAll(".selected").forEach((el) => {
      el.classList.remove("selected");
    });

    // Remover mensagens de step
    document.querySelectorAll(".step-message").forEach((msg) => {
      if (msg.parentNode) {
        msg.parentNode.removeChild(msg);
      }
    });

    const languageSection = document.getElementById("language-section");
    if (languageSection) {
      languageSection.style.display = "none";
    }

    // Limpar entrada de gabarito
    this.clearGabaritoInput();

    this.app.currentConfig = {
      year: null,
      type: null,
      color: null,
      language: null,
    };

    // Reinicializar estado sequencial
    this.initializeSequentialState();
    this.updateProgressIndicators();
    this.updateStartButton();

    // Atualizar debug panel se estiver ativo
    this.updateDebugPanel();
  }

  // Métodos para gerenciar fluxo sequencial
  clearSubsequentSelections(currentStep) {
    const steps = ["year", "type", "language", "color"];
    const currentIndex = steps.indexOf(currentStep);

    // Limpar tudo que vem depois do passo atual
    for (let i = currentIndex + 1; i < steps.length; i++) {
      const step = steps[i];

      switch (step) {
        case "type":
          this.app.currentConfig.type = null;
          document.querySelectorAll(".exam-type-btn").forEach((btn) => {
            btn.classList.remove("selected");
          });
          this.disableExamTypeSelection();
          break;

        case "language":
          this.app.currentConfig.language = null;
          document.querySelectorAll(".language-btn").forEach((btn) => {
            btn.classList.remove("selected");
          });
          this.disableLanguageSelection();
          break;

        case "color":
          this.app.currentConfig.color = null;
          document.querySelectorAll(".color-btn").forEach((btn) => {
            btn.classList.remove("selected");
          });
          this.disableColorSelection();
          break;
      }
    }
  }

  canSelectColor() {
    const config = this.app.currentConfig;

    // Precisa ter ano e tipo selecionados
    if (!config.year || !config.type) {
      return false;
    }

    // Se for dia1, também precisa ter idioma
    if (config.type === "dia1" && !config.language) {
      return false;
    }

    return true;
  }

  getColorSelectionMessage() {
    const config = this.app.currentConfig;

    if (!config.year) {
      return "Selecione um ano primeiro";
    }

    if (!config.type) {
      return "Selecione o tipo de prova primeiro";
    }

    if (config.type === "dia1" && !config.language) {
      return "Selecione o idioma primeiro";
    }

    return "Complete as etapas anteriores";
  }

  showStepMessage(step, message) {
    // Criar ou atualizar mensagem de orientação
    let messageElement = document.querySelector(`.step-message-${step}`);

    if (!messageElement) {
      messageElement = document.createElement("div");
      messageElement.className = `step-message step-message-${step}`;
      messageElement.style.cssText = `
        color: var(--warning-color);
        font-size: 0.9rem;
        margin-top: 0.5rem;
        padding: 0.5rem;
        background: rgba(255, 193, 7, 0.1);
        border-radius: 4px;
        border-left: 3px solid var(--warning-color);
      `;

      // Encontrar o container correto para cada step
      let container;
      switch (step) {
        case "type":
          container = document.querySelector(
            ".exam-type-selection"
          )?.parentNode;
          break;
        case "language":
          container = document.querySelector("#language-section");
          break;
        case "color":
          container = document.querySelector(".color-selection")?.parentNode;
          break;
      }

      if (container) {
        container.appendChild(messageElement);
      }
    }

    messageElement.textContent = message;

    // Remover mensagem após 3 segundos
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 3000);
  }

  enableExamTypeSelection() {
    document.querySelectorAll(".exam-type-btn").forEach((btn) => {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    });
  }

  disableExamTypeSelection() {
    document.querySelectorAll(".exam-type-btn").forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.pointerEvents = "none";
    });
  }

  enableLanguageSelection() {
    document.querySelectorAll(".language-btn").forEach((btn) => {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    });
  }

  disableLanguageSelection() {
    document.querySelectorAll(".language-btn").forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.pointerEvents = "none";
    });
  }

  enableColorSelection() {
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.pointerEvents = "auto";
    });
  }

  disableColorSelection() {
    document.querySelectorAll(".color-btn").forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.5";
      btn.style.pointerEvents = "none";
    });
  }

  updateProgressIndicators() {
    const config = this.app.currentConfig;

    // Encontrar seções de configuração
    const sections = {
      year: document
        .querySelector("#year-selection")
        ?.closest(".config-section"),
      type: document
        .querySelector(".exam-type-selection")
        ?.closest(".config-section"),
      language: document
        .querySelector("#language-section")
        ?.closest(".config-section"),
      color: document
        .querySelector(".color-selection")
        ?.closest(".config-section"),
    };

    // Remover classes anteriores
    Object.values(sections).forEach((section) => {
      if (section) {
        section.classList.remove("active", "completed", "disabled");
      }
    });

    // Ano
    if (sections.year) {
      if (config.year) {
        sections.year.classList.add("completed");
      } else {
        sections.year.classList.add("active");
      }
    }

    // Tipo/Área
    if (sections.type) {
      if (!config.year) {
        sections.type.classList.add("disabled");
      } else if (config.type) {
        sections.type.classList.add("completed");
      } else {
        sections.type.classList.add("active");
      }
    }

    // Idioma (se aplicável)
    if (sections.language && config.type === "dia1") {
      if (!config.type) {
        sections.language.classList.add("disabled");
      } else if (config.language) {
        sections.language.classList.add("completed");
      } else {
        sections.language.classList.add("active");
      }
    }

    // Cor
    if (sections.color) {
      if (!this.canSelectColor()) {
        sections.color.classList.add("disabled");
      } else if (config.color) {
        sections.color.classList.add("completed");
      } else {
        sections.color.classList.add("active");
      }
    }
  }

  // Métodos para simulados salvos
  loadSavedSimuladosList() {
    const savedSimulados = this.app.getSavedSimulados();
    const stats = this.app.savedSimuladosManager.getStats();

    // Atualizar estatísticas
    document.getElementById("total-saved").textContent = stats.total;
    document.getElementById(
      "average-performance"
    ).textContent = `${stats.averagePerformance}%`;
    document.getElementById(
      "best-performance"
    ).textContent = `${stats.bestPerformance}%`;
    document.getElementById("recent-count").textContent = stats.recentCount;

    // Renderizar lista de simulados
    this.renderSavedSimuladosList(savedSimulados);
  }

  renderSavedSimuladosList(savedSimulados) {
    const container = document.getElementById("saved-simulados-container");
    if (!container) return;

    if (savedSimulados.length === 0) {
      container.innerHTML = `
        <div class="empty-saved-simulados">
          <i class="fa fa-clipboard-list"></i>
          <h3>Nenhum simulado salvo</h3>
          <p>Faça um simulado e veja seus resultados aqui!</p>
        </div>
      `;
      return;
    }

    // Ordenar por data (mais recente primeiro)
    const sortedSimulados = [...savedSimulados].sort(
      (a, b) => b.timestamp - a.timestamp
    );

    let html = "";

    sortedSimulados.forEach((simulado) => {
      html += `
        <div class="saved-simulado-item">
          <div class="simulado-item-header">
            <div>
              <h4 class="simulado-title">${simulado.title}</h4>
              <span class="simulado-date">${simulado.date}</span>
            </div>
            <div class="simulado-actions">
              <button class="view-btn" onclick="window.simuladoApp.loadSavedSimulado('${simulado.id}')">
                <i class="fa fa-eye"></i> Ver Resultados
              </button>
              <button class="delete-btn" onclick="window.simuladoApp.uiController.showDeleteConfirmation('${simulado.id}')">
                <i class="fa fa-trash"></i> Excluir
              </button>
            </div>
          </div>
          
          <div class="simulado-info">
            <div class="info-item">
              <span class="info-label">Questões</span>
              <span class="info-value">${simulado.questionsCount}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Acertos</span>
              <span class="info-value">${simulado.correctAnswers}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Aproveitamento</span>
              <span class="info-value performance-indicator">${simulado.performance}%</span>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  showDeleteConfirmation(simuladoId) {
    const deleteModal = document.getElementById("delete-simulado-modal");
    const deleteConfirmBtn = document.getElementById("delete-confirm");

    if (deleteModal && deleteConfirmBtn) {
      deleteConfirmBtn.dataset.simuladoId = simuladoId;
      deleteModal.style.display = "flex";
    }
  }

  showSaveConfirmation() {
    const saveModal = document.getElementById("save-simulado-modal");
    if (saveModal) {
      saveModal.style.display = "flex";
    }
  }

  showSaveSuccessMessage() {
    // Criar uma notificação temporária de sucesso
    const notification = document.createElement("div");
    notification.className = "save-success-notification";
    notification.innerHTML = `
      <i class="fa fa-check-circle"></i>
      <span>Simulado salvo com sucesso!</span>
    `;

    document.body.appendChild(notification);

    // Remover após 3 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Inicializa o sistema de debug para desenvolvimento
   */
  initializeDebugMode() {
    // Verificar se o debug está ativado (pode ser via URL parameter ou localStorage)
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get("debug");
    const debugLocal = localStorage.getItem("debugMode");

    this.debugMode =
      debugParam === "true" || debugLocal === "true" || debugParam === "1";

    if (this.debugMode) {
      console.log("🔧 Modo DEBUG ativado");
      this.createDebugPanel();
    }
  }

  /**
   * Cria o painel de debug flutuante
   */
  createDebugPanel() {
    // Criar painel de debug se não existir
    if (document.getElementById("debug-panel")) return;

    const debugPanel = document.createElement("div");
    debugPanel.id = "debug-panel";
    debugPanel.className = "debug-panel";
    debugPanel.innerHTML = `
      <div class="debug-header">
        <h4>🔧 Debug Panel</h4>
        <button id="debug-toggle" class="debug-toggle">−</button>
      </div>
      <div class="debug-content">
        <button id="debug-random-answers" class="debug-btn primary">
          🎲 Gerar Respostas Aleatórias
        </button>
        <button id="debug-clear-answers" class="debug-btn secondary">
          🗑️ Limpar Respostas
        </button>
        <button id="debug-fill-correct" class="debug-btn success">
          ✅ Preencher Corretas (Teste)
        </button>
        <div class="debug-info">
          <small>Total de questões: <span id="debug-question-count">0</span></small>
          <small>Respondidas: <span id="debug-answered-count">0</span></small>
        </div>
      </div>
    `;

    // Adicionar estilos CSS inline para o debug panel
    const debugStyles = document.createElement("style");
    debugStyles.textContent = `
      .debug-panel {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 280px;
        background: #2c3e50;
        color: white;
        border-radius: 8px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        border: 2px solid #3498db;
      }
      
      .debug-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #34495e;
        padding: 12px 16px;
        border-radius: 6px 6px 0 0;
        border-bottom: 1px solid #3498db;
        cursor: move;
        user-select: none;
      }
      
      .debug-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .debug-toggle {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .debug-toggle:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      .debug-content {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .debug-content.hidden {
        display: none;
      }
      
      .debug-btn {
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 14px;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
      }
      
      .debug-btn.primary {
        background: #3498db;
        color: white;
      }
      
      .debug-btn.primary:hover {
        background: #2980b9;
        transform: translateY(-1px);
      }
      
      .debug-btn.secondary {
        background: #95a5a6;
        color: white;
      }
      
      .debug-btn.secondary:hover {
        background: #7f8c8d;
        transform: translateY(-1px);
      }
      
      .debug-btn.success {
        background: #27ae60;
        color: white;
      }
      
      .debug-btn.success:hover {
        background: #229954;
        transform: translateY(-1px);
      }
      
      .debug-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 8px;
        padding-top: 12px;
        border-top: 1px solid #3498db;
        opacity: 0.8;
      }
      
      .debug-info small {
        font-size: 12px;
      }
    `;

    document.head.appendChild(debugStyles);
    document.body.appendChild(debugPanel);

    // Configurar event listeners do debug panel
    this.setupDebugEventListeners();
  }

  /**
   * Configura os event listeners do painel de debug
   */
  setupDebugEventListeners() {
    // Toggle do painel
    document.getElementById("debug-toggle").addEventListener("click", () => {
      const content = document.querySelector(".debug-content");
      const toggle = document.getElementById("debug-toggle");

      if (content.classList.contains("hidden")) {
        content.classList.remove("hidden");
        toggle.textContent = "−";
      } else {
        content.classList.add("hidden");
        toggle.textContent = "+";
      }
    });

    // Tornar o painel draggable
    this.makePanelDraggable();

    // Gerar respostas aleatórias
    document
      .getElementById("debug-random-answers")
      .addEventListener("click", () => {
        this.generateRandomAnswers();
      });

    // Limpar respostas
    document
      .getElementById("debug-clear-answers")
      .addEventListener("click", () => {
        this.clearAllAnswers();
      });

    // Preencher respostas corretas (para teste)
    document
      .getElementById("debug-fill-correct")
      .addEventListener("click", () => {
        this.fillCorrectAnswers();
      });
  }

  /**
   * Gera respostas aleatórias para todas as questões
   */
  generateRandomAnswers() {
    const questions = this.app.getQuestions();
    const alternatives = ["A", "B", "C", "D", "E"];

    console.log("🎲 Gerando respostas aleatórias...");

    questions.forEach((question) => {
      const randomAnswer =
        alternatives[Math.floor(Math.random() * alternatives.length)];

      // Encontrar o radio button da questão
      const radio = document.querySelector(
        `input[name="question_${question.position}"][value="${randomAnswer}"]`
      );

      if (radio) {
        // Simular click no radio
        radio.checked = true;
        radio.dispatchEvent(new Event("change", { bubbles: true }));

        // Atualizar visualmente
        const questionDiv = radio.closest(".question-card");
        if (questionDiv) {
          questionDiv.querySelectorAll(".alternative").forEach((alt) => {
            alt.classList.remove("selected");
          });
          radio.closest(".alternative").classList.add("selected");
        }

        // Salvar resposta
        this.app.setAnswer(question.position, randomAnswer);
      }
    });

    this.updateDebugInfo();
    console.log(`✅ ${questions.length} respostas aleatórias geradas!`);
  }

  /**
   * Limpa todas as respostas
   */
  clearAllAnswers() {
    console.log("🗑️ Limpando todas as respostas...");

    // Limpar todos os radio buttons
    document
      .querySelectorAll('input[type="radio"]:checked')
      .forEach((radio) => {
        radio.checked = false;
      });

    // Remover classes visuais
    document.querySelectorAll(".alternative.selected").forEach((alt) => {
      alt.classList.remove("selected");
    });

    // Limpar respostas no app
    const questions = this.app.getQuestions();
    questions.forEach((question) => {
      this.app.clearAnswer(question.position);
    });

    this.updateDebugInfo();
    console.log("✅ Todas as respostas foram limpas!");
  }

  /**
   * Preenche com respostas corretas (para teste) - se disponível no meta
   */
  fillCorrectAnswers() {
    const questions = this.app.getQuestions();
    const meta = this.app.getMeta();
    const config = this.app.getCurrentConfig();

    console.log("✅ Preenchendo respostas corretas...");

    let correctCount = 0;

    questions.forEach((question) => {
      // Tentar obter resposta correta do meta
      const questionMeta =
        meta[config.year]?.[question.area]?.[question.originalPosition];
      const correctAnswer = questionMeta?.answer;

      if (correctAnswer) {
        // Encontrar o radio button da resposta correta
        const radio = document.querySelector(
          `input[name="question_${question.position}"][value="${correctAnswer}"]`
        );

        if (radio) {
          radio.checked = true;
          radio.dispatchEvent(new Event("change", { bubbles: true }));

          // Atualizar visualmente
          const questionDiv = radio.closest(".question-card");
          if (questionDiv) {
            questionDiv.querySelectorAll(".alternative").forEach((alt) => {
              alt.classList.remove("selected");
            });
            radio.closest(".alternative").classList.add("selected");
          }

          // Salvar resposta
          this.app.setAnswer(question.position, correctAnswer);
          correctCount++;
        }
      }
    });

    this.updateDebugInfo();
    console.log(
      `✅ ${correctCount}/${questions.length} respostas corretas preenchidas!`
    );
  }

  /**
   * Atualiza as informações no painel de debug
   */
  updateDebugInfo() {
    const totalCount = document.getElementById("debug-question-count");
    const answeredCount = document.getElementById("debug-answered-count");

    if (totalCount && answeredCount) {
      const questions = this.app.getQuestions();
      const answers = this.app.getAnswers();

      totalCount.textContent = questions.length;
      answeredCount.textContent = Object.keys(answers).length;
    }
  }

  /**
   * Torna o painel de debug movível/draggable
   */
  makePanelDraggable() {
    const panel = document.getElementById("debug-panel");
    const header = panel.querySelector(".debug-header");

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    function dragStart(e) {
      if (e.type === "touchstart") {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }

      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
        panel.style.cursor = "grabbing";
      }
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      panel.style.cursor = "auto";
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();

        if (e.type === "touchmove") {
          currentX = e.touches[0].clientX - initialX;
          currentY = e.touches[0].clientY - initialY;
        } else {
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
        }

        xOffset = currentX;
        yOffset = currentY;

        // Limitar movimento dentro da viewport
        const rect = panel.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));

        panel.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }

    header.addEventListener("mousedown", dragStart, false);
    document.addEventListener("mouseup", dragEnd, false);
    document.addEventListener("mousemove", drag, false);

    // Touch events para dispositivos móveis
    header.addEventListener("touchstart", dragStart, false);
    document.addEventListener("touchend", dragEnd, false);
    document.addEventListener("touchmove", drag, false);
  }

  hideGabaritoInput() {
    const gabaritoContainer = document.querySelector(
      ".gabarito-input-container"
    );
    if (gabaritoContainer) {
      gabaritoContainer.style.display = "none";
    }
  }

  showGabaritoInput() {
    const gabaritoContainer = document.querySelector(
      ".gabarito-input-container"
    );
    if (gabaritoContainer) {
      gabaritoContainer.style.display = "flex";
    }
  }

  clearGabaritoInput() {
    const gabaritoInput = document.getElementById("gabarito-input");
    if (gabaritoInput) {
      gabaritoInput.value = "";
    }
  }

  updateGabaritoFromAnswers() {
    const gabaritoInput = document.getElementById("gabarito-input");
    if (!gabaritoInput) return;

    const questions = this.app.getQuestions();
    const answers = this.app.getAnswers();
    let gabarito = "";

    // Criar string de gabarito baseada nas respostas atuais
    questions.forEach((question) => {
      const answer = answers[question.position];
      if (answer && ["A", "B", "C", "D", "E"].includes(answer)) {
        gabarito += answer;
      } else {
        // Se não há resposta, usar '.' como placeholder
        gabarito += ".";
      }
    });

    // Remover pontos do final (questões não respondidas)
    gabarito = gabarito.replace(/\.+$/, "");
    gabaritoInput.value = gabarito;
  }

  isMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth <= 768
    );
  }
}
