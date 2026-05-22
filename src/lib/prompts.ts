import { settings } from '$lib/config'
import type { Message, ToneType } from './types'
import { formatMessagesAsText } from './utils'

const getCoreContext = () => {
    const name = settings.PARTNER_NAME || 'my partner'
    return [
        `You will see a conversation where messages from me are marked "me:" and messages from ${name} are marked with their name.`,
        'Analyze my messages carefully to mimic my specific vocabulary, sentence structure, and communication style when suggesting replies.',
        'Additional context about recent conversation history is provided below. Use this to understand the current situation and tone, but focus your reply on the most recent messages.',
        'Do not summarize the history - it is only for context.',
        'I will also provide a desired tone and may include extra context. Always incorporate both when crafting replies.',
    ].join('\n')
}

const buildProfileContext = (): string => {
    const name = settings.PARTNER_NAME || 'my partner'
    const sections: string[] = []

    const partnerParts = [
        settings.PARTNER_STORY,
        settings.PARTNER_TRIGGERS && `What tends to activate them: ${settings.PARTNER_TRIGGERS}`,
        settings.PARTNER_NEEDS && `What helps them feel safe: ${settings.PARTNER_NEEDS}`,
    ].filter(Boolean)

    if (partnerParts.length > 0) {
        sections.push(`About ${name}:\n${partnerParts.join('\n')}`)
    }

    const myParts = [
        settings.MY_STORY,
        settings.MY_TRIGGERS && `What tends to activate me: ${settings.MY_TRIGGERS}`,
        settings.MY_NEEDS && `What helps me feel safe: ${settings.MY_NEEDS}`,
    ].filter(Boolean)

    if (myParts.length > 0) {
        sections.push(`About me:\n${myParts.join('\n')}`)
    }

    return sections.join('\n\n')
}

const instructions = [
    'Given the conversation above, provide a brief summary of the current situation, emotional dynamics, and main topic.',
    'Then suggest 3 possible replies I might send, each with different lengths:',
    '- Short (1-2 sentences)',
    '- Medium (3-4 sentences)',
    '- Long (5+ sentences)',
    'For all replies, maintain the following tone:',
].join('\n')

const responseFormat = [
    'Format your response exactly as follows:',
    '',
    'Summary: [Brief 1-2 sentence summary of the current conversation state]',
    '',
    'Reply 1 (Short): [Your short suggestion]',
    '',
    'Reply 2 (Medium): [Your medium suggestion]',
    '',
    'Reply 3 (Long): [Your long suggestion]',
].join('\n')

export const systemContext = () =>
    [settings.CUSTOM_CONTEXT, buildProfileContext(), getCoreContext()].filter(Boolean).join('\n\n')

const buildPrompt = (tone: string, context: string): string => {
    const lines = [`${instructions} ${tone}`]
    if (context) {
        lines.push('', `Additional context to consider: ${context}`)
    }
    lines.push('', responseFormat)
    return lines.join('\n')
}

export const openAiPrompt = (tone: string, context: string): string => buildPrompt(tone, context)

export const khojPrompt = (messages: Message[], tone: ToneType, context: string): string =>
    [
        systemContext(),
        'Here are some text messages between my partner and I:\n' + formatMessagesAsText(messages),
        buildPrompt(tone, context),
    ].join('\n')

export const anthropicPrompt = (messages: Message[], tone: ToneType, context: string): string =>
    [
        systemContext(),
        'Here are some text messages between my partner and I:\n' + formatMessagesAsText(messages),
        buildPrompt(tone, context),
    ].join('\n')

const translateInstructions = [
    'You are helping me translate a raw emotional draft into a polished, rational message.',
    'You already know this person and this conversation from the context above.',
    'Preserve my intent and voice. Remove reactivity. Soften sharp edges so the message lands well.',
    'Do NOT invent new ideas — only refine what I have written.',
].join('\n')

const translateResponseFormat = [
    'Format your response exactly as follows:',
    '',
    'Reply 1 (Short): [1-2 sentence version]',
    '',
    'Reply 2 (Medium): [3-4 sentence version]',
    '',
    'Reply 3 (Long): [5+ sentence version]',
].join('\n')

export const translateSystemContext = (): string =>
    [systemContext(), translateInstructions].filter(Boolean).join('\n\n')

export const translatePrompt = (userDraft: string, tone: string, context: string): string => {
    const lines = [
        `Here is my raw draft:\n"""\n${userDraft}\n"""`,
        '',
        `Rewrite this as three versions in a ${tone} tone.`,
    ]
    if (context) {
        lines.push('', `Additional context: ${context}`)
    }
    lines.push('', translateResponseFormat)
    return lines.join('\n')
}

export const translateKhojPrompt = (
    messages: Message[],
    userDraft: string,
    tone: ToneType,
    context: string
): string =>
    [
        translateSystemContext(),
        'Here are some text messages between my partner and I:\n' + formatMessagesAsText(messages),
        translatePrompt(userDraft, tone, context),
    ].join('\n')

export const inferProfileSystemPrompt = (): string =>
    [
        "You are a compassionate observer drawing on Gabor Maté's Compassionate Inquiry.",
        "Read a conversation transcript and infer psychological profiles for two people: the one writing as 'me' and their partner.",
        'Observe with curiosity, not judgment. Look for patterns, not pathology.',
        'Attend to:',
        '  - Attachment patterns: how each person bids for connection, responds to distance, seeks reassurance',
        '  - Emotional reactivity: escalation, withdrawal, defensiveness, flooding',
        "  - Core beliefs surfacing in language: 'always', 'never', 'you don't care', self-minimizing phrases",
        '  - The childhood wound speaking beneath adult behaviour: what fear seems to be driving this?',
        '  - Repair attempts: who reaches for reconnection, and how?',
        '  - What reliably creates warmth or safety between them',
        'Write in compassionate, plain language. Ground every inference in specific observed behaviour.',
        'Never diagnose. Name patterns, not defects.',
    ].join('\n')

export const inferProfilePrompt = (messagesText: string): string =>
    [
        "Here is a conversation transcript. Messages from the user are prefixed 'me:' and messages from their partner use 'them:'.",
        '',
        '"""',
        messagesText,
        '"""',
        '',
        'Based on this conversation, infer psychological profiles for both people.',
        'Return ONLY a valid JSON object with exactly these six keys. No explanation, preamble, or markdown — raw JSON only.',
        '',
        '  "PARTNER_STORY": Their core narrative about worth and safety in relationships, grounded in what you observed.',
        '  "PARTNER_TRIGGERS": Topics, tones, or dynamics that activate tension or withdrawal in them.',
        '  "PARTNER_NEEDS": What appears to help them feel safe, seen, or reconnected.',
        '  "MY_STORY": The same for the person writing as "me".',
        '  "MY_TRIGGERS": The same for "me".',
        '  "MY_NEEDS": The same for "me".',
        '',
        'If there is insufficient evidence for a field, use an empty string "". Do not invent. Observe, reflect, name gently.',
    ].join('\n')
