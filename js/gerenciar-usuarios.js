// js/gerenciar-usuarios.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. State Management
    const state = {
        motorista: {
            page: 1,
            itemsPerPage: 10,
            hasMore: true,
            totalCount: 0,
            data: [],
            searchQuery: ''
        },
        passageiro: {
            page: 1,
            itemsPerPage: 10,
            hasMore: true,
            totalCount: 0,
            data: [],
            searchQuery: ''
        },
        currentTab: 'motorista' // 'motorista' or 'passageiro'
    };

    // 2. DOM Elements
    const elements = {
        tabMotoristas: document.getElementById('tab-motoristas'),
        tabPassageiros: document.getElementById('tab-passageiros'),
        listDrivers: document.getElementById('drivers-list'),
        listPassengers: document.getElementById('passengers-list'),
        searchInput: document.querySelector('input[placeholder="Pesquisar motoristas em Salinas..."]'),
        loadMoreBtn: document.querySelector('button.mt-4.text-primary.font-bold'),
        paginationText: document.querySelector('.py-6.text-center.pb-24 p.text-slate-500'),

        // Modal Edit Defaults (Need to be updated in HTML)
        editModal: document.getElementById('edit-user-modal'),
        editModalTitle: document.querySelector('#edit-user-modal h2'),
        editNameInput: document.getElementById('nome'),
        editEmailInput: document.getElementById('email'),
        editPhoneInput: document.getElementById('telefone'),
        saveUserBtn: document.querySelector('#edit-user-modal button[onclick="saveUser()"]')
    };

    // 3. Tab Switching Logic
    function switchTab(isMotorista) {
        state.currentTab = isMotorista ? 'motorista' : 'passageiro';

        // Update styling
        if (isMotorista) {
            elements.tabMotoristas.classList.add('border-primary', 'text-primary');
            elements.tabMotoristas.classList.remove('border-transparent', 'text-slate-500', 'dark:text-slate-400');
            elements.tabPassageiros.classList.remove('border-primary', 'text-primary');
            elements.tabPassageiros.classList.add('border-transparent', 'text-slate-500', 'dark:text-slate-400');

            elements.listDrivers.classList.remove('hidden');
            elements.listPassengers.classList.add('hidden');
            elements.searchInput.placeholder = "Pesquisar motoristas em Salinas...";
        } else {
            elements.tabPassageiros.classList.add('border-primary', 'text-primary');
            elements.tabPassageiros.classList.remove('border-transparent', 'text-slate-500', 'dark:text-slate-400');
            elements.tabMotoristas.classList.remove('border-primary', 'text-primary');
            elements.tabMotoristas.classList.add('border-transparent', 'text-slate-500', 'dark:text-slate-400');

            elements.listPassengers.classList.remove('hidden');
            elements.listDrivers.classList.add('hidden');
            elements.searchInput.placeholder = "Pesquisar passageiros em Salinas...";
        }

        // Restore search query to input if switching back
        elements.searchInput.value = state[state.currentTab].searchQuery;

        // Fetch data if empty for this tab
        if (state[state.currentTab].data.length === 0) {
            fetchUsers(state.currentTab, true);
        } else {
            renderList(state.currentTab);
        }
    }

    elements.tabMotoristas.addEventListener('click', () => switchTab(true));
    elements.tabPassageiros.addEventListener('click', () => switchTab(false));

    // 4. Fetch Users Logic
    async function fetchUsers(tipoUsuario, resetPage = false) {
        if (!window.supabaseClient) {
            console.error('Supabase client não encontrado!');
            return;
        }

        const tabState = state[tipoUsuario];

        if (resetPage) {
            tabState.page = 1;
            tabState.data = [];
            tabState.hasMore = true;
            if (tipoUsuario === 'motorista') {
                elements.listDrivers.innerHTML = '<div class="text-center py-4"><span class="material-symbols-outlined animate-spin text-primary">sync</span> Carregando...</div>';
            } else {
                elements.listPassengers.innerHTML = '<div class="text-center py-4"><span class="material-symbols-outlined animate-spin text-primary">sync</span> Carregando...</div>';
            }
        }

        if (!tabState.hasMore && !resetPage) return;

        const fromIndex = (tabState.page - 1) * tabState.itemsPerPage;
        const toIndex = fromIndex + tabState.itemsPerPage - 1;

        try {
            // Loading state for button
            const originalBtnText = elements.loadMoreBtn.innerText;
            elements.loadMoreBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span> Carregando...';
            elements.loadMoreBtn.disabled = true;

            let query = window.supabaseClient
                .from('usuarios')
                .select('*', { count: 'exact' })
                .eq('tipo_usuario', tipoUsuario)
                .order('criado_em', { ascending: false })
                .range(fromIndex, toIndex);

            if (tabState.searchQuery) {
                query = query.ilike('nome', `%${tabState.searchQuery}%`);
            }

            const { data, error, count } = await query;

            if (error) throw error;

            tabState.totalCount = count || 0;

            if (data && data.length > 0) {
                tabState.data = resetPage ? data : [...tabState.data, ...data];
                tabState.hasMore = tabState.data.length < count;
                tabState.page++;
            } else {
                tabState.hasMore = false;
                if (resetPage) tabState.data = []; // ensure empty
            }

            renderList(tipoUsuario);

        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            alert('Erro ao carregar a lista de usuários.');
        } finally {
            // Reset button state
            elements.loadMoreBtn.innerText = 'Carregar mais';
            elements.loadMoreBtn.disabled = false;
        }
    }

    // 5. Render Logic
    function renderList(tipoUsuario) {
        const tabState = state[tipoUsuario];
        const container = tipoUsuario === 'motorista' ? elements.listDrivers : elements.listPassengers;
        const noun = tipoUsuario === 'motorista' ? 'motoristas' : 'passageiros';

        container.innerHTML = ''; // clear current

        if (tabState.data.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 py-8">Nenhum ${tipoUsuario} encontrado.</div>`;
        } else {
            tabState.data.forEach(user => {
                container.appendChild(createUserCard(user));
            });
        }

        // Update Pagination Info
        elements.paginationText.innerText = `Exibindo ${tabState.data.length} de ${tabState.totalCount} ${noun} ${tabState.searchQuery ? 'encontrados' : 'cadastrados'}`;

        // Show/Hide Load More Button
        if (tabState.hasMore) {
            elements.loadMoreBtn.classList.remove('hidden');
        } else {
            elements.loadMoreBtn.classList.add('hidden');
        }
    }

    // Default Avatar Image
    const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random&color=fff&name=';

    function createUserCard(user) {
        const div = document.createElement('div');
        div.className = "flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm";

        // Use user's profile image or a default one
        const userImg = user.foto_perfil_url || (DEFAULT_AVATAR + encodeURIComponent(user.nome || '?'));
        // Basic active status (customize if there is an active/blocked flag in your DB)
        const isActive = true; // Placeholder: all active for now

        div.innerHTML = `
            <div class="relative shrink-0">
                <div class="bg-slate-300 dark:bg-slate-700 aspect-square bg-cover bg-center rounded-full h-14 w-14 ring-2 ring-primary/10" style="background-image: url('${userImg}');"></div>
                ${isActive ? '<div class="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>' : ''}
            </div>
            <div class="flex flex-col flex-1 min-w-0">
                <p class="text-slate-900 dark:text-slate-100 text-base font-bold leading-none mb-1 truncate">${escapeHTML(user.nome || 'Sem Nome')}</p>
                <div class="flex items-center gap-1.5">
                    ${isActive ?
                '<span class="material-symbols-outlined text-green-500 text-xs fill-1">check_circle</span><p class="text-green-500 text-xs font-bold uppercase tracking-wider">Ativo</p>' :
                '<span class="material-symbols-outlined text-red-500 text-xs fill-1">block</span><p class="text-red-500 text-xs font-bold uppercase tracking-wider">Bloqueado</p>'}
                </div>
            </div>
            <div class="shrink-0">
                <div class="flex gap-1">
                    <button class="edit-btn flex items-center justify-center rounded-full size-10 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-95" 
                        data-id="${user.id}" data-nome="${escapeHTML(user.nome || '')}" data-email="${escapeHTML(user.email || '')}" data-telefone="${escapeHTML(user.telefone || '')}">
                        <span class="material-symbols-outlined pointer-events-none">edit</span>
                    </button>
                    <button class="delete-btn flex items-center justify-center rounded-full size-10 text-red-500 hover:bg-red-500/10 transition-colors active:scale-95"
                        data-id="${user.id}" data-nome="${escapeHTML(user.nome || '')}">
                        <span class="material-symbols-outlined pointer-events-none">delete</span>
                    </button>
                </div>
            </div>
        `;

        // Attach event listeners to the new buttons
        const editBtn = div.querySelector('.edit-btn');
        editBtn.addEventListener('click', handleEditClick);

        const deleteBtn = div.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', handleDeleteClick);

        return div;
    }

    // Helper to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g,
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // 6. Search Logic
    let searchTimeout;
    elements.searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const tab = state.currentTab;

        state[tab].searchQuery = query;

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            fetchUsers(tab, true); // Reset page on new search
        }, 500); // 500ms debounce
    });

    // 7. Load More Logic
    elements.loadMoreBtn.addEventListener('click', () => {
        fetchUsers(state.currentTab);
    });

    // 8. Edit Logic
    let currentEditingUserId = null;

    function handleEditClick(e) {
        const btn = e.currentTarget;
        currentEditingUserId = btn.dataset.id;

        elements.editNameInput.value = btn.dataset.nome;
        elements.editEmailInput.value = btn.dataset.email;
        elements.editPhoneInput.value = btn.dataset.telefone;
        elements.editModalTitle.innerText = `Editar ${state.currentTab === 'motorista' ? 'Motorista' : 'Passageiro'}`;

        openModal();
    }

    // Replacing the window.saveUser from inline script
    window.saveUser = async function () {
        if (!currentEditingUserId) return;

        const novoNome = elements.editNameInput.value.trim();
        const novoEmail = elements.editEmailInput.value.trim();
        const novoTelefone = elements.editPhoneInput.value.trim();

        if (!novoNome || !novoEmail) {
            alert('Nome e E-mail são obrigatórios.');
            return;
        }

        try {
            // Update UI to loading
            const btnText = elements.saveUserBtn.innerText;
            elements.saveUserBtn.innerHTML = '<span class="material-symbols-outlined animate-spin align-middle mr-2">sync</span> Salvando';
            elements.saveUserBtn.disabled = true;

            const { error } = await window.supabaseClient
                .from('usuarios')
                .update({
                    nome: novoNome,
                    email: novoEmail,
                    telefone: novoTelefone
                })
                .eq('id', currentEditingUserId);

            if (error) throw error;

            // Success! Close modal and refresh current data logic
            closeModal();

            // To be efficient, we could update the item in the local state instead of re-fetching everything
            const tabState = state[state.currentTab];
            const itemIndex = tabState.data.findIndex(u => u.id === currentEditingUserId);
            if (itemIndex > -1) {
                tabState.data[itemIndex] = { ...tabState.data[itemIndex], nome: novoNome, email: novoEmail, telefone: novoTelefone };
                renderList(state.currentTab); // Re-render the list from state
            } else {
                // Fallback fetch
                fetchUsers(state.currentTab, true);
            }

        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            alert('Não foi possível salvar as alterações: ' + error.message);
        } finally {
            elements.saveUserBtn.innerText = 'Salvar Alterações';
            elements.saveUserBtn.disabled = false;
        }
    };

    // 9. Delete Logic
    async function handleDeleteClick(e) {
        const btn = e.currentTarget;
        const userId = btn.dataset.id;
        const userName = btn.dataset.nome;

        if (confirm(`Atenção: Tem certeza que deseja excluir o usuário "${userName}"? Esta ação removerá os dados deste usuário do sistema.`)) {
            try {
                // Show loading on the button
                const btnInner = btn.innerHTML;
                btn.innerHTML = '<span class="material-symbols-outlined animate-spin pointer-events-none">sync</span>';
                btn.disabled = true;

                const { error } = await window.supabaseClient
                    .from('usuarios')
                    .delete()
                    .eq('id', userId);

                if (error) throw error;

                // Refresh list on success
                fetchUsers(state.currentTab, true);

            } catch (error) {
                console.error("Erro ao excluir usuário", error);

                // Tratar erro RLS comum se não for Admin com permissão
                if (error.code === '42501' || error.message.includes('RLS')) {
                    alert(`Erro de Permissão: Você não tem permissões suficientes no banco de dados para excluir usuários.
Requer configuração de políticas (RLS) no Supabase para permitir DELETE na tabela usuarios por Admins.`);
                } else {
                    alert('Erro ao excluir usuário: ' + error.message);
                }

                btn.innerHTML = btnInner; // Reset button if failed
                btn.disabled = false;
            }
        }
    }


    // Make modal functions accessible globally like the old inline script
    window.openModal = function () {
        const modal = elements.editModal;
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
            modal.querySelector('div').classList.add('scale-100');
        }, 10);
    };

    window.closeModal = function () {
        const modal = elements.editModal;
        modal.classList.add('opacity-0');
        modal.querySelector('div').classList.remove('scale-100');
        modal.querySelector('div').classList.add('scale-95');

        currentEditingUserId = null; // Clear context

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    };

    // Close modal when clicking outside
    elements.editModal.addEventListener('click', function (event) {
        if (event.target === this) {
            window.closeModal();
        }
    });

    // 10. Initial Load
    // Carrega a aba padrão (Motoristas)
    fetchUsers('motorista', true);
});
