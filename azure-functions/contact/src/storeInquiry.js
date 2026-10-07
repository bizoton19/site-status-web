import { randomUUID } from 'node:crypto'
import { TableClient } from '@azure/data-tables'

const DEFAULT_TABLE = 'ContactInquiries'

function connectionString(env) {
  return String(env.CONTACT_TABLE_CONNECTION || env.AzureWebJobsStorage || '').trim()
}

function tableName(env) {
  const name = String(env.CONTACT_TABLE_NAME || DEFAULT_TABLE).trim()
  return name || DEFAULT_TABLE
}

async function ensureTable(client) {
  try {
    await client.createTable()
  } catch (err) {
    const status = err?.statusCode ?? err?.status
    if (status !== 409) throw err
  }
}

/**
 * Stores one inquiry in Azure Table Storage.
 * Uses CONTACT_TABLE_CONNECTION when set, otherwise AzureWebJobsStorage.
 * Does not log the inquiry.
 */
export async function storeInquiryTable(record, env = process.env) {
  const connection = connectionString(env)
  if (!connection) {
    throw new Error('storage_unconfigured')
  }

  const client = TableClient.fromConnectionString(connection, tableName(env))
  await ensureTable(client)
  await client.createEntity({
    partitionKey: String(record.createdAt || new Date().toISOString()).slice(0, 10),
    rowKey: randomUUID(),
    name: record.name,
    email: record.email,
    message: record.message,
    hostname: record.hostname,
    createdAt: record.createdAt,
  })
}
