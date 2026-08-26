/* ==========================================================================
   DIGITAL RAKHI — script.js
   ==========================================================================

   Features:
   - SPA navigation
   - Canvas drawing
   - Eraser
   - Colors
   - Shapes
   - Text
   - Rakhi Elements
   - Undo / Redo
   - Save / Load designs
   - Export PNG
   - AI Studio
   - Share
   ========================================================================== */


/* ==========================================================================
   1. BACKEND CONFIGURATION
   ========================================================================== */

const API_BASE_URL = 'http://127.0.0.1:5000';


/* ==========================================================================
   2. DOM REFERENCES
   ========================================================================== */

const dom = {

    navItems: null,
    sidebar: null,

    transitionOverlay: null,
    transitionRakhiImage: null,

    pageSections: null,
    mainContent: null,

    startDesigningBtn: null,
    aiCreateBtn: null,

    rakhiEditor: null,
    canvas: null,

    toolButtons: null,

    undoBtn: null,
    redoBtn: null,
    clearBtn: null,
    saveBtn: null,
    exportBtn: null,

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

    designGrid: null,
    designGridEmptyState: null,

    sharePreviewImage: null,
    shareMessageInput: null,
    shareLinkInput: null,

    copyLinkBtn: null,
    shareWhatsappBtn: null,
    shareOtherBtn: null,
    shareDownloadBtn: null,

    footerYear: null
};


/* ==========================================================================
   3. APPLICATION STATE
   ========================================================================== */

const STORAGE_KEY = 'digitalRakhi.designs';

const MAX_HISTORY_STATES = 30;

const state = {

    currentPage: 'home',

    isTransitioning: false,

    /* Canvas */
    ctx: null,

    isDrawing: false,

    currentTool: 'brush',

    currentColor: '#C21E6D',

    brushSize: 6,

    lastPoint: null,

    /* Shape */
    selectedShape: null,

    isShapeDrawing: false,

    shapeStartPoint: null,

    previewSnapshot: null,

    /* Text */
    textSize: 32,

    /* Rakhi element */
    selectedRakhiElement: null,

    /* History */
    history: [],

    historyIndex: -1,

    /* Saved designs */
    designs: [],

    selectedDesignId: null,

    /* AI */
    isGeneratingAI: false,

    lastAIResultDataUrl: null
};


/* ==========================================================================
   4. CACHE DOM
   ========================================================================== */

function cacheDomReferences() {

    dom.navItems =
        document.querySelectorAll('.nav-item');

    dom.sidebar =
        document.getElementById('sidebar');

    dom.transitionOverlay =
        document.getElementById('rakhi-transition');

    dom.transitionRakhiImage =
        document.getElementById('transition-rakhi');

    dom.pageSections =
        document.querySelectorAll('.page-section');

    dom.mainContent =
        document.getElementById('main-content');

    dom.startDesigningBtn =
        document.getElementById('start-designing-btn');

    dom.aiCreateBtn =
        document.getElementById('ai-create-btn');

    dom.rakhiEditor =
        document.getElementById('rakhi-editor');

    dom.canvas =
        document.getElementById('rakhi-canvas');

    dom.toolButtons =
        document.querySelectorAll('.tool-btn[data-tool]');

    dom.undoBtn =
        document.getElementById('tool-undo');

    dom.redoBtn =
        document.getElementById('tool-redo');

    dom.clearBtn =
        document.getElementById('tool-clear');

    dom.saveBtn =
        document.getElementById('tool-save');

    dom.exportBtn =
        document.getElementById('tool-export');

    dom.aiPromptForm =
        document.getElementById('ai-prompt-form');

    dom.aiPromptInput =
        document.getElementById('ai-prompt-input');

    dom.aiGenerateBtn =
        document.getElementById('ai-generate-btn');

    dom.aiExampleButtons =
        document.querySelectorAll('.ai-example-btn');

    dom.aiLoadingState =
        document.getElementById('ai-loading-state');

    dom.aiErrorMessage =
        document.getElementById('ai-error-message');

    dom.aiErrorText =
        document.getElementById('ai-error-text');

    dom.aiGeneratedResult =
        document.getElementById('ai-generated-result');

    dom.aiGeneratedImage =
        document.getElementById('ai-generated-image');

    dom.aiOpenInEditorBtn =
        document.getElementById('ai-open-in-editor-btn');

    dom.designGrid =
        document.getElementById('design-grid');

    dom.designGridEmptyState =
        document.getElementById('design-grid-empty-state');

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

    dom.footerYear =
        document.getElementById('footer-year');
}


/* ==========================================================================
   5. NAVIGATION
   ========================================================================== */

function setupNavigation() {

    dom.navItems.forEach(button => {

        button.addEventListener('click', event => {

            event.preventDefault();

            const page =
                button.dataset.page;

            if (page) {
                navigateToPage(page);
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

    const target =
        document.querySelector(
            `.page-section[data-page-id="${pageName}"]`
        );

    if (!target) {
        console.warn(`Page not found: ${pageName}`);
        return;
    }

    state.isTransitioning = true;

    showRakhiTransition();

    setTimeout(() => {

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

    }, 900);
}


function showPage(pageName) {

    dom.pageSections.forEach(section => {

        section.classList.toggle(
            'active-page',
            section.dataset.pageId === pageName
        );
    });
}


function setActiveNavItem(pageName) {

    dom.navItems.forEach(button => {

        const active =
            button.dataset.page === pageName;

        button.classList.toggle(
            'active-nav-item',
            active
        );

        if (active) {

            button.setAttribute(
                'aria-current',
                'page'
            );

        } else {

            button.removeAttribute(
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
   6. TRANSITION
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

    setTimeout(() => {

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
   7. CANVAS INITIALIZATION
   ========================================================================== */

function initCanvas() {

    if (!dom.canvas) {

        console.warn(
            'Canvas #rakhi-canvas not found.'
        );

        return;
    }

    state.ctx =
        dom.canvas.getContext('2d');

    if (!state.ctx) {

        console.error(
            'Could not create canvas context.'
        );

        return;
    }

    fillCanvasBackground('#FFFDF9');

    saveHistoryState();

    attachCanvasEventListeners();

    createBrushControlsPanel();

    createShapePanel();

    createTextPanel();

    createRakhiElementsPanel();

    selectDrawingTool('brush');
}


function fillCanvasBackground(color) {

    if (!state.ctx) {
        return;
    }

    state.ctx.save();

    state.ctx.globalCompositeOperation =
        'source-over';

    state.ctx.fillStyle =
        color;

    state.ctx.fillRect(
        0,
        0,
        dom.canvas.width,
        dom.canvas.height
    );

    state.ctx.restore();
}


/* ==========================================================================
   8. CANVAS COORDINATES
   ========================================================================== */

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
            scaleY
    };
}


/* ==========================================================================
   9. CANVAS EVENTS
   ========================================================================== */

function attachCanvasEventListeners() {

    dom.canvas.addEventListener(
        'mousedown',
        handlePointerDown
    );

    dom.canvas.addEventListener(
        'mousemove',
        handlePointerMove
    );

    window.addEventListener(
        'mouseup',
        handlePointerUp
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
        handlePointerUp
    );

    window.addEventListener(
        'touchcancel',
        handlePointerUp
    );
}


function handlePointerDown(event) {

    const point =
        getCanvasCoordinates(event);

    handleCanvasActionStart(point);
}


function handlePointerMove(event) {

    const point =
        getCanvasCoordinates(event);

    handleCanvasActionMove(point);
}


function handlePointerUp() {

    handleCanvasActionEnd();
}


function handleTouchStart(event) {

    event.preventDefault();

    const touch =
        event.touches[0];

    if (!touch) {
        return;
    }

    handleCanvasActionStart(
        getCanvasCoordinates(touch)
    );
}


function handleTouchMove(event) {

    event.preventDefault();

    const touch =
        event.touches[0];

    if (!touch) {
        return;
    }

    handleCanvasActionMove(
        getCanvasCoordinates(touch)
    );
}


function handleCanvasActionStart(point) {

    /* Brush / eraser */

    if (
        state.currentTool === 'brush' ||
        state.currentTool === 'eraser'
    ) {

        beginStroke(point);

        return;
    }


    /* Shape */

    if (
        state.currentTool === 'shapes' &&
        state.selectedShape
    ) {

        startShape(point);

        return;
    }


    /* Text */

    if (
        state.currentTool === 'text'
    ) {

        placeText(point);

        return;
    }


    /* Rakhi element */

    if (
        state.currentTool === 'rakhi-elements' &&
        state.selectedRakhiElement
    ) {

        placeRakhiElement(
            state.selectedRakhiElement,
            point
        );

        return;
    }
}


function handleCanvasActionMove(point) {

    if (
        state.currentTool === 'brush' ||
        state.currentTool === 'eraser'
    ) {

        if (state.isDrawing) {
            continueStroke(point);
        }

        return;
    }


    if (
        state.currentTool === 'shapes' &&
        state.isShapeDrawing
    ) {

        previewShape(point);
    }
}


function handleCanvasActionEnd() {

    if (
        state.currentTool === 'brush' ||
        state.currentTool === 'eraser'
    ) {

        endStroke();

        return;
    }


    if (
        state.currentTool === 'shapes' &&
        state.isShapeDrawing
    ) {

        finishShape();

        return;
    }
}


/* ==========================================================================
   10. BRUSH + ERASER
   ========================================================================== */

function beginStroke(point) {

    if (!state.ctx) {
        return;
    }

    state.isDrawing = true;

    state.lastPoint = point;

    drawSegment(
        point,
        point
    );
}


function continueStroke(point) {

    if (
        !state.isDrawing ||
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

    if (!state.isDrawing) {
        return;
    }

    state.isDrawing = false;

    state.lastPoint = null;

    saveHistoryState();
}


function drawSegment(from, to) {

    const ctx =
        state.ctx;

    ctx.save();

    ctx.lineJoin =
        'round';

    ctx.lineCap =
        'round';

    ctx.lineWidth =
        state.brushSize;


    if (
        state.currentTool === 'eraser'
    ) {

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
   11. TOOLBAR
   ========================================================================== */

function setupToolbar() {

    dom.toolButtons.forEach(button => {

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

    const tool =
        button.dataset.tool;


    if (
        tool === 'brush' ||
        tool === 'eraser'
    ) {

        selectDrawingTool(tool);

        hideAllEditorPanels();

        return;
    }


    if (tool === 'colors') {

        selectDrawingTool('brush');

        toggleEditorPanel(
            'brush-controls-panel'
        );

        return;
    }


    if (tool === 'shapes') {

        selectDrawingTool('shapes');

        toggleEditorPanel(
            'shape-controls-panel'
        );

        return;
    }


    if (tool === 'text') {

        selectDrawingTool('text');

        toggleEditorPanel(
            'text-controls-panel'
        );

        return;
    }


    if (tool === 'rakhi-elements') {

        selectDrawingTool(
            'rakhi-elements'
        );

        toggleEditorPanel(
            'rakhi-elements-panel'
        );

        return;
    }
}


function selectDrawingTool(tool) {

    state.currentTool =
        tool;

    dom.toolButtons.forEach(button => {

        button.classList.toggle(
            'active-tool',
            button.dataset.tool === tool
        );
    });
}


function hideAllEditorPanels() {

    const panels = [

        'brush-controls-panel',
        'shape-controls-panel',
        'text-controls-panel',
        'rakhi-elements-panel'
    ];

    panels.forEach(id => {

        const panel =
            document.getElementById(id);

        if (panel) {
            panel.setAttribute(
                'hidden',
                ''
            );
        }
    });
}


function toggleEditorPanel(id) {

    const panel =
        document.getElementById(id);

    if (!panel) {
        return;
    }

    const wasHidden =
        panel.hasAttribute('hidden');

    hideAllEditorPanels();

    if (wasHidden) {
        panel.removeAttribute('hidden');
    }
}


/* ==========================================================================
   12. COLORS
   ========================================================================== */

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
        'toolbar-group editor-control-panel';

    panel.setAttribute(
        'hidden',
        ''
    );


    const colors = [

        '#C21E6D',
        '#6B3FA0',
        '#FF7A30',
        '#D4A24C',
        '#E24B4B',
        '#2B1B2E',
        '#FF4FA3',
        '#FFD700',
        '#2E86DE',
        '#FFFFFF'
    ];


    colors.forEach(color => {

        const button =
            document.createElement('button');

        button.type =
            'button';

        button.className =
            'color-swatch-btn';

        button.style.background =
            color;

        button.title =
            color;

        button.addEventListener(
            'click',
            () => setCurrentColor(color)
        );

        panel.appendChild(
            button
        );
    });


    const customColor =
        document.createElement('input');

    customColor.type =
        'color';

    customColor.value =
        state.currentColor;

    customColor.title =
        'Custom color';

    customColor.addEventListener(
        'input',
        event =>
            setCurrentColor(
                event.target.value
            )
    );


    panel.appendChild(
        customColor
    );


    const sizeLabel =
        document.createElement('label');

    sizeLabel.textContent =
        'Brush Size';

    sizeLabel.className =
        'tool-label';


    const sizeInput =
        document.createElement('input');

    sizeInput.type =
        'range';

    sizeInput.min =
        '2';

    sizeInput.max =
        '50';

    sizeInput.value =
        state.brushSize;


    sizeInput.addEventListener(
        'input',
        event =>
            setBrushSize(
                Number(event.target.value)
            )
    );


    panel.appendChild(
        sizeLabel
    );

    panel.appendChild(
        sizeInput
    );


    dom.rakhiEditor.appendChild(
        panel
    );
}


function setCurrentColor(color) {

    state.currentColor =
        color;

    selectDrawingTool('brush');
}


function setBrushSize(size) {

    if (
        Number.isFinite(size) &&
        size >= 1
    ) {

        state.brushSize =
            size;
    }
}


/* ==========================================================================
   13. SHAPES
   ========================================================================== */

function createShapePanel() {

    if (
        !dom.rakhiEditor ||
        document.getElementById(
            'shape-controls-panel'
        )
    ) {
        return;
    }


    const panel =
        document.createElement('div');

    panel.id =
        'shape-controls-panel';

    panel.className =
        'toolbar-group editor-control-panel';

    panel.setAttribute(
        'hidden',
        ''
    );


    const title =
        document.createElement('span');

    title.className =
        'tool-label';

    title.textContent =
        'Choose Shape';


    panel.appendChild(
        title
    );


    const shapes = [

        ['circle', '⭕ Circle'],
        ['rectangle', '▭ Rectangle'],
        ['triangle', '△ Triangle'],
        ['diamond', '◇ Diamond'],
        ['star', '⭐ Star']
    ];


    shapes.forEach(([type, label]) => {

        const button =
            document.createElement('button');

        button.type =
            'button';

        button.className =
            'shape-option-btn';

        button.textContent =
            label;

        button.addEventListener(
            'click',
            () => {

                state.selectedShape =
                    type;

                selectDrawingTool(
                    'shapes'
                );

                panel
                    .querySelectorAll(
                        '.shape-option-btn'
                    )
                    .forEach(btn =>
                        btn.classList.remove(
                            'selected-option'
                        )
                    );

                button.classList.add(
                    'selected-option'
                );

                showNotification(
                    `${label} selected. Draw it on the canvas.`,
                    'info'
                );
            }
        );

        panel.appendChild(
            button
        );
    });


    dom.rakhiEditor.appendChild(
        panel
    );
}


function startShape(point) {

    if (!state.selectedShape) {

        showNotification(
            'Choose a shape first.',
            'info'
        );

        return;
    }


    state.isShapeDrawing =
        true;

    state.shapeStartPoint =
        point;

    state.previewSnapshot =
        dom.canvas.toDataURL(
            'image/png'
        );
}


function previewShape(point) {

    if (
        !state.previewSnapshot ||
        !state.shapeStartPoint
    ) {
        return;
    }


    restoreCanvasPreview(
        state.previewSnapshot,
        () => {

            drawShape(
                state.selectedShape,
                state.shapeStartPoint,
                point,
                true
            );
        }
    );
}


function finishShape() {

    if (
        !state.isShapeDrawing ||
        !state.shapeStartPoint
    ) {
        return;
    }


    const start =
        state.shapeStartPoint;


    state.isShapeDrawing =
        false;


    state.shapeStartPoint =
        null;


    state.previewSnapshot =
        null;


    /*
     * The final shape was already previewed.
     * Save it to history.
     */

    saveHistoryState();
}


function restoreCanvasPreview(
    dataUrl,
    callback
) {

    const image =
        new Image();


    image.onload = () => {

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


        if (callback) {
            callback();
        }
    };


    image.src =
        dataUrl;
}


function drawShape(
    type,
    start,
    end,
    preview = false
) {

    const ctx =
        state.ctx;


    const x =
        Math.min(start.x, end.x);

    const y =
        Math.min(start.y, end.y);

    const width =
        Math.abs(end.x - start.x);

    const height =
        Math.abs(end.y - start.y);

    const centerX =
        x + width / 2;

    const centerY =
        y + height / 2;


    ctx.save();

    ctx.fillStyle =
        state.currentColor;

    ctx.strokeStyle =
        state.currentColor;

    ctx.lineWidth =
        state.brushSize;


    ctx.beginPath();


    if (type === 'circle') {

        const radius =
            Math.min(width, height) / 2;

        ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
        );

    } else if (type === 'rectangle') {

        ctx.rect(
            x,
            y,
            width,
            height
        );

    } else if (type === 'triangle') {

        ctx.moveTo(
            centerX,
            y
        );

        ctx.lineTo(
            x + width,
            y + height
        );

        ctx.lineTo(
            x,
            y + height
        );

        ctx.closePath();

    } else if (type === 'diamond') {

        ctx.moveTo(
            centerX,
            y
        );

        ctx.lineTo(
            x + width,
            centerY
        );

        ctx.lineTo(
            centerX,
            y + height
        );

        ctx.lineTo(
            x,
            centerY
        );

        ctx.closePath();

    } else if (type === 'star') {

        drawStarPath(
            ctx,
            centerX,
            centerY,
            Math.min(width, height) / 2,
            Math.min(width, height) / 4,
            5
        );
    }


    ctx.fill();

    ctx.restore();
}


function drawStarPath(
    ctx,
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    points
) {

    const step =
        Math.PI / points;

    let rotation =
        -Math.PI / 2;


    ctx.moveTo(
        centerX +
        Math.cos(rotation) *
        outerRadius,

        centerY +
        Math.sin(rotation) *
        outerRadius
    );


    for (
        let i = 0;
        i < points * 2;
        i++
    ) {

        const radius =
            i % 2 === 0
                ? outerRadius
                : innerRadius;

        rotation += step;


        ctx.lineTo(
            centerX +
            Math.cos(rotation) *
            radius,

            centerY +
            Math.sin(rotation) *
            radius
        );
    }


    ctx.closePath();
}


/* ==========================================================================
   14. TEXT
   ========================================================================== */

function createTextPanel() {

    if (
        !dom.rakhiEditor ||
        document.getElementById(
            'text-controls-panel'
        )
    ) {
        return;
    }


    const panel =
        document.createElement('div');

    panel.id =
        'text-controls-panel';

    panel.className =
        'toolbar-group editor-control-panel';

    panel.setAttribute(
        'hidden',
        ''
    );


    const label =
        document.createElement('span');

    label.className =
        'tool-label';

    label.textContent =
        'Text size';


    const sizeInput =
        document.createElement('input');

    sizeInput.type =
        'range';

    sizeInput.min =
        '12';

    sizeInput.max =
        '80';

    sizeInput.value =
        state.textSize;


    sizeInput.addEventListener(
        'input',
        event => {

            state.textSize =
                Number(event.target.value);
        }
    );


    panel.appendChild(
        label
    );

    panel.appendChild(
        sizeInput
    );


    const instruction =
        document.createElement('span');

    instruction.className =
        'tool-label';

    instruction.textContent =
        'Click the canvas to add text.';


    panel.appendChild(
        instruction
    );


    dom.rakhiEditor.appendChild(
        panel
    );
}


function placeText(point) {

    const text =
        window.prompt(
            'Enter your Rakhi text:'
        );


    if (
        text === null ||
        !text.trim()
    ) {
        return;
    }


    const ctx =
        state.ctx;


    ctx.save();

    ctx.fillStyle =
        state.currentColor;

    ctx.font =
        `bold ${state.textSize}px Arial`;

    ctx.textAlign =
        'center';

    ctx.textBaseline =
        'middle';


    ctx.fillText(
        text.trim(),
        point.x,
        point.y
    );


    ctx.restore();


    saveHistoryState();


    showNotification(
        'Text added to your Rakhi.',
        'success'
    );
}


/* ==========================================================================
   15. RAKHI ELEMENTS
   ========================================================================== */

function createRakhiElementsPanel() {

    if (
        !dom.rakhiEditor ||
        document.getElementById(
            'rakhi-elements-panel'
        )
    ) {
        return;
    }


    const panel =
        document.createElement('div');

    panel.id =
        'rakhi-elements-panel';

    panel.className =
        'toolbar-group editor-control-panel';

    panel.setAttribute(
        'hidden',
        ''
    );


    const title =
        document.createElement('span');

    title.className =
        'tool-label';

    title.textContent =
        'Rakhi Elements';


    panel.appendChild(
        title
    );


    const elements = [

        ['center', '🟡 Center'],
        ['bead', '🔴 Bead'],
        ['flower', '🌸 Flower'],
        ['diamond', '💎 Diamond'],
        ['star', '⭐ Star'],
        ['ring', '⭕ Ring'],
        ['thread', '🧵 Thread'],
        ['decoration', '✨ Decoration']
    ];


    elements.forEach(
        ([type, label]) => {

            const button =
                document.createElement(
                    'button'
                );

            button.type =
                'button';

            button.className =
                'rakhi-element-btn';

            button.textContent =
                label;

            button.addEventListener(
                'click',
                () => {

                    state.selectedRakhiElement =
                        type;

                    selectDrawingTool(
                        'rakhi-elements'
                    );


                    panel
                        .querySelectorAll(
                            '.rakhi-element-btn'
                        )
                        .forEach(btn =>
                            btn.classList.remove(
                                'selected-option'
                            )
                        );


                    button.classList.add(
                        'selected-option'
                    );


                    showNotification(
                        `${label} selected. Click the canvas to place it.`,
                        'info'
                    );
                }
            );


            panel.appendChild(
                button
            );
        }
    );


    dom.rakhiEditor.appendChild(
        panel
    );
}


function placeRakhiElement(
    element,
    point
) {

    switch (element) {

        case 'center':
            drawRakhiCenter(
                point.x,
                point.y
            );
            break;


        case 'bead':
            drawBead(
                point.x,
                point.y
            );
            break;


        case 'flower':
            drawFlower(
                point.x,
                point.y
            );
            break;


        case 'diamond':
            drawRakhiDiamond(
                point.x,
                point.y
            );
            break;


        case 'star':
            drawRakhiStar(
                point.x,
                point.y
            );
            break;


        case 'ring':
            drawRakhiRing(
                point.x,
                point.y
            );
            break;


        case 'thread':
            drawThread(
                point.x,
                point.y
            );
            break;


        case 'decoration':
            drawDecoration(
                point.x,
                point.y
            );
            break;
    }


    saveHistoryState();


    showNotification(
        'Rakhi element added.',
        'success'
    );
}


/* ==========================================================================
   16. RAKHI ELEMENT DRAWING
   ========================================================================== */

function drawRakhiCenter(x, y) {

    const ctx =
        state.ctx;

    ctx.save();


    /* Outer gold ring */

    ctx.fillStyle =
        '#D4A24C';

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        55,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Pink ring */

    ctx.fillStyle =
        '#C21E6D';

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        43,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Gold inner ring */

    ctx.fillStyle =
        '#FFD700';

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        30,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Center */

    ctx.fillStyle =
        '#6B3FA0';

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        18,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Highlight */

    ctx.fillStyle =
        '#FFFFFF';

    ctx.beginPath();

    ctx.arc(
        x - 6,
        y - 6,
        5,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();
}


function drawBead(x, y) {

    const ctx =
        state.ctx;

    ctx.save();


    ctx.fillStyle =
        state.currentColor;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        13,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.strokeStyle =
        '#D4A24C';

    ctx.lineWidth =
        3;

    ctx.stroke();


    ctx.fillStyle =
        '#FFFFFF';

    ctx.globalAlpha =
        0.7;

    ctx.beginPath();

    ctx.arc(
        x - 4,
        y - 4,
        3,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();
}


function drawFlower(x, y) {

    const ctx =
        state.ctx;

    ctx.save();


    const petalColors = [

        '#FF4FA3',
        '#FF7A30',
        '#C21E6D',
        '#6B3FA0'
    ];


    for (
        let i = 0;
        i < 8;
        i++
    ) {

        const angle =
            (Math.PI * 2 / 8) * i;


        const px =
            x + Math.cos(angle) * 25;

        const py =
            y + Math.sin(angle) * 25;


        ctx.fillStyle =
            petalColors[
                i % petalColors.length
            ];


        ctx.beginPath();

        ctx.arc(
            px,
            py,
            18,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    ctx.fillStyle =
        '#FFD700';

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        18,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();
}


function drawRakhiDiamond(x, y) {

    const ctx =
        state.ctx;

    ctx.save();


    ctx.fillStyle =
        '#D4A24C';

    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 30
    );

    ctx.lineTo(
        x + 30,
        y
    );

    ctx.lineTo(
        x,
        y + 30
    );

    ctx.lineTo(
        x - 30,
        y
    );

    ctx.closePath();

    ctx.fill();


    ctx.fillStyle =
        '#C21E6D';

    ctx.beginPath();

    ctx.moveTo(
        x,
        y - 18
    );

    ctx.lineTo(
        x + 18,
        y
    );

    ctx.lineTo(
        x,
        y + 18
    );

    ctx.lineTo(
        x - 18,
        y
    );

    ctx.closePath();

    ctx.fill();


    ctx.restore();
}


function drawRakhiStar(x, y) {

    const ctx =
        state.ctx;

    ctx.save();

    ctx.fillStyle =
        '#FFD700';

    ctx.beginPath();

    drawStarPath(
        ctx,
        x,
        y,
        32,
        14,
        5
    );

    ctx.fill();

    ctx.restore();
}


function drawRakhiRing(x, y) {

    const ctx =
        state.ctx;

    ctx.save();

    ctx.strokeStyle =
        '#D4A24C';

    ctx.lineWidth =
        10;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        30,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    ctx.strokeStyle =
        '#C21E6D';

    ctx.lineWidth =
        4;

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        30,
        0,
        Math.PI * 2
    );

    ctx.stroke();


    ctx.restore();
}


function drawThread(x, y) {

    const ctx =
        state.ctx;

    ctx.save();

    ctx.strokeStyle =
        '#C21E6D';

    ctx.lineWidth =
        7;

    ctx.lineCap =
        'round';


    ctx.beginPath();

    ctx.moveTo(
        x - 100,
        y
    );


    ctx.bezierCurveTo(
        x - 50,
        y - 25,
        x + 50,
        y + 25,
        x + 100,
        y
    );


    ctx.stroke();


    ctx.strokeStyle =
        '#FF4FA3';

    ctx.lineWidth =
        3;


    ctx.beginPath();

    ctx.moveTo(
        x - 100,
        y
    );


    ctx.bezierCurveTo(
        x - 50,
        y + 25,
        x + 50,
        y - 25,
        x + 100,
        y
    );


    ctx.stroke();


    ctx.restore();
}


function drawDecoration(x, y) {

    const ctx =
        state.ctx;

    ctx.save();


    const colors = [

        '#FFD700',
        '#C21E6D',
        '#6B3FA0',
        '#FF7A30'
    ];


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        const angle =
            (Math.PI * 2 / 12) * i;


        const radius =
            42;


        const px =
            x + Math.cos(angle) * radius;


        const py =
            y + Math.sin(angle) * radius;


        ctx.fillStyle =
            colors[
                i % colors.length
            ];


        ctx.beginPath();

        ctx.arc(
            px,
            py,
            6,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }


    ctx.restore();
}


/* ==========================================================================
   17. UNDO / REDO
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


function restoreCanvasFromSnapshot(
    dataUrl,
    callback
) {

    const image =
        new Image();


    image.onload = () => {

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


        if (callback) {
            callback();
        }
    };


    image.onerror = () => {

        showNotification(
            'Could not restore the drawing.',
            'error'
        );
    };


    image.src =
        dataUrl;
}


function undo() {

    if (
        state.historyIndex <= 0
    ) {

        showNotification(
            'Nothing to undo yet.',
            'info'
        );

        return;
    }


    state.historyIndex--;


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


    state.historyIndex++;


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
   18. SAVE DESIGNS
   ========================================================================== */

function loadDesignsFromStorage() {

    try {

        const raw =
            localStorage.getItem(
                STORAGE_KEY
            );


        state.designs =
            raw
                ? JSON.parse(raw)
                : [];


    } catch (error) {

        console.error(error);

        state.designs = [];

        showNotification(
            'Could not load saved designs.',
            'error'
        );
    }


    return state.designs;
}


function persistDesignsToStorage() {

    try {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                state.designs
            )
        );


        return true;

    } catch (error) {

        console.error(error);

        showNotification(
            'Could not save the design. Storage may be full.',
            'error'
        );


        return false;
    }
}


function saveCurrentDesign() {

    if (!dom.canvas) {
        return;
    }


    try {

        const design = {

            id:
                generateId(),

            name:
                `My Rakhi ${state.designs.length + 1}`,

            date:
                new Date().toISOString(),

            image:
                dom.canvas.toDataURL(
                    'image/png'
                )
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

        console.error(error);

        showNotification(
            'Could not save your design.',
            'error'
        );
    }
}


/* ==========================================================================
   19. MY DESIGNS
   ========================================================================== */

function renderDesignGrid() {

    if (!dom.designGrid) {
        return;
    }


    loadDesignsFromStorage();


    dom.designGrid
        .querySelectorAll(
            '.design-card'
        )
        .forEach(card =>
            card.remove()
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
        design => {

            dom.designGrid.appendChild(
                createDesignCardElement(
                    design
                )
            );
        }
    );
}


function createDesignCardElement(
    design
) {

    const card =
        document.createElement(
            'article'
        );

    card.className =
        'design-card';

    card.dataset.designId =
        design.id;


    const image =
        document.createElement(
            'img'
        );

    image.className =
        'design-card-thumbnail';

    image.src =
        design.image;

    image.alt =
        design.name;


    const title =
        document.createElement(
            'h3'
        );

    title.className =
        'design-card-title';

    title.textContent =
        design.name;


    const date =
        document.createElement(
            'p'
        );

    date.className =
        'design-card-date';

    date.textContent =
        formatDate(
            design.date
        );


    const actions =
        document.createElement(
            'div'
        );

    actions.className =
        'design-card-actions';


    const open =
        createDesignActionButton(
            'Open',
            () =>
                openDesignInEditor(
                    design.id
                )
        );


    const edit =
        createDesignActionButton(
            'Edit',
            () =>
                openDesignInEditor(
                    design.id
                )
        );


    const deleteButton =
        createDesignActionButton(
            'Delete',
            () =>
                deleteDesign(
                    design.id
                )
        );


    const share =
        createDesignActionButton(
            'Share',
            () => {

                state.selectedDesignId =
                    design.id;

                navigateToPage(
                    'share'
                );
            }
        );


    actions.append(
        open,
        edit,
        deleteButton,
        share
    );


    card.append(
        image,
        title,
        date,
        actions
    );


    return card;
}


function createDesignActionButton(
    text,
    handler
) {

    const button =
        document.createElement(
            'button'
        );

    button.type =
        'button';

    button.textContent =
        text;

    button.addEventListener(
        'click',
        handler
    );


    return button;
}


function deleteDesign(id) {

    if (
        !window.confirm(
            'Delete this Rakhi design?'
        )
    ) {
        return;
    }


    state.designs =
        state.designs.filter(
            design =>
                design.id !== id
        );


    if (
        persistDesignsToStorage()
    ) {

        renderDesignGrid();

        showNotification(
            'Design deleted.',
            'info'
        );
    }
}


function openDesignInEditor(id) {

    loadDesignsFromStorage();


    const design =
        state.designs.find(
            item =>
                item.id === id
        );


    if (!design) {

        showNotification(
            'Design not found.',
            'error'
        );

        return;
    }


    state.selectedDesignId =
        id;


    navigateToPage(
        'create'
    );


    setTimeout(() => {

        restoreCanvasFromSnapshot(
            design.image
        );


        saveHistoryState();

    }, 950);
}


/* ==========================================================================
   20. AI STUDIO
   ========================================================================== */

function setupAIStudio() {

    if (dom.aiPromptForm) {

        dom.aiPromptForm.addEventListener(
            'submit',
            handleAIGenerateSubmit
        );
    }


    dom.aiExampleButtons.forEach(
        button => {

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


async function handleAIGenerateSubmit(
    event
) {

    event.preventDefault();


    const prompt =
        dom.aiPromptInput
            ? dom.aiPromptInput.value.trim()
            : '';


    if (!prompt) {

        showAIError(
            'Please describe the Rakhi you want AI to create.'
        );

        return;
    }


    if (state.isGeneratingAI) {
        return;
    }


    setAILoadingState(true);

    hideAIError();

    hideAIResult();


    try {

        const imageUrl =
            await generateAIRakhi(
                prompt
            );


        showAIResult(
            imageUrl
        );


    } catch (error) {

        console.error(error);

        showAIError(
            error.message ||
            'Could not generate the Rakhi.'
        );


    } finally {

        setAILoadingState(false);
    }
}


async function generateAIRakhi(prompt) {

    state.isGeneratingAI =
        true;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/generate`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            prompt
                        })
                }
            );


        let data;


        try {

            data =
                await response.json();

        } catch {

            throw new Error(
                'Backend returned an invalid response.'
            );
        }


        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.error ||
                `Generation failed (${response.status}).`
            );
        }


        if (!data.image_url) {

            throw new Error(
                'Backend did not return an image URL.'
            );
        }


        return normalizeImageUrl(
            data.image_url
        );


    } finally {

        state.isGeneratingAI =
            false;
    }
}


function normalizeImageUrl(
    imageUrl
) {

    if (!imageUrl) {
        return '';
    }


    if (
        imageUrl.startsWith(
            'http://'
        ) ||
        imageUrl.startsWith(
            'https://'
        ) ||
        imageUrl.startsWith(
            'data:'
        )
    ) {

        return imageUrl;
    }


    if (
        imageUrl.startsWith('/')
    ) {

        return (
            `${API_BASE_URL}${imageUrl}`
        );
    }


    return (
        `${API_BASE_URL}/${imageUrl}`
    );
}


/* ==========================================================================
   21. AI UI
   ========================================================================== */

function setAILoadingState(
    loading
) {

    if (dom.aiLoadingState) {

        dom.aiLoadingState.hidden =
            !loading;
    }


    if (dom.aiGenerateBtn) {

        dom.aiGenerateBtn.disabled =
            loading;
    }


    if (dom.aiPromptInput) {

        dom.aiPromptInput.disabled =
            loading;
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


    setTimeout(() => {

        const image =
            new Image();


        image.crossOrigin =
            'anonymous';


        image.onload = () => {

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
                'Could not load AI image into editor.',
                'error'
            );
        };


        image.src =
            state.lastAIResultDataUrl;

    }, 950);
}


/* ==========================================================================
   22. SHARE
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

    let imageSource =
        null;


    const design =
        state.designs.find(
            item =>
                item.id ===
                state.selectedDesignId
        );


    if (design) {

        imageSource =
            design.image;

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

        const id =
            state.selectedDesignId ||
            generateId();


        dom.shareLinkInput.value =
            `https://digitalrakhi.app/r/${id}`;
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
            'No share link available.',
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


    } catch {

        showNotification(
            'Could not copy the link.',
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


    window.open(
        `https://wa.me/?text=${text}`,
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
                    link
            });


            return;

        } catch {
            return;
        }
    }


    await copyShareLink();
}


/* ==========================================================================
   23. DOWNLOAD
   ========================================================================== */

function downloadCanvasAsPng() {

    if (!dom.canvas) {

        showNotification(
            'No canvas available.',
            'error'
        );

        return;
    }


    try {

        const dataUrl =
            dom.canvas.toDataURL(
                'image/png'
            );


        const link =
            document.createElement(
                'a'
            );


        link.href =
            dataUrl;


        link.download =
            'my-digital-rakhi.png';


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        showNotification(
            'Your Rakhi is downloading! ⬇️',
            'success'
        );


    } catch (error) {

        console.error(error);

        showNotification(
            'Could not export the design.',
            'error'
        );
    }
}


/* ==========================================================================
   24. NOTIFICATIONS
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


    setTimeout(() => {

        toast.classList.add(
            'notification-hide'
        );


        setTimeout(
            () => toast.remove(),
            300
        );

    }, NOTIFICATION_DURATION_MS);
}


/* ==========================================================================
   25. KEYBOARD SHORTCUTS
   ========================================================================== */

function setupKeyboardShortcuts() {

    document.addEventListener(
        'keydown',
        event => {

            const modifier =
                event.ctrlKey ||
                event.metaKey;


            if (
                modifier &&
                !event.shiftKey &&
                event.key.toLowerCase() === 'z'
            ) {

                event.preventDefault();

                undo();

                return;
            }


            if (
                modifier &&
                event.shiftKey &&
                event.key.toLowerCase() === 'z'
            ) {

                event.preventDefault();

                redo();

                return;
            }


            if (
                event.key === 'Escape'
            ) {

                hideAllEditorPanels();

                if (
                    state.isTransitioning
                ) {

                    hideRakhiTransition();

                    state.isTransitioning =
                        false;
                }
            }
        }
    );
}


/* ==========================================================================
   26. UTILITIES
   ========================================================================== */

function generateId() {

    return (
        `rakhi-${Date.now()}-` +
        Math.random()
            .toString(36)
            .slice(2, 9)
    );
}


function formatDate(
    isoDateString
) {

    try {

        const date =
            new Date(
                isoDateString
            );


        return date.toLocaleDateString(
            undefined,
            {
                year:
                    'numeric',

                month:
                    'short',

                day:
                    'numeric'
            }
        );

    } catch {

        return '';
    }
}


function setFooterYear() {

    if (dom.footerYear) {

        dom.footerYear.textContent =
            new Date()
                .getFullYear();
    }
}


/* ==========================================================================
   27. INITIALIZATION
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
            'Digital Rakhi initialization failed:',
            error
        );
    }
}


document.addEventListener(
    'DOMContentLoaded',
    initializeApp
);