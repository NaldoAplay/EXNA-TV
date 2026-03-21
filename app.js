function getVideo(){
  return mobileVideo || video
}

let canais = []
let index = 0
let hls = null
let hideTimeout
let mobileVideo = null

const intro = document.getElementById("intro")
const welcome = document.getElementById("welcome")
const app = document.getElementById("app")

const video = document.getElementById("video")
const titulo = document.getElementById("titulo")
const channelList = document.getElementById("channelList")

// IMAGEM PADRÃO (SEM PISCAR)
const imagemPadrao = "https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=800"

// INIT
window.onload = () => {

  setTimeout(()=>{
    intro.style.display = "none"

    const lista = localStorage.getItem("iptv")

    if(lista){
      carregarLista(lista)
    }else{
      welcome.style.display = "grid"
    }

  },1000)

  iniciarRelogio()
}

// RELÓGIO
function iniciarRelogio(){
  setInterval(()=>{
    const now = new Date()
    document.getElementById("clock").innerText =
      now.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})
  },1000)
}

// SALVAR
function salvarLista(){
  const link = document.getElementById("iptvInput").value
  localStorage.setItem("iptv", link)
  carregarLista(link)
}

// CARREGAR
async function carregarLista(url){

  welcome.style.display = "none"
  app.style.display = "flex"

  const res = await fetch(url)
  const txt = await res.text()

  parse(txt)
}

// PARSE
function parse(data){

  const linhas = data.split("\n")
  canais = []

  for(let i=0;i<linhas.length;i++){

    if(linhas[i].includes("#EXTINF")){

      const nome = linhas[i].split(",")[1] || "EXNA TV"
      const url = linhas[i+1]

      const logo = linhas[i].match(/tvg-logo="(.*?)"/)?.[1] || ""

      canais.push({nome,url,logo})
    }
  }

  // PRIORIDADE TV ABERTA
  canais.sort((a,b)=>{

    const aberta = ["globo","sbt","record","band","cultura","rede tv","gazeta"]

    const aScore = aberta.some(x=>a.nome.toLowerCase().includes(x)) ? 0 : 1
    const bScore = aberta.some(x=>b.nome.toLowerCase().includes(x)) ? 0 : 1

    return aScore - bScore
  })

  ordenarCanais()
renderLista()
tocar(0)
}

// LISTA (SEM LOGO QUEBRADA)
function renderLista(){

  channelList.innerHTML = ""

  canais.forEach((c,i)=>{

    const el = document.createElement("div")
    el.className = "channel"

    const isFav = favoritos.includes(c.url)

    el.innerHTML = `
      <img src="${c.logo || 'https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=400'}"
      onerror="this.src='https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=400'">

      <span>${c.nome}</span>

      ${isFav ? `<span class="favIcon">⭐</span>` : ``}
    `

    el.addEventListener("click", ()=> abrirMobile(i, el))
el.addEventListener("touchstart", ()=> abrirMobile(i, el))

    // HOLD (segurar)
    ativarHold(el, c)

    channelList.appendChild(el)
  })
}

// TOCAR
function tocar(i){

  const c = canais[i]

  canalAtual = c.url // 🔥 guarda o canal atual
  index = i

  titulo.innerText = c.nome

  if(hls){
    hls.destroy()
  }

  if(Hls.isSupported()){
    hls = new Hls()
    hls.loadSource(c.url)
    hls.attachMedia(video)
  }else{
    video.src = c.url
  }

  video.play().catch(()=>{})
  video.muted = false

  atualizarSelecao()
}

// CONTROLES
function togglePlay(){
  video.paused ? video.play() : video.pause()
}

function toggleMute(){

  video.muted = !video.muted

  // força o navegador aceitar o som
  video.play().catch(()=>{})

}

// FULLSCREEN CORRETO (AGORA FUNCIONA)
function fullscreen(){

  const el = document.getElementById("playerArea")

  if(!document.fullscreenElement){
    el.requestFullscreen().catch(()=>{})
  }else{
    document.exitFullscreen().catch(()=>{})
  }

}
// AUTO HIDE
function mostrarControles(){

  const area = document.getElementById("playerArea")

  area.classList.remove("hide")

  clearTimeout(hideTimeout)

  hideTimeout = setTimeout(()=>{
    area.classList.add("hide")
  },3000)
}

document.getElementById("playerArea").addEventListener("mousemove", mostrarControles)
document.getElementById("playerArea").addEventListener("click", mostrarControles)

// CONTROLE TECLADO
document.addEventListener("keydown",(e)=>{

  if(e.key === "ArrowDown"){
    index = (index+1) % canais.length
    tocar(index)
  }

  if(e.key === "ArrowUp"){
    index = (index-1 + canais.length) % canais.length
    tocar(index)
  }

})

// ================= PERFIL =================

function abrirPerfil(){

  document.getElementById("perfilModal").style.display = "flex"

  document.getElementById("inputNome").value =
    localStorage.getItem("userNome") || ""

  document.getElementById("inputFoto").value =
    localStorage.getItem("userFoto") || ""

  document.getElementById("inputLista").value =
    localStorage.getItem("iptv") || ""

}

function fecharPerfil(){
  document.getElementById("perfilModal").style.display = "none"
}

async function salvarPerfil(){

  const nome = document.getElementById("inputNome").value
  const lista = document.getElementById("inputLista").value
  const file = document.getElementById("inputFotoFile").files[0]

  if(nome){
    localStorage.setItem("userNome", nome)
  }

  if(lista){
    localStorage.setItem("iptv", lista)
  }

  // FOTO DO CELULAR
  if(file){
    const base64 = await lerImagem(file)
    localStorage.setItem("userFoto", base64)
  }

  carregarUsuario()
  fecharPerfil()

  if(lista){
    location.reload()
  }
}

function carregarUsuario(){

  document.getElementById("userName").innerText =
    localStorage.getItem("userNome") || "Usuário"

  document.getElementById("userPhoto").src =
    localStorage.getItem("userFoto") || "https://via.placeholder.com/100"
}

// ================= HEADER AUTO HIDE =================

let headerTimeout

function mostrarHeader(){

  const area = document.getElementById("playerArea")

  area.classList.remove("hideHeader")

  clearTimeout(headerTimeout)

  headerTimeout = setTimeout(()=>{
    area.classList.add("hideHeader")
  },3000)
}

document.getElementById("playerArea").addEventListener("mousemove", mostrarHeader)
document.getElementById("playerArea").addEventListener("click", mostrarHeader)

function lerImagem(file){
  return new Promise((resolve)=>{
    const reader = new FileReader()
    reader.onload = (e)=> resolve(e.target.result)
    reader.readAsDataURL(file)
  })
}
video.onerror = () => {

  console.log("Canal não funcionou, pulando...")

  index = (index + 1) % canais.length
  tocar(index)

}
// CANAIS EXNA (FIXOS)
const canaisExtras = [

{
  nome:"🎬 EXNA Filmes",
  url:"https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
},

{
  nome:"📺 EXNA Séries",
  url:"https://test-streams.mux.dev/test_001/stream.m3u8"
},

{
  nome:"🍥 EXNA Anime",
  url:"https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8"
},

{
  nome:"🌍 EXNA Doc",
  url:"https://mojan.tv/hls/playlist.m3u8"
}

]

// ADICIONA NO TOPO
canais = [...canaisExtras, ...canais]



let favoritos = JSON.parse(localStorage.getItem("favoritos") || "[]")

function toggleFav(url){

  if(favoritos.includes(url)){
    favoritos = favoritos.filter(f=>f !== url)
  }else{
    favoritos.push(url)
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos))

  renderLista()
}
canais.sort((a,b)=>{

  const aFav = favoritos.includes(a.url) ? 0 : 1
  const bFav = favoritos.includes(b.url) ? 0 : 1

  return aFav - bFav
})

let holdTimeout
let canalSelecionado = null

function ativarHold(el, canal){

  el.addEventListener("mousedown", ()=>{
    holdTimeout = setTimeout(()=>{
      canalSelecionado = canal
      document.getElementById("contextMenu").style.display = "block"
    }, 600)
  })

  el.addEventListener("mouseup", ()=>{
    clearTimeout(holdTimeout)
  })

  el.addEventListener("mouseleave", ()=>{
    clearTimeout(holdTimeout)
  })

}
function addFavorito(){

  if(!canalSelecionado) return

  if(!favoritos.includes(canalSelecionado.url)){
    favoritos.push(canalSelecionado.url)
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos))

  ordenarCanais() // 🔥 ESSENCIAL

  document.getElementById("contextMenu").style.display = "none"

  renderLista()
}

if(!window._controleAtivo){

  window._controleAtivo = true

  let bloqueado = false

}

function ordenarCanais(){

  canais.sort((a,b)=>{
    const aFav = favoritos.includes(a.url) ? 0 : 1
    const bFav = favoritos.includes(b.url) ? 0 : 1
    return aFav - bFav
  })

}
function atualizarSelecao(){

  const lista = document.querySelectorAll(".channel")

  lista.forEach(el => el.classList.remove("active"))

  if(lista[index]){
    lista[index].classList.add("active")

    lista[index].scrollIntoView({
      behavior: "smooth",
      block: "center"
    })
  }

}

function irParaProximo(){

  let i = canais.findIndex(c => c.url === canalAtual)

  i = (i + 1) % canais.length

  tocar(i)
}

function irParaAnterior(){

  let i = canais.findIndex(c => c.url === canalAtual)

  i = (i - 1 + canais.length) % canais.length

  tocar(i)
}

let navegando = false

function irParaProximo(){

  if(navegando) return
  navegando = true

  index = (index + 1) % canais.length
  tocar(index)

  setTimeout(()=>{
    navegando = false
  },300)

}

function irParaAnterior(){

  if(navegando) return
  navegando = true

  index = (index - 1 + canais.length) % canais.length
  tocar(index)

  setTimeout(()=>{
    navegando = false
  },300)

}

let ultimoEnter = 0

document.addEventListener("keydown",(e)=>{

  if(e.key === "Enter"){

    const agora = Date.now()
    const diff = agora - ultimoEnter

    const el = document.getElementById("playerArea")

    // 🔊 1 clique (normal)
    if(diff > 400){
      video.muted = false
      video.play().catch(()=>{})
    }

    // ⛶ clique duplo rápido
    else{
      if(!document.fullscreenElement){
        el.requestFullscreen().catch(()=>{})
      }else{
        document.exitFullscreen().catch(()=>{})
      }
    }

    ultimoEnter = agora
  }

})

const inputBusca = document.getElementById("busca")

inputBusca.addEventListener("input", ()=>{

  const termo = inputBusca.value.toLowerCase()

  const filtrados = canais.filter(c =>
    c.nome.toLowerCase().includes(termo)
  )

  renderListaFiltrada(filtrados)

})
if(e.key === "/"){
  document.getElementById("busca").focus()
}
let mobilePlayer = null

function abrirMobile(i, el){

  // remove player anterior
  if(mobilePlayer){
    mobilePlayer.remove()
  }

  const c = canais[i]

  index = i
  canalAtual = c.url

  const div = document.createElement("div")
  div.className = "mobilePlayer"

  div.innerHTML = `
    <video playsinline></video>

    <div class="mobileInfo">
      <h3>${c.nome}</h3>
      <button onclick="togglePlayMobile()">▶</button>
      <button onclick="toggleMuteMobile()">🔊</button>
      <button onclick="fullscreenMobile()">⛶</button>
    </div>
  `

  el.after(div)
  mobilePlayer = div

  const v = div.querySelector("video")
  mobileVideo = v // 🔥 salva o vídeo atual

  if(Hls.isSupported()){
    const hlsMobile = new Hls()
    hlsMobile.loadSource(c.url)
    hlsMobile.attachMedia(v)
  }else{
    v.src = c.url
  }

  v.play().catch(()=>{})
  v.muted = false
  mobileVideo.setAttribute("controls", true)
mobileVideo.setAttribute("playsinline", true)
mobileVideo.setAttribute("webkit-playsinline", true)
}

function togglePlayMobile(){
  if(!mobileVideo) return
  mobileVideo.paused ? mobileVideo.play() : mobileVideo.pause()
}

function toggleMuteMobile(){
  if(!mobileVideo) return
  mobileVideo.muted = !mobileVideo.muted
  mobileVideo.play().catch(()=>{})
}

function fullscreenMobile(){

  if(!mobileVideo) return

  // Android Chrome
  if(mobileVideo.requestFullscreen){
    mobileVideo.requestFullscreen()
  }

  // iPhone Safari (ESSENCIAL)
  else if(mobileVideo.webkitEnterFullscreen){
    mobileVideo.webkitEnterFullscreen()
  }

}
document.addEventListener("touchstart", ()=>{}, true)
const area = document.getElementById("playerArea")

area.classList.remove("hideInfo")

setTimeout(()=>{
  area.classList.add("hideInfo")
},3000)