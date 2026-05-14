// 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
const LINK_PLANILHA_ONLINE = 'Atributos 13.05.csv'; 
const URL_PONTE_GOOGLE = 'hhttps://script.google.com/macros/s/AKfycbzJ-hJKfhdf7zMowwzTh4QX6VoN38OCukExhpNfgY4jJNG5QO8l4-uE_12AT53_lUhaLQ/exec'; 

let baseDadosAtributos = [];
let respostasColetadas = JSON.parse(localStorage.getItem('respostasAtivos')) || [];
let tagValidadaGlobal = ""; 

// 2. CARREGAMENTO DA BASE (Tratamento de Acentos do Excel)
// ... (mantenha suas constantes no topo)

window.onload = async function() {
    // 1. Carrega a base de atributos (CSV)
    try {
        const response = await fetch(LINK_PLANILHA_ONLINE);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('windows-1252');
        const data = decoder.decode(buffer);
        processarCSV(data);
        atualizarContador();
    } catch (error) {
        console.error("Erro ao carregar base de atributos.");
    }

    // 2. Carrega a lista de Equipes/Colaboradores
    carregarEquipes();
};

async function carregarEquipes() {
    const selectEquipe = document.getElementById('equipe');
    selectEquipe.disabled = true; // Desabilita enquanto carrega
    
    try {
        const response = await fetch(URL_PONTE_GOOGLE + "?action=getColaboradores");
        const lista = await response.json(); 

        if (lista && lista.length > 0) {
            selectEquipe.innerHTML = '<option value="">Selecione sua equipe...</option>';
            lista.forEach(nome => {
                let opt = document.createElement('option');
                opt.value = nome;
                opt.innerHTML = nome;
                selectEquipe.appendChild(opt);
            });
        } else {
            selectEquipe.innerHTML = '<option value="">Nenhuma equipe encontrada</option>';
        }
    } catch (error) {
        console.error("Erro ao buscar equipes:", error);
        selectEquipe.innerHTML = '<option value="">Erro ao carregar lista</option>';
    } finally {
        selectEquipe.disabled = false; // Reabilita após o processo
    }
}

function processarCSV(csvText) {
    baseDadosAtributos = [];
    const separador = csvText.includes(';') ? ';' : ',';
    const linhas = csvText.split(/\r?\n/).filter(l => l.trim() !== "");
    
    for (let i = 1; i < linhas.length; i++) {
        const colunas = linhas[i].split(separador).map(c => c.replace(/"/g, "").trim());
        if (colunas.length >= 5) {
            baseDadosAtributos.push({
                un: colunas[0],   // Unidade
                mun: colunas[1],  // Município
                tag: colunas[4],  // Tag Comp
                desc: colunas[5], // Descrição/Equipamento
                atrib: colunas[6], // Atributo
                valor: colunas[7]  // Valor Atual
            });
        }
    }
}

// 3. LOGICA DE VERIFICAÇÃO E EXIBIÇÃO
document.getElementById('btnVerificar').addEventListener('click', function() {
    const campoInput = document.getElementById('tag_comp');
    const inputTag = campoInput.value.trim().toUpperCase();
    const equipe = document.getElementById('equipe').value;

    if (!equipe) {
        alert("Por favor, selecione a sua EQUIPE antes de pesquisar.");
        return;
    }
    
    if (!inputTag) {
        alert("Digite uma TAG para pesquisar.");
        return;
    }

    const resultados = baseDadosAtributos.filter(item => item.tag && item.tag.toUpperCase() === inputTag);

    if (resultados.length > 0) {
        // Trava a TAG correta na memória e bloqueia o campo visual
        tagValidadaGlobal = resultados[0].tag; 
        campoInput.value = tagValidadaGlobal;
        campoInput.readOnly = true; 
        campoInput.style.backgroundColor = "#f1f5f9"; 
        
        // Exibe informações do Ativo (Unidade, Mun, Equip)
        document.getElementById('infoAtivo').style.display = 'block';
        document.getElementById('display_un').innerText = resultados[0].un || "---";
        document.getElementById('display_mun').innerText = resultados[0].mun || "---";
        document.getElementById('display_desc').innerText = resultados[0].desc || "---";

        // Gera os campos de atributos dinamicamente
        const camposContainer = document.getElementById('camposDinamicos');
        camposContainer.innerHTML = ''; 
        
        resultados.forEach(res => {
            if(res.atrib) {
                camposContainer.innerHTML += `
                    <div class="form-group">
                        <label>${res.atrib}</label>
                        <input type="text" class="input-atributo" data-atributo="${res.atrib}" 
                               placeholder="Valor atual: ${res.valor || ''}" value="${res.valor || ''}">
                    </div>`;
            }
        });
        
        document.getElementById('blocoAtributos').style.display = 'block';
        document.getElementById('btnSalvar').style.display = 'block';
    } else {
        alert("Tag '" + inputTag + "' não encontrada na base.");
    }
});

// 4. ENVIO DE DADOS
document.getElementById('dataEntryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!tagValidadaGlobal) {
        alert("Erro crítico: Nenhuma TAG validada.");
        return;
    }

    const equipe = document.getElementById('equipe').value;
    const campos = document.querySelectorAll('.input-atributo');
    const dadosParaEnviar = [];
    
    campos.forEach(campo => {
        const item = {
            equipe: equipe,
            tag: tagValidadaGlobal, // Usa a tag que foi encontrada na busca, não o input atual
            atributo: campo.getAttribute('data-atributo'),
            valorNovo: campo.value,
            dataHora: new Date().toLocaleString('pt-BR')
        };
        respostasColetadas.push(item);
        dadosParaEnviar.push(item);
    });

    localStorage.setItem('respostasAtivos', JSON.stringify(respostasColetadas));
    atualizarContador();

    fetch(URL_PONTE_GOOGLE, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(dadosParaEnviar)
    })
    .then(() => {
        alert('Dados da TAG ' + tagValidadaGlobal + ' enviados com sucesso!');
        location.reload(); 
    })
    .catch(err => {
        alert('Erro ao enviar. Os dados foram guardados no seu telemóvel/computador.');
        location.reload();
    });
});

// 5. FUNÇÕES AUXILIARES
function atualizarContador() {
    const c = document.getElementById('contador');
    if (c) c.innerText = respostasColetadas.length;
}

// Função para buscar colaboradores/equipes da aba específica
async function carregarColaboradores() {
    try {
        // Faz a chamada para a sua URL do Google Apps Script
        const response = await fetch(URL_PONTE_GOOGLE + "?action=getColaboradores");
        const colaboradores = await response.json();
        
        const selectEquipe = document.getElementById('equipe');
        selectEquipe.innerHTML = '<option value="">Selecione...</option>'; // Limpa e reseta
        
        colaboradores.forEach(nome => {
            const option = document.createElement('option');
            option.value = nome;
            option.textContent = nome;
            selectEquipe.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar colaboradores:", error);
    }
}

// Chame esta função dentro do window.onload
window.onload = async function() {
    // ... seu código anterior de carregar o CSV ...
    carregarColaboradores();
};

document.getElementById('btnExport').addEventListener('click', function() {
    if (respostasColetadas.length === 0) return alert("Não há dados para exportar.");
    
    let csv = "\uFEFFEquipe;Tag;Atributo;Valor Coletado;Data Hora\n";
    respostasColetadas.forEach(r => {
        csv += `${r.equipe};${r.tag};${r.atributo};${r.valorNovo};${r.dataHora}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `atualizacao_atributos_${new Date().getTime()}.csv`;
    link.click();
});
