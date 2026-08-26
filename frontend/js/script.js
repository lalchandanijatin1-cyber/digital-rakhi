/* ==========================================================================
   DIGITAL RAKHI — script.js

   Frontend responsibilities:
   - SPA navigation
   - Rakhi canvas editor
   - Save/load designs using localStorage
   - Share/download functionality
   - REAL AI image generation through Flask backend

   AI FLOW:

   User enters prompt
          ↓
   JavaScript
          ↓
   POST http://127.0.0.1:5000/generate
          ↓
   Flask app.py
          ↓
   ai_generator.py
          ↓
   AI provider
          ↓
   Generated image
          ↓
   Flask returns image_url
          ↓
   JavaScript displays image

   IMPORTANT:
   - No AI API key is stored in this file.
   - The API key belongs only in the backend .env file.
   ========================================================================== */


/* ==========================================================================
   1. BACKEND CONFIGURATION
   ========================================================================== */

/*
 * Flask backend URL.
 *
 * Your current .env uses:
 *
 * FLASK_HOST=127.0.0.1
 * FLASK_PORT=5000
 *
 * Therefore the backend runs at:
 *
 * http://127.0.0.1:5000
 *
 * When you deploy the backend later, change this value to the deployed
 * backend URL.
 */

const API_BASE_URL = 'http://127.0.0.1:5000';


/* ==========================================================================
   2. DOM REFERENCES
   ========================================================================== */

const dom = {

    // Navigation
    navItems: null,
    sidebar: null,

    // Transition overlay
    transitionOverlay: null,
    transitionRakhiImage: null,

    // Page sections
    pageSections: null,
    mainContent: null,

    // Home
    startDesigningBtn: null,
    aiCreateBtn: null,

    // Create Rakhi / editor
    rakhiEditor: null,
    canvas: null,
    toolButtons: null,
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


/* ==========================================================================
   3. CACHE DOM REFERENCES
   ========================================================================== */

function cacheDomReferences() {

    // Navigation
    dom.navItems = document.querySelectorAll('.nav-item');
    dom.sidebar = document.getElementById('sidebar');

    // Transition
    dom.transitionOverlay = document.getElementById('rakhi-transition');
    dom.transitionRakhiImage = document.getElementById('transition-rakhi');

    // Pages
    dom.pageSections = document.querySelectorAll('.page-section');
    dom.mainContent = document.getElementById('main-content');

    // Home
    dom.startDesigningBtn = document.getElementById('start-designing-btn');
    dom.aiCreateBtn = document.getElementById('ai-create-btn');

    // Editor
    dom.rakhiEditor = document.getElementById('rakhi-editor');
    dom.canvas = document.getElementById('rakhi-canvas');

    dom.toolButtons = document.querySelectorAll('.tool-btn[data-tool]');

    dom.undoBtn = document.getElementById('tool-undo');
    dom.redoBtn = document.getElementById('tool-redo');
    dom.clearBtn = document.getElementById('tool-clear');
    dom.saveBtn = document.getElementById('tool-save');
    dom.exportBtn = document.getElementById('tool-export');

    // AI
    dom.aiPromptForm = document.getElementById('ai-prompt-form');
    dom.aiPromptInput = document.getElementById('ai-prompt-input');
    dom.aiGenerateBtn = document.getElementById('ai-generate-btn');

    dom.aiExampleButtons = document.querySelectorAll('.ai-example-btn');

    dom.aiLoadingState = document.getElementById('ai-loading-state');

    dom.aiErrorMessage = document.getElementById('ai-error-message');
    dom.aiErrorText = document.getElementById('ai-error-text');

    dom.aiGeneratedResult = document.getElementById('ai-generated-result');
    dom.aiGeneratedImage = document.getElementById('ai-generated-image');

    dom.aiOpenInEditorBtn =
        document.getElementById('ai-open-in-editor-btn');

    // My designs
    dom.designGrid = document.getElementById('design-grid');
    dom.designGridEmptyState =
        document.getElementById('design-grid-empty-state');

    // Share
    dom.sharePreviewImage =
        document.getElementById('share-preview-image');

    dom.shareMessageInput =
        document.getElementById('share-message-input');

    dom.shareLinkInput =
        document.getElementById('share-link-input');

    dom.copyLinkBtn =
        document.getElementById('copy-link-btn');

    dom.shareWhatsappBtn =
        document.getElementById('share-whatsapp-btn');

    dom.shareOtherBtn =
        document.getElementById('share-other-btn');

    dom.shareDownloadBtn =
        document.getElementById('share-download-btn');

    // Footer
    dom.footerYear =
        document.getElementById('footer-year');
}


/* ==========================================================================
   4. APPLICATION STATE
   ========================================================================== */

const STORAGE_KEY = 'digitalRakhi.designs';

const MAX_HISTORY_STATES = 25;

const state = {

    currentPage: 'home',

    isTransitioning: false,

    // Canvas
    ctx: null,

    isDrawing: false,

    currentTool: 'brush',

    currentColor: '#C21E6D',

    brushSize: 6,

    lastPoint: null,

    // Undo / redo
    history: [],

    historyIndex: -1,

    // Saved designs
    designs: [],

    selectedDesignId: null,

    // AI
    isGeneratingAI: false,

    lastAIResultDataUrl: null,
};


/* ==========================================================================
   5. NAVIGATION
   ========================================================================== */

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

        dom.startDesigningBtn.addEventListener(
            'click',
            () => navigateToPage('create')
        );
    }


    if (dom.aiCreateBtn) {

        dom.aiCreateBtn.addEventListener(
            'click',
            () => navigateToPage('ai-studio')
        );
    }
}


function navigateToPage(pageName) {

    if (state.isTransitioning) {
        return;
    }

    const targetSection =
        document.querySelector(
            `.page-section[data-page-id="${pageName}"]`
        );

    if (!targetSection) {

        console.warn(
            `Digital Rakhi: no page found for "${pageName}"`
        );

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

        runPageEnterHooks(pageName);

        if (dom.mainContent) {

            dom.mainContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

    }, TRANSITION_DELAY_MS);
}


function showPage(pageName) {

    dom.pageSections.forEach((section) => {

        const isTarget =
            section.dataset.pageId === pageName;

        section.classList.toggle(
            'active-page',
            isTarget
        );
    });
}


function setActiveNavItem(pageName) {

    dom.navItems.forEach((navButton) => {

        const isActive =
            navButton.dataset.page === pageName;

        navButton.classList.toggle(
            'active-nav-item',
            isActive
        );

        if (isActive) {

            navButton.setAttribute(
                'aria-current',
                'page'
            );

        } else {

            navButton.removeAttribute(
                'aria-current'
            );
        }
    });
}


function runPageEnterHooks(pageName) {

    if (pageName === 'my-designs') {
        renderDesignGrid();
    }

    if (pageName === 'share') {
        prepareSharePageForSelectedDesign();
    }
}


/* ==========================================================================
   6. RAKHI TRANSITION
   ========================================================================== */

function showRakhiTransition() {

    if (!dom.transitionOverlay) {
        return;
    }

    dom.transitionOverlay.removeAttribute('hidden');

    dom.transitionOverlay.setAttribute(
        'aria-hidden',
        'false'
    );

    void dom.transitionOverlay.offsetWidth;

    dom.transitionOverlay.classList.add(
        'transition-active'
    );
}


function hideRakhiTransition() {

    if (!dom.transitionOverlay) {
        return;
    }

    dom.transitionOverlay.classList.remove(
        'transition-active'
    );

    dom.transitionOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    window.setTimeout(() => {

        if (
            !dom.transitionOverlay.classList.contains(
                'transition-active'
            )
        ) {

            dom.transitionOverlay.setAttribute(
                'hidden',
                ''
            );
        }

    }, 400);
}


/* ==========================================================================
   7. CANVAS SETUP
   ========================================================================== */

function initCanvas() {

    if (!dom.canvas) {

        console.warn(
            'Digital Rakhi: #rakhi-canvas not found.'
        );

        return;
    }

    state.ctx =
        dom.canvas.getContext('2d');

    if (!state.ctx) {

        console.error(
            'Digital Rakhi: unable to acquire 2D drawing context.'
        );

        return;
    }

    fillCanvasBackground('#FFFDF9');

    saveHistoryState();

    attachCanvasEventListeners();

    createBrushControlsPanel();
}


function fillCanvasBackground(color) {

    if (!state.ctx) {
        return;
    }

    state.ctx.save();

    state.ctx.fillStyle = color;

    state.ctx.fillRect(
        0,
        0,
        dom.canvas.width,
        dom.canvas.height
    );

    state.ctx.restore();
}


function getCanvasCoordinates(event) {

    const rect =
        dom.canvas.getBoundingClientRect();

    const scaleX =
        dom.canvas.width / rect.width;

    const scaleY =
        dom.canvas.height / rect.height;

    return {

        x:
            (event.clientX - rect.left) *
            scaleX,

        y:
            (event.clientY - rect.top) *
            scaleY,
    };
}


/* ==========================================================================
   8. DRAWING
   ========================================================================== */

function attachCanvasEventListeners() {

    dom.canvas.addEventListener(
        'mousedown',
        handleDrawStart
    );

    dom.canvas.addEventListener(
        'mousemove',
        handleDrawMove
    );

    window.addEventListener(
        'mouseup',
        handleDrawEnd
    );

    dom.canvas.addEventListener(
        'mouseleave',
        handleDrawLeave
    );

    dom.canvas.addEventListener(
        'touchstart',
        handleTouchStart,
        { passive: false }
    );

    dom.canvas.addEventListener(
        'touchmove',
        handleTouchMove,
        { passive: false }
    );

    window.addEventListener(
        'touchend',
        handleDrawEnd
    );

    window.addEventListener(
        'touchcancel',
        handleDrawEnd
    );
}


function handleDrawStart(event) {

    beginStroke(
        getCanvasCoordinates(event)
    );
}


function handleDrawMove(event) {

    if (!state.isDrawing) {
        return;
    }

    continueStroke(
        getCanvasCoordinates(event)
    );
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

        beginStroke(
            getCanvasCoordinates(touch)
        );
    }
}


function handleTouchMove(event) {

    event.preventDefault();

    if (!state.isDrawing) {
        return;
    }

    const touch = event.touches[0];

    if (touch) {

        continueStroke(
            getCanvasCoordinates(touch)
        );
    }
}


function beginStroke(point) {

    if (!state.ctx) {
        return;
    }

    state.isDrawing = true;

    state.lastPoint = point;

    drawSegment(point, point);
}


function continueStroke(point) {

    if (
        !state.ctx ||
        !state.lastPoint
    ) {
        return;
    }

    drawSegment(
        state.lastPoint,
        point
    );

    state.lastPoint = point;
}


function endStroke() {

    state.isDrawing = false;

    state.lastPoint = null;

    saveHistoryState();
}


function drawSegment(from, to) {

    const ctx = state.ctx;

    ctx.save();

    ctx.lineJoin = 'round';

    ctx.lineCap = 'round';

    ctx.lineWidth = state.brushSize;

    if (state.currentTool === 'eraser') {

        ctx.globalCompositeOperation =
            'destination-out';

        ctx.strokeStyle =
            'rgba(0,0,0,1)';

    } else {

        ctx.globalCompositeOperation =
            'source-over';

        ctx.strokeStyle =
            state.currentColor;
    }

    ctx.beginPath();

    ctx.moveTo(
        from.x,
        from.y
    );

    ctx.lineTo(
        to.x,
        to.y
    );

    ctx.stroke();

    ctx.restore();
}


/* ==========================================================================
   9. TOOLBAR
   ========================================================================== */

function setupToolbar() {

    dom.toolButtons.forEach((button) => {

        button.addEventListener(
            'click',
            () => handleToolButtonClick(button)
        );
    });

    if (dom.undoBtn) {
        dom.undoBtn.addEventListener(
            'click',
            undo
        );
    }

    if (dom.redoBtn) {
        dom.redoBtn.addEventListener(
            'click',
            redo
        );
    }

    if (dom.clearBtn) {
        dom.clearBtn.addEventListener(
            'click',
            clearCanvasWithConfirmation
        );
    }

    if (dom.saveBtn) {
        dom.saveBtn.addEventListener(
            'click',
            saveCurrentDesign
        );
    }

    if (dom.exportBtn) {
        dom.exportBtn.addEventListener(
            'click',
            downloadCanvasAsPng
        );
    }
}


function handleToolButtonClick(button) {

    const tool = button.dataset.tool;

    if (
        tool === 'brush' ||
        tool === 'eraser'
    ) {

        selectDrawingTool(tool);

        return;
    }

    if (tool === 'colors') {

        toggleBrushControlsPanel();

        return;
    }

    showNotification(
        'This tool is coming soon to the Rakhi editor!',
        'info'
    );
}


function selectDrawingTool(tool) {

    state.currentTool = tool;

    dom.toolButtons.forEach((button) => {

        button.classList.toggle(
            'active-tool',
            button.dataset.tool === tool
        );
    });
}


function createBrushControlsPanel() {

    if (
        !dom.rakhiEditor ||
        document.getElementById(
            'brush-controls-panel'
        )
    ) {
        return;
    }

    const panel =
        document.createElement('div');

    panel.id =
        'brush-controls-panel';

    panel.className =
        'toolbar-group';

    panel.setAttribute(
        'hidden',
        ''
    );

    panel.setAttribute(
        'aria-label',
        'Brush color and size controls'
    );

    const swatchColors = [
        '#C21E6D',
        '#6B3FA0',
        '#FF7A30',
        '#D4A24C',
        '#E24B4B',
        '#2B1B2E',
        '#FFFFFF'
    ];

    swatchColors.forEach((color) => {

        const swatchBtn =
            document.createElement('button');

        swatchBtn.type =
            'button';

        swatchBtn.className =
            'color-swatch-btn';

        swatchBtn.style.background =
            color;

        swatchBtn.setAttribute(
            'aria-label',
            `Set brush color to ${color}`
        );

        swatchBtn.addEventListener(
            'click',
            () => setCurrentColor(color)
        );

        panel.appendChild(
            swatchBtn
        );
    });

    const customColorInput =
        document.createElement('input');

    customColorInput.type =
        'color';

    customColorInput.id =
        'custom-color-input';

    customColorInput.value =
        state.currentColor;

    customColorInput.addEventListener(
        'input',
        (event) =>
            setCurrentColor(
                event.target.value
            )
    );

    panel.appendChild(
        customColorInput
    );

    const brushSizeLabel =
        document.createElement('label');

    brushSizeLabel.setAttribute(
        'for',
        'brush-size-input'
    );

    brushSizeLabel.textContent =
        'Size';

    brushSizeLabel.className =
        'tool-label';

    panel.appendChild(
        brushSizeLabel
    );

    const brushSizeInput =
        document.createElement('input');

    brushSizeInput.type =
        'range';

    brushSizeInput.id =
        'brush-size-input';

    brushSizeInput.min = '2';

    brushSizeInput.max = '40';

    brushSizeInput.value =
        String(state.brushSize);

    brushSizeInput.addEventListener(
        'input',
        (event) =>
            setBrushSize(
                Number(event.target.value)
            )
    );

    panel.appendChild(
        brushSizeInput
    );

    dom.rakhiEditor.insertBefore(
        panel,
        dom.rakhiEditor.lastElementChild
    );
}


function toggleBrushControlsPanel() {

    const panel =
        document.getElementById(
            'brush-controls-panel'
        );

    if (!panel) {
        return;
    }

    panel.toggleAttribute(
        'hidden'
    );
}


function setCurrentColor(color) {

    state.currentColor = color;

    selectDrawingTool('brush');
}


function setBrushSize(size) {

    if (
        Number.isFinite(size) &&
        size > 0
    ) {

        state.brushSize = size;
    }
}


/* ==========================================================================
   10. UNDO / REDO
   ========================================================================== */

function saveHistoryState() {

    if (!dom.canvas) {
        return;
    }

    const snapshot =
        dom.canvas.toDataURL(
            'image/png'
        );

    state.history =
        state.history.slice(
            0,
            state.historyIndex + 1
        );

    state.history.push(
        snapshot
    );

    if (
        state.history.length >
        MAX_HISTORY_STATES
    ) {

        state.history.shift();
    }

    state.historyIndex =
        state.history.length - 1;
}


function restoreCanvasFromSnapshot(dataUrl) {

    const image =
        new Image();

    image.onload = () => {

        if (!state.ctx) {
            return;
        }

        state.ctx.clearRect(
            0,
            0,
            dom.canvas.width,
            dom.canvas.height
        );

        state.ctx.drawImage(
            image,
            0,
            0,
            dom.canvas.width,
            dom.canvas.height
        );
    };

    image.onerror = () => {

        showNotification(
            'Could not restore that step of your drawing.',
            'error'
        );
    };

    image.src = dataUrl;
}


function undo() {

    if (state.historyIndex <= 0) {

        showNotification(
            'Nothing to undo yet.',
            'info'
        );

        return;
    }

    state.historyIndex -= 1;

    restoreCanvasFromSnapshot(
        state.history[
            state.historyIndex
        ]
    );
}


function redo() {

    if (
        state.historyIndex >=
        state.history.length - 1
    ) {

        showNotification(
            'Nothing to redo.',
            'info'
        );

        return;
    }

    state.historyIndex += 1;

    restoreCanvasFromSnapshot(
        state.history[
            state.historyIndex
        ]
    );
}


function clearCanvasWithConfirmation() {

    const confirmed =
        window.confirm(
            'Clear the entire canvas?'
        );

    if (!confirmed) {
        return;
    }

    fillCanvasBackground(
        '#FFFDF9'
    );

    saveHistoryState();

    showNotification(
        'Canvas cleared.',
        'info'
    );
}


/* ==========================================================================
   11. SAVE / LOAD DESIGNS
   ========================================================================== */

function loadDesignsFromStorage() {

    try {

        const raw =
            window.localStorage.getItem(
                STORAGE_KEY
            );

        state.designs =
            raw
                ? JSON.parse(raw)
                : [];

    } catch (error) {

        console.error(
            'Digital Rakhi: failed to load saved designs.',
            error
        );

        state.designs = [];

        showNotification(
            'Could not load your saved designs.',
            'error'
        );
    }

    return state.designs;
}


function persistDesignsToStorage() {

    try {

        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                state.designs
            )
        );

        return true;

    } catch (error) {

        console.error(
            'Digital Rakhi: failed to save designs.',
            error
        );

        showNotification(
            'Could not save your design. Storage may be full.',
            'error'
        );

        return false;
    }
}


function saveCurrentDesign() {

    if (!dom.canvas) {

        showNotification(
            'No canvas available to save.',
            'error'
        );

        return;
    }

    try {

        const design = {

            id: generateId(),

            name:
                `My Rakhi ${state.designs.length + 1}`,

            date:
                new Date().toISOString(),

            image:
                dom.canvas.toDataURL(
                    'image/png'
                ),
        };

        state.designs.unshift(
            design
        );

        if (
            persistDesignsToStorage()
        ) {

            showNotification(
                'Your Rakhi has been saved! 💾',
                'success'
            );
        }

    } catch (error) {

        console.error(
            'Digital Rakhi: error while saving design.',
            error
        );

        showNotification(
            'Something went wrong while saving your design.',
            'error'
        );
    }
}


/* ==========================================================================
   12. MY DESIGNS
   ========================================================================== */

function renderDesignGrid() {

    if (!dom.designGrid) {
        return;
    }

    loadDesignsFromStorage();

    const existingCards =
        dom.designGrid.querySelectorAll(
            '.design-card'
        );

    existingCards.forEach(
        (card) => card.remove()
    );

    const hasDesigns =
        state.designs.length > 0;

    if (dom.designGridEmptyState) {

        dom.designGridEmptyState.hidden =
            hasDesigns;
    }

    if (!hasDesigns) {
        return;
    }

    state.designs.forEach(
        (design) => {

            const card =
                createDesignCardElement(
                    design
                );

            dom.designGrid.appendChild(
                card
            );
        }
    );
}


function createDesignCardElement(design) {

    const card =
        document.createElement(
            'article'
        );

    card.className =
        'design-card';

    card.dataset.designId =
        design.id;

    card.setAttribute(
        'role',
        'listitem'
    );


    const thumbnail =
        document.createElement(
            'img'
        );

    thumbnail.className =
        'design-card-thumbnail';

    thumbnail.src =
        design.image;

    thumbnail.alt =
        `Preview of ${design.name}`;


    const title =
        document.createElement(
            'h3'
        );

    title.className =
        'design-card-title';

    title.textContent =
        design.name;


    const dateLabel =
        document.createElement(
            'p'
        );

    dateLabel.className =
        'design-card-date';

    dateLabel.textContent =
        formatDate(
            design.date
        );


    const actions =
        document.createElement(
            'div'
        );

    actions.className =
        'design-card-actions';


    const openBtn =
        document.createElement(
            'button'
        );

    openBtn.type =
        'button';

    openBtn.className =
        'design-open-btn';

    openBtn.textContent =
        'Open';

    openBtn.addEventListener(
        'click',
        () =>
            openDesignInEditor(
                design.id
            )
    );


    const editBtn =
        document.createElement(
            'button'
        );

    editBtn.type =
        'button';

    editBtn.className =
        'design-edit-btn';

    editBtn.textContent =
        'Edit';

    editBtn.addEventListener(
        'click',
        () =>
            openDesignInEditor(
                design.id
            )
    );


    const deleteBtn =
        document.createElement(
            'button'
        );

    deleteBtn.type =
        'button';

    deleteBtn.className =
        'design-delete-btn';

    deleteBtn.textContent =
        'Delete';

    deleteBtn.addEventListener(
        'click',
        () =>
            deleteDesign(
                design.id
            )
    );


    const shareBtn =
        document.createElement(
            'button'
        );

    shareBtn.type =
        'button';

    shareBtn.className =
        'design-share-btn';

    shareBtn.textContent =
        'Share';

    shareBtn.addEventListener(
        'click',
        () => {

            state.selectedDesignId =
                design.id;

            navigateToPage(
                'share'
            );
        }
    );


    actions.append(
        openBtn,
        editBtn,
        deleteBtn,
        shareBtn
    );

    card.append(
        thumbnail,
        title,
        dateLabel,
        actions
    );

    return card;
}


function deleteDesign(designId) {

    const confirmed =
        window.confirm(
            'Delete this Rakhi design?'
        );

    if (!confirmed) {
        return;
    }

    state.designs =
        state.designs.filter(
            (design) =>
                design.id !== designId
        );

    if (
        persistDesignsToStorage()
    ) {

        showNotification(
            'Design deleted.',
            'info'
        );

        renderDesignGrid();
    }
}


function openDesignInEditor(designId) {

    const design =
        state.designs.find(
            (item) =>
                item.id === designId
        );

    if (!design) {

        showNotification(
            'That design could not be found.',
            'error'
        );

        return;
    }

    state.selectedDesignId =
        designId;

    navigateToPage(
        'create'
    );

    window.setTimeout(
        () => {

            restoreCanvasFromSnapshot(
                design.image
            );

            saveHistoryState();

        },
        950
    );
}


/* ==========================================================================
   13. REAL AI STUDIO
   ========================================================================== */

/*
 * Connects the AI Studio form to the Flask backend.
 */

function setupAIStudio() {

    if (dom.aiPromptForm) {

        dom.aiPromptForm.addEventListener(
            'submit',
            handleAIGenerateSubmit
        );
    }


    dom.aiExampleButtons.forEach(
        (button) => {

            button.addEventListener(
                'click',
                () => {

                    if (dom.aiPromptInput) {

                        dom.aiPromptInput.value =
                            button.dataset.prompt ||
                            button.textContent.trim();

                        dom.aiPromptInput.focus();
                    }
                }
            );
        }
    );


    if (dom.aiOpenInEditorBtn) {

        dom.aiOpenInEditorBtn.addEventListener(
            'click',
            openAIResultInEditor
        );
    }
}


/*
 * Called when the user clicks:
 *
 * Generate Design
 */

async function handleAIGenerateSubmit(event) {

    event.preventDefault();

    const prompt =
        dom.aiPromptInput
            ? dom.aiPromptInput.value.trim()
            : '';


    // Validate prompt
    if (!prompt) {

        showAIError(
            'Please describe the Rakhi you would like AI to create.'
        );

        return;
    }


    // Prevent duplicate requests
    if (state.isGeneratingAI) {
        return;
    }


    setAILoadingState(true);

    hideAIError();

    hideAIResult();


    try {

        /*
         * Send the prompt to Flask.
         */
        const resultImageUrl =
            await generateAIRakhi(
                prompt
            );


        /*
         * Display the generated image.
         */
        showAIResult(
            resultImageUrl
        );


    } catch (error) {

        console.error(
            'Digital Rakhi: AI generation failed.',
            error
        );


        showAIError(
            error.message ||
            'We could not generate a design right now. Please try again.'
        );


    } finally {

        setAILoadingState(false);
    }
}


/*
 * REAL BACKEND REQUEST
 *
 * Frontend
 *    ↓
 * POST /generate
 *    ↓
 * Flask app.py
 *    ↓
 * ai_generator.py
 *    ↓
 * AI provider
 *    ↓
 * image_url
 */

async function generateAIRakhi(prompt) {

    state.isGeneratingAI = true;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/generate`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json',
                    },

                    body: JSON.stringify({
                        prompt: prompt,
                    }),
                }
            );


        /*
         * Try to read JSON regardless of HTTP status.
         */
        let data;

        try {

            data =
                await response.json();

        } catch (jsonError) {

            throw new Error(
                'The backend returned an invalid response.'
            );
        }


        /*
         * Backend returned an error.
         */
        if (!response.ok || !data.success) {

            throw new Error(
                data.error ||
                `Image generation failed (${response.status}).`
            );
        }


        /*
         * Make sure image_url exists.
         */
        if (!data.image_url) {

            throw new Error(
                'The backend did not return an image URL.'
            );
        }


        /*
         * Return image URL to showAIResult().
         */
        return normalizeImageUrl(
            data.image_url
        );


    } finally {

        state.isGeneratingAI = false;
    }
}


/*
 * Converts backend image paths into browser-usable URLs.
 *
 * Examples:
 *
 * Backend returns:
 *
 * /static/generated/rakhi.png
 *
 * Result:
 *
 * http://127.0.0.1:5000/static/generated/rakhi.png
 *
 *
 * If backend already returns:
 *
 * http://127.0.0.1:5000/...
 *
 * it is left unchanged.
 */

function normalizeImageUrl(imageUrl) {

    if (!imageUrl) {
        return '';
    }


    /*
     * Already a complete URL.
     */
    if (
        imageUrl.startsWith('http://') ||
        imageUrl.startsWith('https://') ||
        imageUrl.startsWith('data:')
    ) {

        return imageUrl;
    }


    /*
     * Backend returned a root-relative path.
     */
    if (imageUrl.startsWith('/')) {

        return `${API_BASE_URL}${imageUrl}`;
    }


    /*
     * Backend returned something like:
     *
     * static/generated/image.png
     *
     * or:
     *
     * generated/image.png
     */

    return `${API_BASE_URL}/${imageUrl}`;
}


/* ==========================================================================
   14. AI UI STATE
   ========================================================================== */

function setAILoadingState(isLoading) {

    if (dom.aiLoadingState) {

        dom.aiLoadingState.hidden =
            !isLoading;
    }

    if (dom.aiGenerateBtn) {

        dom.aiGenerateBtn.disabled =
            isLoading;
    }

    if (dom.aiPromptInput) {

        dom.aiPromptInput.disabled =
            isLoading;
    }
}


function showAIError(message) {

    if (dom.aiErrorText) {

        dom.aiErrorText.textContent =
            message;
    }

    if (dom.aiErrorMessage) {

        dom.aiErrorMessage.hidden =
            false;
    }
}


function hideAIError() {

    if (dom.aiErrorMessage) {

        dom.aiErrorMessage.hidden =
            true;
    }
}


function showAIResult(imageUrl) {

    state.lastAIResultDataUrl =
        imageUrl;


    if (dom.aiGeneratedImage) {

        dom.aiGeneratedImage.src =
            imageUrl;

        dom.aiGeneratedImage.hidden =
            false;
    }


    if (dom.aiGeneratedResult) {

        dom.aiGeneratedResult.hidden =
            false;
    }
}


function hideAIResult() {

    if (dom.aiGeneratedResult) {

        dom.aiGeneratedResult.hidden =
            true;
    }
}


/* ==========================================================================
   15. OPEN AI RESULT IN EDITOR
   ========================================================================== */

function openAIResultInEditor() {

    if (!state.lastAIResultDataUrl) {

        showNotification(
            'Generate a design first.',
            'info'
        );

        return;
    }


    navigateToPage(
        'create'
    );


    window.setTimeout(
        () => {

            const image =
                new Image();


            image.crossOrigin =
                'anonymous';


            image.onload = () => {

                if (!state.ctx) {
                    return;
                }


                state.ctx.clearRect(
                    0,
                    0,
                    dom.canvas.width,
                    dom.canvas.height
                );


                state.ctx.drawImage(
                    image,
                    0,
                    0,
                    dom.canvas.width,
                    dom.canvas.height
                );


                saveHistoryState();
            };


            image.onerror = () => {

                showNotification(
                    'Could not load the AI-generated image into the editor.',
                    'error'
                );
            };


            image.src =
                state.lastAIResultDataUrl;

        },
        950
    );
}


/* ==========================================================================
   16. SHARING
   ========================================================================== */

function setupSharePage() {

    if (dom.copyLinkBtn) {

        dom.copyLinkBtn.addEventListener(
            'click',
            copyShareLink
        );
    }


    if (dom.shareWhatsappBtn) {

        dom.shareWhatsappBtn.addEventListener(
            'click',
            shareViaWhatsApp
        );
    }


    if (dom.shareOtherBtn) {

        dom.shareOtherBtn.addEventListener(
            'click',
            shareViaWebShareOrCopy
        );
    }


    if (dom.shareDownloadBtn) {

        dom.shareDownloadBtn.addEventListener(
            'click',
            downloadCanvasAsPng
        );
    }
}


function prepareSharePageForSelectedDesign() {

    let imageSource = null;


    const selectedDesign =
        state.designs.find(
            (design) =>
                design.id ===
                state.selectedDesignId
        );


    if (selectedDesign) {

        imageSource =
            selectedDesign.image;

    } else if (dom.canvas) {

        imageSource =
            dom.canvas.toDataURL(
                'image/png'
            );
    }


    if (
        imageSource &&
        dom.sharePreviewImage
    ) {

        dom.sharePreviewImage.src =
            imageSource;

        dom.sharePreviewImage.hidden =
            false;
    }


    if (dom.shareLinkInput) {

        const shareId =
            state.selectedDesignId ||
            generateId();

        dom.shareLinkInput.value =
            `https://digitalrakhi.app/r/${shareId}`;
    }


    if (
        dom.shareMessageInput &&
        !dom.shareMessageInput.value
    ) {

        dom.shareMessageInput.value =
            'Happy Raksha Bandhan! ❤️';
    }
}


async function copyShareLink() {

    const link =
        dom.shareLinkInput
            ? dom.shareLinkInput.value
            : '';


    if (!link) {

        showNotification(
            'There is no share link to copy yet.',
            'error'
        );

        return;
    }


    try {

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            await navigator.clipboard.writeText(
                link
            );

        } else {

            dom.shareLinkInput.select();

            document.execCommand(
                'copy'
            );
        }


        showNotification(
            'Rakhi link copied! ❤️',
            'success'
        );


    } catch (error) {

        console.error(
            'Digital Rakhi: clipboard copy failed.',
            error
        );

        showNotification(
            'Could not copy the link. Please copy it manually.',
            'error'
        );
    }
}


function shareViaWhatsApp() {

    const link =
        dom.shareLinkInput
            ? dom.shareLinkInput.value
            : '';


    const message =
        dom.shareMessageInput
            ? dom.shareMessageInput.value
            : 'Happy Raksha Bandhan! ❤️';


    const text =
        encodeURIComponent(
            `${message} ${link}`.trim()
        );


    const whatsappUrl =
        `https://wa.me/?text=${text}`;


    window.open(
        whatsappUrl,
        '_blank',
        'noopener,noreferrer'
    );
}


async function shareViaWebShareOrCopy() {

    const link =
        dom.shareLinkInput
            ? dom.shareLinkInput.value
            : '';


    const message =
        dom.shareMessageInput
            ? dom.shareMessageInput.value
            : 'Happy Raksha Bandhan! ❤️';


    if (navigator.share) {

        try {

            await navigator.share({

                title:
                    'Digital Rakhi',

                text:
                    message,

                url:
                    link,
            });

            return;

        } catch (error) {

            console.info(
                'Digital Rakhi: native share dismissed or failed.',
                error
            );

            return;
        }
    }


    await copyShareLink();
}


/* ==========================================================================
   17. DOWNLOAD
   ========================================================================== */

function downloadCanvasAsPng() {

    if (!dom.canvas) {

        showNotification(
            'No canvas available to export.',
            'error'
        );

        return;
    }


    try {

        const dataUrl =
            dom.canvas.toDataURL(
                'image/png'
            );


        const downloadLink =
            document.createElement('a');


        downloadLink.href =
            dataUrl;


        downloadLink.download =
            'my-digital-rakhi.png';


        document.body.appendChild(
            downloadLink
        );


        downloadLink.click();


        document.body.removeChild(
            downloadLink
        );


        showNotification(
            'Your Rakhi is downloading! ⬇️',
            'success'
        );


    } catch (error) {

        console.error(
            'Digital Rakhi: failed to export canvas as PNG.',
            error
        );


        showNotification(
            'Could not export your design.',
            'error'
        );
    }
}


/* ==========================================================================
   18. NOTIFICATIONS
   ========================================================================== */

const NOTIFICATION_CONTAINER_ID =
    'notification-container';

const NOTIFICATION_DURATION_MS =
    3200;


function getOrCreateNotificationContainer() {

    let container =
        document.getElementById(
            NOTIFICATION_CONTAINER_ID
        );


    if (!container) {

        container =
            document.createElement(
                'div'
            );

        container.id =
            NOTIFICATION_CONTAINER_ID;

        container.setAttribute(
            'aria-live',
            'polite'
        );

        container.setAttribute(
            'role',
            'status'
        );

        document.body.appendChild(
            container
        );
    }


    return container;
}


function showNotification(
    message,
    type = 'info'
) {

    const container =
        getOrCreateNotificationContainer();


    const toast =
        document.createElement(
            'div'
        );


    toast.className =
        `notification-toast notification-${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    window.setTimeout(
        () => {

            toast.classList.add(
                'notification-hide'
            );


            window.setTimeout(
                () => toast.remove(),
                300
            );

        },
        NOTIFICATION_DURATION_MS
    );
}


/* ==========================================================================
   19. KEYBOARD SHORTCUTS
   ========================================================================== */

function setupKeyboardShortcuts() {

    document.addEventListener(
        'keydown',
        (event) => {

            const isModifierPressed =
                event.ctrlKey ||
                event.metaKey;


            if (
                isModifierPressed &&
                !event.shiftKey &&
                event.key.toLowerCase() === 'z'
            ) {

                event.preventDefault();

                undo();

                return;
            }


            if (
                isModifierPressed &&
                event.shiftKey &&
                event.key.toLowerCase() === 'z'
            ) {

                event.preventDefault();

                redo();

                return;
            }


            if (
                event.key === 'Escape' &&
                state.isTransitioning
            ) {

                hideRakhiTransition();

                state.isTransitioning =
                    false;
            }
        }
    );
}


/* ==========================================================================
   20. UTILITIES
   ========================================================================== */

function generateId() {

    return (
        `rakhi-${Date.now()}-` +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );
}


function formatDate(isoDateString) {

    try {

        const date =
            new Date(
                isoDateString
            );


        return date.toLocaleDateString(
            undefined,
            {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }
        );

    } catch (error) {

        return '';
    }
}


function setFooterYear() {

    if (dom.footerYear) {

        dom.footerYear.textContent =
            String(
                new Date().getFullYear()
            );
    }
}


/* ==========================================================================
   21. INITIALIZATION
   ========================================================================== */

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


        /*
         * Start on Home.
         */
        showPage('home');

        setActiveNavItem('home');


        console.log(
            'Digital Rakhi frontend initialized.'
        );

        console.log(
            `AI backend: ${API_BASE_URL}`
        );


    } catch (error) {

        console.error(
            'Digital Rakhi: failed to initialize application.',
            error
        );
    }
}


document.addEventListener(
    'DOMContentLoaded',
    initializeApp
);