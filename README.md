# Unsplash Image Agent

An [n8n](https://n8n.io/) workflow that turns a webhook into a simple image-search API. Send it a search term and it queries the [Unsplash](https://unsplash.com/) Search Photos API on your behalf, then responds with a clean JSON array of 3 full-size image URLs — no client-side API key handling or response parsing required.

This is useful as a lightweight "image agent" building block: point a chatbot, form, or automation at the webhook URL and get back ready-to-use image links for whatever topic it asks for.

## What it does

1. A client sends a `GET` request to the workflow's webhook with a search term (`?q=rain`).
2. The workflow calls the Unsplash API, searching for photos matching that term and asking for 3 results per page.
3. The raw Unsplash response (which includes a lot of metadata per photo — dimensions, colors, photographer info, likes, etc.) is trimmed down to just the 3 full-resolution image URLs.
4. That trimmed JSON is sent back to the client as the webhook's HTTP response.

The whole round trip — client request → Unsplash search → response shaping → client response — happens inside a single n8n workflow with no external server or code to deploy.

## Workflow architecture

The workflow is defined in `unsplash image agent.json` and is built from four connected n8n nodes, wired in a straight line:

```
Webhook → HTTP Request → Edit Fields → Respond to Webhook
```

![Workflow screenshot](images/unsplash%20image%20agent%20worflow%20screenshot.png)

### 1. Webhook (trigger node)

- **Type:** `n8n-nodes-base.webhook`
- **Path:** `b04b0235-03c8-4c17-b508-24ed3c5e69cb` — this is the unique URL segment n8n generates for the trigger, e.g. `.../webhook/b04b0235-03c8-4c17-b508-24ed3c5e69cb`.
- **Response mode:** `responseNode` — the HTTP response isn't sent immediately; it's deferred until the **Respond to Webhook** node runs later in the flow, so the final, transformed data is what gets returned.
- Expects the search term as a query-string parameter named `q` (`$json.query.q`).

### 2. HTTP Request (call Unsplash)

- **Type:** `n8n-nodes-base.httpRequest`
- **URL:** `https://api.unsplash.com/search/photos`
- **Query parameters:**
  - `query` = `{{ $json.query.q }}` — passes the incoming search term straight through to Unsplash.
  - `per_page` = `3` — limits Unsplash to returning 3 results, so no extra slicing/filtering is needed downstream.
- **Headers:**
  - `Authorization: Client-ID <unsplash-access-key>` — authenticates the request against the Unsplash API using an [Unsplash API Access Key](https://unsplash.com/developers).

### 3. Edit Fields (Set node — shape the response)

- **Type:** `n8n-nodes-base.set`
- Creates a single new field, `images`, of type array:
  ```
  images = {{ $json.results.map(r => r.urls.full) }}
  ```
- This walks the `results` array from the Unsplash API response and pulls out just the `urls.full` link (the full-resolution image URL) from each photo, discarding everything else (photographer credits, alt descriptions, color palette, thumbnail variants, etc.).

### 4. Respond to Webhook

- **Type:** `n8n-nodes-base.respondToWebhook`
- **Respond with:** `allIncomingItems` — returns whatever item(s) are on the input at this point (i.e. the `{ images: [...] }` object built by **Edit Fields**) as the JSON body of the HTTP response.

## Example

**Request** (see `files/webhook test url with query.txt`):

```
GET https://rafha1082.app.n8n.cloud/webhook-test/b04b0235-03c8-4c17-b508-24ed3c5e69cb?q=rain
```

**Response** (see `files/output json response image agent.txt`):

```json
[
  {
    "images": [
      "https://images.unsplash.com/photo-1503435824048-a799a3a84bf7?...",
      "https://images.unsplash.com/photo-1620385019253-b051a26048ce?...",
      "https://images.unsplash.com/photo-1501691223387-dd0500403074?..."
    ]
  }
]
```

A screenshot of a live response is saved at `images/output image response save.png`.

## Web app

`app/` contains a small static front end for the workflow: type a word, hit Search, and it renders the 3 photos the webhook returns.

- Plain HTML/CSS/JS, no build step or dependencies.
- The webhook URL is configurable from the page itself (**Webhook settings**) and saved in the browser's `localStorage`, so you can point it at your own n8n instance without editing any code.

To run it, just open `app/index.html` in a browser, or serve the folder with any static file server, e.g.:

```
npx serve app
```

## Setup

1. **Import the workflow.** In n8n, go to **Workflows → Import from File** and select `unsplash image agent.json`.
2. **Add your Unsplash Access Key.** Register an application at [Unsplash Developers](https://unsplash.com/developers) to get an Access Key, then open the **HTTP Request** node and set the `Authorization` header value to `Client-ID <your-access-key>` (ideally stored via n8n credentials/environment variables rather than pasted directly into the node — see the security note below).
3. **Activate the workflow.** Toggle it active so the production webhook URL is live (n8n also exposes a `/webhook-test/...` URL for use while the workflow editor is open, which is what's shown in the example above).
4. **Call the webhook** with a `q` query parameter set to whatever you want to search for, e.g. `?q=mountains`, `?q=coffee`, `?q=cats` — or use the [web app](#web-app) instead of calling it directly.

## Limitations

- **Fixed result count.** `per_page` is hard-coded to `3`; it isn't yet exposed as a query parameter on the webhook.
- **No input validation.** A missing or empty `q` parameter is passed straight to Unsplash as-is, so error handling depends entirely on Unsplash's own API response.
- **Unsplash rate limits.** The free Unsplash API tier is limited to 50 requests/hour (demo apps) — see [Unsplash API guidelines](https://unsplash.com/documentation) before using this in production.
- **CORS.** For a browser (like the web app in `app/`) to call the webhook directly, the **Respond to Webhook** node needs an `Access-Control-Allow-Origin` response header — already included in `unsplash image agent.json`. If you rebuild the workflow from scratch, add that header yourself or the app's fetch requests will be blocked.

## Repository contents

| Path | Description |
|---|---|
| `unsplash image agent.json` | The exportable n8n workflow definition (nodes, parameters, and connections). |
| `app/` | Static web app front end (HTML/CSS/JS) for the workflow — type a word, get 3 photos. |
| `files/webhook test url with query.txt` | Example webhook request URL, including the `q` query parameter. |
| `files/output json response image agent.txt` | Example JSON response returned by the workflow. |
| `images/unsplash image agent worflow screenshot.png` | Screenshot of the 4-node workflow in the n8n editor. |
| `images/output image response save.png` | Screenshot of a sample response being returned. |
