<script>
import { PUBLIC_MEDIA_URL } from '$env/static/public'
import { formatFileSize, downloadFile } from '$lib/utils/utils.js'
import { download as downloadicon } from '$lib/assets/icons.js'
import AudioItem from './audio-item.svelte'

export let files;
export let isChat = false;

function size(file) {
    return formatFileSize(file.size)
}

function download(file) {
    downloadFile(`${PUBLIC_MEDIA_URL}/${file.key}`, file.name)
}

let isAudio = (item) => {
    return item?.type?.startsWith('audio')
}

</script>

<div class="files mh3" class:ch={isChat}>
    {#each files as file}

        {#if isAudio(file)}
            <AudioItem item={file} />
        {:else}

            <div class="file-item mt2 mb2 fl" on:click={download(file)}>
                <div class="fl-co mr3">
                    <div class="name">
                        {file.name}
                    </div>
                    <div class="fl">
                        <div class="size grd-c">
                            {file.type}
                        </div>
                        <div class="ml1 size grd-c">
                            - {size(file)}
                        </div>
                    </div>
                </div>
                <div class="ico-s grd-c fic do mr2">
                    {@html downloadicon}
                </div>
            </div>

        {/if}
    {/each}
</div>

<style>
.files {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}
.file-item {
    background-color: var(--shade-3);
    border-radius: 5px;
    padding: 0.25rem 0.5rem;
    display: grid;
    grid-template-columns: 1fr auto;
    cursor: pointer;
    min-width: 300px;
}
.file-item:hover {
    background-color: var(--shade-4);
}


.file-item:hover .do {
}

.file-item:hover .name {
}

.fic {
    width: 14px;
    height: 14px;
}

.name {
    max-width: 400px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    word-break: break-word;
    font-size: 13px;
}
.size {
    font-size: 11px;
    font-weight: 500;
    color: var(--text-light);
}
.ch {
    margin-left: calc(30px + 2rem);
}
</style>
