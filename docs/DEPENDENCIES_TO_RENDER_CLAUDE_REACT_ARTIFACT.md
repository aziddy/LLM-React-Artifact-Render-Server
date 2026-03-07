# Dependencies to Render Claude.ai React/JSX Artifacts

## CDN Dependencies

Loaded in `<head>` before any user code executes:

| Library | URL | Version | Purpose |
|---|---|---|---|
| React | `https://unpkg.com/react@18/umd/react.production.min.js` | 18 | Core React library |
| ReactDOM | `https://unpkg.com/react-dom@18/umd/react-dom.production.min.js` | 18 | DOM rendering (`createRoot`) |
| Babel Standalone | `https://unpkg.com/@babel/standalone/babel.min.js` | latest | Browser-side JSX → JS transpilation |
| Tailwind CSS | `https://cdn.tailwindcss.com` | latest | Utility-first CSS framework |
| PropTypes | `https://unpkg.com/prop-types@15/prop-types.min.js` | 15 | Runtime prop type checking |
| Recharts | `https://unpkg.com/recharts@2/umd/Recharts.js` | 2 | Data visualization / charting |
| Lucide Static (CSS) | `https://unpkg.com/lucide-static@latest/font/lucide.min.css` | latest | Icon font stylesheet |

---

## Runtime Shims

Set up in a `<script>` block before the artifact code runs:

### Global Variables

```
window.React    = React
window.ReactDOM = ReactDOM
```

All Recharts named exports are spread onto `window`:

```js
if (window.Recharts) {
  Object.assign(window, window.Recharts);
}
```

### Lucide-React Icon Shim

A custom `window.LucideReact` object provides ~30 commonly-used icons as lightweight SVG React components. Each icon also gets assigned directly to `window` so bare references like `<Check />` work.

Icons included:

> Check, X, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Plus, Minus, Search, Star, Heart, ArrowRight, ArrowLeft, Menu, Settings, Home, Trash2, Edit, Copy, Eye, EyeOff, Globe, Lock, Unlock, AlertCircle, Info, ExternalLink, Download, Upload, Code, Terminal

### Module-to-Global Map

ES `import` statements are rewritten to reference these globals:

| Module specifier | Global variable |
|---|---|
| `react` | `React` |
| `react-dom` | `ReactDOM` |
| `react-dom/client` | `ReactDOM` |
| `recharts` | `Recharts` |
| `lucide-react` | `LucideReact` |
