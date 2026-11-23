import {validISO} from './activities.js';

/** Dietary calculations are arithmetic over declared food-label data.
 * A photograph alone never defines ingredients, grams or nutrients.
 */
export const MEAL_KINDS=[
 {id:'cafe',label:'Café da manhã'}, {id:'almoco',label:'Almoço'},
 {id:'jantar',label:'Jantar'}, {id:'lanche',label:'Lanche'}, {id:'ceia',label:'Ceia'}
];
const reasonable=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
export const rounded=(n,d=1)=>Math.round(n*10**d)/10**d;
export function validMealFood(x){
 return !!x&&typeof x.name==='string'&&x.name.trim().length>0&&x.name.length<=120
 &&reasonable(x.grams,1,5000)
 &&reasonable(x.kcalPer100,0,1000)
 &&['proteinPer100','carbsPer100','fatPer100'].every(k=>x[k]===null||x[k]===undefined||reasonable(x[k],0,100))
 &&(!x.source||['rótulo','Open Food Facts','tabela','estimativa informada'].includes(x.source))
 &&(!x.barcode||/^[0-9]{8,14}$/.test(x.barcode));
}
export function validMeal(meal){
 return !!meal&&typeof meal.id==='string'&&meal.id.length>0&&meal.id.length<=128
 &&validISO(meal.date)&&MEAL_KINDS.some(k=>k.id===meal.kind)
 &&Array.isArray(meal.foods)&&meal.foods.length>=1&&meal.foods.length<=20
 &&meal.foods.every(validMealFood)&&typeof meal.notes==='string'&&meal.notes.length<=500;
}
export function foodTotals(food){
 if(!validMealFood(food))throw new Error('Confira o alimento, quantidade em gramas e informação por 100 g.');
 const factor=food.grams/100;
 return {kcal:rounded(food.kcalPer100*factor),
  proteinG:rounded((food.proteinPer100??0)*factor),
  carbsG:rounded((food.carbsPer100??0)*factor),
  fatG:rounded((food.fatPer100??0)*factor)};
}
export function mealTotals(meal){
 return (meal.foods||[]).reduce((total,food)=>{
  const amount=foodTotals(food);
  for(const key of Object.keys(amount))total[key]+=amount[key];
  return total;
 },{kcal:0,proteinG:0,carbsG:0,fatG:0});
}
export function dailyNutrition(meals,date){
 const chosen=(meals||[]).filter(x=>x.date===date);
 return chosen.reduce((a,meal)=>{
  const t=mealTotals(meal);a.meals++;
  for(const k of Object.keys(t))a[k]+=t[k];
  return a;
 },{meals:0,kcal:0,proteinG:0,carbsG:0,fatG:0});
}
export function validWater(x){
 return !!x&&typeof x.id==='string'&&x.id.length>0&&x.id.length<=128
 &&validISO(x.date)&&reasonable(x.ml,10,5000)
 &&(!x.time||/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(x.time));
}
export function dailyWater(entries,date){
 return (entries||[]).filter(x=>x.date===date).reduce((total,x)=>total+x.ml,0);
}
/** Public food-label query by product barcode; no user photos, notes, email or token are sent. */
export async function lookupOpenFoodFacts(barcode,fetchImpl=(...args)=>globalThis.fetch(...args)){
 const code=String(barcode??'').trim();
 if(!/^[0-9]{8,14}$/.test(code))throw new Error('Informe um código de barras com 8 a 14 dígitos.');
 const endpoint='https://world.openfoodfacts.org/api/v2/product/'+code+
 '?fields=product_name,product_name_pt,nutriments,code';
 let response;
 try{response=await fetchImpl(endpoint,{headers:{Accept:'application/json'}})}
 catch{throw new Error('Não foi possível consultar a base pública de alimentos. Preencha os nutrientes manualmente.')}
 if(!response.ok)throw new Error('A consulta de alimentos está indisponível (HTTP '+response.status+').');
 let payload;
 try{payload=await response.json()}catch{throw new Error('O serviço retornou dados inválidos.')}
 if(payload.status!==1||!payload.product)throw new Error('Produto não encontrado. Use o rótulo ou uma tabela nutricional.');
 const p=payload.product,n=p.nutriments||{};
 const num=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0?value:null;
 let kcal=num(n['energy-kcal_100g']);
 if(kcal===null){
  const kj=num(n['energy-kj_100g']);
  if(kj!==null)kcal=rounded(kj/4.184);
 }
 const name=String(p.product_name_pt||p.product_name||'').trim();
 if(!name||kcal===null||kcal>1000)throw new Error('O produto não possui nome e energia por 100 g confiáveis. Preencha pelo rótulo.');
 const food={name:name.slice(0,120),grams:100,kcalPer100:rounded(kcal),
  proteinPer100:num(n.proteins_100g),
  carbsPer100:num(n.carbohydrates_100g),
  fatPer100:num(n.fat_100g),source:'Open Food Facts',barcode:code};
 if(!validMealFood(food))throw new Error('Informações nutricionais incompletas ou inconsistentes.');
 return food;
}
