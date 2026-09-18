const STORAGE_KEY = "unsplash-agent-webhook-url";
const DEFAULT_WEBHOOK_URL =
  "https://rafha1082.app.n8n.cloud/webhook/b04b0235-03c8-4c17-b508-24ed3c5e69cb";

const form = document.getElementById("search-form");
const input = document.getElementById("query-input");
const button = document.getElementById("search-button");
const status = document.getElementById("status");
const results = document.getElementById("results");
const webhookUrlInput = document.getElementById("webhook-url");
const saveWebhookButton = document.getElementById("save-webhook");

function getWebhookUrl() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_WEBHOOK_URL;
}

function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function renderImages(urls) {
  results.innerHTML = "";
  for (const url of urls) {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Unsplash search result";
    img.loading = "lazy";

    link.appendChild(img);
    results.appendChild(link);
  }
}

function extractImageUrls(data) {
  // The workflow responds with either [{ images: [...] }] or { images: [...] }.
  const payload = Array.isArray(data) ? data[0] : data;
  if (!payload || !Array.isArray(payload.images)) {
    throw new Error("Unexpected response shape from webhook.");
  }
  return payload.images;
}

async function searchImages(word) {
  const webhookUrl = getWebhookUrl();
  const url = `${webhookUrl}?q=${encodeURIComponent(word)}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Webhook responded with ${response.status}`);
  }

  const data = await response.json();
  return extractImageUrls(data);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const word = input.value.trim();
  if (!word) return;

  button.disabled = true;
  results.innerHTML = "";
  setStatus(`Searching for "${word}"...`);

  try {
    const urls = await searchImages(word);
    if (urls.length === 0) {
      setStatus(`No photos found for "${word}".`);
    } else {
      setStatus("");
      renderImages(urls);
    }
  } catch (err) {
    console.error(err);
    setStatus(
      "Couldn't reach the webhook. Check the webhook URL in settings, make sure the workflow is active, and that CORS is enabled on it.",
      true
    );
  } finally {
    button.disabled = false;
  }
});

saveWebhookButton.addEventListener("click", () => {
  const value = webhookUrlInput.value.trim();
  if (value) {
    localStorage.setItem(STORAGE_KEY, value);
    setStatus("Webhook URL saved.");
  } else {
    localStorage.removeItem(STORAGE_KEY);
    setStatus("Webhook URL reset to default.");
  }
});

webhookUrlInput.value = getWebhookUrl();
