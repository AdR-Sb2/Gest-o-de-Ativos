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
        
        // Divide as colunas e limpa as aspas do CSV de forma rigorosa
        const colunas = linhas[i].split(separador).map(celula => {
            return celula.replace(/^"|"$/g, '').replace(/"/g, '').trim();
        });
        
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

// Função para exibir ou ocultar o bloco de O.S. no HTML baseado na escolha do Tipo de Serviço
function toggleOS(mostrar) {
    const blocoOS = document.getElementById('blocoOS');
    if (blocoOS) {
        blocoOS.style.display = mostrar ? 'block' : 'none';
        if (!mostrar) {
            const inputOS = document.getElementById('numeroOS');
            if (inputOS) inputOS.value = ''; // Limpa o campo caso retorne para Preventiva
        }
    }
}

// 2. MONITOR DINÂMICO DE QUANTIDADE DE GRUPOS (Incluindo o parâmetro Corrente em Shutoff)
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
                    <label>Corrente Elétrica (Operação)</label>
                    <input type="text" id="corrente_G${i}" placeholder="Ex: 391A">
                </div>
            </div>
            <div class="form-group" style="margin-top: 10px;">
                <label style="color: #b45309; font-weight: bold;">Corrente Elétrica em Shutoff</label>
                <input type="text" id="correnteShutoff_G${i}" placeholder="Ex: 180A (Válvula Fechada)">
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

    // Busca por aproximação na TAG ou no Nome limpando espaços extras
    const estacao = baseElevatorias.find(e => {
        const tagLimpa = e.tagPlanta ? e.tagPlanta.trim().toUpperCase() : '';
        const nomeLimpo = e.nomeElevatoria ? e.nomeElevatoria.trim().toUpperCase() : '';
        return tagLimpa.includes(busca) || nomeLimpo.includes(busca);
    });

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

        // Customização de pressões se for o Booster JK (Tr
