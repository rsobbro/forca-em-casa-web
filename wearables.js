import {validISO,ACTIVITY_TYPES} from './activities.js';
/** Offline CSV import from smartwatch companion apps or manual export.
 * Never claims browser-native Health Connect/Apple Health permissions.
 * Template columns (semicolon): data;atividade;duracao_min;distancia_km;calorias_kcal;fc_media;fc_max;passos
 */
const first=(row,names)=>{for(const name of names)if(row[name]!==undefined&&row[name]!=='')return row[name];return ''};
function parseCsv(content){
 const source=String(content||'').replace(/^\ufeff/,'').trim();
 if(!source||source.length>2*1024*1024)throw new Error('Arquivo CSV vazio ou superior a 2 MB.');
 const lines=source.split(/\r?\n/).filter(x=>x.trim());
 if(lines.length<2||lines.length>5001)throw new Error('CSV precisa de cabeçalho e até 5.000 atividades.');
 const delimiter=(lines[0].match(/;/g)||[]).length>(lines[0].match(/,/g)||[]).length?';':',';
 const split=line=>{
  const cells=[];let value='',quoted=false;
  for(let i=0;i<line.length;i++){
   const char=line[i];
   if(char==='"'){if(quoted&&line[i+1]==='"'){value+='"';i++}else quoted=!quoted}
   else if(char===delimiter&&!quoted){cells.push(value.trim());value=''}
   else value+=char;
  }
  if(quoted)throw new Error('CSV com aspas não fechadas.');
  cells.push(value.trim());
  return cells;
 };
 const headers=split(lines[0]).map(x=>x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_]/g,'_'));
 const rows=[];
 for(const line of lines.slice(1)){
  const cells=split(line);
  if(cells.length!==headers.length)throw new Error('CSV com quantidade de colunas incompatível.');
  rows.push(Object.fromEntries(headers.map((h,i)=>[h,cells[i]])));
 }
 return rows;
}
const number=(value)=>{const v=String(value??'').trim().replace(',','.');return v===''?null:Number(v)};
function stableId(value){
 let hash=2166136261;
 for(const char of value){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619)}
 return 'smart-'+(hash>>>0).toString(36);
}
export function importWatchCsv(csv){
 const rows=parseCsv(csv),seen=new Set(),output=[];
 for(const row of rows){
  const date=first(row,['data','date']),kind=first(row,['atividade','tipo','activity','type']).toLowerCase();
  const type=kind==='bike'||kind==='cycling'||kind==='bicicleta'?'ciclismo':kind==='walking'?'caminhada':kind==='running'?'corrida':kind==='swimming'?'natacao':kind==='karate'?'karate':kind;
  if(!validISO(date)||!ACTIVITY_TYPES.some(x=>x.id===type))throw new Error('Data ou atividade não reconhecida na linha '+(output.length+2)+'.');
  const durationMin=number(first(row,['duracao_min','duracao','minutes','duration_min']));
  if(!Number.isInteger(durationMin)||durationMin<1||durationMin>1440)throw new Error('Duração inválida na linha '+(output.length+2)+'.');
  const distanceKm=number(first(row,['distancia_km','distance_km','km']));
  const caloriesKcal=number(first(row,['calorias_kcal','calorias','calories','kcal']));
  const heartRateAvg=number(first(row,['fc_media','heart_rate_avg','avg_hr']));
  const heartRateMax=number(first(row,['fc_max','heart_rate_max','max_hr']));
  const steps=number(first(row,['passos','steps']));
  if(distanceKm!==null&&(distanceKm<0||distanceKm>1000)||
   caloriesKcal!==null&&(caloriesKcal<0||caloriesKcal>10000)||
   heartRateAvg!==null&&(heartRateAvg<30||heartRateAvg>250)||
   heartRateMax!==null&&(heartRateMax<30||heartRateMax>250)||
   steps!==null&&(!Number.isInteger(steps)||steps<0||steps>1000000))
   throw new Error('Métrica incompatível na linha '+(output.length+2)+'.');
  if(heartRateAvg!==null&&heartRateMax!==null&&heartRateAvg>heartRateMax)
   throw new Error('FC média maior que FC máxima na linha '+(output.length+2)+'.');
  const fingerprint=[date,type,durationMin,distanceKm,caloriesKcal,heartRateAvg,heartRateMax,steps].join('|');
  const id=stableId(fingerprint);
  if(seen.has(id))continue;seen.add(id);
  output.push({id,type,date,durationMin,distanceKm,intensity:'Moderada',
   notes:'Importado de CSV do relógio/app · conferir métricas',
   source:'smartwatch-csv',caloriesKcal,heartRateAvg,heartRateMax,steps});
 }
 return output;
}
export const SMARTWATCH_CSV_TEMPLATE='data;atividade;duracao_min;distancia_km;calorias_kcal;fc_media;fc_max;passos\n2026-11-23;corrida;35;5,1;320;135;164;6300\n';
