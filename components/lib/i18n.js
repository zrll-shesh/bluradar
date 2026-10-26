'use client';
import { createContext, useContext } from 'react';
import DICT from './en.json';

export const LangContext = createContext('id');
export const useLang = () => useContext(LangContext);

const NUM = /\d+(?:[.,]\d+)*/g;
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// Indonesian number formatting to English: 1.234,5 -> 1,234.5
function numToEn(tok) {
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(tok)) return tok.replace(/\./g, '#').replace(',', '.').replace(/#/g, ',');
  if (/^\d+,\d+$/.test(tok)) return tok.replace(',', '.');
  return tok;
}

// Rupiah units: rb = thousand, jt = million, M (miliar) = billion, T (triliun) = trillion
const UNIT = { rb: 'k', jt: 'M', M: 'B', T: 'T' };
function unitsToEn(s) {
  return s
    .replace(/(Rp\s?-?[\d.,]+)\s?(rb|jt|M|T)\b/g, (_, n, u) => n + UNIT[u])
    .replace(/(\d[\d.,]*)\s?(rb|jt)\b/g, (_, n, u) => n + UNIT[u]);
}

function formatEn(s) {
  return unitsToEn(s.replace(NUM, numToEn));
}

const WORDS = { Mei: 'May', Agu: 'Aug', Okt: 'Oct', Des: 'Dec', Ya: 'Yes', 's.d.': 'to' };
const PATTERNS = {};
for (const [k, v] of Object.entries(DICT)) {
  if (k.includes('{0}')) PATTERNS[k] = v;
}

function patternKey(text) {
  const nums = [];
  const key = text.replace(NUM, (m) => { nums.push(m); return `{${nums.length - 1}}`; });
  return [key, nums];
}

export function translateText(raw) {
  if (!raw) return raw;
  const text = norm(raw);
  if (!text) return raw;
  if (!/[A-Za-zÀ-ÿ]/.test(text)) return raw.replace(text, formatEn(text));
  let out = DICT[text];
  if (out === undefined) {
    const [key, nums] = patternKey(text);
    const tpl = PATTERNS[key];
    if (tpl !== undefined) out = tpl.replace(/\{(\d+)\}/g, (_, i) => nums[+i]);
  }
  if (out === undefined) {
    if (typeof window !== 'undefined') (window.__i18nMissing ||= new Set()).add(text);
    const words = text.replace(/\b(Mei|Agu|Okt|Des|Ya|s\.d\.)(?=\s|$)/g, (w) => WORDS[w]);
    const conv = formatEn(words);
    return conv === text ? raw : raw.replace(text, conv);
  }
  const lead = raw.match(/^\s*/)[0];
  const tail = raw.match(/\s*$/)[0];
  return lead + formatEn(out) + tail;
}

const ATTRS = ['title', 'aria-label', 'placeholder', 'alt'];
const ORIG = new WeakMap();
const DONE = new WeakMap();
const ORIG_ATTR = new WeakMap();
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);

function trNode(node) {
  if (node.nodeType === 3) {
    const p = node.parentNode;
    if (!p || SKIP.has(p.nodeName) || (p.closest && p.closest('[data-no-tr]'))) return;
    const v = node.nodeValue;
    if (DONE.get(node) === v) return;
    const t = translateText(v);
    ORIG.set(node, v);
    if (t !== v) node.nodeValue = t;
    DONE.set(node, node.nodeValue);
  } else if (node.nodeType === 1) {
    if (SKIP.has(node.nodeName) || node.hasAttribute('data-no-tr')) return;
    for (const a of ATTRS) {
      const v = node.getAttribute(a);
      if (!v) continue;
      const store = ORIG_ATTR.get(node) || {};
      if (store[a] && store[a].tr === v) continue;
      const t = translateText(v);
      store[a] = { orig: v, tr: t };
      ORIG_ATTR.set(node, store);
      if (t !== v) node.setAttribute(a, t);
    }
    node.childNodes.forEach(trNode);
  }
}

function restoreNode(node) {
  if (node.nodeType === 3) {
    const o = ORIG.get(node);
    if (o !== undefined && DONE.get(node) === node.nodeValue) node.nodeValue = o;
    DONE.delete(node);
  } else if (node.nodeType === 1) {
    const store = ORIG_ATTR.get(node);
    if (store) for (const [a, { orig, tr }] of Object.entries(store)) if (node.getAttribute(a) === tr) node.setAttribute(a, orig);
    ORIG_ATTR.delete(node);
    node.childNodes.forEach(restoreNode);
  }
}

export function startTranslation(root) {
  trNode(root);
  const obs = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') trNode(m.target);
      else if (m.type === 'attributes') trNode(m.target);
      else m.addedNodes.forEach(trNode);
    }
  });
  obs.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  return () => { obs.disconnect(); restoreNode(root); };
}
