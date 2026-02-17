import 'dotenv/config'
import { defineConfig } from 'prisma/config'
import { PrismaPg } from '@prisma/adapter-pg'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
  // Driver adapter for CLI operations (migrate, db push)
  adapter: () => new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})
