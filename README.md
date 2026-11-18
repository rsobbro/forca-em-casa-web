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

- **Os dados pessoais NÃO são enviados ao GitHub.** O site estático fica público, mas as séries, cargas e datas são armazenadas em `localStorage` no dispositivo/navegador que você utiliza.
- A limpeza do navegador, navegação anônima ou troca de aparelho pode apagar ou impedir o acesso aos registros locais. Exporte backups JSON regularmente.
- Links de registro retroativo solicitam confirmação do usuário e gravam somente no navegador que abriu o link. O repositório público não contém o histórico pessoal.
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
