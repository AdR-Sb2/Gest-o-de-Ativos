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

// 5. FUNÇÃO PARA INJETAR CAMPO DE FOTO E PREVIEW (100% via JS)
function adicionarInterfaceAnexo() {
    if (document.getElementById('anexo')) return;

    const camposContainer = document.getElementById('camposDinamicos');
    const divAnexo = document.createElement('div');
    divAnexo.className = 'form-group';
    divAnexo.style.cssText = 'margin-top: 20px; padding: 15px; border: 2px dashed #cbd5e1; border-radius: 12px; backgroundColor: #f8fafc;';

    divAnexo.innerHTML = `
        <label style="font-weight: bold; color: #1e293b;">📸 Foto de Evidência (Opcional)</label>
        <input type="file" id="anexo" accept="image/*" capture="environment" 
               style="margin-top: 10px; width: 100%; cursor: pointer;">
        
        <div id="areaPreview" style="display: none; margin-top: 15px; text-align: center;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 5px;">Pré-visualização da captura:</p>
            <img id="fotoPreview" src="" style="max-width: 100%; border-radius: 8px; border: 1px solid #ddd;">
        </div>
        
        <p style="font-size: 0.75rem; color: #64748b; margin-top: 5px;">Tire uma foto da placa ou do equipamento.</p>
    `;
    
    camposContainer.appendChild(divAnexo);

    // Lógica para mostrar o preview assim que o usuário selecionar o arquivo
    document.getElementById('anexo').addEventListener('change', async function() {
        const file = this.files[0];
        if (file) {
            try {
                const fotoBase64 = await lerArquivo(file);
                const imgPreview = document.getElementById('fotoPreview');
                const divPreview = document.getElementById('areaPreview');
                
                imgPreview.src = fotoBase64;
                divPreview.style.display = 'block';
            } catch (err) {
                console.error("Erro ao gerar preview", err);
            }
        }
    });
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

// 7. ENVIO DE DADOS (Incluso Foto e Verificação)
document.getElementById('dataEntryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 1. Verificações de segurança
    if (!tagValidadaGlobal) {
        alert("Valide a TAG primeiro clicando no botão 'Verificar Tag'.");
        return;
    }

    const equipe = document.getElementById('equipe').value;
    if (!equipe) {
        alert("Por favor, selecione uma equipe.");
        return;
    }

    // 2. Captura da foto (se existir)
    const fileInput = document.getElementById('anexo');
    let fotoBase64 = "";

    // Pegamos o preview da imagem caso ela já tenha sido carregada pelo evento 'change'
    const imgPreview = document.getElementById('fotoPreview');
    if (imgPreview && imgPreview.src.includes("base64")) {
        fotoBase64 = imgPreview.src;
    }

    // 3. Montagem dos dados
    const campos = document.querySelectorAll('.input-atributo');
    const dadosParaEnviar = [];
    const dataHoraAtual = new Date().toLocaleString('pt-BR');

    campos.forEach(campo => {
        const item = {
            equipe: equipe,
            tag: tagValidadaGlobal,
            atributo: campo.getAttribute('data-atributo'),
            valorNovo: campo.value,
            evidencia: fotoBase64, // Aqui vai o link que o Google Script vai converter
            dataHora: dataHoraAtual
        };
        respostasColetadas.push(item);
        dadosParaEnviar.push(item);
    });

    // 4. Salvamento Local e Envio
    localStorage.setItem('respostasAtivos', JSON.stringify(respostasColetadas));
    atualizarContador();

    // Feedback visual para o usuário saber que está enviando
    const btnSalvar = document.getElementById('btnSalvar');
    const textoOriginal = btnSalvar.innerText;
    btnSalvar.disabled = true;
    btnSalvar.innerText = "Enviando... Aguarde.";

    fetch(URL_PONTE_GOOGLE, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(dadosParaEnviar)
    })
    .then(() => {
        alert('Dados e evidência enviados com sucesso!');
        location.reload(); 
    })
    .catch(err => {
        console.error("Erro no envio:", err);
        alert('Erro ao enviar para a nuvem. Os dados foram salvos apenas no seu celular/computador por enquanto.');
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
