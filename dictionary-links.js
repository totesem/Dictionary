let dictionaryTermList = [];

// Build the list of dictionary terms after the dictionary has loaded
function initializeDictionaryLinks(terms) {
    dictionaryTermList = terms
        .map(item => (item.term || "").trim())
        .filter(term => term.length > 0)
        .sort((a, b) => b.length - a.length);
}


// Find dictionary terms in a piece of text
function formatDefinition(text) {
    if (!text) {
        return "";
    }

    let formatted = escapeHtml(text);

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
                if (isAcronym) {
                    return `<em>${match}</em>`;
                }

                // Normal lowercase terms can appear lowercase
                // or with normal sentence capitalization,
                // but not as an all-uppercase acronym.
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