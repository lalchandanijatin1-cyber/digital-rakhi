# 🌸 Happy Raksha Bandhan to All Brothers & Sisters! ❤️

> Digital Rakhi — Create • Personalize • Share

Distance shouldn't get in the way of a rakhi. That's really where this project started — I wanted a way for a brother and sister who can't be in the same room on Raksha Bandhan to still have something real to exchange, not just a "Happy Raksha Bandhan" text and a sad emoji.

Digital Rakhi lets you draw your own rakhi from scratch, describe one and have AI generate it for you, decorate it with colors, shapes, text and little festive touches, save it, and send it to the person it's meant for. It's a small project, but it's built around something that matters to a lot of people.

---

## 🌐 Live Demo

[🔗 Try Digital Rakhi Live](YOUR_DEMO_LINK_HERE)

Open the demo and create your own Rakhi ❤️

---

## 🎀 What is Digital Rakhi?

Most of us just send a message on Raksha Bandhan when we can't be there in person. Digital Rakhi is an attempt to make that moment feel a little more personal — instead of typing out a message, you actually *make* something.

You can draw a rakhi by hand using the canvas editor, complete with brushes, shapes, and decorative elements. If drawing isn't really your thing, you can describe what you're imagining in AI Studio and let it generate a design for you — a starting point you can still edit, color, and make your own. Either way, you can add a heartfelt message, save the design, and share it however you'd like — a link, WhatsApp, or a downloaded image.

It's not trying to replace an actual rakhi. It's just a way to make the digital version feel like it came from you, not a template.

---

## ✨ Features

**🎨 Custom Rakhi Editor**
- Draw your own rakhi on a canvas, freehand.

**🖌️ Drawing Tools**
- Brush
- Eraser
- Color picker
- Brush size control

**🔷 Shapes**
- Circle
- Square
- Rectangle
- Triangle
- Diamond
- Star
- Heart

**🔤 Personalized Text**
- Add a message like *"Happy Raksha Bandhan Bhai ❤️"* directly onto the design.
- Adjust text size and style.

**🪢 Rakhi Elements**
Decorative touches you can drop onto your design:
- Flowers, hearts, stars, sparkles
- Diamonds, lotus, evil eye
- Beads, thread, crown
- Om, peacock feather

**✨ AI Studio**
- Describe the rakhi you're imagining.
- The prompt is sent to the Flask backend.
- An AI-generated rakhi design comes back.
- Open it straight in the editor to keep customizing.

**💾 My Designs**
- Save your designs.
- Come back and view them anytime.
- Edit or delete them.

**💌 Sharing**
- Share via WhatsApp.
- Use the native Web Share API where supported.
- Copy a share link.
- Download your rakhi as a PNG.

**↩️ Undo / Redo**
- Made a mistake? Undo it. Changed your mind? Redo it.

**📱 Responsive**
- Works on desktop, laptop, tablet, and mobile.

---

## 🪢 How It Works

1. Open Digital Rakhi.
2. Choose **Create Rakhi** to draw one yourself, or **AI Studio** to generate one.
3. Design it, or let AI generate a starting point.
4. Personalize it — colors, shapes, text, decorative elements.
5. Save it.
6. Find it anytime under **My Designs**.
7. Share it with your sibling.
8. Download it if you want to keep a copy for yourself.

---

## ✨ AI Studio

If you're not sure exactly what you want, or just don't feel like drawing, AI Studio has you covered. Type out what you're imagining — something like:

> "Create a traditional red and gold Rakhi with pearls, flowers and a beautiful festive design."

and it'll generate a design based on that. Here's roughly what happens behind the scenes:

```
Frontend
   ↓
Flask backend
   ↓
AI image generation service
   ↓
Generated image
   ↓
Displayed in AI Studio
   ↓
Opened in the editor (optional)
   ↓
Saved / shared / downloaded
```

The AI provider's API credentials live in environment variables on the backend and are never committed to GitHub or exposed to the browser.

---

## 💾 Storage

Digital Rakhi actually uses two layers of storage, working together.

### Browser Storage

Saved designs are stored in the browser using `localStorage`, under the key:

```
digitalRakhi.designs
```

Each saved design keeps:
- an ID
- a name
- a date
- the image data

This means your designs are still there even if the backend happens to be offline — the app is built to fall back gracefully rather than lose your work.

### Backend Storage

The Flask backend also handles storage on the server side, so designs and generated images don't rely on the browser alone. Two folders are involved:

- `generated/` — images produced by AI Studio
- `storage/` — saved rakhi designs from the editor

There's no full database here, just server-side file storage for now — simple, and enough for what this project needs.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript, Canvas API, LocalStorage, Fetch API |
| **Backend** | Python, Flask, Flask-CORS, python-dotenv |
| **AI** | AI image generation API |

Nothing fancier than that — no frontend framework, no database. Just vanilla JS talking to a small Flask backend.

---

## 📁 Project Structure

```
digital-rakhi/
│
├── app.py
├── ai_generator.py
├── .env
├── requirements.txt
│
├── generated/
│   └── AI generated images
│
├── storage/
│   └── saved Rakhi files
│
└── frontend/
    │
    ├── index.html
    │
    ├── css/
    │   └── style.css
    │
    ├── js/
    │   └── script.js
    │
    └── images/
        ├── logo.png
        ├── hero-heading.png
        ├── hero-rakhi.png
        └── rakhi-transition.png
```

A quick tour of what does what:

- **`app.py`** — the Flask backend and its API routes.
- **`ai_generator.py`** — talks to the AI image generation service.
- **`frontend/index.html`** — the main application interface.
- **`frontend/css/style.css`** — all the styling.
- **`frontend/js/script.js`** — navigation, the canvas editor, AI Studio, storage, sharing, and everything in between.
- **`generated/`** — images produced by AI Studio.
- **`storage/`** — designs saved from the editor, kept on the backend.

---

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone YOUR_REPOSITORY_URL
cd digital-rakhi
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate

pip install -r requirements.txt
```

### 3. Add your environment variables

Create a `.env` file inside `backend/` (never commit this file):

```env
GEMINI_API_KEY=your_key_here
```

### 4. Start the Flask backend

```bash
python app.py
```

You should see it running at:

```
http://127.0.0.1:5000
```

Visiting that URL in a browser should return a small JSON message confirming the backend is up.

### 5. Open the frontend

The frontend is plain HTML/CSS/JS, so you don't need a build step — just serve the `frontend/` folder. The easiest way is VS Code's **Live Server** extension: right-click `frontend/index.html` and choose "Open with Live Server."

By default it'll open on something like:

```
http://127.0.0.1:5500
```

with the Flask backend running separately on `5000`. CORS is already enabled between them for local development.

### 6. Try it out

Open the app, describe a rakhi in AI Studio (or just start drawing one), and see it come to life.

---

## 🙏 A Small Note

This project is a work in progress, built a little at a time. If something feels rough around the edges, that's honest — it's still growing. Contributions, ideas, and feedback are always welcome.

However you're celebrating Raksha Bandhan this year — near or far — I hope this makes it feel a little more personal. 🌸❤️
