// app.js - logic front-end (no server). Lưu bằng localStorage.
const BALANCE_KEY = "tx_balance_v1";
const HISTORY_KEY = "tx_history_v1";
const PAYOUTS = {
  taixiu: 1,
  sum: {4:50,5:18,6:14,7:12,8:8,9:6,10:6,11:6,12:6,13:8,14:12,15:14,16:18,17:50},
  triple_exact: 150
};

function $(id){return document.getElementById(id);}
function loadBalance(){ return Number(localStorage.getItem(BALANCE_KEY) || 100000); }
function saveBalance(v){ localStorage.setItem(BALANCE_KEY, String(v)); }
function loadHistory(){ try{ return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }catch(e){return [];} }
function saveHistory(h){ localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

function updateUI(){
  $("balance").innerText = loadBalance();
  const history = loadHistory().slice().reverse();
  const list = $("historyList"); list.innerHTML = "";
  if(history.length===0){ list.innerHTML = "<div class='hist-item'>Chưa có ván nào.</div>"; return; }
  history.forEach(h=>{
    const div = document.createElement("div"); div.className="hist-item";
    div.innerText = `${h.time} | ${h.type} | pick=${h.pick} | dice=${h.dice.join('-')} | sum=${h.sum} | ${h.result} | balance=${h.balance}`;
    list.appendChild(div);
  });
}

function rollThree(){
  return [1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6),1+Math.floor(Math.random()*6)];
}

function animateDice(dice){
  const ids = ["d1","d2","d3"];
  ids.forEach((id,i)=>{
    const el = $(id);
    el.classList.remove("spin");
    void el.offsetWidth;
    el.classList.add("spin");
    // set temp random while spin
    el.innerText = String(1+Math.floor(Math.random()*6));
  });
  // after animation set final
  setTimeout(()=> {
    ids.forEach((id,i)=> $(id).innerText = String(dice[i]));
  }, 650);
}

function appendHistory(rec){
  const h = loadHistory();
  h.push(rec);
  // keep last 200
  if(h.length>200) h.splice(0,h.length-200);
  saveHistory(h);
}

function handleTx(pick, bet){
  let balance = loadBalance();
  bet = Number(bet);
  if(!bet || bet<=0){ alert("Nhập số tiền đặt hợp lệ."); return; }
  if(bet>balance){ alert("Số dư không đủ."); return; }
  const dice = rollThree();
  animateDice(dice);
  const s = dice[0]+dice[1]+dice[2];
  const triple = (dice[0]===dice[1] && dice[1]===dice[2]);
  let win=false;
  if(!triple){
    if(pick==="tai" && s>=11 && s<=17) win=true;
    if(pick==="xiu" && s>=4 && s<=10) win=true;
  }
  let resultMsg="";
  if(win){
    const payout = bet * PAYOUTS.taixiu;
    balance += payout;
    resultMsg = `THẮNG +${payout}`;
  } else {
    balance -= bet;
    resultMsg = `THUA -${bet}${triple ? " (TRIPLE!)":""}`;
  }
  saveBalance(balance);
  const rec = {type:"Tài/Xỉu", pick:pick, bet:bet, dice:dice, sum:s, triple:triple, result:resultMsg, balance:balance, time:new Date().toLocaleString()};
  appendHistory(rec);
  setTimeout(()=> {
    $("resultBox").innerText = `${rec.time} — ${rec.result} | dice=${dice.join("-")} | tổng=${s} | Số dư=${balance}`;
    updateUI();
  }, 700);
}

function handleSum(target, bet){
  let balance = loadBalance();
  target = Number(target); bet=Number(bet);
  if(!target || target<4 || target>17){ alert("Tổng hợp lệ: 4..17"); return; }
  if(!bet || bet<=0){ alert("Nhập số tiền đặt."); return; }
  if(bet>balance){ alert("Số dư không đủ."); return; }
  const dice = rollThree();
  animateDice(dice);
  const s = dice[0]+dice[1]+dice[2];
  const triple = (dice[0]===dice[1] && dice[1]===dice[2]);
  let resultMsg="";
  if(s===target){
    const coef = PAYOUTS.sum[target]||0;
    const payout = bet * coef;
    balance += payout;
    resultMsg = `THẮNG +${payout} (hệ số ${coef})`;
  } else {
    balance -= bet;
    resultMsg = `THUA -${bet}`;
  }
  saveBalance(balance);
  const rec = {type:"Tổng", pick:target, bet:bet, dice:dice, sum:s, triple:triple, result:resultMsg, balance:balance, time:new Date().toLocaleString()};
  appendHistory(rec);
  setTimeout(()=> {
    $("resultBox").innerText = `${rec.time} — ${rec.result} | dice=${dice.join("-")} | tổng=${s} | Số dư=${balance}`;
    updateUI();
  }, 700);
}

function handleTriple(choice, bet){
  let balance = loadBalance();
  choice = Number(choice); bet = Number(bet);
  if(choice<1 || choice>6){ alert("Chọn 1..6."); return; }
  if(!bet || bet<=0){ alert("Nhập số tiền đặt."); return; }
  if(bet>balance){ alert("Số dư không đủ."); return; }
  const dice = rollThree();
  animateDice(dice);
  const s = dice[0]+dice[1]+dice[2];
  const tripleFlag = (dice[0]===dice[1] && dice[1]===dice[2]);
  let resultMsg="";
  if(tripleFlag && dice[0]===choice){
    const payout = bet * PAYOUTS.triple_exact;
    balance += payout;
    resultMsg = `CHÍNH XÁC TRIPLE! +${payout}`;
  } else {
    balance -= bet;
    resultMsg = `KHÔNG TRÚNG -${bet}`;
  }
  saveBalance(balance);
  const rec = {type:"Triple", pick:choice, bet:bet, dice:dice, sum:s, triple:tripleFlag, result:resultMsg, balance:balance, time:new Date().toLocaleString()};
  appendHistory(rec);
  setTimeout(()=> {
    $("resultBox").innerText = `${rec.time} — ${rec.result} | dice=${dice.join("-")} | tổng=${s} | Số dư=${balance}`;
    updateUI();
  }, 700);
}

document.addEventListener("DOMContentLoaded", ()=>{
  // Init ui
  $("balance").innerText = loadBalance();
  updateUI();

  // pick buttons
  document.querySelectorAll(".pick").forEach(b=>{
    b.addEventListener("click", ()=>{
      const pick = b.dataset.pick;
      const bet = Number($("txBet").value || 0);
      handleTx(pick, bet);
    });
  });

  $("sumBtn").addEventListener("click", ()=> {
    handleSum($("sumTarget").value, $("sumBet").value);
  });

  $("tripleBtn").addEventListener("click", ()=> {
    handleTriple($("tripleChoice").value, $("tripleBet").value);
  });

  $("depositBtn").addEventListener("click", ()=> {
    const v = Number($("depositAmount").value || 0);
    if(!v || v<=0){ alert("Nhập số tiền nạp."); return; }
    const bal = loadBalance()+v;
    saveBalance(bal);
    appendHistory({type:"Nạp", pick:"-", bet:v, dice:[0,0,0], sum:0, triple:false, result:`Nạp +${v}`, balance:bal, time:new Date().toLocaleString()});
    updateUI();
    $("resultBox").innerText = `Đã nạp +${v} | Số dư=${bal}`;
  });

  $("resetBtn").addEventListener("click", ()=> {
    if(!confirm("Xóa lưu (reset số dư về 100000) ?")) return;
    localStorage.removeItem(BALANCE_KEY);
    localStorage.removeItem(HISTORY_KEY);
    saveBalance(100000);
    updateUI();
    $("resultBox").innerText = "Đã reset dữ liệu.";
  });
});
