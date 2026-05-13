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
    <div class="message-count">
        <span class="message-count-value">{messageCount}</span> messages
    </div>
</section>

<style>
    .control-bar {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .timeframe-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        line-height: 1;
        flex-wrap: wrap;
    }

    .timeframe-controls label {
        font-weight: bold;
    }

    .go-button {
        background-color: var(--accent);
        color: var(--accent-text);
        border: none;
        border-radius: 999px;
        font-family: var(--body-font);
        font-size: 0.875rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        padding: 0 1.1rem;
        height: 36px;
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
        width: 12px;
        height: 12px;
        border: 2px solid var(--white); /* Spinner color on button */
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
    }

    .message-count {
        font-size: 0.95rem;
        display: flex;
        align-items: center;
        color: var(--text-muted);
        margin-left: auto;
    }

    .message-count-value {
        font-weight: 600;
        margin: 0 0.25rem;
    }

    @media (max-width: 600px) {
        .message-count {
            margin-left: 0;
        }
    }
</style>
