// CONFIGURAÇÃO INICIAL
const WEB_APP_URL = "SEU_LINK_DO_GOOGLE_APPS_SCRIPT_AQUI";

// 1. INTEGRAÇÃO DE NAVEGAÇÃO (Troca de Telas)
function abrirForm(tipo) {
    // Esconde o menu
    document.getElementById('menuPrincipal').style.display = 'none';
    
    if (tipo === 'atualizacao') {
        document.getElementById('formAtualizacao').style.display = 'block';
        carregarEquipes('.select-equipe'); // Carrega as equipes no select de atualização
    } else if (tipo === 'movimentacao') {
        document.getElementById('formMovimentacao').style.display = 'block';
        carregarEquipes('.select-equipe'); // Carrega as equipes no select de movimentação
    }
}

function voltarMenu() {
    document.getElementById('menuPrincipal').style.display = 'block';
    document.getElementById('formAtualizacao').style.display = 'none';
    document.getElementById('formMovimentacao').style.display = 'none';
    // Limpa os formulários ao voltar para evitar confusão
    document.getElementById('dataEntryForm').reset();
    document.getElementById('movimentacaoForm').reset();
}

// 2. CARREGAMENTO DINÂMICO DE EQUIPES (Comum aos dois)
function carregarEquipes(seletor) {
    const selects = document.querySelectorAll(seletor);
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
        })
        .catch(err => console.error("Erro ao carregar equipes:", err));
}

// 3. INTEGRAÇÃO DO ENVIO DE MOVIMENTAÇÃO
document.getElementById('movimentacaoForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerText = "Registrando...";

    const fotoFile = document.getElementById('mov_foto').files[0];
    let fotoBase64 = "";

    if (fotoFile) {
        fotoBase64 = await converterParaBase64(fotoFile);
    }

    const payload = [{
        tipoOperacao: "MOVIMENTACAO", // Crucial para o Script do Google saber a aba
        equipe: e.target.querySelector('.select-equipe').value,
        equipamento: document.getElementById('mov_equip').value,
        origem: document.getElementById('mov_origem').value,
        destino: document.getElementById('mov_destino').value,
        dataHora: new Date().toLocaleString('pt-BR'),
        evidencia: fotoBase64
    }];

    enviarParaGoogle(payload, btn);
});

// 4. FUNÇÃO DE ENVIO UNIFICADA
function enviarParaGoogle(payload, botao) {
    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        body: JSON.stringify(payload)
    })
    .then(() => {
        alert("Registrado com sucesso!");
        voltarMenu();
    })
    .catch(err => {
        alert("Erro ao salvar: " + err);
    })
    .finally(() => {
        botao.disabled = false;
        botao.innerText = "Salvar / Registrar";
    });
}

// Auxiliar para converter foto
function converterParaBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// --- Aqui continua a sua lógica antiga de "Verificar TAG" e "Campos Dinâmicos" ---
// Apenas garanta que o evento de submit do 'dataEntryForm' envie tipoOperacao: "MANUTENCAO"