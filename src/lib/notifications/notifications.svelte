<script>
import { page } from '$app/stores';
import { onMount, createEventDispatcher } from 'svelte'
import { store } from '$lib/store/store.js'
import { close, bell } from '$lib/assets/icons.js'
import tippy from 'tippy.js';
import { readNotifications } from '$lib/utils/request.js'
import NotificationItem from './notification-item.svelte'

$: newItems = $store?.notifications?.some(n => !n.read);
$: items = $store?.notifications

const dispatch = createEventDispatcher();

let el;
let content;

let menu;

let active = false;

onMount(() => {
    menu = tippy(el, {
        content: content,
        allowHTML: true,
        trigger: 'click',
        interactive: true,
        theme: 'notifications',
        placement: 'top',
        arrow: false,
        duration: 1,
        zIndex: 99999,
        onShown(i) {
            active = true
            dispatch('active', true)
        },
        onHide(i) {
            read()
            active = false
            dispatch('kill', true)
        },
        onClickOutside(i) {
            active = false
            dispatch('kill', true)
        },
    });
})

function kill() {
    menu.hide()
}


async function read() {
    if(!newItems) {
        return
    }
    $store.notifications.forEach(item => {
      item.read = true;
    });
    $store.notifications = $store.notifications;
    const last = $store.notifications[0]?.created_at
    const res = await readNotifications(last);
    console.log(res)
}


function goToPost(e) {
    console.log(e.detail)
    menu.hide()
}

$: none = $store.notifications?.length == 0

</script>

<div class="grd-c pa2 mr1 bell"
    class:ac={active}
    on:click|stopPropagation bind:this={el}>
    <div class="ico-s grd-c">
        {@html bell}
    </div>
    {#if newItems}
        <div class="dot">
        </div>
    {/if}
</div>

<div class="notifications" bind:this={content}>
    <div class="header ph3 pv2 fl">
        <div class="fl-o grd-c">
            <b>Notifications</b>
        </div>
        <div class="c-ico grd-c p23" on:click={kill}>
            {@html close}
        </div>
    </div>

    <div class="content">
        {#if none}
            <div class="grd-c">
                You don't have any notifications.
            </div>
        {/if}

        {#if !none && items}
        <div class="items">
            {#each items as item}
                <NotificationItem 
                    on:go={goToPost}
                    item={item} />
            {/each}
            </div>
        {/if}

    </div>
</div>




<style>

.notifications {
    width: 350px;
    z-index: 901;
    border-radius: 9px;
    background-color: var(--context-menu-bg);
    display: grid;
    grid-template-rows: auto 1fr;
    overflow: hidden;
}

.content {
    display: grid;
    overflow-y: auto;
    max-height: 300px;
    min-height: 200px;
    width: 100%;
}

.bell {
    position: relative;
    opacity: 0.9;
    cursor: pointer;
    border-radius: 7px;
}

.bell:hover {
    background-color: var(--shade-4);
}

.ac {
    background-color: var(--shade-4);
}


[data-tippy-root] {
    max-width: 300px;
}
</style>
