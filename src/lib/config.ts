import { env } from '$env/dynamic/private'
import path from 'node:path'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

export interface Setting {
    key: string
    value: string
    description: string
}

const DB_PATH = path.join(process.cwd(), 'settings.db')

const db = await open({ filename: DB_PATH, driver: sqlite3.Database })

await db.exec(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
)`)

const defaultSettings: Record<string, { value?: string; description: string }> = {
    CONTACT_PHONE: {
        value: env.CONTACT_PHONE,
        description:
            "The phone number of the person you're having a conversation with in the Messages app",
    },
    HISTORY_LOOKBACK_HOURS: {
        value: env.HISTORY_LOOKBACK_HOURS,
        description: 'How many hours of prior conversation history to search for extra context',
    },
OPENAI_API_KEY: {
        value: env.OPENAI_API_KEY,
        description: 'Available at https://platform.openai.com/api-keys',
    },
    OPENAI_MODEL: { value: env.OPENAI_MODEL, description: 'gpt-4o or any other OpenAI model' },
    OPENAI_TEMPERATURE: {
        value: env.OPENAI_TEMPERATURE,
        description: 'Controls the randomness of the responses',
    },
    OPENAI_TOP_P: {
        value: env.OPENAI_TOP_P,
        description: 'Lets the responses be a little more adventurous',
    },
    OPENAI_FREQUENCY_PENALTY: {
        value: env.OPENAI_FREQUENCY_PENALTY,
        description: 'Keeps the suggestions from repeating themselves',
    },
    OPENAI_PRESENCE_PENALTY: {
        value: env.OPENAI_PRESENCE_PENALTY,
        description: 'Nudges the AI to bring up fresh ideas',
    },
    ANTHROPIC_API_KEY: {
        value: env.ANTHROPIC_API_KEY,
        description: 'Available at https://console.anthropic.com',
    },
    ANTHROPIC_MODEL: {
        value: env.ANTHROPIC_MODEL,
        description: 'claude-opus-4-7 or another Anthropic model',
    },
    ANTHROPIC_TEMPERATURE: {
        value: env.ANTHROPIC_TEMPERATURE,
        description: "Controls the randomness of Claude's responses",
    },
    GROK_API_KEY: {
        value: env.GROK_API_KEY,
        description: 'Available at https://x.ai',
    },
    GROK_MODEL: { value: env.GROK_MODEL, description: 'grok-3 or another Grok model' },
    GROK_TEMPERATURE: {
        value: env.GROK_TEMPERATURE,
        description: "Controls the randomness of Grok's responses",
    },
    KHOJ_API_URL: { value: env.KHOJ_API_URL, description: 'https://khoj.dev' },
    KHOJ_AGENT: { value: env.KHOJ_AGENT, description: 'optional specific agent to use' },
    PARTNER_NAME: {
        value: env.PARTNER_NAME,
        description: "Your partner's preferred name",
    },
    PARTNER_STORY: {
        value: env.PARTNER_STORY,
        description: "The core belief or narrative they carry — the story their inner child wrote about their worth and safety in relationships",
    },
    PARTNER_TRIGGERS: {
        value: env.PARTNER_TRIGGERS,
        description: 'Situations or dynamics that tend to activate their core wound',
    },
    PARTNER_NEEDS: {
        value: env.PARTNER_NEEDS,
        description: 'What helps them feel safe and seen when they are activated',
    },
    MY_STORY: {
        value: env.MY_STORY,
        description: 'Your own core belief or narrative — the story your inner child wrote about your worth and safety',
    },
    MY_TRIGGERS: {
        value: env.MY_TRIGGERS,
        description: 'Situations or dynamics that tend to activate your core wound',
    },
    MY_NEEDS: {
        value: env.MY_NEEDS,
        description: 'What helps you feel safe and regulated when you are activated',
    },
}

for (const [key, { value = '', description }] of Object.entries(defaultSettings)) {
    await db.run(
        'INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)',
        key,
        value,
        description
    )
}

const rows = await db.all<Setting[]>('SELECT key, value, description FROM settings')

export const settings: Record<string, string> = {}
for (const row of rows) {
    settings[row.key] = row.value
}

export async function updateSetting(key: string, value: string): Promise<void> {
    await db.run(
        'INSERT INTO settings (key, value, description) VALUES (?, ?, (SELECT description FROM settings WHERE key = ?)) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
        key,
        value,
        key
    )
    settings[key] = value
}

export async function getAllSettings(): Promise<Setting[]> {
    return db.all<Setting[]>('SELECT key, value, description FROM settings')
}
