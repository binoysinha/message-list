const sidenav = document.querySelector('#sidenav')
const closenav = document.querySelector('#sidenav-close-button')
const opennav = document.querySelector('#sidenav-open-button');
const overlay = document.querySelector('#overlay');

opennav.addEventListener('pointerdown', () => {
    sidenav.classList.add('open');
    overlay.style.display = 'block';
});

closenav.addEventListener('pointerdown', () => {
    sidenav.classList.remove('open');
    overlay.style.display = 'none';
});

// set focus to our open/close buttons after animation
sidenav.addEventListener('transitionend', e => {
    if (e.propertyName !== 'transform') {
        return;
    }

    const isOpen = sidenav.classList.contains('open');

    isOpen
        ?
        closenav.focus() :
        opennav.focus()

});

// close our menu when esc is pressed
document.addEventListener('keyup', e => {
    if (e.code === 'Escape') {
        sidenav.classList.remove('open');
    }
});

overlay.addEventListener('pointerdown', (evt) => {
    if (!evt.target.closest("#sidenav")) {
        sidenav.classList.remove('open');
        overlay.style.display = 'none';
    }
});