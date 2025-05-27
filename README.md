# GlitchHunt

GlitchHunt is a Python-based tool designed to scan web pages for suspicious UI elements that are disabled or hidden but can be enabled and triggered programmatically. This tool helps security researchers and penetration testers to discover hidden functionalities or bugs in web applications that might lead to security issues.

---

## Features

- Scan single web pages for disabled or hidden UI elements.
- Detects attributes like `disabled`, `hidden`, and styles like `display: none` or `visibility: hidden`.
- Auto-enable and click on disabled buttons or inputs to test for hidden features.
- Supports manual login workflows for scanning authenticated dashboards.
- Crawls all internal links within the dashboard or single page context.
- Save scan results and logs in JSON format.
- User-friendly CLI with optional browser display.
- Stylish output with tables and ASCII art header.

---

## Installation

Make sure you have Python 3.7+ installed.

Install dependencies using pip:

```bash
pip install playwright beautifulsoup4 rich
playwright install
```

---

## Usage

### Scan a single URL without login

```bash
python glitchunt.py --single-url https://example.com/page.html --show-browser --save-log
```

### Scan authenticated dashboard (manual login required)

```bash
python glitchunt.py --login https://example.com/login --dashboard https://example.com/dashboard --show-browser --keep-browser --save-log
```

Steps:

- The browser will open at the login page.
- You perform the login manually.
- Once logged in, return to the terminal and press Enter.
- GlitchHunt will start crawling and scanning the dashboard pages.

---

## Command Line Arguments

| Argument          | Description                                                  |
|-------------------|--------------------------------------------------------------|
| `--single-url`    | Scan a single URL without login                              |
| `--dashboard`     | Dashboard URL to crawl after login                           |
| `--login`         | Login URL for manual login (required with `--dashboard`)    |
| `--show-browser`  | Show browser during scan (headless mode off)                |
| `--keep-browser`  | Keep browser open after scan (for debugging)                |
| `--save-log`      | Save scan results to JSON log file                           |
| `--auto-enable`      | Automatically enable and click all disabled elements detected                           |

---

## Example Output

```
└─$ python3 glitchunt.py --single-url https://example.com --show-browser --keep-browser
____ _    _ ___ ____ _  _ _  _ _  _ _  _ ___
| __ |    |  |  |    |__| |__| |  | |\ |  |
|__] |___ |  |  |___ |  | |  | |__| | \|  |

--------------------------- by Tegalsec Org
╭────────────────────────────────────────────── About ───────────────────────────────────────────────╮
│ GlitchHunt helps uncover hidden, disabled, and unexpected UI elements in authenticated and         │
│ unauthenticated web environments.                                                                  │
│ Supports login session crawling, auto-enable & click actions, and interactive output.              │
│                                                                                                    │
│ Usage: python3 glitchunt.py --help                                                                 │
╰────────────────────────────────────────────────────────────────────────────────────────────────────╯
Scanning single page: https://example.com
              Suspicious UI Elements Found
┏━━━━┳━━━━━━━━┳━━━━━━━━━━━━┳━━━━━━━┳━━━━━━━━━━┳━━━━━━━━┓
┃ No ┃ Tag    ┃ ID         ┃ Class ┃ Disabled ┃ Hidden ┃
┡━━━━╇━━━━━━━━╇━━━━━━━━━━━━╇━━━━━━━╇━━━━━━━━━━╇━━━━━━━━┩
│  1 │ button │ hidden-btn │       │   True   │ False  │
│  2 │ div    │ hidden-div │       │  False   │  True  │
└────┴────────┴────────────┴───────┴──────────┴────────┘
Auto-enabled and clicked 1 disabled elements
Browser kept open. Press Enter to exit...
```
---
## Example JSON Output

Here’s what the JSON log looks like when `--save-log` is used:
```
{
  "scanned_url": "https://example.com/page.html",
  "timestamp": "2025-05-27T15:12:03Z",
  "hidden_elements": [
    {
      "tag": "div",
      "id": "sidebar-ad",
      "class": "",
      "attributes": {
        "hidden": true
      },
      "styles": {
        "display": "none"
      },
      "outerHTML": "<div id=\"sidebar-ad\" style=\"display: none;\">Ad Content</div>"
    }
  ],
  "disabled_elements": [
    {
      "tag": "button",
      "id": "add-acc",
      "class": "",
      "attributes": {
        "disabled": true
      },
      "outerHTML": "<button id=\"add-acc\" disabled>Add Account</button>",
      "click_result": "clicked_successfully"
    }
  ]
}
```
## 🤝 Contributing
We welcome contributions from the community! Feel free to open a pull request or submit an issue if you find bugs or have feature suggestions.
