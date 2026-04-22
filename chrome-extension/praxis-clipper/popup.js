const STORAGE_KEY = "praxis_clipper_state";
const MAX_HISTORY = 12;

const el = {
  praxisUrl: document.getElementById("praxisUrl"),
  scope: document.getElementById("scope"),
  channelId: document.getElementById("channelId"),
  videoId: document.getElementById("videoId"),
  note: document.getElementById("note"),
  copyJson: document.getElementById("copyJson"),
  openPraxis: document.getElementById("openPraxis"),
  saveClip: document.getElementById("saveClip"),
  clearHistory: document.getElementById("clearHistory"),
  status: document.getElementById("status"),
  historyList: document.getElementById("historyList"),
};

function setStatus(text) {
  el.status.textContent = text;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] ?? null;
}

function formatNow() {
  return new Date().toISOString();
}

function createClip(tab, overrides = {}) {
  return {
    createdAt: formatNow(),
    scope: el.scope.value,
    channelId: el.channelId.value.trim(),
    videoId: el.videoId.value.trim(),
    note: el.note.value.trim(),
    source: {
      title: tab?.title || "",
      url: tab?.url || "",
    },
    ...overrides,
  };
}

async function loadState() {
  const saved = await chrome.storage.local.get(STORAGE_KEY);
  const state = saved[STORAGE_KEY] || {};

  el.praxisUrl.value = state.praxisUrl || "http://localhost:3000";
  el.scope.value = state.scope || "workspace";
  el.channelId.value = state.channelId || "";
  el.videoId.value = state.videoId || "";
  renderHistory(state.history || []);

  const tab = await getActiveTab();
  if (tab?.title) {
    el.note.placeholder = `Quick note for: ${tab.title}`;
  }
}

async function persistPartial(partial) {
  const saved = await chrome.storage.local.get(STORAGE_KEY);
  const prev = saved[STORAGE_KEY] || {};
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      ...prev,
      ...partial,
    },
  });
}

function renderHistory(history) {
  el.historyList.innerHTML = "";
  history.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="meta">${item.createdAt || ""} · ${item.scope || "workspace"}</div>
      <div class="title">${item.source?.title || item.source?.url || "(untitled)"}</div>
    `;
    el.historyList.appendChild(li);
  });
}

async function saveClipToHistory(clip) {
  const saved = await chrome.storage.local.get(STORAGE_KEY);
  const prev = saved[STORAGE_KEY] || {};
  const history = [clip, ...(prev.history || [])].slice(0, MAX_HISTORY);

  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      ...prev,
      praxisUrl: el.praxisUrl.value.trim() || "http://localhost:3000",
      scope: el.scope.value,
      channelId: el.channelId.value.trim(),
      videoId: el.videoId.value.trim(),
      history,
    },
  });

  renderHistory(history);
}

el.copyJson.addEventListener("click", async () => {
  const tab = await getActiveTab();
  const clip = createClip(tab);
  await navigator.clipboard.writeText(JSON.stringify(clip, null, 2));
  setStatus("Copied clip JSON.");
});

el.openPraxis.addEventListener("click", async () => {
  const base = (el.praxisUrl.value || "http://localhost:3000").trim();
  await chrome.tabs.create({ url: base });
  await persistPartial({
    praxisUrl: base,
    scope: el.scope.value,
    channelId: el.channelId.value.trim(),
    videoId: el.videoId.value.trim(),
  });
  setStatus("Opened Praxis.");
});

el.saveClip.addEventListener("click", async () => {
  const tab = await getActiveTab();
  const clip = createClip(tab);
  await saveClipToHistory(clip);
  setStatus("Saved clip locally.");
});

el.clearHistory.addEventListener("click", async () => {
  const saved = await chrome.storage.local.get(STORAGE_KEY);
  const prev = saved[STORAGE_KEY] || {};
  await chrome.storage.local.set({
    [STORAGE_KEY]: {
      ...prev,
      history: [],
    },
  });
  renderHistory([]);
  setStatus("History cleared.");
});

["input", "change"].forEach((eventName) => {
  [el.praxisUrl, el.scope, el.channelId, el.videoId].forEach((node) => {
    node.addEventListener(eventName, async () => {
      await persistPartial({
        praxisUrl: el.praxisUrl.value.trim() || "http://localhost:3000",
        scope: el.scope.value,
        channelId: el.channelId.value.trim(),
        videoId: el.videoId.value.trim(),
      });
    });
  });
});

loadState();
