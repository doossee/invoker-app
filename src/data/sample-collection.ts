export interface CollectionFile {
  path: string;
  name: string;
  content: string;
}

export const sampleCollection: CollectionFile[] = [
  {
    path: 'health.ivk',
    name: 'Health Check',
    content: `@name Health Check
@description Simple GET to verify the API is running

GET https://httpbin.org/get
Accept: application/json

> test {
  test("status is 200", () => {
    expect(res.status).toBe(200);
  });
}
`,
  },
  {
    path: 'auth/login.ivk',
    name: 'Login',
    content: `@name Login
@description Send credentials to get a token
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
  ivk.env.set("token", res.body.json?.params?.phone ?? "extracted");
  ivk.log("Login response received");
}

> test {
  test("returns 200", () => {
    expect(res.status).toBe(200);
  });
  test("echoes our body", () => {
    expect(res.body.json).toBeDefined();
  });
}
`,
  },
  {
    path: 'auth/get-me.ivk',
    name: 'Get Me',
    content: `@name Get Me
@description Get the current user profile
@auth bearer {{token}}
@tag auth

POST {{baseUrl}}/post
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "Auth.getMe",
  "params": {}
}
`,
  },
  {
    path: 'users/list.ivk',
    name: 'List Users',
    content: `@name List Users
@description Paginated user list

GET {{baseUrl}}/get?page=1&size=20
Accept: application/json

> test {
  test("status ok", () => {
    expect(res.status).toBe(200);
  });
}
`,
  },
  {
    path: 'users/create.ivk',
    name: 'Create User',
    content: `@name Create User
@description Create a new user account

POST {{baseUrl}}/post
Content-Type: application/json

{
  "name": "{{userName}}",
  "email": "{{userEmail}}",
  "role": "user"
}

> post {
  ivk.env.set("userId", res.body.json?.id ?? "new-id");
}
`,
  },
];
