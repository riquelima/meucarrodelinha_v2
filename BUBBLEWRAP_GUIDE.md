# Guia Completo: Transformando seu PWA em App Android (TWA) com Bubblewrap

O **Bubblewrap** é uma ferramenta oficial do Google que "embrulha" seu PWA em um aplicativo Android nativo (APK/AAB) para ser publicado na Google Play Store.

## 1. Pré-requisitos

Certifique-se de que você tem o **Node.js** instalado (versão 14 ou superior).
O Bubblewrap irá instalar automaticamente o **Java (JDK)** e o **Android SDK** necessários na primeira execução.

## 2. Instalação

Abra seu terminal (PowerShell ou CMD) e instale a ferramenta globalmente:

```bash
npm install -g @bubblewrap/cli
```

## 3. Inicialização do Projeto Android

Crie uma nova pasta para o projeto Android (para não misturar com o código do site) e inicie o processo:

1.  Crie a pasta:
    ```bash
    mkdir android-app
    cd android-app
    ```

2.  Inicie a configuração (use a URL pública do seu site):
    ```bash
    bubblewrap init --manifest https://meucarrodelinhasalinas.vercel.app/manifest.json
    ```

    > **Nota:** O Bubblewrap fará algumas perguntas. Responda conforme abaixo:

    *   **Domain:** `meucarrodelinhasalinas.vercel.app` (Deve ser detectado automaticamente)
    *   **Application name:** `Meu Carro de Linha Salinas`
    *   **Short name:** `Carro de Linha`
    *   **Application ID (Package Name):** `com.meucarrosalinas.twa` (Importante: use exatamente este ID para bater com seu arquivo `assetlinks.json`)
    *   **Display mode:** `standalone`
    *   **Status bar color:** `#1e3fae` (ou a cor de sua preferência)
    *   **Splash screen color:** `#121520`
    *   **Icon:** O Bubblewrap baixará os ícones do seu manifesto. Confirme se estão corretos.
    *   **Maskable Icon:** Responda `Yes` se ele perguntar se o ícone é "maskable" (seu manifesto diz que sim).
    *   **Signing Key (Chave de Assinatura):**
        *   Na primeira vez, ele perguntará se você tem uma Keystore. Responda **No** para ele criar uma nova.
        *   **Guarde bem as senhas** que você criar aqui (Key Store Password e Key Password). Você precisará delas para atualizar o app no futuro.
        *   **NÃO PERCA O ARQUIVO `android.keystore`** gerado. Sem ele, você não consegue atualizar o app na Play Store.

## 4. Construindo o App (Build)

Após a configuração, execute o comando para gerar os arquivos de instalação:

```bash
bubblewrap build
```

Este comando irá gerar dois arquivos principais na pasta:
1.  `app-release-bundle.aab`: Este é o arquivo que você deve enviar para a **Google Play Store**.
2.  `app-release-signed.apk`: Este arquivo serve para você testar diretamente no seu celular (instalação manual).

## 5. Validação do Vínculo Digital (Asset Links)

Para que a barra de endereço do navegador suma e o app pareça 100% nativo, você precisa atualizar o arquivo `assetlinks.json` no seu site.

1.  Ao final do `bubblewrap build`, ele mostrará no terminal os **SHA-256 Fingerprints**.
2.  Copie o código SHA-256 (algo como `FA:C6:17:45:...`).
3.  Abra o arquivo `.well-known/assetlinks.json` no seu projeto web.
4.  Substitua o trecho `"00:00:..."` pelo seu código real.
5.  Faça o deploy do seu site novamente (`vercel --prod` ou similar).

## 6. Publicação na Play Store

1.  Crie uma conta de desenvolvedor na [Google Play Console](https://play.google.com/console).
2.  Crie um novo app.
3.  Em "Versões", faça o upload do arquivo `app-release-bundle.aab`.
4.  Preencha as informações da loja (descrição, screenshots, etc).
5.  Envie para revisão!

---

**Dica Extra:** Sempre que atualizar o código do seu site (HTML/JS/CSS), o app Android é atualizado automaticamente para os usuários, pois ele carrega o conteúdo da web. Você só precisa gerar um novo `.aab` se mudar configurações nativas (ícone, nome do app, cores de abertura).
