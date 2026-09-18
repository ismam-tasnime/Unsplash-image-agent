# Unsplash Image Agent

An [n8n](https://n8n.io/) workflow that exposes a webhook for searching [Unsplash](https://unsplash.com/) and returns the top 3 matching photo URLs as JSON.

Send a search term to the webhook, and the workflow queries the Unsplash Search API on your behalf and responds with a clean JSON array of full-size image URLs — no API key handling or response parsing required on the client side.

## How it works

The workflow (`unsplash image agent.json`) is made up of four n8n nodes:

1. **Webhook** — receives an incoming `GET` request with a `q` query parameter (the search term).
2. **HTTP Request** — calls `https://api.unsplash.com/search/photos` with `query={{ q }}` and `per_page=3`, authenticated via an Unsplash `Client-ID` in the `Authorization` header.
3. **Edit Fields** — maps the API response down to a single `images` array containing each result's full-size URL (`results[].urls.full`).
4. **Respond to Webhook** — returns the transformed data to the caller as JSON.

![Workflow screenshot](images/unsplash%20image%20agent%20worflow%20screenshot.png)

## Usage

Call the webhook URL with a `q` query parameter set to your search term:

```
GET https://<your-n8n-instance>/webhook/<webhook-id>?q=rain
```

Example request (see `files/webhook test url with query.txt`):

```
https://rafha1082.app.n8n.cloud/webhook-test/b04b0235-03c8-4c17-b508-24ed3c5e69cb?q=rain
```

Example response (see `files/output json response image agent.txt`):

```json
[
  {
    "images": [
      "https://images.unsplash.com/photo-1503435824048-...",
      "https://images.unsplash.com/photo-1620385019253-...",
      "https://images.unsplash.com/photo-1501691223387-..."
    ]
  }
]
```

## Setup

1. Import `unsplash image agent.json` into your n8n instance (**Workflows → Import from File**).
2. Get an Access Key from the [Unsplash Developers](https://unsplash.com/developers) portal and set it as the `Authorization: Client-ID <your-access-key>` header on the **HTTP Request** node.
3. Activate the workflow and copy the production webhook URL from the **Webhook** node.
4. Query the webhook with `?q=<search term>` to get back 3 image URLs.

> **Security note:** don't commit your Unsplash Access Key to version control. Store it as an n8n credential or environment variable instead, and rotate any key that has been exposed in a workflow export.

## Repository contents

| Path | Description |
|---|---|
| `unsplash image agent.json` | The exportable n8n workflow definition. |
| `files/webhook test url with query.txt` | Example webhook request URL. |
| `files/output json response image agent.txt` | Example JSON response. |
| `images/unsplash image agent worflow screenshot.png` | Screenshot of the workflow in the n8n editor. |
| `images/output image response save.png` | Screenshot of a sample response. |
