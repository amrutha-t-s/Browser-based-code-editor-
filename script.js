let htmlEditor, cssEditor, jsEditor;
const preview = document.getElementById("preview");

function init() {
  // Initialize syntax-highlighted editors
  htmlEditor = CodeMirror.fromTextArea(document.getElementById("html"), {
    mode: "htmlmixed",
    lineNumbers: true,
    theme: "default",
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    autofocus: true,
  });

  cssEditor = CodeMirror.fromTextArea(document.getElementById("css"), {
    mode: "css",
    lineNumbers: true,
    theme: "default",
    tabSize: 2,
    lineWrapping: true,
  });

  jsEditor = CodeMirror.fromTextArea(document.getElementById("js"), {
    mode: "javascript",
    lineNumbers: true,
    theme: "default",
    tabSize: 2,
    lineWrapping: true,
  });

  // Load from localStorage with defaults
  htmlEditor.setValue(localStorage.getItem("html") || "<h1>Hello World!</h1>");
  cssEditor.setValue(
    localStorage.getItem("css") ||
      "body {\n  margin: 20px;\n  font-family: Arial;\n}\nh1 { color: #3498db; }",
  );
  jsEditor.setValue(localStorage.getItem("js") || "");

  // NEW: Button event listeners
  document.getElementById("download").onclick = downloadProject;
  document.getElementById("clear").onclick = clearAll;

  // Live updates
  attachListeners();
  run(); // Initial render
}

// NEW: Download Project as JSON
function downloadProject() {
  const project = {
    name: "code-editor-project",
    html: htmlEditor.getValue(),
    css: cssEditor.getValue(),
    js: jsEditor.getValue(),
    timestamp: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(project, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name}-${new Date().getTime()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log("✅ Project downloaded!");
}

// NEW: Clear All (with confirmation)
function clearAll() {
  if (confirm("Clear all code and localStorage? This cannot be undone.")) {
    htmlEditor.setValue("");
    cssEditor.setValue("");
    jsEditor.setValue("");
    localStorage.clear();
    run();
    console.log("🗑️ Cleared everything!");
  }
}

function attachListeners() {
  const debounce = (fn, ms) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  };

  const update = debounce(run, 300);

  htmlEditor.on("change", update);
  cssEditor.on("change", update);
  jsEditor.on("change", update);
}

function run() {
  const htmlCode = htmlEditor.getValue();
  const cssCode = cssEditor.getValue();
  const jsCode = jsEditor.getValue();

  const fullCode = `<!DOCTYPE html>
<html>
<head>
    <style>${cssCode}</style>
</head>
<body>${htmlCode}
    <script>${jsCode}<\/script>
</body>
</html>`;

  preview.srcdoc = fullCode;

  // Auto-save
  localStorage.setItem("html", htmlCode);
  localStorage.setItem("css", cssCode);
  localStorage.setItem("js", jsCode);
}

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === "s") {
      e.preventDefault();
      run();
    }
  }
});

init();
