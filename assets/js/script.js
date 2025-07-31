document.addEventListener("DOMContentLoaded", function () {
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const year = urlParams.get("year");
  const pos = urlParams.get("pos");
  const lang = urlParams.get("lang") || "";

  if (!year || !pos) {
    document.getElementById("question-title").textContent =
      "Parâmetros inválidos";
    document.getElementById("question-context").innerHTML =
      "<p>Por favor, forneça os parâmetros year e pos na URL. Exemplo: question.html?year=2021&pos=90&lang=ingles</p>";
    return;
  }

  fetchQuestion(year, pos, lang);
});

function fetchQuestion(year, pos, lang) {
  const apiUrl = `https://api.enem.dev/v1/exams/${year}/questions/${pos}?language=${lang}`;

  document.getElementById(
    "question-title"
  ).textContent = `Carregando questão ${pos}...`;

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Questão não encontrada");
      }
      return response.json();
    })
    .then((data) => {
      displayQuestion(data);
    })
    .catch((error) => {
      document.getElementById("question-title").textContent =
        "Erro ao carregar questão";
      document.getElementById(
        "question-context"
      ).innerHTML = `<p>${error.message}. Verifique se os parâmetros estão corretos.</p>`;
    });
}

function displayQuestion(data) {
  // Set question title
  document.getElementById(
    "question-title"
  ).textContent = `${data.title} (Prova Azul)`;

  // Process and display context
  let context = data.context || "";
  context = context.replace(/\n/g, "<br>");
  context = replaceImageMarkdown(context);
  document.getElementById("question-context").innerHTML = context;

  // Set alternatives introduction
  const altIntro = data.alternativesIntroduction || "Alternativas:";
  document.getElementById("alternatives-intro").textContent = altIntro;

  // Display alternatives
  const alternativesList = document.getElementById("alternatives-list");
  alternativesList.innerHTML = "";

  data.alternatives.forEach((alt) => {
    const li = document.createElement("li");
    li.dataset.correct = alt.isCorrect;
    li.dataset.letter = alt.letter;

    let altContent = `${alt.letter}) `;

    if (alt.file) {
      altContent += `<img src="${alt.file}" alt="Imagem da alternativa ${alt.letter}" class="alternative-image">`;
    }

    if (alt.text) {
      altContent += `<span>${alt.text}</span>`;
    }

    li.innerHTML = altContent;

    li.addEventListener("click", function () {
      // Remove todas as seleções anteriores
      document.querySelectorAll(".alternatives li").forEach((item) => {
        item.classList.remove("selected", "correct", "incorrect");
      });

      // Marca apenas a alternativa clicada
      this.classList.add("selected");

      // Verifica a resposta
      const isCorrect = this.dataset.correct === "true";
      const resultDiv = document.getElementById("result");

      if (isCorrect) {
        this.classList.add("correct");
        resultDiv.textContent = "Resposta correta!";
        resultDiv.className = "result correct";
      } else {
        this.classList.add("incorrect");
        // Destaca a resposta correta
        const correctAlt = document.querySelector(
          `.alternatives li[data-correct="true"]`
        );
        if (correctAlt) {
          correctAlt.classList.add("correct");
        }
        resultDiv.textContent = "Resposta incorreta!";
        resultDiv.className = "result incorrect";
      }

      resultDiv.style.display = "block";
    });

    alternativesList.appendChild(li);
  });
}

function replaceImageMarkdown(text) {
  // Replace markdown image syntax with HTML img tags
  return text.replace(
    /!\[\]\((.*?)\)/g,
    '<img src="$1" alt="Imagem do contexto" class="context-image">'
  );
}
