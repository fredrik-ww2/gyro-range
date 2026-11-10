// Vilken träff en kula ska visa. Mark ger dammpuff, vägg ett kulhål, metall gnistor.
// Hög normal räknas som mark även om ytan inte är märkt, så ett skott i backen dammar.
export function traffSlag(yta, normalY=0){
 if(yta==='mark'||yta==='sand'||normalY>0.72)return 'mark';
 if(yta==='metall')return 'metall';
 if(yta==='vagg')return 'vagg';
 return 'annat';
}
