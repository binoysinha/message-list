const slider = document.querySelector('.slider-container');
// set up our state

let isDragging = false,
    currentTranslate = 0,
    animationID,
    draggedPosWidth = 0,
    shiftX = 0,
    currentTarget;

slider.addEventListener('dragstart', (e) => e.preventDefault())
slider.addEventListener('pointerdown', touchStart)
slider.addEventListener('pointerup', touchEnd)
slider.addEventListener('pointermove', touchMove)
slider.addEventListener('pointerleave', touchEnd)

let thresholdDragWidth = slider.offsetWidth / 2.5;


// make responsive to viewport changes
//window.addEventListener('resize', setPositionByIndex)


function getPositionX(event) {
    return event.clientX
}

function touchStart(event) {
    event.preventDefault();
    currentTarget = event.target.closest('.msg-card');
    if(!currentTarget){
        return;
    }
    isDragging = true
    //animationID = requestAnimationFrame(animation)
    shiftX = event.clientX - currentTarget.getBoundingClientRect().left;
    currentTarget.setPointerCapture(event.pointerId);
}

function touchMove(event) {
    if (!currentTarget && !currentTarget.hasPointerCapture(event.pointerId)) {
        return;
    }

    if (isDragging) {
        draggedPosWidth = event.clientX - shiftX - slider.getBoundingClientRect().left;
        animationID = requestAnimationFrame(animation)
    }
}

function touchEnd(event) {
    cancelAnimationFrame(animationID)
    isDragging = false
    // if moved enough negative then snap to next slide if there is one
    if (draggedPosWidth < -thresholdDragWidth || draggedPosWidth > thresholdDragWidth) {
        currentTarget.remove();
        draggedPosWidth = 0;
    } else {
        draggedPosWidth = 0;
        setSliderPosition();
    }
}

function animation() {
    setSliderPosition()
    if (isDragging) requestAnimationFrame(animation)
}

function setSliderPosition() {
    if (currentTarget) {
        currentTarget.style.transform = `translateX(${draggedPosWidth}px)`
    }

}