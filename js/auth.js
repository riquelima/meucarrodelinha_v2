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
        const { data, error } = await supabase.auth.signUp({
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
 * Registra um novo motorista (O trigger se encarregará de criar a entrada inicial na public.usuarios, mas precisamos criar os dados extras na public.motoristas depois ou via trigger)
 */
async function signUpMotorista(nomeCompleto, email, password, cpf, telefone, modeloVeiculo, placaVeiculo) {
    try {
        const { data, error } = await supabase.auth.signUp({
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

        // Insere os detalhes adicionais na tabela de motoristas
        // Importante: RLS deve permitir isso para usar nesse contexto
        if (data.user) {
            const { error: dbError } = await supabase
                .from('motoristas')
                .insert([
                    {
                        usuario_id: data.user.id,
                        cpf: cpf,
                        modelo_veiculo: modeloVeiculo,
                        placa_veiculo: placaVeiculo,
                        status_aprovacao: 'pendente',
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
        const { data, error } = await supabase.auth.signInWithPassword({
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
        const { error } = await supabase.auth.signOut();
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
    const { data: { session } } = await supabase.auth.getSession();
    return session ? session.user : null;
}
