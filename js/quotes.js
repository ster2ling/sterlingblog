// Array of quotes for the "YOUR WISDOM IS" section
const quotes = [
    {
        quote: "Where you go, I go. I'll hold your hand in every world",
        author: "Grendel Menz"
    },
    {
        quote: "I don't know where you end and I begin",
        author: "Shauna Shipman (YJ)"
    },
    {
        quote: "The only way out is through",
        author: "Robert Frost"
    },
    {
        quote: "The best way to predict the future is to create it",
        author: "Abraham Lincoln"
    },
    {
        quote: "Be the person you needed when you were younger",
        author: "Ayesha Siddiqi"
    }
];

// Function to display a random quote
function displayRandomQuote() {
    // Get random index
    const randomIndex = Math.floor(Math.random() * quotes.length);
    
    // Get the quote and author
    const quote = quotes[randomIndex].quote;
    const author = quotes[randomIndex].author;
    
    // Create HTML
    const quoteHTML = `
        <p style="font-style: italic;">${quote}</p>
        <p>${author}</p>
    `;
    
    // Update the DOM
    document.getElementById('quoteDisplay').innerHTML = quoteHTML;
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', displayRandomQuote);
