<script>
import { PUBLIC_MEDIA_URL } from '$env/static/public';
import { prev, next, play } from '$lib/assets/icons.js'
import { store } from '$lib/store/store.js'
import { page } from '$app/stores';
import { goto } from '$app/navigation';

$: isDomain = $page.params.domain !== undefined && 
    $page.params.domain !== 'undefined' && 
    $page.params.domain?.length > 0

$: mediaURL = isDomain ? $store?.federated?.media_url : PUBLIC_MEDIA_URL

export let media;
export let isChat;

function getURL(item) {
    return `${mediaURL}/${item?.key}` || ``
}

function getThumbnailURL(item) {
    let key = item?.key || ``
    if(item?.thumbnail?.key) {
        key = item.thumbnail.key
    }
    return `${mediaURL}/${key}` 
}


$: multiple = media?.length > 1

$: selected = media[0]

$: isImage = selected?.type?.startsWith('image')
$: isVideo = selected?.type?.startsWith('video')

let isItemImage = (item) => {
    return item?.type?.startsWith('image')
}

let isItemVideo = (item) => {
    return item?.type?.startsWith('video')
}

function goToPrevious() {
    let index = media.indexOf(selected)
    if(index === 0) {
        selected = media[media.length - 1]
    } else {
        selected = media[index - 1]
    }
}

function goToNext() {
    let index = media.indexOf(selected)
    if(index === media.length - 1) {
        selected = media[0]
    } else {
        selected = media[index + 1]
    }
}

function openImage(index) {
    let url = $page.url.href
    if($page.url.search) {
        url = `${url}&image=${index}`
    } else {
        url = `${url}?image=${index}`
    }
    $store.gallery = {
        active: true,
        items: images,
        index: index || 0
    }
}
function openImageItem() {
    let url = $page.url.href
    if($page.url.search) {
        url = `${url}&image=${images.indexOf(selected) || 0}`
    } else {
        url = `${url}?image=${images.indexOf(selected) || 0}`
    }
    $store.gallery = {
        active: true,
        items: images,
        index: images.indexOf(selected) || 0
    }
}

$: nitems = `items-${media.length}`

$: images = media.filter(i => isItemImage(i))
$: videos = media.filter(i => isItemVideo(i))

$: height = media?.length == 1 ? media[0]?.info?.h > 300 ? 300 : media[0]?.info?.h : 300

$: smallest = images.reduce((smallest, current) => current?.info?.h < (smallest ?
    smallest?.info?.h : Infinity) ? current : smallest, null)?.info?.h

$: cap = images?.length > 1 ? 200 : 300

$: mh = smallest > cap ? cap : smallest

</script>

<div class="container">




{#if isChat}


    <div class="items fl-co mr3 ml3 mt1 mds">
        <div class="nitems"
        style="--columns:{media.length}">

            {#each images as item, i}
                <div class="media-item mb1" class:mr2={images?.length > 1}>
                    <img class="image" class:smg={isChat} 
                        height={mh}
                        on:click={() => openImage(i)}
                    src={getURL(item)} />
                </div>
            {/each}

        </div>

            {#each videos as item, i}
                    <div class="video-item grd-c wch">
                        <video class="" controls>
                          <source src={getURL(item)} type={item?.type}>
                        </video>
                    </div>
            {/each}

    </div>


{:else}

    {#if multiple}

    <div class="thumbnails fl mr2 ml3 mt3">
        {#each media as item, i}
            <div class="item mr3"
            class:selected={selected.key === item.key}
            on:click={() => selected = item}
            style="background: url({getThumbnailURL(item)})">

                {#if isItemVideo(item)}
                    <video class="tvi" width="40" height="40">
                      <source src={getURL(media[0])} autoplay muted>
                    </video>
                    <div class="vid grd">
                        <div class="ico-s grd-c">
                            {@html play}
                        </div>
                    </div>
                {/if}


            </div>
        {/each}

        <div class="fl-o"></div>
        <div class="cycle">
            <div class="c-ico prev grd-c pa1" on:click={goToPrevious}>
                {@html prev}
            </div>
            <div class="c-ico next grd-c pa1" on:click={goToNext}>
                {@html next}
            </div>
        </div>
    </div>
    {/if}

        <div class="pa3 con grd" class:sch={isChat}> 
        {#if isImage}
            <img class="image" class:smg={isChat} 
            on:click={openImageItem}
            width={selected?.info?.w}
            height={selected?.info?.h}
            src={getURL(selected)} 
            loading="lazy"/>
        {/if}

        {#if isVideo}
            <div class="video-item grd-c">
                <video height="500" class="" controls>
                  <source src={getURL(selected)} type={selected?.type}>
                </video>
            </div>
        {/if}
    </div>

{/if}

</div>

<style>
.item {
    height: 40px;
    width: 40px;
    border-radius: 2px;
    background-repeat: no-repeat !important;
    background-size: cover !important;
    background-position: center !important;
    cursor: pointer;
    opacity: 0.9;
    transition: 0.1s;
    position: relative;
}

.item:hover {
    opacity: 0.9;
    outline: 3px solid var(--primary);
}

.selected {
    outline: 3px solid var(--primary);
    opacity: 1;
}
.cycle {
    display: grid;
    grid-template-columns: auto auto;
    grid-column-gap: 0.5rem;
}

.container {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
img {
    border-radius: 9px;
}

video {
    max-height: 500px;
    width: 100%;
}

.wch {
    width: 500px;
}

.tvi {
    background-color: var(--shade-2);
}
.vid {
    position: absolute;
    right: 0.25rem;
    bottom: 0.25rem;
    background-color: var(--bg);
    border-radius: 6px;
}

.ico-s {
    fill: var(--primary);
    opacity: 1;
}

.image{
    cursor: pointer;
}

.sch {
    margin-left: calc(30px + 1rem);
}
.mds {
    margin-left: calc(30px + 2rem);
}

.items {
    display: grid;
    justify-content: start;
}

.nitems {
    display: flex;
    flex-wrap: wrap;
    max-width: 500px;
}

.media-item img {
}

video {
    max-height: 300px;
}

@media screen and (max-width: 768px) {
}

</style>
