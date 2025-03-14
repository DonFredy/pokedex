// Constants
const POKEMON_API = 'https://pokeapi.co/api/v2/pokemon';
const CAUGHT_POKEMON_KEY = 'caught_pokemon';

// State
let nextUrl = `${POKEMON_API}?limit=20`;
let loading = false;
let caughtPokemon = JSON.parse(localStorage.getItem(CAUGHT_POKEMON_KEY) || '[]');

// DOM Elements
const pokemonGrid = document.getElementById('pokemon-grid');
const loadMoreBtn = document.getElementById('load-more');
const modal = document.getElementById('pokemon-modal');
const modalContent = document.getElementById('modal-content');
const closeBtn = document.querySelector('.close-btn');

// Event Listeners
loadMoreBtn.addEventListener('click', loadPokemon);
closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Functions
async function loadPokemon() {
    if (loading || !nextUrl) return;
    
    loading = true;
    loadMoreBtn.disabled = true;
    
    try {
        const response = await fetch(nextUrl);
        const data = await response.json();
        
        const pokemonDetails = await Promise.all(
            data.results.map(async (pokemon) => {
                const res = await fetch(pokemon.url);
                return res.json();
            })
        );
        
        renderPokemon(pokemonDetails);
        nextUrl = data.next;
        
        if (!nextUrl) {
            loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading Pokemon:', error);
    } finally {
        loading = false;
        loadMoreBtn.disabled = false;
    }
}

function renderPokemon(pokemonList) {
    pokemonList.forEach(pokemon => {
        const card = document.createElement('div');
        card.className = `pokemon-card ${caughtPokemon.includes(pokemon.id) ? 'caught' : ''}`;
        
        card.innerHTML = `
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <h3>${pokemon.name}</h3>
            <button class="catch-btn ${caughtPokemon.includes(pokemon.id) ? 'release' : ''}" 
                    data-id="${pokemon.id}">
                ${caughtPokemon.includes(pokemon.id) ? 'Release' : 'Catch'}
            </button>
        `;
        
        card.querySelector('.catch-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCatch(pokemon.id);
        });
        
        card.addEventListener('click', () => showPokemonDetails(pokemon));
        
        pokemonGrid.appendChild(card);
    });
}

function toggleCatch(id) {
    const index = caughtPokemon.indexOf(id);
    if (index === -1) {
        caughtPokemon.push(id);
    } else {
        caughtPokemon.splice(index, 1);
    }
    
    localStorage.setItem(CAUGHT_POKEMON_KEY, JSON.stringify(caughtPokemon));
    updateCatchButton(id);
}

function updateCatchButton(id) {
    const card = document.querySelector(`[data-id="${id}"]`).parentElement;
    const button = card.querySelector('.catch-btn');
    const isCaught = caughtPokemon.includes(id);
    
    card.classList.toggle('caught', isCaught);
    button.classList.toggle('release', isCaught);
    button.textContent = isCaught ? 'Release' : 'Catch';
}

function showPokemonDetails(pokemon) {
    modalContent.innerHTML = `
        <div class="pokemon-details">
            <img src="${pokemon.sprites.other['official-artwork'].front_default}" 
                 alt="${pokemon.name}">
            <h2>${pokemon.name}</h2>
            
            <div class="type-badges">
                ${pokemon.types.map(type => `
                    <span class="type-badge">${type.type.name}</span>
                `).join('')}
            </div>
            
            <div class="abilities">
                <h3>Abilities:</h3>
                <ul class="abilities-list">
                    ${pokemon.abilities.map(ability => `
                        <li>${ability.ability.name.replace('-', ' ')}</li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="stats">
                <div>Height: ${pokemon.height / 10}m</div>
                <div>Weight: ${pokemon.weight / 10}kg</div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

// Initial load
loadPokemon();