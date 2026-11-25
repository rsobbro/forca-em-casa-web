# Força em Casa — Login Google e sincronização privada (proposta V1.5)

Esta funcionalidade é preparada em branch separada até haver um OAuth Client ID
próprio da aplicação. **Nenhum histórico nem foto será enviado automaticamente
antes de o usuário autorizar o acesso no navegador.**

## Arquitetura

- Site estático: GitHub Pages, HTTPS.
- Autorização: Google Identity Services (GIS), token model, apenas em memória.
- Permissão: `https://www.googleapis.com/auth/drive.file`; não solicitar `drive` completo.
- Identidade: Drive API `about.get`, para identificar o titular.
- Armazenamento: Drive pessoal do **usuário que autorizou**, não o Drive do
  proprietário do repositório nem a conexão do ChatGPT.
- Arquivos privados: os dados e fotos não entram no GitHub.

## Pastas criadas automaticamente após autorização
```text
Meu Drive/
  Força em Casa/
    Dados/
      historico.json                # perfil, treinos, atividades, avaliações
    Fotos/
      <id_da_avaliacao>__front.jpg
      <id_da_avaliacao>__back.jpg
      <id_da_avaliacao>__side.jpg
```
O aplicativo cria as pastas no Drive da conta Google conectada. Não crie essas
pastas pelo conector de outro aplicativo: `drive.file` só vê os arquivos que
o OAuth deste aplicativo criou/que lhe foram explicitamente disponibilizados.

## Configuração indispensável do proprietário
1. Abra https://console.cloud.google.com/ e crie/selecione um projeto.
2. Ative **Google Drive API** em APIs e Serviços.
3. Configure **Google Auth Platform / OAuth consent screen**, nome Força em
   Casa, usuários de teste e a política de privacidade adequada.
4. Crie credencial **OAuth 2.0 Client ID → Aplicativo da Web**.
5. Authorized JavaScript origins: `https://rsobbro.github.io`
   (sem path `/forca-em-casa-web`).
6. Copie somente o **Client ID público** terminado em
   `.apps.googleusercontent.com` para `google-config.js`. Nunca adicione
   client secret ao repositório.
7. Publique só depois de testar login, conta incorreta, permissões, fotos,
   dados antigos, offline, conflitos de edição e reconexão.
8. Para oferecer login a usuários externos, ajuste o público/estado de
   publicação do consentimento OAuth. Enquanto em modo Testing, apenas
   usuários de teste autorizados poderão conectar.

## Segurança operacional

- Nunca envie fotos ou medidas para GitHub Issues, Actions ou logs.
- Nunca armazene tokens OAuth em localStorage, IndexedDB ou cookies do site.
- Contas Google diferentes não devem compartilhar dados locais: a aplicação
  deve vincular o cache local ao ID autorizado, ou exigir migração explícita.
- A primeira importação de histórico local requer consentimento explícito
  do titular para evitar enviar dados de outra pessoa.
- Detecção de conflitos antes de sobrescrever: mesmo ID com conteúdo divergente
  requer resolução; não faça substituição silenciosa.
- Falha de upload NÃO significa que os dados estão salvos na nuvem.
- O token do navegador é temporário e não permite sincronização em background
  depois do logout/expiração. Para sync 24x7 e sessões persistentes, será
  necessário backend (BFF) com autorização code flow e PKCE e controles
  adicionais.
- Quotas e espaço são os da conta Google de cada usuário.
- Recomenda-se exportação JSON local periódica independente da sincronização.

Documentação oficial:
- https://developers.google.com/identity/oauth2/web/guides/use-token-model
- https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- https://developers.google.com/workspace/drive/api/guides/create-file
- https://developers.google.com/workspace/drive/api/guides/manage-uploads

## V1.6 beta — cadastro e login obrigatórios

1. A página inicial **não importa `app.js`** até o usuário autenticar a conta
   Google e o cadastro ser confirmado no Drive; `gate.js` controla o acesso.
2. O OAuth solicita `openid email profile` e `drive.file`. A identidade é
   confirmada por `GET https://www.googleapis.com/oauth2/v3/userinfo`
   com `email_verified=true`, identificador `sub` e email, e cruzada com
   `Drive about.get` para a mesma conta.
3. O cadastro exige nome completo, data de nascimento (idade calculada),
   sexo ou opção de não informar, Gmail autenticado, e aceite explícito para
   armazenamento de dados pessoais. A beta é destinada a maiores de 18 anos.
4. Cadastro salvo em `Dados/perfil.json` **antes de liberar a interface**.
   Login seguinte encontra esse perfil no Drive, valida o proprietário e
   carrega o histórico. Nenhuma senha é solicitada pelo site.
5. O cache local usa chave por `sub` do Google; um cache da versão anterior
   só é importado após confirmação explícita de que pertence à pessoa logada.
6. Logout limpa a sessão OAuth em memória e recarrega a tela de login. Tokens
   OAuth nunca são salvos em localStorage.
7. Sem Client ID público configurado, o acesso beta fica bloqueado, em vez
   de liberar uma versão sem autenticação.

**Limitação de segurança importante:** GitHub Pages é um site estático. Este
portão de acesso é uma proteção da interface, **não** substitui uma sessão
autenticada no servidor nem impede que alguém com acesso físico ao navegador
inspecione o cache local não criptografado. Os arquivos privados do Drive
são protegidos pelas permissões OAuth do Google. Para controle de acesso robusto
e persistente, migrar posteriormente para um backend/BFF com verificação de
ID tokens, sessões seguras, criptografia do cache e regras de autorização.

## V1.7 beta — autorização incremental no momento do primeiro salvamento

- Login Gmail solicita apenas `openid email profile`. Nenhuma permissão de arquivos é pedida nesse momento.
- Cadastro com nome, nascimento, sexo e Gmail verificado é salvo inicialmente no cache local da conta.
- O sistema informa que dados de avaliação e fotos dependerão de autorização separada para salvamento em nuvem.
- Ao salvar avaliação, os dados são primeiro preservados localmente, com status **Pendente no Drive**.
- Uma ação explícita **Autorizar Google Drive e salvar** inicia o popup Google OAuth para `drive.file`, vinculado à mesma identidade Gmail.
- Depois do consentimento, o aplicativo cria as pastas privadas, guarda `perfil.json`, `historico.json` e fotografias. Mostra sucesso somente após confirmação de upload da API.
- Se o usuário recusar permissão, fechar a janela, ou estiver offline, não perde as medidas: continuam somente neste dispositivo, aguardando autorização.
- A recuperação de dados em outro navegador requer ação distinta **Recuperar do meu Google Drive**, com autorização explícita.
- Nenhum token ou senha é guardado no armazenamento persistente.

**Antes de publicar:** configurar OAuth Client ID real do Google Cloud, testar login/consentimento/recusa/recuperação e avaliar backend para autenticação e autorização robustas. Este código continua isolado da versão pública na branch beta.

## V1.7.3 Beta — histórico portátil entre dispositivos

- No **computador**, primeiro entrar no mesmo Gmail, autorizar o Google Drive
  e confirmar que os registros chegaram a `Força em Casa/Dados/historico.json`.
  A ficha marcada apenas como salva localmente não pode aparecer no telefone.
- No **celular**, entrar com o mesmo Gmail e selecionar **Recuperar meu
  histórico do Google Drive**. Se já existe um cadastro local, usar o botão
  **Recuperar do Google Drive** no Painel, na Evolução ou nas Configurações.
- A recuperação usa apenas leitura: procura as pastas existentes e não cria
  nenhuma pasta, `perfil.json` ou `historico.json` no Drive do telefone.
- Dados do PC e do celular são mesclados por ID; diferenças conflitantes
  interrompem a operação sem apagar ou sobrescrever o conteúdo local.
- Fotos do histórico da conta são baixadas por avaliação; falha em uma
  fotografia não impede a leitura dos registros corporais.
- Modificações posteriores no aparelho são marcadas como **pendentes de envio**.
  O upload é automático apenas enquanto a sessão do Drive está conectada;
  também há ação explícita **Enviar alterações ao Drive**.
- O app registra a data do último upload **confirmado** localmente. A leitura
  remota bem-sucedida não é apresentada como upload.
- A integração opera sob OAuth com token temporário em memória; após fechar o
  navegador, pode ser necessário reautorizar. Isso não altera os dados que
  já foram realmente enviados ao Google Drive.
- O aplicativo continua em homologação: testes automatizados não substituem
  a validação real de upload no computador e recuperação no celular.
