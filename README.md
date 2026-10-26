# irenezanardi.com

Plain HTML/CSS/JavaScript version of the site. No WordPress, no database, no build step.

## Folder structure

```
index.html              Home ("me")
publications/index.html Publications
teaching/index.html     Teaching
tadaa/index.html        Tadaa project
contact/index.html      "?" page (email)
posters/index.html      Posters gallery (linked from Publications)
resources/index.html    Resources (toolkits)
assets/
  css/style.css         All styling (colours and fonts are at the top)
  js/main.js            Cursor, mobile menu, carousels, scroll colour
  img/                  Logo, photos, posters
  fonts/                Inter, Cardo, Space Mono
  files/CV.pdf          Your CV
.htaccess               Server settings (redirects old WordPress links)
```

Each page is a folder with an `index.html`, so the addresses stay the same as
on WordPress (`/publications/`, `/teaching/`, ...).

## Common updates

**Add a publication** – open `publications/index.html`, copy one block like this
inside the right section, and edit it:

```html
<article class="card">
  <p class="card__marker">&gt;&gt;</p>
  <h3 class="card__title"><a href="LINK">TITLE</a></h3>
  <p>AUTHORS</p>
</article>
```

The cards arrange themselves in rows of three.

**Add a thesis** – same idea in `teaching/index.html`, under "Theses Co-Supervision".

**Add a poster** – each poster needs three images: a square thumbnail in
`assets/img/posters/thumbs/` (about 400 × 400 px), a normal-size image (about 1024 px
tall) in `assets/img/posters/` and a high-resolution one (for full screen) in
`assets/img/posters/full/`. Then in `posters/index.html` copy a whole
`<li class="poster">` block and edit the image paths, title, venue and description.
The gallery is built from that list, in that order. The numbered `.svg` thumbnails are
placeholders to replace.

**Edit a toolkit** – in `resources/index.html`, each toolkit is one `<section>`. Replace
the placeholder images (put your files in `assets/img/resources/`), the tags, title,
texts and the "What's inside" list. Replace `href="#"` on the "Go to materials" button
with the GitHub repository link, and on "Read the paper" with the paper's link (and
change its title).

**Update the CV** – replace `assets/files/CV.pdf` with the new file (same name).

**Change a carousel photo** – replace a file in `assets/img/about/` keeping the same
name, or add a new `<div class="carousel__slide">` line in `index.html`.

**Change a menu item** – the menu is repeated at the top of each of the 7 pages
(search for `nav__list`), so change it in all of them.

## Preview on your computer

Links between pages need a small local web server (double-clicking the files
works, but the menu links open folders instead of pages). In VS Code, install
the **Live Server** extension, then right-click `index.html` → *Open with Live Server*.

## Publishing

Upload everything in this folder (including the hidden `.htaccess` file) to the
web root of your host (often called `public_html` or `www`), using the host's
file manager or an FTP program like FileZilla. Then point your domain's DNS to
the new host.
