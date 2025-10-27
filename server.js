const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Helper function to read JSON data
async function readData(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; // Return empty array for missing files
        }
        throw error;
    }
}

// Helper function to write JSON data
async function writeData(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Site Stats API
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await readData('siteStats.json');
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read site stats' });
    }
});

app.post('/api/stats', async (req, res) => {
    try {
        const { visitorCount, firstVisit } = req.body;
        const stats = await readData('siteStats.json');
        
        const updatedStats = {
            visitorCount: visitorCount || (stats.visitorCount || 0) + 1,
            firstVisit: firstVisit || stats.firstVisit || Date.now(),
            lastUpdated: Date.now()
        };
        
        await writeData('siteStats.json', updatedStats);
        res.json(updatedStats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update site stats' });
    }
});

// Suggestions API
app.get('/api/suggestions', async (req, res) => {
    try {
        const suggestions = await readData('suggestions.json');
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read suggestions' });
    }
});

app.post('/api/suggestions', async (req, res) => {
    try {
        const { name, suggestion } = req.body;
        
        if (!suggestion) {
            return res.status(400).json({ error: 'Suggestion content is required' });
        }
        
        const suggestions = await readData('suggestions.json');
        const newSuggestion = {
            name: name || 'Anonymous',
            suggestion: suggestion,
            timestamp: new Date().toLocaleString(),
            id: Date.now()
        };
        
        suggestions.unshift(newSuggestion);
        await writeData('suggestions.json', suggestions);
        
        res.json(newSuggestion);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add suggestion' });
    }
});

app.delete('/api/suggestions/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const suggestions = await readData('suggestions.json');
        const filteredSuggestions = suggestions.filter(s => s.id !== id);
        
        await writeData('suggestions.json', filteredSuggestions);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete suggestion' });
    }
});

// Dev Log API
app.get('/api/devlog', async (req, res) => {
    try {
        const posts = await readData('devLogPosts.json');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read dev log posts' });
    }
});

app.post('/api/devlog', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Post content is required' });
        }
        
        const posts = await readData('devLogPosts.json');
        const now = new Date();
        const newPost = {
            content: content,
            date: now.toLocaleDateString(),
            hour: now.getHours(),
            timestamp: now.getTime(),
            id: Date.now()
        };
        
        posts.unshift(newPost);
        await writeData('devLogPosts.json', posts);
        
        res.json(newPost);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add dev log post' });
    }
});

app.delete('/api/devlog/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const posts = await readData('devLogPosts.json');
        const filteredPosts = posts.filter(p => p.id !== id);
        
        await writeData('devLogPosts.json', filteredPosts);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete dev log post' });
    }
});

// Admin Data API (for other admin features)
app.get('/api/admin/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const data = await readData(`${type}.json`);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: `Failed to read ${type}` });
    }
});

app.post('/api/admin/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const data = req.body;
        
        await writeData(`${type}.json`, data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: `Failed to update ${type}` });
    }
});

// Initialize server
async function startServer() {
    await ensureDataDir();
    
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Data directory: ${DATA_DIR}`);
    });
}

startServer().catch(console.error);
