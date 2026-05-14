// 1. CONFIGURAÇÕES INICIAIS
const LINK_PLANILHA_ONLINE = 'Atributos 13.05.csv'; 
const URL_PONTE_GOOGLE = 'https://script.google.com/macros/s/AKfycbx92T_406GeyO8spuKcnfFcWtCetELewf6DIPldz8OArNoQqbn6kj2oXdLG2wwWylfbEQ/exec'; 

let baseDadosAtributos = [];
let respostasColetadas = JSON.parse(localStorage.getItem('respostasAtivos')) || [];
let tagValidadaGlobal = ""; // Variável absoluta para armazenar a tag encontrada

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
                un: colunas[0],
                mun: colunas[1],
                tag: colunas[4], // Tag Comp
                desc: colunas[5],
                atrib: colunas[6],
                valor: colunas[7]
            });
        }
    }
}

// 3. VERIFICAÇÃO DE TAG
document.getElementById('btnVerificar').addEventListener('click', function() {
    const campoInput = document.getElementById('tag_comp');
    const inputTag = campoInput.value.trim().toUpperCase();
    
    if (!inputTag) {
        alert("Por favor, digite uma TAG.");
        return;
    }

    const resultados = baseDadosAtributos.filter(item => {
        return item.tag && item.tag.toUpperCase() === inputTag;
    });

    if (resultados.length > 0) {
        // --- AQUI ESTÁ A CHAVE DA SOLUÇÃO ---
        tagValidadaGlobal = resultados[0].tag; // Salva a tag oficial da planilha
        campoInput.value = tagValidadaGlobal;   // Força o texto do campo a ser a tag oficial
        campoInput.readOnly = true;            // Bloqueia o campo para não permitirem edição manual
        campoInput.style.backgroundColor = "#e2e8f0"; // Cor de campo desabilitado
        
        document.getElementById('infoAtivo').style.display = 'block';
        document.getElementById('display_un').innerText = resultados[0].un || "---";
        document.getElementById('display_mun').innerText = resultados[0].mun || "---";
        document.getElementById('display_desc').innerText = resultados[0].desc || "---";

        const campos = document.getElementById('camposDinamicos');
        campos.innerHTML = ''; 
        
        resultados.forEach(res => {
            if(res.atrib) {
                campos.innerHTML += `
                    <div class="form-group">
                        <label>${res.atrib}</label>
                        <input type="text" class="input-atributo" data-atributo="${res.atrib}" 
                               placeholder="Valor: ${res.valor || ''}" value="${res.valor || ''}">
                    </div>`;
            }
        });
        
        document.getElementById('blocoAtributos').style.display = 'block';
        document.getElementById('btnSalvar').style.display = 'block';
    } else {
        alert("Tag não encontrada.");
    }
});

// 4. SALVAMENTO E ENVIO
document.getElementById('dataEntryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Garantia extra: Se por algum motivo a tag global estiver vazia, não prossegue
    if (!tagValidadaGlobal) {
        alert("Erro: Valide a TAG antes de salvar.");
        return;
    }

    const campos = document.querySelectorAll('.input-atributo');
    const dadosParaEnviar = [];
    
    campos.forEach(campo => {
        dadosParaEnviar.push({
            tag: tagValidadaGlobal, // <--- USA SEMPRE A TAG QUE FOI VALIDADA
            atributo: campo.getAttribute('data-atributo'),
            valorNovo: campo.value,
            dataHora: new Date().toLocaleString('pt-BR')
        });
    });

    // Salva no histórico local
    respostasColetadas.push(...dadosParaEnviar);
    localStorage.setItem('respostasAtivos', JSON.stringify(respostasColetadas));

    fetch(URL_PONTE_GOOGLE, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(dadosParaEnviar)
    })
    .then(() => {
        alert('Dados salvos com sucesso!');
        location.reload(); // Recarrega para limpar os campos e o readOnly
    })
    .catch(err => {
        alert('Salvo apenas localmente (sem sinal).');
        location.reload();
    });
});

// 5. EXPORTAÇÃO E CONTADOR
document.getElementById('btnExport').addEventListener('click', function() {
    if (respostasColetadas.length === 0) return alert("Sem dados.");
    let csv = "\uFEFFTag;Atributo;Valor Coletado;Data Hora\n";
    respostasColetadas.forEach(r => {
        csv += `${r.tag};${r.atributo};${r.valorNovo};${r.dataHora}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `coleta_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
});

function atualizarContador() {
    const c = document.getElementById('contador');
    if (c) c.innerText = respostasColetadas.length;
}
