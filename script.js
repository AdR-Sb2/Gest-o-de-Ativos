// 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
const LINK_PLANILHA_ONLINE = 'Atributos 13.05.csv'; 
const URL_PONTE_GOOGLE = 'https://script.google.com/macros/s/AKfycbzJ-hJKfhdf7zMowwzTh4QX6VoN38OCukExhpNfgY4jJNG5QO8l4-uE_12AT53_lUhaLQ/exec'; 

let baseDadosAtributos = [];
let respostasColetadas = JSON.parse(localStorage.getItem('respostasAtivos')) || [];
let tagValidadaGlobal = ""; 

// 2. CARREGAMENTO ÚNICO DA PÁGINA
window.onload = async function() {
    // Carregar Equipes primeiro
    await carregarEquipes();
    
    // Carregar Base de Tags (CSV)
    try {
        const response = await fetch(LINK_PLANILHA_ONLINE);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('windows-1252');
        const data = decoder.decode(buffer);
        processarCSV(data);
        atualizarContador();
        console.log("Base de Tags carregada com sucesso!");
    } catch (error) {
        console.error("Erro ao carregar base de atributos:", error);
        alert("Erro ao carregar a base de dados CSV.");
    }
};

// 3. FUNÇÃO PARA BUSCAR EQUIPES (Ponte Google)
async function carregarEquipes() {
    const selectEquipe = document.getElementById('equipe');
    try {
        const response = await fetch(URL_PONTE_GOOGLE + "?action=getColaboradores");
        const lista = await response.json(); 

        if (Array.isArray(lista) && lista.length > 0) {
            selectEquipe.innerHTML = '<option value="">Selecione sua equipe...</option>';
            lista.forEach(nome => {
                let opt = document.createElement('option');
                opt.value = nome;
                opt.textContent = nome;
                selectEquipe.appendChild(opt);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar equipes:", error);
        selectEquipe.innerHTML = '<option value="">Erro ao conectar com a planilha</option>';
    }
}

// 4. PROCESSAMENTO DO CSV
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

// 5. LÓGICA DE VERIFICAÇÃO DE TAG
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
        tagValidadaGlobal = resultados[0].tag; 
        campoInput.value = tagValidadaGlobal;
        campoInput.readOnly = true; 
        campoInput.style.backgroundColor = "#f1f5f9"; 
        
        document.getElementById('infoAtivo').style.display = 'block';
        document.getElementById('display_un').innerText = resultados[0].un || "---";
        document.getElementById('display_mun').innerText = resultados[0].mun || "---";
        document.getElementById('display_desc').innerText = resultados[0].desc || "---";

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

// 6. ENVIO DE DADOS (POST)
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
            tag: tagValidadaGlobal,
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
        alert('Erro ao enviar para a nuvem. Os dados foram salvos localmente.');
        location.reload();
    });
});

// 7. EXPORTAÇÃO CSV LOCAL
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

function atualizarContador() {
    const c = document.getElementById('contador');
    if (c) c.innerText = respostasColetadas.length;
}
