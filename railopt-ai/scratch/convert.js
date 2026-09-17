const fs = require('fs');
const path = require('path');

function htmlToJsx(html) {
  let jsx = html;
  // replace class= with className=
  jsx = jsx.replace(/\bclass=/g, 'className=');
  // replace for= with htmlFor=
  jsx = jsx.replace(/\bfor=/g, 'htmlFor=');
  // replace tabindex= with tabIndex=
  jsx = jsx.replace(/\btabindex=/g, 'tabIndex=');
  // replace onclick= with onClick=
  jsx = jsx.replace(/\bonclick=/g, 'onClick=');
  // replace onchange= with onChange=
  jsx = jsx.replace(/\bonchange=/g, 'onChange=');
  // replace onsubmit= with onSubmit=
  jsx = jsx.replace(/\bonsubmit=/g, 'onSubmit=');
  // replace autocomplete= with autoComplete=
  jsx = jsx.replace(/\bautocomplete=/g, 'autoComplete=');
  // replace autofocus= with autoFocus=
  jsx = jsx.replace(/\bautofocus=/g, 'autoFocus=');
  // replace readonly= with readOnly=
  jsx = jsx.replace(/\breadonly=/g, 'readOnly=');
  // replace colspan= with colSpan=
  jsx = jsx.replace(/\bcolspan=/g, 'colSpan=');
  // replace rowspan= with rowSpan=
  jsx = jsx.replace(/\browspan=/g, 'rowSpan=');

  // Convert self-closing tags
  const voidTags = ['input', 'img', 'br', 'hr', 'link', 'meta', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
  voidTags.forEach(tag => {
    const regex = new RegExp('<' + tag + '([^>]*?)(?<!/)>', 'gi');
    jsx = jsx.replace(regex, '<' + tag + '$1 />');
  });

  // Convert HTML comments to JSX comments
  jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

  // Convert inline style strings: style="..." to style={{...}}
  jsx = jsx.replace(/style="([^"]*)"/g, (match, p1) => {
    const styleObj = {};
    p1.split(';').forEach(rule => {
      const parts = rule.split(':');
      if (parts.length >= 2) {
        let key = parts[0].trim();
        let val = parts.slice(1).join(':').trim();
        if (key) {
          // camelCase key
          key = key.replace(/-([a-z])/g, g => g[1].toUpperCase());
          styleObj[key] = val;
        }
      }
    });
    return 'style={' + JSON.stringify(styleObj) + '}';
  });

  return jsx;
}

const screens = ['Login', 'SubmitRequest', 'RiskQueue', 'BlockOptimization', 'AdminApproval', 'BlockCalendar', 'Reports'];

screens.forEach(name => {
  const content = fs.readFileSync(path.join('scratch', name + '.html'), 'utf8');
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    let bodyContent = bodyMatch[1];
    let converted = htmlToJsx(bodyContent);
    fs.writeFileSync(path.join('scratch', name + '_body.jsx'), converted);
    console.log('Converted ' + name + ' (length: ' + converted.length + ')');
  }
});
