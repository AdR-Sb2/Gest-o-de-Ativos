// 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
const LINK_PLANILHA_ONLINE = 'Atributos 14.05.csv'; 
const URL_PONTE_GOOGLE = 'https://script.google.com/macros/s/AKfycbzJ-hJKfhdf7zMowwzTh4QX6VoN38OCukExhpNfgY4jJNG5QO8l4-uE_12AT53_lUhaLQ/exec'; 

let baseDadosAtributos = [];
let respostasColetadas = JSON.parse(localStorage.getItem('respostasAtivos')) || [];
let tagValidadaGlobal = ""; 

// 2. CARREGAMENTO ÚNICO DA PÁGINA
window.onload = async function() {
    await carregarEquipes();
    
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
    }
};

// 3. FUNÇÃO PARA BUSCAR EQUIPES
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
                un: colunas[0],
                mun: colunas[1],
                tag: colunas[4],
                desc: colunas[5],
                atrib: colunas[6],
                valor: colunas[7]
            });
        }
    }
}

// 5. FUNÇÃO PARA INJETAR CAMPO DE FOTO (Via JS)
function adicionarInterfaceAnexo() {
    // Evita duplicar o campo se o usuário clicar em verificar várias vezes
    if (document.getElementById('anexo')) return;

    const camposContainer = document.getElementById('camposDinamicos');
    const divAnexo = document.createElement('div');
    divAnexo.className = 'form-group';
    divAnexo.style.marginTop = '20px';
    divAnexo.style.padding = '15px';
    divAnexo.style.border = '2px dashed #cbd5e1';
    divAnexo.style.borderRadius = '12px';
    divAnexo.style.backgroundColor = '#f8fafc';

    divAnexo.innerHTML = `
        <label style="font-weight: bold; color: #1e293b;">📸 Foto de Evidência (Opcional)</label>
        <input type="file" id="anexo" accept="image/*" capture="environment" 
               style="margin-top: 10px; width: 100%; cursor: pointer;">
        <p style="font-size: 0.75rem; color: #64748b; margin-top: 5px;">Tire uma foto da placa ou do equipamento.</p>
    `;
    
    camposContainer.appendChild(divAnexo);
}

// Auxiliar para converter imagem em texto
function lerArquivo(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

// 6. LÓGICA DE VERIFICAÇÃO DE TAG
document.getElementById('btnVerificar').addEventListener('click', function() {
    const campoInput = document.getElementById('tag_comp');
    const inputTag = campoInput.value.trim().toUpperCase();
    const equipe = document.getElementById('equipe').value;

    if (!equipe) return alert("Selecione sua EQUIPE primeiro.");
    if (!inputTag) return alert("Digite uma TAG.");

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

        // INJETA O CAMPO DE FOTO
        adicionarInterfaceAnexo();
        
        document.getElementById('blocoAtributos').style.display = 'block';
        document.getElementById('btnSalvar').style.display = 'block';
    } else {
        alert("Tag '" + inputTag + "' não encontrada.");
    }
});

// 7. ENVIO DE DADOS (Incluso Foto)
document.getElementById('dataEntryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!tagValidadaGlobal) return alert("Valide a TAG primeiro.");

    const equipe = document.getElementById('equipe').value;
    const campos = document.querySelectorAll('.input-atributo');
    const fileInput = document.getElementById('anexo');
    let fotoBase64 = "";

    // Se houver foto, converte para string
    if (fileInput && fileInput.files.length > 0) {
        try {
            fotoBase64 = await lerArquivo(fileInput.files[0]);
        } catch (err) {
            console.error("Erro ao processar imagem", err);
        }
    }

    const dadosParaEnviar = [];
    
    campos.forEach(campo => {
        const item = {
            equipe: equipe,
            tag: tagValidadaGlobal,
            atributo: campo.getAttribute('data-atributo'),
            valorNovo: campo.value,
            evidencia: fotoBase64, // Nova propriedade com a foto
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
        alert('Dados e evidência enviados!');
        location.reload(); 
    })
    .catch(err => {
        alert('Erro no envio. Salvo localmente.');
        location.reload();
    });
});

// 8. EXPORTAÇÃO E AUXILIARES
document.getElementById('btnExport').addEventListener('click', function() {
    if (respostasColetadas.length === 0) return alert("Sem dados.");
    let csv = "\uFEFFEquipe;Tag;Atributo;Valor Coletado;Data Hora\n";
    respostasColetadas.forEach(r => {
        csv += `${r.equipe};${r.tag};${r.atributo};${r.valorNovo};${r.dataHora}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `dados_coletados_${new Date().getTime()}.csv`;
    link.click();
});

function atualizarContador() {
    const c = document.getElementById('contador');
    if (c) c.innerText = respostasColetadas.length;
}
