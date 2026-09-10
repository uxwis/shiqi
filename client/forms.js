import { escape as e } from "../shared/presentation.js";
export const options = (list, value, placeholder) =>
  `${placeholder ? `<option value="">${e(placeholder)}</option>` : ""}` +
  list
    .map(
      (i) =>
        `<option value="${e(i.id ?? i)}" ${String(i.id ?? i) === String(value) ? "selected" : ""}>${e(i.name ?? i)}</option>`,
    )
    .join("");
export const field = (name, label, value = "", attrs = "") =>
  `<label>${label}<input name="${name}" value="${e(value)}" ${attrs}></label>`;
let fieldSequence = 0;
export function area(name, label, value = "", attrs = "") {
  const id = "field-" + name + "-" + ++fieldSequence;
  return `<label for="${id}">${label}</label><textarea id="${id}" name="${name}" ${attrs}>${e(value)}</textarea>`;
}
export const failure = '<p class="form-error" role="alert" tabindex="-1"></p>';
export const refData = (item) =>
  `data-type="${item.type}" data-id="${e(item.id)}" data-revision="${item.revision}"`;
