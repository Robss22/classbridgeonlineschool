import { test, expect } from '@playwright/test'

test.describe('Live Classes E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the live classes page
    await page.goto('/admin/live-classes')
  })

  test('should display live classes list', async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="live-classes-list"]', { timeout: 10000 })
    
    // Check if the page title is visible
    await expect(page.locator('h1')).toContainText('Live Classes')
    
    // Check if the create button is visible
    await expect(page.locator('[data-testid="create-live-class-btn"]')).toBeVisible()
  })

  test('should create a new live class', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-live-class-btn"]')
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="live-class-modal"]')
    
    // Fill in the form
    await page.fill('[data-testid="title-input"]', 'Test Live Class')
    await page.fill('[data-testid="description-input"]', 'This is a test live class')
    await page.fill('[data-testid="date-input"]', '2024-12-25')
    await page.fill('[data-testid="start-time-input"]', '10:00')
    await page.fill('[data-testid="end-time-input"]', '11:00')
    
    // Submit the form
    await page.click('[data-testid="submit-btn"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    
    // Check if the new class appears in the list
    await expect(page.locator('text=Test Live Class')).toBeVisible()
  })

  test('should edit an existing live class', async ({ page }) => {
    // Find and click edit button for first live class
    await page.locator('[data-testid="edit-live-class-btn"]').first().click()
    
    // Wait for modal to appear
    await page.waitForSelector('[data-testid="live-class-modal"]')
    
    // Update the title
    await page.fill('[data-testid="title-input"]', 'Updated Live Class Title')
    
    // Submit the form
    await page.click('[data-testid="submit-btn"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
    
    // Check if the updated title appears
    await expect(page.locator('text=Updated Live Class Title')).toBeVisible()
  })

  test('should delete a live class', async ({ page }) => {
    // Find and click delete button for first live class
    await page.locator('[data-testid="delete-live-class-btn"]').first().click()
    
    // Wait for confirmation modal
    await page.waitForSelector('[data-testid="confirm-modal"]')
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-btn"]')
    
    // Wait for success message
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible()
  })

  test('should filter live classes', async ({ page }) => {
    // Set filter to show only active classes
    await page.selectOption('[data-testid="status-filter"]', 'active')
    
    // Wait for filtered results
    await page.waitForTimeout(1000)
    
    // Check if only active classes are shown
    const statusElements = page.locator('[data-testid="class-status"]')
    for (let i = 0; i < await statusElements.count(); i++) {
      await expect(statusElements.nth(i)).toContainText('active')
    }
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/live-classes', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' })
    })
    
    // Refresh the page
    await page.reload()
    
    // Check if error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })
})

test.describe('Student Live Class Join', () => {
  test('should allow student to join live class within time window', async ({ page }) => {
    // Navigate to student live class join page
    await page.goto('/students/live/join/test-class-id')
    
    // Wait for pre-join checks to complete
    await page.waitForTimeout(2000)
    
    // Check if join button is enabled
    await expect(page.locator('[data-testid="join-class-btn"]')).toBeEnabled()
    
    // Click join button
    await page.click('[data-testid="join-class-btn"]')
    
    // Should redirect to live class interface
    await expect(page).toHaveURL(/.*live.*/)
  })

  test('should prevent student from joining too early', async ({ page }) => {
    // Mock a class that's too early to join
    await page.route('**/api/live-classes/**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          scheduled_date: '2024-12-26',
          start_time: '10:00:00',
          end_time: '11:00:00',
          status: 'scheduled'
        })
      })
    })
    
    // Navigate to student live class join page
    await page.goto('/students/live/join/test-class-id')
    
    // Wait for pre-join checks to complete
    await page.waitForTimeout(2000)
    
    // Check if error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('not started yet')
    
    // Join button should be disabled
    await expect(page.locator('[data-testid="join-class-btn"]')).toBeDisabled()
  })
})
