// script.js - Sign-In Page JavaScript

// Wrap your code inside a DOMContentLoaded listener
// This ensures the script runs only after the HTML is fully loaded and parsed,
// and the Supabase library script has executed.
document.addEventListener('DOMContentLoaded', async () => { // Make the function async here
    console.log('DOM fully loaded and parsed. Running sign-in script.');

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
         const signinForm = document.getElementById('signin-form');
         if (signinForm) {
            signinForm.style.display = 'none';
         }
        console.log('Stopping script due to Supabase client initialization failure.');
        return; // Stop execution
    }

    // --- ADDED: Check for existing session and redirect if logged in ---
    console.log('Checking for existing session on sign-in page...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Error checking existing session:', sessionError.message);
        // Optionally show an error, but don't redirect as we don't know user state
        // Continue script execution to show login form in case of session check error
    } else if (session) {
        console.log('Existing session found. User is logged in. Redirecting to dashboard.');
        // User is logged in, redirect them to the dashboard or protected page
        window.location.href = '/home.html'; // <<<< CHANGE THIS to your protected page URL (e.g., /dashboard.html)
        return; // Stop executing the rest of the script (like setting up form listeners)
    } else {
        console.log('No existing session found. Displaying sign-in form.');
        // No session, allow the script to continue and set up the form listener
    }
    // --- END OF SESSION CHECK BLOCK ---


    // Get references to the form elements and message area
    const signinForm = document.getElementById('signin-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    // Check if the signinForm element exists before adding listener
     if (!signinForm) {
         console.error('Sign-in form element not found!');
         // Optionally display an error on the page
         errorMessage.textContent = 'Sign-in form not found on the page.';
         return; // Stop execution if form is missing
     }


    // Step 2: Add an event listener to the form for the 'submit' event
    signinForm.addEventListener('submit', async (event) => {
        console.log('Sign-in form submitted!');
        event.preventDefault(); // Prevent the browser's default form submission (page reload)

        // Get the email and password from the input fields
        const email = emailInput.value;
        const password = passwordInput.value;

        console.log('Attempting sign-in for email:', email);

        // Clear any previous error messages
        errorMessage.textContent = '';

        // --- Step 3: Call supabase.auth.signInWithPassword to sign in the user ---
        try {
            console.log('Calling supabase.auth.signInWithPassword...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
             console.log('Supabase response received.');

            // Step 4: Handle the response from Supabase
            if (error) {
                // If there's an error, display it
                console.error('Sign-in error:', error);
                errorMessage.textContent = error.message;
            } else {
                // If successful, handle the signed-in user.
                console.log('User signed in:', data.user);
                console.log('Session:', data.session);

                // --- Step 5: Redirect or update UI on successful login ---
                // Example: Redirect the user to a dashboard or protected page
                 alert('Sign-in successful! Redirecting...'); // Simple confirmation (consider a better UX)
                 window.location.href = '/home.html'; // <<<< CHANGE THIS to your desired post-login page
                // --- End of redirection ---
            }
        } catch (e) {
            // Catch any unexpected JavaScript errors during the process
            console.error('An unexpected JavaScript error occurred during sign-in:', e);
            errorMessage.textContent = 'An unexpected error occurred. Please try again.';
        }
        // --- End of Supabase call and handling ---
    });
}); // End of DOMContentLoaded listener