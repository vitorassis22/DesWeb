/* --- DADOS --- */
const produtos = [
  { id: 1, nome: "Pneu Pirelli Aro 15", preco: 450.0, icon: "fa-circle-notch" },
  { id: 2, nome: "Óleo 5W30 Sintético", preco: 45.0, icon: "fa-oil-can" },
  { id: 3, nome: "Jogo de Calotas (4un)", preco: 80.0, icon: "fa-cog" },
  { id: 4, nome: "Palheta Limpador", preco: 25.0, icon: "fa-wind" },
  { id: 5, nome: "Bateria 60Ah", preco: 380.0, icon: "fa-car-battery" },
];

let usuarioAtual = JSON.parse(localStorage.getItem("speed_session")) || null;
let usuariosBanco = JSON.parse(localStorage.getItem("speed_db_users")) || [];
let transacoesGlobal = JSON.parse(localStorage.getItem("speed_db_trans")) || [];

/* --- INICIALIZAÇÃO --- */
document.addEventListener("DOMContentLoaded", () => {
  atualizarMenu();
  renderizarProdutos();
});

/* --- NAVEGAÇÃO --- */
function navegar(telaId) {
  if ((telaId === "tela-loja" || telaId === "tela-servicos") && !usuarioAtual) {
    alert("🔒 Faça login ou cadastre-se para acessar.");
    navegar("tela-login");
    return;
  }

  // Se sair da tela de serviços, limpa o formulário de edição
  if (telaId !== "tela-servicos") cancelarEdicao();

  document
    .querySelectorAll(".screen")
    .forEach((t) => t.classList.remove("active"));

  const telaAlvo = document.getElementById(telaId);
  if (telaAlvo) telaAlvo.classList.add("active");

  if (telaId === "tela-perfil") renderizarPerfil();

  atualizarBotoesMenu(telaId);
  window.scrollTo(0, 0);
}

function atualizarMenu() {
  const menu = document.getElementById("menu-container");
  const labelConta = usuarioAtual ? "Meu Perfil" : "Entrar / Cadastrar";
  const acaoConta = usuarioAtual
    ? "navegar('tela-perfil')"
    : "navegar('tela-login')";

  menu.innerHTML = `
        <button onclick="navegar('tela-home')" id="btn-tela-home">Início</button>
        <button onclick="navegar('tela-loja')" id="btn-tela-loja">Loja</button>
        <button onclick="navegar('tela-servicos')" id="btn-tela-servicos">Serviços</button>
        <button onclick="${acaoConta}" id="btn-tela-login" style="border: 1px solid rgba(255,255,255,0.3)">
            <i class="fas fa-user"></i> ${labelConta}
        </button>
    `;
}

function atualizarBotoesMenu(telaAtiva) {
  document
    .querySelectorAll(".menu-links button")
    .forEach((btn) => btn.classList.remove("active"));
  const btn = document.getElementById("btn-" + telaAtiva);
  if (telaAtiva === "tela-perfil" || telaAtiva === "tela-login") {
    document.getElementById("btn-tela-login").classList.add("active");
  } else if (btn) {
    btn.classList.add("active");
  }
}

/* --- AUTH --- */
function alternarFormulario(tipo) {
  const boxLogin = document.getElementById("box-login");
  const boxCadastro = document.getElementById("box-cadastro");
  if (tipo === "cadastro") {
    boxLogin.classList.add("hidden");
    boxCadastro.classList.remove("hidden");
  } else {
    boxCadastro.classList.add("hidden");
    boxLogin.classList.remove("hidden");
  }
}

function fazerCadastro(e) {
  e.preventDefault();
  const user = document.getElementById("cad-user").value;
  const pass = document.getElementById("cad-pass").value;
  if (usuariosBanco.find((u) => u.user === user)) {
    alert("❌ Usuário já existe!");
    return;
  }

  const novoUsuario = { user: user, pass: pass };
  usuariosBanco.push(novoUsuario);
  localStorage.setItem("speed_db_users", JSON.stringify(usuariosBanco));
  alert("✅ Conta criada!");
  logarUsuario(novoUsuario);
}

function fazerLogin(e) {
  e.preventDefault();
  const user = document.getElementById("login-user").value;
  const pass = document.getElementById("login-pass").value;
  const usuarioEncontrado = usuariosBanco.find(
    (u) => u.user === user && u.pass === pass
  );
  if (usuarioEncontrado) {
    logarUsuario(usuarioEncontrado);
  } else {
    alert("❌ Dados incorretos!");
  }
}

function logarUsuario(u) {
  usuarioAtual = u;
  localStorage.setItem("speed_session", JSON.stringify(usuarioAtual));
  atualizarMenu();
  navegar("tela-home");
}

function logout() {
  usuarioAtual = null;
  localStorage.removeItem("speed_session");
  location.reload();
}

/* --- LOJA --- */
function renderizarProdutos() {
  /* --- Ordenar Produtos por Ordem Alfabética --- */
  const produtosOrdenados = [...produtos].sort((a, b) => {
    return a.nome.localeCompare(b.nome);
  });

  document.getElementById("container-produtos").innerHTML = produtosOrdenados
    .map(
      (p) => `
        <div class="card">
            <div class="card-img"><i class="fas ${p.icon}"></i></div>
            <div class="card-info">
                <h4>${p.nome}</h4>
                <div class="price">R$ ${p.preco.toFixed(2)}</div>
                <button class="btn-full" onclick="comprar('${p.nome}', ${
        p.preco
      })">Comprar Agora</button>
            </div>
        </div>
    `
    )
    .join("");
}

function comprar(item, valor) {
  if (!usuarioAtual) {
    navegar("tela-login");
    return;
  }
  if (confirm(`Comprar ${item}?`)) {
    criarTransacao("Compra", item, "Pedido Confirmado", valor);
    alert("Compra realizada!");
  }
}

/* --- SERVIÇOS (CRUD) --- */

// Função unificada para Criar ou Editar
function processarServico(e) {
  e.preventDefault();
  if (!usuarioAtual) {
    navegar("tela-login");
    return;
  }

  const idEdicao = document.getElementById("serv-id-edicao").value;
  const tipo = document.getElementById("serv-tipo").value;
  const obs = document.getElementById("serv-obs").value;

  if (idEdicao) {
    // --- MODO EDIÇÃO ---
    const index = transacoesGlobal.findIndex((t) => t.id == idEdicao);
    if (index !== -1) {
      transacoesGlobal[index].detalhe = tipo; // Atualiza tipo
      transacoesGlobal[index].obs = obs; // Atualiza observação
      localStorage.setItem("speed_db_trans", JSON.stringify(transacoesGlobal));
      alert("✅ Serviço alterado com sucesso!");
    }
  } else {
    // --- MODO CRIAÇÃO ---
    criarTransacao("Serviço", tipo, obs, 0);
    alert("✅ Solicitação enviada!");
  }

  cancelarEdicao(); // Limpa form
  navegar("tela-perfil");
}

// Prepara a tela para Editar
function editarServico(id) {
  const item = transacoesGlobal.find((t) => t.id == id);
  if (!item) return;

  // 1. Vai para a tela de serviço
  navegar("tela-servicos");

  // 2. Preenche os campos
  document.getElementById("titulo-servico").innerText = "Alterar Solicitação";
  document.getElementById("serv-id-edicao").value = item.id;
  document.getElementById("serv-tipo").value = item.detalhe; // Detalhe guarda o Tipo
  document.getElementById("serv-obs").value = item.obs || "";

  // 3. Ajusta botões
  document.getElementById("btn-salvar-servico").innerText = "Salvar Alteração";
  document.getElementById("btn-cancelar-edicao").classList.remove("hidden");
}

function excluirServico(id) {
  if (confirm("Tem certeza que deseja apagar esta solicitação?")) {
    transacoesGlobal = transacoesGlobal.filter((t) => t.id != id);
    localStorage.setItem("speed_db_trans", JSON.stringify(transacoesGlobal));
    renderizarPerfil(); // Atualiza a tabela
  }
}

function cancelarEdicao() {
  document.getElementById("titulo-servico").innerText = "Solicitar Serviço";
  document.getElementById("serv-id-edicao").value = "";
  document.getElementById("serv-tipo").selectedIndex = 0;
  document.getElementById("serv-obs").value = "";
  document.getElementById("btn-salvar-servico").innerText = "Solicitar";
  document.getElementById("btn-cancelar-edicao").classList.add("hidden");
}

/* --- DATABASE CORE --- */
function criarTransacao(tipo, detalhe, obs, valor) {
  const nova = {
    id: Date.now(), // ID único baseado no tempo
    data: new Date().toLocaleDateString(),
    usuario: usuarioAtual.user,
    tipo: tipo, // 'Compra' ou 'Serviço'
    detalhe: detalhe, // Nome do produto ou Tipo do serviço
    obs: obs, // Observação extra
    valor: valor,
  };
  transacoesGlobal.unshift(nova);
  localStorage.setItem("speed_db_trans", JSON.stringify(transacoesGlobal));
}

function renderizarPerfil() {
  document.getElementById(
    "welcome-msg"
  ).innerText = `Olá, ${usuarioAtual.user}`;
  const tbody = document.querySelector("#tabela-historico tbody");
  tbody.innerHTML = "";

  const meusItens = transacoesGlobal.filter(
    (t) => t.usuario === usuarioAtual.user
  );

  if (meusItens.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="text-align:center">Sem histórico.</td></tr>';
    return;
  }

  meusItens.forEach((t) => {
    let colunaAcao = "";

    if (t.tipo === "Compra") {
      // Se for COMPRA, mostra o valor
      colunaAcao = `<span style="font-weight:bold; color:var(--green)">R$ ${t.valor.toFixed(
        2
      )}</span>`;
    } else {
      // Se for SERVIÇO, mostra botões de Editar/Excluir
      colunaAcao = `
                <button class="btn-action btn-edit" onclick="editarServico(${t.id})">Alterar</button>
                <button class="btn-action btn-del" onclick="excluirServico(${t.id})">Apagar</button>
            `;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${t.data}</td>
            <td>${t.tipo}</td>
            <td>
                <strong>${t.detalhe}</strong>
                ${
                  t.obs
                    ? '<br><small style="color:#666">' + t.obs + "</small>"
                    : ""
                }
            </td>
            <td>${colunaAcao}</td>
        `;
    tbody.appendChild(tr);
  });
}
