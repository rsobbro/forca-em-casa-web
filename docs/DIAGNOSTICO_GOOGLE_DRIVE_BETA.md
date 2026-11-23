# Força em Casa — Diagnóstico de sincronização Google Drive (V1.7 Beta)

## Estado da implantação
- Site principal: https://rsobbro.github.io/forca-em-casa-web/
- Homologação: https://rsobbro.github.io/forca-em-casa-web/beta/
- Código da beta: branch `feature/google-drive-sync`; ainda não promover para produção sem teste real.
- O formulário de avaliação permanece no navegador; só considerar salvo no Drive quando houver confirmação.
- Não apagar armazenamento local, IndexedDB, cookies do site ou cache de dados antes de backup completo.

## Sequência de validação com uma conta de testes
1. No Google Cloud (mesmo projeto que gerou o Client ID), confirmar **Google Drive API ativada**.
2. Google Auth Platform > Audience > Test users: incluir o Gmail de teste, mantendo o app em Testing.
3. Clients > Web application > Authorized JavaScript origins: `https://rsobbro.github.io`.
4. Acessar /beta/ no **mesmo navegador** e fazer login Google.
5. Criar/consultar perfil local; cadastrar uma avaliação fictícia, sem fotografias.
6. Selecionar **Autorizar Google Drive e salvar** e conceder o escopo `drive.file`.
7. Na aba Avaliação, conferir se o status é `sincronizado` ou consultar o diagnóstico persistente do erro.
8. Em Meu Drive, confirmar `Força em Casa/Dados/perfil.json` e `historico.json`. Os arquivos não aparecem antes de o usuário autorizar a criação no próprio Drive.
9. Em segundo dispositivo, usar **Recuperar do meu Google Drive** e verificar as avaliações restauradas.

## Falhas possíveis
- `SERVICE_DISABLED` ou `accessNotConfigured`: ativar Google Drive API em https://console.cloud.google.com/apis/library/drive.googleapis.com no projeto correto.
- `insufficientPermissions`: a conta não concedeu autorização suficiente para `drive.file`; revisar o popup e reconectar.
- `storageQuotaExceeded`: sem espaço no Drive pessoal.
- `rateLimitExceeded`: excesso de requisições; aguardar antes de tentar.
- `401`: token OAuth expirado; fazer login novamente e conceder permissão.
- `400`: solicitação rejeitada pelo Google, requer análise da etapa e código do erro.
- Falha de rede: o registro permanece local, sem confirmação de nuvem.
- Conflitos entre dispositivos: não sobrescrever automaticamente; preservar backup e reconciliar.

## Segurança
- A beta não possui backend com autenticação validada por servidor; somente liberar para homologação.
- Nunca registrar tokens OAuth, arquivos de cadastro, avaliações ou fotos em logs públicos.
- Ao solicitar suporte, compartilhar apenas texto do erro, código HTTP, razão da API e etapa. Ocultar Gmail e IDs pessoais.

## Correção de diagnóstico
- O cliente Drive agora identifica etapa da operação, status HTTP e `reason` sem reproduzir o corpo bruto da API.
- A interface mantém o diagnóstico visível em Avaliação corporal / Configurações.
- Sincronizações interrompidas não devem apagar dados nem ser anunciadas como confirmadas no Google Drive.

## Correção — Illegal invocation (19/11/2026)

- Causa identificada: `globalThis.confirm` era extraída do objeto `Window` e
  chamada como `controller.confirmFn(...)` no primeiro vínculo com o Drive.
  Métodos nativos de navegador podem lançar `Illegal invocation` quando o
  receptor JavaScript não é o correto. Corrigido usando uma função adaptadora
  `(mensagem) => globalThis.confirm(mensagem)`.
- Proteção análoga para `fetch`, utilizando adaptador que preserva o objeto Window.
- O botão `Sincronizar agora` é redesenhado somente depois de limpar o estado
  `cloudBusy`; evita permanecer desabilitado após falha.
- Testes de regressão simulam métodos de navegador que rejeitam um receptor
  diferente de `Window`, além de validar o fluxo de sincronização inicial.
- A versão de homologação /beta/ incorpora esta alteração; não limpar storage
  local antes de confirmar que o histórico foi realmente enviado ao Drive.

## Publicação de homologação V1.7.1

- Atualizada a versão beta para `1.7.1`, com nova identificação no cache do
  service worker para que navegadores carreguem as correções.
- Correção de `Illegal invocation` na confirmação de primeira sincronização e
  acesso ao fetch nativo.
- Interface reabilita botão `Sincronizar agora` após completar ou falhar.
- Validar no mesmo navegador: atualizar a aba, acessar Configurações e selecionar
  `Sincronizar agora`; nenhuma limpeza de armazenamento local é necessária.
- Não considerar sincronizado enquanto o Google Drive não confirmar o envio.

## Homologação OAuth no Android — Beta 1.7.2

- Sintoma observado em 19/11/2026: guia do Chrome com
  `accounts.google.com/gis` e tela genérica Google `400 malformed request`.
- A captura não expõe parâmetros completos da solicitação e, portanto,
  não permite atribuir uma causa única ao erro. O código da beta foi atualizado
  para simplificar o consentimento incremental e orientar a recuperação.
- `authorizeDrive` usa `prompt:''` (consentimento apenas quando necessário)
  e `login_hint` do Gmail verificado no login; valida o escopo `drive.file`
  no retorno. A identidade da conta é novamente conferida na API.
- O fluxo registra erros OAuth conhecidos com instruções contextualizadas,
  sem exibir tokens nem parâmetros de autenticação sensíveis.
- A tela de entrada orienta fechar apenas a guia de erro Google e retomar a
  autenticação pelo link da beta, sem apagar dados locais.
- Se o 400 continuar, conferir no projeto Google Cloud:
  OAuth Client ID tipo Web application, origem autorizada
  `https://rsobbro.github.io`, tela de consentimento em Testing e Gmail na
  lista de testadores, Google Drive API ativada e navegador Chrome completo
  (não WebView embutido em apps).
- A publicação da beta atualizada não confirma que o fluxo de autenticação
  foi concluído em um aparelho real; essa homologação depende do usuário.

## Beta V1.7.3 — recuperação de histórico do PC no celular

- Recuperação agora está visível no cadastro, painel, evolução e configurações.
- Confirmar primeiro o envio em `Força em Casa/Dados/historico.json` pelo
  computador. Salvar apenas no cache do navegador não sincroniza dispositivos.
- O celular lê o histórico sob autorização Google, localiza as pastas existentes
  sem criar pastas/arquivos adicionais, mescla registros e fotos, e preserva os
  registros já existentes no aparelho.
- Se não houver `historico.json`, o app informa a ausência sem publicar
  uma base vazia por engano.
- Registros feitos enquanto o Drive está desconectado são marcados como
  pendentes até que o Google confirme o upload.
- Testes automatizados não confirmam que o histórico pessoal foi carregado;
  homologar com o mesmo Gmail no Chrome do computador e do Android.
