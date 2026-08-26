/* ==========================================================================
   DIGITAL RAKHI — script.js
   Vanilla JS SPA logic: navigation, canvas editor, AI prototype, saving,
   sharing, and notifications. Structured for future backend/AI integration.
   ========================================================================== */

/* ==========================================================================
   1. DOM REFERENCES
   ========================================================================== */

const dom = {
    // Navigation
    navItems: null,               // NodeList, populated in init
    sidebar: null,

    // Transition overlay
    transitionOverlay: null,
    transitionRakhiImage: null,

    // Page sections
    pageSections: null,            // NodeList
    mainContent: null,

    // Home
    startDesigningBtn: null,
    aiCreateBtn: null,

    // Create Rakhi / editor
    rakhiEditor: null,
    canvas: null,
    toolButtons: null,             // brush, eraser, colors, shapes, text, rakhi-elements
    undoBtn: null,
    redoBtn: null,
    clearBtn: null,
    saveBtn: null,
    exportBtn: null,

    // AI Studio
    aiPromptForm: null,
    aiPromptInput: null,
    aiGenerateBtn: null,
    aiExampleButtons: null,
    aiLoadingState: null,
    aiErrorMessage: null,
    aiErrorText: null,
    aiGeneratedResult: null,
    aiGeneratedImage: null,
    aiOpenInEditorBtn: null,

    // My Designs
    designGrid: null,
    designGridEmptyState: null,

    // Share
    sharePreviewImage: null,
    shareMessageInput: null,
    shareLinkInput: null,
    copyLinkBtn: null,
    shareWhatsappBtn: null,
    shareOtherBtn: null,
    shareDownloadBtn: null,

    // Footer
    footerYear: null,
};

/**
 * Caches all DOM references used throughout the app.
 * Called once during initialization.
 */
function cacheDomReferences() {
    dom.navItems = document.querySelectorAll('.nav-item');
    dom.sidebar = document.getElementById('sidebar');

    dom.transitionOverlay = document.getElementById('rakhi-transition');
    dom.transitionRakhiImage = document.getElementById('transition-rakhi');

    dom.pageSections = document.querySelectorAll('.page-section');
    dom.mainContent = document.getElementById('main-content');

    dom.startDesigningBtn = document.getElementById('start-designing-btn');
    dom.aiCreateBtn = document.getElementById('ai-create-btn');

    dom.rakhiEditor = document.getElementById('rakhi-editor');
    dom.canvas = document.getElementById('rakhi-canvas');
    dom.toolButtons = document.querySelectorAll('.tool-btn[data-tool]');
    dom.undoBtn = document.getElementById('tool-undo');
    dom.redoBtn = document.getElementById('tool-redo');
    dom.clearBtn = document.getElementById('tool-clear');
    dom.saveBtn = document.getElementById('tool-save');
    dom.exportBtn = document.getElementById('tool-export');

    dom.aiPromptForm = document.getElementById('ai-prompt-form');
    dom.aiPromptInput = document.getElementById('ai-prompt-input');
    dom.aiGenerateBtn = document.getElementById('ai-generate-btn');
    dom.aiExampleButtons = document.querySelectorAll('.ai-example-btn');
    dom.aiLoadingState = document.getElementById('ai-loading-state');
    dom.aiErrorMessage = document.getElementById('ai-error-message');
    dom.aiErrorText = document.getElementById('ai-error-text');
    dom.aiGeneratedResult = document.getElementById('ai-generated-result');
    dom.aiGeneratedImage = document.getElementById('ai-generated-image');
    dom.aiOpenInEditorBtn = document.getElementById('ai-open-in-editor-btn');

    dom.designGrid = document.getElementById('design-grid');
    dom.designGridEmptyState = document.getElementById('design-grid-empty-state');

    dom.sharePreviewImage = document.getElementById('share-preview-image');
    dom.shareMessageInput = document.getElementById('share-message-input');
    dom.shareLinkInput = document.getElementById('share-link-input');
    dom.copyLinkBtn = document.getElementById('copy-link-btn');
    dom.shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
    dom.shareOtherBtn = document.getElementById('share-other-btn');
    dom.shareDownloadBtn = document.getElementById('share-download-btn');

    dom.footerYear = document.getElementById('footer-year');
}

/* ==========================================================================
   2. APPLICATION STATE
   ========================================================================== */

const STORAGE_KEY = 'digitalRakhi.designs';
const MAX_HISTORY_STATES = 25;

const state = {
    currentPage: 'home',
    isTransitioning: false,

    // Canvas / drawing
    ctx: null,
    isDrawing: false,
    currentTool: 'brush',           // 'brush' | 'eraser'
    currentColor: '#C21E6D',
    brushSize: 6,
    lastPoint: null,

    // Undo / redo history (array of dataURL snapshots)
    history: [],
    historyIndex: -1,

    // Designs saved by the user (mirrors localStorage)
    designs: [],
    selectedDesignId: null,

    // AI studio
    isGeneratingAI: false,
    lastAIResultDataUrl: null,
};

/* ==========================================================================
   3. NAVIGATION
   ========================================================================== */

/**
 * Wires up click handlers for every sidebar navigation item and the
 * home page's shortcut buttons.
 */
function setupNavigation() {
    dom.navItems.forEach((navButton) => {
        navButton.addEventListener('click', (event) => {
            event.preventDefault();
            const targetPage = navButton.dataset.page;
            if (targetPage) {
                navigateToPage(targetPage);
            }
        });
    });

    if (dom.startDesigningBtn) {
        dom.startDesigningBtn.addEventListener('click', () => navigateToPage('create'));
    }

    if (dom.aiCreateBtn) {
        dom.aiCreateBtn.addEventListener('click', () => navigateToPage('ai-studio'));
    }
}

/**
 * Central navigation function. Shows the Rakhi transition overlay,
 * then swaps the active page section once the animation has played.
 * @param {string} pageName - matches a section's data-page-id / nav data-page
 */
function navigateToPage(pageName) {
    // Guard against double-triggering while a transition is already running.
    if (state.isTransitioning) {
        return;
    }

    const targetSection = document.querySelector(`.page-section[data-page-id="${pageName}"]`);
    if (!targetSection) {
        console.warn(`Digital Rakhi: no page found for "${pageName}"`);
        return;
    }

    state.isTransitioning = true;
    showRakhiTransition();

    const TRANSITION_DELAY_MS = 900;

    window.setTimeout(() => {
        showPage(pageName);
        setActiveNavItem(pageName);
        hideRakhiTransition();
        state.currentPage = pageName;
        state.isTransitioning = false;

        // Run any page-specific setup that needs fresh data (e.g. My Designs).
        runPageEnterHooks(pageName);

        if (dom.mainContent) {
            dom.mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, TRANSITION_DELAY_MS);
}

/**
 * Hides every page section then reveals the requested one.
 * @param {string} pageName
 */
function showPage(pageName) {
    dom.pageSections.forEach((section) => {
        const isTarget = section.dataset.pageId === pageName;
        section.classList.toggle('active-page', isTarget);
    });
}

/**
 * Updates which sidebar nav button is styled as active.
 * @param {string} pageName
 */
function setActiveNavItem(pageName) {
    dom.navItems.forEach((navButton) => {
        const isActive = navButton.dataset.page === pageName;
        navButton.classList.toggle('active-nav-item', isActive);
        if (isActive) {
            navButton.setAttribute('aria-current', 'page');
        } else {
            navButton.removeAttribute('aria-current');
        }
    });
}

/**
 * Runs any side-effects that should happen right when a page becomes visible.
 * Keeping this centralized avoids scattering "if page === X" checks everywhere.
 * @param {string} pageName
 */
function runPageEnterHooks(pageName) {
    if (pageName === 'my-designs') {
        renderDesignGrid();
    }
    if (pageName === 'share') {
        prepareSharePageForSelectedDesign();
    }
}

/* ==========================================================================
   4. RAKHI TRANSITION OVERLAY
   ========================================================================== */

/**
 * Reveals the full-screen transition overlay and gives the Rakhi
 * image a fresh animation cycle.
 */
function showRakhiTransition() {
    if (!dom.transitionOverlay) return;

    dom.transitionOverlay.removeAttribute('hidden');
    dom.transitionOverlay.setAttribute('aria-hidden', 'false');

    // Force reflow so the CSS transition re-triggers even on rapid navigation.
    void dom.transitionOverlay.offsetWidth;
    dom.transitionOverlay.classList.add('transition-active');
}

/**
 * Hides the transition overlay.
 */
function hideRakhiTransition() {
    if (!dom.transitionOverlay) return;

    dom.transitionOverlay.classList.remove('transition-active');
    dom.transitionOverlay.setAttribute('aria-hidden', 'true');

    // Wait for the fade-out transition before fully hiding it from the a11y tree.
    window.setTimeout(() => {
        if (!dom.transitionOverlay.classList.contains('transition-active')) {
            dom.transitionOverlay.setAttribute('hidden', '');
        }
    }, 400);
}

/* ==========================================================================
   5. CANVAS SETUP
   ========================================================================== */

/**
 * Initializes the drawing canvas: gets the 2D context, fills a white
 * background (so saved/exported PNGs aren't transparent), and wires
 * up mouse + touch event listeners.
 */
function initCanvas() {
    if (!dom.canvas) {
        console.warn('Digital Rakhi: #rakhi-canvas not found, skipping canvas init.');
        return;
    }

    state.ctx = dom.canvas.getContext('2d');
    if (!state.ctx) {
        console.error('Digital Rakhi: unable to acquire 2D drawing context.');
        return;
    }

    fillCanvasBackground('#FFFDF9');
    saveHistoryState(); // capture the blank canvas as the first undo state

    attachCanvasEventListeners();
    createBrushControlsPanel();
}

/**
 * Fills the entire canvas with a solid background color.
 * @param {string} color
 */
function fillCanvasBackground(color) {
    if (!state.ctx) return;
    state.ctx.save();
    state.ctx.fillStyle = color;
    state.ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
    state.ctx.restore();
}

/**
 * Converts a mouse or touch event into accurate canvas-space coordinates,
 * accounting for the canvas's rendered size vs. its internal resolution.
 * @param {MouseEvent|Touch} event
 * @returns {{x: number, y: number}}
 */
function getCanvasCoordinates(event) {
    const rect = dom.canvas.getBoundingClientRect();
    const scaleX = dom.canvas.width / rect.width;
    const scaleY = dom.canvas.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
    };
}

/* ==========================================================================
   6. DRAWING (brush + eraser)
   ========================================================================== */

/**
 * Attaches all mouse and touch listeners needed for freehand drawing.
 */
function attachCanvasEventListeners() {
    dom.canvas.addEventListener('mousedown', handleDrawStart);
    dom.canvas.addEventListener('mousemove', handleDrawMove);
    window.addEventListener('mouseup', handleDrawEnd);
    dom.canvas.addEventListener('mouseleave', handleDrawLeave);

    // Touch equivalents — passive:false so we can preventDefault (stop scrolling).
    dom.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    dom.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleDrawEnd);
    window.addEventListener('touchcancel', handleDrawEnd);
}

function handleDrawStart(event) {
    beginStroke(getCanvasCoordinates(event));
}

function handleDrawMove(event) {
    if (!state.isDrawing) return;
    continueStroke(getCanvasCoordinates(event));
}

function handleDrawEnd() {
    if (state.isDrawing) {
        endStroke();
    }
}

function handleDrawLeave() {
    if (state.isDrawing) {
        endStroke();
    }
}

function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    if (touch) {
        beginStroke(getCanvasCoordinates(touch));
    }
}

function handleTouchMove(event) {
    event.preventDefault();
    if (!state.isDrawing) return;
    const touch = event.touches[0];
    if (touch) {
        continueStroke(getCanvasCoordinates(touch));
    }
}

/**
 * Starts a new stroke at the given point.
 * @param {{x: number, y: number}} point
 */
function beginStroke(point) {
    if (!state.ctx) return;
    state.isDrawing = true;
    state.lastPoint = point;

    // A single click/tap should still leave a dot.
    drawSegment(point, point);
}

/**
 * Draws a line segment from the last recorded point to the new point.
 * @param {{x: number, y: number}} point
 */
function continueStroke(point) {
    if (!state.ctx || !state.lastPoint) return;
    drawSegment(state.lastPoint, point);
    state.lastPoint = point;
}

/**
 * Finalizes the current stroke and pushes a new undo/redo checkpoint.
 */
function endStroke() {
    state.isDrawing = false;
    state.lastPoint = null;
    saveHistoryState();
}

/**
 * Draws a single line segment using the currently selected tool.
 * Handles both brush (normal paint) and eraser (destination-out compositing).
 * @param {{x: number, y: number}} from
 * @param {{x: number, y: number}} to
 */
function drawSegment(from, to) {
    const ctx = state.ctx;
    ctx.save();

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = state.brushSize;

    if (state.currentTool === 'eraser') {
        // "Erasing" reveals the canvas background rather than transparency,
        // since we always render onto an opaque background.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = state.currentColor;
    }

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.restore();
}

/* ==========================================================================
   7. TOOLBAR (tool selection, color, brush size)
   ========================================================================== */

/**
 * Wires up the drawing toolbar: brush/eraser/shape/text buttons,
 * undo/redo/clear, and save/export.
 */
function setupToolbar() {
    dom.toolButtons.forEach((button) => {
        button.addEventListener('click', () => handleToolButtonClick(button));
    });

    if (dom.undoBtn) dom.undoBtn.addEventListener('click', undo);
    if (dom.redoBtn) dom.redoBtn.addEventListener('click', redo);
    if (dom.clearBtn) dom.clearBtn.addEventListener('click', clearCanvasWithConfirmation);
    if (dom.saveBtn) dom.saveBtn.addEventListener('click', saveCurrentDesign);
    if (dom.exportBtn) dom.exportBtn.addEventListener('click', downloadCanvasAsPng);
}

/**
 * Routes a toolbar button click to the right behavior depending on
 * which tool it represents.
 * @param {HTMLElement} button
 */
function handleToolButtonClick(button) {
    const tool = button.dataset.tool;

    if (tool === 'brush' || tool === 'eraser') {
        selectDrawingTool(tool);
        return;
    }

    if (tool === 'colors') {
        toggleBrushControlsPanel();
        return;
    }

    // 'shapes', 'text', and 'rakhi-elements' are placeholders reserved for
    // future editor capabilities (see project roadmap in the AI/backend
    // integration notes below). We surface a friendly notice for now.
    showNotification('This tool is coming soon to the Rakhi editor!', 'info');
}

/**
 * Marks a drawing tool (brush/eraser) as active, both in state and visually.
 * @param {'brush'|'eraser'} tool
 */
function selectDrawingTool(tool) {
    state.currentTool = tool;
    dom.toolButtons.forEach((button) => {
        button.classList.toggle('active-tool', button.dataset.tool === tool);
    });
}

/**
 * Creates a small floating panel with color swatches, a custom color
 * input, and a brush-size slider. The static HTML only ships tool
 * *buttons* (per the design spec), so the actual controls are created
 * here at runtime and inserted next to the editor toolbar.
 */
function createBrushControlsPanel() {
    if (!dom.rakhiEditor || document.getElementById('brush-controls-panel')) {
        return;
    }

    const panel = document.createElement('div');
    panel.id = 'brush-controls-panel';
    panel.className = 'toolbar-group';
    panel.setAttribute('hidden', '');
    panel.setAttribute('aria-label', 'Brush color and size controls');

    const swatchColors = ['#C21E6D', '#6B3FA0', '#FF7A30', '#D4A24C', '#E24B4B', '#2B1B2E', '#FFFFFF'];

    swatchColors.forEach((color) => {
        const swatchBtn = document.createElement('button');
        swatchBtn.type = 'button';
        swatchBtn.className = 'color-swatch-btn';
        swatchBtn.style.background = color;
        swatchBtn.setAttribute('aria-label', `Set brush color to ${color}`);
        swatchBtn.addEventListener('click', () => setCurrentColor(color));
        panel.appendChild(swatchBtn);
    });

    const customColorInput = document.createElement('input');
    customColorInput.type = 'color';
    customColorInput.id = 'custom-color-input';
    customColorInput.value = state.currentColor;
    customColorInput.setAttribute('aria-label', 'Custom brush color');
    customColorInput.addEventListener('input', (event) => setCurrentColor(event.target.value));
    panel.appendChild(customColorInput);

    const brushSizeLabel = document.createElement('label');
    brushSizeLabel.setAttribute('for', 'brush-size-input');
    brushSizeLabel.textContent = 'Size';
    brushSizeLabel.className = 'tool-label';
    panel.appendChild(brushSizeLabel);

    const brushSizeInput = document.createElement('input');
    brushSizeInput.type = 'range';
    brushSizeInput.id = 'brush-size-input';
    brushSizeInput.min = '2';
    brushSizeInput.max = '40';
    brushSizeInput.value = String(state.brushSize);
    brushSizeInput.setAttribute('aria-label', 'Brush size');
    brushSizeInput.addEventListener('input', (event) => setBrushSize(Number(event.target.value)));
    panel.appendChild(brushSizeInput);

    dom.rakhiEditor.insertBefore(panel, dom.rakhiEditor.lastElementChild);
}

/**
 * Shows/hides the dynamically-created brush controls panel.
 */
function toggleBrushControlsPanel() {
    const panel = document.getElementById('brush-controls-panel');
    if (!panel) return;
    panel.toggleAttribute('hidden');
}

/**
 * Updates the active brush color used for new strokes.
 * @param {string} color - any valid CSS color, typically a hex string
 */
function setCurrentColor(color) {
    state.currentColor = color;
    // Selecting a color implies the user wants to paint, not erase.
    selectDrawingTool('brush');
}

/**
 * Updates the active brush thickness used for new strokes.
 * @param {number} size
 */
function setBrushSize(size) {
    if (Number.isFinite(size) && size > 0) {
        state.brushSize = size;
    }
}

/* ==========================================================================
   8. UNDO / REDO HISTORY
   ========================================================================== */

/**
 * Pushes the current canvas state onto the history stack. Any "future"
 * states (from a previous undo) are discarded, matching standard
 * undo/redo semantics.
 */
function saveHistoryState() {
    if (!dom.canvas) return;

    const snapshot = dom.canvas.toDataURL('image/png');

    // Discard redo states beyond the current pointer.
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);

    // Cap history length to avoid unbounded memory growth.
    if (state.history.length > MAX_HISTORY_STATES) {
        state.history.shift();
    }

    state.historyIndex = state.history.length - 1;
}

/**
 * Restores the canvas to a previously saved snapshot.
 * @param {string} dataUrl
 */
function restoreCanvasFromSnapshot(dataUrl) {
    const image = new Image();
    image.onload = () => {
        state.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
        state.ctx.drawImage(image, 0, 0, dom.canvas.width, dom.canvas.height);
    };
    image.onerror = () => {
        showNotification('Could not restore that step of your drawing.', 'error');
    };
    image.src = dataUrl;
}

/**
 * Steps one state backward in history, if possible.
 */
function undo() {
    if (state.historyIndex <= 0) {
        showNotification('Nothing to undo yet.', 'info');
        return;
    }
    state.historyIndex -= 1;
    restoreCanvasFromSnapshot(state.history[state.historyIndex]);
}

/**
 * Steps one state forward in history, if possible.
 */
function redo() {
    if (state.historyIndex >= state.history.length - 1) {
        showNotification('Nothing to redo.', 'info');
        return;
    }
    state.historyIndex += 1;
    restoreCanvasFromSnapshot(state.history[state.historyIndex]);
}

/**
 * Clears the canvas back to a blank background, after confirming
 * with the user since this action is destructive.
 */
function clearCanvasWithConfirmation() {
    const confirmed = window.confirm('Clear the entire canvas? This cannot be undone once you leave this step.');
    if (!confirmed) return;

    fillCanvasBackground('#FFFDF9');
    saveHistoryState();
    showNotification('Canvas cleared.', 'info');
}

/* ==========================================================================
   9. SAVE / LOAD DESIGNS (localStorage prototype layer)
   ========================================================================== */

/**
 * Reads all saved designs from localStorage into memory.
 * Wrapped in try/catch since localStorage can throw (private browsing,
 * quota exceeded, disabled storage, corrupted JSON, etc).
 * @returns {Array<object>}
 */
function loadDesignsFromStorage() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        state.designs = raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error('Digital Rakhi: failed to load saved designs.', error);
        state.designs = [];
        showNotification('Could not load your saved designs.', 'error');
    }
    return state.designs;
}

/**
 * Persists the in-memory designs array back to localStorage.
 * @returns {boolean} whether the save succeeded
 */
function persistDesignsToStorage() {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.designs));
        return true;
    } catch (error) {
        console.error('Digital Rakhi: failed to save designs.', error);
        showNotification('Could not save your design. Storage may be full.', 'error');
        return false;
    }
}

/**
 * Saves the current canvas as a new design.
 *
 * NOTE for future backend integration: this currently persists to
 * localStorage as a prototype data layer. To move to a real backend,
 * replace the body of this function with something like:
 *
 *   await fetch('/api/designs', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ name, imageDataUrl }),
 *   });
 *
 * and keep the same success/error notification behavior.
 */
function saveCurrentDesign() {
    if (!dom.canvas) {
        showNotification('No canvas available to save.', 'error');
        return;
    }

    try {
        const design = {
            id: generateId(),
            name: `My Rakhi ${state.designs.length + 1}`,
            date: new Date().toISOString(),
            image: dom.canvas.toDataURL('image/png'),
        };

        state.designs.unshift(design);

        if (persistDesignsToStorage()) {
            showNotification('Your Rakhi has been saved! 💾', 'success');
        }
    } catch (error) {
        console.error('Digital Rakhi: error while saving design.', error);
        showNotification('Something went wrong while saving your design.', 'error');
    }
}

/* ==========================================================================
   10. MY DESIGNS (rendering the saved-designs grid)
   ========================================================================== */

/**
 * Renders the My Designs grid based on the current in-memory designs list,
 * falling back to the empty state when there are none.
 */
function renderDesignGrid() {
    if (!dom.designGrid) return;

    loadDesignsFromStorage();

    // Remove any previously rendered cards (but keep the empty-state element,
    // which lives in the static HTML, so we can toggle it).
    const existingCards = dom.designGrid.querySelectorAll('.design-card');
    existingCards.forEach((card) => card.remove());

    const hasDesigns = state.designs.length > 0;
    if (dom.designGridEmptyState) {
        dom.designGridEmptyState.hidden = hasDesigns;
    }

    if (!hasDesigns) return;

    state.designs.forEach((design) => {
        const card = createDesignCardElement(design);
        dom.designGrid.appendChild(card);
    });
}

/**
 * Builds a single design card DOM element with open/edit/delete/share actions.
 * @param {{id: string, name: string, date: string, image: string}} design
 * @returns {HTMLElement}
 */
function createDesignCardElement(design) {
    const card = document.createElement('article');
    card.className = 'design-card';
    card.dataset.designId = design.id;
    card.setAttribute('role', 'listitem');

    const thumbnail = document.createElement('img');
    thumbnail.className = 'design-card-thumbnail';
    thumbnail.src = design.image;
    thumbnail.alt = `Preview of ${design.name}`;

    const title = document.createElement('h3');
    title.className = 'design-card-title';
    title.textContent = design.name;

    const dateLabel = document.createElement('p');
    dateLabel.className = 'design-card-date';
    dateLabel.textContent = formatDate(design.date);

    const actions = document.createElement('div');
    actions.className = 'design-card-actions';

    const openBtn = document.createElement('button');
    openBtn.type = 'button';
    openBtn.className = 'design-open-btn';
    openBtn.textContent = 'Open';
    openBtn.addEventListener('click', () => openDesignInEditor(design.id));

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'design-edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => openDesignInEditor(design.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'design-delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteDesign(design.id));

    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'design-share-btn';
    shareBtn.textContent = 'Share';
    shareBtn.addEventListener('click', () => {
        state.selectedDesignId = design.id;
        navigateToPage('share');
    });

    actions.append(openBtn, editBtn, deleteBtn, shareBtn);
    card.append(thumbnail, title, dateLabel, actions);

    return card;
}

/**
 * Deletes a saved design after confirming with the user, then refreshes
 * the grid and storage.
 * @param {string} designId
 */
function deleteDesign(designId) {
    const confirmed = window.confirm('Delete this Rakhi design? This cannot be undone.');
    if (!confirmed) return;

    state.designs = state.designs.filter((design) => design.id !== designId);

    if (persistDesignsToStorage()) {
        showNotification('Design deleted.', 'info');
        renderDesignGrid();
    }
}

/**
 * Loads a saved design onto the canvas and switches to the Create Rakhi page.
 * @param {string} designId
 */
function openDesignInEditor(designId) {
    const design = state.designs.find((item) => item.id === designId);
    if (!design) {
        showNotification('That design could not be found.', 'error');
        return;
    }

    state.selectedDesignId = designId;
    navigateToPage('create');

    // Wait for the transition/page-swap to finish before touching the canvas.
    window.setTimeout(() => {
        restoreCanvasFromSnapshot(design.image);
        saveHistoryState();
    }, 950);
}

/* ==========================================================================
   11. AI STUDIO (prototype logic, ready for real API integration)
   ========================================================================== */

/**
 * Wires up the AI Studio form: example prompt shortcuts, submit handling,
 * and the "open in editor" hand-off.
 */
function setupAIStudio() {
    if (dom.aiPromptForm) {
        dom.aiPromptForm.addEventListener('submit', handleAIGenerateSubmit);
    }

    dom.aiExampleButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (dom.aiPromptInput) {
                dom.aiPromptInput.value = button.dataset.prompt || button.textContent.trim();
                dom.aiPromptInput.focus();
            }
        });
    });

    if (dom.aiOpenInEditorBtn) {
        dom.aiOpenInEditorBtn.addEventListener('click', openAIResultInEditor);
    }
}

/**
 * Handles the AI prompt form submission: validates input, shows loading
 * state, calls the (currently mocked) generation function, and renders
 * the result or an error.
 * @param {SubmitEvent} event
 */
async function handleAIGenerateSubmit(event) {
    event.preventDefault();

    const prompt = dom.aiPromptInput ? dom.aiPromptInput.value.trim() : '';
    if (!prompt) {
        showAIError('Please describe the Rakhi you would like AI to create.');
        return;
    }

    if (state.isGeneratingAI) {
        return; // avoid duplicate concurrent requests
    }

    setAILoadingState(true);
    hideAIError();
    hideAIResult();

    try {
        const resultImageUrl = await generateAIRakhi(prompt);
        showAIResult(resultImageUrl);
    } catch (error) {
        console.error('Digital Rakhi: AI generation failed.', error);
        showAIError('We could not generate a design right now. Please try again.');
    } finally {
        setAILoadingState(false);
    }
}

/**
 * Generates an AI Rakhi design from a text prompt.
 *
 * CURRENT BEHAVIOR: returns a mock placeholder image after a short
 * simulated delay, so the frontend prototype is fully demonstrable
 * without a real backend.
 *
 * FUTURE BACKEND INTEGRATION: replace the mock body with a real
 * network call, e.g.:
 *
 *   const response = await fetch('/api/ai/generate', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ prompt }),
 *   });
 *   if (!response.ok) throw new Error('AI generation request failed');
 *   const data = await response.json();
 *   return data.imageUrl;
 *
 * Never place an API key in this file — authentication must happen
 * on the backend that proxies the request to the AI provider.
 *
 * @param {string} prompt
 * @returns {Promise<string>} resolves to an image URL / data URL
 */
async function generateAIRakhi(prompt) {
    state.isGeneratingAI = true;

    const SIMULATED_DELAY_MS = 1600;

    return new Promise((resolve, reject) => {
        window.setTimeout(() => {
            state.isGeneratingAI = false;

            // Simulate an occasional failure so the error path is exercised.
            const shouldSimulateFailure = false;
            if (shouldSimulateFailure) {
                reject(new Error('Mock AI failure'));
                return;
            }

            // Mock placeholder result — swap for the real generated image URL.
            resolve('assets/images/ai-placeholder-rakhi.png');
        }, SIMULATED_DELAY_MS);
    }).finally(() => {
        // no-op cleanup hook reserved for future analytics/logging
    });

    // `prompt` is intentionally unused in the mock but kept in the signature
    // so calling code and the future real implementation stay compatible.
}

/**
 * Prepares an AI-generated heartfelt message for a Rakhi.
 *
 * NOT YET IMPLEMENTED: reserved for a future call to `/api/ai/message`.
 * Kept as a stub so other parts of the app (e.g. the Share page) can
 * already reference it without breaking once it's implemented.
 *
 * @param {object} [context] - optional context like sibling names or tone
 * @returns {Promise<string>}
 */
async function generateAIMessage(context = {}) {
    console.info('Digital Rakhi: generateAIMessage() is a placeholder for future AI integration.', context);
    return Promise.resolve('Happy Raksha Bandhan! ❤️');
}

function setAILoadingState(isLoading) {
    if (dom.aiLoadingState) {
        dom.aiLoadingState.hidden = !isLoading;
    }
    if (dom.aiGenerateBtn) {
        dom.aiGenerateBtn.disabled = isLoading;
    }
}

function showAIError(message) {
    if (dom.aiErrorText) {
        dom.aiErrorText.textContent = message;
    }
    if (dom.aiErrorMessage) {
        dom.aiErrorMessage.hidden = false;
    }
}

function hideAIError() {
    if (dom.aiErrorMessage) {
        dom.aiErrorMessage.hidden = true;
    }
}

function showAIResult(imageUrl) {
    state.lastAIResultDataUrl = imageUrl;

    if (dom.aiGeneratedImage) {
        dom.aiGeneratedImage.src = imageUrl;
        dom.aiGeneratedImage.hidden = false;
    }
    if (dom.aiGeneratedResult) {
        dom.aiGeneratedResult.hidden = false;
    }
}

function hideAIResult() {
    if (dom.aiGeneratedResult) {
        dom.aiGeneratedResult.hidden = true;
    }
}

/**
 * Sends the user to the Create Rakhi editor and draws the AI result
 * onto the canvas so they can keep customizing it.
 */
function openAIResultInEditor() {
    if (!state.lastAIResultDataUrl) {
        showNotification('Generate a design first.', 'info');
        return;
    }

    navigateToPage('create');

    window.setTimeout(() => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            state.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
            state.ctx.drawImage(image, 0, 0, dom.canvas.width, dom.canvas.height);
            saveHistoryState();
        };
        image.onerror = () => {
            showNotification('Could not load the AI-generated image into the editor.', 'error');
        };
        image.src = state.lastAIResultDataUrl;
    }, 950);
}

/* ==========================================================================
   12. SHARING
   ========================================================================== */

/**
 * Wires up the Share page's buttons: copy link, WhatsApp, other/native
 * share, and download.
 */
function setupSharePage() {
    if (dom.copyLinkBtn) {
        dom.copyLinkBtn.addEventListener('click', copyShareLink);
    }
    if (dom.shareWhatsappBtn) {
        dom.shareWhatsappBtn.addEventListener('click', shareViaWhatsApp);
    }
    if (dom.shareOtherBtn) {
        dom.shareOtherBtn.addEventListener('click', shareViaWebShareOrCopy);
    }
    if (dom.shareDownloadBtn) {
        dom.shareDownloadBtn.addEventListener('click', downloadCanvasAsPng);
    }
}

/**
 * Populates the Share page preview + link based on whichever design was
 * selected (from My Designs) or, failing that, the current canvas.
 *
 * FUTURE BACKEND INTEGRATION: the "share identifier" here is a random
 * client-side token. In production this should come from the backend,
 * e.g. POST /api/designs/:id/share returning a real public URL.
 */
function prepareSharePageForSelectedDesign() {
    let imageSource = null;

    const selectedDesign = state.designs.find((design) => design.id === state.selectedDesignId);
    if (selectedDesign) {
        imageSource = selectedDesign.image;
    } else if (dom.canvas) {
        imageSource = dom.canvas.toDataURL('image/png');
    }

    if (imageSource && dom.sharePreviewImage) {
        dom.sharePreviewImage.src = imageSource;
        dom.sharePreviewImage.hidden = false;
    }

    if (dom.shareLinkInput) {
        const shareId = state.selectedDesignId || generateId();
        dom.shareLinkInput.value = `https://digitalrakhi.app/r/${shareId}`;
    }

    if (dom.shareMessageInput && !dom.shareMessageInput.value) {
        dom.shareMessageInput.value = 'Happy Raksha Bandhan! ❤️';
    }
}

/**
 * Copies the current share link to the clipboard using the Clipboard API,
 * with a manual fallback for browsers/contexts where it's unavailable.
 */
async function copyShareLink() {
    const link = dom.shareLinkInput ? dom.shareLinkInput.value : '';
    if (!link) {
        showNotification('There is no share link to copy yet.', 'error');
        return;
    }

    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(link);
        } else {
            // Fallback for older browsers: select the text and use execCommand.
            dom.shareLinkInput.select();
            document.execCommand('copy');
        }
        showNotification('Rakhi link copied! ❤️', 'success');
    } catch (error) {
        console.error('Digital Rakhi: clipboard copy failed.', error);
        showNotification('Could not copy the link. Please copy it manually.', 'error');
    }
}

/**
 * Opens WhatsApp with a pre-filled message containing the share link.
 */
function shareViaWhatsApp() {
    const link = dom.shareLinkInput ? dom.shareLinkInput.value : '';
    const message = dom.shareMessageInput ? dom.shareMessageInput.value : 'Happy Raksha Bandhan! ❤️';

    const text = encodeURIComponent(`${message} ${link}`.trim());
    const whatsappUrl = `https://wa.me/?text=${text}`;

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Uses the native Web Share API when available (mobile-friendly),
 * falling back to copying the link when it isn't supported.
 */
async function shareViaWebShareOrCopy() {
    const link = dom.shareLinkInput ? dom.shareLinkInput.value : '';
    const message = dom.shareMessageInput ? dom.shareMessageInput.value : 'Happy Raksha Bandhan! ❤️';

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Digital Rakhi',
                text: message,
                url: link,
            });
            return;
        } catch (error) {
            // Users cancelling the native share sheet also land here — that's fine.
            console.info('Digital Rakhi: native share dismissed or failed.', error);
            return;
        }
    }

    // Fallback: no Web Share API support.
    await copyShareLink();
}

/* ==========================================================================
   13. DOWNLOAD
   ========================================================================== */

/**
 * Exports the current canvas as a downloadable PNG file.
 */
function downloadCanvasAsPng() {
    if (!dom.canvas) {
        showNotification('No canvas available to export.', 'error');
        return;
    }

    try {
        const dataUrl = dom.canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = 'my-digital-rakhi.png';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        showNotification('Your Rakhi is downloading! ⬇️', 'success');
    } catch (error) {
        console.error('Digital Rakhi: failed to export canvas as PNG.', error);
        showNotification('Could not export your design.', 'error');
    }
}

/* ==========================================================================
   14. NOTIFICATIONS
   ========================================================================== */

const NOTIFICATION_CONTAINER_ID = 'notification-container';
const NOTIFICATION_DURATION_MS = 3200;

/**
 * Lazily creates (once) and returns the notification container element.
 * @returns {HTMLElement}
 */
function getOrCreateNotificationContainer() {
    let container = document.getElementById(NOTIFICATION_CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = NOTIFICATION_CONTAINER_ID;
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('role', 'status');
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Displays a temporary toast-style notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 */
function showNotification(message, type = 'info') {
    const container = getOrCreateNotificationContainer();

    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add('notification-hide');
        window.setTimeout(() => toast.remove(), 300);
    }, NOTIFICATION_DURATION_MS);
}

/* ==========================================================================
   15. KEYBOARD SHORTCUTS
   ========================================================================== */

/**
 * Registers global keyboard shortcuts for undo/redo and closing the overlay.
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        const isModifierPressed = event.ctrlKey || event.metaKey;

        if (isModifierPressed && !event.shiftKey && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            undo();
            return;
        }

        if (isModifierPressed && event.shiftKey && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            redo();
            return;
        }

        if (event.key === 'Escape') {
            if (state.isTransitioning) {
                hideRakhiTransition();
                state.isTransitioning = false;
            }
        }
    });
}

/* ==========================================================================
   16. UTILITIES
   ========================================================================== */

/**
 * Generates a reasonably unique ID for client-side records.
 * Prototype-only: a real backend should assign persistent IDs.
 * @returns {string}
 */
function generateId() {
    return `rakhi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Formats an ISO date string into a friendly, readable date.
 * @param {string} isoDateString
 * @returns {string}
 */
function formatDate(isoDateString) {
    try {
        const date = new Date(isoDateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
        return '';
    }
}

/**
 * Sets the footer's copyright year to the current year automatically.
 */
function setFooterYear() {
    if (dom.footerYear) {
        dom.footerYear.textContent = String(new Date().getFullYear());
    }
}

/* ==========================================================================
   17. INITIALIZATION
   ========================================================================== */

/**
 * Boots the entire application once the DOM is ready. Wrapped in a
 * try/catch so a single unexpected error can't leave the whole page
 * non-functional.
 */
function initializeApp() {
    try {
        cacheDomReferences();

        setupNavigation();
        setupToolbar();
        setupAIStudio();
        setupSharePage();
        setupKeyboardShortcuts();

        initCanvas();
        loadDesignsFromStorage();
        setFooterYear();

        // Ensure Home is the visible page and marked active on first load.
        showPage('home');
        setActiveNavItem('home');
    } catch (error) {
        // Never let a startup error break the whole app silently —
        // at minimum, surface something in the console for debugging.
        console.error('Digital Rakhi: failed to initialize application.', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);