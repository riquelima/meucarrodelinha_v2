
document.addEventListener('DOMContentLoaded', async () => {
    const supabaseClient = window.supabaseClient;
    // 1. Check Authentication
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        window.location.href = 'loginMotorista.html';
        return;
    }

    // 2. Fetch Driver Data
    const { data: profile, error } = await supabaseClient
        .from('usuarios')
        .select('nome, foto_perfil_url')
        .eq('id', user.id)
        .single();

    if (profile) {
        // Show Full Name
        document.getElementById('profile-name').textContent = profile.nome;

        // Update Avatar
        if (profile.foto_perfil_url) {
            document.getElementById('profile-avatar').src = profile.foto_perfil_url;
        } else {
            // Check if this is a first-time login (no photo)
            initiateMandatoryPhotoUpload();
        }
    }

    // 3. Photo Upload Logic
    const editBtn = document.getElementById('edit-photo-btn');
    const fileInput = document.getElementById('photo-upload-input');
    const avatarImg = document.getElementById('profile-avatar');

    editBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Visual feedback immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            avatarImg.src = e.target.result;
            // Remove pulse animation if it was active
            const avatarContainer = avatarImg.parentElement;
            avatarContainer.classList.remove('animate-pulse-ring', 'border-red-500', 'border-4');
            avatarContainer.classList.add('border-primary/20');
        };
        reader.readAsDataURL(file);

        // Upload to Supabase Storage
        try {
            editBtn.disabled = true;
            editBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-sm">sync</span>';

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`; // Use timestamp for uniqueness
            const filePath = fileName; // Upload to root of bucket to avoid path complexity

            // 1. Upload
            const { error: uploadError } = await supabaseClient.storage
                .from('avatars') // Ensure this bucket exists in Supabase
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabaseClient.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update User Profile
            const { error: updateError } = await supabaseClient
                .from('usuarios')
                .update({ foto_perfil_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            // Success feedback
            // Unlock app navigation if it was locked
            unlockApp();

            // Show toast or alert (optional)
            console.log('Foto atualizada com sucesso!');

        } catch (error) {
            console.error('Erro ao atualizar foto:', error);
            alert('Erro ao enviar foto. Tente novamente.');
        } finally {
            editBtn.disabled = false;
            editBtn.innerHTML = '<span class="material-symbols-outlined text-sm">edit</span>';
        }
    });

    function initiateMandatoryPhotoUpload() {
        // Visual cue: Pulse animation on avatar
        const avatarContainer = document.getElementById('profile-avatar').parentElement;
        avatarContainer.classList.remove('border-primary/20');
        avatarContainer.classList.add('radar-pulse-indicator', 'border-primary', 'border-4');

        // Exibe o overlay de bloqueio
        const overlay = document.getElementById('photo-mandatory-overlay');
        if (overlay) overlay.classList.remove('hidden');

        // Lock navigation (Simple implementation: disable links)
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.style.pointerEvents = 'none';
            link.style.opacity = '0.5';
        });

        // Bloqueia scroll do body
        document.body.style.overflow = 'hidden';
    }

    function unlockApp() {
        // Restore navigation
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.style.pointerEvents = 'auto';
            link.style.opacity = '1';
        });

        // Remove pulse animation
        const avatarContainer = document.getElementById('profile-avatar').parentElement;
        avatarContainer.classList.remove('radar-pulse-indicator', 'border-primary', 'border-4');
        avatarContainer.classList.add('border-primary/20');

        // Escurece o overlay e remove
        const overlay = document.getElementById('photo-mandatory-overlay');
        if (overlay) overlay.classList.add('hidden');

        // Restaura scroll do body
        document.body.style.overflow = 'auto';
    }
});
