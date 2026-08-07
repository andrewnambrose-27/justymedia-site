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

const footer = document.querySelector(".site-footer");

if (footer) {
  const footerNav = footer.querySelector("nav");
  const footerLinks = [
    ["/photography/automotive-photography/", "Automotive Photography"],
    ["/photography/rush-magazine/", "RUSH Magazine"],
    ["/phone-wallpapers/", "Phone Wallpapers"],
    ["/services-pricing.html", "Services & Pricing"],
    ["/about-me.html", "About Us"],
    ["/contact.html", "Contact Us"],
    ["/privacy-policy.html", "Privacy Policy"],
    ["/terms-and-conditions.html", "Terms And Conditions"],
  ];

  if (!footer.querySelector("img")) {
    const headerLogo = document.querySelector(".site-header .brand img");
    if (headerLogo) {
      const logo = headerLogo.cloneNode(true);
      footer.prepend(logo);
    }
  }

  if (footerNav) {
    footerNav.setAttribute("aria-label", "Footer links");
    footerNav.replaceChildren(
      ...footerLinks.map(([href, label]) => {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        return link;
      }),
    );
  }
}

document.querySelectorAll('a[href$="#about"]').forEach((link) => {
  link.href = "/about-me.html";
});

document.querySelectorAll('a[href$="#contact"]').forEach((link) => {
  link.href = "/contact.html";
});

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
