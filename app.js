const SUPABASE_URL = "https://hxoygomlkbzpjwrysxbj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mEMA6g9QbxCfUhOPMYvdPQ_2akcLCYq";

const alphabet = document.getElementById("alphabet");
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const resultsHeading = document.getElementById("resultsHeading");
const resultCount = document.getElementById("resultCount");

let selectedLetter = "A";
let allTerms = [];

// Build alphabet
"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(letter => {
    const button = document.createElement("button");

    button.className = "letter";
    button.textContent = letter;
    button.dataset.letter = letter;

    button.addEventListener("click", () => {
        if (button.disabled) return;

        selectedLetter = letter;

        document.querySelectorAll(".letter").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        displayTerms();
    });

    alphabet.appendChild(button);
});

async function loadTerms() {
    results.innerHTML = '<p class="loading">Loading dictionary...</p>';

    try {
        allTerms = [];

        let offset = 0;
        const pageSize = 1000;

        while (true) {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/dictionary?select=*&order=term.asc&limit=${pageSize}&offset=${offset}`,
                {
                    headers: {
                        "apikey": SUPABASE_ANON_KEY,
                        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error(`Supabase returned ${response.status}`);
            }

            const page = await response.json();

            allTerms.push(...page);

            if (page.length < pageSize) {
                break;
            }

            offset += pageSize;
        }

        updateAlphabet();
        displayTerms();

    } catch (error) {
        console.error(error);

        results.innerHTML = `
            <p class="error">
                Unable to load the dictionary.
            </p>
        `;
    }
}

function updateAlphabet() {
    const availableLetters = new Set(
        allTerms
            .map(item => (item["alpha letter"] || "").toUpperCase())
            .filter(letter => letter)
    );

    document.querySelectorAll(".letter").forEach(button => {
        const letter = button.dataset.letter;

        if (availableLetters.has(letter)) {
            button.disabled = false;
            button.style.opacity = "1";
            button.style.cursor = "pointer";
        } else {
            button.disabled = true;
            button.style.opacity = "0.35";
            button.style.cursor = "default";
        }
    });

    const selectedButton = document.querySelector(
        `[data-letter="${selectedLetter}"]`
    );

    if (selectedButton && !selectedButton.disabled) {
        selectedButton.classList.add("active");
    }
}

function displayTerms() {
    const searchText = searchInput.value.trim().toLowerCase();

    const filtered = allTerms.filter(item => {
        const itemLetter = (item["alpha letter"] || "").toUpperCase();

        if (itemLetter !== selectedLetter) {
            return false;
        }

        if (!searchText) {
            return true;
        }

        const term = (item.term || "").toLowerCase();
        const definition = (item.definition || "").toLowerCase();

        return (
            term.includes(searchText) ||
            definition.includes(searchText)
        );
    });

    resultsHeading.textContent = selectedLetter;

    resultCount.textContent =
        `${filtered.length} term${filtered.length === 1 ? "" : "s"}`;

    if (filtered.length === 0) {
        results.innerHTML = `
            <p class="no-results">
                No matching terms found.
            </p>
        `;
        return;
    }

    results.innerHTML = "";

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "term";

        const termName = document.createElement("div");
        termName.className = "term-name";
        termName.textContent = item.term || "";

        const definition = document.createElement("div");
        definition.className = "term-definition";
        definition.textContent = item.definition || "";

        const details = document.createElement("div");
        details.className = "term-details";

        details.innerHTML = `
            ${makeDetail("Source", item.source)}
            ${makeDetail("Other Publication", item["other publication"])}
            ${makeDetail("Label", item.label)}
            ${makeDetail("Also Cited", item["also cited"])}
            ${makeDetail("Related", item.related)}
        `;

        card.appendChild(termName);
        card.appendChild(definition);
        card.appendChild(details);

        card.addEventListener("click", () => {
            card.classList.toggle("open");
        });

        results.appendChild(card);
    });
}

function makeDetail(label, value) {
    if (!value) {
        return "";
    }

    return `
        <div class="detail-label">${label}</div>
        <div>${escapeHtml(String(value))}</div>
    `;
}

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

searchInput.addEventListener("input", displayTerms);

loadTerms();
