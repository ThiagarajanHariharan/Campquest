import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:3000")
        await page.wait_for_selector(".ql-btn")
        await page.locator(".ql-btn").first.click()
        await page.locator("text=Sign In").click()
        await page.wait_for_selector(".icon-btn")
        await page.keyboard.press("Tab")
        await page.keyboard.press("Tab")
        await page.screenshot(path="focus_visible.png")
        await browser.close()

asyncio.run(main())
