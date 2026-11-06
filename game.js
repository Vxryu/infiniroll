/* InfiniRoll — shared game logic (browser + Node) */
// ---------- NUMBER GENERATION ----------
// 1..999 999 uniformes ; 0 et 1 000 000 ultra rares
const P_MILLION=1e-8, P_ZERO=4e-8;
function genNumber(){
  const r=Math.random();
  if(r<P_MILLION)return 1000000;
  if(r<P_MILLION+P_ZERO)return 0;
  return 1+Math.floor(Math.random()*999999);
}

// ---------- HELPERS ----------
const rev=s=>s.split("").reverse().join("");
function isPrime(n){if(n<2)return false;if(n%2===0)return n===2;if(n%3===0)return n===3;for(let i=5;i*i<=n;i+=6)if(n%i===0||n%(i+2)===0)return false;return true}
function isPow(n,k){if(n<0)return false;const r=Math.round(Math.pow(n,1/k));for(let m=Math.max(0,r-1);m<=r+1;m++)if(Math.pow(m,k)===n)return true;return false}
function powersOf(b,max=1000001){const S=new Set();for(let p=1;p<=max;p*=b)S.add(p);return S}
const P2=powersOf(2),P3=powersOf(3),P5=powersOf(5),P7=powersOf(7);
const FIB=new Set([0,1]);{let a=1,b=2;while(b<=1000000){FIB.add(b);[a,b]=[b,a+b]}}
const FACT=new Set([1,2,6,24,120,720,5040,40320,362880]);
const OURO=new Set([1,4,27,256,3125,46656,823543]);
const PRONIC=new Set();for(let m=0;m*(m+1)<=1000000;m++)PRONIC.add(m*(m+1));
const dsum=s=>{let t=0;for(const c of s)t+=+c;return t};
const dprod=s=>{let t=1;for(const c of s)t*=+c;return t};
const counts=s=>{const c=Array(10).fill(0);for(const ch of s)c[+ch]++;return c};
const markRange=(s,from,len,v=1)=>{const m=Array(s.length).fill(0);for(let i=from;i<from+len;i++)m[i]=v;return m};
const contains=t=>s=>{const i=s.indexOf(t);return i>=0?markRange(s,i,t.length):false};
const ends=t=>s=>s.length>=t.length&&s.endsWith(t)?markRange(s,s.length-t.length,t.length):false;
const exact=(...v)=>{const S=new Set(v);return (s,n)=>S.has(n)};
const partsMark=lens=>{const m=[];lens.forEach((l,i)=>{for(let j=0;j<l;j++)m.push(i%2?2:1)});return m};
const runRe=k=>new RegExp(`(\\d)\\1{${k-1}}`);
const contRun=k=>s=>{const m=runRe(k).exec(s);return m?markRange(s,m.index,k):false};
function okNum(str){return str.length>0&&(str.length===1||str[0]!=="0")}
// sequence of consecutive digits inside s (asc or desc) of length k
function digitSeq(s,k){for(let i=0;i+k<=s.length;i++){let up=true,dn=true;for(let j=1;j<k;j++){const d=s[i+j]-s[i+j-1];if(d!==1)up=false;if(d!==-1)dn=false}if(up||dn)return markRange(s,i,k)}return false}
// whole s = concatenation of k consecutive ints in order (ascending)
function consecOrdered(s,k){
  for(let l=1;l<=s.length;l++){const a0=s.slice(0,l);if(!okNum(a0))continue;const a=+a0;let str="",lens=[];
    for(let j=0;j<k;j++){const p=String(a+j);str+=p;lens.push(p.length);if(str.length>s.length)break}
    if(str===s)return partsMark(lens)}
  return false}
// whole s = concat of k consecutive ints in any order (but not ascending order)
function consecScrambled(s,k){
  const tried=new Set();
  for(let i=0;i<s.length;i++)for(let l=1;l<=3&&i+l<=s.length;l++){const v0=s.slice(i,i+l);if(!okNum(v0))continue;const v=+v0;
    for(let a=Math.max(0,v-k+1);a<=v;a++){if(tried.has(a))continue;tried.add(a);
      const parts=[];for(let j=0;j<k;j++)parts.push(String(a+j));
      if(parts.join("").length!==s.length||a+k-1<10)continue;
      const lens=[];
      const used=Array(k).fill(false);
      const bt=pos=>{if(pos===s.length)return true;for(let j=0;j<k;j++)if(!used[j]&&s.startsWith(parts[j],pos)){used[j]=true;lens.push(parts[j].length);if(bt(pos+parts[j].length))return true;used[j]=false;lens.pop()}return false};
      if(bt(0)&&parts.join("")!==s)return partsMark(lens)}}
  return false}
// substring of s = concat of k consecutive ints in order (ascending), containing at least one multi-digit
function consecContains(s,k,needMulti){
  for(let i=0;i<s.length;i++)for(let l=1;l<=3&&i+l<=s.length;l++){const a0=s.slice(i,i+l);if(!okNum(a0))continue;const a=+a0;
    let str="",lens=[];for(let j=0;j<k;j++){const p=String(a+j);str+=p;lens.push(p.length)}
    if(needMulti&&str.length===k)continue;
    if(s.startsWith(str,i)){const m=Array(s.length).fill(0);let pos=i;lens.forEach((L,idx)=>{for(let q=0;q<L;q++)m[pos++]=idx%2?2:1});return m}}
  return false}
// two consecutive numbers (a, a±1) adjacent anywhere, at least one multi-digit
function twoConsecAdj(s){
  for(let i=0;i<s.length;i++)for(let l1=1;l1<=3;l1++)for(let l2=1;l2<=3;l2++){
    if(l1===1&&l2===1)continue;if(i+l1+l2>s.length)continue;
    const A=s.slice(i,i+l1),B=s.slice(i+l1,i+l1+l2);if(!okNum(A)||!okNum(B))continue;
    if(Math.abs(+A-+B)===1){const m=Array(s.length).fill(0);for(let q=0;q<l1;q++)m[i+q]=1;for(let q=0;q<l2;q++)m[i+l1+q]=2;return m}}
  return false}
function twoConsecNear(s){
  for(let i=0;i<s.length;i++)for(let l1=1;l1<=3;l1++){if(i+l1>s.length)continue;const A=s.slice(i,i+l1);if(!okNum(A))continue;
    for(let j=i+l1+1;j<s.length;j++)for(let l2=1;l2<=3;l2++){if(l1===1&&l2===1)continue;if(j+l2>s.length)continue;
      const B=s.slice(j,j+l2);if(!okNum(B))continue;
      if(Math.abs(+A-+B)===1){const m=Array(s.length).fill(0);for(let q=0;q<l1;q++)m[i+q]=1;for(let q=0;q<l2;q++)m[j+q]=2;return m}}}
  return false}
// split whole s into >=3 parts (1..3 digits) forming arithmetic / geometric sequence
function seqSplit(s,kind){
  for(let l1=1;l1<=3;l1++)for(let l2=1;l2<=3;l2++){
    const A=s.slice(0,l1),B=s.slice(l1,l1+l2);if(l1+l2>=s.length)continue;if(!okNum(A)||!okNum(B))continue;
    let a=+A,b=+B;if(kind==="geo"){if(a===0||b<=a)continue}else if(a===b)continue;
    let pos=l1+l2,lens=[l1,l2],prev=a,cur=b,ok=true;
    while(pos<s.length){let nx;if(kind==="geo"){if((cur*cur)%prev){ok=false;break}nx=cur*cur/prev}else nx=2*cur-prev;
      if(nx<0||nx>999){ok=false;break}const p=String(nx);if(!s.startsWith(p,pos)){ok=false;break}lens.push(p.length);pos+=p.length;prev=cur;cur=nx}
    if(ok&&lens.length>=3)return partsMark(lens)}
  return false}
function equation(s){
  const L=s.length;if(L<3)return false;
  const ops=[(a,b)=>a+b,(a,b)=>a-b,(a,b)=>a*b,(a,b)=>b!==0&&a%b===0?a/b:NaN];
  for(let i=1;i<L-1;i++)for(let j=i+1;j<L;j++){
    const A=s.slice(0,i),B=s.slice(i,j),C=s.slice(j);if(!okNum(A)||!okNum(B)||!okNum(C))continue;
    const a=+A,b=+B,c=+C;
    for(const op of ops){if(op(a,b)===c)return partsMark([i,j-i,L-j])}}
  return false}
// digit-multiset of k>=3 consecutive integers
const SCR=new Set();
for(let k=3;k<=7;k++)for(let a=0;a<=999;a++){if(a+k-1<10)continue;let str="";for(let j=0;j<k;j++)str+=String(a+j);if(str.length>7)break;SCR.add(str.split("").sort().join(""))}
const sortd=t=>t.split("").sort().join("");
function peak(s,dir,strict){
  if(s.length<3)return false;const d=[];for(let i=1;i<s.length;i++)d.push(dir*(s[i]-s[i-1]));
  let i=0;const up=x=>strict?x>0:x>=0,dn=x=>strict?x<0:x<=0;
  let rises=0;while(i<d.length&&up(d[i])){if(d[i]>0)rises++;i++}
  if(i===d.length||rises===0)return false;
  let falls=0;while(i<d.length&&dn(d[i])){if(d[i]<0)falls++;i++}
  return i===d.length&&falls>0;
}
function zigzag(s,strict){
  if(s.length<3)return false;const d=[];for(let i=1;i<s.length;i++)d.push(s[i]-s[i-1]);
  for(const start of [1,-1]){let ok=true;for(let i=0;i<d.length;i++){const sg=i%2?-start:start;if(strict?!(sg*d[i]>0):!(sg*d[i]>=0)){ok=false;break}}if(ok&&(!strict?d.some(x=>x!==0):true))return true}
  return false}
const mono=(s,cmp)=>{if(s.length<2)return false;for(let i=1;i<s.length;i++)if(!cmp(+s[i],+s[i-1]))return false;return true};
const STROB={0:"0",1:"1",6:"9",8:"8",9:"6"};
const NAMES_ZERO_NINE=["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];
const ELEM=["Hydrogen","Helium","Lithium","Beryllium","Boron","Carbon","Nitrogen","Oxygen","Fluorine"];

// ---------- BADGES (liste du wiki RNGdle FR) ----------
const BADGES=[];
function add(id,icon,name,desc,test){BADGES.push({id,icon,name,desc,test})}
const ALLM=s=>Array(s.length).fill(1);

// Mythique — nombres exacts
NAMES_ZERO_NINE.forEach((nm,k)=>add("d"+k,"🔢",nm,`The number ${["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"][k]}.`,exact(k)));
const EXACTS=[["42","🌌","Exact Meaning"],["67","🤸","Exact Six-Seven"],["69","😏","Exact Nice"],["86","🚪","Exact Eighty-Six"],["101","🎓","Exact Orientation"],["365","📆","Exact Calendar"],["404","🚫","Not Found"],["420","🌿","Exact Botanist"],["666","😈","Exact Devil"],["777","🎰","Exact Jackpot"],["911","🚨","Exact Emergency"],["1337","👾","Exact Leet"],["1984","👁️","Orwellian"],["7734","🔥","Exact Hell"],["17776","🏈","17776"],["80085","🍈","Exact 80085"],["86400","🕛","Full Day"],["365365","🦫","Groundhog Day"],["420420","💨","Hotbox"],["424242","🌌","Universal Answer"],["666666","👹","Infernal"],["676767","🧠","Brainrot"],["696969","😏","Very Very Nice"],["777777","🎰","Jackpot Six"],["911911","🆘","Mayday"],["1000000","💎","The fabled one million"]];
EXACTS.forEach(([v,ic,nm])=>add("x"+v,ic,nm,`Exactly ${Number(v).toLocaleString("en-US")}.`,exact(+v)));
add("boob","🍈","Exact Boob","Exactly 8008 or 58008.",exact(8008,58008));
add("funnynum","🤡","Funny Number","Exactly 42069 or 69420.",exact(42069,69420));
add("always","♾️","Always","Exactly 247365 or 365247 (24/7/365).",exact(247365,365247));
add("golden","🌻","Golden Ratio","The first digits of the Golden Ratio (1618, 16180, 161803).",exact(1618,16180,161803));
add("tau","⭕","Tau","The first digits of Tau (6283, 62831, 628318).",exact(6283,62831,628318));
[13,17,19,10,11,9,8,7,6,5,4,3,2].forEach(k=>{
  const sup={2:"nd",3:"rd"}[k]||"th";
  add("pw"+k,"⚡",`${k}${sup} Power`,`A number of the form n^${k}.`,(s,n)=>isPow(n,k));
});
add("pi","🥧","Pi","The first digits of Pi (314, 3141, 31415, 314159).",exact(314,3141,31415,314159));
add("euler","📐","Euler's Number","The first digits of e (271, 2718, 27182, 271828).",exact(271,2718,27182,271828));
add("c4","🔗","4 Consecutive Numbers","Four consecutive integers concatenated in order.",s=>consecOrdered(s,4));
add("ouro","🐍","Ouroboros","A number of the form n^n.",exact(...OURO));
add("pow7","7️⃣","Power of Seven","A power of 7.",(s,n)=>P7.has(n));
add("pow5","5️⃣","Power of Five","A power of 5.",(s,n)=>P5.has(n));
add("fact","❗","Factorial","A factorial n!.",exact(...FACT));
add("hello","👋","Hello","Contains \"07734\".",contains("07734"));
add("seq6","🪜","Sequence (6)","Six consecutive digits (e.g. 123456).",s=>s.length===6&&digitSeq(s,6));
add("six6","6️⃣","Contiguous Sixes","The same digit six times.",contRun(6));
add("void5","🕳️","Deep Void (5)","Contains \"00000\".",contains("00000"));
add("eon","🌋","Eon","Ends in \"00000\".",ends("00000"));
add("semieon","🌋","Semi-Eon","Ends in \"50000\".",ends("50000"));
add("q9","9️⃣","Quint Nine","Ends in \"99999\".",ends("99999"));
add("single","☝️","Single Digit","Only one digit.",s=>s.length===1);
// Anomalie
add("pow3","3️⃣","Power of Three","A power of 3.",(s,n)=>P3.has(n));
add("pow2","💾","Power of Two","A power of 2.",(s,n)=>P2.has(n));
add("jack5","🎰","Jackpot Five","Contains \"77777\".",contains("77777"));
add("e5","📐","E Slice (5)","Contains \"27182\".",contains("27182"));
add("pi5","🥧","Pi Slice (5)","Contains \"31415\".",contains("31415"));
add("tau5","⭕","Tau Slice (5)","Contains \"62831\".",contains("62831"));
add("royal","🃏","Royal Flush","Contains \"56789\".",contains("56789"));
add("s58008","🍈","58008","Contains \"58008\".",contains("58008"));
add("s80085","🍈","80085","Contains \"80085\".",contains("80085"));
add("cascade","🌊","Cascade","Each digit is the previous one +1.",s=>s.length>=2&&mono(s,(a,b)=>a===b+1));
add("fib","🐚","Fibonacci Number","Part of the Fibonacci sequence.",(s,n)=>FIB.has(n));
add("waterfall","💧","Waterfall","Each digit is the previous one −1.",s=>s.length>=2&&mono(s,(a,b)=>a===b-1));
add("c4c","🔗","4 Consecutive Numbers (Contains)","Contains 4 consecutive integers concatenated in order (at least one multi-digit).",s=>consecContains(s,4,true));
add("c4s","🔀","4 Consecutive Numbers (Scrambled)","4 consecutive integers concatenated out of order.",s=>consecScrambled(s,4));
add("homog","👯","Homogeneous","All digits are the same.",s=>s.length>=2&&/^(\d)\1+$/.test(s));
add("funnys","🤡","Funny numbers","Contains \"69\" and \"420\".",s=>{const i=s.indexOf("69"),j=s.indexOf("420");if(i<0||j<0)return false;const m=markRange(s,j,3);m[i]=m[i+1]=2;return m});
add("binary","🤖","Binary Soul","Only 0s and 1s.",s=>/^[01]+$/.test(s));
add("sflush","🂡","Straight Flush","Contains 02468, 13579, 86420 or 97531.",s=>{for(const t of ["02468","13579","86420","97531"]){const i=s.indexOf(t);if(i>=0)return markRange(s,i,5)}return false});
add("len2","🔢","Two Digits","Exactly two digits.",s=>s.length===2);
add("spy","🕵️","Spy Number","Sum of digits = product of digits.",s=>s.length>=2&&dsum(s)===dprod(s));
add("epoch","🦕","Epoch","Ends in \"0000\".",ends("0000"));
add("semiepoch","🦕","Semi-Epoch","Ends in \"5000\".",ends("5000"));
add("quad9","9️⃣","Quad Nine","Ends in \"9999\".",ends("9999"));
// Épique
add("evensp","📏","Even Spacing","Digits form an arithmetic sequence (e.g. 369).",s=>{if(s.length<3)return false;const d=s[1]-s[0];if(d===0)return false;for(let i=2;i<s.length;i++)if(s[i]-s[i-1]!==d)return false;return true});
add("c3","🔗","3 Consecutive Numbers","Three consecutive integers concatenated in order.",s=>consecOrdered(s,3));
add("five5","5️⃣","Contiguous Fives","Five identical digits in a row.",contRun(5));
add("void4","🕳️","Deep Void (4)","Contains \"0000\".",contains("0000"));
add("strobo","🙃","Strobogrammatic","Looks the same rotated 180° (e.g. 609).",s=>{if(s.length<2)return false;let r="";for(let i=s.length-1;i>=0;i--){const m=STROB[s[i]];if(m===undefined)return false;r+=m}return r===s});
add("straight","🃏","Straight","Contains 5 consecutive digits (up or down).",s=>digitSeq(s,5));
add("jack4","🎰","Jackpot Four","Contains \"7777\".",contains("7777"));
add("s4242","🌌","Deeper Meaning","Contains \"4242\".",contains("4242"));
add("s6767","🤸","6767","Contains \"6767\".",contains("6767"));
add("s6969","😏","Very Nice","Contains \"6969\".",contains("6969"));
add("s1337","👾","Leet","Contains \"1337\".",contains("1337"));
add("s1984","👁️","Big Brother","Contains \"1984\".",contains("1984"));
add("e4","📐","E Slice (4)","Contains \"2718\".",contains("2718"));
add("pi4","🥧","Pi Slice (4)","Contains \"3141\".",contains("3141"));
add("tau4","⭕","Tau Slice (4)","Contains \"6283\".",contains("6283"));
add("s7734","🔥","Hell","Contains \"7734\".",contains("7734"));
add("s8008","🍈","8008","Contains \"8008\".",contains("8008"));
add("c3s","🔀","3 Consecutive Numbers (Scrambled)","3 consecutive integers concatenated out of order.",s=>consecScrambled(s,3));
add("zipper","🤐","Zipper","Two different digits alternating (e.g. 4747).",s=>s.length>=2&&s[0]!==s[1]&&[...s].every((c,i)=>c===s[i%2]));
add("ascen","🚀","Ascension","Each digit is strictly greater than the previous.",s=>mono(s,(a,b)=>a>b));
add("cresc","🎼","Crescendo","Forms a geometric sequence of 3+ terms (e.g. 1248).",s=>seqSplit(s,"geo"));
add("kind5","🖐️","Five of a Kind","Contains the same digit five times.",s=>counts(s).some(c=>c>=5)&&s.split("").map(c=>counts(s)[+c]>=5?1:0));
add("c3c","🔗","3 Consecutive Numbers (Contains)","Contains 3 consecutive integers concatenated in order (at least one multi-digit).",s=>consecContains(s,3,true));
add("c3pair","👥","Contiguous Three Pair","Three contiguous pairs (e.g. 772266).",s=>/^(\d)\1(?!\1)(\d)\2(?!\1|\2)(\d)\3$/.test(s));
add("fpair","🖼️","Framed Pair","A pair framed by two different digits (e.g. 6998).",s=>s.length===4&&s[1]===s[2]&&s[0]!==s[1]&&s[3]!==s[1]&&s[0]!==s[3]);
add("ftriple","🖼️","Framed Triple","A triple framed by two different digits (e.g. 69998).",s=>s.length===5&&/^(\d)(\d)\2\2(\d)$/.test(s)&&s[0]!==s[1]&&s[4]!==s[1]&&s[0]!==s[4]);
add("fquad","🖼️","Framed Quad","A quad framed by two different digits (e.g. 699998).",s=>s.length===6&&/^(\d)(\d)\2\2\2(\d)$/.test(s)&&s[0]!==s[1]&&s[5]!==s[1]&&s[0]!==s[5]);
add("decay","🍂","Decay","Each digit is strictly smaller than the previous.",s=>mono(s,(a,b)=>a<b));
add("len3","🔢","Three Digits","Exactly three digits.",s=>s.length===3);
add("echo","🗣️","Echo","The first half equals the second half (e.g. 587587).",s=>s.length%2===0&&s.slice(0,s.length/2)===s.slice(s.length/2)&&s.split("").map((_,i)=>i<s.length/2?1:2));
add("mill","🏛️","Millennium","Ends in \"000\".",ends("000"));
add("semimill","🏛️","Semi-Millennium","Ends in \"500\".",ends("500"));
add("t9","9️⃣","Triple Nine","Ends in \"999\".",ends("999"));
add("colossal","🏔️","Colossal","Greater than 999,000.",(s,n)=>n>999000);
add("pronic","✖️","Pronic Number","The product of two consecutive integers n×(n+1).",(s,n)=>PRONIC.has(n));
// Rare
add("evenabs","📏","Even Spacing (Absolute)","The gap between neighboring digits is always the same (e.g. 121234).",s=>{if(s.length<3)return false;const d=Math.abs(s[1]-s[0]);if(d===0)return false;for(let i=2;i<s.length;i++)if(Math.abs(s[i]-s[i-1])!==d)return false;return true});
add("firefly","🪲","Firefly","One digit differs, all others identical (e.g. 858888).",s=>{if(s.length<3)return false;const c=counts(s).filter(x=>x>0);if(c.length!==2||Math.min(...c)!==1)return false;const cnt=counts(s);return s.split("").map(ch=>cnt[+ch]===1?1:0)});
add("c2","🔗","2 Consecutive Numbers","Two consecutive integers concatenated (e.g. 1312).",s=>{for(let k=1;k<s.length;k++){const a=s.slice(0,k),b=s.slice(k);if(!okNum(b))continue;if(Math.abs(+a-+b)===1)return partsMark([k,s.length-k])}return false});
add("pal","🪞","Palindrome","Reads the same both ways.",s=>s.length>=2&&s===rev(s));
add("void3","🕳️","Deep Void (3)","Contains \"000\".",contains("000"));
add("quads","4️⃣","Contiguous Quads","Four identical digits in a row.",contRun(4));
add("turtle","🐢","Turtle","Each digit differs by at most 1 from its neighbors.",s=>s.length>=2&&mono(s,(a,b)=>Math.abs(a-b)<=1));
add("s007","🕶️","Secret Agent","Contains \"007\".",contains("007"));
add("heavy","🏋️","Heavy","Digit sum ≥ 45.",s=>dsum(s)>=45);
add("cfull","🏠","Contiguous Full House","A triple next to a pair (e.g. 55444).",s=>{const m=/(\d)\1\1(?!\1)(\d)\2|(\d)\3(?!\3)(\d)\4\4/.exec(s);return m?markRange(s,m.index,5):false});
add("s666","😈","Devil","Contains \"666\".",contains("666"));
add("s777","🎰","Jackpot","Contains \"777\".",contains("777"));
add("seq4","🪜","Sequence (4)","Contains 4 consecutive digits in order.",s=>digitSeq(s,4));
add("s101","🎓","Orientation","Contains \"101\".",contains("101"));
add("s404","🚫","Error 404","Contains \"404\".",contains("404"));
add("e3","📐","E Slice (3)","Contains \"271\".",contains("271"));
add("pi3","🥧","Pi Slice (3)","Contains \"314\".",contains("314"));
add("s365","📆","Calendar","Contains \"365\".",contains("365"));
add("s420","🌿","Botanist","Contains \"420\".",contains("420"));
add("s911","🚨","Emergency","Contains \"911\".",contains("911"));
add("div3","3️⃣","Divisible by 3","Every digit is 0, 3, 6 or 9.",s=>/^[0369]+$/.test(s));
add("scramble","🔀","Scramble","Rearranged, the digits form consecutive numbers (e.g. 810976 → 6 7 8 9 10).",s=>s.length>=3&&SCR.has(sortd(s)));
add("duality","☯️","Duality","Exactly two distinct digits.",s=>counts(s).filter(x=>x>0).length===2);
add("steps","📶","Steps","Each digit is ≥ the previous.",s=>mono(s,(a,b)=>a>=b));
add("metro","🎵","Metronome","Forms an arithmetic sequence of 3+ terms (e.g. 102030).",s=>seqSplit(s,"ari"));
add("fdouble","🖼️","Framed Double","Two contiguous pairs, framed (e.g. 855669).",s=>s.length===6&&s[1]===s[2]&&s[3]===s[4]&&s[1]!==s[3]&&s[0]!==s[1]&&s[5]!==s[3]);
add("slopes","⛷️","Slopes","Each digit is ≤ the previous.",s=>mono(s,(a,b)=>a<=b));
add("pbook","📚","Paired Bookends","Starts with a pair and ends with a pair (e.g. 558966).",s=>{if(s.length<4||s[0]!==s[1]||s[s.length-1]!==s[s.length-2])return false;const m=Array(s.length).fill(0);m[0]=m[1]=1;m[s.length-1]=m[s.length-2]=2;return m});
add("len4","🔢","Four Digits","Exactly four digits.",s=>s.length===4);
add("tpair","👥","Three Pair","Made of three pairs (e.g. 571517).",s=>s.length===6&&counts(s).every(c=>c===0||c===2));
add("book","📖","Bookends","Starts and ends with the same two digits (e.g. 254125).",s=>{if(s.length<4||s.slice(0,2)!==s.slice(-2))return false;const m=Array(s.length).fill(0);m[0]=m[1]=m[s.length-1]=m[s.length-2]=1;return m});
add("mbook","🪞","Mirror Bookends","Starts with two digits and ends with them reversed (e.g. 254152).",s=>{if(s.length<4||s.slice(0,2)!==rev(s.slice(-2)))return false;const m=Array(s.length).fill(0);m[0]=m[1]=m[s.length-1]=m[s.length-2]=1;return m});
add("cent","💯","Century","Ends in \"00\".",ends("00"));
add("qcent","🪙","Quarter-Century","Ends in \"25\".",ends("25"));
add("scent","📅","Semi-Century","Ends in \"50\".",ends("50"));
add("tqcent","🪙","Three-Quarter-Century","Ends in \"75\".",ends("75"));
add("dd9","9️⃣","Double Nine","Ends in \"99\".",ends("99"));
// Singulière
add("kind4","🀄","Four of a Kind","Contains the same digit four times.",s=>{const c=counts(s);return c.some(x=>x>=4)&&s.split("").map(ch=>c[+ch]>=4?1:0)});
add("equation","🟰","Equation","Add one operator and an \"=\" to make a true equation (e.g. 44+12=56).",equation);
add("lowball","🔽","Low Ball","Only digits 0 to 4.",s=>/^[0-4]+$/.test(s));
add("mount","⛰️","Mountain","Strictly rises to a peak, then strictly falls.",s=>peak(s,1,true));
add("dhop","🐇","Double Hop","The same digit every other position (e.g. 343836).",s=>{for(const p of [0,1]){const idx=[];for(let i=p;i<s.length;i+=2)idx.push(i);if(idx.length>=3&&idx.every(i=>s[i]===s[idx[0]])){const m=Array(s.length).fill(0);idx.forEach(i=>m[i]=1);return m}}return false});
add("highroll","🔼","High Roller","Only digits 5 to 9.",s=>/^[5-9]+$/.test(s));
add("valley","🏞️","Valley","Strictly falls to a low point, then strictly rises.",s=>peak(s,-1,true));
add("c2pair","✌️","Contiguous Two Pair","Two contiguous pairs side by side (e.g. 554471).",s=>{const m=/(\d)\1(?!\1)(\d)\2/.exec(s);return m?markRange(s,m.index,4):false});
add("miniecho","🔁","Mini echo","Contains a repeated two-digit chunk (e.g. 407878).",s=>{const m=/(\d\d)\1/.exec(s);return m?markRange(s,m.index,4):false});
add("flush","♠️","Flush","All digits even or all odd.",s=>/^[02468]+$/.test(s)||/^[13579]+$/.test(s));
add("alternator","🔄","Alternator","Digit parity alternates (e.g. 123456).",s=>s.length>=2&&mono(s,(a,b)=>(a%2)!==(b%2)));
add("void2","🕳️","Deep Void","Contains \"00\".",contains("00"));
add("trips","3️⃣","Contiguous Trips","The same digit three times in a row.",contRun(3));
add("feather","🪶","Feather","Digit sum < 15.",s=>dsum(s)<15);
add("blackjack","🂱","Blackjack","Digit sum = 21.",s=>dsum(s)===21);
add("fullhouse","🏠","Full House","Contains a triple and a pair of another digit.",s=>{const c=counts(s);const t=c.findIndex(x=>x>=3);if(t<0)return false;const p=c.findIndex((x,i)=>i!==t&&x>=2);if(p<0)return false;return s.split("").map(ch=>+ch===t?1:+ch===p?2:0)});
add("pocket","🪞","Pocket Mirror","Contains a 4- or 5-digit palindrome.",s=>{for(const L of [5,4])for(let i=0;i+L<=s.length;i++){const t=s.slice(i,i+L);if(t===rev(t))return markRange(s,i,L)}return false});
add("snake","🎲","Snake Eyes","A pair of 1s and no other repeat.",s=>{const c=counts(s);return c[1]===2&&c.every((x,i)=>i===1||x<=1)&&s.split("").map(ch=>ch==="1"?1:0)});
add("s42","🌌","Meaning of Life","Contains \"42\".",contains("42"));
add("s67","🤸","Six-Seven","Contains \"67\".",contains("67"));
add("s69","😏","Nice","Contains \"69\".",contains("69"));
add("s86","🚪","Eighty-Six","Contains \"86\".",contains("86"));
add("balanced","⚖️","Balanced","Sum of first half = sum of second half (4 or 6 digits).",s=>(s.length===4||s.length===6)&&dsum(s.slice(0,s.length/2))===dsum(s.slice(s.length/2))&&s.split("").map((_,i)=>i<s.length/2?1:2));
add("rhyme","🎤","Rhyme","A chunk of 2+ digits appears twice (e.g. 925325).",s=>{for(let L=3;L>=2;L--)for(let i=0;i+L<=s.length;i++){const t=s.slice(i,i+L),j=s.indexOf(t,i+L);if(j>=0){const m=markRange(s,i,L);for(let q=0;q<L;q++)m[j+q]=2;return m}}return false});
add("seq3","🪜","Sequence (3)","Contains 3 consecutive digits in order.",s=>digitSeq(s,3));
add("c2c","🔗","2 Consecutive Numbers (Contains)","Contains two consecutive numbers side by side (at least one multi-digit).",twoConsecAdj);
add("c2n","🔗","2 Consecutive Numbers (Nearby)","Contains two consecutive numbers apart (at least one multi-digit).",twoConsecNear);
add("mesa","🏜️","Mesa","Rises (non-strict) to a peak, then falls (non-strict).",s=>peak(s,1,false));
add("prime","🔮","Prime Number","Only divisible by 1 and itself.",(s,n)=>isPrime(n));
add("trinity","🔺","Trinity","Exactly three distinct digits.",s=>counts(s).filter(x=>x>0).length===3);
add("dozen","🥚","Dozen","Divisible by 12.",(s,n)=>n>0&&n%12===0);
add("canyon","🏜️","Canyon","Falls (non-strict) to a low point, then rises (non-strict).",s=>peak(s,-1,false));
add("len5","🔢","Five Digits","Exactly five digits.",s=>s.length===5);
add("eleven","⚽","Eleven","Divisible by 11.",(s,n)=>n>0&&n%11===0);
add("harshad","➗","Harshad Number","Divisible by the sum of its digits.",(s,n)=>n>0&&n%dsum(s)===0);
add("equil","⚖️","Equilibrium","First and last digits are the same.",s=>{if(s.length<2||s[0]!==s[s.length-1])return false;const m=Array(s.length).fill(0);m[0]=m[s.length-1]=1;return m});
add("sandwich","🥪","Sandwich","First and last digits match, with other digits in between.",s=>{if(s.length<3||s[0]!==s[s.length-1])return false;const m=Array(s.length).fill(2);m[0]=m[s.length-1]=1;return m});
add("clean","🧽","Clean","Ends in 0.",s=>s.length>=2&&s.endsWith("0")&&markRange(s,s.length-1,1));
add("semiclean","🧼","Semi-Clean","Ends in 5.",s=>s.endsWith("5")&&markRange(s,s.length-1,1));
// Commune
add("hills","🌄","Hills","Strictly alternates up and down (e.g. 274815).",s=>zigzag(s,true));
add("kind3","3️⃣","Three of a Kind","Contains the same digit three times.",s=>{const c=counts(s);return c.some(x=>x>=3)&&s.split("").map(ch=>c[+ch]>=3?1:0)});
add("div7","🍀","Lucky Seven (divisible)","Divisible by 7.",(s,n)=>n>0&&n%7===0);
add("hetero","🌈","Heterogeneous","All digits are unique.",s=>s.length>=2&&new Set(s).size===s.length);
add("miniscr","🔀","Mini Scramble","Contains 3–5 digits that, rearranged, form consecutive numbers.",s=>{for(let L=5;L>=3;L--)for(let i=0;i+L<=s.length;i++)if(SCR.has(sortd(s.slice(i,i+L))))return markRange(s,i,L);return false});
add("gap1","↔️","Gap One","First and last digits differ by 1.",s=>{if(s.length<2||Math.abs(s[0]-s[s.length-1])!==1)return false;const m=Array(s.length).fill(0);m[0]=m[s.length-1]=1;return m});
add("twopair","✌️","Two Pair","Two pairs of digits (not necessarily adjacent).",s=>{const c=counts(s);const ps=c.map((x,i)=>x>=2?i:-1).filter(i=>i>=0);if(ps.length<2)return false;return s.split("").map(ch=>+ch===ps[0]?1:+ch===ps[1]?2:0)});
add("dunes","🏜️","Dunes","Alternates up and down (non-strict).",s=>zigzag(s,false));
add("hopscotch","🦘","Hopscotch","The same digit appears two positions apart.",s=>{for(let i=0;i+2<s.length;i++)if(s[i]===s[i+2]){const m=Array(s.length).fill(0);m[i]=m[i+2]=1;return m}return false});
add("ghost","👻","Ghost","Contains exactly one 0.",s=>counts(s)[0]===1&&s.split("").map(c=>c==="0"?1:0));
add("quartet","🎻","Quartet","Exactly four distinct digits.",s=>counts(s).filter(x=>x>0).length===4);
ELEM.forEach((nm,i)=>add("el"+(i+1),"⚗️",nm,`Contains exactly one ${i+1}.`,s=>counts(s)[i+1]===1&&s.split("").map(c=>+c===i+1?1:0)));
add("grounded","🛬","Grounded","The first digit is smaller than the last.",s=>{if(s.length<2||!(+s[0]<+s[s.length-1]))return false;const m=Array(s.length).fill(0);m[0]=m[s.length-1]=1;return m});
add("cpair","👟","Contiguous Pair","Two identical digits side by side.",contRun(2));
add("lucky7","🍀","Lucky Seven","Contains at least one 7.",s=>s.includes("7")&&s.split("").map(c=>c==="7"?1:0));
add("liftoff","🛫","Liftoff","The first digit is greater than the last.",s=>{if(s.length<2||!(+s[0]>+s[s.length-1]))return false;const m=Array(s.length).fill(0);m[0]=m[s.length-1]=1;return m});
add("odd","1️⃣","Odd","Is odd.",(s,n)=>n%2===1&&markRange(s,s.length-1,1));
add("even","2️⃣","Even","Is even.",(s,n)=>n%2===0&&markRange(s,s.length-1,1));
add("void","🫥","Void","Contains no 0.",s=>!s.includes("0"));
add("neighbors","🏘️","Neighbors","Contains two consecutive digits (not necessarily adjacent).",s=>{const c=counts(s);for(let d=0;d<9;d++)if(c[d]&&c[d+1])return s.split("").map(ch=>+ch===d?1:+ch===d+1?2:0);return false});
add("pair","👫","Pair","Contains the same digit twice.",s=>{const c=counts(s);return c.some(x=>x>=2)&&s.split("").map(ch=>c[+ch]>=2?1:0)});
add("len6","🔢","Six Digits","Exactly six digits.",s=>s.length===6);

function evaluate(n){
  const s=String(n),out=[];
  for(const b of BADGES){let m=b.test(s,n);if(m){if(m===true)m=ALLM(s);out.push({b,m})}}
  return out;
}
// ---------- PROBABILITÉS EXACTES (pré-calculées sur 0 → 1 000 000) ----------
const PROB={"d0":4e-8,"d1":0.000001,"d2":0.000001,"d3":0.000001,"d4":0.000001,"d5":0.000001,"d6":0.000001,"d7":0.000001,"d8":0.000001,"d9":0.000001,"x42":0.000001,"x67":0.000001,"x69":0.000001,"x86":0.000001,"x101":0.000001,"x365":0.000001,"x404":0.000001,"x420":0.000001,"x666":0.000001,"x777":0.000001,"x911":0.000001,"x1337":0.000001,"x1984":0.000001,"x7734":0.000001,"x17776":0.000001,"x80085":0.000001,"x86400":0.000001,"x365365":0.000001,"x420420":0.000001,"x424242":0.000001,"x666666":0.000001,"x676767":0.000001,"x696969":0.000001,"x777777":0.000001,"x911911":0.000001,"x1000000":1e-8,"boob":0.000002,"funnynum":0.000002,"always":0.000002,"golden":0.000003,"tau":0.000003,"pw13":0.00000204,"pw17":0.00000204,"pw19":0.00000204,"pw10":0.00000304,"pw11":0.00000304,"pw9":0.00000404,"pw8":0.00000504,"pw7":0.00000704,"pw6":0.00000905,"pw5":0.00001504,"pw4":0.00003104,"pw3":0.00009905,"pw2":0.00099905,"pi":0.000004,"euler":0.000004,"c4":0.000008,"ouro":0.000007,"pow7":0.000008,"pow5":0.000009,"fact":0.000009,"hello":0.000009,"seq6":0.000009,"six6":0.00000901,"void5":0.00000901,"eon":0.00000901,"semieon":0.00001,"q9":0.00001,"single":0.00000904,"pow3":0.000013,"pow2":0.00002,"jack5":0.000019,"e5":0.00002,"pi5":0.00002,"tau5":0.00002,"royal":0.00002,"s58008":0.00002,"s80085":0.00002,"cascade":0.00003,"fib":0.00002904,"waterfall":0.000035,"c4c":0.000021,"c4s":0.000046,"homog":0.000045,"funnys":0.00006,"binary":0.00006305,"sflush":0.000069,"len2":0.00009,"spy":0.000089,"epoch":0.00009901,"semiepoch":0.0001,"quad9":0.0001,"evensp":0.00008,"c3":0.000097,"five5":0.00018001,"void4":0.00018001,"strobo":0.000196,"straight":0.00022,"jack4":0.00028,"s4242":0.000299,"s6767":0.000299,"s6969":0.000299,"s1337":0.0003,"s1984":0.0003,"e4":0.0003,"pi4":0.0003,"tau4":0.0003,"s7734":0.0003,"s8008":0.0003,"c3s":0.00045,"zipper":0.000405,"ascen":0.000456,"cresc":0.00024,"kind5":0.00050401,"c3c":0.000407,"c3pair":0.000648,"fpair":0.000648,"ftriple":0.000648,"fquad":0.000648,"decay":0.000837,"len3":0.0009,"echo":0.000999,"mill":0.00099901,"semimill":0.001,"t9":0.001,"colossal":0.00099901,"pronic":0.00099904,"evenabs":0.001063,"firefly":0.001458,"c2":0.001997,"pal":0.001989,"void3":0.0027,"quads":0.0027,"turtle":0.002773,"s007":0.002889,"heavy":0.005005,"cfull":0.003321,"s666":0.0037,"s777":0.0037,"seq4":0.00386,"s101":0.003979,"s404":0.003979,"e3":0.003999,"pi3":0.003999,"s365":0.003999,"s420":0.003999,"s911":0.003999,"div3":0.004095,"scramble":0.0113,"duality":0.004617,"steps":0.004995,"metro":0.005847,"fdouble":0.006561,"slopes":0.007992,"pbook":0.00999,"len4":0.009,"tpair":0.00972,"book":0.00999,"mbook":0.00999,"cent":0.009999,"qcent":0.01,"scent":0.01,"tqcent":0.01,"dd9":0.01,"kind4":0.011853,"equation":0.023082,"lowball":0.015624,"mount":0.016992,"dhop":0.01881,"highroll":0.01953,"valley":0.023817,"c2pair":0.025272,"miniecho":0.027,"flush":0.035154,"alternator":0.035145,"void2":0.035919,"trips":0.035919,"feather":0.037499,"blackjack":0.039662,"fullhouse":0.041715,"pocket":0.047088,"snake":0.047139,"s42":0.049401,"s67":0.049401,"s69":0.049401,"s86":0.049401,"balanced":0.051027,"rhyme":0.053406,"seq3":0.058287,"c2c":0.062137,"c2n":0.063491,"mesa":0.063762,"prime":0.078498,"trinity":0.079056,"dozen":0.083333,"canyon":0.084432,"len5":0.09,"eleven":0.090909,"harshad":0.095427,"equil":0.099999,"sandwich":0.09999,"clean":0.099999,"semiclean":0.1,"hills":0.13695,"kind3":0.14989,"div7":0.14286,"hetero":0.16856,"miniscr":0.0076,"gap1":0.18889,"twopair":0.26552,"dunes":0.24411,"hopscotch":0.3357,"ghost":0.32385,"quartet":0.34474,"el1":0.35429,"el2":0.35429,"el3":0.35429,"el4":0.35429,"el5":0.35429,"el6":0.35429,"el7":0.35429,"el8":0.35429,"el9":0.35429,"grounded":0.4,"cpair":0.40213,"lucky7":0.46856,"liftoff":0.5,"odd":0.5,"even":0.5,"void":0.59787,"neighbors":0.89611,"pair":0.83143,"len6":0.9};
const PCT_TABLE=[[10049829829,1e-8],[2809904744,5e-8],[471481507,0.00000105],[130731439,0.00000205],[130461241,0.00000305],[125631068,0.00000405],[123576345,0.00000505],[122309787,0.00000605],[122236967,0.00000705],[120527278,0.00000805],[120048174,0.00000905],[118890985,0.00001005],[114452085,0.00001105],[105345466,0.00001205],[105054930,0.00001305],[102779164,0.00001405],[102519051,0.00001505],[102498065,0.00001605],[102165292,0.00001705],[101750294,0.00001805],[101629077,0.00001905],[101525953,0.00002005],[101291044,0.00002105],[100774404,0.00002205],[100738718,0.00002305],[100643350,0.00002405],[100528340,0.00002505],[100354542,0.00002605],[100351554,0.00002705],[100249315,0.00002805],[100193940,0.00002905],[100170494,0.00003005],[100160388,0.00003105],[100154560,0.00003205],[100144533,0.00003305],[100040667,0.00003405],[55345763,0.00003505],[54034498,0.00003605],[54027333,0.00003705],[54024729,0.00003805],[51711386,0.00003905],[51707166,0.00004005],[50952188,0.00004105],[50029296,0.00004205],[50028296,0.00004305],[47340035,0.00004405],[44671887,0.00004505],[42808062,0.00004605],[41914583,0.00004705],[40994675,0.00004805],[40596476,0.00004905],[38670423,0.00005005],[38668718,0.00005105],[37919195,0.00005205],[34290266,0.00005305],[33681576,0.00005405],[33460373,0.00005505],[33353383,0.00005605],[33341296,0.00005705],[33338809,0.00005805],[33120604,0.00005905],[32078633,0.00006005],[30886769,0.00006105],[30873314,0.00006205],[30370241,0.00006305],[30365700,0.00006405],[30364509,0.00006505],[30363727,0.00006605],[28170464,0.00006705],[25655221,0.00006905],[25376527,0.00007105],[25159977,0.00007305],[24874550,0.00007505],[24868150,0.00007705],[24851775,0.00007905],[24843443,0.00008105],[24664757,0.00008305],[23284595,0.00008505],[21914881,0.00008705],[20395778,0.00008905],[19561056,0.00009105],[19153534,0.00009305],[17577660,0.00009505],[17527591,0.00009705],[17521549,0.00009905],[17517703,0.0001011],[16572845,0.0001031],[16571361,0.0001051],[16118147,0.0001071],[15987460,0.0001091],[15985765,0.0001121],[14932117,0.0001141],[14475011,0.0001161],[14404680,0.0001181],[14401733,0.0001201],[14227069,0.0001221],[14162643,0.0001241],[12746035,0.0001261],[12533993,0.0001281],[12100019,0.0001301],[12085461,0.0001321],[12067435,0.0001341],[12058196,0.0001371],[11864816,0.0001401],[11795576,0.0001441],[11786790,0.0001471],[11448697,0.0001501],[11446844,0.0001531],[11446794,0.0001561],[11132726,0.0001591],[10466093,0.0001621],[8847340,0.0001651],[7954974,0.0001681],[7010291,0.0001711],[6678039,0.0001741],[6663287,0.0001771],[6653447,0.0001801],[6610028,0.0001831],[6583728,0.0001861],[6576170,0.0001891],[6571050,0.0001931],[6568205,0.0001961],[6127974,0.0001991],[6121117,0.0002021],[5726843,0.0002061],[5630969,0.0002101],[5501811,0.0002141],[5498633,0.0002181],[5496888,0.0002221],[5460789,0.0002261],[5373823,0.0002301],[5368029,0.0002341],[5366022,0.0002381],[5365400,0.0002421],[5364838,0.0002461],[5364450,0.0002501],[5363735,0.0002541],[5362304,0.0002581],[5361725,0.0002621],[5352196,0.0002661],[5346202,0.0002711],[5342359,0.0002761],[5341672,0.0002811],[5341251,0.0002861],[5340722,0.0002911],[5340459,0.0002961],[5340257,0.0003011],[5337727,0.0003061],[5336403,0.0003111],[5335366,0.0003161],[5107434,0.0003211],[5049060,0.0003261],[5036732,0.0003321],[5030111,0.0003371],[5027518,0.0003431],[4875169,0.0003501],[4514472,0.0003561],[4468155,0.0003621],[4437165,0.0003681],[3782320,0.0003741],[3609695,0.0003801],[3493970,0.0003861],[3450877,0.0003921],[3447792,0.0003981],[3335235,0.0004041],[3327203,0.0004111],[3224804,0.0004181],[2979103,0.0004251],[2604462,0.0004321],[2476253,0.0004391],[2363892,0.0004461],[2229813,0.0004531],[2220995,0.0004601],[2208456,0.0004671],[2205685,0.0004751],[2203373,0.0004831],[2201394,0.0004911],[2016349,0.0004991],[1915208,0.0005071],[1887779,0.0005151],[1865004,0.0005231],[1811077,0.0005311],[1802098,0.0005391],[1796959,0.0005481],[1795586,0.0005581],[1792612,0.0005671],[1787513,0.0005761],[1785052,0.0005861],[1753049,0.0005951],[1721350,0.0006041],[1711499,0.0006141],[1707107,0.0006241],[1704510,0.0006341],[1701522,0.0006441],[1699928,0.0006551],[1698917,0.0006651],[1697555,0.0006751],[1639140,0.0006861],[1627773,0.0006981],[1619411,0.0007091],[1610601,0.0007201],[1554409,0.0007311],[1526578,0.0007421],[1519604,0.0007541],[1509908,0.0007671],[1489716,0.0007791],[1476698,0.0007911],[1461711,0.0008031],[1459691,0.0008161],[1401486,0.0008291],[1352642,0.0008421],[1335254,0.0008551],[1324869,0.0008681],[1316145,0.0008821],[1314656,0.0008961],[1313656,0.0009121],[1306598,0.0009261],[1285325,0.0009401],[1247129,0.0009551],[1213440,0.0009701],[1209802,0.0009851],[1195722,0.001],[1191373,0.001016],[1182337,0.001032],[1177889,0.001049],[1173641,0.001065],[1171442,0.001081],[1167154,0.001098],[1165555,0.001115],[1164206,0.001132],[1160279,0.001149],[1147690,0.001167],[1134984,0.001185],[1053847,0.001203],[1027899,0.001222],[1019698,0.001241],[1015681,0.00126],[1013640,0.001279],[978069,0.001299],[956368,0.001319],[937679,0.001339],[931188,0.00136],[926394,0.001381],[920669,0.001404],[825948,0.001426],[816038,0.001448],[813849,0.001471],[786502,0.001495],[750514,0.001518],[729480,0.001541],[699061,0.001565],[649418,0.001589],[631970,0.001613],[624987,0.001638],[620074,0.001664],[614270,0.00169],[612125,0.001716],[605665,0.001742],[600821,0.001769],[576291,0.001796],[555635,0.001823],[542824,0.001854],[535864,0.001882],[527731,0.001912],[519035,0.001941],[514521,0.001971],[502590,0.002001],[498649,0.002032],[496799,0.002066],[495216,0.002097],[493544,0.002129],[490626,0.002161],[478541,0.002194],[466395,0.002227],[458080,0.002261],[453610,0.002295],[449005,0.00233],[447269,0.00237],[445826,0.002408],[441615,0.002445],[434505,0.002482],[429912,0.00252],[425107,0.002558],[422755,0.002597],[420968,0.002636],[419446,0.002676],[404042,0.002718],[397141,0.002759],[394329,0.002801],[385489,0.002845],[381385,0.002888],[377168,0.002932],[374414,0.002976],[372252,0.003021],[370125,0.003067],[367865,0.003114],[366617,0.003161],[365669,0.003209],[365056,0.003259],[364502,0.003308],[364058,0.003358],[363663,0.003409],[363144,0.003461],[362796,0.003516],[362299,0.003569],[361739,0.003623],[360828,0.003679],[359462,0.003738],[358197,0.003795],[357048,0.003852],[356175,0.00391],[355349,0.003969],[353570,0.004029],[351542,0.00409],[350378,0.004152],[349399,0.004215],[348685,0.00428],[347920,0.004346],[347382,0.004413],[346503,0.00448],[345935,0.004548],[345408,0.004617],[344700,0.004693],[343476,0.004764],[342039,0.004836],[340993,0.004909],[340332,0.004983],[339703,0.005058],[338957,0.005134],[338556,0.005212],[338199,0.005291],[337906,0.005371],[337596,0.005452],[337238,0.005534],[336890,0.005618],[336458,0.005704],[335936,0.005791],[314650,0.005878],[289903,0.005967],[275266,0.006057],[270236,0.00615],[265660,0.006244],[264365,0.006338],[263003,0.006434],[259105,0.006531],[255690,0.006629],[253254,0.006729],[249538,0.00683],[246446,0.006933],[244877,0.007039],[243723,0.007151],[239754,0.007259],[235897,0.007368],[231237,0.007479],[227042,0.007592],[221971,0.007706],[218813,0.007822],[216433,0.00794],[214985,0.008061],[210977,0.008183],[206861,0.008306],[203147,0.008431],[199566,0.008558],[195612,0.008692],[192902,0.008823],[190216,0.008956],[188236,0.009091],[186278,0.009229],[184638,0.009368],[183549,0.009512],[181119,0.009656],[178541,0.009801],[176516,0.009949],[175098,0.0101],[173516,0.01025],[171581,0.01041],[170235,0.01056],[168505,0.01072],[166769,0.01089],[165578,0.01105],[164610,0.01122],[163148,0.01139],[159770,0.01156],[155450,0.01173],[151912,0.01191],[149314,0.01209],[147274,0.01227],[144879,0.01246],[142348,0.01265],[140149,0.01284],[138138,0.01303],[136705,0.01323],[134153,0.01343],[131972,0.01363],[129808,0.01384],[128136,0.01404],[126717,0.01426],[125606,0.01447],[124501,0.01469],[123668,0.01491],[122884,0.01513],[122018,0.01537],[121305,0.01561],[120484,0.01585],[119622,0.01609],[118785,0.01633],[118145,0.01658],[116717,0.01683],[114392,0.01708],[111310,0.01734],[109371,0.0176],[108171,0.01787],[107327,0.01813],[106441,0.01841],[105245,0.01869],[104153,0.01897],[102443,0.01925],[97050,0.01954],[92183,0.01984],[75363,0.02234],[64492,0.02484],[57485,0.02737],[51867,0.02987],[48639,0.03237],[46213,0.03487],[44019,0.03738],[42046,0.03988],[40554,0.04238],[39309,0.04488],[37904,0.04738],[36669,0.04988],[35654,0.05238],[34786,0.05488],[33978,0.05739],[33225,0.05989],[32449,0.06239],[31802,0.06489],[31239,0.0674],[30738,0.0699],[30274,0.0724],[29832,0.0749],[29414,0.07741],[28957,0.07991],[28422,0.08241],[27888,0.08491],[27307,0.08743],[26450,0.08993],[25657,0.09243],[24992,0.09493],[24389,0.09743],[23898,0.09993],[23428,0.1024],[22999,0.1049],[22594,0.1074],[22200,0.11],[21802,0.1125],[21452,0.115],[21050,0.1175],[20669,0.12],[20288,0.1225],[19926,0.125],[19547,0.1275],[19211,0.13],[18901,0.1326],[18556,0.1351],[18242,0.1376],[17970,0.1401],[17715,0.1426],[17447,0.1452],[17220,0.1477],[16997,0.1502],[16790,0.1527],[16589,0.1552],[16390,0.1577],[16219,0.1602],[16062,0.1627],[15904,0.1652],[15739,0.1679],[15567,0.1704],[15402,0.173],[15246,0.1756],[15109,0.1782],[14961,0.1809],[14805,0.1836],[14635,0.1864],[14460,0.1892],[14288,0.1922],[14146,0.1951],[13992,0.198],[13847,0.201],[13669,0.204],[13509,0.2071],[13346,0.2102],[13174,0.2134],[12999,0.2166],[12793,0.2199],[12577,0.2232],[12366,0.2265],[12160,0.2299],[11955,0.2334],[11736,0.2369],[11508,0.2405],[11305,0.2441],[11109,0.2478],[10928,0.2515],[10742,0.2553],[10564,0.2591],[10387,0.2631],[10228,0.267],[10063,0.271],[9905,0.2751],[9751,0.2793],[9597,0.2835],[9451,0.2878],[9323,0.2921],[9203,0.2965],[9084,0.3009],[8960,0.3055],[8824,0.3101],[8701,0.3147],[8581,0.3196],[8472,0.3244],[8360,0.3293],[8252,0.3343],[8149,0.3393],[8050,0.3444],[7959,0.3496],[7862,0.3549],[7765,0.3602],[7665,0.3656],[7574,0.3712],[7480,0.3768],[7392,0.3825],[7305,0.3882],[7218,0.3941],[7136,0.4],[7058,0.4061],[6978,0.4123],[6897,0.4185],[6817,0.4249],[6737,0.4313],[6658,0.4378],[6583,0.4445],[6504,0.4515],[6432,0.4584],[6362,0.4654],[6294,0.4724],[6222,0.4795],[6154,0.4867],[6085,0.4941],[6018,0.5016],[5955,0.5091],[5889,0.5168],[5825,0.5246],[5756,0.5325],[5687,0.5406],[5619,0.5488],[5544,0.5572],[5474,0.5656],[5399,0.5741],[5340,0.5828],[5282,0.5916],[5213,0.6005],[5151,0.6098],[5096,0.619],[5029,0.6283],[4965,0.6379],[4904,0.6475],[4830,0.6572],[4756,0.6672],[4677,0.6773],[4600,0.6877],[4532,0.698],[4460,0.7088],[4399,0.7196],[4325,0.7313],[4259,0.7425],[4189,0.7536],[4118,0.765],[4051,0.7768],[3962,0.7885],[3873,0.8004],[3799,0.8125],[3698,0.825],[3600,0.8374],[3489,0.8504],[3385,0.8633],[3299,0.8766],[3198,0.8916],[3110,0.9051],[2985,0.9197],[2847,0.9336],[2607,0.948],[2450,0.9622],[2301,0.9773],[2088,0.9937],[0,1]];

const RAR=[
  [0.1,"Common","#57534e"],[0.01,"Uncommon","#10b981"],[0.001,"Rare","#3b82f6"],
  [0.0001,"Epic","#a855f7"],[0.00001,"Anomaly","#f97316"],[0,"Mythic","#ef4444"]
];
function calibrate(){
  for(const b of BADGES){b.p=PROB[b.id];b.ep=Math.round(100/b.p);const r=RAR.find(r=>b.p>r[0]||r[0]===0);b.rar=r[1];b.col=r[2]}
}
function topPct(total){let f=PCT_TABLE[0][1];for(const [t,fr] of PCT_TABLE){if(t>=total)f=fr;else break}return f}
const TIERS=[[0.01,"Mythic","#ef4444"],[0.05,"Anomaly","#f97316"],[0.10,"Epic","#a855f7"],[0.25,"Rare","#3b82f6"],
  [0.5,"Uncommon","#10b981"],[0.99,"Common","#57534e"],[1.01,"Trash","#eab308"]];


calibrate();
if(typeof module!=="undefined"&&module.exports){module.exports={BADGES,evaluate,topPct,TIERS,RAR,P_ZERO,P_MILLION};}
