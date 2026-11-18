/** URLs de vídeos públicos verificadas por título e capítulos; busca é fallback sem verificação. */
export const VIDEO_REFERENCES={
  "a1": [
    "7VZVaPXwiWA",
    102,
    "Supino na estação WCT",
    "Padrão de supino na estação; confirme os ajustes específicos do seu modelo."
  ],
  "a2": [
    "vnhT_NHAgPk",
    341,
    "Desenvolvimento de ombros com elástico",
    "Demonstração da execução com elástico."
  ],
  "a3": [
    "7VZVaPXwiWA",
    128,
    "Peck Deck em estação WCT",
    "Vídeo de referência para o Peck Deck."
  ],
  "a4": [
    "vnhT_NHAgPk",
    71,
    "Elevação lateral com elástico",
    "Demonstração com extensor."
  ],
  "a5": [
    "7VZVaPXwiWA",
    214,
    "Tríceps no cabo",
    "Mostra o padrão do movimento na polia; sua ficha usa o extensor TOPSAND."
  ],
  "b1": [
    "7VZVaPXwiWA",
    2,
    "Puxador frontal na estação WCT",
    "Use somente a puxada frontal, nunca atrás da nuca."
  ],
  "b2": [
    "RVSbA9pk4NE",
    25,
    "Remada com elástico",
    "O vídeo pode mostrar uma ancoragem diferente; siga a ficha TOPSAND."
  ],
  "b3": [
    "YyN5tzw6EoU",
    163,
    "Remada unilateral com elástico",
    "O vídeo utiliza miniband; adapte o ponto de fixação indicado na ficha."
  ],
  "b5": [
    "RVSbA9pk4NE",
    105,
    "Rosca de bíceps com elástico",
    "Padrão de rosca com faixa."
  ],
  "c1": [
    "RVSbA9pk4NE",
    130,
    "Agachamento com elástico",
    "Demonstração da flexão de quadril e joelhos."
  ],
  "c2": [
    "YyN5tzw6EoU",
    652,
    "Afundo com elástico",
    "Vídeo com afundo alternado; a ficha utiliza afundo estático."
  ],
  "c4": [
    "RVSbA9pk4NE",
    65,
    "Stiff com elástico",
    "Demonstração do padrão de dobradiça de quadril."
  ],
  "c6": [
    "GC0NIcCGRvw",
    0,
    "Pallof Press com elástico",
    "Demonstração do exercício anti-rotação."
  ],
  "d1": [
    "7VZVaPXwiWA",
    102,
    "Supino na estação WCT",
    "Confirme os ajustes para seu aparelho."
  ],
  "d2": [
    "RVSbA9pk4NE",
    25,
    "Remada com elástico",
    "Siga a configuração de âncora de porta da ficha."
  ],
  "d3": [
    "7VZVaPXwiWA",
    2,
    "Puxador frontal na estação WCT",
    "Evite puxar atrás da nuca."
  ],
  "d4": [
    "vnhT_NHAgPk",
    341,
    "Desenvolvimento de ombros com elástico",
    "Demonstração com extensor."
  ],
  "d5": [
    "vnhT_NHAgPk",
    71,
    "Elevação lateral com elástico",
    "Demonstração com extensor."
  ],
  "d6": [
    "7VZVaPXwiWA",
    214,
    "Tríceps no cabo",
    "O vídeo usa cabo; a ficha utiliza o extensor TOPSAND."
  ],
  "d7": [
    "RVSbA9pk4NE",
    105,
    "Rosca de bíceps com elástico",
    "Demonstração com faixa elástica."
  ],
  "e1": [
    "RVSbA9pk4NE",
    65,
    "Stiff com elástico",
    "Mesmo padrão do terra romeno."
  ],
  "e3": [
    "YyN5tzw6EoU",
    845,
    "Elevação pélvica unilateral",
    "Vídeo de referência com miniband."
  ],
  "e4": [
    "YyN5tzw6EoU",
    916,
    "Flexão de joelho em pé",
    "O vídeo mostra miniband; a ficha utiliza tornozeleira e tubo TOPSAND."
  ],
  "e5": [
    "YyN5tzw6EoU",
    577,
    "Agachamento com deslocamento lateral",
    "Movimento semelhante; use a miniband e o deslocamento descritos na ficha."
  ]
};
export const VIDEO_SEARCHES={
  "a6": "press de peito com elástico âncora porta",
  "b4": "face pull elástico âncora porta",
  "b6": "rosca martelo com elástico de resistência",
  "c3": "agachamento com pausa mini band joelhos",
  "c5": "elevação panturrilha unilateral em pé",
  "e2": "afundo reverso com elástico resistência",
  "e6": "elevação panturrilha unilateral em pé",
  "e7": "prancha abdominal solo"
};
export function exerciseVideo(ex){
 const item=VIDEO_REFERENCES[ex.id];
 if(item)return {verified:true,url:'https://www.youtube.com/watch?v='+item[0]+'&t='+item[1]+'s',title:item[2],note:item[3]};
 const search=VIDEO_SEARCHES[ex.id]||ex.name+' '+ex.equipment;
 return {verified:false,url:'https://www.youtube.com/results?search_query='+encodeURIComponent(search),title:'Pesquisar no YouTube',note:'Não foi localizado um vídeo específico verificado para esta variante. A busca poderá retornar opções não avaliadas.'};
}
