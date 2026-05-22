<script lang="ts">
    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import AdditionalContext from '$lib/components/AdditionalContext.svelte'
    import AiProviderSelector from '$lib/components/AiProviderSelector.svelte'
    import ControlBar from '$lib/components/ControlBar.svelte'
    import RawMessages from '$lib/components/RawMessages.svelte'
    import ReplySuggestions from '$lib/components/ReplySuggestions.svelte'
    import SettingsForm from '$lib/components/SettingsForm.svelte'
    import ThemePicker from '$lib/components/ThemePicker.svelte'
    import ToneSelector from '$lib/components/ToneSelector.svelte'
    import type { Setting } from '$lib/config'
    import type { ProviderConfig } from '$lib/providers/registry'
    import { type Message, type PageData, type ProfileInferenceResult, TONES, type ToneType } from '$lib/types'

    const LOCAL_STORAGE_CONTEXT_KEY = 'wellsaid_additional_context'
    const LOCAL_STORAGE_DRAFT_KEY = 'wellsaid_user_draft'

    const { data, form } = $props<{
        data: PageData & {
            multiProvider: boolean
            defaultProvider: string
            availableProviders: ProviderConfig[]
            settings: Setting[]
            partnerName: string
        }
        form?: any
    }>()

    const DEFAULT_PROVIDER = data.defaultProvider

    let formState = $state({
        ai: {
            provider: DEFAULT_PROVIDER || data.availableProviders[0]?.id || '',
        },
        ui: {
            loading: false,
            translating: false,
        },
        form: {
            lookBackHours: '1',
            additionalContext: '',
            tone: 'gentle' as ToneType,
            messages: [] as Message[],
            summary: '',
            suggestedReplies: [] as string[],
            userDraft: '',
            rawMessagesExpanded: false,
        },
    })

    let activeTab = $state<'main' | 'settings' | 'profiles'>('main')

    let inferState = $state<{ loading: boolean; error: string; suggestions: ProfileInferenceResult | null }>({
        loading: false,
        error: '',
        suggestions: null,
    })
    let pendingSuggestions = $state<Record<string, string>>({})

    const profileKeys = ['PARTNER_NAME', 'PARTNER_STORY', 'PARTNER_TRIGGERS', 'PARTNER_NEEDS', 'MY_STORY', 'MY_TRIGGERS', 'MY_NEEDS']
    const profileSettings = $derived(data.settings.filter((s: Setting) => profileKeys.includes(s.key)))
    const generalSettings = $derived(data.settings.filter((s: Setting) => !profileKeys.includes(s.key)))
    const mergedProfileSettings = $derived(
        profileSettings.map((s: Setting) =>
            s.key in pendingSuggestions ? { ...s, value: pendingSuggestions[s.key] } : s
        )
    )
    let themePicker: ThemePicker

    let additionalContextExpanded = $state(false)

    // Derived values
    const hasMessages = $derived(formState.form.messages.length > 0)
    const canGenerateReplies = $derived(hasMessages && !formState.ui.loading && !formState.ui.translating)
    const hasProviders = $derived(data.availableProviders.length > 0)
    const hasSummary = $derived(formState.form.summary !== '')
    const canTranslate = $derived(
        hasSummary &&
        formState.form.userDraft.trim().length > 0 &&
        !formState.ui.translating &&
        !formState.ui.loading
    )
    const showLoadingIndicators = $derived(formState.ui.loading || formState.ui.translating)
    const canInferProfile = $derived(hasMessages && !inferState.loading)

    const PROFILE_FIELD_LABELS: Record<string, string> = {
        PARTNER_STORY: 'Their story',
        PARTNER_TRIGGERS: 'Their triggers',
        PARTNER_NEEDS: 'Their needs',
        MY_STORY: 'My story',
        MY_TRIGGERS: 'My triggers',
        MY_NEEDS: 'My needs',
    }

    function applySuggestion(key: string) {
        if (!inferState.suggestions) return
        pendingSuggestions = { ...pendingSuggestions, [key]: inferState.suggestions[key as keyof ProfileInferenceResult] }
        inferState.suggestions = { ...inferState.suggestions, [key]: '' }
        if (Object.values(inferState.suggestions).every(v => !v)) inferState.suggestions = null
    }

    function applyAllSuggestions() {
        if (inferState.suggestions) {
            pendingSuggestions = { ...inferState.suggestions }
            inferState.suggestions = null
        }
    }

    async function runProfileInference() {
        inferState.loading = true
        inferState.error = ''
        inferState.suggestions = null

        try {
            const formData = new FormData()
            formData.append('messages', JSON.stringify(formState.form.messages))
            formData.append('provider', formState.ai.provider)

            const response = await fetch('?/inferProfile', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result?.error || 'Profile inference failed')
            }

            if (result && typeof result.data === 'string') {
                const parsedData = JSON.parse(result.data)
                // devalue encoding: parsedData[0] = { inferredProfile: N }
                // parsedData[N] = { PARTNER_STORY: X, ... }
                // parsedData[X] = the string value
                const profileIndex = parsedData[0]?.inferredProfile
                const profileKeys = parsedData[profileIndex]
                const suggestions: Record<string, string> = {}
                for (const [key, idx] of Object.entries(profileKeys as Record<string, number>)) {
                    suggestions[key] = parsedData[idx]
                }
                inferState.suggestions = suggestions as ProfileInferenceResult
            } else {
                throw new Error('Unexpected response format from server')
            }
        } catch (err) {
            inferState.error = err instanceof Error ? err.message : 'Unknown error during profile inference'
        } finally {
            inferState.loading = false
        }
    }
    const partnerLabel = data.partnerName || 'your partner'
    const summaryContent = $derived(
        formState.form.summary ||
        `click "go" to generate a summary of your conversation with ${partnerLabel}`
    )

    // Update messages when data changes
    $effect(() => {
        if (data?.messages && Array.isArray(data.messages)) {
            formState.form.messages = data.messages
        }
    })

    // Watch for changes to lookBackHours and navigate to the new URL
    $effect(() => {
        if (!browser) return

        const lookBack = formState.form.lookBackHours
        if (lookBack) {
            const url = new URL(window.location.href)
            const current = url.searchParams.get('lookBackHours')

            if (current === lookBack) return

            // Update the URL with the new lookBackHours parameter
            url.searchParams.set('lookBackHours', lookBack)

            // Use SvelteKit's goto to navigate to the new URL
            // This will trigger a new page load with the updated parameter
            goto(url.toString(), { keepFocus: true, noScroll: true })
        }
    })

    $effect(() => {
        if (!browser) return

        const storedContext = localStorage.getItem(LOCAL_STORAGE_CONTEXT_KEY)
        if (storedContext) {
            formState.form.additionalContext = storedContext
            if (storedContext.trim() !== '') {
                additionalContextExpanded = true
            }
        }
    })

    $effect(() => {
        if (!browser) return

        if (formState.form.additionalContext) {
            localStorage.setItem(LOCAL_STORAGE_CONTEXT_KEY, formState.form.additionalContext)
        } else {
            localStorage.removeItem(LOCAL_STORAGE_CONTEXT_KEY)
        }
    })

    $effect(() => {
        if (!browser) return
        const storedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY)
        if (storedDraft) formState.form.userDraft = storedDraft
        themePicker?.loadSaved()
    })

    $effect(() => {
        if (!browser) return
        if (formState.form.userDraft) {
            localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, formState.form.userDraft)
        } else {
            localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY)
        }
    })

    function handleSubmit(event: Event) {
        event.preventDefault()
    }

    // Generate summary and replies
    async function queryAI() {
        formState.ui.loading = true
        formState.form.summary = ''
        formState.form.suggestedReplies = []

        try {
            const formData = new FormData()
            formData.append('messages', JSON.stringify(formState.form.messages))
            formData.append('tone', formState.form.tone)
            formData.append('context', formState.form.additionalContext)
            formData.append('provider', formState.ai.provider)

            const response = await fetch('?/generate', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                // Action called fail()
                // result is the object passed to fail(), e.g., { error: 'message', details: '...' }
                const errorMessage = result?.error || 'Unknown error from action'
                throw new Error(`Action failed: ${errorMessage}`)
            }

            // SvelteKit wraps the response in { type, status, data }
            // where data is a JSON string
            if (result && typeof result.data === 'string') {
                try {
                    const parsedData = JSON.parse(result.data)
                    // The parsed data is in an array where:
                    // parsedData[0] is { summary: 1, replies: 2 } (indices into the array)
                    // parsedData[1] is the summary string
                    // parsedData[2] is [3,4,5] (indices of the actual replies in the array)
                    // parsedData[3], parsedData[4], parsedData[5] are the actual replies
                    formState.form.summary = parsedData[1] || 'No summary generated.'

                    // Extract the actual replies using the indices from parsedData[2]
                    const replyIndices = Array.isArray(parsedData[2]) ? parsedData[2] : []
                    const replies = []
                    for (const index of replyIndices) {
                        if (parsedData[index] && typeof parsedData[index] === 'string') {
                            replies.push(parsedData[index])
                        }
                    }
                    formState.form.suggestedReplies = replies
                } catch (parseError) {
                    console.error('Error parsing action data:', parseError)
                    throw parseError
                }
            } else {
                throw new Error('Unexpected response format from server')
            }
        } catch (error) {
            formState.form.summary =
                error instanceof Error
                    ? error.message
                    : 'Error generating summary. Please try again.'
            formState.form.suggestedReplies = [] // Clear replies on error
        } finally {
            formState.ui.loading = false
        }
    }

    async function translateDraft() {
        formState.ui.translating = true
        formState.form.suggestedReplies = []

        try {
            const formData = new FormData()
            formData.append('messages', JSON.stringify(formState.form.messages))
            formData.append('tone', formState.form.tone)
            formData.append('context', formState.form.additionalContext)
            formData.append('provider', formState.ai.provider)
            formData.append('userDraft', formState.form.userDraft)

            const response = await fetch('?/translate', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                const errorMessage = result?.error || 'Unknown error from action'
                throw new Error(`Action failed: ${errorMessage}`)
            }

            if (result && typeof result.data === 'string') {
                try {
                    const parsedData = JSON.parse(result.data)
                    // parsedData[0] = { replies: 1 }
                    // parsedData[1] = [2, 3, 4] (indices of reply strings)
                    // parsedData[2..4] = the actual reply strings
                    const replyIndices = Array.isArray(parsedData[1]) ? parsedData[1] : []
                    const replies: string[] = []
                    for (const index of replyIndices) {
                        if (parsedData[index] && typeof parsedData[index] === 'string') {
                            replies.push(parsedData[index])
                        }
                    }
                    formState.form.suggestedReplies = replies
                } catch (parseError) {
                    console.error('Error parsing translate data:', parseError)
                    throw parseError
                }
            } else {
                throw new Error('Unexpected response format from server')
            }
        } catch (error) {
            formState.form.suggestedReplies = [
                error instanceof Error ? error.message : 'Error translating draft. Please try again.',
            ]
        } finally {
            formState.ui.translating = false
        }
    }
</script>

<svelte:head>
    <title>WellSaid</title>
</svelte:head>

<main class="app">
    <header>
        <h1>WellSaid</h1>
        <p class="tagline">Empathy, upgraded.</p>
    </header>

    <nav class="tab-bar">
        <button class:active={activeTab === 'main'} onclick={() => (activeTab = 'main')}>
            conversation
        </button>
        <button class:active={activeTab === 'profiles'} onclick={() => (activeTab = 'profiles')}>
            profiles
        </button>
        <button class:active={activeTab === 'settings'} onclick={() => (activeTab = 'settings')}>
            settings
        </button>
    </nav>

    <div class="content-container">
        <div class="tab-content">
            {#if activeTab === 'main'}
                {#if hasProviders}
                    <form onsubmit={handleSubmit}>
                        <ControlBar
                            bind:lookBackHours={formState.form.lookBackHours}
                            messageCount={formState.form.messages.length}
                            onclick={queryAI}
                            canGenerate={canGenerateReplies}
                            isLoading={showLoadingIndicators}
                        />

                        <!-- Additional context (collapsible) -->
                        <AdditionalContext
                            bind:additionalContext={formState.form.additionalContext}
                            bind:expanded={additionalContextExpanded}
                        />

                        <!-- Conversation summary -->
                        <section class="conversation" class:has-content={hasSummary && !formState.ui.loading}>
                            {#if formState.ui.loading}
                                <div class="loading-indicator">
                                    <span class="loading-dot"></span>
                                    <span class="loading-dot"></span>
                                    <span class="loading-dot"></span>
                                </div>
                            {:else}
                                <div class="summary">{summaryContent}</div>
                            {/if}
                        </section>

                        <!-- Raw messages (collapsible) -->
                        {#if hasMessages}
                            <RawMessages
                                messages={formState.form.messages}
                                bind:expanded={formState.form.rawMessagesExpanded}
                            />
                        {/if}

                        <!-- User draft + translate -->
                        {#if hasSummary}
                            <section class="draft-section">
                                <label class="draft-label" for="user-draft">your draft:</label>
                                <textarea
                                    id="user-draft"
                                    class="draft-input"
                                    rows="4"
                                    bind:value={formState.form.userDraft}
                                    placeholder="Write your raw, unfiltered response here. Go nuts. We'll sort it out"
                                ></textarea>
                                <div class="translate-controls">
                                    {#if formState.form.userDraft.trim()}
                                        <button
                                            type="button"
                                            class="clear-draft-button"
                                            onclick={() => (formState.form.userDraft = '')}
                                        >
                                            clear
                                        </button>
                                    {/if}
                                    <button
                                        type="button"
                                        class="translate-button"
                                        onclick={translateDraft}
                                        disabled={!canTranslate}
                                    >
                                        {formState.ui.translating ? '...' : 'translate'}
                                    </button>
                                </div>
                            </section>
                        {/if}

                        <hr />

                        <!-- Reply suggestions section -->
                        <section class="reply-section">
                            <h2>suggested replies:</h2>

                            <ToneSelector bind:selectedTone={formState.form.tone} tones={TONES} />

                            <ReplySuggestions
                                replies={formState.form.suggestedReplies}
                                loading={showLoadingIndicators}
                            />
                        </section>
                        <hr />
                        {#if data.multiProvider}
                            <AiProviderSelector
                                bind:value={formState.ai.provider}
                                providers={data.availableProviders}
                            />
                        {/if}
                    </form>
                {:else}
                    <div class="no-providers-message">
                        <h2>No AI providers are configured</h2>
                        <p>Please set at least one provider in settings to use WellSaid.</p>
                        <button
                            onclick={() => (activeTab = 'settings')}
                            class="settings-link-button"
                        >
                            Go to Settings
                        </button>
                    </div>
                {/if}
            {:else if activeTab === 'profiles'}
                <section class="settings-section">
                    <div class="infer-bar">
                        <button
                            type="button"
                            class="infer-button"
                            onclick={runProfileInference}
                            disabled={!canInferProfile}
                        >
                            {inferState.loading ? 'Analysing…' : 'Suggest from messages'}
                        </button>
                        {#if !hasMessages}
                            <span class="infer-hint">Load a conversation on the main tab first</span>
                        {/if}
                        {#if inferState.error}
                            <span class="infer-error">{inferState.error}</span>
                        {/if}
                    </div>

                    {#if inferState.suggestions}
                        <div class="suggestions-panel">
                            <p class="suggestions-note">Review suggestions below. Apply what resonates, then save with the Update button.</p>
                            {#each Object.keys(PROFILE_FIELD_LABELS) as field}
                                {#if inferState.suggestions[field as keyof ProfileInferenceResult]}
                                    <div class="suggestion-row">
                                        <div class="suggestion-header">
                                            <span class="suggestion-label">{PROFILE_FIELD_LABELS[field]}</span>
                                            <button
                                                type="button"
                                                class="use-button"
                                                onclick={() => applySuggestion(field)}
                                            >use this</button>
                                        </div>
                                        <p class="suggestion-text">{inferState.suggestions[field as keyof ProfileInferenceResult]}</p>
                                    </div>
                                {/if}
                            {/each}
                            <div class="suggestions-actions">
                                <button type="button" class="apply-all-button" onclick={applyAllSuggestions}>Apply all</button>
                                <button type="button" class="dismiss-button" onclick={() => { inferState.suggestions = null }}>Dismiss</button>
                            </div>
                        </div>
                    {/if}

                    {#key pendingSuggestions}
                        <SettingsForm settings={mergedProfileSettings} {form} />
                    {/key}
                </section>
            {:else}
                <section class="settings-section">
                    <SettingsForm settings={generalSettings} {form} />
                </section>
            {/if}
        </div>
    </div>
</main>

<ThemePicker bind:this={themePicker} />

<style>
    main.app {
        width: 100%;
        padding-bottom: 2rem;
    }

    /* ===== Header ===== */
    header {
        text-align: center;
        padding-top: 0.5rem;
        margin-bottom: 0.25rem;
    }

    header h1 {
        font-family: var(--heading-font);
        font-size: 3rem;
        font-weight: 600;
        color: var(--text);
        margin: 0;
        letter-spacing: -0.01em;
        line-height: 1;
    }

    .tagline {
        font-family: var(--body-font);
        font-style: italic;
        font-size: 0.9rem;
        color: var(--text-muted);
        margin: 0.3rem 0 1rem;
    }

    /* ===== Tab Strip ===== */
    .tab-bar {
        display: flex;
        width: 100%;
        max-width: 600px;
        margin: 0 auto 0;
        border-bottom: 1px solid var(--border);
    }

    .tab-bar button {
        font-family: var(--label-font);
        font-size: 0.78rem;
        font-weight: 400;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: none;
        border: none;
        padding: 0.6rem 1.1rem;
        cursor: pointer;
        color: var(--text-muted);
        position: relative;
        transition: color 0.2s;
    }

    .tab-bar button::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0.5rem;
        right: 0.5rem;
        height: 2px;
        background: var(--accent);
        transform: scaleX(0);
        transition: transform 0.2s ease;
    }

    .tab-bar button.active {
        color: var(--text);
        font-weight: 500;
    }

    .tab-bar button.active::after {
        transform: scaleX(1);
    }

    .tab-bar button:hover:not(.active) {
        color: var(--text);
    }

    /* ===== Content Card ===== */
    .content-container {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .tab-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 600px;
        padding: 1.5rem 1.25rem;
        background-color: var(--card);
        border: 1px solid var(--border);
        border-top: none;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        box-shadow: var(--shadow-md);
        min-height: calc(100vh - 220px);
    }

    /* ===== Form ===== */
    form {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 0;
        margin: 0;
        box-shadow: none;
        background-color: transparent;
    }

    /* ===== Conversation Summary ===== */
    .conversation {
        margin-bottom: 1.25rem;
        padding: 0;
        min-height: 2.5rem;
    }

    .conversation.has-content {
        border-left: 3px solid var(--accent);
        padding: 0.25rem 0 0.25rem 1rem;
    }

    .summary {
        font-family: var(--body-font);
        font-size: 0.975rem;
        line-height: 1.75;
        color: var(--text);
        overflow-wrap: break-word;
    }

    /* ===== Loading Dots ===== */
    .loading-indicator {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 0.75rem 0;
    }

    .loading-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--accent);
        opacity: 0.4;
        animation: dot-pulse 1.4s ease-in-out infinite;
    }

    .loading-dot:nth-child(2) { animation-delay: 0.2s; }
    .loading-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes dot-pulse {
        0%, 80%, 100% { opacity: 0.4; transform: scale(0.85); }
        40% { opacity: 1; transform: scale(1); }
    }

    /* ===== Draft & Translate ===== */
    .draft-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
    }

    .draft-label {
        font-family: var(--label-font);
        font-size: 0.78rem;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
    }

    .draft-input {
        font-family: var(--body-font);
        font-size: 0.975rem;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--border-radius);
        resize: vertical;
        min-height: 80px;
        color: var(--text);
        background-color: var(--surface);
        text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
        touch-action: manipulation;
        box-sizing: border-box;
        transition: border-color 0.15s, box-shadow 0.15s;
    }

    .draft-input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px color-mix(in oklch, var(--accent) 15%, transparent);
    }

    .translate-controls {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .clear-draft-button {
        border: 1px solid var(--border);
        background: none;
        color: var(--text-muted);
        border-radius: var(--border-radius);
        padding: 0.35rem 0.85rem;
        cursor: pointer;
        font-family: var(--label-font);
        font-size: 0.82rem;
        transition: color 0.15s, border-color 0.15s;
    }

    .clear-draft-button:hover {
        color: var(--text);
        border-color: var(--text-muted);
    }

    .translate-button {
        background-color: var(--accent);
        color: var(--accent-text);
        border: none;
        border-radius: var(--border-radius);
        font-family: var(--label-font);
        font-size: 0.85rem;
        font-weight: 500;
        letter-spacing: 0.02em;
        cursor: pointer;
        min-height: var(--min-touch-size);
        padding: 0 1.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
    }

    .translate-button:hover:not(:disabled) {
        opacity: 0.88;
    }

    .translate-button:disabled {
        background-color: var(--surface);
        color: var(--text-muted);
        cursor: not-allowed;
    }

    /* ===== Reply Section ===== */
    .reply-section h2 {
        font-family: var(--label-font);
        font-size: 0.78rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 0.75rem;
    }

    /* ===== Settings Tab ===== */
    .settings-section {
        width: 100%;
    }

    /* ===== No Providers ===== */
    .no-providers-message {
        text-align: center;
        padding: 3rem 1rem;
    }

    .no-providers-message h2 {
        font-family: var(--heading-font);
        font-size: 1.4rem;
        color: var(--text);
        margin-bottom: 0.75rem;
        font-weight: 400;
    }

    .no-providers-message p {
        margin-bottom: 1.5rem;
        color: var(--text-muted);
        line-height: 1.6;
        font-size: 0.9rem;
    }

    .settings-link-button {
        background-color: var(--accent);
        color: var(--accent-text);
        border: none;
        padding: 0.7rem 1.5rem;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-family: var(--label-font);
        font-size: 0.85rem;
        font-weight: 500;
        transition: opacity 0.2s;
    }

    .settings-link-button:hover {
        opacity: 0.88;
    }

    /* ===== Profile Inference ===== */
    .infer-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        flex-wrap: wrap;
    }

    .infer-button {
        padding: 0.5rem 1.1rem;
        background-color: transparent;
        color: var(--accent);
        border: 1.5px solid var(--accent);
        border-radius: 999px;
        cursor: pointer;
        font-family: var(--label-font);
        font-size: 0.82rem;
        font-weight: 500;
        letter-spacing: 0.02em;
        transition: opacity 0.15s;
        min-height: var(--min-touch-size);
    }

    .infer-button:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .infer-button:not(:disabled):hover {
        opacity: 0.78;
    }

    .infer-hint {
        font-size: 0.82rem;
        color: var(--text-muted);
    }

    .infer-error {
        font-size: 0.82rem;
        color: var(--error);
    }

    .suggestions-panel {
        border-left: 3px solid var(--accent);
        padding: 0.75rem 0 0.75rem 1rem;
        margin-bottom: 1.5rem;
    }

    .suggestions-note {
        font-family: var(--body-font);
        font-size: 0.85rem;
        font-style: italic;
        color: var(--text-muted);
        margin: 0 0 1rem;
        line-height: 1.5;
    }

    .suggestion-row {
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border);
    }

    .suggestion-row:last-of-type {
        border-bottom: none;
        margin-bottom: 0.5rem;
    }

    .suggestion-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.35rem;
    }

    .suggestion-label {
        font-family: var(--label-font);
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--text-muted);
    }

    .use-button {
        font-family: var(--label-font);
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--accent);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
        transition: opacity 0.1s;
    }

    .use-button:hover {
        opacity: 0.7;
        text-decoration: underline;
    }

    .suggestion-text {
        font-family: var(--body-font);
        font-size: 0.9rem;
        line-height: 1.6;
        color: var(--text);
        margin: 0;
    }

    .suggestions-actions {
        display: flex;
        gap: 0.6rem;
        margin-top: 0.75rem;
    }

    .apply-all-button {
        padding: 0.4rem 1rem;
        background-color: var(--accent);
        color: var(--accent-text);
        border: none;
        border-radius: 999px;
        cursor: pointer;
        font-family: var(--label-font);
        font-size: 0.8rem;
        font-weight: 500;
        transition: opacity 0.15s;
    }

    .apply-all-button:hover {
        opacity: 0.88;
    }

    .dismiss-button {
        padding: 0.4rem 1rem;
        background: none;
        color: var(--text-muted);
        border: 1px solid var(--border);
        border-radius: 999px;
        cursor: pointer;
        font-family: var(--label-font);
        font-size: 0.8rem;
        transition: opacity 0.15s;
    }

    .dismiss-button:hover {
        opacity: 0.7;
    }
</style>
