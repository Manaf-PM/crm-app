import 'dotenv/config'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const client = postgres(process.env['DATABASE_URL']!, { max: 1 })
const db = drizzle(client)

console.log('▶ Lancement des migrations...')
await migrate(db, { migrationsFolder: './src/db/migrations' })
console.log('✓ Migrations terminées')

await client.end()
