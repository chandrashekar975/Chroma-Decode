// complete-profile.js - JavaScript for the Complete Profile Page

document.addEventListener('DOMContentLoaded', async () => { // Make the function async
    console.log('Complete Profile script loaded.');

    // --- Check for global supabase object ---
    console.log('Checking for global supabase object:', window.supabase);
    // --- End Check ---

    // Step 1: Initialize the Supabase client DIRECTLY
    // Replace with your Supabase project URL and public anon key
    const SUPABASE_URL = 'https://fkjacsfcxwtjhyofhnoo.supabase.co'; // <<<< REPLACE THIS
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramFjc2ZjeHd0amh5b2Zobm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjYyMDgsImV4cCI6MjA2MDY0MjIwOH0.tHNaoDI5QMaeMXqcjhHW9npTq_KtLerfo9OjFv-S9Fs'; // <<<< REPLACE THIS

    // Basic check for missing configuration
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('Supabase URL and Key are required.');
        const errorDisplay = document.getElementById('error-message');
        if (errorDisplay) {
            errorDisplay.textContent = 'Application configuration missing or incorrect.';
        }
        console.log('Supabase configuration missing, stopping.');
        return; // Stop execution if keys are missing
    }

    let supabase = null;
    try {
        console.log('Attempting to call supabase.createClient directly...');
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized directly:', supabase);
    } catch (e) {
        console.error('Error initializing Supabase client directly:', e);
        const errorDisplay = document.getElementById('error-message');
        if (errorDisplay) {
            errorDisplay.textContent = 'Failed to initialize application.';
        }
         const profileForm = document.getElementById('profile-form');
         if (profileForm) {
             profileForm.style.display = 'none'; // Hide the form if client fails
         }
        console.log('Stopping script due to Supabase client initialization failure.');
        return; // Stop execution
    }


    // Step 2: Check if the user is logged in
    console.log('Checking for active session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Error getting session:', sessionError.message);
        alert('An error occurred while verifying your session. Please log in again.');
        window.location.href = 'signin.html'; // Redirect to sign-in page
        return; // Stop execution
    }

    if (!session) {
        console.log('No active session found. Redirecting to login.');
        // No active session, redirect to login page
        alert('You need to be logged in to complete your profile.');
        window.location.href = 'signin.html'; // Redirect to sign-in page
        return; // Stop execution
    }

    // If we reach here, the user is logged in. Get their ID and Email.
    const userId = session.user.id;
    const userEmail = session.user.email; // <--- Get the user's email directly from the session
    console.log('User is logged in with ID:', userId, 'and Email:', userEmail); // <--- Log the email

    // --- ADDED: Display the user's email on the page ---
    const userEmailElement = document.getElementById('profile-user-email');
    if (userEmailElement && userEmail) {
         userEmailElement.textContent = userEmail;
    } else {
        console.warn('Could not find element to display user email or email is missing from session.');
    }
    // --- END ADDITION ---


    // Get references to the form elements and message areas
    const profileForm = document.getElementById('profile-form');
    const userNameInput = document.getElementById('user-name');
    const userAgeInput = document.getElementById('user-age');
    const userIdInput = document.getElementById('user-id');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    // Check if the profileForm element exists
     if (!profileForm) {
         console.error('Profile form element not found!');
         errorMessage.textContent = 'Profile form not found on the page.';
         return; // Stop execution if form is missing
     }


    // Step 3: Add an event listener to the form for the 'submit' event
    profileForm.addEventListener('submit', async (event) => {
        console.log('Profile form submitted!');
        event.preventDefault(); // Prevent the browser's default form submission

        const userName = userNameInput.value;
        const userAge = parseInt(userAgeInput.value, 10); // Get age as a number
        const userid = userIdInput.value

        // Basic validation
        if (!userName || isNaN(userAge) || userAge <= 0 || !userid) {
            errorMessage.textContent = 'Please enter a valid name, age and userid.';
            return;
        }

        // Clear previous messages
        errorMessage.textContent = '';
        successMessage.textContent = '';

        console.log('Saving profile for user ID:', userId, 'Name:', userName, 'Age:', userAge, 'Userid: ', userid);

        // --- Step 4: Save profile data to the 'profiles' table ---
        try {
            const { data, error } = await supabase
                .from('Profiles') // The table name
                .update({ user_name: userName, user_age: userAge, user_id: userid }) // The data to update
                .eq('id', userId); // Filter to update ONLY the row where the 'id' matches the logged-in user's ID


            // Step 5: Handle the response
            if (error) {
                console.error('Error saving profile:', error);
                errorMessage.textContent = 'Error saving profile: ' + error.message;
            } else {
                console.log('Profile saved successfully:', data);
                successMessage.textContent = 'Profile saved successfully!';

                // --- Step 6: Redirect to the dashboard/protected page ---
                alert('Profile saved! Redirecting...'); // Simple alert before redirect
                window.location.href = '/home.html'; // <<<< CHANGE THIS to your dashboard/protected page URL
                // --- End of redirection ---
            }
        } catch (e) {
            console.error('An unexpected error occurred during profile save:', e);
            errorMessage.textContent = 'An unexpected error occurred. Please try again.';
        }
        // --- End of Supabase Database interaction ---
    });
}); // End of DOMContentLoaded listener