const html = document.getElementById("html");
const css = document.getElementById("css");
const js = document.getElementById("js");
const preview = document.getElementById("preview");

function init() {
  html.value = localStorage.getItem("html") || "";
  css.value = localStorage.getItem("css") || "body { margin: 20px; }";
  js.value = localStorage.getItem("js") || "";
  run();
}

function run() {
  const fullCode = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>${css.value}</style>
        </head>
        <body>${html.value}
            <script>${js.value}<\/script>
        <\/body>
        <\/html>
    `;
  preview.srcdoc = fullCode;
  localStorage.setItem("html", html.value);
  localStorage.setItem("css", css.value);
  localStorage.setItem("js", js.value);
}

html.addEventListener("input", run);
css.addEventListener("input", run);
js.addEventListener("input", run);

init();
