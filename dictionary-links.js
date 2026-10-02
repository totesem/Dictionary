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

        const regex = new RegExp(
            `\\b${escapedTerm}\\b`,
            "gi"
        );

        formatted = formatted.replace(
            regex,
            match => `<em>${match}</em>`
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