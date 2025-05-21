from playwright.sync_api import sync_playwright
from urllib.parse import urljoin, urlparse
from collections import deque
from bs4 import BeautifulSoup
import logging

def crawl_and_scan(start_url, max_depth=2):
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("GlitchHunt")

    visited = set()
    results = []

    def is_valid_url(url):
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        queue = deque()
        queue.append((start_url, 0))

        while queue:
            url, depth = queue.popleft()
            if url in visited or depth > max_depth:
                continue

            try:
                logger.info(f"Crawling: {url} (depth {depth})")
                page = context.new_page()
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
                html = page.content()
                soup = BeautifulSoup(html, "html.parser")

                elements = []
                for tag in soup.find_all():
                    disabled = tag.has_attr("disabled")
                    hidden = False

                    style = tag.attrs.get("style", "")
                    if "display:none" in style.replace(" ", "").lower() or "visibility:hidden" in style.replace(" ", "").lower():
                        hidden = True
                    if tag.has_attr("hidden"):
                        hidden = True

                    if disabled or hidden:
                        el_id = tag.attrs.get("id", "")
                        el_class = " ".join(tag.attrs.get("class", []))
                        elements.append({
                            "tag": tag.name.upper(),
                            "id": el_id,
                            "classes": el_class,
                            "disabled": disabled,
                            "hidden": hidden,
                        })

                if elements:
                    results.append({
                        "url": url,
                        "elements": elements,
                    })

                visited.add(url)

                if depth < max_depth:
                    for link in soup.find_all("a", href=True):
                        href = urljoin(url, link['href'])
                        if is_valid_url(href) and href not in visited:
                            queue.append((href, depth + 1))

                page.close()

            except Exception as e:
                logger.warning(f"Error accessing {url}: {e}")

        browser.close()

    return results
