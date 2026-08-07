const toggle = document.querySelector(".nav-toggle");
const menu = document.querySelector("#nav-menu");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

const legalContent = document.querySelector("[data-legal-source]");

if (legalContent) {
  const source = legalContent.dataset.legalSource;

  fetch(source)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Unable to load legal content.");
      }
      return response.text();
    })
    .then((text) => renderLegalContent(legalContent, text))
    .catch(() => {
      legalContent.textContent = "This page could not be loaded. Please try again shortly.";
    });
}

function renderLegalContent(container, text) {
  const fragment = document.createDocumentFragment();
  let list;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) {
      list = undefined;
      continue;
    }

    if (line.startsWith("# ")) {
      fragment.append(createTextElement("h2", line.slice(2)));
    } else if (line.startsWith("## ")) {
      fragment.append(createTextElement("h3", line.slice(3)));
    } else if (line.startsWith("- ")) {
      if (!list) {
        list = document.createElement("ul");
        fragment.append(list);
      }
      list.append(createTextElement("li", line.slice(2)));
    } else {
      fragment.append(createTextElement("p", line));
    }
  }

  container.replaceChildren(fragment);
}

function createTextElement(tagName, text) {
  const element = document.createElement(tagName);
  const email = "andrew.n.ambrose@gmail.com";
  const emailPosition = text.toLowerCase().indexOf(email);

  if (emailPosition === -1) {
    element.textContent = text;
    return element;
  }

  element.append(text.slice(0, emailPosition));
  const link = document.createElement("a");
  link.href = `mailto:${email}`;
  link.textContent = email;
  element.append(link, text.slice(emailPosition + email.length));
  return element;
}
