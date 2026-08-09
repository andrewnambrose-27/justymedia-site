(function () {
  const componentScript = document.createElement("script");
  componentScript.src = "/site-components.js";
  componentScript.defer = true;
  document.head.append(componentScript);

  const form = document.querySelector("[data-email-form]");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const project = data.get("project-type") || "Creative project";
    const subject = `${project} enquiry from ${data.get("name")}`;
    const lines = [
      `Name: ${data.get("name")}`,
      `Email: ${data.get("email")}`,
      `Business or organisation: ${data.get("business") || "Not provided"}`,
      `Project type: ${project}`,
      `Budget range: ${data.get("budget") || "Not provided"}`,
      "",
      String(data.get("message"))
    ];

    window.location.href = `mailto:andrew.n.ambrose@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
  });
})();
