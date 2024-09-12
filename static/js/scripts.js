document.addEventListener("DOMContentLoaded", function () {
  const uploadForm = document.getElementById("uploadForm");
  const fileInput = document.getElementById("fileInput");
  const uploadMessage = document.getElementById("uploadMessage");
  const fileList = document.getElementById("fileList");
  const searchInput = document.getElementById("searchInput"); // Barra de pesquisa
  const fileTypeSelect = document.getElementById("fileTypeSelect"); // Dropdown para tipos de arquivo

  // Função para exibir mensagens de sucesso/erro
  function setMessage(message, isSuccess = true) {
    uploadMessage.textContent = message;
    uploadMessage.style.color = isSuccess ? "#28a745" : "#dc3545";
  }

  // Função para fazer o upload de um arquivo
  uploadForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
      setMessage("Por favor, selecione um arquivo para enviar.", false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setMessage("Enviando arquivo...");

    fetch("/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message) {
          setMessage("Upload realizado com sucesso!");
          fileInput.value = ""; // Limpa o campo de arquivo
          loadFiles(); // Atualiza a lista de arquivos
        } else {
          setMessage("Erro ao enviar o arquivo.", false);
        }
      })
      .catch((error) => {
        setMessage("Erro na conexão com o servidor.", false);
      });
  });

  // Função para carregar a lista de arquivos
  function loadFiles() {
    fileList.innerHTML = "<p>Carregando arquivos...</p>"; // Mensagem de carregamento

    fetch("/files")
      .then((response) => response.json())
      .then((files) => {
        fileList.innerHTML = ""; // Limpa a lista de arquivos
        if (files.length === 0) {
          fileList.innerHTML = "<p>Nenhum arquivo disponível.</p>";
        } else {
          // Função para exibir os arquivos filtrados
          const filteredFiles = filterFiles(
            files,
            searchInput.value,
            fileTypeSelect.value
          );

          if (filteredFiles.length === 0) {
            fileList.innerHTML =
              "<p>Nenhum arquivo corresponde aos filtros.</p>";
          } else {
            filteredFiles.forEach((file) => {
              const fileItem = document.createElement("div");
              fileItem.className = "file-item";

              const fileIcon = document.createElement("div");
              fileIcon.className = "file-icon";
              fileIcon.innerHTML = getFileIcon(file.contentType);

              const fileName = document.createElement("div");
              fileName.className = "file-name";
              fileName.textContent = file.filename;

              const downloadLink = document.createElement("button");
              downloadLink.className = file.filename;
              downloadLink.textContent = "Baixar";

              fileItem.appendChild(fileIcon);
              fileItem.appendChild(fileName);
              fileItem.appendChild(downloadLink);
              fileList.appendChild(fileItem);
            });
          }
        }
      })
      .catch((error) => {
        fileList.innerHTML =
          '<p id="errorMessage">Erro ao carregar a lista de arquivos.</p>' +
          error;
      });
  }

  // Função para filtrar arquivos pelo nome e tipo
  function filterFiles(files, searchQuery, fileType) {
    return files.filter((file) => {
      const matchesName = file.filename
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType =
        fileType === "" || file.contentType.includes(fileType);
      return matchesName && matchesType;
    });
  }

  // Função para obter o ícone do arquivo com base no tipo MIME
  function getFileIcon(contentType) {
    if (contentType.includes("pdf")) {
      return "📄"; // Ícone para PDF
    } else if (contentType.includes("image")) {
      return "🖼️"; // Ícone para imagens
    } else if (contentType.includes("word")) {
      return "📄"; // Ícone para documentos do Word
    } else if (contentType.includes("csv")) {
      return "📊"; // Ícone para arquivos CSV
    } else if (contentType.includes("excel")) {
      return "📊"; // Ícone para planilhas do Excel
    } else {
      return "📁"; // Ícone genérico para outros tipos de arquivo
    }
  }

  // Carregar arquivos ao digitar no campo de busca
  searchInput.addEventListener("input", loadFiles);

  // Carregar arquivos ao selecionar um tipo no dropdown
  fileTypeSelect.addEventListener("change", loadFiles);

  fileList.addEventListener("click", function (e) {
    if (e.target.innerText != "Baixar") return;
    // fileList: Supõe-se que seja um elemento do DOM (provavelmente uma lista de arquivos) onde os arquivos aparecem.
    // addEventListener("click", function (e)): Aqui, estamos dizendo que quando houver um clique em algum item da lista de arquivos, queremos executar a função fornecida. O objeto e (evento) contém informações sobre o que foi clicado.
    //fetch: Faz uma requisição HTTP para o servidor. Neste caso, está tentando baixar um arquivo.
    // download/${e.target.className}: Monta a URL de download com base na className do elemento que foi clicado (e.target). Ou seja, o nome da classe do elemento clicado é usado como o nome do arquivo que queremos baixar.
    // method: "GET": Estamos fazendo uma requisição GET ao servidor, que é apropriada para obter ou "baixar" recursos.
    fetch(`download/${e.target.className}`, {
      method: "GET",
    })
      .then((response) => response.blob())
      .then((data) => {
        // response.blob(): Após receber a resposta do servidor, o código converte a resposta em um blob. Um blob é um tipo de arquivo que pode ser processado como um objeto de arquivo local (imagem, texto, etc.).
        // window.URL.createObjectURL(data): Cria uma URL temporária para o blob que acabamos de receber. Isso permite que o arquivo seja acessado no navegador como se estivesse armazenado localmente.
        // document.createElement("a"): Cria dinamicamente um elemento de link <a>.
        // a.style.display = "none": O link é oculto da tela para que o usuário não o veja.
        // a.href = url: Define o link para apontar para o arquivo blob que foi baixado.
        // a.download = e.target.className: Define o nome do arquivo que será baixado. Ele usa a classe do item clicado como o nome do arquivo.
        // document.body.appendChild(a): O link oculto é adicionado ao corpo do documento HTML, mesmo que não seja visível.
        // a.click(): Simula um clique no link, iniciando o download do arquivo automaticamente.
        // window.URL.revokeObjectURL(url): Remove a URL temporária da memória do navegador para liberar espaço. Isso é importante para evitar acúmulo de URLs temporárias
        const url = window.URL.createObjectURL(data);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = e.target.className;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      });
  });

  // Carrega a lista de arquivos quando a página é carregada
  loadFiles();
});
