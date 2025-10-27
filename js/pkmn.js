// Pokemon battle display for the "COME FIGHT ME" section
const pokemon = [
    {
        name: "Bulbasaur",
        type: "Grass/Poison",
        level: 5
    },
    {
        name: "Charmander",
        type: "Fire",
        level: 5
    },
    {
        name: "Squirtle",
        type: "Water",
        level: 5
    },
    {
        name: "Pikachu",
        type: "Electric",
        level: 5
    },
    {
        name: "Eevee",
        type: "Normal",
        level: 5
    },
    {
        name: "Jigglypuff",
        type: "Normal/Fairy",
        level: 5
    },
    {
        name: "Meowth",
        type: "Normal",
        level: 5
    },
    {
        name: "Psyduck",
        type: "Water",
        level: 5
    },
    {
        name: "Abra",
        type: "Psychic",
        level: 5
    },
    {
        name: "Gengar",
        type: "Ghost/Poison",
        level: 5
    }
];

// Function to get a random pokemon
function getRandomPokemon() {
    const randomIndex = Math.floor(Math.random() * pokemon.length);
    return pokemon[randomIndex];
}

// Function to display a random pokemon battle
function displayRandomBattle() {
    const playerPokemon = getRandomPokemon();
    const enemyPokemon = getRandomPokemon();
    
    const battleHTML = `
        <div style="color: white; text-align: left; font-family: monospace; font-size: 10px;">
            <div>${enemyPokemon.name} L${enemyPokemon.level}</div>
            <div>${playerPokemon.name} L${playerPokemon.level}</div>
            <div style="margin-top: 5px;">What will</div>
            <div>${playerPokemon.name} do?</div>
            <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                <div>FIGHT</div>
                <div>BAG</div>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <div>PKMN</div>
                <div>RUN</div>
            </div>
        </div>
    `;
    
    document.getElementById('pkmnDisplay').innerHTML = battleHTML;
}

// Run when the page loads
document.addEventListener('DOMContentLoaded', displayRandomBattle);
