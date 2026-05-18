// Aponta para o seu arquivo real renomeado
const LINK_PLANILHA_ELEVATORIAS = 'bd_elevatoria.csv';
let baseElevatorias = [];

// 1. CARREGAMENTO DA PLANILHA REAL (Atualizado para ler acentos do Excel perfeitamente)
window.onload = async function() {
    try {
        const response = await fetch(LINK_PLANILHA_ELEVATORIAS);
        if (!response.ok) throw new Error("Erro ao acessar o arquivo de Elevatórias");
        const buffer = await response.arrayBuffer();
        
        // MUDANÇA AQUI: Alterado para 'utf-8' para corrigir os acentos corrompidos
        const decoder = new TextDecoder('utf-8'); 
        let data = decoder.decode(buffer);
        
        // Remove qualquer caractere invisível de salvamento do Excel (BOM)
        data = data.replace(/^\uFEFF/, '').replace(/^ï»¿/, '');
        
        processarCSVElevatorias(data);
        console.log("Planilha carregada com sucesso! Total de registros: " + baseElevatorias.length);
    } catch (error) {
        console.error("Erro ao carregar base de elevatórias:", error);
        alert("Aviso: Não foi possível ler '" + LINK_PLANILHA_ELEVATORIAS + "'. Modo manual liberado.");
    }
    renderizarCamposMotores(); // Desenha a estrutura inicial na tela
};

// Processa exatamente a estrutura do seu arquivo CSV real
function processarCSVElevatorias(textoCSV) {
    const linhas = textoCSV.split(/\r?\n/);
    if (linhas.length < 2) return;

    // Detecta se o separador gerado pelo Excel foi vírgula ou ponto e vírgula
    const primeiraLinha = linhas[0];
    const separador = primeiraLinha.includes(';') ? ';' : ',';

    baseElevatorias = []; 

    for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue;
        
        // Divide as colunas e limpa as aspas do CSV
        const colunas = linhas[i].split(separador).map(celula => celula.replace(/"/g, '').trim());
        
        // Mapeamento baseado estritamente no seu arquivo "BD Relatórios - Página1.csv"
        if (colunas[0] || colunas[1]) { 
            baseElevatorias.push({
                nomeElevatoria: colunas[0] || '',                  // Coluna A (ELEVATORIAS)
                tagPlanta: colunas[1] ? colunas[1].toUpperCase() : '', // Coluna B (PLANTA)
                localidade: colunas[4] || '',                      // Coluna E (BAIRRO)
                municipio: colunas[5] || ''                        // Coluna F (MUNICIPIO)
            });
        }
    }
}

// 2. MONITOR DINÂMICO DE QUANTIDADE DE GRUPOS (Totalmente manual e editável)
document.getElementById('qtdGrupos').addEventListener('change', renderizarCamposMotores);

function renderizarCamposMotores() {
    const quantidade = parseInt(document.getElementById('qtdGrupos').value);
    const container = document.getElementById('containerMotores');
    container.innerHTML = ''; 

    for (let i = 1; i <= quantidade; i++) {
        const divGrupo = document.createElement('div');
        divGrupo.className = 'section-block';
        divGrupo.innerHTML = `
            <div class="form-group" style="margin-bottom: 12px;">
                <label style="color: var(--primary); font-weight: 700;">NOME DO GRUPO (EDITÁVEL)</label>
                <input type="text" id="nome_G${i}" value="G${i}" style="border-color: var(--primary); font-weight: bold;" placeholder="Ex: G${i} ou Motor Principal">
            </div>

            <div class="form-group">
                <label>Modelo da Contatora, Soft ou Inversor</label>
                <input type="text" id="acionamento_G${i}" placeholder="Ex: INVERSOR DE FREQUÊNCIA SD750">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>RPM</label>
                    <input type="text" id="rpm_G${i}" placeholder="Ex: 1790">
                </div>
                <div class="form-group">
                    <label>Potência</label>
                    <input type="text" id="potencia_G${i}" placeholder="Ex: 450CV">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tensão FF</label>
                    <input type="text" id="tensao_G${i}" placeholder="Ex: 440V">
                </div>
                <div class="form-group">
                    <label>Corrente Elétrica</label>
                    <input type="text" id="corrente_G${i}" placeholder="Ex: 391/391A/385A">
                </div>
            </div>
        `;
        container.appendChild(divGrupo);
    }
}

// 3. BOTÃO BUSCAR (Procura por qualquer parte do Nome ou da TAG da Planta)
document.getElementById('btnBuscar').addEventListener('click', function() {
    const busca = document.getElementById('tagAtivo').value.trim().toUpperCase();
    
    if (!busca) {
        alert('Por favor, digite uma TAG ou Nome da Elevatória para buscar!');
        return;
    }

    // Busca por aproximação na TAG ou no Nome que estão na planilha
    const estacao = baseElevatorias.find(e => 
        (e.tagPlanta && e.tagPlanta.includes(busca)) || 
        (e.nomeElevatoria && e.nomeElevatoria.toUpperCase().includes(busca))
    );

    if (estacao) {
        // Atualiza a interface com as informações reais colhidas
        document.getElementById('lblUnidade').innerText = estacao.nomeElevatoria || "---";
        document.getElementById('lblPlanta').innerText = estacao.tagPlanta || "---";
        
        let localCompleto = "";
        if (estacao.localidade && estacao.municipio) {
            localCompleto = `${estacao.localidade} - ${estacao.municipio}`;
        } else {
            localCompleto = estacao.localidade || estacao.municipio || "Manutenção";
        }
        document.getElementById('lblMunicipio').innerText = localCompleto;

        // Customização de pressões se for o Booster JK (Tratando tanto pela TAG 0746 quanto pelo Nome)
        const containerPressoes = document.getElementById('containerPressoes');
        if (estacao.tagPlanta.includes('0746') || (estacao.nomeElevatoria && estacao.nomeElevatoria.toUpperCase().includes('JK'))) {
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
            containerPressoes.innerHTML = `
                <div class="form-group">
                    <label for="recalque">Recalque (mca)</label>
                    <input type="text" id="recalque" placeholder="Ex: 75">
                </div>
            `;
        }
    } else {
        // Fallback se não encontrar o registro digitado
        alert("Instalação não localizada no arquivo. Configurado para preenchimento manual.");
        document.getElementById('lblUnidade').innerText = "Elevatória Operacional";
        document.getElementById('lblPlanta').innerText = busca;
        document.getElementById('lblMunicipio').innerText = "Manutenção Preventiva";
        
        document.getElementById('containerPressoes').innerHTML = `
            <div class="form-group">
                <label for="recalque">Recalque (mca)</label>
                <input type="text" id="recalque" placeholder="Ex: 80">
            </div>
        `;
    }
});

// 4. GERAÇÃO DO TEXTO DO RELATÓRIO
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
    texto += `*LOCAL:* ${municipio}\n`;
    texto += `-----------------------------<>--------\n`;
    texto += `*CAMPO DE PREENCHIMENTO DA EQUIPE EXECUTANTE*\n\n`;
    texto += `TAG/ORDEM: ${tag}\n\n`;

    const quantidade = parseInt(document.getElementById('qtdGrupos').value);
    for (let i = 1; i <= quantidade; i++) {
        const nomeGrupo = document.getElementById(`nome_G${i}`).value.trim() || `G${i}`;
        const aci = document.getElementById(`acionamento_G${i}`).value.trim();
        const rpm = document.getElementById(`rpm_G${i}`).value.trim();
        const pot = document.getElementById(`potencia_G${i}`).value.trim();
        const ten = document.getElementById(`tensao_G${i}`).value.trim();
        const cor = document.getElementById(`corrente_G${i}`).value.trim();

        texto += `*MOTOR ${nomeGrupo.toUpperCase()}*\n`;
        texto += `*MODELO DA CONTATORA, SOFT OU INVERSOR:* ${aci || '---'}\n`;
        texto += `*RPM:* ${rpm || '---'}\n`;
        texto += `*POTÊNCIA:* ${pot || '---'}\n`;
        texto += `*TENSÃO FF:* ${ten || '---'}\n`;
        texto += `*CORRENTE ELÉTRICA:* ${cor || '---'}\n\n`;
    }

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
    
    const listaNomes = colaboradores.split(/[,/]/).map(n => n.trim()).join('\n');
    texto += `*COLABORADORES:*\n${listaNomes}\n\n`;
    
    texto += `*Na chegada:* ${chegada === 'Ligado' ? 'Ligado (x) Desligado ()' : 'Ligado () Desligado (x)'}\n`;
    texto += `*Na saída:* ${saida === 'Ligado' ? 'Ligado (x) Desligado ()' : 'Ligado () Desligado (x)'}\n`;
    texto += `*Status:* ${modo === 'Automático' ? 'Manual ()  Automático (x)' : 'Manual (x)  Automático ()'}`;

    return texto;
}

// 5. MECANISMO DE CÓPIA MOBILE
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
    if (!sucesso) window.prompt("Segure abaixo para copiar o texto:", texto);
    resolve(true);
}

// 6. EVENTOS DOS BOTÕES
document.getElementById('btnCopiarText').addEventListener('click', function() {
    if(!document.getElementById('servicoExecutado').value || !document.getElementById('colaboradores').value) {
        alert('Preencha os campos obrigatórios (Serviço Executado e Colaboradores)!');
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
