<script lang="ts">
    import { page } from '$app/state'
    import { enhance } from '$app/forms'
    import type { ActionData } from './$types'

    const { form }: { form: ActionData } = $props()

    const formState = $state({
        username: '',
        password: '',
        loading: false,
    })


</script>

<svelte:head>
    <title>WellSaid</title>
</svelte:head>

<div class="login-wrap">
    <header class="login-header">
        <h1>WellSaid</h1>
        <p class="tagline">Empathy, upgraded.</p>
    </header>

    <div class="login-card">
        <form
            method="POST"
            use:enhance={() => {
                formState.loading = true
                return async ({ update }) => {
                    await update()
                    formState.loading = false
                }
            }}
        >
            {#if form?.error}
                <div class="error-message">{form.error}</div>
            {:else if page.url.searchParams.get('error') === 'too_many_attempts'}
                <div class="error-message">Too many attempts. Please try again later.</div>
            {/if}

            <div class="form-group">
                <input
                    type="text"
                    name="username"
                    id="username"
                    bind:value={formState.username}
                    required
                    autocomplete="username"
                    placeholder="username"
                />
            </div>

            <div class="form-group">
                <input
                    type="password"
                    name="password"
                    id="password"
                    bind:value={formState.password}
                    required
                    autocomplete="current-password"
                    placeholder="password"
                />
            </div>

            <button type="submit" class="login-button" disabled={formState.loading}>
                {#if formState.loading}
                    <span class="loading-spinner"></span>
                {:else}
                    enter
                {/if}
            </button>
        </form>
    </div>
</div>

<style>
    .login-wrap {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }

    .login-header {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .login-header h1 {
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
        margin: 0.35rem 0 0;
    }

    .login-card {
        background-color: var(--card);
        border: 1px solid var(--border);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow-md);
        padding: 2rem 2rem 1.75rem;
        width: 100%;
        max-width: 340px;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    input {
        width: 100%;
        padding: 0.7rem 0.85rem;
        border: 1px solid var(--border);
        border-radius: var(--border-radius);
        font-family: var(--body-font);
        font-size: 0.975rem;
        color: var(--text);
        background-color: var(--surface);
        box-sizing: border-box;
        transition: border-color 0.15s, box-shadow 0.15s;
    }

    input::placeholder {
        color: var(--text-muted);
        opacity: 0.7;
    }

    input:focus {
        outline: none;
        border-color: var(--accent);
        box-shadow: 0 0 0 2px color-mix(in oklch, var(--accent) 15%, transparent);
    }

    .login-button {
        width: 100%;
        margin-top: 0.5rem;
        padding: 0.7rem;
        background-color: var(--accent);
        color: var(--accent-text);
        border: none;
        border-radius: var(--border-radius);
        font-family: var(--label-font);
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        cursor: pointer;
        transition: opacity 0.2s;
        min-height: var(--min-touch-size);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .login-button:hover:not(:disabled) {
        opacity: 0.88;
    }

    .login-button:disabled {
        background-color: var(--surface);
        color: var(--text-muted);
        cursor: not-allowed;
    }

    .error-message {
        background-color: color-mix(in oklch, var(--error) 10%, transparent);
        color: var(--error);
        padding: 0.65rem 0.85rem;
        border-radius: var(--border-radius);
        margin-bottom: 1rem;
        font-family: var(--label-font);
        font-size: 0.85rem;
        line-height: 1.4;
    }

    .loading-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid color-mix(in oklch, var(--accent-text) 40%, transparent);
        border-radius: 50%;
        border-top-color: var(--accent-text);
        animation: spin 0.8s linear infinite;
    }
</style>
