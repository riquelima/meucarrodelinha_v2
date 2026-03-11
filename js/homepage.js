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

            const service = new google.maps.places.AutocompleteService();
            service.getPlacePredictions({
                input: query,
                componentRestrictions: { country: 'br' },
                // Biasing result to Salinas da Margarida area
                locationBias: { lat: -12.87, lng: -38.80, radius: 20000 }
            }, (predictions, status) => {
                if (status !== google.maps.places.PlacesServiceStatus.OK) {
                    suggestionsList.classList.add('hidden');
                    return;
                }
                renderSuggestions(predictions);
            });
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!destinoInput.contains(e.target) && !suggestionsList.contains(e.target)) {
                suggestionsList.classList.add('hidden');
            }
        });
    }

    function renderSuggestions(predictions) {
        suggestionsList.innerHTML = '';

        if (!predictions || predictions.length === 0) {
            suggestionsList.classList.add('hidden');
            return;
        }

        predictions.forEach(prediction => {
            const li = document.createElement('li');
            li.className = 'px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors flex items-center gap-3';

            // Icon based on type from Google predictions
            let icon = 'location_on';
            const types = prediction.types || [];
            if (types.includes('restaurant')) icon = 'restaurant';
            else if (types.includes('bar')) icon = 'local_bar';
            else if (types.includes('pharmacy')) icon = 'local_pharmacy';
            else if (types.includes('hospital')) icon = 'local_hospital';
            else if (types.includes('supermarket') || types.includes('grocery_or_supermarket')) icon = 'shopping_cart';

            li.innerHTML = `
                <span class="material-symbols-outlined text-slate-400 text-lg">${icon}</span>
                <div class="flex-1 overflow-hidden">
                    <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">${prediction.structured_formatting.main_text}</p>
                    <p class="text-xs text-slate-500 truncate">${prediction.description}</p>
                </div>
            `;

            li.addEventListener('click', () => {
                selectPlace(prediction);
            });

            suggestionsList.appendChild(li);
        });

        suggestionsList.classList.remove('hidden');
    }

    function selectPlace(prediction) {
        // Get full details from place_id (especially lat/lng)
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results[0]) {
                const place = results[0];
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                const fullName = place.formatted_address;
                const shortName = prediction.structured_formatting.main_text;

                destinoInput.value = fullName;
                suggestionsList.classList.add('hidden');

                // Dispatch event for the map
                document.dispatchEvent(new CustomEvent('placeSelected', {
                    detail: { lat, lng, name: shortName }
                }));

                // Redirect to passenger login after a short delay
                setTimeout(() => {
                    window.location.href = 'loginPassageiro.html';
                }, 1000);
            }
        });
    }

    // Driver Loading Logic (Existing)
    const driversContainer = document.getElementById('drivers-container');
    if (driversContainer) {
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
            console.error('Unexpected error loading drivers:', err);
        }
    }

    // Ads Loading Logic
    const adsContainer = document.getElementById('ads-container');
    if (adsContainer) {
        try {
            const { data: ads, error } = await supabaseClient
                .from('anuncios')
                .select('*')
                .eq('ativo', true)
                .order('criado_em', { ascending: false });

            if (error) throw error;

            // Always clear static content first
            adsContainer.innerHTML = '';

            if (ads && ads.length > 0) {
                ads.forEach(ad => {
                    const adElement = document.createElement('div');
                    adElement.className = 'stagger-item flex-none w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm cursor-pointer active-scale';

                    adElement.innerHTML = `
                        <div class="h-24 w-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                            <img alt="${ad.titulo}" class="w-full h-full object-cover" src="${ad.imagem_url}" />
                        </div>
                        <div class="p-3">
                            <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">${ad.titulo}</h4>
                            <p class="text-[10px] text-[#f97316] font-medium mt-1 uppercase tracking-wide">${ad.descricao || 'Confira'}</p>
                        </div>
                    `;

                    adElement.addEventListener('click', () => {
                        if (ad.url) {
                            window.open(ad.url, '_blank');
                        }
                    });

                    adsContainer.appendChild(adElement);
                });
            } else {
                // Placeholder if no ads
                adsContainer.innerHTML = `
                    <div class="flex-none w-48 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-center gap-2">
                        <span class="material-symbols-outlined text-slate-400">campaign</span>
                        <p class="text-[10px] text-slate-500 font-medium">Anuncie seu negócio aqui!</p>
                    </div>
                `;
            }
        } catch (err) {
            console.error('Error loading ads:', err);
        }
        // Highlight newly created ad
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('adCreated') === 'true') {
            const { data: { session } } = await supabaseClient.auth.getSession();

            // Only show for logged out users as requested
            if (!session) {
                if (adsContainer) {
                    setTimeout(() => {
                        adsContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

                        // Create elegant tooltip
                        const tooltip = document.createElement('div');
                        tooltip.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl animate-bounce z-[60] flex items-center gap-2 ios-blur';
                        tooltip.innerHTML = `
                        <span class="material-symbols-outlined">auto_awesome</span>
                        <span>Seu anúncio aparece aqui!</span>
                    `;
                        document.body.appendChild(tooltip);

                        // Highlight effect
                        adsContainer.classList.add('ring-4', 'ring-emerald-500/30', 'ring-offset-4', 'dark:ring-offset-slate-900', 'transition-all', 'duration-1000');

                        setTimeout(() => {
                            tooltip.style.opacity = '0';
                            tooltip.style.transition = 'opacity 0.5s ease';
                            setTimeout(() => tooltip.remove(), 500);
                            adsContainer.classList.remove('ring-4', 'ring-emerald-500/30', 'ring-offset-4');
                        }, 5000);
                    }, 800);
                }
            }
        }
    }
});
