const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyBBC46SzBBygGykzEQdoZI993o8LsqjpuV0_8q26F_w2M9ikI0EiCanH31wmxWI5e8mQ/exec";

document.getElementById('formIA').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnEnviar');
    const texto = document.getElementById('txt_raw').value;
    
    btn.disabled = true;
    btn.innerText = "IA Analisando...";

    const formData = new FormData();
    formData.append('action', 'processar');
    formData.append('texto', texto);

    try {
        const res = await fetch(WEB_APP_URL, { 
            method: 'POST',
            body: JSON.stringify({ action: 'processar', texto: texto }) 
        });
        
        const textoResposta = await res.text();
        console.log("Resposta bruta do servidor:", textoResposta); // ISSO É O MAIS IMPORTANTE

        if (textoResposta.startsWith("ERRO_DO_SERVIDOR")) {
            alert("Erro no Script: " + textoResposta);
            return;
        }

        const json = JSON.parse(textoResposta);
        // ... (resto do código)

        // Esconde o form e monta a edição
        document.getElementById('formIA').style.display = "none";
        document.getElementById('areaEdicao').style.display = "block";
        const container = document.getElementById('inputsEdicao');
        container.innerHTML = "";

        // Montagem inteligente dos campos
        for (let key in json) {
            // Campos que merecem um campo de texto maior
            const isLongField = ['executado', 'obs', 'pendencias', 'endereco'].includes(key);
            
            const div = document.createElement('div');
            div.className = "input-group";
            
            const label = document.createElement('label');
            label.innerText = key.toUpperCase();
            
            let input;
            if (isLongField) {
                input = document.createElement('textarea');
                input.style.height = "80px";
            } else {
                input = document.createElement('input');
                input.type = "text";
            }
            
            input.id = "edit_" + key;
            input.value = json[key];
            
            div.appendChild(label);
            div.appendChild(input);
            container.appendChild(div);
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao processar pela IA. Tente novamente.");
        btn.disabled = false;
        btn.innerText = "Processar com IA";
    }
});