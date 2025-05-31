# Hidden Element Finder

Hidden Element Finder is a Chrome extension that helps you find and manipulate hidden elements on any web page. It detects elements hidden by the `hidden` attribute, `display: none`, `visibility: hidden`, or `opacity: 0`, and allows you to reveal or scroll to them directly from the extension popup.

## Features
- Scan the current page for hidden elements
- Categorized results by hiding method
- Reveal hidden elements or scroll to them

## Installation

1. **Clone or Download the Repository**
   ```sh
   git clone <this-repo-url>
   cd extension
   ```

2. **Open Chrome and go to Extensions**
   - Visit `chrome://extensions/`
   - Enable **Developer mode** (top right)

3. **Load the Extension**
   - Click **Load unpacked**
   - Select the folder where you cloned/downloaded this project

4. **Usage**
   - Click the extension icon in your browser
   - Click **SCAN** to find hidden elements on the current page
   - Use the buttons to reveal or scroll to any hidden element

## Permissions
- `activeTab`, `scripting`, `storage`, `contextMenus` (see `manifest.json`)

## Notes
- This extension works on most web pages, but some sites may restrict content script access.
- For best results, refresh the page before scanning if you encounter issues.
