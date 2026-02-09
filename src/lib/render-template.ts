export function generateRenderHTML(code: string): string {
  const encodedCode = encodeURIComponent(code);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/prop-types@15/prop-types.min.js"></script>
  <script src="https://unpkg.com/recharts@2/umd/Recharts.js"></script>
  <link rel="stylesheet" href="https://unpkg.com/lucide-static@latest/font/lucide.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; }
    #error-display {
      color: #ef4444;
      background: #1e1e1e;
      padding: 20px;
      font-family: monospace;
      font-size: 14px;
      white-space: pre-wrap;
      display: none;
      border-top: 3px solid #ef4444;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <div id="error-display"></div>
  <script>
    // Make React available globally for Babel-transpiled code
    window.React = React;
    window.ReactDOM = ReactDOM;

    // Make recharts components available globally
    if (window.Recharts) {
      Object.assign(window, window.Recharts);
    }

    // Simple lucide-react shim providing common icons as SVG components
    window.LucideReact = window.LucideReact || {};
    (function() {
      function createIcon(pathD, displayName) {
        var Icon = function(props) {
          var size = props && props.size || 24;
          var color = props && props.color || 'currentColor';
          var strokeWidth = props && props.strokeWidth || 2;
          var className = props && props.className || '';
          return React.createElement('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: size,
            height: size,
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: color,
            strokeWidth: strokeWidth,
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
            className: className
          }, React.createElement('path', { d: pathD }));
        };
        Icon.displayName = displayName;
        return Icon;
      }

      // Common icons used in Claude artifacts
      var icons = {
        Check: 'M20 6 9 17l-5-5',
        X: 'M18 6 6 18M6 6l12 12',
        ChevronRight: 'm9 18 6-6-6-6',
        ChevronLeft: 'm15 18-6-6 6-6',
        ChevronDown: 'm6 9 6 6 6-6',
        ChevronUp: 'm18 15-6-6-6 6',
        Plus: 'M5 12h14M12 5v14',
        Minus: 'M5 12h14',
        Search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
        Star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
        Heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
        ArrowRight: 'M5 12h14M12 5l7 7-7 7',
        ArrowLeft: 'M19 12H5M12 19l-7-7 7-7',
        Menu: 'M4 12h16M4 6h16M4 18h16',
        Settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z',
        Home: 'M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
        Trash2: 'M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6',
        Edit: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
        Copy: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
        Eye: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
        EyeOff: 'M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49M14.084 14.158a3 3 0 0 1-4.242-4.242M9.9 4.24A10.73 10.73 0 0 0 2.062 11.7a1 1 0 0 0 0 .696 10.75 10.75 0 0 0 5.389 5.876M3 3l18 18',
        Globe: 'M21.54 15H17a2 2 0 0 0-2 2v4.54M7 3.34V5a3 3 0 0 0 3 3a2 2 0 0 1 2 2c0 1.1.9 2 2 2a2 2 0 0 0 2-2c0-1.1.9-2 2-2h3.17M11 21.95V18a2 2 0 0 0-2-2a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z',
        Lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
        Unlock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 9.9-1',
        AlertCircle: 'M12 8v4M12 16h.01M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z',
        Info: 'M12 16v-4M12 8h.01M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10z',
        ExternalLink: 'M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6',
        Download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
        Upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
        Code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
        Terminal: 'M4 17l6-6-6-6M12 19h8',
      };

      for (var name in icons) {
        window.LucideReact[name] = createIcon(icons[name], name);
        window[name] = window.LucideReact[name];
      }
    })();

    // Module-to-global mapping for import preprocessing
    var MODULE_MAP = {
      'react': 'React',
      'react-dom': 'ReactDOM',
      'react-dom/client': 'ReactDOM',
      'recharts': 'Recharts',
      'lucide-react': 'LucideReact',
    };

    // Error handling
    window.onerror = function(msg, url, line, col, error) {
      var display = document.getElementById('error-display');
      display.style.display = 'block';
      display.textContent = 'Runtime Error: ' + msg + '\\nLine: ' + line;
      return true;
    };

    try {
      var code = decodeURIComponent("${encodedCode}");

      // --- Step 1: Pre-process imports ---
      // Replace ES module imports with global variable destructuring
      code = code.replace(
        /^\\s*import\\s+(?:(\\w+)\\s*,?\\s*)?(?:\\{([^}]*)\\})?\\s*from\\s*["']([^"']+)["'];?\\s*$/gm,
        function(match, defaultImport, namedImports, moduleName) {
          var globalVar = MODULE_MAP[moduleName];
          if (!globalVar) return '// [unsupported import] ' + match.trim();
          var parts = [];
          if (defaultImport && defaultImport !== 'React' && defaultImport !== 'ReactDOM') {
            parts.push('var ' + defaultImport + ' = ' + globalVar + ';');
          }
          if (namedImports) {
            parts.push('var {' + namedImports + '} = ' + globalVar + ';');
          }
          if (parts.length === 0) return '// ' + match.trim();
          return parts.join('\\n');
        }
      );

      // --- Step 2: Pre-process exports ---
      // Strip "export default function Name" -> "function Name" and capture name
      var defaultExportName = null;
      code = code.replace(
        /export\\s+default\\s+function\\s+(\\w+)/g,
        function(m, name) { defaultExportName = name; return 'function ' + name; }
      );
      // Strip "export default Name;" -> "" and capture name
      code = code.replace(
        /export\\s+default\\s+(\\w+)\\s*;?/g,
        function(m, name) {
          if (!defaultExportName) defaultExportName = name;
          return '';
        }
      );
      // Strip any remaining named exports: "export const/function ..." -> "const/function ..."
      code = code.replace(/export\\s+(const|let|var|function|class)\\s/g, '$1 ');

      // --- Step 3: Check if code has its own render call ---
      var hasRenderCall = /createRoot|ReactDOM\\.render/.test(code);

      // --- Step 4: Babel transform (JSX only, modules already handled) ---
      var transformed = Babel.transform(code, {
        presets: ['react'],
        filename: 'artifact.jsx'
      }).code;

      // --- Step 5: Execute ---
      var script = document.createElement('script');
      script.textContent = transformed;
      document.body.appendChild(script);

      // --- Step 6: Auto-render if no render call and we found a default export ---
      if (!hasRenderCall && defaultExportName) {
        var autoRender = document.createElement('script');
        autoRender.textContent =
          'if (typeof ' + defaultExportName + ' === "function") {' +
          '  ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(' + defaultExportName + '));' +
          '}';
        document.body.appendChild(autoRender);
      }
    } catch (e) {
      var display = document.getElementById('error-display');
      display.style.display = 'block';
      display.textContent = 'Transpilation Error: ' + e.message;
    }
  </script>
</body>
</html>`;
}
