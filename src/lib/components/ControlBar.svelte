<script lang="ts">
    let {
        lookBackHours = $bindable(''),
        messageCount,
        onclick,
        canGenerate,
        isLoading,
    }: {
        lookBackHours?: string
        messageCount: number
        onclick: () => void
        canGenerate: boolean
        isLoading: boolean
    } = $props()

    const lookBackOptions = [
        { value: '0.25', label: '15 min' },
        { value: '0.5', label: '30 min' },
        { value: '0.75', label: '45 min' },
        { value: '1', label: '1 hour' },
        { value: '2', label: '2 hours' },
        { value: '3', label: '3 hours' },
        { value: '4', label: '4 hours' },
        { value: '5', label: '5 hours' },
        { value: '6', label: '6 hours' },
        { value: '12', label: '12 hours' },
        { value: '24', label: '24 hours' },
    ]
</script>

<section class="control-bar">
    <div class="timeframe-controls">
        <label for="window-back">summarize last:</label>
        <select id="window-back" bind:value={lookBackHours}>
            {#each lookBackOptions as option (option.value)}
                <option value={option.value}>{option.label}</option>
            {/each}
        </select>
        <button type="button" class="go-button" {onclick} disabled={!canGenerate}>
            {#if isLoading}
                <span class="loading-spinner"></span>
            {:else}
                go
            {/if}
        </button>
    </div>
    {#if messageCount > 0}
        <div class="message-count">
            <span class="message-count-value">{messageCount}</span> messages
        </div>
    {/if}
</section>

<style>
    .control-bar {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
    }

    .timeframe-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .timeframe-controls label {
        font-family: var(--label-font);
        font-size: 0.78rem;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
    }

    .go-button {
        background-color: var(--accent);
        color: var(--accent-text);
        border: none;
        border-radius: 999px;
        font-family: var(--label-font);
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0 1.2rem;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: opacity 0.15s, transform 0.1s;
        white-space: nowrap;
    }

    .go-button:hover:not(:disabled) {
        opacity: 0.88;
    }

    .go-button:active:not(:disabled) {
        transform: scale(0.97);
    }

    .go-button:disabled {
        background-color: var(--surface);
        color: var(--text-muted);
        cursor: not-allowed;
    }

    .loading-spinner {
        display: inline-block;
        width: 11px;
        height: 11px;
        border: 2px solid color-mix(in oklch, var(--accent-text) 60%, transparent);
        border-radius: 50%;
        border-top-color: var(--accent-text);
        animation: spin 0.8s linear infinite;
    }

    .message-count {
        font-family: var(--label-font);
        font-size: 0.82rem;
        display: flex;
        align-items: center;
        color: var(--text-muted);
        margin-left: auto;
        letter-spacing: 0.01em;
    }

    .message-count-value {
        font-weight: 600;
        color: var(--text);
        margin-right: 0.25rem;
    }

    @media (max-width: 600px) {
        .message-count {
            margin-left: 0;
        }
    }
</style>
