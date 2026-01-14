const TARGETS = [
  { key: "dreamcam",  name: "DreamCam",        url: "https://dreamcam.com/" },
  { key: "models",   name: "DreamCam Models", url: "https://models.dreamcamtrue.com/" },
  { key: "bsscdn",   name: "DreamCam CDN",    url: "https://bss-cdn.dreamcam.com/" },
  { key: "bss",      name: "DreamCam BSS",    url: "https://bss.dreamcamtrue.com/" },
  { key: "stripchat",name: "Stripchat",       url: "https://stripchat.com/" }
];

const $ = (id) => document.getElementById(id);

function badgeClass(status) {
  if (status === 200) return "ok";
  if (status === 404) return "warn";
  if (status && status >= 200 && status < 400) return "ok";
  if (status && status >= 400 && status < 500) return "warn";
  if (status && status >= 500) return "bad";
  return "bad";
}

function statusLabel(r) {
  if (!r) return "—";
  if (r.error) return "ERROR";
  if (r.status == null) return "NO STATUS";
  return String(r.status);
}

function msLabel(r) {
  if (!r || r.ms == null) return "—";
  return `${r.ms} ms`;
}

function makeCard(t, r) {
  const card = document.createElement("div");
  card.className = "card";

  const row = document.createElement("div");
  row.className = "row";

  const left = document.createElement("div");

  const name = document.createElement("div");
  name.className = "name";
  name.textContent = t.name;

  const url = document.createElement("div");
  url.className = "url";
  url.textContent = t.url;

  left.appendChild(name);
  left.appendChild(url);

  const right = document.createElement("div");
  right.className = "right";

  const badge = document.createElement("div");
  badge.className = `badge ${badgeClass(r?.status)}`;
  badge.textContent = statusLabel(r);

  const small = document.createElement("div");
  small.className = "small";
  small.textContent = r?.error ? String(r.error) : msLabel(r);

  right.appendChild(badge);
  right.appendChild(small);

  row.appendChild(left);
  row.appendChild(right);
  card.appendChild(row);

  return card;
}

function computeSummary(resp) {
  let ok = 0, warn = 0, bad = 0;

  for (const t of TARGETS) {
    const r = resp?.results?.[t.url];
    if (!r || r.error || r.status == null) { bad++; continue; }
    if (r.status === 200) ok++;
    else if (r.status === 404 || (r.status >= 400 && r.status < 500)) warn++;
    else if (r.status >= 200 && r.status < 400) ok++;
    else bad++;
  }

  return { ok, warn, bad };
}

function toClipboardText(resp) {
  const lines = [];
  lines.push(`ts: ${resp.ts}`);
  for (const t of TARGETS) {
    const r = resp.results?.[t.url];
    if (!r) {
      lines.push(`${t.url} -> NO RESULT`);
      continue;
    }
    if (r.error) {
      lines.push(`${t.url} -> ERROR (${r.error})`);
      continue;
    }
    lines.push(`${t.url} -> ${r.status} (${r.ms} ms)`);
  }
  return lines.join("\n");
}

async function run() {
  $("btnCheck").disabled = true;
  $("btnCopy").disabled = true;
  $("summary").textContent = "Checking…";
  $("ts").textContent = "—";

  const list = $("list");
  list.innerHTML = "";
  for (const t of TARGETS) list.appendChild(makeCard(t, null));

  const urls = TARGETS.map(t => t.url);
  const resp = await chrome.runtime.sendMessage({ type: "CHECK_URLS", urls });

  list.innerHTML = "";
  for (const t of TARGETS) {
    const r = resp?.results?.[t.url];
    list.appendChild(makeCard(t, r));
  }

  $("ts").textContent = resp.ts;
  const s = computeSummary(resp);
  $("summary").textContent = `OK: ${s.ok}  ·  WARN: ${s.warn}  ·  BAD: ${s.bad}`;

  // Enable copy
  $("btnCopy").disabled = false;
  $("btnCopy").onclick = async () => {
    const text = toClipboardText(resp);
    await navigator.clipboard.writeText(text);
    $("btnCopy").textContent = "Copied!";
    setTimeout(() => ($("btnCopy").textContent = "Copy"), 900);
  };

  $("btnCheck").disabled = false;
}

$("btnCheck").addEventListener("click", run);
