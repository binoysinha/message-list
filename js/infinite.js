const loading = document.querySelector('.loader');
const BUFFER_CARD = 2;
const MILLIS_PER_SECOND = 1000;
const BASE_URL = 'http://message-list.appspot.com';

let limit = MIN_CARD_BEFORE_REFETCH + BUFFER_CARD;
let token = null;
let isAPIFetching = false;


const epochMap = new Map([
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1]
]);

function getDuration(timeAgoInSeconds) {
    for (let [name, seconds] of epochMap) {
        const interval = Math.floor(timeAgoInSeconds / seconds);
        if (interval >= 1) {
            return {
                interval: interval,
                epoch: name
            };
        }
    }
};

function unixTimeAgo(date) {
    const currentTimeStamp = new Date().getTime();
    const messageDate = new Date(date).getTime();
    const timeAgoInSeconds = Math.floor((currentTimeStamp - messageDate) / MILLIS_PER_SECOND);
    const {
        interval,
        epoch
    } = getDuration(timeAgoInSeconds);
    const suffix = interval === 1 ? '' : 's';
    return `${interval} ${epoch}${suffix} ago`;
};

async function getMessages() {
    let url = new URL('/messages', BASE_URL);
    url.searchParams.set('limit', limit);
    if (token) {
        url.searchParams.set('pageToken', token);
    }
    const res = await fetch(url);
    const data = await res.json();
    return data;
}

function getAvatarUrl(photoUrl) {
    return new URL(photoUrl, BASE_URL);
}

function generateDOM(message) {
    const {
        id,
        updated,
        author: {
            photoUrl,
            name
        },
        content
    } = message;
    const messageEl = document.createElement('div');
    messageEl.classList.add('msg-card');
    messageEl.setAttribute('data-message-id', id);
    messageEl.innerHTML = `
        <div class="user-info">
            <img src="${getAvatarUrl(photoUrl)}" alt="${name} photo" loading="lazy">
            <div class="user-details">
                <div class="user-name">${name}</div>
                <time>${unixTimeAgo(updated)}</time>
             </div>
        </div>
        <div class="user-msg truncate">
            <p>${content}</p>
        </div>
    `;
    return messageEl;
}

async function showMessages() {
    const {
        pageToken,
        messages
    } = await getMessages();
    token = pageToken;
    const messageList = [];
    messages.forEach(message => {
        messageList.push(generateDOM(message));
    });
    messagesContainer.append(...messageList);
    isAPIFetching = false;
}

// Show loader & fetch more posts
function showLoading() {
    //loading.classList.add('show');
    setTimeout(() => {
        //loading.classList.remove('show');

        setTimeout(() => {
            page++;
            showMessages();
        }, 300);
    }, 1000);
}


// Show initial posts
showMessages();

window.addEventListener('scroll', () => {
    const {
        scrollTop,
        scrollHeight,
        clientHeight
    } = document.documentElement;
    console.log(scrollTop, scrollHeight, clientHeight);
    if (scrollTop + clientHeight + CARD_HEIGHT*2 >= scrollHeight && !isAPIFetching) {
        //showLoading();
        isAPIFetching = true;
        showMessages();
    }
});
