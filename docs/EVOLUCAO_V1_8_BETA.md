# Força em Casa V1.8 — homologação funcional

**Ambiente de homologação:** https://rsobbro.github.io/forca-em-casa-web/beta/

**Ambiente principal estável:** https://rsobbro.github.io/forca-em-casa-web/

O ambiente principal deve permanecer intacto até validação do OAuth, do upload
e da recuperação em Android e desktop. Não armazenar dados pessoais, fotos ou
credenciais no repositório público.

## Funcionalidades implementadas na beta

### Primeiro acesso e plano de treino

- Após login Gmail verificado e cadastro, solicitar objetivo, dias por semana
  (1 a 5), sessões por dia (1 ou 2), séries por exercício/grupo (1 a 4)
  e primeira avaliação.
- Inventário: fotografia, marca, modelo e funcionalidades **confirmadas**
  pelo usuário. Para treino sem equipamento, oferecer opção de peso corporal.
- Gerador determinístico seleciona apenas exercícios cujos requisitos
  estão incluídos no inventário. A foto é evidência, **não reconhecimento
  automático do aparelho**, da carga nem das funções.
- Não prometer treino individual clinicamente prescrito. Recomendar
  avaliação profissional para limitações, dor e contraindicações.

### Edição de avaliação e fotos

- Editar data, medidas e observações preservando o ID original.
- Fotografias de frente, costas e lado podem ser substituídas.
- Substituir a fotografia existente no Google Drive é uma ação explícita,
  confirmada pelo usuário, afetando apenas as vistas selecionadas.
- Dados locais permanecem preservados se o upload falhar ou houver conflito.

### Descanso, atividades e relógios

- Alerta sonoro original por Web Audio quando o contador termina, com
  vibração quando suportada. Pode não tocar com navegador suspenso,
  tela bloqueada ou restrição de reprodução de áudio.
- Resumo de atividades separa semana corrente (segunda–domingo),
  últimos sete dias e histórico completo. Somente registros da
  semana corrente entram nos cartões semanais.
- Importação CSV do app do relógio: data, atividade, duração, distância,
  calorias registradas, FC média/máxima e passos, quando disponíveis.
- Não existe acesso direto a Apple Health/HealthKit ou Health Connect
  a partir desta PWA estática; integração automática futura exige
  app nativo/ponte autorizada ou API do fabricante disponível.

### Nutrição e hidratação

- Registrar refeições por data, horário/categoria, alimentos e porções;
  calcular energia e macronutrientes a partir de valores por 100 g.
- Fotografias do prato são privadas e documentais; nesta fase, a aplicação
  não infere automaticamente alimentos, óleo, preparo ou gramagem da imagem.
- Consulta voluntária por código de barras ao **Open Food Facts**, que
  possui dados públicos de produtos industrializados. Conferir rótulos,
  lacunas e precisão dos dados antes de aplicar os cálculos.
- Para receitas e alimentos in natura: buscar valores de fontes
  nutricionais confiáveis, como TBCA/USP ou USDA FoodData Central;
  integração programática adicional depende da política/API de cada fonte.
- Diário de água com registros em ml por data e relatório semanal.
  Meta informada pelo usuário; não prescrever consumo individual automático.
- Exportação CSV de alimentação e hidratação para relatórios.

## Limites e próximos incrementos

1. **Reconhecimento de fotos por IA**: não apresentado como concluído.
   Exige visão computacional, confirmação de equipamento/alimentos e,
   para alimentos, validação da porção em gramas; não é possível inferir
   com precisão confiável calorias pela imagem isolada.
2. **Relógios em sincronização automática**: estudar a plataforma concreta
   (Samsung Health, Garmin, Fitbit, Apple Watch, Wear OS) e permissões
   oficiais antes de implementar conectores nativos/servidor.
3. **Privacidade e segurança**: os registros corporais e fotos são dados
   pessoais. O controle de interface do GitHub Pages não substitui
   sessões de autenticação verificadas pelo servidor. Usar autorização
   mínima do Drive; evitar tokens/secret keys em código público.
4. **Homologação real**: validar todas as etapas com dados fictícios antes
   de registrar fotos pessoais e antes de ativar a funcionalidade em produção.

## Referências técnicas públicas

- Open Food Facts: https://openfoodfacts.github.io/documentation/docs/
- USDA FoodData Central API: https://fdc.nal.usda.gov/api-guide/
- Health Connect: https://developer.android.com/health-and-fitness/health-connect
- Apple HealthKit: https://developer.apple.com/documentation/healthkit
