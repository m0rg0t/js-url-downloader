import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = await readFile(new URL('../url-download.js', import.meta.url), 'utf8');
const { default: download } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

function parent() {
  return {
    children: [],
    appendChild(node) {
      node.parentNode?.removeChild(node);
      this.children.push(node);
      node.parentNode = this;
    },
    removeChild(node) {
      const index = this.children.indexOf(node);
      if (index < 0) throw new Error('NotFoundError');
      this.children.splice(index, 1);
      node.parentNode = null;
    },
  };
}

function setup(t, { supported = true, click = () => {} } = {}) {
  const body = parent();
  const created = [];
  const timers = [];
  t.mock.method(globalThis, 'setTimeout', (callback, delay) => {
    timers.push({ callback, delay });
  });
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  Object.defineProperty(globalThis, 'document', { configurable: true, value: {
    body,
    createElement(tag) {
      assert.equal(tag, 'a');
      const anchor = { style: {}, attributes: {}, parentNode: null,
        setAttribute(name, value) { this.attributes[name] = value; },
        click() { click(this); },
      };
      if (supported) anchor.download = '';
      created.push(anchor);
      return anchor;
    },
  }});
  t.after(() => {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete globalThis.document;
  });
  return { body, created, timers, flush() { timers.forEach(({ callback }) => callback()); } };
}

test('sets URL, requested filename and hidden style, then delays cleanup', t => {
  const dom = setup(t);
  download('/file.pdf', 'report.pdf');
  const [anchor] = dom.created;
  assert.equal(anchor.href, '/file.pdf');
  assert.equal(anchor.attributes.download, 'report.pdf');
  assert.equal(anchor.style.display, 'none');
  assert.equal(anchor.attributes.target, undefined);
  assert.deepEqual(dom.body.children, [anchor]);
  assert.equal(dom.timers[0].delay, 200);
  dom.flush();
  assert.deepEqual(dom.body.children, []);
});

test('falls back to URL as filename and uses _blank only without download support', t => {
  const dom = setup(t, { supported: false });
  download('https://example.invalid/file');
  assert.equal(dom.created[0].attributes.download, 'https://example.invalid/file');
  assert.equal(dom.created[0].attributes.target, '_blank');
  dom.flush();
});

test('independent calls clean up their own anchors', t => {
  const dom = setup(t);
  download('/one');
  download('/two');
  assert.equal(dom.body.children.length, 2);
  dom.flush();
  assert.equal(dom.body.children.length, 0);
});

test('cleanup tolerates an externally removed anchor and repeated callbacks', t => {
  const dom = setup(t);
  download('/file');
  dom.body.removeChild(dom.created[0]);
  assert.doesNotThrow(() => { dom.flush(); dom.flush(); });
});

test('cleanup removes an anchor from its current parent after reparenting', t => {
  const dom = setup(t);
  download('/file');
  const elsewhere = parent();
  elsewhere.appendChild(dom.created[0]);
  assert.doesNotThrow(() => dom.flush());
  assert.equal(elsewhere.children.length, 0);
});

test('a click exception propagates but still schedules cleanup', t => {
  const error = new Error('click failed');
  const dom = setup(t, { click() { throw error; } });
  assert.throws(() => download('/file'), e => e === error);
  assert.equal(dom.timers.length, 1);
  dom.flush();
  assert.equal(dom.body.children.length, 0);
});
