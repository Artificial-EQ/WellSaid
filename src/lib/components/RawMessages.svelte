<script lang="ts">
    import type { Message } from '$lib/types'

    let { messages = [], expanded = $bindable(false) }: { messages: Message[]; expanded?: boolean } =
        $props()
</script>

<details class="raw-messages-details" bind:open={expanded}>
    <summary>show conversation ({messages.length} messages)</summary>
    <div class="messages-list">
        {#each messages as msg}
            <div class="message-item" class:from-me={msg.sender === 'me'}>
                <span class="sender">{msg.sender}</span>
                <span class="text">{msg.text}</span>
            </div>
        {/each}
    </div>
</details>

<style>
    details.raw-messages-details {
        text-align: left;
        border: 1px solid var(--light);
        background-color: var(--white);
        border-radius: var(--border-radius);
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    details summary {
        cursor: pointer;
        font-weight: 500;
        color: var(--primary-dark);
    }

    .messages-list {
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .message-item {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        max-width: 85%;
    }

    .message-item.from-me {
        align-self: flex-end;
        align-items: flex-end;
    }

    .sender {
        font-size: 0.75rem;
        color: var(--gray);
        font-family: var(--label-font);
    }

    .text {
        font-family: var(--summary-font);
        font-size: 0.9rem;
        line-height: 1.4;
        background-color: var(--light);
        padding: 0.4rem 0.65rem;
        border-radius: var(--border-radius);
        color: var(--primary-dark);
        overflow-wrap: break-word;
    }

    .from-me .text {
        background-color: var(--primary-light);
    }
</style>
