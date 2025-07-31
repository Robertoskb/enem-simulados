// Controlador de modais
export class ModalController {
  constructor(app) {
    this.app = app;
  }

  showFinishModal() {
    const modal = document.getElementById("finish-modal");
    modal.style.display = "flex";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    const cancelBtn = document.getElementById("finish-cancel");
    const confirmBtn = document.getElementById("finish-confirm");

    // Focus no botão cancelar por padrão
    setTimeout(() => cancelBtn.focus(), 100);

    const closeModal = () => {
      // Remover listeners antes de fechar
      this.removeEventListeners(cancelBtn, confirmBtn, modal);

      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      setTimeout(() => (modal.style.display = "none"), 300);
    };

    // Remover event listeners anteriores para evitar conflitos
    this.removeEventListeners(cancelBtn, confirmBtn, modal);

    // Adicionar novos event listeners
    const cancelHandler = () => closeModal();
    const confirmHandler = () => {
      closeModal();
      this.app.calculateAndShowResults().catch(console.error);
    };
    const modalClickHandler = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };
    const escapeHandler = (e) => {
      if (e.key === "Escape" && modal.classList.contains("show")) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    };

    cancelBtn.addEventListener("click", cancelHandler);
    confirmBtn.addEventListener("click", confirmHandler);
    modal.addEventListener("click", modalClickHandler);
    document.addEventListener("keydown", escapeHandler);

    // Armazenar handlers para remoção posterior
    modal._handlers = {
      cancelHandler,
      confirmHandler,
      modalClickHandler,
      escapeHandler,
    };
  }

  showBackModal() {
    const modal = document.getElementById("back-modal");
    modal.style.display = "flex";
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");

    const cancelBtn = document.getElementById("back-cancel");
    const confirmBtn = document.getElementById("back-confirm");

    // Focus no botão cancelar por padrão
    setTimeout(() => cancelBtn.focus(), 100);

    const closeModal = () => {
      // Remover listeners antes de fechar
      this.removeEventListeners(cancelBtn, confirmBtn, modal);

      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      setTimeout(() => (modal.style.display = "none"), 300);
    };

    // Remover event listeners anteriores para evitar conflitos
    this.removeEventListeners(cancelBtn, confirmBtn, modal);

    // Adicionar novos event listeners
    const cancelHandler = () => closeModal();
    const confirmHandler = () => {
      closeModal();
      this.app.uiController.showConfigScreen();
      this.app.resetSimulado();
    };
    const modalClickHandler = (e) => {
      if (e.target === modal) {
        closeModal();
      }
    };
    const escapeHandler = (e) => {
      if (e.key === "Escape" && modal.classList.contains("show")) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    };

    cancelBtn.addEventListener("click", cancelHandler);
    confirmBtn.addEventListener("click", confirmHandler);
    modal.addEventListener("click", modalClickHandler);
    document.addEventListener("keydown", escapeHandler);

    // Armazenar handlers para remoção posterior
    modal._handlers = {
      cancelHandler,
      confirmHandler,
      modalClickHandler,
      escapeHandler,
    };
  }

  closeAllModals() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      // Limpar handlers se existirem
      if (modal._handlers) {
        const cancelBtn = modal.querySelector(".cancel-btn");
        const confirmBtn = modal.querySelector(".confirm-btn");

        if (cancelBtn && confirmBtn) {
          this.removeEventListeners(cancelBtn, confirmBtn, modal);
        }
      }

      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      setTimeout(() => (modal.style.display = "none"), 300);
    });
  }

  removeEventListeners(cancelBtn, confirmBtn, modal) {
    // Remover handlers anteriores se existirem
    if (modal._handlers) {
      cancelBtn.removeEventListener("click", modal._handlers.cancelHandler);
      confirmBtn.removeEventListener("click", modal._handlers.confirmHandler);
      modal.removeEventListener("click", modal._handlers.modalClickHandler);

      // Remover escape handler do document
      if (modal._handlers.escapeHandler) {
        document.removeEventListener("keydown", modal._handlers.escapeHandler);
      }

      delete modal._handlers;
    }
  }
}
