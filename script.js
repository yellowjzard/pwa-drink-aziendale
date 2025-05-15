let dipendenti = JSON.parse(localStorage.getItem("dipendenti")) || [
  { nome: "Mario", cognome: "Rossi", id: "mario.rossi", haUsufruito: false },
  { nome: "Luca", cognome: "Bianchi", id: "luca.bianchi", haUsufruito: false }
];

let utentiVerificati = [];

const passwordBar = "barSuper123";
const passwordAdmin = "adminUltra456";

function salvaDipendenti() {
  localStorage.setItem("dipendenti", JSON.stringify(dipendenti));
}

function showDipendente() {
  document.getElementById("contenuto").innerHTML = `
    <h2>Accesso Dipendente</h2>
    <input type="text" id="nome" placeholder="Nome"><br><br>
    <input type="text" id="cognome" placeholder="Cognome"><br><br>
    <button onclick="accediDipendente()">Mostra Card</button>
    <div id="qrcode"></div>
    <input type="file" id="fotoInput" style="display:none" accept="image/*" onchange="salvaFotoProfilo(event)">
  `;
}

function accediDipendente() {
  const nome = document.getElementById("nome").value.trim();
  const cognome = document.getElementById("cognome").value.trim();
  const trovato = dipendenti.find(d =>
    d.nome.toLowerCase() === nome.toLowerCase() &&
    d.cognome.toLowerCase() === cognome.toLowerCase()
  );

  const qrDiv = document.getElementById("qrcode");
  qrDiv.innerHTML = "";

  if (trovato) {
    const id = trovato.id;

    const fotoProfilo = localStorage.getItem("fotoProfilo") || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0Q3JlYXRpb24gVGltZQAwNC8yMy8yNGAKuCgAAAAYSURBVHic7cEBAQAAAMKg909tDjegAAAAAAAAAADwN5gAAeKMVyQAAAAASUVORK5CYII=";

    qrDiv.innerHTML = `
      <div class="card">
        <img src="${fotoProfilo}" alt="Foto Profilo" class="card-img">
        <div class="card-info">
          <h3>${trovato.nome} ${trovato.cognome}</h3>
          <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(id)}&size=150x150" alt="QR Code" class="qr-img">
          <br><br>
          <button onclick="document.getElementById('fotoInput').click()">Carica/Modifica Foto</button>
        </div>
      </div>
    `;
  } else {
    qrDiv.innerHTML = "<p style='color:red'>Dipendente non trovato.</p>";
  }
}

function salvaFotoProfilo(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      localStorage.setItem("fotoProfilo", e.target.result);
      accediDipendente();
    };
    reader.readAsDataURL(file);
  }
}

function showBar() {
  const password = prompt("Inserisci la password per il BAR:");
  if (password === passwordBar) {
    document.getElementById("contenuto").innerHTML = `
      <h2>Scanner QR Code</h2>
      <div id="reader" style="width: 300px; margin: auto;"></div>
      <div id="result" style="margin-top: 20px;"></div>
    `;

    const html5QrCode = new Html5Qrcode("reader");

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      qrCodeMessage => {
        const dipendente = dipendenti.find(d => d.id === qrCodeMessage);
        if (dipendente) {
          if (utentiVerificati.includes(dipendente.id)) {
            document.getElementById("result").innerHTML = `<p style="color:red">${dipendente.nome} ${dipendente.cognome} ha già ricevuto il drink.</p>`;
          } else {
            utentiVerificati.push(dipendente.id);
            dipendente.haUsufruito = true;
            salvaDipendenti();
            document.getElementById("result").innerHTML = `<p style="color:green">${dipendente.nome} ${dipendente.cognome} ha ricevuto il drink!</p>`;
          }
        } else {
          document.getElementById("result").innerHTML = `<p style="color:red">QR Code non valido.</p>`;
        }
      },
      () => {}
    ).catch(err => {
      document.getElementById("result").innerText = "Errore nell'apertura della fotocamera.";
    });
  } else {
    alert("Password errata.");
  }
}

function showAdmin() {
  const password = prompt("Inserisci la password per l'Amministrazione:");
  if (password === passwordAdmin) {
    document.getElementById("contenuto").innerHTML = `
      <h2>Area Amministrazione</h2>
      <h3>Aggiungi Dipendente</h3>
      <input type="text" id="adminNome" placeholder="Nome"><br>
      <input type="text" id="adminCognome" placeholder="Cognome"><br>
      <button onclick="aggiungiDipendente()">Aggiungi</button>

      <h3>Carica Dipendenti da Excel</h3>
      <input type="file" id="excelFile" accept=".xlsx" onchange="caricaDipendentiDaExcel(event)">

      <h3>Lista Dipendenti</h3>
<div class="lista-scroll">
  <ul id="listaDipendenti"></ul>
</div>
<button onclick="resetMese()">Reset Mese</button>
    `;
    aggiornaListaDipendenti();
  } else {
    alert("Password errata.");
  }
}

function aggiungiDipendente() {
  const nome = document.getElementById("adminNome").value.trim();
  const cognome = document.getElementById("adminCognome").value.trim();
  if (nome && cognome) {
    const id = `${nome.toLowerCase()}.${cognome.toLowerCase()}`;
    dipendenti.push({ nome, cognome, id, haUsufruito: false });
    salvaDipendenti();
    aggiornaListaDipendenti();
    document.getElementById("adminNome").value = '';
    document.getElementById("adminCognome").value = '';
  } else {
    alert("Compila tutti i campi!");
  }
}

function caricaDipendentiDaExcel(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      json.forEach(d => {
        if (d.Nome && d.Cognome) {
          const id = `${d.Nome.toLowerCase()}.${d.Cognome.toLowerCase()}`;
          dipendenti.push({ nome: d.Nome, cognome: d.Cognome, id, haUsufruito: false });
        }
      });
      salvaDipendenti();
      aggiornaListaDipendenti();
    };
    reader.readAsBinaryString(file);
  }
}

function eliminaDipendente(id) {
  dipendenti = dipendenti.filter(d => d.id !== id);
  salvaDipendenti();
  aggiornaListaDipendenti();
}

function aggiornaListaDipendenti() {
  const lista = document.getElementById("listaDipendenti");
  lista.innerHTML = "";
  dipendenti.forEach(d => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${d.nome} ${d.cognome} 
      <button onclick="eliminaDipendente('${d.id}')">Elimina</button>
    `;
    lista.appendChild(li);
  });
}

function resetMese() {
  dipendenti.forEach(d => d.haUsufruito = false);
  utentiVerificati = [];
  salvaDipendenti();
  alert("Reset effettuato con successo!");
}