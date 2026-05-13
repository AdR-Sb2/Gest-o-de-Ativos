// 1. CONFIGURAÇÕES INICIAIS
const LINK_PLANILHA_ONLINE = 'Atributos 13.05.csv'; 
const URL_PONTE_GOOGLE = 'https://script.google.com/macros/s/AKfycbx92T_406GeyO8spuKcnfFcWtCetELewf6DIPldz8OArNoQqbn6kj2oXdLG2wwWylfbEQ/exec'; 

let baseDadosAtributos = [];
let respostasColetadas = JSON.parse(localStorage.getItem('respostasAtivos')) || [];

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
    // Detecta separador e limpa caracteres invisíveis
    const separador = csvText.includes(';') ? ';' : ',';
    const linhas = csvText.split(/\r?\n/).filter(l => l.trim() !== "");
    
    for (let i = 1; i < linhas.length; i++) {
        // Remove aspas e espaços extras de cada coluna
        const colunas = linhas[i].split(separador).map(c => c.replace(/"/g, "").trim());
        
        if (colunas.length >= 5) {
            baseDadosAtributos.push({
                un: colunas[0],
                mun: colunas[1],
                tag: colunas[4], // Coluna E (Tag Comp)
                desc: colunas[5],
                atrib: colunas[6],
                valor: colunas[7]
            });
        }
    }
    console.log("Base carregada com sucesso. Total de linhas: " + baseDadosAtributos.length);
}

// 3. VERIFICAÇÃO DE TAG (COM TRATAMENTO DE ERRO)
document.getElementById('btnVerificar').addEventListener('click', function() {
    const inputTag = document.getElementById('tag_comp').value.trim().toUpperCase();
    
    if (!inputTag) {
        alert("Por favor, digite uma TAG.");
        return;
    }

    // Filtra ignorando espaços ou diferenças de maiúsculas
    const resultados = baseDadosAtributos.filter(item => {
        return item.tag && item.tag.toUpperCase() === inputTag;
    });

    if (resultados.length > 0) {
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
        alert("Tag '" + inputTag + "' não encontrada.\n\nVerifique se digitou corretamente ou se o arquivo CSV está atualizado no GitHub.");
    }
});

// 4. SALVAMENTO E ENVIO
document.getElementById('dataEntryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const tag = document.getElementById('tag_comp').value.trim();
    const campos = document.querySelectorAll('.input-atributo');
    const dadosParaEnviar = [];
    
    campos.forEach(campo => {
        const item = {
            tag: tag,
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
        alert('Dados salvos e enviados com sucesso!');
        location.reload();
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
