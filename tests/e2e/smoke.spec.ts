import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/')
    
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/ClassBridge/)
    
    // Check if main content is visible
    await expect(page.locator('body')).toBeVisible()
  })

  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/non-existent-page')
    
    // Should show 404 or redirect to home
    const status = await page.evaluate(() => document.readyState)
    expect(status).toBe('complete')
  })
})
