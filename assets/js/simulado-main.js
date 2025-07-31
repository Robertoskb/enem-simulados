// Arquivo principal do simulado - Inicialização
import { SimuladoApp } from "./simulado/SimuladoApp.js";

// Inicializar aplicação quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", () => {
  window.simuladoApp = new SimuladoApp();
});
