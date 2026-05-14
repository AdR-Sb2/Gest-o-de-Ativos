// 1. CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
const LINK_PLANILHA_ONLINE = 'Atributos 14.05.csv'; 
// ATENÇÃO: Certifique-se de que esta URL é a da "Nova Versão" que você gerou no Google
const URL_PONTE_GOOGLE = 'https://script.google.com/macros/s/AKfycbzJ-hJKfhdf7zMowwzTh4QX6VoN38OCukExhpNfgY4jJNG5QO8l4-uE_12AT53_lUhaLQ/exec'; 

let baseDadosAtributos = [];
let respostasColetadas = JSON.parse(localStorage.getItem('respostasAtivos')) || [];
let tagValidadaGlobal = ""; 

// 2. CARREGAMENTO DA PÁGINA
window.onload = async function() {
    await carregarEquipes();
    
    try {
        const response = await fetch(LINK_PLANILHA_ONLINE);
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder('windows-1252');
        const data = decoder.decode(buffer);
        processarCSV(data);
        atualizarContador();
    } catch (error) {
        console.error("Erro ao carregar base CSV:", error);
    }
};

// 3. BUSCAR LISTA DE EQUIPES (TÉCNICOS)
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
        selectEquipe.innerHTML = '<option value="">Erro ao carregar técnicos</option>';
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

// 5. INTERFACE DE FOTO E COMPRESSÃO
function adicionarInterfaceAnexo() {
    if (document.getElementById('anexo')) return;

    const camposContainer = document.getElementById('camposDinamicos');
    const divAnexo = document.createElement('div');
    divAnexo.className = 'form-group';
    divAnexo.style.cssText = 'margin-top: 20px; padding: 15px; border: 2px dashed #cbd5e1; border-radius: 12px; background-color: #f8fafc;';

    divAnexo.innerHTML = `
        <label style="font-weight: bold; color: #1e293b;">📸 Foto de Evidência (Opcional)</label>
        <input type="file" id="anexo" accept="image/*" capture="environment" style="margin-top: 10px; width: 100%;">
        <div id="areaPreview" style="display: none; margin-top: 15px; text-align: center;">
            <img id="fotoPreview" src="" style="max-width: 100%; border-radius: 8px; border: 1px solid #ddd;">
        </div>
    `;
    camposContainer.appendChild(divAnexo);

    document.getElementById('anexo').addEventListener('change', async function() {
        const file = this.files[0];
        if (file) {
            const fotoComprimida = await compressImage(file);
            document.getElementById('fotoPreview').src = fotoComprimida;
            document.getElementById('areaPreview').style.display = 'block';
        }
    });
}

function compressImage(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; 
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.5)); 
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 6. VERIFICAÇÃO DE TAG
document.getElementById('btnVerificar').addEventListener('click', function() {
    const campoInput = document.getElementById('tag_comp');
    const inputTag = campoInput.value.trim().toUpperCase();
    const equipe = document.getElementById('equipe').value;

    if (!equipe) return alert("Selecione sua EQUIPE primeiro.");
    if (!inputTag) return alert("Digite uma TAG.");

    const resultados = baseDadosAtributos.filter(item => item.tag && item.tag.toUpperCase() === inputTag);

    if (resultados.length > 0) {
        tagValidadaGlobal = resultados[0].tag; 
        campoInput.readOnly = true; 
        campoInput.style.backgroundColor = "#f1f5f9"; 
        
        document.getElementById('infoAtivo').style.display = 'block';
        document.getElementById('display_un').innerText = resultados[0].un;
        document.getElementById('display_mun').innerText = resultados[0].mun;
        document.getElementById('display_desc').innerText = resultados[0].desc;

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

        adicionarInterfaceAnexo();
        document.getElementById('blocoAtributos').style.display = 'block';
        document.getElementById('btnSalvar').style.display = 'block';
    } else {
        alert("Tag não encontrada.");
    }
});

// 7. ENVIO DE DADOS (CRÍTICO)
document.getElementById('dataEntryForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!tagValidadaGlobal) return alert("Valide a TAG primeiro.");

    const btnSalvar = document.getElementById('btnSalvar');
    btnSalvar.disabled = true;
    btnSalvar.innerText = "Enviando... Aguarde.";

    // Captura a foto do preview (se existir)
    let fotoBase64 = "";
    const imgPreview = document.getElementById('fotoPreview');
    if (imgPreview && imgPreview.src.startsWith("data:image")) {
        fotoBase64 = imgPreview.src;
    }

    const equipe = document.getElementById('equipe').value;
    const campos = document.querySelectorAll('.input-atributo');
    const dadosParaEnviar = [];
    const dataHoraAtual = new Date().toLocaleString('pt-BR');

    campos.forEach(campo => {
        dadosParaEnviar.push({
            equipe: equipe,
            tag: tagValidadaGlobal,
            atributo: campo.getAttribute('data-atributo'),
            valorNovo: campo.value,
            evidencia: fotoBase64, // Base64 da foto vai aqui
            dataHora: dataHoraAtual
        });
    });

    // Envio para o Google Apps Script
    fetch(URL_PONTE_GOOGLE, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(dadosParaEnviar)
    })
    .then(() => {
        alert('Dados enviados com sucesso!');
        // Backup Local
        respostasColetadas.push(...dadosParaEnviar);
        localStorage.setItem('respostasAtivos', JSON.stringify(respostasColetadas));
        location.reload(); 
    })
    .catch(err => {
        console.error("Erro:", err);
        alert('Erro ao conectar. Verifique sua internet.');
        btnSalvar.disabled = false;
        btnSalvar.innerText = "Tentar novamente";
    });
});

// 8. EXPORTAÇÃO E CONTADOR
document.getElementById('btnExport').addEventListener('click', function() {
    if (respostasColetadas.length === 0) return alert("Sem dados.");
    let csv = "\uFEFFEquipe;Tag;Atributo;Valor;Data\n";
    respostasColetadas.forEach(r => {
        csv += `${r.equipe};${r.tag};${r.atributo};${r.valorNovo};${r.dataHora}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${new Date().getTime()}.csv`;
    link.click();
});

function atualizarContador() {
    const c = document.getElementById('contador');
    if (c) c.innerText = respostasColetadas.length;
}