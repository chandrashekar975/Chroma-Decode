// signup.js - Sign-Up Page JavaScript

// Wrap your code inside a DOMContentLoaded listener
// This ensures the script runs only after the HTML is fully loaded and parsed,
// and the Supabase library script has executed.
document.addEventListener('DOMContentLoaded', async () => { // Make the function async here
    console.log('DOM fully loaded and parsed. Running sign-up script.');

    // --- Check for global supabase object (should show the object) ---
    console.log('Checking for global supabase object:', window.supabase);
    // --- End Check ---


    // Step 1: Initialize the Supabase client DIRECTLY
    // Replace with your Supabase project URL and public anon key
    const SUPABASE_URL = 'https://fkjacsfcxwtjhyofhnoo.supabase.co'; // <<<< REPLACE THIS
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramFjc2ZjeHd0amh5b2Zobm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjYyMDgsImV4cCI6MjA2MDY0MjIwOH0.tHNaoDI5QMaeMXqcjhHW9npTq_KtLerfo9OjFv-S9Fs'; // <<<< REPLACE THIS

    // Check if placeholder values are still present or keys are empty
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('Supabase URL and Key are required. Please replace the placeholder values.');
        const errorDisplay = document.getElementById('error-message');
         if (errorDisplay) {
            errorDisplay.textContent = 'Supabase configuration missing or incorrect.';
         }
        console.log('Supabase configuration missing, stopping.');
        return; // Stop execution if keys are missing
    }

    let supabase = null; // Use let because we might assign null if creation fails
    try {
        console.log('Attempting to call supabase.createClient directly...');
        // This line accesses the global 'supabase' and calls its method
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized directly:', supabase);

    } catch (e) {
        console.error('Error initializing Supabase client directly:', e);
        const errorDisplay = document.getElementById('error-message');
        if (errorDisplay) {
            errorDisplay.textContent = 'Failed to initialize Supabase client.';
        }
         // Also hide the form if client creation failed
         const signupForm = document.getElementById('signup-form');
         if (signupForm) {
             signupForm.style.display = 'none';
         }
        console.log('Stopping script due to Supabase client initialization failure.');
        return; // Stop execution
    }

    // --- ADDED: Check for existing session and redirect if logged in ---
    console.log('Checking for existing session on sign-up page...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Error checking existing session:', sessionError.message);
         // Optionally show an error, but don't redirect as we don't know user state
         // Continue script execution to show signup form in case of session check error
    } else if (session) {
        console.log('Existing session found. User is logged in. Redirecting to dashboard.');
        // User is logged in, redirect them to the dashboard or protected page
        window.location.href = '/home.html'; // <<<< CHANGE THIS to your protected page URL (e.g., /dashboard.html)
        return; // Stop executing the rest of the script (like setting up form listeners)
    } else {
        console.log('No existing session found. Displaying sign-up form.');
         // No session, allow the script to continue and set up the form listener
    }
    // --- END OF SESSION CHECK BLOCK ---


    // Get references to the form elements and message areas
    const signupForm = document.getElementById('signup-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');


    // Check if the signupForm element exists before adding listener
    if (!signupForm) {
         console.error('Sign-up form element not found!');
         // Optionally display an error on the page
         errorMessage.textContent = 'Sign-up form not found on the page.';
         return; // Stop execution if form is missing
    }


    // Step 2: Add an event listener to the form for the 'submit' event
    signupForm.addEventListener('submit', async (event) => {
        console.log('Sign-up form submitted!');
        event.preventDefault(); // Prevent the browser's default form submission (page reload)

        // Get the email and password from the input fields
        const email = emailInput.value;
        const password = passwordInput.value;

        console.log('Attempting signup for email:', email);


        // Clear any previous messages
        errorMessage.textContent = '';
        successMessage.textContent = '';

        // --- Step 3: Call supabase.auth.signUp to create the new user ---
        try {
            console.log('Calling supabase.auth.signUp...');
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    emailRedirectTo: 'http://127.0.0.1:5500/chroma/complete-profile.html',
                  },
            });
            console.log('Supabase response received.');


            // Step 4: Handle the response from Supabase
            if (error) {
                // If there's an error, display it
                console.error('Sign-up error:', error);
                errorMessage.textContent = error.message;
            } else {
                // If successful, inform the user.
                // Supabase typically sends a confirmation email on successful signup.
                // data.user might be null here if email confirmation is required.
                console.log('Supabase returned success data:', data);
                // Check if user object is present, though success often just means email sent
                 if (data.user || data.session === null) { // Session is null when email confirmation is pending
                     successMessage.textContent = 'Sign-up successful! Please check your email to confirm your account.';
                     // Optionally, clear the form after showing the success message
                      signupForm.reset();
                 } else {
                     // Handle unexpected success response structure if needed
                      successMessage.textContent = 'Sign-up process initiated. Please check your email.';
                      signupForm.reset();
                 }

            }
        } catch (e) {
            // Catch any unexpected JavaScript errors during the process
            console.error('An unexpected JavaScript error occurred during sign-up:', e);
            errorMessage.textContent = 'An unexpected error occurred. Please try again.';
        }
        // --- End of Supabase call and handling ---
    });
}); // End of DOMContentLoaded listener