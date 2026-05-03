export interface DocFile {
  path: string;
  title: string;
  content: string;
}

export const sampleDocs: DocFile[] = [
  /* Top-level orientation. */
  {
    path: 'README.md',
    title: 'Welcome',
    content: `# Welcome to Invoker

A git-native API workspace. Requests live as plain \`.ivk\` files next to your code, docs are \`README.md\` in folders. Edit, run, share — all from the same place.

## Take the tour

You're looking at a sample collection that ships with the app. Browse the sidebar, click any request, hit **Send** — every request talks to [httpbin.org](https://httpbin.org) so you'll see real responses immediately.

The recommended path:

1. **\`playground/\`** — start here. Four requests covering GET, headers, query params, and POST with a JSON body.
2. **\`scripting/\`** — pre / post / test scripts. How to mutate the request before send, capture data from the response, and assert on it.
3. **\`auth/\`** — authentication patterns: login + token capture, bearer header, basic auth.

Each folder has its own README explaining what's inside.

## Things to try

- Hit **⌘K** to open the command palette and jump anywhere.
- Switch between **dev** and **stage** in the bottom-left corner — every \`{{baseUrl}}\` and \`{{phone}}\` re-resolves.
- Open any \`.md\` file (like this one) and click the **Live** toggle — line you're on shows source, every other line renders.
- Open a folder (the README icon) to see a runnable \`ivk\` block embedded in the doc.

## The .ivk format in 30 seconds

\`\`\`ivk
@name Optional metadata
@auth bearer {{token}}

POST {{baseUrl}}/users
Content-Type: application/json

{
  "name": "{{userName}}"
}

> pre  { /* runs before the request is sent */ }
> post { /* runs after, has access to \`res\` */ }
> test { test("ok", () => expect(res.status).toBe(200)); }
\`\`\`

That's the whole spec. Everything's optional except the request line.
`,
  },
  {
    path: 'tutorial.md',
    title: 'Tutorial',
    content: `# 5-minute tutorial

A guided run through the sample collection. Open each request in turn and **Send** to see what it does.

## 1. Your first request

Open **\`playground/01-hello-world.ivk\`** and click Send. You should see a JSON response from httpbin.org.

The whole file is one line: \`GET https://httpbin.org/get\`. Everything else (headers, body, scripts) is optional.

## 2. Variables

Open **\`playground/03-with-query.ivk\`**. Notice the URL: \`{{baseUrl}}/get?search=invoker\`.

\`{{baseUrl}}\` is a variable. Click the bottom-left status bar (the green dot next to "dev") — that's your active environment. Variables are looked up there at send time.

Try switching to **stage** with **⌘E**, then resend. The URL re-resolves with the new value.

## 3. Pre and post scripts

Open **\`scripting/01-pre-script.ivk\`**. The \`> pre { ... }\` block runs before the request and can mutate \`ivk.request\` directly. Useful for things like adding a request ID or signing a payload.

Open **\`scripting/02-post-script.ivk\`**. The \`> post { ... }\` block runs after the response. \`res\` exposes \`status\`, \`headers\`, \`body\`, \`time\`, \`size\`. Save anything to env via \`ivk.env.set(name, value)\`.

## 4. Tests

Open **\`scripting/03-tests.ivk\`**. The \`> test { ... }\` block runs assertions. Each \`test("description", () => ...)\` produces a row on the **Tests** tab in the response panel. Failing assertions appear in red.

## 5. Chaining requests

Run **\`scripting/02-post-script.ivk\`** first — it captures a uuid into \`{{lastUuid}}\`. Then open **\`scripting/04-chained.ivk\`** and Send. The body contains \`"previousUuid": "{{lastUuid}}"\` — that variable was set by the earlier request and is now reused here.

This is the auth pattern in miniature: login captures a token, every later request uses it.

## 6. The auth flow

Run **\`auth/01-login.ivk\`** — it captures a fake token. Then **\`auth/02-authenticated.ivk\`** — notice \`@auth bearer {{token}}\`. The directive adds an \`Authorization: Bearer …\` header automatically.

Compare with **\`auth/03-bearer.ivk\`** which writes the same header by hand. They're equivalent.

## What now?

- **⌘N** — create a new untitled request. It lives in memory until you save.
- **⌘S** — save the active request. In Tauri desktop builds this writes to disk.
- **⌘K** — command palette. Jump to any request, doc, or action.
- **⌘\\\\** — toggle the sidebar.
`,
  },

  /* Folder-level READMEs — appear when you click the folder in the sidebar. */
  {
    path: 'playground/README.md',
    title: 'Playground',
    content: `# Playground

Four self-contained requests for trying out the basics. Click any of them in the sidebar and hit Send.

| Request | Demonstrates |
|---|---|
| **01-hello-world** | The minimum viable request — one line of source |
| **02-with-headers** | Custom request headers (\`Accept\`, \`X-Client\`, etc.) |
| **03-with-query** | Query parameters on the URL, including \`{{variable}}\` interpolation |
| **04-post-json** | POST with a JSON body, plus a pre-script that stamps the request with the current time |

## Try this

Run **04-post-json**, then open the **Headers** tab on the request side and add a header like \`X-Custom: hello\`. Send again — you'll see it echoed back in \`res.body.headers\` on the response side.

\`\`\`ivk
GET https://httpbin.org/get
\`\`\`

Above is a runnable block embedded directly in this doc. Click **Run** to execute without leaving the README.
`,
  },
  {
    path: 'scripting/README.md',
    title: 'Scripting',
    content: `# Scripting

Three blocks can wrap any request. Each is optional and runs in a sandbox with access to \`ivk\` (env + log + request) and, for post/test, \`res\`.

## \`> pre { ... }\`

Runs **before** the request is sent. Mutate \`ivk.request\` to change what gets sent on the wire.

\`\`\`javascript
ivk.env.set("requestId", crypto.randomUUID());
ivk.request.headers["X-Request-Id"] = ivk.env.get("requestId");
\`\`\`

## \`> post { ... }\`

Runs **after** the response arrives. Read \`res.status\`, \`res.headers\`, \`res.body\`, \`res.time\`, \`res.size\`. Capture anything you need to env via \`ivk.env.set\` so later requests can use it.

\`\`\`javascript
if (res.status === 200) {
  ivk.env.set("token", res.body.access_token);
}
\`\`\`

## \`> test { ... }\`

Runs assertions on the response. Each \`test("name", () => expect(...).toX(...))\` is one row on the **Tests** tab.

\`\`\`javascript
test("status ok", () => expect(res.status).toBe(200));
test("body has user id", () => expect(res.body.id).toBeDefined());
test("response under 1s", () => expect(res.time).toBeGreaterThan(0));
\`\`\`

Available assertions: \`toBe\`, \`toBeDefined\`, \`toContain\`, \`toBeGreaterThan\`. See [scripting docs](https://github.com/doossee/obsidian-invoker/blob/main/docs/SCRIPTING.md) for the full list.

## Recipes

- **Sign requests**: in \`> pre\`, compute an HMAC over \`ivk.request.body\` and set \`Authorization\`.
- **Refresh tokens**: in \`> post\`, watch for 401 and call a refresh endpoint via \`fetch\` (sandbox allows it).
- **Validate schema**: in \`> test\`, walk \`res.body\` and assert shape. Failing tests don't block — the response still shows.
`,
  },
  {
    path: 'auth/README.md',
    title: 'Authentication',
    content: `# Authentication

Four patterns for sending credentials. Pick the one that matches your API's contract.

## 1. \`@auth bearer\` (recommended for token APIs)

\`\`\`ivk
@auth bearer {{token}}

GET {{baseUrl}}/me
\`\`\`

Equivalent to writing \`Authorization: Bearer {{token}}\` as a header. The directive resolves \`{{token}}\` from the active environment.

## 2. \`@auth basic\`

\`\`\`ivk
@auth basic alice secret

GET {{baseUrl}}/profile
\`\`\`

The runner base64-encodes \`alice:secret\` and sends it as \`Authorization: Basic …\`.

## 3. Manual header

When you need a custom auth header (\`X-API-Key\`, OAuth, etc.):

\`\`\`ivk
GET {{baseUrl}}/data
X-API-Key: {{apiKey}}
\`\`\`

## 4. Login flow with token capture

The classic pattern: one request to log in, every subsequent request uses the captured token.

\`\`\`ivk
POST {{baseUrl}}/login
Content-Type: application/json

{ "email": "{{email}}", "password": "{{password}}" }

> post {
  ivk.env.set("token", res.body.access_token);
}
\`\`\`

After this runs, every request with \`@auth bearer {{token}}\` will send the captured token. See **\`01-login.ivk\`** + **\`02-authenticated.ivk\`** for the full demo.

## Implementation checklist

- [x] Bearer auth via directive
- [x] Basic auth via directive
- [x] Manual header for custom schemes
- [x] Login + capture pattern
- [ ] OAuth 2.0 device flow (planned)
- [ ] Refresh-token rotation (planned)
`,
  },
];
