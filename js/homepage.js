
document.addEventListener('DOMContentLoaded', async () => {
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
        // Render drivers
        drivers.forEach(driver => {
            driversContainer.appendChild(createDriverCard(driver));
        });

    } catch (err) {
        console.error('Unexpected error:', err);
    }
});
