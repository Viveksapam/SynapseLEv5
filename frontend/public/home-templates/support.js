/* DC Logic Framework - Minimal Support Library */
class DCLogic {
  state = {};
  setState(newState) {
    this.state = { ...this.state, ...newState };
    location.reload();
  }
  render() {
    // Will be overridden by subclasses
  }
  renderVals() {
    return {};
  }
}

let globalComponent = null;
let globalVals = null;

// Initialize DC components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const scripts = document.querySelectorAll('script[data-dc-script]');
  scripts.forEach((script) => {
    try {
      eval(script.textContent);
      globalComponent = new Component();
      globalVals = globalComponent.renderVals();
      interpolateValues(document, globalVals, globalComponent);
    } catch (err) {
      console.error('DC Logic initialization error:', err);
    }
  });
});

// Simple template value interpolation
function interpolateValues(root, vals, component) {
  // Handle sc-for loops first (order matters)
  const scFors = Array.from(root.querySelectorAll('sc-for'));
  scFors.forEach((el) => {
    const listAttr = el.getAttribute('list');
    const asAttr = el.getAttribute('as');
    const template = el.innerHTML.trim();

    let listValue = vals;
    const listPath = listAttr.match(/\{\{\s*([^}]+)\s*\}\}/)?.[1];
    if (listPath) {
      const keys = listPath.split('.');
      for (const k of keys) {
        listValue = listValue?.[k];
      }
    }

    if (Array.isArray(listValue)) {
      let html = '';
      listValue.forEach((item, idx) => {
        let itemHtml = template;
        // Replace all {{ var.prop }} style references
        itemHtml = itemHtml.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
          const expr_trimmed = expr.trim();
          if (expr_trimmed.startsWith(asAttr)) {
            const propPath = expr_trimmed.substring(asAttr.length).replace(/^\./, '');
            if (!propPath) return JSON.stringify(item);
            const propKeys = propPath.split('.');
            let value = item;
            for (const pk of propKeys) {
              value = value?.[pk];
            }
            return value !== undefined ? String(value) : match;
          }
          return match;
        });
        html += itemHtml;
      });
      el.outerHTML = html;
    }
  });

  // Then handle remaining {{ }} replacements in attributes and text
  const allNodes = root.querySelectorAll('*');
  allNodes.forEach((el) => {
    // Handle attributes with {{ }}
    Array.from(el.attributes).forEach((attr) => {
      let value = attr.value;
      value = value.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
        const keys = expr.trim().split('.');
        let result = vals;
        for (const k of keys) {
          result = result?.[k];
        }
        if (typeof result === 'function') return match;
        return result !== undefined ? String(result) : match;
      });
      if (attr.name === 'onclick' && value.includes('select')) {
        // Handle onClick for spotlight items
        el.addEventListener('click', function() {
          if (globalComponent && globalVals) {
            const selected = globalVals.spotlight.find(v => v.title === el.querySelector('p')?.textContent);
            if (selected && selected.select) selected.select();
          }
        });
      } else {
        attr.value = value;
      }
    });

    // Handle text nodes
    if (el.childNodes.length > 0) {
      Array.from(el.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          let text = node.textContent;
          text = text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr) => {
            const keys = expr.trim().split('.');
            let result = vals;
            for (const k of keys) {
              result = result?.[k];
            }
            return result !== undefined ? String(result) : match;
          });
          if (text !== node.textContent) {
            node.textContent = text;
          }
        }
      });
    }
  });
}
