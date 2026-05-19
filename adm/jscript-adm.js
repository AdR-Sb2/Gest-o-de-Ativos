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
    let dadosEditados = {};
    document.querySelectorAll('#inputsEdicao input').forEach(input => {
        dadosEditados[input.id.replace('edit_', '')] = input.value;
    });

    const formData = new FormData();
    formData.append('action', 'salvar');
    formData.append('dados', JSON.stringify(dadosEditados));

    const res = await fetch(WEB_APP_URL, { method: 'POST', body: formData });
    alert("Dados salvos com sucesso!");
    location.reload();
});