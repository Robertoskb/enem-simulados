// Calculadora de Notas TRI usando modelos LightGBM específicos
export class ScoreCalculator {
  constructor(app) {
    this.app = app;
    this.loadedModels = new Map(); // Cache de modelos carregados
  }

  /**
   * Gera o nome do arquivo do modelo baseado nos parâmetros
   * @param {number} year - Ano da prova
   * @param {string} area - Área (LC, CH, CN, MT)
   * @param {string} language - Idioma (0 ou 1 para LC0/LC1, null para outras áreas)
   * @returns {string} Nome do arquivo do modelo
   */
  generateModelFileName(year, area, language = null) {
    // Padrão: modelo_de_nota_{year}_{area}_B{_language}.js
    let fileName = `modelo_de_nota_${year}_${area}_B`;

    // Adicionar language apenas para LC (Linguagens e Códigos)
    if (area === "LC" && language !== null) {
      fileName += `_${language}`;
    }

    return `${fileName}.js`;
  }

  /**
   * Verifica se existe um modelo para os parâmetros dados
   * @param {number} year - Ano da prova
   * @param {string} area - Área
   * @param {string} language - Idioma (opcional)
   * @returns {Promise<boolean>} True se o modelo existe
   */
  async modelExists(year, area, language = null) {
    const fileName = this.generateModelFileName(year, area, language);
    const modelPath = `assets/js/models/${fileName}`;

    try {
      const response = await fetch(modelPath, { method: "HEAD" });
      return response.ok;
    } catch (error) {
      // Se a verificação HEAD falhar, assumir que o modelo pode existir
      // (pode ser problema de CORS ou navegador)
      console.warn(
        `ScoreCalculator: Verificação HEAD falhou para ${fileName}, tentando carregar mesmo assim:`,
        error.message
      );
      return true; // Retornar true para tentar carregar
    }
  }

  /**
   * Carrega um modelo específico dinamicamente
   * @param {number} year - Ano da prova
   * @param {string} area - Área
   * @param {string} language - Idioma (opcional)
   * @returns {Promise<Object|null>} Modelo carregado ou null se não existir
   */
  async loadModel(year, area, language = null) {
    const modelKey = `${year}_${area}${language ? "_" + language : ""}`;

    // Verificar se já está no cache
    if (this.loadedModels.has(modelKey)) {
      return this.loadedModels.get(modelKey);
    }

    const fileName = this.generateModelFileName(year, area, language);
    // Caminho para fetch (absoluto da raiz)
    const modelPath = `assets/js/models/${fileName}`;

    try {
      console.log(
        `ScoreCalculator: Tentando carregar modelo ${fileName} em ${modelPath}`
      );

      // Método alternativo: carregar via script tag dinâmico
      // Isso funciona melhor com arquivos que usam window.model
      const model = await this.loadModelViaScript(modelPath, modelKey);

      if (!model) {
        throw new Error("Modelo não encontrado no arquivo");
      }

      // Validar se o modelo tem os métodos necessários
      if (
        typeof model.predict !== "function" &&
        typeof model.predictWithArray !== "function"
      ) {
        throw new Error("Modelo não possui métodos de predição válidos");
      }

      // Teste básico do modelo para garantir que funciona
      try {
        const testPattern = new Array(45).fill(0);
        testPattern[0] = 1; // Primeira questão correta

        const testScore = model.predictWithArray
          ? model.predictWithArray(testPattern)
          : model.predict(testPattern);

        if (typeof testScore !== "number" || isNaN(testScore)) {
          throw new Error(`Modelo retornou valor inválido: ${testScore}`);
        }

        console.log(
          `✅ ScoreCalculator: Teste do modelo ${fileName} passou (score: ${testScore})`
        );
      } catch (testError) {
        throw new Error(`Falha no teste do modelo: ${testError.message}`);
      }

      // Cache do modelo
      this.loadedModels.set(modelKey, model);
      console.log(`ScoreCalculator: Modelo ${fileName} carregado com sucesso`);

      return model;
    } catch (error) {
      console.warn(
        `ScoreCalculator: Erro ao carregar modelo ${fileName}:`,
        error.message
      );
      return null;
    }
  }

  /**
   * Carrega modelo via script tag dinâmico
   * @param {string} modelPath - Caminho para o modelo
   * @param {string} modelKey - Chave única do modelo
   * @returns {Promise<Object|null>} Modelo carregado
   */
  async loadModelViaScript(modelPath, modelKey) {
    return new Promise((resolve, reject) => {
      // Backup da variável window.model atual (se existe)
      const originalWindowModel = window.model;

      // Criar um script tag único
      const script = document.createElement("script");
      script.src = modelPath;
      script.type = "text/javascript";

      console.log(
        `🔄 LoadModelViaScript: Carregando ${modelPath} com chave ${modelKey}`
      );

      // Callback quando carregado
      script.onload = () => {
        try {
          // Aguardar um pouco para garantir que o script foi executado
          setTimeout(() => {
            try {
              // O modelo deve estar disponível em window.model
              const model = window.model;

              if (model && typeof model.predict === "function") {
                console.log(
                  `✅ LoadModelViaScript: Modelo ${modelKey} carregado de window.model`
                );

                // CRÍTICO: Fazer uma cópia profunda do modelo para evitar sobrescrita
                const modelCopy = {
                  predict: model.predict.bind(model),
                  predictWithArray: model.predictWithArray
                    ? model.predictWithArray.bind(model)
                    : null,
                  getModelInfo: model.getModelInfo
                    ? model.getModelInfo.bind(model)
                    : null,
                  // Fazer cópia das propriedades importantes
                  objective: model.objective,
                  numClass: model.numClass,
                  featureNames: model.featureNames
                    ? [...model.featureNames]
                    : null,
                  trees: model.trees, // Referência às árvores (imutáveis)
                  // Adicionar identificador único
                  _modelKey: modelKey,
                  _loadedAt: new Date().toISOString(),
                  _filePath: modelPath,
                };

                console.log(
                  `🔒 LoadModelViaScript: Cópia independente criada para ${modelKey}`
                );
                console.log(
                  `🧪 LoadModelViaScript: Teste do modelo ${modelKey}:`,
                  typeof modelCopy.predict
                );
                console.log(
                  `📊 LoadModelViaScript: Features do modelo ${modelKey}:`,
                  modelCopy.featureNames?.length || "N/A"
                );

                // Restaurar o modelo original em window.model (se existia)
                if (originalWindowModel) {
                  window.model = originalWindowModel;
                  console.log(
                    `🔄 LoadModelViaScript: window.model restaurado para o modelo anterior`
                  );
                }

                // Limpar o script do DOM
                document.head.removeChild(script);
                resolve(modelCopy);
              } else {
                console.error(
                  `❌ LoadModelViaScript: window.model inválido para ${modelKey}:`,
                  model
                );

                // Restaurar modelo original
                if (originalWindowModel) {
                  window.model = originalWindowModel;
                }

                document.head.removeChild(script);
                reject(
                  new Error(
                    `Modelo não encontrado ou inválido em window.model para ${modelKey}`
                  )
                );
              }
            } catch (innerError) {
              console.error(
                `❌ LoadModelViaScript: Erro interno ao processar modelo ${modelKey}:`,
                innerError
              );

              // Restaurar modelo original
              if (originalWindowModel) {
                window.model = originalWindowModel;
              }

              document.head.removeChild(script);
              reject(innerError);
            }
          }, 150); // Aumentar para 150ms para garantir execução do script
        } catch (error) {
          console.error(
            `❌ LoadModelViaScript: Erro ao processar modelo ${modelKey}:`,
            error
          );

          // Restaurar modelo original
          if (originalWindowModel) {
            window.model = originalWindowModel;
          }

          document.head.removeChild(script);
          reject(error);
        }
      };

      // Callback quando há erro
      script.onerror = () => {
        console.error(
          `❌ LoadModelViaScript: Erro ao carregar script ${modelPath}`
        );

        // Restaurar modelo original
        if (originalWindowModel) {
          window.model = originalWindowModel;
        }

        document.head.removeChild(script);
        reject(new Error(`Erro ao carregar script do modelo: ${modelPath}`));
      };

      // Adicionar ao DOM para carregar
      document.head.appendChild(script);
    });
  }

  /**
   * Prepara o padrão de respostas na ordem de dificuldade
   * @param {Array} questions - Array de questões
   * @param {Object} answers - Respostas do usuário
   * @param {string} area - Área específica para filtrar
   * @returns {Array} Array de 0s e 1s na ordem de dificuldade
   */
  prepareDifficultyOrderedPattern(questions, answers, area) {
    console.log(
      `🎯 ScoreCalculator: ===== PREPARANDO PADRÃO PARA ÁREA ${area} =====`
    );
    console.log(`ScoreCalculator: Preparando padrão para área ${area}`);
    console.log(`ScoreCalculator: Total de questões: ${questions.length}`);
    console.log(
      `ScoreCalculator: Total de respostas: ${Object.keys(answers).length}`
    );

    // Debug: mostrar todas as questões e suas áreas
    console.log(
      `📋 ScoreCalculator: TODAS as questões no simulado:`,
      questions.map((q) => `Q${q.position}(área:${q.area})`).join(", ")
    );

    // Filtrar questões da área específica
    const areaQuestions = questions.filter((q) => q.area === area);
    console.log(
      `🔍 ScoreCalculator: Questões da área ${area}: ${areaQuestions.length}`
    );
    console.log(
      `📝 ScoreCalculator: Questões filtradas para área ${area}:`,
      areaQuestions.map((q) => `Q${q.position}(área:${q.area})`).join(", ")
    );

    // Separar questões válidas das anuladas
    const validQuestions = areaQuestions.filter((q) => !q.cancelled);
    const cancelledQuestions = areaQuestions.filter((q) => q.cancelled);

    console.log(
      `ScoreCalculator: Questões válidas: ${validQuestions.length}, anuladas: ${cancelledQuestions.length}`
    );

    // Ordenar questões válidas por dificuldade
    validQuestions.sort((a, b) => {
      // Obter dados de dificuldade do meta
      const difficultyA = this.getQuestionDifficulty(a);
      const difficultyB = this.getQuestionDifficulty(b);

      console.log(
        `ScoreCalculator: Questão ${a.position} (original: ${a.originalPosition}) - dificuldade: ${difficultyA}`
      );
      console.log(
        `ScoreCalculator: Questão ${b.position} (original: ${b.originalPosition}) - dificuldade: ${difficultyB}`
      );

      // Se ambos têm dificuldade, ordenar por dificuldade
      if (difficultyA !== null && difficultyB !== null) {
        return difficultyA - difficultyB;
      }

      // Se só um tem dificuldade, o que tem vai primeiro
      if (difficultyA !== null) return -1;
      if (difficultyB !== null) return 1;

      // Se nenhum tem, ordenar por posição original
      return (
        (a.originalPosition || a.position) - (b.originalPosition || b.position)
      );
    });

    console.log(
      `ScoreCalculator: Ordem final das questões válidas:`,
      validQuestions.map((q) => `${q.position}(${q.originalPosition})`)
    );

    // Criar padrão para questões válidas
    const validPattern = validQuestions.map((question) => {
      const userAnswer = answers[question.position];
      const correctAnswer = this.getCorrectAnswer(question);

      console.log(
        `📝 ScoreCalculator: Q${question.position}(área:${
          question.area
        }) - Usuário: "${userAnswer}", Correta: "${correctAnswer}", Resultado: ${
          !userAnswer || userAnswer !== correctAnswer ? 0 : 1
        }`
      );

      // Se não respondeu ou respondeu errado, retorna 0
      if (!userAnswer || userAnswer !== correctAnswer) {
        return 0;
      }

      return 1;
    });

    console.log(
      `✅ ScoreCalculator: Padrão de questões válidas para ${area}:`,
      validPattern.join(""),
      `(${validPattern.length} elementos)`
    );

    // Adicionar zeros para questões anuladas no final
    const cancelledPattern = new Array(cancelledQuestions.length).fill(0);

    if (cancelledQuestions.length > 0) {
      console.log(
        `🚫 ScoreCalculator: Adicionando ${cancelledQuestions.length} zeros para questões anuladas em ${area}`
      );
    }

    const finalPattern = [...validPattern, ...cancelledPattern];
    console.log(
      `🎯 ScoreCalculator: Padrão COMPLETO final para ${area}: ${finalPattern.join(
        ""
      )} (${finalPattern.length} elementos)`
    );

    return finalPattern;
  }

  /**
   * Obtém a dificuldade de uma questão do meta
   * @param {Object} question - Questão
   * @returns {number|null} Dificuldade ou null se não disponível
   */
  getQuestionDifficulty(question) {
    const config = this.app.getCurrentConfig();
    const meta = this.app.getMeta();

    if (!meta[config.year] || !meta[config.year][question.area]) {
      return null;
    }

    const questionMeta =
      meta[config.year][question.area][question.originalPosition];
    return questionMeta ? questionMeta.difficulty : null;
  }

  /**
   * Obtém a resposta correta de uma questão
   * @param {Object} question - Questão
   * @returns {string|null} Alternativa correta
   */
  getCorrectAnswer(question) {
    const config = this.app.getCurrentConfig();
    const meta = this.app.getMeta();

    if (!meta[config.year] || !meta[config.year][question.area]) {
      return null;
    }

    const questionMeta =
      meta[config.year][question.area][question.originalPosition];
    return questionMeta ? questionMeta.answer : null;
  }

  /**
   * Calcula a nota TRI para uma área específica
   * @param {string} area - Área (LC, CH, CN, MT)
   * @param {string} language - Idioma para LC (0 ou 1)
   * @returns {Promise<Object>} Resultado do cálculo
   */
  async calculateAreaScore(area, language = null) {
    const config = this.app.getCurrentConfig();
    const questions = this.app.getQuestions();
    const answers = this.app.getAnswers();

    console.log(`🔍 ScoreCalculator: ===== CALCULANDO ÁREA ${area} =====`);
    console.log(
      `ScoreCalculator: Calculando nota para área: ${area}, idioma: ${language}`
    );
    console.log(`ScoreCalculator: Configuração atual:`, config);
    console.log(
      `ScoreCalculator: Total de questões no simulado: ${questions.length}`
    );
    console.log(
      `ScoreCalculator: Total de respostas: ${Object.keys(answers).length}`
    );

    // Determinar a área correta para LC e a área de questões para filtrar
    let targetArea = area;
    let questionFilterArea = area;

    console.log(
      `🔍 ScoreCalculator: Área recebida: ${area}, Language recebido: ${language}`
    );

    if (area === "LC0") {
      targetArea = "LC";
      questionFilterArea = "LC0"; // Manter LC0 para filtrar questões
      language = "0"; // LC0 = Inglês = language 0 no modelo
    } else if (area === "LC1") {
      targetArea = "LC";
      questionFilterArea = "LC1"; // Manter LC1 para filtrar questões
      language = "1"; // LC1 = Espanhol = language 1 no modelo
    } else if (area.startsWith("LC") && language !== null) {
      // Se o código é apenas "LC" mas com language definido, determinar LC0 ou LC1
      targetArea = "LC";
      if (language === "0") {
        questionFilterArea = "LC0";
      } else if (language === "1") {
        questionFilterArea = "LC1";
      }
    }

    console.log(
      `✅ ScoreCalculator: Área alvo para modelo: ${targetArea}, área para filtrar questões: ${questionFilterArea}, language: ${language}`
    );

    // VERIFICAR QUANTAS QUESTÕES EXISTEM PARA ESTA ÁREA
    const areaQuestions = questions.filter(
      (q) => q.area === questionFilterArea
    );
    console.log(
      `🎯 ScoreCalculator: Questões encontradas para área ${questionFilterArea}:`,
      areaQuestions.length
    );
    console.log(
      `📋 ScoreCalculator: Detalhes das questões da área ${questionFilterArea}:`,
      areaQuestions.map((q) => `Q${q.position}(${q.area})`).join(", ")
    );

    try {
      // Verificar se existe modelo para esta configuração
      console.log(
        `🔍 ScoreCalculator: Verificando existência de modelo para ${
          config.year
        }-${targetArea}${language ? "-" + language : ""}`
      );

      const modelExists = await this.modelExists(
        config.year,
        targetArea,
        language
      );

      console.log(`📋 ScoreCalculator: Modelo existe: ${modelExists}`);

      // Sempre tentar carregar o modelo, mesmo que a verificação falhe
      // (a verificação pode falhar por questões de CORS mas o arquivo existir)
      const model = await this.loadModelWithFallback(
        config.year,
        targetArea,
        language
      );

      if (!model) {
        return {
          success: false,
          error: `Modelo não encontrado para ${targetArea} (ano ${config.year} e fallbacks)`,
          area: area,
          score: null,
        };
      }

      // Preparar padrão de respostas na ordem de dificuldade
      // Usar questionFilterArea para filtrar as questões corretas
      console.log(
        `🔍 ScoreCalculator: ANTES de preparar padrão - Área: ${area}, QuestionFilterArea: ${questionFilterArea}`
      );

      const pattern = this.prepareDifficultyOrderedPattern(
        questions,
        answers,
        questionFilterArea
      );

      console.log(
        `🎯 ScoreCalculator: Padrão RAW retornado para área ${area}:`,
        pattern.join(""),
        `(${pattern.length} elementos)`
      );

      // Garantir que temos exatamente 45 valores
      if (pattern.length !== 45) {
        console.log(
          `⚠️ ScoreCalculator: Ajustando padrão de ${pattern.length} para 45 elementos para área ${area}`
        );
        // Ajustar o padrão para ter exatamente 45 elementos
        if (pattern.length < 45) {
          // Preencher com zeros se necessário
          const zerosToAdd = 45 - pattern.length;
          console.log(
            `➕ ScoreCalculator: Adicionando ${zerosToAdd} zeros ao final para área ${area}`
          );
          pattern.push(...new Array(zerosToAdd).fill(0));
        } else {
          // Truncar se necessário
          const excess = pattern.length - 45;
          console.log(
            `✂️ ScoreCalculator: Removendo ${excess} elementos em excesso para área ${area}`
          );
          pattern.splice(45);
        }
      }

      console.log(
        `✅ ScoreCalculator: Padrão FINAL preparado para ${area}:`,
        pattern.join(""),
        `(${pattern.length} elementos)`
      );

      // Calcular a nota usando o modelo
      const score = model.predictWithArray
        ? model.predictWithArray(pattern)
        : model.predict(pattern);

      console.log(`🎯 ScoreCalculator: Nota calculada para ${area}: ${score}`);
      console.log(
        `📝 ScoreCalculator: Modelo usado: ${
          model._modelKey || "sem identificador"
        }`
      );
      console.log(
        `⏰ ScoreCalculator: Modelo carregado em: ${
          model._loadedAt || "sem timestamp"
        }`
      );

      return {
        success: true,
        area: area,
        score: Math.round(score * 10) / 10, // Arredondar para 1 casa decimal
        pattern: pattern.join(""),
        modelInfo: model.getModelInfo ? model.getModelInfo() : null,
        modelKey: model._modelKey || "unknown",
        modelLoadedAt: model._loadedAt || "unknown",
      };
    } catch (error) {
      console.error(
        `ScoreCalculator: Erro ao calcular nota para ${area}:`,
        error
      );
      return {
        success: false,
        error: error.message,
        area: area,
        score: null,
      };
    }
  }

  /**
   * Calcula nota TRI para a área atual do simulado
   * @returns {Promise<Object>} Resultado da área única
   */
  async calculateAllScores() {
    const config = this.app.getCurrentConfig();

    // Determinar a área a calcular (apenas uma)
    const areas = this.getAreasForExamType(config.type, config.language);

    if (areas.length === 0) {
      return {
        year: config.year,
        examType: config.type,
        language: config.language,
        score: null,
        error: "Tipo de exame não reconhecido",
        success: false,
      };
    }

    const area = areas[0]; // Sempre apenas uma área

    console.log(
      `🎯 ScoreCalculator: Calculando nota TRI para área única: ${area.name}`
    );

    try {
      const result = await this.calculateAreaScore(area.code, area.language);

      if (result.success) {
        return {
          year: config.year,
          examType: config.type,
          language: config.language,
          score: result.score,
          pattern: result.pattern,
          areaName: area.name,
          areaCode: area.code,
          modelInfo: result.modelInfo,
          modelKey: result.modelKey,
          success: true,
          error: null,
        };
      } else {
        const userFriendlyError = this.getUserFriendlyError(
          result.error,
          area.name,
          config.year
        );
        return {
          year: config.year,
          examType: config.type,
          language: config.language,
          score: null,
          areaName: area.name,
          areaCode: area.code,
          error: userFriendlyError,
          success: false,
        };
      }
    } catch (error) {
      return {
        year: config.year,
        examType: config.type,
        language: config.language,
        score: null,
        areaName: area.name,
        areaCode: area.code,
        error: `${area.name}: ${error.message}`,
        success: false,
      };
    }
  }

  /**
   * Determina as áreas a calcular baseado no tipo de prova
   * @param {string} examType - Tipo de prova (LC0, LC1, CH, CN, MT)
   * @param {string} language - Idioma selecionado (não usado mais)
   * @returns {Array} Array com apenas uma área para calcular
   */
  getAreasForExamType(examType, language) {
    console.log(`🎯 ScoreCalculator: Calculando área única: ${examType}`);

    const areaMap = {
      LC0: { code: "LC0", name: "Linguagens - Inglês", language: "0" },
      LC1: { code: "LC1", name: "Linguagens - Espanhol", language: "1" },
      CH: { code: "CH", name: "Ciências Humanas", language: null },
      CN: { code: "CN", name: "Ciências da Natureza", language: null },
      MT: { code: "MT", name: "Matemática", language: null },
    };

    const area = areaMap[examType];
    if (!area) {
      console.warn(
        `⚠️ ScoreCalculator: Tipo de exame desconhecido: ${examType}`
      );
      return [];
    }

    console.log(`✅ ScoreCalculator: Área para calcular:`, area);
    return [area]; // Sempre retorna array com apenas uma área
  }

  /**
   * Limpa o cache de modelos carregados
   */
  clearCache() {
    this.loadedModels.clear();
    console.log("ScoreCalculator: Cache de modelos limpo");
  }
  /**
   * Converte erro técnico em mensagem amigável ao usuário
   * @param {string} error - Erro técnico
   * @param {string} areaName - Nome da área
   * @param {number} year - Ano da prova
   * @returns {string} Mensagem amigável
   */
  getUserFriendlyError(error, areaName, year) {
    // Detectar tipos de erro e criar mensagens amigáveis
    if (error.includes("Modelo não encontrado")) {
      return `${areaName}: Modelo TRI não disponível para ${year}`;
    }

    if (error.includes("Erro ao carregar modelo") || error.includes("script")) {
      return `${areaName}: Erro ao carregar modelo para ${this.getAreaCode(
        areaName
      )}`;
    }

    if (
      error.includes("Falha no teste do modelo") ||
      error.includes("inválido")
    ) {
      return `${areaName}: Modelo corrompido ou incompatível`;
    }

    if (error.includes("questões")) {
      return `${areaName}: Questões insuficientes para cálculo TRI`;
    }

    // Erro genérico
    return `${areaName}: Erro no cálculo TRI`;
  }

  /**
   * Extrai código da área a partir do nome
   * @param {string} areaName - Nome da área
   * @returns {string} Código da área
   */
  getAreaCode(areaName) {
    const codeMap = {
      "Linguagens - Inglês": "LC0",
      "Linguagens - Espanhol": "LC1",
      "Ciências Humanas": "CH",
      "Ciências da Natureza": "CN",
      Matemática: "MT",
    };

    return codeMap[areaName] || "XX";
  }

  /**
   * Tenta carregar um modelo, fazendo fallback para anos anteriores se necessário
   * @param {number} year - Ano desejado
   * @param {string} area - Área
   * @param {string} language - Idioma (opcional)
   * @returns {Promise<Object|null>} Modelo carregado ou null
   */
  async loadModelWithFallback(year, area, language = null) {
    const modelKey = `${year}_${area}${language ? "_" + language : ""}`;
    console.log(
      `🔄 ScoreCalculator: Tentando carregar modelo ${modelKey} com fallback`
    );

    // Verificar se já está no cache
    if (this.loadedModels.has(modelKey)) {
      console.log(`✅ ScoreCalculator: Modelo ${modelKey} encontrado no cache`);
      return this.loadedModels.get(modelKey);
    }

    // Primeiro, tentar o ano solicitado
    console.log(`🎯 ScoreCalculator: Tentativa 1 - ano solicitado: ${year}`);
    let model = await this.loadModel(year, area, language);
    if (model) {
      console.log(
        `✅ ScoreCalculator: Modelo ${year}-${area} carregado com sucesso`
      );
      return model;
    }

    // Se falhar, tentar anos anteriores (até 3 anos para trás)
    const fallbackYears = [];
    for (let i = 1; i <= 3; i++) {
      const fallbackYear = year - i;
      if (fallbackYear >= 2016) {
        // Ano mínimo dos modelos
        fallbackYears.push(fallbackYear);
      }
    }

    console.log(
      `⚠️ ScoreCalculator: Modelo ${year}-${area} falhou, tentando fallback:`,
      fallbackYears
    );

    for (const fallbackYear of fallbackYears) {
      try {
        console.log(
          `🔄 ScoreCalculator: Tentando fallback ${fallbackYear}-${area}...`
        );
        model = await this.loadModel(fallbackYear, area, language);
        if (model) {
          console.log(
            `✅ ScoreCalculator: Usando modelo fallback ${fallbackYear}-${area} no lugar de ${year}-${area}`
          );
          // Colocar no cache com a chave original para próximas consultas
          this.loadedModels.set(modelKey, model);
          return model;
        }
      } catch (error) {
        console.log(
          `❌ ScoreCalculator: Fallback ${fallbackYear}-${area} também falhou:`,
          error.message
        );
      }
    }

    console.error(
      `❌ ScoreCalculator: Todos os fallbacks falharam para ${area}`
    );
    return null;
  }
}
