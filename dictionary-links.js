let dictionaryTermList = [];
let acronymList = [];

// Build the list of dictionary terms after the dictionary has loaded
function initializeDictionaryLinks(terms) {
    dictionaryTermList = terms
        .map(item => (item.term || "").trim())
        .filter(term => term.length > 0)
        .sort((a, b) => b.length - a.length);

    acronymList = dictionaryTermList.filter(term => {
        return (
            term === term.toUpperCase() &&
            term !== term.toLowerCase()
        );
    });
}

function protectAcronymExpansions(text) {
    const protectedPhrases = [];

    for (const acronym of acronymList) {
        const letters = acronym.split("");

        const pattern = new RegExp(
            `\\b(${letters.map(() => "[A-Za-z]+").join("\\s+")})\\s*\\(\\s*${escapeRegExp(acronym)}\\s*\\)`,
            "g"
        );

        text = text.replace(pattern, (match, phrase) => {
            const phraseWords = phrase.split(/\s+/);

            const initials = phraseWords
                .map(word => word.charAt(0).toUpperCase())
                .join("");

            if (initials !== acronym) {
                return match;
            }

            const token = `___ACRONYM_${protectedPhrases.length}___`;

            protectedPhrases.push({
                token: token,
                text: phrase
            });

            // Keep the parenthetical acronym in the text
            return `${token} (${acronym})`;
        });
    }

    return {
        text: text,
        protectedPhrases: protectedPhrases
    };
}


// Find dictionary terms in a piece of text
function formatDefinition(text, currentTerm) {
    if (!text) {
        return "";
    }

    let formatted = escapeHtml(text);

    const isAcronym =
        currentTerm === currentTerm.toUpperCase() &&
        currentTerm !== currentTerm.toLowerCase();

    let protectedFirstClause = "";

    // For acronym entries, protect everything before the first semicolon
    if (isAcronym) {
        const semicolonIndex = formatted.indexOf(";");

        if (semicolonIndex !== -1) {
            protectedFirstClause = formatted.substring(0, semicolonIndex);
            formatted =
                "___FIRST_CLAUSE___" +
                formatted.substring(semicolonIndex);
        }
    }

    for (const term of dictionaryTermList) {
        const escapedTerm = escapeRegExp(term);

        const termIsAcronym =
            term === term.toUpperCase() &&
            term !== term.toLowerCase();

        const regex = new RegExp(
            `\\b${escapedTerm}\\b`,
            termIsAcronym ? "g" : "gi"
        );

        formatted = formatted.replace(
            regex,
            match => {
                // Acronyms must match exactly as written
                if (termIsAcronym) {
                    return `<em>${match}</em>`;
                }

                // Normal terms can match lowercase or sentence case,
                // but not all-uppercase.
                if (
                    match === match.toUpperCase() &&
                    match !== match.toLowerCase()
                ) {
                    return match;
                }

                return `<em>${match}</em>`;
            }
        );
    }

    // Restore the protected acronym definition clause
    if (protectedFirstClause) {
        formatted = formatted.replace(
            "___FIRST_CLAUSE___",
            protectedFirstClause
        );
    }

    return formatted;
}


// Escape text before adding HTML
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Escape special characters for regular expressions
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}