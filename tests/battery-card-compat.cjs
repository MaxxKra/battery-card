const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const read = (name) => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const classes = new Map();
class Element {
  clientWidth = 158;
  attachShadow() {this.shadowRoot={innerHTML:'',querySelectorAll:()=>[],querySelector:()=>null};}
  dispatchEvent(event) {this.lastEvent=event;}
  constructor() { this.clientWidth = 158; }
  attachShadow() {
    this.shadowRoot = {innerHTML: '', querySelectorAll: () => [], querySelector: () => null};
  }
  dispatchEvent(event) { this.lastEvent = event; }
}
const scope = {
  HTMLElement: Element,
  customElements: {get: (key) => classes.get(key), define: (key, value) => classes.set(key, value)},
  window: {}, document: {createElement: () => ({})},
  CustomEvent: class {constructor(type, options) {this.type = type; this.detail = options.detail;}},
};
vm.createContext(scope);
const source = read('battery-card-v2.js');
const legacy = read('battery-card.js');
const layoutMethod = legacy.slice(legacy.indexOf('    getLayout('), legacy.indexOf('    convertStyleConfig('));
const colorMethod = legacy.slice(legacy.indexOf('    getBatteryColor('), legacy.indexOf('    getLayout('));
vm.runInContext(source.replace(/\}\)\(\);\s*$/, 'globalThis.testHooks = {originalLayout, originalColor, imageWidthFor};})();'), scope);
const original = vm.runInNewContext('(new (class { convertStyleConfig() {return "";} getBatteryImage() {return "";}\n' +
  layoutMethod + colorMethod + '\n})())');
original.config = {};
for (const layout of ['default','left','right','top','bottom','line_left','line_right','unknown']) {
  assert.equal(JSON.stringify(scope.testHooks.originalLayout(layout)), JSON.stringify(original.getLayout(layout, 50)), layout);
}
for (let value = 0; value <= 100; value++) {
  assert.equal(scope.testHooks.originalColor(value), original.getBatteryColor(value));
}
for (const width of [0, 120, 158, 320, 800]) {
  for (const percent of [10, 30, 60, 100, 150]) {
    assert.ok(Math.abs(scope.testHooks.imageWidthFor({styles:{image:[{size:percent+'%'}]}}, width) -
      Math.min(width * 33 / 100, 100) * percent / 100) < 1e-8);
  }
}
const cfg = {entity:'sensor.battery',layout:'right',name:'Schloss Eingang',styles:{
  card:[{background:'transparent'},{border:'2px solid var(--primary-color)'}],
  name:[{'font-size':'1.2em'}],state:[{'font-size':'18px'}],image:[{size:'60%'},{width:'37px'}]}};
const Card = classes.get('battery-card');
const card = new Card();
card.setConfig(cfg);
card.hass = {states:{'sensor.battery':{state:'100',attributes:{}}}};
const rendered = card.shadowRoot.innerHTML.replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g,'PNG');
assert.match(rendered,/grid-area:2 \/ 3 \/ 4 \/ 4/); // right = percentage to the right
assert.match(rendered,/grid-area:1 \/ 1 \/ 2 \/ 4/); // name spans full width
assert.match(rendered,/h2 class="original-name" style="font-size:1.2em"/);
assert.match(rendered,/object-fit:contain;margin:0 auto;;?width:37px/); // styles.image targets the img
assert.match(rendered,/background:transparent;border:2px solid var\(--primary-color\)/);
assert.match(rendered,/font-size:24px;color:#229c0d;font-size:18px/);
assert.equal(card.getCardSize(),1);
const Editor = classes.get('battery-card-editor');
const editor = new Editor();
editor.setConfig(cfg);
editor._setEntry(0,'name','Neuer Name');
assert.equal(JSON.stringify(editor.lastEvent.detail.config.styles),JSON.stringify(cfg.styles));
assert.match(editor.shadowRoot.innerHTML,/placeholder="Automatisch wie Original" value=""/);
const before = read('battery-card.js');
const images = (text) => text.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/g);
assert.deepEqual(images(source),images(before));
console.log('PASS: all seven original layouts, original colors, percentage sizing at five widths, styles on original elements, editor preservation, seven unchanged PNGs.');
