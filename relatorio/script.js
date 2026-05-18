// Link do seu Google Apps Script 
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzJ-hJKfhdf7zMowwzTh4QX6VoN38OCukExhpNfgY4jJNG5QO8l4-uE_12AT53_lUhaLQ/exec"; 

// 1. FUNÇÃO MESTRE QUE MONTA O PADRÃO EXATO EXIGIDO
function gerarTextoRelatorio() {
    const nomeBooster = document.getElementById('nomeBooster').value.trim();
    const unidade = document.getElementById('unidade').value.trim();
    const endereco = document.getElementById('endereco').value.trim();

    // Dados Hidráulicos
    const retaguarda = document.getElementById('retaguarda').value.trim();
    const recalqueVelho = document.getElementById('recalqueVelho').value.trim();
    const recalqueNovo = document.getElementById('recalqueNovo').value.trim();

    const servico = document.getElementById('servico').value.trim();
    const obs = document.getElementById('obs').value.trim();
    const colaboradores = document.getElementById('colaboradores').value.trim();

    // Construção da String do Relatório
    let texto = `${nomeBooster}\n`;
    texto += `*UNIDADE: ${unidade}*\n`;
    texto += `*ENDEREÇO: ${endereco}*\n`;
    texto += `-----------------------------<>--------\n`;
    texto += `*CAMPO DE PREENCHIMENTO DA EQUIPE EXECUTANTE*\n\n`;

    // Função interna auxiliar para adicionar dados do motor se preenchidos
    function adicionarMotor(nome, acionamento, rpm, potencia, tensao, corrente) {
        let mText = `*${nome}*\n`;
        mText += `*MODELO DA CONTATORA, SOFT OU INVERSOR: ${acionamento}*\n`;
        mText += `*RPM: ${rpm}*\n`;
        mText += `*POTÊNCIA: ${potencia}*\n`;
        mText += `*TENSÃO FF: ${tensao}*\n`;
        mText += `*CORRENTE ELÉTRICA:* ${corrente}\n\n`;
        return mText;
    }

    // Adiciona os 3 motores cadastrados
    texto += adicionarMotor("MOTOR G1", document.getElementById('acionamentoG1').value, document.getElementById('rpmG1').value, document.getElementById('potenciaG1').value, document.getElementById('tensaoG1').value, document.getElementById('correnteG1').value);
    texto += adicionarMotor("MOTOR G2", document.getElementById('acionamentoG2').value, document.getElementById('rpmG2').value, document.getElementById('potenciaG2').value, document.getElementById('tensaoG2').value, document.getElementById('correnteG2').value);
    texto += adicionarMotor("MOTOR G4", document.getElementById('acionamentoG4').value, document.getElementById('rpmG4').value, document.getElementById('potenciaG4').value, document.getElementById('tensaoG4').value, document.getElementById('correnteG4').value);

    // Pressões
    texto += `*RETAGUARDA ${retaguarda}*\n`;
    texto += `*RECALQUE:JK VELHO ${recalqueVelho}*\n`;
    texto += `*RECALQUE:JK NOVO ${recalqueNovo}*\n\n`;

    // Finalização
    texto += `*SERVIÇO EXECUTADO:* ${servico}\n\n`;
    texto += `*OBS:* ${obs || '---'}\n\n`;
    texto += `*COLABORADORES:* ${colaboradores}`;

    return texto;
}

// 2. SISTEMA DE CÓPIA ROBUSTO (MÉTODO OCULTO DE ALTO FOCO)
function executarCopiaTexto(texto) {
    return new Promise((resolve) => {
        // Tenta usando o método Clipboard moderno
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto)
                .then(() => resolve(true))
                .catch(() => fallbackCopiaFoco(texto, resolve));
        } else {
            fallbackCopiaFoco(texto, resolve);
        }
    });
}

function fallbackCopiaFoco(texto, resolve) {
    // Cria elemento invisível mas totalmente focado para forçar a cópia no Mobile/Safari
    const textArea = document.createElement("textarea");
    textArea.value = texto;
    textArea.style.position = "fixed";
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = "0";
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.background = "transparent";
    document.body.appendChild(textArea);
    
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 999999);
    
    let sucesso = false;
    try {
        sucesso = document.execCommand('copy');
    } catch (err) {
        sucesso = false;
    }
    document.body.removeChild(textArea);
    
    if (sucesso) {
        resolve(true);
    } else {
        // Fallback Crítico: Exibe o prompt se todas as APIs do celular falharem
        window.prompt("Pressione e segure o texto abaixo para copiar:", texto);
        resolve(true);
    }
}

// 3. EVENTO CLIQUE BOTÃO COPIAR
document.getElementById('btnCopiarText').addEventListener('click', function() {
    if(!document.getElementById('servico').value || !document.getElementById('colaboradores').value) {
        alert('Por favor, preencha os campos obrigatórios antes de copiar!');
        return;
    }

    const textoPronto = gerarTextoRelatorio();
    const btn = document.getElementById('btnCopiarText');
    const corOriginal = btn.style.backgroundColor;
    
    executarCopiaTexto(textoPronto).then(() => {
        btn.innerText = "Copiado com Sucesso! ✓";
        btn.style.backgroundColor = "#10b981"; // Muda para verde
        setTimeout(() => {
            btn.innerText = "Copiar Texto do Relatório 📋";
            btn.style.backgroundColor = corOriginal;
        }, 2000);
    });
});

// 4. SUBMISSÃO DE DADOS (BANCO DE DADOS + REDIRECIONAMENTO WHATSAPP)
document.getElementById('relatorioForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const btnSubmit = document.getElementById('btnWhats');
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Gravando na Planilha...";

    const payload = [{
        tipoOperacao: "RELATORIO_MULTIPLOMOTOR",
        unidade: document.getElementById('unidade').value,
        servico: document.getElementById('servico').value,
        colaboradores: document.getElementById('colaboradores').value,
        dataHora: new Date().toLocaleString('pt-BR')
    }];

    fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(payload)
    }).then(() => {
        const textoCompleto = gerarTextoRelatorio();
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompleto)}`, '_blank');
    }).catch(err => {
        console.error("Erro no Sheets:", err);
        const textoCompleto = gerarTextoRelatorio();
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompleto)}`, '_blank');
    }).finally(() => {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Salvar Planilha + WhatsApp 🚀";
    });
});