// Variáveis para sessão
let sessionStartTime = null; // Armazena o horário de início da sessão
let sessionTimerInterval = null; // Intervalo para atualizar o tempo de sessão

// Seletores do modal
const modal = document.getElementById("modal");
const modalCloseButton = document.getElementById("modalClose");
const modalSaveButton = document.getElementById("modalSave");
let codeEditor; // CodeMirror editor
let currentConsultaIndicator = null; // Bolinha que disparou o modal
let currentConsultaRow = null; // Linha associada ao editor

// Alternar tema claro e escuro
document.getElementById("toggleTheme").addEventListener("click", () => {
    const body = document.body;

    if (body.classList.contains("dark")) {
        body.classList.remove("dark");
        body.classList.add("light");
        document.getElementById("toggleTheme").textContent = "Switch to Dark Theme";
    } else {
        body.classList.remove("light");
        body.classList.add("dark");
        document.getElementById("toggleTheme").textContent = "Switch to Light Theme";
    }
});

// Função para buscar os workspaces da API
async function fetchWorkspaces() {
    try {
        const response = await fetch("/api/powerbi/workspaces");
        if (!response.ok) {
            throw new Error(`Failed to fetch workspaces: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Workspaces Data:", data);

        populateTable(data.value); // Popula a tabela com os dados retornados
    } catch (error) {
        console.error("Error fetching workspaces:", error);
        alert("Failed to fetch workspaces. Check console for details.");
    }
}

// Função para popular a tabela com os dados da API
function populateTable(data) {
    const tableBody = document.getElementById("groupsTable").querySelector("tbody");
    tableBody.innerHTML = ""; // Limpa os dados existentes

    data.forEach((workspace) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${workspace.id}</td><td>${workspace.name}</td>`;
        tableBody.appendChild(row);
    });
}

// Botão "Get Workspaces"
document.getElementById("fetchGroups").addEventListener("click", fetchWorkspaces);

// Botão "Get Access Token"
document.getElementById("fetchToken").addEventListener("click", async () => {
    try {
        const response = await fetch("/api/powerbi/token");
        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Access Token:", data.accessToken);
        alert("Access Token fetched successfully!");
        startSessionTimer(); // Inicia o timer da sessão
    } catch (error) {
        console.error("Error fetching token:", error);
        alert("Failed to fetch token. Check console for details.");
    }
});

// Iniciar o timer da sessão
function startSessionTimer() {
    sessionStartTime = new Date();

    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
    }

    sessionTimerInterval = setInterval(updateSessionTimer, 1000);
}

// Atualizar o tempo de sessão
function updateSessionTimer() {
    if (!sessionStartTime) return;

    const currentTime = new Date();
    const elapsedTime = new Date(currentTime - sessionStartTime);

    const hours = String(elapsedTime.getUTCHours()).padStart(2, "0");
    const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, "0");
    const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, "0");

    document.getElementById("sessionTime").textContent = `${hours}:${minutes}:${seconds}`;
}

// Alternar entre guias
document.getElementById("workspacesTab").addEventListener("click", () => {
    showPage("workspacesPage", "workspacesTab");
});

document.getElementById("monitoringTab").addEventListener("click", () => {
    showPage("monitoringPage", "monitoringTab");
});

function showPage(pageId, tabId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.add("hidden");
        page.classList.remove("active");
    });

    document.querySelectorAll("#navigation li a").forEach((tab) => {
        tab.classList.remove("active");
    });

    document.getElementById(pageId).classList.remove("hidden");
    document.getElementById(pageId).classList.add("active");
    document.getElementById(tabId).classList.add("active");
}

// Adicionar endereço na tabela de monitoramento
let addressId = 1;


// Adicionar múltiplos endereços à tabela de monitoramento
document.getElementById("addAddress").addEventListener("click", () => {
    const addressInput = document.getElementById("monitorAddress");
    const addressValues = addressInput.value.trim();

    if (addressValues === "") {
        alert("Por favor, insira um ou mais endereços válidos.");
        return;
    }

    const urls = addressValues.split(/[\s,]+/).filter((url) => url);

    urls.forEach((url) => {
        addLinkToTable(url);
    });

    addressInput.value = ""; // Limpar o campo de entrada
});


// Função para identificar o tipo com base na URL
function getTypeFromUrl(url) {
    if (url.includes("/datasets/")) {
        return "Dataset";
    } else if (url.includes("/dataflows/")) {
        return "Dataflow";
    } else {
        return "Desconhecido";
    }
}

// Inicializar CodeMirror
document.addEventListener("DOMContentLoaded", () => {
    const editorElement = document.getElementById("editor");

    codeEditor = CodeMirror.fromTextArea(editorElement, {
        lineNumbers: false,
        mode: "sql",
        theme: "dracula",
        matchBrackets: true,
        autoCloseBrackets: true,
    });

    codeEditor.setSize("100%", "300px");
});

// Abrir Modal
function openModal(indicator, row) {
    currentConsultaIndicator = indicator;
    currentConsultaRow = row;

    // Recupera a consulta existente ou inicia com vazio
    const consulta = currentConsultaRow.dataset.consulta || "";
    codeEditor.setValue(consulta); // Preenche o editor com a consulta existente

    modal.classList.remove("hidden"); // Mostra o modal
    codeEditor.refresh(); // Garante que o editor renderize corretamente
    codeEditor.focus(); // Dá foco ao editor
}

// Fechar Modal
function closeModal() {
    modal.classList.add("hidden"); // Esconde o modal

    // Limpa o editor e reseta variáveis após fechar
    setTimeout(() => {
        codeEditor.setValue(""); // Garante que o editor seja limpo
        currentConsultaIndicator = null;
        currentConsultaRow = null;
    }, 300); // Aguarda o fechamento visual do modal
}

// Salvar Dados do Editor
modalSaveButton.addEventListener("click", () => {
    const consulta = codeEditor.getValue().trim();

    if (currentConsultaIndicator && currentConsultaRow) {
        // Atualiza a cor da bolinha com base na presença da consulta
        currentConsultaIndicator.style.backgroundColor = consulta ? "green" : "gray";
        currentConsultaRow.dataset.consulta = consulta; // Salva a consulta na linha
    }

    closeModal(); // Fecha o modal e limpa o editor
});

// Fechar o modal no botão de fechar
modalCloseButton.addEventListener("click", closeModal);


document.getElementById("exportJson").addEventListener("click", () => {
    const tableBody = document.getElementById("monitorTable").querySelector("tbody");
    const rows = tableBody.querySelectorAll("tr");
    const data = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const jsonData = {
            id: cells[0]?.textContent.trim() || "",
            workspace: cells[1]?.textContent.trim() || "",
            nomeObjeto: cells[2]?.textContent.trim() || "",
            tipo: cells[3]?.textContent.trim() || "",
            link: cells[4]?.querySelector("a")?.href || "",
            consulta: row.dataset.consulta || "",
            monitorar: cells[6]?.querySelector("input[type='checkbox']")?.checked || false
        };
        data.push(jsonData);
    });

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "monitoring_data.json";
    link.click();
});

// Adicionar uma única linha na tabela
function addLinkToTable(url) {
    const type = getTypeFromUrl(url); // Identifica o Tipo
    const tableBody = document.getElementById("monitorTable").querySelector("tbody");
    const row = document.createElement("tr");

    row.innerHTML = `
        <td>${addressId++}</td>
        <td></td> <!-- Workspace vazio -->
        <td></td> <!-- Nome do Objeto vazio -->
        <td>${type}</td>
        <td><a href="${url}" target="_blank">${url}</a></td>
        <td class="consulta-column">
            <span class="consulta-indicator" style="background-color: gray;"></span>
        </td>
        <td class="retorno-column">
            <span class="retorno-indicator" style="background-color: gray;"></span>
        </td>
        <td class="tags-column">
            <input type="text" class="tags-input" placeholder="Adicione tags" />
        </td>
        <td>
            <label class="toggle-switch">
                <input type="checkbox" class="monitor-toggle" />
                <span class="slider"></span>
            </label>
        </td>
    `;

    row.dataset.consulta = ""; // Inicializa com consulta vazia
    row.dataset.retorno = ""; // Inicializa com retorno vazio
    row.dataset.tags = ""; // Inicializa com tags vazias
    tableBody.appendChild(row);

    // Adicionar evento para o indicador de consulta
    const consultaIndicator = row.querySelector(".consulta-indicator");
    consultaIndicator.addEventListener("click", () => {
        openModal(consultaIndicator, row);
    });

    // Adicionar evento para o indicador de retorno
    const retornoIndicator = row.querySelector(".retorno-indicator");
    retornoIndicator.addEventListener("click", () => {
        handleRetornoClick(retornoIndicator, row);
    });

    // Evento para o campo de tags
    const tagsInput = row.querySelector(".tags-input");
    tagsInput.addEventListener("input", () => {
        row.dataset.tags = tagsInput.value;
    });
}

// Função para abrir o modal de consulta
function openModal(indicator, row) {
    currentConsultaIndicator = indicator;
    currentConsultaRow = row;

    const consulta = currentConsultaRow.dataset.consulta || "";
    codeEditor.setValue(consulta);

    modal.classList.remove("hidden");
    codeEditor.focus();
}

// Função para lidar com clique no retorno
function handleRetornoClick(indicator, row) {
    // Exemplo: Atualiza o indicador de retorno baseado em lógica personalizada
    const retornoAtual = row.dataset.retorno || "";
    if (retornoAtual) {
        row.dataset.retorno = ""; // Limpa retorno
        indicator.style.backgroundColor = "gray"; // Reseta cor
    } else {
        row.dataset.retorno = "Retorno exemplo"; // Define um retorno
        indicator.style.backgroundColor = "green"; // Define cor verde
    }
}


document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".tags-input").forEach(input => {
        input.addEventListener("keypress", event => {
            if (event.key === "Enter") {
                const tagContainer = event.target.closest(".tags-container");
                const tagList = tagContainer.querySelector(".tags-list");
                const tagValue = event.target.value.trim();

                if (tagValue) {
                    // Cria a tag
                    const tagElement = document.createElement("div");
                    tagElement.classList.add("tag");
                    tagElement.innerHTML = `${tagValue} <span class="remove-tag">×</span>`;

                    // Adiciona evento para remover a tag
                    tagElement.querySelector(".remove-tag").addEventListener("click", () => {
                        tagList.removeChild(tagElement);
                    });

                    // Adiciona a tag à lista
                    tagList.appendChild(tagElement);

                    // Limpa o input
                    event.target.value = "";
                }
            }
        });
    });
});


document.getElementById('toggleSidebar').addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');

    sidebar.classList.toggle('closed');
    content.classList.toggle('sidebar-closed');
});
