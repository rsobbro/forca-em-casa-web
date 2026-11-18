/** Plano inicial baseado na ficha personalizada aprovada na conversa. */
export const PROGRAM = {
  id: 'home-strength-8w-v1',
  title: 'Força em Casa',
  weeks: 8,
  schedule: { 1:'A', 2:'B', 3:'C', 5:'D', 6:'E' },
  days: [
    {
      id: 'A', weekday: 1, label: 'PUSH', name: 'Peito, ombros e tríceps', tone: 'orange', duration: '50–60 min',
      intro: 'Movimentos de empurrar: comece pelos compostos e finalize com isolamento.',
      exercises: [
        {id:'a1',name:'Supino sentado',equipment:'WCT · braços de supino',sets:3,reps:'6–10',rest:120,rpe:'7–8',focus:'Composto · Peitoral',tip:'Costas apoiadas, punhos alinhados e cotovelos em trajetória confortável. Evite elevar os ombros.'},
        {id:'a2',name:'Desenvolvimento em pé',equipment:'TOPSAND · extensores tubulares',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Ombros',tip:'Prenda os elásticos sob os pés. Contraia o abdômen e não arqueie a lombar.'},
        {id:'a3',name:'Crucifixo Peck Deck',equipment:'WCT · voador',sets:2,reps:'10–15',rest:75,rpe:'8',focus:'Isolamento · Peitoral',tip:'Mantenha o movimento controlado e respeite uma amplitude confortável do ombro.'},
        {id:'a4',name:'Elevação lateral',equipment:'TOPSAND · extensores leves',sets:2,reps:'12–20',rest:60,rpe:'8',focus:'Isolamento · Deltoide',tip:'Eleve os braços sem encolher os ombros ou impulsionar o tronco.'},
        {id:'a5',name:'Tríceps na polia alta',equipment:'WCT · polia superior',sets:3,reps:'10–15',rest:75,rpe:'8',focus:'Isolamento · Tríceps',tip:'Cotovelos próximos ao corpo, sem inclinar o tronco para empurrar a carga.'},
        {id:'a6',name:'Flexão de braços',equipment:'Peso corporal · solo',sets:2,reps:'8–15',rest:75,rpe:'7–8',focus:'Composto · Peitoral',tip:'Mantenha tronco e quadril alinhados; eleve as mãos se precisar reduzir a dificuldade.'}
      ]
    },
    {
      id:'B',weekday:2,label:'PULL',name:'Costas, bíceps e ombro posterior',tone:'blue',duration:'50–60 min',
      intro:'Puxadas verticais e horizontais para desenvolver costas e braços.',
      exercises:[
        {id:'b1',name:'Puxada frontal',equipment:'WCT · polia alta + barra longa',sets:3,reps:'6–10',rest:120,rpe:'7–8',focus:'Composto · Costas',tip:'Traga a barra em direção ao alto do peito, conduzindo os cotovelos para baixo; nunca atrás da nuca.'},
        {id:'b2',name:'Remada baixa sentada',equipment:'WCT · polia inferior',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Costas',tip:'Evite balançar o tronco; conduza os cotovelos para trás e mantenha a coluna estável.'},
        {id:'b3',name:'Remada unilateral',equipment:'TOPSAND · extensor + âncora',sets:2,reps:'10–15/lado',rest:60,rpe:'8',focus:'Composto · Costas',tip:'Fixe a âncora com segurança, mantenha o tronco estável e puxe com o cotovelo.'},
        {id:'b4',name:'Face pull',equipment:'TOPSAND · extensor + âncora',sets:2,reps:'12–20',rest:60,rpe:'8',focus:'Isolamento · Ombro posterior',tip:'Puxe em direção ao rosto com os cotovelos elevados, sem forçar o pescoço.'},
        {id:'b5',name:'Rosca direta',equipment:'WCT · polia inferior + barra',sets:3,reps:'8–12',rest:75,rpe:'8',focus:'Isolamento · Bíceps',tip:'Cotovelos próximos ao tronco e punhos neutros, sem inclinar para trás.'},
        {id:'b6',name:'Rosca martelo',equipment:'TOPSAND · extensores com alças',sets:2,reps:'10–15',rest:60,rpe:'8',focus:'Isolamento · Braquial',tip:'Palmas voltadas uma para a outra, braços próximos ao corpo.'}
      ]
    },
    {
      id:'C',weekday:3,label:'LEGS A',name:'Quadríceps, glúteos e abdômen',tone:'green',duration:'50–60 min',
      intro:'Foco em padrões de agachamento e exercícios unilaterais para compensar a carga limitada.',
      exercises:[
        {id:'c1',name:'Agachamento com resistência',equipment:'TOPSAND · extensores sob os pés',sets:3,reps:'10–15',rest:90,rpe:'7–8',focus:'Composto · Quadríceps',tip:'Pés firmes, joelhos seguindo os dedos e profundidade limitada ao que conseguir controlar.'},
        {id:'c2',name:'Afundo estático',equipment:'Peso corporal ou TOPSAND',sets:3,reps:'8–12/perna',rest:90,rpe:'7–8',focus:'Composto · Pernas',tip:'Mantenha apoio estável e desça verticalmente; evite inclinar os joelhos para dentro.'},
        {id:'c3',name:'Extensão unilateral de joelho',equipment:'TOPSAND · extensor + tornozeleira + âncora baixa',sets:2,reps:'12–15/perna',rest:60,rpe:'8',focus:'Isolamento · Quadríceps',tip:'Use apenas um ponto de ancoragem seguro, com movimento lento e sem dor no joelho.'},
        {id:'c4',name:'Terra romeno (RDL)',equipment:'TOPSAND · extensores tubulares',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Posteriores',tip:'Empurre o quadril para trás, com joelhos levemente flexionados e coluna neutra.'},
        {id:'c5',name:'Panturrilha unilateral',equipment:'Peso corporal + apoio estável',sets:2,reps:'12–20/perna',rest:60,rpe:'8',focus:'Isolamento · Panturrilha',tip:'Suba e desça com controle, mantendo o tornozelo alinhado.'},
        {id:'c6',name:'Pallof press',equipment:'TOPSAND · extensor + âncora',sets:2,reps:'10–12/lado',rest:45,rpe:'7–8',focus:'Core · Anti-rotação',tip:'Pressione o elástico para frente sem deixar o tronco girar.'}
      ]
    },
    {
      id:'D',weekday:5,label:'UPPER',name:'Parte superior completa',tone:'purple',duration:'50–60 min',
      intro:'Segundo estímulo semanal para peito, costas, ombros e braços.',
      exercises:[
        {id:'d1',name:'Supino sentado',equipment:'WCT · braços de supino',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Peitoral',tip:'Escápulas estáveis e costas apoiadas, sem tirar o quadril do assento.'},
        {id:'d2',name:'Remada baixa',equipment:'WCT · polia inferior',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Costas',tip:'Inicie com ombros estáveis e puxe sem usar balanço da lombar.'},
        {id:'d3',name:'Puxada frontal',equipment:'WCT · polia alta',sets:2,reps:'10–12',rest:75,rpe:'8',focus:'Composto · Costas',tip:'Puxe para frente do tronco, sem flexionar o pescoço para alcançar a barra.'},
        {id:'d4',name:'Desenvolvimento de ombros',equipment:'TOPSAND · extensores tubulares',sets:2,reps:'10–12',rest:75,rpe:'8',focus:'Composto · Ombros',tip:'Mantenha costelas e pelve alinhadas; evite compensar na lombar.'},
        {id:'d5',name:'Elevação lateral',equipment:'TOPSAND · extensores leves',sets:2,reps:'15–20',rest:60,rpe:'8',focus:'Isolamento · Ombros',tip:'Use pouca resistência para manter o movimento limpo.'},
        {id:'d6',name:'Tríceps na polia alta',equipment:'WCT · polia superior',sets:2,reps:'12–15',rest:60,rpe:'8',focus:'Isolamento · Tríceps',tip:'Mantenha cotovelos fixos e controle o retorno.'},
        {id:'d7',name:'Rosca direta',equipment:'WCT · polia inferior',sets:2,reps:'12–15',rest:60,rpe:'8',focus:'Isolamento · Bíceps',tip:'Evite tirar os cotovelos da posição para levantar mais carga.'}
      ]
    },
    {
      id:'E',weekday:6,label:'LOWER',name:'Posteriores, glúteos e pernas',tone:'red',duration:'50–60 min',
      intro:'Segundo estímulo de pernas, com ênfase em quadril, posteriores e estabilidade.',
      exercises:[
        {id:'e1',name:'Terra romeno (RDL)',equipment:'TOPSAND · extensores tubulares',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Posteriores',tip:'Quadril para trás e coluna neutra. Pare antes de perder o controle da pelve.'},
        {id:'e2',name:'Afundo reverso',equipment:'Peso corporal ou TOPSAND',sets:3,reps:'8–12/perna',rest:90,rpe:'8',focus:'Composto · Pernas',tip:'Dê um passo para trás e empurre o chão com o pé da frente ao retornar.'},
        {id:'e3',name:'Elevação pélvica unilateral',equipment:'Solo + miniband Alegria',sets:3,reps:'10–15/perna',rest:75,rpe:'8',focus:'Composto · Glúteos',tip:'Suba contraindo o glúteo sem arquear excessivamente a lombar.'},
        {id:'e4',name:'Flexão de joelho em pé',equipment:'TOPSAND · extensor + tornozeleira + âncora baixa',sets:2,reps:'12–15/perna',rest:60,rpe:'8',focus:'Isolamento · Posteriores',tip:'Mantenha a coxa estável e controle a tensão do elástico.'},
        {id:'e5',name:'Caminhada lateral',equipment:'Alegria · miniband',sets:2,reps:'12–20 passos/lado',rest:45,rpe:'8',focus:'Complementar · Glúteos',tip:'Evite que os joelhos se aproximem e mantenha passos curtos controlados.'},
        {id:'e6',name:'Panturrilha unilateral',equipment:'Peso corporal + apoio estável',sets:2,reps:'12–20/perna',rest:60,rpe:'8',focus:'Isolamento · Panturrilha',tip:'Pause brevemente no topo e desça sem rebote.'},
        {id:'e7',name:'Prancha abdominal',equipment:'Peso corporal · solo',sets:2,reps:'30–45 s',rest:45,rpe:'7–8',focus:'Core · Isométrico',tip:'Contraia abdômen e glúteos, evitando que a lombar ceda.'}
      ]
    }
  ],
  phases:[
    {week:1,label:'Readaptação I',rpe:'6–7',detail:'1–2 séries por exercício, sem chegar à falha.'},
    {week:2,label:'Readaptação II',rpe:'6–7',detail:'Até 2 séries por exercício, com técnica e amplitude controladas.'},
    {week:3,label:'Construção',rpe:'7–8',detail:'Aproximar-se do volume completo conforme recuperação.'},
    {week:4,label:'Progressão',rpe:'7–8',detail:'Volume completo. Aumente repetições antes da carga.'},
    {week:5,label:'Progressão',rpe:'7–8',detail:'Consolide as faixas de repetições com boa técnica.'},
    {week:6,label:'Intensificação',rpe:'8–9',detail:'Progrida somente após atingir o topo das faixas.'},
    {week:7,label:'Intensificação',rpe:'8–9',detail:'Preserve técnica; não é necessário falhar.'},
    {week:8,label:'Descarga e avaliação',rpe:'6–7',detail:'Reduza o volume em aproximadamente 40% e reavalie.'}
  ]
};
export function prescribedSets(base, week) {
  if (week===1) return Math.max(1,Math.ceil(base/2));
  if (week===2) return Math.min(2,base);
  if (week===8) return Math.max(1,Math.round(base*.6));
  return base;
}
export const findDay=id=>PROGRAM.days.find(day=>day.id===id);
