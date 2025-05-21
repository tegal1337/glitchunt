# GlitchHunt

GlitchHunt is a Python-based tool designed to scan web pages for suspicious UI elements that are disabled or hidden but can be enabled and triggered programmatically. This tool helps security researchers and penetration testers to discover hidden functionalities or bugs in web applications that might lead to security issues.

---

## Features

- Scan single web pages for disabled or hidden UI elements.
- Auto-enable and click on disabled buttons or inputs to test for hidden features.
- Support manual login to access authenticated dashboards.
- Crawl and scan all links within authenticated dashboards.
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
python glitchunt.py --login https://example.com/login --dashboard https://example.com/dashboard --show-browser --save-log
```

- The tool will open the login page in a browser.
- Perform manual login.
- Press Enter in the terminal after successful login.
- The tool saves the login state and crawls the dashboard recursively.

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
