import { timingSafeEqual } from 'node:crypto'
import type { Message, ProfileInferenceResult } from './types'

export const parseSummaryToHumanReadable = (rawOutput: string): string => {
    const summaryRegex = /Summary:[ \t]*(\n+)?([\s\S]*?)(?=\sReply 1|$)/
    const match = rawOutput.match(summaryRegex)

    if (!match) {
        return rawOutput
    }

    // Get the trimmed summary and remove any trailing '###'
    return match[2].trim().replace(/\s*###\s*$/, '')
}

export const hasContactMessages = (formattedRows: Message[]) =>
    formattedRows.some((msg) => msg.sender === 'them')

const cleanReplyText = (text: string): string => {
    let cleaned = text.trim()

    // Remove leading asterisks and spaces
    while (cleaned.startsWith('*') || cleaned.startsWith(' ')) {
        cleaned = cleaned.slice(1)
    }

    // Remove leading quotes
    if (cleaned.startsWith('"') || cleaned.startsWith('"')) {
        cleaned = cleaned.slice(1)
    }

    // Remove trailing quotes
    if (cleaned.endsWith('"') || cleaned.endsWith('"')) {
        cleaned = cleaned.slice(0, -1)
    }

    return cleaned.trim()
}

export const extractReplies = (rawOutput: string): string[] => {
    // Match formats like:
    // Reply 1 (Short): [text]
    // Reply 2: [text]
    // **Reply 3:** [text]
    const replyPattern = /(?:Reply\s+\d+\s*(?:\([^)]+\))?:|\*\*Reply\s*\d+\*\*:?)\s*([^\n]+)/gi
    const matches = rawOutput.match(replyPattern) || []

    return matches
        .map((reply) => {
            // Remove the prefix (e.g., "Reply 1 (Short): " or "**Reply 1:** ")
            const text = reply.replace(/^.*?:\s*/, '').trim()
            return cleanReplyText(text)
        })
        .filter(Boolean)
}

export const safeCompare = (a: string, b: string): boolean => {
    const len = Math.max(a.length, b.length)
    const aBuf = Buffer.alloc(len, 0)
    const bBuf = Buffer.alloc(len, 0)

    Buffer.from(a).copy(aBuf)
    Buffer.from(b).copy(bBuf)

    return timingSafeEqual(aBuf, bBuf) && a.length === b.length
}

export const formatMessagesAsText = (messages: Message[]): string =>
    messages.map((msg) => `${msg.sender}: ${msg.text}`).join('\n')

export const isoToAppleNanoseconds = (isoDate: string): number => {
    const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime()
    const targetTime = new Date(isoDate).getTime()

    return (targetTime - appleEpoch) * 1000000
}

export const parseProfileJson = (raw: string): ProfileInferenceResult => {
    let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON object found in model response')
    const parsed = JSON.parse(cleaned.slice(start, end + 1))
    const keys = ['PARTNER_STORY', 'PARTNER_TRIGGERS', 'PARTNER_NEEDS', 'MY_STORY', 'MY_TRIGGERS', 'MY_NEEDS'] as const
    const result: Partial<ProfileInferenceResult> = {}
    for (const key of keys) result[key] = typeof parsed[key] === 'string' ? parsed[key] : ''
    return result as ProfileInferenceResult
}
