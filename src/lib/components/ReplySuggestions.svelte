<script lang="ts">
    let { replies = [], loading = false }: { replies: string[]; loading: boolean } = $props()

    let activeTab = $state(0)
    let copied = $state(false)

    const labels = ['Short', 'Medium', 'Long']

    $effect(() => {
        if (replies.length) activeTab = 0
    })

    async function copyActive() {
        try {
            await navigator.clipboard.writeText(replies[activeTab])
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
                <button class="copy-button" onclick={copyActive} aria-label="Copy to clipboard">
                    {#if copied}
                        ✓ Copied
                    {:else}
                        📋 Copy
                    {/if}
                </button>
            </div>
        </div>
    {:else}
        <div class="empty-state">
            <strong>¯\_(ツ)_/¯</strong>
        </div>
    {/if}
</div>

<style>
    .suggestions {
        margin-top: 1rem;
    }

    .tab-bar {
        display: flex;
        gap: 0;
        border-bottom: 2px solid var(--border);
        margin-bottom: 0;
    }

    .tab {
        font-family: var(--body-font);
        font-size: 0.875rem;
        font-weight: 500;
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
        bottom: -2px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent);
        opacity: 0;
        transition: opacity 0.15s;
    }

    .tab.active {
        color: var(--accent);
    }

    .tab.active::after {
        opacity: 1;
    }

    .tab:hover:not(.active) {
        color: var(--text);
    }

    .reply-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-top: none;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .reply-content {
        padding: 1rem;
        line-height: 1.6;
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
        font-family: var(--body-font);
        font-size: 0.85rem;
        padding: 0.35rem 0.75rem;
        border-radius: var(--border-radius);
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        cursor: pointer;
        transition: background 0.15s;
        min-height: var(--min-touch-size);
    }

    .copy-button:hover {
        background: var(--accent-soft);
        color: var(--accent);
    }

    .empty-state {
        color: var(--text-muted);
        text-align: center;
        padding: 2rem;
    }

    /* Skeleton loading */
    .skeleton-tabs {
        display: flex;
        gap: 0;
        border-bottom: 2px solid var(--border);
    }

    .skeleton-tab {
        font-size: 0.875rem;
        font-weight: 500;
        padding: 0.5rem 1rem;
        color: transparent;
        background: var(--surface);
        border-radius: 4px 4px 0 0;
        margin-right: 4px;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-card {
        background: var(--card);
        border: 1px solid var(--border);
        border-top: none;
        border-radius: 0 0 var(--border-radius) var(--border-radius);
        padding: 1rem;
    }

    .skeleton-line {
        height: 14px;
        background: var(--surface);
        border-radius: 4px;
        margin-bottom: 0.75rem;
        animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    .skeleton-line.short {
        width: 60%;
    }

    @keyframes skeleton-pulse {
        0%,
        100% {
            opacity: 0.5;
        }
        50% {
            opacity: 1;
        }
    }
</style>
