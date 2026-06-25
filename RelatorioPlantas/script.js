const LINK_PLANILHA_ELEVATORIAS = 'bd_elevatoria.csv';
const LINK_PLANILHA_RELIABLE = '../bd_elevatoria.csv'; // Caminho alternativo caso esteja na raiz
let baseElevatorias = [];

// 1. CARREGAMENTO DA PLANILHA REAL
window.onload = async function() {
    let carregou = false;
    
    // Tenta carregar na pasta local
    try {
        carregou = await carregarDados(LINK_PLANILHA_ELEVATORIAS);
    } catch (e) {
        console.log("Tentando caminho alternativo na raiz...");
    }

    // Se não carregou, tenta na pasta anterior (raiz do projeto)
    if (!carregou) {
        try {
            carregou = await carregarDados(LINK_PLANILHA_RELIABLE);
        } catch (error) {
            console.error("Erro crítico ao carregar base de elevatórias:", error);
            alert("Aviso: Não foi possível ler o banco de dados. Modo manual liberado.");
        }
    }
};

async function carregarDados(caminho) {
    const response = await fetch(caminho);
    if (!response.ok) return false;
    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder('utf-8'); 
    let data = decoder.decode(buffer);
    data = data.replace(/^\uFEFF/, '').replace(/^ï»¿/, '');
    processarCSVElevatorias(data);
    console.log("Planilha carregada com sucesso a partir de: " + caminho);
    return true;
}

// Processa a estrutura do arquivo CSV
function processarCSVElevatorias(textoCSV) {
    const linhas = textoCSV.split(/\r?\n/);
    if (linhas.length < 2) return;

    const separador = linhas[0].includes(';') ? ';' : ',';
    baseElevatorias = []; 
    
    for (let i = 1; i < linhas.length; i++) {
        if (!linhas[i].trim()) continue;
        const colunas = linhas[i].split(separador).map(celula => celula.replace(/^"|"$/g, '').trim());
        if (colunas[0] || colunas[1]) { 
            baseElevatorias.push({
                nomeElevatoria: colunas[0] || '',                  
                tagPlanta: colunas[1] ? colunas[1].toUpperCase() : '', 
                localidade: colunas[4] || '',                      
                municipio: colunas[5] || ''                        
            });
        }
    }
}

// BOTÃO BUSCAR
document.getElementById('btnBuscar').addEventListener('click', function() {
    const busca = document.getElementById('tagAtivo').value.trim().toUpperCase();
    if (!busca) { alert('Digite uma TAG ou Nome para buscar!'); return; }

    const estacao = baseElevatorias.find(e => {
        return (e.tagPlanta && e.tagPlanta.toUpperCase().includes(busca)) || 
               (e.nomeElevatoria && e.nomeElevatoria.toUpperCase().includes(busca));
    });

    if (estacao) {
        document.getElementById('lblUnidade').innerText = estacao.nomeElevatoria || "---";
        document.getElementById('lblPlanta').innerText = estacao.tagPlanta || "---";
        document.getElementById('lblMunicipio').innerText = `${estacao.localidade || ''} - ${estacao.municipio || ''}`;
    } else {
        document.getElementById('lblUnidade').innerText = "Unidade Não Cadastrada";
        document.getElementById('lblPlanta').innerText = busca;
        document.getElementById('lblMunicipio').innerText = "Área de Operação";
    }
    
    // Libera a exibição do formulário na tela
    document.getElementById('restoDoFormulario').style.display = 'block';
});

function gerarTextoRelatorioPlanta() {
    const unidade = document.getElementById('lblUnidade').innerText;
    const planta = document.getElementById('lblPlanta').innerText;
    const municipio = document.getElementById('lblMunicipio').innerText;
    const civil = document.getElementById('estadoCivil').value;
    const vazamentos = document.getElementById('vazamentos').value;
    const seguranca = document.getElementById('segurancaPatrimonial').value;
    const iluminacao = document.getElementById('iluminacao').value;
    const statusGeral = document.getElementById('statusGeralPlanta').value;
    const diagnostico = document.getElementById('diagnosticoTexto').value.trim();
    const necessidades = document.getElementById('necessidades').value.trim() || 'Nenhuma pendência crítica';
    const colaborador = document.getElementById('colaboradores').value.trim();

    const dataFormatada = new Date().toLocaleDateString('pt-BR');

    let texto = `*📋 RELATÓRIO SITUACIONAL DE PLANTA/UNIDADE*\n`;
    texto += `*DATA:* ${dataFormatada}\n`;
    texto += `*STATUS DA UNIDADE:* ${statusGeral}\n`;
    texto += `---------------------------------------\n`;
    texto += `*UNIDADE:* ${unidade}\n`;
    texto += `*PLANTA/TAG:* ${planta}\n`;
    texto += `*LOCALIDADE:* ${municipio}\n`;
    texto += `---------------------------------------\n\n`;
    texto += `*ANÁLISE DE INFRAESTRUTURA:*\n`;
    texto += `• Estrutura Civil: ${civil}\n`;
    texto += `• Vazamentos/Infiltrações: ${vazamentos}\n`;
    texto += `• Segurança Patrimonial: ${seguranca}\n`;
    texto += `• Iluminação Geral: ${iluminacao}\n\n`;
    texto += `*PARECER TÉCNICO DA PLANTA:*\n${diagnostico}\n\n`;
    texto += `*PENDÊNCIAS / NECESSIDADES:* ${necessidades}\n\n`;
    texto += `*INSPETOR RESPONSÁVEL:* ${colaborador}`;

    return texto;
}

// Eventos de Copiar e Enviar via WhatsApp
document.getElementById('btnCopiarText').addEventListener('click', function() {
    if(!document.getElementById('diagnosticoTexto').value || !document.getElementById('colaboradores').value) {
        alert('Preencha os campos obrigatórios!'); return;
    }
    const textoPronto = gerarTextoRelatorioPlanta();
    const btn = document.getElementById('btnCopiarText');
    navigator.clipboard.writeText(textoPronto).then(() => {
        btn.innerText = "Copiado com Sucesso! ✓";
        btn.style.backgroundColor = "#10b981";
        setTimeout(() => { btn.innerText = "Copiar Texto do Relatório 📋"; btn.style.backgroundColor = ""; }, 2000);
    });
});

document.getElementById('plantaForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const textoCompleto = gerarTextoRelatorioPlanta();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompleto)}`, '_blank');
});