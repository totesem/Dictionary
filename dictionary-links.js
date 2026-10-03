let dictionaryTermList = [];
let acronymList = [];
let dictionaryTermMap = new Map();

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

    dictionaryTermMap = new Map();

    for (const item of terms) {
        const term = (item.term || "").trim().toLowerCase();

        if (term) {
            dictionaryTermMap.set(term, item);
        }
    }
}

function protectAcronymExpansions(text) {
    const protectedPhrases = [];

    for (const acronym of acronymList) {
        const pattern = new RegExp(
            `\\b((?:[A-Za-z]+\\s+){1,5}[A-Za-z]+)\\s*\\(\\s*${escapeRegExp(acronym)}\\s*\\)`,
            "g"
        );

        text = text.replace(pattern, (match, phrase) => {
            const words = phrase.trim().split(/\s+/);

            const initials = words
                .map(word => word.charAt(0).toUpperCase())
                .join("");

            if (initials !== acronym) {
                return match;
            }

            const token = `___ACRONYM_EXPANSION_${protectedPhrases.length}___`;

            protectedPhrases.push({
                token: token,
                text: phrase
            });

            // Keep (ACRONYM) available to the normal acronym matcher
            return `${token} (${acronym})`;
        });
    }

    return {
        text: text,
        protectedPhrases: protectedPhrases
    };
}

function formatDefinition(text, currentTerm) {
    if (!text) {
        return "";
    }

    let formatted = escapeHtml(text);

    const isCurrentTermAcronym =
        currentTerm === currentTerm.toUpperCase() &&
        currentTerm !== currentTerm.toLowerCase();

    let protectedFirstClause = "";

    // Acronym entries: protect everything before the first semicolon
    if (isCurrentTermAcronym) {
        const semicolonIndex = formatted.indexOf(";");

        if (semicolonIndex !== -1) {
            protectedFirstClause = formatted.substring(0, semicolonIndex);

            formatted =
                "___FIRST_CLAUSE___" +
                formatted.substring(semicolonIndex);
        }
    }

    // Protect explicit acronym expansions such as:
    // American Gas Association (AGA)
    const protectedData = protectAcronymExpansions(formatted);
    formatted = protectedData.text;

    // Apply normal dictionary matching
    for (const term of dictionaryTermList) {
        const escapedTerm = escapeRegExp(term);

        const isAcronym =
            term === term.toUpperCase() &&
            term !== term.toLowerCase();

        const regex = new RegExp(
            `\\b${escapedTerm}\\b`,
            isAcronym ? "g" : "gi"
        );

        formatted = formatted.replace(
            regex,
            match => {
                // Acronyms must match exactly as written
                if (isAcronym) {
                    return `<a href="#" class="dictionary-link" data-term="${escapeHtml(term)}"><em>${match}</em></a>`;;
                }

                // Normal terms:
                // lowercase and sentence case = match
                // all uppercase = don't match
                if (
                    match === match.toUpperCase() &&
                    match !== match.toLowerCase()
                ) {
                    return match;
                }

                return `<a href="#" class="dictionary-link" data-term="${escapeHtml(term)}"><em>${match}</em></a>`;;
            }
        );
    }

    // Restore explicit acronym expansions
    for (const item of protectedData.protectedPhrases) {
        formatted = formatted.replace(
            item.token,
            item.text
        );
    }

    // Restore the protected first clause
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