# Full-Stack Project Example

:::warning Documentation Status

The docs are currently not up to date as I'm focused on stabilizing core
features. For the most current information, you might need to check the source
code on GitHub or the examples in this blog post. Proper documentation will come
once the API is more stable!

:::

_Frontend + Backend + Database, all in sync - because scattered config files are
the enemy of productivity_

## The Problem

You're building a full-stack app. React frontend, Node.js API, PostgreSQL
database. Standard stuff.

But here's what drives you crazy: the same configuration values are scattered
across multiple files:

- Your React app needs the API URL
- Your API needs the database connection and CORS origins
- Your Docker setup needs database credentials and port mappings
- Your deployment config needs all of the above

Change your database password? Update it in 4 places. Switch to a different API
port? Hope you remember to update the frontend config too. Miss one? Enjoy
debugging why your frontend can't reach the API.

Sound familiar? Let's fix it.

## What We're Building

A classic full-stack setup:

- **Frontend**: React app that talks to an API
- **Backend**: Express.js API with database connection
- **Database**: PostgreSQL
- **Development**: Docker Compose for local development

All sharing the same configuration values, all staying perfectly in sync.

## Project Structure

```
fullstack-app/
├── frontend/
│   ├── src/
│   ├── .env                    # Generated for React (gitignored)
│   └── package.json
├── backend/
│   ├── src/
│   ├── .env                    # Generated for Express (gitignored)
│   └── package.json
├── docker-compose.yml          # Generated for local dev
├── axogen.config.ts            # Our single source of truth
├── .env.axogen                 # Actual values (gitignored)
└── package.json
```

## Step 1: Install Axogen

```bash npm2yarn
bun add @axonotes/axogen
```

## Step 2: Define Your Configuration

Create `axogen.config.ts` with everything your full-stack app needs:

```typescript
import {z, defineConfig, loadEnv} from "@axonotes/axogen";

// Define all your configuration in one place
const env = loadEnv(
    z.object({
        // Database configuration
        DATABASE_URL: z.url(),
        DATABASE_NAME: z.string().default("fullstack_app"),
        DATABASE_USER: z.string().default("postgres"),
        DATABASE_PASSWORD: z.string(),
        DATABASE_PORT: z.coerce.number().default(5432),

        // API configuration
        API_PORT: z.coerce.number().default(3001),
        API_HOST: z.string().default("localhost"),
        JWT_SECRET: z.string().min(32),

        // Frontend configuration
        FRONTEND_PORT: z.coerce.number().default(3000),

        // Environment
        NODE_ENV: z
            .enum(["development", "staging", "production"])
            .default("development"),
    })
);

export default defineConfig({
    targets: {
        // Backend .env file
        backend: {
            path: "backend/.env",
            type: "env",
            variables: {
                DATABASE_URL: env.DATABASE_URL,
                PORT: env.API_PORT,
                NODE_ENV: env.NODE_ENV,
                JWT_SECRET: env.JWT_SECRET,

                // CORS origins for the backend
                CORS_ORIGIN: `http://${env.API_HOST}:${env.FRONTEND_PORT}`,
            },
        },

        // Frontend .env file
        frontend: {
            path: "frontend/.env",
            type: "env",
            variables: {
                // React env vars need REACT_APP_ prefix
                REACT_APP_API_URL: `http://${env.API_HOST}:${env.API_PORT}`,
                REACT_APP_NODE_ENV: env.NODE_ENV,

                // Development-only vars
                ...(env.NODE_ENV === "development" && {
                    REACT_APP_DEBUG: "true",
                }),
            },
        },

        // Docker Compose for local development
        docker: {
            path: "docker-compose.yml",
            type: "yaml",
            variables: {
                version: "3.8",
                services: {
                    database: {
                        image: "postgres:15",
                        environment: {
                            POSTGRES_DB: env.DATABASE_NAME,
                            POSTGRES_USER: env.DATABASE_USER,
                            POSTGRES_PASSWORD: env.DATABASE_PASSWORD,
                        },
                        ports: [`${env.DATABASE_PORT}:5432`],
                        volumes: ["postgres_data:/var/lib/postgresql/data"],
                    },

                    backend: {
                        build: "./backend",
                        ports: [`${env.API_PORT}:${env.API_PORT}`],
                        environment: {
                            NODE_ENV: env.NODE_ENV,
                            DATABASE_URL: env.DATABASE_URL,
                            JWT_SECRET: env.JWT_SECRET,
                        },
                        depends_on: ["database"],
                    },

                    frontend: {
                        build: "./frontend",
                        ports: [`${env.FRONTEND_PORT}:${env.FRONTEND_PORT}`],
                        environment: {
                            REACT_APP_API_URL: `http://localhost:${env.API_PORT}`,
                        },
                        depends_on: ["backend"],
                    },
                },
                volumes: {
                    postgres_data: null,
                },
            },
        },

        // Deployment config (Kubernetes ConfigMap)
        deployment: {
            path: "k8s/configmap.yaml",
            type: "yaml",
            variables: {
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: {
                    name: "app-config",
                    namespace: "default",
                },
                data: {
                    API_PORT: env.API_PORT.toString(),
                    DATABASE_URL: env.DATABASE_URL,
                    NODE_ENV: env.NODE_ENV,
                    CORS_ORIGIN: `https://myapp.com`,

                    // Frontend config as JSON string
                    FRONTEND_CONFIG: JSON.stringify({
                        apiUrl:
                            env.NODE_ENV === "production"
                                ? "https://api.myapp.com"
                                : `http://${env.API_HOST}:${env.API_PORT}`,
                        environment: env.NODE_ENV,
                    }),
                },
            },
        },
    },

    commands: {
        // Development commands
        "dev:all": "docker-compose up -d",
        "dev:frontend": "cd frontend && npm run dev",
        "dev:backend": "cd backend && npm run dev",

        // Build commands
        "build:frontend": "cd frontend && npm run build",
        "build:backend": "cd backend && npm run build",
        "build:all": "npm run build:frontend && npm run build:backend",

        // Database commands
        "db:up": "docker-compose up database -d",
        "db:down": "docker-compose down",
        "db:reset": "docker-compose down -v && docker-compose up database -d",
    },
});
```

## Step 3: Set Your Values

Create `.env.axogen` with your actual configuration:

```bash
# Database
DATABASE_URL=postgresql://postgres:secretpass@localhost:5432/fullstack_app
DATABASE_NAME=fullstack_app
DATABASE_USER=postgres
DATABASE_PASSWORD=secretpass
DATABASE_PORT=5432

# API
API_PORT=3001
API_HOST=localhost
JWT_SECRET=your-super-secret-jwt-key-must-be-at-least-32-characters-long

# Frontend
FRONTEND_PORT=3000

# Environment
NODE_ENV=development
```

**Important**: Add `.env.axogen` to your `.gitignore`!

## Step 4: Generate All Your Config Files

```bash
axogen generate
```

This creates:

### `backend/.env`

```bash
# Generated by axogen - do not edit manually
CORS_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://postgres:secretpass@localhost:5432/fullstack_app
JWT_SECRET=your-super-secret-jwt-key-must-be-at-least-32-characters-long
NODE_ENV=development
PORT=3001
```

### `frontend/.env`

```bash
# Generated by axogen - do not edit manually
REACT_APP_API_URL=http://localhost:3001
REACT_APP_DEBUG=true
REACT_APP_NODE_ENV=development
```

### `docker-compose.yml`

```yaml
# Generated by axogen - do not edit manually
version: "3.8"
services:
    database:
        image: postgres:15
        environment:
            POSTGRES_DB: fullstack_app
            POSTGRES_USER: postgres
            POSTGRES_PASSWORD: secretpass
        ports:
            - "5432:5432"
        volumes:
            - postgres_data:/var/lib/postgresql/data

    backend:
        build: ./backend
        ports:
            - "3001:3001"
        environment:
            NODE_ENV: development
            DATABASE_URL: postgresql://postgres:secretpass@localhost:5432/fullstack_app
            JWT_SECRET: your-super-secret-jwt-key-must-be-at-least-32-characters-long
        depends_on:
            - database

    frontend:
        build: ./frontend
        ports:
            - "3000:3000"
        environment:
            REACT_APP_API_URL: http://localhost:3001
        depends_on:
            - backend

volumes:
    postgres_data:
```

### `k8s/configmap.yaml`

```yaml
# Generated by axogen - do not edit manually
apiVersion: v1
kind: ConfigMap
metadata:
    name: app-config
    namespace: default
data:
    API_PORT: "3001"
    DATABASE_URL: postgresql://postgres:secretpass@localhost:5432/fullstack_app
    NODE_ENV: development
    CORS_ORIGIN: https://myapp.com
    FRONTEND_CONFIG: '{"apiUrl":"http://localhost:3001","environment":"development"}'
```

## Step 5: Use Your Commands

Start everything for development:

```bash
axogen run dev:all
```

Or just the database:

```bash
axogen run db:up
```

Build everything for production:

```bash
axogen run build:all
```

## The Magic Moment

Now here's where it gets good. Say you need to change your API port from 3001
to 4000.

**Old way**: Update `backend/.env`, `frontend/.env`, `docker-compose.yml`, and
your deployment config. Miss one? Enjoy debugging.

**Axogen way**: Change one line in `.env.axogen`:

```bash
API_PORT=4000
```

Run `axogen generate` and watch:

- Backend listens on port 4000
- Frontend talks to `http://localhost:4000`
- Docker maps port 4000
- Deployment config uses port 4000
- CORS origins are updated automatically

**One change, four files updated, zero chance of inconsistency.**

## Real-World Variations

### Different Environments

```typescript
export default defineConfig({
    targets: {
        frontend: {
            path: "frontend/.env",
            type: "env",
            variables: {
                REACT_APP_API_URL:
                    env.NODE_ENV === "production"
                        ? "https://api.myapp.com"
                        : `http://${env.API_HOST}:${env.API_PORT}`,
            },
        },
    },
});
```

### Feature Flags

```typescript
const env = loadEnv(
    z.object({
        // ... other vars
        FEATURE_ANALYTICS: z.boolean().default(false),
        FEATURE_BETA_UI: z.boolean().default(false),
    })
);

export default defineConfig({
    targets: {
        frontend: {
            // ...
            variables: {
                REACT_APP_FEATURE_ANALYTICS: env.FEATURE_ANALYTICS.toString(),
                REACT_APP_FEATURE_BETA_UI: env.FEATURE_BETA_UI.toString(),
            },
        },
    },
});
```

### Multiple Frontends

```typescript
export default defineConfig({
    targets: {
        web_frontend: {
            path: "web/.env",
            type: "env",
            variables: {
                REACT_APP_API_URL: `http://${env.API_HOST}:${env.API_PORT}`,
            },
        },

        mobile_frontend: {
            path: "mobile/.env",
            type: "env",
            variables: {
                EXPO_PUBLIC_API_URL: `http://${env.API_HOST}:${env.API_PORT}`,
            },
        },
    },
});
```

## Why This Changes Everything

1. **Single Source of Truth**: Change one value, update everywhere
2. **Type Safety**: Invalid configs fail fast with helpful errors
3. **Environment Consistency**: Dev, staging, and production configs stay in
   sync
4. **Team Productivity**: New developers get working configs immediately
5. **Deployment Confidence**: No more "works on my machine" config issues

Your config files become **generated artifacts**, not hand-maintained sources of
truth. And that's exactly how it should be.

Start with this pattern and watch your deployment bugs disappear.
