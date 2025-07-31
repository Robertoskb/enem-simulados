// Funções para buscar dados
async function fetchQuestions() {
  const response = await fetch("questions.json");
  return response.json();
}

async function fetchMeta() {
  const response = await fetch("meta.json");
  return response.json();
}

async function fetchPositions() {
  const response = await fetch("positions.json");
  return response.json();
}

// Função para popular os filtros de anos
async function populateYearFilters() {
  try {
    const data = await fetchQuestions();
    const anos = Object.keys(data).sort((a, b) => b - a);
    const yearContainer = document.getElementById("year-filters");
    let html = "<strong>Anos</strong><br>";
    anos.forEach((ano) => {
      html += `<button class="btn btn-outline-primary" type="button" data-filter="ano" data-value="${ano}">${ano}</button>`;
    });
    yearContainer.innerHTML = html;

    yearContainer
      .querySelectorAll('button[data-filter="ano"]')
      .forEach((btn) => {
        btn.addEventListener("click", function () {
          btn.classList.toggle("active");
          loadAndRenderQuestions();
        });
      });
  } catch (error) {
    console.error("Erro ao popular filtros de anos:", error);
  }
}

// Obtém os filtros selecionados
function getSelectedFilters() {
  const anos = Array.from(
    document.querySelectorAll('button[data-filter="ano"].active')
  ).map((btn) => btn.dataset.value);
  const areas = Array.from(
    document.querySelectorAll('button[data-filter="area"].active')
  ).map((btn) => btn.dataset.value);
  const acertosBtn = document.querySelector(
    'button[data-filter="acertos"].active'
  );
  const acertos = acertosBtn ? acertosBtn.dataset.value : null;
  const search = document.getElementById("search").value.trim();
  return { anos, areas, acertos, search };
}

// Limpa os resultados
function clearResults() {
  document.getElementById("results").innerHTML = "";
}

// Exibe mensagem de erro
function showError(error) {
  const results = document.getElementById("results");
  results.innerHTML = "<p>Erro ao carregar os dados.</p>";
  console.error(error);
}

// Cria o elemento de questão
function createQuestionElement(
  ano,
  area,
  numero,
  impacto,
  meta = {},
  positions = {}
) {
  const questionKey = `${ano}|${area}|${numero}`;
  let isDone = localStorage.getItem(questionKey) === "true";
  const questionDiv = document.createElement("div");
  let baseClasses = "question-item";
  if (isDone) baseClasses += " done";
  questionDiv.className = baseClasses;

  const urls = {
    LC0: `/question.html?year=${ano}&pos=${numero}&lang=ingles`,
    LC1: `/question.html?year=${ano}&pos=${numero}&lang=espanhol`,
  };

  let url = urls[area] || `/question.html?year=${ano}&pos=${numero}`;

  const currentUrl = window.location.href;
  const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf("/"));
  url = `${baseUrl}${url}`;

  const capitalize = (str) =>
    str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const level_discrimination = (dis) => {
    if (dis == null) return '<span class="text-not-available">N/A</span>';
    if (dis < 1.0) return '<span class="text-very-low">Muito baixa</span>';
    if (dis < 2.0) return '<span class="text-low">Baixa</span>';
    if (dis < 3.0) return '<span class="text-medium">Média</span>';
    if (dis < 4.0) return '<span class="text-high">Alta</span>';
    return '<span class="text-very-high">Muito alta</span>';
  };

  const level_difficulty = (dif) => {
    dif = dif * 100 + 500; // Ajusta a dificuldade para o intervalo correto
    if (dif == null) return '<span class="text-not-available">N/A</span>';
    if (dif < 550.0) return '<span class="text-very-easy">Muito fácil</span>';
    if (dif < 650.0) return '<span class="text-easy">Fácil</span>';
    if (dif < 750.0) return '<span class="text-medium">Média</span>';
    if (dif < 850.0) return '<span class="text-hard">Difícil</span>';
    return '<span class="text-very-hard">Muito difícil</span>';
  };

  const level_causal_hit = (casual_hit) => {
    if (casual_hit == null)
      return '<span class="text-not-available">N/A</span>';
    if (casual_hit < 10.0)
      return '<span class="text-very-low">Muito eficaz</span>';
    if (casual_hit < 15.0) return '<span class="text-low">Bom</span>';
    if (casual_hit < 25.0) return '<span class="text-medium">Esperado</span>';
    if (casual_hit < 30.0) return '<span class="text-high">Ruim</span>';
    return '<span class="text-very-high">Muito ruim</span>';
  };

  questionDiv.innerHTML = `
        <div class="item-content" style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="checkmark-icon">
                <i class="fa ${isDone ? "fa-check-circle" : "fa-circle"}"></i>
            </span>
            <a href="${url}" target="_blank" ><span class="question-text">Questão ${numero}</span></a>
            <span class="dropdown-toggle" style="cursor: pointer;">
                <i class="fa fa-caret-down"></i>
            </span>
            <span class="impact-info" style="margin-left:auto;">
                ${impacto.toFixed(2)}% de impacto
            </span>
        </div>
        <div class="question-details" style="display: none;">
            <div>Data: ${ano}</div>
            <div>Área: ${area}</div>
            
            <div><strong>Posições:</strong></div>
            ${Object.entries(positions)
              .map(
                ([caderno, pos]) =>
                  `<div>Cor ${capitalize(caderno)}: ${pos}</div>`
              )
              .join("")}
            <div><strong>Parâmetros:</strong></div>
            <div>Discriminação: ${
              meta.discrimination || "N/A"
            } (${level_discrimination(meta.discrimination)})</div>
            <div>Dificuldade: ${
              (meta.difficulty * 100 + 500).toFixed(1) || "N/A"
            } (${level_difficulty(meta.difficulty)})</div>
            <div>Acerto Casual: ${
              meta["casual hit"] ? meta["casual hit"] + "%" : "N/A"
            } (${level_causal_hit(meta["casual hit"])})</div>
        </div>
    `;

  const dropdownToggle = questionDiv.querySelector(".dropdown-toggle");
  const detailsDiv = questionDiv.querySelector(".question-details");

  dropdownToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (detailsDiv.style.display === "none") {
      detailsDiv.style.display = "block";
      dropdownToggle.innerHTML = '<i class="fa fa-caret-up"></i>';
    } else {
      detailsDiv.style.display = "none";
      dropdownToggle.innerHTML = '<i class="fa fa-caret-down"></i>';
    }
  });

  questionDiv.addEventListener("click", () => {
    const newState = !isDone;
    localStorage.setItem(questionKey, newState ? "true" : "false");
    questionDiv.classList.toggle("done", newState);
    const checkmarkIcon = questionDiv.querySelector(".checkmark-icon i");
    if (checkmarkIcon) {
      checkmarkIcon.className = newState
        ? "fa fa-check-circle"
        : "fa fa-circle";
    }
    isDone = newState;
  });

  return questionDiv;
}

// Renderiza uma seção de questões
function renderSection(
  ano,
  areasData,
  selectedArea,
  acertos,
  search,
  metaData,
  positionsData
) {
  if (areasData[selectedArea] && acertos && areasData[selectedArea][acertos]) {
    const section = document.createElement("div");
    section.className = "result-section";
    section.innerHTML = `<h2 class="h5 mb-3">${ano} Caderno Azul - ${selectedArea}</h2>`;
    const questionsList = document.createElement("div");
    questionsList.className = "row g-2";

    areasData[selectedArea][acertos].forEach(([impacto, numero]) => {
      const meta = metaData[ano]?.[selectedArea]?.[numero] || {};
      const positions = positionsData[ano]?.[selectedArea]?.[numero] || {};
      const questionEl = createQuestionElement(
        ano,
        selectedArea,
        numero,
        impacto,
        meta,
        positions
      );

      if (
        !search ||
        questionEl.textContent.toLowerCase().includes(search.toLowerCase())
      ) {
        const col = document.createElement("div");
        col.className = "col-12";
        col.appendChild(questionEl);
        questionsList.appendChild(col);
      }
    });

    section.appendChild(questionsList);
    return section;
  }
  return null;
}

// Função principal que carrega e renderiza as questões
async function loadAndRenderQuestions() {
  clearResults();
  const { anos, areas, acertos, search } = getSelectedFilters();
  try {
    const [data, metaData, positionsData] = await Promise.all([
      fetchQuestions(),
      fetchMeta(),
      fetchPositions(),
    ]);

    const sortedData = Object.entries(data).sort(
      ([anoA], [anoB]) => anoB - anoA
    );
    const results = document.getElementById("results");

    sortedData.forEach(([year, areasData]) => {
      if (anos.length && !anos.includes(year)) return;

      if (areas.length) {
        areas.forEach((selectedArea) => {
          const section = renderSection(
            year,
            areasData,
            selectedArea,
            acertos,
            search,
            metaData,
            positionsData
          );
          if (section) results.appendChild(section);
        });
      } else {
        Object.keys(areasData).forEach((selectedArea) => {
          const section = renderSection(
            year,
            areasData,
            selectedArea,
            acertos,
            search,
            metaData,
            positionsData
          );
          if (section) results.appendChild(section);
        });
      }
    });
  } catch (error) {
    showError(error);
  }
}

// Alterna entre tema light e dark
function toggleTheme() {
  const htmlEl = document.documentElement;
  const currentTheme = htmlEl.getAttribute("data-theme") || "light";
  if (currentTheme === "light") {
    htmlEl.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  } else {
    htmlEl.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
}

// Inicializa o tema
function initTheme() {
  const storedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", storedTheme);
}

// Adiciona listener para o menu mobile
function bindMenuToggle() {
  const menuBtn = document.getElementById("menuToggleBtn");
  const sidebar = document.getElementById("sidebar");
  menuBtn.addEventListener("click", () => {
    if (sidebar.style.transform === "translateX(0px)") {
      sidebar.style.transform = "translateX(-250px)";
    } else {
      sidebar.style.transform = "translateX(0px)";
    }
  });
}

// Configura os eventos
function bindEvents() {
  document
    .getElementById("carregarBtn")
    .addEventListener("click", loadAndRenderQuestions);

  document
    .querySelectorAll(
      'button[data-filter="area"], button[data-filter="acertos"]'
    )
    .forEach((btn) => {
      btn.addEventListener("click", function () {
        const filter = btn.getAttribute("data-filter");
        if (filter === "acertos") {
          document
            .querySelectorAll('button[data-filter="acertos"]')
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        } else {
          btn.classList.toggle("active");
        }
        loadAndRenderQuestions();
      });
    });

  document
    .getElementById("search")
    .addEventListener("input", loadAndRenderQuestions);

  document.getElementById("toggleTheme").addEventListener("click", (e) => {
    e.preventDefault();
    toggleTheme();
  });

  bindMenuToggle();
}

// Inicializa a aplicação
window.addEventListener("load", async () => {
  initTheme();
  await populateYearFilters();
  bindEvents();
  loadAndRenderQuestions();
});
