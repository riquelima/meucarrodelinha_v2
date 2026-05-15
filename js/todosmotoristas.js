
document.addEventListener('DOMContentLoaded', async () => {
    const driversList = document.getElementById('drivers-list');
    const searchInput = document.querySelector('input[placeholder="Buscar motorista pelo nome..."]');

    if (!driversList) return;

    let allDrivers = [];

    const fetchDrivers = async () => {
        try {
            // Busca do Backend (que agora combina MongoDB e Supabase users_migrados)
            const backendUrl = window.location.origin.includes('localhost') 
                ? 'http://localhost:3000/api/users/motoristas' 
                : '/api/users/motoristas';

            const response = await fetch(backendUrl);
            if (!response.ok) throw new Error('Falha ao buscar motoristas no backend');
            
            const drivers = await response.json();
            return drivers || [];
        } catch (err) {
            console.error('Erro ao buscar motoristas:', err);
            return null;
        }
    };

    const renderDrivers = (drivers) => {
        if (!drivers || drivers.length === 0) {
            driversList.innerHTML = `
                <div class="flex flex-col items-center justify-center py-10 opacity-50">
                    <span class="material-symbols-outlined text-4xl">person_search</span>
                    <p class="text-sm mt-2">Nenhum motorista encontrado.</p>
                </div>
            `;
            return;
        }

        driversList.innerHTML = '';
        drivers.forEach(driver => {
            // Ajuste para lidar com os dois formatos (MongoDB e Supabase)
            const nome = driver.usuarios?.nome || driver.name || 'Motorista';
            const foto = driver.usuarios?.foto_perfil_url || driver.avatar;
            const avaliacao = driver.avaliacao_media || driver.avgRating || 5.0;
            const modelo = driver.modelo_veiculo || driver.vehicle || 'Veículo';
            const cor = driver.cor_veiculo || driver.carColor || 'Cor não inf.';
            const isOnline = driver.status === 'online' || driver.status_online === true;

            const initials = nome
                ? nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                : '??';

            const statusClass = isOnline
                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                : 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            const statusText = isOnline ? 'Disponível' : 'Ocupado';

            const card = document.createElement('div');
            card.className = `p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm transition-opacity ${!isOnline ? 'opacity-80' : ''}`;

            let avatarHtml;
            if (foto) {
                avatarHtml = `<img alt="${nome}" class="w-full h-full object-cover" src="${foto}" onerror="this.parentElement.innerHTML='<span class=\'text-xl font-bold\'>${initials}</span>'" />`;
            } else {
                avatarHtml = `<span class="text-xl font-bold">${initials}</span>`;
            }

            card.innerHTML = `
                <div class="flex items-center gap-4 mb-3">
                    <div class="size-14 rounded-full overflow-hidden bg-slate-300 dark:bg-slate-700 ring-2 ring-primary/20 flex items-center justify-center">
                        ${avatarHtml}
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <p class="font-bold text-lg">${nome}</p>
                            <span class="px-2 py-1 rounded-md ${statusClass} text-[10px] font-bold uppercase tracking-wider border">
                                ${statusText}
                            </span>
                        </div>
                        <div class="flex items-center gap-2 mt-1">
                            <div class="flex items-center gap-1 text-yellow-500">
                                <span class="material-symbols-outlined text-sm fill-1">star</span>
                                <span class="text-xs font-bold">${parseFloat(avaliacao).toFixed(1)}</span>
                            </div>
                            <span class="text-slate-400 text-[10px]">•</span>
                            <span class="text-slate-500 dark:text-slate-400 text-xs font-medium">Motorista Verificado</span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <span class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span class="material-symbols-outlined text-lg text-[#f97316]">local_taxi</span>
                        ${modelo} • ${cor}
                    </span>
                    <a href="loginPassageiro.html" class="text-[#f97316] text-sm font-bold flex items-center active-scale">
                        Chamar
                        <span class="material-symbols-outlined text-sm">chevron_right</span>
                    </a>
                </div>
            `;
            driversList.appendChild(card);
        });
    };

    // Initial load
    allDrivers = await fetchDrivers();
    renderDrivers(allDrivers);

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = allDrivers.filter(driver => {
                const nome = driver.usuarios?.nome || driver.name || '';
                return nome.toLowerCase().includes(searchTerm);
            });
            renderDrivers(filtered);
        });
    }
});
