(function () {
  if (!document.querySelector('script[src^="/site-components.js"]')) {
    const componentScript = document.createElement("script");
    componentScript.src = "/site-components.js?v=20260904-3";
    componentScript.defer = true;
    document.head.append(componentScript);
  }

  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector("[data-form-status]");
  const startedAt = form.querySelector("[data-form-started-at]");
  if (startedAt) startedAt.value = String(Date.now());

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    const originalLabel = button ? button.textContent : "Send enquiry";

    if (button) {
      button.disabled = true;
      button.textContent = "Sending…";
    }
    if (status) {
      status.className = "form-status";
      status.textContent = "Sending your enquiry…";
    }

    try {
      const response = await fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Your enquiry could not be sent.");
      }

      form.reset();
      if (startedAt) startedAt.value = String(Date.now());
      if (status) {
        status.className = "form-status is-success";
        status.textContent = "Thanks — your enquiry has been sent. I’ll get back to you as soon as I can.";
      }
    } catch (error) {
      if (status) {
        status.className = "form-status is-error";
        status.textContent = error instanceof TypeError
          ? "The form service could not be reached. Please try again in a moment."
          : error instanceof Error
          ? error.message
          : "Your enquiry could not be sent. Please try again in a moment.";
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
    }
  });
})();
