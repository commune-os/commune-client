<script>
import '/static/css/main.css'
import Signup from '$lib/auth/signup.svelte'
import { goto } from '$app/navigation';
import Health from '$lib/sync/health.svelte'
import { PUBLIC_META_TITLE, PUBLIC_APP_NAME } from '$env/static/public';
import { store } from '$lib/store/store.js'

export let data;

$: if(data?.health) {
    $store.health = data.health
}

$: down = $store.down

function login() {
    goto(`/login`, {
        noscroll: true,
    })
}

function success() {
    goto(`/`)
}

</script>

<svelte:head>
    <title>{PUBLIC_META_TITLE} - Sign Up</title>
</svelte:head>


{#if down}
<section class="down">
    <div class="grd-c">
    {PUBLIC_APP_NAME} is down right now. You will not be able to create an
        account. Try again later.
    </div>
</section>
{/if}

<section class="signup">
    <div class="container grd-c">
        <Signup on:created={success} on:login={login}/>
    </div>
</section>

<Health />

<style>
.signup {
    width: 100%;
    height: 100%;
    display: grid;
}
.container {
    background-color: var(--shade-3);
    padding-top: 2rem;
    border-radius: 9px;
}
@media screen and (max-width: 768px) {
    .container {
        width: 100%;
        height: 100%;
    }
}
</style>
