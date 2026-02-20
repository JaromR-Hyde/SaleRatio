document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const errorMessage = document.getElementById("errorMessage");

    try {
        // LOAD CREDENTIALS
        const response = await fetch("credentials.json");
        const data = await response.json();

        // FIND USER
        const user = data.users.find(u =>
            u.username === username && u.password === password
        );

        if (user) {
            // STORE USER CONTEXT
            sessionStorage.setItem("user", JSON.stringify({
                username: user.username,
                jurisdiction: user.jurisdiction
            }));

            // REDIRECT TO MAIN APP
            window.location.href = "index.html";
        } else {
            errorMessage.textContent = "Invalid username or password.";
        }

    } catch (err) {
        console.error("Error loading credentials:", err);
        errorMessage.textContent = "Login system error.";
    }
});
