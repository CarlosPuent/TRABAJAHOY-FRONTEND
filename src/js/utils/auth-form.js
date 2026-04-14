// Auth Form Helpers

export function setFormError(errorElement, message = "") {
  if (!errorElement) return;

  const form = errorElement.closest("form");

  if (message) {
    errorElement.textContent = message;
    errorElement.style.display = "block";
    if (form) {
      form.classList.add("auth-form--has-error");
    }
    return;
  }

  errorElement.textContent = "";
  errorElement.style.display = "none";
  if (form) {
    form.classList.remove("auth-form--has-error");
  }
}

export function bindPasswordToggle(toggleButton, input) {
  if (!toggleButton || !input) return;

  toggleButton.addEventListener("click", () => {
    const showPassword = input.type === "password";
    input.type = showPassword ? "text" : "password";
    toggleButton.setAttribute(
      "aria-label",
      showPassword ? "Ocultar contraseña" : "Mostrar contraseña",
    );
    toggleButton.setAttribute("aria-pressed", String(showPassword));
  });
}

export function createSubmitStateController({
  submitButton,
  controls = [],
  loadingHtml,
}) {
  if (!submitButton) {
    return () => {};
  }

  const defaultHtml = submitButton.innerHTML;

  return (isSubmitting) => {
    submitButton.disabled = isSubmitting;
    submitButton.setAttribute("aria-busy", String(isSubmitting));
    submitButton.classList.toggle("is-loading", isSubmitting);

    controls.forEach((control) => {
      if (control) {
        control.disabled = isSubmitting;
      }
    });

    submitButton.innerHTML = isSubmitting ? loadingHtml : defaultHtml;
  };
}
