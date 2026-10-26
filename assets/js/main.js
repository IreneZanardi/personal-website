/* irenezanardi.com — site interactions */
document.addEventListener('DOMContentLoaded', function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initCustomCursor();
  initMobileMenu();
  document.querySelectorAll('[data-poster-gallery]').forEach(initPosterGallery);
  document.querySelectorAll('[data-lightbox]').forEach(initLightboxGroup);

  if (document.body.classList.contains('home')) {
    initScrollGradient();
    if (!reduceMotion) {
      document.querySelectorAll('.carousel__track').forEach(initCarousel);
    }
  }

  /* ---------- Custom round cursor (mouse devices only) ---------- */
  function initCustomCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursor);
    document.body.classList.add('has-custom-cursor');

    document.addEventListener('mousemove', function (e) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      cursor.classList.add('is-visible');
    });
    document.addEventListener('mouseleave', function () {
      cursor.classList.remove('is-visible');
    });

    // Delegated, so it also works for elements created later (gallery, viewer)
    document.addEventListener('mouseover', function (e) {
      cursor.classList.toggle('clickable', !!e.target.closest('a, button, [role="button"]'));
    });
  }

  /* ---------- Hamburger menu on small screens ---------- */
  function initMobileMenu() {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    const openBtn = nav.querySelector('.nav__open');
    const closeBtn = nav.querySelector('.nav__close');

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      openBtn.setAttribute('aria-expanded', String(open));
      (open ? closeBtn : openBtn).focus();
    }

    openBtn.addEventListener('click', function () { setOpen(true); });
    closeBtn.addEventListener('click', function () { setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ---------- Home: background fades to lilac as you scroll ---------- */
  function initScrollGradient() {
    const color1 = '#f9f9f9';
    const color2 = '#e59eff';

    function update() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const factor = maxScroll > 0 ? Math.min(window.scrollY / maxScroll, 1) : 0;
      const mid = interpolateColor(color1, color2, factor);
      document.body.style.background = 'linear-gradient(to bottom, ' + color1 + ', ' + mid + ', ' + color1 + ')';
    }

    function interpolateColor(a, b, t) {
      const ca = a.slice(1).match(/.{2}/g).map(function (h) { return parseInt(h, 16); });
      const cb = b.slice(1).match(/.{2}/g).map(function (h) { return parseInt(h, 16); });
      return '#' + ca.map(function (v, i) {
        return ('0' + Math.round(v + (cb[i] - v) * t).toString(16)).slice(-2);
      }).join('');
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- Home: two photo rows sliding in opposite directions ----------
     Every 2 seconds the row moves by one photo. The photos are duplicated so
     the loop is seamless: when the copy reaches the start we jump back
     without animation. */
  function initCarousel(track) {
    const interval = 2000;
    const reverse = track.dataset.direction === 'backward';
    const count = track.children.length;

    Array.from(track.children).forEach(function (slide) {
      const copy = slide.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });

    let index = reverse ? count : 0;

    function step() {
      const slide = track.children[0];
      return slide.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
    }

    function place(animate) {
      track.style.transition = animate ? '' : 'none';
      track.style.transform = 'translateX(' + (-index * step()) + 'px)';
    }

    place(false);

    track.addEventListener('transitionend', function () {
      if (!reverse && index >= count) { index = 0; place(false); }
      if (reverse && index <= 0) { index = count; place(false); }
    });

    window.addEventListener('resize', function () { place(false); });

    setInterval(function () {
      if (document.hidden) return;
      index += reverse ? -1 : 1;
      place(true);
    }, interval);
  }

  /* ---------- Swipe left/right on touch screens ---------- */
  function onSwipe(el, callback) {
    let startX = null;
    let startY = null;
    el.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      startX = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) callback(dx < 0 ? 1 : -1);
    });
  }

  /* ---------- Full-screen image viewer (shared by posters and toolkits) ---------- */
  let lightbox = null;

  function getLightbox() {
    if (lightbox) return lightbox;

    const icon = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    const dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-label', 'Image viewer');
    dialog.innerHTML =
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Close">' + icon('M5 5l14 14M19 5L5 19') + '</button>' +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous image">' + icon('M15 4l-8 8 8 8') + '</button>' +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Next image">' + icon('M9 4l8 8-8 8') + '</button>' +
      '<figure class="lightbox__figure"><img alt=""><figcaption class="lightbox__caption"></figcaption></figure>';
    document.body.appendChild(dialog);

    const img = dialog.querySelector('img');
    const caption = dialog.querySelector('figcaption');
    const prevBtn = dialog.querySelector('.lightbox__prev');
    const nextBtn = dialog.querySelector('.lightbox__next');
    let items = [];
    let index = 0;
    let onChange = null;

    function render() {
      const item = items[index];
      img.src = item.src;
      img.alt = item.alt || '';
      caption.textContent = item.caption || '';
      caption.hidden = !item.caption;
      prevBtn.hidden = nextBtn.hidden = items.length < 2;
    }

    function go(step) {
      if (items.length < 2) return;
      index = (index + step + items.length) % items.length;
      render();
      if (onChange) onChange(index);
    }

    dialog.querySelector('.lightbox__close').addEventListener('click', function () { dialog.close(); });
    prevBtn.addEventListener('click', function () { go(-1); });
    nextBtn.addEventListener('click', function () { go(1); });
    // Clicking the dark area around the image closes the viewer
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog || e.target.classList.contains('lightbox__figure')) dialog.close();
    });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });
    onSwipe(dialog, go);

    // The custom cursor must live inside the dialog to be drawn above it
    dialog.addEventListener('close', function () {
      document.body.classList.remove('lightbox-open');
      const cursor = dialog.querySelector('.custom-cursor');
      if (cursor) document.body.appendChild(cursor);
    });

    lightbox = {
      open: function (list, start, changeCallback) {
        items = list;
        index = start;
        onChange = changeCallback || null;
        render();
        const cursor = document.querySelector('.custom-cursor');
        if (cursor) dialog.appendChild(cursor);
        document.body.classList.add('lightbox-open');
        dialog.showModal();
      }
    };
    return lightbox;
  }

  /* Any [data-lightbox] container: its links open their images in the viewer */
  function initLightboxGroup(group) {
    const links = Array.from(group.querySelectorAll('a[href]'));
    const items = links.map(function (a) {
      const thumb = a.querySelector('img');
      return { src: a.href, alt: thumb ? thumb.alt : '' };
    });
    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        getLightbox().open(items, i);
      });
    });
  }

  /* ---------- Posters: thumbnails + previous/current/next + caption ----------
     Built from the <li class="poster"> list in the HTML. */
  function initPosterGallery(gallery) {
    const posters = Array.from(gallery.querySelectorAll('.poster')).map(function (li) {
      const img = li.querySelector('img');
      return {
        src: img.getAttribute('src'),
        thumb: li.dataset.thumb || img.getAttribute('src'),
        full: li.dataset.full || img.getAttribute('src'),
        alt: img.alt,
        caption: li.querySelector('.poster__caption')
      };
    });
    const count = posters.length;
    if (!count) return;

    // Build the gallery markup
    const thumbs = document.createElement('div');
    thumbs.className = 'pg-thumbs';
    thumbs.setAttribute('aria-label', 'Choose a poster');

    const thumbButtons = posters.map(function (p, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pg-thumb';
      btn.setAttribute('aria-label', 'Show poster ' + (i + 1) + ' of ' + count);
      btn.innerHTML = '<img src="' + p.thumb + '" alt="">';
      btn.addEventListener('click', function () { show(i); });
      thumbs.appendChild(btn);
      return btn;
    });

    const stage = document.createElement('div');
    stage.className = 'pg-stage';
    stage.innerHTML =
      '<button class="pg-side pg-side--prev" type="button" aria-label="Previous poster"><img alt=""></button>' +
      '<button class="pg-main" type="button" aria-label="Open poster full screen"><img alt=""></button>' +
      '<button class="pg-side pg-side--next" type="button" aria-label="Next poster"><img alt=""></button>';

    const caption = document.createElement('div');
    caption.className = 'pg-caption';
    caption.setAttribute('aria-live', 'polite');

    gallery.append(thumbs, stage, caption);
    gallery.classList.add('is-enhanced');

    const prevBtn = stage.querySelector('.pg-side--prev');
    const nextBtn = stage.querySelector('.pg-side--next');
    const mainImg = stage.querySelector('.pg-main img');
    const prevImg = prevBtn.querySelector('img');
    const nextImg = nextBtn.querySelector('img');
    prevBtn.hidden = nextBtn.hidden = count < 2;

    let current = 0;
    const pad = function (n) { return String(n).padStart(2, '0'); };

    function show(i, initial) {
      current = (i + count) % count;
      const p = posters[current];

      mainImg.src = p.src;
      mainImg.alt = p.alt;
      mainImg.classList.remove('is-entering');
      void mainImg.offsetWidth; // restart the fade-in animation
      mainImg.classList.add('is-entering');
      prevImg.src = posters[(current - 1 + count) % count].src;
      nextImg.src = posters[(current + 1) % count].src;

      thumbButtons.forEach(function (btn, n) {
        btn.setAttribute('aria-current', n === current ? 'true' : 'false');
      });
      // Keep the active thumbnail visible in the strip (without scrolling the page)
      if (!initial) {
        const active = thumbButtons[current];
        thumbs.scrollTo({ left: active.offsetLeft - (thumbs.clientWidth - active.offsetWidth) / 2, behavior: 'smooth' });
      }

      const counter = document.createElement('p');
      counter.className = 'pg-counter';
      counter.textContent = pad(current + 1) + ' / ' + pad(count);
      caption.replaceChildren();
      if (p.caption) caption.appendChild(p.caption.cloneNode(true));
      caption.appendChild(counter);
    }

    prevBtn.addEventListener('click', function () { show(current - 1); });
    nextBtn.addEventListener('click', function () { show(current + 1); });
    stage.querySelector('.pg-main').addEventListener('click', function () {
      const items = posters.map(function (p) {
        const title = p.caption && p.caption.querySelector('.poster__title');
        return { src: p.full, alt: p.alt, caption: title ? title.textContent : '' };
      });
      getLightbox().open(items, current, show);
    });

    onSwipe(stage, function (step) { show(current + step); });
    document.addEventListener('keydown', function (e) {
      if (document.querySelector('dialog[open]')) return;
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });

    show(0, true);
  }
});
