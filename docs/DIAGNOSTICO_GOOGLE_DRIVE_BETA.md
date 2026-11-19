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
