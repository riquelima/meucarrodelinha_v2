/**
 * js/auth.js
 * Centraliza as funções de autenticação do Supabase
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
                    // Você pode adicionar mais dados no meta se quiser, ou deixar pro DB
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            const userId = data.user.id;
            let urlCnh = null;
            let urlDoc = null;

            // Faz o upload dos arquivos para o storage, se fornecidos
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

            // Insere os detalhes adicionais na tabela de motoristas
            // Importante: RLS deve permitir isso para usar nesse contexto
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
 * Login Genérico (usado tanto por passageiro quanto motorista)
 */
async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro no login:', error.message);
        showMessage('Credenciais inválidas: ' + error.message, 'error');
        return { success: false, error };
    }
}

/**
 * Efetua o Logoff
 */
async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html'; // Volta pra tela inicial ou splash
    } catch (error) {
        console.error('Erro ao deslogar:', error.message);
    }
}

/**
 * Pega a sessão atual síncrona se disponível ou chama pra pegar
 */
async function getCurrentUser() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session ? session.user : null;
}
