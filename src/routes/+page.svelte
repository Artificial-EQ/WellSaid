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
    import { type Message, type PageData, TONES, type ToneType } from '$lib/types'

    const LOCAL_STORAGE_CONTEXT_KEY = 'wellsaid_additional_context'
    const LOCAL_STORAGE_DRAFT_KEY = 'wellsaid_user_draft'

    const { data, form } = $props<{
        data: PageData & {
            multiProvider: boolean
            defaultProvider: string
            availableProviders: ProviderConfig[]
            settings: Setting[]
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

    let activeTab = $state<'main' | 'settings'>('main')
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
    const summaryContent = $derived(
        formState.ui.loading
            ? 'Generating summary and replies...'
            : formState.form.summary || 'click "go" to generate a conversation summary'
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
        <i>Empathy. Upgraded.</i>
    </header>

    <nav class="tab-bar">
        <button class:active={activeTab === 'main'} onclick={() => (activeTab = 'main')} aria-label="Home">
            💬
        </button>
        <button class:active={activeTab === 'settings'} onclick={() => (activeTab = 'settings')} aria-label="Settings">
            ⚙️
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
                        <section class="conversation">
                            <div class="summary">
                                {#if formState.ui.loading}
                                    <div class="loading-indicator">{summaryContent}</div>
                                {:else}
                                    {summaryContent}
                                {/if}
                            </div>
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
            {:else}
                <section class="settings-section">
                    <SettingsForm settings={data.settings} {form} />
                </section>
            {/if}
        </div>
    </div>
</main>

<ThemePicker bind:this={themePicker} />

<style>
    /* ===== Layout & Structure ===== */
    main.app {
        padding-bottom: 1rem;
    }

    .content-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0;
    }

    .tab-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 600px;
        padding: 1rem;
        border: 1px solid var(--border);
        border-radius: var(--border-radius) 0 var(--border-radius) var(--border-radius);
        background-color: var(--card);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
        margin: 0;
        min-height: calc(100vh - 200px);
        overflow-y: auto;
    }

    /* ===== Header ===== */
    header {
        text-align: center;
    }

    header h1 {
        font-family: var(--heading-font);
        font-size: 2.6rem;
        color: var(--accent);
        text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.08);
        margin-top: 1rem;
        margin-bottom: 0;
    }

    header i {
        font-style: italic;
        font-size: 0.95rem;
        color: var(--text-muted);
        display: block;
        margin-bottom: 1.25rem;
    }

    /* ===== Tab Bar ===== */
    .tab-bar {
        display: flex;
        gap: 0;
        padding: 0;
        background-color: transparent;
        margin-bottom: -1px;
        position: relative;
        z-index: 1;
        justify-content: flex-end;
        width: 100%;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }

    .tab-bar button {
        font-size: 0.9rem;
        background-color: var(--surface);
        color: var(--text-muted);
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius) var(--border-radius) 0 0;
        border: 1px solid var(--border);
        border-bottom: none;
        cursor: pointer;
        margin-left: 2px;
        transition: background-color 0.15s, color 0.15s;
    }

    .tab-bar button.active {
        background-color: var(--card);
        color: var(--accent);
        border-color: var(--border);
        border-bottom: none;
        font-weight: 600;
    }

    /* ===== Form Consistency ===== */
    form {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 0;
        margin: 0;
        box-shadow: none;
        background-color: transparent;
    }

    /* ===== Conversation Section ===== */
    .conversation {
        background-color: var(--accent-soft);
        min-height: 20px;
        transition: opacity 0.3s, background-color 0.2s;
        border-radius: var(--border-radius);
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
    }

    .summary {
        font-family: var(--summary-font);
        font-size: 1rem;
        line-height: 1.6;
        letter-spacing: 0.02em;
        overflow-wrap: break-word; /* Prevent long words from overflowing */
    }

    /* ===== Loading Indicators ===== */
    .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);
        font-style: italic;
        padding: 1rem;
    }

    /* ===== Draft & Translate ===== */
    .draft-section {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }

    .draft-label {
        font-family: var(--label-font);
        font-weight: 500;
        font-size: 0.9rem;
        color: var(--text);
    }

    .draft-input {
        font-family: var(--body-font);
        font-size: 1rem;
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--border-radius);
        resize: vertical;
        min-height: 80px;
        color: var(--text);
        background-color: var(--card);
        text-size-adjust: 100%;
        -webkit-text-size-adjust: 100%;
        touch-action: manipulation;
        box-sizing: border-box;
    }

    .translate-controls {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .clear-draft-button {
        border: 1px solid var(--border);
        background-color: var(--surface);
        color: var(--text-muted);
        border-radius: var(--border-radius);
        padding: 0.25rem 0.75rem;
        cursor: pointer;
        font-family: var(--body-font);
        transition: background-color 0.15s;
    }

    .clear-draft-button:hover {
        background-color: var(--border);
        color: var(--text);
    }

    .translate-button {
        background-color: var(--accent);
        color: var(--accent-text);
        border: none;
        border-radius: var(--border-radius);
        font-family: var(--body-font);
        font-weight: 500;
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

    /* ===== Settings Styling ===== */
    .settings-section {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 0;
    }

    /* ===== No Providers Message ===== */
    .no-providers-message {
        text-align: center;
        padding: 2rem;
        color: var(--text);
    }

    .no-providers-message h2 {
        color: var(--text);
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }

    .no-providers-message p {
        margin-bottom: 1.5rem;
        color: var(--text-muted);
        line-height: 1.4;
    }

    .settings-link-button {
        background-color: var(--accent);
        color: var(--accent-text);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-family: var(--body-font);
        font-weight: bold;
        font-size: 1rem;
        transition: opacity 0.2s ease;
    }

    .settings-link-button:hover {
        opacity: 0.88;
    }
</style>
