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

  // Load from localStorage with demo code
  htmlEditor.setValue(
    localStorage.getItem("html") ||
      '<h1>Pro Code Editor</h1><button onclick="testConsole()">🧪 Test Console</button><br><button onclick="testError()">💥 Test Error</button>',
  );
  cssEditor.setValue(
    localStorage.getItem("css") ||
      "body {\n  margin: 20px;\n  font-family: Arial;\n  text-align: center;\n}\nh1 { color: #3498db; }\nbutton { \n  margin: 10px; \n  padding: 12px 24px; \n  background: #e74c3c; \n  color: white; \n  border: none; \n  border-radius: 6px; \n  cursor: pointer;\n}",
  );
  jsEditor.setValue(
    localStorage.getItem("js") ||
      `function testConsole() {
  console.log("✅ Console LOG works!");
  console.error("💥 Manual ERROR works!");
  console.warn("⚠️ Manual WARNING works!");
}

function testError() {
  undefinedVariable;  // This will show in console!
}`,
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

// ✅ FIXED: Complete error handling + console capture
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
        // Complete console + error capture system
        window.consoleLogs = [];
        
        const logEntry = (type, ...args) => {
            window.consoleLogs.push({
                type: type,
                time: new Date().toLocaleTimeString(),
                args: args.map(arg => {
                    if (arg === null) return 'null';
                    if (arg === undefined) return 'undefined';
                    return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                }).join(' ')
            });
        };
        
        // Override ALL console methods
        const originalConsoleMethods = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        
        console.log = (...args) => { logEntry('LOG', ...args); originalConsoleMethods.log(...args); };
        console.error = (...args) => { logEntry('ERROR', ...args); originalConsoleMethods.error(...args); };
        console.warn = (...args) => { logEntry('WARN', ...args); originalConsoleMethods.warn(...args); };
        console.info = (...args) => { logEntry('INFO', ...args); originalConsoleMethods.info(...args); };
        
        // Capture ALL unhandled errors
        window.onerror = (msg, url, lineNo, colNo, error) => {
            logEntry('ERROR', 'Uncaught:', msg, 'line:', lineNo + ':', colNo);
            return false;
        };
        
        window.addEventListener('unhandledrejection', (e) => {
            logEntry('ERROR', 'Promise rejected:', e.reason || 'Unknown');
        });
        
        // Execute user code with full error capture
        try {
            ${jsCode}
        } catch(e) {
            console.error('Runtime error:', e.message || e);
        }
        
        // Send console data to parent window
        window.parent.postMessage({type: 'console', logs: window.consoleLogs}, '*');
    <\/script>
</body>
</html>`;

  previewFrame.srcdoc = fullCode;

  // Auto-save
  localStorage.setItem("html", htmlCode);
  localStorage.setItem("css", cssCode);
  localStorage.setItem("js", jsCode);
}

// Receive console messages from iframe
window.addEventListener("message", (e) => {
  if (e.data.type === "console" && currentTab === "console") {
    const logs = e.data.logs || [];
    consoleOutput.textContent = logs
      .map((log) => {
        const emoji =
          log.type === "LOG"
            ? "📄"
            : log.type === "ERROR"
              ? "💥"
              : log.type === "WARN"
                ? "⚠️"
                : "ℹ️";
        return `[${log.time}] ${emoji} ${log.type}: ${log.args}`;
      })
      .join("\\n");
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }
});

// Download project
function downloadProject() {
  const project = {
    name: "pro-code-editor-project",
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
  console.log("✅ Project downloaded!");
}

// Clear everything
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
