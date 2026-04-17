export interface DocFile {
  path: string;
  title: string;
  content: string;
}

export const sampleDocs: DocFile[] = [
  {
    path: 'getting-started.md',
    title: 'Getting Started',
    content: `# Getting Started

Welcome to the Invoker App — a Bruno-like API client for the web.

## Health check

The simplest request — just a GET to verify connectivity:

\`\`\`ivk
path: health.ivk
\`\`\`

## Authentication

### Step 1: Login

Send your credentials to get a token. The post-script automatically saves the token to your environment:

\`\`\`ivk
path: auth/login.ivk
\`\`\`

### Step 2: Use the token

Now use the saved token for authenticated requests. Notice the \`@auth bearer {{token}}\` directive:

\`\`\`ivk
path: auth/get-me.ivk
\`\`\`

## Next steps

Switch to the **Collection** tab in the sidebar to browse all available requests, or explore the Users API docs.
`,
  },
  {
    path: 'api/users.md',
    title: 'Users API',
    content: `# Users API

CRUD operations for user management.

## List users

Paginated list of all users:

\`\`\`ivk
path: users/list.ivk
\`\`\`

## Create a user

Create a new user account. The post-script saves the new user's ID:

\`\`\`ivk
path: users/create.ivk
\`\`\`

## Environment variables

These endpoints use the following variables from your active environment:

| Variable | Description |
|---|---|
| \`baseUrl\` | API base URL |
| \`userName\` | Name for new user |
| \`userEmail\` | Email for new user |
`,
  },
];
