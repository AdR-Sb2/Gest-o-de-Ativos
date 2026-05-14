// 1. CONFIGURAÇÕES INICIAIS
const LINK_PLANILHA_ONLINE = 'Atributos 13.05.csv'; 
const URL_PONTE_GOOGLE = 'https://script.google.com/macros/s/AKfycbx92T_406GeyO8spuKcnfFcWtCetELewf6DIPldz8OArNoQqbn6kj2oXdLG2wwWylfbEQ/exec'; 

let baseDadosAtributos = [];
let respostasColetadas = JSON.parse(localStorage.getItem('respostasAtivos')) || [];
let tagValidada = ""; // Armazena a tag confirmada após a busca

// 2. CARREGAMENTO DA BASE
window.onload = async function() {
    try {
        const response = await fetch(LINK_PLANILHA_ONLINE);
        const data = await response.text();
        processarCSV(data);
        atualizarContador();
    } catch (error) {
        console.error("Erro ao carregar base local.");
    }
};

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
                tag: colunas[4],  // Coluna E (Tag Comp)
                desc: colunas[5], // Descrição/Equipamento
                atrib: colunas[6],
                valor: colunas[7]
            });
        }
    }
    console.log("Base carregada. Total: " + baseDadosAtributos.length);
}

// 3. VERIFICAÇÃO DE TAG
document.getElementById('btnVerificar').addEventListener('click', function() {
    const inputTag = document.getElementById('tag_comp').value.trim().toUpperCase();
    
    if (!inputTag) {
        alert("Por favor, digite uma TAG.");
        return;
    }

    // Busca na base carregada
    const resultados = baseDadosAtributos.filter(item => {
        return item.tag && item.tag.toUpperCase() === inputTag;
    });

    if (resultados.length > 0) {
        // Trava a TAG correta para o envio posterior
        tagValidada = resultados[0].tag; 

        // Exibe informações detalhadas do ativo
        document.getElementById('infoAtivo').style.display = 'block';
        document.getElementById('display_un').innerText = resultados[0].un || "---";
        document.getElementById('display_mun').innerText = resultados[0].mun || "---";
        document.getElementById('display_desc').innerText = resultados[0].desc || "---";

        // Gera os campos de atributos dinamicamente
        const campos = document.getElementById('camposDinamicos');
        campos.innerHTML = ''; 
        
        resultados.forEach(res => {
            if(res.atrib) {
                campos.innerHTML += `
                    <div class="form-group">
                        <label>${res.atrib}</label>
                        <input type="text" class="input-atributo" data-atributo="${res.atrib}" 
                               placeholder="Valor atual: ${res.valor || ''}" value="${res.valor || ''}">
                    </div>`;
            }
        });
        
        document.getElementById('blocoAtributos').style.display = 'block';
        document.getElementById('btnSalvar').style.display = 'block';
        
        // Feedback visual de sucesso
        console.log("Ativo selecionado: " + tagValidada);
    } else {
        tagValidada = ""; 
        document.getElementById('infoAtivo').style.display = 'none';
        document.getElementById('blocoAtributos').style.display = 'none';
        document.getElementById('btnSalvar').style.display = 'none';
        alert("Tag '" + inputTag + "' não encontrada.");
    }
});

// 4. SALVAMENTO E ENVIO
document.getElementById('dataEntryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validação extra: garante que a tag enviada é a que foi pesquisada
    if (!tagValidada) {
        alert("Erro: Você precisa verificar uma TAG válida antes de salvar.");
        return;
    }

    const campos = document.querySelectorAll('.input-atributo');
    const dadosParaEnviar = [];
    
    campos.forEach(campo => {
        const item = {
            tag: tagValidada, // Usa a tag confirmada na busca
            atributo: campo.getAttribute('data-atributo'),
            valorNovo: campo.value,
            dataHora: new Date().toLocaleString('pt-BR')
        };
        respostasColetadas.push(item);
        dadosParaEnviar.push(item);
    });

    localStorage.setItem('respostasAtivos', JSON.stringify(respostasColetadas));
    atualizarContador();

    // Envio para o Google Apps Script
    fetch(URL_PONTE_GOOGLE, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(dadosParaEnviar)
    })
    .then(() => {
        alert('Dados salvos com sucesso para a TAG: ' + tagValidada);
        location.reload();
    })
    .catch(err => {
        alert('Erro na rede. Salvo localmente no navegador.');
        location.reload();
    });
});

// 5. EXPORTAÇÃO E CONTADOR
document.getElementById('btnExport').addEventListener('click', function() {
    if (respostasColetadas.length === 0) return alert("Sem dados para exportar.");
    
    let csv = "\uFEFFTag;Atributo;Valor Coletado;Data Hora\n";
    respostasColetadas.forEach(r => {
        csv += `${r.tag};${r.atributo};${r.valorNovo};${r.dataHora}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `coleta_atributos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
});

function atualizarContador() {
    const c = document.getElementById('contador');
    if (c) c.innerText = respostasColetadas.length;
}
