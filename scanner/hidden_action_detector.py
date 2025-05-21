from playwright.sync_api import Page

def detect_hidden_actionable_elements(page: Page):
    script = """
    () => {
        function hasInlineClick(el) {
            return !!el.onclick;
        }
        const suspicious = [];
        const elements = Array.from(document.querySelectorAll('button, input, a, div, span'));
        elements.forEach(el => {
            const style = window.getComputedStyle(el);
            const disabled = el.disabled || el.hasAttribute('disabled');
            const hidden = style.display === 'none' || style.visibility === 'hidden' || el.hidden;
            if ((disabled || hidden) && hasInlineClick(el)) {
                suspicious.push({
                    tag: el.tagName,
                    id: el.id,
                    classes: el.className,
                    outerHTML: el.outerHTML,
                    disabled,
                    hidden
                });
            }
        });
        return suspicious;
    }
    """
    return page.evaluate(script)
