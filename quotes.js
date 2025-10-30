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
    },
    {
        quote: "The journey of a thousand miles begins with one step.",
        author: "Lao Tzu"
    },
    {
        quote: "The only true wisdom is in knowing you know nothing.",
        author: "Socrates"
    },
    {
        quote: "What happens is not as important as how you react to what happens.",
        author: "Unknown"
    },
    {
        quote: "Success is walking from failure to failure with no loss of enthusiasm.",
        author: "Winston Churchill"
    },
    {
        quote: "If your actions inspire others to dream more, learn more, do more and become more, you are a leader.",
        author: "John Quincy Adams"
    },
    {
        quote: "That which does not kill us makes us stronger.",
        author: "Friedrich Nietzsche"
    },
    {
        quote: "Do not be afraid to give up the good to go for the great.",
        author: "John D. Rockefeller"
    },
    {
        quote: "Education is the most powerful weapon which you can use to change the world.",
        author: "Nelson Mandela"
    },
    {
        quote: "Be yourself; everyone else is already taken.",
        author: "Oscar Wilde"
    },
    {
        quote: "When the going gets rough – turn to wonder.",
        author: "Parker Palmer"
    },
    {
        quote: "He who learns from everyone is wise.",
        author: "Anonymous"
    },
    {
        quote: "The unexamined life is not worth living.",
        author: "Socrates"
    },
    {
        quote: "Carpe diem.",
        author: "Latin proverb"
    },
    {
        quote: "The fool doth think he is wise, but the wise man knows himself to be a fool.",
        author: "William Shakespeare"
    },
    {
        quote: "Happiness is a choice.",
        author: "Lolly Daskal"
    }
];

// Function to get wisdom quotes (always use the 20 pre-set quotes)
function getQuotes() {
    return quotes;
}

// Function to display a random quote
function displayRandomQuote() {
    // Get random index
    const availableQuotes = getQuotes();
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    
    // Get the quote and author
    const quote = availableQuotes[randomIndex].quote;
    const author = availableQuotes[randomIndex].author;
    
    // Create HTML
    const quoteHTML = `
        <i style="margin: 0;">${quote}</i>
        <p style="margin: 17px 0;">
         <u>${author}</u>
         </p>
    `;
    
    // Update the DOM
    document.getElementById('quoteDisplay').innerHTML = quoteHTML;
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', displayRandomQuote);
