<script lang="ts">
    let { additionalContext = $bindable(''), expanded = $bindable(false) } = $props()
</script>

<details class="context-details" bind:open={expanded}>
    <summary>add context</summary>
    <textarea
        class="context-input"
        rows="4"
        bind:value={additionalContext}
        placeholder="anything else we should know about?"
    ></textarea>
    {#if additionalContext.trim() !== ''}
        <div class="button-container">
            <button
                type="button"
                class="clear-button"
                onclick={() => {
                    additionalContext = ''
                }}
            >
                clear
            </button>
        </div>
    {/if}
</details>

<style>
    details.context-details {
        text-align: left;
        border: 1px solid var(--border);
        background-color: var(--card);
        border-radius: var(--border-radius);
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    details summary {
        cursor: pointer;
        font-weight: 500;
        color: var(--text);
    }

    textarea.context-input {
        font-family: var(--body-font);
        font-size: 1rem;
        width: 100%;
        margin-top: 0.75rem;
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
    }

    .clear-button {
        border: 1px solid var(--border);
        background-color: var(--surface);
        color: var(--text-muted);
        border-radius: var(--border-radius);
        padding: 0.25rem 0.75rem;
        cursor: pointer;
        font-family: var(--body-font);
        transition: background-color 0.15s;
    }

    .clear-button:hover {
        background-color: var(--border);
        color: var(--text);
    }

    .button-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
    }
</style>
