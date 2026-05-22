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
        background-color: transparent;
        border-radius: var(--border-radius);
        padding: 0.75rem 1rem;
        margin-bottom: 1.25rem;
    }

    details summary {
        cursor: pointer;
        font-family: var(--label-font);
        font-size: 0.78rem;
        font-weight: 500;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--text-muted);
        list-style: none;
        display: flex;
        align-items: center;
        gap: 0.4rem;
    }

    details summary::before {
        content: '+';
        font-size: 1rem;
        line-height: 1;
        color: var(--accent);
        transition: transform 0.2s;
    }

    details[open] summary::before {
        content: '−';
    }

    details summary::-webkit-details-marker {
        display: none;
    }

    textarea.context-input {
        font-family: var(--body-font);
        font-size: 0.95rem;
        width: 100%;
        margin-top: 0.75rem;
        padding: 0.65rem 0.75rem;
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

    textarea.context-input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px color-mix(in oklch, var(--accent) 15%, transparent);
    }

    .clear-button {
        border: 1px solid var(--border);
        background: none;
        color: var(--text-muted);
        border-radius: var(--border-radius);
        padding: 0.3rem 0.75rem;
        cursor: pointer;
        font-family: var(--label-font);
        font-size: 0.78rem;
        transition: color 0.15s, border-color 0.15s;
    }

    .clear-button:hover {
        color: var(--text);
        border-color: var(--text-muted);
    }

    .button-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
    }
</style>
