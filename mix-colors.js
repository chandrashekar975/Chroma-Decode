// mix-colors.js - JavaScript for the Mix Colors freeplay mode

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Mix Colors script loaded.');

    // --- Step 1: Initialize the Supabase client ---
    const SUPABASE_URL = 'https://fkjacsfcxwtjhyofhnoo.supabase.co'; // <<<< REPLACE THIS
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramFjc2ZjeHd0amh5b2Zobm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjYyMDgsImV4cCI6MjA2MDY0MjIwOH0.tHNaoDI5QMaeMXqcjhHW9npTq_KtLerfo9OjFv-S9Fs'; // <<<< REPLACE THIS

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('Supabase URL and Key are required.');
         document.getElementById('user-email').textContent = 'Supabase config missing.';
         document.getElementById('mode-area').style.display = 'none'; // Hide mode area if config is missing
        return;
    }

    let supabase = null;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized for mode.');
    } catch (e) {
        console.error('Error initializing Supabase client:', e);
         document.getElementById('user-email').textContent = 'Supabase init failed.';
         document.getElementById('mode-area').style.display = 'none'; // Hide mode area if init fails
        return;
    }

    // --- Step 2: Check Authentication Status ---
    const userEmailElement = document.getElementById('user-email');
    const signoutButton = document.getElementById('signout-button');
    const modeArea = document.getElementById('mode-area'); // Get the mode area div

    let session = null;
    let userId = null;

    console.log('Checking authentication status...');
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Error getting session:', sessionError.message);
        userEmailElement.textContent = 'Error loading user.';
        modeArea.style.display = 'none'; // Hide mode area if session check fails
        alert('An error occurred while verifying your session. Please log in again.');
        window.location.href = '/chroma/signin.html'; // Redirect to sign-in page
        return;
    }

    session = currentSession;

    if (!session) {
        console.log('No active session found. User is not logged in.');
        userEmailElement.textContent = 'Not logged in.';
        modeArea.style.display = 'none'; // Hide mode area if not logged in
        alert('You need to be logged in to use this feature.');
        window.location.href = '/chroma/signin.html'; // Redirect to sign-in page
        return;
    }

    // User is logged in!
    userId = session.user.id;
    userEmailElement.textContent = session.user.email;
    console.log('User is logged in with ID:', userId, 'Email:', session.user.email);

    // Re-enable the mode area now that auth is checked
     if (modeArea) {
        modeArea.style.opacity = 1;
        modeArea.style.pointerEvents = 'auto';
     } else {
         console.error('Mode area element not found!');
     }


    // --- Get DOM element references for mode logic ---
    const redSlider = document.getElementById('red-slider');
    const greenSlider = document.getElementById('green-slider');
    const blueSlider = document.getElementById('blue-slider');
    const mixedColorBox = document.getElementById('mixed-color-box');
    const hexCodeDisplay = document.getElementById('hex-code-display');


    // --- Mode Logic Functions ---

    // Function to update the color box and hex display
    function updateColorDisplay() {
        const r = redSlider.value;
        const g = greenSlider.value;
        const b = blueSlider.value;

        const hex = `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;

        mixedColorBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
        hexCodeDisplay.textContent = hex.toUpperCase(); // Display in uppercase
    }


    // --- Add event listeners to sliders ---
    if (redSlider) redSlider.addEventListener('input', updateColorDisplay);
    if (greenSlider) greenSlider.addEventListener('input', updateColorDisplay);
    if (blueSlider) blueSlider.addEventListener('input', updateColorDisplay);

    // Initial call to set the color based on default slider values
    updateColorDisplay();


    // --- Sign out logic ---
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
