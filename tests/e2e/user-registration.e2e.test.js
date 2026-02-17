import { test, expect } from '@playwright/test';
import axios from 'axios';

/**
 * E2E Test: User Registration Workflow
 *
 * This test simulates a real user journey through the registration process:
 * 1. User navigates to registration page
 * 2. User fills in registration form
 * 3. User submits the form
 * 4. System displays success message
 * 5. System sends verification email (checked in Mailpit)
 * 6. User clicks verification link in email
 * 7. User attempts to login
 * 8. System allows login after email verification
 *
 * Tests all 9 steps from USER_REGISTRATION_WORKFLOW.md from UI perspective
 */

const WEB_UI_URL = process.env.WEB_UI_URL || 'http://localhost:3000';
const MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025';
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'http://localhost:8004';

// Generate unique test data
const generateTestEmail = () => `test.user.${Date.now()}@example.com`;

test.describe('User Registration E2E Workflow', () => {
  let testEmail;
  let testPassword;
  let testFirstName;
  let testLastName;

  test.beforeEach(async ({ page }) => {
    // Generate unique test data for each test
    testEmail = generateTestEmail();
    testPassword = 'SecurePass123!';
    testFirstName = 'John';
    testLastName = 'Doe';

    console.log(`\n🧪 Test Email: ${testEmail}\n`);
  });

  test('should complete full registration workflow with email verification', async ({
    page,
  }) => {
    console.log('\n🚀 Starting Complete User Registration E2E Test\n');

    // ============================================================================
    // STEP 1: Navigate to Registration Page
    // ============================================================================
    console.log('📋 Step 1: Navigating to registration page...');

    await page.goto(`${WEB_UI_URL}/register`);
    await expect(page).toHaveTitle(/xshopai/i);

    // Verify registration form is visible
    await expect(
      page.getByRole('heading', { name: /register|sign up|create account/i })
    ).toBeVisible();
    console.log('✅ Registration page loaded');

    // ============================================================================
    // STEP 2: Fill in Registration Form
    // ============================================================================
    console.log('\n📋 Step 2: Filling in registration form...');

    // Fill in all required fields
    await page.getByLabel(/first name/i).fill(testFirstName);
    await page.getByLabel(/last name/i).fill(testLastName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/phone number/i).fill('+1 (555) 123-4567');
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);

    // Check the terms agreement checkbox
    await page.getByLabel(/agree to the terms/i).check();

    console.log(`   First Name: ${testFirstName}`);
    console.log(`   Last Name: ${testLastName}`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Phone: +1 (555) 123-4567`);
    console.log(`   Terms Agreed: Yes`);
    console.log('✅ Form filled successfully');

    // ============================================================================
    // STEP 3: Submit Registration Form
    // ============================================================================
    console.log('\n📋 Step 3: Submitting registration form...');

    // Click register button
    await page
      .getByRole('button', { name: /register|sign up|create account/i })
      .click();

    console.log('✅ Form submitted');

    // ============================================================================
    // STEP 4: Verify Success Message
    // ============================================================================
    console.log('\n📋 Step 4: Verifying success message...');

    // Wait for navigation to success page
    await page.waitForURL('**/registration-success', { timeout: 10000 });

    // Wait for success message to appear
    await expect(page.getByText(/registration successful/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/check your email/i)).toBeVisible();

    console.log('✅ Success message displayed');
    console.log('✅ User informed to check email');

    // ============================================================================
    // STEP 5: Check Email in Mailpit
    // ============================================================================
    console.log('\n📋 Step 5: Checking email in Mailpit...');

    // Poll Mailpit for the verification email (up to 10 seconds)
    let verificationEmail;
    let attempts = 0;
    const maxAttempts = 10;

    while (!verificationEmail && attempts < maxAttempts) {
      attempts++;
      console.log(
        `   Attempt ${attempts}/${maxAttempts}: Checking for email...`
      );

      // Wait before checking
      await page.waitForTimeout(1000);

      try {
        // Query Mailpit API for emails to our test address
        const mailpitResponse = await axios.get(
          `${MAILPIT_URL}/api/v1/messages`
        );
        expect(mailpitResponse.status).toBe(200);

        // Find the verification email
        verificationEmail = mailpitResponse.data.messages.find(
          msg =>
            msg.To &&
            msg.To.some(recipient => recipient.Address === testEmail) &&
            msg.Subject &&
            msg.Subject.includes('Verify')
        );

        if (!verificationEmail && attempts === maxAttempts) {
          // Log what emails we did find for debugging
          console.log(
            `\n❌ Could not find verification email for ${testEmail}`
          );
          console.log(
            `   Found ${mailpitResponse.data.messages.length} total messages in Mailpit`
          );
          const recentEmails = mailpitResponse.data.messages.slice(0, 5);
          console.log(`   Recent emails:`);
          recentEmails.forEach((msg, idx) => {
            const toAddresses =
              msg.To?.map(t => t.Address).join(', ') || 'none';
            console.log(
              `     ${idx + 1}. To: ${toAddresses}, Subject: ${msg.Subject}`
            );
          });
        }
      } catch (error) {
        console.log(`   Error querying Mailpit: ${error.message}`);
        if (attempts === maxAttempts) {
          throw error;
        }
      }
    }

    expect(verificationEmail).toBeDefined();
    console.log(
      `✅ Verification email received in Mailpit (after ${attempts} attempts)`
    );
    console.log(`   Subject: ${verificationEmail.Subject}`);
    console.log(`   To: ${testEmail}`);

    // ============================================================================
    // STEP 6: Extract and Navigate to Verification Link
    // ============================================================================
    console.log('\n📋 Step 6: Extracting verification link from email...');

    // Get email content
    const emailContent = await axios.get(
      `${MAILPIT_URL}/api/v1/message/${verificationEmail.ID}`
    );
    const emailHtml = emailContent.data.HTML || emailContent.data.Text;

    // Extract verification link from email
    const verificationLinkMatch =
      emailHtml.match(/href="([^"]*verify-email[^"]*)"/i) ||
      emailHtml.match(/(https?:\/\/[^\s]+verify-email[^\s<]+)/i);

    expect(verificationLinkMatch).toBeTruthy();
    let verificationLink = verificationLinkMatch[1];

    // Handle HTML entities
    verificationLink = verificationLink.replace(/&amp;/g, '&');

    console.log(`✅ Verification link extracted`);
    console.log(`   Link: ${verificationLink}`);

    // ============================================================================
    // STEP 7: Click Verification Link
    // ============================================================================
    console.log('\n📋 Step 7: Clicking verification link...');

    // Navigate to verification link
    await page.goto(verificationLink);

    // Verify success message on verification page
    await expect(
      page.getByText(/email verified|verification successful/i)
    ).toBeVisible({ timeout: 10000 });

    console.log('✅ Email verified successfully');

    // ============================================================================
    // STEP 8: Attempt Login Before Verification (should fail)
    // ============================================================================
    console.log('\n📋 Step 8: Testing login with verified account...');

    // Navigate to login page
    await page.goto(`${WEB_UI_URL}/login`);

    // Fill in login form
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);

    // Click login button
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    console.log('✅ Login form submitted');

    // ============================================================================
    // STEP 9: Verify Successful Login and Redirect
    // ============================================================================
    console.log('\n📋 Step 9: Verifying successful login and redirect...');

    // Wait for redirect to home page or dashboard
    await page.waitForURL(/\/(home|dashboard|products)?$/i, { timeout: 10000 });

    // Verify user is logged in (check for user menu or logout button)
    const userIndicator = page
      .getByRole('button', { name: /logout|account|profile/i })
      .or(page.getByText(new RegExp(testFirstName, 'i')));
    await expect(userIndicator).toBeVisible({ timeout: 5000 });

    console.log('✅ User successfully logged in');
    console.log('✅ Redirected to home page');

    // ============================================================================
    // WORKFLOW SUMMARY
    // ============================================================================
    console.log('\n📊 E2E Workflow Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Step 1: Registration page loaded');
    console.log('✅ Step 2: Registration form filled');
    console.log('✅ Step 3: Registration form submitted');
    console.log('✅ Step 4: Success message displayed');
    console.log('✅ Step 5: Verification email received in Mailpit');
    console.log('✅ Step 6: Verification link extracted from email');
    console.log('✅ Step 7: Email verified successfully');
    console.log('✅ Step 8: Login form submitted');
    console.log('✅ Step 9: User logged in and redirected');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n🎉 Complete User Registration E2E Test PASSED\n');
  }, 60000); // 60 second timeout

  test('should prevent login before email verification', async ({ page }) => {
    console.log('\n🧪 Testing unverified user login prevention\n');

    // Register user
    await page.goto(`${WEB_UI_URL}/register`);
    await page.getByLabel(/first name/i).fill(testFirstName);
    await page.getByLabel(/last name/i).fill(testLastName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/phone number/i).fill('+1 (555) 123-4567');
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByLabel(/agree to the terms/i).check();
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Wait for navigation to success page
    await page.waitForURL('**/registration-success', { timeout: 10000 });

    // Wait for success message
    await expect(page.getByText(/registration successful/i)).toBeVisible({
      timeout: 10000,
    });

    console.log('✅ User registered successfully');

    // Try to login WITHOUT verifying email
    await page.goto(`${WEB_UI_URL}/login`);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/password/i).fill(testPassword);
    await page.getByRole('button', { name: /log in|sign in/i }).click();

    // Should see error message about email verification
    await expect(
      page.getByText(/verify your email|email not verified/i)
    ).toBeVisible({ timeout: 10000 });

    console.log('✅ Unverified user prevented from logging in');
    console.log('✅ Appropriate error message displayed');
  }, 45000);

  test('should show validation errors for invalid input', async ({ page }) => {
    console.log('\n🧪 Testing form validation\n');

    await page.goto(`${WEB_UI_URL}/register`);

    // Try to submit with invalid email
    await page.getByLabel(/first name/i).fill(testFirstName);
    await page.getByLabel(/last name/i).fill(testLastName);
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);

    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should show validation error
    await expect(page.getByText(/invalid email|valid email/i)).toBeVisible({
      timeout: 5000,
    });

    console.log('✅ Invalid email validation working');

    // Try with mismatched passwords
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill('DifferentPass123!');

    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should show password mismatch error
    await expect(
      page.getByText(/passwords.*match|password.*same/i)
    ).toBeVisible({ timeout: 5000 });

    console.log('✅ Password mismatch validation working');
  }, 30000);

  test('should prevent duplicate email registration', async ({ page }) => {
    console.log('\n🧪 Testing duplicate email prevention\n');

    // Register first user
    await page.goto(`${WEB_UI_URL}/register`);
    await page.getByLabel(/first name/i).fill(testFirstName);
    await page.getByLabel(/last name/i).fill(testLastName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/phone number/i).fill('+1 (555) 123-4567');
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByLabel(/agree to the terms/i).check();
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Wait for navigation to success page
    await page.waitForURL('**/registration-success', { timeout: 10000 });

    // Wait for success
    await expect(page.getByText(/registration successful/i)).toBeVisible({
      timeout: 10000,
    });
    console.log('✅ First registration successful');

    // Wait a bit to ensure data is persisted
    await page.waitForTimeout(2000);

    // Try to register with same email
    await page.goto(`${WEB_UI_URL}/register`);
    await page.getByLabel(/first name/i).fill('Jane');
    await page.getByLabel(/last name/i).fill('Smith');
    await page.getByLabel(/email/i).fill(testEmail); // Same email
    await page.getByLabel(/phone number/i).fill('+1 (555) 987-6543');
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByLabel(/agree to the terms/i).check();
    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should see error about duplicate email
    await expect(
      page.getByText(/already exists|already registered|email.*taken/i)
    ).toBeVisible({ timeout: 10000 });

    console.log('✅ Duplicate email registration prevented');
    console.log('✅ Appropriate error message displayed');
  }, 45000);

  test('should have accessible registration form', async ({ page }) => {
    console.log('\n🧪 Testing form accessibility\n');

    await page.goto(`${WEB_UI_URL}/register`);

    // Check for proper labels
    const firstNameLabel = page.getByLabel(/first name/i);
    const lastNameLabel = page.getByLabel(/last name/i);
    const emailLabel = page.getByLabel(/email/i);
    const passwordLabel = page.getByLabel(/^password$/i);
    const confirmPasswordLabel = page.getByLabel(/confirm password/i);

    await expect(firstNameLabel).toBeVisible();
    await expect(lastNameLabel).toBeVisible();
    await expect(emailLabel).toBeVisible();
    await expect(passwordLabel).toBeVisible();
    await expect(confirmPasswordLabel).toBeVisible();

    console.log('✅ All form labels present and accessible');

    // Check for submit button
    const submitButton = page.getByRole('button', {
      name: /register|sign up/i,
    });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();

    console.log('✅ Submit button accessible and enabled');
  }, 20000);

  test('should handle network errors gracefully', async ({ page }) => {
    console.log('\n🧪 Testing network error handling\n');

    // Block API requests to simulate network error
    await page.route('**/api/auth/register', route => route.abort());

    await page.goto(`${WEB_UI_URL}/register`);
    await page.getByLabel(/first name/i).fill(testFirstName);
    await page.getByLabel(/last name/i).fill(testLastName);
    await page.getByLabel(/email/i).fill(testEmail);
    await page.getByLabel(/phone number/i).fill('+1 (555) 123-4567');
    await page.getByLabel(/^password$/i).fill(testPassword);
    await page.getByLabel(/confirm password/i).fill(testPassword);
    await page.getByLabel(/agree to the terms/i).check();

    await page.getByRole('button', { name: /register|sign up/i }).click();

    // Should show error message
    await expect(page.getByText(/error|failed|try again/i)).toBeVisible({
      timeout: 10000,
    });

    console.log('✅ Network error handled gracefully');
    console.log('✅ User-friendly error message displayed');
  }, 30000);
});

test.describe('Email Verification Link Security', () => {
  test('should reject expired verification tokens', async ({ page }) => {
    console.log('\n🧪 Testing expired token handling\n');

    // Try to verify with an obviously invalid/expired token
    await page.goto(
      `${WEB_UI_URL}/verify-email?token=expired.or.invalid.token`
    );

    // Should show error message
    await expect(
      page.getByText(/invalid|expired|verification failed/i)
    ).toBeVisible({ timeout: 10000 });

    console.log('✅ Expired/invalid token rejected');
    console.log('✅ Appropriate error message displayed');
  }, 20000);

  test('should reject malformed verification tokens', async ({ page }) => {
    console.log('\n🧪 Testing malformed token handling\n');

    // Try with malformed token
    await page.goto(`${WEB_UI_URL}/verify-email?token=malformed-token`);

    // Should show error message
    await expect(page.getByText(/invalid|verification failed/i)).toBeVisible({
      timeout: 10000,
    });

    console.log('✅ Malformed token rejected');
  }, 20000);
});
