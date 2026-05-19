const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyBBC46SzBBygGykzEQdoZI993o8LsqjpuV0_8q26F_w2M9ikI0EiCanH31wmxWI5e8mQ/exec";

document.getElementById('formIA').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnEnviar');
    const status = document.getElementById('status');
    const textoBruto = document.getElementById('txt_raw').value;

    btn.disabled = true;
    btn.innerText = "A IA está processando...";
    status.style.display = "block";
    status.innerText = "🤖 Lendo relatório...";

    // Usamos o objeto FormData que o Google Apps Script adora
    const formData = new FormData();
    formData.append('texto', textoBruto);

    fetch(WEB_APP_URL, {
        method: 'POST',
        body: formData // Envia como formulário, evita problemas de CORS
    })
    .then(response => response.text()) // Agora conseguimos LER a resposta
    .then(data => {
        if (data.includes("SUCESSO")) {
            status.style.color = "#10b981";
            status.innerText = "✅ Sucesso! Dados gravados na planilha.";
            document.getElementById('formIA').reset();
        } else {
            status.style.color = "#ef4444";
            status.innerText = "❌ Erro no Script: " + data; // Mostra o erro do Google aqui!
        }
    })
    .catch(err => {
        status.style.color = "#ef4444";
        status.innerText = "❌ Erro de conexão.";
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerText = "Processar e Enviar com IA";
    });
});