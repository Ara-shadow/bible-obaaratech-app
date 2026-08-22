import fs from "node:fs";

const pkg = {
  name: "bible-ai",
  private: true,
  version: "1.0.0",
  description:
    "Obaaratech Bible AI - Bible study, search, Vibes, Kids Bible and sermon preparation.",
  type: "module",

  scripts: {
    dev: 'concurrently "npm run server:dev" "npm run frontend:dev"',

    "server:dev": "tsx watch src/server.ts",

    "frontend:dev": "vite --config frontend/vite.config.ts",

    build: "npm run build:server && npm run build:frontend",

    "build:server": "tsc -p tsconfig.server.json",

    "build:frontend":
      "tsc -p frontend/tsconfig.json && vite build --config frontend/vite.config.ts",

    start: "node dist/src/server.js",

    db: "prisma generate",

    "db:push": "prisma db push",

    "db:seed": "tsx prisma/seed.ts",

    admin: "node scripts/hash-password.mjs",

    "import:webu": "node scripts/import-webu.mjs",

    "import:crossrefs": "node scripts/import-crossrefs.mjs"
  },

  dependencies: {
    "@fastify/cookie": "^11.0.2",
    "@fastify/cors": "^11.0.1",
    "@fastify/jwt": "^9.1.0",
    "@fastify/rate-limit": "^10.3.0",
    "@fastify/static": "^8.2.0",
    "@prisma/adapter-pg": "^7.9.1",
    "@prisma/client": "^7.9.1",
    dotenv: "^17.2.2",
    fastify: "^5.10.0",
    pg: "^8.16.3",
    react: "^19.1.1",
    "react-dom": "^19.1.1",
    zod: "^4.4.3"
  },

  devDependencies: {
    "@types/node": "^24.0.0",
    "@types/pg": "^8.15.5",
    "@types/react": "^19.1.10",
    "@types/react-dom": "^19.1.7",
    "@vitejs/plugin-react": "^5.0.2",
    concurrently: "^9.2.1",
    prisma: "^7.9.1",
    tsx: "^4.20.5",
    typescript: "^5.9.2",
    vite: "^7.1.3"
  },

  engines: {
    node: ">=20"
  }
};

fs.writeFileSync(
  "./package.json",
  JSON.stringify(pkg, null, 2) + "\n",
  "utf8"
);

console.log("package.json successfully replaced.");