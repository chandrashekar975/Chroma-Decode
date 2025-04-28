// game.js - JavaScript for the Guess the HEX Code game

// Wrap your code inside a DOMContentLoaded listener and make it async
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Game script loaded. Waiting for DOM.');
    const colorBox = document.getElementById("colorBox");
    const guessColorBox = document.getElementById("guessColorBox");
    const guesses = document.getElementById("guesses");
    const message = document.getElementById("message");

    const soundToggle = document.getElementById("soundToggle");
    const correctSound = document.getElementById("correctSound");
    const wrongSound = document.getElementById("wrongSound");

    const streakDisplay = document.getElementById("current-streak-display"); // Use renamed display
    const maxStreakDisplay = document.getElementById("max-streak-display"); // Use renamed display
    const attemptsDisplay = document.getElementById('attempts-display'); // Reference the attempts display
    const scoreDisplay = document.getElementById('score'); // Reference the attempts display
    const restartButton = document.getElementById('restart-button');
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
    const gameArea = document.getElementById('game-area'); // Get the game area div

    let session = null;
    let userId = null;

    console.log('Checking authentication status...');
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession(); // Rename session variable

    if (sessionError) {
        console.error('Error getting session:', sessionError.message);
        userEmailElement.textContent = 'Error loading user.';
        gameArea.style.display = 'none'; // Hide game if session check fails
        // Optionally redirect to login: window.location.href = '/chroma/signin.html';
        return;
    }

    session = currentSession; // Assign to our script's session variable

    if (!session) {
        console.log('No active session found. User is not logged in.');
        userEmailElement.textContent = 'Not logged in.';
        gameArea.style.display = 'none'; // Hide game if not logged in
        alert('You need to be logged in to play.');
         window.location.href = '/chroma/signin.html'; // Redirect to sign-in page
        return;
    }

    // User is logged in!
    userId = session.user.id; // Get the user ID
    userEmailElement.textContent = session.user.email; // Display user email
    console.log('User is logged in with ID:', userId, 'Email:', session.user.email);

    // --- Step 3: Fetch existing game stats ---
    console.log('Fetching existing game stats for user:', userId);
    const { data: userStats, error: fetchStatsError } = await supabase
        .from('guess_hex_stats') // Your stats table name
        .select('max_streak, score, attempts, current_streak') // Columns to fetch
        .eq('id', userId) // Filter by the logged-in user ID
        .single(); // Expecting one row

    if (fetchStatsError && fetchStatsError.code !== 'PGRST116') { // PGRST116 is " रूपान्तरणको रूपमा एक भन्दा बढी पङ्क्तिहरू", means no rows found
        console.error('Error fetching game stats:', fetchStatsError.message);
        // Continue with default stats, but log the error
    }

    // Step 4: Initialize game variables with fetched stats or defaults
    // Your game variables: totalScore, currentStreak, maxStreak, totalRounds (for attempts), correctGuesses
    totalScore = userStats ? userStats.score : 0;
    let initialCurrentStreak = userStats ? userStats.current_streak : 0; // Get current streak from DB
    maxStreak = userStats ? userStats.max_streak : 0;
    totalRounds = userStats ? userStats.attempts : 0;

     // Recalculate correctGuesses or accuracy from fetched data if needed
     // If storing total attempts and total score, accuracy is derived.
     // If you stored total correct guesses, use that.
     // Let's derive from score and attempts for simplicity here, if necessary for display.
     // If you need to maintain correctGuesses count for accuracy calculation,
     // you might need to store it in the DB, or recalculate based on avg_score * attempts.
     // Let's assume totalRounds is total attempts, totalScore is total score.
     // Accuracy = (Correct Guesses / Total Attempts) * 100.
     // We don't store correct guesses directly, need to infer or recalculate.
     // For now, let's initialize display based on fetched cumulative data.
     // The game logic updates these based on the *current* game session.
     // We need to reconcile game session stats vs lifetime stats from DB.

     // Let's clarify:
     // Your game variables (currentStreak, totalScore, etc.) seem to reset per page load/restart.
     // The DB stores lifetime stats.
     // When loading, we should load lifetime stats into display, NOT into game *play* variables like currentAttempt.
     // When a game ENDS, we update lifetime stats based on the game result and OLD lifetime stats.

     // Let's rename game variables to clarify session vs lifetime
     let currentSessionScore = 0; // Score earned in this single game session
     let currentSessionAttempts = 0; // Attempts made in this single game session
     let currentSessionStreak = 0; // Streak *within* this session
     let currentSessionCorrectGuesses = 0; // Correct guesses within this session


     // Display lifetime stats loaded from DB
     scoreDisplay.textContent = totalScore; // Total lifetime score
     maxStreakDisplay.textContent = maxStreak; // Total max streak
     document.getElementById('attempts-display').textContent = totalRounds; // Total lifetime attempts

     // The 'current_streak' from the DB is the streak they had *ending the last session*.
     // Your game's current session streak starts from where they left off *if the last game was a win*?
     // Or does streak reset to 0 on page load?
     // Let's assume current session streak starts from 0 on page load, but max streak display shows lifetime.
     // The DB's 'current_streak' should reflect the streak *if they stopped on a win*.
     // Let's use the DB's 'current_streak' to initialize the display, but reset session streak for gameplay.
     streakDisplay.textContent = initialCurrentStreak; // Display the streak they had last time

     // Recalculate Accuracy Percentage based on lifetime stats
    // If you track total correct guesses and total attempts:
    const lifetimeAccuracy = totalRounds > 0 ? Math.round((totalScore / (totalRounds * 5)) * 100) : 0;; // Assuming max score per game is 5
     accuracyPercent.textContent = `${lifetimeAccuracy}%`;


     // Re-enable the game area now that stats are loaded (or defaulted)
     gameArea.style.opacity = 1;
     gameArea.style.pointerEvents = 'auto';


    // --- Game Logic Variables (RESET per game session) ---
    // These will be updated by the game logic functions (submitGuess, updateStats)


    let answer = "";
    let currentAttempt = 0;
    const maxAttempts = 5;
    let isGameOver = false;


    // Update these session variables in updateStats and submitGuess
    let currentSessionScoreThisGame = 0; // Score earned in the *current* game instance
    let currentSessionAttemptsThisGame = 0; // Attempts used in the *current* game instance


    // --- Game Logic Functions ---
    // --- These functions NEED to be defined *inside* the DOMContentLoaded listener
    // --- so they can access the 'supabase', 'userId', and lifetime stats variables.


     // Update this function to update session stats and potentially lifetime stats variables
    function updateStats(isCorrect) {
      // This function should ideally track stats per *round* or *game instance*
      // The lifetime stats update happens ONCE at the end of a full game (win or loss)

      // Your current updateStats seems to track cumulative stats per session/page load.
      // Let's revise: This function updates stats for the *current game instance* or *round*.
      // The final save function will aggregate this into lifetime stats.

      // For this game structure, updateStats is called per guess submission.
      // Let's keep its current role of updating session/instance stats.

      // Your current logic:
      // totalRounds++; // This seems to count total guesses across games in a session
      // if (isCorrect) {
      //   correctGuesses++; // Total correct guesses across games in a session
      //   currentStreak++; // Current streak in this session
      //   maxStreak = Math.max(maxStreak, currentStreak); // Max streak in this session
      // } else {
      //   currentStreak = 0; // Reset streak in this session
      // }

      // This needs adjustment to calculate stats per game instance correctly.
      // Let's use simpler variables related to the *current game instance* within submitGuess.
      // The updateStats function seems more focused on feedback per guess.

    }

     // Function to start a new game instance
    function startGame() {
        answer = generateHexColor();
        colorBox.style.backgroundColor = answer;
        guessColorBox.style.backgroundColor = "#FFFFFF";
        guesses.innerHTML = "";
        message.textContent = "";
        currentAttempt = 0;
        isGameOver = false;
        currentSessionScoreThisGame = 0; // Reset score for this game instance
        currentSessionAttemptsThisGame = 0; // Reset attempts for this game instance


        for (let i = 0; i < maxAttempts; i++) {
            const row = document.createElement("div");
            row.className = "guess-row";
            row.id = `row-${i}`;

            for (let j = 0; j < 6; j++) {
                const input = document.createElement("input");
                input.className = "guess-box";
                input.maxLength = 1;
                input.dataset.index = j;
                input.disabled = i !== 0;

                input.addEventListener("input", (e) => {
                    const next = input.nextElementSibling;
                    if (next && e.inputType !== "deleteContentBackward") {
                        next.focus();
                    }
                });

                row.appendChild(input);
            }

            row.addEventListener("keyup", (e) => {
                if (e.key === "Enter") {
                    const filled = [...row.querySelectorAll("input")].every(input => input.value);
                    if (filled) submitGuess();
                }
            });

            guesses.appendChild(row);

            const feedbackRow = document.createElement("div");
            feedbackRow.className = "feedback-row";
            feedbackRow.id = `feedback-${i}`;
            guesses.appendChild(feedbackRow);
        }
         // Ensure the first row is enabled
         const firstRowInputs = document.getElementById('row-0').querySelectorAll('input');
         firstRowInputs.forEach(input => input.disabled = false);
         if(firstRowInputs.length > 0) firstRowInputs[0].focus(); // Focus the first input


    }


     // Function to submit a guess (Modified to handle game end and saving)
    async function submitGuess() { // Make async because we might save here
        if (isGameOver) return;

        const row = document.getElementById(`row-${currentAttempt}`);
        const inputs = row.querySelectorAll("input");
        let guess = "";
        inputs.forEach(input => guess += input.value.toUpperCase());

        // Basic validation moved outside loop
        if (guess.length !== 6 || /[^0-9A-F]/.test(guess)) {
            console.warn('Invalid guess format.');
            return; // Stop if guess is invalid
        }

        const feedbackRow = document.getElementById(`feedback-${currentAttempt}`);
        feedbackRow.innerHTML = "";

        let isCorrect = true;
        for (let i = 0; i < 6; i++) {
            const g = parseInt(guess[i], 16);
            const a = parseInt(answer[i + 1], 16);
            const span = document.createElement("span");
            span.className = "feedback";

            if (g === a) {
                span.textContent = "✔️";
                span.classList.add("correct");
            } else {
                isCorrect = false;
                const diff = Math.abs(g - a);
                const difficulty = document.getElementById("difficulty").value;

                if (difficulty === "easy") {
                  // Simplified feedback based on difficulty
                  if (diff <= 2) {
                      span.textContent = g > a ? "🔽" : "🔼"; // Close, indicate direction
                  } else {
                      span.textContent = g > a ? "⏬️" : "⏫️"; // Further, indicate direction
                  }
                } else if (difficulty === "medium") {
                   span.textContent = g > a ? "🔽" : "🔼"; // Direction only
                } else { // Hard
                  span.textContent = "❌"; // Just wrong
                }


                 // Original class additions (can keep for coloring if used in CSS)
                 span.classList.add(g > a ? "down" : "up");
            }

            feedbackRow.appendChild(span);
             // Disable the inputs after feedback is given for this row
             inputs.forEach(input => input.disabled = true);
        }

        guessColorBox.style.backgroundColor = `#${guess}`;

        currentSessionAttemptsThisGame++; // Count this guess as an attempt in this game instance

        if (isCorrect) {
            currentSessionScoreThisGame = 5 - currentAttempt; // Score for this game instance
            message.innerHTML = `🎉 Correct! The color was <strong>${answer}</strong>`;
            if (soundToggle.checked) correctSound.play();
            isGameOver = true;
            // updateStats(true); // Game is over, update lifetime stats instead
            disableInputs(); // Disable all inputs
        } else {
            if (soundToggle.checked) wrongSound.play();
            currentAttempt++; // Move to the next attempt slot
            if (currentAttempt === maxAttempts) {
                message.innerHTML = `❌ Better luck next time! The color was <strong>${answer}</strong>`;
                isGameOver = true;
                currentSessionScoreThisGame = 0; // No score earned if lost
                // updateStats(false); // Game is over, update lifetime stats instead
                disableInputs(); // Disable all inputs
            } else {
                // Enable the next row inputs
                const nextRow = document.getElementById(`row-${currentAttempt}`);
                nextRow.querySelectorAll("input").forEach(input => input.disabled = false);
                 // Focus the first input of the next row
                 if(nextRow.querySelectorAll('input').length > 0) nextRow.querySelectorAll('input')[0].focus();
            }
        }

         // --- Check if game is over and save stats ---
         if (isGameOver && userId && supabase) { // Only save if game over and user is logged in
             console.log('Game ended. Saving stats...');
             // Call the function to fetch old stats, calculate new, and save
             await saveGuessHexStats(userId, currentSessionScoreThisGame, isCorrect); // isCorrect indicates win/loss
         } else if (isGameOver && (!userId || !supabase)) {
             console.warn('Game over, but user not logged in or Supabase not available. Stats not saved.');
             // Optionally inform the user they need to log in to save stats
         }


    }


     // Function to save game stats (Modified to fetch, calculate, and update)
    async function saveGuessHexStats(userId, scoreEarnedInThisGame, wonThisGame) {
        console.log('Initiating save game stats for user:', userId);
        console.log('Score earned this game:', scoreEarnedInThisGame, 'Won this game:', wonThisGame);

        // Step 1: Fetch the user's current lifetime stats from the database
        const { data: currentLifetimeStats, error: fetchError } = await supabase
            .from('guess_hex_stats') // Your stats table name
            .select('max_streak, score, attempts, current_streak') // Columns to fetch
            .eq('id', userId) // Filter by the logged-in user ID
            .single(); // Expecting only one row for this user ID

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 typically means no rows found
            console.error('Error fetching current game stats:', fetchError.message);
            // Handle fetch error (e.g., display message to user, stop saving)
            return; // Stop the function if we can't get current stats
        }

        // Get old lifetime stats (use 0 if no record found, though trigger should prevent this)
        const oldLifetimeScore = currentLifetimeStats ? currentLifetimeStats.score : 0;
        const oldLifetimeAttempts = currentLifetimeStats ? currentLifetimeStats.attempts : 0;
        const oldLifetimeMaxStreak = currentLifetimeStats ? currentLifetimeStats.max_streak : 0;
        const oldLifetimeCurrentStreak = currentLifetimeStats ? currentLifetimeStats.current_streak : 0;


        // Step 2: Calculate the new lifetime stats
        const newLifetimeScore = oldLifetimeScore + scoreEarnedInThisGame;
        const newLifetimeAttempts = oldLifetimeAttempts + currentSessionAttemptsThisGame; // Add attempts from *this* game

        let newLifetimeCurrentStreak = oldLifetimeCurrentStreak;
        let newLifetimeMaxStreak = oldLifetimeMaxStreak;

        if (wonThisGame) {
             newLifetimeCurrentStreak = oldLifetimeCurrentStreak + 1; // Increment lifetime current streak on win
             if (newLifetimeCurrentStreak > oldLifetimeMaxStreak) {
                 newLifetimeMaxStreak = newLifetimeCurrentStreak; // Update lifetime max streak if current streak is higher
             }
        } else {
            newLifetimeCurrentStreak = 0; // Reset lifetime current streak on loss
        }

        const newLifetimeAverageScore = newLifetimeAttempts > 0 ? parseFloat((newLifetimeScore / newLifetimeAttempts).toFixed(2)) : 0.0;

        // Step 3: Update the stats in the database using upsert (Insert OR Update)
        // Upsert requires a UNIQUE constraint on 'user_id' in guess_hex_stats
        console.log('Calculated new lifetime stats:', {
            score: newLifetimeScore,
            attempts: newLifetimeAttempts,
            max_streak: newLifetimeMaxStreak,
            current_streak: newLifetimeCurrentStreak,
            avg_score: newLifetimeAverageScore,
        });

        const { data: updatedStats, error: updateError } = await supabase
            .from('guess_hex_stats') // The table name
            .upsert(
                {
                    id: userId, // Link this stats record to the user
                    score: newLifetimeScore,
                    attempts: newLifetimeAttempts,
                    max_streak: newLifetimeMaxStreak,
                    current_streak: newLifetimeCurrentStreak, // Update the current streak
                    avg_score: newLifetimeAverageScore,
                    // Add updated_at if you have it: updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'id' // Conflict target for upsert - REQUIRES UNIQUE CONSTRAINT ON user_id IN DB
                }
            );


        if (updateError) {
            console.error('Error saving game stats:', updateError.message);
             // Display an error to the user if needed
        } else {
            console.log('Game stats saved successfully:', updatedStats);
             // Confirmation to the user
             // Update the displayed lifetime stats on the page after saving
             scoreDisplay.textContent = newLifetimeScore;
             attemptsDisplay.textContent = newLifetimeAttempts;
             maxStreakDisplay.textContent = newLifetimeMaxStreak;
             streakDisplay.textContent = newLifetimeCurrentStreak;
             accuracyPercent.textContent = `${newLifetimeAverageScore}%`; // Display average score as percentage? Or raw? Assuming percentage from display ID


        }
    }
    // --- End of save function ---


    // Function to restart a game instance (resets session stats, doesn't affect lifetime)
    function restartGame() {
      if (!isGameOver) { // If game is not over, confirm restart (optional)
          if (!confirm("Are you sure you want to restart the current game? Your stats will not be saved.")) {
              return; // User cancelled restart
          }
      }
      //startGame(); // Start a new game instance
       // Reset session stats displays (score, attempts, current streak for this session)
       // The lifetime stats displays will remain showing loaded/saved data.
       location.reload();
       //scoreDisplay.textContent = totalScore; // Show total lifetime score
       //attemptsDisplay.textContent = totalRounds; // Show total lifetime attempts
       //streakDisplay.textContent = userStats ? userStats.current_streak : 0; // Show lifetime current streak (from last save)

    }

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

    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
    } else {
        console.error('Restart button not found!');
    }


    // Initial call to start the first game after DOM and stats load
    startGame(); // Start the first game instance

}); // End of DOMContentLoaded listener


// --- Original Helper Functions (Can remain outside DOMContentLoaded if they don't need access to DOM elements or Supabase) ---
// --- Or move them inside if they do. Keeping them outside if they are pure helpers. ---

// Needs access to DOM elements (colorBox, guessColorBox, guesses, message, etc.)
// Move generateHexColor inside DOMContentLoaded if you want to keep it close to its use.
// Let's move pure helper functions outside or keep them in a separate file if preferred.

// Function to generate a random HEX color (Pure helper)
function generateHexColor() {
  let color = "#";
  const hex = "0123456789ABCDEF";
  for (let i = 0; i < 6; i++) {
    color += hex[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Function to disable all guess inputs (Pure helper)
function disableInputs() {
    document.querySelectorAll("input.guess-box").forEach(i => i.disabled = true);
}

// --- End Original Helper Functions ---
