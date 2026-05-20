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

    const res = await fetch(WEB_APP_URL, { method: 'POST', body: formData });
    const json = JSON.parse(await res.text());

    // Esconde o form e monta a edição
    document.getElementById('formIA').style.display = "none";
    const areaEdicao = document.getElementById('areaEdicao');
    areaEdicao.style.display = "block";
    const container = document.getElementById('inputsEdicao');
    container.innerHTML = "";

    for (let key in json) {
        container.innerHTML += `<div><label>${key.toUpperCase()}</label><input type="text" id="edit_${key}" value="${json[key]}"></div>`;
    }
});

document.getElementById('btnSalvarFinal').addEventListener('click', async () => {
    const btn = document.getElementById('btnSalvarFinal');
    btn.disabled = true;
    btn.innerText = "Salvando...";

    let dadosEditados = {};
    document.querySelectorAll('#inputsEdicao input').forEach(input => {
        // Remove 'edit_' do ID para ter a chave correta (ex: elevatoria)
        dadosEditados[input.id.replace('edit_', '')] = input.value;
    });

    const formData = new FormData();
    formData.append('action', 'salvar');
    formData.append('dados', JSON.stringify(dadosEditados));

    try {
        const res = await fetch(WEB_APP_URL, { method: 'POST', body: formData });
        const respostaTexto = await res.text();

        if (respostaTexto.includes("OK")) {
            alert("✅ Dados salvos com sucesso na planilha!");
            location.reload(); // Recarrega para limpar o form
        } else {
            throw new Error(respostaTexto);
        }
    } catch (err) {
        alert("❌ Erro ao salvar: " + err.message);
        btn.disabled = false;
        btn.innerText = "Salvar na Planilha";
    }
});