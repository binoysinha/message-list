(() => {
    'use strict';

    const MILLIS_PER_SECOND = 1000;
    const APPROX_MSG_CARD_HEIGHT = 180;
    const HEADER_HEIGHT = 65;
    const BUFFER_CARD = 3;
    const MIN_HORIZONTAL_DRAG = 30;
    const BASE_URL = 'https://message-list.appspot.com';

    const messagesContainer = document.querySelector('#messages-container');
    const sideNav = document.querySelector('#sidenav');
    const closeNavBtn = document.querySelector('#sidenav-close-button');
    const openNavBtn = document.querySelector('#sidenav-open-button');
    const overlay = document.querySelector('#overlay');
    const loader = document.querySelector('.bouncing-loader');
    const errorElem = document.querySelector('.error-msg');
    const mainContainer = document.querySelector('.container');
    const appHeader = document.querySelector('.app-header');

    let thresholdDragWidth = Math.min(messagesContainer.offsetWidth / 3.5, 200);
    let minCardBeforeRefetch = Math.ceil((window.innerHeight - HEADER_HEIGHT) / APPROX_MSG_CARD_HEIGHT);
    let limit = minCardBeforeRefetch + BUFFER_CARD;

    const state = {
        token: null,
        isDataBeingFetched: false,
        isDragging: false,
        draggedPosWidth: 0,
        shiftX: 0,
        currentTarget: null,
        animationID: null,
    }

    /////////////////////////////////////Utility function section starts///////////////////////////////////////

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

    function throttle(func, limit) {
        let inThrottle
        return function () {
            if (!inThrottle) {
                func();
                inThrottle = true
                setTimeout(() => inThrottle = false, limit)
            }
        }
    }

    /////////////////////////////////////Utility function section ends///////////////////////////////////////

    /////////////////////////////////////Sidenav functionality starts///////////////////////////////////////

    function closeSideNav() {
        sideNav.classList.remove('open');
        overlay.style.display = 'none';
        sideNav.setAttribute('aria-hidden', 'true');
        mainContainer.removeAttribute('aria-hidden');
        appHeader.removeAttribute('aria-hidden');
    }

    openNavBtn.addEventListener('pointerdown', () => {
        sideNav.classList.add('open');
        overlay.style.display = 'block';
        sideNav.removeAttribute('aria-hidden');
        mainContainer.setAttribute('aria-hidden', 'true');
        appHeader.setAttribute('aria-hidden', 'true');
    });

    closeNavBtn.addEventListener('pointerdown', closeSideNav);

    sideNav.addEventListener('transitionend', event => {
        if (event.propertyName !== 'transform') {
            return;
        }
        sideNav.classList.contains('open') ? closeNavBtn.focus() : openNavBtn.focus()
    });

    // close our menu when esc is pressed
    document.addEventListener('keyup', event => {
        if (event.code === 'Escape') {
            closeSideNav();
        }
    });

    overlay.addEventListener('pointerdown', event => {
        if (!event.target.closest("#sidenav")) {
            closeSideNav();
        }
    });

    /////////////////////////////////////Sidenav functionality ends///////////////////////////////////////


    /////////////////////////////////////Swipe to delete functionality starts///////////////////////////////////////

    function reCalculateDimensions() {
        thresholdDragWidth = Math.min(messagesContainer.offsetWidth / 3.5, 200);
        minCardBeforeRefetch = Math.ceil((window.innerHeight - HEADER_HEIGHT) / APPROX_MSG_CARD_HEIGHT);
        limit = minCardBeforeRefetch + BUFFER_CARD;
    }

    window.addEventListener('resize', throttle(reCalculateDimensions, 250));

    function getPositionX(event) {
        return event.clientX;
    }

    function isMinimumDragged() {
        return state.draggedPosWidth > MIN_HORIZONTAL_DRAG || state.draggedPosWidth < -MIN_HORIZONTAL_DRAG;
    }

    function touchStart(event) {
        event.preventDefault();
        state.currentTarget = event.target.closest('.msg-card');
        if (!state.currentTarget) {
            return;
        }
        state.isDragging = true;
        state.shiftX = getPositionX(event) - state.currentTarget.getBoundingClientRect().left;
        state.currentTarget.setPointerCapture(event.pointerId);
    }

    function touchMove(event) {

        if (state.currentTarget && !state.currentTarget.hasPointerCapture(event.pointerId)) {
            return;
        }
        if (state.isDragging) {
            state.draggedPosWidth = getPositionX(event) - state.shiftX - messagesContainer.getBoundingClientRect().left;

            if (isMinimumDragged()) {
                state.currentTarget.style.opacity = 0.4;
                state.animationID = requestAnimationFrame(animation);
            } else {
                return false
            }
        }
    }

    function touchEnd() {
        if (!state.currentTarget) {
            return;
        }
        cancelAnimationFrame(state.animationID);
        state.isDragging = false;

        if (state.draggedPosWidth < -thresholdDragWidth || state.draggedPosWidth > thresholdDragWidth) {
            state.currentTarget.classList.add('remove-card');
            state.draggedPosWidth = 0;
        } else if (isMinimumDragged()) {
            state.draggedPosWidth = 0;
            state.currentTarget.style.opacity = 1;
            setMsgCardPosition();
        }
    }

    function animation() {
        setMsgCardPosition()
        if (state.isDragging) {
            requestAnimationFrame(animation);
        }
    }

    function setMsgCardPosition() {
        if (state.currentTarget) {
            state.currentTarget.style.setProperty('--transform', `${state.draggedPosWidth}px`);
        }
    }

    function deleteCard() {
        state.currentTarget.remove();
        if (document.querySelectorAll('.msg-card').length === minCardBeforeRefetch) {
            showMessages();
        }
    }

    messagesContainer.addEventListener('pointerdown', touchStart);
    messagesContainer.addEventListener('pointerup', touchEnd);
    messagesContainer.addEventListener('pointermove', touchMove);
    messagesContainer.addEventListener('pointerleave', touchEnd);
    messagesContainer.addEventListener('transitionend', deleteCard);

    /////////////////////////////////////Swipe to delete functionality ends///////////////////////////////////////

    /////////////////////////////////////Infinite scroll functionality starts///////////////////////////////////////

    function displayError(message) {
        errorElem.textContent = message;
        errorElem.classList.add('show');
    }

    async function getMessages() {
        errorElem.classList.remove('show');
        loader.classList.add('show-loader');
        loader.removeAttribute('aria-hidden');
        let url = new URL('/messages', BASE_URL);
        url.searchParams.set('limit', limit);
        if (state.token) {
            url.searchParams.set('pageToken', state.token);
        }
        const res = await fetch(url);
        return await res.json();
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
        const messageEl = document.createElement('li');
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
            <p class="user-msg truncate-text">${content}</p>
        `;
        return messageEl;
    }

    async function showMessages() {
        try {
            const {
                pageToken,
                messages
            } = await getMessages();
            state.token = pageToken;
            const messageList = [];
            messages.forEach(message => {
                messageList.push(generateDOM(message));
            });
            messagesContainer.append(...messageList);
        } catch (err) {
            displayError(err);
        } finally {
            loader.classList.remove('show-loader');
            loader.setAttribute('aria-hidden', 'true');
            state.isDataBeingFetched = false;
        }
    }

    function onScroll() {
        const {
            scrollTop,
            scrollHeight,
            clientHeight
        } = document.documentElement;
        if (scrollTop + clientHeight + APPROX_MSG_CARD_HEIGHT * BUFFER_CARD >= scrollHeight && !state.isDataBeingFetched) {
            state.isDataBeingFetched = true;
            showMessages();
        }
    }

    showMessages();
    window.addEventListener('scroll', onScroll, {
        passive: true,
        capture: true
    });

    /////////////////////////////////////Infinite scroll functionality ends///////////////////////////////////////
})();