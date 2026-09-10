import { escape as e } from "../shared/presentation.js";

export function dashboardShell({ name, path, tab, tabs, contentId, metrics = "", footer = "", counts = {} }) {
  const currentLabel = tabs.find(([key]) => key === tab)?.[1] || "此栏目不存在";
  const links = tabs.map(([key, label]) => {
    const params = new URLSearchParams({ tab: key });
    if (path === "/admin" && key === "review") params.set("queue", "review");
    return `<a href="${e(path + "?" + params)}" ${tab === key ? 'aria-current="page"' : ""}><span>${e(label)}</span>${counts[key] != null ? `<small class="dashboard-count">${e(counts[key])}</small>` : ""}</a>`;
  }).join("");
  return `<div class="dashboard-layout"><aside class="dashboard-sidebar" aria-label="${e(name)}导航"><button class="dashboard-nav-toggle" type="button" aria-expanded="false" aria-controls="dashboard-navigation"><span>栏目导航 <strong>${e(currentLabel)}</strong></span><span class="dashboard-chevron" aria-hidden="true">⌄</span></button><div class="dashboard-navigation" id="dashboard-navigation"><p class="dashboard-nav-label">${e(name)}</p><nav class="dashboard-nav" aria-label="${e(name)}栏目">${links}</nav>${footer ? `<div class="dashboard-nav-footer">${footer}</div>` : ""}</div></aside><section class="dashboard-main" aria-labelledby="dashboard-heading">${metrics}<h2 class="dashboard-heading" id="dashboard-heading">${e(currentLabel)}</h2><div id="${e(contentId)}"></div></section></div>`;
}

export function bindDashboardNavigation(container) {
  const button = container.querySelector(".dashboard-nav-toggle");
  const navigation = container.querySelector(".dashboard-navigation");
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(expanded));
    navigation.classList.toggle("is-expanded", expanded);
  });
  container.querySelector(".dashboard-sidebar").addEventListener("keydown", event => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      button.click();
      button.focus();
    }
  });
  const header = document.querySelector(".site-header");
  if (header) {
    const updateOffset = () => container.style.setProperty("--dashboard-sticky-top", header.getBoundingClientRect().height + 24 + "px");
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(header);
    window.addEventListener("pagehide", event => {
      if (!event.persisted) observer.disconnect();
    }, { once: true });
  }
}
