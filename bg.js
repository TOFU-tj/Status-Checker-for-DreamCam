async function checkUrl(url, timeoutMs = 8000) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const doFetch = async (method) => {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal
    });
    return res;
  };

  try {
    let res;
    try {
      res = await doFetch("HEAD");
    } catch {
      res = await doFetch("GET");
    }

    return {
      url,
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      finalUrl: res.url,
      ms: Math.round(performance.now() - started)
    };
  } catch (e) {
    return {
      url,
      ok: false,
      status: null,
      statusText: null,
      finalUrl: null,
      ms: Math.round(performance.now() - started),
      error: String(e)
    };
  } finally {
    clearTimeout(timer);
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg?.type !== "CHECK_URLS") {
      sendResponse({ error: "Unknown message type" });
      return;
    }

    const urls = Array.isArray(msg.urls) ? msg.urls : [];
    const results = {};

    for (const u of urls) results[u] = await checkUrl(u);

    sendResponse({ ts: new Date().toISOString(), results });
  })();

  return true;
});
