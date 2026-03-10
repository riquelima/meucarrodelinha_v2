document.addEventListener('DOMContentLoaded', async () => {
    // Autocomplete Logic
    const destinoInput = document.getElementById('destino-input');
    const suggestionsList = document.getElementById('destino-suggestions');
    let debounceTimeout;

    if (destinoInput && suggestionsList) {
        destinoInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            clearTimeout(debounceTimeout);

            if (query.length < 3) {
                suggestionsList.classList.add('hidden');
                suggestionsList.innerHTML = '';
                return;
            }

            debounceTimeout = setTimeout(async () => {
                try {
                    // Salinas da Margarida coordinates for biasing search
                    // viewbox: left,top,right,bottom (W,N,E,S)
                    // Salinas: -38.80, -12.87
                    // Broader region: -39.0,-12.8,-38.6,-13.0
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=br&viewbox=-39.0,-12.8,-38.6,-13.0`);
                    if (!response.ok) throw new Error('Network response was not ok');
                    const data = await response.json();

                    renderSuggestions(data);
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                }
            }, 300);
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!destinoInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.classList.add('hidden');
            }
        });
    }

    function renderSuggestions(places) {
        suggestionsList.innerHTML = '';

        if (!places || places.length === 0) {
            suggestionsList.classList.add('hidden');
            return;
        }

        places.forEach(place => {
            const li = document.createElement('li');
            li.className = 'px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors flex items-center gap-3';
            
            // Icon based on type (simplified)
            let icon = 'location_on';
            if (place.type === 'restaurant') icon = 'restaurant';
            else if (place.type === 'pub' || place.type === 'bar') icon = 'local_bar';
            else if (place.type === 'pharmacy') icon = 'local_pharmacy';
            else if (place.type === 'hospital') icon = 'local_hospital';
            else if (place.type === 'supermarket') icon = 'shopping_cart';

            li.innerHTML = `
                <span class="material-symbols-outlined text-slate-400 text-lg">${icon}</span>
                <div class="flex-1 overflow-hidden">
                    <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">${place.display_name.split(',')[0]}</p>
                    <p class="text-xs text-slate-500 truncate">${place.display_name}</p>
                </div>
            `;

            li.addEventListener('click', () => {
                selectPlace(place);
            });

            suggestionsList.appendChild(li);
        });

        suggestionsList.classList.remove('hidden');
    }

    function selectPlace(place) {
        const shortName = place.display_name.split(',')[0];
        destinoInput.value = shortName;
        suggestionsList.classList.add('hidden');

        // Redirect to passenger login
        window.location.href = 'loginPassageiro.html';
    }

    // Driver Loading Logic (Existing)
    const driversContainer = document.getElementById('drivers-container');
    if (!driversContainer) return;

    try {
        // Fetch drivers who are approved
        // We join with the 'usuarios' table to get the name and profile picture
        const { data: drivers, error } = await supabaseClient
            .from('motoristas')
            .select(`
                modelo_veiculo,
                avaliacao_media,
                status_online,
                usuarios (
                    nome,
                    foto_perfil_url
                )
            `)
            .order('status_online', { ascending: false })
            .order('avaliacao_media', { ascending: false })
            .limit(10);

        if (error) {
            console.error('Error fetching drivers:', error);
            driversContainer.innerHTML = '<p class="text-slate-500 text-sm p-4">Não foi possível carregar os motoristas.</p>';
            return;
        }

        if (!drivers || drivers.length === 0) {
            driversContainer.innerHTML = '<p class="text-slate-500 text-sm p-4">Nenhum motorista disponível no momento.</p>';
            return;
        }

        // Clear loading state/mock data
        driversContainer.innerHTML = '';

        // Function to create a driver card
        const createDriverCard = (driver) => {
            const user = driver.usuarios;
            // Get initials for fallback avatar
            const initials = user.nome
                ? user.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : '??';

            const card = document.createElement('div');
            card.className = 'flex-none w-64 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md transition-shadow';

            // Avatar HTML logic
            let avatarHtml;
            if (user.foto_perfil_url) {
                avatarHtml = `<img alt="${user.nome}" class="w-full h-full object-cover" src="${user.foto_perfil_url}" onerror="this.parentElement.innerHTML='${initials}'" />`;
            } else {
                // Generate a random color for the placeholder background
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                avatarHtml = `<div class="w-full h-full flex items-center justify-center text-white font-bold ${randomColor}">${initials}</div>`;
            }

            // Status Badge Logic - FORCED DISPONIVEL FOR HOMEPAGE HIGHLIGHTS
            const statusClass = 'bg-green-500/10 text-green-500';
            const statusText = 'Disponível';

            card.innerHTML = `
                <div class="flex items-center gap-3 mb-3">
                    <div class="size-12 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xl font-bold">
                        ${avatarHtml}
                    </div>
                    <div>
                        <p class="font-bold truncate w-32">${user.nome || 'Motorista'}</p>
                        <div class="flex items-center gap-1 text-yellow-500">
                            <span class="material-symbols-outlined text-sm fill-1">star</span>
                            <span class="text-xs font-bold">${driver.avaliacao_media || '5.0'}</span>
                        </div>
                    </div>
                </div>
                <div class="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                    <span class="flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">local_taxi</span> 
                        ${driver.modelo_veiculo || 'Veículo não inf.'}
                    </span>
                    <span class="px-2 py-1 rounded-full font-bold uppercase tracking-tight ${statusClass}">
                        ${statusText}
                    </span>
                </div>
            `;

            // Add click event (optional: navigate to driver profile or booking)
            card.addEventListener('click', () => {
                // Future implementation: Navigate to driver details
                console.log('Clicked driver:', user.nome);
            });

            return card;
        };

        // Render drivers
        drivers.forEach(driver => {
            driversContainer.appendChild(createDriverCard(driver));
        });
        
        // Clone for infinite scroll (if we have enough items)
        if (drivers.length > 3) {
            drivers.forEach(driver => {
                const clone = createDriverCard(driver);
                clone.setAttribute('aria-hidden', 'true'); // Accessibility: hide duplicates
                driversContainer.appendChild(clone);
            });
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
});
