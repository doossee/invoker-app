export interface CollectionFile {
  path: string;
  name: string;
  content: string;
}

/**
 * Curated, tutorial-style sample collection. Every request points at
 * httpbin.org so first-time users can hit Send and see real responses
 * without configuring anything. Each file is annotated with a clear
 * learning goal in `@description` and demonstrates exactly one .ivk
 * feature so the collection reads like a guided tour.
 */
export const sampleCollection: CollectionFile[] = [
  /* ──────────────────────────  playground  ────────────────────────── */
  {
    path: 'playground/01-hello-world.ivk',
    name: 'Hello world',
    content: `@name Hello world
@description The simplest possible request — one line is all you need.
@tag tutorial

GET https://httpbin.org/get

> test {
  test("status is 200", () => {
    expect(res.status).toBe(200);
  });
}
`,
  },
  {
    path: 'playground/02-with-headers.ivk',
    name: 'Custom headers',
    content: `@name Custom headers
@description Add headers below the request line. Headers end at the first blank line.
@tag tutorial

GET https://httpbin.org/headers
Accept: application/json
X-Client: Invoker
X-Trace-Id: tutorial-2

> test {
  test("server saw our X-Client header", () => {
    expect(res.body.headers["X-Client"]).toBe("Invoker");
  });
}
`,
  },
  {
    path: 'playground/03-with-query.ivk',
    name: 'Query parameters',
    content: `@name Query parameters
@description Query params live in the URL itself. Variables work here too.
@tag tutorial

GET {{baseUrl}}/get?search=invoker&page=1&size=20
Accept: application/json

> test {
  test("server echoes the query args", () => {
    expect(res.body.args.search).toBe("invoker");
    expect(res.body.args.page).toBe("1");
  });
}
`,
  },
  {
    path: 'playground/04-post-json.ivk',
    name: 'POST with JSON body',
    content: `@name POST with JSON body
@description Body comes after a blank line. Use Content-Type to declare its shape.
@tag tutorial

POST {{baseUrl}}/post
Content-Type: application/json

{
  "name": "{{userName}}",
  "email": "{{userEmail}}",
  "joined": "{{nowIso}}"
}

> pre {
  // Pre-script: stamp the request with the current ISO timestamp.
  ivk.env.set("nowIso", new Date().toISOString());
}

> test {
  test("body round-trips through httpbin", () => {
    expect(res.body.json.name).toBe(ivk.env.get("userName"));
  });
}
`,
  },

  /* ──────────────────────────  scripting  ────────────────────────── */
  {
    path: 'scripting/01-pre-script.ivk',
    name: 'Pre-script — mutate the request',
    content: `@name Pre-script — mutate the request
@description Pre-scripts run BEFORE the request is sent. Useful for setting up dynamic values.
@tag scripting

GET {{baseUrl}}/headers

> pre {
  // 1. Set a runtime variable that lives only for this request.
  ivk.env.set("requestId", crypto.randomUUID());

  // 2. Mutate the outgoing request directly. \`ivk.request\` is the
  //    cloned request object — changes propagate to the actual send.
  ivk.request.headers["X-Request-Id"] = ivk.env.get("requestId");
  ivk.request.headers["X-Sent-At"] = String(Date.now());

  ivk.log("About to send request " + ivk.env.get("requestId"));
}

> test {
  test("our X-Request-Id arrived at the server", () => {
    expect(res.body.headers["X-Request-Id"]).toBe(ivk.env.get("requestId"));
  });
}
`,
  },
  {
    path: 'scripting/02-post-script.ivk',
    name: 'Post-script — extract from response',
    content: `@name Post-script — extract from response
@description Post-scripts run AFTER the response arrives. Capture data into env vars for later requests.
@tag scripting

GET {{baseUrl}}/uuid
Accept: application/json

> post {
  // \`res\` exposes status, headers, body, time, size.
  // Save the returned uuid so other requests can reference it via {{lastUuid}}.
  if (res.status === 200 && res.body.uuid) {
    ivk.env.set("lastUuid", res.body.uuid);
    ivk.log("Captured uuid: " + res.body.uuid);
  }
}

> test {
  test("server returned a uuid", () => {
    expect(res.body.uuid).toBeDefined();
  });
  test("post-script saved it to env", () => {
    expect(ivk.env.get("lastUuid")).toBe(res.body.uuid);
  });
}
`,
  },
  {
    path: 'scripting/03-tests.ivk',
    name: 'Test assertions',
    content: `@name Test assertions
@description The test block runs assertions against the response. Failed tests appear in red on the Tests tab.
@tag scripting

GET {{baseUrl}}/json
Accept: application/json

> test {
  test("status is 200", () => {
    expect(res.status).toBe(200);
  });
  test("response is JSON", () => {
    expect(res.headers["content-type"]).toContain("application/json");
  });
  test("response time under 5s", () => {
    expect(res.time).toBeGreaterThan(0);
  });
  test("body has the slideshow shape", () => {
    expect(res.body.slideshow).toBeDefined();
    expect(res.body.slideshow.title).toBeDefined();
  });
}
`,
  },
  {
    path: 'scripting/04-chained.ivk',
    name: 'Chained — use a previous request\'s data',
    content: `@name Chained — use a previous request's data
@description Run "Post-script — extract from response" first, then this one. {{lastUuid}} comes from there.
@tag scripting

POST {{baseUrl}}/anything
Content-Type: application/json

{
  "previousUuid": "{{lastUuid}}",
  "note": "This request reuses a value captured by another."
}

> test {
  test("the chained uuid was sent", () => {
    expect(res.body.json.previousUuid).toBe(ivk.env.get("lastUuid"));
  });
}
`,
  },

  /* ─────────────────────────────  auth  ───────────────────────────── */
  {
    path: 'auth/01-login.ivk',
    name: 'Login — capture token',
    content: `@name Login — capture token
@description The classic login flow. The post-script saves the returned token to {{token}} for use by other requests.
@tag auth

POST {{baseUrl}}/post
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "Auth.login",
  "params": {
    "phone": "{{phone}}"
  }
}

> post {
  // httpbin echoes our request — pretend its echoed body is a token.
  // In a real API, you'd read \`res.body.access_token\` or similar.
  const fakeToken = "demo-" + Math.random().toString(36).slice(2, 10);
  ivk.env.set("token", fakeToken);
  ivk.log("Captured token: " + fakeToken);
}

> test {
  test("server accepted the body", () => {
    expect(res.status).toBe(200);
  });
  test("token is now in env", () => {
    expect(ivk.env.get("token")).toBeDefined();
  });
}
`,
  },
  {
    path: 'auth/02-authenticated.ivk',
    name: 'Authenticated request — uses {{token}}',
    content: `@name Authenticated request — uses {{token}}
@description Run "Login — capture token" first, then this. The @auth bearer directive injects the Authorization header automatically.
@auth bearer {{token}}
@tag auth

GET {{baseUrl}}/bearer

> test {
  test("server received our bearer token", () => {
    expect(res.body.token).toBe(ivk.env.get("token"));
  });
}
`,
  },
  {
    path: 'auth/03-bearer.ivk',
    name: 'Bearer auth (manual header)',
    content: `@name Bearer auth (manual header)
@description Equivalent to @auth bearer, but written out as a regular header. Useful when you need fine control.
@tag auth

GET {{baseUrl}}/bearer
Authorization: Bearer {{token}}
Accept: application/json
`,
  },
  {
    path: 'auth/04-basic.ivk',
    name: 'Basic auth',
    content: `@name Basic auth
@description @auth basic <user> <pass> sets the Authorization header to base64(user:pass).
@auth basic demo password123
@tag auth

GET {{baseUrl}}/basic-auth/demo/password123

> test {
  test("server accepted the basic auth", () => {
    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
  });
}
`,
  },
];
