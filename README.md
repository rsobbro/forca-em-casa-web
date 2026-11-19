# Força em Casa — V1

Aplicação web responsiva e instalável (PWA) para acompanhar um plano de treinamento de oito semanas, cinco dias por semana, com a estação WCT Fitness 80 kg, extensores TOPSAND e minibands Alegria.

## Recursos

- Divisão **Push / Pull / Legs + Upper / Lower**, com 5 fichas e 8 semanas de periodização.
- Consultas por dia: exercícios, equipamentos, séries, repetições, RPE, intervalos e dicas de execução.
- Registro de cada série: repetições, carga ou cor do elástico, esforço percebido e conclusão.
- Temporizador de descanso, persistência de sessão em andamento, histórico e métricas semanais.
- Exportação de registros para **CSV** e backup/restore em **JSON**.
- Registro retroativo de treinos concluídos, sem criar séries ou cargas fictícias. A confirmação ocorre no próprio navegador e preserva o histórico existente.
- Interface mobile/desktop e funcionamento offline depois do primeiro carregamento em HTTPS.
- Fotos das posições de início e fim para os 32 exercícios de musculação (acervo **yuhonas/free-exercise-db**, Unlicense, fotografias carregadas da internet). Quando a máquina da foto é diferente, siga o equipamento indicado na ficha.
- Diário complementar para corrida, bike, karatê, natação, caminhada e outras atividades, com data, duração, distância opcional, intensidade e observações, integrado ao histórico e às exportações CSV/JSON.
- Auditoria dos **32 exercícios** contra as funções comprovadas da WCT 80 kg, tubos/âncora/tornozeleira TOPSAND, minibands Alegria e solo. Movimentos que pressupunham polia inferior ou cadeira extensora não confirmadas foram substituídos; referências visuais de equipamentos distintos são identificadas.
- Links para **24 referências verificadas de vídeo do YouTube**, com variantes explicitadas; quando não existe referência específica verificada, oferece pesquisa sem alegar que um vídeo foi localizado.
- Aba **Avaliação corporal** com peso, altura, cintura, peito, quadril, braço, coxa, panturrilha, pescoço, percentual de gordura informado pelo usuário, comparação de medidas e gráficos de peso e cintura; dados privados apenas no navegador e exportação CSV/JSON.
- Armazenamento local no navegador, sem login ou servidor.

## Como abrir localmente

O aplicativo usa módulos ES, então não abra `index.html` pelo protocolo `file://`. Na pasta do projeto:

```sh
python -m http.server 8000
```

Acesse `http://localhost:8000`.

## Como publicar no GitHub Pages

1. Na conta do GitHub, crie **um novo repositório público** denominado `forca-em-casa-web` (ou outro nome). **Não use** um repositório pessoal existente e não inclua dados de treino no repositório.
2. Descompacte os arquivos deste projeto e envie **todo o conteúdo da pasta** para a raiz do novo repositório, incluindo `.github/workflows/deploy.yml` e `.nojekyll`.
3. No repositório, acesse **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Acesse **Actions → Publicar no GitHub Pages** para acompanhar a execução. Se necessário, clique em **Run workflow**.
5. O endereço deverá seguir o formato `https://SEU-USUARIO.github.io/forca-em-casa-web/` (o nome do caminho varia com o repositório). Confirme a URL final indicada na área **Pages**.

Se preferir usar Git em vez da interface web:

```sh
git init
git add .
git commit -m "feat: primeira versao do sistema de treino"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/forca-em-casa-web.git
git push -u origin main
```

**Pré-requisitos:** crie o repositório primeiro e configure o acesso de escrita do Git à sua conta. O workflow acima é fornecido, mas a implantação efetiva depende da configuração de GitHub Pages no repositório.

## Privacidade e limites

- As fotografias exigem conexão com a internet; podem não aparecer offline. Acervo e licença: https://github.com/yuhonas/free-exercise-db .
- **Os dados pessoais NÃO são enviados ao GitHub.** O site estático fica público, mas as séries, cargas e datas são armazenadas em `localStorage` no dispositivo/navegador que você utiliza.
- A limpeza do navegador, navegação anônima ou troca de aparelho pode apagar ou impedir o acesso aos registros locais. Exporte backups JSON regularmente.
- Links de registro retroativo solicitam confirmação do usuário e gravam somente no navegador que abriu o link. O repositório público não contém o histórico pessoal.
- **Não registre medidas pessoais no repositório público.** As avaliações são persistidas apenas em localStorage deste navegador; o código aberto não inclui medidas individuais. Exporte backups localmente e proteja esses arquivos.
- **Não existe sincronização entre aparelhos nem autenticação.** Para a V2, use backend com autenticação e regras de acesso adequadas antes de salvar dados na nuvem.
- A carga das placas da estação e a tensão dos elásticos não são diretamente equivalentes. O sistema não calcula 1RM nem prescreve aumentos automáticos.
- O programa é uma referência inicial, não substitui avaliação presencial de profissional habilitado.

## Estrutura

```text
index.html                    Interface principal
styles.css                    Estilo responsivo
app.js                        Lógica, armazenamento, histórico e exportação
plan.js                       Ficha de treino e periodização
sw.js                         Cache para modo offline
manifest.webmanifest          Configuração PWA
assets/                       Ícones
.github/workflows/deploy.yml  Publicação via GitHub Actions
```

## Licença

MIT. Código-fonte reutilizável e sem dependências externas.

## Evolução V1.3 — contagem e múltiplos navegadores

A tela **Evolução** diferencia treinos de musculação e atividades adicionais. Registros manuais de treino concluído contam na frequência, mas não nas séries ou repetições, pois esses dados não foram fornecidos. A opção **Mesclar backup JSON** preserva o histórico do navegador atual, mescla por IDs e evita duplicar um treino manual para a mesma data/divisão. Os dados continuam exclusivamente no localStorage de cada dispositivo; GitHub Pages não sincroniza dados privados automaticamente. Para transferir, exporte JSON no dispositivo de origem e utilize Mesclar backup no dispositivo de destino.

## Avaliação corporal V1.4
- Fotos **frente, costas e lado com braços estendidos** são opcionais e associadas a cada avaliação. Guardadas no IndexedDB do próprio navegador, redimensionadas quando possível, jamais enviadas ao GitHub ou a serviços externos. Podem ser adicionadas mais tarde a registros antigos. O backup JSON inclui fotografias em base64 e pode ficar grande: guarde-o em local seguro.
- Medidas bilaterais para braço, comprimento da perna (quadril ao tornozelo), coxa e panturrilha. Campos antigos genéricos continuam aceitos nos backups e no histórico.
- Tórax em repouso e em inspiração máxima. A diferença é a amplitude inspiratória relativa ao repouso, e não uma medida clínica de excursão entre expiração máxima e inspiração máxima.
- Altura informada como **1,73** é convertida para **173 cm**. Peso **83,300** é aceito como 83,3 kg.
- Estimativa automática de gordura corporal masculina por **RFM** (altura e cintura) e fórmula **US Navy** (altura, cintura na altura do umbigo e pescoço). Não são exames de gordura corporal, e não é feita análise por fotografia. Resultado de exame, quando houver, é registrado separadamente.
- Referências: Woolcott & Bergman, Scientific Reports 2018 (https://doi.org/10.1038/s41598-018-29362-1) e fórmula circunferencial US Navy publicada em https://pmc.ncbi.nlm.nih.gov/articles/PMC4831679/.
