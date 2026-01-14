async function checkUrl(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const tryFetch = async (method) => {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal
    });

    return {
      url,
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      finalUrl: res.url
    };
  };

  try {
    // HEAD быстрее, но иногда режут → fallback GET
    try {
      return await tryFetch("HEAD");
    } catch {
      return await tryFetch("GET");
    }
  } catch (e) {
    return {
      url,
      ok: false,
      status: null,
      statusText: null,
      finalUrl: null,
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

    // последовательно = стабильнее
    for (const u of urls) results[u] = await checkUrl(u);

    sendResponse({ ts: new Date().toISOString(), results });
  })();

  return true;
});
