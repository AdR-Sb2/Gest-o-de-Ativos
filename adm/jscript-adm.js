const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyBBC46SzBBygGykzEQdoZI993o8LsqjpuV0_8q26F_w2M9ikI0EiCanH31wmxWI5e8mQ/exec";

// --- PROCESSO DE IA ---
document.getElementById('formIA').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviar');
    const texto = document.getElementById('txt_raw').value;
    
    btn.disabled = true;
    btn.innerText = "IA Analisando...";

    try {
        const res = await fetch(WEB_APP_URL, { 
            method: 'POST',
            body: JSON.stringify({ action: 'processar', texto: texto }) 
        });
        
        const textoResposta = await res.text();
        
        if (textoResposta.startsWith("ERRO_DO_SERVIDOR")) {
            throw new Error(textoResposta);
        }

        const json = JSON.parse(textoResposta);

        document.getElementById('formIA').style.display = "none";
        document.getElementById('areaEdicao').style.display = "block";
        const container = document.getElementById('inputsEdicao');
        container.innerHTML = "";

        for (let key in json) {
            const isLongField = ['executado', 'obs', 'pendencias', 'endereco'].includes(key);
            const div = document.createElement('div');
            div.className = "input-group";
            div.innerHTML = `<label>${key.toUpperCase()}</label>`;
            
            const input = document.createElement(isLongField ? 'textarea' : 'input');
            if (isLongField) input.style.height = "80px";
            else input.type = "text";
            
            input.id = "edit_" + key;
            input.value = json[key];
            div.appendChild(input);
            container.appendChild(div);
        }
    } catch (err) {
        alert("Erro no processamento: " + err.message);
        btn.disabled = false;
        btn.innerText = "Processar com IA";
    }
});

// --- PROCESSO DE SALVAR ---
document.getElementById('btnSalvarFinal').addEventListener('click', async () => {
    const btn = document.getElementById('btnSalvarFinal');
    btn.disabled = true;
    btn.innerText = "Salvando...";

    let dados = {};
    document.querySelectorAll('#inputsEdicao input, #inputsEdicao textarea').forEach(el => {
        dados[el.id.replace('edit_', '')] = el.value;
    });

    try {
        const res = await fetch(WEB_APP_URL, { 
            method: 'POST',
            body: JSON.stringify({ action: 'salvar', dados: dados })
        });
        
        const resposta = await res.text();
        if (resposta === "OK") {
            alert("✅ Dados salvos com sucesso!");
            location.reload();
        } else {
            throw new Error(resposta);
        }
    } catch (err) {
        alert("❌ Erro ao salvar: " + err.message);
        btn.disabled = false;
        btn.innerText = "Salvar na Planilha";
    }
});