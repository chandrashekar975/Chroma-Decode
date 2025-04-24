// dashboard.js - JavaScript for a Protected Page

document.addEventListener('DOMContentLoaded', async () => { // Use async because we'll use await
    console.log('Dashboard script loaded. Checking authentication status.');

    // Step 1: Initialize the Supabase client
    // Replace with your Supabase project URL and public anon key
    const SUPABASE_URL = 'https://fkjacsfcxwtjhyofhnoo.supabase.co'; // <<<< REPLACE THIS
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramFjc2ZjeHd0amh5b2Zobm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjYyMDgsImV4cCI6MjA2MDY0MjIwOH0.tHNaoDI5QMaeMXqcjhHW9npTq_KtLerfo9OjFv-S9Fs'; // <<<< REPLACE THIS

    // Basic check for missing configuration
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('Supabase URL and Key are required for dashboard.');
         // Optionally display a page error or redirect even before client creation
         alert('Application configuration error. Please try again later.');
         window.location.href = '/chroma/signin.html'; // Redirect to sign-in
        return; // Stop execution
    }

    let supabase = null;
    try {
         // Initialize the client directly
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized for dashboard.');
    } catch(e) {
         console.error('Error initializing Supabase client on dashboard:', e);
         alert('Failed to initialize application. Please try again.');
         window.location.href = '/chroma/signin.html'; // Redirect to sign-in
         return; // Stop execution
    }


    // Step 2: Check the current user session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error.message);
        // Handle error, likely redirect to login page
        alert('An error occurred while verifying your session. Please log in again.');
         window.location.href = '/chroma/signin.html'; // Redirect to sign-in page
    } else if (!session) {
        console.log('No active session found. Redirecting to login.');
        // No active session, redirect to login page
        alert('You need to be logged in to view this page.');
        window.location.href = '/chroma/signin.html'; // Redirect to sign-in page
    } else {
        // Step 3: User is logged in!
        console.log('User is logged in:', session.user);
        // The 'session' object contains user details and tokens.
        // You can now display content for logged-in users or fetch user-specific data.

        // Example: Display the user's email (assuming your user has an email)
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement && session.user && session.user.email) {
             userEmailElement.textContent = session.user.email;
        } else {
            console.warn('Could not find element to display user email or email is missing.');
        }

        // You can also fetch data here, e.g.,:
        // const { data: userData, error: userError } = await supabase.from('your_table_name').select('*').eq('user_id', session.user.id);
        // Handle fetched data...
    }

    // Optional: Add sign-out functionality if this is a dashboard/protected page
    const signoutButton = document.getElementById('signout-button');
    if (signoutButton && supabase) {
        signoutButton.addEventListener('click', async () => {
            console.log('Signing out...');
            const { error: signOutError } = await supabase.auth.signOut();

            if (signOutError) {
                console.error('Sign out error:', signOutError.message);
                alert('Failed to sign out.');
            } else {
                console.log('Signed out successfully. Redirecting to login.');
                alert('You have been signed out.');
                 window.location.href = '/chroma/signin.html'; // Redirect to sign-in page after sign out
            }
        });
    } else {
         console.warn('Sign out button or Supabase client not found. Sign out not available.');
    }

}); // End of DOMContentLoaded listener