<script lang="ts">
    let open = $state(false)
    let dark = $state(false)
    let currentAccent = $state('')

    const accents = [
        { key: '', label: 'Cyan', color: 'oklch(0.62 0.13 210)' },
        { key: 'sage', label: 'Sage', color: 'oklch(0.55 0.09 155)' },
        { key: 'indigo', label: 'Indigo', color: 'oklch(0.52 0.16 265)' },
        { key: 'amber', label: 'Amber', color: 'oklch(0.66 0.15 75)' },
        { key: 'rose', label: 'Rose', color: 'oklch(0.60 0.17 10)' },
    ]

    function applyTheme(isDark: boolean, accent: string) {
        const html = document.documentElement
        html.dataset.theme = isDark ? 'dark' : 'light'
        if (accent) {
            html.dataset.accent = accent
        } else {
            delete html.dataset.accent
        }
        localStorage.setItem('ws-dark', String(isDark))
        localStorage.setItem('ws-accent', accent)
    }

    function setAccent(key: string) {
        currentAccent = key
        applyTheme(dark, key)
    }

    function toggleDark() {
        dark = !dark
        applyTheme(dark, currentAccent)
    }

    export function loadSaved() {
        const savedDark = localStorage.getItem('ws-dark') === 'true'
        const savedAccent = localStorage.getItem('ws-accent') ?? ''
        dark = savedDark
        currentAccent = savedAccent
        applyTheme(dark, currentAccent)
    }
</script>

<div class="theme-picker">
    <button class="picker-toggle" onclick={() => (open = !open)} aria-label="Theme picker">
        🎨
    </button>

    {#if open}
        <div class="picker-panel">
            <div class="swatches">
                {#each accents as a}
                    <button
                        class="swatch"
                        class:active={currentAccent === a.key}
                        style="background: {a.color}"
                        aria-label={a.label}
                        onclick={() => setAccent(a.key)}
                    ></button>
                {/each}
            </div>
            <button class="mode-toggle" onclick={toggleDark}>
                {dark ? '☀️ Light' : '🌙 Dark'}
            </button>
        </div>
    {/if}
</div>

<style>
    .theme-picker {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 100;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.5rem;
    }

    .picker-toggle {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid var(--border);
        background: var(--card);
        font-size: 1.25rem;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        transition: box-shadow 0.2s;
    }

    .picker-toggle:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    }

    .picker-panel {
        background: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--border-radius);
        padding: 0.75rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        min-width: 160px;
    }

    .swatches {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
    }

    .swatch {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: transform 0.15s, border-color 0.15s;
    }

    .swatch:hover {
        transform: scale(1.15);
    }

    .swatch.active {
        border-color: var(--text);
        transform: scale(1.1);
    }

    .mode-toggle {
        font-family: var(--body-font);
        font-size: 0.85rem;
        padding: 0.4rem 0.75rem;
        border-radius: var(--border-radius);
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        cursor: pointer;
        transition: background 0.15s;
    }

    .mode-toggle:hover {
        background: var(--accent-soft);
    }
</style>
