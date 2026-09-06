/* ============ ESTADO ============ */
let carrinho=[],catAtiva='todos',termo='',itemAberto=null,qtdItem=1,entrega=true,pagamento={metodo:'',parcelas:1};
const $=s=>document.querySelector(s);
const dinheiro=v=>'R$ '+v.toFixed(2).replace('.',',');
const arte=p=>p.foto?`<img src="${p.foto}" alt="${p.nome}" loading="lazy"${p.contain?' style="object-fit:contain;background:#fff"':''}>`:ART[p.art];

/* ============ MONTAGEM ============ */
function montarAbas(){
  const abas=[{id:'todos',nome:'Tudo'},...CATEGORIAS];
  $('#abas').innerHTML=abas.map(c=>`<button class="aba" role="tab" aria-selected="${c.id===catAtiva}" onclick="filtrar('${c.id}')">${c.nome}</button>`).join('');
}
function montarCardapio(){
  const t=termo.trim().toLowerCase();let html='';
  CATEGORIAS.forEach(cat=>{
    if(catAtiva!=='todos'&&catAtiva!==cat.id)return;
    const itens=PRODUTOS.filter(p=>p.cat===cat.id&&(!t||(p.nome+' '+p.desc).toLowerCase().includes(t)));
    if(!itens.length)return;
    html+=`<div class="grupo"><div class="gtit"><h2>${cat.nome}</h2><div class="barra-fogo"></div></div><div class="itens">`+
      itens.map(p=>`
      <div class="item${p.disp===false?' esgotado':''}">
        <button class="item-open" onclick="abrirItem('${p.id}')" aria-label="Ver ${p.nome}">
          <div class="thumb" aria-hidden="true">${arte(p)}</div>
          <div class="info">
            <h3>${p.nome}${p.disp===false?`<span class="flag" style="background:#F0E4D8;color:#8a7568">ESGOTADO</span>`:(p.flag?`<span class="flag">${p.flag}</span>`:'')}</h3>
            <p class="d">${p.desc}</p>
            <span class="preco">${dinheiro(p.preco)}</span>
          </div>
        </button>
        ${p.disp===false?`<span class="mais off" aria-hidden="true"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>`:`<button class="mais" onclick="addRapido('${p.id}')" aria-label="Adicionar ${p.nome} ao carrinho"><svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>`}
      </div>`).join('')+`</div></div>`;
  });
  $('#lista').innerHTML=html||`<div class="vazio" style="margin:40px 0">Nada encontrado. Tente galeto, baião ou linguiça.</div>`;
}
function filtrar(id){catAtiva=id;montarAbas();montarCardapio();}
$('#busca').addEventListener('input',e=>{termo=e.target.value;montarCardapio();});

/* ============ STATUS ============ */
function verificarStatus(){
  const dot=$('#dot'),txt=$('#txtStatus');
  if(!dot||!txt)return;
  const d=new Date(),h=d.getHours()+d.getMinutes()/60;
  const ab=(LOJA.horarios[d.getDay()]||[]).some(([i,f])=>h>=i&&h<f);
  dot.className='dot'+(ab?'':' off');
  txt.textContent=ab?'Aberto agora':'Fechado, aceitamos pedidos pra depois';
}

/* ============ ITEM ============ */
function abrirItem(id){itemAberto=PRODUTOS.find(p=>p.id===id);if(itemAberto.disp===false)return avisar(itemAberto.nome+' está esgotado hoje');qtdItem=1;$('#itemArt').innerHTML=arte(itemAberto);$('#itemNome').textContent=itemAberto.nome;$('#itemDesc').textContent=itemAberto.desc;$('#itemObs').value='';atualizarFolhaItem();abrir('#folhaItem');}
function mudarQtdItem(n){qtdItem=Math.max(1,qtdItem+n);atualizarFolhaItem();}
function atualizarFolhaItem(){$('#itemQtd').textContent=qtdItem;$('#itemTotal').textContent=dinheiro(itemAberto.preco*qtdItem);}
function confirmarItem(){
  const obs=$('#itemObs').value.trim(),chave=itemAberto.id+'|'+obs,a=carrinho.find(l=>l.chave===chave);
  if(a)a.qtd+=qtdItem;else carrinho.push({chave,id:itemAberto.id,nome:itemAberto.nome,preco:itemAberto.preco,art:itemAberto.art,foto:itemAberto.foto,contain:itemAberto.contain,obs,qtd:qtdItem});
  atualizarCarrinho();fecharTudo();avisar(qtdItem+'x '+itemAberto.nome+' no carrinho');
}
function addRapido(id){
  const p=PRODUTOS.find(x=>x.id===id);if(p.disp===false)return avisar(p.nome+' está esgotado hoje');const chave=p.id+'|',a=carrinho.find(l=>l.chave===chave);
  if(a)a.qtd++;else carrinho.push({chave,id:p.id,nome:p.nome,preco:p.preco,art:p.art,foto:p.foto,contain:p.contain,obs:'',qtd:1});
  atualizarCarrinho();avisar(p.nome+' no carrinho');
}

/* ============ CARRINHO ============ */
const subtotal=()=>carrinho.reduce((s,l)=>s+l.preco*l.qtd,0);
const taxa=()=>0;
const total=()=>subtotal()+taxa();
const itensQtd=()=>carrinho.reduce((s,l)=>s+l.qtd,0);
function mudarLinha(chave,n){const l=carrinho.find(x=>x.chave===chave);if(!l)return;l.qtd+=n;if(l.qtd<=0)carrinho=carrinho.filter(x=>x.chave!==chave);atualizarCarrinho();}
function atualizarCarrinho(){
  const q=itensQtd();
  $('#qtdTopo').textContent=q;$('#barraQtd').textContent=q===1?'1 item':q+' itens';
  $('#barraTotal').textContent=dinheiro(total());$('#barra').classList.toggle('on',q>0);$('#peCart').hidden=q===0;
  if(!q){$('#corpoCart').innerHTML=`<div class="vazio"><p style="font-family:'Archivo';font-weight:800;color:var(--ink);font-size:18px">Carrinho vazio</p><p style="margin-top:8px">Começa pelo galeto inteiro, é o que mais sai daqui.</p><button class="btn btn-fogo" style="margin-top:16px" onclick="fecharTudo();irPara('cardapio')">Ver cardápio</button></div>`;}
  else{$('#corpoCart').innerHTML=carrinho.map(l=>`<div class="lc"><div class="art" aria-hidden="true">${arte(l)}</div><div><h4>${l.nome}</h4>${l.obs?`<p class="obs">${l.obs}</p>`:''}<div class="step"><button onclick="mudarLinha('${l.chave.replace(/'/g,"\\'")}',-1)" aria-label="Menos">−</button><span>${l.qtd}</span><button onclick="mudarLinha('${l.chave.replace(/'/g,"\\'")}',1)" aria-label="Mais">+</button></div></div><span class="preco">${dinheiro(l.preco*l.qtd)}</span></div>`).join('')+resumoHTML();}
  if($('#folhaCheckout').classList.contains('aberta'))$('#resumoCheckout').innerHTML=resumoHTML();
}
function resumoHTML(){return `<div class="resumo"><div><span>Subtotal</span><span>${dinheiro(subtotal())}</span></div><div><span>${entrega?'Entrega nas proximidades':'Retirada no balcão'}</span><span>${entrega?'a combinar':'grátis'}</span></div><div class="tot"><span>Total dos itens</span><span>${dinheiro(total())}</span></div></div>`;}

/* ============ CHECKOUT ============ */
function setEntrega(v){entrega=v;$('#optEntrega').setAttribute('aria-pressed',v);$('#optRetirada').setAttribute('aria-pressed',!v);$('#blocoEnd').hidden=!v;atualizarCarrinho();$('#resumoCheckout').innerHTML=resumoHTML();}
function abrirCheckout(){if(!carrinho.length)return avisar('Escolha pelo menos um item');fecharTudo();setTimeout(()=>{$('#resumoCheckout').innerHTML=resumoHTML();abrir('#folhaCheckout');},180);}
function validar(){
  let ok=true;const t=[['#cNome','#eNome',v=>v.trim().length>=2],['#cFone','#eFone',v=>v.replace(/\D/g,'').length>=10]];
  if(entrega)t.push(['#cEnd','#eEnd',v=>v.trim().length>=6]);
  t.forEach(([c,e,f])=>{const el=$(c),b=f(el.value);el.classList.toggle('erro',!b);$(e).style.display=b?'none':'block';if(!b&&ok){el.focus();ok=false;}});
  return ok;
}
function irParaPagamento(){
  if(!validar())return;
  fecharTudo();
  setTimeout(()=>{
    $('#pagValor').textContent=dinheiro(total());
    $('#pagEntregaObs').textContent=entrega?'Entrega nas proximidades. A taxa você combina com o Luiz Fernando.':'Retirada no balcão.';
    abrir('#folhaPagamento');
  },180);
}
function voltarPagamento(){fecharTudo();setTimeout(()=>{$('#pagValor').textContent=dinheiro(total());abrir('#folhaPagamento');},180);}
function escolherPix(){
  pagamento={metodo:'pix',parcelas:1};
  $('#pixValor').textContent=dinheiro(total());$('#pixCode').textContent=gerarPix();
  fecharTudo();setTimeout(()=>abrir('#folhaPix'),180);
}
function escolherEntrega(){pagamento={metodo:'entrega',parcelas:1};enviarZap('checkout');}
function cartaoEmBreve(){avisar('Pagamento no cartão em breve. Por enquanto, use Pix ou pague na entrega.');}
function escolherCartao(){
  montarParcelas();$('#cardTotal').textContent=dinheiro(total());
  fecharTudo();setTimeout(()=>abrir('#folhaCartao'),180);
}
function montarParcelas(){
  const t=total();let o='';
  for(let n=1;n<=12;n++){o+=`<option value="${n}">${n}x de ${dinheiro(t/n)}${n===1?' à vista':' sem juros'}</option>`;}
  $('#cParc').innerHTML=o;
}
function pagarCartao(){
  const num=$('#cCard').value.replace(/\s/g,''),val=$('#cVal').value,cvv=$('#cCvv').value,nome=$('#cCardNome').value.trim();
  let ok=true;
  [['#cCard','#eCard',num.length>=13],['#cCardNome','#eCardNome',nome.length>=2],['#cVal','#eVal',/^\d{2}\/\d{2}$/.test(val)],['#cCvv','#eCvv',cvv.length>=3]]
    .forEach(([c,e,bom])=>{$(c).classList.toggle('erro',!bom);$(e).style.display=bom?'none':'block';if(!bom&&ok){$(c).focus();ok=false;}});
  if(!ok)return;
  pagamento={metodo:'cartao',parcelas:parseInt($('#cParc').value)||1};
  enviarZap('checkout');
}
/* formatação dos campos do cartão */
$('#cCard').addEventListener('input',e=>{let v=e.target.value.replace(/\D/g,'').slice(0,16);e.target.value=v.replace(/(.{4})/g,'$1 ').trim();});
$('#cVal').addEventListener('input',e=>{let v=e.target.value.replace(/\D/g,'').slice(0,4);e.target.value=v.length>=3?v.slice(0,2)+'/'+v.slice(2):v;});
$('#cCvv').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,4);});
function gerarPix(){const v=total().toFixed(2);return `00020126BR.GOV.BCB.PIX0114${LOJA.chavePix}5204000053039865802BR5925GALETERIA LUIZ HENRIQUE6009FORTALEZA54${('0'+v.length).slice(-2)}${v}6304ABCD`;}
function copiarPix(){navigator.clipboard?.writeText($('#pixCode').textContent).then(()=>avisar('Código Pix copiado')).catch(()=>avisar('Selecione e copie o código'));}

/* ============ WHATSAPP ============ */
function montarMensagem(modo){
  const L=['*NOVO PEDIDO, '+LOJA.nome+'*','Olá, '+LOJA.atendente+'! Fiz meu pedido pelo site.','','*ITENS*'];
  carrinho.forEach(l=>{L.push('- '+l.qtd+'x '+l.nome+': '+dinheiro(l.preco*l.qtd));if(l.obs)L.push('  obs: '+l.obs);});
  L.push('','Subtotal: '+dinheiro(subtotal()));
  L.push(entrega?'Entrega: nas proximidades (taxa a combinar)':'Retirada no balcão');
  L.push('*TOTAL DOS ITENS: '+dinheiro(total())+'*');
  if(modo!=='rapido'){
    L.push('','*CLIENTE*','Nome: '+$('#cNome').value.trim(),'Telefone: '+$('#cFone').value.trim());
    if(entrega){L.push('Endereço: '+$('#cEnd').value.trim());const r=$('#cRef').value.trim();if(r)L.push('Referência: '+r);}else L.push('Vou retirar no balcão.');
    let pag='A combinar';
    if(pagamento.metodo==='pix')pag='Pix (pago pelo site)';
    else if(pagamento.metodo==='cartao')pag='Cartão de crédito, '+pagamento.parcelas+'x de '+dinheiro(total()/pagamento.parcelas);
    else if(pagamento.metodo==='entrega')pag='Na entrega (cartão ou dinheiro)';
    L.push('Pagamento: '+pag);
    if(pagamento.metodo==='pix')L.push('Vou enviar o comprovante do Pix aqui.');
  }else L.push('','Podemos combinar entrega e pagamento por aqui?');
  return L.join('\n');
}
function enviarZap(modo){if(!carrinho.length)return avisar('Escolha pelo menos um item');abrirZap(montarMensagem(modo));avisar('Abrindo o WhatsApp');}
function pedirNoZap(){if(carrinho.length)enviarZap('rapido');else falarNoZap();}
function falarNoZap(){abrirZap('Olá, '+LOJA.atendente+'! Vim pelo site da '+LOJA.nome+' e queria tirar uma dúvida.');}
function abrirZap(t){window.open('https://wa.me/'+LOJA.whatsapp+'?text='+encodeURIComponent(t),'_blank');}

/* ============ PAINÉIS ============ */
function abrir(sel){$('#fundo').classList.add('on');$(sel).classList.add('aberta');document.body.style.overflow='hidden';}
function abrirGaveta(){abrir('#gaveta');}
function fecharTudo(){$('#fundo').classList.remove('on');document.querySelectorAll('.painel').forEach(p=>p.classList.remove('aberta'));document.body.style.overflow='';}
document.addEventListener('keydown',e=>{if(e.key==='Escape')fecharTudo();});
let tT;function avisar(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(tT);tT=setTimeout(()=>t.classList.remove('on'),2600);}
function irPara(id){document.getElementById(id).scrollIntoView({behavior:'smooth'});}

/* ============ PAINEL DO LOJISTA ============ */
const MENU_KEY='galeteria_menu_v1';
// guarda as fotos por id (não vão pro localStorage, ficam no arquivo)
PRODUTOS.forEach(p=>{fotoById[p.id]=p.foto;});
menuBase=PRODUTOS.map(p=>({...p}));   // cardápio original de fábrica

function carregarMenu(){
  try{
    const s=localStorage.getItem(MENU_KEY);
    if(!s)return;
    const arr=JSON.parse(s);
    if(Array.isArray(arr)&&arr.length){
      PRODUTOS=arr.map(p=>({...p,foto:p.foto||fotoById[p.id]}));
    }
  }catch(e){}
}
function persistir(){
  try{
    // salva sem as fotos grandes (elas ficam no arquivo, por id)
    const leve=PRODUTOS.map(({foto,...r})=>r);
    localStorage.setItem(MENU_KEY,JSON.stringify(leve));
    return true;
  }catch(e){return false;}
}

function abrirLogin(){$('#admSenha').value='';$('#admErro').style.display='none';abrir('#folhaLogin');setTimeout(()=>$('#admSenha').focus(),250);}
function entrarAdmin(){
  if($('#admSenha').value===LOJA.senha){fecharTudo();renderEditor();$('#admin').classList.add('on');document.body.style.overflow='hidden';}
  else{$('#admErro').style.display='block';}
}
function sairAdmin(){$('#admin').classList.remove('on');document.body.style.overflow='';}

function renderEditor(){
  let h='';
  CATEGORIAS.forEach(cat=>{
    h+=`<div class="ed-cat">${cat.nome}<button onclick="addProduto('${cat.id}')">+ item</button></div>`;
    PRODUTOS.filter(p=>p.cat===cat.id).forEach(p=>{
      const esg=p.disp===false;
      h+=`<div class="ed-item${esg?' off':''}" data-id="${p.id}">
        <span class="ed-l">Nome</span><input class="e-nome" value="${(p.nome||'').replace(/"/g,'&quot;')}">
        <div class="ed-preco-row">
          <div><span class="ed-l">Preço</span><div class="rs"><input class="e-preco" inputmode="decimal" value="${p.preco.toFixed(2).replace('.',',')}"></div></div>
        </div>
        <span class="ed-l">Descrição</span><textarea class="e-desc">${p.desc||''}</textarea>
        <div class="ed-acoes">
          <button class="ed-toggle${esg?' esg':''}" onclick="toggleEsg(this)" data-disp="${esg?'0':'1'}">${esg?'Esgotado':'Disponível'}</button>
          <button class="ed-del" onclick="delProduto(this)" aria-label="Remover"><svg class="ico" viewBox="0 0 24 24"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg></button>
        </div>
      </div>`;
    });
  });
  $('#editor').innerHTML=h;
}
function toggleEsg(btn){
  const on=btn.dataset.disp==='1';
  btn.dataset.disp=on?'0':'1';
  btn.textContent=on?'Esgotado':'Disponível';
  btn.classList.toggle('esg',on);
  btn.closest('.ed-item').classList.toggle('off',on);
}
function delProduto(btn){
  if(!confirm('Remover este item do cardápio?'))return;
  btn.closest('.ed-item').remove();
}
function addProduto(cat){
  const art={galetos:'galeto',acomp:'baiao',linguicas:'linguica',bebidas:'refri'}[cat]||'galeto';
  PRODUTOS.push({id:'n'+Date.now(),cat,art,nome:'Novo item',desc:'',preco:0,disp:true});
  renderEditor();
  // rolar até o novo
  const items=$('#editor').querySelectorAll('.ed-item');
  if(items.length)items[items.length-1].scrollIntoView({behavior:'smooth',block:'center'});
}
function coletarEditor(){
  const novo=[];
  $('#editor').querySelectorAll('.ed-item').forEach(el=>{
    const id=el.dataset.id;
    const base=PRODUTOS.find(p=>p.id===id)||{};
    const nome=el.querySelector('.e-nome').value.trim()||'Item';
    const desc=el.querySelector('.e-desc').value.trim();
    const preco=parseFloat(el.querySelector('.e-preco').value.replace(',','.'))||0;
    const disp=el.querySelector('.ed-toggle').dataset.disp==='1';
    novo.push({...base,nome,desc,preco,disp});
  });
  return novo;
}
function salvarCardapio(){
  PRODUTOS=coletarEditor().map(p=>({...p,foto:p.foto||fotoById[p.id]}));
  persistir();
  montarCardapio();atualizarCarrinho();
  avisar('Cardápio salvo');
  sairAdmin();
}
function restaurarPadrao(){
  if(!confirm('Voltar ao cardápio original? Suas alterações serão apagadas.'))return;
  localStorage.removeItem(MENU_KEY);
  PRODUTOS=menuBase.map(p=>({...p,foto:p.foto||fotoById[p.id]}));
  renderEditor();montarCardapio();avisar('Cardápio original restaurado');
}
function exportarCardapio(){
  const dados=JSON.stringify(coletarEditor().map(({foto,...r})=>r),null,2);
  const blob=new Blob([dados],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='cardapio-galeteria.json';a.click();
  avisar('Cardápio exportado');
}

/* ============ INÍCIO ============ */
carregarMenu();
montarAbas();montarCardapio();atualizarCarrinho();verificarStatus();setInterval(verificarStatus,60000);
