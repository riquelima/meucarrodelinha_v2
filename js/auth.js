/**
 * js/auth.js
 * Centraliza as funções de autenticação do Supabase e do Backend Customizado
 */

// Função para exibir alertas ou status (pode ser customizada depois para modais mais bonitos)
function showMessage(message, type = 'info') {
    alert(message);
}

/**
 * Registra um novo passageiro
 */
async function signUpPassageiro(name, email, phone, password) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nome: name,
                    telefone: phone,
                    tipo_usuario: 'passageiro'
                }
            }
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro no cadastro:', error.message);
        showMessage('Erro ao criar conta: ' + error.message, 'error');
        return { success: false, error };
    }
}

/**
 * Registra um novo motorista e faz o upload da documentação
 */
async function signUpMotorista(nomeCompleto, email, password, cpf, telefone, modeloVeiculo, placaVeiculo, corVeiculo, fileCnh = null, fileDoc = null) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nome: nomeCompleto,
                    telefone: telefone,
                    tipo_usuario: 'motorista'
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            const userId = data.user.id;
            let urlCnh = null;
            let urlDoc = null;

            if (fileCnh) {
                const fileExt = fileCnh.name.split('.').pop();
                const filePath = `${userId}/cnh.${fileExt}`;
                const { error: uploadError } = await supabaseClient.storage.from('documentos_motoristas').upload(filePath, fileCnh);
                if (uploadError) console.error('Erro CNH:', uploadError);
                else urlCnh = supabaseClient.storage.from('documentos_motoristas').getPublicUrl(filePath).data.publicUrl;
            }

            if (fileDoc) {
                const fileExt = fileDoc.name.split('.').pop();
                const filePath = `${userId}/doc_veiculo.${fileExt}`;
                const { error: uploadError } = await supabaseClient.storage.from('documentos_motoristas').upload(filePath, fileDoc);
                if (uploadError) console.error('Erro DocVeiculo:', uploadError);
                else urlDoc = supabaseClient.storage.from('documentos_motoristas').getPublicUrl(filePath).data.publicUrl;
            }

            const { error: dbError } = await supabaseClient
                .from('motoristas')
                .insert([
                    {
                        usuario_id: userId,
                        cpf: cpf,
                        modelo_veiculo: modeloVeiculo,
                        placa_veiculo: placaVeiculo,
                        cor_veiculo: corVeiculo,
                        url_cnh: urlCnh,
                        url_doc_veiculo: urlDoc,
                        status_aprovacao: 'aprovado',
                        status_online: false
                    }
                ]);

            if (dbError) throw dbError;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Erro no cadastro do motorista:', error.message);
        showMessage('Erro ao cadastrar motorista: ' + error.message, 'error');
        return { success: false, error };
    }
}

/**
 * Login Genérico (Supabase + Backend Migrados)
 */
async function signIn(email, password) {
    try {
        // 1. Tenta login direto no Supabase Auth (para novos usuários)
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (!error) {
            localStorage.removeItem('mcl_custom_session'); // Limpa sessão customizada se logou via Supabase
            return { success: true, data };
        }

        // 2. Se falhar, tenta a Edge Function (para usuários migrados com BCrypt)
        console.log('Tentando login via Edge Function para:', email);
        const edgeUrl = 'https://gnhsfrwixhhcdsbyyqhg.supabase.co/functions/v1/auth-migrado';
        try {
            const res = await fetch(edgeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.migrado) {
                    localStorage.setItem('mcl_migrado', JSON.stringify(data.user));
                    localStorage.setItem('mcl_custom_session', JSON.stringify({ user: data.user }));
                    return { success: true, data: { user: data.user, session: { user: data.user } } };
                }
            } else {
                const text = await res.text();
                console.warn('Edge function retornou', res.status, text.substring(0, 100));
            }
        } catch (e) {
            console.warn('Edge function nao disponivel:', e.message || e);
        }

        throw new Error('Email ou senha incorretos.');

    } catch (error) {
        console.error('Erro no login:', error.message);
        showMessage(error.message, 'error');
        return { success: false, error };
    }
}

/**
 * Efetua o Logoff
 */
async function signOut() {
    try {
        if (window.supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        localStorage.removeItem('mcl_custom_session');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erro ao deslogar:', error.message);
    }
}

/**
 * Pega o usuário atual (Supabase ou Custom)
 */
async function getCurrentUser() {
    // 1. Tenta Supabase
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) return session.user;

    // 2. Tenta Custom Session
    const custom = localStorage.getItem('mcl_custom_session');
    if (custom) {
        const parsed = JSON.parse(custom);
        return parsed.user;
    }

    return null;
}
