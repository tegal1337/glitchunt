import argparse
import json
from urllib.parse import urljoin, urlparse
from collections import deque

from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from pyfiglet import Figlet

console = Console()

def print_banner():
    fig = Figlet(font="cybermedium")
    banner_text = fig.renderText("GlitchHunt")
    banner = Text.from_ansi(banner_text)
    banner.stylize("bold green")
    console.print(banner)
    console.print("[bold green]--------------------------- by Tegalsec Org")

    info_panel = Panel.fit(
        "[bold yellow]GlitchHunt[/] helps uncover [cyan]hidden[/], [red]disabled[/], and [magenta]unexpected UI elements[/] in authenticated and unauthenticated web environments.\n"
        "[green]Supports login session crawling, auto-enable & click actions, and interactive output.[/]\n\n"
        "[bold]Usage:[/] python3 glitchunt.py --help",
        title="[bold green]About[/]",
        border_style="green"
    )
    console.print(info_panel)

def scan_page_for_suspicious_elements(html):
    soup = BeautifulSoup(html, "html.parser")
    suspicious_elements = []
    for tag in soup.find_all():
        disabled = tag.has_attr("disabled")
        hidden = False
        style = tag.attrs.get("style", "")
        if "display:none" in style.replace(" ", "").lower() or "visibility:hidden" in style.replace(" ", "").lower():
            hidden = True
        if tag.has_attr("hidden"):
            hidden = True
        if disabled or hidden:
            suspicious_elements.append({
                "tag": tag.name,
                "id": tag.attrs.get("id", ""),
                "classes": " ".join(tag.attrs.get("class", [])),
                "disabled": disabled,
                "hidden": hidden,
            })
    return suspicious_elements

def enable_and_click_disabled_elements(page):
    selector = "button[disabled], input[disabled], select[disabled], textarea[disabled]"
    elements = page.query_selector_all(selector)
    enabled_elements = []
    for el in elements:
        try:
            page.evaluate("(el) => el.removeAttribute('disabled')", el)
            el.click(timeout=5000)
            desc = page.evaluate("(el) => el.outerHTML", el)
            enabled_elements.append(desc)
        except Exception as e:
            console.print(f"[red]Failed to enable/click element:[/] {e}")
    return enabled_elements

def print_suspicious_table(elements):
    table = Table(title="Suspicious UI Elements Found", header_style="bold green")
    table.add_column("No", justify="right")
    table.add_column("Tag", style="cyan")
    table.add_column("ID", style="magenta")
    table.add_column("Class", style="magenta")
    table.add_column("Disabled", justify="center", style="red")
    table.add_column("Hidden", justify="center", style="yellow")
    for i, el in enumerate(elements, 1):
        table.add_row(str(i), el["tag"], el["id"], el["classes"], str(el["disabled"]), str(el["hidden"]))
    console.print(table)

def scan_single_url(url, show_browser=False, save_log=False, keep_browser=False):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not show_browser)
        context = browser.new_context()
        page = context.new_page()
        console.print(f"[blue]Scanning single page:[/] {url}")
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        html = page.content()
        suspicious_elements = scan_page_for_suspicious_elements(html)
        print_suspicious_table(suspicious_elements)

        enabled_elements = enable_and_click_disabled_elements(page)
        console.print(f"[green]Auto-enabled and clicked {len(enabled_elements)} disabled elements[/]")

        if save_log:
            filename = f"log_{urlparse(url).netloc.replace('.', '_')}.json"
            log = {
                "url": url,
                "suspicious_elements": suspicious_elements,
                "enabled_elements_count": len(enabled_elements),
                "enabled_elements_html": enabled_elements,
            }
            with open(filename, "w") as f:
                json.dump(log, f, indent=2)
            console.print(f"[yellow]Saved log to {filename}[/]")

        if keep_browser:
            console.print("[bold green]Browser kept open. Press Enter to exit...[/]")
            input()

        browser.close()

def manual_login_and_save_state(login_url, show_browser=False):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not show_browser)
        context = browser.new_context()
        page = context.new_page()
        page.goto(login_url)
        console.print(f"[blue]Please login manually in the browser opened at {login_url}[/]")
        input("Press Enter here after successful login...")
        context.storage_state(path="state.json")
        browser.close()
        console.print("[green]Login state saved to state.json[/]")

def crawl_dashboard_all_links(start_url, show_browser=False, save_log=False, keep_browser=False):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=not show_browser)
        context = browser.new_context(storage_state="state.json")
        page = context.new_page()

        visited = set()
        queue = deque([start_url])
        full_log = []

        while queue:
            url = queue.popleft()
            if url in visited:
                continue

            console.print(f"\n[blue]Scanning {url}[/]")
            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
            except Exception as e:
                console.print(f"[red]Error loading {url}: {e}[/]")
                visited.add(url)
                continue

            html = page.content()
            suspicious_elements = scan_page_for_suspicious_elements(html)
            print_suspicious_table(suspicious_elements)

            enabled_elements = enable_and_click_disabled_elements(page)
            console.print(f"[green]Auto-enabled and clicked {len(enabled_elements)} disabled elements on {url}[/]")

            full_log.append({
                "url": url,
                "suspicious_elements": suspicious_elements,
                "enabled_elements_count": len(enabled_elements),
                "enabled_elements_html": enabled_elements,
            })

            visited.add(url)

            soup = BeautifulSoup(html, "html.parser")
            for link in soup.find_all("a", href=True):
                href = urljoin(url, link['href'])
                if urlparse(href).netloc == urlparse(start_url).netloc and href not in visited:
                    queue.append(href)

        if save_log:
            filename = f"dashboard_log_{urlparse(start_url).netloc.replace('.', '_')}.json"
            with open(filename, "w") as f:
                json.dump(full_log, f, indent=2)
            console.print(f"[yellow]Saved dashboard crawl log to {filename}[/]")

        if keep_browser:
            console.print("[bold green]Browser kept open. Press Enter to exit...[/]")
            input()

        browser.close()

def main():
    print_banner()  # Banner duluan tampil

    parser = argparse.ArgumentParser(
        description="GlitchHunt: Scan and exploit disabled/hidden UI elements with login support.",
        formatter_class=argparse.RawTextHelpFormatter,
        add_help=False  # Disable otomatis help supaya bisa custom
    )
    group = parser.add_mutually_exclusive_group(required=False)
    group.add_argument("--single-url", help="Scan a single URL without login")
    group.add_argument("--dashboard", help="Dashboard URL to crawl after login")
    parser.add_argument("--login", help="Login URL for manual login (required with --dashboard)")
    parser.add_argument("--show-browser", action="store_true", help="Show browser during scan")
    parser.add_argument("--keep-browser", action="store_true", help="Keep browser open after scan")
    parser.add_argument("--save-log", action="store_true", help="Save scan results to JSON log file")
    parser.add_argument("-h", "--help", action="help", help="Show this help message and exit")

    try:
        args = parser.parse_args()
    except SystemExit:
        # Kalau parsing error, jangan langsung exit, biar banner keliatan
        console.print("\n[red]Error: Arguments are required. Use -h for help.[/red]")
        exit(1)

    if args.dashboard and not args.login:
        console.print("[red]Error: --login is required when using --dashboard[/red]")
        exit(1)

    if args.single_url:
        scan_single_url(
            args.single_url,
            show_browser=args.show_browser,
            save_log=args.save_log,
            keep_browser=args.keep_browser
        )
    elif args.dashboard:
        console.print("[bold]Step 1: Manual Login[/bold]")
        manual_login_and_save_state(args.login, show_browser=args.show_browser)
        console.print("\n[bold]Step 2: Crawling Dashboard[/bold]")
        crawl_dashboard_all_links(
            args.dashboard,
            show_browser=args.show_browser,
            save_log=args.save_log,
            keep_browser=args.keep_browser
        )

if __name__ == "__main__":
    main()
