window.requestLocationPermission = function () {
    return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        if (localStorage.getItem('locationModalAccepted') === 'true') {
            resolve();
            return;
        }

        if (sessionStorage.getItem('locationModalDismissed') === 'true') {
            reject(new Error('User dismissed the location modal in this session'));
            return;
        }

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
                if (result.state === 'granted') {
                    localStorage.setItem('locationModalAccepted', 'true');
                    resolve();
                } else if (result.state === 'denied') {
                    reject(new Error('Permission denied'));
                } else {
                    showModal(resolve, reject);
                }
            }).catch(() => {
                showModal(resolve, reject);
            });
        } else {
            showModal(resolve, reject);
        }
    });

    function showModal(resolve, reject) {
        if (document.getElementById('elegant-location-modal')) {
            return;
        }

        const modalHtml = `
            <div id="elegant-location-modal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm opacity-0 transition-opacity duration-300">
                <div class="bg-white dark:bg-[#1c2131] w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden transform scale-95 transition-transform duration-300 border border-white/10">
                    <div class="p-8 flex flex-col items-center text-center relative overflow-hidden">
                        <!-- Decorative glow -->
                        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 rounded-full blur-[40px] pointer-events-none"></div>
                        
                        <!-- Icon container -->
                        <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 relative group">
                            <div class="absolute inset-0 bg-primary/20 rounded-2xl animate-ping opacity-50"></div>
                            <span class="material-symbols-outlined text-primary text-3xl z-10" style="font-variation-settings: 'FILL' 1;">location_on</span>
                        </div>
                        
                        <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Onde você está?</h2>
                        <p class="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Precisamos da sua localização para encontrar motoristas e estimar distâncias com precisão.
                        </p>
                        
                        <div class="flex flex-col w-full gap-3">
                            <button id="btn-allow-loc" class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2">
                                Ativar Localização
                            </button>
                            <button id="btn-deny-loc" class="w-full bg-slate-100 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold py-3.5 rounded-xl transition-all active:scale-95">
                                Agora não
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalOverlay = document.getElementById('elegant-location-modal');
        const modalContent = modalOverlay.querySelector('div.transform');

        // Trigger entrance animations
        requestAnimationFrame(() => {
            modalOverlay.classList.remove('opacity-0');
            modalContent.classList.remove('scale-95');
            modalContent.classList.add('scale-100');
        });

        const closeModal = () => {
            modalOverlay.classList.add('opacity-0');
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
            setTimeout(() => {
                modalOverlay.remove();
            }, 300);
        };

        document.getElementById('btn-allow-loc').addEventListener('click', () => {
            localStorage.setItem('locationModalAccepted', 'true');
            closeModal();
            resolve();
        });

        document.getElementById('btn-deny-loc').addEventListener('click', () => {
            sessionStorage.setItem('locationModalDismissed', 'true');
            closeModal();
            reject(new Error('User dismissed the location modal'));
        });
    }
};
