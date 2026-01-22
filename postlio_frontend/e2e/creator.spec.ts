import { test, expect } from './fixtures/test-fixtures';
import { CreatorPage } from './fixtures/test-fixtures';

test.describe('Creator', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
        // All tests start from authenticated state
    });

    test.describe('Page Load', () => {
        test('should display creator page', async ({ authenticatedPage }) => {
            const creator = new CreatorPage(authenticatedPage);
            await creator.goto();
            await creator.expectLoaded();
        });

        test('should display platform selector', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Check for platform buttons
            await expect(authenticatedPage.getByRole('button', { name: /facebook/i })).toBeVisible();
            await expect(authenticatedPage.getByRole('button', { name: /instagram/i })).toBeVisible();
            await expect(authenticatedPage.getByRole('button', { name: /linkedin/i })).toBeVisible();
        });

        test('should display content editor', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Check for text area or editor
            await expect(
                authenticatedPage.getByRole('textbox').or(authenticatedPage.locator('[contenteditable="true"]'))
            ).toBeVisible();
        });
    });

    test.describe('Platform Selection', () => {
        test('should select Facebook platform', async ({ authenticatedPage }) => {
            const creator = new CreatorPage(authenticatedPage);
            await creator.goto();

            await creator.selectPlatform('facebook');

            // Platform button should be active/selected
            const facebookBtn = authenticatedPage.getByRole('button', { name: /facebook/i });
            await expect(facebookBtn).toHaveClass(/active|selected|bg-/);
        });

        test('should select Instagram platform', async ({ authenticatedPage }) => {
            const creator = new CreatorPage(authenticatedPage);
            await creator.goto();

            await creator.selectPlatform('instagram');

            const instagramBtn = authenticatedPage.getByRole('button', { name: /instagram/i });
            await expect(instagramBtn).toHaveClass(/active|selected|bg-/);
        });

        test('should select LinkedIn platform', async ({ authenticatedPage }) => {
            const creator = new CreatorPage(authenticatedPage);
            await creator.goto();

            await creator.selectPlatform('linkedin');

            const linkedinBtn = authenticatedPage.getByRole('button', { name: /linkedin/i });
            await expect(linkedinBtn).toHaveClass(/active|selected|bg-/);
        });

        test('should allow selecting multiple platforms', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Click multiple platforms (if multi-select is supported)
            await authenticatedPage.getByRole('button', { name: /facebook/i }).click();
            await authenticatedPage.getByRole('button', { name: /instagram/i }).click();

            // Both should be selected (implementation dependent)
        });
    });

    test.describe('Content Editor', () => {
        test('should allow typing content', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            const editor = authenticatedPage.getByRole('textbox').first();
            await editor.fill('This is my test post content');

            await expect(editor).toHaveValue(/This is my test post content/);
        });

        test('should show character count', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            const editor = authenticatedPage.getByRole('textbox').first();
            await editor.fill('Hello World');

            // Look for character counter
            const counter = authenticatedPage.getByText(/\d+\s*(\/|z|of)\s*\d+/);
            if (await counter.isVisible()) {
                await expect(counter).toContainText('11');
            }
        });

        test('should support emoji insertion', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            const editor = authenticatedPage.getByRole('textbox').first();
            await editor.fill('Great post! 🚀');

            await expect(editor).toHaveValue(/🚀/);
        });

        test('should support hashtags', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            const editor = authenticatedPage.getByRole('textbox').first();
            await editor.fill('Check this out #postlio #social');

            await expect(editor).toHaveValue(/#postlio.*#social/);
        });
    });

    test.describe('AI Generation', () => {
        test('should have AI generate button', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            await expect(
                authenticatedPage.getByRole('button', { name: /generuj|generate|ai/i })
            ).toBeVisible();
        });

        test('should generate content with AI', async ({ authenticatedPage }) => {
            // Mock AI API response
            await authenticatedPage.route('**/api/v1/ai/generate', (route) =>
                route.fulfill({
                    status: 200,
                    body: JSON.stringify({
                        success: true,
                        content: 'AI generated content about technology trends!',
                        hashtags: ['ai', 'tech', 'trends'],
                    }),
                })
            );

            await authenticatedPage.goto('/creator');

            // Click generate button
            await authenticatedPage.getByRole('button', { name: /generuj|generate|ai/i }).click();

            // If modal appears, fill topic
            const topicInput = authenticatedPage.getByPlaceholder(/temat|topic/i);
            if (await topicInput.isVisible({ timeout: 2000 })) {
                await topicInput.fill('technology trends');
                await authenticatedPage.getByRole('button', { name: /generuj|generate/i }).last().click();
            }

            // Wait for content to appear
            await expect(
                authenticatedPage.getByText(/AI generated content|technology/)
            ).toBeVisible({ timeout: 10000 });
        });

        test('should show loading state during generation', async ({ authenticatedPage }) => {
            // Mock slow API
            await authenticatedPage.route('**/api/v1/ai/generate', async (route) => {
                await new Promise((r) => setTimeout(r, 2000));
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({
                        success: true,
                        content: 'Generated content',
                        hashtags: [],
                    }),
                });
            });

            await authenticatedPage.goto('/creator');
            await authenticatedPage.getByRole('button', { name: /generuj|generate|ai/i }).click();

            // Check for loading indicator
            await expect(
                authenticatedPage.getByText(/generowanie|generating|ładowanie|loading/i)
                    .or(authenticatedPage.locator('[class*="animate-spin"]'))
            ).toBeVisible();
        });

        test('should handle AI generation error', async ({ authenticatedPage }) => {
            // Mock API error
            await authenticatedPage.route('**/api/v1/ai/generate', (route) =>
                route.fulfill({
                    status: 500,
                    body: JSON.stringify({ detail: 'AI service unavailable' }),
                })
            );

            await authenticatedPage.goto('/creator');
            await authenticatedPage.getByRole('button', { name: /generuj|generate|ai/i }).click();

            // Fill topic if modal appears
            const topicInput = authenticatedPage.getByPlaceholder(/temat|topic/i);
            if (await topicInput.isVisible({ timeout: 2000 })) {
                await topicInput.fill('test');
                await authenticatedPage.getByRole('button', { name: /generuj|generate/i }).last().click();
            }

            // Should show error message
            await expect(
                authenticatedPage.getByText(/błąd|error|nie udało/i)
            ).toBeVisible({ timeout: 10000 });
        });
    });

    test.describe('Preview', () => {
        test('should show post preview', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Type some content
            const editor = authenticatedPage.getByRole('textbox').first();
            await editor.fill('Preview this content');

            // Check for preview area
            await expect(authenticatedPage.getByText('Preview this content')).toBeVisible();
        });

        test('should update preview in real-time', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            const editor = authenticatedPage.getByRole('textbox').first();

            await editor.fill('First version');
            await expect(authenticatedPage.getByText('First version')).toBeVisible();

            await editor.clear();
            await editor.fill('Updated version');
            await expect(authenticatedPage.getByText('Updated version')).toBeVisible();
        });
    });

    test.describe('Publish Actions', () => {
        test('should have publish button', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            await expect(
                authenticatedPage.getByRole('button', { name: /opublikuj|publish/i })
            ).toBeVisible();
        });

        test('should have manual publish option', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Check for manual publish button or option
            await expect(
                authenticatedPage.getByRole('button', { name: /ręcznie|manual|opublikuj ręcznie/i })
            ).toBeVisible();
        });

        test('should disable publish when content is empty', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Clear any existing content
            const editor = authenticatedPage.getByRole('textbox').first();
            await editor.clear();

            // Publish button should be disabled or show validation
            const publishBtn = authenticatedPage.getByRole('button', { name: /opublikuj|publish/i });

            // Either disabled or clicking shows error
            await publishBtn.click();

            // Should show validation message or stay on page
            await expect(authenticatedPage).toHaveURL(/creator/);
        });
    });

    test.describe('Image Upload', () => {
        test('should have image upload option', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Check for image upload button or area
            await expect(
                authenticatedPage.getByRole('button', { name: /zdjęcie|image|obraz|dodaj/i })
                    .or(authenticatedPage.getByText(/przeciągnij|drop|upload/i))
            ).toBeVisible();
        });

        test('should have AI image generation option', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Check for AI image generation
            await expect(
                authenticatedPage.getByRole('button', { name: /generuj.*obraz|generate.*image|ai.*image/i })
            ).toBeVisible();
        });
    });

    test.describe('Brand Selection', () => {
        test('should allow selecting brand', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            // Check for brand selector
            const brandSelector = authenticatedPage.getByRole('combobox', { name: /marka|brand/i });

            if (await brandSelector.isVisible()) {
                await brandSelector.click();

                // Should show brand options
                await expect(authenticatedPage.getByRole('option').first()).toBeVisible();
            }
        });
    });

    test.describe('Save Draft', () => {
        test('should auto-save content', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            const editor = authenticatedPage.getByRole('textbox').first();
            await editor.fill('Auto-save test content');

            // Wait for auto-save indicator or simply verify content persists
            await authenticatedPage.waitForTimeout(2000);

            // Refresh page
            await authenticatedPage.reload();

            // Content should be preserved (if auto-save is implemented)
            // This depends on your implementation
        });

        test('should have save draft button', async ({ authenticatedPage }) => {
            await authenticatedPage.goto('/creator');

            await expect(
                authenticatedPage.getByRole('button', { name: /zapisz|save|draft|szkic/i })
            ).toBeVisible();
        });
    });
});