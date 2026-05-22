<script lang="ts">
    let { replies = [], loading = false }: { replies: string[]; loading: boolean } = $props()

    let activeTab = $state(0)
    let copied = $state(false)

    const labels = ['Short', 'Medium', 'Long']

    $effect(() => {
        if (replies.length) activeTab = 0
    })

    async function copyActive() {
        const text = replies[activeTab]
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            copied = true
            setTimeout(() => (copied = false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }
</script>

<div class="suggestions">
    {#if loading}
        <div class="skeleton-tabs">
            {#each labels as label}
                <div class="skeleton-tab">{label}</div>
            {/each}
        </div>
        <div class="skeleton-card">
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
        </div>
    {:else if replies.length > 0}
        <div class="tab-bar" role="tablist">
            {#each labels as label, i}
                <button
                    role="tab"
                    aria-selected={activeTab === i}
                    class="tab"
                    class:active={activeTab === i}
                    onclick={() => (activeTab = i)}
                >
                    {label}
                </button>
            {/each}
        </div>
        <div class="reply-card" role="tabpanel">
            <div class="reply-content">{replies[activeTab]}</div>
            <div class="card-footer">
                <button class="copy-button" class:copied onclick={copyActive} aria-label="Copy to clipboard">
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
        </div>
    {:else}
        <div class="empty-state">
            Generate a summary to see reply suggestions.
        </div>
    {/if}
</div>

<style>
    .suggestions {
        margin-top: 0.75rem;
    }

    .tab-bar {
        display: flex;
        border-bottom: 1px solid var(--border);
        margin-bottom: 0;
    }

    .tab {
        font-family: var(--label-font);
        font-size: 0.78rem;
        font-weight: 400;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 0.5rem 1rem;
        border: none;
        background: none;
        color: var(--text-muted);
        cursor: pointer;
        position: relative;
        transition: color 0.15s;
    }

    .tab::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0.4rem;
        right: 0.4rem;
        height: 2px;
        background: var(--accent);
        transform: scaleX(0);
        transition: transform 0.2s ease;
    }

    .tab.active {
        color: var(--text);
        font-weight: 500;
    }

    .tab.active::after {
        transform: scaleX(1);
    }

    .tab:hover:not(.active) {
        color: var(--text);
    }

    .reply-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-top: none;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
    }

    .reply-content {
        font-family: var(--body-font);
        font-size: 0.975rem;
        padding: 1rem;
        line-height: 1.7;
        color: var(--text);
        min-height: 4rem;
    }

    .card-footer {
        display: flex;
        justify-content: flex-end;
        padding: 0.5rem 0.75rem;
        border-top: 1px solid var(--border);
    }

    .copy-button {
        font-family: var(--label-font);
        font-size: 0.78rem;
        font-weight: 500;
        letter-spacing: 0.04em;
        padding: 0.35rem 0.9rem;
        border-radius: var(--border-radius);
        border: 1.5px solid var(--accent);
        background: none;
        color: var(--accent);
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        min-height: 32px;
    }

    .copy-button:hover,
    .copy-button.copied {
        background: var(--accent);
        color: var(--accent-text);
    }

    .empty-state {
        font-family: var(--body-font);
        font-size: 0.9rem;
        color: var(--text-muted);
        font-style: italic;
        text-align: center;
        padding: 2rem;
    }

    /* Skeleton loading */
    .skeleton-tabs {
        display: flex;
        border-bottom: 1px solid var(--border);
    }

    .skeleton-tab {
        font-size: 0.78rem;
        padding: 0.5rem 1rem;
        color: transparent;
        background: var(--surface);
        border-radius: 4px 4px 0 0;
        margin-right: 4px;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-top: none;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        padding: 1rem;
    }

    .skeleton-line {
        height: 13px;
        background: var(--border);
        border-radius: 4px;
        margin-bottom: 0.75rem;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-line.short {
        width: 55%;
    }

    @keyframes skeleton-pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }
</style>
