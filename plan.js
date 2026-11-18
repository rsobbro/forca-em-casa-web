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
        {id:'a1',name:'Supino sentado',equipment:'WCT · braços de supino',sets:3,reps:'6–10',rest:120,rpe:'7–8',focus:'Composto · Peitoral',tip:'Costas apoiadas, punhos alinhados e cotovelos em trajetória confortável. Evite elevar os ombros.',requires:["WCT_PRESS"],setup:"Utilize os braços de supino originais da WCT, com assento e encosto ajustados."},
        {id:'a2',name:'Desenvolvimento em pé',equipment:'TOPSAND · extensores tubulares',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Ombros',tip:'Prenda os elásticos sob os pés. Contraia o abdômen e não arqueie a lombar.',requires:["TOPSAND_TUBES"],setup:"Pise sobre o centro do extensor TOPSAND, segure as duas alças e pressione acima da cabeça com controle."},
        {id:'a3',name:'Crucifixo Peck Deck',equipment:'WCT · voador',sets:2,reps:'10–15',rest:75,rpe:'8',focus:'Isolamento · Peitoral',tip:'Mantenha o movimento controlado e respeite uma amplitude confortável do ombro.',requires:["WCT_PECK"],setup:"Use somente os braços de Peck Deck originais da estação, regulando a posição do assento."},
        {id:'a4',name:'Elevação lateral',equipment:'TOPSAND · extensores leves',sets:2,reps:'12–20',rest:60,rpe:'8',focus:'Isolamento · Deltoide',tip:'Eleve os braços sem encolher os ombros ou impulsionar o tronco.',requires:["TOPSAND_TUBES"],setup:"Pise sobre a faixa tubular de menor tensão, com os cotovelos levemente flexionados."},
        {id:'a5',name:"Tríceps com extensor na âncora alta",equipment:"TOPSAND · tubo + alças + âncora de porta",sets:3,reps:'10–15',rest:75,rpe:'8',focus:'Isolamento · Tríceps',tip:"Fixe a âncora no topo da porta fechada, afaste-se e estenda os cotovelos sem deslocar os ombros.",requires:["TOPSAND_TUBES","TOPSAND_ANCHOR"],setup:"Instale a âncora TOPSAND no alto de uma porta robusta e fechada; conecte os tubos e use as alças."},
        {id:'a6',name:"Press de peito em pé com extensor",equipment:"TOPSAND · tubo + alças + âncora de porta",sets:2,reps:'8–15',rest:75,rpe:'7–8',focus:'Composto · Peitoral',tip:"Com a âncora atrás do corpo na altura do peito, empurre as mãos à frente sem arquear a lombar.",requires:["TOPSAND_TUBES","TOPSAND_ANCHOR"],setup:"Fixe a âncora TOPSAND numa porta fechada na altura do tórax; fique de costas para a âncora, com espaço livre à frente."}
      ]
    },
    {
      id:'B',weekday:2,label:'PULL',name:'Costas, bíceps e ombro posterior',tone:'blue',duration:'50–60 min',
      intro:'Puxadas verticais e horizontais para desenvolver costas e braços.',
      exercises:[
        {id:'b1',name:'Puxada frontal',equipment:'WCT · polia alta + barra longa',sets:3,reps:'6–10',rest:120,rpe:'7–8',focus:'Composto · Costas',tip:'Traga a barra em direção ao alto do peito, conduzindo os cotovelos para baixo; nunca atrás da nuca.',requires:["WCT_HIGH"],setup:"Use a barra longa original na puxada superior; nunca faça puxada por trás da nuca."},
        {id:'b2',name:"Remada horizontal com extensor",equipment:"TOPSAND · tubo + alças + âncora de porta",sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Costas',tip:"Com âncora na altura aproximada do abdômen, puxe as alças junto ao tronco, sem balançar.",requires:["TOPSAND_TUBES","TOPSAND_ANCHOR"],setup:"Prenda a âncora numa porta robusta fechada à altura do abdômen, com as alças presas aos tubos."},
        {id:'b3',name:'Remada unilateral',equipment:'TOPSAND · extensor + âncora',sets:2,reps:'10–15/lado',rest:60,rpe:'8',focus:'Composto · Costas',tip:'Fixe a âncora com segurança, mantenha o tronco estável e puxe com o cotovelo.',requires:["TOPSAND_TUBES","TOPSAND_ANCHOR"],setup:"Ancore o tubo à altura do abdômen numa porta robusta fechada; puxe uma alça por vez e mantenha o tronco estável."},
        {id:'b4',name:'Face pull',equipment:'TOPSAND · extensor + âncora',sets:2,reps:'12–20',rest:60,rpe:'8',focus:'Isolamento · Ombro posterior',tip:'Puxe em direção ao rosto com os cotovelos elevados, sem forçar o pescoço.',requires:["TOPSAND_TUBES","TOPSAND_ANCHOR"],setup:"Ancore o tubo na altura do rosto e mantenha distância suficiente para gerar tensão controlada."},
        {id:'b5',name:"Rosca direta com extensor",equipment:"TOPSAND · tubos + alças, sob os pés",sets:3,reps:'8–12',rest:75,rpe:'8',focus:'Isolamento · Bíceps',tip:"Mantenha o centro dos tubos sob os pés, cotovelos próximos do corpo e sem inclinar para trás.",requires:["TOPSAND_TUBES"],setup:"Pise firmemente no centro dos tubos e segure as alças; escolha uma resistência leve inicialmente."},
        {id:'b6',name:'Rosca martelo',equipment:'TOPSAND · extensores com alças',sets:2,reps:'10–15',rest:60,rpe:'8',focus:'Isolamento · Braquial',tip:'Palmas voltadas uma para a outra, braços próximos ao corpo.',requires:["TOPSAND_TUBES"],setup:"Pise no centro do extensor e segure as alças com palmas voltadas uma para a outra."}
      ]
    },
    {
      id:'C',weekday:3,label:'LEGS A',name:'Quadríceps, glúteos e abdômen',tone:'green',duration:'50–60 min',
      intro:'Foco em padrões de agachamento e exercícios unilaterais para compensar a carga limitada.',
      exercises:[
        {id:'c1',name:'Agachamento com resistência',equipment:'TOPSAND · extensores sob os pés',sets:3,reps:'10–15',rest:90,rpe:'7–8',focus:'Composto · Quadríceps',tip:'Pés firmes, joelhos seguindo os dedos e profundidade limitada ao que conseguir controlar.',requires:["TOPSAND_TUBES"],setup:"Pise firmemente nos tubos e mantenha as alças à altura dos ombros durante o agachamento."},
        {id:'c2',name:"Afundo estático com extensor",equipment:"TOPSAND · tubo sob o pé dianteiro + alças",sets:3,reps:'8–12/perna',rest:90,rpe:'7–8',focus:'Composto · Pernas',tip:"Pise no centro do tubo com o pé dianteiro, mantenha as alças junto aos ombros e desça verticalmente.",requires:["TOPSAND_TUBES"],setup:"Com uma base dividida e estável, prenda o tubo sob o pé dianteiro e segure as alças sem forçar o joelho."},
        {id:'c3',name:"Agachamento pausado com miniband",equipment:"Alegria · miniband acima dos joelhos",sets:2,reps:'12–15/perna',rest:60,rpe:'8',focus:'Isolamento · Quadríceps',tip:"Coloque a miniband acima dos joelhos, agache com controle e faça uma pausa curta sem deixar os joelhos colapsarem.",requires:["ALEGRIA_MINIBAND"],setup:"Posicione a miniband Alegria acima dos joelhos, sem enrolá-la; mantenha os pés firmes no solo."},
        {id:'c4',name:'Terra romeno (RDL)',equipment:'TOPSAND · extensores tubulares',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Posteriores',tip:'Empurre o quadril para trás, com joelhos levemente flexionados e coluna neutra.',requires:["TOPSAND_TUBES"],setup:"Pise no centro dos tubos com ambos os pés, segure as alças junto às coxas e leve o quadril para trás."},
        {id:'c5',name:'Panturrilha unilateral',equipment:"Solo · peso corporal (sem aparelho adicional)",sets:2,reps:'12–20/perna',rest:60,rpe:'8',focus:'Isolamento · Panturrilha',tip:'Suba e desça com controle, mantendo o tornozelo alinhado.',requires:["FLOOR"],setup:"Fique ao lado de uma parede firme para equilíbrio, mantendo um pé no chão e elevando o calcanhar."},
        {id:'c6',name:'Pallof press',equipment:'TOPSAND · extensor + âncora',sets:2,reps:'10–12/lado',rest:45,rpe:'7–8',focus:'Core · Anti-rotação',tip:'Pressione o elástico para frente sem deixar o tronco girar.',requires:["TOPSAND_TUBES","TOPSAND_ANCHOR"],setup:"Fixe o tubo na altura do peito com a âncora de porta; fique lateralmente à porta, ambas as mãos na alça."}
      ]
    },
    {
      id:'D',weekday:5,label:'UPPER',name:'Parte superior completa',tone:'purple',duration:'50–60 min',
      intro:'Segundo estímulo semanal para peito, costas, ombros e braços.',
      exercises:[
        {id:'d1',name:'Supino sentado',equipment:'WCT · braços de supino',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Peitoral',tip:'Escápulas estáveis e costas apoiadas, sem tirar o quadril do assento.',requires:["WCT_PRESS"],setup:"Use o movimento de supino sentado original da WCT, ajustando assento e encosto."},
        {id:'d2',name:"Remada horizontal com extensor",equipment:"TOPSAND · tubo + alças + âncora de porta",sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Costas',tip:"Mantenha a âncora à altura do abdômen, tronco firme e cotovelos seguindo para trás.",requires:["TOPSAND_TUBES","TOPSAND_ANCHOR"],setup:"Use a âncora TOPSAND numa porta fechada, aproximadamente à altura do abdômen."},
        {id:'d3',name:'Puxada frontal',equipment:'WCT · polia alta',sets:2,reps:'10–12',rest:75,rpe:'8',focus:'Composto · Costas',tip:'Puxe para frente do tronco, sem flexionar o pescoço para alcançar a barra.',requires:["WCT_HIGH"],setup:"Use somente o cabo e a barra de puxada superior originais da WCT."},
        {id:'d4',name:'Desenvolvimento de ombros',equipment:'TOPSAND · extensores tubulares',sets:2,reps:'10–12',rest:75,rpe:'8',focus:'Composto · Ombros',tip:'Mantenha costelas e pelve alinhadas; evite compensar na lombar.',requires:["TOPSAND_TUBES"],setup:"Pise nos tubos, segure as alças ao nível dos ombros e eleve sem compensar com a lombar."},
        {id:'d5',name:'Elevação lateral',equipment:'TOPSAND · extensores leves',sets:2,reps:'15–20',rest:60,rpe:'8',focus:'Isolamento · Ombros',tip:'Use pouca resistência para manter o movimento limpo.',requires:["TOPSAND_TUBES"],setup:"Segure as alças dos tubos TOPSAND em baixa tensão e eleve os braços lateralmente com controle."},
        {id:'d6',name:"Tríceps com extensor na âncora alta",equipment:"TOPSAND · tubo + alças + âncora de porta",sets:2,reps:'12–15',rest:60,rpe:'8',focus:'Isolamento · Tríceps',tip:"Com a âncora acima da cabeça, estenda os cotovelos sem usar o peso do tronco.",requires:["TOPSAND_TUBES","TOPSAND_ANCHOR"],setup:"Prenda a âncora no alto da porta robusta e fechada; comece com tensão reduzida."},
        {id:'d7',name:"Rosca direta com extensor",equipment:"TOPSAND · tubos + alças, sob os pés",sets:2,reps:'12–15',rest:60,rpe:'8',focus:'Isolamento · Bíceps',tip:"Deixe os cotovelos próximos do tronco e não use balanço corporal para levantar.",requires:["TOPSAND_TUBES"],setup:"Pise no centro dos tubos TOPSAND e segure as alças com as palmas para cima."}
      ]
    },
    {
      id:'E',weekday:6,label:'LOWER',name:'Posteriores, glúteos e pernas',tone:'red',duration:'50–60 min',
      intro:'Segundo estímulo de pernas, com ênfase em quadril, posteriores e estabilidade.',
      exercises:[
        {id:'e1',name:'Terra romeno (RDL)',equipment:'TOPSAND · extensores tubulares',sets:3,reps:'8–12',rest:90,rpe:'7–8',focus:'Composto · Posteriores',tip:'Quadril para trás e coluna neutra. Pare antes de perder o controle da pelve.',requires:["TOPSAND_TUBES"],setup:"Pise sobre os tubos TOPSAND, segure as alças e execute o movimento de dobradiça do quadril."},
        {id:'e2',name:"Afundo reverso com extensor",equipment:"TOPSAND · tubo sob o pé dianteiro + alças",sets:3,reps:'8–12/perna',rest:90,rpe:'8',focus:'Composto · Pernas',tip:"Pise no tubo com o pé que permanece à frente, leve o outro pé para trás e mantenha equilíbrio.",requires:["TOPSAND_TUBES"],setup:"Pise no centro do tubo com o pé dianteiro; segure as alças e recue o pé oposto sem soltar o elástico."},
        {id:'e3',name:'Elevação pélvica unilateral',equipment:'Solo + miniband Alegria',sets:3,reps:'10–15/perna',rest:75,rpe:'8',focus:'Composto · Glúteos',tip:'Suba contraindo o glúteo sem arquear excessivamente a lombar.',requires:["ALEGRIA_MINIBAND","FLOOR"],setup:"No solo, coloque a miniband acima dos joelhos e mantenha um pé de apoio firme durante a elevação pélvica."},
        {id:'e4',name:'Flexão de joelho em pé',equipment:'TOPSAND · extensor + tornozeleira + âncora baixa',sets:2,reps:'12–15/perna',rest:60,rpe:'8',focus:'Isolamento · Posteriores',tip:'Mantenha a coxa estável e controle a tensão do elástico.',requires:["TOPSAND_TUBES","TOPSAND_ANKLE","TOPSAND_ANCHOR"],setup:"Prenda a âncora TOPSAND na parte baixa de uma porta resistente e fechada; conecte a tornozeleira ao tubo e flexione o joelho sem balançar."},
        {id:'e5',name:'Caminhada lateral',equipment:'Alegria · miniband',sets:2,reps:'12–20 passos/lado',rest:45,rpe:'8',focus:'Complementar · Glúteos',tip:'Evite que os joelhos se aproximem e mantenha passos curtos controlados.',requires:["ALEGRIA_MINIBAND"],setup:"Coloque a miniband acima dos joelhos, mantenha semiagachamento e dê passos curtos para os lados."},
        {id:'e6',name:'Panturrilha unilateral',equipment:"Solo · peso corporal (sem aparelho adicional)",sets:2,reps:'12–20/perna',rest:60,rpe:'8',focus:'Isolamento · Panturrilha',tip:'Pause brevemente no topo e desça sem rebote.',requires:["FLOOR"],setup:"Ao lado de uma parede firme, eleve um calcanhar por vez sem usar apoio instável."},
        {id:'e7',name:'Prancha abdominal',equipment:"Solo · peso corporal (sem aparelho adicional)",sets:2,reps:'30–45 s',rest:45,rpe:'7–8',focus:'Core · Isométrico',tip:'Contraia abdômen e glúteos, evitando que a lombar ceda.',requires:["FLOOR"],setup:"Apoie antebraços e pontas dos pés no solo; mantenha abdômen e glúteos ativos, sem exigir acessórios."}
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
