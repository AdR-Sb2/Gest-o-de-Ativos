// Link do seu Google Apps Script (Usa o mesmo do seu formulário de Atributos)
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzJ-hJKfhdf7zMowwzTh4QX6VoN38OCukExhpNfgY4jJNG5QO8l4-uE_12AT53_lUhaLQ/exec"; 

// 1. BUSCA DE INFRAESTRUTURA POR TAG
document.getElementById('btnBuscar').addEventListener('click', function() {
    const busca = document.getElementById('tagAtivo').value.trim();
    if(!busca) {
        alert('Digite uma TAG ou Ordem para realizar a busca!');
        return;
    }
    
    // Dados simulados para teste rápido de preenchimento
    document.getElementById('lblUnidade').innerText = "EEAT 692 - PRAÇA DA BÍBLIA";
    document.getElementById('lblPlanta').innerText = "PL-RJB-EAT0692";
    document.getElementById('lblEndereco').innerText = "Av. Olímpia da Silva - Pacaembu, Queimados - RJ";
    
    document.getElementById('potencia').value = "12.5cv";
    document.getElementById('rpm').value = "3515";
    document.getElementById('acionamento').value = "Contatora DIL M50";
});

// 2. MONTAGEM DO TEXTO DO WHATSAPP
function gerarTextoRelatorio() {
    const tag = document.getElementById('tagAtivo').value.trim() || '0';
    const unidade = document.getElementById('lblUnidade').innerText;
    const planta = document.getElementById('lblPlanta').innerText;
    const endereco = document.getElementById('lblEndereco').innerText;
    
    const potencia = document.getElementById('potencia').value.trim() || '';
    const rpm = document.getElementById('rpm').value.trim() || '';
    const acionamento = document.getElementById('acionamento').value.trim() || '';
    const tensao = document.getElementById('tensao').value.trim() || '';
    const corrente = document.getElementById('corrente').value.trim() || '';
    const recalque = document.getElementById('recalque').value.trim() || '';
    const retaguarda = document.getElementById('retaguarda').value.trim() || '';
    const correnteShut = document.getElementById('correnteShut').value.trim() || '';
    const recalqueShut = document.getElementById('recalqueShut').value.trim() || '';
    const retaguardaShut = document.getElementById('retaguardaShut').value.trim() || '';

    const tipoServico = document.querySelector('input[name="tipoServico"]:checked').value;
    const servicoExecutado = document.getElementById('servicoExecutado').value.trim();
    const chegada = document.getElementById('statusChegada').value;
    const saida = document.getElementById('statusSaida').value;
    const modo = document.getElementById('modoOperacao').value;
    const colaboradores = document.getElementById('colaboradores').value.trim();

    let texto = `*${unidade}*\n`;
    if(planta !== "---") texto += `*PLANTA DO INFRA:* ${planta}\n`;
    texto += `*Endereço:* ${endereco}\n\n`;
    texto += `*CAMPO DE PREENCHIMENTO DA EQUIPE EXECUTANTE*\n\n`;
    texto += `TAG/ORDEM: ${tag}\n\n`;
    texto += `*Potência:* ${potencia}\n`;
    texto += `*RPM do Motor:* ${rpm}\n`;
    texto += `*Modelo da Contatora, Soft ou Inversor:* ${acionamento}\n`;
    texto += `*Tensão:* ${tensao}\n`;
    texto += `*Corrente Total:* ${corrente}\n`;
    texto += `*Recalque:* ${recalque}${recalque ? 'mca' : ''}\n`;
    texto += `*Retaguarda:* ${retaguarda}${retaguarda ? 'mca' : ''}\n`;
    texto += `*Corrente shut off:* ${correnteShut}\n`;
    texto += `*Recalque shut off:* ${recalqueShut}\n`;
    texto += `*Retaguarda shut off:* ${retaguardaShut}${retaguardaShut && !retaguardaShut.includes('mca') ? 'mca' : ''}\n\n`;
    
    texto += `*Tipo de serviço:* ${tipoServico === 'Preventiva' ? '(x)Preventiva  ( )Corretiva' : '( )Preventiva  (x)Corretiva'}\n\n`;
    texto += `*Serviço executado:* ${servicoExecutado}\n\n`;
    
    const listaNomes = colaboradores.split(',').map(n => n.trim()).join('\n');
    texto += `*NOME DOS COLABORADORES:*\n${listaNomes}\n\n`;
    
    texto += `*Na chegada:* ${chegada === 'Ligado' ? 'Ligado (x) Desligado ()' : 'Ligado () Desligado (x)'}\n`;
    texto += `*Na saída:* ${saida === 'Ligado' ? 'Ligado (x) Desligado ()' : 'Ligado () Desligado (x)'}\n`;
    texto += `*Status:* ${modo === 'Automático' ? 'Manual ()  Automático (x)' : 'Manual (x)  Automático ()'}`;

    return texto;
}

// 3. SISTEMA DE CÓPIA ROBUSTO (INFALÍVEL)
function executarCopiaTexto(texto) {
    return new Promise((resolve) => {
        // Tenta a API moderna primeiro
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
    
    // Seleção focada e agressiva para mobile/iOS
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
        // Fallback limite: Abre um prompt para o utilizador dar copiar manualmente
        window.prompt("Pressione e segure o texto abaixo para copiar:", texto);
        resolve(true);
    }
}

// 4. AÇÃO DO BOTÃO DE COPIAR
document.getElementById('btnCopiarText').addEventListener('click', function() {
    if(!document.getElementById('servicoExecutado').value || !document.getElementById('colaboradores').value) {
        alert('Por favor, preencha os campos obrigatórios (Serviço Executado e Colaboradores) antes de copiar!');
        return;
    }

    const textoPronto = gerarTextoRelatorio();
    const btn = document.getElementById('btnCopiarText');
    const corOriginal = btn.style.backgroundColor;
    
    executarCopiaTexto(textoPronto).then(() => {
        btn.innerText = "Copiado com Sucesso! ✓";
        btn.style.backgroundColor = "#10b981";
        setTimeout(() => {
            btn.innerText = "Copiar Texto do Relatório 📋";
            btn.style.backgroundColor = corOriginal;
        }, 2000);
    });
});

// 5. ENVIAR PARA O SHEETS + WHATSAPP
document.getElementById('relatorioForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const btnSubmit = document.getElementById('btnWhats');
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Gravando na Planilha...";

    const payload = [{
        tipoOperacao: "RELATORIO_SERVICO",
        tag: document.getElementById('tagAtivo').value,
        unidade: document.getElementById('lblUnidade').innerText,
        servico: document.getElementById('servicoExecutado').value,
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