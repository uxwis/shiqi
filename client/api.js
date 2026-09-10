export async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const error = new Error(data?.error?.message || "请求失败，请稍后重试");
    error.status = response.status;
    throw error;
  }
  return data;
}
let toastTimer;
export function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3500);
}
export function modal(html) {
  const dialog = document.querySelector("#dialog");
  dialog.querySelector("#dialog-body").innerHTML = html;
  if (!dialog.open) dialog.showModal();
  return dialog;
}
export function formError(form, error) {
  const node = form.querySelector(".form-error");
  if (node) node.textContent = error.message;
  else toast(error.message);
}
export async function submitSafely(form, action) {
  const buttons = [
    ...form.querySelectorAll("button[type=submit],button:not([type])"),
  ];
  buttons.forEach((b) => (b.disabled = true));
  const error = form.querySelector(".form-error");
  if (error) error.textContent = "";
  try {
    await action();
  } catch (e) {
    formError(form, e);
  } finally {
    buttons.forEach((b) => (b.disabled = false));
  }
}
export const values = (form) => Object.fromEntries(new FormData(form));
