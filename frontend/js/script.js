/* ==========================================================================
   DIGITAL RAKHI — script.js
   ==========================================================================

   Features:
   - SPA navigation
   - Canvas drawing (brush, eraser)
   - Shapes (circle, square, rectangle, triangle, diamond, star, heart)
   - Text tool
   - Rakhi decorative elements
   - Undo / Redo history
   - Dual storage: LocalStorage + Flask backend (with graceful fallback)
   - Export PNG
   - AI Studio (Gemini-backed /generate endpoint)
   - Share
   ========================================================================== */


/* ==========================================================================
   1. BACKEND CONFIGURATION
   ========================================================================== */

const API_BASE_URL = '';
const DESIGNS_STORAGE_KEY = 'digitalRakhi.designs';
const MAX_HISTORY_STATES = 25;


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

    footerYear: null,
};


function cacheDOMReferences() {
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
   3. APPLICATION STATE
   ========================================================================== */

const state = {
    currentPage: 'home',
    isTransitioning: false,

    // Canvas / drawing
    ctx: null,
    isDrawing: false,
    currentTool: 'brush',
    currentColor: '#C21E6D',
    brushSize: 6,
    lastPoint: null,

    // Shapes
    currentShape: null,
    isShapeDrawing: false,
    shapeStart: null,
    shapePreviewSnapshot: null,

    // Text
    currentText: '',
    textSize: 32,
    textStyle: 'normal',

    // Rakhi elements
    currentElement: null,
    elementSize: 50,

    // History
    history: [],
    historyIndex: -1,

    // Saved designs (dual storage: local + backend)
    designs: [],
    selectedDesignId: null,

    // AI
    isGeneratingAI: false,
    lastAIResultDataUrl: null,

    // Popups
    activePopup: null,
};


/* ==========================================================================
   4. POPUP STYLES (injected once at runtime)
   ========================================================================== */

function injectToolPopupStyles() {
    if (document.getElementById('digital-rakhi-tool-styles')) return;

    const style = document.createElement('style');
    style.id = 'digital-rakhi-tool-styles';
    style.textContent = `
        .tool-popup {
            position: fixed;
            top: 130px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1200;
            background: #FFFFFF;
            border: 1px solid #F0DFE0;
            border-radius: 18px;
            box-shadow: 0 18px 45px rgba(74, 25, 66, 0.22);
            padding: 1rem 1.2rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
            align-items: center;
            max-width: min(92vw, 480px);
        }
        .tool-popup[hidden] { display: none; }
        .tool-popup .tool-label {
            width: 100%;
            font-weight: 600;
            color: #6B3FA0;
            font-size: 0.82rem;
            font-family: 'Poppins', sans-serif;
        }
        .color-swatch-btn {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid rgba(0, 0, 0, 0.08);
            cursor: pointer;
        }
        .shape-option-btn,
        .rakhi-element-btn {
            padding: 0.45rem 0.85rem;
            border-radius: 999px;
            border: 1px solid #F0DFE0;
            background: #FDEFE4;
            font-size: 0.82rem;
            cursor: pointer;
            font-family: 'Poppins', sans-serif;
        }
        .shape-option-btn.selected-option,
        .rakhi-element-btn.selected-option {
            background: linear-gradient(135deg, #C21E6D, #6B3FA0);
            color: #fff;
            border-color: transparent;
        }
        .tool-popup input[type="range"] { width: 160px; }
        .tool-popup input[type="text"],
        .tool-popup select {
            width: 100%;
            padding: 0.55rem 0.75rem;
            border-radius: 10px;
            border: 1.5px solid #F0DFE0;
            font-family: 'Poppins', sans-serif;
        }
        .tool-popup-add-btn {
            padding: 0.5rem 1.1rem;
            border-radius: 999px;
            border: none;
            background: linear-gradient(135deg, #C21E6D, #6B3FA0);
            color: #fff;
            cursor: pointer;
            font-weight: 600;
            font-family: 'Poppins', sans-serif;
        }
        .design-card-status {
            display: inline-block;
            margin: 0.2rem 1rem 0;
            padding: 0.15rem 0.6rem;
            border-radius: 999px;
            font-size: 0.7rem;
            font-weight: 600;
            background: #FDEFE4;
            color: #6B3FA0;
            width: fit-content;
        }
        @media (max-width: 640px) {
            .tool-popup {
                left: 1rem;
                right: 1rem;
                transform: none;
                max-width: none;
                top: auto;
                bottom: 90px;
            }
        }
    `;
    document.head.appendChild(style);
}


/* ==========================================================================
   5. NAVIGATION
   ========================================================================== */

function setupNavigation() {
    dom.navItems.forEach((button) => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const page = button.dataset.page;
            if (page) {
                navigateToPage(page);
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

function navigateToPage(pageName) {
    if (state.isTransitioning) return;

    const target = document.querySelector(`.page-section[data-page-id="${pageName}"]`);
    if (!target) {
        console.warn(`Digital Rakhi: page not found: ${pageName}`);
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
            dom.mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, 900);
}

function showPage(pageName) {
    dom.pageSections.forEach((section) => {
        section.classList.toggle('active-page', section.dataset.pageId === pageName);
    });
}

function setActiveNavItem(pageName) {
    dom.navItems.forEach((button) => {
        const active = button.dataset.page === pageName;
        button.classList.toggle('active-nav-item', active);
        if (active) {
            button.setAttribute('aria-current', 'page');
        } else {
            button.removeAttribute('aria-current');
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
   6. RAKHI TRANSITION OVERLAY
   ========================================================================== */

function showRakhiTransition() {
    if (!dom.transitionOverlay) return;

    dom.transitionOverlay.removeAttribute('hidden');
    dom.transitionOverlay.setAttribute('aria-hidden', 'false');

    void dom.transitionOverlay.offsetWidth;
    dom.transitionOverlay.classList.add('transition-active');
}

function hideRakhiTransition() {
    if (!dom.transitionOverlay) return;

    dom.transitionOverlay.classList.remove('transition-active');
    dom.transitionOverlay.setAttribute('aria-hidden', 'true');

    setTimeout(() => {
        if (!dom.transitionOverlay.classList.contains('transition-active')) {
            dom.transitionOverlay.setAttribute('hidden', '');
        }
    }, 400);
}


/* ==========================================================================
   7. CANVAS INITIALIZATION + COORDINATES
   ========================================================================== */

function initializeCanvas() {
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
    saveHistoryState();
    attachCanvasEventListeners();
    setActiveTool('brush');
}

function fillCanvasBackground(color) {
    if (!state.ctx) return;
    state.ctx.save();
    state.ctx.globalCompositeOperation = 'source-over';
    state.ctx.fillStyle = color;
    state.ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
    state.ctx.restore();
}

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
   8. CANVAS EVENTS
   ========================================================================== */

function attachCanvasEventListeners() {
    dom.canvas.addEventListener('mousedown', handlePointerDown);
    dom.canvas.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    dom.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    dom.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
}

function handlePointerDown(event) {
    handleCanvasActionStart(getCanvasCoordinates(event));
}

function handlePointerMove(event) {
    handleCanvasActionMove(getCanvasCoordinates(event));
}

function handlePointerUp(event) {
    const point = dom.canvas ? getCanvasCoordinates(event) : null;
    handleCanvasActionEnd(point);
}

function handleTouchStart(event) {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    handleCanvasActionStart(getCanvasCoordinates(touch));
}

function handleTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    if (!touch) return;
    handleCanvasActionMove(getCanvasCoordinates(touch));
}

function handleTouchEnd(event) {
    const touch = (event.changedTouches && event.changedTouches[0]) || null;
    const point = touch && dom.canvas ? getCanvasCoordinates(touch) : null;
    handleCanvasActionEnd(point);
}

function handleCanvasActionStart(point) {
    if (state.currentTool === 'brush' || state.currentTool === 'eraser') {
        startDrawing(point);
        return;
    }
    if (state.currentTool === 'shapes' && state.currentShape) {
        startShapeDrawing(point);
        return;
    }
    if (state.currentTool === 'text') {
        placeText(point);
        return;
    }
    if (state.currentTool === 'rakhi-elements' && state.currentElement) {
        placeRakhiElement(point);
    }
}

function handleCanvasActionMove(point) {
    if (state.currentTool === 'brush' || state.currentTool === 'eraser') {
        if (state.isDrawing) draw(point);
        return;
    }
    if (state.currentTool === 'shapes' && state.isShapeDrawing) {
        previewShape(point);
    }
}

function handleCanvasActionEnd(point) {
    if (state.currentTool === 'brush' || state.currentTool === 'eraser') {
        stopDrawing();
        return;
    }
    if (state.currentTool === 'shapes' && state.isShapeDrawing) {
        finishShapeDrawing(point);
    }
}


/* ==========================================================================
   9. BRUSH + ERASER
   ========================================================================== */

function startDrawing(point) {
    if (!state.ctx) return;
    state.isDrawing = true;
    state.lastPoint = point;
    drawSegment(point, point);
}

function draw(point) {
    if (!state.isDrawing || !state.lastPoint) return;
    drawSegment(state.lastPoint, point);
    state.lastPoint = point;
}

function stopDrawing() {
    if (!state.isDrawing) return;
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
   10. TOOLBAR + TOOL ACTIVATION
   ========================================================================== */

function setupToolbar() {
    dom.toolButtons.forEach((button) => {
        button.addEventListener('click', () => activateTool(button));
    });

    if (dom.undoBtn) dom.undoBtn.addEventListener('click', undo);
    if (dom.redoBtn) dom.redoBtn.addEventListener('click', redo);
    if (dom.clearBtn) dom.clearBtn.addEventListener('click', clearCanvas);
    if (dom.saveBtn) dom.saveBtn.addEventListener('click', saveCurrentDesign);
    if (dom.exportBtn) dom.exportBtn.addEventListener('click', downloadCanvasAsPNG);
}

function activateTool(button) {
    const tool = button.dataset.tool;
    if (!tool) return;

    if (tool === 'brush' || tool === 'eraser') {
        setActiveTool(tool);
        closeAllPopups();
        return;
    }

    if (tool === 'colors') {
        setActiveTool('brush');
        togglePopup('color-panel');
        return;
    }

    if (tool === 'shapes') {
        setActiveTool('shapes');
        togglePopup('shapes-panel');
        return;
    }

    if (tool === 'text') {
        setActiveTool('text');
        togglePopup('text-panel');
        return;
    }

    if (tool === 'rakhi-elements') {
        setActiveTool('rakhi-elements');
        togglePopup('rakhi-elements-panel');
    }
}

function setActiveTool(tool) {
    state.currentTool = tool;
    dom.toolButtons.forEach((button) => {
        button.classList.toggle('active-tool', button.dataset.tool === tool);
    });
}


/* ==========================================================================
   11. POPUP SYSTEM (color / shapes / text / rakhi elements)
   ========================================================================== */

const POPUP_IDS = ['color-panel', 'shapes-panel', 'text-panel', 'rakhi-elements-panel'];

function openPopup(id) {
    const popup = document.getElementById(id);
    if (!popup) return;
    popup.removeAttribute('hidden');
    state.activePopup = id;
}

function closePopup(id) {
    const popup = document.getElementById(id);
    if (!popup) return;
    popup.setAttribute('hidden', '');
    if (state.activePopup === id) {
        state.activePopup = null;
    }
}

function closeAllPopups() {
    POPUP_IDS.forEach(closePopup);
}

function togglePopup(id) {
    if (state.activePopup === id) {
        closeAllPopups();
        return;
    }
    closeAllPopups();
    openPopup(id);
}

function setupPopupDismissal() {
    document.addEventListener('click', (event) => {
        if (!state.activePopup) return;

        const popup = document.getElementById(state.activePopup);
        const clickedInsidePopup = popup && popup.contains(event.target);
        const clickedToolButton = event.target.closest && event.target.closest('.tool-btn');

        if (!clickedInsidePopup && !clickedToolButton) {
            closeAllPopups();
        }
    });
}


/* ==========================================================================
   12. COLORS PANEL
   ========================================================================== */

function createColorPanel() {
    if (!dom.rakhiEditor || document.getElementById('color-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'color-panel';
    panel.className = 'tool-popup';
    panel.setAttribute('hidden', '');

    const label = document.createElement('span');
    label.className = 'tool-label';
    label.textContent = 'Colors';
    panel.appendChild(label);

    const presets = [
        ['#E63946', 'Red'], ['#FF4FA3', 'Pink'], ['#C21E6D', 'Magenta'],
        ['#6B3FA0', 'Purple'], ['#FF7A30', 'Orange'], ['#FF9933', 'Saffron'],
        ['#D4A24C', 'Gold'], ['#2E9E5B', 'Green'], ['#2E86DE', 'Blue'],
        ['#2B1B2E', 'Black'], ['#FFFFFF', 'White'],
    ];

    presets.forEach(([color, name]) => {
        const swatch = document.createElement('button');
        swatch.type = 'button';
        swatch.className = 'color-swatch-btn';
        swatch.style.background = color;
        swatch.title = name;
        swatch.setAttribute('aria-label', `Set color to ${name}`);
        swatch.addEventListener('click', () => selectColor(color));
        panel.appendChild(swatch);
    });

    const customColor = document.createElement('input');
    customColor.type = 'color';
    customColor.value = state.currentColor;
    customColor.title = 'Custom color';
    customColor.setAttribute('aria-label', 'Custom brush color');
    customColor.addEventListener('input', (event) => selectColor(event.target.value));
    panel.appendChild(customColor);

    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'tool-label';
    sizeLabel.textContent = 'Brush size';
    panel.appendChild(sizeLabel);

    const sizeInput = document.createElement('input');
    sizeInput.type = 'range';
    sizeInput.min = '1';
    sizeInput.max = '50';
    sizeInput.value = String(state.brushSize);
    sizeInput.setAttribute('aria-label', 'Brush size');
    sizeInput.addEventListener('input', (event) => updateBrushSize(Number(event.target.value)));
    panel.appendChild(sizeInput);

    document.body.appendChild(panel);
}

function selectColor(color) {
    state.currentColor = color;
    setActiveTool('brush');
    showNotification('Color changed.', 'info');
}

function updateBrushSize(size) {
    if (Number.isFinite(size) && size >= 1) {
        state.brushSize = size;
    }
}


/* ==========================================================================
   13. SHAPES PANEL + DRAWING
   ========================================================================== */

function createShapesPanel() {
    if (!dom.rakhiEditor || document.getElementById('shapes-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'shapes-panel';
    panel.className = 'tool-popup';
    panel.setAttribute('hidden', '');

    const label = document.createElement('span');
    label.className = 'tool-label';
    label.textContent = 'Choose a shape';
    panel.appendChild(label);

    const shapes = [
        ['circle', '⭕ Circle'], ['square', '⬜ Square'], ['rectangle', '▭ Rectangle'],
        ['triangle', '△ Triangle'], ['diamond', '◇ Diamond'], ['star', '⭐ Star'],
        ['heart', '❤️ Heart'],
    ];

    shapes.forEach(([type, labelText]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'shape-option-btn';
        button.textContent = labelText;
        button.addEventListener('click', () => selectShape(type, button, panel));
        panel.appendChild(button);
    });

    document.body.appendChild(panel);
}

function selectShape(type, button, panel) {
    state.currentShape = type;
    setActiveTool('shapes');

    panel.querySelectorAll('.shape-option-btn').forEach((btn) => btn.classList.remove('selected-option'));
    button.classList.add('selected-option');

    showNotification(`${button.textContent} selected. Draw it on the canvas.`, 'info');
}

function startShapeDrawing(point) {
    if (!state.currentShape) {
        showNotification('Choose a shape first.', 'info');
        return;
    }
    state.isShapeDrawing = true;
    state.shapeStart = point;
    state.shapePreviewSnapshot = dom.canvas.toDataURL('image/png');
}

function previewShape(point) {
    if (!state.shapePreviewSnapshot || !state.shapeStart) return;
    restoreCanvasPreview(state.shapePreviewSnapshot, () => {
        drawShape(state.currentShape, state.shapeStart, point);
    });
}

function finishShapeDrawing(point) {
    if (!state.isShapeDrawing || !state.shapeStart) return;

    const endPoint = point || state.shapeStart;
    const snapshot = state.shapePreviewSnapshot;
    const start = state.shapeStart;
    const shapeType = state.currentShape;

    restoreCanvasPreview(snapshot, () => {
        drawShape(shapeType, start, endPoint);
        state.isShapeDrawing = false;
        state.shapeStart = null;
        state.shapePreviewSnapshot = null;
        saveHistoryState();
    });
}

function restoreCanvasPreview(dataUrl, callback) {
    const image = new Image();
    image.onload = () => {
        state.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
        state.ctx.drawImage(image, 0, 0, dom.canvas.width, dom.canvas.height);
        if (callback) callback();
    };
    image.src = dataUrl;
}

function drawShape(type, start, end) {
    const ctx = state.ctx;
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    ctx.save();
    ctx.fillStyle = state.currentColor;
    ctx.strokeStyle = state.currentColor;
    ctx.lineWidth = Math.max(2, state.brushSize / 2);
    ctx.beginPath();

    switch (type) {
        case 'circle': {
            const cx = x + width / 2;
            const cy = y + height / 2;
            drawCircle(ctx, cx, cy, Math.min(width, height) / 2);
            break;
        }
        case 'square': {
            const size = Math.max(width, height);
            drawSquare(ctx, x, y, size);
            break;
        }
        case 'rectangle':
            drawRectangle(ctx, x, y, width, height);
            break;
        case 'triangle':
            drawTriangle(ctx, x, y, width, height);
            break;
        case 'diamond':
            drawDiamond(ctx, x, y, width, height);
            break;
        case 'star': {
            const cx = x + width / 2;
            const cy = y + height / 2;
            const outerRadius = Math.min(width, height) / 2;
            drawStar(ctx, cx, cy, outerRadius, outerRadius / 2, 5);
            break;
        }
        case 'heart':
            drawHeart(ctx, x, y, width, height);
            break;
        default:
            ctx.restore();
            return;
    }

    ctx.fill();
    ctx.restore();
}

function drawCircle(ctx, cx, cy, radius) {
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
}

function drawSquare(ctx, x, y, size) {
    ctx.rect(x, y, size, size);
}

function drawRectangle(ctx, x, y, width, height) {
    ctx.rect(x, y, width, height);
}

function drawTriangle(ctx, x, y, width, height) {
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
}

function drawDiamond(ctx, x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    ctx.moveTo(cx, y);
    ctx.lineTo(x + width, cy);
    ctx.lineTo(cx, y + height);
    ctx.lineTo(x, cy);
    ctx.closePath();
}

function drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
    const step = Math.PI / points;
    let rotation = -Math.PI / 2;

    ctx.moveTo(cx + Math.cos(rotation) * outerRadius, cy + Math.sin(rotation) * outerRadius);

    for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        rotation += step;
        ctx.lineTo(cx + Math.cos(rotation) * radius, cy + Math.sin(rotation) * radius);
    }

    ctx.closePath();
}

function drawHeart(ctx, x, y, width, height) {
    const topCurveHeight = height * 0.3;
    ctx.moveTo(x + width / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x, y + height / 2, x + width / 2, y + height);
    ctx.bezierCurveTo(x + width, y + height / 2, x + width, y, x + width / 2, y + topCurveHeight);
    ctx.closePath();
}


/* ==========================================================================
   14. TEXT PANEL + PLACEMENT
   ========================================================================== */

function createTextPanel() {
    if (!dom.rakhiEditor || document.getElementById('text-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'text-panel';
    panel.className = 'tool-popup';
    panel.setAttribute('hidden', '');

    const label = document.createElement('span');
    label.className = 'tool-label';
    label.textContent = 'Add text';
    panel.appendChild(label);

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.placeholder = 'Enter your Rakhi text...';
    textInput.setAttribute('aria-label', 'Text to add to the canvas');
    panel.appendChild(textInput);

    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'tool-label';
    sizeLabel.textContent = 'Font size';
    panel.appendChild(sizeLabel);

    const sizeInput = document.createElement('input');
    sizeInput.type = 'range';
    sizeInput.min = '10';
    sizeInput.max = '100';
    sizeInput.value = String(state.textSize);
    sizeInput.setAttribute('aria-label', 'Text size');
    sizeInput.addEventListener('input', (event) => updateTextSettings({ size: Number(event.target.value) }));
    panel.appendChild(sizeInput);

    const styleSelect = document.createElement('select');
    styleSelect.setAttribute('aria-label', 'Text style');
    [
        ['normal', 'Normal'],
        ['bold', 'Bold'],
        ['italic', 'Italic'],
        ['bold-italic', 'Bold Italic'],
    ].forEach(([value, labelText]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = labelText;
        styleSelect.appendChild(option);
    });
    styleSelect.addEventListener('change', (event) => updateTextSettings({ style: event.target.value }));
    panel.appendChild(styleSelect);

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'tool-popup-add-btn';
    addButton.textContent = 'Add Text';
    addButton.addEventListener('click', () => addTextToCanvas(textInput));
    panel.appendChild(addButton);

    const instruction = document.createElement('span');
    instruction.className = 'tool-label';
    instruction.textContent = 'Click the canvas after adding text to place it. You can place it more than once.';
    panel.appendChild(instruction);

    document.body.appendChild(panel);
}

function updateTextSettings({ size, style } = {}) {
    if (typeof size === 'number' && Number.isFinite(size)) {
        state.textSize = size;
    }
    if (typeof style === 'string') {
        state.textStyle = style;
    }
}

function addTextToCanvas(textInput) {
    const value = textInput.value.trim();
    if (!value) {
        showNotification('Enter some text first.', 'info');
        return;
    }

    state.currentText = value;
    setActiveTool('text');
    closeAllPopups();
    showNotification('Click the canvas to place your text.', 'info');
}

function placeText(point) {
    if (!state.currentText) {
        showNotification('Add some text first using the Text tool.', 'info');
        return;
    }

    const ctx = state.ctx;
    ctx.save();

    const isBold = state.textStyle.includes('bold');
    const isItalic = state.textStyle.includes('italic');
    const fontStyle = isItalic ? 'italic' : 'normal';
    const fontWeight = isBold ? 'bold' : 'normal';

    ctx.fillStyle = state.currentColor;
    ctx.font = `${fontStyle} ${fontWeight} ${state.textSize}px 'Poppins', Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.currentText, point.x, point.y);

    ctx.restore();

    saveHistoryState();
    showNotification('Text added.', 'success');
}


/* ==========================================================================
   15. RAKHI ELEMENTS PANEL + PLACEMENT
   ========================================================================== */

function createRakhiElementsPanel() {
    if (!dom.rakhiEditor || document.getElementById('rakhi-elements-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'rakhi-elements-panel';
    panel.className = 'tool-popup';
    panel.setAttribute('hidden', '');

    const label = document.createElement('span');
    label.className = 'tool-label';
    label.textContent = 'Rakhi elements';
    panel.appendChild(label);

    const elements = [
        ['❤️', 'Heart'], ['🌸', 'Flower'], ['⭐', 'Star'], ['✨', 'Sparkle'],
        ['💎', 'Diamond'], ['🪷', 'Lotus'], ['🧿', 'Evil Eye'], ['🔴', 'Red Bead'],
        ['🟡', 'Gold Bead'], ['🟣', 'Purple Bead'], ['🪢', 'Thread'], ['🌺', 'Flower'],
        ['👑', 'Crown'], ['🕉️', 'Om'], ['🦚', 'Peacock Feather'],
    ];

    elements.forEach(([glyph, name]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'rakhi-element-btn';
        button.textContent = `${glyph} ${name}`;
        button.addEventListener('click', () => selectRakhiElement(glyph, button, panel));
        panel.appendChild(button);
    });

    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'tool-label';
    sizeLabel.textContent = 'Element size';
    panel.appendChild(sizeLabel);

    const sizeInput = document.createElement('input');
    sizeInput.type = 'range';
    sizeInput.min = '10';
    sizeInput.max = '150';
    sizeInput.value = String(state.elementSize);
    sizeInput.setAttribute('aria-label', 'Rakhi element size');
    sizeInput.addEventListener('input', (event) => {
        state.elementSize = Number(event.target.value);
    });
    panel.appendChild(sizeInput);

    document.body.appendChild(panel);
}

function selectRakhiElement(glyph, button, panel) {
    state.currentElement = glyph;
    setActiveTool('rakhi-elements');

    panel.querySelectorAll('.rakhi-element-btn').forEach((btn) => btn.classList.remove('selected-option'));
    button.classList.add('selected-option');

    showNotification('Element selected. Click the canvas to place it.', 'info');
}

function placeRakhiElement(point) {
    if (!state.currentElement) {
        showNotification('Choose a Rakhi element first.', 'info');
        return;
    }

    const ctx = state.ctx;
    ctx.save();
    ctx.font = `${state.elementSize}px "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.currentElement, point.x, point.y);
    ctx.restore();

    saveHistoryState();
    showNotification('Rakhi element added.', 'success');
}


/* ==========================================================================
   16. UNDO / REDO HISTORY
   ========================================================================== */

function saveHistoryState() {
    if (!dom.canvas) return;

    const snapshot = dom.canvas.toDataURL('image/png');

    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);

    if (state.history.length > MAX_HISTORY_STATES) {
        state.history.shift();
    }

    state.historyIndex = state.history.length - 1;
}

function restoreCanvasFromHistory(dataUrl) {
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

function undo() {
    if (state.historyIndex <= 0) {
        showNotification('Nothing to undo yet.', 'info');
        return;
    }
    state.historyIndex -= 1;
    restoreCanvasFromHistory(state.history[state.historyIndex]);
}

function redo() {
    if (state.historyIndex >= state.history.length - 1) {
        showNotification('Nothing to redo.', 'info');
        return;
    }
    state.historyIndex += 1;
    restoreCanvasFromHistory(state.history[state.historyIndex]);
}

function clearCanvas() {
    const confirmed = window.confirm('Clear the entire canvas?');
    if (!confirmed) return;

    fillCanvasBackground('#FFFDF9');
    saveHistoryState();
    showNotification('Canvas cleared.', 'info');
}


/* ==========================================================================
   17. IMAGE LOADING HELPER (used by design open/edit + AI open-in-editor)
   ========================================================================== */

function loadImage(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image.'));
        image.src = source;
    });
}

async function loadImageOntoCanvas(source) {
    try {
        const image = await loadImage(source);
        state.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
        state.ctx.drawImage(image, 0, 0, dom.canvas.width, dom.canvas.height);
        saveHistoryState();
    } catch (error) {
        console.error('Digital Rakhi: failed to load image onto canvas.', error);
        showNotification('Could not load the image into the editor.', 'error');
    }
}


/* ==========================================================================
   18. BACKEND URL NORMALIZATION
   ========================================================================== */

function normalizeImageUrl(imageUrl) {
    if (!imageUrl) return '';

    if (
        imageUrl.startsWith('http://') ||
        imageUrl.startsWith('https://') ||
        imageUrl.startsWith('data:')
    ) {
        return imageUrl;
    }

    if (imageUrl.startsWith('/')) {
        return `${API_BASE_URL}${imageUrl}`;
    }

    return `${API_BASE_URL}/${imageUrl}`;
}


/* ==========================================================================
   19. BACKEND DESIGN STORAGE (with graceful offline fallback)
   ========================================================================== */

async function saveDesignToBackend(design) {
    const response = await fetch(`${API_BASE_URL}/api/designs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: design.id,
            name: design.name,
            image: design.image,
            date: design.date,
        }),
    });

    let data;
    try {
        data = await response.json();
    } catch {
        throw new Error('Backend returned an invalid response.');
    }

    if (!response.ok || !data.success) {
        throw new Error(data.error || `Backend save failed (${response.status}).`);
    }

    return data.design || null;
}

async function loadDesignsFromBackend() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/designs`);

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Backend returned an invalid response.');
        }

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Failed to load designs (${response.status}).`);
        }

        return Array.isArray(data.designs) ? data.designs : [];
    } catch (error) {
        // Backend unavailable — return null (distinct from an empty array) so
        // callers know NOT to erase local-only designs.
        console.warn('Digital Rakhi: backend designs unavailable, using local storage only.', error);
        return null;
    }
}

async function deleteDesignFromBackend(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/designs/${id}`, { method: 'DELETE' });

        let data = {};
        try {
            data = await response.json();
        } catch {
            /* ignore parse errors on delete */
        }

        return response.ok && data.success !== false;
    } catch (error) {
        console.warn('Digital Rakhi: deleteDesignFromBackend failed.', error);
        return false;
    }
}

async function syncLocalDesignsToBackend() {
    const pending = state.designs.filter(
        (design) =>
            design.image &&
            (design.storageStatus === 'local' || design.storageStatus === 'pending' || !design.backendImageUrl)
    );

    for (const design of pending) {
        try {
            const backendDesign = await saveDesignToBackend(design);
            if (backendDesign) {
                design.backendImageUrl = normalizeImageUrl(backendDesign.image_url);
                design.storageStatus = 'synced';
            }
        } catch (error) {
            // Leave as local/pending; will retry on the next sync attempt.
        }
    }

    persistDesignsToStorage();
}

function mergeDesignLists(localDesigns, backendDesigns) {
    if (!backendDesigns) {
        // Backend unavailable — keep local designs exactly as they are.
        return localDesigns;
    }

    const merged = [...localDesigns];

    backendDesigns.forEach((backendDesign) => {
        const index = merged.findIndex((design) => design.id === backendDesign.id);
        const normalizedUrl = normalizeImageUrl(backendDesign.image_url);

        if (index >= 0) {
            merged[index] = {
                ...merged[index],
                name: merged[index].name || backendDesign.name,
                backendImageUrl: normalizedUrl,
                storageStatus: 'synced',
            };
        } else {
            merged.push({
                id: backendDesign.id,
                name: backendDesign.name || 'My Rakhi',
                date: backendDesign.date || new Date().toISOString(),
                image: null,
                backendImageUrl: normalizedUrl,
                storageStatus: 'backend',
            });
        }
    });

    return merged;
}


/* ==========================================================================
   20. LOCAL STORAGE (browser-side design persistence)
   ========================================================================== */

function generateDesignId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return `design_${window.crypto.randomUUID()}`;
    }
    return `design_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateDesignName() {
    let index = state.designs.length + 1;
    let name = `My Rakhi ${index}`;
    const existingNames = new Set(state.designs.map((design) => design.name));

    while (existingNames.has(name)) {
        index += 1;
        name = `My Rakhi ${index}`;
    }

    return name;
}

function normalizeDesignRecord(design) {
    return {
        id: design.id || generateDesignId(),
        name: design.name || 'My Rakhi',
        date: design.date || new Date().toISOString(),
        image: design.image || null,
        backendImageUrl: design.backendImageUrl || null,
        storageStatus: design.storageStatus || (design.image ? 'local' : 'backend'),
    };
}

function loadDesignsFromStorage() {
    try {
        const raw = localStorage.getItem(DESIGNS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        state.designs = Array.isArray(parsed) ? parsed.map(normalizeDesignRecord) : [];
    } catch (error) {
        console.error('Digital Rakhi: failed to load saved designs.', error);
        state.designs = [];
        showNotification('Could not load your saved designs.', 'error');
    }
    return state.designs;
}

function persistDesignsToStorage() {
    try {
        localStorage.setItem(DESIGNS_STORAGE_KEY, JSON.stringify(state.designs));
        return true;
    } catch (error) {
        if (error && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014)) {
            console.error('Digital Rakhi: localStorage quota exceeded.', error);
        } else {
            console.error('Digital Rakhi: failed to persist designs.', error);
        }
        return false;
    }
}

function getDesignPreviewSource(design) {
    if (design.image) return design.image;
    if (design.backendImageUrl) return design.backendImageUrl;
    return '';
}


/* ==========================================================================
   21. SAVE CURRENT DESIGN (local-first, backend as enhancement)
   ========================================================================== */

async function saveCurrentDesign() {
    if (!dom.canvas) {
        showNotification('No canvas available to save.', 'error');
        return;
    }

    let design;

    try {
        design = {
            id: generateDesignId(),
            name: generateDesignName(),
            date: new Date().toISOString(),
            image: dom.canvas.toDataURL('image/png'),
            backendImageUrl: null,
            storageStatus: 'local',
        };

        // 1. Save locally FIRST so the design shows up immediately, even if
        //    the backend is unreachable.
        state.designs.unshift(design);

        const persisted = persistDesignsToStorage();
        renderDesignGrid();

        if (!persisted) {
            showNotification('Browser storage is full. Your Rakhi could not be saved locally.', 'error');
        }
    } catch (error) {
        console.error('Digital Rakhi: saveCurrentDesign failed.', error);
        showNotification('Could not save your design.', 'error');
        return;
    }

    // 2. Attempt to also persist to the backend. This is an enhancement —
    //    failure here must never remove the local copy.
    try {
        const backendDesign = await saveDesignToBackend(design);
        if (backendDesign) {
            design.backendImageUrl = normalizeImageUrl(backendDesign.image_url);
            design.storageStatus = 'synced';
            persistDesignsToStorage();
            renderDesignGrid();
            showNotification('Rakhi saved successfully.', 'success');
        }
    } catch (error) {
        design.storageStatus = 'local';
        showNotification('Saved in this browser. Backend storage is currently unavailable.', 'info');
    }
}


/* ==========================================================================
   22. MY DESIGNS (rendering the merged local + backend grid)
   ========================================================================== */

function renderDesignGrid() {
    if (!dom.designGrid) return;

    dom.designGrid.querySelectorAll('.design-card').forEach((card) => card.remove());

    const hasDesigns = state.designs.length > 0;
    if (dom.designGridEmptyState) {
        dom.designGridEmptyState.hidden = hasDesigns;
    }

    if (!hasDesigns) return;

    state.designs.forEach((design) => {
        dom.designGrid.appendChild(createDesignCardElement(design));
    });
}

function createDesignCardElement(design) {
    const card = document.createElement('article');
    card.className = 'design-card';
    card.dataset.designId = design.id;
    card.setAttribute('role', 'listitem');

    const image = document.createElement('img');
    image.className = 'design-card-thumbnail';
    const previewSource = getDesignPreviewSource(design);
    if (previewSource) image.src = previewSource;
    image.alt = `Preview of ${design.name}`;

    const title = document.createElement('h3');
    title.className = 'design-card-title';
    title.textContent = design.name;

    const date = document.createElement('p');
    date.className = 'design-card-date';
    date.textContent = formatDate(design.date);

    const statusBadge = document.createElement('span');
    statusBadge.className = 'design-card-status';
    statusBadge.textContent =
        design.storageStatus === 'synced' || design.storageStatus === 'backend' ? 'Synced' : 'Saved locally';

    const actions = document.createElement('div');
    actions.className = 'design-card-actions';

    const openBtn = createDesignActionButton('Open', () => openDesignInEditor(design.id));
    const editBtn = createDesignActionButton('Edit', () => editDesign(design.id));
    const deleteBtn = createDesignActionButton('Delete', () => deleteDesign(design.id));
    const shareBtn = createDesignActionButton('Share', () => {
        state.selectedDesignId = design.id;
        navigateToPage('share');
    });

    actions.append(openBtn, editBtn, deleteBtn, shareBtn);
    card.append(image, title, date, statusBadge, actions);

    return card;
}

function createDesignActionButton(text, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.addEventListener('click', handler);
    return button;
}

async function deleteDesign(id) {
    if (!window.confirm('Delete this Rakhi design?')) return;

    // Attempt backend delete, but proceed with local removal regardless.
    await deleteDesignFromBackend(id).catch(() => false);

    state.designs = state.designs.filter((design) => design.id !== id);
    persistDesignsToStorage();
    renderDesignGrid();
    showNotification('Design deleted.', 'info');
}

function openDesignInEditor(id) {
    const design = state.designs.find((item) => item.id === id);
    if (!design) {
        showNotification('That design could not be found.', 'error');
        return;
    }

    const source = getDesignPreviewSource(design);
    if (!source) {
        showNotification('This design has no image data available.', 'error');
        return;
    }

    state.selectedDesignId = id;
    navigateToPage('create');

    setTimeout(() => {
        loadImageOntoCanvas(source);
    }, 950);
}

function editDesign(id) {
    openDesignInEditor(id);
}


/* ==========================================================================
   23. AI STUDIO
   ========================================================================== */

function setupAIStudio() {
    if (dom.aiPromptForm) {
        dom.aiPromptForm.addEventListener('submit', handleAIGenerateSubmit);
    }

    dom.aiExampleButtons.forEach((button) => {
        button.addEventListener('click', () => handleAIExamplePrompt(button));
    });

    if (dom.aiOpenInEditorBtn) {
        dom.aiOpenInEditorBtn.addEventListener('click', openAIImageInEditor);
    }
}

function handleAIExamplePrompt(button) {
    if (!dom.aiPromptInput) return;
    dom.aiPromptInput.value = button.dataset.prompt || button.textContent.trim();
    dom.aiPromptInput.focus();
}

async function handleAIGenerateSubmit(event) {
    event.preventDefault();

    // Always read the live value at submit time — never a cached copy.
    const prompt = dom.aiPromptInput ? dom.aiPromptInput.value.trim() : '';
    console.log('AI prompt:', prompt);

    if (!prompt) {
        showAIError('Please describe the Rakhi you would like AI to create.');
        return;
    }

    if (state.isGeneratingAI) return;

    showAILoading();
    hideAIError();
    hideAIResult();

    try {
        const imageUrl = await generateAIRakhi(prompt);
        showAIResult(imageUrl);
    } catch (error) {
        console.error('AI generation failed:', error);
        showAIError(error.message || 'Unable to generate the Rakhi right now. Please try again.');
    } finally {
        hideAILoading();
    }
}

async function generateAIRakhi(prompt) {
    state.isGeneratingAI = true;
    console.log(`Sending AI request to: ${API_BASE_URL}/generate`);

    try {
        let response;
        try {
            response = await fetch(`${API_BASE_URL}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
        } catch (networkError) {
            // fetch() rejects with a generic network error when the server
            // is unreachable (Flask not running, CORS blocked, offline, etc).
            throw new Error(
                `Could not connect to the Digital Rakhi backend. Make sure Flask is running on ${API_BASE_URL}.`
            );
        }

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('Backend returned an invalid response.');
        }

        console.log('AI backend response:', data);

        if (!response.ok || !data.success) {
            throw new Error(data.error || `Generation failed (${response.status}).`);
        }

        if (!data.image_url) {
            throw new Error('Backend did not return an image URL.');
        }

        return normalizeImageUrl(data.image_url);
    } finally {
        state.isGeneratingAI = false;
    }
}

function showAILoading() {
    if (dom.aiLoadingState) dom.aiLoadingState.hidden = false;
    if (dom.aiGenerateBtn) dom.aiGenerateBtn.disabled = true;
    if (dom.aiPromptInput) dom.aiPromptInput.disabled = true;
}

function hideAILoading() {
    if (dom.aiLoadingState) dom.aiLoadingState.hidden = true;
    if (dom.aiGenerateBtn) dom.aiGenerateBtn.disabled = false;
    if (dom.aiPromptInput) dom.aiPromptInput.disabled = false;
}

function showAIError(message) {
    if (dom.aiErrorText) dom.aiErrorText.textContent = message;
    if (dom.aiErrorMessage) dom.aiErrorMessage.hidden = false;
}

function hideAIError() {
    if (dom.aiErrorMessage) dom.aiErrorMessage.hidden = true;
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
    if (dom.aiGeneratedResult) dom.aiGeneratedResult.hidden = true;
}

function openAIImageInEditor() {
    if (!state.lastAIResultDataUrl) {
        showNotification('Generate a design first.', 'info');
        return;
    }

    navigateToPage('create');

    setTimeout(() => {
        loadImageOntoCanvas(state.lastAIResultDataUrl);
    }, 950);
}


/* ==========================================================================
   24. SHARE
   ========================================================================== */

function setupSharePage() {
    if (dom.copyLinkBtn) dom.copyLinkBtn.addEventListener('click', copyShareLink);
    if (dom.shareWhatsappBtn) dom.shareWhatsappBtn.addEventListener('click', shareViaWhatsApp);
    if (dom.shareOtherBtn) dom.shareOtherBtn.addEventListener('click', shareViaWebShareOrCopy);
    if (dom.shareDownloadBtn) dom.shareDownloadBtn.addEventListener('click', downloadCanvasAsPNG);
}

function prepareSharePageForSelectedDesign() {
    let imageSource = null;

    const design = state.designs.find((item) => item.id === state.selectedDesignId);
    if (design) {
        imageSource = getDesignPreviewSource(design);
    } else if (dom.canvas) {
        imageSource = dom.canvas.toDataURL('image/png');
    }

    if (imageSource && dom.sharePreviewImage) {
        dom.sharePreviewImage.src = imageSource;
        dom.sharePreviewImage.hidden = false;
    }

    if (dom.shareLinkInput) {
        const id = state.selectedDesignId || generateDesignId();
        dom.shareLinkInput.value = `https://digitalrakhi.app/r/${id}`;
    }

    if (dom.shareMessageInput && !dom.shareMessageInput.value) {
        dom.shareMessageInput.value = 'Happy Raksha Bandhan! ❤️';
    }
}

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
            dom.shareLinkInput.select();
            document.execCommand('copy');
        }
        showNotification('Rakhi link copied! ❤️', 'success');
    } catch (error) {
        console.error('Digital Rakhi: clipboard copy failed.', error);
        showNotification('Could not copy the link. Please copy it manually.', 'error');
    }
}

function shareViaWhatsApp() {
    const link = dom.shareLinkInput ? dom.shareLinkInput.value : '';
    const message = dom.shareMessageInput ? dom.shareMessageInput.value : 'Happy Raksha Bandhan! ❤️';

    const text = encodeURIComponent(`${message} ${link}`.trim());
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
}

async function shareViaWebShareOrCopy() {
    const link = dom.shareLinkInput ? dom.shareLinkInput.value : '';
    const message = dom.shareMessageInput ? dom.shareMessageInput.value : 'Happy Raksha Bandhan! ❤️';

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Digital Rakhi', text: message, url: link });
            return;
        } catch (error) {
            console.info('Digital Rakhi: native share dismissed or failed.', error);
            return;
        }
    }

    await copyShareLink();
}


/* ==========================================================================
   25. DOWNLOAD
   ========================================================================== */

function downloadCanvasAsPNG() {
    if (!dom.canvas) {
        showNotification('No canvas available to export.', 'error');
        return;
    }

    try {
        const dataUrl = dom.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'my-digital-rakhi.png';

        document.body.appendChild(link);
        link.click();
        link.remove();

        showNotification('Your Rakhi is downloading! ⬇️', 'success');
    } catch (error) {
        console.error('Digital Rakhi: failed to export canvas as PNG.', error);
        showNotification('Could not export your design.', 'error');
    }
}


/* ==========================================================================
   26. NOTIFICATIONS
   ========================================================================== */

const NOTIFICATION_CONTAINER_ID = 'notification-container';
const NOTIFICATION_DURATION_MS = 3200;

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

function showNotification(message, type = 'info') {
    const container = getOrCreateNotificationContainer();

    const toast = document.createElement('div');
    toast.className = `notification-toast notification-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('notification-hide');
        setTimeout(() => toast.remove(), 300);
    }, NOTIFICATION_DURATION_MS);
}


/* ==========================================================================
   27. KEYBOARD SHORTCUTS
   ========================================================================== */

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        const isTypingContext = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag);

        if (event.key === 'Escape') {
            closeAllPopups();
            if (state.isTransitioning) {
                hideRakhiTransition();
                state.isTransitioning = false;
            }
            return;
        }

        // Never hijack undo/redo shortcuts while the user is typing anywhere
        // (AI textarea, text tool input, color/size fields, etc).
        if (isTypingContext) return;

        const modifier = event.ctrlKey || event.metaKey;

        if (modifier && !event.shiftKey && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            undo();
            return;
        }

        if (modifier && event.shiftKey && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            redo();
        }
    });
}


/* ==========================================================================
   28. UTILITIES
   ========================================================================== */

function formatDate(isoDateString) {
    try {
        const date = new Date(isoDateString);
        if (Number.isNaN(date.getTime())) return 'Unknown date';
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return 'Unknown date';
    }
}

function setFooterYear() {
    if (dom.footerYear) {
        dom.footerYear.textContent = String(new Date().getFullYear());
    }
}


/* ==========================================================================
   29. INITIALIZATION
   ========================================================================== */

async function initializeApp() {
    try {
        cacheDOMReferences();
        injectToolPopupStyles();

        setupNavigation();
        initializeCanvas();
        setupToolbar();

        createColorPanel();
        createShapesPanel();
        createTextPanel();
        createRakhiElementsPanel();
        setupPopupDismissal();

        setupAIStudio();
        setupSharePage();
        setupKeyboardShortcuts();

        loadDesignsFromStorage();
        setFooterYear();

        showPage('home');
        setActiveNavItem('home');

        console.log('Digital Rakhi frontend initialized.');
        console.log(`AI backend: ${API_BASE_URL}`);

        // Try to merge in backend designs without blocking first paint.
        // If the backend is offline, this simply leaves local designs as-is.
        loadDesignsFromBackend().then((backendDesigns) => {
            state.designs = mergeDesignLists(state.designs, backendDesigns);
            persistDesignsToStorage();

            if (state.currentPage === 'my-designs') {
                renderDesignGrid();
            }

            if (backendDesigns) {
                // Backend is reachable — quietly push any local-only designs.
                syncLocalDesignsToBackend();
            }
        });
    } catch (error) {
        console.error('Digital Rakhi: initialization failed.', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
