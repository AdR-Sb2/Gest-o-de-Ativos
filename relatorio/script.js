// Aponta para a base de dados em CSV que você já tem na raiz do projeto
const LINK_PLANILHA_ONLINE = '../Atributos 18.05.csv'; 
let baseDadosLocal = [];

// Carrega o CSV assim que a página abre
window.onload = async function() {
    try {
        const response = await fetch(LINK_PLANILHA_ONLINE);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('windows-1252');
        const data = decoder.decode(buffer);
        processarCSV(data);
        console.log("Banco de dados local integrado com sucesso!");
    } catch (error) {
        console.error("Erro ao ler banco de dados local:", error);
    }
    renderizarCamposMotores(); // Desenha os blocos iniciais
};

function processarCSV(textoCSV) {
    const linhas = textoCSV.split('\n');
    baseDadosLocal = linhas.map(linha => {
        const colunas = linha.split(';');
        return {
            municipio: colunas[1] ? colunas[1].trim() : '',
            tagPlanta: colunas[2] ? colunas[2].trim() : '',
            descPlanta: colunas[3] ? colunas[3].trim() : '',
            tagComp: colunas[4] ? colunas[4].trim() : '',
            descComp: colunas[5] ? colunas[5].trim() : '',
            atributo: colunas[6] ? colunas[6].trim() : '',
            valor: colunas[7] ? colunas[7].trim() : ''
        };
    });
}

// 1. MONITOR DE QUANTIDADE DE GRUPOS - GERA OS CAMPOS NA HORA
document.getElementById('qtdGrupos').addEventListener('change', renderizarCamposMotores);

function renderizarCamposMotores() {
    const quantidade = parseInt(document.getElementById('qtdGrupos').value);
    const container = document.getElementById('containerMotores');
    container.innerHTML = ''; // Limpa anterior

    for (let i = 1; i <= quantidade; i++) {
        // Se pular o 3 e for pro 4 igual no modelo JK, ajustamos o rótulo
        let numeroGrupo = i;
        if (quantidade === 4 && i === 3) numeroGrupo = i; // Mantém sequencial padrão ou força personalizado

        const divGrupo = document.createElement('div');
        divGrupo.className = 'section-block';
        divGrupo.innerHTML = `
            <h2>Parâmetros: Motor G${numeroGrupo}</h2>
            <div class="form-group">
                <label>Modelo da Contatora, Soft ou Inversor</label>
                <input type="text" id="acionamento_G${numeroGrupo}" placeholder="Ex: INVERSOR DE FREQUÊNCIA SD750">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>RPM</label>
                    <input type="text" id="rpm_G${numeroGrupo}" placeholder="Ex: 1790">
                </div>
                <div class="form-group">
                    <label>Potência</label>
                    <input type="text" id="potencia_G${numeroGrupo}" placeholder="Ex: 450CV">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tensão FF</label>
                    <input type="text" id="tensao_G${numeroGrupo}" placeholder="Ex: 440V">
                </div>
                <div class="form-group">
                    <label>Corrente Elétrica</label>
                    <input type="text" id="corrente_G${numeroGrupo}" placeholder="Ex: 391/391A/385A">
                </div>
            </div>
        `;
        container.appendChild(divGrupo);
    }
}

// 2. BUSCA AUTOMÁTICA INTELIGENTE DENTRO DO CSV LOCAL
document.getElementById('btnBuscar').addEventListener('click', function() {
    const busca = document.getElementById('tagAtivo').value.trim().toUpperCase();
    if(!busca) return alert('Digite uma TAG ou Ordem!');

    // Procura na base de dados carregada do seu CSV
    const registro = baseDadosLocal.find(r => r.tagComp.toUpperCase() === busca || r.tagPlanta.toUpperCase() === busca);

    if (registro) {
        document.getElementById('lblUnidade').innerText = registro.descPlanta;
        document.getElementById('lblPlanta').innerText = registro.tagPlanta;
        document.getElementById('lblMunicipio').innerText = registro.municipio;

        // Customização automática de pressão se for o Booster JK (Planta 0746)
        const containerPressoes = document.getElementById('containerPressoes');
        if (registro.tagPlanta.includes('0746') || registro.descPlanta.includes('JK')) {
            containerPressoes.innerHTML = `
                <div class="form-group">
                    <label for="recalqueVelho">JK VELHO (mca)</label>
                    <input type="text" id="recalqueVelho" value="59MCA">
                </div>
                <div class="form-group">
                    <label for="recalqueNovo">JK NOVO (mca)</label>
                    <input type="text" id="recalqueNovo" value="92MCA">
                </div>
            `;
            document.getElementById('retaguarda').value = "10MCA";
        } else {
            // Volta para o layout de recalque único comum para outras subestações
            containerPressoes.innerHTML = `
                <div class="form-group">
                    <label for="recalque">Recalque (mca)</label>
                    <input type="text" id="recalque" placeholder="Ex: 90">
                </div>
            `;
        }
    } else {
        alert("TAG não localizada no Atributos.csv. Pode preencher os dados manualmente.");
        document.getElementById('lblUnidade').innerText = "Unidade Customizada";
        document.getElementById('lblPlanta').innerText = busca;
        document.getElementById('lblMunicipio').innerText = "---";
    }
});

// 3. GERAÇÃO DO TEXTO PADRONIZADO IGUAL AO ANTIGO
function gerarTextoRelatorio() {
    const unidade = document.getElementById('lblUnidade').innerText;
    const planta = document.getElementById('lblPlanta').innerText;
    const municipio = document.getElementById('lblMunicipio').innerText;
    const tag = document.getElementById('tagAtivo').value.trim();

    const retaguarda = document.getElementById('retaguarda').value.trim();
    const tipoServico = document.querySelector('input[name="tipoServico"]:checked').value;
    const servicoExecutado = document.getElementById('servicoExecutado').value.trim();
    const obs = document.getElementById('obs').value.trim();
    const chegada = document.getElementById('statusChegada').value;
    const saida = document.getElementById('statusSaida').value;
    const modo = document.getElementById('modoOperacao').value;
    const colaboradores = document.getElementById('colaboradores').value.trim();

    let texto = `*UNIDADE: ${unidade}*\n`;
    if(planta !== "---") texto += `*PLANTA DO INFRA:* ${planta}\n`;
    texto += `*MUNICÍPIO:* ${municipio}\n`;
    texto += `-----------------------------<>--------\n`;
    texto += `*CAMPO DE PREENCHIMENTO DA EQUIPE EXECUTANTE*\n\n`;
    texto += `TAG/ORDEM: ${tag}\n\n`;

    // Varre a quantidade selecionada de motores dinamicamente
    const quantidade = parseInt(document.getElementById('qtdGrupos').value);
    for (let i = 1; i <= quantidade; i++) {
        let n = i; 
        const aci = document.getElementById(`acionamento_G${n}`).value.trim();
        const rpm = document.getElementById(`rpm_G${n}`).value.trim();
        const pot = document.getElementById(`potencia_G${n}`).value.trim();
        const ten = document.getElementById(`tensao_G${n}`).value.trim();
        const cor = document.getElementById(`corrente_G${n}`).value.trim();

        texto += `*MOTOR G${n}*\n`;
        texto += `*MODELO DA CONTATORA, SOFT OU INVERSOR:* ${aci || '---'}\n`;
        texto += `*RPM:* ${rpm || '---'}\n`;
        texto += `*POTÊNCIA:* ${pot || '---'}\n`;
        texto += `*TENSÃO FF:* ${ten || '---'}\n`;
        texto += `*CORRENTE ELÉTRICA:* ${cor || '---'}\n\n`;
    }

    // Processamento de Pressões Hidráulicas
    if(retaguarda) texto += `*RETAGUARDA:* ${retaguarda.toUpperCase().includes('MCA') ? retaguarda : retaguarda + 'MCA'}\n`;
    
    if(document.getElementById('recalque')) {
        const rec = document.getElementById('recalque').value.trim();
        if(rec) texto += `*RECALQUE:* ${rec.toUpperCase().includes('MCA') ? rec : rec + 'MCA'}\n`;
    } else {
        const rVelho = document.getElementById('recalqueVelho').value.trim();
        const rNovo = document.getElementById('recalqueNovo').value.trim();
        texto += `*RECALQUE:JK VELHO:* ${rVelho}\n`;
        texto += `*RECALQUE:JK NOVO:* ${rNovo}\n`;
    }
    texto += `\n`;

    texto += `*SERVIÇO EXECUTADO:* ${servicoExecutado}\n\n`;
    texto += `*OBS:* ${obs || '---'}\n\n`;
    
    // Tratamento de nomes dos colaboradores por linha
    const listaNomes = colaboradores.split(/[,/]/).map(n => n.trim()).join('\n');
    texto += `*COLABORADORES:*\n${listaNomes}\n\n`;
    
    texto += `*Na chegada:* ${chegada === 'Ligado' ? 'Ligado (x) Desligado ()' : 'Ligado () Desligado (x)'}\n`;
    texto += `*Na saída:* ${saida === 'Ligado' ? 'Ligado (x) Desligado ()' : 'Ligado () Desligado (x)'}\n`;
    texto += `*Status:* ${modo === 'Automático' ? 'Manual ()  Automático (x)' : 'Manual (x)  Automático ()'}`;

    return texto;
}

// 4. MECANISMO DE CÓPIA SEGURO MOBILE
function executarCopiaTexto(texto) {
    return new Promise((resolve) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto).then(() => resolve(true)).catch(() => fallbackCopiaFoco(texto, resolve));
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
    textArea.style.background = "transparent";
    textArea.style.border = "none";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, 999999);
    let sucesso = false;
    try { sucesso = document.execCommand('copy'); } catch (err) { sucesso = false; }
    document.body.removeChild(textArea);
    if (!sucesso) window.prompt("Seu celular barrou a cópia automática. Segure abaixo e copie:", texto);
    resolve(true);
}

// 5. EVENTOS DOS BOTÕES
document.getElementById('btnCopiarText').addEventListener('click', function() {
    if(!document.getElementById('servicoExecutado').value || !document.getElementById('colaboradores').value) {
        alert('Preencha os campos obrigatórios!');
        return;
    }
    const textoPronto = gerarTextoRelatorio();
    const btn = document.getElementById('btnCopiarText');
    executarCopiaTexto(textoPronto).then(() => {
        btn.innerText = "Copiado com Sucesso! ✓";
        btn.style.backgroundColor = "#10b981";
        setTimeout(() => {
            btn.innerText = "Copiar Texto do Relatório 📋";
            btn.style.backgroundColor = "";
        }, 2000);
    });
});

document.getElementById('relatorioForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const textoCompleto = gerarTextoRelatorio();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompleto)}`, '_blank');
});