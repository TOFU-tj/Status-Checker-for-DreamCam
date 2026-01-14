const URLS = [
  "https://dreamcam.com/",
  "https://models.dreamcamtrue.com/",
  "https://bss-cdn.dreamcam.com/",
  "https://bss.dreamcamtrue.com/",
  "https://stripchat.com/"
];

function formatResult(resp) {
  const lines = [];
  lines.push(`ts: ${resp.ts}`);
  lines.push("");

  for (const u of URLS) {
    const r = resp.results?.[u];
    if (!r) {
      lines.push(`${u} -> no result`);
      continue;
    }

    if (r.error) {
      lines.push(`${u} -> ERROR (${r.error})`);
      continue;
    }

    const code = r.status ?? "null";
    const ok = r.ok ? "OK" : "NOT OK";
    const finalUrl = r.finalUrl && r.finalUrl !== u ? ` (final: ${r.finalUrl})` : "";
    lines.push(`${u} -> ${code} ${ok}${finalUrl}`);
  }

  return lines.join("\n");
}

document.getElementById("run").addEventListener("click", async () => {
  const out = document.getElementById("out");
  out.textContent = "Checking…";

  const resp = await chrome.runtime.sendMessage({ type: "CHECK_URLS", urls: URLS });
  out.textContent = formatResult(resp);
});
