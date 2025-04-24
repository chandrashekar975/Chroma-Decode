// color.js - JavaScript for the Guess the Color game

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Guess the Color script loaded.');

    // --- Step 1: Initialize the Supabase client ---
    const SUPABASE_URL = 'https://fkjacsfcxwtjhyofhnoo.supabase.co'; // <<<< REPLACE THIS
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZramFjc2ZjeHd0amh5b2Zobm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNjYyMDgsImV4cCI6MjA2MDY0MjIwOH0.tHNaoDI5QMaeMXqcjhHW9npTq_KtLerfo9OjFv-S9Fs'; // <<<< REPLACE THIS

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
        console.error('Supabase URL and Key are required.');
         document.getElementById('user-email').textContent = 'Supabase config missing.';
         document.getElementById('game-area').style.display = 'none'; // Hide game if config is missing
        return;
    }

    let supabase = null;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized for game.');
    } catch (e) {
        console.error('Error initializing Supabase client:', e);
         document.getElementById('user-email').textContent = 'Supabase init failed.';
         document.getElementById('game-area').style.display = 'none'; // Hide game if init fails
        return;
    }

    // --- Step 2: Check Authentication Status ---
    const userEmailElement = document.getElementById('user-email');
    const signoutButton = document.getElementById('signout-button');
    const gameArea = document.getElementById('game-area');

    let session = null;
    let userId = null;

    console.log('Checking authentication status...');
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error('Error getting session:', sessionError.message);
        userEmailElement.textContent = 'Error loading user.';
        gameArea.style.display = 'none';
        alert('An error occurred while verifying your session. Please log in again.');
        window.location.href = '/chroma/signin.html'; // Redirect to sign-in page
        return;
    }

    session = currentSession;

    if (!session) {
        console.log('No active session found. User is not logged in.');
        userEmailElement.textContent = 'Not logged in.';
        gameArea.style.display = 'none';
        alert('You need to be logged in to play.');
        window.location.href = '/chroma/signin.html'; // Redirect to sign-in page
        return;
    }

    // User is logged in!
    userId = session.user.id;
    userEmailElement.textContent = session.user.email;
    console.log('User is logged in with ID:', userId, 'Email:', session.user.email);

    // --- Step 3: Fetch existing game stats ---
    console.log('Fetching existing game stats for user:', userId);
    const { data: userStats, error: fetchStatsError } = await supabase
        .from('guess_colors_stats') // Your stats table name for this game
        .select('score, max_streak, attempts, current_streak, total_correct_guesses') // Columns to fetch
        .eq('id', userId) // Filter by the logged-in user ID (using 'id' as per table schema)
        .single();

    if (fetchStatsError && fetchStatsError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        console.error('Error fetching game stats:', fetchStatsError.message);
        // Continue with default stats, but log the error
    }

    // Step 4: Initialize game variables & displays with fetched lifetime stats
    let lifetimeScore = userStats ? userStats.score : 0;
    let lifetimeMaxStreak = userStats ? userStats.max_streak : 0;
    let lifetimeAttempts = userStats ? userStats.attempts : 0;
    let lifetimeCurrentStreak = userStats ? userStats.current_streak : 0;
    let lifetimeTotalCorrectGuesses = userStats ? userStats.total_correct_guesses : 0;


    // --- Get DOM element references (Moved to top) ---
    const hexQuestion = document.getElementById("hex-question");
    const colorOptions = document.getElementById("color-options");
    const result = document.getElementById("result");
    const scoreDisplay = document.getElementById("score"); // Use scoreDisplay for lifetime score
    const timerDisplay = document.getElementById("timer");
    const modeSelect = document.getElementById("mode");
    const startButton = document.getElementById("start-button"); // Get reference to the Start button

    // Get references for stats displays
    const currentStreakDisplay = document.getElementById("current-streak-display");
    const maxStreakDisplay = document.getElementById("max-streak-display");
    const attemptsDisplay = document.getElementById('attempts-display');
    const accuracyDisplay = document.getElementById("accuracy-display"); // Display for accuracy


    // Display initial lifetime stats
    scoreDisplay.textContent = lifetimeScore;
    maxStreakDisplay.textContent = lifetimeMaxStreak;
    attemptsDisplay.textContent = lifetimeAttempts;
    currentStreakDisplay.textContent = lifetimeCurrentStreak;
    updateAccuracyDisplay(lifetimeTotalCorrectGuesses, lifetimeAttempts); // Update accuracy display


    // Re-enable the game area now that stats are loaded (or defaulted)
     if (gameArea) {
        gameArea.style.opacity = 1;
        gameArea.style.pointerEvents = 'auto';
     } else {
         console.error('Game area element not found!');
     }


    // --- Game Logic Variables (RESET per game round) ---
    let correctColor = "";
    let timeoutHandle;
    let countdownHandle;

    // Variables to track stats for the *current game session* (if needed, or just update lifetime directly)
    // For this game, stats are updated per round. Let's update lifetime stats directly after each round.


    // --- Game Logic Functions ---

    function getRandomHex() {
        return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }

    function generateSimilarColor(base, difference) {
        let r = parseInt(base.substring(1, 3), 16);
        let g = parseInt(base.substring(3, 5), 16);
        let b = parseInt(base.substring(5, 7), 16);
        r = Math.max(0, Math.min(255, r + Math.floor(Math.random() * difference * 2 - difference)));
        g = Math.max(0, Math.min(255, g + Math.floor(Math.random() * difference * 2 - difference)));
        b = Math.max(0, Math.min(255, b + Math.floor(Math.random() * difference * 2 - difference)));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    function shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function startTimer(callback) {
        let seconds = 3; // Shorter timer for faster rounds
        timerDisplay.textContent = `Next round in ${seconds}s`;
        countdownHandle = setInterval(() => {
            seconds--;
            if (seconds > 0) {
                timerDisplay.textContent = `Next round in ${seconds}s`;
            } else {
                clearInterval(countdownHandle);
                timerDisplay.textContent = "";
                callback(); // Generate next game round
            }
        }, 1000);
    }

    // Function to update the accuracy display
    function updateAccuracyDisplay(correct, total) {
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        accuracyDisplay.textContent = `${accuracy}%`;
    }


    async function generateGame() { // Make async to allow saving stats
        clearTimeout(timeoutHandle);
        clearInterval(countdownHandle);
        timerDisplay.textContent = "";
        colorOptions.innerHTML = "";
        result.textContent = "";
        result.classList.remove('correct', 'wrong'); // Remove previous feedback classes


        const mode = modeSelect.value;
        let diff = 80;
        if (mode === "medium") diff = 40;
        else if (mode === "hard") diff = 20;

        correctColor = getRandomHex();
        hexQuestion.textContent = correctColor;

        const choices = [correctColor];
        while (choices.length < 4) {
            const newColor = generateSimilarColor(correctColor, diff);
            // Ensure generated colors are distinct from existing choices
            if (!choices.includes(newColor)) {
                 // Optional: Add a check for minimum color difference if needed for difficulty tuning
                 let isDifferentEnough = true; // Assume different enough initially
                 // Example check (requires calculating color distance, more complex)
                 // if (mode === 'hard') {
                 //    isDifferentEnough = checkColorDifference(newColor, correctColor, minDifferenceForHard);
                 // }
                 // if (isDifferentEnough) {
                      choices.push(newColor);
                 // }
            }
        }

        const labels = ['A', 'B', 'C', 'D'];
        shuffle(choices).forEach((color, index) => {
            const wrapper = document.createElement("div");
            wrapper.className = "color-choice-wrapper";

            const div = document.createElement("div");
            div.className = "color-choice";
            div.style.backgroundColor = color;

            const label = document.createElement("div");
            label.textContent = `${labels[index]}`;
            label.style.fontWeight = 'bold';

            const hexText = document.createElement("div");
            hexText.textContent = ""; // Initially empty
            hexText.style.fontSize = "0.9em";
            hexText.style.color = '#333'; // Ensure hex text is dark


            div.onclick = async () => { // Make onclick handler async to save stats
                // Disable clicks on options after a choice is made
                document.querySelectorAll('.color-choice').forEach(choice => choice.style.pointerEvents = 'none');

                let isCorrect = false;
                if (color === correctColor) {
                    result.textContent = "🎉 Correct!";
                    result.classList.add('correct');
                    lifetimeScore += 1; // Increment lifetime score
                    lifetimeTotalCorrectGuesses += 1; // Increment total correct guesses
                    lifetimeCurrentStreak += 1; // Increment current streak
                    lifetimeMaxStreak = Math.max(lifetimeMaxStreak, lifetimeCurrentStreak); // Update max streak
                    isCorrect = true;
                } else {
                    result.textContent = `❌ Wrong! The correct color was ${correctColor}`;
                    result.classList.add('wrong');
                    lifetimeCurrentStreak = 0; // Reset current streak on wrong answer
                }

                lifetimeAttempts += 1; // Increment total attempts after each guess

                // Show hex code for all options after a guess
                Array.from(document.querySelectorAll('.color-choice-wrapper')).forEach((wrap, i) => {
                    const hexCode = choices[i]; // Use the color from the shuffled choices array
                    wrap.querySelector('div:nth-child(3)').textContent = hexCode;
                     // Add visual feedback border
                     const choiceBox = wrap.querySelector('.color-choice');
                     if (choices[i] === correctColor) {
                         choiceBox.classList.add('correct-answer');
                     } else {
                         choiceBox.classList.add('wrong-answer');
                     }
                });

                // Update displayed stats immediately
                scoreDisplay.textContent = lifetimeScore;
                attemptsDisplay.textContent = lifetimeAttempts;
                currentStreakDisplay.textContent = lifetimeCurrentStreak;
                maxStreakDisplay.textContent = lifetimeMaxStreak;
                updateAccuracyDisplay(lifetimeTotalCorrectGuesses, lifetimeAttempts);


                // --- Save stats to database after each round ---
                if (userId && supabase) {
                    console.log('Round finished. Saving stats...');
                    await saveGuessColorStats(userId, lifetimeScore, lifetimeMaxStreak, lifetimeAttempts, lifetimeCurrentStreak, lifetimeTotalCorrectGuesses);
                } else {
                    console.warn('User not logged in or Supabase not available. Stats not saved.');
                }
                // --- End Save ---

                // Start timer for the next game round
                startTimer(generateGame);
            };

            wrapper.appendChild(label);
            wrapper.appendChild(div);
            wrapper.appendChild(hexText);
            colorOptions.appendChild(wrapper);
        });
    }

    // Function to save game stats (Modified for Guess the Color stats)
    async function saveGuessColorStats(userId, score, maxStreak, attempts, currentStreak, totalCorrectGuesses) {
        console.log('Initiating save game stats for user:', userId);
        console.log('Stats to save:', { score, maxStreak, attempts, currentStreak, totalCorrectGuesses });

        // Calculate average score (though not displayed, good to save or derive accuracy)
        const averageScore = attempts > 0 ? parseFloat((totalCorrectGuesses / attempts).toFixed(2)) : 0.0;
        // Note: Accuracy is (total_correct_guesses / attempts) * 100. average_score here is a decimal representation.

        // Use Upsert (Insert OR Update)
        // Requires a UNIQUE constraint on 'id' in guess_colors_stats table
        const { data: updatedStats, error: updateError } = await supabase
            .from('guess_colors_stats') // Your stats table name
            .upsert(
                {
                    id: userId, // Link this stats record to the user (using 'id' as per table schema)
                    score: score,
                    max_streak: maxStreak,
                    attempts: attempts,
                    current_streak: currentStreak,
                    total_correct_guesses: totalCorrectGuesses,
                    // average_score: averageScore, // Optional: save average score if desired
                    // Add updated_at if you have it: updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'id' // Conflict target for upsert - REQUIRES UNIQUE CONSTRAINT ON id IN DB
                }
            );

        if (updateError) {
            console.error('Error saving game stats:', updateError.message);
             // Display an error to the user if needed
        } else {
            console.log('Game stats saved successfully:', updatedStats);
             // No need to update displays here, as they were updated immediately after the guess
        }
    }
    // --- End of save function ---


    // --- Event Listeners ---

    // Event listener for the Start button
    if (startButton) {
        startButton.addEventListener('click', generateGame);
    } else {
        console.error('Start button not found!');
    }

    // Event listener for Difficulty select (Optional: restart game on difficulty change)
    // if (modeSelect) {
    //     modeSelect.addEventListener('change', generateGame); // Restart game on difficulty change
    // }


    // Sign out logic
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


    // Initial call to generate the first game round after DOM and stats load
    // Don't automatically start the game, wait for the user to click "Start"
    // generateGame(); // <-- Remove this if you want user to click Start


}); // End of DOMContentLoaded listener

// --- Helper functions that don't need DOM/Supabase access can be outside or in a separate file ---
// generateRandomHex, generateSimilarColor, shuffle, startTimer are defined inside now.
// updateAccuracyDisplay is also defined inside.
