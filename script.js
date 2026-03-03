let htmlEditor, cssEditor, jsEditor;
let previewFrame = document.getElementById("preview-frame");
let consoleOutput = document.getElementById("console-output");
let currentTab = "preview";

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
  htmlEditor.setValue(
    localStorage.getItem("html") ||
      '<h1>Hello World!</h1><button onclick="testConsole()">Test Console</button>',
  );
  cssEditor.setValue(
    localStorage.getItem("css") ||
      "body {\n  margin: 20px;\n  font-family: Arial;\n}\nh1 { color: #3498db; }\nbutton { padding: 10px; background: #e74c3c; color: white; border: none; }",
  );
  jsEditor.setValue(
    localStorage.getItem("js") ||
      'function testConsole() {\n  console.log("✅ Console works!");\n  console.error("❌ Error test");\n  console.warn("⚠️ Warning test");\n}',
  );

  // Event listeners
  document.getElementById("download").onclick = downloadProject;
  document.getElementById("clear").onclick = clearAll;
  document.getElementById("clear-console").onclick = () =>
    (consoleOutput.textContent = "");

  // Tab switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => switchTab(tab.dataset.tab);
  });

  // Live updates
  attachListeners();
  run(); // Initial render
}

function switchTab(tabName) {
  currentTab = tabName;
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");
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
    <script>
        // Override console methods to capture output
        const consoleLog = [];
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        console.log = (...args) => {
            consoleLog.push(['LOG', new Date().toLocaleTimeString(), ...args]);
            originalLog(...args);
        };
        console.error = (...args) => {
            consoleLog.push(['ERROR', new Date().toLocaleTimeString(), ...args]);
            originalError(...args);
        };
        console.warn = (...args) => {
            consoleLog.push(['WARN', new Date().toLocaleTimeString(), ...args]);
            originalWarn(...args);
        };
        
        ${jsCode}
        
        // Send console to parent
        window.parent.postMessage({type: 'console', logs: consoleLog}, '*');
    <\/script>
</body>
</html>`;

  previewFrame.srcdoc = fullCode;

  // Auto-save
  localStorage.setItem("html", htmlCode);
  localStorage.setItem("css", cssCode);
  localStorage.setItem("js", jsCode);
}

// Listen for console messages from iframe
window.addEventListener("message", (e) => {
  if (e.data.type === "console" && currentTab === "console") {
    const logs = e.data.logs;
    consoleOutput.textContent = logs
      .map((log) => {
        const [type, time, ...msg] = log;
        return `[${time}] ${type}: ${msg.join(" ")}`;
      })
      .join("\\n");
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
});

// Download and Clear functions (unchanged)
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
  a.download = `${project.name}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function clearAll() {
  if (confirm("Clear all code and localStorage?")) {
    htmlEditor.setValue("");
    cssEditor.setValue("");
    jsEditor.setValue("");
    localStorage.clear();
    run();
  }
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
