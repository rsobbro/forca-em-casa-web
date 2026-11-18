/** Inventário permitido da infraestrutura doméstica. Não acrescentar acessórios não verificados. */
export const EQUIPMENT={
 WCT_PRESS:'Estação WCT 80 kg · braços originais de supino',
 WCT_PECK:'Estação WCT 80 kg · braços originais de Peck Deck',
 WCT_HIGH:'Estação WCT 80 kg · puxador superior e barra original',
 TOPSAND_TUBES:'Kit TOPSAND · tubos extensores com alças',
 TOPSAND_ANCHOR:'Kit TOPSAND · âncora de porta original',
 TOPSAND_ANKLE:'Kit TOPSAND · tornozeleiras originais',
 ALEGRIA_MINIBAND:'Kit Alegria · minibands',
 FLOOR:'Solo e peso corporal · sem aparelho adicional'
};
export const INVENTORY_NOTICE='A polia inferior, a cadeira extensora, o leg press e funções adicionais não foram confirmados para este modelo WCT. Não improvise caminhos de cabo nem adaptadores.';
export function validateProgramEquipment(program){
 const issues=[];
 for(const day of program.days){
  for(const ex of day.exercises){
   if(!Array.isArray(ex.requires)||!ex.requires.length||!ex.setup||!ex.equipment)issues.push(ex.id+': sem inventário/configuração');
   for(const key of ex.requires||[])if(!Object.hasOwn(EQUIPMENT,key))issues.push(ex.id+': '+key+' não consta no inventário');
   if(/WCT.*(polia inferior|cadeira extensora|leg press|polia baixa)/i.test(ex.equipment))issues.push(ex.id+': função WCT não verificada');
  }
 }
 return issues;
}
