<script>
import { PUBLIC_BASE_URL, PUBLIC_MEDIA_URL, PUBLIC_MATRIX_SERVER_NAME } from '$env/static/public';
import { getHomeserver, isSafari, getReplyCount } from '$lib/utils/utils.js'
import { browser } from '$app/environment';
import { getAPIEndpoint, savePost } from '$lib/utils/request.js'
import { dayOfMonth, formatTS } from '$lib/utils/time.js'
import { onMount, createEventDispatcher } from 'svelte'
import { store } from '$lib/store/store.js'
import { page } from '$app/stores';
import MediaItems from '$lib/board/event/attachments/media-items.svelte'
import FileItems from '$lib/board/event/attachments/file-items.svelte'
import Reactions from '$lib/board/event/reactions/reactions.svelte'
import Replies from '$lib/board/event/replies/replies.svelte'
import User from '$lib/board/event/user/user.svelte'
import Date from '$lib/board/event/date/date.svelte'
import Time from '$lib/board/event/date/time.svelte'
import Edited from '$lib/board/event/edited/edited.svelte'
import Tools from '$lib/board/event/tools/tools.svelte'
import Links from '$lib/board/event/links/links.svelte'
import RoomAlias from '$lib/board/event/room-alias/room-alias.svelte'
import MatrixMedia from '$lib/chat/event/media/media.svelte'
import ReplySummary from '$lib/board/event/reply/reply-summary.svelte'
import EventThreadSummary from '$lib/chat/event/thread/thread-summary.svelte'
import BoardPost from '$lib/chat/event/board-post/board-post.svelte'
import GIFEvent from '$lib/chat/event/gif/gif.svelte'

import emojiRegex from 'emoji-regex';

import { pin, hash } from '$lib/assets/icons.js'

import Composer from '$lib/composer/composer.svelte'

const dispatch = createEventDispatcher()

export let isChat = false;
export let messages = null;
export let index = null;
export let isPost = false;
export let isReply = false;
export let showAlias = true;
export let interactive = true;
export let search = false;

export let isBoardPostInChat = false;

export let postEventID = null;

export let isPostAuthor = false;;


export let event;
export let sender;

export let depth = 0;

export let nested = false;

$: isDomain = $page.params.domain !== undefined && 
    $page.params.domain !== 'undefined' && 
    $page.params.domain?.length > 0

$: isSpace = $page.params.space !== undefined && $page.params.space !== null &&
    $page.params.space !== ''

$: isRoom = $page.params.room !== undefined && $page.params.room !== null &&
    $page.params.room !== ''

$: isTopic = $page.params.topic !== undefined && $page.params.topic !== null &&
    $page.params.topic !== ''

let el;

$: uploaded = event?.content?.attachments ?
    event?.content?.attachments?.every(item => $store.attachments[item.id]?.key != null) : true

$: total = event?.content?.attachments?.length * 100
$: progress = (event.unsent && event?.content?.attachments) ?
    event?.content?.attachments?.reduce((sum, item) => sum + $store.attachments[item.id]?.progress, 0) : 0

$: percent = progress ? (progress / total * 100) : 0

$: if(event?.unsent && uploaded) {
    save()
}

async function save() {
    if(event.content.attachments) {
        event.content.attachments.forEach(item => {
            item.key = $store.attachments[item.id]?.key
            delete item.id;
        })
    }
    const res = await savePost(event)
    if(res?.success) {
        dispatch('saved', { event: res?.event, transaction_id: res?.txn_id })
    }
}

let st;
function animate(ts) {
    if (!st) {
      st = ts;
    }
    const et = ts - st;
    if (et < 1000) { 
        el.scrollIntoView({ block: "center" });
      requestAnimationFrame(animate);
    }
}

onMount(() => {

    if (context && isChat) {
        if(el) {
            el.scrollIntoView({ block: "center" });
            //requestAnimationFrame(animate);
        }
    }

    if (event?.just_posted || (context && !isChat) || isReplyEvent) {
        if(el) {
            el.scrollIntoView({ behavior: "smooth" });
        }
    }
    if(hasFullBody && (isPost || isReply)) {
        loadFullBody()
    }
})


$: topic = $page.params.topic

$: isDomain = $page.params.domain !== undefined && 
    $page.params.domain !== 'undefined' && 
    $page.params.domain?.length > 0



function getFirstParagraphNode(content) {
    if(browser) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const firstParagraphNode = tempDiv.querySelector('p');
        return firstParagraphNode?.innerHTML || null;
    } else {
        return null
    }
}


$: safari = isSafari()


$: edited = event?.content?.['m.new_content']?.body !== undefined &&
        event?.content?.['m.new_content']?.title !== undefined

const stripMX = /<mx-reply>.*?<\/mx-reply>/gs;

$: repstr = event?.content?.formatted_body?.replace(stripMX, '')

$: has_reply = event?.content?.['m.relates_to']?.['m.in_reply_to']?.event_id !== undefined
$: fm = has_reply ? repstr : event?.content?.formatted_body

$: body = fm ? fm : event?.content?.body ? event?.content?.body : null

$: raw_content = hasFullBody && full_body ? full_body :
    hasFullBody && !full_body ? `${body}...` : body

$: formatted_body = raw_content ? raw_content : null

$: content = formatted_body ? formatted_body :
    event?.content?.body


$: clipped = getFirstParagraphNode(content) ? getFirstParagraphNode(content) :
    content

$: shortened = content?.length > 600 ? `${content?.substring(0, 600)}...` :
    content

$: hasFullBody = event?.content?.full_body?.rendered_key?.length > 0

$: mediaURL = federated && federated_media_url ? federated_media_url :
!federated ? PUBLIC_MEDIA_URL : null

$: if(federated && isPost) {
    fetchAPIEndpoint()
}

let federated_media_url;
async function fetchAPIEndpoint() {
    let homeserver = getHomeserver(event?.room_id)
    const endpoint = await getAPIEndpoint(homeserver)
    if(endpoint?.media_url) {
        federated_media_url = endpoint.media_url
    }
}

$: fullBodyURL = `${mediaURL}/${event?.content?.full_body?.rendered_key}`
$: federated = !event?.room_id?.includes(PUBLIC_MATRIX_SERVER_NAME)

let full_body;
$: full_body_content = full_body ? full_body : content + '...'
let fetch_error;

$: if(hasFullBody && isPost) {
    /*
    fetch(fullBodyURL)
        .then(response => response.text())
        .then(data => {
            full_body = data
        })
        .catch((error) => {
            fetch_error = error
        });
    */
}

let full_body_fetched = false;
let fetchingMore = false;
$: remaining = event?.content?.full_body?.words

function loadFullBody() {
    fetchingMore = true;
    fetch(fullBodyURL)
        .then(response => response.text())
        .then(data => {
            full_body = data
            full_body_fetched = true;
        })
        .catch((error) => {
            fetch_error = error
        });
}


$: title = event?.content?.title ? event?.content?.title : `Untitled`

$: attachments = event?.content?.attachments
$: hasAttachments = event?.content?.attachments?.length > 0
$: links = event?.content?.links
$: hasLinks = event?.content?.links?.length > 0

$: media = attachments?.filter(a => a?.type?.startsWith('image') ||
a?.type?.startsWith('video'))
$: firstIsMedia = attachments?.[0]?.type?.startsWith('image') ||
    attachments?.[0]?.type?.startsWith('video')

$: files = attachments?.filter(a => !a?.type?.startsWith('image') &&
!a?.type?.startsWith('video'))


$: highlight = $page.params.post === event?.slug && !isPost && !isChat

$: context = $page.url?.searchParams?.get('context')?.length > 0 &&
    ($page.url?.searchParams?.get('context') == event?.slug ||
    $page.url?.searchParams?.get('context') == event?.event_id)

$: user = {
    avatar_url: event?.sender?.avatar_url,
    display_name: event?.sender?.display_name,
    id: event?.sender?.id,
    username: event?.sender?.username
}

let toolsActive = false;

function activateTools() {
    toolsActive = true
}
function killTools() {
    toolsActive = false
    displayTools = false
}

let displayTools = false;

function showTools() {
    displayTools = true
}

function hideTools() {
    if(toolsActive) {
        return
    }
    displayTools = false
}

let emp = false;
$: if($store.emojiPicker.active && toolsActive) {
    emp = true
}

$: if(!$store.emojiPicker.active) {
    killTools()
    emp = false
}


function replyToEvent() {
    dispatch('replyTo', event)
}

$: hasReplies = event?.children?.length > 0

$: op = sender == user?.id

$: replyParam = $page.params.reply !== undefined && $page.params.reply !== null && $page.params.reply !== ''
$: isReplyEvent = replyParam && $page.params?.reply === event?.slug


$: isSingleReply = $page.params.reply !== undefined && $page.params.reply !== null && $page.params.reply !== ''

$: sender_id = $store.credentials?.matrix_user_id

function justIMG(e) {
    if(browser) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(e?.content?.formatted_body, 'text/html');
        const imgTags = doc.getElementsByTagName('img');
        return imgTags.length === 1 && 
            doc.documentElement.textContent.trim() === '';
    } else {
        return false
    }
}

$: isSingleCustomEmoji = justIMG(event)


let reactions;

function reactToKey(e) {
    reactions.process(e.detail)
    dispatch('reacted', e.detail)
}

function addTag(e) {
    reactions.process(e.detail)
}

export function addNewReaction(e) {
    console.log("adding new reaction", e)
}

$: showRoomAlias = !isSpace && !isRoom && !isReply && !isTopic && !isPost



$: isAuthor = sender_id === event?.sender?.id

let editing = false;
function editEvent() {
    editing = true
}
function stopEditing() {
    setTimeout(() => {
        editing = false
    }, 10)
}
function finishedEditing(e) {
    event.content.title = e.detail.content.title
    event.content.body = e.detail.content.body
    event.content.formatted_body = e.detail.content.formatted_body

    event.edited_on = 1

    editing = false

    if(isPost) {
        dispatch('edited', event)
    }
}


function print(e) {
    e.preventDefault()
    console.log(event)
}

function emojiOnly(body) {
    if(!body) {
        return false
    }
    const emojiMatcher = emojiRegex();
    const matches = body.match(emojiMatcher);
    const alp = /[\p{L}\p{N}]+/u;

    let hasEmoji = matches !== null && matches.length > 0
    let hasText = alp.test(body) === true
    return !hasText && hasEmoji
}

$: isEmojiOnly= emojiOnly(event?.content?.body)


$: wasEdited = event?.edited_on !== undefined && event?.edited_on !== null &&
    event?.edited_on > 0

let showingReplies = true
function toggleReplies() {
    showingReplies = !showingReplies
}

$: replies = getReplyCount(event)


$: hasTopic = event?.content?.topic !== undefined && event?.content?.topic !==
    null && event?.content?.topic !== ''

$: showTopic = hasTopic && !isTopic && !isChat


$: replyPinned = isReply && event?.reactions?.filter(r => r.key === 'pinned').length > 0

$: state = $store?.states[$page?.params?.space]
$: bannedFromSpace = state?.banned === true


$: showMediaThumbnail = !isPost && !isReply && hasAttachments && firstIsMedia && !editing && !search

$: showLinkThumbnail = !isPost && !isReply && hasLinks && !editing && !search

let dragging = false;

function dragStart(e) {
    if(!isSpace) {
        e.preventDefault()
        return
    }
    $store.draggable = 'post'
    dragging = true;
    e.dataTransfer.setData('text/plain', JSON.stringify(event));

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(new Image(), 0, 0);
}

function dragEnd() {
    dragging = false;
    $store.draggable = null
}

$: moveActive = $store.movingPost == event?.event_id

function togglePin() {
    event.pinned = !event.pinned
}


$: diff = (isChat && messages) ?
    (event.origin_server_ts - messages[index -1]?.origin_server_ts) / 1000: 0

$: previousDay = messages && messages[index-1]?.origin_server_ts
    ? dayOfMonth(messages[index-1]?.origin_server_ts): 0

$: isNewDay = dayOfMonth(event?.origin_server_ts) > previousDay

//$: showSender = diff > 400

$: differentSender = isChat && messages && messages[index-1]?.sender?.id !== event?.sender?.id

$: showSender = isChat && messages && messages[index-1]?.type == 'm.room.message' ?
    (diff > 400 || differentSender || has_reply): true


$: isSocial = event?.room_alias?.startsWith('@')


$: isMatrixMedia = event?.content?.msgtype == 'm.image' ||
    event?.content?.msgtype == 'm.video' ||
    event?.content?.msgtype == 'm.audio' ||
    event?.content?.msgtype == 'm.file'

$: redacted = event?.content?.redacted


function findURLs(text) {
    if (!text) return [];
    const urlRegex = /(?:https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi;
    const allUrls = text.match(urlRegex) || [];
    return allUrls.filter(url => new URL(url).origin === PUBLIC_BASE_URL);
}

$: urls = findURLs(event?.content?.body)

$: isIMG = event?.content?.msgtype == 'm.image' ||
    event?.content?.msgtype == 'm.images'

$: formattedTS = formatTS(event?.origin_server_ts)


$: isGIF = event?.content?.msgtype == 'gif' &&
    event?.content?.gif != undefined

</script>

{#if isNewDay}
<div class="new-day mv1 mv3">
    <div class="rule">
    </div>
    <div class="day">
        {formattedTS}
    </div>
    <div class="rule">
    </div>
</div>
{/if}


<div class="event chat" 
    bind:this={el}
    on:dragstart={dragStart}
    on:dragend={dragEnd}
    class:dragging={dragging}
    on:contextmenu={print}
    on:mouseover={showTools}
    on:mouseleave={hideTools}
    class:ma={toolsActive && !isBoardPostInChat}
    class:fresh={event?.just_posted}
    class:isrep={isReplyEvent}
    class:context={context}
    id={`event-${event.event_id}`}
    class:highlight={highlight || !interactive} role="button">

    {#if isChat && context}
        <div class="pbar">
        </div>
        <div class="perma">
            Permalink
        </div>
    {/if}

    <div class="ev-c fl-co chm"
    class:shs={isChat && showSender}
    class:ovy={!interactive}>

    {#if has_reply && interactive}
        <ReplySummary {event} on:focus-reply/>
    {/if}

        <div class="sender ph3 fl" 
            class:snm={isChat && showSender}
            class:hide={isChat && !showSender}>
            <User isChat={isChat} hideAvatar={false} user={user} op={op}/>
            {#if isBoardPostInChat}
                <div class="grd-c ml2 dis">
                started a discussion
                </div>
            {/if}
            <div class="grd-c ph1"></div>
            <Date date={event?.origin_server_ts} />
            {#if wasEdited}
                <Edited date={event?.edited_on} />
            {/if}
            {#if showRoomAlias}
                <RoomAlias {event}/>
            {/if}
            {#if showTopic}
                <div class="ico-s sn grd-c ml2">
                    {@html hash}
                </div>
                <div class="grd-c ">
                    <a href={`/${event.room_alias}/topic/${event.content.topic}`}>{event.content.topic}</a>
                </div>

            {/if}
        </div>


        <div class="body" class:nonin={!interactive}
            class:semj={isSingleCustomEmoji}
            class:ch={isChat && !isBoardPostInChat && !redacted && !context}>

            {#if editing && interactive}

                <Composer 
                    editing={true}
                    isChat={isChat}
                    roomID={event.room_id}
                    room_alias={event?.room_alias}
                    editingEvent={event} 
                    editingReply={isReply}
                    on:saved={finishedEditing}
                    on:kill={stopEditing}/>

            {:else if isMatrixMedia && !attachments}
                <MatrixMedia {event}/>
            {:else if isGIF}
                <GIFEvent {event}/>
            {:else if !isIMG}

                {#if isChat && isBoardPostInChat}
                    <BoardPost event={event} />
                {:else if isChat && !isBoardPostInChat}
                    <div class="chat-message">
                        <div class="chti">
                            {#if !redacted && !showSender}
                            <Time date={event?.origin_server_ts} />
                            {/if}
                        </div>
                        <div class="chp grd post-body pr3 pci"
                        class:just-emoji={isEmojiOnly}
                        class:unsent={event?.unsent}>
                            {#if redacted}
                                <span class="del lgh">Message deleted</span>
                            {:else}
                                <span class="msgc">
                                {@html content}
                                {#if wasEdited}
                                    <span class="edited lgh">(edited)</span>
                                {/if}
                                </span>
                            {/if}
                        </div>
                    </div>
                {/if}

            {/if}


            {#if event?.unsent && !uploaded && isChat}
                <div class="uploading fl-co pa2">
                    <div class="">
                        Uploading...
                    </div>
                    <div class="">
                        <progress  value={percent} max="100"></progress>
                    </div>
                </div>

            {:else}

                {#if !isBoardPostInChat && (isPost || isReply || isChat) && hasAttachments && media?.length > 0}

                    <MediaItems media={media} isChat={isChat} />
                {/if}

                {#if !isBoardPostInChat && (isPost || isReply || isChat) && hasAttachments && files?.length > 0}
                    <FileItems files={files} isChat={isChat} />
                {/if}

            {/if}



            {#if !isBoardPostInChat && (isPost || isReply || isChat) && hasLinks}
                <Links event={event} isChat={isChat} />
            {/if}



            <div class="rec-a fl ph3 pb1" 
                class:pb2={isChat && (event?.reply_count > 0 ||
                    event.reactions?.length > 0)}
                class:rch={isChat}>

                {#if !isReply && interactive && !(isChat && !isBoardPostInChat)}
                    {#if isBoardPostInChat}
                        {#if event?.reply_count > 0}
                            <Replies count={event?.reply_count} />
                        {/if}
                    {:else}
                        <Replies count={event?.reply_count} />
                    {/if}
                {/if}


                {#if interactive}
                    <Reactions 
                        postEventID={postEventID}
                        on:update-reactions
                        bind:this={reactions}
                        on:react={reactToKey}
                        event={event} 
                        isReply={isReply}
                        on:active={activateTools} 
                    hovered={displayTools}/>
                {/if}

                <div class="fl-o"></div>

            </div>


        </div>




    </div>


        {#if !safari && displayTools && !editing && interactive &&
            !bannedFromSpace && !dragging && !redacted && !event?.unsent}
        <div class="tools" 
            class:chto={isChat && !showSender}
            class:asi={event?.pinned || replyPinned}>
                <Tools 
                    isBoardPostInChat={isBoardPostInChat}
                    isReply={isReply} 
                    isPost={isPost}
                    isChat={isChat}
                    on:reply={replyToEvent}
                    active={toolsActive}
                    isAuthor={isAuthor}
                    isPostAuthor={isPostAuthor}
                    nested={nested}
                    on:edit={editEvent}
                    on:toggle-pin={togglePin}
                    on:pin
                    on:redact
                    on:reference
                    on:set-reply-thread
                    on:react={reactToKey}
                    on:add-tag={addTag}
                    on:active={activateTools} 
                    on:kill={killTools} 
                    event={event} />
            </div>
        {/if}


    {#if event.pinned || replyPinned}
        <div class="pin ico-s">
            {@html pin}
        </div>
    {/if}

</div>

{#if urls}
{/if}

{#if isChat && event?.last_thread_reply}
    <EventThreadSummary event={event} />
{/if}


<style>
.event {
    display: grid;
    grid-template-columns: auto;
    grid-template-rows: auto;
    padding-bottom: 0.5rem;
    padding-top: 0.5rem;
    position: relative;
    word-break: break-word;
    position: relative;
}

.event:hover .tools {
    opacity: 1;
}

.chat {
    padding-top: 0;
    padding-bottom: 0;
}

.shs {
    padding-top: 0.5rem;
}

.ev-c {
    overflow: hidden;
}

.ovy {
    overflow-y: auto;
    max-height: 140px;
}

.h {
    cursor: pointer;
}

.h:hover {
    background-color: var(--event-bg-hover);
}

.ch:hover {
    background-color: var(--event-bg-hover);
}

.ma {
    background-color: var(--event-bg-hover);
}

.highlight {
    background-color: var(--event-highlight);
}

.context {
    background-color: var(--shade-3);
}

.context:hover {
    background-color: var(--shade-3);
}


.tools {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
}

.chto {
    top: -1.75rem;
}

.asi {
    right: 2.75rem;
}

.body {
    line-height: 1.5;
    user-select: text;

}

.nonin {
    overflow-y: auto;
}


.post-title {
    font-weight: 500;
}

.post-body {
    font-weight: 400;
}

div :global(.post-body p img){
    height: 20px;
    width: 20px;
    object-fit: contain;
    vertical-align: text-bottom;
}

div :global(.post-body blockquote){
    margin-bottom: 0.25rem;
}


div :global(.body .emoji){
    height: 20px;
    width: 20px;
    object-fit: contain;
    vertical-align: text-bottom;
}

div :global(.semj .emoji){
    height: 30px;
    width: 30px;
    object-fit: contain;
    vertical-align: text-bottom;
}

.fresh {
    animation-name: fadeOut;
    animation-duration: 6s;
}

:global(p) {
}

:global(p:first-of-type){
    margin-block-start: 0;
}

:global(p:last-of-type){
    margin-block-end: 0;
}

.expand {
    font-weight: 500;
    font-size: small;
    cursor: pointer;
    opacity: 0.5;
    transition: 0.1s;
}
.expand:hover {
    opacity: 1;
}

.pin {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    fill: var(--primary);
    height: 18px;
    width: 18px;
}

.sender {
    margin-bottom: 0.5rem;
    font-size: small;
}

.snm {
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
}

.sn {
    height: 12px;
    width: 12px;
}

.pti {
    font-size: 16px;
}

.pci {
    font-size: 15px;
}

@keyframes fadeOut {
  from {
    background-color: var(--just-posted-bg);
  }
  to {
    background-color: var(--bg);
  }
}


@media screen and (max-width: 768px) {
    .nch {
        padding-bottom: 0.5rem;
        padding-top: 0.5rem;
    }
    .sender {
        margin-bottom: 0.25rem;
        font-size: 12px;
    }

    .clipped {
        margin-bottom: 0.25rem;
        font-size: 13px;
    }

    .post-body {
    }
}
.dragging {
    cursor: grabbing;
}

.pbar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-left: 4px solid var(--primary);
}

.perma {
    position: absolute;
    top: -10px;
    right: 0.25rem;
    cursor: pointer;
    z-index: 100;
    font-weight: 500;
    font-size: small;
    color: white;
    background: var(--primary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
}

.hide {
     display: none;
}

.chat-message {
    position: relative;
    display: grid;
    grid-template-columns: calc(30px + 2rem) 1fr;
    padding-top: 0.1rem;
    padding-bottom: 0.1rem;
}

.event:hover .chm {
    background-color: var(--event-bg-hover);
}

.chti {
    display: grid;
    opacity: 0;
}

.chat-message:hover .chti {
    opacity: 1;
}

.unsent {
    opacity: 0.2;
}
.rch {
    margin-left: 3rem;
}

.msgc {
    max-width: 95%;
}

div :global(.msgc p) {
    display: inline;
}


div :global(.chp img) {
    max-width: 400px;
}

div :global(.chp pre) {
    margin-top: 0.5rem;
    padding-left: 1rem;
    max-width: 700px;
    max-height: 500px;
    overflow-x: auto;
    overflow-y: auto;
}
.lgh {
    color: var(--text-light);
}

.just-emoji {
    font-size: 2rem;
}
.dis {
    color: var(--text-light);
}
.edited {
    font-size: 12px;
}
.uploading {
    background-color: var(--shade-3);
    margin-left: calc(30px + 2rem);
    max-width: 400px;
    border-radius: 5px;
}
.new-day {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
}

.day {
    font-size: small;
    font-weight: 500;
    color: var(--text-light);
}
.rule {
    height: 1px;
    background-color: var(--shade-4);
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
}
</style>
