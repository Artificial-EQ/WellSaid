<script lang="ts">
    import type { ToneType } from '$lib/types'

    let {
        selectedTone = $bindable(),
        tones = [] as const,
    }: {
        selectedTone: ToneType
        tones: readonly ToneType[]
    } = $props()
</script>

{#snippet toneOption(toneValue: ToneType)}
    <label class={selectedTone === toneValue ? 'active' : ''}>
        <input type="radio" name="tone" bind:group={selectedTone} value={toneValue} />
        {toneValue}
    </label>
{/snippet}

<div class="tone-selector">
    {#each tones as tone}
        {@render toneOption(tone)}
    {/each}
</div>

<style>
    .tone-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .tone-selector label input[type='radio'] {
        display: none;
    }

    .tone-selector label {
        font-family: var(--label-font);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.4rem 1rem;
        border: 1.5px solid var(--border);
        border-radius: 999px;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--text-muted);
        background-color: var(--card);
        transition:
            background-color 0.15s,
            color 0.15s,
            border-color 0.15s;
        min-height: 36px;
        min-width: 70px;
    }

    .tone-selector label:hover:not(.active) {
        border-color: var(--accent);
        color: var(--accent);
    }

    .tone-selector label.active {
        background-color: var(--accent);
        border-color: var(--accent);
        color: var(--accent-text);
        font-weight: 500;
    }
</style>
