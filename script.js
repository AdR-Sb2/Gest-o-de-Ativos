// URL do seu Google Apps Script (Mantenha a sua ativa)
const WEB_APP_URL = "SEU_LINK_AQUI";

// FUNÇÃO PARA TROCAR DE TELA
function alternarTela(tela) {
    // Esconde tudo primeiro
    document.getElementById('menuPrincipal').style.display = 'none';
    document.getElementById('formAtualizacao').style.display = 'none';
    document.getElementById('formMovimentacao').style.display = 'none';

    if (tela === 'atualizacao') {
        document.getElementById('formAtualizacao').style.display = 'block';
        carregarEquipes();
    } else if (tela === 'movimentacao') {
        document.getElementById('formMovimentacao').style.display = 'block';
        carregarEquipes();
    } else {
        document.getElementById('menuPrincipal').style.display = 'block';
    }
}

// CARREGAR EQUIPES NOS DOIS FORMULÁRIOS
function carregarEquipes() {
    const selects = document.querySelectorAll('.select-equipe');
    fetch(`${WEB_APP_URL}?action=getColaboradores`)
        .then(res => res.json())
        .then(nomes => {
            selects.forEach(select => {
                select.innerHTML = '<option value="">Selecione a Equipe</option>';
                nomes.forEach(nome => {
                    const opt = document.createElement('option');
                    opt.value = nome;
                    opt.textContent = nome;
                    select.appendChild(opt);
                });
            });
        });
}

// ENVIO DE MOVIMENTAÇÃO
document.getElementById('movimentacaoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = "Enviando...";

    // Coleta a foto se houver
    const file = document.getElementById('mov_foto').files[0];
    let base64 = "";
    if (file) {
        base64 = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
        });
    }

    const payload = [{
        tipoOperacao: "MOVIMENTACAO",
        equipe: e.target.querySelector('.select-equipe').value,
        equipamento: document.getElementById('mov_equip').value,
        origem: document.getElementById('mov_origem').value,
        destino: document.getElementById('mov_destino').value,
        dataHora: new Date().toLocaleString('pt-BR'),
        evidencia: base64
    }];

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    }).then(() => {
        alert("Movimentação registrada!");
        alternarTela('menu');
        e.target.reset();
    }).finally(() => {
        btn.disabled = false;
        btn.innerText = "Registrar Movimentação";
    });
});

// AQUI VOCÊ MANTÉM SUA LÓGICA DE VERIFICAR TAG E ENVIO DE ATRIBUTOS
// Apenas garanta que o envio de Atributos envie tipoOperacao: "MANUTENCAO"