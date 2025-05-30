
(function() {
    'use strict';
    
    // Prevent multiple injections
    if (window.hiddenElementFinderInjected) {
        return;
    }
    window.hiddenElementFinderInjected = true;

    // Global storage for found hidden elements
    window.hiddenElementsData = [];

    // Enhanced selector generation function
    function generateUniqueSelector(element) {
        if (element.id) {
            return `#${element.id}`;
        }
        
        let selector = element.tagName.toLowerCase();
        
        // Add class information
        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).filter(c => c);
            if (classes.length > 0) {
                // Use first 2 classes to avoid overly long selectors
                selector += '.' + classes.slice(0, 2).join('.');
            }
        }
        
        // Add nth-child for uniqueness if needed
        const parent = element.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(child => 
                child.tagName === element.tagName && 
                child.className === element.className
            );
            
            if (siblings.length > 1) {
                const index = siblings.indexOf(element) + 1;
                selector += `:nth-child(${index})`;
            }
        }
        
        return selector;
    }

    // Function to get element text preview
    function getElementPreview(element) {
        let text = '';
        
        // Try different text sources
        if (element.textContent) {
            text = element.textContent.trim();
        } else if (element.innerText) {
            text = element.innerText.trim();
        } else if (element.value) {
            text = `[${element.type || 'input'}] ${element.value}`;
        } else if (element.placeholder) {
            text = `[placeholder] ${element.placeholder}`;
        } else if (element.alt) {
            text = `[alt] ${element.alt}`;
        } else if (element.title) {
            text = `[title] ${element.title}`;
        }
        
        // Truncate long text
        if (text.length > 50) {
            text = text.substring(0, 47) + '...';
        }
        
        return text || `<${element.tagName.toLowerCase()}>`;
    }

    // Enhanced hidden element detection
    function findHiddenElements() {
        const hiddenElements = [];
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach((element, index) => {
            try {
                const computedStyle = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                
                let hiddenType = null;
                let hiddenReason = '';

                // Check various hiding methods
                if (element.hasAttribute('hidden')) {
                    hiddenType = 'hidden';
                    hiddenReason = 'hidden attribute';
                } else if (computedStyle.display === 'none') {
                    hiddenType = 'display';
                    hiddenReason = 'display: none';
                } else if (computedStyle.visibility === 'hidden') {
                    hiddenType = 'visibility';
                    hiddenReason = 'visibility: hidden';
                } else if (parseFloat(computedStyle.opacity) === 0) {
                    hiddenType = 'opacity';
                    hiddenReason = 'opacity: 0';
                }

                if (hiddenType) {
                    const elementData = {
                        id: `element_${index}_${Date.now()}`,
                        tagName: element.tagName.toLowerCase(),
                        className: element.className || '',
                        textContent: getElementPreview(element),
                        selector: generateUniqueSelector(element),
                        type: hiddenType,
                        reason: hiddenReason,
                        xpath: getXPath(element),
                        attributes: getRelevantAttributes(element),
                        position: {
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        }
                    };

                    hiddenElements.push(elementData);
                }
            } catch (error) {
                console.warn('Error processing element:', error);
            }
        });
        
        return hiddenElements;
    }

    // Generate XPath for element
    function getXPath(element) {
        if (element.id) {
            return `//*[@id="${element.id}"]`;
        }
        
        const parts = [];
        let current = element;
        
        while (current && current.nodeType === Node.ELEMENT_NODE) {
            let part = current.tagName.toLowerCase();
            
            if (current.parentNode) {
                const siblings = Array.from(current.parentNode.children)
                    .filter(child => child.tagName === current.tagName);
                
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    part += `[${index}]`;
                }
            }
            
            parts.unshift(part);
            current = current.parentNode;
            
            // Limit depth to avoid very long XPaths
            if (parts.length > 10) break;
        }
        
        return '/' + parts.join('/');
    }

    // Get relevant attributes for debugging
    function getRelevantAttributes(element) {
        const attrs = {};
        const relevantAttrs = ['id', 'class', 'data-*', 'aria-*', 'role', 'type', 'name'];
        
        for (let attr of element.attributes) {
            if (relevantAttrs.some(pattern => 
                pattern.includes('*') ? 
                attr.name.startsWith(pattern.replace('*', '')) : 
                attr.name === pattern
            )) {
                attrs[attr.name] = attr.value;
            }
        }
        
        return attrs;
    }

    // Element manipulation functions
    function showElement(elementData) {
        const element = findElementByData(elementData);
        if (!element) return false;

        try {
            // Jika ada timeout highlight dari scroll, batalkan
            if (element._hiddenFinderTimeout) {
                clearTimeout(element._hiddenFinderTimeout);
                element._hiddenFinderTimeout = null;
            }

            // Store original state
            if (!element.dataset.originalHiddenState) {
                element.dataset.originalHiddenState = JSON.stringify({
                    hidden: element.hasAttribute('hidden'),
                    display: element.style.display,
                    visibility: element.style.visibility,
                    opacity: element.style.opacity,
                    outline: element.style.outline,
                    outlineOffset: element.style.outlineOffset,
                    type: elementData.type
                });
            }

            // Make element visible
            element.removeAttribute('hidden');
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';

            // Add dashed outline for a few seconds
            element.style.outline = '1.5px dashed brown';
            element.style.outlineOffset = '2px';

            // Remove outline after 2 seconds
            if (element._hiddenFinderShowTimeout) {
                clearTimeout(element._hiddenFinderShowTimeout);
            }
            element._hiddenFinderShowTimeout = setTimeout(() => {
                element.style.outline = '';
                element.style.outlineOffset = '';
                element._hiddenFinderShowTimeout = null;
            }, 2000);

            // Mark as temporarily shown
            element.dataset.temporarilyShown = 'true';

            return true;
        } catch (error) {
            console.error('Error showing element:', error);
            return false;
        }
    }

    function hideElement(elementData) {
        const element = findElementByData(elementData);
        if (!element || !element.dataset.originalHiddenState) return false;

        try {
            const originalState = JSON.parse(element.dataset.originalHiddenState);

            // Restore original hidden state
            if (originalState.hidden) {
                element.setAttribute('hidden', '');
            } else {
                element.removeAttribute('hidden');
            }

            // display
            if (originalState.display !== undefined && originalState.display !== null && originalState.display !== '') {
                element.style.display = originalState.display;
            } else if (originalState.type === 'display') {
                element.style.display = 'none';
            } else {
                element.style.display = '';
            }

            // visibility
            if (originalState.visibility !== undefined && originalState.visibility !== null && originalState.visibility !== '') {
                element.style.visibility = originalState.visibility;
            } else if (originalState.type === 'visibility') {
                element.style.visibility = 'hidden';
            } else {
                element.style.visibility = '';
            }

            // opacity
            if (originalState.opacity !== undefined && originalState.opacity !== null && originalState.opacity !== '') {
                element.style.opacity = originalState.opacity;
            } else if (originalState.type === 'opacity') {
                element.style.opacity = '0';
            } else {
                element.style.opacity = '';
            }

            // Remove highlighting
            element.style.outline = '';
            element.style.outlineOffset = '';

            // Remove temporary markers and timeout
            delete element.dataset.temporarilyShown;
            delete element.dataset.originalHiddenState;
            if (element._hiddenFinderTimeout) {
                clearTimeout(element._hiddenFinderTimeout);
                element._hiddenFinderTimeout = null;
            }
            if (element._hiddenFinderShowTimeout) {
                clearTimeout(element._hiddenFinderShowTimeout);
                element._hiddenFinderShowTimeout = null;
            }

            return true;
        } catch (error) {
            console.error('Error hiding element:', error);
            return false;
        }
    }

    function scrollToElement(elementData) {
        const element = findElementByData(elementData);
        if (!element) return false;

        try {
            // Temporarily show element if hidden for scrolling
            const wasHidden = isElementHidden(element);

            if (wasHidden) {
                element.style.display = 'block';
                element.style.visibility = 'visible';
                element.style.opacity = '1';
                element.removeAttribute('hidden');
            }

            // Scroll to element
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });

            // Add temporary highlight
            const originalOutline = element.style.outline;
            const originalOutlineOffset = element.style.outlineOffset;

            element.style.outline = '1.5px dashed brown';
            element.style.outlineOffset = '2px';

            // Jika ada timeout highlight sebelumnya, batalkan
            if (element._hiddenFinderTimeout) {
                clearTimeout(element._hiddenFinderTimeout);
            }

            // Remove highlight and restore state after delay
            element._hiddenFinderTimeout = setTimeout(() => {
                element.style.outline = originalOutline;
                element.style.outlineOffset = originalOutlineOffset;

                // Restore hidden state if it was originally hidden
                // Hanya jika belum di-show oleh user (dicek via dataset.temporarilyShown)
                if (wasHidden && !element.dataset.temporarilyShown) {
                    if (elementData.type === 'hidden') {
                        element.setAttribute('hidden', '');
                        element.style.display = 'none';
                    } else if (elementData.type === 'display') {
                        element.style.display = 'none';
                    } else if (elementData.type === 'visibility') {
                        element.style.visibility = 'hidden';
                    } else if (elementData.type === 'opacity') {
                        element.style.opacity = '0';
                    }
                }
                element._hiddenFinderTimeout = null;
            }, 2000);

            return true;
        } catch (error) {
            console.error('Error scrolling to element:', error);
            return false;
        }
    }

    // Helper function to find element by stored data
    function findElementByData(elementData) {
        // try to find element by selector first
        let elements = [];
        try {
            elements = Array.from(document.querySelectorAll(elementData.selector));
        } catch (e) {
            elements = [];
        }

        // if no elements found by selector, try XPath
        if (elements.length === 1) return elements[0];

        // if multiple elements found, try to find by XPath
        if (elements.length > 1 && elementData.xpath) {
            try {
                const xpathResult = document.evaluate(
                    elementData.xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                if (xpathResult) return xpathResult;
            } catch (e) {}
        }

        // Fallback: if no elements found by selector or XPath, try to find by ID
        if ((!elements || elements.length === 0) && elementData.xpath) {
            try {
                const xpathResult = document.evaluate(
                    elementData.xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                ).singleNodeValue;
                if (xpathResult) return xpathResult;
            } catch (e) {}
        }

        // if still no element found, return null
        return null;
    }

    // Helper function to check if element is hidden
    function isElementHidden(element) {
        const computedStyle = window.getComputedStyle(element);
        return element.hasAttribute('hidden') ||
               computedStyle.display === 'none' ||
               computedStyle.visibility === 'hidden' ||
               parseFloat(computedStyle.opacity) === 0;
    }

    // Message listener for popup communication
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'FIND_HIDDEN_ELEMENTS') {
            try {
                const elements = findHiddenElements();
                window.hiddenElementsData = elements;
                sendResponse({ success: true, elements });
            } catch (error) {
                console.error('Error finding hidden elements:', error);
                sendResponse({ success: false, error: error.message });
            }
        } else if (message.type === 'ELEMENT_ACTION') {
            try {
                const { action, elementData } = message;
                let result = false;
                
                switch (action) {
                    case 'show':
                        result = showElement(elementData);
                        break;
                    case 'hide':
                        result = hideElement(elementData);
                        break;
                    case 'scroll':
                        result = scrollToElement(elementData);
                        break;
                }
                
                sendResponse({ success: result });
            } catch (error) {
                console.error('Error executing element action:', error);
                sendResponse({ success: false, error: error.message });
            }
        }
        
        return true; // Keep message channel open for async responses
    });

    // Auto-scan on page load (optional)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Could auto-scan here if desired
        });
    }

    console.log('Hidden Element Finder content script loaded');
})();