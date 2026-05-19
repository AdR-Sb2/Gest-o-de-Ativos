const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwwDqsszhjjQDQyeE1PF87gwpFWS0LvBM51bzcopAcXTejQkVANkDi6Izz3-G96ebJhFw/exec";

document.getElementById('formIA').addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = document.getElementById('btnEnviar');
    const status = document.getElementById('status');
    const textoBruto = document.getElementById('txt_raw').value;

    btn.disabled = true;
    btn.innerText = "A IA está processando...";
    status.style.display = "block";
    status.style.color = "#eab308";
    status.innerText = "🤖 Lendo relatório e organizando colunas...";

   fetch(WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
        "Content-Type": "application/x-www-form-urlencoded"
    },
    body: JSON.stringify({ texto: textoBruto })
})
    .then(() => {
        status.style.color = "#10b981";
        status.innerText = "✅ Sucesso! Linha adicionada perfeitamente por IA.";
        document.getElementById('formIA').reset();
        setTimeout(() => { status.style.display = "none"; }, 4000);
    })
    .catch(err => {
        status.style.color = "#ef4444";
        status.innerText = "❌ Erro ao enviar para a IA.";
        console.error(err);
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerText = "Processar e Enviar com IA";
    });
});