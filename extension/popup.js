class HiddenElementFinder {
    constructor() {
        this.elements = [];
        this.categories = {
            hidden: [],
            display: [],
            visibility: [],
            opacity: []
        };
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCategoryToggles();

        // Ambil hasil scan terakhir dari storage
        chrome.storage.local.get('hiddenFinderResults', (result) => {
            if (result.hiddenFinderResults && Array.isArray(result.hiddenFinderResults)) {
                this.displayResults(result.hiddenFinderResults);
            }
        });
    }

    bindEvents() {
        const scanBtn = document.getElementById('scanBtn');
        scanBtn.addEventListener('click', () => this.scanPage());

        // Listen for messages from content script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'SCAN_COMPLETE') {
                this.displayResults(message.elements);
            }
        });

        // Handler clear memory button
        const clearBtn = document.getElementById('clearMemoryBtn');
        

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                chrome.storage.local.remove('hiddenFinderResults', () => {
                    this.elements = [];
                    this.categorizeElements();
                    this.updateUI();
                });
                clearBtn.classList.add('hidden');
            });
        }
    }

    setupCategoryToggles() {
        const categoryHeaders = document.querySelectorAll('.category-header');
        categoryHeaders.forEach(header => {
            header.addEventListener('click', () => {
                this.toggleCategory(header);
            });
        });
    }

    toggleCategory(header) {
        const categoryItems = header.nextElementSibling;
        const toggle = header.querySelector('.category-toggle');
        
        header.classList.toggle('collapsed');
        categoryItems.classList.toggle('collapsed');
        
        if (header.classList.contains('collapsed')) {
            toggle.textContent = '▶';
        } else {
            toggle.textContent = '▼';
        }
    }

    async scanPage() {
        const scanBtn = document.getElementById('scanBtn');
        const scanText = scanBtn.querySelector('.scan-text');
        const scanLoader = scanBtn.querySelector('.scan-loader');
        const clearBtn = document.getElementById('clearMemoryBtn');
        
        // Show loading state
        scanText.classList.add('hidden');
        scanLoader.classList.remove('hidden');
        scanBtn.style.pointerEvents = 'none';
        clearBtn.classList.remove('hidden');

        try {
            // Get active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Helper to send scan message
            const sendScanMessage = () => new Promise(resolve => {
                chrome.tabs.sendMessage(tab.id, { type: 'FIND_HIDDEN_ELEMENTS' }, resolve);
            });

            // Try sending message to content script
            let response = await sendScanMessage();

            // If no response, inject content script then try again (with polling)
            if (!response || !response.success) {
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content.js']
                    });
                } catch (err) {
                    console.error('Failed to inject content script:', err);
                    this.showError('Failed to inject content script.');
                    return;
                }

                // Poll up to 10x (max 1s) for content script to be ready
                let attempts = 0;
                while ((!response || !response.success) && attempts < 10) {
                    await new Promise(res => setTimeout(res, 100));
                    response = await sendScanMessage();
                    attempts++;
                }
            }

            if (response && response.success) {
                this.displayResults(response.elements);
                chrome.storage.local.set({ hiddenFinderResults: response.elements });
            } else {
                this.showError('Failed to scan page. Please try again.');
            }
        } catch (error) {
            console.error('Error scanning page:', error);
            this.showError('Failed to scan page. Please try again.');
        } finally {
            // Reset button state
            setTimeout(() => {
                scanText.classList.remove('hidden');
                scanLoader.classList.add('hidden');
                scanBtn.style.pointerEvents = 'auto';
            }, 1000);
        }
    }

    scanForHiddenElements() {
        // This function runs in the content script context
        const hiddenElements = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach((element, index) => {
            const computedStyle = window.getComputedStyle(element);
            const elementData = {
                id: `element_${index}`,
                tagName: element.tagName.toLowerCase(),
                className: element.className || '',
                textContent: element.textContent?.substring(0, 50) || '',
                selector: this.generateSelector(element),
                type: null
            };

            // Check for hidden attribute
            if (element.hasAttribute('hidden')) {
                elementData.type = 'hidden';
                hiddenElements.push(elementData);
            }
            // Check for display: none
            else if (computedStyle.display === 'none') {
                elementData.type = 'display';
                hiddenElements.push(elementData);
            }
            // Check for visibility: hidden
            else if (computedStyle.visibility === 'hidden') {
                elementData.type = 'visibility';
                hiddenElements.push(elementData);
            }
            // Check for opacity: 0
            else if (computedStyle.opacity === '0') {
                elementData.type = 'opacity';
                hiddenElements.push(elementData);
            }
        });

        // Store elements in a global variable for later access
        window.hiddenElementsData = hiddenElements;

        // Send results back to popup
        chrome.runtime.sendMessage({
            type: 'SCAN_COMPLETE',
            elements: hiddenElements
        });
    }

    generateSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        let selector = element.tagName.toLowerCase();
        
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c);
            if (classes.length > 0) {
                selector += '.' + classes.slice(0, 2).join('.');
            }
        }
        
        // Add position if needed for uniqueness
        const parent = element.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(child => 
                child.tagName === element.tagName
            );
            if (siblings.length > 1) {
                const index = siblings.indexOf(element) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }
        
        return selector;
    }

    displayResults(elements) {
        this.elements = elements;
        this.categorizeElements();
        this.updateUI();
    }

    categorizeElements() {
        // Reset categories
        this.categories = {
            hidden: [],
            display: [],
            visibility: [],
            opacity: []
        };

        this.elements.forEach(element => {
            if (this.categories[element.type]) {
                this.categories[element.type].push(element);
            }
        });
    }

    updateUI() {
        const totalCount = document.getElementById('totalCount');
        const noResults = document.getElementById('noResults');
        const resultsContent = document.getElementById('resultsContent');

        totalCount.textContent = this.elements.length;

        if (this.elements.length === 0) {
            noResults.classList.remove('hidden');
            resultsContent.classList.add('hidden');
            return;
        }

        noResults.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        // Update each category
        this.updateCategory('hidden', 'hiddenAttr');
        this.updateCategory('display', 'displayNone');
        this.updateCategory('visibility', 'visibilityHidden');
        this.updateCategory('opacity', 'opacityZero');
    }

    updateCategory(categoryKey, categoryId) {
        const categoryGroup = document.getElementById(categoryId);
        const categoryCount = categoryGroup.querySelector('.category-count');
        const categoryItems = categoryGroup.querySelector('.category-items');
        
        const elements = this.categories[categoryKey];
        categoryCount.textContent = elements.length;

        // Hide category if no elements
        if (elements.length === 0) {
            categoryGroup.style.display = 'none';
            return;
        }

        categoryGroup.style.display = 'block';
        categoryItems.innerHTML = '';

        elements.forEach(element => {
            const elementItem = this.createElementItem(element);
            categoryItems.appendChild(elementItem);
        });
    }

    createElementItem(element) {
        const item = document.createElement('div');
        item.className = 'element-item';
        
        const displayText = element.textContent.trim() || 
                          (element.className ? `.${element.className.split(' ')[0]}` : element.tagName);

        item.innerHTML = `
            <div class="element-info">
                <div class="element-tag">&lt;${element.tagName}&gt;</div>
                <div class="element-selector">${displayText}</div>
            </div>
            <div class="element-actions">
                <button class="action-btn show-btn" data-action="show" data-element-id="${element.id}">
                    Show
                </button>
                <button class="action-btn scroll-btn" data-action="scroll" data-element-id="${element.id}">
                    Go To
                </button>
            </div>
        `;

        // Bind action buttons
        const actionBtns = item.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const elementId = e.target.dataset.elementId;
                this.handleElementAction(action, elementId, e.target);
            });
        });

        return item;
    }

    async handleElementAction(action, elementId, buttonElement) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            // Find the element data from the current list
            const elementData = this.elements.find(el => el.id === elementId);
            if (!elementData) return;

            // Send message to content script to perform the action
            const response = await chrome.tabs.sendMessage(tab.id, {
                type: 'ELEMENT_ACTION',
                action,
                elementData
            });

            // Update button state for toggle
            if (action === 'show' && response && response.success) {
                buttonElement.textContent = 'Hide';
                buttonElement.classList.remove('show-btn');
                buttonElement.classList.add('hide-btn');
                buttonElement.dataset.action = 'hide';
            } else if (action === 'hide' && response && response.success) {
                buttonElement.textContent = 'Show';
                buttonElement.classList.remove('hide-btn');
                buttonElement.classList.add('show-btn');
                buttonElement.dataset.action = 'show';
            }

        } catch (error) {
            console.error('Error executing element action:', error);
        }
    }

    showError(message) {
        // Could implement a toast notification here
        console.error(message);
    }
}

// Initialize the extension when popup loads
document.addEventListener('DOMContentLoaded', () => {
    new HiddenElementFinder();
});