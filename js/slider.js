const CARD_HEIGHT = 170;
const HEADER_HEIGHT = 60;
const MIN_CARD_BEFORE_REFETCH = Math.ceil((window.innerHeight - HEADER_HEIGHT) / CARD_HEIGHT);
const messagesContainer = document.getElementById('messages-container');

let isDragging = false,
    currentTranslate = 0,
    animationID,
    draggedPosWidth = 0,
    shiftX = 0,
    currentTarget;

messagesContainer.addEventListener('dragstart', (e) => e.preventDefault())
messagesContainer.addEventListener('pointerdown', touchStart)
messagesContainer.addEventListener('pointerup', touchEnd)
messagesContainer.addEventListener('pointermove', touchMove)
messagesContainer.addEventListener('pointerleave', touchEnd)

let thresholdDragWidth = Math.min(messagesContainer.offsetWidth / 3.5, 200);

// make responsive to viewport changes
//window.addEventListener('resize', setPositionByIndex)


function getPositionX(event) {
    return event.clientX
}

function touchStart(event) {
    event.preventDefault();
    currentTarget = event.target.closest('.msg-card');
    if (!currentTarget) {
        return;
    }
    isDragging = true
    //animationID = requestAnimationFrame(animation)
    shiftX = event.clientX - currentTarget.getBoundingClientRect().left;
    currentTarget.setPointerCapture(event.pointerId);
}

function touchMove(event) {
    if (currentTarget && !currentTarget.hasPointerCapture(event.pointerId)) {
        return;
    }

    if (isDragging) {
        draggedPosWidth = event.clientX - shiftX - messagesContainer.getBoundingClientRect().left;
        currentTarget.style.opacity = 0.4;
        animationID = requestAnimationFrame(animation)
    }
}

function touchEnd(event) {
    cancelAnimationFrame(animationID)
    isDragging = false;

    if (draggedPosWidth < -thresholdDragWidth || draggedPosWidth > thresholdDragWidth) {
        currentTarget.remove();
        if (document.querySelectorAll('.msg-card').length === MIN_CARD_BEFORE_REFETCH) {
            showMessages();
        }
        draggedPosWidth = 0;
    } else {
        draggedPosWidth = 0;
        setMsgCardPosition(1);
        currentTarget.style.opacity = 1;
    }
}

function animation() {
    setMsgCardPosition(0.4)
    if (isDragging) requestAnimationFrame(animation)
}

function setMsgCardPosition(val) {
    if (currentTarget) {
        currentTarget.style.setProperty('--transform', `${draggedPosWidth}px`);
    }

}