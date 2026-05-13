// CONFIGURAÇÃO: Cole aqui o link que você gerou no Google Sheets (Publicar na Web como CSV)
const LINK_PLANILHA_ONLINE = 'https://drive.google.com/file/d/1CfDkSGb14oljnBBDIdzEQ1vxK80Ht1am/pub?output=csv';

let baseDadosAtributos = [];
let respostasColetadas = JSON.parse(localStorage.getItem('respostasAtivos')) || [];

// 1. Carregar os dados ao abrir a página
window.onload = async function() {
    try {
        const response = await fetch(LINK_PLANILHA_ONLINE);
        const data = await response.text();
        processarCSV(data);
        atualizarContador();
    } catch (error) {
        console.error("Erro ao carregar a base online:", error);
        // Tenta carregar local se o online falhar (fallback)
        fetch('Atributos 13.05.csv')
            .then(res => res.text())
            .then(data => processarCSV(data))
            .catch(err => alert("Erro ao carregar base de dados."));
    }
};

function processarCSV(csvText) {
    baseDadosAtributos = []; // Limpa antes de preencher
    const linhas = csvText.split('\n');
    
    for (let i = 1; i < linhas.length; i++) {
        const colunas = linhas[i].split(';');
        if (colunas.length > 1) {
            baseDadosAtributos.push({
                un: colunas[0],
                municipio: colunas[1],
                tagPlanta: colunas[2],
                descPlanta: colunas[3],
                tagComp: colunas[4]?.trim(),
                descComp: colunas[5],
                atributo: colunas[6],
                valorAtual: colunas[7]?.trim()
            });
        }
    }
    console.log("Base de dados carregada:", baseDadosAtributos.length, "linhas.");
}

// 2. Verificar a Tag digitada
document.getElementById('btnVerificar').addEventListener('click', function() {
    const tagBusca = document.getElementById('tag_comp').value.trim();
    if (!tagBusca) return alert("Digite uma TAG primeiro.");

    const resultados = baseDadosAtributos.filter(item => item.tagComp === tagBusca);

    if (resultados.length > 0) {
        // Mostra info básica
        document.getElementById('infoAtivo').style.display = 'block';
        document.getElementById('display_un').innerText = resultados[0].un;
        document.getElementById('display_mun').innerText = resultados[0].municipio;
        document.getElementById('display_desc').innerText = resultados[0].descComp;

        // Gera campos para os atributos
        const containerCampos = document.getElementById('camposDinamicos');
        containerCampos.innerHTML = ''; 
        
        resultados.forEach(res => {
            const div = document.createElement('div');
            div.className = 'form-group';
            div.innerHTML = `
                <label>${res.atributo}</label>
                <input type="text" class="input-atributo" data-atributo="${res.atributo}" 
                       placeholder="Valor atual: ${res.valorAtual || 'Vazio'}" value="${res.valorAtual || ''}">
            `;
            containerCampos.appendChild(div);
        });

        document.getElementById('blocoAtributos').style.display = 'block';
        document.getElementById('btnSalvar').style.display = 'block';
    } else {
        alert("Tag não encontrada na base de dados.");
    }
});

// 3. Salvar os dados coletados
document.getElementById('dataEntryForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const tag = document.getElementById('tag_comp').value;
    const campos = document.querySelectorAll('.input-atributo');
    
    campos.forEach(campo => {
        respostasColetadas.push({
            tag: tag,
            atributo: campo.getAttribute('data-atributo'),
            valorNovo: campo.value,
            dataHora: new Date().toLocaleString('pt-BR')
        });
    });

    localStorage.setItem('respostasAtivos', JSON.stringify(respostasColetadas));
    atualizarContador();
    alert('Dados salvos com sucesso!');
    
    // Resetar campos
    document.getElementById('blocoAtributos').style.display = 'none';
    document.getElementById('infoAtivo').style.display = 'none';
    document.getElementById('dataEntryForm').reset();
});

// 4. Exportar CSV
document.getElementById('btnExport').addEventListener('click', function() {
    if (respostasColetadas.length === 0) return alert("Sem dados para exportar.");

    let csv = "\uFEFFTag;Atributo;Valor Coletado;Data Hora\n";
    respostasColetadas.forEach(r => {
        csv += `${r.tag};${r.atributo};${r.valorNovo};${r.dataHora}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `coleta_campo_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`);
    link.click();
});

function atualizarContador() {
    const contadorElemento = document.getElementById('contador');
    if (contadorElemento) {
        contadorElemento.innerText = respostasColetadas.length;
    }
}